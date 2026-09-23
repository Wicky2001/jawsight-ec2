import base64
from concurrent.futures import ThreadPoolExecutor

import cv2
import numpy as np
import requests

from config.settings import (
    OPENAI_API_KEY, OPENAI_IMAGE_MODEL, OPENAI_IMAGE_QUALITY, OPENAI_INPUT_FIDELITY,
    OPENAI_IMAGE_EDIT_URL, OPENAI_REQUEST_TIMEOUT,
    AI_SIDE_MASK_INWARD_RATIO, AI_SIDE_MASK_TOP_RATIO, AI_MASK_DILATE_RATIO, AI_MAX_UPLOAD_SIZE,
    AI_KEEP_ORIGINAL_OUTSIDE_MASK, AI_MATCH_COLOR, AI_COMPOSITE_FEATHER_RATIO
)
from utils.logger import logger

# OpenAI gpt-image output sizes as (width, height)
OPENAI_SIZES = [(1024, 1024), (1536, 1024), (1024, 1536)]

JAW_COMPLETION_INSTRUCTION = (
    "The red line may be incomplete or may not show the whole jaw. In that case still produce a complete, "
    "anatomically correct mandible: continue the jaw naturally so there is a smooth, continuous J-shaped "
    "jawline from the chin, along the lower border of the jaw, up to the angle of the jaw below the ear."
)

KEEP_IDENTITY_INSTRUCTION = (
    "This is a real photograph, not a 3D render or illustration. Return the SAME photograph with only the "
    "jaw outline changed. Do not re-draw, re-render, stylise or beautify the person. "
    "Do NOT retouch or smooth the skin: keep the original skin texture, pores, blemishes, acne, scars, moles, "
    "stubble and facial hair exactly as they are, including inside the edited area. "
    "Do not change the hair, eyes, eyebrows, ears, nose, teeth, braces, clothing or the green background. "
    "Do not change the colour balance, brightness, contrast, sharpness, grain, focus or camera angle, and do "
    "not upscale or clean up the photo. Every pixel outside the jaw area must stay identical to image 1. "
    "The result must look like an unedited photograph taken with the same camera, with no red lines, dots, "
    "markers, text or legend box."
)

PROMPTS = {
    "side": (
        "This is a clinical side-profile photograph used to simulate the result of orthognathic (jaw) surgery. "
        "Image 1 is the original photo. Image 2 is the same photo with a red line showing the predicted "
        "post-operative soft-tissue profile of the lower face (lips, chin, under-chin and jaw). "
        "Ignore the legend box and the red 'x' nose marker in image 2. "
        "Edit only the masked lower-face area of image 1 so the skin outline of the lower lip, chin, "
        "under-chin and jawline follows the red line exactly, moving the existing skin rather than "
        "repainting it. "
        f"{JAW_COMPLETION_INSTRUCTION} {KEEP_IDENTITY_INSTRUCTION}"
    ),
    "front": (
        "This is a clinical frontal face photograph used to simulate the result of orthognathic (jaw) surgery. "
        "Image 1 is the original photo. Image 2 is the same photo with red lines showing the predicted "
        "post-operative jawline contour and lip shape. "
        "Ignore the legend box, the red dots and the red 'x' nose marker in image 2. "
        "Edit only the masked lower-face area of image 1 so the outer jawline and chin follow the red jaw "
        "line exactly and the lips match the red lip outline, keeping the face symmetric and natural and "
        "moving the existing skin rather than repainting it. "
        f"{JAW_COMPLETION_INSTRUCTION} {KEEP_IDENTITY_INSTRUCTION}"
    ),
}


# -------------------------------------------------------------
# MASKS (255 = area the AI is allowed to edit)
# -------------------------------------------------------------
def _dilate(mask):
    h, w = mask.shape[:2]
    k = max(3, int(np.sqrt(w**2 + h**2) * AI_MASK_DILATE_RATIO))
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
    return cv2.dilate(mask, kernel)


def build_side_mask(img_shape, pre_coords, pred_coords, nose_pt, is_left):
    """Covers the area between the current and predicted profile, extended back towards the ear."""
    h, w = img_shape[:2]
    pts = np.vstack((pre_coords, pred_coords)).astype(np.float32)

    trace_len = max(1.0, pts[:, 1].max() - nose_pt[1])
    top_y = nose_pt[1] + AI_SIDE_MASK_TOP_RATIO * trace_len
    pts = pts[pts[:, 1] >= top_y]

    # Face looking left means the back of the head is towards +x
    inward = 1 if is_left else -1
    shifted = pts + np.array([inward * AI_SIDE_MASK_INWARD_RATIO * trace_len, 0], dtype=np.float32)

    mask = np.zeros((h, w), dtype=np.uint8)
    hull = cv2.convexHull(np.vstack((pts, shifted)).astype(np.int32))
    cv2.fillConvexPoly(mask, hull, 255)
    mask = _dilate(mask)
    mask[: int(top_y), :] = 0
    return mask


def build_front_mask(img_shape, pre_jaw, pred_jaw, pre_lips, pred_lips):
    """Covers the lower face: both jawlines and both lip outlines."""
    h, w = img_shape[:2]
    pts = np.vstack((pre_jaw, pred_jaw, pre_lips, pred_lips)).astype(np.int32)

    mask = np.zeros((h, w), dtype=np.uint8)
    cv2.fillConvexPoly(mask, cv2.convexHull(pts), 255)
    return _dilate(mask)


# -------------------------------------------------------------
# OPENAI IMAGE EDIT
# -------------------------------------------------------------
def _pad_to_openai_aspect(img, border_type, value=None):
    """Pads right/bottom so the image matches the closest OpenAI output aspect ratio."""
    h, w = img.shape[:2]
    target_w, target_h = min(OPENAI_SIZES, key=lambda s: abs(np.log((s[0] / s[1]) / (w / h))))
    target_ratio = target_w / target_h

    if w / h < target_ratio:
        pad_right, pad_bottom = int(round(h * target_ratio)) - w, 0
    else:
        pad_right, pad_bottom = 0, int(round(w / target_ratio)) - h

    padded = cv2.copyMakeBorder(img, 0, pad_bottom, 0, pad_right, border_type, value=value)
    return padded, f"{target_w}x{target_h}"


def _fit_upload_size(img, interpolation=cv2.INTER_AREA):
    h, w = img.shape[:2]
    if max(h, w) <= AI_MAX_UPLOAD_SIZE:
        return img
    scale = AI_MAX_UPLOAD_SIZE / float(max(h, w))
    return cv2.resize(img, (int(round(w * scale)), int(round(h * scale))), interpolation=interpolation)


def _png_bytes(img):
    success, buffer = cv2.imencode(".png", img)
    if not success:
        raise ValueError("Failed to encode image for OpenAI request")
    return buffer.tobytes()


def generate_ai_image(ai_input):
    view = ai_input["view"]
    image = ai_input["image"]
    h, w = image.shape[:2]
    logger.info("🔧 INFO: generate_ai_image started. view=%s, model=%s", view, OPENAI_IMAGE_MODEL)

    padded_image, size = _pad_to_openai_aspect(image, cv2.BORDER_REPLICATE)
    padded_overlay, _ = _pad_to_openai_aspect(ai_input["overlay"], cv2.BORDER_REPLICATE)
    padded_mask, _ = _pad_to_openai_aspect(ai_input["mask"], cv2.BORDER_CONSTANT, value=0)
    ph, pw = padded_image.shape[:2]

    upload_image = _fit_upload_size(padded_image)
    upload_overlay = _fit_upload_size(padded_overlay)
    edit_mask = cv2.resize(padded_mask, (upload_image.shape[1], upload_image.shape[0]), interpolation=cv2.INTER_NEAREST)

    # OpenAI mask: fully transparent pixels are edited, opaque pixels are kept
    mask_rgba = np.full((edit_mask.shape[0], edit_mask.shape[1], 4), 255, dtype=np.uint8)
    mask_rgba[edit_mask > 0, 3] = 0

    prompt = PROMPTS["front" if view == "front" else "side"]

    data = {
        "model": OPENAI_IMAGE_MODEL,
        "prompt": prompt,
        "size": size,
        "quality": OPENAI_IMAGE_QUALITY,
        "n": "1",
    }
    if OPENAI_INPUT_FIDELITY:
        data["input_fidelity"] = OPENAI_INPUT_FIDELITY

    files = [
        ("image[]", ("image.png", _png_bytes(upload_image), "image/png")),
        ("image[]", ("guide.png", _png_bytes(upload_overlay), "image/png")),
        ("mask", ("mask.png", _png_bytes(mask_rgba), "image/png")),
    ]

    response = requests.post(
        OPENAI_IMAGE_EDIT_URL,
        headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
        data=data,
        files=files,
        timeout=OPENAI_REQUEST_TIMEOUT,
    )
    if not response.ok:
        raise RuntimeError(f"OpenAI image edit failed for view={view} ({response.status_code}): {response.text}")

    result_bytes = base64.b64decode(response.json()["data"][0]["b64_json"])
    result_img = cv2.imdecode(np.frombuffer(result_bytes, np.uint8), cv2.IMREAD_COLOR)
    if result_img is None:
        raise RuntimeError(f"OpenAI returned an undecodable image for view={view}")

    # Back to the original image size (undo the padding)
    result_img = cv2.resize(result_img, (pw, ph), interpolation=cv2.INTER_CUBIC)[:h, :w]

    if AI_MATCH_COLOR:
        result_img = _match_color(result_img, image, ai_input["mask"])

    if AI_KEEP_ORIGINAL_OUTSIDE_MASK:
        result_img = _composite_with_original(image, result_img, ai_input["mask"])

    logger.info("✅ SUCCESS: generate_ai_image completed. view=%s", view)
    return result_img


def _match_color(ai_img, original_img, mask):
    """Removes the global tone/brightness shift the model applies, using the untouched area as reference."""
    reference = mask == 0
    if reference.sum() < 1000:
        return ai_img

    ai_lab = cv2.cvtColor(ai_img, cv2.COLOR_BGR2LAB).astype(np.float32)
    orig_lab = cv2.cvtColor(original_img, cv2.COLOR_BGR2LAB).astype(np.float32)

    for channel in range(3):
        ai_ref = ai_lab[:, :, channel][reference]
        orig_ref = orig_lab[:, :, channel][reference]
        ai_std = ai_ref.std()
        if ai_std < 1e-3:
            continue
        gain = min(max(orig_ref.std() / ai_std, 0.8), 1.25)
        ai_lab[:, :, channel] = (ai_lab[:, :, channel] - ai_ref.mean()) * gain + orig_ref.mean()

    return cv2.cvtColor(np.clip(ai_lab, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR)


def _composite_with_original(original_img, ai_img, mask):
    """Keeps the original photo everywhere outside the jaw mask, with a soft edge in between."""
    h, w = mask.shape[:2]
    k = max(3, int(np.sqrt(w**2 + h**2) * AI_COMPOSITE_FEATHER_RATIO)) | 1
    weight = cv2.GaussianBlur(mask, (k, k), 0).astype(np.float32) / 255.0
    weight = cv2.merge([weight, weight, weight])
    blended = original_img.astype(np.float32) * (1.0 - weight) + ai_img.astype(np.float32) * weight
    return np.clip(blended, 0, 255).astype(np.uint8)


def generate_ai_images(ai_inputs):
    """Runs the OpenAI edits for all views in parallel. Returns {view: image}."""
    logger.info("🔧 INFO: generate_ai_images started for %d views", len(ai_inputs))
    with ThreadPoolExecutor(max_workers=len(ai_inputs)) as executor:
        futures = {view: executor.submit(generate_ai_image, ai_input) for view, ai_input in ai_inputs.items()}
        return {view: future.result() for view, future in futures.items()}

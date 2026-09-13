import base64
from concurrent.futures import ThreadPoolExecutor

import cv2
import numpy as np
import requests

from config.settings import (
    OPENAI_API_KEY, OPENAI_IMAGE_MODEL, OPENAI_IMAGE_QUALITY, OPENAI_INPUT_FIDELITY,
    OPENAI_IMAGE_EDIT_URL, OPENAI_REQUEST_TIMEOUT,
    AI_SIDE_MASK_INWARD_RATIO, AI_SIDE_MASK_TOP_RATIO, AI_MASK_DILATE_RATIO, AI_MAX_UPLOAD_SIZE
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
    "Keep it the same person: identical identity, facial features above the mouth, skin tone and texture, "
    "facial hair, hair, ears, lighting, camera angle, clothing and green background. "
    "The result must be a clean photorealistic photograph with no red lines, dots, markers, text or legend box."
)

PROMPTS = {
    "side": (
        "This is a clinical side-profile photograph used to simulate the result of orthognathic (jaw) surgery. "
        "Image 1 is the original photo. Image 2 is the same photo with a red line showing the predicted "
        "post-operative soft-tissue profile of the lower face (lips, chin, under-chin and jaw). "
        "Ignore the legend box and the red 'x' nose marker in image 2. "
        "Edit only the masked lower-face area of image 1 so the skin outline of the lower lip, chin, "
        "under-chin and jawline follows the red line exactly. "
        f"{JAW_COMPLETION_INSTRUCTION} {KEEP_IDENTITY_INSTRUCTION}"
    ),
    "front": (
        "This is a clinical frontal face photograph used to simulate the result of orthognathic (jaw) surgery. "
        "Image 1 is the original photo. Image 2 is the same photo with red lines showing the predicted "
        "post-operative jawline contour and lip shape. "
        "Ignore the legend box, the red dots and the red 'x' nose marker in image 2. "
        "Edit only the masked lower-face area of image 1 so the outer jawline and chin follow the red jaw "
        "line exactly and the lips match the red lip outline, keeping the face symmetric and natural. "
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

    logger.info("✅ SUCCESS: generate_ai_image completed. view=%s", view)
    return result_img


def generate_ai_images(ai_inputs):
    """Runs the OpenAI edits for all views in parallel. Returns {view: image}."""
    logger.info("🔧 INFO: generate_ai_images started for %d views", len(ai_inputs))
    with ThreadPoolExecutor(max_workers=len(ai_inputs)) as executor:
        futures = {view: executor.submit(generate_ai_image, ai_input) for view, ai_input in ai_inputs.items()}
        return {view: future.result() for view, future in futures.items()}

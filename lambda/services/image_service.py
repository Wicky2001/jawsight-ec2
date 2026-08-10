import io
import os
import cv2
import torch
import numpy as np
import pandas as pd
from rembg import new_session

# Set U2NET_HOME to point to the local models folder so rembg uses the local onnx model
os.environ["U2NET_HOME"] = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))

from config.settings import (
    NUM_RESAMPLED_POINTS,
    FRONT_FACE_COLOR_PRE_OP, FRONT_FACE_COLOR_POST_OP, FRONT_FACE_COLOR_ANCHOR, 
    FRONT_FACE_COLOR_TEXT, FRONT_FACE_COLOR_LEGEND_BG,
    FRONT_FACE_RADIUS_POINT, FRONT_FACE_RADIUS_ANCHOR, FRONT_FACE_THICKNESS_LINE,
    JAW_ORDER, LIP_ORDER
)
from utils.logger import logger
from utils.helpers import preprocess_image, detect_nose_anchor, get_native_trace, resample_points
from services.s3_service import read_file_from_s3
from models.exceptions import UnsuitableImageError
from models.networks import MandibularResidualMLP, FrontFacePredictionModel

# -------------------------------------------------------------
# GLOBAL MODELS
# -------------------------------------------------------------
rembg_session = new_session("u2net_human_seg")
logger.info("✅ SUCCESS: Loading Rembg Session...")

right_model = MandibularResidualMLP()
left_model = MandibularResidualMLP()

logger.info("✅ SUCCESS: Loading side face Model...")
front_face_model = FrontFacePredictionModel()
logger.info("✅ SUCCESS: Loading front face Model...")

right_model.load_state_dict(torch.load('./models/right.pth', map_location=torch.device('cpu')))
left_model.load_state_dict(torch.load('./models/left.pth', map_location=torch.device('cpu')))
front_face_model.load_state_dict(torch.load("./models/front.pth", map_location=torch.device('cpu')))

logger.info("✅ SUCCESS: Models loaded and ready for inference.")
right_model.eval()
left_model.eval()
front_face_model.eval()

# -------------------------------------------------------------
# LOGIC
# -------------------------------------------------------------
def process_single_image_left_or_right(bucket_key, side):
    """
    Runs the exact logic used in training for a single production image.
    """
    logger.info("✅ SUCCESS: process_single_image_left_or_right started. side=%s, key=%s", side, bucket_key)
    
    if side == "left":
        is_left = True
        model = left_model
    else:
        is_left = False
        model = right_model
        
    image_bytes = read_file_from_s3(bucket_key)
    if not image_bytes:
        raise UnsuitableImageError("Failed to retrieve image from S3.")
                
    nparr = np.frombuffer(image_bytes, np.uint8)

    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise UnsuitableImageError("Failed to decode image. The file might be corrupted.")
        
    img_bgr = preprocess_image(img_bgr) 
    h, w = img_bgr.shape[:2]
    
    nose_pt, cnt = detect_nose_anchor(img_bgr, is_left, rembg_session)
    if not nose_pt:
        raise UnsuitableImageError("Could not detect nose/silhouette.")

    raw_trace = get_native_trace(cnt, nose_pt, w, h)
    
    scale_master = np.sqrt(w**2 + h**2)
    norm_trace = (raw_trace - np.array(nose_pt)) / scale_master
    
    resampled_50 = resample_points(norm_trace, NUM_RESAMPLED_POINTS)
    
    input_tensor = torch.tensor(resampled_50.flatten(), dtype=torch.float32).unsqueeze(0)
    with torch.no_grad():
        logger.info("✅ SUCCESS: Side face model inference started for side=%s", side)
        predicted_norm = model(input_tensor).squeeze(0).numpy()
    
    predicted_points = predicted_norm.reshape(50, 2)
    
    pred_pixel_coords = (predicted_points * scale_master) + np.array(nose_pt)
    pre_pixel_coords = (resampled_50 * scale_master) + np.array(nose_pt)
    
    output_img = img_bgr.copy()
    
    # cv2.polylines(output_img, [pre_pixel_coords.astype(np.int32)], isClosed=False, color=FRONT_FACE_COLOR_PRE_OP, thickness=FRONT_FACE_THICKNESS_LINE)
    cv2.polylines(output_img, [pred_pixel_coords.astype(np.int32)], isClosed=False, color=FRONT_FACE_COLOR_POST_OP, thickness=FRONT_FACE_THICKNESS_LINE)
    cv2.drawMarker(output_img, nose_pt, FRONT_FACE_COLOR_ANCHOR, markerType=cv2.MARKER_TILTED_CROSS, markerSize=FRONT_FACE_RADIUS_ANCHOR, thickness=FRONT_FACE_THICKNESS_LINE)
    
    scale_mult = max(1.0, w / 1000.0) 
    font = cv2.FONT_HERSHEY_SIMPLEX
    f_scale = 0.7 * scale_mult
    f_thick = int(2 * scale_mult)
    
    box_w = int(300 * scale_mult)
    box_h = int(160 * scale_mult)
    margin = int(30 * scale_mult)
    
    x_start = w - box_w - margin if is_left else margin
    y_start = margin
    
    overlay = output_img.copy()
    cv2.rectangle(overlay, (x_start, y_start), (x_start + box_w, y_start + box_h), FRONT_FACE_COLOR_LEGEND_BG, -1)
    cv2.addWeighted(overlay, 0.5, output_img, 0.5, 0, output_img) 
    
    text_x = x_start + int(60 * scale_mult)
    # row1_y = y_start + int(45 * scale_mult)
    row2_y = y_start + int(95 * scale_mult)
    row3_y = y_start + int(140 * scale_mult)
    
    # line_y1 = row1_y - int(5 * scale_mult)
    # cv2.line(output_img, (x_start + int(15 * scale_mult), line_y1), (x_start + int(45 * scale_mult), line_y1), FRONT_FACE_COLOR_PRE_OP, FRONT_FACE_THICKNESS_LINE)
    # cv2.putText(output_img, "Pre-Surgery", (text_x, row1_y), font, f_scale, FRONT_FACE_COLOR_TEXT, f_thick)
    
    line_y2 = row2_y - int(5 * scale_mult)
    cv2.line(output_img, (x_start + int(15 * scale_mult), line_y2), (x_start + int(45 * scale_mult), line_y2), FRONT_FACE_COLOR_POST_OP, FRONT_FACE_THICKNESS_LINE)
    cv2.putText(output_img, "Prediction contour(Post Op)", (text_x, row2_y), font, f_scale, FRONT_FACE_COLOR_TEXT, f_thick)
    
    cv2.drawMarker(output_img, (x_start + int(30 * scale_mult), row3_y - int(5 * scale_mult)), FRONT_FACE_COLOR_ANCHOR, markerType=cv2.MARKER_TILTED_CROSS, markerSize=FRONT_FACE_RADIUS_ANCHOR, thickness=FRONT_FACE_THICKNESS_LINE)
    cv2.putText(output_img, "Nose Anchor", (text_x, row3_y), font, f_scale, FRONT_FACE_COLOR_TEXT, f_thick)

    logger.info("✅ SUCCESS: process_single_image_left_or_right completed. side=%s", side)
    return side, output_img


def process_front_face(image_key, csv_key):
    logger.info("✅ SUCCESS: process_front_face started. image_key=%s, csv_key=%s", image_key, csv_key)
    
    csv_bytes = read_file_from_s3(csv_key)
    if not csv_bytes:
        raise ValueError(f"ERROR MESSAGE: No csv data found")
    csv_string = csv_bytes.decode('utf-8')
    
    image_bytes = read_file_from_s3(image_key)
    if not image_bytes:
        raise ValueError(f"ERROR MESSAGE: No image data found")
        
    nparr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise UnsuitableImageError("ERROR MESSAGE: Failed to decode image.")

    logger.info("✅ SUCCESS: Successfully loaded image and CSV from S3. Starting preprocessing...")
    img_bgr = preprocess_image(img_bgr) 
        
    h, w = img_bgr.shape[:2]
    
    df = pd.read_csv(io.StringIO(csv_string))
    
    img_w_csv = df["Image_W"].iloc[0]
    img_h_csv = df["Image_H"].iloc[0]
    scale_x = w / img_w_csv
    scale_y = h / img_h_csv
    
    nose_x_px = df["Nose_X_Px"].iloc[0] * scale_x
    nose_y_px = df["Nose_Y_Px"].iloc[0] * scale_y
    nose_pt = (int(nose_x_px), int(nose_y_px))
    
    scale_master = np.sqrt(w**2 + h**2)
    
    df_filtered = df[df["Landmark_MP_ID"] != 1].copy()
    df_filtered = df_filtered.sort_values(by="Landmark_MP_ID")
    
    fin_coords = df_filtered[["Normalized_X", "Normalized_Y"]].values.astype(np.float32)
    
    if len(fin_coords) != 35:
        raise ValueError(f"Expected 35 landmarks after filtering nose, but got {len(fin_coords)}")
    
    input_tensor = torch.tensor(fin_coords.flatten()).unsqueeze(0)
    pre_pixel_coords = df_filtered[["Refined_X_Px", "Refined_Y_Px"]].values * np.array([scale_x, scale_y])

    with torch.no_grad():
        logger.info("✅ SUCCESS: Running front face prediction model...")
        predicted_norm = front_face_model(input_tensor).squeeze(0).numpy()
    
    predicted_points_norm = predicted_norm.reshape(35, 2)
    pred_pixel_coords = (predicted_points_norm * scale_master) + np.array(nose_pt)
    
    output_img = img_bgr.copy()
    
    mp_ids = df_filtered["Landmark_MP_ID"].values
    
    pre_dict = {int(mp_id): pt for mp_id, pt in zip(mp_ids, pre_pixel_coords)}
    pred_dict = {int(mp_id): pt for mp_id, pt in zip(mp_ids, pred_pixel_coords)}

    pre_jaw  = np.array([pre_dict[i] for i in JAW_ORDER], dtype=np.int32)
    pred_jaw = np.array([pred_dict[i] for i in JAW_ORDER], dtype=np.int32)
    
    pre_lips  = np.array([pre_dict[i] for i in LIP_ORDER], dtype=np.int32)
    pred_lips = np.array([pred_dict[i] for i in LIP_ORDER], dtype=np.int32)
    
    # cv2.polylines(output_img, [pre_jaw], isClosed=False, color=FRONT_FACE_COLOR_PRE_OP, thickness=FRONT_FACE_THICKNESS_LINE)
    # cv2.polylines(output_img, [pre_lips], isClosed=True, color=FRONT_FACE_COLOR_PRE_OP, thickness=FRONT_FACE_THICKNESS_LINE)
    # for pt in pre_pixel_coords.astype(int):
    #     cv2.circle(output_img, tuple(pt), radius=FRONT_FACE_RADIUS_POINT, color=FRONT_FACE_COLOR_PRE_OP, thickness=-1)
        
    cv2.polylines(output_img, [pred_jaw], isClosed=False, color=FRONT_FACE_COLOR_POST_OP, thickness=FRONT_FACE_THICKNESS_LINE)
    cv2.polylines(output_img, [pred_lips], isClosed=True, color=FRONT_FACE_COLOR_POST_OP, thickness=FRONT_FACE_THICKNESS_LINE)
    for pt in pred_pixel_coords.astype(int):
        cv2.circle(output_img, tuple(pt), radius=FRONT_FACE_RADIUS_POINT, color=FRONT_FACE_COLOR_POST_OP, thickness=-1)
        
    cv2.drawMarker(output_img, nose_pt, color=FRONT_FACE_COLOR_ANCHOR, markerType=cv2.MARKER_TILTED_CROSS, markerSize=FRONT_FACE_RADIUS_ANCHOR, thickness=3)
    
    scale_mult = max(1.0, w / 1000.0) 
    font = cv2.FONT_HERSHEY_SIMPLEX
    f_scale = 0.7 * scale_mult
    f_thick = int(2 * scale_mult)
    
    box_w = int(320 * scale_mult)
    box_h = int(160 * scale_mult)
    margin = int(30 * scale_mult)
    
    x_start = w - box_w - margin 
    y_start = margin
    
    overlay = output_img.copy()
    cv2.rectangle(overlay, (x_start, y_start), (x_start + box_w, y_start + box_h), FRONT_FACE_COLOR_LEGEND_BG, -1)
    cv2.addWeighted(overlay, 0.5, output_img, 0.5, 0, output_img) 
    
    text_x = x_start + int(75 * scale_mult)
    row1_y = y_start + int(45 * scale_mult)
    row2_y = y_start + int(95 * scale_mult)
    row3_y = y_start + int(140 * scale_mult)
    
    # line_y1 = row1_y - int(5 * scale_mult)
    # cv2.line(output_img, (x_start + int(15 * scale_mult), line_y1), (x_start + int(60 * scale_mult), line_y1), FRONT_FACE_COLOR_PRE_OP, FRONT_FACE_THICKNESS_LINE)
    # cv2.circle(output_img, (x_start + int(37 * scale_mult), line_y1), FRONT_FACE_RADIUS_POINT, FRONT_FACE_COLOR_PRE_OP, -1)
    # cv2.putText(output_img, "Pre op contour", (text_x, row1_y), font, f_scale, FRONT_FACE_COLOR_TEXT, f_thick)
    
    line_y2 = row2_y - int(5 * scale_mult)
    cv2.line(output_img, (x_start + int(15 * scale_mult), line_y2), (x_start + int(60 * scale_mult), line_y2), FRONT_FACE_COLOR_POST_OP, FRONT_FACE_THICKNESS_LINE)
    cv2.circle(output_img, (x_start + int(37 * scale_mult), line_y2), FRONT_FACE_RADIUS_POINT, FRONT_FACE_COLOR_POST_OP, -1)
    cv2.putText(output_img, "Prediction contour(Post Op)", (text_x, row2_y), font, f_scale, FRONT_FACE_COLOR_TEXT, f_thick)
    
    cv2.drawMarker(output_img, (x_start + int(37 * scale_mult), row3_y - int(5 * scale_mult)), color=FRONT_FACE_COLOR_ANCHOR, markerType=cv2.MARKER_TILTED_CROSS, markerSize=FRONT_FACE_RADIUS_ANCHOR , thickness=3)
    cv2.putText(output_img, "Nose Anchor", (text_x, row3_y), font, f_scale, FRONT_FACE_COLOR_TEXT, f_thick)

    logger.info("✅ SUCCESS: process_front_face completed for image_key=%s", image_key)
    return output_img

def process_images(input_images_details):
    logger.info("✅ SUCCESS: process_images started with %d inputs", len(input_images_details))
    
    output_data = {
        "left_image": None,
        "right_image": None,
        "front_image": None
    }
      
    for image_data in input_images_details:
        side = image_data.get("side")
        bucket_key = image_data.get("bucket_key")
        
        if side == "left" or side == "right":
            side, output_img = process_single_image_left_or_right(bucket_key, side)
            if side == "left":
                output_data["left_image"] = output_img
            else:
                output_data["right_image"] = output_img
        else:
            output_data["front_image"] = process_front_face(bucket_key, csv_key=image_data.get("csv_key"))

    logger.info("✅ SUCCESS: process_images completed")
    return output_data








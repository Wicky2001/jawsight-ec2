
import os
import cv2
import numpy as np
import pandas as pd


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
from pathlib import Path





def process_images_debuggers(input_images_details):
    logger.info("✅ SUCCESS: process_images started with %d inputs", len(input_images_details))
    
    output_data = {
        "left_image": None,
        "right_image": None,
        "front_image": None
    }
      
    for image_data in input_images_details:
        side = image_data.get("side")
        bucket_key = image_data.get("bucket_key")
        patient_id=image_data.get("patient_id")
        
        if side == "left" or side == "right":
            side, output_img = process_single_image_left_or_right_debuggers(bucket_key, side,patient_id)
            if side == "left":
                output_data["left_image"] = output_img
            else:
                output_data["right_image"] = output_img
        else:
            output_data["front_image"] = process_front_face_debuggers(bucket_key, csv_key=image_data.get("csv_key"))

    logger.info("✅ SUCCESS: process_images completed")
    return output_data



def process_single_image_left_or_right_debuggers(bucket_key, side, patient_id):
    """
    Draws the ground-truth post-op contour (from the training CSV) directly
    onto the pre-op image, using the patient's stored Nose_X/Nose_Y/Scale_Factor
    to unnormalize the CSV's Post_X_i/Post_Y_i points. No model inference.
    """
    logger.info("✅ SUCCESS: process_single_image_left_or_right started. side=%s, key=%s", side, bucket_key)

    if side == "left":
        is_left = True
        csv_path = "./config/debug_files/LEFT.csv"
    else:
        is_left = False
        csv_path = "./config/debug_files/RIGHT.csv"

    image_bytes = read_file_from_s3(bucket_key)
    if not image_bytes:
        raise UnsuitableImageError("Failed to retrieve image from S3.")

    nparr = np.frombuffer(image_bytes, np.uint8)

    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise UnsuitableImageError("Failed to decode image. The file might be corrupted.")

    img_bgr = preprocess_image(img_bgr)
    h, w = img_bgr.shape[:2]

    # --- Load ground-truth row for this patient from the CSV ---
    df = pd.read_csv(csv_path)
    row = df[df["Patient_ID"] == patient_id]
    if row.empty:
        raise UnsuitableImageError(f"Patient_ID '{patient_id}' not found in {csv_path}.")
    row = row.iloc[0]

    nose_pt = (int(row["Nose_X"]), int(row["Nose_Y"]))
    scale_master = float(row["Scale_Factor"])

    post_cols = [c for c in df.columns if c.startswith("Post_X_")]
    num_points = len(post_cols)

    post_x = np.array([row[f"Post_X_{i}"] for i in range(num_points)], dtype=np.float64)
    post_y = np.array([row[f"Post_Y_{i}"] for i in range(num_points)], dtype=np.float64)
    post_norm = np.column_stack((post_x, post_y))

    pre_x = np.array([row[f"Pre_X_{i}"] for i in range(num_points)], dtype=np.float64)
    pre_y = np.array([row[f"Pre_Y_{i}"] for i in range(num_points)], dtype=np.float64)
    pre_norm = np.column_stack((pre_x, pre_y))

    # --- Unnormalize back to pixel space ---
    post_pixel_coords = (post_norm * scale_master) + np.array(nose_pt)
    pre_pixel_coords = (pre_norm * scale_master) + np.array(nose_pt)

    output_img = img_bgr.copy()

    cv2.polylines(output_img, [pre_pixel_coords.astype(np.int32)], isClosed=False, color=FRONT_FACE_COLOR_PRE_OP, thickness=FRONT_FACE_THICKNESS_LINE)
    cv2.polylines(output_img, [post_pixel_coords.astype(np.int32)], isClosed=False, color=FRONT_FACE_COLOR_POST_OP, thickness=FRONT_FACE_THICKNESS_LINE)
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
    row1_y = y_start + int(45 * scale_mult)
    row2_y = y_start + int(95 * scale_mult)
    row3_y = y_start + int(140 * scale_mult)

    line_y1 = row1_y - int(5 * scale_mult)
    cv2.line(output_img, (x_start + int(15 * scale_mult), line_y1), (x_start + int(45 * scale_mult), line_y1), FRONT_FACE_COLOR_PRE_OP, FRONT_FACE_THICKNESS_LINE)
    cv2.putText(output_img, "Pre-Surgery", (text_x, row1_y), font, f_scale, FRONT_FACE_COLOR_TEXT, f_thick)

    line_y2 = row2_y - int(5 * scale_mult)
    cv2.line(output_img, (x_start + int(15 * scale_mult), line_y2), (x_start + int(45 * scale_mult), line_y2), FRONT_FACE_COLOR_POST_OP, FRONT_FACE_THICKNESS_LINE)
    cv2.putText(output_img, "Post-Surgery (Actual)", (text_x, row2_y), font, f_scale, FRONT_FACE_COLOR_TEXT, f_thick)

    cv2.drawMarker(output_img, (x_start + int(30 * scale_mult), row3_y - int(5 * scale_mult)), FRONT_FACE_COLOR_ANCHOR, markerType=cv2.MARKER_TILTED_CROSS, markerSize=FRONT_FACE_RADIUS_ANCHOR, thickness=FRONT_FACE_THICKNESS_LINE)
    cv2.putText(output_img, "Nose Anchor", (text_x, row3_y), font, f_scale, FRONT_FACE_COLOR_TEXT, f_thick)

    logger.info("✅ SUCCESS: process_single_image_left_or_right completed. side=%s", side)
    return side, output_img

def process_front_face_debuggers(bucket_key, side, patient_id):
    """
    Downloads the patient's image from S3 (bucket_key), then locates that
    patient's FIN (pre-op) and FOUT (post-op) ground-truth CSVs inside the
    local i_path folder using patient_id — a CSV containing "IN" in its
    filename is treated as FIN, one containing "OUT" is treated as FOUT.
    Draws both traces onto the image. No model inference.

    bucket_key: S3 key for this patient's image.
    side: unused for front face (kept for signature consistency with the
          left/right function).
    patient_id: e.g. "PN1"
    """
    logger.info("✅ SUCCESS: process_front_face started. bucket_key=%s, side=%s, patient_id=%s", bucket_key, side, patient_id)

    i_path = "folder_path"  # hardcoded CSV ground-truth folder

    # --- Locate this patient's CSVs inside the local ground-truth folder ---
    csv_dir = Path("./config/debug_files/front")
    matching_csvs = [f for f in csv_dir.iterdir() if f.is_file() and f.suffix.lower() == ".csv" and patient_id in f.name]

    if not matching_csvs:
        raise ValueError(f"ERROR MESSAGE: No csv files found for patient_id={patient_id} in {i_path}")

    fin_csv_path = next((f for f in matching_csvs if "IN" in f.name.upper()), None)
    fout_csv_path = next((f for f in matching_csvs if "OUT" in f.name.upper()), None)

    if not fin_csv_path:
        raise ValueError(f"ERROR MESSAGE: No FIN (IN) csv found for patient_id={patient_id} in {i_path}")
    if not fout_csv_path:
        raise ValueError(f"ERROR MESSAGE: No FOUT (OUT) csv found for patient_id={patient_id} in {i_path}")

    logger.info("✅ SUCCESS: Resolved local CSVs — fin_csv=%s, fout_csv=%s", fin_csv_path, fout_csv_path)

    df_fin = pd.read_csv(fin_csv_path)
    df_fout = pd.read_csv(fout_csv_path)

    # --- Download and decode the image from S3 ---
    image_bytes = read_file_from_s3(bucket_key)
    if not image_bytes:
        raise ValueError(f"ERROR MESSAGE: No image data found")

    nparr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise UnsuitableImageError("ERROR MESSAGE: Failed to decode image.")

    logger.info("✅ SUCCESS: Successfully loaded image from S3 and CSVs locally. Starting preprocessing...")
    img_bgr = preprocess_image(img_bgr)

    h, w = img_bgr.shape[:2]

    # --- Nose anchor & scale come from the FIN (pre-op) csv, matched to the current image size ---
    img_w_csv = df_fin["Image_W"].iloc[0]
    img_h_csv = df_fin["Image_H"].iloc[0]
    scale_x = w / img_w_csv
    scale_y = h / img_h_csv

    nose_x_px = df_fin["Nose_X_Px"].iloc[0] * scale_x
    nose_y_px = df_fin["Nose_Y_Px"].iloc[0] * scale_y
    nose_pt = (int(nose_x_px), int(nose_y_px))

    scale_master = np.sqrt(w**2 + h**2)

    # --- FIN (pre-op / "Doctor's Marks") ---
    df_fin_filtered = df_fin[df_fin["Landmark_MP_ID"] != 1].copy()
    df_fin_filtered = df_fin_filtered.sort_values(by="Landmark_MP_ID")

    if len(df_fin_filtered) != 35:
        raise ValueError(f"Expected 35 FIN landmarks after filtering nose, but got {len(df_fin_filtered)}")

    pre_pixel_coords = df_fin_filtered[["Refined_X_Px", "Refined_Y_Px"]].values * np.array([scale_x, scale_y])
    fin_mp_ids = df_fin_filtered["Landmark_MP_ID"].values

    # --- FOUT (actual post-op ground truth) ---
    df_fout_filtered = df_fout[df_fout["Landmark_MP_ID"] != 1].copy()
    df_fout_filtered = df_fout_filtered.sort_values(by="Landmark_MP_ID")

    if len(df_fout_filtered) != 35:
        raise ValueError(f"Expected 35 FOUT landmarks after filtering nose, but got {len(df_fout_filtered)}")

    post_norm_coords = df_fout_filtered[["Normalized_X", "Normalized_Y"]].values.astype(np.float32)
    post_pixel_coords = (post_norm_coords * scale_master) + np.array(nose_pt)
    fout_mp_ids = df_fout_filtered["Landmark_MP_ID"].values

    output_img = img_bgr.copy()

    pre_dict = {int(mp_id): pt for mp_id, pt in zip(fin_mp_ids, pre_pixel_coords)}
    post_dict = {int(mp_id): pt for mp_id, pt in zip(fout_mp_ids, post_pixel_coords)}

    pre_jaw  = np.array([pre_dict[i] for i in JAW_ORDER], dtype=np.int32)
    post_jaw = np.array([post_dict[i] for i in JAW_ORDER], dtype=np.int32)

    pre_lips  = np.array([pre_dict[i] for i in LIP_ORDER], dtype=np.int32)
    post_lips = np.array([post_dict[i] for i in LIP_ORDER], dtype=np.int32)

    cv2.polylines(output_img, [pre_jaw], isClosed=False, color=FRONT_FACE_COLOR_PRE_OP, thickness=FRONT_FACE_THICKNESS_LINE)
    cv2.polylines(output_img, [pre_lips], isClosed=True, color=FRONT_FACE_COLOR_PRE_OP, thickness=FRONT_FACE_THICKNESS_LINE)
    for pt in pre_pixel_coords.astype(int):
        cv2.circle(output_img, tuple(pt), radius=FRONT_FACE_RADIUS_POINT, color=FRONT_FACE_COLOR_PRE_OP, thickness=-1)

    cv2.polylines(output_img, [post_jaw], isClosed=False, color=FRONT_FACE_COLOR_POST_OP, thickness=FRONT_FACE_THICKNESS_LINE)
    cv2.polylines(output_img, [post_lips], isClosed=True, color=FRONT_FACE_COLOR_POST_OP, thickness=FRONT_FACE_THICKNESS_LINE)
    for pt in post_pixel_coords.astype(int):
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

    line_y1 = row1_y - int(5 * scale_mult)
    cv2.line(output_img, (x_start + int(15 * scale_mult), line_y1), (x_start + int(60 * scale_mult), line_y1), FRONT_FACE_COLOR_PRE_OP, FRONT_FACE_THICKNESS_LINE)
    cv2.circle(output_img, (x_start + int(37 * scale_mult), line_y1), FRONT_FACE_RADIUS_POINT, FRONT_FACE_COLOR_PRE_OP, -1)
    cv2.putText(output_img, "Doctor's Marks", (text_x, row1_y), font, f_scale, FRONT_FACE_COLOR_TEXT, f_thick)

    line_y2 = row2_y - int(5 * scale_mult)
    cv2.line(output_img, (x_start + int(15 * scale_mult), line_y2), (x_start + int(60 * scale_mult), line_y2), FRONT_FACE_COLOR_POST_OP, FRONT_FACE_THICKNESS_LINE)
    cv2.circle(output_img, (x_start + int(37 * scale_mult), line_y2), FRONT_FACE_RADIUS_POINT, FRONT_FACE_COLOR_POST_OP, -1)
    cv2.putText(output_img, "Actual Post-Op", (text_x, row2_y), font, f_scale, FRONT_FACE_COLOR_TEXT, f_thick)

    cv2.drawMarker(output_img, (x_start + int(37 * scale_mult), row3_y - int(5 * scale_mult)), color=FRONT_FACE_COLOR_ANCHOR, markerType=cv2.MARKER_TILTED_CROSS, markerSize=FRONT_FACE_RADIUS_ANCHOR, thickness=3)
    cv2.putText(output_img, "Nose Anchor", (text_x, row3_y), font, f_scale, FRONT_FACE_COLOR_TEXT, f_thick)

    logger.info("✅ SUCCESS: process_front_face completed for patient_id=%s", patient_id)
    return output_img



def check_debuggers_exist(patient_id):
    """
    Checks whether ground-truth data exists for the given patient_id across:
      - LEFT.csv  (Patient_ID column)
      - RIGHT.csv (Patient_ID column)
      - the front-face ground-truth folder (i_path), for FIN/FOUT csvs

    Returns True if data is found in at least one of these sources,
    otherwise False.
    """
    i_path = "./config/debug_files/front"  

    found_left = False
    found_right = False
    found_front = False

    # --- Check LEFT.csv ---
    try:
        df_left = pd.read_csv("LEFT.csv")
        found_left = patient_id in df_left["Patient_ID"].values
    except FileNotFoundError:
        logger.warning("⚠️ LEFT.csv not found while checking patient_id=%s", patient_id)
    except Exception as e:
        logger.warning("⚠️ Error reading LEFT.csv while checking patient_id=%s: %s", patient_id, e)

    # --- Check RIGHT.csv ---
    try:
        df_right = pd.read_csv("RIGHT.csv")
        found_right = patient_id in df_right["Patient_ID"].values
    except FileNotFoundError:
        logger.warning("⚠️ RIGHT.csv not found while checking patient_id=%s", patient_id)
    except Exception as e:
        logger.warning("⚠️ Error reading RIGHT.csv while checking patient_id=%s: %s", patient_id, e)

    # --- Check front-face folder for FIN/FOUT csvs ---
    try:
        csv_dir = Path(i_path)
        matching_csvs = [f for f in csv_dir.iterdir() if f.is_file() and f.suffix.lower() == ".csv" and patient_id in f.name]

        has_fin = any("IN" in f.name.upper() for f in matching_csvs)
        has_fout = any("OUT" in f.name.upper() for f in matching_csvs)
        found_front = has_fin and has_fout
    except FileNotFoundError:
        logger.warning("⚠️ Folder %s not found while checking patient_id=%s", i_path, patient_id)
    except Exception as e:
        logger.warning("⚠️ Error scanning %s while checking patient_id=%s: %s", i_path, patient_id, e)

    result = found_left or found_right or found_front
    logger.info(
        "✅ check_patient_data_exists patient_id=%s | LEFT=%s RIGHT=%s FRONT=%s -> result=%s",
        patient_id, found_left, found_right, found_front, result
    )
    return result


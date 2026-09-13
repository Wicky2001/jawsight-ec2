import os
from pathlib import Path


def load_env_file() -> None:
    env_file = Path(__file__).resolve().parent.parent / ".env"
    if not env_file.exists():
        return

    for raw_line in env_file.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")

        if key and key not in os.environ:
            os.environ[key] = value


load_env_file()

BUCKET_NAME = os.getenv("BUCKET_NAME")
SNS_TOPIC_ARN = os.getenv("SNS_TOPIC_ARN")
ENV = os.getenv("ENV") or os.getenv("ENVIRONMENT") or "production"

# =========================================================
# AI IMAGE GENERATION (OPENAI)
# =========================================================
OPENAI_API_KEY          = os.getenv("OPENAI_API_KEY")
OPENAI_IMAGE_MODEL      = os.getenv("OPENAI_IMAGE_MODEL", "gpt-image-1.5")
OPENAI_IMAGE_QUALITY    = os.getenv("OPENAI_IMAGE_QUALITY", "high")      # low | medium | high
OPENAI_INPUT_FIDELITY   = os.getenv("OPENAI_INPUT_FIDELITY", "high")     # set empty to not send it
OPENAI_IMAGE_EDIT_URL   = "https://api.openai.com/v1/images/edits"
OPENAI_REQUEST_TIMEOUT  = 600  # seconds

AI_SIDE_MASK_INWARD_RATIO = 0.6   # how far the side mask reaches back towards the ear (x nose-to-bottom length)
AI_SIDE_MASK_TOP_RATIO    = 0.1   # side mask starts this far below the nose (x nose-to-bottom length)
AI_MASK_DILATE_RATIO      = 0.03  # mask growth (x image diagonal)
AI_MAX_UPLOAD_SIZE        = 1536

# =========================================================
# GLOBAL VISUALIZATION SETTINGS (FRONT FACE)
# =========================================================
FRONT_FACE_COLOR_PRE_OP    = (255, 0, 0)      # Solid Blue (Doctor's Marks)
FRONT_FACE_COLOR_POST_OP   = (0, 0, 255)      # Solid Red (AI Prediction)
FRONT_FACE_COLOR_ANCHOR    = (0, 0, 255)      # Solid Red (Nose Anchor)
FRONT_FACE_COLOR_TEXT      = (255, 255, 255)  # White
FRONT_FACE_COLOR_LEGEND_BG = (0, 0, 0)        # Black

FRONT_FACE_RADIUS_POINT    = 4
FRONT_FACE_RADIUS_ANCHOR   = 15
FRONT_FACE_THICKNESS_LINE  = 4

# =========================================================
# ANATOMICAL DRAWING ORDERS
# =========================================================
JAW_ORDER = [58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288]
LIP_ORDER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185]

# =========================================================
# HYPERPARAMETERS & MODEL SETTINGS
# =========================================================
MAX_IMAGE_SIZE = 2000
NUM_RESAMPLED_POINTS = 50
MASK_THRESHOLD = 150
IMAGE_BORDER_MARGIN = 50

UPSCALE_FACTOR = 2.0

BRIGHTNESS_THRESHOLD = 190
CONTRAST_THRESHOLD   = 60

USE_CLAHE = True
CLAHE_CLIP_LIMIT = 2
CLAHE_TILE_GRID  = (3, 3)

USE_SHARPEN = True
GAUSSIAN_KERNEL = (3, 3)
GAUSSIAN_SIGMA  = 1.0
SHARPEN_ALPHA   = 1.5
SHARPEN_BETA    = -0.5
SHARPEN_GAMMA   = 0

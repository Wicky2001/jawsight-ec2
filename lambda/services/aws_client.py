import boto3
from utils.logger import logger

_session = None


def get_boto_session():
    global _session
    if _session is None:
        logger.info("✅ SUCCESS: Using default implicit AWS session (production).")
        _session = boto3.Session()
    return _session


s3_client = get_boto_session().client("s3")
sns_client = get_boto_session().client("sns")

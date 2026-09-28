data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "data" {
  bucket        = "${var.project_name}-${var.environment}-data-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
}

resource "aws_s3_bucket" "deployment_artifacts" {
  bucket        = "${var.project_name}-deployment-artifacts-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
}

resource "aws_s3_bucket_versioning" "versioning" {
  bucket = aws_s3_bucket.deployment_artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}


resource "aws_s3_bucket" "public-model-storage" {
  bucket        = "${var.project_name}-public-model-storage-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
}

# Step 1: Disable the account-level public access blocks for this bucket
resource "aws_s3_bucket_public_access_block" "public-model-storage" {
  bucket = aws_s3_bucket.public-model-storage.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Step 2: Attach a bucket policy granting public read access
resource "aws_s3_bucket_policy" "public-model-storage" {
  bucket = aws_s3_bucket.public-model-storage.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.public-model-storage.arn}/*"
      }
    ]
  })

  # Ensure the public access block is lifted before the policy is applied,
  # otherwise AWS will reject the policy attachment.
  depends_on = [aws_s3_bucket_public_access_block.public-model-storage]
}

# Step 3: Upload the rembg model used by the Lambda Docker build (wget in lambda/Dockerfile)
resource "aws_s3_object" "u2net_human_seg_model" {
  count = var.model_file_path == null ? 0 : 1

  bucket       = aws_s3_bucket.public-model-storage.id
  key          = "u2net_human_seg.onnx"
  source       = var.model_file_path
  source_hash  = filemd5(var.model_file_path) # re-upload only when the local file changes
  content_type = "application/octet-stream"
}

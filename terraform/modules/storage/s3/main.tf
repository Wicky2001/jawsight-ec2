# S3 Module Main
resource "aws_s3_bucket" "data" {
  bucket = "${var.project_name}-${var.environment}-data"
}

resource "aws_s3_bucket" "deployment_artifacts"{
  bucket = "${var.project_name}-${var.environment}-deployment-artifacts"

}


resource "aws_s3_bucket_versioning" "versioning" {
  bucket = aws_s3_bucket.deployment_artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}

output "data_s3_bucket_name" {
  description = "Name of the data bucket"
  value       = aws_s3_bucket.data.id # both .id and .bucket return the plain name
}

output "data_s3_bucket_arn" {
  description = "ARN of the data bucket"
  value       = aws_s3_bucket.data.arn
}



output "deployment_artifacts_s3_bucket_name" {
  description = "Name of the deployment artifacts bucket"
  value       = aws_s3_bucket.deployment_artifacts.id # both .id and .bucket return the plain name
}

output "deployment_artifacts_s3_bucket_arn" {
  description = "ARN of the deployment artifacts bucket"
  value       = aws_s3_bucket.deployment_artifacts.arn
}

output "public_model_s3_bucket_arn" {
  description = "ARN of the public model storage"
  value       = aws_s3_bucket.public-model-storage.arn
}

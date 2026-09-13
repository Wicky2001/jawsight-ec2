output "s3_bucket_name" {
  description = "Data Bucket Name"
  value       = module.s3.data_s3_bucket_name
}

output "s3_bucket_arn" {
  description = "Data Bucket ARN"
  value       = module.s3.data_s3_bucket_arn
}

output "image_processing_queue_arn" {
  description = "Image Processing SQS ARN"
  value       = module.sqs.image_processing_queue_arn
}

output "image_processing_queue_url" {
  description = "Image Processing SQS URL"
  value       = module.sqs.image_processing_queue_url
}

output "image_processing_dlq_arn" {
  description = "Image Processing DLQ ARN"
  value       = module.sqs.image_processing_dlq_arn
}

output "sns_topic_arn" {
  description = "SNS Topic ARN"
  value       = module.sns.topic_arn
}

output "lambda_arn" {
  description = "Lambda ARN"
  value       = module.lambda.lambda_arn
}

output "ecr_repository_url" {
  description = "ECR Repository URL"
  value       = module.ecr.lambda_repository_url
}

output "iam_role_arn" {
  description = "IAM Role ARN"
  value       = module.iam.lambda_role_arn
}

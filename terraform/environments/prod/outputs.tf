output "nlb_arn" {
	value = module.nlb.nlb_arn
}

output "nlb_domain_name" {
	value = module.nlb.nlb_dns_name
}

output "rds_endpoint" {
	description = "RDS Endpoint"
	value       = module.rds.rds_instance_endpoint
}

output "lambda_arn" {
	description = "Lambda ARN"
	value       = module.lambda.lambda_arn
}

output "sns_topic_arn" {
	description = "SNS Topic ARN"
	value       = module.sns.topic_arn
}

output "image_processing_queue_arn" {
	description = "Image Processing SQS ARN"
	value       = module.sqs.image_processing_queue_arn
}

output "image_processing_queue_url" {
	description = "Image Processing SQS URL"
	value       = module.sqs.image_processing_queue_url
}

output "sqs_queue_url" {
	description = "SQS Queue URL"
	value       = module.sqs.image_processing_queue_url
}

output "data_s3_bucket_name" {
	description = "Data Bucket Name"
	value       = module.s3.data_s3_bucket_name
}

output "data_s3_bucket_arn" {
	description = "Data Bucket ARN"
	value       = module.s3.data_s3_bucket_arn
}

output "artifacts_s3_bucket_name" {
	description = "Artifacts Bucket Name"
	value       = module.s3.deployment_artifacts_s3_bucket_name
}

output "artifacts_s3_bucket_arn" {
	description = "Artifacts Bucket ARN"
	value       = module.s3.deployment_artifacts_s3_bucket_arn
}

output "lambda_repository_url" {
	description = "Lambda ECR Repository URL"
	value       = module.ecr.lambda_repository_url
}

output "frontend_repository_url" {
	description = "Frontend ECR Repository URL"
	value       = module.ecr.frontend_repository_url
}

output "backend_repository_url" {
	description = "Backend ECR Repository URL"
	value       = module.ecr.backend_repository_url
}

output "db_host_name" {
	description = "Database Hostname"
	value       = module.rds.rds_instance_endpoint

}


output "frontend_repository_arn" {
	description = "ARN of the Frontend ECR repository"
	value = module.ecr.frontend_repository_arn
}

output "backend_repository_arn" {
	description = "ARN of the Backend ECR repository"
	value = module.ecr.backend_repository_arn
}

output "migrations_repository_arn" {
	description = "ARN of the Migrations ECR repository"
	value = module.ecr.migrations_repository_arn
}

output "lambda_repository_arn" {
	description = "ARN of the Lambda ECR repository"
	value = module.ecr.lambda_repository_arn
}

output "ec2_instance_id"{
	description = "ID of the EC2 instance"
	value       = module.ec2.app_server_id
}

output "ec2_instance_arn" {
	description = "ARN of the EC2 instance"
	value       = module.ec2.app_server_arn
}



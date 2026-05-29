output "nlb_arn" {
	value = module.nlb.nlb_arn
}

output "s3_bucket_name" {
	description = "Data Bucket Name"
	value       = module.s3.s3_bucket_name
}

output "s3_bucket_arn" {
	description = "Data Bucket ARN"
	value       = module.s3.s3_bucket_arn
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
	value       = module.ecr.repository_url
}

output "iam_role_arn" {
	description = "IAM Role ARN"
	value       = module.iam.lambda_role_arn
}

output "vpc_id" {
	description = "VPC ID"
	value       = module.vpc.vpc_id
}

output "public_subnet_id" {
	description = "Public subnet ID"
	value       = module.vpc.public_subnet_id
}

output "private_subnet_1_id" {
	description = "Private subnet 1 ID"
	value       = module.vpc.private_subnet_1_id
}

output "private_subnet_2_id" {
	description = "Private subnet 2 ID"
	value       = module.vpc.private_subnet_2_id
}

output "ec2_instance_id" {
	description = "EC2 instance ID"
	value       = module.ec2.app_server_id
}

output "rds_sg_id" {
	description = "RDS security group ID"
	value       = module.security_groups.rds_sg_id
}

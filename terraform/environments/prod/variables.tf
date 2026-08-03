variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1"
}

variable "aws_profile" {
  description = "AWS CLI profile to use for deployment"
  type        = string
  default     = "jawsight"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "jawsight"
}

variable "environment" {
  description = "Environment name for resource naming"
  type        = string
  default     = "production"
}


variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.small"
}

variable "acm_certificate_arn" {
  description = "ARN of the ACM certificate for TLS listener"
  type        = string
  default     = "arn:aws:acm:ap-south-1:473280638005:certificate/a2d276b8-698f-4ac1-b020-5f3776315d63"
}

variable "sqs_visibility_timeout" {
  description = "sqs message visibility timeout"
  type        = number
  default     = 960
}

variable "lambda_timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 900
}

variable "lambda_memory" {
  description = "Lambda memory in MB"
  type        = number
  default     = 3008
}

variable "webhook_url" {
  description = "Webhook URL for SNS notifications"
  type        = string
  default     = "https://www.jawsight.online/api/inference/sns-webhook"
}

variable "image_uri" {
  description = "lambda image url"
  type        = string
  default     = "473280638005.dkr.ecr.ap-south-1.amazonaws.com/jawsight-production-lambda:v8"
}

variable "db_username" {
  description = "Master username for the RDS instance"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Master password for the RDS instance"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Database name for the RDS instance"
  type        = string
  default     = "postgres"
}

variable "public_key_openssh" {
  description = "Public key in OpenSSH format for EC2 key pair"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

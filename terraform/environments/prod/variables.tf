variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1"
}

variable "aws_profile" {
  description = "AWS CLI profile to use for deployment"
  type        = string
  default     = "jawsight-dev-terraform"
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
  default     = "arn:aws:acm:ap-south-1:915658834610:certificate/da944a3d-6e35-4788-8294-1399dd46db7c"
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
  default     = "https://www.jawsight.com/api/inference/sns-webhook"
}

variable "image_uri" {
  description = "lambda image url"
  type        = string
  default     = "915658834610.dkr.ecr.ap-south-1.amazonaws.com/jawsight-image-processor-dev-repo:v2"
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
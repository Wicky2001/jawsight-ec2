variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1"
}

variable "aws_profile" {
  description = "AWS CLI profile to use for deployment"
  type        = string
  default     = "jawsight-terraform"
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
  default     = "t3.large"
}

variable "acm_certificate_arn" {
  description = "ARN of the ACM certificate for TLS listener"
  type        = string
  default     = "arn:aws:acm:ap-south-1:915658834610:certificate/da944a3d-6e35-4788-8294-1399dd46db7c"
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
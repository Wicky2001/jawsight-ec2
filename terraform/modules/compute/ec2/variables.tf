variable "project_name" {
  description = "Project name"
  type        = string
  default     = "image-processor"
}

variable "vpc_id" {
  description = "VPC ID for EC2 resources"
  type        = string
}

variable "private_subnet_id" {
  description = "Private subnet ID for EC2 resources"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "security_group_id" {
  description = "Security group ID for EC2 resources"
  type        = string
}


variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "instance_profile_name" {
  description = "IAM instance profile name for EC2 instance (for SSM access)"
  type        = string
}

variable "public_key_openssh"{
  description = "Public key in OpenSSH format for EC2 key pair"
  type        = string
}

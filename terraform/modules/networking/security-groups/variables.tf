variable "project_name" {
  description = "Project name"
  type        = string
  default     = "jawsight"
}

variable "vpc_id" {
  description = "VPC ID where security groups will be created"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block for security group rules"
  type        = string
}

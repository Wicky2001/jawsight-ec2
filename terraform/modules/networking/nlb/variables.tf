variable "project_name" {
  description = "Project name"
  type        = string
  default     = "jawsight"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for NLB resources"
  type        = string
}
variable "public_subnet_id" {
  description = "Public subnet ID for NLB resources"
  type        = string
}

variable "acm_certificate_arn" {
  description = "ARN of the ACM certificate for TLS listener"
  type        = string
}

variable "ec2_instance_id"{
  description = "EC2 instance ID to attach to the NLB target group"
  type        = string
}

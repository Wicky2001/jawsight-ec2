variable "rds_sg_id" {
  description = "Security group ID for RDS instance"
  type        = string
  
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}


variable "db_username" {
  description = "Master username for RDS instance"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Master password for RDS instance"
  type        = string
  sensitive   = true
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "jawsight"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for RDS subnet group"
  type        = list(string)
}



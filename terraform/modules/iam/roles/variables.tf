variable "project_name" {
  description = "Project name"
  type        = string
  default     = "image-processor"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "data_s3_bucket_arn" {
  description = "ARN of data bucket"
  type        = string
  default     = ""
}

variable "artifacts_s3_bucket_arn"{
  description = "ARN of deployment artifacts bucket"
  type        = string
  default     = ""
}

variable "image_processing_queue_arn" {
  description = "ARN of image jobs sqs queue"
  type        = string
  default     = ""
}

variable "sns_topic_arn" {
  description = "ARN of sns topic"
  type        = string
  default     = ""
}

variable "lambda_repository_arn" {
  description = "ARN of ecr repository for lambda images"
  type        = string
  default     = ""
}

variable "frontend_repository_arn" {
  description = "ARN of ecr repository for frontend images"
  type        = string
  default     = ""
}

variable "backend_repository_arn" {
  description = "ARN of ecr repository for backend images"
  type        = string
  default     = ""
}

variable "migrations_repository_arn" {
  description = "ARN of ecr repository for migrations images"
  type        = string
  default     = ""
}
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

variable "lambda_role_arn" {
  description = "IAM Role ARN for Lambda"
  type        = string
  default     = ""
}

variable "image_uri" {
  description = "URI of the Lambda container image in ECR"
  type        = string
  default     = ""
}

variable "sqs_visibility_timeout" {
  description = "sqs message visibility timeout"
  type = number
  default = 960
}

variable "timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 900
}

variable "memory" {
  description = "Lambda memory in MB"
  type        = number
  default     = 2048
}

variable "s3_bucket_name" {
  description = "Data bucket name"
  type        = string
  default     = ""
}

variable "sns_topic_arn" {
  description = "SNS Topic ARN"
  type        = string
  default     = ""
}

variable "image_processing_queue_arn" {
  description = "Image processing SQS ARN"
  type        = string
  default     = ""
}

variable "openai_api_key" {
  description = "OpenAI API key used by the Lambda for image generation. Empty skips setting it."
  type        = string
  default     = ""
  sensitive   = true
}

variable "openai_image_model" {
  description = "OpenAI image model used by the Lambda"
  type        = string
  default     = "gpt-image-1.5"
}

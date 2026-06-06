variable "project_name" {
  description = "Project name"
  type        = string
  default     = "image-processor"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "deployment_artifacts_bucket_arn" {
  description = "ARN of the deployment artifacts bucket"
  type        = string
}

variable "ecr_repository_arns" {
  description = "List of ECR repository ARNs the user can access"
  type        = list(string)
}

variable "lambda_function_arn" {
  description = "ARN of the Lambda function the user can manage"
  type        = string
}

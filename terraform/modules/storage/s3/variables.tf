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

variable "model_file_path" {
  description = "Local path to u2net_human_seg.onnx to upload to the public model bucket. Null skips the upload."
  type        = string
  default     = null
}

variable "topic_arn" {
  description = "ARN of the SNS topic to subscribe to"
  type        = string
  default     = ""
}

variable "webhook_url" {
  description = "HTTPS Webhook URL"
  type        = string
}

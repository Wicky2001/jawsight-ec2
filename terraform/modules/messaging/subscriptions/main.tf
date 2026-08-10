resource "aws_sns_topic_subscription" "webhook" {
  topic_arn                       = var.topic_arn
  protocol                        = "https"
  endpoint                        = var.webhook_url
  endpoint_auto_confirms          = true
  confirmation_timeout_in_minutes = 2
}

# Dead Letter Queue for image processing
resource "aws_sqs_queue" "image_processing_dlq" {
  name = "${var.project_name}-${var.environment}-dlq"
  
  # Standard DLQ settings
  visibility_timeout_seconds = 300
  message_retention_seconds  = 1209600  # 14 days (default for DLQ)
  max_message_size          = 262144   # 256 KB
  delay_seconds             = 0
  receive_wait_time_seconds = 0
  
  # Enable server-side encryption
  sqs_managed_sse_enabled = true

  tags = {
    Name        = "${var.project_name}-${var.environment}-dlq"
    Environment = var.environment
    Purpose     = "Image processing workflow"
  }
}


# Main image processing queue
resource "aws_sqs_queue" "image_processing_queue" {
  name = "${var.project_name}-${var.environment}-queue"
  # Queue configuration matching your current settings
  visibility_timeout_seconds = var.sqs_visibility_timeout # must be greater than Lambda timeout to prevent premature retries
  message_retention_seconds  = 3600     # 1 hour
  max_message_size          = 1048576   # 1 kb
  delay_seconds             = 0         # No delivery delay
  receive_wait_time_seconds = 20        # Long polling enabled
  
  # Dead letter queue configuration
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.image_processing_dlq.arn
    maxReceiveCount     = 2
  })
  
  # Enable server-side encryption with SQS-managed keys
  sqs_managed_sse_enabled = true
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-queue"
    Environment = var.environment
    Purpose     = "Image processing workflow"
  }
}

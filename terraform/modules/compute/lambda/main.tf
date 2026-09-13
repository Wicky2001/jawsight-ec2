resource "aws_lambda_function" "processor" {
  function_name = "${var.project_name}-${var.environment}-lambda"
  role          = var.lambda_role_arn
  package_type  = "Image"
  image_uri     = var.image_uri
  timeout       = var.timeout
  memory_size   = var.memory

  # Additional settings from your current Lambda function
  architectures = ["x86_64"]

  # Ephemeral storage configuration
  ephemeral_storage {
    size = 512 # MB
  }

  # Logging configuration
  logging_config {
    log_format = "Text"
    log_group  = "/aws/lambda/${var.project_name}-${var.environment}-lambda"
  }

  # Tracing configuration
  tracing_config {
    mode = "Active"
  }


  # Environment variables (expanded from your current setup)
  environment {
    variables = merge(
      {
        BUCKET_NAME        = var.s3_bucket_name
        SNS_TOPIC_ARN      = var.sns_topic_arn
        ENV                = "development"
        OPENAI_IMAGE_MODEL = var.openai_image_model
      },
      # Only set the key when one is provided
      var.openai_api_key == "" ? {} : { OPENAI_API_KEY = var.openai_api_key }
    )
  }

  # Optional: Add tags for better resource management
  tags = {
    Name        = "${var.project_name}-${var.environment}-lambda"
    Environment = var.environment
    Purpose     = "Image processing"
  }

  # Ensure the function is updated when the image changes
  depends_on = [
    aws_cloudwatch_log_group.lambda_logs
  ]
}

# Create CloudWatch Log Group with retention policy
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${var.project_name}-${var.environment}-lambda"
  retention_in_days = 14 # Adjust retention as needed

  tags = {
    Name        = "${var.project_name}-${var.environment}-lambda-logs"
    Environment = var.environment
  }
}

resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn = var.image_processing_queue_arn
  function_name    = aws_lambda_function.processor.arn

  # Additional SQS event source mapping settings
  batch_size                         = 2 # Process up to 2 messages at once
  maximum_batching_window_in_seconds = 5 # Wait up to 5 seconds to collect messages

  # Error handling for SQS processing
  function_response_types = ["ReportBatchItemFailures"]

  # Optional: Configure scaling behavior
  scaling_config {
    maximum_concurrency = 100 # Limit concurrent executions
  }
}



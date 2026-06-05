resource "aws_iam_role" "lambda_exec" {
  name = "${var.project_name}-${var.environment}-lambda-exec"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "lambda_policy" {
  name        = "${var.project_name}-${var.environment}-lambda-policy"
  description = "Policy for image processing lambda"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = [
          "${var.data_s3_bucket_arn}/*",
        ]
      },
      {
        "Effect" : "Allow",
        "Action" : [
          "s3:ListBucket"
        ],
        "Resource" : "${var.data_s3_bucket_arn}"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = [
          "${var.image_processing_queue_arn}"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = ["${var.sns_topic_arn}"]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
    
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attach" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# Add X-Ray permission to your Lambda role
resource "aws_iam_role_policy_attachment" "lambda_xray" {
  role       = aws_iam_role.lambda_exec.name 
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}



# 1. The Trust Policy (Unchanged - allows the EC2 to assume the role)
resource "aws_iam_role" "jawsight_ec2_role" {
  name = "${var.project_name}-${var.environment}-ec2-minimal-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

# 2. The Highly Restricted App Policy
resource "aws_iam_policy" "jawsight_app_policy" {
  name        = "${var.project_name}-${var.environment}-minimal-access-policy"
  description = "Strictly limits EC2 access to S3, ECR pulling, and SQS writing"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "CloudWatchLogsAccess"
        Effect   = "Allow"
        Action   = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Sid      = "S3JawsightAccess"
        Effect   = "Allow"
        Action   = "s3:*"
        Resource = var.data_s3_bucket_arn
      },

      {
        Sid = "S3JawssightArtifcatsGetAccess",
        Effect = "Allow",
        Action = [
          "s3:GetObject",
        ],
        Resource = "${var.artifacts_s3_bucket_arn}/*"
      },
      {
        Sid      = "SQSJawsightPushOnly"
        Effect   = "Allow"
        Action   = [
          "sqs:SendMessage",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl"
        ]
        Resource = "${var.image_processing_queue_arn}"
      },
      {
        Sid      = "ECRJawsightPullAccess"
        Effect   = "Allow"
        Action   = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer"
        ]
        Resource = [
          var.frontend_repository_arn,
          var.backend_repository_arn,
          var.migrations_repository_arn,
        ]
      },
      {
        Sid      = "ECRAuthToken"
        Effect   = "Allow"
        Action   = "ecr:GetAuthorizationToken"
        Resource = "*"
      }
    ]
  })
}

#  Attach the minimal policy to the role
resource "aws_iam_role_policy_attachment" "jawsight_policy_attach" {
  role       = aws_iam_role.jawsight_ec2_role.name
  policy_arn = aws_iam_policy.jawsight_app_policy.arn
}

resource "aws_iam_role_policy_attachment" "jawsight_xray_attach" {
  role       = aws_iam_role.jawsight_ec2_role.name 
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

# Attach SSM Core for secure browser-based terminal access
resource "aws_iam_role_policy_attachment" "ssm_core_attach" {
  role       = aws_iam_role.jawsight_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# 5. Create the Instance Profile wrapper for the EC2 instance
# You cannot assign an IAM Role directly to an EC2 instance. EC2 instances do not know how to "wear" a raw role.
# To give an EC2 instance permissions, AWS requires you to put the Role inside an Instance Profile, and then you attach the Instance Profile to the EC2 server.
resource "aws_iam_instance_profile" "jawsight_ec2_profile" {
  name = "${var.project_name}-${var.environment}-ec2-minimal-profile"
  role = aws_iam_role.jawsight_ec2_role.name
}



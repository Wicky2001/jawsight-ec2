data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

locals {
  user_name   = "${var.project_name}-${var.environment}-githubAction-user"
  policy_name = "${var.project_name}-${var.environment}-githubActionUser-policy"

  ssm_document_arn = "arn:aws:ssm:${data.aws_region.current.name}:*:document/AWS-*"
  ssm_instance_arn = "arn:aws:ec2:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:instance/*"
  ssm_command_arn  = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
}

resource "aws_iam_user" "this" {
  name = local.user_name
}

resource "aws_iam_policy" "this" {
  name        = local.policy_name
  description = "GitHub Actions userpermissions for ${var.project_name}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "ECRAuthentication"
        Effect   = "Allow"
        Action   = ["ecr:GetAuthorizationToken"]
        Resource = "*"
      },
      {
        Sid    = "ECRAccess"
        Effect = "Allow"
        Action = [
          "ecr:CompleteLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:InitiateLayerUpload",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:PutImage",
          "ecr:BatchGetImage"
        ]
        Resource = var.ecr_repository_arns
      },
      {
        Sid      = "S3DeploymentBucketListAccess"
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = [var.deployment_artifacts_bucket_arn]
      },
      {
        Sid      = "S3DeploymentBucketObjectAccess"
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:GetObject"]
        Resource = ["${var.deployment_artifacts_bucket_arn}/*"]
      },
      {
        Sid    = "SSMSessionAccess"
        Effect = "Allow"
        Action = [
          "ssm:SendCommand",
          "ssm:ListCommands",
          "ssm:ListCommandInvocations",
          "ssm:DescribeInstanceInformation",
          "ssm:GetCommandInvocation"
        ]
        Resource = "*"
      },
      {
        Sid    = "SSMDocumentAndInstanceAccess"
        Effect = "Allow"
        Action = ["ssm:SendCommand"]
        Resource = [
          local.ssm_document_arn,
          local.ssm_instance_arn,
          local.ssm_command_arn
        ]
      },
      {
        Sid    = "LambdaAccess"
        Effect = "Allow"
        Action = [
          "lambda:UpdateFunctionCode",
          "lambda:UpdateFunctionConfiguration",
          "lambda:GetFunction",
          "lambda:GetFunctionConfiguration",
          "lambda:PublishVersion",
          "lambda:UpdateAlias"
        ]
        Resource = var.lambda_function_arn
      }
    ]
  })
}

resource "aws_iam_user_policy_attachment" "this" {
  user       = aws_iam_user.this.name
  policy_arn = aws_iam_policy.this.arn
}

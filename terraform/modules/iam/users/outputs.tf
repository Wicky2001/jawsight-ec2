output "user_name" {
  description = "Name of the IAM user"
  value       = aws_iam_user.this.name
}

output "user_arn" {
  description = "ARN of the IAM user"
  value       = aws_iam_user.this.arn
}

output "policy_arn" {
  description = "ARN of the IAM policy attached to the user"
  value       = aws_iam_policy.this.arn
}

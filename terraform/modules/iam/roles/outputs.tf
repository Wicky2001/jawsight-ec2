output "lambda_role_arn" {
  description = "ARN of the lambda execution role"
  value       = aws_iam_role.lambda_exec.arn
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.jawsight_ec2_profile.name
}
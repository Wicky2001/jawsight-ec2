output "lambda_repository_url" {
  description = "URL of the Lambda ECR repository"
  value       = aws_ecr_repository.lambda_repo.repository_url
}

output "frontend_repository_url" {
  description = "URL of the Frontend ECR repository"
  value       = aws_ecr_repository.frontend_repo.repository_url
}

output "backend_repository_url" {
  description = "URL of the Backend ECR repository"
  value       = aws_ecr_repository.backend_repo.repository_url
}

output "lambda_repository_arn" {
  description = "ARN of the Lambda ECR repository"
  value = aws_ecr_repository.lambda_repo.arn

}

output "frontend_repository_arn" {
  description = "ARN of the Frontend ECR repository"
  value = aws_ecr_repository.frontend_repo.arn
}

output "backend_repository_arn" {
  description = "ARN of the Backend ECR repository"
  value = aws_ecr_repository.backend_repo.arn
}

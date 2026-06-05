output "rds_instance_endpoint" {
  description = "RDS Instance Endpoint"
  value       = aws_db_instance.postgres.endpoint
}
resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "${var.project_name}-rds-subnet-group"
  subnet_ids = var.private_subnet_ids
  tags       = { Name = "${var.project_name}-rds-subnet-group" }
}

resource "aws_db_instance" "postgres" {
  identifier             = "${var.project_name}-db"
  engine                 = "postgres"
  engine_version         = "16.1"
  instance_class         = var.db_instance_class
  allocated_storage      = 20
  db_name                = "${var.project_name}_db"
  username               = var.db_username
  password               = var.db_password # Pass via tfvars or AWS Secrets Manager
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
  vpc_security_group_ids = [var.rds_sg_id]
  skip_final_snapshot    = true # Set to false in Production!
  publicly_accessible    = false

  tags = { Name = "${var.project_name}-db" }
}
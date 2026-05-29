data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }
}

resource "aws_instance" "app_server" {
  ami           = data.aws_ami.amazon_linux_2023.id
  instance_type = var.instance_type
  subnet_id     = var.private_subnet_id

  vpc_security_group_ids = [var.security_group_id]

  # Optional: IAM instance profile for SSM (so you don't need SSH/Bastion to access it)
  # iam_instance_profile = var.iam_instance_profile_name 

  tags = {
    Name = "${var.project_name}-app-ec2"
  }
}
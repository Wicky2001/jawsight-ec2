resource "aws_key_pair" "deployer" {
  key_name   = "${var.project_name}-${var.environment}-deployer-key"
  public_key = var.public_key_openssh 

}

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

  iam_instance_profile = var.instance_profile_name
  vpc_security_group_ids = [var.security_group_id]
  key_name = aws_key_pair.deployer.key_name

  # --- ADD THIS BLOCK ---
  user_data = <<-EOF
    #!/bin/bash
    # 1. Update the system
    dnf update -y
    
    # 2. Install Docker
    dnf install -y docker
    
    # 3. Start Docker and enable it to start on boot
    systemctl start docker
    systemctl enable docker
    
    # 4. Give the ec2-user permission to run Docker without typing 'sudo'
    usermod -aG docker ec2-user
    
    # 5. Install Docker Compose V2 (The official plugin)
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/libexec/docker/cli-plugins/docker-compose
    chmod +x /usr/libexec/docker/cli-plugins/docker-compose
  EOF
  # ----------------------


  

  tags = {
    Name = "${var.project_name}-${var.environment}-app-ec2"
  }
}
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


  

  tags = {
    Name = "${var.project_name}-${var.environment}-app-ec2"
  }
}
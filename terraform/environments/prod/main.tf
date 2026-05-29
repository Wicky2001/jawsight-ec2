terraform {
  required_version = ">= 1.14.9"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.44.0"
    }
  }
}

provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
}


module "vpc" {
  source       = "../../modules/networking/vpc"
  project_name = var.project_name
}

module "security_groups" {
  source       = "../../modules/networking/security-groups"
  project_name = var.project_name
  vpc_id      = module.vpc.vpc_id
  vpc_cidr    = module.vpc.vpc_cidr
}


module "ec2" {
    source       = "../../modules/compute/ec2"
    project_name = var.project_name
    vpc_id       = module.vpc.vpc_id
    private_subnet_id = module.vpc.private_subnet_id
    security_group_id = module.security_groups.ec2_security_group_id
    instance_type = var.instance_type
    environment  = var.environment
}

module "nlb" {
    source       = "../../modules/networking/nlb"
    project_name = var.project_name
    vpc_id       = module.vpc.vpc_id
    public_subnet_id = module.vpc.public_subnet_id
    acm_certificate_arn = var.acm_certificate_arn
    ec2_instance_id = module.ec2.app_server_id
}

module "rds" {
  source             = "../../modules/storage/rds"
  project_name       = var.project_name
  db_instance_class  = "db.t3.micro"
  db_username        = var.db_username
  db_password        = var.db_password
  private_subnet_ids = [module.vpc.private_subnet_1_id, module.vpc.private_subnet_2_id]
  rds_sg_id          = module.security_groups.rds_sg_id
}
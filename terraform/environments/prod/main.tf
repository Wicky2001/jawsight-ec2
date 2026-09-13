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
  environment  = var.environment
}

module "security_groups" {
  source       = "../../modules/networking/security-groups"
  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
  vpc_cidr     = module.vpc.vpc_cidr
}


module "ec2" {
  source                = "../../modules/compute/ec2"
  project_name          = var.project_name
  vpc_id                = module.vpc.vpc_id
  private_subnet_id     = module.vpc.private_subnet_1_id
  security_group_id     = module.security_groups.ec2_security_group_id
  instance_type         = var.instance_type
  environment           = var.environment
  instance_profile_name = module.iam.ec2_instance_profile_name
  public_key_openssh    = var.public_key_openssh
}

module "nlb" {
  source              = "../../modules/networking/nlb"
  project_name        = var.project_name
  environment         = var.environment
  vpc_id              = module.vpc.vpc_id
  public_subnet_id    = module.vpc.public_subnet_id
  acm_certificate_arn = var.acm_certificate_arn
  ec2_instance_id     = module.ec2.app_server_id
}

module "rds" {
  source             = "../../modules/storage/rds"
  project_name       = var.project_name
  environment        = var.environment
  db_instance_class  = var.db_instance_class
  db_name            = var.db_name
  db_username        = var.db_username
  db_password        = var.db_password
  private_subnet_ids = [module.vpc.private_subnet_1_id, module.vpc.private_subnet_2_id]
  rds_sg_id          = module.security_groups.rds_sg_id
}

module "s3" {
  source          = "../../modules/storage/s3"
  project_name    = var.project_name
  environment     = var.environment
  model_file_path = "${path.root}/../../../lambda/models/u2net_human_seg.onnx"
}

module "sqs" {
  source                 = "../../modules/messaging/sqs"
  project_name           = var.project_name
  environment            = var.environment
  sqs_visibility_timeout = var.sqs_visibility_timeout
}

module "sns" {
  source       = "../../modules/messaging/sns"
  project_name = var.project_name
  environment  = var.environment
}

# module "sns_subscription" {
#   source      = "../../modules/messaging/subscriptions"
#   topic_arn   = module.sns.topic_arn
#   webhook_url = var.webhook_url
# }

module "ecr" {
  source       = "../../modules/storage/ecr"
  project_name = var.project_name
  environment  = var.environment
}

module "iam" {
  source                     = "../../modules/iam/roles"
  project_name               = var.project_name
  environment                = var.environment
  data_s3_bucket_arn         = module.s3.data_s3_bucket_arn
  artifacts_s3_bucket_arn    = module.s3.deployment_artifacts_s3_bucket_arn
  image_processing_queue_arn = module.sqs.image_processing_queue_arn
  lambda_repository_arn      = module.ecr.lambda_repository_arn
  frontend_repository_arn    = module.ecr.frontend_repository_arn
  backend_repository_arn     = module.ecr.backend_repository_arn
  migrations_repository_arn  = module.ecr.migrations_repository_arn
  sns_topic_arn              = module.sns.topic_arn
}

module "iam_user" {
  source                          = "../../modules/iam/users"
  project_name                    = var.project_name
  environment                     = var.environment
  deployment_artifacts_bucket_arn = module.s3.deployment_artifacts_s3_bucket_arn
  ecr_repository_arns = [
    module.ecr.lambda_repository_arn,
    module.ecr.backend_repository_arn,
    module.ecr.frontend_repository_arn,
    module.ecr.migrations_repository_arn,
  ]
  lambda_function_arn = module.lambda.lambda_arn
}

module "lambda" {
  source                     = "../../modules/compute/lambda"
  project_name               = var.project_name
  environment                = var.environment
  lambda_role_arn            = module.iam.lambda_role_arn
  timeout                    = var.lambda_timeout
  memory                     = var.lambda_memory
  image_uri                  = var.image_uri
  s3_bucket_name             = module.s3.data_s3_bucket_name
  sns_topic_arn              = module.sns.topic_arn
  image_processing_queue_arn = module.sqs.image_processing_queue_arn
  openai_api_key             = var.openai_api_key
  openai_image_model         = var.openai_image_model
}

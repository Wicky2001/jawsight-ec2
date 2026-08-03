# TODO: Add networking ALB
resource "aws_lb" "main" {
  name               = "${var.project_name}-${var.environment}-nlb"
  internal           = false
  load_balancer_type = "network"
  subnets            = [var.public_subnet_id]

  tags = { Name = "${var.project_name}-${var.environment}-nlb" }
}

resource "aws_lb_target_group" "app" {
  name        = "${var.project_name}-${var.environment}-tg"
  port        = 80
  protocol    = "TCP"
  vpc_id      = var.vpc_id
  target_type = "instance"

  # CRITICAL: Enable Proxy Protocol v2 for your NGINX setup
  proxy_protocol_v2  = true
  preserve_client_ip = false

  health_check {
    protocol            = "HTTP"
    port                = "traffic-port"
    path                = "/health"
    matcher             = "200-399" # Accept any successful HTTP status code
    healthy_threshold   = 3         # Number of successes to become healthy
    unhealthy_threshold = 3         # Number of failures to become unhealthy
    timeout             = 6         # Seconds before a check fails
    interval            = 30        # Seconds between each check
  }
}

resource "aws_lb_listener" "tls" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "TLS"
  certificate_arn   = var.acm_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

resource "aws_lb_target_group_attachment" "ec2" {
  target_group_arn = aws_lb_target_group.app.arn
  target_id        = var.ec2_instance_id
  port             = 80
}

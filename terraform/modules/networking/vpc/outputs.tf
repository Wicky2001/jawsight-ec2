output "vpc_id" {
  value = aws_vpc.main.id
}

output "vpc_cidr" {
  value = aws_vpc.main.cidr_block
}

output "public_subnet_id" {
  value = aws_subnet.public.id
}

output "private_subnet_1_id" {
  value = aws_subnet.private1.id
}

output "private_subnet_2_id" {
  value = aws_subnet.private2.id
}

output "private_subnet_id" {
  value = aws_subnet.private1.id
}

output "private2_subnet_id" {
  value = aws_subnet.private2.id
}
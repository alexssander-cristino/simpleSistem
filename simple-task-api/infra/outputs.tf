output "instance_public_ip" {
  description = "IP público da instância EC2 (use como secret EC2_HOST no GitHub Actions)"
  value       = aws_instance.app_server.public_ip
}

output "instance_id" {
  value = aws_instance.app_server.id
}

output "ssh_command" {
  value = "ssh -i /caminho/para/sua-chave.pem ec2-user@${aws_instance.app_server.public_ip}"
}

output "app_url" {
  value = "http://${aws_instance.app_server.public_ip}:${var.app_port}"
}

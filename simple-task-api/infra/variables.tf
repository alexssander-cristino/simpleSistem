variable "aws_region" {
  description = "Região da AWS onde a infraestrutura será criada (AWS Academy Learner Lab fica travado em us-east-1)"
  type        = string
  default     = "us-east-1"
}

variable "aws_session_token" {
  description = "Session token temporário do AWS Academy Learner Lab. Deixe vazio se estiver usando uma conta AWS normal (com credenciais permanentes)."
  type        = string
  default     = ""
  sensitive   = true
}

variable "instance_type" {
  description = "Tipo da instância EC2. No AWS Academy Learner Lab, use apenas t2.micro/t2.small/t3.micro (famílias liberadas pela política do lab)."
  type        = string
  default     = "t2.micro"
}

variable "key_pair_name" {
  description = "Nome do key pair EC2 já existente. No AWS Academy Learner Lab é sempre 'vockey' (não é possível criar outro, pois não há permissão de IAM)."
  type        = string
  default     = "vockey"
}

variable "ssh_allowed_cidr" {
  description = "CIDR autorizado a acessar a porta 22 (restrinja ao seu IP em produção: x.x.x.x/32)"
  type        = string
  default     = "0.0.0.0/0"
}

variable "app_port" {
  description = "Porta em que a Task API é exposta"
  type        = number
  default     = 3000
}

variable "project_name" {
  description = "Nome usado para tagging dos recursos"
  type        = string
  default     = "simple-task-api"
}

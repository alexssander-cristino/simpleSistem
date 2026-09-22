#!/bin/bash
set -euo pipefail

# Instala Docker no Amazon Linux 2023 e deixa pronto para receber o deploy via CI/CD
dnf update -y
dnf install -y docker
systemctl enable --now docker
usermod -aG docker ec2-user

# Instala o plugin docker compose (v2)
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

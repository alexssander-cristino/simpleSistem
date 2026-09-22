# Plano Técnico — Task API (Fase 2: Plan)

> Traduz o `spec.md` em decisões técnicas concretas, antes de gerar as tarefas de
> implementação (`tasks.md`). Segue a técnica **SDD (Spec-Driven Development)**.

## 1. Arquitetura

```
┌────────────┐      HTTP       ┌──────────────────┐      SQL       ┌──────────────┐
│  Cliente   │ ───────────────▶│  API (Express)     │──────────────▶│ SQLite (file) │
│ (curl/UI)  │                 │  container Docker   │                │  volume local │
└────────────┘                 └──────────────────┘                └──────────────┘
                                          ▲
                                          │ deploy (imagem Docker)
                                  ┌───────┴────────┐
                                  │  EC2 (AWS)      │
                                  │  Docker Engine  │
                                  └─────────────────┘
```

## 2. Stack escolhida e justificativa

| Camada | Escolha | Por quê |
|--------|---------|---------|
| Linguagem/Runtime | Node.js 20 LTS | Leve, rápido de buildar, boa cobertura do SonarQube JS/TS |
| Framework HTTP | Express | Minimalista, ideal para "sistema simples" |
| Persistência | SQLite (`better-sqlite3`) | Sem servidor de banco extra → infra AWS fica em **uma única EC2** |
| Testes | Jest + Supertest | Padrão de mercado, integra bem com cobertura para o SonarQube |
| Container | Docker (multi-stage) | Mesma imagem local/produção |
| CI/CD | GitHub Actions | Repositório já está no GitHub; sem custo de infra adicional |
| SAST | SonarCloud (SonarQube gerenciado) | Zero infraestrutura extra; alternativa self-hosted via `docker-compose.sonarqube.yml` |
| IaC | Terraform | Provisiona a EC2 de forma reprodutível e versionada |

## 3. Modelo de dados

```
Task
- id: integer (PK, autoincrement)
- title: string (obrigatório, 1..120 chars)
- description: string (opcional, até 2000 chars)
- done: boolean (default false)
- created_at: datetime
- updated_at: datetime
```

## 4. Design da API (contrato)

| Método | Rota | Descrição | Status sucesso |
|--------|------|-----------|-----------------|
| GET | `/health` | Health-check | 200 |
| POST | `/tasks` | Cria tarefa | 201 |
| GET | `/tasks` | Lista tarefas (suporta `?done=true/false`) | 200 |
| GET | `/tasks/:id` | Detalha tarefa | 200 |
| PUT | `/tasks/:id` | Atualiza título/descrição | 200 |
| PATCH | `/tasks/:id/complete` | Marca como concluída | 200 |
| DELETE | `/tasks/:id` | Remove tarefa | 204 |

## 5. Estrutura de pastas

```
simple-task-api/
├── docs/            # specs, plano e tarefas (SDD)
├── src/
│   ├── app.js       # cria e exporta o app Express (sem side-effect de listen)
│   ├── db.js        # inicialização do SQLite
│   └── routes/
│       └── tasks.js
├── tests/
│   └── tasks.test.js
├── infra/           # Terraform (AWS EC2)
├── .github/workflows/ci-cd.yml
├── Dockerfile
├── docker-compose.yml
└── sonar-project.properties
```

## 6. Pipeline (visão geral)

1. **build** — instala dependências (`npm ci`).
2. **lint** — `eslint` (qualidade de código).
3. **test** — `jest --coverage` (gera `coverage/lcov.info`, usado pelo Sonar).
4. **security-scan** — `sonarqube-scan-action`, falha o pipeline se o *Quality Gate* não passar.
5. **docker-build-push** — build da imagem e push para o GitHub Container Registry (GHCR).
6. **deploy** — SSH na EC2, `docker pull` + `docker compose up -d` com a nova imagem.

Cada estágio só roda se o anterior passar — o scan de segurança é um **gate obrigatório**
antes de qualquer deploy chegar à AWS.

## 7. Infraestrutura AWS (opção escolhida: EC2 simples)

Optou-se por **uma única instância EC2** (t3.micro, elegível ao free tier) em vez de um
cluster ECS/EKS, por ser "sistema simples" (conforme enunciado). O Terraform em
`infra/` provisiona:

- 1x EC2 (Amazon Linux 2023) com Docker instalado via `user_data`.
- 1x Security Group liberando `22` (SSH), `80` (HTTP, opcional) e `3000` (API).
- 1x Elastic IP (opcional, comentado) para IP fixo.

> Evolução natural (fora do escopo atual, mas documentada): migrar o `docker run` para
> ECS Fargate ou EKS quando houver necessidade de múltiplas réplicas/auto-scaling.

## 8. Segurança

- Segredos (chaves AWS, token do Sonar) ficam em **GitHub Secrets**, nunca no código.
- Imagem Docker roda com usuário não-root (`USER node`).
- SonarQube/SonarCloud como *quality gate* obrigatório (SAST).
- Security Group da EC2 restringe a porta 22 a um CIDR configurável (não `0.0.0.0/0` em produção).

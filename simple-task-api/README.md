# simple-task-api

API simples de gerenciamento de tarefas, usada como projeto-exemplo do ciclo completo:
**SDD → código → testes → pipeline CI/CD → scan de segurança (SonarQube) → deploy na AWS (EC2)**.

## Sumário
1. [Metodologia SDD usada neste projeto](#1-metodologia-sdd-usada-neste-projeto)
2. [Rodando localmente](#2-rodando-localmente)
3. [Passo a passo: criar o repositório no GitHub](#3-passo-a-passo-criar-o-repositório-no-github)
4. [Pipeline CI/CD (GitHub Actions)](#4-pipeline-cicd-github-actions)
5. [Scanner de segurança (SonarQube)](#5-scanner-de-segurança-sonarqube)
6. [Provisionar a AWS (Terraform + EC2)](#6-provisionar-a-aws-terraform--ec2)
7. [Conectar a pipeline à EC2](#7-conectar-a-pipeline-à-ec2)
8. [Checklist final de entrega](#8-checklist-final-de-entrega)

---

## 1. Metodologia SDD usada neste projeto

Todo o desenvolvimento seguiu **Spec-Driven Development (SDD)**: a especificação e o
plano foram escritos *antes* do código, e o código é apenas a execução das tarefas
derivadas deles. Veja em ordem:

- [`docs/spec.md`](docs/spec.md) — **O quê** e **por quê** (requisitos, histórias de usuário, critérios de aceitação).
- [`docs/plan.md`](docs/plan.md) — **Como** (arquitetura, stack, contrato de API, modelo de dados).
- [`docs/tasks.md`](docs/tasks.md) — lista de tarefas atômicas derivadas do plano, cada uma rastreável até uma história de usuário.

Qualquer mudança de escopo deve primeiro ser refletida no `spec.md`, propagada ao
`plan.md` e só então desdobrada em novas tarefas — nessa ordem.

## 2. Rodando localmente

```bash
npm install
npm test              # roda os testes com cobertura
npm start              # sobe em http://localhost:3000

# ou, via Docker:
docker compose up --build
```

Teste rápido:
```bash
curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" \
  -d '{"title":"Minha primeira tarefa"}'
curl http://localhost:3000/tasks
```

## 3. Passo a passo: criar o repositório no GitHub


```bash
# dentro da pasta do projeto
git init
git add .
git commit -m "chore: bootstrap do projeto via SDD (spec, plan, tasks, código, infra)"


> Alternativa: `gh repo create simple-task-api --public --source=. --push` se tiver a
> GitHub CLI instalada e autenticada.

## 4. Pipeline CI/CD (GitHub Actions)

O workflow [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml) roda em todo
push/PR para `main`, com 4 estágios sequenciais (cada um só roda se o anterior passar):

```
build-test → security-scan (SonarQube) → docker-build-push (GHCR) → deploy (EC2)
```

Configure em **Settings → Secrets and variables → Actions** do repositório:

| Secret | Descrição |
|--------|-----------|
| `SONAR_TOKEN` | Token gerado no SonarCloud/SonarQube |
| `SONAR_HOST_URL` | (opcional) URL do seu SonarQube self-hosted; se omitido, usa SonarCloud |
| `EC2_HOST` | IP público da instância (saída `instance_public_ip` do Terraform) |
| `EC2_USER` | `ec2-user` (padrão da AMI Amazon Linux) |
| `EC2_SSH_KEY` | Conteúdo da chave privada `.pem` usada para SSH |

> `GITHUB_TOKEN` já é fornecido automaticamente pelo GitHub Actions — não precisa criar.

## 5. Scanner de segurança (SonarQube)

Conforme discutido em aula, o scan é um **gate obrigatório**: se o *Quality Gate* falhar,
o job `security-scan` falha e as etapas seguintes (`docker-build-push`, `deploy`) **não
executam** — nenhum código com vulnerabilidades/bugs críticos chega à AWS.

**Opção A — SonarCloud (gerenciado, recomendado para o exercício)**
1. Acesse https://sonarcloud.io e faça login com sua conta GitHub.
2. Importe o repositório (`+` → *Analyze new project*).
3. Gere um token em *My Account → Security* e cadastre como secret `SONAR_TOKEN`.
4. Ajuste `sonar.organization` em [`sonar-project.properties`](sonar-project.properties)
   para a sua organização no SonarCloud.

**Opção B — SonarQube self-hosted (o mesmo usado em aula, se aplicável)**
```bash
docker compose -f docker-compose.sonarqube.yml up -d
# acesse http://localhost:9000 (admin/admin) e troque a senha
# crie um token e cadastre EC2_HOST... digo, cadastre SONAR_TOKEN e SONAR_HOST_URL nos secrets
```
Nesse caso, defina o secret `SONAR_HOST_URL` apontando para o seu servidor (precisa
estar acessível pela internet, por exemplo hospedado na mesma EC2 ou outra instância).

## 6. Provisionar a AWS (Terraform + EC2)

Optou-se por **uma EC2 simples** (não um cluster) por se tratar de um sistema simples,
conforme o enunciado — a evolução para ECS/EKS fica documentada em `docs/plan.md`.

O projeto suporta tanto uma **conta AWS normal** quanto o **AWS Academy Learner Lab**
(veja a seção 6.1 se for o seu caso — a AWS Academy tem restrições específicas de
credenciais e permissões).

### 6.0 Conta AWS normal (credenciais permanentes)

```bash
cd infra
terraform init

# crie um key pair na AWS antes, se ainda não tiver:
# aws ec2 create-key-pair --key-name minha-chave --query 'KeyMaterial' --output text > minha-chave.pem
# chmod 400 minha-chave.pem

terraform plan -var="key_pair_name=minha-chave"
terraform apply -var="key_pair_name=minha-chave"
```

### 6.1 AWS Academy Learner Lab (credenciais temporárias)

O Learner Lab não permite criar usuários/roles IAM nem key pairs novos, e as
credenciais expiram a cada sessão (~4h). Ajustes necessários:

1. No painel do curso, clique **Start Lab** e espere o círculo verde.
2. Clique em **AWS Details → Show** (ou **AWS CLI**) para ver `aws_access_key_id`,
   `aws_secret_access_key` e `aws_session_token`.
3. Cole essas três credenciais em `~/.aws/credentials`:
   ```ini
   [default]
   aws_access_key_id = ...
   aws_secret_access_key = ...
   aws_session_token = ...
   ```
4. Baixe o key pair padrão do lab (**AWS Details → SSH Key → Download PEM**, só
   precisa na primeira vez) e salve como `vockey.pem`; depois `chmod 400 vockey.pem`.
5. Rode o Terraform — `key_pair_name` já tem `vockey` como padrão, e `instance_type`
   já usa `t2.micro` (liberado pela política do lab):
   ```bash
   cd infra
   terraform init
   terraform apply
   ```

**Importante sobre a duração da sessão:**
- Quando as credenciais expiram, comandos `terraform` novos passam a falhar com erro
  de autenticação — não é preciso recriar a infraestrutura, basta repetir o passo 2-3
  para pegar um `aws_session_token` novo antes do próximo `terraform apply/destroy`.
- Ao clicar **Stop Lab**, as instâncias EC2 são desligadas mas **não são destruídas**
  (o estado do Terraform continua válido). Ao dar **Start Lab** de novo, o IP público
  pode mudar — atualize o secret `EC2_HOST` no GitHub caso isso aconteça.
- **A automação total da pipeline fica limitada pela sessão de 4h**: o job `deploy`
  do GitHub Actions só funciona enquanto `EC2_HOST`/`EC2_SSH_KEY` apontarem para uma
  instância que esteja de pé. Para uma demonstração em aula, isso não é problema —
  para algo "always-on", seria necessário uma conta AWS normal.

Para destruir tudo depois do exercício:
```bash
terraform destroy
```

## 7. Conectar a pipeline à EC2

1. Rode o Terraform (passo 6) e copie `instance_public_ip`.
2. Cadastre `EC2_HOST`, `EC2_USER=ec2-user` e `EC2_SSH_KEY` (conteúdo do `.pem`) como
   secrets do repositório.
3. Dê `git push` na branch `main` — a pipeline builda, testa, escaneia, publica a
   imagem no GHCR e faz o deploy via SSH automaticamente.
4. Acesse `http://<EC2_HOST>:3000/health` para confirmar que subiu.

## 8. Checklist final de entrega

- [x] Especificação, plano e tarefas SDD em `docs/`
- [x] Sistema simples implementado e testado (`src/`, `tests/`)
- [x] Infraestrutura como código para AWS EC2 (`infra/`)
- [x] Pipeline de CI/CD (GitHub Actions) em `.github/workflows/ci-cd.yml`
- [x] Scanner de segurança (SonarQube) como gate obrigatório antes do deploy
- [x] `git push` para um repositório GitHub seu (passo manual, seção 3)
- [ ] `terraform apply` na sua conta AWS (passo manual, seção 6)
- [ ] Secrets cadastrados no repositório (passo manual, seção 4/7)

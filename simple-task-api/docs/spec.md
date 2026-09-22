# Especificação — Task API (Fase 1: Specify)

> Documento de especificação funcional, escrito **antes** de qualquer linha de código,
> conforme a técnica **SDD (Spec-Driven Development)**. Toda alteração de escopo deve
> primeiro ser refletida aqui.

## 1. Objetivo

Construir um sistema simples de gerenciamento de tarefas (Task API), exposto como
uma API REST, que sirva como projeto-piloto para demonstrar todo o ciclo:
especificação → planejamento → tarefas → implementação → pipeline CI/CD →
scan de segurança → deploy em nuvem (AWS).

## 2. Escopo

**Dentro do escopo**
- CRUD de tarefas (criar, listar, buscar por id, atualizar, marcar como concluída, remover).
- Persistência simples (SQLite em arquivo, sem necessidade de serviço externo).
- Validação básica de entrada.
- Testes automatizados (unitários e de integração da API).
- Containerização (Docker).
- Pipeline de CI/CD com scan de segurança (SonarQube/SonarCloud).
- Infraestrutura como código para publicar em uma instância EC2 da AWS.

**Fora do escopo**
- Autenticação/autorização de usuários (multiusuário).
- Interface gráfica (frontend). O sistema é apenas a API.
- Alta disponibilidade / múltiplas réplicas / balanceamento (fica como próximo passo,
  citado no README como evolução para ECS/EKS).

## 3. Histórias de usuário

| ID | Como... | Eu quero... | Para que... |
|----|---------|-------------|-------------|
| US-01 | usuário da API | criar uma nova tarefa com título e descrição | eu possa registrar algo que preciso fazer |
| US-02 | usuário da API | listar todas as tarefas | eu tenha visão geral do que está pendente/concluído |
| US-03 | usuário da API | consultar uma tarefa específica pelo id | eu veja detalhes de um item |
| US-04 | usuário da API | atualizar título/descrição de uma tarefa | eu corrija ou detalhe melhor o item |
| US-05 | usuário da API | marcar uma tarefa como concluída | eu acompanhe meu progresso |
| US-06 | usuário da API | remover uma tarefa | eu limpe itens que não fazem mais sentido |
| US-07 | operador do sistema | que todo commit passe por testes e scan de segurança | erros e vulnerabilidades sejam barrados antes do deploy |

## 4. Critérios de aceitação (resumo)

- `POST /tasks` sem `title` deve retornar `400`.
- `GET /tasks/:id` para id inexistente deve retornar `404`.
- Tarefa criada deve iniciar com `done = false`.
- `PATCH /tasks/:id/complete` deve alternar/definir `done = true`.
- Toda resposta de erro deve conter um corpo JSON com campo `error`.
- `GET /health` deve retornar `200` para uso em health-check do balanceador/CI.

## 5. Requisitos não funcionais

- **Simplicidade**: rodar com `docker compose up` sem dependências externas.
- **Portabilidade**: mesma imagem Docker roda local e na EC2.
- **Segurança**: nenhum segredo em código; scan estático (SAST) obrigatório no pipeline
  antes de qualquer deploy; imagem Docker não roda como root.
- **Observabilidade mínima**: endpoint `/health` e logs estruturados no stdout (para
  serem coletados pelo Docker/CloudWatch).

## 6. Restrições

- Stack: Node.js (LTS) + Express, por ser leve e permitir SQLite embarcado sem servidor
  de banco separado, mantendo a infraestrutura AWS simples (uma única EC2).
- Pipeline deve rodar em GitHub Actions (ferramenta escolhida entre as sugeridas).
- Scanner de segurança: SonarQube (via SonarCloud, quota gratuita para repositórios
  públicos) — alternativa self-hosted documentada em `docs/plan.md`.

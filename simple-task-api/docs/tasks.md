# Tarefas de Implementação (Fase 3: Tasks)

> Gerado a partir de `plan.md`. Cada tarefa referencia a história de usuário (US-xx)
> do `spec.md` que ela implementa. Marcadas como concluídas neste projeto de exemplo.

- [x] **T001** — Setup do projeto Node.js (`package.json`, dependências, scripts) — infra base
- [x] **T002** — Camada de persistência SQLite (`src/db.js`) — infra base
- [x] **T003** — Rota `POST /tasks` com validação de `title` — US-01
- [x] **T004** — Rota `GET /tasks` (+ filtro `?done=`) — US-02
- [x] **T005** — Rota `GET /tasks/:id` (+ 404) — US-03
- [x] **T006** — Rota `PUT /tasks/:id` — US-04
- [x] **T007** — Rota `PATCH /tasks/:id/complete` — US-05
- [x] **T008** — Rota `DELETE /tasks/:id` — US-06
- [x] **T009** — Endpoint `GET /health` — RNF observabilidade
- [x] **T010** — Testes automatizados (Jest + Supertest) cobrindo os critérios de aceitação — US-07
- [x] **T011** — `Dockerfile` multi-stage, usuário não-root
- [x] **T012** — `docker-compose.yml` para rodar local
- [x] **T013** — Configuração do ESLint
- [x] **T014** — `sonar-project.properties` (config do scan)
- [x] **T015** — Pipeline GitHub Actions: build → lint → test → sonar scan → build/push imagem → deploy EC2 — US-07
- [x] **T016** — Terraform (`infra/`) para provisionar a EC2 na AWS
- [x] **T017** — `README.md` com passo a passo de uso, deploy e execução do scan

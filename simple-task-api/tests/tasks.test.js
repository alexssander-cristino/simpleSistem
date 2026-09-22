const request = require('supertest');
const fs = require('fs');
const { createApp } = require('../src/app');

const TEST_DB = `${__dirname}/test-${process.pid}.sqlite`;

let app;

beforeAll(() => {
  app = createApp(TEST_DB);
});

afterAll(() => {
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});

describe('Health', () => {
  test('GET /health retorna 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('POST /tasks (US-01)', () => {
  test('cria tarefa válida com done=false', async () => {
    const res = await request(app).post('/tasks').send({ title: 'Estudar SDD' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Estudar SDD');
    expect(res.body.done).toBe(false);
  });

  test('rejeita sem title (400)', async () => {
    const res = await request(app).post('/tasks').send({ description: 'sem título' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

describe('GET /tasks (US-02)', () => {
  test('lista tarefas criadas', async () => {
    await request(app).post('/tasks').send({ title: 'Tarefa A' });
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe('GET /tasks/:id (US-03)', () => {
  test('retorna 404 para id inexistente', async () => {
    const res = await request(app).get('/tasks/999999');
    expect(res.status).toBe(404);
  });

  test('retorna a tarefa correta', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Buscar isso' });
    const res = await request(app).get(`/tasks/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Buscar isso');
  });
});

describe('PUT /tasks/:id (US-04)', () => {
  test('atualiza título', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Original' });
    const res = await request(app).put(`/tasks/${created.body.id}`).send({ title: 'Atualizado' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Atualizado');
  });
});

describe('PATCH /tasks/:id/complete (US-05)', () => {
  test('marca tarefa como concluída', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Concluir' });
    const res = await request(app).patch(`/tasks/${created.body.id}/complete`);
    expect(res.status).toBe(200);
    expect(res.body.done).toBe(true);
  });
});

describe('DELETE /tasks/:id (US-06)', () => {
  test('remove tarefa existente', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Remover' });
    const res = await request(app).delete(`/tasks/${created.body.id}`);
    expect(res.status).toBe(204);

    const check = await request(app).get(`/tasks/${created.body.id}`);
    expect(check.status).toBe(404);
  });
});

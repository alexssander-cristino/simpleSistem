const express = require('express');

function tasksRouter(db) {
  const router = express.Router();

  const MAX_TITLE = 120;
  const MAX_DESC = 2000;

  function serialize(row) {
    return { ...row, done: Boolean(row.done) };
  }

  // POST /tasks — US-01
  router.post('/', (req, res) => {
    const { title, description } = req.body || {};

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'title é obrigatório' });
    }
    if (title.length > MAX_TITLE) {
      return res.status(400).json({ error: `title deve ter no máximo ${MAX_TITLE} caracteres` });
    }
    if (description && description.length > MAX_DESC) {
      return res.status(400).json({ error: `description deve ter no máximo ${MAX_DESC} caracteres` });
    }

    const stmt = db.prepare(
      'INSERT INTO tasks (title, description) VALUES (?, ?)'
    );
    const info = stmt.run(title.trim(), description || null);
    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid);

    return res.status(201).json(serialize(row));
  });

  // GET /tasks — US-02
  router.get('/', (req, res) => {
    const { done } = req.query;
    let rows;

    if (done === 'true' || done === 'false') {
      rows = db.prepare('SELECT * FROM tasks WHERE done = ? ORDER BY id').all(done === 'true' ? 1 : 0);
    } else {
      rows = db.prepare('SELECT * FROM tasks ORDER BY id').all();
    }

    return res.json(rows.map(serialize));
  });

  // GET /tasks/:id — US-03
  router.get('/:id', (req, res) => {
    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'tarefa não encontrada' });
    return res.json(serialize(row));
  });

  // PUT /tasks/:id — US-04
  router.put('/:id', (req, res) => {
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'tarefa não encontrada' });

    const { title, description } = req.body || {};
    const newTitle = title !== undefined ? title : existing.title;
    const newDescription = description !== undefined ? description : existing.description;

    if (!newTitle || !newTitle.trim()) {
      return res.status(400).json({ error: 'title não pode ser vazio' });
    }

    db.prepare(
      "UPDATE tasks SET title = ?, description = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(newTitle.trim(), newDescription, req.params.id);

    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    return res.json(serialize(row));
  });

  // PATCH /tasks/:id/complete — US-05
  router.patch('/:id/complete', (req, res) => {
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'tarefa não encontrada' });

    db.prepare(
      "UPDATE tasks SET done = 1, updated_at = datetime('now') WHERE id = ?"
    ).run(req.params.id);

    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    return res.json(serialize(row));
  });

  // DELETE /tasks/:id — US-06
  router.delete('/:id', (req, res) => {
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'tarefa não encontrada' });

    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    return res.status(204).send();
  });

  return router;
}

module.exports = tasksRouter;

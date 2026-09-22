const express = require('express');
const { createDb } = require('./db');
const tasksRouter = require('./routes/tasks');

function createApp(dbPath) {
  const app = express();
  app.use(express.json());

  const db = createDb(dbPath);

  app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
  app.use('/tasks', tasksRouter(db));

  // handler genérico de erro — nunca vaza stack trace ao cliente
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'erro interno' });
  });

  return app;
}

module.exports = { createApp };

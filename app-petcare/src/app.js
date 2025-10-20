import express from 'express';
import morgan from 'morgan';
import petsRouter from './routes/pets.js';
import * as logger from './utils/logger.js';

const app = express();
const INSTANCE = process.env.INSTANCE || 'local';

app.use(morgan('dev'));
app.use(express.json());

app.use('/pets', petsRouter);

app.get('/ping', (_req, res) => {
  res.json({ ok: true, instance: INSTANCE, pid: process.pid });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use((req, res) => {
  logger.warn('Route not found.', { method: req.method, path: req.originalUrl });
  res.status(404).json({ message: 'Route not found.' });
});

app.use((err, _req, res, _next) => {
  logger.error('Unhandled error caught by middleware.', { message: err.message, stack: err.stack });

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }

  const statusCode = err.statusCode || 500;
  const payload = {
    message: statusCode === 500 ? 'Internal server error.' : err.message || 'An unexpected error occurred.'
  };

  if (Array.isArray(err.errors) && err.errors.length > 0) {
    payload.errors = err.errors;
  }

  return res.status(statusCode).json(payload);
});

export default app;

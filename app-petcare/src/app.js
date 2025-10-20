import express from 'express';
import morgan from 'morgan';
import petsRouter from './routes/pets.js';

const app = express();

app.use(morgan('dev'));
app.use(express.json());

app.use('/pets', petsRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.use((err, _req, res, _next) => {
  console.error(err);

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

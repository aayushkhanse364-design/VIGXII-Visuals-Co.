import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import uploadRoutes from './routes/uploadRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'dynamic-portfolio-api' });
});

app.use('/upload', uploadRoutes);
app.use('/projects', projectRoutes);
app.use('/categories', categoryRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import * as Sentry from '@sentry/node';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { logger } from './config/logger';

// Routes
import authRoutes from './routes/auth';
import inspectionRoutes from './routes/inspections';
import caseRoutes from './routes/cases';
import documentRoutes from './routes/documents';
import photoRoutes from './routes/photos';
import vinRoutes from './routes/vin';
import billingRoutes from './routes/billing';
import webhookRoutes from './routes/webhooks';
import teamRoutes from './routes/team';
import integrationRoutes from './routes/integrations';

// Workers
import './workers/aiWorker';

const app = express();

// ── Sentry (must be first) ─────────────────────────────────────
if (env.SENTRY_DSN) {
  Sentry.init({ dsn: env.SENTRY_DSN, environment: env.NODE_ENV });
}

// ── Security & middleware ──────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(compression());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// ── Webhooks need raw body BEFORE json parser ──────────────────
app.use('/api/webhooks', express.raw({ type: 'application/json' }));

// ── Body parsing ───────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate limiting ──────────────────────────────────────────────
app.use('/api', rateLimiter);

// ── Health check ───────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: process.env.npm_package_version, env: env.NODE_ENV });
});

// ── API routes ─────────────────────────────────────────────────
const api = '/api/v1';
app.use(`${api}/auth`,         authRoutes);
app.use(`${api}/inspections`,  inspectionRoutes);
app.use(`${api}/cases`,        caseRoutes);
app.use(`${api}/documents`,    documentRoutes);
app.use(`${api}/photos`,       photoRoutes);
app.use(`${api}/vin`,          vinRoutes);
app.use(`${api}/billing`,      billingRoutes);
app.use('/api/webhooks',       webhookRoutes);
app.use(`${api}/team`,         teamRoutes);
app.use(`${api}/integrations`, integrationRoutes);

// ── Error handling ────────────────────────────────────────────
if (env.SENTRY_DSN) Sentry.setupExpressErrorHandler(app);
app.use(errorHandler);

// ── 404 ────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// ── Start ──────────────────────────────────────────────────────
app.listen(env.PORT, () => {
  logger.info(`VIA Backend running on port ${env.PORT} [${env.NODE_ENV}]`);
  logger.info(`Claude model: ${env.CLAUDE_MODEL}`);
});

export default app;

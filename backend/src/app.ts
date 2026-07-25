import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { publicRouter } from './routes/public.js';
import { adminRouter } from './routes/admin.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

export function createApp() {
  const app = express();

  // Normalize configured origins (trim + drop any trailing slash) so a value like
  // "https://app.vercel.app/" still matches the browser's slash-less Origin header.
  const stripSlash = (s: string) => s.trim().replace(/\/+$/, '');
  const allowedOrigins = env.corsOrigin
    .split(',')
    .map(stripSlash)
    .filter(Boolean);

  app.use(
    cors({
      origin:
        env.corsOrigin === '*'
          ? true
          : (origin, callback) => {
              // Allow non-browser clients (no Origin header) and any configured match.
              if (!origin || allowedOrigins.includes(stripSlash(origin))) {
                return callback(null, true);
              }
              return callback(null, false);
            },
    })
  );
  app.use(express.json({ limit: '1mb' }));
  if (env.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api', publicRouter);
  app.use('/api/admin', adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

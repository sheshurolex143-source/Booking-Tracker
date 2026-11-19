import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { connectDatabase, isMongoConnected } from './server/db/connect';
import { apiErrorHandler, apiNotFoundHandler } from './server/middleware/errorHandler';
import { ensureSeededDatabase } from './server/repositories/store';
import cancellationsRouter from './server/routes/cancellations';
import settingsRouter from './server/routes/settings';

const PORT = Number(process.env.PORT) || 3000;

async function startServer(): Promise<void> {
  await connectDatabase();
  await ensureSeededDatabase();

  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      database: isMongoConnected() ? 'mongodb' : 'local-json',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/cancellations', cancellationsRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api', apiNotFoundHandler);
  app.use(apiErrorHandler);

  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[server] Booking Cancellation Tracker running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[server] Fatal startup error:', err);
  process.exit(1);
});

import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env, isSiteReadOnly, siteCloseAt } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { fail, ok } from './lib/http.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { adminRouter } from './routes/admin.js';
import { guestRouter } from './routes/guest.js';
import { postsRouter } from './routes/posts.js';
import { reportsRouter } from './routes/reports.js';
import { siteRouter } from './routes/site.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false
    })
  );

  if (env.NODE_ENV !== 'production') {
    app.use(
      cors({
        origin: env.CLIENT_ORIGIN,
        credentials: true
      })
    );
  }

  app.use(express.json({ limit: '128kb' }));
  app.use(cookieParser(env.COOKIE_SECRET));

  app.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      ok(res, {
        status: 'ok',
        siteName: env.SITE_NAME,
        readOnly: isSiteReadOnly(),
        siteCloseAt: siteCloseAt.toISOString()
      });
    } catch {
      fail(res, 503, 'DB_UNAVAILABLE', 'Database belum siap');
    }
  });

  app.use('/api/guest', guestRouter);
  app.use('/api/site', siteRouter);
  app.use('/api/posts', postsRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/admin', adminRouter);

  app.use('/api', notFoundHandler);

  const clientDist = process.env.CLIENT_DIST_DIR || path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist, { maxAge: env.NODE_ENV === 'production' ? '1h' : 0 }));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'), (error) => {
      if (error) {
        fail(res, 404, 'CLIENT_NOT_BUILT', 'Frontend belum dibuild');
      }
    });
  });

  app.use(errorHandler);

  return app;
}

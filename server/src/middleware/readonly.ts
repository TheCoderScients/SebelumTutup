import type { RequestHandler } from 'express';
import { isSiteReadOnly } from '../config/env.js';
import { AppError } from '../lib/http.js';

export const requireWritableSite: RequestHandler = (_req, _res, next) => {
  if (isSiteReadOnly()) {
    next(new AppError(403, 'SITE_READ_ONLY', 'Demo sudah ditutup. Aksi baru sudah dinonaktifkan.'));
    return;
  }
  next();
};

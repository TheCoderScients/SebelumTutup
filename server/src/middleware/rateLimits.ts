import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const jsonLimitResponse = {
  success: false,
  error: {
    code: 'RATE_LIMITED',
    message: 'Terlalu cepat. Tunggu sebentar lalu coba lagi.'
  }
};

export const createPostLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_POSTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonLimitResponse
});

export const createCommentLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_COMMENTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonLimitResponse
});

export const reportLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REPORTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonLimitResponse
});

export const adminLoginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'LOGIN_RATE_LIMITED',
      message: 'Terlalu banyak percobaan login. Coba lagi nanti.'
    }
  }
});

import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError, fail } from '../lib/http.js';

export const notFoundHandler: RequestHandler = (req, res) => {
  fail(res, 404, 'NOT_FOUND', `Route ${req.method} ${req.path} tidak ditemukan`);
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    fail(res, error.statusCode, error.code, error.message, error.details);
    return;
  }

  if (error instanceof ZodError) {
    fail(res, 400, 'VALIDATION_ERROR', 'Input tidak valid', error.flatten());
    return;
  }

  console.error('[server:error]', error);
  fail(res, 500, 'INTERNAL_ERROR', 'Ada error di server');
};

import type { CookieOptions, RequestHandler } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { AppError } from '../lib/http.js';

const ADMIN_COOKIE = 'admin_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

const sessions = new Map<string, { createdAt: number; expiresAt: number }>();
const adminPasswordHashPromise = bcrypt.hash(env.ADMIN_PASSWORD, 12);

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    signed: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_MS,
    path: '/'
  };
}

function pruneSessions() {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (session.expiresAt <= now) sessions.delete(id);
  }
}

export async function verifyAdminPassword(password: string) {
  const hash = await adminPasswordHashPromise;
  return bcrypt.compare(password, hash);
}

export function createAdminSession() {
  pruneSessions();
  const id = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  sessions.set(id, {
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS
  });
  return id;
}

export function setAdminCookie(res: Parameters<RequestHandler>[1], sessionId: string) {
  res.cookie(ADMIN_COOKIE, sessionId, cookieOptions());
}

export function clearAdminCookie(res: Parameters<RequestHandler>[1]) {
  res.clearCookie(ADMIN_COOKIE, { path: '/' });
}

export const requireAdmin: RequestHandler = (req, _res, next) => {
  pruneSessions();
  const sessionId = typeof req.signedCookies?.[ADMIN_COOKIE] === 'string' ? req.signedCookies[ADMIN_COOKIE] : null;
  const session = sessionId ? sessions.get(sessionId) : null;

  if (!session) {
    next(new AppError(401, 'ADMIN_REQUIRED', 'Login admin diperlukan'));
    return;
  }

  session.expiresAt = Date.now() + SESSION_TTL_MS;
  req.adminSessionId = sessionId ?? undefined;
  next();
};

export function destroyAdminSession(sessionId?: string) {
  if (sessionId) sessions.delete(sessionId);
}

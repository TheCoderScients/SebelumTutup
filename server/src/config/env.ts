import 'dotenv/config';
import { z } from 'zod';

const numberFromEnv = (fallback: number) =>
  z
    .string()
    .optional()
    .transform((value) => {
      if (!value) return fallback;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: numberFromEnv(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL wajib diisi'),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  SITE_NAME: z.string().min(1).default('SebelumTutup'),
  SITE_CLOSE_AT: z
    .string()
    .min(1)
    .refine((value) => !Number.isNaN(Date.parse(value)), 'SITE_CLOSE_AT harus tanggal ISO yang valid'),
  ADMIN_USERNAME: z.string().min(1),
  ADMIN_PASSWORD: z.string().min(8),
  SESSION_SECRET: z.string().min(16),
  COOKIE_SECRET: z.string().min(16),
  RATE_LIMIT_WINDOW_MS: numberFromEnv(60_000),
  RATE_LIMIT_MAX_POSTS: numberFromEnv(8),
  RATE_LIMIT_MAX_COMMENTS: numberFromEnv(20),
  RATE_LIMIT_MAX_REPORTS: numberFromEnv(10)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  throw new Error(`Konfigurasi env tidak valid: ${formatted}`);
}

export const env = parsed.data;
export const siteCloseAt = new Date(env.SITE_CLOSE_AT);

export function isSiteReadOnly(now = new Date()) {
  return now.getTime() >= siteCloseAt.getTime();
}

import { z } from 'zod';
import { POST_CATEGORIES, REACTION_EMOJIS } from './constants.js';
import { cleanMultiline, cleanText } from './sanitize.js';

export const nicknameSchema = z
  .string()
  .optional()
  .nullable()
  .transform((value) => (value ? cleanText(value).slice(0, 30) : null))
  .refine((value) => value === null || value.length >= 2, 'Nickname minimal 2 karakter');

export const bootstrapSchema = z.object({
  nickname: nicknameSchema,
  isAnonymous: z.boolean().optional()
});

export const postCreateSchema = z.object({
  title: z
    .string()
    .transform((value) => cleanText(value).slice(0, 80))
    .refine((value) => value.length >= 3, 'Judul minimal 3 karakter')
    .refine((value) => value.length <= 80, 'Judul maksimal 80 karakter'),
  body: z
    .string()
    .transform((value) => cleanMultiline(value).slice(0, 500))
    .refine((value) => value.length >= 5, 'Isi minimal 5 karakter')
    .refine((value) => value.length <= 500, 'Isi maksimal 500 karakter'),
  category: z.enum(POST_CATEGORIES),
  displayMode: z.enum(['nickname', 'anonymous']).default('anonymous')
});

export const commentCreateSchema = z.object({
  body: z
    .string()
    .transform((value) => cleanMultiline(value).slice(0, 300))
    .refine((value) => value.length >= 2, 'Komentar minimal 2 karakter')
    .refine((value) => value.length <= 300, 'Komentar maksimal 300 karakter'),
  displayMode: z.enum(['nickname', 'anonymous']).default('anonymous')
});

export const reactionToggleSchema = z.object({
  emoji: z.enum(REACTION_EMOJIS)
});

export const voteSchema = z.object({
  value: z.union([z.literal(-1), z.literal(0), z.literal(1)])
});

export const reportSchema = z.object({
  targetType: z.enum(['post', 'comment']),
  targetId: z.string().min(5).max(80),
  reason: z
    .string()
    .transform((value) => cleanText(value).slice(0, 180))
    .refine((value) => value.length >= 4, 'Alasan minimal 4 karakter')
    .refine((value) => value.length <= 180, 'Alasan maksimal 180 karakter')
});

export const listPostsQuerySchema = z.object({
  sort: z.enum(['new', 'trending', 'active']).default('new'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(30).default(12),
  category: z.enum(POST_CATEGORIES).optional()
});

export const adminLoginSchema = z.object({
  username: z.string().min(1).max(80),
  password: z.string().min(1).max(200)
});

export const resolveReportSchema = z.object({
  note: z
    .string()
    .optional()
    .transform((value) => (value ? cleanText(value).slice(0, 180) : undefined))
});

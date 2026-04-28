import { Router } from 'express';
import { ok } from '../lib/http.js';
import { bootstrapSchema } from '../lib/validation.js';
import { resolveGuestSession } from '../middleware/guest.js';

export const guestRouter = Router();

guestRouter.post('/bootstrap', async (req, res, next) => {
  try {
    const input = bootstrapSchema.parse(req.body ?? {});
    const guest = await resolveGuestSession(req, res, input);
    ok(res, {
      id: guest.id,
      nickname: guest.nickname,
      isAnonymous: guest.isAnonymous,
      createdAt: guest.createdAt.toISOString(),
      lastSeenAt: guest.lastSeenAt.toISOString()
    });
  } catch (error) {
    next(error);
  }
});

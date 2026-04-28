import { Router } from 'express';
import { AppError, ok } from '../lib/http.js';
import { prisma } from '../lib/prisma.js';
import { reportSchema } from '../lib/validation.js';
import { ensureGuest } from '../middleware/guest.js';
import { reportLimiter } from '../middleware/rateLimits.js';

export const reportsRouter = Router();

reportsRouter.post('/', ensureGuest, reportLimiter, async (req, res, next) => {
  try {
    const input = reportSchema.parse(req.body);
    if (!req.guestSession) throw new AppError(401, 'GUEST_REQUIRED', 'Guest session belum siap');

    if (input.targetType === 'post') {
      const post = await prisma.post.findFirst({ where: { id: input.targetId, deletedAt: null } });
      if (!post) throw new AppError(404, 'TARGET_NOT_FOUND', 'Post tidak ditemukan');
    } else {
      const comment = await prisma.comment.findFirst({ where: { id: input.targetId, deletedAt: null } });
      if (!comment) throw new AppError(404, 'TARGET_NOT_FOUND', 'Komentar tidak ditemukan');
    }

    const report = await prisma.report.create({
      data: {
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason,
        reporterGuestSessionId: req.guestSession.id
      }
    });

    ok(
      res,
      {
        id: report.id,
        status: report.status,
        createdAt: report.createdAt.toISOString()
      },
      201
    );
  } catch (error) {
    next(error);
  }
});

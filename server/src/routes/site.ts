import { Router } from 'express';
import { env, isSiteReadOnly, siteCloseAt } from '../config/env.js';
import { ok } from '../lib/http.js';
import { prisma } from '../lib/prisma.js';
import { getOnlineCount } from '../realtime/socket.js';

export const siteRouter = Router();

siteRouter.get('/stats', async (_req, res, next) => {
  try {
    const [postCount, commentCount, reactionCount, reportCount] = await Promise.all([
      prisma.post.count({ where: { deletedAt: null } }),
      prisma.comment.count({ where: { deletedAt: null } }),
      prisma.postReaction.count(),
      prisma.report.count({ where: { status: 'open' } })
    ]);

    ok(res, {
      siteName: env.SITE_NAME,
      siteCloseAt: siteCloseAt.toISOString(),
      readOnly: isSiteReadOnly(),
      stats: {
        posts: postCount,
        comments: commentCount,
        reactions: reactionCount,
        openReports: reportCount,
        onlineUsers: getOnlineCount()
      }
    });
  } catch (error) {
    next(error);
  }
});

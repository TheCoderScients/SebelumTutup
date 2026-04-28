import { Router } from 'express';
import { env } from '../config/env.js';
import { AppError, ok } from '../lib/http.js';
import { prisma } from '../lib/prisma.js';
import { adminLoginSchema, resolveReportSchema } from '../lib/validation.js';
import { adminLoginLimiter } from '../middleware/rateLimits.js';
import {
  clearAdminCookie,
  createAdminSession,
  destroyAdminSession,
  requireAdmin,
  setAdminCookie,
  verifyAdminPassword
} from '../middleware/admin.js';
import { emitPostDeleted, emitPostUpdated } from '../realtime/socket.js';
import { getPostCard } from '../services/postService.js';

export const adminRouter = Router();

async function previewTarget(targetType: 'post' | 'comment', targetId: string) {
  if (targetType === 'post') {
    const post = await prisma.post.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        title: true,
        body: true,
        displayName: true,
        isAnonymous: true,
        deletedAt: true,
        createdAt: true
      }
    });
    if (!post) return null;
    return {
      id: post.id,
      type: 'post',
      title: post.title,
      body: post.body,
      displayName: post.isAnonymous ? 'Anonim' : post.displayName || 'Anonim',
      deleted: Boolean(post.deletedAt),
      createdAt: post.createdAt.toISOString()
    };
  }

  const comment = await prisma.comment.findUnique({
    where: { id: targetId },
    select: {
      id: true,
      body: true,
      displayName: true,
      isAnonymous: true,
      deletedAt: true,
      createdAt: true,
      postId: true
    }
  });
  if (!comment) return null;
  return {
    id: comment.id,
    type: 'comment',
    postId: comment.postId,
    body: comment.body,
    displayName: comment.isAnonymous ? 'Anonim' : comment.displayName || 'Anonim',
    deleted: Boolean(comment.deletedAt),
    createdAt: comment.createdAt.toISOString()
  };
}

adminRouter.post('/login', adminLoginLimiter, async (req, res, next) => {
  try {
    const input = adminLoginSchema.parse(req.body);
    const passwordOk = input.username === env.ADMIN_USERNAME && (await verifyAdminPassword(input.password));

    if (!passwordOk) {
      throw new AppError(401, 'INVALID_ADMIN_LOGIN', 'Username atau password salah');
    }

    const sessionId = createAdminSession();
    setAdminCookie(res, sessionId);
    ok(res, { username: env.ADMIN_USERNAME });
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/logout', requireAdmin, (req, res) => {
  destroyAdminSession(req.adminSessionId);
  clearAdminCookie(res);
  ok(res, { loggedOut: true });
});

adminRouter.get('/reports', requireAdmin, async (req, res, next) => {
  try {
    const status = req.query.status === 'all' ? undefined : 'open';
    const reports = await prisma.report.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        reporterGuestSession: {
          select: { id: true, nickname: true, isAnonymous: true }
        }
      }
    });

    const data = await Promise.all(
      reports.map(async (report) => ({
        id: report.id,
        targetType: report.targetType,
        targetId: report.targetId,
        reason: report.reason,
        status: report.status,
        createdAt: report.createdAt.toISOString(),
        resolvedAt: report.resolvedAt?.toISOString() ?? null,
        reporter: {
          id: report.reporterGuestSession.id,
          nickname: report.reporterGuestSession.nickname,
          isAnonymous: report.reporterGuestSession.isAnonymous
        },
        target: await previewTarget(report.targetType, report.targetId)
      }))
    );

    ok(res, { items: data });
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/reports/:id/resolve', requireAdmin, async (req, res, next) => {
  try {
    const input = resolveReportSchema.parse(req.body ?? {});
    const report = await prisma.report.findUnique({ where: { id: req.params.id } });
    if (!report) throw new AppError(404, 'REPORT_NOT_FOUND', 'Report tidak ditemukan');

    const updated = await prisma.$transaction(async (tx) => {
      const nextReport = await tx.report.update({
        where: { id: report.id },
        data: { status: 'resolved', resolvedAt: new Date() }
      });
      await tx.adminActionLog.create({
        data: {
          actionType: 'resolve_report',
          targetType: report.targetType,
          targetId: report.targetId,
          note: input.note || `Report ${report.id} ditandai selesai`
        }
      });
      return nextReport;
    });

    ok(res, { id: updated.id, status: updated.status, resolvedAt: updated.resolvedAt?.toISOString() ?? null });
  } catch (error) {
    next(error);
  }
});

adminRouter.delete('/posts/:id', requireAdmin, async (req, res, next) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: { comments: { select: { id: true } } }
    });
    if (!post) throw new AppError(404, 'POST_NOT_FOUND', 'Post tidak ditemukan');

    const commentIds = post.comments.map((comment) => comment.id);

    await prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id: post.id },
        data: { deletedAt: new Date() }
      });
      await tx.comment.updateMany({
        where: { postId: post.id, deletedAt: null },
        data: { deletedAt: new Date() }
      });
      await tx.report.updateMany({
        where: {
          OR: [
            { targetType: 'post', targetId: post.id },
            ...(commentIds.length > 0 ? [{ targetType: 'comment' as const, targetId: { in: commentIds } }] : [])
          ],
          status: 'open'
        },
        data: { status: 'resolved', resolvedAt: new Date() }
      });
      await tx.adminActionLog.create({
        data: {
          actionType: 'delete_post',
          targetType: 'post',
          targetId: post.id,
          note: `Post dan ${commentIds.length} komentar ditandai terhapus`
        }
      });
    });

    emitPostDeleted(post.id);
    ok(res, { deleted: true, postId: post.id });
  } catch (error) {
    next(error);
  }
});

adminRouter.delete('/comments/:id', requireAdmin, async (req, res, next) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.id } });
    if (!comment) throw new AppError(404, 'COMMENT_NOT_FOUND', 'Komentar tidak ditemukan');

    await prisma.$transaction(async (tx) => {
      if (!comment.deletedAt) {
        await tx.comment.update({
          where: { id: comment.id },
          data: { deletedAt: new Date() }
        });
        await tx.post.update({
          where: { id: comment.postId },
          data: {
            commentCount: { decrement: 1 },
            updatedAt: new Date()
          }
        });
      }
      await tx.report.updateMany({
        where: { targetType: 'comment', targetId: comment.id, status: 'open' },
        data: { status: 'resolved', resolvedAt: new Date() }
      });
      await tx.adminActionLog.create({
        data: {
          actionType: 'delete_comment',
          targetType: 'comment',
          targetId: comment.id,
          note: `Komentar pada post ${comment.postId} ditandai terhapus`
        }
      });
    });

    const updatedPost = await getPostCard(comment.postId);
    if (updatedPost) emitPostUpdated(comment.postId, updatedPost);
    ok(res, { deleted: true, commentId: comment.id, post: updatedPost });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/stats', requireAdmin, async (_req, res, next) => {
  try {
    const [guestCount, postCount, commentCount, reactionCount, voteCount, reportCount, openReportCount, logs] =
      await Promise.all([
        prisma.guestSession.count(),
        prisma.post.count({ where: { deletedAt: null } }),
        prisma.comment.count({ where: { deletedAt: null } }),
        prisma.postReaction.count(),
        prisma.postVote.count(),
        prisma.report.count(),
        prisma.report.count({ where: { status: 'open' } }),
        prisma.adminActionLog.findMany({ orderBy: { createdAt: 'desc' }, take: 30 })
      ]);

    ok(res, {
      stats: {
        guests: guestCount,
        posts: postCount,
        comments: commentCount,
        reactions: reactionCount,
        votes: voteCount,
        reports: reportCount,
        openReports: openReportCount
      },
      logs: logs.map((log) => ({
        id: log.id,
        actionType: log.actionType,
        targetType: log.targetType,
        targetId: log.targetId,
        note: log.note,
        createdAt: log.createdAt.toISOString()
      }))
    });
  } catch (error) {
    next(error);
  }
});

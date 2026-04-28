import { Router } from 'express';
import type { PostCategory } from '@prisma/client';
import { AppError, ok } from '../lib/http.js';
import { makeDisplayName } from '../lib/sanitize.js';
import {
  commentCreateSchema,
  listPostsQuerySchema,
  postCreateSchema,
  reactionToggleSchema,
  voteSchema
} from '../lib/validation.js';
import { prisma } from '../lib/prisma.js';
import { createCommentLimiter, createPostLimiter } from '../middleware/rateLimits.js';
import { requireWritableSite } from '../middleware/readonly.js';
import { ensureGuest } from '../middleware/guest.js';
import {
  emitCommentCreated,
  emitPostCreated,
  emitPostUpdated,
  emitReactionUpdated,
  emitVoteUpdated
} from '../realtime/socket.js';
import { getPostCard, getPostDetail, listPosts, serializeComment } from '../services/postService.js';

export const postsRouter = Router();

function requireGuestId(req: Express.Request) {
  if (!req.guestSession) {
    throw new AppError(401, 'GUEST_REQUIRED', 'Guest session belum siap');
  }
  return req.guestSession.id;
}

function getDisplayForGuest(req: Express.Request, displayMode: 'nickname' | 'anonymous') {
  const guest = req.guestSession;
  if (!guest) throw new AppError(401, 'GUEST_REQUIRED', 'Guest session belum siap');

  const isAnonymous = displayMode === 'anonymous' || !guest.nickname;
  if (displayMode === 'nickname' && !guest.nickname) {
    throw new AppError(400, 'NICKNAME_REQUIRED', 'Pilih nickname dulu sebelum tampil sebagai nickname.');
  }

  return {
    isAnonymous,
    displayName: makeDisplayName(guest.nickname, isAnonymous)
  };
}

postsRouter.get('/', ensureGuest, async (req, res, next) => {
  try {
    const query = listPostsQuerySchema.parse(req.query);
    const result = await listPosts({
      sort: query.sort,
      page: query.page,
      limit: query.limit,
      category: query.category as PostCategory | undefined,
      guestSessionId: req.guestSession?.id
    });
    ok(res, result);
  } catch (error) {
    next(error);
  }
});

postsRouter.post('/', ensureGuest, requireWritableSite, createPostLimiter, async (req, res, next) => {
  try {
    const input = postCreateSchema.parse(req.body);
    const guestSessionId = requireGuestId(req);
    const display = getDisplayForGuest(req, input.displayMode);

    const post = await prisma.post.create({
      data: {
        guestSessionId,
        displayName: display.displayName,
        isAnonymous: display.isAnonymous,
        title: input.title,
        body: input.body,
        category: input.category
      }
    });

    const card = await getPostCard(post.id, guestSessionId);
    emitPostCreated(card);
    ok(res, card, 201);
  } catch (error) {
    next(error);
  }
});

postsRouter.get('/:id', ensureGuest, async (req, res, next) => {
  try {
    const detail = await getPostDetail(req.params.id, req.guestSession?.id);
    if (!detail) throw new AppError(404, 'POST_NOT_FOUND', 'Post tidak ditemukan');
    ok(res, detail);
  } catch (error) {
    next(error);
  }
});

postsRouter.post('/:id/comments', ensureGuest, requireWritableSite, createCommentLimiter, async (req, res, next) => {
  try {
    const input = commentCreateSchema.parse(req.body);
    const guestSessionId = requireGuestId(req);
    const display = getDisplayForGuest(req, input.displayMode);
    const post = await prisma.post.findFirst({
      where: { id: req.params.id, deletedAt: null }
    });

    if (!post) throw new AppError(404, 'POST_NOT_FOUND', 'Post tidak ditemukan');

    const result = await prisma.$transaction(async (tx) => {
      const comment = await tx.comment.create({
        data: {
          postId: post.id,
          guestSessionId,
          displayName: display.displayName,
          isAnonymous: display.isAnonymous,
          body: input.body
        }
      });

      await tx.post.update({
        where: { id: post.id },
        data: {
          commentCount: { increment: 1 },
          updatedAt: new Date()
        }
      });

      return comment;
    });

    const commentDto = serializeComment(result);
    const updatedPost = await getPostCard(post.id, guestSessionId);
    emitCommentCreated(post.id, { postId: post.id, comment: commentDto });
    emitPostUpdated(post.id, updatedPost);
    ok(res, { comment: commentDto, post: updatedPost }, 201);
  } catch (error) {
    next(error);
  }
});

postsRouter.post('/:id/reactions/toggle', ensureGuest, requireWritableSite, async (req, res, next) => {
  try {
    const input = reactionToggleSchema.parse(req.body);
    const guestSessionId = requireGuestId(req);
    const post = await prisma.post.findFirst({
      where: { id: req.params.id, deletedAt: null }
    });

    if (!post) throw new AppError(404, 'POST_NOT_FOUND', 'Post tidak ditemukan');

    const existing = await prisma.postReaction.findUnique({
      where: {
        postId_guestSessionId_emoji: {
          postId: post.id,
          guestSessionId,
          emoji: input.emoji
        }
      }
    });

    await prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.postReaction.delete({ where: { id: existing.id } });
        await tx.post.update({
          where: { id: post.id },
          data: { reactionCount: { decrement: 1 }, updatedAt: new Date() }
        });
      } else {
        await tx.postReaction.create({
          data: {
            postId: post.id,
            guestSessionId,
            emoji: input.emoji
          }
        });
        await tx.post.update({
          where: { id: post.id },
          data: { reactionCount: { increment: 1 }, updatedAt: new Date() }
        });
      }
    });

    const updatedPost = await getPostCard(post.id, guestSessionId);
    const detail = await getPostDetail(post.id, guestSessionId);
    emitReactionUpdated(post.id, {
      postId: post.id,
      emoji: input.emoji,
      active: !existing,
      post: updatedPost,
      reactions: detail?.reactions ?? {}
    });
    emitPostUpdated(post.id, updatedPost);
    ok(res, { active: !existing, post: updatedPost, myReactions: detail?.myReactions ?? [] });
  } catch (error) {
    next(error);
  }
});

postsRouter.post('/:id/vote', ensureGuest, requireWritableSite, async (req, res, next) => {
  try {
    const input = voteSchema.parse(req.body);
    const guestSessionId = requireGuestId(req);
    const post = await prisma.post.findFirst({
      where: { id: req.params.id, deletedAt: null }
    });

    if (!post) throw new AppError(404, 'POST_NOT_FOUND', 'Post tidak ditemukan');

    const existing = await prisma.postVote.findUnique({
      where: {
        postId_guestSessionId: {
          postId: post.id,
          guestSessionId
        }
      }
    });

    const previousValue = existing?.value ?? 0;
    const delta = input.value - previousValue;

    await prisma.$transaction(async (tx) => {
      if (input.value === 0 && existing) {
        await tx.postVote.delete({ where: { id: existing.id } });
      } else if (input.value !== 0 && existing) {
        await tx.postVote.update({
          where: { id: existing.id },
          data: { value: input.value }
        });
      } else if (input.value !== 0) {
        await tx.postVote.create({
          data: {
            postId: post.id,
            guestSessionId,
            value: input.value
          }
        });
      }

      if (delta !== 0) {
        await tx.post.update({
          where: { id: post.id },
          data: { score: { increment: delta }, updatedAt: new Date() }
        });
      }
    });

    const updatedPost = await getPostCard(post.id, guestSessionId);
    emitVoteUpdated(post.id, { postId: post.id, value: input.value, post: updatedPost });
    emitPostUpdated(post.id, updatedPost);
    ok(res, { value: input.value, post: updatedPost });
  } catch (error) {
    next(error);
  }
});

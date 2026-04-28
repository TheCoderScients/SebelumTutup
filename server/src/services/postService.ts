import type { Comment, Post, PostCategory } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { getTrendingScore } from '../lib/trending.js';
import { prisma } from '../lib/prisma.js';

export type PostSort = 'new' | 'trending' | 'active';

export type PostCard = {
  id: string;
  title: string;
  body: string;
  category: PostCategory;
  displayName: string;
  isAnonymous: boolean;
  score: number;
  commentCount: number;
  reactionCount: number;
  reactions: Record<string, number>;
  myVote: -1 | 0 | 1;
  createdAt: string;
  updatedAt: string;
};

export type CommentDto = {
  id: string;
  postId: string;
  displayName: string;
  isAnonymous: boolean;
  body: string;
  createdAt: string;
  updatedAt: string;
};

function displayNameFromRecord(record: { displayName: string | null; isAnonymous: boolean }) {
  return record.isAnonymous ? 'Anonim' : record.displayName || 'Anonim';
}

export async function reactionCountsForPosts(postIds: string[]) {
  const empty = new Map<string, Record<string, number>>();
  if (postIds.length === 0) return empty;

  const grouped = await prisma.postReaction.groupBy({
    by: ['postId', 'emoji'],
    where: { postId: { in: postIds } },
    _count: { _all: true }
  });

  for (const row of grouped) {
    const existing = empty.get(row.postId) ?? {};
    existing[row.emoji] = row._count._all;
    empty.set(row.postId, existing);
  }

  return empty;
}

async function voteMapForPosts(postIds: string[], guestSessionId?: string) {
  const votes = new Map<string, -1 | 1>();
  if (!guestSessionId || postIds.length === 0) return votes;

  const rows = await prisma.postVote.findMany({
    where: { guestSessionId, postId: { in: postIds } },
    select: { postId: true, value: true }
  });

  for (const row of rows) {
    votes.set(row.postId, row.value === 1 ? 1 : -1);
  }

  return votes;
}

export async function serializePostCards(posts: Post[], guestSessionId?: string): Promise<PostCard[]> {
  const ids = posts.map((post) => post.id);
  const reactions = await reactionCountsForPosts(ids);
  const votes = await voteMapForPosts(ids, guestSessionId);

  return posts.map((post) => ({
    id: post.id,
    title: post.title,
    body: post.body,
    category: post.category,
    displayName: displayNameFromRecord(post),
    isAnonymous: post.isAnonymous,
    score: post.score,
    commentCount: post.commentCount,
    reactionCount: post.reactionCount,
    reactions: reactions.get(post.id) ?? {},
    myVote: votes.get(post.id) ?? 0,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString()
  }));
}

export function serializeComment(comment: Comment): CommentDto {
  return {
    id: comment.id,
    postId: comment.postId,
    displayName: displayNameFromRecord(comment),
    isAnonymous: comment.isAnonymous,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString()
  };
}

export async function listPosts(input: {
  sort: PostSort;
  page: number;
  limit: number;
  category?: PostCategory;
  guestSessionId?: string;
}) {
  const where: Prisma.PostWhereInput = {
    deletedAt: null,
    ...(input.category ? { category: input.category } : {})
  };

  const total = await prisma.post.count({ where });

  if (input.sort === 'trending') {
    const candidates = await prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 250
    });

    const sorted = candidates
      .sort((a, b) => getTrendingScore(b) - getTrendingScore(a) || b.createdAt.getTime() - a.createdAt.getTime())
      .slice((input.page - 1) * input.limit, input.page * input.limit);

    return {
      items: await serializePostCards(sorted, input.guestSessionId),
      page: input.page,
      limit: input.limit,
      total,
      hasMore: input.page * input.limit < total
    };
  }

  const orderBy =
    input.sort === 'active'
      ? [{ commentCount: 'desc' as const }, { reactionCount: 'desc' as const }, { updatedAt: 'desc' as const }]
      : [{ createdAt: 'desc' as const }];

  const posts = await prisma.post.findMany({
    where,
    orderBy,
    skip: (input.page - 1) * input.limit,
    take: input.limit
  });

  return {
    items: await serializePostCards(posts, input.guestSessionId),
    page: input.page,
    limit: input.limit,
    total,
    hasMore: input.page * input.limit < total
  };
}

export async function getPostCard(postId: string, guestSessionId?: string) {
  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null }
  });
  if (!post) return null;
  const [card] = await serializePostCards([post], guestSessionId);
  return card;
}

export async function getPostDetail(postId: string, guestSessionId?: string) {
  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null }
  });

  if (!post) return null;

  const comments = await prisma.comment.findMany({
    where: { postId, deletedAt: null },
    orderBy: { createdAt: 'asc' }
  });

  const myReactions = guestSessionId
    ? await prisma.postReaction.findMany({
        where: { postId, guestSessionId },
        select: { emoji: true }
      })
    : [];

  const [card] = await serializePostCards([post], guestSessionId);

  return {
    ...card,
    body: post.body,
    comments: comments.map(serializeComment),
    myReactions: myReactions.map((reaction) => reaction.emoji)
  };
}

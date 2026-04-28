export type TrendInput = {
  score: number;
  commentCount: number;
  reactionCount: number;
  createdAt: Date;
};

export function getTrendingScore(post: TrendInput, now = new Date()) {
  const ageHours = Math.max(0, (now.getTime() - post.createdAt.getTime()) / 3_600_000);
  return post.score * 3 + post.commentCount * 2 + post.reactionCount - ageHours * 0.15;
}

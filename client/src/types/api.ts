export type Guest = {
  id: string;
  nickname: string | null;
  isAnonymous: boolean;
  createdAt: string;
  lastSeenAt: string;
};

export type SiteStats = {
  posts: number;
  comments: number;
  reactions: number;
  openReports: number;
  onlineUsers: number;
};

export type SiteInfo = {
  siteName: string;
  siteCloseAt: string;
  readOnly: boolean;
  stats: SiteStats;
};

export type PostCategory = 'random' | 'curhat' | 'opini' | 'sekolah' | 'game' | 'teknologi' | 'cinta';
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

export type CommentItem = {
  id: string;
  postId: string;
  displayName: string;
  isAnonymous: boolean;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type PostDetail = PostCard & {
  comments: CommentItem[];
  myReactions: string[];
};

export type ListPostsResponse = {
  items: PostCard[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

export type AdminReport = {
  id: string;
  targetType: 'post' | 'comment';
  targetId: string;
  reason: string;
  status: 'open' | 'resolved';
  createdAt: string;
  resolvedAt: string | null;
  reporter: {
    id: string;
    nickname: string | null;
    isAnonymous: boolean;
  };
  target:
    | null
    | {
        id: string;
        type: 'post';
        title: string;
        body: string;
        displayName: string;
        deleted: boolean;
        createdAt: string;
      }
    | {
        id: string;
        type: 'comment';
        postId: string;
        body: string;
        displayName: string;
        deleted: boolean;
        createdAt: string;
      };
};

export type AdminStats = {
  stats: {
    guests: number;
    posts: number;
    comments: number;
    reactions: number;
    votes: number;
    reports: number;
    openReports: number;
  };
  logs: Array<{
    id: string;
    actionType: string;
    targetType: string;
    targetId: string;
    note: string | null;
    createdAt: string;
  }>;
};

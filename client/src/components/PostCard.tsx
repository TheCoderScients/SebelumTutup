import { MessageCircle, Sparkles, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { reactions } from '../lib/categories';
import { compactNumber, relativeTime } from '../lib/time';
import type { PostCard as PostCardType } from '../types/api';
import { ReportButton } from './ReportButton';

const categoryTone: Record<string, string> = {
  random: 'border-slate-400/25 bg-slate-400/10 text-slate-200',
  curhat: 'border-aqua/25 bg-aqua/10 text-aqua',
  opini: 'border-mint/25 bg-mint/10 text-mint',
  sekolah: 'border-amber-300/25 bg-amber-300/10 text-amber-200',
  game: 'border-fuchsia-300/25 bg-fuchsia-300/10 text-fuchsia-200',
  teknologi: 'border-cyan-300/25 bg-cyan-300/10 text-cyan-200',
  cinta: 'border-rose-300/25 bg-rose-300/10 text-rose-200'
};

export function PostCard({ post }: { post: PostCardType }) {
  return (
    <article className="group surface-card relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:border-white/20">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-mint/50 to-transparent opacity-0 transition group-hover:opacity-100" />
      <Link to={`/post/${post.id}`} className="block">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-xs ${categoryTone[post.category]}`}>
            {post.category}
          </span>
          <span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-xs text-slate-400">oleh {post.displayName}</span>
          <span className="text-xs text-slate-600">•</span>
          <span className="text-xs text-slate-500">{relativeTime(post.createdAt)}</span>
        </div>

        <h2 className="mt-4 line-clamp-2 text-xl font-semibold leading-snug text-white transition group-hover:text-mint">
          {post.title}
        </h2>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-300">{post.body}</p>
      </Link>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1.5" title="Skor vote">
            <TrendingUp className="h-4 w-4 text-mint" />
            {compactNumber(post.score)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1.5" title="Komentar">
            <MessageCircle className="h-4 w-4 text-aqua" />
            {compactNumber(post.commentCount)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1.5" title="Reaksi">
            <Sparkles className="h-4 w-4 text-honey" />
            {compactNumber(post.reactionCount)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {reactions.map((emoji) => (
            <span key={emoji} className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-slate-300">
              {emoji} {post.reactions[emoji] ?? 0}
            </span>
          ))}
          <ReportButton targetType="post" targetId={post.id} label="" />
        </div>
      </div>
    </article>
  );
}

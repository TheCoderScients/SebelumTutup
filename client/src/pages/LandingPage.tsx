import { ArrowRight, Flame, MessageCircle, Signal, UsersRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CountdownBadge } from '../components/CountdownBadge';
import { StatPill } from '../components/StatPill';
import { useApp } from '../contexts/AppContext';
import { apiFetch } from '../lib/api';
import { compactNumber, formatDateTime, relativeTime } from '../lib/time';
import type { ListPostsResponse, PostCard } from '../types/api';

export function LandingPage() {
  const { site } = useApp();
  const [recentPosts, setRecentPosts] = useState<PostCard[]>([]);

  useEffect(() => {
    apiFetch<ListPostsResponse>('/api/posts?sort=new&limit=3')
      .then((data) => setRecentPosts(data.items))
      .catch(() => setRecentPosts([]));
  }, []);

  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1fr_0.9fr] md:items-center md:py-20">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300">
          <Signal className="h-4 w-4 text-mint" />
          Arena opini singkat, semi-live, tanpa akun penuh
        </div>
        <h1 className="mt-6 max-w-3xl text-5xl font-black leading-tight text-white md:text-7xl">SebelumTutup</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
          Tulis hot take, curhat, dan opini random sebelum demo ini benar-benar ditutup. Masuk sebagai guest,
          pilih nickname atau anonim, lalu lihat feed bergerak tanpa refresh.
        </p>

        {site && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <CountdownBadge closeAt={site.siteCloseAt} />
            <span className="text-sm text-slate-500">Tutup pada {formatDateTime(site.siteCloseAt)}</span>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/feed"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-slate-200"
          >
            Masuk ke feed
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/feed?sort=trending"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
          >
            Lihat trending
            <Flame className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatPill label="post hidup" value={compactNumber(site?.stats.posts ?? 0)} />
          <StatPill label="komentar" value={compactNumber(site?.stats.comments ?? 0)} />
          <StatPill label="reaksi" value={compactNumber(site?.stats.reactions ?? 0)} />
          <StatPill label="online" value={compactNumber(site?.stats.onlineUsers ?? 0)} />
        </div>
      </div>

      <div className="relative min-h-[520px] overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(160deg,rgba(24,28,34,0.96),rgba(17,19,24,0.96))] p-5 shadow-glow">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:42px_42px]" />
        <div className="relative">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <p className="text-sm text-slate-400">live board</p>
              <p className="text-xl font-semibold text-white">Yang lagi dilempar</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-mint/10 px-3 py-1 text-sm text-mint">
              <UsersRound className="h-4 w-4" />
              {compactNumber(site?.stats.onlineUsers ?? 0)}
            </span>
          </div>

          {recentPosts.length === 0 ? (
            <div className="mt-5 rounded-lg border border-dashed border-white/10 bg-ink/80 p-5 text-sm leading-6 text-slate-400">
              Feed masih kosong. Post pertama akan muncul di sini.
            </div>
          ) : (
            recentPosts.map((post) => (
              <PreviewCard
                key={post.id}
                icon={post.commentCount > 0 ? <MessageCircle className="h-4 w-4" /> : <Flame className="h-4 w-4" />}
                title={post.title}
                body={post.body}
                meta={`${post.category} · ${relativeTime(post.createdAt)}`}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function PreviewCard({
  icon,
  title,
  body,
  meta
}: {
  icon: ReactNode;
  title: string;
  body: string;
  meta: string;
}) {
  return (
    <div className="mt-5 rounded-lg border border-white/10 bg-ink/80 p-4">
      <div className="flex items-center gap-2 text-mint">
        {icon}
        <span className="text-xs text-slate-400">{meta}</span>
      </div>
      <h3 className="mt-3 text-lg font-semibold leading-snug text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
    </div>
  );
}

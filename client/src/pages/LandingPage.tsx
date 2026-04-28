import { Activity, ArrowRight, Flame, MessageCircle, Radio, Signal, Sparkles, TrendingUp, UsersRound } from 'lucide-react';
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
    <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-10 pt-10 md:min-h-[calc(100vh-88px)] md:grid-cols-[1fr_0.92fr] md:items-center md:pb-16 md:pt-14">
      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-slate-300 backdrop-blur-xl">
          <Signal className="h-4 w-4 text-mint" />
          Arena opini singkat yang nyala sampai waktu habis
        </div>

        <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.95] text-white md:text-7xl">SebelumTutup</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
          Tulis hot take, curhat, dan opini random sebelum demo ini benar-benar ditutup. Masuk sebagai guest, pilih
          nickname atau anonim, lalu lihat arena bergerak bareng pengunjung lain.
        </p>

        {site && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <CountdownBadge closeAt={site.siteCloseAt} />
            <span className="text-sm text-slate-500">Tutup pada {formatDateTime(site.siteCloseAt)}</span>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/feed" className="primary-button px-5 py-3">
            Masuk ke feed
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/feed?sort=trending" className="ghost-button px-5 py-3">
            <Flame className="h-4 w-4 text-ember" />
            Lihat trending
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatPill label="post hidup" value={compactNumber(site?.stats.posts ?? 0)} />
          <StatPill label="komentar" value={compactNumber(site?.stats.comments ?? 0)} />
          <StatPill label="reaksi" value={compactNumber(site?.stats.reactions ?? 0)} />
          <StatPill label="online" value={compactNumber(site?.stats.onlineUsers ?? 0)} />
        </div>
      </div>

      <div className="relative min-h-[500px] overflow-hidden rounded-lg border border-white/10 bg-[#10141c]/90 shadow-glow">
        <div className="absolute inset-0 ambient-grid opacity-80" />
        <div className="absolute inset-0 grain" />
        <div className="absolute left-10 top-0 h-full w-px stream-rail" />
        <div className="absolute right-16 top-0 h-full w-px stream-rail [animation-delay:1.7s]" />
        <div className="absolute -right-20 -top-16 h-64 w-64 rounded-full bg-aqua/15 blur-3xl" />
        <div className="absolute -bottom-20 left-8 h-64 w-64 rounded-full bg-ember/15 blur-3xl" />

        <div className="relative flex h-full min-h-[500px] flex-col justify-between p-5 md:p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <p className="inline-flex items-center gap-2 text-sm text-slate-400">
                <span className="live-dot" />
                live board
              </p>
              <p className="mt-1 text-xl font-semibold text-white">Yang lagi dilempar</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-mint/20 bg-mint/10 px-3 py-1 text-sm text-mint">
              <UsersRound className="h-4 w-4" />
              {compactNumber(site?.stats.onlineUsers ?? 0)}
            </span>
          </div>

          <div className="grid flex-1 content-center gap-4 py-5">
            {recentPosts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/10 bg-ink/70 p-5 text-sm leading-6 text-slate-400">
                Feed masih kosong. Post pertama akan muncul di sini.
              </div>
            ) : (
              recentPosts.map((post, index) => (
                <PreviewCard
                  key={post.id}
                  icon={
                    post.commentCount > 0 ? (
                      <MessageCircle className="h-4 w-4" />
                    ) : post.score > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <Flame className="h-4 w-4" />
                    )
                  }
                  title={post.title}
                  body={post.body}
                  meta={`${post.category} / ${relativeTime(post.createdAt)}`}
                  index={index}
                />
              ))
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-xs text-slate-400">
            <span className="inline-flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2">
              <Activity className="h-4 w-4 text-mint" />
              realtime
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2">
              <Sparkles className="h-4 w-4 text-honey" />
              anonim
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2">
              <Radio className="h-4 w-4 text-aqua" />
              publik
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewCard({
  icon,
  title,
  body,
  meta,
  index
}: {
  icon: ReactNode;
  title: string;
  body: string;
  meta: string;
  index: number;
}) {
  return (
    <div
      className="floating-card rounded-lg border border-white/10 bg-ink/80 p-4 shadow-lift"
      style={{ animationDelay: `${index * 0.65}s` }}
    >
      <div className="flex items-center gap-2 text-mint">
        {icon}
        <span className="text-xs text-slate-400">{meta}</span>
      </div>
      <h3 className="mt-3 line-clamp-2 text-lg font-semibold leading-snug text-white">{title}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">{body}</p>
    </div>
  );
}

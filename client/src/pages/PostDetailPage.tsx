import { ArrowLeft, MessageCircle, SendHorizonal, Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { ReportButton } from '../components/ReportButton';
import { useApp } from '../contexts/AppContext';
import { apiFetch } from '../lib/api';
import { reactions } from '../lib/categories';
import { socket } from '../lib/socket';
import { formatDateTime, relativeTime } from '../lib/time';
import type { CommentItem, PostCard, PostDetail } from '../types/api';

export function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { site, guest, pushToast, refreshSite } = useApp();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [displayMode, setDisplayMode] = useState<'nickname' | 'anonymous'>(guest?.nickname ? 'nickname' : 'anonymous');
  const [submitting, setSubmitting] = useState(false);

  const readOnly = site?.readOnly;

  const loadPost = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await apiFetch<PostDetail>(`/api/posts/${id}`);
      setPost(data);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Gagal memuat post', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, pushToast]);

  useEffect(() => {
    void loadPost();
  }, [loadPost]);

  useEffect(() => {
    if (!id) return;
    socket.emit('post:join', id);

    const onComment = (payload: { postId: string; comment: CommentItem }) => {
      if (payload.postId !== id) return;
      setPost((current) =>
        current
          ? {
              ...current,
              commentCount: current.commentCount + (current.comments.some((item) => item.id === payload.comment.id) ? 0 : 1),
              comments: current.comments.some((item) => item.id === payload.comment.id)
                ? current.comments
                : [...current.comments, payload.comment]
            }
          : current
      );
    };

    const onPostUpdated = (payload: PostCard) => {
      if (payload.id !== id) return;
      setPost((current) => (current ? { ...current, ...payload } : current));
    };

    const onReaction = (payload: { postId: string; post?: PostCard; reactions?: Record<string, number> }) => {
      if (payload.postId !== id) return;
      setPost((current) =>
        current
          ? {
              ...current,
              ...(payload.post ?? {}),
              ...(payload.reactions ? { reactions: payload.reactions } : {})
            }
          : current
      );
    };

    const onVote = (payload: { postId: string; post?: PostCard }) => {
      if (payload.postId !== id) return;
      setPost((current) => (current && payload.post ? { ...current, ...payload.post } : current));
    };

    const onDeleted = (payload: { postId: string }) => {
      if (payload.postId !== id) return;
      pushToast('Post ini sudah dihapus admin.', 'info');
      navigate('/feed');
    };

    socket.on('comment:created', onComment);
    socket.on('post:updated', onPostUpdated);
    socket.on('reaction:updated', onReaction);
    socket.on('vote:updated', onVote);
    socket.on('post:deleted', onDeleted);

    return () => {
      socket.emit('post:leave', id);
      socket.off('comment:created', onComment);
      socket.off('post:updated', onPostUpdated);
      socket.off('reaction:updated', onReaction);
      socket.off('vote:updated', onVote);
      socket.off('post:deleted', onDeleted);
    };
  }, [id, navigate, pushToast]);

  async function submitComment(event: FormEvent) {
    event.preventDefault();
    if (!id || readOnly) return;
    if (comment.trim().length < 2) {
      pushToast('Komentar minimal 2 karakter.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiFetch<{ comment: CommentItem; post: PostCard }>(`/api/posts/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: comment, displayMode })
      });
      setPost((current) =>
        current
          ? {
              ...current,
              ...data.post,
              comments: current.comments.some((item) => item.id === data.comment.id)
                ? current.comments
                : [...current.comments, data.comment]
            }
          : current
      );
      setComment('');
      pushToast('Komentar terkirim.', 'success');
      void refreshSite();
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Gagal mengirim komentar', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleReaction(emoji: string) {
    if (!id || readOnly) return;
    try {
      const data = await apiFetch<{ active: boolean; post: PostCard; myReactions: string[] }>(`/api/posts/${id}/reactions/toggle`, {
        method: 'POST',
        body: JSON.stringify({ emoji })
      });
      setPost((current) => (current ? { ...current, ...data.post, myReactions: data.myReactions } : current));
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Gagal mengubah reaksi', 'error');
    }
  }

  async function vote(value: -1 | 1) {
    if (!id || readOnly || !post) return;
    const nextValue = post.myVote === value ? 0 : value;
    try {
      const data = await apiFetch<{ value: -1 | 0 | 1; post: PostCard }>(`/api/posts/${id}/vote`, {
        method: 'POST',
        body: JSON.stringify({ value: nextValue })
      });
      setPost((current) => (current ? { ...current, ...data.post, myVote: data.value } : current));
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Gagal vote', 'error');
    }
  }

  if (loading && !post) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-8">
        <div className="h-80 animate-pulse rounded-lg border border-white/10 bg-white/[0.04]" />
      </section>
    );
  }

  if (!post) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-8">
        <EmptyState title="Post tidak ditemukan" body="Mungkin sudah dihapus atau link-nya salah." />
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-3 py-5 sm:px-4 sm:py-8">
      <Link to="/feed" className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Kembali ke feed
      </Link>

      <article className="surface-card relative mt-5 overflow-hidden p-4 sm:p-5 md:p-7">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-ember/60 via-mint/60 to-aqua/60" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <span className="rounded-full border border-mint/25 bg-mint/10 px-3 py-1 text-xs text-mint">{post.category}</span>
            <span className="rounded-full bg-white/[0.04] px-3 py-1 text-xs">oleh {post.displayName}</span>
            <span>•</span>
            <span>{relativeTime(post.createdAt)}</span>
          </div>
          <ReportButton targetType="post" targetId={post.id} />
        </div>

        <h1 className="mt-5 text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl">{post.title}</h1>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-200 sm:text-base sm:leading-8">{post.body}</p>
        <p className="mt-4 text-xs text-slate-500">Dibuat {formatDateTime(post.createdAt)}</p>

        <div className="mt-6 grid gap-3 border-t border-white/10 pt-5 sm:flex sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={() => vote(1)}
            disabled={readOnly}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition sm:w-auto ${
              post.myVote === 1 ? 'border-mint bg-mint/10 text-mint' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
            } disabled:opacity-60`}
            title="Upvote"
          >
            <ThumbsUp className="h-4 w-4" />
            Upvote
          </button>
          <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-center text-sm font-semibold text-white">Skor {post.score}</span>
          <button
            type="button"
            onClick={() => vote(-1)}
            disabled={readOnly}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition sm:w-auto ${
              post.myVote === -1 ? 'border-ember bg-ember/10 text-ember' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
            } disabled:opacity-60`}
            title="Downvote"
          >
            <ThumbsDown className="h-4 w-4" />
            Downvote
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
              <Sparkles className="h-4 w-4 text-honey" />
            </span>
            {reactions.map((emoji) => {
              const active = post.myReactions.includes(emoji);
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => toggleReaction(emoji)}
                  disabled={readOnly}
                  className={`rounded-lg border px-3 py-2 text-sm transition ${
                    active ? 'border-aqua bg-aqua/10 text-aqua' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                  } disabled:opacity-60`}
                >
                  {emoji} {post.reactions[emoji] ?? 0}
                </button>
              );
            })}
          </div>
        </div>
      </article>

      <section className="surface-card mt-6 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-white">
          <MessageCircle className="h-5 w-5 text-aqua" />
          <h2 className="text-xl font-semibold">Komentar ({post.comments.length})</h2>
        </div>

        <form onSubmit={submitComment} className="mt-5">
          <div className="flex flex-col gap-3 md:flex-row">
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value.slice(0, 300))}
              maxLength={300}
              disabled={readOnly}
              rows={3}
              placeholder="Tambahkan komentar singkat..."
              className="field min-h-24 flex-1 resize-none text-sm focus:border-aqua"
            />
            <div className="flex w-full flex-col gap-3 md:w-44">
              <select
                value={displayMode}
                onChange={(event) => setDisplayMode(event.target.value as 'nickname' | 'anonymous')}
                disabled={readOnly || !guest?.nickname}
                className="field px-3 py-2 text-sm text-slate-200 focus:border-aqua"
              >
                <option value="nickname">Nickname</option>
                <option value="anonymous">Anonim</option>
              </select>
              <button
                type="submit"
                disabled={readOnly || submitting}
                className="primary-button w-full bg-aqua py-3 hover:bg-aqua/90"
              >
                <SendHorizonal className="h-4 w-4" />
                {readOnly ? 'Ditutup' : submitting ? 'Mengirim...' : 'Kirim'}
              </button>
            </div>
          </div>
        </form>

        <div className="mt-6 grid gap-3">
          {post.comments.length === 0 ? (
            <EmptyState title="Belum ada komentar" body="Komentar pertama akan muncul realtime di sini." />
          ) : (
            post.comments.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-ink/70 p-4 transition hover:border-white/20">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="inline-flex items-center gap-2 font-medium text-slate-200">
                    <span className="h-2 w-2 rounded-full bg-aqua" />
                    {item.displayName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{relativeTime(item.createdAt)}</span>
                    <ReportButton targetType="comment" targetId={item.id} label="" />
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{item.body}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </section>
  );
}

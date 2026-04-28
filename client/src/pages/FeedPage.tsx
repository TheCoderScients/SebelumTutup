import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { PostCard } from '../components/PostCard';
import { PostComposer } from '../components/PostComposer';
import { useApp } from '../contexts/AppContext';
import { apiFetch, toQuery } from '../lib/api';
import { categories, sortOptions } from '../lib/categories';
import { socket } from '../lib/socket';
import type { ListPostsResponse, PostCard as PostCardType, PostCategory, PostSort } from '../types/api';

export function FeedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSort = (searchParams.get('sort') as PostSort | null) ?? 'new';
  const [sort, setSort] = useState<PostSort>(['new', 'trending', 'active'].includes(initialSort) ? initialSort : 'new');
  const [category, setCategory] = useState<PostCategory | ''>((searchParams.get('category') as PostCategory | null) ?? '');
  const [posts, setPosts] = useState<PostCardType[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const { pushToast, refreshSite } = useApp();

  const query = useMemo(() => ({ sort, category: category || undefined }), [sort, category]);

  const loadPosts = useCallback(
    async (nextPage = 1, append = false) => {
      setLoading(true);
      try {
        const data = await apiFetch<ListPostsResponse>(
          `/api/posts${toQuery({ sort: query.sort, category: query.category, page: nextPage, limit: 12 })}`
        );
        setPosts((current) => (append ? [...current, ...data.items] : data.items));
        setPage(data.page);
        setHasMore(data.hasMore);
      } catch (error) {
        pushToast(error instanceof Error ? error.message : 'Gagal memuat feed', 'error');
      } finally {
        setLoading(false);
      }
    },
    [pushToast, query]
  );

  useEffect(() => {
    const params = new URLSearchParams();
    if (sort !== 'new') params.set('sort', sort);
    if (category) params.set('category', category);
    setSearchParams(params, { replace: true });
    void loadPosts(1, false);
  }, [sort, category, loadPosts, setSearchParams]);

  useEffect(() => {
    const created = (post: PostCardType) => {
      if (category && post.category !== category) return;
      setPosts((current) => [post, ...current.filter((item) => item.id !== post.id)].slice(0, 30));
      void refreshSite();
    };
    const updated = (post: PostCardType | { postId: string }) => {
      if (!('id' in post)) return;
      setPosts((current) => current.map((item) => (item.id === post.id ? { ...item, ...post } : item)));
    };
    const deleted = ({ postId }: { postId: string }) => {
      setPosts((current) => current.filter((item) => item.id !== postId));
      void refreshSite();
    };

    socket.on('post:created', created);
    socket.on('post:updated', updated);
    socket.on('post:deleted', deleted);

    return () => {
      socket.off('post:created', created);
      socket.off('post:updated', updated);
      socket.off('post:deleted', deleted);
    };
  }, [category, refreshSite]);

  function mergeCreated(post: PostCardType) {
    setPosts((current) => [post, ...current.filter((item) => item.id !== post.id)]);
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[380px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <PostComposer onCreated={mergeCreated} />
      </aside>

      <div>
        <div className="mb-5 flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{sort === 'trending' ? 'Trending' : 'Feed publik'}</h1>
            <p className="mt-1 text-sm text-slate-400">Post baru, komentar, vote, dan reaksi ikut masuk realtime.</p>
          </div>
          <button
            type="button"
            onClick={() => loadPosts(1, false)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            title="Refresh feed"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="mb-5 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {sortOptions.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setSort(item.value)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  sort === item.value
                    ? 'border-white bg-white text-ink'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory('')}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                !category ? 'border-mint bg-mint/10 text-mint' : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25'
              }`}
            >
              Semua
            </button>
            {categories.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setCategory(item.value)}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${
                  category === item.value
                    ? 'border-mint bg-mint/10 text-mint'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {loading && posts.length === 0 ? (
          <div className="grid gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-44 animate-pulse rounded-lg border border-white/10 bg-white/[0.04]" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState title="Belum ada post di filter ini" body="Coba kategori lain atau lempar post pertama." />
        ) : (
          <div className="grid gap-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {hasMore && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => loadPosts(page + 1, true)}
              className="rounded-lg border border-white/10 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
            >
              Muat lagi
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

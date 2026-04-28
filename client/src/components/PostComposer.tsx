import { EyeOff, PenLine, SendHorizonal, UserRound } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { apiFetch } from '../lib/api';
import { categories } from '../lib/categories';
import type { PostCard, PostCategory } from '../types/api';

export function PostComposer({ onCreated }: { onCreated: (post: PostCard) => void }) {
  const { site, guest, pushToast, refreshSite } = useApp();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<PostCategory>('random');
  const [displayMode, setDisplayMode] = useState<'nickname' | 'anonymous'>(guest?.nickname ? 'nickname' : 'anonymous');
  const [submitting, setSubmitting] = useState(false);

  const readOnly = site?.readOnly;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (readOnly) return;
    if (title.trim().length < 3 || body.trim().length < 5) {
      pushToast('Judul dan isi masih terlalu pendek.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const post = await apiFetch<PostCard>('/api/posts', {
        method: 'POST',
        body: JSON.stringify({ title, body, category, displayMode })
      });
      onCreated(post);
      setTitle('');
      setBody('');
      pushToast('Post baru sudah meluncur.', 'success');
      void refreshSite();
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Gagal membuat post', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="surface-card overflow-hidden p-0">
      <div className="border-b border-white/10 bg-white/[0.03] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg border border-mint/25 bg-mint/10 text-mint">
            <PenLine className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold text-white">Lempar opini singkat</h2>
            <p className="mt-1 text-sm text-slate-400">Maksimal 80 karakter judul dan 500 karakter isi.</p>
          </div>
        </div>
      </div>

      <div className="p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <select
          value={displayMode}
          onChange={(event) => setDisplayMode(event.target.value as 'nickname' | 'anonymous')}
          disabled={readOnly || !guest?.nickname}
          className="field py-2 text-sm text-slate-200"
        >
          <option value="nickname">Tampil nickname</option>
          <option value="anonymous">Tampil anonim</option>
        </select>
      </div>

      <input
        value={title}
        onChange={(event) => setTitle(event.target.value.slice(0, 80))}
        maxLength={80}
        disabled={readOnly}
        placeholder="Judul hot take kamu"
        className="field mt-5 w-full"
      />
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value.slice(0, 500))}
        maxLength={500}
        disabled={readOnly}
        rows={5}
        placeholder="Tulis curhat, opini random, atau hal yang perlu keluar sebelum situs ini tutup..."
        className="field mt-3 w-full resize-none"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {categories.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setCategory(item.value)}
            disabled={readOnly}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
              category === item.value
                ? 'border-mint bg-mint/10 text-mint'
                : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25'
            } disabled:opacity-60`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs text-slate-500">
          {displayMode === 'anonymous' ? <EyeOff className="h-3.5 w-3.5" /> : <UserRound className="h-3.5 w-3.5" />}
          {title.length}/80 judul · {body.length}/500 isi
        </p>
        <button
          type="submit"
          disabled={readOnly || submitting}
          className="primary-button bg-mint hover:bg-mint/90"
        >
          <SendHorizonal className="h-4 w-4" />
          {readOnly ? 'Ditutup' : submitting ? 'Mengirim...' : 'Kirim'}
        </button>
      </div>
      </div>
    </form>
  );
}

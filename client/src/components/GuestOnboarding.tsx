import { EyeOff, UserRound } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useApp } from '../contexts/AppContext';

export function GuestOnboarding() {
  const { needsOnboarding, completeOnboarding, pushToast } = useApp();
  const [mode, setMode] = useState<'nickname' | 'anonymous'>('nickname');
  const [nickname, setNickname] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!needsOnboarding) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (mode === 'nickname' && nickname.trim().length < 2) {
      pushToast('Nickname minimal 2 karakter.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await completeOnboarding({
        nickname: nickname.trim() || null,
        isAnonymous: mode === 'anonymous'
      });
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Gagal masuk sebagai guest', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-ink/80 px-3 py-6 backdrop-blur-md sm:px-4">
      <form onSubmit={submit} className="surface-card w-full max-w-md p-5 sm:p-6">
        <p className="text-sm text-aqua">Masuk sebagai guest</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Pilih wajah publikmu dulu.</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Kamu bisa tampil pakai nickname atau tetap anonim. Tidak ada email, tidak ada akun penuh.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode('nickname')}
            className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium transition ${
              mode === 'nickname'
                ? 'border-mint bg-mint/10 text-mint'
                : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/25'
            }`}
          >
            <UserRound className="h-4 w-4" />
            Nickname
          </button>
          <button
            type="button"
            onClick={() => setMode('anonymous')}
            className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium transition ${
              mode === 'anonymous'
                ? 'border-aqua bg-aqua/10 text-aqua'
                : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/25'
            }`}
          >
            <EyeOff className="h-4 w-4" />
            Anonim
          </button>
        </div>

        {mode === 'nickname' && (
          <label className="mt-5 block text-sm text-slate-200">
            Nickname
            <input
              value={nickname}
              onChange={(event) => setNickname(event.target.value.slice(0, 30))}
              maxLength={30}
              placeholder="contoh: KopiDingin"
              className="field mt-2 w-full"
            />
          </label>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 flex w-full items-center justify-center rounded-lg bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Menyiapkan...' : 'Masuk ke arena'}
        </button>
      </form>
    </div>
  );
}

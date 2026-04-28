import { X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export function ToastHost() {
  const { toasts, dismissToast } = useApp();

  return (
    <div className="fixed right-4 top-4 z-50 flex w-[min(92vw,360px)] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={[
            'flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm shadow-glow backdrop-blur',
            toast.tone === 'success' && 'border-mint/40 bg-mint/10 text-mint',
            toast.tone === 'error' && 'border-ember/40 bg-ember/10 text-ember',
            (!toast.tone || toast.tone === 'info') && 'border-white/20 bg-panel/95 text-slate-100'
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <span>{toast.message}</span>
          <button
            type="button"
            aria-label="Tutup notifikasi"
            title="Tutup"
            onClick={() => dismissToast(toast.id)}
            className="rounded-md p-1 text-current opacity-75 transition hover:bg-white/10 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

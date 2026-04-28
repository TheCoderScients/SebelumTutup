import { Flag, X } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { apiFetch } from '../lib/api';

export function ReportButton({
  targetType,
  targetId,
  label = 'Report'
}: {
  targetType: 'post' | 'comment';
  targetId: string;
  label?: string;
}) {
  const { pushToast } = useApp();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (reason.trim().length < 4) {
      pushToast('Alasan report minimal 4 karakter.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/api/reports', {
        method: 'POST',
        body: JSON.stringify({ targetType, targetId, reason })
      });
      pushToast('Report masuk ke admin panel.', 'success');
      setReason('');
      setOpen(false);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Gagal mengirim report', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-ember/10 hover:text-ember"
        title="Laporkan konten"
      >
        <Flag className="h-3.5 w-3.5" />
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/80 px-3 py-6 backdrop-blur sm:px-4">
          <form onSubmit={submit} className="surface-card w-full max-w-md p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Laporkan konten</h2>
                <p className="mt-1 text-sm text-slate-400">Tulis alasan singkat agar admin bisa cek dengan cepat.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
                title="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value.slice(0, 180))}
              maxLength={180}
              rows={4}
              className="field mt-4 w-full resize-none text-sm focus:border-ember"
              placeholder="Contoh: menyerang personal / spam / terlalu kasar"
            />
            <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ghost-button w-full sm:w-auto"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="primary-button w-full bg-ember text-white hover:bg-ember/90 sm:w-auto"
              >
                {submitting ? 'Mengirim...' : 'Kirim report'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

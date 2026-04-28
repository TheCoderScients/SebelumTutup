import { LogOut, RefreshCw, Shield, Trash2, CheckCircle2 } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { ApiError, apiFetch } from '../lib/api';
import { formatDateTime } from '../lib/time';
import type { AdminReport, AdminStats } from '../types/api';

export function AdminPage() {
  const { pushToast } = useApp();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadAdmin = useCallback(async () => {
    setLoading(true);
    try {
      const [nextStats, nextReports] = await Promise.all([
        apiFetch<AdminStats>('/api/admin/stats'),
        apiFetch<{ items: AdminReport[] }>('/api/admin/reports')
      ]);
      setStats(nextStats);
      setReports(nextReports.items);
      setAuthenticated(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setAuthenticated(false);
      } else {
        pushToast(error instanceof Error ? error.message : 'Gagal memuat admin', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    void loadAdmin();
  }, [loadAdmin]);

  async function login(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      setPassword('');
      pushToast('Login admin berhasil.', 'success');
      await loadAdmin();
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Login gagal', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function logout() {
    await apiFetch('/api/admin/logout', { method: 'POST' }).catch(() => null);
    setAuthenticated(false);
    setStats(null);
    setReports([]);
  }

  async function deleteTarget(report: AdminReport) {
    const endpoint =
      report.targetType === 'post' ? `/api/admin/posts/${report.targetId}` : `/api/admin/comments/${report.targetId}`;
    try {
      await apiFetch(endpoint, { method: 'DELETE' });
      pushToast(report.targetType === 'post' ? 'Post dihapus.' : 'Komentar dihapus.', 'success');
      await loadAdmin();
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Aksi gagal', 'error');
    }
  }

  async function resolveReport(report: AdminReport) {
    try {
      await apiFetch(`/api/admin/reports/${report.id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ note: 'Diselesaikan dari admin panel' })
      });
      pushToast('Report ditandai selesai.', 'success');
      await loadAdmin();
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Gagal resolve report', 'error');
    }
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="h-96 animate-pulse rounded-lg border border-white/10 bg-white/[0.04]" />
      </section>
    );
  }

  if (!authenticated) {
    return (
      <section className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4 py-8">
        <form onSubmit={login} className="w-full rounded-lg border border-white/10 bg-panel p-6 shadow-glow">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-aqua text-ink">
              <Shield className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-white">Admin panel</h1>
              <p className="text-sm text-slate-400">Moderasi report dan konten.</p>
            </div>
          </div>

          <label className="mt-6 block text-sm text-slate-200">
            Username
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-white outline-none focus:border-aqua"
            />
          </label>
          <label className="mt-4 block text-sm text-slate-200">
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              className="mt-2 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-white outline-none focus:border-aqua"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-lg bg-aqua px-4 py-3 text-sm font-semibold text-ink transition hover:bg-aqua/90 disabled:opacity-60"
          >
            {submitting ? 'Masuk...' : 'Login'}
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin panel</h1>
          <p className="mt-1 text-sm text-slate-400">Report terbuka, statistik, dan log moderasi.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadAdmin}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            title="Refresh admin"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-lg border border-ember/30 px-3 py-2 text-sm text-ember transition hover:bg-ember/10"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {stats && (
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          {Object.entries(stats.stats).map(([key, value]) => (
            <div key={key} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <p className="text-2xl font-semibold text-white">{value}</p>
              <p className="mt-1 text-xs text-slate-400">{key}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-white/10 bg-panel p-5">
          <h2 className="text-xl font-semibold text-white">Report terbuka</h2>
          <div className="mt-4 grid gap-3">
            {reports.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">
                Tidak ada report terbuka.
              </div>
            ) : (
              reports.map((report) => (
                <article key={report.id} className="rounded-lg border border-white/10 bg-ink/70 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="rounded-full bg-ember/10 px-2 py-1 text-ember">{report.targetType}</span>
                        <span>{formatDateTime(report.createdAt)}</span>
                      </div>
                      <p className="mt-3 text-sm font-medium text-white">Alasan: {report.reason}</p>
                      <TargetPreview report={report} />
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => deleteTarget(report)}
                        className="inline-flex items-center gap-2 rounded-lg bg-ember px-3 py-2 text-sm font-semibold text-white transition hover:bg-ember/90"
                      >
                        <Trash2 className="h-4 w-4" />
                        Hapus
                      </button>
                      <button
                        type="button"
                        onClick={() => resolveReport(report)}
                        className="inline-flex items-center gap-2 rounded-lg border border-mint/30 px-3 py-2 text-sm font-semibold text-mint transition hover:bg-mint/10"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Resolve
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-panel p-5">
          <h2 className="text-xl font-semibold text-white">Log moderasi</h2>
          <div className="mt-4 grid gap-3">
            {stats?.logs.length ? (
              stats.logs.map((log) => (
                <div key={log.id} className="rounded-lg border border-white/10 bg-ink/70 p-3 text-sm">
                  <p className="font-medium text-slate-200">{log.actionType}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {log.targetType}:{log.targetId}
                  </p>
                  {log.note && <p className="mt-2 text-slate-400">{log.note}</p>}
                  <p className="mt-2 text-xs text-slate-600">{formatDateTime(log.createdAt)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">Belum ada log.</p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

function TargetPreview({ report }: { report: AdminReport }) {
  if (!report.target) {
    return <p className="mt-3 text-sm text-slate-500">Target tidak ditemukan.</p>;
  }

  if (report.target.type === 'post') {
    return (
      <div className="mt-3 rounded-lg bg-white/[0.04] p-3">
        <p className="text-sm font-semibold text-slate-100">{report.target.title}</p>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">{report.target.body}</p>
        <p className="mt-2 text-xs text-slate-500">oleh {report.target.displayName}</p>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg bg-white/[0.04] p-3">
      <p className="line-clamp-4 text-sm leading-6 text-slate-300">{report.target.body}</p>
      <p className="mt-2 text-xs text-slate-500">
        oleh {report.target.displayName} · post {report.target.postId}
      </p>
    </div>
  );
}

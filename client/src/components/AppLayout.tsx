import { Flame, LogIn, Radio, ShieldCheck, UsersRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { compactNumber, formatDateTime } from '../lib/time';
import { CountdownBadge } from './CountdownBadge';
import { GuestOnboarding } from './GuestOnboarding';
import { ToastHost } from './ToastHost';

export function AppLayout() {
  const { site, guest, setNeedsOnboarding } = useApp();

  return (
    <div className="min-h-screen overflow-hidden bg-ink text-slate-100">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 ambient-grid" />
        <div className="absolute inset-0 grain" />
        <div className="absolute -left-24 top-10 h-96 w-96 rounded-full bg-ember/10 blur-3xl" />
        <div className="absolute -right-28 top-24 h-[30rem] w-[30rem] rounded-full bg-aqua/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-mint/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/72 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-3">
          <Link to="/" className="flex min-w-0 flex-1 items-center gap-2 text-white">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-ember/30 bg-ember/15 text-ember shadow-[0_0_28px_rgba(255,90,54,0.22)]">
              <Flame className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-lg font-semibold leading-5">{site?.siteName ?? 'SebelumTutup'}</span>
              <span className="hidden items-center gap-1 text-[11px] text-slate-500 sm:flex">
                <span className="live-dot h-1.5 w-1.5" />
                live demo publik
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavItem to="/feed">Feed</NavItem>
            <NavItem to="/feed?sort=trending">Trending</NavItem>
            <NavItem to="/admin">Admin</NavItem>
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-mint/20 bg-mint/10 px-3 py-1.5 text-xs text-mint lg:inline-flex">
              <Radio className="h-3.5 w-3.5" />
              {compactNumber(site?.stats.onlineUsers ?? 0)} online
            </span>
            {site && <CountdownBadge closeAt={site.siteCloseAt} compact />}
            <button
              type="button"
              onClick={() => setNeedsOnboarding(true)}
              className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 transition hover:border-white/25 hover:bg-white/[0.08] sm:flex"
              title="Ubah mode guest"
            >
              <LogIn className="h-4 w-4" />
              {guest?.isAnonymous ? 'Anonim' : guest?.nickname ?? 'Guest'}
            </button>
          </div>
        </div>

        <div className="border-t border-white/5 bg-ink/45 md:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-around px-2 py-2 text-sm">
            <NavItem to="/feed">Feed</NavItem>
            <NavItem to="/feed?sort=trending">Trending</NavItem>
            <NavItem to="/admin">Admin</NavItem>
          </div>
        </div>
      </header>

      {site?.readOnly && (
        <div className="border-b border-ember/25 bg-ember/10 px-4 py-3 text-center text-sm text-ember">
          Demo ini sudah melewati tanggal tutup. Feed tetap bisa dibaca, aksi baru dinonaktifkan.
        </div>
      )}

      <main className="relative">
        <Outlet />
      </main>

      <footer className="mt-12 border-t border-white/10 bg-ink/45 px-4 py-8 text-sm text-slate-400 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-medium text-slate-200">{site?.siteName ?? 'SebelumTutup'}</p>
            {site && <p>Website demo ini akan tutup pada {formatDateTime(site.siteCloseAt)}.</p>}
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2">
              <UsersRound className="h-4 w-4 text-mint" />
              {compactNumber(site?.stats.onlineUsers ?? 0)} online
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-aqua" />
              Moderasi dasar aktif
            </span>
          </div>
        </div>
      </footer>

      <GuestOnboarding />
      <ToastHost />
    </div>
  );
}

function NavItem({ to, children }: { to: string; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-lg px-3 py-2 text-sm transition ${
          isActive ? 'bg-white text-ink' : 'text-slate-300 hover:bg-white/10 hover:text-white'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

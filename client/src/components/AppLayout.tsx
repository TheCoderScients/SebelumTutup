import { Flame, LogIn, ShieldCheck, UsersRound } from 'lucide-react';
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
    <div className="min-h-screen bg-ink text-slate-100">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(120deg,rgba(255,90,54,0.12),transparent_28%),linear-gradient(220deg,rgba(68,214,168,0.10),transparent_30%),linear-gradient(0deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:auto,auto,100%_36px]" />
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex min-w-0 items-center gap-2 text-white">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ember text-white">
              <Flame className="h-5 w-5" />
            </span>
            <span className="truncate text-lg font-semibold">{site?.siteName ?? 'SebelumTutup'}</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavItem to="/feed">Feed</NavItem>
            <NavItem to="/feed?sort=trending">Trending</NavItem>
            <NavItem to="/admin">Admin</NavItem>
          </nav>

          <div className="flex items-center gap-2">
            {site && <CountdownBadge closeAt={site.siteCloseAt} compact />}
            <button
              type="button"
              onClick={() => setNeedsOnboarding(true)}
              className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:border-white/25 hover:bg-white/10 sm:flex"
              title="Ubah mode guest"
            >
              <LogIn className="h-4 w-4" />
              {guest?.isAnonymous ? 'Anonim' : guest?.nickname ?? 'Guest'}
            </button>
          </div>
        </div>

        <div className="border-t border-white/5 md:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-around px-4 py-2 text-sm">
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

      <main>
        <Outlet />
      </main>

      <footer className="mt-12 border-t border-white/10 px-4 py-8 text-sm text-slate-400">
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

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiFetch } from '../lib/api';
import { socket } from '../lib/socket';
import type { Guest, SiteInfo } from '../types/api';

type Toast = {
  id: string;
  message: string;
  tone?: 'success' | 'error' | 'info';
};

type GuestPrefs = {
  nickname: string | null;
  isAnonymous: boolean;
};

type AppContextValue = {
  guest: Guest | null;
  site: SiteInfo | null;
  booting: boolean;
  needsOnboarding: boolean;
  toasts: Toast[];
  setNeedsOnboarding: (value: boolean) => void;
  completeOnboarding: (prefs: GuestPrefs) => Promise<void>;
  refreshSite: () => Promise<void>;
  pushToast: (message: string, tone?: Toast['tone']) => void;
  dismissToast: (id: string) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

function readSavedPrefs(): GuestPrefs | null {
  const raw = localStorage.getItem('seb_guest_prefs');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as GuestPrefs;
    return {
      nickname: parsed.nickname || null,
      isAnonymous: Boolean(parsed.isAnonymous)
    };
  } catch {
    return null;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [guest, setGuest] = useState<Guest | null>(null);
  const [site, setSite] = useState<SiteInfo | null>(null);
  const [booting, setBooting] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useCallback((message: string, tone: Toast['tone'] = 'info') => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3600);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const refreshSite = useCallback(async () => {
    const nextSite = await apiFetch<SiteInfo>('/api/site/stats');
    setSite(nextSite);
  }, []);

  const bootstrap = useCallback(async (prefs?: GuestPrefs | null) => {
    const nextGuest = await apiFetch<Guest>('/api/guest/bootstrap', {
      method: 'POST',
      body: JSON.stringify(prefs ?? {})
    });
    setGuest(nextGuest);
    return nextGuest;
  }, []);

  const completeOnboarding = useCallback(
    async (prefs: GuestPrefs) => {
      const nextPrefs = {
        nickname: prefs.isAnonymous ? null : prefs.nickname?.trim() || null,
        isAnonymous: prefs.isAnonymous
      };
      const nextGuest = await bootstrap(nextPrefs);
      localStorage.setItem('seb_guest_ready', '1');
      localStorage.setItem(
        'seb_guest_prefs',
        JSON.stringify({
          nickname: nextGuest.nickname,
          isAnonymous: nextPrefs.isAnonymous
        })
      );
      setNeedsOnboarding(false);
      pushToast(nextPrefs.isAnonymous ? 'Masuk sebagai Anonim.' : `Masuk sebagai ${nextGuest.nickname}.`, 'success');
    },
    [bootstrap, pushToast]
  );

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        const savedReady = localStorage.getItem('seb_guest_ready') === '1';
        const prefs = savedReady ? readSavedPrefs() : null;
        const [nextGuest, nextSite] = await Promise.all([bootstrap(prefs), apiFetch<SiteInfo>('/api/site/stats')]);
        if (!alive) return;
        setGuest(nextGuest);
        setSite(nextSite);
        setNeedsOnboarding(!savedReady);
      } catch (error) {
        if (alive) pushToast(error instanceof Error ? error.message : 'Gagal memuat aplikasi', 'error');
      } finally {
        if (alive) setBooting(false);
      }
    }

    run();
    socket.connect();

    const onlineHandler = (payload: { count: number }) => {
      setSite((current) =>
        current
          ? {
              ...current,
              stats: {
                ...current.stats,
                onlineUsers: payload.count
              }
            }
          : current
      );
    };

    socket.on('site:online_count', onlineHandler);

    return () => {
      alive = false;
      socket.off('site:online_count', onlineHandler);
      socket.disconnect();
    };
  }, [bootstrap, pushToast]);

  const value = useMemo<AppContextValue>(
    () => ({
      guest,
      site,
      booting,
      needsOnboarding,
      toasts,
      setNeedsOnboarding,
      completeOnboarding,
      refreshSite,
      pushToast,
      dismissToast
    }),
    [guest, site, booting, needsOnboarding, toasts, completeOnboarding, refreshSite, pushToast, dismissToast]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp harus dipakai di dalam AppProvider');
  return context;
}

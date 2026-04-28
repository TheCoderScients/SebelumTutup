import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { useApp } from './contexts/AppContext';
import { AdminPage } from './pages/AdminPage';
import { FeedPage } from './pages/FeedPage';
import { LandingPage } from './pages/LandingPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PostDetailPage } from './pages/PostDetailPage';

export function App() {
  const { booting } = useApp();

  if (booting) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink px-4 text-center text-slate-100">
        <div>
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-mint" />
          <p className="mt-4 text-sm text-slate-400">Menyalakan feed...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/trending" element={<Navigate to="/feed?sort=trending" replace />} />
        <Route path="/post/:id" element={<PostDetailPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

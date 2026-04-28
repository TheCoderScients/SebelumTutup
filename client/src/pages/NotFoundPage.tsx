import { Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="mx-auto grid min-h-[70vh] max-w-3xl place-items-center px-4 py-12 text-center">
      <div>
        <p className="text-sm text-aqua">404</p>
        <h1 className="mt-3 text-4xl font-bold text-white">Halaman tidak ditemukan</h1>
        <p className="mt-3 text-slate-400">Link ini tidak punya post, feed, atau admin panel yang bisa dibuka.</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-slate-200"
        >
          <Home className="h-4 w-4" />
          Ke beranda
        </Link>
      </div>
    </section>
  );
}

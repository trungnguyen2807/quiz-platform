import { Link, NavLink, Outlet } from 'react-router-dom';
import clsx from 'clsx';

export default function PublicLayout() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-brand-700">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
              Q
            </span>
            Quiz Platform
          </Link>
          <nav className="flex items-center gap-1 text-sm font-medium">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                clsx(
                  'rounded-lg px-3 py-2 transition-colors',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                )
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/quizzes"
              className={({ isActive }) =>
                clsx(
                  'rounded-lg px-3 py-2 transition-colors',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                )
              }
            >
              Quizzes
            </NavLink>
            <Link
              to="/admin"
              className="rounded-lg px-3 py-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        Quiz Platform · Play fast, learn faster
      </footer>
    </div>
  );
}

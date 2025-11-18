import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminTopbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-black/70 px-4 py-4 backdrop-blur-xl">
      <div className="flex items-center gap-2 lg:hidden">
        <Link to="/" className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
          Lasko Admin
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-gray-300 hover:text-white hover:border-emerald-400/60"
        >
          Wróć do strony głównej
        </Link>
        <Link
          to="/dashboard"
          className="hidden rounded-full border border-white/10 px-4 py-2 text-sm text-gray-300 hover:text-white hover:border-emerald-400/60 md:inline-flex"
        >
          Dashboard użytkownika
        </Link>
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
            {user?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="hidden text-sm md:block">
            <div className="font-semibold text-white">{user?.username}</div>
            <div className="text-gray-400 text-xs uppercase tracking-wider">Administrator</div>
          </div>
          <button
            onClick={logout}
            className="rounded-full border border-emerald-400/40 px-3 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/10"
          >
            Wyloguj
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;


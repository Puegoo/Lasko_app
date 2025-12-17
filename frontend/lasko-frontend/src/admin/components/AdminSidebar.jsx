import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const links = [
  { to: '/admin', label: 'Dashboard', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-emerald-300"><path d="M3 13h4v8H3zM9 3h4v18H9zM15 9h4v12h-4z" fill="currentColor"/></svg>
  ) },
  { to: '/admin/users', label: 'Użytkownicy', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-emerald-300"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm-7 9v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ) },
  { to: '/admin/exercises', label: 'Ćwiczenia', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-emerald-300"><path d="M21 11H14.9a.9.9 0 0 1-.9-.9V5h-4v5.1a.9.9 0 0 1-.9.9H3v2h5.1a.9.9 0 0 1 .9.9V21h4v-6.1a.9.9 0 0 1 .9-.9H21z" fill="currentColor"/></svg>
  ) },
  { to: '/admin/plans', label: 'Plany', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-emerald-300"><path d="M6 3h12a2 2 0 0 1 2 2v16l-4-2-4 2-4-2-4 2V5a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ) },
  { to: '/admin/recommendations', label: 'Rekomendacje', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-emerald-300"><path d="M3 13h4v8H3zm7-10h4v18h-4zm7 6h4v12h-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ) },
];

const AdminSidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-white/10 bg-black/80 backdrop-blur-xl lg:flex">
      <div className="flex h-full w-full flex-col">
        <div className="px-6 py-6 border-b border-white/10">
          <Link to="/" className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
            Lasko Admin
          </Link>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {links.map((link) => {
            const active = location.pathname === link.to || (link.to !== '/admin' && location.pathname.startsWith(link.to));
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-emerald-500/20 text-white border border-emerald-400/40 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="opacity-80">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default AdminSidebar;





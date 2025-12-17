import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminTopbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Icon button component with tooltip
  const IconButton = ({ icon, tooltip, onClick, to, className = '' }) => {
    const baseClasses = "relative flex items-center justify-center w-10 h-10 rounded-lg text-gray-300 hover:text-white transition-all duration-200 hover:bg-white/5 hover:border-white/10 border border-transparent group";
    const content = (
      <>
        {icon}
        {tooltip && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1.5 text-xs font-medium text-white bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50">
            {tooltip}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-0 border-4 border-transparent border-b-gray-900/95" />
          </div>
        )}
      </>
    );

    if (to) {
      return (
        <Link to={to} className={`${baseClasses} ${className}`}>
          {content}
        </Link>
      );
    }

    return (
      <button onClick={onClick} className={`${baseClasses} ${className}`}>
        {content}
      </button>
    );
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-black/70 px-4 py-3 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <Link to="/admin" className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 transition-all duration-300">
          Lasko Admin
        </Link>
      </div>

      <div className="hidden items-center gap-2 md:flex">
        {/* User info */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <div className="text-sm">
            <div className="font-semibold text-white">{user?.username}</div>
            <div className="text-gray-400 text-xs uppercase tracking-wider">Administrator</div>
          </div>
        </div>

        {/* Action buttons */}
        <IconButton
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          }
          tooltip="Strona główna"
          to="/"
        />
        <IconButton
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          }
          tooltip="Wyloguj"
          onClick={handleLogout}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
        />
      </div>

      {/* Mobile menu button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="md:hidden rounded-lg p-2 text-gray-300 hover:bg-white/5 hover:text-white transition-colors border border-transparent hover:border-white/10"
        aria-label="Otwórz menu"
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {open ? (
            <path d="M18 6L6 18M6 6l12 12" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>

      {/* Mobile menu */}
      {open && (
        <div className="absolute top-full left-0 right-0 md:hidden border-t border-white/5 bg-black/95 backdrop-blur-xl px-4 py-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg bg-white/5 border border-white/10">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <div className="text-sm">
                <div className="font-semibold text-white">{user?.username}</div>
                <div className="text-gray-400 text-xs uppercase tracking-wider">Administrator</div>
              </div>
            </div>
            <Link 
              to="/" 
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-200 hover:bg-white/5 hover:text-white transition-colors border border-transparent hover:border-white/10"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Strona główna</span>
            </Link>
            <button 
              onClick={() => {
                setOpen(false);
                handleLogout();
              }} 
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors border border-transparent hover:border-red-500/20"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Wyloguj</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default AdminTopbar;





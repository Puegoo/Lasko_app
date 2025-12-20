// Poprawiony wygląd dopasowany do stylu HomePage + alternatywne rekomendacje (2 dodatkowe)
// Dodatkowo: stabilne przekazanie username do PlanSummary i zapis w sessionStorage

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthDebug from '../../utils/authDebug';
import { RecommendationService } from '../../services/recommendationService';
import saveUserProfile from '../../services/saveUserProfile';

// ---------- Lokalne UI helpers ----------
const GradientGridBg = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
    <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-[#1DCD9F]/10 blur-3xl" />
    <div className="absolute top-1/3 -right-20 w-96 h-96 rounded-full bg-[#0D7A61]/10 blur-3xl" />
    <svg className="absolute inset-0 h-full w-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  </div>
);

const GlowOrb = ({ className }) => (
  <div aria-hidden className={`pointer-events-none absolute rounded-full blur-2xl opacity-30 ${className}`} />
);

const Kicker = ({ children }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold tracking-wide text-emerald-300">
    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 motion-reduce:animate-none" />
    {children}
  </span>
);

const PrimaryButton = ({ onClick, children, disabled, type = 'button', className = '' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={[
      'group relative inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-bold text-white transition-transform',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 active:scale-[0.98]',
      disabled ? 'opacity-60 cursor-not-allowed' : '',
      className,
    ].join(' ')}
  >
    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] opacity-90 transition-opacity group-hover:opacity-100" />
    <span className="absolute inset-0 -z-10 rounded-full blur-md bg-emerald-500/20 group-hover:bg-emerald-500/30" />
    <span className="relative">{children}</span>
  </button>
);

const SecondaryButton = ({ onClick, children, disabled, className = '', type = 'button' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={[
      'inline-flex items-center justify-center rounded-full border-2 border-emerald-400/60 px-7 py-3 text-sm font-bold text-emerald-300',
      'hover:bg-emerald-400/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60',
      disabled ? 'opacity-60 cursor-not-allowed' : '',
      className,
    ].join(' ')}
  >
    {children}
  </button>
);

// Navbar (odporny na opóźnione nawodnienie usera)
const Navbar = () => {
  const { user, logout, isAuthenticated, getToken, debugAuth } = useAuth();
  const looksAuthed =
    (typeof isAuthenticated === 'function' && isAuthenticated()) ||
    (typeof getToken === 'function' && !!getToken());

  // Pobierz username z różnych źródeł (fallback chain)
  const getUsernameFromStorage = () => {
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const parsed = JSON.parse(userData);
        return parsed.username || parsed.first_name;
      }
    } catch {
      return null;
    }
    return null;
  };

  const navbarName =
    user?.username || 
    user?.first_name ||
    sessionStorage.getItem('lasko_username') || 
    getUsernameFromStorage() ||
    'Użytkowniku';

  useEffect(() => {
    if (user?.username) {
      sessionStorage.setItem('lasko_username', user.username);
    }
  }, [user?.username]);

  useEffect(() => {
    if (!user && looksAuthed) {
      try { 
        debugAuth?.(); 
      } catch (error) {
        console.warn('[Navbar] Debug auth failed:', error);
      }
    }
  }, [user, looksAuthed, debugAuth]);

  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-4">
        <Link to="/" className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
          Lasko
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          {looksAuthed ? (
            <>
              <span className="hidden text-sm text-gray-300 lg:inline">
                Witaj, <span className="font-semibold text-white">{navbarName}</span>!
              </span>
              <Link
                to="/dashboard"
                className="group relative inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-bold text-white"
              >
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] opacity-90 transition-opacity group-hover:opacity-100" />
                <span className="relative">Dashboard</span>
              </Link>
              <button onClick={logout} className="text-sm text-gray-300 hover:text-white">
                Wyloguj
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full border-2 border-emerald-400/60 px-7 py-3 text-sm font-bold text-emerald-300 hover:bg-emerald-400/10 transition-colors"
              >
                Mam konto
              </Link>
              <Link
                to="/register"
                className="group relative inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-bold text-white"
              >
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] opacity-90 transition-opacity group-hover:opacity-100" />
                <span className="relative">Zarejestruj się</span>
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen(v => !v)}
          className="md:hidden rounded-full p-2 text-gray-300 hover:bg-white/5 hover:text-white"
          aria-label="Otwórz menu"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeWidth="2" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/5 bg-black/80 px-6 py-3">
          <div className="flex flex-col gap-2">
            {looksAuthed ? (
              <>
                <Link to="/dashboard" className="rounded-lg px-3 py-2 text-gray-200 hover:bg-white/5">
                  Dashboard
                </Link>
                <button onClick={logout} className="rounded-lg px-3 py-2 text-left text-gray-200 hover:bg-white/5">
                  Wyloguj
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-lg px-3 py-2 text-gray-200 hover:bg-white/5">
                  Logowanie
                </Link>
                <Link to="/register" className="rounded-lg px-3 py-2 text-gray-200 hover:bg-white/5">
                  Rejestracja
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

// ============================================================================
// DANE KONFIGURACYJNE
// ============================================================================
const methodOptions = [
  { 
    value: 'user', 
    label: 'Na podstawie klienta', 
    description: 'Rekomendacje oparte na podobnych użytkownikach', 
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-purple-400"><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="17" cy="7" r="3" stroke="currentColor" strokeWidth="2"/><path d="M23 21v-2a3 3 0 0 0-3-3h-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
  },
  { 
    value: 'hybrid', 
    label: 'Podejście hybrydowe', 
    description: 'Kombinacja obydwu metod – najbardziej precyzyjne', 
    icon: <svg width="32" height="32" viewBox="0 0 16 16" fill="none" className="text-emerald-400"><path d="M7.657 6.247c.11-.33.576-.33.686 0l.645 1.937a2.89 2.89 0 0 0 1.829 1.828l1.936.645c.33.11.33.576 0 .686l-1.937.645a2.89 2.89 0 0 0-1.828 1.829l-.645 1.936a.361.361 0 0 1-.686 0l-.645-1.937a2.89 2.89 0 0 0-1.828-1.828l-1.937-.645a.361.361 0 0 1 0-.686l1.937-.645a2.89 2.89 0 0 0 1.828-1.828l.645-1.937zM3.794 1.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387A1.734 1.734 0 0 0 4.593 5.69l-.387 1.162a.217.217 0 0 1-.412 0L3.407 5.69A1.734 1.734 0 0 0 2.31 4.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387A1.734 1.734 0 0 0 3.407 2.31l.387-1.162zM10.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.156 1.156 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.156 1.156 0 0 0-.732-.732L9.1 2.137a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732L10.863.1z" fill="currentColor"/></svg>,
    badge: 'ZALECANE'
  },
  { 
    value: 'product', 
    label: 'Na podstawie produktu', 
    description: 'Plany dobrane według charakterystyki planów', 
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-blue-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
  },
];

const goalOptions = [
  { 
    value: 'masa', 
    label: 'Masa mięśniowa', 
    icon: <svg width="28" height="28" viewBox="0 0 36 36" fill="currentColor" className="text-orange-400"><path d="M15.977 9.36h3.789a.777.777 0 0 0 .058-.673l-3.846-4.705V9.36z"></path><path d="M12.804 22.277a9.192 9.192 0 0 0-.206-.973c-.62-2.223-1.14-3.164-.918-5.494c.29-1.584.273-4.763 4.483-4.268c1.112.131 2.843.927 3.834.91c.567-.01.98-1.157 1.017-1.539c.051-.526-.865-1.42-1.248-1.554a94.35 94.35 0 0 0-2.681-.824c-1.039-.301-.985-1.705-1.051-2.205a.597.597 0 0 1 .294-.591c.21-.124.375-.008.579.125l.885.648c.497.426-.874 1.24-.503 1.376c0 0 1.755.659 2.507.796c.412.075 1.834-1.529 1.917-2.47c.065-.74-3.398-4.083-5.867-5.381c-.868-.456-1.377-.721-1.949-.694c-.683.032-.898.302-1.748 1.03C8.302 4.46 4.568 11.577 4.02 13.152c-2.246 6.461-2.597 9.865-2.677 11.788a21.26 21.26 0 0 0-.076 1.758c.065 0-1 5 0 6s5.326 1 5.326 1c10 3.989 28.57 2.948 28.57-7.233c0-12.172-18.813-10.557-22.359-4.188z"></path><path d="M20.63 32.078c-3.16-.332-5.628-1.881-5.767-1.97a1 1 0 0 1 1.075-1.687c.04.025 4.003 2.492 7.846 1.467c2.125-.566 3.867-2.115 5.177-4.601a1 1 0 0 1 1.77.932c-1.585 3.006-3.754 4.893-6.447 5.606c-1.257.332-2.502.374-3.654.253z"></path></svg>
  },
  { 
    value: 'sila', 
    label: 'Siła', 
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-red-400"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor"/></svg>
  },
  { 
    value: 'wytrzymalosc', 
    label: 'Wytrzymałość', 
    icon: <svg width="28" height="28" viewBox="0 0 16 16" fill="none" className="text-green-400" stroke="currentColor" strokeWidth="1.5"><path d="M6.516,2.612L9.325,3.55l0.734,2.934l0.188,0.75l0.644,0.428l2.238,1.494L13.734,14H2.441l0.331-1.65l1.125-0.562 l0.875-0.438l0.191-0.959L6.516,2.612 M5,0L3,10l-2,1l-1,5h16l-1-8l-3-2l-1-4L5,0L5,0z" /></svg>
  },
  { 
    value: 'zdrowie', 
    label: 'Zdrowie ogólne', 
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-pink-400"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" fill="currentColor"/></svg>
  },
  { 
    value: 'spalanie', 
    label: 'Redukcja tkanki tłuszczowej', 
    icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="currentColor" className="text-yellow-400"><path d="M25.378 19.75c1.507 6.027-3.162 11.25-9.375 11.25s-10.9-5.149-9.375-11.25c0.937-3.75 5.625-9.375 9.375-18.75 3.75 9.374 8.438 15 9.375 18.75z"></path></svg>,
    colspan: 'sm:col-span-2 lg:col-span-2'  // 🆕 Szerokość 2 kafelków
  },
];

const levelOptions = [
  { value: 'poczatkujacy', label: 'Początkujący', description: '0-1 rok' },
  { value: 'sredniozaawansowany', label: 'Średnio­zaawansowany', description: '2-3 lata' },
  { value: 'zaawansowany', label: 'Zaawansowany', description: '3+ lata' },
];

const equipmentOptions = [
  { 
    value: 'silownia', 
    label: 'Pełna siłownia', 
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-gray-300" stroke="currentColor" strokeWidth="1.5"><path d="M17.2346 16.8478L16.9476 17.5407L17.2346 16.8478ZM16 13.5H16.75C16.75 13.0858 16.4142 12.75 16 12.75V13.5ZM16.1522 15.7654L15.4593 16.0524L16.1522 15.7654ZM21.8478 15.7654L22.5407 16.0524L21.8478 15.7654ZM20.7654 16.8478L20.4784 16.1548L20.7654 16.8478ZM20.7654 7.15224L20.4784 7.84515V7.84515L20.7654 7.15224ZM21.1549 8.52165C21.3134 8.90433 21.7521 9.08606 22.1348 8.92754C22.5175 8.76903 22.6992 8.3303 22.5407 7.94762L21.1549 8.52165ZM17.2346 7.15224L16.9476 6.45933L16.9476 6.45933L17.2346 7.15224ZM16 10.5V11.25C16.4142 11.25 16.75 10.9142 16.75 10.5H16ZM16.1522 8.23463L15.4593 7.94762L16.1522 8.23463ZM3.23463 16.8478L2.94762 17.5407L3.23463 16.8478ZM2.15224 15.7654L1.45933 16.0524L1.45933 16.0524L2.15224 15.7654ZM8 13.5V12.75C7.58579 12.75 7.25 13.0858 7.25 13.5H8ZM7.84776 15.7654L8.54067 16.0524L7.84776 15.7654ZM6.76537 16.8478L7.05238 17.5407H7.05238L6.76537 16.8478ZM6.76537 7.15224L7.05238 6.45933V6.45933L6.76537 7.15224ZM8 10.5H7.25C7.25 10.9142 7.58579 11.25 8 11.25V10.5ZM7.84776 8.23463L8.54067 7.94762L7.84776 8.23463ZM3.23463 7.15224L2.94762 6.45933L3.23463 7.15224ZM2.15224 8.23463L1.45933 7.94762L2.15224 8.23463ZM22.75 12C22.75 11.5858 22.4142 11.25 22 11.25C21.5858 11.25 21.25 11.5858 21.25 12H22.75ZM19 16.25C18.5238 16.25 18.2042 16.2496 17.9567 16.2327C17.716 16.2163 17.5988 16.1868 17.5216 16.1548L16.9476 17.5407C17.238 17.661 17.5375 17.7076 17.8546 17.7292C18.165 17.7504 18.5443 17.75 19 17.75V16.25ZM15.25 13.5C15.25 13.961 15.2498 14.4545 15.2699 14.8796C15.2799 15.0928 15.2955 15.3014 15.3211 15.4889C15.3452 15.6654 15.3841 15.8706 15.4593 16.0524L16.8452 15.4784C16.847 15.4828 16.8416 15.4703 16.8329 15.4328C16.8247 15.3969 16.8159 15.3485 16.8073 15.2859C16.7901 15.1597 16.7772 14.9997 16.7682 14.809C16.7502 14.4263 16.75 13.9709 16.75 13.5H15.25ZM17.5216 16.1548C17.2154 16.028 16.972 15.7846 16.8452 15.4784L15.4593 16.0524C15.7384 16.7262 16.2738 17.2616 16.9476 17.5407L17.5216 16.1548ZM21.25 14C21.25 14.4762 21.2496 14.7958 21.2327 15.0433C21.2163 15.284 21.1868 15.4012 21.1549 15.4784L22.5407 16.0524C22.661 15.762 22.7076 15.4625 22.7292 15.1454C22.7504 14.835 22.75 14.4557 22.75 14H21.25ZM19 17.75C19.4557 17.75 19.835 17.7504 20.1454 17.7292C20.4625 17.7076 20.762 17.661 21.0524 17.5407L20.4784 16.1548C20.4012 16.1868 20.284 16.2163 20.0433 16.2327C19.7958 16.2496 19.4762 16.25 19 16.25V17.75ZM21.1549 15.4784C21.028 15.7846 20.7846 16.028 20.4784 16.1548L21.0524 17.5407C21.7262 17.2616 22.2616 16.7262 22.5407 16.0524L21.1549 15.4784ZM19 7.75C19.4762 7.75 19.7958 7.75041 20.0433 7.76729C20.284 7.78372 20.4012 7.81319 20.4784 7.84515L21.0524 6.45933C20.762 6.33905 20.4625 6.29241 20.1454 6.27077C19.835 6.24959 19.4557 6.25 19 6.25V7.75ZM20.4784 7.84515C20.7846 7.97202 21.028 8.21536 21.1549 8.52165L22.5407 7.94762C22.2616 7.27379 21.7262 6.73844 21.0524 6.45933L20.4784 7.84515ZM19 6.25C18.5443 6.25 18.165 6.24959 17.8546 6.27077C17.5375 6.29241 17.238 6.33905 16.9476 6.45933L17.5216 7.84515C17.5988 7.81319 17.716 7.78372 17.9567 7.76729C18.2042 7.75041 18.5238 7.75 19 7.75V6.25ZM16.75 10.5C16.75 10.0291 16.7502 9.5737 16.7682 9.19099C16.7772 9.00026 16.7901 8.84026 16.8073 8.71407C16.8159 8.65147 16.8247 8.60307 16.8329 8.56724C16.8416 8.52968 16.847 8.51715 16.8452 8.52165L15.4593 7.94762C15.3841 8.12935 15.3452 8.33457 15.3211 8.51115C15.2955 8.69856 15.2799 8.9072 15.2699 9.12039C15.2498 9.5455 15.25 10.039 15.25 10.5H16.75ZM16.9476 6.45933C16.2738 6.73844 15.7384 7.27379 15.4593 7.94762L16.8452 8.52165C16.972 8.21536 17.2154 7.97202 17.5216 7.84515L16.9476 6.45933ZM2.75 14V10H1.25V14H2.75ZM5 16.25C4.5238 16.25 4.20421 16.2496 3.95674 16.2327C3.71601 16.2163 3.5988 16.1868 3.52165 16.1548L2.94762 17.5407C3.23801 17.661 3.53754 17.7076 3.85464 17.7292C4.165 17.7504 4.54432 17.75 5 17.75V16.25ZM1.25 14C1.25 14.4557 1.24959 14.835 1.27077 15.1454C1.29241 15.4625 1.33905 15.762 1.45933 16.0524L2.84515 15.4784C2.81319 15.4012 2.78372 15.284 2.76729 15.0433C2.75041 14.7958 2.75 14.4762 2.75 14H1.25ZM3.52165 16.1548C3.21536 16.028 2.97202 15.7846 2.84515 15.4784L1.45933 16.0524C1.73844 16.7262 2.27379 17.2616 2.94762 17.5407L3.52165 16.1548ZM7.25 13.5C7.25 13.9709 7.24983 14.4263 7.2318 14.809C7.22282 14.9997 7.2099 15.1597 7.19267 15.2859C7.18412 15.3485 7.17529 15.3969 7.16706 15.4328C7.15843 15.4703 7.15299 15.4828 7.15485 15.4784L8.54067 16.0524C8.61595 15.8706 8.65477 15.6654 8.67888 15.4889C8.70447 15.3014 8.72009 15.0928 8.73014 14.8796C8.75017 14.4545 8.75 13.961 8.75 13.5H7.25ZM5 17.75C5.45568 17.75 5.835 17.7504 6.14536 17.7292C6.46246 17.7076 6.76199 17.661 7.05238 17.5407L6.47835 16.1548C6.4012 16.1868 6.28399 16.2163 6.04326 16.2327C5.79579 16.2496 5.4762 16.25 5 16.25V17.75ZM7.15485 15.4784C7.02798 15.7846 6.78464 16.028 6.47835 16.1548L7.05238 17.5407C7.72621 17.2616 8.26156 16.7262 8.54067 16.0524L7.15485 15.4784ZM5 7.75C5.4762 7.75 5.79579 7.75041 6.04326 7.76729C6.28399 7.78372 6.4012 7.81319 6.47835 7.84515L7.05238 6.45933C6.76199 6.33905 6.46246 6.29241 6.14536 6.27077C5.835 6.24959 5.45568 6.25 5 6.25V7.75ZM8.75 10.5C8.75 10.039 8.75017 9.5455 8.73014 9.12039C8.72009 8.9072 8.70447 8.69856 8.67888 8.51115C8.65477 8.33457 8.61595 8.12935 8.54067 7.94762L7.15485 8.52165C7.15299 8.51715 7.15843 8.52968 7.16706 8.56724C7.17529 8.60307 7.18412 8.65147 7.19267 8.71407C7.2099 8.84026 7.22282 9.00026 7.2318 9.19099C7.24983 9.5737 7.25 10.0291 7.25 10.5H8.75ZM6.47835 7.84515C6.78464 7.97202 7.02798 8.21536 7.15485 8.52165L8.54067 7.94762C8.26156 7.27379 7.72621 6.73844 7.05238 6.45933L6.47835 7.84515ZM5 6.25C4.54432 6.25 4.165 6.24959 3.85464 6.27077C3.53754 6.29241 3.23801 6.33905 2.94762 6.45933L3.52165 7.84515C3.5988 7.81319 3.71601 7.78372 3.95674 7.76729C4.20421 7.75041 4.5238 7.75 5 7.75V6.25ZM2.75 10C2.75 9.5238 2.75041 9.20421 2.76729 8.95674C2.78372 8.71601 2.81319 8.5988 2.84515 8.52165L1.45933 7.94762C1.33905 8.23801 1.29241 8.53754 1.27077 8.85464C1.24959 9.165 1.25 9.54432 1.25 10H2.75ZM2.94762 6.45933C2.27379 6.73844 1.73844 7.27379 1.45933 7.94762L2.84515 8.52165C2.97202 8.21536 3.21536 7.97202 3.52165 7.84515L2.94762 6.45933ZM8 11.25H16V9.75H8V11.25ZM16 12.75H8V14.25H16V12.75ZM21.25 12V14H22.75V12H21.25Z" fill="currentColor"/></svg>
  },
  { 
    value: 'dom_podstawowy', 
    label: 'Dom (hantle + ławka)', 
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-blue-400"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  },
  { 
    value: 'masa_ciala', 
    label: 'Dom (brak sprzętu)', 
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-green-400" stroke="currentColor" strokeWidth="1.5"><path d="M17.2346 16.8478L16.9476 17.5407L17.2346 16.8478ZM16 13.5H16.75C16.75 13.0858 16.4142 12.75 16 12.75V13.5ZM16.1522 15.7654L15.4593 16.0524L16.1522 15.7654ZM21.8478 15.7654L22.5407 16.0524L21.8478 15.7654ZM20.7654 16.8478L20.4784 16.1548L20.7654 16.8478ZM20.7654 7.15224L20.4784 7.84515V7.84515L20.7654 7.15224ZM21.1549 8.52165C21.3134 8.90433 21.7521 9.08606 22.1348 8.92754C22.5175 8.76903 22.6992 8.3303 22.5407 7.94762L21.1549 8.52165ZM17.2346 7.15224L16.9476 6.45933L16.9476 6.45933L17.2346 7.15224ZM16 10.5V11.25C16.4142 11.25 16.75 10.9142 16.75 10.5H16ZM16.1522 8.23463L15.4593 7.94762L16.1522 8.23463ZM3.23463 16.8478L2.94762 17.5407L3.23463 16.8478ZM2.15224 15.7654L1.45933 16.0524L1.45933 16.0524L2.15224 15.7654ZM8 13.5V12.75C7.58579 12.75 7.25 13.0858 7.25 13.5H8ZM7.84776 15.7654L8.54067 16.0524L7.84776 15.7654ZM6.76537 16.8478L7.05238 17.5407H7.05238L6.76537 16.8478ZM6.76537 7.15224L7.05238 6.45933V6.45933L6.76537 7.15224ZM8 10.5H7.25C7.25 10.9142 7.58579 11.25 8 11.25V10.5ZM7.84776 8.23463L8.54067 7.94762L7.84776 8.23463ZM3.23463 7.15224L2.94762 6.45933L3.23463 7.15224ZM2.15224 8.23463L1.45933 7.94762L2.15224 8.23463ZM22.75 12C22.75 11.5858 22.4142 11.25 22 11.25C21.5858 11.25 21.25 11.5858 21.25 12H22.75ZM19 16.25C18.5238 16.25 18.2042 16.2496 17.9567 16.2327C17.716 16.2163 17.5988 16.1868 17.5216 16.1548L16.9476 17.5407C17.238 17.661 17.5375 17.7076 17.8546 17.7292C18.165 17.7504 18.5443 17.75 19 17.75V16.25ZM15.25 13.5C15.25 13.961 15.2498 14.4545 15.2699 14.8796C15.2799 15.0928 15.2955 15.3014 15.3211 15.4889C15.3452 15.6654 15.3841 15.8706 15.4593 16.0524L16.8452 15.4784C16.847 15.4828 16.8416 15.4703 16.8329 15.4328C16.8247 15.3969 16.8159 15.3485 16.8073 15.2859C16.7901 15.1597 16.7772 14.9997 16.7682 14.809C16.7502 14.4263 16.75 13.9709 16.75 13.5H15.25ZM17.5216 16.1548C17.2154 16.028 16.972 15.7846 16.8452 15.4784L15.4593 16.0524C15.7384 16.7262 16.2738 17.2616 16.9476 17.5407L17.5216 16.1548ZM21.25 14C21.25 14.4762 21.2496 14.7958 21.2327 15.0433C21.2163 15.284 21.1868 15.4012 21.1549 15.4784L22.5407 16.0524C22.661 15.762 22.7076 15.4625 22.7292 15.1454C22.7504 14.835 22.75 14.4557 22.75 14H21.25ZM19 17.75C19.4557 17.75 19.835 17.7504 20.1454 17.7292C20.4625 17.7076 20.762 17.661 21.0524 17.5407L20.4784 16.1548C20.4012 16.1868 20.284 16.2163 20.0433 16.2327C19.7958 16.2496 19.4762 16.25 19 16.25V17.75ZM21.1549 15.4784C21.028 15.7846 20.7846 16.028 20.4784 16.1548L21.0524 17.5407C21.7262 17.2616 22.2616 16.7262 22.5407 16.0524L21.1549 15.4784ZM19 7.75C19.4762 7.75 19.7958 7.75041 20.0433 7.76729C20.284 7.78372 20.4012 7.81319 20.4784 7.84515L21.0524 6.45933C20.762 6.33905 20.4625 6.29241 20.1454 6.27077C19.835 6.24959 19.4557 6.25 19 6.25V7.75ZM20.4784 7.84515C20.7846 7.97202 21.028 8.21536 21.1549 8.52165L22.5407 7.94762C22.2616 7.27379 21.7262 6.73844 21.0524 6.45933L20.4784 7.84515ZM19 6.25C18.5443 6.25 18.165 6.24959 17.8546 6.27077C17.5375 6.29241 17.238 6.33905 16.9476 6.45933L17.5216 7.84515C17.5988 7.81319 17.716 7.78372 17.9567 7.76729C18.2042 7.75041 18.5238 7.75 19 7.75V6.25ZM16.75 10.5C16.75 10.0291 16.7502 9.5737 16.7682 9.19099C16.7772 9.00026 16.7901 8.84026 16.8073 8.71407C16.8159 8.65147 16.8247 8.60307 16.8329 8.56724C16.8416 8.52968 16.847 8.51715 16.8452 8.52165L15.4593 7.94762C15.3841 8.12935 15.3452 8.33457 15.3211 8.51115C15.2955 8.69856 15.2799 8.9072 15.2699 9.12039C15.2498 9.5455 15.25 10.039 15.25 10.5H16.75ZM16.9476 6.45933C16.2738 6.73844 15.7384 7.27379 15.4593 7.94762L16.8452 8.52165C16.972 8.21536 17.2154 7.97202 17.5216 7.84515L16.9476 6.45933ZM2.75 14V10H1.25V14H2.75ZM5 16.25C4.5238 16.25 4.20421 16.2496 3.95674 16.2327C3.71601 16.2163 3.5988 16.1868 3.52165 16.1548L2.94762 17.5407C3.23801 17.661 3.53754 17.7076 3.85464 17.7292C4.165 17.7504 4.54432 17.75 5 17.75V16.25ZM1.25 14C1.25 14.4557 1.24959 14.835 1.27077 15.1454C1.29241 15.4625 1.33905 15.762 1.45933 16.0524L2.84515 15.4784C2.81319 15.4012 2.78372 15.284 2.76729 15.0433C2.75041 14.7958 2.75 14.4762 2.75 14H1.25ZM3.52165 16.1548C3.21536 16.028 2.97202 15.7846 2.84515 15.4784L1.45933 16.0524C1.73844 16.7262 2.27379 17.2616 2.94762 17.5407L3.52165 16.1548ZM7.25 13.5C7.25 13.9709 7.24983 14.4263 7.2318 14.809C7.22282 14.9997 7.2099 15.1597 7.19267 15.2859C7.18412 15.3485 7.17529 15.3969 7.16706 15.4328C7.15843 15.4703 7.15299 15.4828 7.15485 15.4784L8.54067 16.0524C8.61595 15.8706 8.65477 15.6654 8.67888 15.4889C8.70447 15.3014 8.72009 15.0928 8.73014 14.8796C8.75017 14.4545 8.75 13.961 8.75 13.5H7.25ZM5 17.75C5.45568 17.75 5.835 17.7504 6.14536 17.7292C6.46246 17.7076 6.76199 17.661 7.05238 17.5407L6.47835 16.1548C6.4012 16.1868 6.28399 16.2163 6.04326 16.2327C5.79579 16.2496 5.4762 16.25 5 16.25V17.75ZM7.15485 15.4784C7.02798 15.7846 6.78464 16.028 6.47835 16.1548L7.05238 17.5407C7.72621 17.2616 8.26156 16.7262 8.54067 16.0524L7.15485 15.4784ZM5 7.75C5.4762 7.75 5.79579 7.75041 6.04326 7.76729C6.28399 7.78372 6.4012 7.81319 6.47835 7.84515L7.05238 6.45933C6.76199 6.33905 6.46246 6.29241 6.14536 6.27077C5.835 6.24959 5.45568 6.25 5 6.25V7.75ZM8.75 10.5C8.75 10.039 8.75017 9.5455 8.73014 9.12039C8.72009 8.9072 8.70447 8.69856 8.67888 8.51115C8.65477 8.33457 8.61595 8.12935 8.54067 7.94762L7.15485 8.52165C7.15299 8.51715 7.15843 8.52968 7.16706 8.56724C7.17529 8.60307 7.18412 8.65147 7.19267 8.71407C7.2099 8.84026 7.22282 9.00026 7.2318 9.19099C7.24983 9.5737 7.25 10.0291 7.25 10.5H8.75ZM6.47835 7.84515C6.78464 7.97202 7.02798 8.21536 7.15485 8.52165L8.54067 7.94762C8.26156 7.27379 7.72621 6.73844 7.05238 6.45933L6.47835 7.84515ZM5 6.25C4.54432 6.25 4.165 6.24959 3.85464 6.27077C3.53754 6.29241 3.23801 6.33905 2.94762 6.45933L3.52165 7.84515C3.5988 7.81319 3.71601 7.78372 3.95674 7.76729C4.20421 7.75041 4.5238 7.75 5 7.75V6.25ZM2.75 10C2.75 9.5238 2.75041 9.20421 2.76729 8.95674C2.78372 8.71601 2.81319 8.5988 2.84515 8.52165L1.45933 7.94762C1.33905 8.23801 1.29241 8.53754 1.27077 8.85464C1.24959 9.165 1.25 9.54432 1.25 10H2.75ZM2.94762 6.45933C2.27379 6.73844 1.73844 7.27379 1.45933 7.94762L2.84515 8.52165C2.97202 8.21536 3.21536 7.97202 3.52165 7.84515L2.94762 6.45933ZM8 11.25H16V9.75H8V11.25ZM16 12.75H8V14.25H16V12.75ZM21.25 12V14H22.75V12H21.25Z" fill="currentColor"/><line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
  },
  { 
    value: 'minimalne', 
    label: 'Minimalne wyposażenie', 
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-red-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.364 18.364C19.9926 16.7353 21 14.4853 21 12C21 7.02944 16.9706 3 12 3C9.51472 3 7.26472 4.00736 5.63604 5.63604M18.364 18.364C16.7353 19.9926 14.4853 21 12 21C7.02944 21 3 16.9706 3 12C3 9.51472 4.00736 7.26472 5.63604 5.63604M18.364 18.364L5.63604 5.63604"/></svg>
  },
];

const EnhancedPlanCreator = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, isAuthenticated, getToken, generateRecommendations, debugAuth } = useAuth();
  const recApi = useMemo(() => new RecommendationService(), []);

  // Pobierz dane użytkownika z różnych źródeł (fallback)
  const getUserFromStorage = () => {
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        return JSON.parse(userData);
      }
    } catch {
      return null;
    }
    return null;
  };

  const currentUser = user || getUserFromStorage();

  // pamiętaj username w sessionStorage, gdy tylko się pojawi
  useEffect(() => {
    if (user?.username) {
      sessionStorage.setItem('lasko_username', user.username);
    }
  }, [user?.username]);

  // Normalizacja struktury planu z /detailed do { days: [{ title, exercises: [...] }] }
  const normalizePlanDetails = (base, detailed) => {
    const plan = detailed?.plan || detailed || {};
    const daysRaw = plan.days ?? plan.workouts ?? plan.sessions ?? [];
    const days = Array.isArray(daysRaw)
      ? daysRaw.map((d, idx) => ({
          title: d.title || d.name || d.dayName || `Dzień ${idx + 1}`,
          exercises: Array.isArray(d.exercises)
            ? d.exercises
            : Array.isArray(d.items)
            ? d.items
            : Array.isArray(d.movements)
            ? d.movements
            : [],
        }))
      : [];
    return { ...base, days };
  };

  // ============================================================================
  // STAN KOMPONENTU
  // ============================================================================
  const initialData = location.state?.userData || {};

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [errors, setErrors] = useState({});

  // Funkcja obliczania wieku z daty urodzenia (musi być PRZED useState)
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return '';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const [planData, setPlanData] = useState({
    recommendationMethod: initialData.recommendationMethod || 'hybrid',
    recommendationMode: initialData.recommendationMode || 'plans', // domyślnie gotowe plany
    goal: initialData.goal || '',
    level: initialData.level || '',
    trainingDaysPerWeek: initialData.trainingDaysPerWeek || 3,
    equipment: initialData.equipment || '',
    timePerSession: initialData.timePerSession || 60,
    focusAreas: initialData.focusAreas || [],
    avoidances: initialData.avoidances || [],
    body: {
      dateOfBirth: initialData.dateOfBirth || initialData.birthDate || '',
      age: initialData.age || (initialData.dateOfBirth ? calculateAge(initialData.dateOfBirth) : (initialData.birthDate ? calculateAge(initialData.birthDate) : '')),
      weightKg: initialData.weightKg || '',
      heightCm: initialData.heightCm || '',
      activityLevel: initialData.activityLevel || 'średnia',
    },
    health: {
      injuries: initialData.injuries || [],
      healthConditions: initialData.healthConditions || [],
      healthNotes: initialData.healthNotes || '',
    },
    name: initialData.name || (currentUser?.first_name ? `Plan dla ${currentUser.first_name}` : (currentUser?.username ? `Plan dla ${currentUser.username}` : 'Plan Użytkownik')),
    recommendedPlan: null,
    altPlans: [],
  });
  
  // 🆕 Pobierz profil użytkownika i automatycznie wypełnij dane
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isAuthenticated || typeof isAuthenticated !== 'function' || !isAuthenticated()) return;
      
      try {
        const { default: apiService } = await import('../../services/api');
        const profileData = await apiService.fetchUserProfile();
        
        if (profileData?.profile) {
          const profile = profileData.profile;
          
          // Oblicz wiek z date_of_birth jeśli dostępne
          let calculatedAge = '';
          if (profile.date_of_birth) {
            calculatedAge = calculateAge(profile.date_of_birth);
          }
          
          // Uzupełnij dane tylko jeśli nie są już wypełnione
          setPlanData(prev => ({
            ...prev,
            body: {
              ...prev.body,
              dateOfBirth: prev.body.dateOfBirth || profile.date_of_birth || '',
              age: prev.body.age || calculatedAge || '',
              weightKg: prev.body.weightKg || profile.weight_kg || '',
              heightCm: prev.body.heightCm || profile.height_cm || '',
            }
          }));
          
          console.log('[EnhancedPlanCreator] Profile loaded, age calculated:', calculatedAge);
        }
      } catch (error) {
        console.error('[EnhancedPlanCreator] Error fetching profile:', error);
      }
    };
    
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================================
  // WALIDACJA KROKÓW
  // ============================================================================
  const validateBasics = useMemo(() => {
    const errs = {};
    if (!planData.goal) errs.goal = 'Wybierz cel treningowy.';
    if (!planData.level) errs.level = 'Wybierz poziom zaawansowania.';
    if (!planData.trainingDaysPerWeek || planData.trainingDaysPerWeek < 1 || planData.trainingDaysPerWeek > 7) {
      errs.trainingDaysPerWeek = 'Dni treningowe: 1–7.';
    }
    return errs;
  }, [planData.goal, planData.level, planData.trainingDaysPerWeek]);

  const validatePreferences = useMemo(() => {
    const errs = {};
    if (!planData.equipment) errs.equipment = 'Wybierz dostępne wyposażenie.';
    if (!planData.timePerSession || planData.timePerSession < 15 || planData.timePerSession > 180) {
      errs.timePerSession = 'Czas treningu: 15–180 minut.';
    }
    return errs;
  }, [planData.equipment, planData.timePerSession]);

  const validateBody = useMemo(() => {
    const errs = {};
    const { age, weightKg, heightCm } = planData.body;
    
    // Walidacja wieku
    if (!age || age === '') {
      errs.age = 'Podaj swój wiek.';
    } else if (age < 16 || age > 100) {
      errs.age = 'Musisz mieć między 16 a 100 lat.';
    }
    
    // Walidacja wagi i wzrostu
    if (!weightKg || weightKg < 30 || weightKg > 300) errs.weightKg = 'Podaj wagę między 30 a 300 kg.';
    if (!heightCm || heightCm < 120 || heightCm > 250) errs.heightCm = 'Podaj wzrost między 120 a 250 cm.';
    return errs;
  }, [planData.body]);

  // ============================================================================
  // FUNKCJE NAWIGACJI I WALIDACJI
  // ============================================================================
  const isStepValid = (stepIndex) => {
    if (stepIndex === 0) return !!planData.recommendationMethod; // Metoda
    if (stepIndex === 1) return Object.keys(validateBasics).length === 0; // Podstawy
    if (stepIndex === 2) return Object.keys(validatePreferences).length === 0; // Preferencje
    if (stepIndex === 3) return Object.keys(validateBody).length === 0; // Ciało
    if (stepIndex === 4) return true;  // Krok "Zdrowie" jest OPCJONALNY - zawsze valid
    if (stepIndex === 5) return !!planData.name?.trim(); // Krok "Nazwa" tylko dla ćwiczeń
    return true;
  };

  const showErrorsForStep = (stepIndex) => {
    if (stepIndex === 1) setErrors(validateBasics);
    else if (stepIndex === 2) setErrors(validatePreferences);
    else if (stepIndex === 3) setErrors(validateBody);
    else setErrors({});
  };

  // 🆕 Oblicz dynamiczną listę kroków (używana w wielu miejscach)
  const getSteps = () => {
    const baseSteps = [
      { title: 'Metoda', component: renderMethodStep },
      { title: 'Podstawy', component: renderBasicsStep },
      { title: 'Preferencje', component: renderPreferencesStep },
      { title: 'Ciało', component: renderBodyStep },
      { title: 'Zdrowie', component: renderHealthStep },
    ];
    const nameStep = planData.recommendationMode === 'exercises' 
      ? [{ title: 'Nazwa', component: renderNameStep }] 
      : [];
    return [...baseSteps, ...nameStep];
  };

  const handleNext = () => {
    if (!isStepValid(currentStep)) {
      showErrorsForStep(currentStep);
      return;
    }
    setErrors({});
    // 🆕 Dynamiczny limit - użyj długości aktualnej listy kroków
    const steps = getSteps();
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrev = () => {
    setErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // ============================================================================
  // GENEROWANIE REKOMENDACJI
  // ============================================================================
// frontend/lasko-frontend/src/components/register/EnhancedPlanCreator.jsx
// Zastąp całą funkcję generateRecommendedPlan tą wersją:

const generateRecommendedPlan = async () => {
  setLoading(true);
  setApiError(null);
  try {
    console.log('🚀 [EnhancedPlanCreator] === ROZPOCZYNAM GENEROWANIE PLANU ===');
    const authed = typeof isAuthenticated === 'function' ? isAuthenticated() : !!getToken?.();
    console.log('🔍 Stan autoryzacji:', {
      isAuthenticated: authed,
      hasUser: !!user,
      hasToken: !!getToken?.(),
      username: user?.username,
    });

    if (!authed) {
      console.warn('⚠️ Brak ważnego access tokena – warstwa API spróbuje refresh.');
      try { 
        debugAuth?.(); 
      } catch (error) {
        console.warn('[EnhancedPlanCreator] Debug auth failed:', error);
      }
    }

    // ========== ZAPISZ DANE PROFILU UŻYTKOWNIKA ==========
    try {
      console.log('💾 [EnhancedPlanCreator] Zapisuję dane profilu użytkownika...');
      
      // Mapuj metody z frontendu na backend
      const methodMapping = {
        'user': 'collaborative',
        'product': 'content_based',
        'hybrid': 'hybrid'
      };
      
      const profileData = {
        // Cel treningowy
        goal: planData.goal,
        // Poziom zaawansowania
        level: planData.level,
        // Wyposażenie - mapuj na format backendu
        equipment_preference: planData.equipment,
        // Dni treningowe w tygodniu
        training_days_per_week: planData.trainingDaysPerWeek,
        // Czas sesji treningowej
        preferred_session_duration: planData.timePerSession,
        // Obszary skupienia
        focus_areas: planData.focusAreas || [],
        // Ćwiczenia do unikania
        avoid_exercises: planData.avoidances || [],
        // Metoda rekomendacji - WAŻNE: mapuj wartości frontendu na backend
        recommendation_method: methodMapping[planData.recommendationMethod] || 'hybrid',
        // 🆕 Health data
        weight_kg: planData.body.weightKg ? parseFloat(planData.body.weightKg) : null,
        height_cm: planData.body.heightCm ? parseInt(planData.body.heightCm) : null,
        injuries: (planData.health.injuries || []).filter(i => i !== 'none'),
        health_conditions: (planData.health.healthConditions || []).filter(c => c !== 'none'),
        health_notes: planData.health.healthNotes || '',
      };
      
      console.log('📤 [EnhancedPlanCreator] Dane do zapisu:', profileData);
      console.log('🔍 [EnhancedPlanCreator] Pełne planData:', planData);
      
      // Sprawdź czy wszystkie wymagane dane są wypełnione
      const requiredFields = ['goal', 'level', 'equipment', 'trainingDaysPerWeek'];
      const missingFields = requiredFields.filter(field => !planData[field]);
      if (missingFields.length > 0) {
        console.error('❌ [EnhancedPlanCreator] Brakujące wymagane pola:', missingFields);
        throw new Error(`Brakujące wymagane dane: ${missingFields.join(', ')}. Wypełnij wszystkie kroki ankiety.`);
      }
      
      const saveResult = await saveUserProfile(profileData);
      console.log('✅ [EnhancedPlanCreator] Profil użytkownika zaktualizowany:', saveResult);
      
    } catch (profileError) {
      console.error('⚠️ [EnhancedPlanCreator] Błąd zapisu profilu:', profileError);
      console.error('⚠️ [EnhancedPlanCreator] Stack trace:', profileError.stack);
      // KRYTYCZNY BŁĄD - nie możemy kontynuować bez zapisania profilu
      // Dane profilu są potrzebne do wygenerowania rekomendacji
      setApiError(`Nie udało się zapisać danych profilu: ${profileError.message}. Spróbuj ponownie.`);
      setLoading(false);
      return; // Przerwij proces
    }
    // ========== KONIEC ZAPISU PROFILU ==========

    // Przygotuj preferencje do generowania rekomendacji
    // 🆕 Oblicz BMI jeśli dostępne weight i height
    let calculatedBMI = null;
    if (planData.body.weightKg && planData.body.heightCm) {
      const weightNum = parseFloat(planData.body.weightKg);
      const heightNum = parseInt(planData.body.heightCm);
      if (weightNum > 0 && heightNum > 0) {
        calculatedBMI = weightNum / Math.pow(heightNum / 100, 2);
        calculatedBMI = Math.round(calculatedBMI * 100) / 100;  // Round to 2 decimals
      }
    }
    
    const preferences = {
      goal: planData.goal,
      level: planData.level,
      equipment_preference: planData.equipment,
      training_days_per_week: planData.trainingDaysPerWeek,
      time_per_session: planData.timePerSession,
      focus_areas: planData.focusAreas,
      avoidances: planData.avoidances,
      body: planData.body,
      plan_name: planData.name, // Dodaj nazwę planu z ankiety
      // 🆕 Health data
      weight_kg: planData.body.weightKg ? parseFloat(planData.body.weightKg) : null,
      height_cm: planData.body.heightCm ? parseInt(planData.body.heightCm) : null,
      bmi: calculatedBMI,
      injuries: (planData.health.injuries || []).filter(i => i !== 'none'),
      health_conditions: (planData.health.healthConditions || []).filter(c => c !== 'none'),
    };

    console.log('📊 [EnhancedPlanCreator] Generuję rekomendacje z preferencjami:', preferences);

    const response = await generateRecommendations(planData.recommendationMethod, preferences);

    if (response && Array.isArray(response.recommendations) && response.recommendations.length > 0) {
      // Prefetch szczegółów dla TOP 1–3
      const topRecs = response.recommendations.slice(0, 3);
      let detailed = [];
      try {
        detailed = await Promise.all(
          topRecs.map(r => recApi.getPlanDetailed(r.planId).catch(() => null))
        );
      } catch (error) {
        console.warn('[EnhancedPlanCreator] Failed to fetch plan details:', error);
      }

      const merged = topRecs.map((r, i) => (detailed[i] ? normalizePlanDetails(r, detailed[i]) : r));
      const recommendedPlan = merged[0];
      const altPlans = merged.slice(1);

      const updatedPlanData = {
        ...planData,
        recommendedPlan,
        altPlans,
        name: recommendedPlan.name || planData.name,
      };

      // Ustal i zapisz username natychmiast, zanim przejdziemy dalej
      const usernameCandidate =
        currentUser?.username ||
        currentUser?.first_name ||
        initialData?.username ||
        sessionStorage.getItem('lasko_username') ||
        null;

      if (usernameCandidate) {
        sessionStorage.setItem('lasko_username', usernameCandidate);
      }

      setPlanData(updatedPlanData);
      sessionStorage.setItem('lasko_plan_draft', JSON.stringify(updatedPlanData));

      console.log('✅ [EnhancedPlanCreator] Plan wygenerowany, przechodzę do podsumowania');

      // 🆕 Jeśli wybrano tryb ćwiczeń, przejdź do rekomendacji ćwiczeń
      if (planData.recommendationMode === 'exercises') {
        navigate('/exercise-recommendations', {
          state: { 
            planData: updatedPlanData, 
            preferences: preferences,
            fromCreator: true, 
            username: usernameCandidate 
          },
        });
        return;
      }

      // Standardowy flow - przejdź do podsumowania planów
      navigate('/plan-summary', {
        state: { planData: updatedPlanData, fromCreator: true, username: usernameCandidate },
      });
    } else {
      if (!response) throw new Error('Brak odpowiedzi z serwera');
      if (!response.recommendations) throw new Error('Serwer nie zwrócił rekomendacji');
      if (!Array.isArray(response.recommendations)) throw new Error('Rekomendacje mają nieprawidłowy format');
      if (response.recommendations.length === 0) throw new Error('Nie znaleziono planów pasujących do Twoich kryteriów. Spróbuj zmienić preferencje.');
      throw new Error('Nieoczekiwana struktura danych z serwera');
    }
  } catch (error) {
    console.error('❌ [EnhancedPlanCreator] Błąd generowania planu:', error);
    const msg = (error?.message || '').toLowerCase();
    if (msg.includes('autoryzac') || msg.includes('401')) {
      try { 
        await AuthDebug.fullDiagnostic(); 
      } catch (debugError) {
        console.warn('[EnhancedPlanCreator] Debug diagnostic failed:', debugError);
      }
      setApiError('Sesja wygasła. Zostaniesz przekierowany do logowania.');
      setTimeout(() => {
        navigate('/login', { state: { message: 'Sesja wygasła - zaloguj się ponownie', returnTo: '/plan-creator' } });
      }, 3000);
    } else {
      setApiError(error.message || 'Wystąpił nieoczekiwany błąd podczas generowania planu');
    }
  } finally {
    setLoading(false);
  }
};

  // ============================================================================
  // RENDER KROKÓW
  // ============================================================================
  const OptionCard = ({ active, onClick, children, disabled = false, className = '' }) => (
    <div
      onClick={disabled ? undefined : onClick}
      className={[
        'group relative cursor-pointer rounded-2xl border p-6 transition-all duration-200',
        active
          ? 'border-emerald-400/60 bg-emerald-400/10 ring-1 ring-emerald-400/30'
          : 'border-white/10 bg-white/[0.04] hover:border-emerald-400/40',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
        className,
      ].join(' ')}
    >
      {children}
      {!disabled && !active && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 ring-1 ring-emerald-400/30 transition-opacity group-hover:opacity-100" />
      )}
    </div>
  );

  const StepProgress = () => {
    // 🆕 Dynamiczna lista kroków - ukryj "Nazwa" gdy wybrano plany
    const baseSteps = ['Metoda', 'Tryb', 'Podstawy', 'Preferencje', 'Ciało', 'Zdrowie'];
    const nameStep = planData.recommendationMode === 'exercises' ? ['Nazwa'] : [];
    const steps = [...baseSteps, ...nameStep];
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-1 items-center">
              <div className="relative flex items-center justify-center">
                <div
                  className={[
                    'h-10 w-10 rounded-full border-2 flex items-center justify-center font-bold transition-all',
                    index < currentStep
                      ? 'border-emerald-400 bg-emerald-400 text-black'
                      : index === currentStep
                      ? 'border-emerald-400 bg-emerald-400/20 text-emerald-300'
                      : 'border-white/20 bg-white/5 text-gray-500',
                  ].join(' ')}
                >
                  {index < currentStep ? '✓' : index + 1}
                </div>
                {index === currentStep && (
                  <div className="absolute h-12 w-12 rounded-full bg-emerald-400/20 animate-pulse" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 mx-2">
                  <div className="h-0.5 bg-white/10 relative">
                    <div
                      className="absolute inset-y-0 left-0 bg-emerald-400 transition-all duration-300"
                      style={{ width: index < currentStep ? '100%' : '0%' }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between px-1">
          {steps.map((step, index) => (
            <div
              key={index}
              className={[
                'text-xs font-medium transition-colors text-center flex-1',
                index <= currentStep ? 'text-emerald-300' : 'text-gray-500',
              ].join(' ')}
            >
              {step}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMethodStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Kicker>Krok 1 z 7</Kicker>
        <h2 className="mt-4 text-4xl font-black text-white">Wybierz metodę rekomendacji</h2>
        <p className="mt-3 text-lg text-gray-300 max-w-2xl mx-auto">
          Jak chcesz, aby Lasko dobierał dla Ciebie plan treningowy?
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {methodOptions.map((m) => (
          <OptionCard 
            key={m.value} 
            active={planData.recommendationMethod === m.value} 
            onClick={() => setPlanData((p) => ({ ...p, recommendationMethod: m.value }))}
          >
            <div className="text-center space-y-3 relative pt-6">
              {/* 🆕 Badge ZALECANE */}
              {m.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-block bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold">
                    {m.badge}
                  </span>
                </div>
              )}
              <div className="mb-3 flex justify-center">{m.icon}</div>
              <h3 className="text-lg font-bold text-white">{m.label}</h3>
              <p className="text-sm text-gray-400">{m.description}</p>
              {planData.recommendationMethod === m.value && (
                <div className="inline-flex items-center gap-1 text-emerald-300">
                  <svg width="20" height="20" fill="currentColor">
                    <path d="M7.5 13.5L3 9l1.4-1.4 3.1 3.1L15.6 2.5 17 3.9 7.5 13.5z" />
                  </svg>
                  <span className="text-sm font-medium">Wybrano</span>
                </div>
              )}
            </div>
          </OptionCard>
        ))}
      </div>
    </div>
  );

  // 🆕 KROK WYBORU TRYBU (ćwiczenia vs plany)
  const renderModeStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Kicker>Krok 2 z 7</Kicker>
        <h2 className="mt-4 text-4xl font-black text-white">Wybierz tryb rekomendacji</h2>
        <p className="mt-3 text-lg text-gray-300 max-w-2xl mx-auto">
          Chcesz gotowe plany treningowe czy zbudować własny plan z rekomendowanych ćwiczeń?
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <OptionCard 
          active={planData.recommendationMode === 'plans'} 
          onClick={() => setPlanData((p) => ({ ...p, recommendationMode: 'plans' }))}
        >
          <div className="text-center space-y-3">
            <div className="mb-3 flex justify-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-emerald-400" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Gotowe plany</h3>
            <p className="text-sm text-gray-400">
              Otrzymasz gotowe plany treningowe dopasowane do Twoich preferencji. Szybko i wygodnie.
            </p>
            {planData.recommendationMode === 'plans' && (
              <div className="inline-flex items-center gap-1 text-emerald-300">
                <svg width="20" height="20" fill="currentColor">
                  <path d="M7.5 13.5L3 9l1.4-1.4 3.1 3.1L15.6 2.5 17 3.9 7.5 13.5z" />
                </svg>
                <span className="text-sm font-medium">Wybrano</span>
              </div>
            )}
          </div>
        </OptionCard>

        <OptionCard 
          active={planData.recommendationMode === 'exercises'} 
          onClick={() => setPlanData((p) => ({ ...p, recommendationMode: 'exercises' }))}
        >
          <div className="text-center space-y-3">
            <div className="mb-3 flex justify-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-orange-400" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Rekomendacja ćwiczeń</h3>
            <p className="text-sm text-gray-400">
              Zbuduj własny plan z rekomendowanych ćwiczeń. Większa personalizacja i kontrola.
            </p>
            {planData.recommendationMode === 'exercises' && (
              <div className="inline-flex items-center gap-1 text-emerald-300">
                <svg width="20" height="20" fill="currentColor">
                  <path d="M7.5 13.5L3 9l1.4-1.4 3.1 3.1L15.6 2.5 17 3.9 7.5 13.5z" />
                </svg>
                <span className="text-sm font-medium">Wybrano</span>
              </div>
            )}
          </div>
        </OptionCard>
      </div>
    </div>
  );

  const renderBasicsStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <Kicker>Krok 3 z 7</Kicker>
        <h2 className="mt-4 text-4xl font-black text-white">Powiedz nam o swoich celach</h2>
        <p className="mt-3 text-lg text-gray-300 max-w-2xl mx-auto">
          Określ swój główny cel treningowy i poziom zaawansowania
        </p>
      </div>

      {/* Cel */}
      <div>
        <label className="mb-4 block text-sm font-semibold uppercase tracking-wide text-gray-400">
          Jaki jest Twój główny cel? *
        </label>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {goalOptions.map((g) => (
            <OptionCard 
              key={g.value} 
              active={planData.goal === g.value} 
              onClick={() => setPlanData((p) => ({ ...p, goal: g.value }))}
              className={g.colspan || ''}
            >
              <div className="flex items-center gap-4 justify-center">
                <span className="text-3xl">{g.icon}</span>
                <span className="text-white font-semibold">{g.label}</span>
              </div>
            </OptionCard>
          ))}
        </div>
        {errors.goal && (
          <p className="mt-2 flex items-center gap-2 text-sm text-red-400">
            <svg width="16" height="16" fill="currentColor">
              <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm1 13H7v-2h2v2zm0-3H7V3h2v7z" />
            </svg>
            {errors.goal}
          </p>
        )}
      </div>

      {/* Poziom */}
      <div>
        <label className="mb-4 block text-sm font-semibold uppercase tracking-wide text-gray-400">
          Jaki jest Twój poziom zaawansowania? *
        </label>
        <div className="flex flex-col gap-3">
          {levelOptions.map((l) => (
            <OptionCard 
              key={l.value} 
              active={planData.level === l.value} 
              onClick={() => setPlanData((p) => ({ ...p, level: l.value }))}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-white font-bold text-lg">{l.label}</h4>
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">{l.description}</p>
                  {planData.level === l.value && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-emerald-400 flex-shrink-0">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
            </OptionCard>
          ))}
        </div>
        {errors.level && (
          <p className="mt-2 flex items-center gap-2 text-sm text-red-400">
            <svg width="16" height="16" fill="currentColor">
              <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm1 13H7v-2h2v2zm0-3H7V3h2v7z" />
            </svg>
            {errors.level}
          </p>
        )}
      </div>

      {/* Dni w tygodniu */}
      <div>
        <label className="mb-4 block text-sm font-semibold uppercase tracking-wide text-gray-400">
          Ile dni w tygodniu chcesz trenować? *
        </label>
        <div className="flex flex-wrap gap-3 justify-center">
          {[1, 2, 3, 4, 5, 6, 7].map((d) => (
            <button
              key={d}
              onClick={() => setPlanData((p) => ({ ...p, trainingDaysPerWeek: d }))}
              className={[
                'h-14 w-14 rounded-2xl border-2 text-lg font-bold transition-all',
                planData.trainingDaysPerWeek === d
                  ? 'border-emerald-400 bg-emerald-400/20 text-emerald-300 scale-110'
                  : 'border-white/10 text-gray-400 hover:border-emerald-400/50 hover:text-white',
              ].join(' ')}
            >
              {d}
            </button>
          ))}
        </div>
        {errors.trainingDaysPerWeek && (
          <p className="mt-2 flex items-center gap-2 text-sm text-red-400 text-center">
            <svg width="16" height="16" fill="currentColor">
              <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm1 13H7v-2h2v2zm0-3H7V3h2v7z" />
            </svg>
            {errors.trainingDaysPerWeek}
          </p>
        )}
      </div>
    </div>
  );

  const renderPreferencesStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <Kicker>Krok 4 z 7</Kicker>
        <h2 className="mt-4 text-4xl font-black text-white">Dostosuj plan do swoich możliwości</h2>
        <p className="mt-3 text-lg text-gray-300 max-w-2xl mx-auto">
          Określ dostępne wyposażenie i czas na trening
        </p>
      </div>

      {/* Wyposażenie */}
      <div>
        <label className="mb-4 block text-sm font-semibold uppercase tracking-wide text-gray-400">
          Jakie masz dostępne wyposażenie? *
        </label>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {equipmentOptions.map((e) => (
            <OptionCard 
              key={e.value} 
              active={planData.equipment === e.value} 
              onClick={() => setPlanData((p) => ({ ...p, equipment: e.value }))}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="flex justify-center">{e.icon}</div>
                <p className="text-sm text-white font-medium text-center">{e.label}</p>
              </div>
            </OptionCard>
          ))}
        </div>
        {errors.equipment && (
          <p className="mt-2 flex items-center gap-2 text-sm text-red-400">
            <svg width="16" height="16" fill="currentColor">
              <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm1 13H7v-2h2v2zm0-3H7V3h2v7z" />
            </svg>
            {errors.equipment}
          </p>
        )}
      </div>

      {/* Czas sesji */}
      <div>
        <label className="mb-4 block text-sm font-semibold uppercase tracking-wide text-gray-400">
          Ile czasu możesz poświęcić na jeden trening? *
        </label>
        <div className="mx-auto max-w-md">
          {/* Wyświetlanie wartości */}
          <div className="mb-4 text-center">
            <div className="inline-flex items-baseline gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-6 py-3">
              <span className="text-4xl font-black text-white">{planData.timePerSession}</span>
              <span className="text-lg text-gray-400">minut</span>
            </div>
          </div>
          
          {/* Interaktywny suwak */}
          <div className="relative px-3 py-2">
            <input
              type="range"
              min="15"
              max="180"
              step="5"
              value={planData.timePerSession}
              onChange={(e) => setPlanData((p) => ({ ...p, timePerSession: parseInt(e.target.value) || 60 }))}
              className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r 
                [&::-webkit-slider-thumb]:from-emerald-400 [&::-webkit-slider-thumb]:to-teal-300 
                [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-emerald-500/50
                [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110
                [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 
                [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gradient-to-r 
                [&::-moz-range-thumb]:from-emerald-400 [&::-moz-range-thumb]:to-teal-300 
                [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:shadow-emerald-500/50
                [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:transition-transform 
                [&::-moz-range-thumb]:hover:scale-110"
              style={{
                background: `linear-gradient(to right, rgb(29, 205, 159) 0%, rgb(29, 205, 159) ${((planData.timePerSession - 15) / (180 - 15)) * 100}%, rgba(255,255,255,0.1) ${((planData.timePerSession - 15) / (180 - 15)) * 100}%, rgba(255,255,255,0.1) 100%)`
              }}
            />
          </div>
          
          <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
            <span>15 min</span>
            <span className="text-emerald-400">Zalecane: 45-90 min</span>
            <span>180 min</span>
          </div>
        </div>
        {errors.timePerSession && (
          <p className="mt-4 flex items-center gap-2 text-sm text-red-400 text-center justify-center">
            <svg width="16" height="16" fill="currentColor">
              <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm1 13H7v-2h2v2zm0-3H7V3h2v7z" />
            </svg>
            {errors.timePerSession}
          </p>
        )}
      </div>
    </div>
  );

  const renderBodyStep = () => {
    const bmi = planData.body.weightKg && planData.body.heightCm
      ? (planData.body.weightKg / ((planData.body.heightCm / 100) ** 2)).toFixed(1)
      : null;

    const getBmiCategory = (b) => {
      if (!b) return null;
      const val = parseFloat(b);
      if (val < 18.5) return { label: 'Niedowaga', color: 'text-blue-400' };
      if (val < 25) return { label: 'Prawidłowa waga', color: 'text-emerald-400' };
      if (val < 30) return { label: 'Nadwaga', color: 'text-yellow-400' };
      return { label: 'Otyłość', color: 'text-red-400' };
    };

    const bmiCategory = getBmiCategory(bmi);

    return (
      <div className="space-y-8">
        <div className="text-center">
          <Kicker>Krok 5 z 7</Kicker>
          <h2 className="mt-4 text-4xl font-black text-white">Pomożemy dobrać intensywność</h2>
          <p className="mt-3 text-lg text-gray-300 max-w-2xl mx-auto">
            Twoje parametry pomogą nam lepiej dostosować plan
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <label className="mb-3 block text-sm font-semibold uppercase tracking-wide text-gray-400">
              Wiek *
            </label>
            <div className="relative">
              <input
                type="number"
                value={planData.body.age || ''}
                onChange={(e) => {
                  const age = parseInt(e.target.value) || '';
                  setPlanData((p) => ({ 
                    ...p, 
                    body: { 
                      ...p.body, 
                      age: age
                    } 
                  }));
                }}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-lg font-semibold text-white outline-none transition-all focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                min="16"
                max="100"
                placeholder="Wprowadź swój wiek"
              />
            </div>
            {errors.age && (
              <p className="mt-2 text-sm text-red-400">{errors.age}</p>
            )}
          </div>

          <div>
            <label className="mb-3 block text-sm font-semibold uppercase tracking-wide text-gray-400">
              Waga *
            </label>
            <div className="relative">
              <input
                type="number"
                min="30"
                max="300"
                step="0.1"
                value={planData.body.weightKg}
                onChange={(e) => setPlanData((p) => ({ ...p, body: { ...p.body, weightKg: parseFloat(e.target.value) || '' } }))}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-lg font-semibold text-white outline-none transition-all focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                placeholder="70.0"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500">kg</span>
            </div>
            {errors.weightKg && (
              <p className="mt-2 text-sm text-red-400">{errors.weightKg}</p>
            )}
          </div>

          <div>
            <label className="mb-3 block text-sm font-semibold uppercase tracking-wide text-gray-400">
              Wzrost *
            </label>
            <div className="relative">
              <input
                type="number"
                min="120"
                max="250"
                value={planData.body.heightCm}
                onChange={(e) => setPlanData((p) => ({ ...p, body: { ...p.body, heightCm: parseInt(e.target.value) || '' } }))}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-lg font-semibold text-white outline-none transition-all focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                placeholder="175"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500">cm</span>
            </div>
            {errors.heightCm && (
              <p className="mt-2 text-sm text-red-400">{errors.heightCm}</p>
            )}
          </div>
        </div>

        {bmi && (
          <div className="mx-auto max-w-md">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-white/[0.04] to-white/[0.08] p-6 text-center">
              <p className="text-sm uppercase tracking-wide text-gray-400">Twoje BMI</p>
              <p className="mt-2 text-5xl font-black text-white">{bmi}</p>
              {bmiCategory && (
                <p className={`mt-2 font-semibold ${bmiCategory.color}`}>{bmiCategory.label}</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // KROK 5: ZDROWIE (opcjonalny)
  // ============================================================================
  
  const injuryOptions = [
    { 
      id: 'knee', 
      label: 'Kolano', 
      icon: <svg width="32" height="32" viewBox="0 0 512 512" fill="currentColor" className="text-red-400"><path d="M22.91 15.15v55.19C52.94 91.19 99.09 120.3 139.7 148.4c21.1 14.6 40.7 28.9 55.7 41.8 15.1 12.8 26.1 23 29.5 35.7l.3 1v1c.4 15.2 3.7 25.2 7.9 31.2s9.1 8.6 15.6 9.5c12.9 1.9 32.2-6 47.3-19.2 15-13.2 25-30.9 24.2-44.2-.4-6.6-2.9-12.4-9.4-18.1-6.4-5.7-17.3-11.1-33.9-14.6-12-2.5-27.8-11.4-49.3-24.3-21.5-12.8-47.5-29.5-74.5-47.2-47.4-31.24-96.84-64.79-130.19-85.85zM191.9 18c17.6 11.41 48.1 31.99 79.9 57.23C320.7 114 371.4 164.4 380.7 202.2v.1c2.4 10 3.5 36.8 2.8 69.2-.7 32.3-2.7 70.9-5.2 108-3 45.2-6.6 87.9-8.9 114.5h18.1c2.3-26.8 5.8-68.8 8.8-113.3 2.4-37.2 4.5-76 5.2-108.9.7-32.8.4-58.8-3.4-73.8v-.1C386.3 150 332.9 100.7 283 61.12 261.8 44.31 241.1 29.51 224.3 18zM18 142.7v24.5c48.95 44.6 118.5 101.7 163.9 134.3-10.6 58.8-8.6 132.7-7 192.5h18c-1.7-61.9-3.5-138.3 7.6-194.7l1.2-5.8-4.8-3.4C149.1 256.4 67.59 189 18 142.7zm317.3 33l8 79.6c8.5-4.9 13.8-10.8 17-17 4.3-8.6 4.8-18.4 2.4-28.2-3.9-15-15.2-28.6-27.4-34.4zm-18.5 87.5c-2.6 1.7-6.8 5.8-13.2 10.2-11.8 8.2-31.4 15.8-66.1 13.8-.8 8.1 2.6 15.2 10.2 22.5 9.4 9.2 25.4 17.2 44.2 21.4l3 .7 2 2.4c4.5 5.6 5.7 11.6 7.5 20.1 1.8 8.5 3.4 19.1 4.8 31.1 2.8 24.1 4.9 54 6.4 83.2.4 8.6.8 17.1 1.1 25.4h29c-1.2-53.3-.6-113.2 5.2-176.4.1-12.3-.5-24.3-4.4-33.7-3.9-9.4-10.4-16.4-25-21.5-1.9-.7-3.5 0-4.7.8zm-76.6 63.9c0 3.2.1 6.4.3 9.6.7 13.6 3.3 25.7 7.2 30.8l1.9 2.5-.4 124H267l2.1-127.3 2.3-2.5c5.7-6.2 8.2-11.5 10-17.3-15.9-4.3-30.2-10.9-41.2-19.8z"/></svg>
    },
    { 
      id: 'lower_back', 
      label: 'Dolny odcinek kręgosłupa', 
      icon: <svg width="32" height="32" viewBox="0 0 308.004 308.004" fill="currentColor" className="text-red-400"><path d="M244.63,29.53H220.27c0-9.784,0-19.184,0-26.935c0-0.9-0.467-1.736-1.234-2.208c-0.766-0.472-1.724-0.514-2.527-0.108C204.231,6.48,180.844,10.67,154.002,10.67S103.774,6.48,91.495,0.279c-0.804-0.406-1.761-0.366-2.528,0.106c-0.767,0.472-1.232,1.309-1.232,2.21c0,7.752,0,17.152,0,26.935H63.374c-5.58,0-10.103,4.523-10.103,10.103v13.446c0,5.58,4.523,10.103,10.103,10.103h24.361c0,6.843,0,13.059,0,18.071c0,3.457,2,6.611,5.127,8.083c16.076,7.567,44.219,9.695,61.14,9.695c18.273,0,45.549-2.389,61.129-9.696c3.136-1.471,5.139-4.625,5.139-8.089c0-5.016,0-11.228,0-18.065h24.361c5.58,0,10.103-4.523,10.103-10.103V39.633C254.733,34.053,250.21,29.53,244.63,29.53z M116.047,70.479c0,4.143-3.357,7.5-7.5,7.5c-4.143,0-7.5-3.357-7.5-7.5V33.715c0-4.143,3.357-7.5,7.5-7.5c4.143,0,7.5,3.357,7.5,7.5V70.479z"/><path d="M244.63,133.795H220.27c0-9.784,0-19.184,0-26.935c0-0.9-0.467-1.736-1.234-2.208c-0.766-0.472-1.724-0.514-2.527-0.108c-12.278,6.201-35.665,10.392-62.507,10.392s-50.229-4.19-62.507-10.392c-0.804-0.406-1.761-0.366-2.528,0.106c-0.767,0.472-1.232,1.309-1.232,2.21c0,7.752,0,17.152,0,26.935H63.374c-5.58,0-10.103,4.523-10.103,10.103v13.446c0,5.58,4.523,10.103,10.103,10.103h24.361c0,6.843,0,13.059,0,18.071c0,3.457,2,6.611,5.127,8.083c16.076,7.567,44.219,9.695,61.14,9.695c18.273,0,45.549-2.389,61.129-9.696c3.136-1.47,5.139-4.625,5.139-8.088c0-5.016,0-11.228,0-18.065h24.361c5.58,0,10.103-4.523,10.103-10.103v-13.446C254.733,138.319,250.21,133.795,244.63,133.795z M116.047,174.629c0,4.143-3.357,7.5-7.5,7.5c-4.143,0-7.5-3.357-7.5-7.5v-36.765c0-4.143,3.357-7.5,7.5-7.5c4.143,0,7.5,3.357,7.5,7.5V174.629z"/><path d="M244.63,238.503H220.27c0-9.784,0-19.184,0-26.935c0-0.9-0.467-1.736-1.234-2.208c-0.766-0.472-1.724-0.514-2.527-0.108c-12.278,6.201-35.665,10.392-62.507,10.392s-50.229-4.19-62.507-10.392c-0.804-0.406-1.761-0.366-2.528,0.106c-0.767,0.472-1.232,1.309-1.232,2.21c0,7.752,0,17.152,0,26.935H63.374c-5.58,0-10.103,4.523-10.103,10.103v13.446c0,5.58,4.523,10.103,10.103,10.103h24.361c0,6.843,0,13.059,0,18.071c0,3.457,2,6.611,5.127,8.083c16.076,7.567,44.219,9.695,61.14,9.695c18.273,0,45.549-2.39,61.129-9.696c3.136-1.471,5.139-4.625,5.139-8.089c0-5.016,0-11.228,0-18.065h24.361c5.58,0,10.103-4.523,10.103-10.103v-13.446C254.733,243.026,250.21,238.503,244.63,238.503z M116.047,282.337c0,4.143-3.357,7.5-7.5,7.5c-4.143,0-7.5-3.357-7.5-7.5v-36.765c0-4.143,3.357-7.5,7.5-7.5c4.143,0,7.5,3.357,7.5,7.5V282.337z"/></svg>
    },
    { 
      id: 'shoulder', 
      label: 'Bark', 
      icon: <svg width="32" height="32" viewBox="0 0 512 512" fill="currentColor" className="text-red-400"><path d="M208 56.643l-16 64-98.568 14.082L256 175.365l162.568-40.64L320 120.643l-16-64-27.268 18.18-12.002 48.003h-17.46l-12.002-48.004zm-138.621 90.62L16 200.644l48 64 25.77-25.77 26.619-79.857zm373.242 0l-47.01 11.753 26.62 79.857L448 264.643l48-64zm-308.717 16.132l-20.123 60.369 13.81 55.246L247 345.348V191.67zm244.192 0L265 191.67v153.678l119.408-66.338 13.81-55.246zM144 308.715v56.314l103 30.627v-29.719zm224 0l-103 57.223v29.718l103-30.627zm-224 75.54v56.388l103 14.714V414.88zm224 0L265 414.88v40.478l103-14.714z"/></svg>
    },
    { 
      id: 'elbow', 
      label: 'Łokieć', 
      icon: <svg width="32" height="32" viewBox="0 0 36 36" fill="currentColor" className="text-red-400"><path d="M15.977 9.36h3.789a.777.777 0 0 0 .058-.673l-3.846-4.705V9.36z"></path><path d="M12.804 22.277a9.192 9.192 0 0 0-.206-.973c-.62-2.223-1.14-3.164-.918-5.494c.29-1.584.273-4.763 4.483-4.268c1.112.131 2.843.927 3.834.91c.567-.01.98-1.157 1.017-1.539c.051-.526-.865-1.42-1.248-1.554a94.35 94.35 0 0 0-2.681-.824c-1.039-.301-.985-1.705-1.051-2.205a.597.597 0 0 1 .294-.591c.21-.124.375-.008.579.125l.885.648c.497.426-.874 1.24-.503 1.376c0 0 1.755.659 2.507.796c.412.075 1.834-1.529 1.917-2.47c.065-.74-3.398-4.083-5.867-5.381c-.868-.456-1.377-.721-1.949-.694c-.683.032-.898.302-1.748 1.03C8.302 4.46 4.568 11.577 4.02 13.152c-2.246 6.461-2.597 9.865-2.677 11.788a21.26 21.26 0 0 0-.076 1.758c.065 0-1 5 0 6s5.326 1 5.326 1c10 3.989 28.57 2.948 28.57-7.233c0-12.172-18.813-10.557-22.359-4.188z"></path><path d="M20.63 32.078c-3.16-.332-5.628-1.881-5.767-1.97a1 1 0 0 1 1.075-1.687c.04.025 4.003 2.492 7.846 1.467c2.125-.566 3.867-2.115 5.177-4.601a1 1 0 0 1 1.77.932c-1.585 3.006-3.754 4.893-6.447 5.606c-1.257.332-2.502.374-3.654.253z"></path></svg>
    },
    { 
      id: 'wrist', 
      label: 'Nadgarstek', 
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-red-400"><path fillRule="evenodd" clipRule="evenodd" d="M11.2071 3.6797C11.0909 3.85386 11 4.14834 11 4.5V6V11C11 11.5523 10.5523 12 10 12C9.44772 12 9 11.5523 9 11V6C9 5.64834 8.90906 5.35386 8.79295 5.1797C8.6966 5.03518 8.61209 5 8.5 5C8.38791 5 8.3034 5.03518 8.20705 5.1797C8.09094 5.35386 8 5.64834 8 6V12V15C8 15.5523 7.55228 16 7 16C6.44772 16 6 15.5523 6 15V12C6 11.6483 5.90906 11.3539 5.79295 11.1797C5.6966 11.0352 5.61209 11 5.5 11C5.38791 11 5.3034 11.0352 5.20705 11.1797C5.09094 11.3539 5 11.6483 5 12V16C5 17.033 5.70057 18.1402 7.0547 19.0429C8.3875 19.9315 10.1939 20.5 12 20.5C15.6675 20.5 18 18.251 18 16V9C18 8.64834 17.9091 8.35386 17.7929 8.1797C17.6966 8.03518 17.6121 8 17.5 8C17.3879 8 17.3034 8.03518 17.2071 8.1797C17.0909 8.35386 17 8.64834 17 9V12C17 12.5523 16.5523 13 16 13C15.4477 13 15 12.5523 15 12V9V6C15 5.64834 14.9091 5.35386 14.7929 5.1797C14.6966 5.03518 14.6121 5 14.5 5C14.3879 5 14.3034 5.03518 14.2071 5.1797C14.0909 5.35386 14 5.64834 14 6V11C14 11.5523 13.5523 12 13 12C12.4477 12 12 11.5523 12 11V6V4.5C12 4.14834 11.9091 3.85386 11.7929 3.6797C11.6966 3.53518 11.6121 3.5 11.5 3.5C11.3879 3.5 11.3034 3.53518 11.2071 3.6797ZM13.7452 3.12242C13.975 3.04395 14.227 3 14.5 3C15.3879 3 16.0534 3.46482 16.4571 4.0703C16.8409 4.64614 17 5.35166 17 6V6.05195C17.1578 6.01815 17.3245 6 17.5 6C18.3879 6 19.0534 6.46482 19.4571 7.0703C19.8409 7.64614 20 8.35166 20 9V16C20 19.749 16.3325 22.5 12 22.5C9.80613 22.5 7.6125 21.8185 5.9453 20.7071C4.29943 19.6098 3 17.967 3 16V12C3 11.3517 3.15906 10.6461 3.54295 10.0703C3.9466 9.46482 4.61209 9 5.5 9C5.67545 9 5.84222 9.01815 6 9.05195V6C6 5.35166 6.15906 4.64614 6.54295 4.0703C6.9466 3.46482 7.61209 3 8.5 3C8.77302 3 9.02501 3.04395 9.25482 3.12242C9.33156 2.92998 9.427 2.74423 9.54295 2.5703C9.9466 1.96482 10.6121 1.5 11.5 1.5C12.3879 1.5 13.0534 1.96482 13.4571 2.5703C13.573 2.74423 13.6684 2.92998 13.7452 3.12242Z"/></svg>
    },
    { 
      id: 'none', 
      label: 'Brak kontuzji', 
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-emerald-400"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    },
  ];

  const healthConditionOptions = [
    { 
      id: 'hypertension', 
      label: 'Nadciśnienie', 
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
    },
    { 
      id: 'asthma', 
      label: 'Astma', 
      icon: <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400"><path d="M14,18c0,1.2,0,0.5,0,2c0,6.8-2,7.3-5,7.3c-2.8,0-6,5.8-6-3.8S8.2,6,11.3,6c0.8,0,1.5,0.3,1.9,1.9"/><path d="M18,18c0,1.2,0,0.5,0,2c0,6.8,2,7.3,5,7.3c2.8,0,6,5.8,6-3.8S23.8,6,20.8,6c-0.8,0-1.5,0.3-1.9,1.9"/><path d="M16,2v6.6c0,1.5-0.7,3-1.9,4L10,16"/><path d="M16,8.6c0,1.5,0.7,3,1.9,4L22,16"/></svg>
    },
    { 
      id: 'diabetes', 
      label: 'Cukrzyca', 
      icon: <svg width="32" height="32" viewBox="0 0 1024 1024" fill="currentColor" className="text-yellow-400"><path d="M801.728 349.184l4.48 4.48a128 128 0 010 180.992L534.656 806.144a128 128 0 01-181.056 0l-4.48-4.48-19.392 109.696a64 64 0 01-108.288 34.176L78.464 802.56a64 64 0 0134.176-108.288l109.76-19.328-4.544-4.544a128 128 0 010-181.056l271.488-271.488a128 128 0 01181.056 0l4.48 4.48 19.392-109.504a64 64 0 01108.352-34.048l142.592 143.04a64 64 0 01-34.24 108.16l-109.248 19.2zm-548.8 198.72h447.168v2.24l60.8-60.8a63.808 63.808 0 0018.752-44.416h-426.88l-89.664 89.728a64.064 64.064 0 00-10.24 13.248zm0 64c2.752 4.736 6.144 9.152 10.176 13.248l135.744 135.744a64 64 0 0090.496 0L638.4 611.904H252.928zm490.048-230.976L625.152 263.104a64 64 0 00-90.496 0L416.768 380.928h326.208zM123.712 757.312l142.976 142.976 24.32-137.6a25.6 25.6 0 00-29.696-29.632l-137.6 24.256zm633.6-633.344l-24.32 137.472a25.6 25.6 0 0029.632 29.632l137.28-24.064-142.656-143.04z"/></svg>
    },
    { 
      id: 'heart_condition', 
      label: 'Problemy z sercem', 
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-yellow-400"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
    },
    { 
      id: 'none', 
      label: 'Brak schorzeń', 
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-emerald-400"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    },
  ];

  const toggleInjury = (injuryId) => {
    setPlanData(prev => {
      const current = prev.health.injuries || [];
      if (injuryId === 'none') {
        return { ...prev, health: { ...prev.health, injuries: ['none'] } };
      }
      const filtered = current.filter(i => i !== 'none');
      if (filtered.includes(injuryId)) {
        return { ...prev, health: { ...prev.health, injuries: filtered.filter(i => i !== injuryId) } };
      } else {
        return { ...prev, health: { ...prev.health, injuries: [...filtered, injuryId] } };
      }
    });
  };

  const toggleHealthCondition = (conditionId) => {
    setPlanData(prev => {
      const current = prev.health.healthConditions || [];
      if (conditionId === 'none') {
        return { ...prev, health: { ...prev.health, healthConditions: ['none'] } };
      }
      const filtered = current.filter(c => c !== 'none');
      if (filtered.includes(conditionId)) {
        return { ...prev, health: { ...prev.health, healthConditions: filtered.filter(c => c !== conditionId) } };
      } else {
        return { ...prev, health: { ...prev.health, healthConditions: [...filtered, conditionId] } };
      }
    });
  };

  const renderHealthStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <Kicker>Krok 6 z 7 (opcjonalny)</Kicker>
        <h2 className="mt-4 text-4xl font-black text-white">Zdrowie i bezpieczeństwo</h2>
        <p className="mt-3 text-lg text-gray-300 max-w-2xl mx-auto">
          Pomóż nam dobrać bezpieczny plan. Te informacje są <strong>opcjonalne</strong> - możesz je pominąć.
        </p>
      </div>

      {/* Kontuzje */}
      <div>
        <label className="block text-xl font-bold text-white mb-4 text-center">
          Czy masz jakieś kontuzje?
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {injuryOptions.map(injury => (
            <button
              key={injury.id}
              type="button"
              onClick={() => toggleInjury(injury.id)}
              className={[
                'p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3',
                (planData.health.injuries || []).includes(injury.id)
                  ? injury.id === 'none' 
                    ? 'border-emerald-400 bg-emerald-400/10'
                    : 'border-red-400 bg-red-400/10'
                  : 'border-white/10 bg-white/5 hover:border-red-400/50'
              ].join(' ')}
            >
              <div>{injury.icon}</div>
              <div className="text-white font-medium text-center text-sm">{injury.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Health Conditions */}
      <div>
        <label className="block text-xl font-bold text-white mb-4 text-center">
          Czy masz jakieś schorzenia?
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {healthConditionOptions.map(condition => (
            <button
              key={condition.id}
              type="button"
              onClick={() => toggleHealthCondition(condition.id)}
              className={[
                'p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3',
                (planData.health.healthConditions || []).includes(condition.id)
                  ? condition.id === 'none'
                    ? 'border-emerald-400 bg-emerald-400/10'
                    : 'border-yellow-400 bg-yellow-400/10'
                  : 'border-white/10 bg-white/5 hover:border-yellow-400/50'
              ].join(' ')}
            >
              <div>{condition.icon}</div>
              <div className="text-white font-medium text-center text-sm">{condition.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Dodatkowe notatki */}
      <div className="mx-auto max-w-2xl">
        <label className="block text-lg font-semibold text-white mb-3 text-center">
          Dodatkowe informacje (opcjonalne)
        </label>
        <textarea
          value={planData.health.healthNotes || ''}
          onChange={(e) => setPlanData(p => ({ ...p, health: { ...p.health, healthNotes: e.target.value } }))}
          placeholder="np. Po operacji kolana w 2022, unikam głębokich przysiadów..."
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-gray-500 mt-2 text-right">
          {(planData.health.healthNotes || '').length}/500 znaków
        </p>
      </div>

      {/* Disclaimer */}
      <div className="mx-auto max-w-2xl p-4 rounded-xl bg-blue-400/10 border border-blue-400/20">
        <p className="text-sm text-blue-300 text-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="inline mr-2 text-blue-400">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Informacje zdrowotne pomogą nam dobrać bezpieczniejszy plan. Zawsze konsultuj z lekarzem przed rozpoczęciem treningu, szczególnie przy problemach zdrowotnych.
        </p>
      </div>

      {/* Opcja pominięcia */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => {
            setPlanData(p => ({ ...p, health: { injuries: ['none'], healthConditions: ['none'], healthNotes: '' } }));
            // 🆕 Przejdź do ostatniego kroku (może być 5 lub 6 w zależności od trybu)
            const steps = getSteps();
            setCurrentStep(steps.length - 1);
          }}
          className="text-gray-400 hover:text-white transition-colors text-sm underline"
        >
          Pomiń ten krok →
        </button>
      </div>
    </div>
  );

  const renderNameStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <Kicker>Krok 7 z 7</Kicker>
        <h2 className="mt-4 text-4xl font-black text-white">Nazwij swój plan</h2>
        <p className="mt-3 text-lg text-gray-300 max-w-2xl mx-auto">
          Nadaj swojemu planowi unikalną nazwę, która będzie Cię motywować
        </p>
      </div>

      <div className="mx-auto max-w-lg">
        <label className="mb-3 block text-sm font-semibold uppercase tracking-wide text-gray-400">
          Nazwa planu *
        </label>
        <input
          type="text"
          maxLength="50"
          value={planData.name}
          onChange={(e) => setPlanData((p) => ({ ...p, name: e.target.value }))}
          className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-lg font-semibold text-white outline-none transition-all focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30"
          placeholder="Np. Mój plan na masę 2025"
        />
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-gray-500">{(planData.name || '').length}/50 znaków</span>
          {planData.name && planData.name.length > 40 && (
            <span className="text-yellow-400">Zbliżasz się do limitu</span>
          )}
        </div>
        {errors.name && (
          <p className="mt-2 text-sm text-red-400">{errors.name}</p>
        )}
      </div>

      <div className="mx-auto max-w-lg">
        <p className="mb-3 text-sm text-gray-400">Przykładowe nazwy:</p>
        <div className="flex flex-wrap gap-2">
          {[
            'Transformacja 2025',
            `Plan na ${planData.goal || 'cel'}`,
            'Nowa wersja mnie',
            `${planData.trainingDaysPerWeek || 3}x w tygodniu`,
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setPlanData((p) => ({ ...p, name: suggestion }))}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // KOMPONENT PODSUMOWANIA
  // ============================================================================
  const SummaryCard = () => (
    <div className="sticky top-28">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <h3 className="mb-6 text-xl font-bold text-white flex items-center gap-2">
          Podsumowanie planu
        </h3>

        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Metoda</p>
            <p className="mt-1 font-semibold text-white">
              {methodOptions.find((m) => m.value === planData.recommendationMethod)?.label || '—'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Cel</p>
              <p className="mt-1 font-semibold text-white">
                {goalOptions.find((g) => g.value === planData.goal)?.label || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Poziom</p>
              <p className="mt-1 font-semibold text-white capitalize">{planData.level || '—'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Dni/tydzień</p>
              <p className="mt-1 font-semibold text-white">{planData.trainingDaysPerWeek || '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Czas/sesja</p>
              <p className="mt-1 font-semibold text-white">
                {planData.timePerSession ? `${planData.timePerSession} min` : '—'}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Sprzęt</p>
            <p className="mt-1 font-semibold text-white">
              {equipmentOptions.find((e) => e.value === planData.equipment)?.label || '—'}
            </p>
          </div>

          {planData.body.age && planData.body.weightKg && planData.body.heightCm && (
            <div className="border-t border-white/10 pt-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Parametry ciała</p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-gray-400">Wiek:</span>
                  <p className="font-semibold text-white">{planData.body.age} lat</p>
                </div>
                <div>
                  <span className="text-gray-400">Waga:</span>
                  <p className="font-semibold text-white">{planData.body.weightKg} kg</p>
                </div>
                <div>
                  <span className="text-gray-400">Wzrost:</span>
                  <p className="font-semibold text-white">{planData.body.heightCm} cm</p>
                </div>
              </div>
            </div>
          )}

          {planData.name && (
            <div className="border-t border-white/10 pt-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Nazwa planu</p>
              <p className="mt-1 font-semibold text-white">{planData.name}</p>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="mt-6 rounded-xl bg-white/5 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Postęp wypełniania</span>
            <span className="font-semibold text-emerald-300">{(((currentStep + 1) / getSteps().length) * 100).toFixed(0)}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / getSteps().length) * 100}%` }}
            />
          </div>
        </div>

        {apiError && (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-900/20 p-4">
            <div className="flex items-start gap-2">
              <span className="text-red-400">⚠️</span>
              <p className="text-sm text-red-200">{apiError}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ============================================================================
  // RENDER GŁÓWNY
  // ============================================================================
  // 🆕 Dynamiczna lista kroków - ukryj "Nazwa" gdy wybrano plany
  const steps = getSteps();

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black">
      <GradientGridBg />
      <GlowOrb className="left-[10%] top-32 h-64 w-64 bg-emerald-400/20" />
      <GlowOrb className="right-[15%] bottom-32 h-52 w-52 bg-teal-400/20" />

      <Navbar />

      <div className="mx-auto max-w-7xl px-6 pt-28 pb-16">
        <StepProgress />

        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-8 md:p-10">
            {steps[currentStep].component()}

            <div className="mt-10 flex items-center justify-between">
              <SecondaryButton
                onClick={handlePrev}
                disabled={currentStep === 0}
                className={currentStep === 0 ? 'invisible' : ''}
              >
                ← Wstecz
              </SecondaryButton>

              {currentStep < steps.length - 1 ? (
                <PrimaryButton onClick={handleNext}>
                  Dalej →
                </PrimaryButton>
              ) : (
                <PrimaryButton
                  onClick={generateRecommendedPlan}
                  disabled={loading || !isStepValid(currentStep)}
                  className="min-w-[200px]"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Generuję plan...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      Wygeneruj plan
                    </span>
                  )}
                </PrimaryButton>
              )}
            </div>
          </div>

          <aside className="hidden lg:block">
            <SummaryCard />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPlanCreator;
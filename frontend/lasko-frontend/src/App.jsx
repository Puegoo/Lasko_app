// frontend/lasko-frontend/src/App.jsx
// ✅ LOGIKA BEZ ZMIAN – tylko warstwa UI/UX

import React, { useState, useRef, useEffect } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import apiService from './services/api';

// Komponenty
import RegistrationContainer from './components/register/RegistrationContainer.jsx';
import AlgorithmChoicePage from './components/register/AlgorithmChoicePage';
import EnhancedPlanCreator from './components/register/EnhancedPlanCreator';
import DashboardPage from './components/DashboardPage';
import PlanCreatorPreview from './components/PlanCreatorPreview';
import LoginPage from './components/auth/LoginPage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import PlanSummary from './components/register/PlanSummary.jsx';
import PlanDetailsPage from './components/PlanDetailsPage.jsx';
import WorkoutPage from './components/WorkoutPage.jsx';
import ExerciseCatalogPage from './components/ExerciseCatalogPage.jsx';
import ExercisePlanCreator from './components/exercises/ExercisePlanCreator.jsx';
import ProgressPage from './components/ProgressPage.jsx';
import JournalPage from './components/JournalPage.jsx';
import StatisticsPage from './components/StatisticsPage.jsx';
import CommunityPage from './components/CommunityPage.jsx';
import SettingsPage from './components/SettingsPage.jsx';
import CalendarPage from './components/CalendarPage.jsx';
import PlansPage from './components/PlansPage.jsx';
import AdminApp from './admin/AdminApp.jsx';
import Error400Page from './components/ErrorPages/Error400Page.jsx';
import Error403Page from './components/ErrorPages/Error403Page.jsx';
import Error404Page from './components/ErrorPages/Error404Page.jsx';
import Error500Page from './components/ErrorPages/Error500Page.jsx';
import Error503Page from './components/ErrorPages/Error503Page.jsx';
import TermsPage from './components/StaticPages/TermsPage.jsx';
import PrivacyPolicyPage from './components/StaticPages/PrivacyPolicyPage.jsx';
import ContactPage from './components/StaticPages/ContactPage.jsx';
import PlanCreatorBlank from './components/PlanCreatorBlank.jsx';

// Assets
import laskoHi from './assets/Lasko_pose/Lasko_Hi.png';
import whoIsLasko from './assets/Lasko_pose/whoislasko.png';
import laskoCropHi from './assets/Lasko_pose/Lasko_crop_Hi.png';

// ---------- UI helpers (tylko wygląd) ----------
const GradientGridBg = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
    {/* miękkie plamy */}
    <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-[#1DCD9F]/10 blur-3xl" />
    <div className="absolute top-1/3 -right-20 w-96 h-96 rounded-full bg-[#0D7A61]/10 blur-3xl" />
    {/* siatka svg */}
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

const PrimaryButton = ({ to, onClick, children }) => {
  const Cmp = to ? Link : 'button';
  const props = to ? { to } : { onClick };
  return (
    <Cmp
      {...props}
      className="group relative inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-bold text-white transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 active:scale-[0.98]"
    >
      <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] opacity-90 transition-opacity group-hover:opacity-100" />
      <span className="absolute inset-0 -z-10 rounded-full blur-md bg-emerald-500/20 group-hover:bg-emerald-500/30" />
      <span className="relative"> {children} </span>
    </Cmp>
  );
};

const SecondaryButton = ({ to, children }) => (
  <Link
    to={to}
    className="inline-flex items-center justify-center rounded-full border-2 border-emerald-400/60 px-7 py-3 text-sm font-bold text-emerald-300 hover:bg-emerald-400/10 transition-colors"
  >
    {children}
  </Link>
);

// Nagłówek sekcji
const SectionHeading = ({ kicker, title, subtitle }) => (
  <div className="mx-auto mb-10 max-w-3xl text-center">
    {kicker && <Kicker>{kicker}</Kicker>}
    <h3 className="mt-3 text-3xl font-black text-white md:text-4xl">{title}</h3>
    {subtitle && <p className="mt-3 text-lg text-gray-300">{subtitle}</p>}
  </div>
);

// Ochrona tras – bez zmian logicznych
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#1DCD9F] border-t-transparent motion-reduce:animate-none" />
          <p className="text-white">Ładowanie...</p>
        </div>
      </div>
    );
  }
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const hasAccess = isAuthenticated() && (user?.is_admin || user?.is_superuser);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#1DCD9F] border-t-transparent motion-reduce:animate-none" />
          <p className="text-white">Ładowanie...</p>
        </div>
      </div>
    );
  }

  return hasAccess ? children : <Navigate to="/" replace />;
};

// ---------- LANDING ----------
const HomePage = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [showPlanDropdown, setShowPlanDropdown] = useState(false);
  const planButtonRef = useRef(null);
  const [stats, setStats] = useState({
    users: '10k+',
    plans: '1 200',
    exercises: '46'
  });

  // Lokalny IconButton spójny z dashboardem
  const IconButton = ({ icon, tooltip, onClick, to, className = '' }) => {
    const baseClasses =
      'relative flex items-center justify-center w-10 h-10 rounded-lg text-gray-300 hover:text-white transition-all duration-200 hover:bg-white/5 hover:border-white/10 border border-transparent group';
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

  // Zamknij dropdown "Nowy plan" po kliknięciu poza
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (planButtonRef.current && !planButtonRef.current.contains(event.target)) {
        setShowPlanDropdown(false);
      }
    };

    if (showPlanDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPlanDropdown]);

  // Pobierz statystyki publiczne
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiService.request('/api/statistics/public/');
        if (response.success && response.stats) {
          const { users, plans, exercises } = response.stats;
          
          // Formatuj liczby
          const formatUsers = users >= 10000 
            ? `${Math.floor(users / 1000)}k+` 
            : users.toLocaleString('pl-PL');
          
          const formatPlans = plans >= 1000 
            ? plans.toLocaleString('pl-PL').replace(',', ' ')
            : plans.toString();
          
          const formatExercises = exercises.toString();
          
          setStats({
            users: formatUsers,
            plans: formatPlans,
            exercises: formatExercises
          });
        }
      } catch (error) {
        console.error('[HomePage] Error fetching public statistics:', error);
        // Zostaw domyślne wartości w przypadku błędu
      }
    };
    
    fetchStats();
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black">
      <GradientGridBg />

      {/* Navbar */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-4">
          <Link to="/" className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
            Lasko
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <>
                {/* User chip */}
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-emerald-400"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="text-sm text-gray-300">
                    <span className="font-semibold text-white">{user.username}</span>
                  </span>
                </div>

                {/* Akcje */}
                <div className="relative" ref={planButtonRef}>
                  <IconButton
                    icon={
                      <svg
                        width="20"
                        height="20"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-emerald-400"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    }
                    tooltip="Nowy plan"
                    onClick={() => setShowPlanDropdown(!showPlanDropdown)}
                    className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                  />
                  {showPlanDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowPlanDropdown(false)} />
                      <div
                        className="absolute top-full right-0 mt-2 z-50 w-64 rounded-lg border border-white/10 bg-black/95 backdrop-blur-xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-1">
                          <button
                            onClick={() => {
                              setShowPlanDropdown(false);
                              window.location.href = '/enhanced-plan-creator';
                            }}
                            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-200 hover:bg-white/5 hover:text-white transition-colors border border-transparent hover:border-white/10 text-left"
                          >
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-white">Na podstawie preferencji</div>
                              <div className="text-xs text-gray-400 mt-0.5">System dobierze plan</div>
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              setShowPlanDropdown(false);
                              window.location.href = '/plan-creator-blank';
                            }}
                            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-200 hover:bg-white/5 hover:text-white transition-colors border border-transparent hover:border-white/10 text-left"
                          >
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-white">Stwórz od zera</div>
                              <div className="text-xs text-gray-400 mt-0.5">Wybierz ćwiczenia ręcznie</div>
                            </div>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <IconButton
                  icon={
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  }
                  tooltip="Ustawienia"
                  to="/settings"
                />
                <IconButton
                  icon={
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  }
                  tooltip="Wyloguj"
                  onClick={logout}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                />
              </>
            ) : (
              <>
                <SecondaryButton to="/login">Mam konto</SecondaryButton>
                <PrimaryButton to="/register">Zarejestruj się</PrimaryButton>
              </>
            )}
          </div>

          {/* mobile */}
          <button
            onClick={() => setOpen(v => !v)}
            className="md:hidden rounded-full p-2 text-gray-300 hover:bg-white/5 hover:text-white"
            aria-label="Otwórz menu"
          >
            {/* hamburger */}
            <svg width="24" height="24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeWidth="2" d="M4 7h16M4 12h16M4 17h16"/></svg>
          </button>
        </div>

        {/* mobile menu */}
        {open && (
          <div className="md:hidden border-t border-white/5 bg-black/80 px-6 py-3">
            <div className="flex flex-col gap-2">
              <Link to="/#features" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-gray-200 hover:bg-white/5">Funkcje</Link>
              <Link to="/#how" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-gray-200 hover:bg-white/5">Jak działa</Link>
              <Link to="/#opinions" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-gray-200 hover:bg-white/5">Opinie</Link>
              <div className="mt-2 flex items-center gap-2">
                {user ? (
                  <>
                    <PrimaryButton to="/dashboard">Dashboard</PrimaryButton>
                    <button onClick={logout} className="rounded-full px-4 py-2 text-gray-300 hover:text-white">Wyloguj</button>
                  </>
                ) : (
                  <>
                    <SecondaryButton to="/login">Logowanie</SecondaryButton>
                    <PrimaryButton to="/register">Start</PrimaryButton>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <header className="relative px-6 pt-28 pb-16 md:pt-32">
        <GlowOrb className="left-[5%] top-24 h-52 w-52 bg-emerald-400/30" />
        <GlowOrb className="right-[10%] top-1/2 h-64 w-64 bg-teal-400/30" />

        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
          {/* tekst */}
          <div className="space-y-8">
            <Kicker>Inteligentne rekomendacje treningu</Kicker>
            <h1 className="text-5xl font-black leading-tight text-white md:text-7xl">
              Twój osobisty{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                trener AI
              </span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-gray-300">
              Analizujemy cel, poziom, dostępny sprzęt i biometrie, aby zbudować plan, który naprawdę działa –
              z adaptacją obciążenia i mądrą regeneracją.
            </p>

            {/* CTA + „metryki zaufania” */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {user ? (
                <PrimaryButton to="/dashboard">Przejdź do Dashboard</PrimaryButton>
              ) : (
                <>
                  <PrimaryButton to="/register">Rozpocznij za darmo</PrimaryButton>
                  <SecondaryButton to="/login">Mam już konto</SecondaryButton>
                </>
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4 max-w-lg">
              {[
                { v: stats.users, l: 'użytkowników' },
                { v: stats.plans, l: 'planów' },
                { v: stats.exercises, l: 'ćwiczeń' },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                  <div className="text-xl font-extrabold text-white">{s.v}</div>
                  <div className="text-xs uppercase tracking-wide text-gray-400">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* obraz */}
          <div className="relative">
            <div className="relative z-10">
              <img
                src={laskoHi}
                alt="Lasko - Twój osobisty trener AI"
                className="mx-auto w-full max-w-lg drop-shadow-[0_20px_60px_rgba(16,185,129,.35)]"
              />
            </div>
            {/* dekoracje */}
            <div className="pointer-events-none absolute -left-8 top-1/4 h-24 w-24 rounded-full bg-emerald-400/20 blur-xl motion-reduce:hidden" />
            <div className="pointer-events-none absolute -right-8 bottom-1/4 h-28 w-28 rounded-full bg-teal-400/20 blur-xl motion-reduce:hidden" />
          </div>
        </div>
      </header>

      {/* Funkcje */}
      <section id="features" className="px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            kicker="Funkcje"
            title="Wszystko, czego potrzebuje Twój plan"
            subtitle="Planowanie, progresja i motywacja – w jednym miejscu."
          />
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { 
                t: 'Inteligentne rekomendacje', 
                d: 'System AI analizuje Twoje preferencje i tworzy spersonalizowany plan treningowy.', 
                i: <svg width="40" height="40" viewBox="0 0 16 16" fill="none" className="text-emerald-400"><path d="M7.657 6.247c.11-.33.576-.33.686 0l.645 1.937a2.89 2.89 0 0 0 1.829 1.828l1.936.645c.33.11.33.576 0 .686l-1.937.645a2.89 2.89 0 0 0-1.828 1.829l-.645 1.936a.361.361 0 0 1-.686 0l-.645-1.937a2.89 2.89 0 0 0-1.828-1.828l-1.937-.645a.361.361 0 0 1 0-.686l1.937-.645a2.89 2.89 0 0 0 1.828-1.828l.645-1.937zM3.794 1.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387A1.734 1.734 0 0 0 4.593 5.69l-.387 1.162a.217.217 0 0 1-.412 0L3.407 5.69A1.734 1.734 0 0 0 2.31 4.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387A1.734 1.734 0 0 0 3.407 2.31l.387-1.162zM10.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.156 1.156 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.156 1.156 0 0 0-.732-.732L9.1 2.137a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732L10.863.1z" fill="currentColor"/></svg>
              },
              { 
                t: 'Katalog ćwiczeń', 
                d: 'Przeglądaj, oceniaj i dodawaj do ulubionych ćwiczenia z bazy 46 ćwiczeń.', 
                i: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-blue-400"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/></svg>
              },
              { 
                t: 'Śledzenie postępów', 
                d: 'Rekordy osobiste, pomiary ciała, waga i zaawansowane statystyki treningowe.', 
                i: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-purple-400"><path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="18 17 13 12 9 16 5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(180 11.5 14)"/></svg>
              },
              { 
                t: 'Dziennik treningowy', 
                d: 'Zapisuj notatki, refleksje i obserwacje z każdego treningu.', 
                i: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-teal-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              },
              { 
                t: 'Kalendarz treningów', 
                d: 'Harmonogram i historia treningów z wizualizacją aktywności.', 
                i: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-yellow-400"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              },
              { 
                t: 'Statystyki i analizy', 
                d: 'Objętość treningowa, częstotliwość partii mięśniowych i heat mapy aktywności.', 
                i: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-emerald-400"><line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="20" x2="12" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="6" y1="20" x2="6" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              },
            ].map((f, i) => (
              <div
                key={i}
                className="group relative rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-colors hover:border-emerald-400/40"
              >
                <div className="mb-3">{f.i}</div>
                <h4 className="mb-2 text-lg font-bold text-white">{f.t}</h4>
                <p className="text-gray-300">{f.d}</p>
                <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 ring-1 ring-emerald-400/30 transition-opacity group-hover:opacity-100" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Jak to działa */}
      <section id="how" className="px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            kicker="Proces"
            title="3 kroki do mądrzejszego treningu"
            subtitle="Szybko, prosto i skutecznie."
          />
          <ol className="grid gap-6 md:grid-cols-3">
            {[
              { 
                step: '01', 
                title: 'Krótka ankieta', 
                desc: 'Cel, poziom, sprzęt, biometria (wiek/waga/wzrost).', 
                icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-emerald-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              },
              { 
                step: '02', 
                title: 'Analiza AI', 
                desc: 'Algorytm wybiera objętość i intensywność, dopasowuje harmonogram.', 
                icon: <svg width="48" height="48" viewBox="0 0 16 16" fill="none" className="text-blue-400"><path d="M7.657 6.247c.11-.33.576-.33.686 0l.645 1.937a2.89 2.89 0 0 0 1.829 1.828l1.936.645c.33.11.33.576 0 .686l-1.937.645a2.89 2.89 0 0 0-1.828 1.829l-.645 1.936a.361.361 0 0 1-.686 0l-.645-1.937a2.89 2.89 0 0 0-1.828-1.828l-1.937-.645a.361.361 0 0 1 0-.686l1.937-.645a2.89 2.89 0 0 0 1.828-1.828l.645-1.937zM3.794 1.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387A1.734 1.734 0 0 0 4.593 5.69l-.387 1.162a.217.217 0 0 1-.412 0L3.407 5.69A1.734 1.734 0 0 0 2.31 4.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387A1.734 1.734 0 0 0 3.407 2.31l.387-1.162zM10.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.156 1.156 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.156 1.156 0 0 0-.732-.732L9.1 2.137a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732L10.863.1z" fill="currentColor"/></svg>
              },
              { 
                step: '03', 
                title: 'Twój plan', 
                desc: 'Spersonalizowany plan z progresją i wsparciem Lasko.', 
                icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-yellow-400"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              },
            ].map((k, i) => (
              <li key={i} className="group relative rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <div className="mb-3">{k.icon}</div>
                <div className="text-xs font-bold tracking-widest text-emerald-300">KROK {k.step}</div>
                <h5 className="mb-2 mt-1 text-lg font-bold text-white">{k.title}</h5>
                <p className="text-gray-300">{k.desc}</p>
                <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 ring-1 ring-emerald-400/30 transition-opacity group-hover:opacity-100" />
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Kim jest Lasko + wiadomość */}
      <section className="px-6 py-12">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <h3 className="mb-3 text-2xl font-bold text-white">Kim jest Lasko?</h3>
            <p className="mb-5 text-lg text-gray-300">
              Twój towarzysz w drodze do lepszej wersji siebie – przypomni o treningu, dopasuje obciążenia,
              a gdy trzeba, doda otuchy.
            </p>
            <img src={whoIsLasko} alt="Kim jest Lasko" className="mx-auto max-h-64 w-full object-contain" />
            <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/10" />
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-8 flex flex-col">
            <blockquote className="relative z-10 text-lg italic text-gray-200 mb-auto">
              <p className="mb-2">Hej, jestem Lasko! Wiem, że zmiana bywa trudna... Dlatego tu jestem.</p>
              <p className="text-right">Razem znajdziemy sposób na Ciebie – ten najlepszy.</p>
            </blockquote>
            <div className="mt-auto flex items-end justify-center h-48">
              <img
                src={laskoCropHi}
                alt="Lasko"
                className="pointer-events-none w-full max-w-xs object-contain opacity-90"
                style={{ aspectRatio: '2982/1195' }}
              />
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/10" />
          </div>
        </div>
      </section>

      {/* Opinie */}
      <section id="opinions" className="px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <SectionHeading kicker="Opinie" title="Co mówią użytkownicy" />
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { n: 'Marta', r: '5/5', t: 'W 12 tygodni podciągnęłam się z 0 do 5 powtórzeń. Plan był klarowny i motywujący.' },
              { n: 'Kamil', r: '5/5', t: 'Przestałem błądzić po siłowni. Każda sesja ma cel – i widzę to w liczbach.' },
              { n: 'Ola', r: '4.5/5', t: 'Najbardziej lubię przypomnienia i krótkie wskazówki techniczne w trakcie.' },
            ].map((o, i) => (
              <div key={i} className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/20 text-white">
                    {o.n[0]}
                  </div>
                  <div>
                    <p className="font-bold text-white">{o.n}</p>
                    <p className="text-sm text-gray-400">Ocena: {o.r}</p>
                  </div>
                </div>
                <p className="text-gray-300">“{o.t}”</p>
                <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA końcowe */}
      <section className="px-6 pb-14 pt-6">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] p-8">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h4 className="text-2xl font-black text-white md:text-3xl">Gotowy na mądrzejszy trening?</h4>
              <p className="mt-1 text-white/90">
                Dołącz teraz i zacznij widzieć postępy w liczbach – nie tylko w lustrze.
              </p>
            </div>
            <PrimaryButton to="/register">Zacznij za darmo</PrimaryButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <Link to="/" className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Lasko
            </Link>
          </div>
          <div className="mt-8 grid gap-4 text-center text-sm text-gray-500 md:grid-cols-3 md:text-left">
            <div className="flex justify-center gap-4 md:justify-start">
              <Link to="/terms" className="hover:text-white transition-colors">Regulamin</Link>
              <Link to="/privacy-policy" className="hover:text-white transition-colors">Polityka prywatności</Link>
              <Link to="/contact" className="hover:text-white transition-colors">Kontakt</Link>
            </div>
            <div className="order-first md:order-none">© {new Date().getFullYear()} Lasko. Wszystkie prawa zastrzeżone.</div>
            <div />
          </div>
        </div>
      </footer>
    </div>
  );
};

// ---------- APP (routy bez zmian) ----------
const App = () => {
  return (
    <Routes>
      {/* Strona główna */}
      <Route path="/" element={<HomePage />} />

      {/* Logowanie */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Rejestracja */}
      <Route path="/register" element={<RegistrationContainer />} />

      {/* Wybór algorytmu (po rejestracji) */}
      <Route path="/choose-algorithm" element={<AlgorithmChoicePage />} />

      {/* Kreator planu (rozszerzony) */}
      <Route path="/enhanced-plan-creator" element={<EnhancedPlanCreator />} />
      
      {/* Kreator planu od zera */}
      <Route 
        path="/plan-creator-blank" 
        element={
          <ProtectedRoute>
            <PlanCreatorBlank />
          </ProtectedRoute>
        } 
      />

      {/* Chronione trasy */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plan-summary"
        element={
          <ProtectedRoute>
            <PlanSummary />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exercise-recommendations"
        element={
          <ProtectedRoute>
            <ExercisePlanCreator />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plan-preview"
        element={
          <ProtectedRoute>
            <PlanCreatorPreview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plan-details/:planId"
        element={
          <ProtectedRoute>
            <PlanDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workout/today"
        element={
          <ProtectedRoute>
            <WorkoutPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exercises"
        element={
          <ProtectedRoute>
            <ExerciseCatalogPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/progress"
        element={
          <ProtectedRoute>
            <ProgressPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/journal"
        element={
          <ProtectedRoute>
            <JournalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/statistics"
        element={
          <ProtectedRoute>
            <StatisticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/community"
        element={
          <ProtectedRoute>
            <CommunityPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plans"
        element={
          <ProtectedRoute>
            <PlansPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plan/:planId"
        element={
          <ProtectedRoute>
            <PlanDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <AdminRoute>
            <AdminApp />
          </AdminRoute>
        } />

      {/* Strony statyczne */}
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/contact" element={<ContactPage />} />

      {/* Strony błędów */}
      <Route path="/400" element={<Error400Page />} />
      <Route path="/403" element={<Error403Page />} />
      <Route path="/404" element={<Error404Page />} />
      <Route path="/500" element={<Error500Page />} />
      <Route path="/503" element={<Error503Page />} />

      {/* Przekierowanie nieznanych tras */}
      <Route path="*" element={<Error404Page />} />
    </Routes>
  );
};

export default App;
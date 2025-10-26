// frontend/lasko-frontend/src/App.jsx
// ✅ LOGIKA BEZ ZMIAN – tylko warstwa UI/UX

import React, { useState } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Komponenty
import RegistrationContainer from './components/register/RegistrationContainer.jsx';
import AlgorithmChoicePage from './components/register/AlgorithmChoicePage';
import EnhancedPlanCreator from './components/register/EnhancedPlanCreator';
import DashboardPage from './components/DashboardPage';
import PlanCreatorPreview from './components/PlanCreatorPreview';
import LoginPage from './components/auth/LoginPage';
import PlanSummary from './components/register/PlanSummary.jsx';
import PlanDetailsPage from './components/PlanDetailsPage.jsx';
import WorkoutPage from './components/WorkoutPage.jsx';

// Assets
import laskoHi from './assets/Lasko_pose/Lasko_Hi.png';
import whoIsLasko from './assets/Lasko_pose/whoislasko.png';
import laskoCropHi from './assets/Lasko_pose/Lasko_crop_Hi.png';
import instagramIcon from './assets/icons/instagram.svg';
import twitterIcon from './assets/icons/twitter.svg';
import tiktokIcon from './assets/icons/tiktok.svg';
import facebookIcon from './assets/icons/facebook.svg';

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

// ---------- LANDING ----------
const HomePage = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black">
      <GradientGridBg />

      {/* Navbar */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
            Lasko
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <>
                <span className="hidden text-sm text-gray-300 lg:inline">Witaj, <span className="font-semibold text-white">{user.username}</span>!</span>
                <PrimaryButton to="/dashboard">Dashboard</PrimaryButton>
                <button onClick={logout} className="text-sm text-gray-300 hover:text-white">Wyloguj</button>
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
                { v: '10k+', l: 'użytkowników' },
                { v: '1 200+', l: 'planów' },
                { v: '600+', l: 'ćwiczeń' },
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
              { t: 'Adaptacyjny progres', d: 'Obciążenia rosną, gdy rośnie forma – i cofają, gdy ciało potrzebuje luzu.', i: '📈' },
              { t: 'Biblioteka ćwiczeń', d: 'Instrukcje i wideo do kluczowych ruchów – od przysiadu po mobilizację.', i: '🎥' },
              { t: 'Śledzenie regeneracji', d: 'Sen, RPE, tętno. Dane pomagają trenować mądrzej, nie więcej.', i: '💤' },
              { t: 'Integracje', d: 'Zgrywaj aktywności z zegarka/telefonu dla pełnego obrazu tygodnia.', i: '🔗' },
              { t: 'Plan dnia', d: 'Gotowy rozkład serii, powtórzeń i przerw – zero zgadywania.', i: '🗓️' },
              { t: 'Statystyki', d: 'PR-y, objętość, trendy. Progres widzisz czarno na białym.', i: '📊' },
            ].map((f, i) => (
              <div
                key={i}
                className="group relative rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-colors hover:border-emerald-400/40"
              >
                <div className="mb-3 text-3xl">{f.i}</div>
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
              { step: '01', title: 'Krótka ankieta', desc: 'Cel, poziom, sprzęt, biometria (wiek/waga/wzrost).', icon: '📝' },
              { step: '02', title: 'Analiza AI', desc: 'Algorytm wybiera objętość i intensywność, dopasowuje harmonogram.', icon: '🤖' },
              { step: '03', title: 'Twój plan', desc: 'Spersonalizowany plan z progresją i wsparciem Lasko.', icon: '🎯' },
            ].map((k, i) => (
              <li key={i} className="group relative rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <div className="mb-3 text-4xl">{k.icon}</div>
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

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <blockquote className="relative z-10 text-lg italic text-gray-200">
              <p className="mb-2">Hej, jestem Lasko! Wiem, że zmiana bywa trudna... Dlatego tu jestem.</p>
              <p className="text-right">Razem znajdziemy sposób na Ciebie – ten najlepszy.</p>
            </blockquote>
            <img
              src={laskoCropHi}
              alt="Lasko"
              className="pointer-events-none absolute -bottom-6 left-3 w-[18rem] max-w-[55vw] opacity-90"
              style={{ aspectRatio: '2982/1195' }}
            />
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
            <Link to="/" className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Lasko
            </Link>
            <div className="flex gap-6">
              {[
                { icon: instagramIcon, href: "#", label: "Instagram" },
                { icon: twitterIcon, href: "#", label: "Twitter" },
                { icon: tiktokIcon, href: "#", label: "TikTok" },
                { icon: facebookIcon, href: "#", label: "Facebook" }
              ].map((s, i) => (
                <a key={i} href={s.href} aria-label={s.label} className="text-gray-400 hover:text-white">
                  <img src={s.icon} alt={s.label} className="h-6 w-6" />
                </a>
              ))}
            </div>
          </div>
          <div className="mt-8 grid gap-4 text-center text-sm text-gray-500 md:grid-cols-3 md:text-left">
            <div className="flex justify-center gap-4 md:justify-start">
              <a href="#" className="hover:text-white">Regulamin</a>
              <a href="#" className="hover:text-white">Polityka prywatności</a>
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

      {/* Rejestracja */}
      <Route path="/register" element={<RegistrationContainer />} />

      {/* Wybór algorytmu (po rejestracji) */}
      <Route path="/choose-algorithm" element={<AlgorithmChoicePage />} />

      {/* Kreator planu (rozszerzony) */}
      <Route path="/enhanced-plan-creator" element={<EnhancedPlanCreator />} />

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

      {/* Przekierowanie nieznanych tras */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { RecommendationService } from '../../services/recommendationService';

// ---------- UI helpers ----------
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

const PrimaryButton = ({ onClick, to, children, className = '' }) => {
  const Comp = to ? Link : 'button';
  const props = to ? { to } : { onClick };
  return (
    <Comp
      {...props}
      className={[
        'group relative inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-bold text-white transition-transform',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 active:scale-[0.98]',
        className,
      ].join(' ')}
    >
      <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] opacity-90 transition-opacity group-hover:opacity-100" />
      <span className="absolute inset-0 -z-10 rounded-full blur-md bg-emerald-500/20 group-hover:bg-emerald-500/30" />
      <span className="relative">{children}</span>
    </Comp>
  );
};

const SecondaryButton = ({ onClick, to, children, className = '' }) => {
  const Comp = to ? Link : 'button';
  const props = to ? { to } : { onClick };
  return (
    <Comp
      {...props}
      className={[
        'inline-flex items-center justify-center rounded-full border-2 border-emerald-400/60 px-7 py-3 text-sm font-bold text-emerald-300',
        'hover:bg-emerald-400/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60',
        className,
      ].join(' ')}
    >
      {children}
    </Comp>
  );
};

// Navbar
const Navbar = () => {
  const { user, logout, isAuthenticated, getToken, debugAuth } = useAuth();
  const looksAuthed =
    (typeof isAuthenticated === 'function' && isAuthenticated()) ||
    (typeof getToken === 'function' && !!getToken());
  const navbarName =
    user?.username || sessionStorage.getItem('lasko_username') || 'Użytkowniku';

  // Jeżeli mamy token, ale brak usera – delikatny „poke” do warstwy auth
  useEffect(() => {
    if (!user && looksAuthed) {
      try { debugAuth?.(); } catch {}
    }
  }, [user, looksAuthed, debugAuth]);

  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
          Lasko
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          {looksAuthed ? (
            <>
              <span className="hidden text-sm text-gray-300 lg:inline">
                Witaj, <span className="font-semibold text-white">{navbarName}</span>!
              </span>
              <PrimaryButton to="/dashboard">Dashboard</PrimaryButton>
              <button onClick={logout} className="text-sm text-gray-300 hover:text-white">
                Wyloguj
              </button>
            </>
          ) : (
            <>
              <SecondaryButton to="/login">Mam konto</SecondaryButton>
              <PrimaryButton to="/register">Zarejestruj się</PrimaryButton>
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

// Cards
const StatCard = ({ label, value, icon }) => (
  <div className="group relative rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-all hover:border-emerald-400/40">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
        <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      </div>
      <span className="text-2xl opacity-70">{icon}</span>
    </div>
    <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 ring-1 ring-emerald-400/30 transition-opacity group-hover:opacity-100" />
  </div>
);

const ExerciseCard = ({ exercise, index }) => (
  <div className="group relative rounded-xl border border-white/10 bg-white/[0.04] p-4 transition-all hover:border-emerald-400/40">
    <div className="flex items-center gap-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300 font-bold">
        {index + 1}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-white">{exercise.name}</h4>
        {(exercise.sets || exercise.reps || exercise.rest) && (
          <p className="mt-1 text-sm text-gray-400">
            {exercise.sets ? `${exercise.sets} serie` : ''}{exercise.sets && exercise.reps ? ' × ' : ''}
            {exercise.reps ? `${exercise.reps} powtórzeń` : ''}{(exercise.sets || exercise.reps) && exercise.rest ? ' • ' : ''}
            {exercise.rest ? `przerwy ${exercise.rest}` : ''}
          </p>
        )}
      </div>
    </div>
  </div>
);

const DayCard = ({ day, index }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-lg font-bold text-white">
        Dzień {index + 1}: {day.title || 'Trening'}
      </h3>
      <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
        {day.exercises?.length || 0} ćwiczeń
      </span>
    </div>
    {Array.isArray(day.exercises) && day.exercises.length > 0 ? (
      <div className="space-y-3">
        {day.exercises.map((ex, i) => (
          <ExerciseCard key={i} exercise={ex} index={i} />
        ))}
      </div>
    ) : (
      <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
        <p className="text-gray-500">Brak ćwiczeń do wyświetlenia</p>
      </div>
    )}
  </div>
);

// ===== helpers =====
const extractAllExercises = (plan) => {
  if (!plan?.days) return [];
  const arr = [];
  plan.days.forEach(d => {
    (d.exercises || []).forEach(ex => {
      if (ex?.name) arr.push(ex);
    });
  });
  return arr;
};

const countBy = (items, getKey) => {
  const map = new Map();
  items.forEach(it => {
    const k = getKey(it);
    if (!k) return;
    map.set(k, (map.get(k) || 0) + 1);
  });
  return Array.from(map.entries()).sort((a,b)=>b[1]-a[1]);
};

const sumSets = (items) => items.reduce((acc, ex) => acc + (Number(ex.sets) || 0), 0);

export default function PlanSummary() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, getToken, debugAuth } = useAuth();

  const username =
    state?.username ||
    user?.username ||
    sessionStorage.getItem('lasko_username') ||
    null;

  // Jeżeli jesteśmy „authed”, ale user nie dohydratowany – spróbuj go pobrać
  useEffect(() => {
    const hasToken = typeof getToken === 'function' ? !!getToken() : false;
    const authed = typeof isAuthenticated === 'function' ? isAuthenticated() : hasToken;
    if (!user && authed) {
      try { debugAuth?.(); } catch {}
    }
  }, [user, isAuthenticated, getToken, debugAuth]);

  const [planData, setPlanData] = useState(state?.planData || null);
  const [activeTab, setActiveTab] = useState('overview'); // overview | details | schedule
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);
  const recApi = useMemo(() => new RecommendationService(), []);

  const normalizePlanDetails = (base, detailed) => {
    const plan = detailed?.plan || detailed || {};
    const daysRaw = plan.days ?? plan.workouts ?? plan.sessions ?? [];
    const days = Array.isArray(daysRaw) ? daysRaw.map((d, idx) => ({
      title: d.title || d.name || d.dayName || `Dzień ${idx + 1}`,
      exercises: Array.isArray(d.exercises) ? d.exercises
                : Array.isArray(d.items) ? d.items
                : Array.isArray(d.movements) ? d.movements
                : [],
    })) : [];

    return {
      ...base,
      name: base?.name ?? plan?.name,
      description: base?.description ?? plan?.description,
      days,
    };
  };

  // odczyt z sessionStorage, jeśli przyszliśmy „na pusto”
  useEffect(() => {
    if (!state?.planData) {
      const raw = sessionStorage.getItem('lasko_plan_draft');
      if (raw) {
        try {
          setPlanData(JSON.parse(raw));
        } catch {
          setPlanData(null);
        }
      }
    }
  }, [state]);

  // dociągnij szczegóły planu, jeśli mamy ID ale brak days
  useEffect(() => {
    const pid = planData?.recommendedPlan?.planId;
    const hasDays = Array.isArray(planData?.recommendedPlan?.days) && planData.recommendedPlan.days.length > 0;
    if (!pid || hasDays) return;
    let isCancelled = false;
    (async () => {
      try {
        setDetailsError(null);
        setDetailsLoading(true);
        const detailed = await recApi.getPlanDetailed(pid);
        if (isCancelled) return;
        const merged = {
          ...planData,
          recommendedPlan: normalizePlanDetails(planData.recommendedPlan, detailed),
        };
        setPlanData(merged);
        sessionStorage.setItem('lasko_plan_draft', JSON.stringify(merged));
      } catch (e) {
        if (!isCancelled) setDetailsError(e?.message || 'Nie udało się pobrać szczegółów planu.');
      } finally {
        if (!isCancelled) setDetailsLoading(false);
      }
    })();
    return () => { isCancelled = true; };
  }, [planData?.recommendedPlan?.planId]); // tylko po ID

  // bezpieczne odczyty
  const { recommendedPlan, name, goal, level, trainingDaysPerWeek, timePerSession, equipment, altPlans = [] } = {
    ...planData,
    equipment: planData?.equipment ?? planData?.equipment_preference,
  };

  // agregaty
  const allExercises = useMemo(() => extractAllExercises(recommendedPlan), [recommendedPlan]);
  const topExercises = useMemo(() => countBy(allExercises, ex => ex.name).slice(0, 8), [allExercises]);
  const totalSets = useMemo(() => sumSets(allExercises), [allExercises]);
  const totalExercises = allExercises.length;
  const totalDays = recommendedPlan?.days?.length || 0;

  // zamiana na plan alternatywny
  const useAlternativePlan = (idx) => {
    const alt = altPlans[idx];
    if (!alt) return;
    const updated = { ...planData, recommendedPlan: alt, name: alt.name || planData.name };
    setPlanData(updated);
    sessionStorage.setItem('lasko_plan_draft', JSON.stringify(updated));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!planData) {
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black">
        <GradientGridBg />
        <Navbar />
        <div className="grid min-h-screen place-items-center px-6 pt-20">
          <div className="w-full max-w-md">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                <svg width="32" height="32" fill="none" stroke="currentColor" className="text-red-400">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="mb-3 text-2xl font-bold text-white">Brak danych planu</h2>
              <p className="mb-8 text-gray-400">
                Nie znaleziono danych planu do wyświetlenia. Wróć do kreatora i spróbuj ponownie.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <PrimaryButton onClick={() => navigate('/enhanced-plan-creator')}>
                  Wróć do kreatora
                </PrimaryButton>
                <SecondaryButton to="/dashboard">
                  Dashboard
                </SecondaryButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mapowanie etykiet
  const goalLabels = {
    masa: 'Masa mięśniowa',
    sila: 'Siła',
    spalanie: 'Redukcja tkanki tłuszczowej',
    wytrzymalosc: 'Wytrzymałość',
    zdrowie: 'Zdrowie ogólne',
  };

  const equipmentLabels = {
    'siłownia': 'Pełna siłownia',
    dom_hantle: 'Dom (hantle + ławka)',
    dom_masa: 'Dom (masa własna)',
    minimalne: 'Minimalne wyposażenie',
  };

  const levelLabels = {
    'początkujący': 'Początkujący',
    'poczatkujacy': 'Początkujący',
    'średniozaawansowany': 'Średnio-zaawansowany',
    'sredniozaawansowany': 'Średnio-zaawansowany',
    'zaawansowany': 'Zaawansowany',
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black">
      <GradientGridBg />
      <GlowOrb className="left-[20%] top-40 h-64 w-64 bg-emerald-400/20" />
      <GlowOrb className="right-[10%] bottom-32 h-52 w-52 bg-teal-400/20" />

      <Navbar />

      <div className="mx-auto max-w-6xl px-6 pt-28 pb-16">
        {/* Header */}
        <header className="mb-10">
          <Kicker>Podsumowanie planu treningowego</Kicker>
          <h1 className="mt-4 text-4xl font-black text-white md:text-5xl">
            {name || 'Twój spersonalizowany plan'}
          </h1>
          <p className="mt-3 text-lg text-gray-300">
            Przygotowany specjalnie dla {username || 'Ciebie'}
          </p>
        </header>

        {/* Stats Grid */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Cel" value={goalLabels[goal] || goal} icon="🎯" />
          <StatCard label="Poziom" value={levelLabels[level] || level} icon="📊" />
          <StatCard label="Dni/tydzień" value={trainingDaysPerWeek} icon="📅" />
          <StatCard label="Czas/sesja" value={`${timePerSession} min`} icon="⏱️" />
          <StatCard label="Sprzęt" value={equipmentLabels[equipment] || equipment} icon="🏋️" />
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-2 border-b border-white/10">
          {[
            { id: 'overview', label: 'Przegląd', icon: '📋' },
            { id: 'details', label: 'Szczegóły', icon: '📝' },
            { id: 'schedule', label: 'Harmonogram', icon: '📅' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-colors',
                activeTab === tab.id
                  ? 'border-b-2 border-emerald-400 text-emerald-300'
                  : 'text-gray-400 hover:text-white',
              ].join(' ')}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          {activeTab === 'overview' && recommendedPlan && (
            <div className="space-y-8">
              {/* opis */}
              <div>
                <h2 className="mb-3 text-2xl font-bold text-white">
                  {recommendedPlan.name || 'Plan treningowy'}
                </h2>
                {recommendedPlan.description && (
                  <p className="text-gray-300 leading-relaxed">
                    {recommendedPlan.description}
                  </p>
                )}
              </div>

              {/* szybkie statystyki planu */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-emerald-400/10 border border-emerald-400/20 p-4">
                  <p className="text-sm text-emerald-300">Całkowita liczba dni</p>
                  <p className="mt-1 text-2xl font-bold text-white">{totalDays}</p>
                </div>
                <div className="rounded-xl bg-blue-400/10 border border-blue-400/20 p-4">
                  <p className="text-sm text-blue-300">Łączna liczba ćwiczeń</p>
                  <p className="mt-1 text-2xl font-bold text-white">{totalExercises}</p>
                </div>
                <div className="rounded-xl bg-purple-400/10 border border-purple-400/20 p-4">
                  <p className="text-sm text-purple-300">Średni czas treningu</p>
                  <p className="mt-1 text-2xl font-bold text-white">{timePerSession} min</p>
                </div>
              </div>

              {/* Co zawiera plan (najczęstsze ćwiczenia) */}
              {topExercises.length > 0 && (
                <div>
                  <h3 className="mb-3 text-lg font-bold text-white">Co zawiera plan (najczęściej):</h3>
                  <div className="flex flex-wrap gap-2">
                    {topExercises.map(([exName, count], i) => (
                      <span
                        key={i}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-gray-200"
                        title={`Wystąpienia: ${count}`}
                      >
                        {exName} <span className="text-gray-400">×{count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Objętość tygodnia */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
                  <p className="text-sm text-gray-400">Suma serii (tydzień)</p>
                  <p className="mt-1 text-2xl font-bold text-white">{totalSets}</p>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
                  <p className="text-sm text-gray-400">Śr. ćwiczeń / dzień</p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {totalDays ? Math.round((totalExercises / totalDays) * 10) / 10 : 0}
                  </p>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
                  <p className="text-sm text-gray-400">Śr. serii / dzień</p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {totalDays ? Math.round((totalSets / totalDays) * 10) / 10 : 0}
                  </p>
                </div>
              </div>

              {/* Alternatywy */}
              {Array.isArray(altPlans) && altPlans.length > 0 && (
                <div className="mt-2">
                  <h3 className="mb-3 text-lg font-bold text-white">Inne propozycje</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {altPlans.map((p, idx) => (
                      <div key={idx} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                        <div className="mb-2 flex items-center justify-between">
                          <h4 className="text-white font-semibold">{p.name || `Plan #${idx + 2}`}</h4>
                          <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-xs text-emerald-300">
                            {p.days?.length || 0} dni
                          </span>
                        </div>
                        {p.description && (
                          <p className="mb-4 line-clamp-3 text-sm text-gray-400">{p.description}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => useAlternativePlan(idx)}
                            className="group relative inline-flex items-center justify-center rounded-full px-5 py-2 text-xs font-bold text-white"
                          >
                            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] opacity-90 transition-opacity group-hover:opacity-100" />
                            <span className="relative">Użyj tego planu</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveTab('details');
                              setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
                            }}
                            className="rounded-full border-2 border-emerald-400/60 px-5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-400/10 transition-colors"
                          >
                            Zobacz szczegóły
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="rounded-2xl bg-gradient-to-r from-emerald-400/10 to-teal-400/10 border border-emerald-400/20 p-6">
                <h3 className="mb-2 text-lg font-bold text-white">Gotowy do działania?</h3>
                <p className="mb-4 text-gray-300">
                  Twój plan jest gotowy! Przejdź do dashboardu, aby rozpocząć treningi i śledzić postępy.
                </p>
                <PrimaryButton to="/dashboard">Rozpocznij treningi →</PrimaryButton>
              </div>
            </div>
          )}

          {activeTab === 'details' && recommendedPlan && (
            <div className="space-y-6">
              {detailsLoading && (
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6 text-center text-gray-300">
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent mr-2" />
                  Wczytuję szczegóły planu…
                </div>
              )}
              {detailsError && (
                <div className="rounded-xl border border-red-500/40 bg-red-900/20 p-4 text-red-200">
                  ⚠️ {detailsError}
                </div>
              )}
              {Array.isArray(recommendedPlan.days) && recommendedPlan.days.length > 0 ? (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white">Szczegółowy plan treningowy</h2>
                    <p className="mt-1 text-gray-400">
                      Pełny rozkład ćwiczeń na każdy dzień
                    </p>
                  </div>
                  <div className="grid gap-6">
                    {recommendedPlan.days.map((day, idx) => (
                      <DayCard key={idx} day={day} index={idx} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-800">
                    <svg width="32" height="32" fill="none" stroke="currentColor" className="text-gray-500">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-400">Brak szczegółowego planu do wyświetlenia</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-3 text-2xl font-bold text-white">Harmonogram tygodniowy</h2>
                <p className="text-gray-400">
                  Sugerowany rozkład treningów w tygodniu
                </p>
              </div>

              <div className="grid gap-3">
                {['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'].map((day, idx) => {
                  const isTrainingDay = idx < trainingDaysPerWeek;
                  return (
                    <div
                      key={day}
                      className={[
                        'flex items-center justify-between rounded-xl border p-4 transition-colors',
                        isTrainingDay
                          ? 'border-emerald-400/20 bg-emerald-400/5'
                          : 'border-white/10 bg-white/[0.02]'
                      ].join(' ')}
                    >
                      <span className="font-semibold text-white">{day}</span>
                      {isTrainingDay ? (
                        <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-medium text-emerald-300">
                          Trening {idx + 1}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Dzień wolny</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="rounded-2xl bg-blue-400/10 border border-blue-400/20 p-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <h4 className="font-semibold text-white">Wskazówka</h4>
                    <p className="mt-1 text-sm text-gray-300">
                      Pamiętaj o odpowiedniej regeneracji między treningami. Jeśli czujesz się zmęczony, 
                      możesz przesunąć trening na następny dzień.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <SecondaryButton onClick={() => navigate('/enhanced-plan-creator')}>
            ← Wróć do kreatora
          </SecondaryButton>
          <PrimaryButton to="/dashboard">
            Przejdź do Dashboard →
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
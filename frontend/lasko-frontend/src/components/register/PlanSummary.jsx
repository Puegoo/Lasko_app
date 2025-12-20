import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { RecommendationService } from '../../services/recommendationService';
import apiService from '../../services/api'; // katalog ćwiczeń + aktywacja
import IconKit from '../ui/IconKit';

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

const GhostButton = ({ onClick, to, children, className = '' }) => {
  const Comp = to ? Link : 'button';
  const props = to ? { to } : { onClick };
  return (
    <Comp
      {...props}
      className={[
        'inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-bold text-gray-300',
        'hover:text-white hover:bg-white/5 transition-colors',
        className,
      ].join(' ')}
    >
      {children}
    </Comp>
  );
};

// Navbar
const Navbar = ({ showActions = false }) => {
  const { user, isAuthenticated, getToken, logout, debugAuth } = useAuth();
  const navigate = useNavigate();
  const looksAuthed =
    (typeof isAuthenticated === 'function' && isAuthenticated()) ||
    (typeof getToken === 'function' && !!getToken());
  
  // Pobierz username z różnych źródeł
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
    if (!user && looksAuthed) {
      try { 
        debugAuth?.(); 
      } catch (error) {
        console.warn('[PlanSummary] Debug auth failed:', error);
      }
    }
  }, [user, looksAuthed, debugAuth]);

  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    if (typeof logout === 'function') {
      logout();
    }
    navigate('/login');
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-4">
        <Link to="/" className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 px-4">
          Lasko
        </Link>
        <div className="hidden items-center gap-3 md:flex">
          {looksAuthed ? (
            showActions ? (
            <>
                <span className="text-sm text-gray-300">
                Witaj, <span className="font-semibold text-white">{navbarName}</span>!
              </span>
                <SecondaryButton onClick={() => navigate('/dashboard')}>Dashboard</SecondaryButton>
                <GhostButton onClick={handleLogout}>Wyloguj</GhostButton>
              </>
            ) : (
              <span className="text-sm text-gray-300">
                Witaj, <span className="font-semibold text-white">{navbarName}</span>!
              </span>
            )
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
              showActions ? (
              <>
                  <div className="px-3 py-2 text-gray-300 border-b border-white/10 mb-2">
                    Witaj, <span className="font-semibold text-white">{navbarName}</span>!
                  </div>
                <Link to="/dashboard" className="rounded-lg px-3 py-2 text-gray-200 hover:bg-white/5">
                  Dashboard
                </Link>
                  <button onClick={handleLogout} className="rounded-lg px-3 py-2 text-left text-gray-200 hover:bg-white/5">
                  Wyloguj
                </button>
              </>
              ) : (
                <div className="px-3 py-2 text-gray-300">
                  Witaj, <span className="font-semibold text-white">{navbarName}</span>!
                </div>
              )
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
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
        <p className="mt-2 text-2xl font-bold text-white break-words line-clamp-2">{value}</p>
      </div>
      <span className="text-2xl opacity-70 flex-shrink-0">{icon}</span>
    </div>
    <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 ring-1 ring-emerald-400/30 transition-opacity group-hover:opacity-100" />
  </div>
);

const ExerciseCard = ({ exercise, index, editable = false, onSwap, onRemove, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (field, value) => {
    if (!onUpdate) return;
    onUpdate({ [field]: value });
  };

  const restValue = exercise.rest ?? exercise.rest_seconds ?? '';

  const handleRestIncrement = () => {
    if (!onUpdate) return;
    const current = parseInt(restValue) || 0;
    const next = current + 1;
    onUpdate({ rest: String(next) });
  };

  const handleRestDecrement = () => {
    if (!onUpdate) return;
    const current = parseInt(restValue) || 0;
    const next = Math.max(0, current - 1);
    onUpdate({ rest: String(next) });
  };

  return (
    <div className="group relative rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-all hover:border-emerald-400/40">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300 font-bold flex-shrink-0 mt-0.5">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white break-words">{exercise.name}</h4>
          {(exercise.sets || exercise.reps || restValue) && (
            <p className="mt-1 text-sm text-gray-400">
              {exercise.sets ? `${exercise.sets} serie` : ''}
              {exercise.sets && exercise.reps ? ' × ' : ''}
              {exercise.reps ? `${exercise.reps} powtórzeń` : ''}
              {(exercise.sets || exercise.reps) && restValue ? ' • ' : ''}
              {restValue ? `przerwy ${restValue}s` : ''}
            </p>
          )}
        </div>
        {editable && (
          <div className="flex items-center gap-2 ml-2">
            <button
              type="button"
              onClick={() => onSwap && onSwap(exercise)}
              className="inline-flex items-center justify-center rounded-full border-2 border-emerald-400/60 bg-emerald-500/10 px-4 py-1.5 text-xs sm:text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20 hover:text-white transition-colors"
            >
              Zamień ćwiczenie
            </button>
            <button
              type="button"
              onClick={() => onRemove && onRemove(exercise)}
              className="inline-flex items-center justify-center rounded-full border-2 border-red-400/70 bg-red-500/10 px-4 py-1.5 text-xs sm:text-sm font-semibold text-red-300 hover:bg-red-500/20 hover:text-white transition-colors"
            >
              Usuń
            </button>
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                aria-label={expanded ? 'Zwiń szczegóły ćwiczenia' : 'Rozwiń szczegóły ćwiczenia'}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
          </div>
        )}
      </div>

      {editable && expanded && (
        <div className="mt-4 border-t border-white/10 pt-4 space-y-4">
          {/* Edycja serii / powtórzeń / przerw */}
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">
                Serie
              </label>
              <input
                type="text"
                value={exercise.sets ?? ''}
                onChange={(e) => handleChange('sets', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/40 outline-none"
                placeholder="np. 3"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">
                Powtórzenia
              </label>
              <input
                type="text"
                value={exercise.reps ?? ''}
                onChange={(e) => handleChange('reps', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/40 outline-none"
                placeholder="np. 8–12"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">
                Przerwa (s)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={restValue}
                  onChange={(e) => handleChange('rest', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 pr-10 text-sm text-white placeholder:text-gray-500 focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/40 outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                  placeholder="np. 60"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-row gap-0.5">
                  <button
                    type="button"
                    onClick={handleRestIncrement}
                    className="w-6 h-5 flex items-center justify-center rounded bg-emerald-400/20 hover:bg-emerald-400/40 transition-colors group"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      className="text-emerald-400 group-hover:text-emerald-300"
                    >
                      <path
                        d="M6 3L6 9M3 6L9 6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={handleRestDecrement}
                    className="w-6 h-5 flex items-center justify-center rounded bg-emerald-400/20 hover:bg-emerald-400/40 transition-colors group"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      className="text-emerald-400 group-hover:text-emerald-300"
                    >
                      <path
                        d="M3 6L9 6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DayCard = ({ day, index, editable = false, onSwapExercise, onRemoveExercise, onUpdateExercise }) => (
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
      <div className="space-y-4">
        {day.exercises.map((ex, i) => (
          <ExerciseCard
            key={`${ex.id || ex.name}-${i}`}
            exercise={ex}
            index={i}
            editable={editable}
            onSwap={(exercise) => onSwapExercise && onSwapExercise(index, i, exercise)}
            onRemove={(exercise) => onRemoveExercise && onRemoveExercise(index, i, exercise)}
            onUpdate={(partial) => onUpdateExercise && onUpdateExercise(index, i, partial)}
          />
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
  const { success, error } = useNotification();

  // Pobierz username z różnych źródeł (fallback)
  const getUserFromStorage = () => {
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

  const username =
    state?.username ||
    user?.username ||
    user?.first_name ||
    sessionStorage.getItem('lasko_username') ||
    getUserFromStorage() ||
    null;
  
  // 🆕 Sprawdź czy plan jest kopiowany
  const fromCopy = state?.fromCopy === true;

  // jeżeli authed, ale user nie dohydratowany – dohydratacja
  useEffect(() => {
    const hasToken = typeof getToken === 'function' ? !!getToken() : false;
    const authed = typeof isAuthenticated === 'function' ? isAuthenticated() : hasToken;
    if (!user && authed) {
      try { 
        debugAuth?.(); 
      } catch (error) {
        console.warn('[PlanSummary] User rehydration failed:', error);
      }
    }
  }, [user, isAuthenticated, getToken, debugAuth]);

  const [planData, setPlanData] = useState(state?.planData || null);
  const [exerciseCatalog, setExerciseCatalog] = useState([]);
  const [_overrides, setOverrides] = useState({ replaced_exercises: [], removed_exercises: [] });
  const [swapModal, setSwapModal] = useState({ open: false, dayIdx: null, oldExercise: null, q: '' });
  const [activeTab, setActiveTab] = useState('overview'); // overview | details | schedule
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);
  const [fetchedPlanIds, setFetchedPlanIds] = useState(new Set());
  const [schedule, setSchedule] = useState([]);
  const [recoDetailsModal, setRecoDetailsModal] = useState({ open: false, plan: null }); // 🆕 Modal szczegółów rekomendacji
  const [editNameModal, setEditNameModal] = useState(false);
  const [customPlanName, setCustomPlanName] = useState('');
  const [savingAlias, setSavingAlias] = useState(false);
  const recApi = useMemo(() => new RecommendationService(), []);

  // Dni tygodnia
  const weekDays = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];

  // Bezpieczne dni treningowe zanim zdestrukturyzujemy planData niżej
  const tdPerWeek = (planData?.trainingDaysPerWeek
    ?? planData?.recommendedPlan?.trainingDaysPerWeek
    ?? 0);

  // Generuj harmonogram na podstawie liczby dni treningowych
  const generateSchedule = (trainingDays) => {
    const defaultSchedule = {
      1: ['Środa'],
      2: ['Poniedziałek', 'Czwartek'],
      3: ['Poniedziałek', 'Środa', 'Piątek'],
      4: ['Poniedziałek', 'Wtorek', 'Czwartek', 'Piątek'],
      5: ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek'],
      6: ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'],
      7: ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']
    };
    return defaultSchedule[trainingDays] || defaultSchedule[3];
  };

  // Inicjalizuj harmonogram gdy zmieni się plan
  // Pobierz zapisany harmonogram z bazy danych (user_active_plans)
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        // Pobierz harmonogram z backendu (zapisany w tabeli user_active_plans)
        const response = await apiService.request('/api/auth/schedule/get/');
        console.log('[PlanSummary] Loaded schedule from database:', response);
        
        if (response.success && response.schedule && response.schedule.length > 0) {
          setSchedule(response.schedule);
        } else if (tdPerWeek) {
          // Jeśli nie ma zapisanego harmonogramu, wygeneruj domyślny
          setSchedule(generateSchedule(tdPerWeek));
        }
      } catch (error) {
        console.error('[PlanSummary] Error fetching schedule:', error);
        // Jeśli błąd, wygeneruj domyślny harmonogram
        if (tdPerWeek) {
          setSchedule(generateSchedule(tdPerWeek));
        }
      }
    };

    if (tdPerWeek && !schedule.length) {
      fetchSchedule();
    }
  }, [tdPerWeek, schedule.length]);

  const normalizePlanDetails = (base, detailed) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 [PlanSummary] normalizePlanDetails START');
    console.log('   INPUT base:', JSON.stringify(base, null, 2));
    console.log('   INPUT detailed:', JSON.stringify(detailed, null, 2));
    
    const plan = detailed?.plan || detailed || {};
    console.log('   EXTRACTED plan:', JSON.stringify(plan, null, 2));
    console.log('   plan.days:', plan.days);
    console.log('   plan.workouts:', plan.workouts);
    console.log('   plan.sessions:', plan.sessions);
    
    const daysRaw = plan.days ?? plan.workouts ?? plan.sessions ?? [];
    console.log('   SELECTED daysRaw:', JSON.stringify(daysRaw, null, 2));
    console.log('   Type of daysRaw:', typeof daysRaw);
    console.log('   Is Array daysRaw:', Array.isArray(daysRaw));
    console.log('   Length of daysRaw:', Array.isArray(daysRaw) ? daysRaw.length : 'N/A');
    
    const days = Array.isArray(daysRaw) ? daysRaw.map((d, idx) => {
      console.log(`   Processing day ${idx}:`, d);
      const result = {
        title: d.title || d.name || d.dayName || `Dzień ${idx + 1}`,
        exercises: Array.isArray(d.exercises) ? d.exercises
                  : Array.isArray(d.items) ? d.items
                  : Array.isArray(d.movements) ? d.movements
                  : [],
      };
      console.log(`   Mapped day ${idx}:`, result);
      return result;
    }) : [];

    console.log('   FINAL normalized days:', JSON.stringify(days, null, 2));
    console.log('   Length of normalized days:', days.length);

    const result = {
      ...base,
      name: base?.name ?? plan?.name,
      description: base?.description ?? plan?.description,
      days,
    };
    
    console.log('   RETURN value:', JSON.stringify(result, null, 2));
    console.log('🔄 [PlanSummary] normalizePlanDetails END');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return result;
  };

  // odczyt z sessionStorage, jeśli przyszliśmy „na pusto” + pobranie katalogu ćwiczeń
  useEffect(() => {
    if (!state?.planData) {
      const raw = sessionStorage.getItem('lasko_plan_draft');
      if (raw) {
        try { setPlanData(JSON.parse(raw)); } catch { setPlanData(null); }
      }
    }
    (async () => {
      try {
        const res = await apiService.request('/api/exercises/?limit=500');
        if (res?.success && Array.isArray(res.exercises)) {
          setExerciseCatalog(res.exercises);
        } else if (Array.isArray(res)) {
          setExerciseCatalog(res);
        } else if (Array.isArray(res?.results)) {
          setExerciseCatalog(res.results);
        } else {
          setExerciseCatalog([]);
        }
      } catch {/* cicho */}
    })();
  }, [state]);

  // dociągnij szczegóły planu, jeśli mamy ID ale brak days
  useEffect(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚙️ [PlanSummary] useEffect TRIGGERED');
    console.log('   planData:', planData);
    console.log('   planData.recommendedPlan:', planData?.recommendedPlan);
    
    const pid = planData?.recommendedPlan?.planId || planData?.recommendedPlan?.id;
    const currentDays = planData?.recommendedPlan?.days;
    const hasDays = Array.isArray(currentDays) && currentDays.length > 0;
    const alreadyFetched = fetchedPlanIds.has(pid);
    
    console.log('   pid:', pid);
    console.log('   currentDays:', currentDays);
    console.log('   Type of currentDays:', typeof currentDays);
    console.log('   Is Array currentDays:', Array.isArray(currentDays));
    console.log('   currentDays.length:', currentDays?.length);
    console.log('   hasDays:', hasDays);
    console.log('   alreadyFetched:', alreadyFetched);
    console.log('   fetchedPlanIds Set:', Array.from(fetchedPlanIds));
    
    // Jeśli nie ma ID, już ma days, lub już próbowaliśmy pobrać ten plan - nie rób nic
    if (!pid) {
      console.log('❌ [PlanSummary] No plan ID - skipping');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return;
    }
    if (hasDays) {
      console.log('✅ [PlanSummary] Already has days - skipping');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return;
    }
    if (alreadyFetched) {
      console.log('⏭️ [PlanSummary] Already fetched this plan ID - skipping');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return;
    }
    
    console.log('🚀 [PlanSummary] Will fetch plan details!');
    
    let isCancelled = false;
    (async () => {
      try {
        setDetailsError(null);
        setDetailsLoading(true);
        console.log('📥 [PlanSummary] Fetching plan details for pid:', pid);
        
        // Oznacz że pobieramy ten plan
        setFetchedPlanIds(prev => {
          const newSet = new Set([...prev, pid]);
          console.log('   Updated fetchedPlanIds:', Array.from(newSet));
          return newSet;
        });
        
        const detailed = await recApi.getPlanDetailed(pid);
        console.log('📦 [PlanSummary] Fetched plan details:', detailed);
        
        if (isCancelled) {
          console.log('⚠️ [PlanSummary] Request cancelled');
          return;
        }
        
        console.log('🔄 [PlanSummary] Calling normalizePlanDetails...');
        const normalizedPlan = normalizePlanDetails(planData.recommendedPlan, detailed);
        console.log('✅ [PlanSummary] Normalized plan:', normalizedPlan);
        
        const merged = {
          ...planData,
          recommendedPlan: normalizedPlan,
        };
        console.log('📝 [PlanSummary] Merged plan data:', merged);
        console.log('   merged.recommendedPlan.days:', merged.recommendedPlan?.days);
        console.log('   merged.recommendedPlan.days length:', merged.recommendedPlan?.days?.length);
        
        setPlanData(merged);
        sessionStorage.setItem('lasko_plan_draft', JSON.stringify(merged));
        console.log('💾 [PlanSummary] Saved to state and sessionStorage');
      } catch (e) {
        console.error('❌ [PlanSummary] Error fetching plan details:', e);
        console.error('   Error stack:', e.stack);
        if (!isCancelled) setDetailsError(e?.message || 'Nie udało się pobrać szczegółów planu.');
      } finally {
        if (!isCancelled) setDetailsLoading(false);
        console.log('⚙️ [PlanSummary] useEffect COMPLETED');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
    })();
    return () => { 
      console.log('🧹 [PlanSummary] useEffect cleanup');
      isCancelled = true; 
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planData?.recommendedPlan?.planId, planData?.recommendedPlan?.id]); // tylko po ID, nie po całym planData!

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

  // akcje personalizacji
  const removeExercise = (dayIdx, exIdx, exercise) => {
    setOverrides(o => ({
      ...o,
      removed_exercises: [...o.removed_exercises, {
        dayIndex: dayIdx,
        exerciseId: exercise.id,
        exerciseName: exercise.name
      }]
    }));
    setPlanData(p => {
      const next = structuredClone(p);
      next.recommendedPlan.days[dayIdx].exercises.splice(exIdx, 1);
      sessionStorage.setItem('lasko_plan_draft', JSON.stringify(next));
      return next;
    });
  };

  const updateExerciseFields = (dayIdx, exIdx, partial) => {
    setPlanData((p) => {
      const next = structuredClone(p);
      const ex = next.recommendedPlan?.days?.[dayIdx]?.exercises?.[exIdx];
      if (ex) {
        Object.assign(ex, partial);
      }
      try {
        sessionStorage.setItem('lasko_plan_draft', JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const openSwap = (dayIdx, exercise) => setSwapModal({ open: true, dayIdx, oldExercise: exercise, q: '' });
  const closeSwap = () => setSwapModal({ open: false, dayIdx: null, oldExercise: null, q: '' });

  // 🆕 Zapisz alias (niestandardową nazwę planu)
  const handleSaveAlias = async () => {
    if (!customPlanName.trim()) {
      error('Podaj nazwę planu');
      return;
    }

    // 🆕 Dla skopiowanych planów (bez ID) - zapisz tylko lokalnie
    if (fromCopy || !recommendedPlan?.id) {
      success('Nazwa zapisana! Zostanie użyta po aktywacji planu.');
      setPlanData(prev => ({
        ...prev,
        name: customPlanName.trim(),
        recommendedPlan: {
          ...prev.recommendedPlan,
          name: customPlanName.trim()
        }
      }));
      sessionStorage.setItem('lasko_plan_draft', JSON.stringify({
        ...planData,
        name: customPlanName.trim(),
        recommendedPlan: {
          ...planData.recommendedPlan,
          name: customPlanName.trim()
        }
      }));
      setEditNameModal(false);
      return;
    }

    // Dla planów z ID - zapisz do API (endpoint z recommendations)
    const planId = recommendedPlan.planId || recommendedPlan.id;
    setSavingAlias(true);
    try {
      const response = await apiService.request(`/api/recommendations/plans/${planId}/alias/`, {
        method: 'POST',
        body: JSON.stringify({ custom_name: customPlanName.trim() })
      });

      if (response.success) {
        success('Nazwa planu została zapisana! 🎉');
        // Zaktualizuj lokalnie nazwę w planData
        setPlanData(prev => ({
          ...prev,
          name: customPlanName.trim(),
          recommendedPlan: {
            ...prev.recommendedPlan,
            customName: customPlanName.trim()
          }
        }));
        setEditNameModal(false);
      } else {
        throw new Error(response.error || 'Nie udało się zapisać nazwy');
      }
    } catch (err) {
      console.error('[PlanSummary] Error saving alias:', err);
      error(err.message || 'Nie udało się zapisać nazwy planu');
    } finally {
      setSavingAlias(false);
    }
  };

  const confirmSwap = (newExercise) => {
    const { dayIdx, oldExercise } = swapModal;
    setOverrides(o => ({
      ...o,
      replaced_exercises: [...o.replaced_exercises, {
        dayIndex: dayIdx,
        oldExerciseId: oldExercise?.id,
        oldExerciseName: oldExercise?.name,
        newExerciseId: newExercise?.id,
        newExerciseName: newExercise?.name
      }]
    }));
    setPlanData(p => {
      const next = structuredClone(p);
      const day = next.recommendedPlan?.days?.[dayIdx];
      if (day) {
        const idx = day.exercises.findIndex(e => (e.id && oldExercise?.id ? e.id === oldExercise.id : e.name === oldExercise?.name));
        if (idx >= 0) {
          const preserved = day.exercises[idx] || {};
          day.exercises[idx] = {
            ...newExercise,
            sets: newExercise.sets ?? preserved.sets,
            reps: newExercise.reps ?? preserved.reps,
            rest: newExercise.rest ?? preserved.rest,
          };
        }
      }
      sessionStorage.setItem('lasko_plan_draft', JSON.stringify(next));
      return next;
    });
    closeSwap();
  };

  if (!planData) {
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black">
        <GradientGridBg />
        <Navbar showActions={fromCopy} />
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

  // 🆕 Modal szczegółów rekomendacji
  const RecommendationDetailsModal = ({ open, plan, onClose }) => {
    if (!open || !plan) return null;
    
    // Określ typ algorytmu na podstawie dostępnych danych
    const algorithmType = plan.cbWeight !== undefined && plan.cfWeight !== undefined 
      ? 'hybrid' 
      : plan.scoreBreakdown 
        ? 'content_based' 
        : 'collaborative';
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
        <div className="relative max-w-2xl w-full bg-[#0b0b0b] rounded-3xl border border-white/10 p-6 max-h-[80vh] overflow-y-auto scrollbar-hide" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{plan.name}</h2>
              <p className="text-gray-400 text-sm">
                Szczegóły rekomendacji AI
                <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-400/20 text-blue-300 text-xs font-semibold">
                  {algorithmType === 'hybrid' ? 'Hybrydowy' : algorithmType === 'content_based' ? 'Content-Based' : 'Collaborative'}
                </span>
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          
          {/* Score */}
          <div className="mb-6 p-4 rounded-2xl bg-emerald-400/10 border border-emerald-400/20">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">Score dopasowania</span>
              <span className="text-3xl font-bold text-emerald-400">
                {plan.score ? `${Math.round(plan.score)}%` : 'N/A'}
              </span>
            </div>
            {algorithmType === 'collaborative' && (
              <p className="text-xs text-gray-400 mt-2">
                Score oparty na popularności wśród podobnych użytkowników
              </p>
            )}
          </div>
          
          {/* Match Reasons */}
          {plan.matchReasons && plan.matchReasons.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-3">Dlaczego ten plan?</h3>
              <div className="space-y-2">
                {plan.matchReasons.map((reason, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-300 p-3 rounded-xl bg-white/5">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-emerald-400 flex-shrink-0 mt-0.5">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* 🆕 Informacje o algorytmie Collaborative */}
          {algorithmType === 'collaborative' && (
            <div className="mb-6 p-4 rounded-2xl bg-purple-400/10 border border-purple-400/20">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-purple-400">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Rekomendacja oparta na społeczności
              </h3>
              <p className="text-sm text-gray-300 mb-3">
                Ten plan został wybrany na podstawie wyborów podobnych użytkowników. 
                Algorytm analizuje użytkowników o podobnych celach, poziomie i preferencjach sprzętowych.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Metoda:</span>
                  <span className="text-white font-semibold">Collaborative Filtering</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Bazuje na:</span>
                  <span className="text-white font-semibold">Popularności wśród podobnych użytkowników</span>
                </div>
              </div>
            </div>
          )}
          
          {/* 🆕 Informacje o algorytmie Content-Based */}
          {algorithmType === 'content_based' && (
            <div className="mb-6 p-4 rounded-2xl bg-blue-400/10 border border-blue-400/20">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-blue-400">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Rekomendacja oparta na preferencjach
              </h3>
              <p className="text-sm text-gray-300 mb-3">
                Ten plan został wybrany na podstawie Twoich preferencji i celów treningowych. 
                Algorytm analizuje charakterystykę planu i dopasowuje go do Twojego profilu.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Metoda:</span>
                  <span className="text-white font-semibold">Content-Based Filtering</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Bazuje na:</span>
                  <span className="text-white font-semibold">Dopasowaniu planu do Twoich preferencji</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Metadane algorytmu */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white mb-3">Parametry planu</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-gray-400 mb-1">Cel treningowy</p>
                <p className="text-white font-semibold">{plan.goalType || 'N/A'}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-gray-400 mb-1">Poziom</p>
                <p className="text-white font-semibold">{plan.difficultyLevel || 'N/A'}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-gray-400 mb-1">Dni treningowe</p>
                <p className="text-white font-semibold">{plan.trainingDaysPerWeek || plan.days?.length || 'N/A'} dni/tydzień</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-gray-400 mb-1">Sprzęt</p>
                <p className="text-white font-semibold">{plan.equipmentRequired || 'N/A'}</p>
              </div>
              {plan.intensityLevel && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs text-gray-400 mb-1">Intensywność</p>
                  <p className="text-white font-semibold">{plan.intensityLevel}</p>
                </div>
              )}
              {plan.planType && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs text-gray-400 mb-1">Typ planu</p>
                  <p className="text-white font-semibold">{plan.planType}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* 🆕 Szczegółowy breakdown punktów */}
          {plan.scoreBreakdown && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-yellow-400">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
                </svg>
                Szczegółowa punktacja
              </h3>
              
              {/* 🆕 Suma punktów (wycentrowana) */}
              <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-400/20 to-teal-400/20 border-2 border-emerald-400/40">
                <div className="text-center">
                  <p className="text-sm text-gray-300 mb-1">Punktacja Content-Based (część składowa)</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-4xl font-black text-white">
                      {(() => {
                        const total = 
                          (plan.scoreBreakdown.goal?.points || 0) +
                          (plan.scoreBreakdown.level?.points || 0) +
                          (plan.scoreBreakdown.days?.points || 0) +
                          (plan.scoreBreakdown.equipment?.points || 0) +
                          (plan.scoreBreakdown.popularity?.points || 0) +
                          (plan.scoreBreakdown.bmi?.points || 0) +
                          (plan.scoreBreakdown.health_safety?.points || 0);
                        return total.toFixed(1);
                      })()}
                    </span>
                    <span className="text-2xl text-gray-400">/</span>
                    <span className="text-2xl font-bold text-gray-400">64</span>
                    <span className="text-lg text-gray-500 ml-2">
                      ({((() => {
                        const total = 
                          (plan.scoreBreakdown.goal?.points || 0) +
                          (plan.scoreBreakdown.level?.points || 0) +
                          (plan.scoreBreakdown.days?.points || 0) +
                          (plan.scoreBreakdown.equipment?.points || 0) +
                          (plan.scoreBreakdown.popularity?.points || 0) +
                          (plan.scoreBreakdown.bmi?.points || 0) +
                          (plan.scoreBreakdown.health_safety?.points || 0);
                        return ((total / 64) * 100).toFixed(1);
                      })())}%)
                    </span>
                  </div>
                  {plan.cbWeight && plan.cfWeight ? (
                    <>
                      <p className="text-xs text-gray-300 mt-2 font-semibold">
                        ⚠️ To NIE jest finalny wynik!
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Finalny score: <span className="text-emerald-300 font-bold">{plan.score}%</span> = {Math.round(plan.cbWeight * 100)}% × {((() => {
                          const total = 
                            (plan.scoreBreakdown.goal?.points || 0) +
                            (plan.scoreBreakdown.level?.points || 0) +
                            (plan.scoreBreakdown.days?.points || 0) +
                            (plan.scoreBreakdown.equipment?.points || 0) +
                            (plan.scoreBreakdown.popularity?.points || 0) +
                            (plan.scoreBreakdown.bmi?.points || 0) +
                            (plan.scoreBreakdown.health_safety?.points || 0);
                          return ((total / 64) * 100).toFixed(1);
                        })())}% (CB) + {Math.round(plan.cfWeight * 100)}% × {plan.cfScore !== undefined && plan.cfScore !== null ? `${Number(plan.cfScore).toFixed(1)}%` : 'N/A'} (CF)
                      </p>
                      {plan.wasBoosted ? (
                        <p className="text-xs text-yellow-400 mt-1 italic">
                          ⚡ Wynik został podniesiony do minimum (80% CB), bo Collaborative Filtering miał zbyt niski score
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1 italic">
                          Collaborative Filtering ma niski score, dlatego finalny wynik jest niższy niż CB
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">
                      maksymalnie możliwych punktów (z BMI + zdrowie)
                    </p>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                {/* Goal */}
                {plan.scoreBreakdown.goal && (
                  <div className="p-3 rounded-xl bg-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">Cel treningowy</span>
                      <span className={`font-bold ${plan.scoreBreakdown.goal.matched ? 'text-emerald-400' : 'text-gray-400'}`}>
                        {plan.scoreBreakdown.goal.points > 0 ? '+' : ''}{plan.scoreBreakdown.goal.points} / {plan.scoreBreakdown.goal.max} pkt
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="bg-emerald-400 h-2 rounded-full transition-all" style={{ width: `${(plan.scoreBreakdown.goal.points / plan.scoreBreakdown.goal.max) * 100}%` }}/>
                    </div>
                  </div>
                )}
                
                {/* Level */}
                {plan.scoreBreakdown.level && (
                  <div className="p-3 rounded-xl bg-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">Poziom zaawansowania</span>
                      <span className={`font-bold ${plan.scoreBreakdown.level.matched ? 'text-emerald-400' : 'text-gray-400'}`}>
                        {plan.scoreBreakdown.level.points > 0 ? '+' : ''}{plan.scoreBreakdown.level.points} / {plan.scoreBreakdown.level.max} pkt
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="bg-blue-400 h-2 rounded-full transition-all" style={{ width: `${(plan.scoreBreakdown.level.points / plan.scoreBreakdown.level.max) * 100}%` }}/>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Dokładne: +10 pkt, Średnio: +5 pkt</p>
                  </div>
                )}
                
                {/* Days */}
                {plan.scoreBreakdown.days && (
                  <div className="p-3 rounded-xl bg-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">Liczba dni treningowych</span>
                      <span className={`font-bold ${plan.scoreBreakdown.days.matched ? 'text-emerald-400' : 'text-gray-400'}`}>
                        {plan.scoreBreakdown.days.points > 0 ? '+' : ''}{plan.scoreBreakdown.days.points} / {plan.scoreBreakdown.days.max} pkt
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="bg-purple-400 h-2 rounded-full transition-all" style={{ width: `${(plan.scoreBreakdown.days.points / plan.scoreBreakdown.days.max) * 100}%` }}/>
                    </div>
                    {plan.scoreBreakdown.days.difference !== undefined && (
                      <p className="text-xs text-gray-400 mt-1">
                        Różnica: {plan.scoreBreakdown.days.difference} dni ({plan.scoreBreakdown.days.user_value} → {plan.scoreBreakdown.days.plan_value})
                        • 0 dni: +12, 1 dzień: +8, 2 dni: +4
                      </p>
                    )}
                  </div>
                )}
                
                {/* Equipment */}
                {plan.scoreBreakdown.equipment && (
                  <div className="p-3 rounded-xl bg-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">Sprzęt</span>
                      <span className={`font-bold ${plan.scoreBreakdown.equipment.points > 0 ? 'text-emerald-400' : plan.scoreBreakdown.equipment.points < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                        {plan.scoreBreakdown.equipment.points > 0 ? '+' : ''}{plan.scoreBreakdown.equipment.points} / {plan.scoreBreakdown.equipment.max} pkt
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all ${plan.scoreBreakdown.equipment.points > 0 ? 'bg-emerald-400' : 'bg-red-400'}`} style={{ width: `${Math.abs(plan.scoreBreakdown.equipment.points / plan.scoreBreakdown.equipment.max) * 100}%` }}/>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Dopasowanie: +8 pkt, Brak: -2 pkt</p>
                  </div>
                )}
                
                {/* Popularity */}
                {plan.scoreBreakdown.popularity && (
                  <div className="p-3 rounded-xl bg-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">Popularność</span>
                      <span className="font-bold text-yellow-400">
                        +{plan.scoreBreakdown.popularity.points} / {plan.scoreBreakdown.popularity.max} pkt
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="bg-yellow-400 h-2 rounded-full transition-all" style={{ width: `${(plan.scoreBreakdown.popularity.points / plan.scoreBreakdown.popularity.max) * 100}%` }}/>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {plan.scoreBreakdown.popularity.total_users} użytkowników
                      {plan.scoreBreakdown.popularity.avg_rating && ` • Ocena: ${plan.scoreBreakdown.popularity.avg_rating.toFixed(1)}/5`}
                    </p>
                  </div>
                )}
                
                {/* 🆕 BMI */}
                {plan.scoreBreakdown.bmi && (
                  <div className="p-3 rounded-xl bg-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">BMI</span>
                      <span className={`font-bold ${plan.scoreBreakdown.bmi.matched ? 'text-orange-400' : 'text-gray-400'}`}>
                        +{plan.scoreBreakdown.bmi.points} / {plan.scoreBreakdown.bmi.max} pkt
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="bg-orange-400 h-2 rounded-full transition-all" style={{ width: `${(plan.scoreBreakdown.bmi.points / plan.scoreBreakdown.bmi.max) * 100}%` }}/>
                    </div>
                    {plan.scoreBreakdown.bmi.user_bmi && (
                      <p className="text-xs text-gray-400 mt-1">
                        Twoje BMI: {plan.scoreBreakdown.bmi.user_bmi.toFixed(1)} • Plan dostosowany do Twojego BMI
                      </p>
                    )}
                  </div>
                )}
                
                {/* 🆕 Health Safety */}
                {plan.scoreBreakdown.health_safety && (
                  <div className="p-3 rounded-xl bg-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">Bezpieczeństwo zdrowotne</span>
                      <span className={`font-bold ${plan.scoreBreakdown.health_safety.matched ? 'text-teal-400' : 'text-gray-400'}`}>
                        +{plan.scoreBreakdown.health_safety.points} / {plan.scoreBreakdown.health_safety.max} pkt
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="bg-teal-400 h-2 rounded-full transition-all" style={{ width: `${(plan.scoreBreakdown.health_safety.points / plan.scoreBreakdown.health_safety.max) * 100}%` }}/>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {plan.scoreBreakdown.health_safety.has_warnings 
                        ? 'Plan zawiera ostrzeżenia zdrowotne (sprawdź poniżej)' 
                        : 'Brak przeciwwskazań dla Twojego profilu zdrowotnego'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Wagi algorytmu (jeśli dostępne) */}
          {(plan.cbWeight || plan.cfWeight) && (
            <div className="mb-6 p-4 rounded-2xl bg-blue-400/10 border border-blue-400/20">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-blue-400">
                  <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18 17l-5-5-4 4-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Wagi algorytmu (Adaptive Hybrid)
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Content-Based (Twoje preferencje)</span>
                  <span className="text-white font-bold">{Math.round((plan.cbWeight || 0) * 100)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className="bg-blue-400 h-2 rounded-full transition-all" style={{ width: `${(plan.cbWeight || 0) * 100}%` }}/>
                </div>
                
                <div className="flex items-center justify-between text-sm mt-3">
                  <span className="text-gray-300">Collaborative (Społeczność)</span>
                  <span className="text-white font-bold">{Math.round((plan.cfWeight || 0) * 100)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className="bg-purple-400 h-2 rounded-full transition-all" style={{ width: `${(plan.cfWeight || 0) * 100}%` }}/>
                </div>
              </div>
            </div>
          )}
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
          >
            Zamknij
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black">
      <GradientGridBg />
      
      {/* 🆕 Modal szczegółów rekomendacji */}
      <RecommendationDetailsModal 
        open={recoDetailsModal.open} 
        plan={recoDetailsModal.plan} 
        onClose={() => setRecoDetailsModal({ open: false, plan: null })} 
      />
      <GlowOrb className="left-[20%] top-40 h-64 w-64 bg-emerald-400/20" />
      <GlowOrb className="right-[10%] bottom-32 h-52 w-52 bg-teal-400/20" />

      <Navbar showActions={fromCopy} />

      <div className="mx-auto max-w-6xl px-6 pt-28 pb-16">
        {/* Header */}
        <header className="mb-10">
          <Kicker>Podsumowanie planu treningowego</Kicker>
          <div className="flex items-center gap-4 mt-4">
            <h1 className="text-4xl font-black text-white md:text-5xl">
              {recommendedPlan?.originalName || recommendedPlan?.name || 'Twój spersonalizowany plan'}
          </h1>
          </div>
          <p className="mt-3 text-lg text-gray-300">
            {fromCopy ? (
              <>Dostosuj plan do swoich potrzeb i aktywuj</>
            ) : (
              <>Przygotowany specjalnie dla {username || 'Ciebie'}</>
            )}
          </p>
        </header>

        {/* Stats Grid */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard 
            label="Cel" 
            value={goalLabels[goal] || goal} 
            icon={
              <svg width="32" height="32" viewBox="0 0 16 16" fill="none" className="text-emerald-400">
                <path d="M7.657 6.247c.11-.33.576-.33.686 0l.645 1.937a2.89 2.89 0 0 0 1.829 1.828l1.936.645c.33.11.33.576 0 .686l-1.937.645a2.89 2.89 0 0 0-1.828 1.829l-.645 1.936a.361.361 0 0 1-.686 0l-.645-1.937a2.89 2.89 0 0 0-1.828-1.828l-1.937-.645a.361.361 0 0 1 0-.686l1.937-.645a2.89 2.89 0 0 0 1.828-1.828l.645-1.937zM3.794 1.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387A1.734 1.734 0 0 0 4.593 5.69l-.387 1.162a.217.217 0 0 1-.412 0L3.407 5.69A1.734 1.734 0 0 0 2.31 4.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387A1.734 1.734 0 0 0 3.407 2.31l.387-1.162zM10.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.156 1.156 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.156 1.156 0 0 0-.732-.732L9.1 2.137a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732L10.863.1z" fill="currentColor"/>
              </svg>
            } 
          />
          <StatCard 
            label="Poziom" 
            value={levelLabels[level] || level} 
            icon={
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-blue-400">
                <line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="12" y1="20" x2="12" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="6" y1="20" x2="6" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            } 
          />
          <StatCard 
            label="Dni/tydzień" 
            value={trainingDaysPerWeek} 
            icon={
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-yellow-400">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            } 
          />
          <StatCard 
            label="Czas/sesja" 
            value={`${timePerSession} min`} 
            icon={
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-purple-400">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            } 
          />
          <StatCard 
            label="Sprzęt" 
            value={equipmentLabels[equipment] || equipment} 
            icon={<IconKit.Dumbbell size="2xl" className="text-orange-400" />}
          />
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-2 border-b border-white/10">
          {[
            { 
              id: 'overview', 
              label: 'Przegląd', 
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M18 17l-5-5-4 4-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            },
            { 
              id: 'details', 
              label: 'Szczegóły', 
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            },
            { 
              id: 'schedule', 
              label: 'Harmonogram', 
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            },
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
          {/* Komunikat gdy brak planu */}
          {!recommendedPlan && (
            <div className="text-center py-16">
              <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-red-900/20 border border-red-500/30">
                <svg width="48" height="48" fill="none" stroke="currentColor" className="text-red-400">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="mb-3 text-2xl font-bold text-white">Brak zarekomendowanego planu</h2>
              <p className="mb-6 text-gray-300 max-w-md mx-auto">
                Nie udało się wygenerować planu treningowego. Dane z ankiety mogły nie zostać poprawnie zapisane.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <SecondaryButton onClick={() => navigate('/enhanced-plan-creator')}>
                  ← Wróć do kreatora
                </SecondaryButton>
                <PrimaryButton onClick={() => navigate('/dashboard')}>
                  Przejdź do dashboardu
                </PrimaryButton>
              </div>
              <div className="mt-8 rounded-xl bg-blue-400/10 border border-blue-400/20 p-4 text-left max-w-xl mx-auto">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Wskazówka</h4>
                    <p className="text-sm text-gray-300">
                      Sprawdź konsolę przeglądarki (F12) aby zobaczyć szczegółowe informacje o błędzie.
                      Prawdopodobne przyczyny:
                    </p>
                    <ul className="mt-2 text-sm text-gray-300 list-disc list-inside space-y-1">
                      <li>Błąd połączenia z backendem</li>
                      <li>Brak planów treningowych w bazie danych</li>
                      <li>Nieprawidłowe dane profilu</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'overview' && recommendedPlan && (
            <div className="space-y-8">
              {/* Tytuł planu */}
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-2xl font-bold text-white">
                  {recommendedPlan?.name || recommendedPlan?.originalName || name || 'Plan treningowy'}
                </h2>
                {/* Przycisk zmiany nazwy planu */}
                <button
                  onClick={() => {
                    setCustomPlanName(name || recommendedPlan?.name || '');
                    setEditNameModal(true);
                  }}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Zmień nazwę planu"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-current">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              {/* 🆕 Health Warnings */}
              {recommendedPlan.healthWarnings && recommendedPlan.healthWarnings.length > 0 && (
                <div className="rounded-xl bg-yellow-400/10 border border-yellow-400/30 p-5">
                  <div className="flex items-start gap-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-yellow-400 flex-shrink-0 mt-0.5">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-300 mb-2">
                        ⚕️ Uwaga zdrowotna - rozważ konsultację z lekarzem
                      </h4>
                      <ul className="text-sm text-yellow-200 space-y-1.5">
                        {recommendedPlan.healthWarnings.map((warning, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-yellow-400 mt-0.5">•</span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-yellow-300/70 mt-3 italic">
                        Te informacje mają charakter pomocniczy i nie zastępują porady medycznej.
                      </p>
              </div>
                  </div>
                </div>
              )}

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

              {/* Score planu */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Dopasowanie planu</h3>
                  {/* 🆕 Przycisk szczegółów rekomendacji (ukryty dla skopiowanych planów) */}
                  {!fromCopy && (
                    <button
                      onClick={() => setRecoDetailsModal({ open: true, plan: recommendedPlan })}
                      className="w-8 h-8 rounded-full bg-blue-400/20 hover:bg-blue-400/30 transition-colors flex items-center justify-center"
                      title="Szczegóły rekomendacji"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-blue-400">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  )}
                </div>
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-emerald-400">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor"/>
                        </svg>
                        <span className="font-semibold text-white">Score dopasowania</span>
                      </div>
                      <p className="text-sm text-gray-300">
                        {recommendedPlan?.cbWeight && recommendedPlan?.cfWeight ? (
                          <>Finalny wynik kombinacji algorytmów: {Math.round(recommendedPlan.cbWeight * 100)}% preferencje + {Math.round(recommendedPlan.cfWeight * 100)}% społeczność</>
                        ) : (
                          <>Ten plan został wybrany na podstawie Twoich preferencji i celów treningowych</>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-emerald-400">
                        {recommendedPlan?.score 
                          ? `${Math.round(recommendedPlan.score)}%` 
                          : '85%'}
                      </div>
                      <div className="text-xs text-gray-400">dopasowanie</div>
                    </div>
                  </div>
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
                      <div key={idx} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 relative">
                        {/* 🆕 Przycisk info (szczegóły rekomendacji) - ukryty dla skopiowanych planów */}
                        {!fromCopy && (
                          <button
                            onClick={() => setRecoDetailsModal({ open: true, plan: p })}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-blue-400/20 hover:bg-blue-400/30 transition-colors flex items-center justify-center group"
                            title="Szczegóły rekomendacji"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-blue-400">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                              <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </button>
                        )}
                        
                        <div className={`mb-2 flex items-center justify-between ${!fromCopy ? 'pr-10' : ''}`}>
                          <h4 className="text-white font-semibold">{p.name || `Plan #${idx + 2}`}</h4>
                          <div className="flex flex-col items-end gap-1">
                            {/* 🆕 Score */}
                            {p.score && (
                              <span className="text-emerald-400 font-bold text-sm">
                                {Math.round(p.score)}% dopasowanie
                              </span>
                            )}
                          <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-xs text-emerald-300">
                            {p.days?.length || 0} dni
                          </span>
                          </div>
                        </div>
                        {p.description && (
                          <p className="mb-4 line-clamp-3 text-sm text-gray-400">{p.description}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const alt = altPlans[idx];
                              if (alt) {
                                // 🆕 Przenieś aktualny recommendedPlan do altPlans
                                const currentPlan = recommendedPlan;
                                const newAltPlans = altPlans.filter((_, i) => i !== idx); // Usuń wybrany plan
                                if (currentPlan) {
                                  newAltPlans.push(currentPlan); // Dodaj aktualny plan do alternatyw
                                }
                                
                                const updated = { 
                                  ...planData, 
                                  recommendedPlan: alt, 
                                  name: alt.name || planData.name,
                                  altPlans: newAltPlans // 🆕 Zaktualizuj altPlans
                                };
                                setPlanData(updated);
                                sessionStorage.setItem('lasko_plan_draft', JSON.stringify(updated));
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }
                            }}
                            className="group relative inline-flex items-center justify-center rounded-full px-5 py-2 text-xs font-bold text-white flex-1"
                          >
                            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] opacity-90 transition-opacity group-hover:opacity-100" />
                            <span className="relative">Użyj tego planu</span>
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
                  Twój plan jest gotowy! Możesz go jeszcze doszlifować w zakładce „Szczegóły”, a potem aktywować.
                </p>
                <PrimaryButton onClick={() => setActiveTab('details')}>Przejdź do szczegółów →</PrimaryButton>
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
                      Pełny rozkład ćwiczeń na każdy dzień. Możesz usuwać lub zamieniać ćwiczenia według własnych preferencji.
                    </p>
                  </div>
                  <div className="grid gap-6">
                    {recommendedPlan.days.map((day, idx) => (
                      <DayCard
                        key={idx}
                        day={day}
                        index={idx}
                        editable
                        onSwapExercise={(dayIdx, _exIdx, exercise) => openSwap(dayIdx, exercise)}
                        onRemoveExercise={(dayIdx, exIdx, exercise) => removeExercise(dayIdx, exIdx, exercise)}
                        onUpdateExercise={(dayIdx, exIdx, partial) => updateExerciseFields(dayIdx, exIdx, partial)}
                      />
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
                  Wybierz dni treningowe w tygodniu. Możesz zmienić sugerowany harmonogram.
                </p>
              </div>

              <div className="grid gap-3">
                {weekDays.map((day) => {
                  const isTrainingDay = schedule.includes(day);
                  return (
                    <div
                      key={day}
                      className={[
                        'flex items-center justify-between rounded-xl border p-4 transition-colors cursor-pointer',
                        isTrainingDay
                          ? 'border-emerald-400/20 bg-emerald-400/5'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                      ].join(' ')}
                      onClick={() => {
                        if (isTrainingDay) {
                          // Usuń dzień z harmonogramu
                          setSchedule(prev => prev.filter(d => d !== day));
                        } else {
                          // Dodaj dzień do harmonogramu (maksymalnie trainingDaysPerWeek dni)
                          if (schedule.length < tdPerWeek) {
                            setSchedule(prev => [...prev, day]);
                          }
                        }
                      }}
                    >
                      <span className="font-semibold text-white">{day}</span>
                      {isTrainingDay ? (
                        <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-medium text-emerald-300">
                          Trening {schedule.indexOf(day) + 1}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">
                          {schedule.length >= tdPerWeek ? 'Maksymalnie ' + tdPerWeek + ' dni' : 'Kliknij aby dodać'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="rounded-2xl bg-yellow-400/10 border border-yellow-400/20 p-6">
                <div className="flex items-start gap-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-yellow-400 flex-shrink-0 mt-0.5">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
                  </svg>
                  <div>
                    <h4 className="font-semibold text-white">Wskazówka</h4>
                    <p className="mt-1 text-sm text-gray-300">
                      Wybierz dni, które najlepiej pasują do Twojego harmonogramu. 
                      Pamiętaj o odpowiedniej regeneracji między treningami.
                    </p>
                  </div>
                </div>
              </div>

              {/* Powiadomienia */}
              <div className="rounded-2xl bg-purple-400/10 border border-purple-400/20 p-6">
                <div className="flex items-start gap-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-purple-400 flex-shrink-0 mt-0.5">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="currentColor"/>
                  </svg>
                  <div>
                    <h4 className="font-semibold text-white">Powiadomienia</h4>
                    <p className="mt-1 text-sm text-gray-300">
                      Otrzymasz przypomnienia o treningach w wybrane dni. 
                      Możesz włączyć/wyłączyć powiadomienia w ustawieniach.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="notifications" 
                        defaultChecked
                        className="rounded border-white/20 bg-white/10 text-purple-400 focus:ring-purple-400/50"
                      />
                      <label htmlFor="notifications" className="text-sm text-gray-300">
                        Włącz powiadomienia o treningach
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Przycisk zapisz harmonogram */}
              <div className="rounded-xl bg-blue-400/10 border border-blue-400/20 p-4 mb-4">
                <div className="flex items-start gap-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-blue-400 flex-shrink-0 mt-0.5">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
                  </svg>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Informacja</h4>
                    <p className="text-sm text-gray-300">
                      Harmonogram zostanie automatycznie zapisany przy aktywacji planu. 
                      Kliknij przycisk <span className="font-bold text-emerald-300">"Aktywuj z moimi zmianami"</span> poniżej.
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
          <PrimaryButton
            onClick={async () => {
              try {
                const recommended = planData?.recommendedPlan;

                if (!recommended) {
                  error('Brak danych planu do zapisania.');
                  return;
                }

                // Zbuduj strukturę dni i ćwiczeń na podstawie ZMIENIONEGO planu
                const days = (recommended.days || [])
                  .map((day, dayIdx) => {
                    const exercises = (day.exercises || [])
                      .map((ex, exIdx) => {
                        const exerciseId =
                          ex.exercise_id || // z planu bazowego
                          ex.base_exercise_id || // inne możliwe pola
                          ex.id; // z katalogu ćwiczeń (zamiana)

                        if (!exerciseId) return null;

                        const sets =
                          ex.sets ??
                          ex.target_sets ??
                          ex.targetSets ??
                          ex.series ??
                          '3';

                        const reps =
                          ex.reps ??
                          ex.target_reps ??
                          ex.targetReps ??
                          ex.repetitions ??
                          '10-12';

                        const restSeconds =
                          ex.rest_seconds ??
                          ex.rest ??
                          ex.restSeconds ??
                          60;

                        const order =
                          ex.exercise_order ??
                          ex.order ??
                          exIdx + 1;

                        return {
                          exercise_id: exerciseId,
                          target_sets: String(sets),
                          target_reps: String(reps),
                          rest_seconds: Number(restSeconds) || 60,
                          exercise_order: order,
                        };
                      })
                      .filter(Boolean);

                    return {
                      name: day.title || day.name || day.dayName || `Dzień ${dayIdx + 1}`,
                      day_order: day.day_order || day.dayNumber || dayIdx + 1,
                      exercises,
                    };
                  })
                  .filter((d) => d.exercises && d.exercises.length > 0);

                // Jeśli z jakiegoś powodu nie mamy dni/ćwiczeń – fallback do starej logiki aktywacji
                if (!days.length) {
                  const fallbackPlanId = recommended.planId || recommended.id;
                  if (!fallbackPlanId) {
                    error('Brak ID planu do aktywacji.');
                    return;
                  }

                  console.warn('[PlanSummary] Brak szczegółowych dni – używam fallbacku aktywacji planu:', fallbackPlanId);

                  await apiService.request(`/api/recommendations/plans/${fallbackPlanId}/activate/`, {
                    method: 'POST',
                  });

                  const notificationsEnabled = document.getElementById('notifications')?.checked || false;
                  await apiService.request('/api/auth/schedule/save/', {
                    method: 'POST',
                    body: JSON.stringify({
                      schedule,
                      notifications_enabled: notificationsEnabled,
                    }),
                  });

                  success('Plan został aktywowany!');
                  navigate('/dashboard');
                  return;
                }

                // Zbuduj payload dla custom-plans – plan zapisze się jako NASZ
                const payload = {
                  name:
                    planData?.name ||
                    recommended.name ||
                    recommended.originalName ||
                    'Mój plan treningowy',
                  description:
                    recommended.description ||
                    planData?.description ||
                    `Plan treningowy: ${planData?.name || recommended.name || 'Plan'}`,
                  goal_type:
                    recommended.goalType ||
                    planData?.goal ||
                    planData?.recommendedPlan?.goalType,
                  difficulty_level:
                    recommended.difficultyLevel ||
                    planData?.level ||
                    planData?.recommendedPlan?.difficultyLevel,
                  training_days_per_week:
                    recommended.trainingDaysPerWeek ||
                    planData?.trainingDaysPerWeek ||
                    days.length,
                  equipment_required:
                    recommended.equipmentRequired ||
                    planData?.equipment ||
                    planData?.equipment_preference ||
                    'silownia',
                  days,
                };

                console.log('[PlanSummary] Tworzę custom plan z payload:', payload);

                // KROK 1: Utwórz custom plan na backendzie (user_custom_plans) – plan od razu staje się aktywny
                const customResult = await recApi.createCustomPlanFromExercises(payload);
                console.log('[PlanSummary] Custom plan utworzony:', customResult);

                // KROK 2: Zapisz harmonogram (aktualizuje user_active_plans.training_schedule dla AKTYWNEGO planu)
                try {
                  const notificationsEnabled = document.getElementById('notifications')?.checked || false;
                  console.log('[PlanSummary] Zapisuję harmonogram dla custom planu:', schedule);
                  await apiService.request('/api/auth/schedule/save/', {
                    method: 'POST',
                    body: JSON.stringify({
                      schedule,
                      notifications_enabled: notificationsEnabled,
                    }),
                  });
                } catch (scheduleErr) {
                  console.warn('[PlanSummary] Nie udało się zapisać harmonogramu:', scheduleErr);
                  // nie blokujemy aktywacji planu
                }

                success('Twój plan został zapisany jako własny i aktywowany!');

                // KROK 3: Przekieruj do Dashboard (aktywny plan zostanie wczytany z /active-plan/)
                navigate('/dashboard', {
                  state: {
                    planCreated: true,
                    message: 'Twój plan został zapisany jako własny i aktywowany!',
                  },
                });
              } catch (err) {
                console.error('[PlanSummary] Failed to activate custom plan:', err);
                error('Nie udało się zapisać planu: ' + (err.message || 'Nieznany błąd'));
              }
            }}
          >
            Aktywuj z moimi zmianami →
          </PrimaryButton>
        </div>
      </div>

      {/* Modal zamiany ćwiczenia */}
      {swapModal.open && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-white">
                Zamień: <span className="text-emerald-300">{swapModal.oldExercise?.name}</span>
              </h4>
              <button onClick={closeSwap} className="text-sm text-gray-400 hover:text-white">Zamknij</button>
            </div>

            <div className="mb-3 grid gap-2 sm:grid-cols-2">
              <input
                placeholder="Szukaj ćwiczenia…"
                className="w-full rounded-xl bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-gray-500"
                value={swapModal.q}
                onChange={(e) => setSwapModal(s => ({ ...s, q: e.target.value }))}
              />
              <div className="text-xs text-gray-400 self-center">
                Podpowiedź: zacznij od tej samej partii mięśni co oryginał ({swapModal.oldExercise?.muscle_group || '—'})
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {(exerciseCatalog || [])
                .filter(x => x?.name)
                .filter(x => {
                  const q = (swapModal.q || '').toLowerCase().trim();
                  if (!q) return true;
                  return x.name?.toLowerCase().includes(q) || x.muscle_group?.toLowerCase().includes(q);
                })
                .sort((a) => (a.muscle_group === swapModal.oldExercise?.muscle_group ? -1 : 1))
                .slice(0, 120)
                .map((x) => (
                  <button
                    key={x.id || x.name}
                    onClick={() => confirmSwap(x)}
                    className="w-full text-left rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 hover:bg-white/[0.06]"
                  >
                    <div className="font-medium text-white">{x.name}</div>
                    <div className="text-xs text-gray-400">
                      {x.muscle_group || '—'} • {x.type || '—'}
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 🆕 Modal edycji nazwy planu */}
      {editNameModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setEditNameModal(false)}
        >
          <div 
            className="relative max-w-md w-full bg-[#0b0b0b] rounded-3xl border border-white/10 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {fromCopy ? 'Nadaj nazwę planowi' : 'Zmień nazwę planu'}
                </h3>
                {!fromCopy && (
                  <p className="text-sm text-gray-400 mt-1">
                    Oryginalna nazwa: <span className="text-gray-300">{recommendedPlan?.originalName || recommendedPlan?.name || name}</span>
                  </p>
                )}
              </div>
              <button
                onClick={() => setEditNameModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Input */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nowa nazwa planu
                </label>
                <input
                  type="text"
                  value={customPlanName}
                  onChange={(e) => setCustomPlanName(e.target.value)}
                  placeholder="np. Mój letni plan FBW"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                  maxLength={200}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !savingAlias) {
                      handleSaveAlias();
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {customPlanName.length}/200 znaków
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setEditNameModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-colors"
                  disabled={savingAlias}
                >
                  Anuluj
                </button>
                <button
                  onClick={handleSaveAlias}
                  disabled={savingAlias || !customPlanName.trim()}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {savingAlias ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Zapisywanie...
                    </>
                  ) : fromCopy ? (
                    'Zapisz'
                  ) : (
                    'Zapisz nazwę'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}







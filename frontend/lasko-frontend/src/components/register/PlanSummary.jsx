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

// Navbar
const Navbar = () => {
  const { user, logout, isAuthenticated, getToken, debugAuth } = useAuth();
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

const ExerciseCard = ({ exercise, index, onRemove, onSwap }) => (
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
      <div className="flex gap-2">
        <button
          onClick={onSwap}
          className="text-xs rounded-full px-3 py-1 bg-white/[0.04] border border-white/10 hover:bg-white/[0.08]"
        >
          Zamień
        </button>
        <button
          onClick={onRemove}
          className="text-xs rounded-full px-3 py-1 border border-red-500/40 text-red-300 hover:bg-red-900/20"
        >
          Usuń
        </button>
      </div>
    </div>
  </div>
);

const DayCard = ({ day, index, onRemoveExercise, onSwapExercise }) => (
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
          <ExerciseCard
            key={`${ex.id || ex.name}-${i}`}
            exercise={ex}
            index={i}
            onRemove={() => onRemoveExercise(index, i, ex)}
            onSwap={() => onSwapExercise(index, ex)}
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
        const res = await apiService.get?.('/api/exercises');
        setExerciseCatalog(res?.results || res || []);
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
  
  console.log('[PlanSummary] planData.name:', planData?.name);
  console.log('[PlanSummary] extracted name:', name);
  console.log('[PlanSummary] recommendedPlan.name:', recommendedPlan?.name);

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

  const openSwap = (dayIdx, exercise) => setSwapModal({ open: true, dayIdx, oldExercise: exercise, q: '' });
  const closeSwap = () => setSwapModal({ open: false, dayIdx: null, oldExercise: null, q: '' });

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
          <StatCard label="Cel" value={goalLabels[goal] || goal} icon={<IconKit.Target size="lg" />} />
          <StatCard label="Poziom" value={levelLabels[level] || level} icon={<IconKit.ChartBar size="lg" />} />
          <StatCard label="Dni/tydzień" value={trainingDaysPerWeek} icon={<IconKit.Calendar size="lg" />} />
          <StatCard label="Czas/sesja" value={`${timePerSession} min`} icon={<IconKit.Clock size="lg" />} />
          <StatCard label="Sprzęt" value={equipmentLabels[equipment] || equipment} icon={<IconKit.Dumbbell size="lg" />} />
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-2 border-b border-white/10">
          {[
            { id: 'overview', label: 'Przegląd', icon: <IconKit.Document size="sm" /> },
            { id: 'details', label: 'Szczegóły', icon: <IconKit.Notebook size="sm" /> },
            { id: 'schedule', label: 'Harmonogram', icon: <IconKit.Calendar size="sm" /> },
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
              {/* opis */}
              <div>
                <h2 className="mb-3 text-2xl font-bold text-white">
                  {name || recommendedPlan.name || 'Plan treningowy'}
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

              {/* Score planu */}
              <div>
                <h3 className="mb-4 text-lg font-bold text-white">Dopasowanie planu</h3>
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-emerald-400">⭐</span>
                        <span className="font-semibold text-white">Score dopasowania</span>
                      </div>
                      <p className="text-sm text-gray-300">
                        Ten plan został wybrany na podstawie Twoich preferencji i celów treningowych
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-emerald-400">
                        {recommendedPlan?.score 
                          ? `${Math.min(Math.round(recommendedPlan.score * 100), 100)}%` 
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
                            onClick={() => {
                              const alt = altPlans[idx];
                              if (alt) {
                                const updated = { ...planData, recommendedPlan: alt, name: alt.name || planData.name };
                                setPlanData(updated);
                                sessionStorage.setItem('lasko_plan_draft', JSON.stringify(updated));
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }
                            }}
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
                      Pełny rozkład ćwiczeń na każdy dzień. Możesz usuwać i zamieniać ćwiczenia.
                    </p>
                  </div>
                  <div className="grid gap-6">
                    {recommendedPlan.days.map((day, idx) => (
                      <DayCard
                        key={idx}
                        day={day}
                        index={idx}
                        onRemoveExercise={removeExercise}
                        onSwapExercise={openSwap}
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

              <div className="rounded-2xl bg-blue-400/10 border border-blue-400/20 p-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
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
                  <span className="text-2xl">🔔</span>
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
              <div className="rounded-xl bg-yellow-400/10 border border-yellow-400/20 p-4 mb-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">ℹ️</span>
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
                const planId = planData?.recommendedPlan?.planId || planData?.recommendedPlan?.id;
                if (!planId) {
                  error('Brak ID planu do aktywacji.');
                  return;
                }
                
                console.log('[PlanSummary] Aktywuję plan:', planId);
                
                // KROK 1: Aktywuj plan (tworzy rekord w user_active_plans)
                await apiService.request(`/api/recommendations/plans/${planId}/activate/`, {
                  method: 'POST'
                });
                
                console.log('[PlanSummary] Plan aktywowany, zapisuję harmonogram:', schedule);
                
                // KROK 2: Zapisz harmonogram (aktualizuje user_active_plans.training_schedule)
                const notificationsEnabled = document.getElementById('notifications')?.checked || false;
                await apiService.request('/api/auth/schedule/save/', {
                  method: 'POST',
                  body: JSON.stringify({
                    schedule,
                    notifications_enabled: notificationsEnabled
                  })
                });
                
                console.log('[PlanSummary] Harmonogram zapisany, przekierowuję do Dashboard');
                
                success('Plan został aktywowany!');
                
                // KROK 3: Przekieruj do Dashboard
                navigate('/dashboard', {
                  state: {
                    activePlan: {
                      planId: planId,
                      id: planId,
                      name: planData?.name || planData?.recommendedPlan?.name,
                      trainingDaysPerWeek,
                      sessionDuration: timePerSession,
                      description: planData?.recommendedPlan?.description,
                    }
                  }
                });
              } catch (err) {
                console.error('[PlanSummary] Failed to activate plan:', err);
                error('Nie udało się aktywować planu: ' + (err.message || 'Nieznany błąd'));
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
    </div>
  );
}







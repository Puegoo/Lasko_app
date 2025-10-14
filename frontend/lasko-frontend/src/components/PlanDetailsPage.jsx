import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RecommendationService } from '../services/recommendationService';

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

const PrimaryButton = ({ onClick, to, children, className = '' }) => {
  const Comp = to ? Link : 'button';
  const props = to ? { to } : { onClick };

  return (
    <Comp
      {...props}
      className={[
        'group relative inline-flex items-center justify-center rounded-full font-bold text-white transition-transform',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 active:scale-[0.98]',
        'px-7 py-3 text-sm',
        className,
      ].join(' ')}
    >
      <span className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" />
      <span className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 blur transition-opacity group-hover:opacity-80" />
      <span className="relative flex items-center gap-2">{children}</span>
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
        'group relative inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 font-semibold text-white backdrop-blur-sm transition-all hover:border-emerald-400/50 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 active:scale-[0.98]',
        'px-7 py-3 text-sm',
        className,
      ].join(' ')}
    >
      {children}
    </Comp>
  );
};

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-400/20 border-t-emerald-400" />
  </div>
);

// ---------- Navbar ----------
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
          Lasko
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          <span className="hidden text-sm text-gray-300 lg:inline">
            Witaj, <span className="font-semibold text-white">{user?.username}</span>!
          </span>
          <SecondaryButton to="/dashboard">Dashboard</SecondaryButton>
          <button onClick={handleLogout} className="text-sm text-gray-300 hover:text-white transition-colors">
            Wyloguj
          </button>
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
            <Link to="/dashboard" className="rounded-lg px-3 py-2 text-gray-200 hover:bg-white/5">
              Dashboard
            </Link>
            <button onClick={handleLogout} className="rounded-lg px-3 py-2 text-left text-gray-200 hover:bg-white/5">
              Wyloguj
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

// ---------- Main Component ----------
export default function PlanDetailsPage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activating, setActivating] = useState(false);
  const recApi = useMemo(() => new RecommendationService(), []);

  useEffect(() => {
    const fetchPlanDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('[PlanDetailsPage] START - Fetching plan:', planId);
        const data = await recApi.getPlanDetailed(planId);
        
        console.log('[PlanDetailsPage] Raw API Response:', JSON.stringify(data, null, 2));
        console.log('[PlanDetailsPage] data.plan exists?', !!data.plan);
        console.log('[PlanDetailsPage] data.plan:', data.plan);
        
        // Sprawdź czy dane są w data.plan czy bezpośrednio w data
        const planData = data.plan || data;
        
        console.log('[PlanDetailsPage] Using planData:', planData);
        console.log('[PlanDetailsPage] planData.id:', planData.id || planData.plan_id);
        console.log('[PlanDetailsPage] planData.name:', planData.name);
        console.log('[PlanDetailsPage] planData.days:', planData.days);
        console.log('[PlanDetailsPage] planData.days is Array?', Array.isArray(planData.days));
        
        // Normalizuj dane planu
        const normalizedPlan = {
          id: planData.plan_id || planData.id,
          name: planData.name,
          description: planData.description,
          goalType: planData.goal_type || planData.goalType,
          difficultyLevel: planData.difficulty_level || planData.difficultyLevel,
          trainingDaysPerWeek: planData.training_days_per_week || planData.trainingDaysPerWeek,
          equipmentRequired: planData.equipment_required || planData.equipmentRequired,
          days: planData.days || planData.workouts || [],
        };
        
        console.log('[PlanDetailsPage] Normalized plan:', normalizedPlan);
        console.log('[PlanDetailsPage] normalizedPlan.days length:', normalizedPlan.days?.length);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        setPlan(normalizedPlan);
      } catch (err) {
        console.error('[PlanDetailsPage] Error fetching plan:', err);
        setError(err.message || 'Nie udało się pobrać szczegółów planu');
      } finally {
        setLoading(false);
      }
    };

    if (planId) {
      fetchPlanDetails();
    }
  }, [planId, recApi]);

  const handleActivatePlan = async () => {
    if (!plan) return;
    
    try {
      setActivating(true);
      console.log('[PlanDetailsPage] Activating plan:', plan.id);
      await recApi.activatePlan(plan.id);
      alert('Plan został aktywowany! 🎉');
      navigate('/dashboard');
    } catch (err) {
      console.error('[PlanDetailsPage] Error activating plan:', err);
      alert('Nie udało się aktywować planu: ' + (err.message || 'Nieznany błąd'));
    } finally {
      setActivating(false);
    }
  };

  // Mapowania etykiet
  const goalLabels = {
    masa: 'Masa mięśniowa',
    sila: 'Siła',
    spalanie: 'Redukcja tkanki tłuszczowej',
    wytrzymalosc: 'Wytrzymałość',
    zdrowie: 'Zdrowie ogólne',
  };

  const equipmentLabels = {
    'siłownia': 'Pełna siłownia',
    silownia: 'Pełna siłownia',
    dom_podstawowy: 'Dom (podstawowy sprzęt)',
    dom_hantle: 'Dom (hantle + ławka)',
    dom_masa: 'Dom (masa własna)',
    minimalne: 'Minimalne wyposażenie',
  };

  const levelLabels = {
    poczatkujacy: 'Początkujący',
    'początkujący': 'Początkujący',
    sredniozaawansowany: 'Średniozaawansowany',
    'średniozaawansowany': 'Średniozaawansowany',
    zaawansowany: 'Zaawansowany',
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black">
        <GradientGridBg />
        <Navbar />
        <div className="mx-auto max-w-7xl px-6 pt-24">
          <LoadingSpinner />
          <p className="text-center text-gray-400 mt-4">Ładowanie szczegółów planu...</p>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black">
        <GradientGridBg />
        <Navbar />
        <div className="mx-auto max-w-4xl px-6 pt-24">
          <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <svg width="32" height="32" fill="none" stroke="currentColor" className="text-red-400">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="mb-3 text-2xl font-bold text-white">Nie można załadować planu</h2>
            <p className="mb-8 text-gray-400">{error || 'Plan nie istnieje lub wystąpił błąd.'}</p>
            <div className="flex gap-3 justify-center">
              <PrimaryButton to="/dashboard">Powrót do Dashboard</PrimaryButton>
              <SecondaryButton to="/enhanced-plan-creator">Stwórz nowy plan</SecondaryButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black">
      <GradientGridBg />
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-400 transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6L6 10l4 4" />
            </svg>
            Wróć
          </button>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">{plan.name}</h1>
          {plan.description && (
            <p className="text-lg text-gray-400 max-w-3xl">{plan.description}</p>
          )}
        </div>

        {/* Metadata Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🎯</div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Cel</p>
                <p className="text-white font-semibold">{goalLabels[plan.goalType] || plan.goalType}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center gap-3">
              <div className="text-3xl">📊</div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Poziom</p>
                <p className="text-white font-semibold">{levelLabels[plan.difficultyLevel] || plan.difficultyLevel}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center gap-3">
              <div className="text-3xl">📅</div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Dni treningowe</p>
                <p className="text-white font-semibold">{plan.trainingDaysPerWeek} dni/tydzień</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🏋️</div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Wyposażenie</p>
                <p className="text-white font-semibold">{equipmentLabels[plan.equipmentRequired] || plan.equipmentRequired}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-12">
          <PrimaryButton onClick={handleActivatePlan} className={activating ? 'opacity-50 cursor-not-allowed' : ''}>
            {activating ? 'Aktywowanie...' : '✨ Aktywuj plan'}
          </PrimaryButton>
          <SecondaryButton to="/dashboard">
            Powrót do Dashboard
          </SecondaryButton>
        </div>

        {/* Training Days */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-6">Szczegółowy plan treningowy</h2>
          
          {Array.isArray(plan.days) && plan.days.length > 0 ? (
            <div className="grid gap-6">
              {plan.days.map((day, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 hover:border-emerald-400/40 transition-all"
                >
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-400 text-sm font-bold">
                      {idx + 1}
                    </span>
                    {day.title || day.name || day.dayName || `Dzień ${idx + 1}`}
                  </h3>
                  
                  {Array.isArray(day.exercises) && day.exercises.length > 0 ? (
                    <div className="space-y-3">
                      {day.exercises.map((ex, exIdx) => (
                        <div
                          key={exIdx}
                          className="flex items-start gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400 text-sm font-mono flex-shrink-0">
                            {exIdx + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white mb-1">
                              {ex.name || ex.exercise_name || 'Ćwiczenie'}
                            </h4>
                            <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                              {ex.sets && <span>Serie: <span className="text-emerald-400 font-semibold">{ex.sets}</span></span>}
                              {ex.reps && <span>Powtórzenia: <span className="text-emerald-400 font-semibold">{ex.reps}</span></span>}
                              {ex.rest_seconds && <span>Odpoczynek: <span className="text-emerald-400 font-semibold">{ex.rest_seconds}s</span></span>}
                              {ex.duration_seconds && <span>Czas: <span className="text-emerald-400 font-semibold">{ex.duration_seconds}s</span></span>}
                            </div>
                            {ex.notes && (
                              <p className="mt-2 text-sm text-gray-500 italic">{ex.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">Brak ćwiczeń dla tego dnia</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-800">
                <svg width="32" height="32" fill="none" stroke="currentColor" className="text-gray-500">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-400">Brak szczegółowego planu treningowego dla tego planu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


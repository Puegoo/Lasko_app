import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import apiService from '../services/api';
import IconKit from './ui/IconKit';

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

const PrimaryButton = ({ onClick, to, children, className = '', size = 'normal' }) => {
  const Comp = to ? Link : 'button';
  const props = to ? { to } : { onClick };

  const sizeClasses = {
    normal: 'px-7 py-3 text-sm',
    large: 'px-8 py-4 text-base',
    small: 'px-5 py-2 text-xs'
  };

  return (
    <Comp
      {...props}
      className={[
        'group relative inline-flex items-center justify-center rounded-full font-bold text-white transition-transform',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 active:scale-[0.98]',
        sizeClasses[size],
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

const GhostButton = ({ onClick, children, className = '' }) => (
  <button
    onClick={onClick}
    className={[
      'inline-flex items-center justify-center rounded-full border-2 border-white/10 px-6 py-2.5 text-sm font-medium text-gray-300',
      'hover:bg-white/5 hover:border-white/20 hover:text-white transition-colors',
      className,
    ].join(' ')}
  >
    {children}
  </button>
);

// Navbar
const Navbar = ({ username }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-4">
        <Link to="/" className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
          Lasko
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          <span className="hidden text-sm text-gray-300 lg:inline">
            Witaj, <span className="font-semibold text-white">{username}</span>!
          </span>
          <SecondaryButton to="/enhanced-plan-creator">
            Nowy plan
          </SecondaryButton>
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
            <Link to="/enhanced-plan-creator" className="rounded-lg px-3 py-2 text-gray-200 hover:bg-white/5">
              Nowy plan
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

// Komponenty kart
const StatCard = ({ label, value, sublabel, icon, trend, onClick }) => {
  const Wrapper = onClick ? 'button' : 'div';
  const clickProps = onClick ? { onClick, className: 'w-full text-left' } : {};
  
  return (
    <Wrapper {...clickProps}>
      <div className={`group relative rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-all ${onClick ? 'hover:border-emerald-400/60 hover:bg-white/[0.08] cursor-pointer active:scale-[0.98]' : 'hover:border-emerald-400/40'}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
        <p className="mt-2 text-3xl font-bold text-white">{value}</p>
        {sublabel && <p className="mt-1 text-xs text-gray-500">{sublabel}</p>}
        {trend && (
          <div className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${
            trend > 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <span className="text-2xl opacity-70">{icon}</span>
    </div>
    <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 ring-1 ring-emerald-400/30 transition-opacity group-hover:opacity-100" />
  </div>
    </Wrapper>
);
};

const ActionCard = ({ icon, title, description, onClick }) => (
  <button
    onClick={onClick}
    className="group relative rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-left transition-all hover:border-emerald-400/40"
  >
    <div className="mb-3 text-3xl">{icon}</div>
    <h4 className="mb-1 font-bold text-white group-hover:text-emerald-300 transition-colors">
      {title}
    </h4>
    <p className="text-sm text-gray-400">{description}</p>
    <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 ring-1 ring-emerald-400/30 transition-opacity group-hover:opacity-100" />
  </button>
);

const PlanCard = ({ plan, isActive = false, onActivate, activePlanId = null }) => {
  const navigate = useNavigate();
  const notify = useNotification();
  
  const findPlanId = (p) => {
    if (!p) return null;
    // Explicit common fields first
    const explicit = p.planId || p.id || p.plan_id || p.plan?.id || p.plan?.planId;
    if (explicit) return explicit;

    // Scan top-level keys ending with 'id'
    const topLevel = Object.entries(p)
      .filter(([k, v]) => /id$/i.test(k) && (typeof v === 'number' || (typeof v === 'string' && /^\d+$/.test(v))))
      .map(([, v]) => v);
    if (topLevel.length > 0) return topLevel[0];

    // Scan nested 'plan' object if exists
    if (p.plan && typeof p.plan === 'object') {
      const nested = Object.entries(p.plan)
        .filter(([k, v]) => /id$/i.test(k) && (typeof v === 'number' || (typeof v === 'string' && /^\d+$/.test(v))))
        .map(([, v]) => v);
      if (nested.length > 0) return nested[0];
    }
    return null;
  };
  
  // Sprawdź czy ten plan jest już aktywny
  const planId = findPlanId(plan);
  const isPlanActive = activePlanId && planId && (
    activePlanId === planId || 
    String(activePlanId) === String(planId)
  );
  
  const handleViewDetails = () => {
    // Przekieruj do dedykowanej strony szczegółów planu
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[PlanCard] handleViewDetails - CALLED');
    console.log('[PlanCard] Full plan object:', JSON.stringify(plan, null, 2));
    console.log('[PlanCard] plan.planId:', plan?.planId);
    console.log('[PlanCard] plan.id:', plan?.id);
    console.log('[PlanCard] plan.plan_id:', plan?.plan_id);
    console.log('[PlanCard] Object.keys(plan):', Object.keys(plan || {}));
    
    const planId = findPlanId(plan);
    console.log('[PlanCard] findPlanId returned:', planId);
    console.log('[PlanCard] Type of planId:', typeof planId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!planId) {
      console.error('[PlanCard] ERROR: No valid planId found!', { plan });
      notify.error('Nie można otworzyć szczegółów planu (brak ID w danych planu).');
      return;
    }
    
    navigate(`/plan-details/${planId}`);
  };
  
  return (
    <div className={[
      'relative rounded-2xl border p-6 transition-all',
      isActive 
        ? 'border-emerald-400/60 bg-gradient-to-br from-emerald-400/10 to-teal-400/10' 
        : 'border-white/10 bg-white/[0.04] hover:border-emerald-400/40'
    ].join(' ')}>
      {isActive && (
        <div className="absolute -top-3 left-6">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400 px-3 py-1 text-xs font-bold text-black">
            <span className="h-1.5 w-1.5 rounded-full bg-black animate-pulse" />
            AKTYWNY
          </span>
        </div>
      )}
      
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">{plan.name}</h3>
          {plan.description && (
            <p className="mt-1 text-sm text-gray-400 line-clamp-2">{plan.description}</p>
          )}
        </div>
        {plan.matchPercentage && (
          <div className="text-right">
            <div className="text-2xl font-bold text-emerald-300">{plan.matchPercentage}%</div>
            <div className="text-xs text-gray-400">dopasowania</div>
          </div>
        )}
      </div>

      <div className="mb-4 grid grid-cols-4 gap-3">
        <div className="rounded-xl bg-white/[0.04] p-3 text-center">
          <div className="text-lg font-bold text-white">
            {plan.trainingDaysPerWeek || plan.trainingDays || 3}
          </div>
          <div className="text-xs text-gray-500">dni/tydz.</div>
        </div>
        <div className="rounded-xl bg-white/[0.04] p-3 text-center">
          <div className="text-lg font-bold text-white">
            {plan.sessionDuration || 60}
          </div>
          <div className="text-xs text-gray-500">min/sesja</div>
        </div>
        <div className="rounded-xl bg-white/[0.04] p-3 text-center">
          <div className="text-lg font-bold text-white">
            {plan.durationWeeks || plan.planDuration || 12}
          </div>
          <div className="text-xs text-gray-500">tygodni</div>
        </div>
        <div className="rounded-xl bg-white/[0.04] p-3 text-center">
          <div className="text-lg font-bold text-white">
            {plan.completedWorkouts || 0}
          </div>
          <div className="text-xs text-gray-500">treningów</div>
        </div>
      </div>

      {plan.matchReasons && plan.matchReasons.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {plan.matchReasons.map((reason, index) => (
            <span 
              key={index}
              className="rounded-full bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 text-xs font-medium text-emerald-300"
            >
              {reason}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        {isActive ? (
          <>
            <PrimaryButton onClick={() => navigate('/workout/today')} className="flex-1">
              Rozpocznij trening
            </PrimaryButton>
            <GhostButton onClick={handleViewDetails}>
              Zobacz szczegóły
            </GhostButton>
        </>
      ) : isPlanActive ? (
        <>
          <div className="flex-1 px-6 py-3 rounded-full bg-emerald-500/20 border-2 border-emerald-400/60 text-center">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-300">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              Plan aktywny
            </span>
          </div>
          <GhostButton onClick={handleViewDetails}>
            Zobacz szczegóły
          </GhostButton>
        </>
      ) : (
        <>
          <SecondaryButton 
            onClick={() => onActivate ? onActivate(plan) : notify.warning('Funkcja aktywacji nie jest dostępna')} 
            className="flex-1"
          >
            Aktywuj plan
          </SecondaryButton>
          <GhostButton onClick={handleViewDetails}>
            Zobacz szczegóły
          </GhostButton>
        </>
      )}
    </div>
  </div>
  );
};

// Główny komponent Dashboard
const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const notify = useNotification();
  
  // Pobierz nazwę użytkownika z różnych źródeł (fallback)
  const username = user?.username || 
                   sessionStorage.getItem('lasko_username') || 
                   localStorage.getItem('user_data') && JSON.parse(localStorage.getItem('user_data'))?.username ||
                   'Sportowcu';

  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [error, setError] = useState(null);
  const [showCongrats, setShowCongrats] = useState(false);

  // plany przekazane przez nawigację (po aktywacji) - tymczasowe
  const tempActivePlan = location.state?.activePlan;
  const displayPlan = activePlan || tempActivePlan;

  useEffect(() => {
    // Sprawdź czy użytkownik dopiero aktywował plan
    const justActivated = localStorage.getItem('plan_just_activated');
    if (justActivated === 'true') {
      setShowCongrats(true);
      // Usuń flagę po 3 sekundach (użytkownik zobaczył gratulacje)
      setTimeout(() => {
        localStorage.removeItem('plan_just_activated');
        setShowCongrats(false);
      }, 3000);
    }

    if (isAuthenticated()) {
      fetchUserData();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Pobierz profil użytkownika
      const profileData = await apiService.fetchUserProfile?.();
      if (profileData?.profile) {
        setUserProfile(profileData.profile);
      }
      
      // Pobierz ulubione ćwiczenia (dla kafelka "Ulubione ćwiczenie")
      try {
        const favoritesData = await apiService.request('/api/exercises/favorites/');
        if (favoritesData?.success && favoritesData.favorites?.length > 0) {
          // Ustaw pierwsze ulubione jako favorite_exercise
          setUserProfile(prev => ({
            ...prev,
            favorite_exercise: favoritesData.favorites[0].name,
            favorite_count: favoritesData.count
          }));
        } else {
          // Brak ulubionych
          setUserProfile(prev => ({
            ...prev,
            favorite_exercise: null,
            favorite_count: 0
          }));
        }
      } catch (err) {
        console.error('[DashboardPage] Error fetching favorites:', err);
      }
      
      // Pobierz aktywny plan użytkownika
      const activePlanData = await apiService.request('/api/recommendations/active-plan/');
      console.log('[DashboardPage] Active plan data:', activePlanData);
      console.log('[DashboardPage] has_active_plan:', activePlanData?.has_active_plan);
      console.log('[DashboardPage] plan:', activePlanData?.plan);
      if (activePlanData?.has_active_plan && activePlanData?.plan) {
        console.log('[DashboardPage] Setting active plan:', activePlanData.plan);
        console.log('[DashboardPage] Active plan ID:', activePlanData.plan.planId || activePlanData.plan.id);
        setActivePlan(activePlanData.plan);
      } else {
        console.log('[DashboardPage] No active plan found');
      }
      
      // Pobierz rekomendacje
      const recoData = await apiService.generateRecommendations?.('hybrid', {});
      console.log('[DashboardPage] recoData from API:', recoData);
      console.log('[DashboardPage] recommendations:', recoData?.recommendations);
      if (recoData?.recommendations && recoData.recommendations.length > 0) {
        console.log('[DashboardPage] First recommendation:', recoData.recommendations[0]);
        console.log('[DashboardPage] First recommendation keys:', Object.keys(recoData.recommendations[0] || {}));
      }
      setRecommendations(recoData?.recommendations || []);
    } catch (err) {
      console.error('Błąd ładowania danych:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewPlan = () => navigate('/enhanced-plan-creator');
  const handleEditProfile = () => navigate('/settings');
  
  const handleActivatePlan = async (plan) => {
    try {
      const planId = plan?.planId || plan?.id;      
      if (!planId) {
        notify.error('Brak ID planu do aktywacji');
        return;
      }
      // Wywołaj endpoint aktywacji
      const response = await apiService.request(`/api/recommendations/plans/${planId}/activate/`, {
        method: 'POST'
      });
      
      if (response.success) {
        // Ustaw flagę że plan został dopiero aktywowany
        localStorage.setItem('plan_just_activated', 'true');
        setShowCongrats(true);
        notify.success('Plan został aktywowany! 🎉');
        // Odśwież dane Dashboard
        await fetchUserData();
      }
    } catch (error) {
      console.error('Błąd aktywacji planu:', error);
      notify.error('Nie udało się aktywować planu: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Ładowanie dashboard...</p>
        </div>
      </div>
    );
  }

  // Statystyki
  const stats = {
    totalWorkouts: userProfile?.total_workouts || 0,
    currentStreak: userProfile?.current_streak || 0,
    weeklyGoal: userProfile?.weekly_goal || 3,
    weeklyProgress: userProfile?.weekly_progress || 0,
  };
  const progressPercentage = (stats.weeklyProgress / stats.weeklyGoal) * 100;

  // Stany do sterowania widokiem planów
  const hasActivePlan = Boolean(displayPlan);
  const hasReco = (recommendations?.length || 0) > 0;
  const recoPrimary = hasReco ? recommendations[0] : null;

  console.log('[DashboardPage] RENDER - activePlan:', activePlan);
  console.log('[DashboardPage] RENDER - tempActivePlan:', tempActivePlan);
  console.log('[DashboardPage] RENDER - displayPlan:', displayPlan);
  console.log('[DashboardPage] RENDER - hasActivePlan:', hasActivePlan);
  console.log('[DashboardPage] RENDER - recoPrimary:', recoPrimary);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black">
      <GradientGridBg />
      <GlowOrb className="left-[15%] top-32 h-64 w-64 bg-emerald-400/20" />
      <GlowOrb className="right-[20%] bottom-40 h-52 w-52 bg-teal-400/20" />

      <Navbar username={username} />

      <div className="mx-auto max-w-7xl px-6 pt-28 pb-16">
        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              {hasActivePlan && showCongrats ? (
                <>
                  <Kicker>Plan aktywowany!</Kicker>
                  <h1 className="mt-4 text-4xl font-black text-white md:text-5xl">
                    Gratulacje! Twój plan jest gotowy 🎉
                  </h1>
                  <p className="mt-3 text-lg text-gray-300">
                    Możesz teraz rozpocząć treningi i śledzić swoje postępy
                  </p>
                </>
              ) : hasActivePlan ? (
                <>
                  <Kicker>Twój aktywny plan</Kicker>
                  <h1 className="mt-4 text-4xl font-black text-white md:text-5xl">
                    Kontynuuj swój trening
                  </h1>
                  <p className="mt-3 text-lg text-gray-300">
                    Śledź postępy i realizuj swoje cele treningowe
                  </p>
                </>
              ) : hasReco ? (
                <>
                  <Kicker>Rekomendacja gotowa</Kicker>
                  <h1 className="mt-4 text-4xl font-black text-white md:text-5xl">
                    Mamy plan dopasowany do Ciebie
                  </h1>
                  <p className="mt-3 text-lg text-gray-300">
                    Aktywuj lub dostosuj rekomendowany plan i zacznij działać
                  </p>
                </>
              ) : (
                <>
                  <Kicker>Dashboard</Kicker>
                  <h1 className="mt-4 text-4xl font-black text-white md:text-5xl">
                    Cześć, {username}!
                  </h1>
                  <p className="mt-3 text-lg text-gray-300">
                    Zarządzaj swoimi treningami i śledź postępy
                  </p>
                </>
              )}
            </div>

            {/* Quick stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-3xl font-black text-white">{stats.currentStreak}</div>
                <div className="text-xs uppercase tracking-wide text-gray-400">Dni z rzędu</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-white">{stats.totalWorkouts}</div>
                <div className="text-xs uppercase tracking-wide text-gray-400">Łącznie treningów</div>
              </div>
            </div>
          </div>
        </header>

        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-900/20 p-4">
            <div className="flex items-center gap-2 text-red-300">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Weekly progress */}
        <div className="mb-10 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Tygodniowy cel</h3>
              <p className="text-sm text-gray-400">
                {stats.weeklyProgress} z {stats.weeklyGoal} treningów w tym tygodniu
              </p>
            </div>
            <div className="text-3xl font-bold text-emerald-300">
              {Math.round(progressPercentage)}%
            </div>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Main grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left column - Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Sekcja "Dzisiaj" */}
            {hasActivePlan ? (
              <div className="rounded-3xl border border-emerald-400/30 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-300 mb-3">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Dzisiaj
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">{displayPlan.name}</h2>
                    <p className="text-gray-300">Gotowy do treningu</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-black text-emerald-400">{displayPlan.trainingDaysPerWeek || 3}</div>
                    <div className="text-xs text-gray-400">dni/tydz</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <PrimaryButton onClick={() => navigate('/workout/today')} className="flex-1">
                    <IconKit.Dumbbell size="sm" className="inline" /> Rozpocznij trening
                  </PrimaryButton>
                  <SecondaryButton onClick={() => {
                    console.log('[Dashboard] Active plan - displayPlan:', displayPlan);
                    console.log('[Dashboard] displayPlan.planId:', displayPlan?.planId);
                    console.log('[Dashboard] displayPlan.id:', displayPlan?.id);
                    const planId = displayPlan?.planId || displayPlan?.id;
                    if (!planId) {
                      notify.error('Brak ID aktywnego planu');
                      return;
                    }
                    navigate(`/plan-details/${planId}`);
                  }}>
                    Zobacz szczegóły
                  </SecondaryButton>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-gray-300 mb-4">
                  Dzisiaj
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Brak aktywnego planu</h2>
                <p className="text-gray-400 mb-6">Zacznij od aktywacji rekomendowanego planu lub stwórz własny</p>
                <div className="flex gap-3">
                  {hasReco && (() => {
                    const recoPrimaryId = recoPrimary?.planId || recoPrimary?.id;
                    const activeId = activePlan?.planId || activePlan?.id;
                    const isRecoPrimaryActive = activeId && recoPrimaryId && String(activeId) === String(recoPrimaryId);
                    
                    return !isRecoPrimaryActive ? (
                      <SecondaryButton onClick={() => handleActivatePlan(recoPrimary)} className="flex-1">
                        Aktywuj rekomendację
                      </SecondaryButton>
                    ) : null;
                  })()}
                  <PrimaryButton onClick={handleCreateNewPlan} className="flex-1">
                    Stwórz plan
                  </PrimaryButton>
                </div>
              </div>
            )}

            {/* Sekcja "Rekomendowany plan" */}
            {hasReco && !hasActivePlan && (() => {
              const recoPrimaryId = recoPrimary?.planId || recoPrimary?.id;
              const activeId = activePlan?.planId || activePlan?.id;
              const isRecoPrimaryActive = activeId && recoPrimaryId && String(activeId) === String(recoPrimaryId);
              
              return (
                <div className="rounded-3xl border border-blue-400/20 bg-blue-400/5 p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-blue-400/20 px-3 py-1 text-xs font-bold text-blue-300 mb-3">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                        Rekomendacja
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-2">{recoPrimary.name}</h2>
                      <p className="text-gray-300 mb-4">{recoPrimary.description || 'Plan dopasowany do Twoich preferencji'}</p>
                      {recoPrimary.score && (
                        <div className="flex items-center gap-2 text-blue-300">
                          <span className="text-lg">⭐</span>
                          <span className="font-semibold">Dopasowanie: {Math.min(Math.round(recoPrimary.score * 100), 100)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <PrimaryButton onClick={() => {
                      console.log('[Dashboard] Recommended plan - recoPrimary:', recoPrimary);
                      console.log('[Dashboard] recoPrimary.planId:', recoPrimary?.planId);
                      console.log('[Dashboard] recoPrimary.id:', recoPrimary?.id);
                      const planId = recoPrimary?.planId || recoPrimary?.id;
                      if (!planId) {
                        notify.error('Brak ID rekomendowanego planu');
                        return;
                      }
                      navigate(`/plan-details/${planId}`);
                    }} className="flex-1">
                      Zobacz szczegóły
                    </PrimaryButton>
                    {!isRecoPrimaryActive ? (
                      <SecondaryButton onClick={() => handleActivatePlan(recoPrimary)} className="flex-1">
                        Aktywuj plan
                      </SecondaryButton>
                    ) : (
                      <div className="flex-1 px-6 py-3 rounded-full bg-emerald-500/20 border-2 border-emerald-400/60 text-center">
                        <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-300">
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                          </span>
                          Plan aktywny
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Sekcja "Szybki start" */}
            {!hasActivePlan && (
              <div className="rounded-3xl border border-purple-400/20 bg-purple-400/5 p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-purple-400/20 px-3 py-1 text-xs font-bold text-purple-300 mb-3">
                      Szybki start
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Trening bez planu</h2>
                    <p className="text-gray-300">Rozpocznij swobodną sesję treningową</p>
                  </div>
                </div>
                <PrimaryButton onClick={() => navigate('/workout/free')} className="w-full">
                  <IconKit.Zap size="sm" className="inline" /> Nowa sesja
                </PrimaryButton>
              </div>
            )}

            {/* Quick Actions */}
            <div>
              <h2 className="mb-4 text-xl font-bold text-white">Szybkie akcje</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <ActionCard
                  icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-emerald-400"><line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="20" x2="12" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="6" y1="20" x2="6" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
                  title="Statystyki"
                  description="Dashboard analityczny"
                  onClick={() => navigate('/statistics')}
                />
                <ActionCard
                  icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-blue-400"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/></svg>}
                  title="Ćwiczenia"
                  description="Przeglądaj bibliotekę"
                  onClick={() => navigate('/exercises')}
                />
                <ActionCard
                  icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-yellow-400"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
                  title="Kalendarz"
                  description="Historia treningów"
                  onClick={() => navigate('/calendar')}
                />
                <ActionCard
                  icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-teal-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  title="Dziennik"
                  description="Notatki z treningów"
                  onClick={() => navigate('/journal')}
                />
                <ActionCard
                  icon={<svg width="40" height="40" viewBox="0 0 16 16" fill="none" className="text-purple-400"><path d="M7.657 6.247c.11-.33.576-.33.686 0l.645 1.937a2.89 2.89 0 0 0 1.829 1.828l1.936.645c.33.11.33.576 0 .686l-1.937.645a2.89 2.89 0 0 0-1.828 1.829l-.645 1.936a.361.361 0 0 1-.686 0l-.645-1.937a2.89 2.89 0 0 0-1.828-1.828l-1.937-.645a.361.361 0 0 1 0-.686l1.937-.645a2.89 2.89 0 0 0 1.828-1.828l.645-1.937zM3.794 1.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387A1.734 1.734 0 0 0 4.593 5.69l-.387 1.162a.217.217 0 0 1-.412 0L3.407 5.69A1.734 1.734 0 0 0 2.31 4.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387A1.734 1.734 0 0 0 3.407 2.31l.387-1.162zM10.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.156 1.156 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.156 1.156 0 0 0-.732-.732L9.1 2.137a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732L10.863.1z" fill="currentColor"/></svg>}
                  title="Plany"
                  description="Wyszukaj plany treningowe"
                  onClick={() => navigate('/plans')}
                />
                <ActionCard
                  icon={<svg width="40" height="40" viewBox="0 0 50 50" fill="none" className="text-gray-400"><path d="M 22.205078 2 A 1.0001 1.0001 0 0 0 21.21875 2.8378906 L 20.246094 8.7929688 C 19.076509 9.1331971 17.961243 9.5922728 16.910156 10.164062 L 11.996094 6.6542969 A 1.0001 1.0001 0 0 0 10.708984 6.7597656 L 6.8183594 10.646484 A 1.0001 1.0001 0 0 0 6.7070312 11.927734 L 10.164062 16.873047 C 9.583454 17.930271 9.1142098 19.051824 8.765625 20.232422 L 2.8359375 21.21875 A 1.0001 1.0001 0 0 0 2.0019531 22.205078 L 2.0019531 27.705078 A 1.0001 1.0001 0 0 0 2.8261719 28.691406 L 8.7597656 29.742188 C 9.1064607 30.920739 9.5727226 32.043065 10.154297 33.101562 L 6.6542969 37.998047 A 1.0001 1.0001 0 0 0 6.7597656 39.285156 L 10.648438 43.175781 A 1.0001 1.0001 0 0 0 11.927734 43.289062 L 16.882812 39.820312 C 17.936999 40.39548 19.054994 40.857928 20.228516 41.201172 L 21.21875 47.164062 A 1.0001 1.0001 0 0 0 22.205078 48 L 27.705078 48 A 1.0001 1.0001 0 0 0 28.691406 47.173828 L 29.751953 41.1875 C 30.920633 40.838997 32.033372 40.369697 33.082031 39.791016 L 38.070312 43.291016 A 1.0001 1.0001 0 0 0 39.351562 43.179688 L 43.240234 39.287109 A 1.0001 1.0001 0 0 0 43.34375 37.996094 L 39.787109 33.058594 C 40.355783 32.014958 40.813915 30.908875 41.154297 29.748047 L 47.171875 28.693359 A 1.0001 1.0001 0 0 0 47.998047 27.707031 L 47.998047 22.207031 A 1.0001 1.0001 0 0 0 47.160156 21.220703 L 41.152344 20.238281 C 40.80968 19.078827 40.350281 17.974723 39.78125 16.931641 L 43.289062 11.933594 A 1.0001 1.0001 0 0 0 43.177734 10.652344 L 39.287109 6.7636719 A 1.0001 1.0001 0 0 0 37.996094 6.6601562 L 33.072266 10.201172 C 32.023186 9.6248101 30.909713 9.1579916 29.738281 8.8125 L 28.691406 2.828125 A 1.0001 1.0001 0 0 0 27.705078 2 L 22.205078 2 z M 23.056641 4 L 26.865234 4 L 27.861328 9.6855469 A 1.0001 1.0001 0 0 0 28.603516 10.484375 C 30.066026 10.848832 31.439607 11.426549 32.693359 12.185547 A 1.0001 1.0001 0 0 0 33.794922 12.142578 L 38.474609 8.7792969 L 41.167969 11.472656 L 37.835938 16.220703 A 1.0001 1.0001 0 0 0 37.796875 17.310547 C 38.548366 18.561471 39.118333 19.926379 39.482422 21.380859 A 1.0001 1.0001 0 0 0 40.291016 22.125 L 45.998047 23.058594 L 45.998047 26.867188 L 40.279297 27.871094 A 1.0001 1.0001 0 0 0 39.482422 28.617188 C 39.122545 30.069817 38.552234 31.434687 37.800781 32.685547 A 1.0001 1.0001 0 0 0 37.845703 33.785156 L 41.224609 38.474609 L 38.53125 41.169922 L 33.791016 37.84375 A 1.0001 1.0001 0 0 0 32.697266 37.808594 C 31.44975 38.567585 30.074755 39.148028 28.617188 39.517578 A 1.0001 1.0001 0 0 0 27.876953 40.3125 L 26.867188 46 L 23.052734 46 L 22.111328 40.337891 A 1.0001 1.0001 0 0 0 21.365234 39.53125 C 19.90185 39.170557 18.522094 38.59371 17.259766 37.835938 A 1.0001 1.0001 0 0 0 16.171875 37.875 L 11.46875 41.169922 L 8.7734375 38.470703 L 12.097656 33.824219 A 1.0001 1.0001 0 0 0 12.138672 32.724609 C 11.372652 31.458855 10.793319 30.079213 10.427734 28.609375 A 1.0001 1.0001 0 0 0 9.6328125 27.867188 L 4.0019531 26.867188 L 4.0019531 23.052734 L 9.6289062 22.117188 A 1.0001 1.0001 0 0 0 10.435547 21.373047 C 10.804273 19.898143 11.383325 18.518729 12.146484 17.255859 A 1.0001 1.0001 0 0 0 12.111328 16.164062 L 8.8261719 11.46875 L 11.523438 8.7734375 L 16.185547 12.105469 A 1.0001 1.0001 0 0 0 17.28125 12.148438 C 18.536908 11.394293 19.919867 10.822081 21.384766 10.462891 A 1.0001 1.0001 0 0 0 22.132812 9.6523438 L 23.056641 4 z M 25 17 C 20.593567 17 17 20.593567 17 25 C 17 29.406433 20.593567 33 25 33 C 29.406433 33 33 29.406433 33 25 C 33 20.593567 29.406433 17 25 17 z M 25 19 C 28.325553 19 31 21.674447 31 25 C 31 28.325553 28.325553 31 25 31 C 21.674447 31 19 28.325553 19 25 C 19 21.674447 21.674447 19 25 19 z" fill="currentColor"/></svg>}
                  title="Ustawienia"
                  description="Edytuj preferencje"
                  onClick={() => navigate('/settings')}
                />
              </div>
            </div>

            {/* Recommended Plans (pozostałe) */}
            {hasReco && (
              <div>
                <h2 className="mb-4 text-xl font-bold text-white">Polecane plany</h2>
                <div className="grid gap-4">
                  {recommendations.slice(hasActivePlan ? 0 : 1, 3).map((plan, index) => (
                    <PlanCard 
                      key={`${plan.id || plan.name}-${index}`} 
                      plan={plan} 
                      onActivate={handleActivatePlan}
                      activePlanId={activePlan?.planId || activePlan?.id}
                    />
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <SecondaryButton onClick={() => navigate('/plans')}>
                    Zobacz wszystkie plany →
                  </SecondaryButton>
                </div>
              </div>
            )}
          </div>

          {/* Right column - Profile and Stats */}
          <div className="space-y-8">
            {/* User Profile Card */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <div className="mb-6 text-center">
                {userProfile?.profile_picture ? (
                  <img
                    src={`http://localhost:8000${userProfile.profile_picture}`}
                    alt={username}
                    className="mx-auto mb-4 h-20 w-20 rounded-full object-cover border-4 border-emerald-400/20"
                  />
                ) : (
                  <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 flex items-center justify-center">
                    <span className="text-3xl font-black text-black">
                      {username?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <h3 className="text-xl font-bold text-white">{username}</h3>
                <p className="text-sm text-gray-400">{user?.email}</p>
                {userProfile?.bio && (
                  <p className="text-xs text-gray-500 mt-2 italic">{userProfile.bio}</p>
                )}
              </div>

              {userProfile && (
                <div className="space-y-4">
                  {(userProfile.age || userProfile.weight_kg || userProfile.height_cm) && (
                    <div>
                      <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
                        Dane biometryczne
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {userProfile.age && (
                          <div className="rounded-xl bg-white/[0.04] p-3">
                            <div className="text-xs text-gray-500">Wiek</div>
                            <div className="text-lg font-bold text-white">{userProfile.age} lat</div>
                          </div>
                        )}
                        {userProfile.weight_kg && (
                          <div className="rounded-xl bg-white/[0.04] p-3">
                            <div className="text-xs text-gray-500">Waga</div>
                            <div className="text-lg font-bold text-white">{userProfile.weight_kg} kg</div>
                          </div>
                        )}
                        {userProfile.height_cm && (
                          <div className="rounded-xl bg-white/[0.04] p-3">
                            <div className="text-xs text-gray-500">Wzrost</div>
                            <div className="text-lg font-bold text-white">{userProfile.height_cm} cm</div>
                          </div>
                        )}
                        {userProfile.bmi && (
                          <div className="rounded-xl bg-white/[0.04] p-3">
                            <div className="text-xs text-gray-500">BMI</div>
                            <div className={`text-lg font-bold ${
                              userProfile.bmi_category === 'normal' ? 'text-emerald-400' :
                              userProfile.bmi_category === 'overweight' ? 'text-yellow-400' :
                              userProfile.bmi_category === 'obese' ? 'text-red-400' : 'text-blue-400'
                            }`}>
                              {userProfile.bmi}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(userProfile.goal || userProfile.level || userProfile.equipment_preference) && (
                    <div>
                      <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
                        Preferencje treningowe
                      </h4>
                      <div className="space-y-2">
                        {userProfile.goal && (
                          <div className="flex justify-between rounded-xl bg-white/[0.04] px-4 py-3">
                            <span className="text-sm text-gray-400">Cel</span>
                            <span className="text-sm font-semibold text-white capitalize">
                              {userProfile.goal}
                            </span>
                          </div>
                        )}
                        {userProfile.level && (
                          <div className="flex justify-between rounded-xl bg-white/[0.04] px-4 py-3">
                            <span className="text-sm text-gray-400">Poziom</span>
                            <span className="text-sm font-semibold text-white capitalize">
                              {userProfile.level}
                            </span>
                          </div>
                        )}
                        {userProfile.equipment_preference && (
                          <div className="flex justify-between rounded-xl bg-white/[0.04] px-4 py-3">
                            <span className="text-sm text-gray-400">Sprzęt</span>
                            <span className="text-sm font-semibold text-white">
                              {userProfile.equipment_preference}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <GhostButton onClick={handleEditProfile} className="mt-6 w-full">
                Edytuj profil
              </GhostButton>
            </div>

            {/* Stats cards */}
            <div className="grid gap-4">
              <StatCard
                label="Treningi w tym miesiącu"
                value={userProfile?.monthly_workouts || 0}
                icon={<IconKit.Calendar size="lg" className="text-emerald-400" />}
                trend={userProfile?.monthly_trend}
              />
              <StatCard
                label="Średni czas treningu"
                value={`${userProfile?.avg_workout_time || 0}m`}
                icon={<IconKit.Clock size="lg" className="text-blue-400" />}
              />
              <StatCard
                label="Ulubione ćwiczenia"
                value={userProfile?.favorite_count || 0}
                sublabel={
                  userProfile?.favorite_count > 0
                    ? 'polubionych ćwiczeń'
                    : 'Kliknij aby dodać'
                }
                icon={
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-red-500">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
                  </svg>
                }
                onClick={() => navigate('/exercises?favorites=true')}
              />
            </div>

            {/* Progress Tracker Card */}
            <div className="rounded-3xl bg-gradient-to-br from-emerald-400/10 to-teal-400/10 border border-emerald-400/20 p-6">
              <h3 className="mb-3 text-lg font-bold text-white flex items-center gap-2">
                <IconKit.ChartUp size="md" /> Moje Postępy
              </h3>
              <p className="text-sm text-gray-300 mb-4">
                Śledź wagę, pomiary ciała, rekordy osobiste i metryki
              </p>
              <SecondaryButton onClick={() => navigate('/progress')}>
                Zobacz postępy →
              </SecondaryButton>
            </div>

            {/* Exercise Catalog Card */}
            <div className="rounded-3xl bg-gradient-to-br from-blue-400/10 to-purple-400/10 border border-blue-400/20 p-6">
              <h3 className="mb-3 text-lg font-bold text-white flex items-center gap-2">
                <IconKit.Dumbbell size="md" /> Katalog Ćwiczeń
              </h3>
              <p className="text-sm text-gray-300 mb-4">
                Przeglądaj bazę ćwiczeń, filtruj po partiach mięśniowych i typach treningu
              </p>
              <SecondaryButton onClick={() => navigate('/exercises')}>
                Zobacz katalog →
              </SecondaryButton>
            </div>

            {/* Training Journal Card */}
            <div className="rounded-3xl bg-gradient-to-br from-orange-400/10 to-yellow-400/10 border border-orange-400/20 p-6">
              <h3 className="mb-3 text-lg font-bold text-white flex items-center gap-2">
                <IconKit.Notebook size="md" /> Dziennik Treningowy
              </h3>
              <p className="text-sm text-gray-300 mb-4">
                Zapisuj notatki, obserwacje i refleksje po treningach
              </p>
              <SecondaryButton onClick={() => navigate('/journal')}>
                Otwórz dziennik →
              </SecondaryButton>
            </div>

            {/* Motivational card */}
            <div className="rounded-3xl bg-gradient-to-br from-emerald-400/10 to-teal-400/10 border border-emerald-400/20 p-6">
              <h3 className="mb-3 text-lg font-bold text-white flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-yellow-400">
                  <path d="M9 21h6M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Wskazówka dnia
              </h3>
              <p className="text-sm text-gray-300">
                Regularność jest kluczem do sukcesu. Nawet krótki trening jest lepszy niż żaden!
              </p>
              <div className="mt-4">
                <SecondaryButton to="/tips">
                  Więcej porad →
                </SecondaryButton>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center">
          <p className="text-sm text-gray-500">
            Potrzebujesz pomocy?{' '}
            <Link to="/help" className="text-emerald-400 hover:text-emerald-300 transition-colors">
              Skontaktuj się z nami
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default DashboardPage;
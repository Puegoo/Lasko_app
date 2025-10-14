import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

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
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
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
const StatCard = ({ label, value, sublabel, icon, trend }) => (
  <div className="group relative rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-all hover:border-emerald-400/40">
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
);

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

const PlanCard = ({ plan, isActive = false }) => {
  const navigate = useNavigate();
  
  const handleViewDetails = () => {
    // Przekieruj do dedykowanej strony szczegółów planu
    const planId = plan.planId || plan.id;
    console.log('[DashboardPage] Navigating to plan details for ID:', planId);
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
            <PrimaryButton onClick={() => console.log('Start workout')} className="flex-1">
              Rozpocznij trening
            </PrimaryButton>
            <GhostButton onClick={handleViewDetails}>
              Zobacz szczegóły
            </GhostButton>
        </>
      ) : (
        <>
          <SecondaryButton onClick={() => console.log('Activate plan')} className="flex-1">
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

  // plany przekazane przez nawigację (po aktywacji)
  const activePlan = location.state?.activePlan;
  const createdPlan = location.state?.createdPlan;
  const displayPlan = activePlan || createdPlan;

  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
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
      const profileData = await apiService.fetchUserProfile?.();
      if (profileData?.profile) {
        setUserProfile(profileData.profile);
      }
      const recoData = await apiService.generateRecommendations?.('hybrid', {});
      setRecommendations(recoData?.recommendations || []);
    } catch (err) {
      console.error('Błąd ładowania danych:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewPlan = () => navigate('/enhanced-plan-creator');
  const handleEditProfile = () => navigate('/profile/edit');

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

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black">
      <GradientGridBg />
      <GlowOrb className="left-[15%] top-32 h-64 w-64 bg-emerald-400/20" />
      <GlowOrb className="right-[20%] bottom-40 h-52 w-52 bg-teal-400/20" />

      <Navbar />

      <div className="mx-auto max-w-7xl px-6 pt-28 pb-16">
        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              {hasActivePlan ? (
                <>
                  <Kicker>Plan aktywowany!</Kicker>
                  <h1 className="mt-4 text-4xl font-black text-white md:text-5xl">
                    Gratulacje! Twój plan jest gotowy 🎉
                  </h1>
                  <p className="mt-3 text-lg text-gray-300">
                    Możesz teraz rozpocząć treningi i śledzić swoje postępy
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
                    Cześć, {user?.username || 'Sportowcu'}!
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
          {/* Left column - Plans and Actions */}
          <div className="lg:col-span-2 space-y-8">
            {/* Featured */}
            {hasActivePlan ? (
              <PlanCard plan={displayPlan} isActive={true} />
            ) : hasReco ? (
              <PlanCard plan={recoPrimary} />
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-12 text-center">
                <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-400/20 flex items-center justify-center">
                  <span className="text-5xl">💪</span>
                </div>
                <h2 className="mb-4 text-3xl font-bold text-white">
                  Stwórz swój pierwszy plan
                </h2>
                <p className="mb-8 mx-auto max-w-md text-gray-400">
                  Algorytm AI przeanalizuje Twoje cele, poziom zaawansowania i dane biometryczne,
                  aby stworzyć idealny plan dopasowany tylko do Ciebie.
                </p>
                <PrimaryButton onClick={handleCreateNewPlan} size="large">
                  Stwórz plan treningowy
                </PrimaryButton>
              </div>
            )}

            {/* Quick Actions */}
            <div>
              <h2 className="mb-4 text-xl font-bold text-white">Szybkie akcje</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <ActionCard
                  icon="📊"
                  title="Postępy"
                  description="Śledź swoje wyniki"
                  onClick={() => navigate('/progress')}
                />
                <ActionCard
                  icon="🏋️"
                  title="Ćwiczenia"
                  description="Przeglądaj bibliotekę"
                  onClick={() => navigate('/exercises')}
                />
                <ActionCard
                  icon="🎯"
                  title="Cele"
                  description="Zarządzaj celami"
                  onClick={() => navigate('/goals')}
                />
                <ActionCard
                  icon="📅"
                  title="Kalendarz"
                  description="Zaplanuj treningi"
                  onClick={() => navigate('/calendar')}
                />
                <ActionCard
                  icon="🏆"
                  title="Wyzwania"
                  description="Podejmij wyzwanie"
                  onClick={() => navigate('/challenges')}
                />
                <ActionCard
                  icon="⚙️"
                  title="Ustawienia"
                  description="Edytuj preferencje"
                  onClick={() => navigate('/profile/edit')}
                />
              </div>
            </div>

            {/* Recommended Plans (pozostałe) */}
            {hasReco && (
              <div>
                <h2 className="mb-4 text-xl font-bold text-white">Polecane plany</h2>
                <div className="grid gap-4">
                  {recommendations.slice(hasActivePlan ? 0 : 1, 3).map((plan, index) => (
                    <PlanCard key={`${plan.id || plan.name}-${index}`} plan={plan} />
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
                <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 flex items-center justify-center">
                  <span className="text-3xl font-black text-black">
                    {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white">{user?.username}</h3>
                <p className="text-sm text-gray-400">{user?.email}</p>
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
                icon="📅"
                trend={userProfile?.monthly_trend}
              />
              <StatCard
                label="Średni czas treningu"
                value={`${userProfile?.avg_workout_time || 0}m`}
                icon="⏱️"
              />
              <StatCard
                label="Ulubione ćwiczenie"
                value={userProfile?.favorite_exercise || 'Brak danych'}
                icon="⭐"
              />
            </div>

            {/* Motivational card */}
            <div className="rounded-3xl bg-gradient-to-br from-emerald-400/10 to-teal-400/10 border border-emerald-400/20 p-6">
              <h3 className="mb-3 text-lg font-bold text-white">💡 Wskazówka dnia</h3>
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
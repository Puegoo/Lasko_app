// Poprawiony wygląd dopasowany do stylu HomePage + alternatywne rekomendacje (2 dodatkowe)
// Dodatkowo: stabilne przekazanie username do PlanSummary i zapis w sessionStorage

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthDebug from '../../utils/authDebug';
import { RecommendationService } from '../../services/recommendationService';

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

  const navbarName =
    user?.username || sessionStorage.getItem('lasko_username') || 'Użytkowniku';

  useEffect(() => {
    if (user?.username) {
      sessionStorage.setItem('lasko_username', user.username);
    }
  }, [user?.username]);

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
  { value: 'user', label: 'Na podstawie klienta', description: 'Rekomendacje oparte na podobnych użytkownikach', icon: '👥' },
  { value: 'product', label: 'Na podstawie produktu', description: 'Plany dobrane według charakterystyki planów', icon: '📋' },
  { value: 'hybrid', label: 'Podejście hybrydowe', description: 'Kombinacja obydwu metod – najbardziej precyzyjne', icon: '🤖' },
];

const goalOptions = [
  { value: 'masa', label: 'Masa mięśniowa', icon: '💪' },
  { value: 'sila', label: 'Siła', icon: '🏋️' },
  { value: 'spalanie', label: 'Redukcja tkanki tłuszczowej', icon: '🔥' },
  { value: 'wytrzymalosc', label: 'Wytrzymałość', icon: '🏃' },
  { value: 'zdrowie', label: 'Zdrowie ogólne', icon: '❤️' },
];

const levelOptions = [
  { value: 'początkujący', label: 'Początkujący', description: '0–1 rok doświadczenia' },
  { value: 'średniozaawansowany', label: 'Średniozaawansowany', description: '1–3 lata doświadczenia' },
  { value: 'zaawansowany', label: 'Zaawansowany', description: '3+ lata doświadczenia' },
];

const equipmentOptions = [
  { value: 'siłownia', label: 'Pełna siłownia', icon: '🏟️' },
  { value: 'dom_hantle', label: 'Dom (hantle + ławka)', icon: '🏠' },
  { value: 'dom_masa', label: 'Dom (masa własna)', icon: '🤸' },
  { value: 'minimalne', label: 'Minimalne wyposażenie', icon: '⚡' },
];

const EnhancedPlanCreator = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, isAuthenticated, getToken, generateRecommendations, debugAuth } = useAuth();
  const recApi = useMemo(() => new RecommendationService(), []);

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
  const fromSurvey = location.state?.fromSurvey || false;

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [errors, setErrors] = useState({});

  const [planData, setPlanData] = useState({
    recommendationMethod: initialData.recommendationMethod || 'hybrid',
    goal: initialData.goal || '',
    level: initialData.level || '',
    trainingDaysPerWeek: initialData.trainingDaysPerWeek || 3,
    equipment: initialData.equipment || '',
    timePerSession: initialData.timePerSession || 60,
    focusAreas: initialData.focusAreas || [],
    avoidances: initialData.avoidances || [],
    body: {
      age: initialData.age || '',
      weightKg: initialData.weightKg || '',
      heightCm: initialData.heightCm || '',
      activityLevel: initialData.activityLevel || 'średnia',
    },
    name: initialData.name || '',
    recommendedPlan: null,
    altPlans: [],
  });

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
    if (!age || age < 16 || age > 100) errs.age = 'Podaj wiek między 16 a 100 lat.';
    if (!weightKg || weightKg < 30 || weightKg > 300) errs.weightKg = 'Podaj wagę między 30 a 300 kg.';
    if (!heightCm || heightCm < 120 || heightCm > 250) errs.heightCm = 'Podaj wzrost między 120 a 250 cm.';
    return errs;
  }, [planData.body]);

  // ============================================================================
  // FUNKCJE NAWIGACJI I WALIDACJI
  // ============================================================================
  const isStepValid = (stepIndex) => {
    if (stepIndex === 0) return !!planData.recommendationMethod;
    if (stepIndex === 1) return Object.keys(validateBasics).length === 0;
    if (stepIndex === 2) return Object.keys(validatePreferences).length === 0;
    if (stepIndex === 3) return Object.keys(validateBody).length === 0;
    if (stepIndex === 4) return !!planData.name?.trim();
    return true;
  };

  const showErrorsForStep = (stepIndex) => {
    if (stepIndex === 1) setErrors(validateBasics);
    else if (stepIndex === 2) setErrors(validatePreferences);
    else if (stepIndex === 3) setErrors(validateBody);
    else setErrors({});
  };

  const handleNext = () => {
    if (!isStepValid(currentStep)) {
      showErrorsForStep(currentStep);
      return;
    }
    setErrors({});
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrev = () => {
    setErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // ============================================================================
  // GENEROWANIE REKOMENDACJI
  // ============================================================================
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
        try { debugAuth?.(); } catch {}
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
      };

      const response = await generateRecommendations(planData.recommendationMethod, preferences);

      if (response && Array.isArray(response.recommendations) && response.recommendations.length > 0) {
        // Prefetch szczegółów dla TOP 1–3
        const topRecs = response.recommendations.slice(0, 3);
        let detailed = [];
        try {
          detailed = await Promise.all(
            topRecs.map(r => recApi.getPlanDetailed(r.planId).catch(() => null))
          );
        } catch (_) {}

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
          user?.username ||
          initialData?.username ||
          sessionStorage.getItem('lasko_username') ||
          null;

        if (usernameCandidate) {
          sessionStorage.setItem('lasko_username', usernameCandidate);
        }

        setPlanData(updatedPlanData);
        sessionStorage.setItem('lasko_plan_draft', JSON.stringify(updatedPlanData));

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
        try { await AuthDebug.fullDiagnostic(); } catch {}
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
  const OptionCard = ({ active, onClick, children, disabled = false }) => (
    <div
      onClick={disabled ? undefined : onClick}
      className={[
        'group relative cursor-pointer rounded-2xl border p-6 transition-all duration-200',
        active
          ? 'border-emerald-400/60 bg-emerald-400/10 ring-1 ring-emerald-400/30'
          : 'border-white/10 bg-white/[0.04] hover:border-emerald-400/40',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
      ].join(' ')}
    >
      {children}
      {!disabled && !active && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 ring-1 ring-emerald-400/30 transition-opacity group-hover:opacity-100" />
      )}
    </div>
  );

  const StepProgress = () => {
    const steps = ['Metoda', 'Podstawy', 'Preferencje', 'Ciało', 'Nazwa'];
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
        <div className="mt-3 flex justify-between">
          {steps.map((step, index) => (
            <div
              key={index}
              className={[
                'text-xs font-medium transition-colors',
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
        <Kicker>Krok 1 z 5</Kicker>
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
            <div className="text-center space-y-3">
              <div className="text-4xl mb-3">{m.icon}</div>
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

  const renderBasicsStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <Kicker>Krok 2 z 5</Kicker>
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
            >
              <div className="flex items-center gap-4">
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
        <div className="grid gap-3 md:grid-cols-3">
          {levelOptions.map((l) => (
            <OptionCard 
              key={l.value} 
              active={planData.level === l.value} 
              onClick={() => setPlanData((p) => ({ ...p, level: l.value }))}
            >
              <div className="space-y-2">
                <h4 className="text-white font-bold">{l.label}</h4>
                <p className="text-sm text-gray-400">{l.description}</p>
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
        <Kicker>Krok 3 z 5</Kicker>
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
              <div className="text-center space-y-2">
                <span className="text-3xl">{e.icon}</span>
                <p className="text-sm text-white font-medium">{e.label}</p>
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
          <div className="relative">
            <input
              type="number"
              min="15"
              max="180"
              value={planData.timePerSession}
              onChange={(e) => setPlanData((p) => ({ ...p, timePerSession: parseInt(e.target.value) || 60 }))}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-center text-2xl font-bold text-white outline-none transition-all focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30"
              placeholder="60"
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400">minut</span>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <span>Min: 15 min</span>
            <span>Zalecane: 45-90 min</span>
            <span>Max: 180 min</span>
          </div>
          {/* Slider wizualny */}
          <div className="mt-3 h-2 rounded-full bg-white/10 relative">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all"
              style={{ width: `${((planData.timePerSession - 15) / (180 - 15)) * 100}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white shadow-lg transition-all"
              style={{ left: `${((planData.timePerSession - 15) / (180 - 15)) * 100}%` }}
            />
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
          <Kicker>Krok 4 z 5</Kicker>
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
                min="16"
                max="100"
                value={planData.body.age}
                onChange={(e) => setPlanData((p) => ({ ...p, body: { ...p.body, age: parseInt(e.target.value) || '' } }))}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-lg font-semibold text-white outline-none transition-all focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30"
                placeholder="25"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500">lat</span>
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
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-lg font-semibold text-white outline-none transition-all focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30"
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
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-lg font-semibold text-white outline-none transition-all focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30"
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

  const renderNameStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <Kicker>Krok 5 z 5</Kicker>
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
          <span>📊</span> Podsumowanie planu
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
            <span className="font-semibold text-emerald-300">{(((currentStep + 1) / 5) * 100).toFixed(0)}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / 5) * 100}%` }}
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
  const steps = [
    { title: 'Metoda', component: renderMethodStep },
    { title: 'Podstawy', component: renderBasicsStep },
    { title: 'Preferencje', component: renderPreferencesStep },
    { title: 'Ciało', component: renderBodyStep },
    { title: 'Nazwa', component: renderNameStep },
  ];

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
                      <span>🚀</span> Wygeneruj plan
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
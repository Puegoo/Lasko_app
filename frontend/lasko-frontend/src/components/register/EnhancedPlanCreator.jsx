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
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-orange-400"><path d="M6 6l-1.5 1.5M18 6l1.5 1.5M6 18l-1.5-1.5M18 18l1.5-1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="9" cy="12" r="3" stroke="currentColor" strokeWidth="2"/><circle cx="15" cy="12" r="3" stroke="currentColor" strokeWidth="2"/><path d="M9 9h6M9 15h6" stroke="currentColor" strokeWidth="2"/></svg>
  },
  { 
    value: 'sila', 
    label: 'Siła', 
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-red-400"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor"/></svg>
  },
  { 
    value: 'wytrzymalosc', 
    label: 'Wytrzymałość', 
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-green-400"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="18" cy="5" r="2" stroke="currentColor" strokeWidth="2"/></svg>
  },
  { 
    value: 'zdrowie', 
    label: 'Zdrowie ogólne', 
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-pink-400"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" fill="currentColor"/></svg>
  },
  { 
    value: 'spalanie', 
    label: 'Redukcja tkanki tłuszczowej', 
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-yellow-400"><path d="M12 2c.5 1.5-.5 3-1 4s-2 2-2 4 1 3 2 4 1.5 2.5 1 4c4-2 7-5 7-9 0-5-4-7-7-7z" stroke="currentColor" strokeWidth="2" fill="currentColor"/></svg>,
    colspan: 'sm:col-span-2 lg:col-span-2'  // 🆕 Szerokość 2 kafelków
  },
];

const levelOptions = [
  { value: 'poczatkujacy', label: 'Początkujący', description: '0–1 rok doświadczenia' },
  { value: 'sredniozaawansowany', label: 'Średnio­zaawansowany', description: '1–3 lata doświadczenia' },
  { value: 'zaawansowany', label: 'Zaawansowany', description: '3+ lata doświadczenia' },
];

const equipmentOptions = [
  { 
    value: 'silownia', 
    label: 'Pełna siłownia', 
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-gray-300"><rect x="2" y="10" width="4" height="4" stroke="currentColor" strokeWidth="2"/><rect x="18" y="10" width="4" height="4" stroke="currentColor" strokeWidth="2"/><line x1="6" y1="12" x2="18" y2="12" stroke="currentColor" strokeWidth="2"/><circle cx="9" cy="12" r="2" stroke="currentColor" strokeWidth="2"/><circle cx="15" cy="12" r="2" stroke="currentColor" strokeWidth="2"/></svg>
  },
  { 
    value: 'dom_podstawowy', 
    label: 'Dom (hantle + ławka)', 
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-blue-400"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  },
  { 
    value: 'masa_ciala', 
    label: 'Dom (masa własna)', 
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-green-400"><circle cx="12" cy="8" r="5" stroke="currentColor" strokeWidth="2"/><path d="M12 13v8m-4 0h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
  },
  { 
    value: 'minimalne', 
    label: 'Minimalne wyposażenie', 
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-yellow-400"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor"/></svg>
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
    if (stepIndex === 0) return !!planData.recommendationMethod;
    if (stepIndex === 1) return Object.keys(validateBasics).length === 0;
    if (stepIndex === 2) return Object.keys(validatePreferences).length === 0;
    if (stepIndex === 3) return Object.keys(validateBody).length === 0;
    if (stepIndex === 4) return true;  // Krok "Zdrowie" jest OPCJONALNY - zawsze valid
    if (stepIndex === 5) return !!planData.name?.trim();
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
    setCurrentStep((prev) => Math.min(prev + 1, 5));  // 🆕 Zmieniono z 4 na 5 (6 kroków: 0-5)
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
    const steps = ['Metoda', 'Podstawy', 'Preferencje', 'Ciało', 'Zdrowie', 'Nazwa'];
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
        <Kicker>Krok 1 z 6</Kicker>
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

  const renderBasicsStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <Kicker>Krok 2 z 6</Kicker>
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
                <div className="space-y-1">
                <h4 className="text-white font-bold">{l.label}</h4>
                <p className="text-sm text-gray-400">{l.description}</p>
                </div>
                {planData.level === l.value && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-emerald-400 flex-shrink-0">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
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
        <Kicker>Krok 3 z 6</Kicker>
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
          <Kicker>Krok 4 z 6</Kicker>
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
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-red-400"><circle cx="12" cy="7" r="2" stroke="currentColor" strokeWidth="2"/><path d="M12 9v6M10 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M10 19l2-2 2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    },
    { 
      id: 'lower_back', 
      label: 'Dolny odcinek kręgosłupa', 
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-red-400"><path d="M12 2v20M8 6c0 2 4 2 4 0M8 12c0 2 4 2 4 0M8 18c0 2 4 2 4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
    },
    { 
      id: 'shoulder', 
      label: 'Bark', 
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-red-400"><circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="2"/><path d="M9 11l-4 8M15 11l4 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
    },
    { 
      id: 'elbow', 
      label: 'Łokieć', 
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-red-400"><path d="M8 4v8l4 4M16 20v-8l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    },
    { 
      id: 'wrist', 
      label: 'Nadgarstek', 
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-red-400"><path d="M12 8v8M8 12h8M12 12l-3 3M12 12l3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
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
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-yellow-400"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" strokeWidth="2"/></svg>
    },
    { 
      id: 'asthma', 
      label: 'Astma', 
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-yellow-400"><path d="M9 17c.5 0 .75-.5 1.5-1.5S12 14 13 14s1.5.5 2 1.5S15.5 17 16 17M9 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><ellipse cx="12" cy="12" rx="8" ry="10" stroke="currentColor" strokeWidth="2"/></svg>
    },
    { 
      id: 'diabetes', 
      label: 'Cukrzyca', 
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-yellow-400"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/><path d="M12 2v4M12 18v4M22 12h-4M6 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
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
        <Kicker>Krok 5 z 6 (opcjonalny)</Kicker>
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
            setCurrentStep(5);  // Przejdź do kroku "Nazwa"
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
        <Kicker>Krok 6 z 6</Kicker>
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
            <span className="font-semibold text-emerald-300">{(((currentStep + 1) / 6) * 100).toFixed(0)}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / 6) * 100}%` }}
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
    { title: 'Zdrowie', component: renderHealthStep },  // 🆕 Nowy krok
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
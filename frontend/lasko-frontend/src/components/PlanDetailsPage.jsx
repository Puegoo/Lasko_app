import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { RecommendationService } from '../services/recommendationService';
import apiService from '../services/api';
import RatePlanModal from './RatePlanModal';
import { DeleteButton, ReplaceButton } from './ui/ActionButtons';
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

const Kicker = ({ children }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold tracking-wide text-emerald-300">
    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 motion-reduce:animate-none" />
    {children}
  </span>
);

const PrimaryButton = ({ onClick, to, children, className = '', disabled = false }) => {
  const Comp = to ? Link : 'button';
  const props = to ? { to } : { onClick, disabled };

  return (
    <Comp
      {...props}
      className={[
        'group relative inline-flex items-center justify-center rounded-full font-bold text-white transition-transform',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 active:scale-[0.98]',
        'px-7 py-3 text-sm',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
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
      'inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-2.5 text-sm font-medium text-gray-300',
      'hover:bg-white/5 hover:border-white/30 hover:text-white transition-colors',
      className,
    ].join(' ')}
  >
    {children}
  </button>
);

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
      <div className="flex items-center justify-between px-4 py-4">
        <Link to="/" className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
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
  const notify = useNotification();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activating, setActivating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview | schedule | stats
  const [activePlanId, setActivePlanId] = useState(null); // ID aktywnego planu użytkownika
  const [schedule, setSchedule] = useState([]); // Dni treningowe w harmonogramie
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Tryb edycji
  const [editedPlan, setEditedPlan] = useState(null); // Edytowany plan
  const [saving, setSaving] = useState(false); // Stan zapisywania
  const [replaceModal, setReplaceModal] = useState({ open: false, dayIndex: null, exerciseIndex: null, currentExercise: null }); // Modal zamiany ćwiczenia
  const [exercises, setExercises] = useState([]); // Katalog ćwiczeń
  const [exercisesLoading, setExercisesLoading] = useState(false);
  const [exerciseFilters, setExerciseFilters] = useState({ muscle_group: '', search: '' });
  const [showRatePlanModal, setShowRatePlanModal] = useState(false); // Modal oceny planu
  const [planRating, setPlanRating] = useState(null); // Obecna ocena planu
  const recApi = useMemo(() => new RecommendationService(), []);

  // Dni tygodnia
  const weekDays = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];

  // Generuj inteligentny harmonogram
  const generateSchedule = (trainingDays) => {
    const defaults = {
      1: ['Środa'],
      2: ['Poniedziałek', 'Czwartek'],
      3: ['Poniedziałek', 'Środa', 'Piątek'],
      4: ['Poniedziałek', 'Wtorek', 'Czwartek', 'Piątek'],
      5: ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek'],
      6: ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'],
      7: ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']
    };
    return defaults[trainingDays] || [];
  };

  // Pobierz aktywny plan użytkownika
  useEffect(() => {
    const fetchActivePlan = async () => {
      try {
        const response = await recApi.getActivePlan();
        if (response?.has_active_plan && response?.plan) {
          const activePlan = response.plan;
          const activeId = activePlan.plan_id || activePlan.planId || activePlan.id;
          setActivePlanId(activeId);
          console.log('[PlanDetailsPage] Active plan ID:', activeId);
          
          // Jeśli ten plan jest aktywny, pobierz jego ocenę
          if (activeId == planId) {
            fetchPlanRating();
          }
        }
      } catch (err) {
        console.error('[PlanDetailsPage] Error fetching active plan:', err);
        // Nie pokazujemy błędu użytkownikowi - to tylko informacja dodatkowa
      }
    };

    fetchActivePlan();
  }, [recApi, planId]);

  // Pobierz ocenę planu
  const fetchPlanRating = async () => {
    try {
      const response = await apiService.request('/api/feedback/plan-rating/');
      if (response.success && response.has_rating) {
        setPlanRating(response.rating);
      }
    } catch (error) {
      console.error('[PlanDetailsPage] Error fetching plan rating:', error);
    }
  };

  // Pobierz zapisany harmonogram użytkownika z bazy danych
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        // Pobierz harmonogram z backendu (zapisany w user_active_plans)
        const response = await apiService.request('/api/auth/schedule/get/');
        console.log('[PlanDetailsPage] Loaded schedule from database:', response);
        
        if (response.success && response.schedule && response.schedule.length > 0) {
          setSchedule(response.schedule);
          setNotificationsEnabled(response.notifications_enabled ?? false);
        } else if (plan && plan.trainingDaysPerWeek) {
          // Jeśli nie ma zapisanego harmonogramu, wygeneruj domyślny
          const defaultSchedule = generateSchedule(plan.trainingDaysPerWeek);
          setSchedule(defaultSchedule);
        }
      } catch (error) {
        console.error('[PlanDetailsPage] Error fetching schedule:', error);
        // Jeśli błąd, wygeneruj domyślny harmonogram
        if (plan && plan.trainingDaysPerWeek) {
          setSchedule(generateSchedule(plan.trainingDaysPerWeek));
        }
      }
    };

    if (plan && !schedule.length) {
      fetchSchedule();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  useEffect(() => {
    const fetchPlanDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('[PlanDetailsPage] Fetching plan:', planId);
        const data = await recApi.getPlanDetailed(planId);
        
        // Sprawdź czy dane są w data.plan czy bezpośrednio w data
        const planData = data.plan || data;
        
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
      setActivePlanId(plan.id); // Zaktualizuj ID aktywnego planu
      notify.success('Plan został aktywowany! 🎉');
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (err) {
      console.error('[PlanDetailsPage] Error activating plan:', err);
      notify.error('Nie udało się aktywować planu: ' + (err.message || 'Nieznany błąd'));
    } finally {
      setActivating(false);
    }
  };

  // Sprawdź czy wyświetlany plan jest aktywny
  const isPlanActive = activePlanId && plan && (
    activePlanId === plan.id || 
    activePlanId === parseInt(planId) || 
    String(activePlanId) === String(plan.id)
  );

  const handleCopyAndEdit = () => {
    // Przekieruj do buildera z danymi planu
    navigate('/plan-builder', {
      state: { basePlan: plan }
    });
  };

  const handleReportProblem = () => {
    notify.info('Funkcja zgłaszania problemów będzie dostępna wkrótce');
    // TODO: Dodać modal z formularzem feedback
  };

  const saveSchedule = async () => {
    try {
      // Zapisz harmonogram do bazy danych (user_active_plans.training_schedule)
      const response = await apiService.request('/api/auth/schedule/save/', {
        method: 'POST',
        body: JSON.stringify({
          schedule,
          notifications_enabled: notificationsEnabled
        })
      });
      
      if (response.success) {
        console.log('[PlanDetailsPage] Schedule saved to database:', schedule);
        notify.success('Harmonogram został zapisany!');
        return true;
      } else {
        notify.error(response.message || 'Nie udało się zapisać harmonogramu');
      }
    } catch (err) {
      console.error('[PlanDetailsPage] Failed to save schedule:', err);
      notify.error('Nie udało się zapisać harmonogramu: ' + (err.message || 'Nieznany błąd'));
    }
    return false;
  };

  // Rozpocznij edycję (tylko dla planów użytkownika)
  const handleStartEdit = () => {
    // Sprawdź czy to plan systemowy
    if (!plan.auth_account_id || plan.auth_account_id === null) {
      notify.warning('To jest plan systemowy. Użyj przycisku "Skopiuj i edytuj" aby stworzyć swoją wersję.');
      return;
    }
    
    setEditedPlan(JSON.parse(JSON.stringify(plan))); // Deep copy
    setIsEditing(true);
    setActiveTab('overview'); // Przełącz na zakładkę przeglądu
  };

  // Anuluj edycję
  const handleCancelEdit = () => {
    setEditedPlan(null);
    setIsEditing(false);
  };

  // Zapisz zmiany w planie
  const handleSavePlan = async () => {
    if (!editedPlan) return;
    
    try {
      setSaving(true);
      
      // Zapisz metadane planu
      await apiService.request(`/api/recommendations/plans/${planId}/`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editedPlan.name,
          description: editedPlan.description,
        })
      });

      // Zapisz zmiany w ćwiczeniach
      if (editedPlan.days) {
        for (const day of editedPlan.days) {
          if (day.exercises) {
            for (const exercise of day.exercises) {
              if (exercise.id && exercise._modified) {
                await apiService.request(`/api/recommendations/plans/${planId}/exercises/${exercise.id}/`, {
                  method: 'PUT',
                  body: JSON.stringify({
                    target_sets: exercise.target_sets || exercise.targetSets,
                    target_reps: exercise.target_reps || exercise.targetReps,
                    rest_seconds: exercise.rest_seconds || exercise.restSeconds,
                    superset_group: exercise.superset_group || exercise.supersetGroup
                  })
                });
              }
            }
          }
        }
      }

      // Odśwież dane planu
      setPlan(editedPlan);
      setIsEditing(false);
      setEditedPlan(null);
      notify.success('Plan został zaktualizowany!');
      
    } catch (err) {
      console.error('[PlanDetailsPage] Failed to save plan:', err);
      notify.error('Nie udało się zapisać planu: ' + (err.message || 'Nieznany błąd'));
    } finally {
      setSaving(false);
    }
  };

  // Aktualizuj pole w edytowanym planie
  const updatePlanField = (field, value) => {
    setEditedPlan(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Aktualizuj ćwiczenie
  const updateExercise = (dayIndex, exerciseIndex, field, value) => {
    setEditedPlan(prev => {
      const newPlan = JSON.parse(JSON.stringify(prev));
      if (newPlan.days?.[dayIndex]?.exercises?.[exerciseIndex]) {
        newPlan.days[dayIndex].exercises[exerciseIndex][field] = value;
        newPlan.days[dayIndex].exercises[exerciseIndex]._modified = true;
      }
      return newPlan;
    });
  };

  // Usuń ćwiczenie
  const removeExercise = async (dayIndex, exerciseIndex) => {
    const exercise = editedPlan.days?.[dayIndex]?.exercises?.[exerciseIndex];
    if (!exercise) return;

    if (!confirm(`Czy na pewno chcesz usunąć ćwiczenie "${exercise.name}"?`)) {
      return;
    }

    try {
      if (exercise.id) {
        await apiService.request(`/api/recommendations/plans/${planId}/exercises/${exercise.id}/delete/`, {
          method: 'DELETE'
        });
      }

      setEditedPlan(prev => {
        const newPlan = JSON.parse(JSON.stringify(prev));
        if (newPlan.days?.[dayIndex]?.exercises) {
          newPlan.days[dayIndex].exercises.splice(exerciseIndex, 1);
        }
        return newPlan;
      });

      notify.success('Ćwiczenie zostało usunięte');
    } catch (err) {
      console.error('[PlanDetailsPage] Failed to remove exercise:', err);
      notify.error('Nie udało się usunąć ćwiczenia');
    }
  };

  // Otwórz modal zamiany ćwiczenia
  const openReplaceModal = async (dayIndex, exerciseIndex) => {
    const exercise = editedPlan.days?.[dayIndex]?.exercises?.[exerciseIndex];
    if (!exercise) return;

    setReplaceModal({
      open: true,
      dayIndex,
      exerciseIndex,
      currentExercise: exercise
    });

    // Pobierz katalog ćwiczeń
    await fetchExercises();
  };

  // Pobierz ćwiczenia z API
  const fetchExercises = async () => {
    try {
      setExercisesLoading(true);
      const params = new URLSearchParams({
        limit: 100,
        ...exerciseFilters
      });

      const response = await apiService.request(`/api/exercises/?${params}`);
      
      if (response.success) {
        setExercises(response.exercises || []);
      }
    } catch (error) {
      console.error('[PlanDetailsPage] Error fetching exercises:', error);
    } finally {
      setExercisesLoading(false);
    }
  };

  // Zamień ćwiczenie
  const replaceExercise = async (newExercise) => {
    const { currentExercise } = replaceModal;

    try {
      const planExerciseId = currentExercise.id; // ID z plan_exercises
      
      const response = await apiService.request(
        `/api/recommendations/plans/${planId}/exercises/${planExerciseId}/replace/`,
        {
          method: 'POST',
          body: JSON.stringify({
            new_exercise_id: newExercise.id,
            target_sets: currentExercise.target_sets || currentExercise.targetSets || '3',
            target_reps: currentExercise.target_reps || currentExercise.targetReps || '10-12',
            rest_seconds: currentExercise.rest_seconds || currentExercise.restSeconds || 60
          })
        }
      );

      if (response.success) {
        // Odśwież plan z backendu
        const updatedPlanData = await recApi.getPlanDetailed(planId);
        const normalizedPlan = updatedPlanData.plan || updatedPlanData;
        setPlan(normalizedPlan);
        setEditedPlan(JSON.parse(JSON.stringify(normalizedPlan)));

        setReplaceModal({ open: false, dayIndex: null, exerciseIndex: null, currentExercise: null });
        notify.success(`Ćwiczenie zostało zamienione na: ${newExercise.name}`);
      }
    } catch (err) {
      console.error('[PlanDetailsPage] Error replacing exercise:', err);
      notify.error('Nie udało się zamienić ćwiczenia: ' + (err.message || 'Nieznany błąd'));
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
    siłownia: 'Pełna siłownia',
    silownia: 'Pełna siłownia',
    dom_podstawowy: 'Dom (podstawowy sprzęt)',
    dom_zaawansowany: 'Dom (zaawansowany sprzęt)',
    masa_ciala: 'Masa ciała',
    minimalne: 'Minimalne wyposażenie',
  };

  const levelLabels = {
    poczatkujacy: 'Początkujący',
    sredniozaawansowany: 'Średniozaawansowany',
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

  // Oblicz statystyki
  const totalExercises = plan.days.reduce((sum, day) => sum + (day.exercises?.length || 0), 0);
  const avgExercisesPerDay = plan.days.length > 0 ? Math.round(totalExercises / plan.days.length) : 0;

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
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <Kicker>{isEditing ? 'Edycja planu' : 'Szczegóły planu'}</Kicker>
              {isEditing ? (
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Nazwa planu</label>
                    <input
                      type="text"
                      value={editedPlan?.name || ''}
                      onChange={(e) => updatePlanField('name', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-2xl font-bold focus:outline-none focus:border-emerald-400/50 transition-colors"
                      placeholder="Nazwa planu..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Opis planu (opcjonalnie)</label>
                    <textarea
                      value={editedPlan?.description || ''}
                      onChange={(e) => updatePlanField('description', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white resize-none focus:outline-none focus:border-emerald-400/50 transition-colors"
                      rows={3}
                      placeholder="Dodaj opis planu..."
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="mt-4 text-4xl md:text-5xl font-black text-white mb-4">{plan.name}</h1>
                  {plan.description && (
                    <p className="text-lg text-gray-300 max-w-3xl">{plan.description}</p>
                  )}
                </>
              )}
            </div>
            
            {/* Action Buttons (sticky na większych ekranach) */}
            <div className="flex flex-col gap-3 min-w-[200px]">
              {isEditing ? (
                <>
                  <PrimaryButton 
                    onClick={handleSavePlan} 
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Zapisywanie...
                      </span>
                    ) : (
                      <><IconKit.Document size="sm" className="inline" /> Zapisz zmiany</>
                    )}
                  </PrimaryButton>
                  <SecondaryButton onClick={handleCancelEdit} className="w-full" disabled={saving}>
                    ❌ Anuluj
                  </SecondaryButton>
                </>
              ) : (
                <>
                  {isPlanActive ? (
                    <div className="w-full px-6 py-3 rounded-full bg-emerald-500/20 border-2 border-emerald-400/60 text-center">
                      <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-300">
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                        </span>
                        Plan aktywny
                      </span>
                    </div>
                  ) : (
                    <PrimaryButton 
                      onClick={handleActivatePlan} 
                      disabled={activating}
                      className="w-full"
                    >
                      {activating ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Aktywowanie...
                        </span>
                      ) : (
                        <><IconKit.Play size="sm" className="inline" /> Aktywuj plan</>
                      )}
                    </PrimaryButton>
                  )}
                  {/* Pokaż "Edytuj" tylko dla planów użytkownika, "Skopiuj" dla systemowych */}
                  {plan.auth_account_id ? (
                    <SecondaryButton onClick={handleStartEdit} className="w-full">
                      ✏️ Edytuj plan
                    </SecondaryButton>
                  ) : (
                    <SecondaryButton onClick={handleCopyAndEdit} className="w-full">
                      <IconKit.Copy size="sm" className="inline" /> Skopiuj i edytuj
                    </SecondaryButton>
                  )}
                  <GhostButton onClick={handleReportProblem} className="w-full">
                    ⚠️ Zgłoś problem
                  </GhostButton>
                  
                  {/* Oceń plan (tylko jeśli aktywny i nie oceniony) */}
                  {activePlanId == planId && !planRating && (
                    <SecondaryButton onClick={() => setShowRatePlanModal(true)} className="w-full">
                      <IconKit.Star size="sm" className="inline" /> Oceń plan
                    </SecondaryButton>
                  )}
                  
                  {/* Pokaż ocenę jeśli już oceniony */}
                  {planRating && (
                    <div className="rounded-xl bg-yellow-400/10 border border-yellow-400/20 p-4">
                      <div className="flex items-center gap-2 text-sm text-yellow-300">
                        <span className="text-lg">⭐</span>
                        <span className="font-medium">
                          Twoja ocena: {planRating.rating}/5
                        </span>
                      </div>
                      {planRating.feedback_text && (
                        <p className="mt-2 text-xs text-gray-400">
                          "{planRating.feedback_text}"
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Metadata Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-6">
            <div className="flex flex-col gap-2">
              <IconKit.Target size="xl" className="text-emerald-400" />
              <div>
                <p className="text-xs text-emerald-400 uppercase tracking-wide font-bold">Cel</p>
                <p className="text-white font-bold mt-1">{goalLabels[plan.goalType] || plan.goalType}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-400/20 bg-blue-400/5 p-6">
            <div className="flex flex-col gap-2">
              <IconKit.ChartBar size="xl" className="text-blue-400" />
              <div>
                <p className="text-xs text-blue-400 uppercase tracking-wide font-bold">Poziom</p>
                <p className="text-white font-bold mt-1">{levelLabels[plan.difficultyLevel] || plan.difficultyLevel}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-purple-400/20 bg-purple-400/5 p-6">
            <div className="flex flex-col gap-2">
              <IconKit.Calendar size="xl" className="text-purple-400" />
              <div>
                <p className="text-xs text-purple-400 uppercase tracking-wide font-bold">Częstotliwość</p>
                <p className="text-white font-bold mt-1">{plan.trainingDaysPerWeek} dni/tydzień</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-orange-400/20 bg-orange-400/5 p-6">
            <div className="flex flex-col gap-2">
              <IconKit.Dumbbell size="xl" className="text-orange-400" />
              <div>
                <p className="text-xs text-orange-400 uppercase tracking-wide font-bold">Wyposażenie</p>
                <p className="text-white font-bold mt-1 text-sm">{equipmentLabels[plan.equipmentRequired] || plan.equipmentRequired}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-2 border-b border-white/10">
          {          [
            { id: 'overview', label: 'Przegląd', icon: <IconKit.Document size="sm" /> },
            { id: 'schedule', label: 'Harmonogram', icon: <IconKit.Calendar size="sm" /> },
            { id: 'stats', label: 'Statystyki', icon: <IconKit.ChartBar size="sm" /> },
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

        {/* Tab Content */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-white mb-6">Plan treningowy</h2>
                
                {/* Statystyki planu */}
                <div className="grid gap-4 sm:grid-cols-3 mb-8">
                  <div className="rounded-xl bg-emerald-400/10 border border-emerald-400/20 p-4">
                    <p className="text-sm text-emerald-300">Liczba dni</p>
                    <p className="mt-1 text-3xl font-bold text-white">{plan.days?.length || 0}</p>
                  </div>
                  <div className="rounded-xl bg-blue-400/10 border border-blue-400/20 p-4">
                    <p className="text-sm text-blue-300">Łączna liczba ćwiczeń</p>
                    <p className="mt-1 text-3xl font-bold text-white">{totalExercises}</p>
                  </div>
                  <div className="rounded-xl bg-purple-400/10 border border-purple-400/20 p-4">
                    <p className="text-sm text-purple-300">Średnio ćwiczeń/dzień</p>
                    <p className="mt-1 text-3xl font-bold text-white">{avgExercisesPerDay}</p>
                  </div>
                </div>

                {/* Dni treningowe */}
                {Array.isArray((isEditing ? editedPlan : plan).days) && (isEditing ? editedPlan : plan).days.length > 0 ? (
                  <div className="space-y-6">
                    {(isEditing ? editedPlan : plan).days.map((day, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 hover:border-emerald-400/40 transition-all"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-white flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-400 text-sm font-bold">
                              {idx + 1}
                            </span>
                            {day.title || day.name || `Dzień ${idx + 1}`}
                          </h3>
                          {day.dayOfWeek && (
                            <span className="text-sm text-gray-400">{day.dayOfWeek}</span>
                          )}
                        </div>
                        
                        {Array.isArray(day.exercises) && day.exercises.length > 0 ? (
                          <div className="space-y-3">
                            {day.exercises.map((ex, exIdx) => (
                              <div
                                key={exIdx}
                                className="flex items-start gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors group"
                              >
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400 text-sm font-mono flex-shrink-0">
                                  {exIdx + 1}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-start justify-between gap-3">
                                    <h4 className="font-semibold text-white mb-2 group-hover:text-emerald-300 transition-colors flex-1">
                                      {ex.name || ex.exercise_name || 'Ćwiczenie'}
                                    </h4>
                                    {isEditing && (
                                      <div className="flex items-center gap-2">
                                        <ReplaceButton
                                          onClick={() => openReplaceModal(idx, exIdx)}
                                        />
                                        <DeleteButton
                                          onClick={() => removeExercise(idx, exIdx)}
                                        />
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Szczegóły ćwiczenia */}
                                  {isEditing ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                                      <div>
                                        <label className="block text-xs text-gray-400 mb-1">Serie</label>
                                        <input
                                          type="text"
                                          value={ex.target_sets || ex.targetSets || ex.sets || ''}
                                          onChange={(e) => updateExercise(idx, exIdx, 'target_sets', e.target.value)}
                                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-400/50"
                                          placeholder="3-4"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-gray-400 mb-1">Powtórzenia</label>
                                        <input
                                          type="text"
                                          value={ex.target_reps || ex.targetReps || ex.reps || ''}
                                          onChange={(e) => updateExercise(idx, exIdx, 'target_reps', e.target.value)}
                                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-400/50"
                                          placeholder="8-12"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-gray-400 mb-1">Odpoczynek (s)</label>
                                        <input
                                          type="number"
                                          value={ex.rest_seconds || ex.restSeconds || ''}
                                          onChange={(e) => updateExercise(idx, exIdx, 'rest_seconds', parseInt(e.target.value) || 0)}
                                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-400/50"
                                          placeholder="60"
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex flex-wrap gap-4 text-sm">
                                      {ex.sets && (
                                        <div className="flex items-center gap-1">
                                          <span className="text-gray-400">Serie:</span>
                                          <span className="text-emerald-400 font-bold">{ex.sets}</span>
                                        </div>
                                      )}
                                      {ex.reps && (
                                        <div className="flex items-center gap-1">
                                          <span className="text-gray-400">Powtórzenia:</span>
                                          <span className="text-emerald-400 font-bold">{ex.reps}</span>
                                        </div>
                                      )}
                                      {ex.rest_seconds && (
                                        <div className="flex items-center gap-1">
                                          <span className="text-gray-400">Odpoczynek:</span>
                                          <span className="text-blue-400 font-bold">{ex.rest_seconds}s</span>
                                        </div>
                                      )}
                                      {ex.superset_group && (
                                        <div className="flex items-center gap-1">
                                          <span className="text-purple-400 text-xs font-bold uppercase">
                                            Superset {ex.superset_group}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Grupa mięśniowa */}
                                  {ex.muscle_group && (
                                    <div className="mt-2">
                                      <span className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-2 py-1 text-xs text-gray-400">
                                        <IconKit.Muscle size="xs" /> {ex.muscle_group}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Notatki */}
                                  {ex.notes && (
                                    <p className="mt-2 text-sm text-gray-500 italic border-l-2 border-white/10 pl-3">
                                      {ex.notes}
                                    </p>
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
                    <p className="text-gray-400">Brak szczegółowego planu treningowego</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-3">Harmonogram tygodniowy</h2>
                <p className="text-gray-300">
                  Wybierz {plan.trainingDaysPerWeek} {plan.trainingDaysPerWeek === 1 ? 'dzień' : plan.trainingDaysPerWeek < 5 ? 'dni' : 'dni'} treningowych w tygodniu. Kliknij na dzień aby dodać lub usunąć go z harmonogramu.
                </p>
              </div>
              
              <div className="grid gap-3">
                {weekDays.map((day) => {
                  const isTrainingDay = schedule.includes(day);
                  return (
                    <div
                      key={day}
                      className={[
                        'flex items-center justify-between rounded-xl border p-4 transition-all cursor-pointer',
                        isTrainingDay
                          ? 'border-emerald-400/40 bg-emerald-400/10 hover:bg-emerald-400/15'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                      ].join(' ')}
                      onClick={() => {
                        if (isTrainingDay) {
                          setSchedule(schedule.filter(d => d !== day));
                        } else {
                          if (schedule.length < plan.trainingDaysPerWeek) {
                            setSchedule([...schedule, day]);
                          } else {
                            notify.warning(`Możesz wybrać maksymalnie ${plan.trainingDaysPerWeek} ${plan.trainingDaysPerWeek === 1 ? 'dzień' : 'dni'}.`);
                          }
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={[
                          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                          isTrainingDay ? 'bg-emerald-400 text-black' : 'bg-white/5 text-gray-500'
                        ].join(' ')}>
                          {day.charAt(0)}
                        </div>
                        <span className="font-semibold text-white">{day}</span>
                      </div>
                      {isTrainingDay ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-medium text-emerald-300">
                          <IconKit.Dumbbell size="xs" /> Trening {schedule.indexOf(day) + 1}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">
                          {schedule.length >= plan.trainingDaysPerWeek 
                            ? `Max ${plan.trainingDaysPerWeek} ${plan.trainingDaysPerWeek === 1 ? 'dzień' : 'dni'}` 
                            : 'Kliknij aby dodać'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Podsumowanie wybranych dni */}
              <div className="rounded-2xl bg-emerald-400/10 border border-emerald-400/20 p-6">
                <div className="flex items-start gap-3">
                  <IconKit.Calendar size="xl" className="text-emerald-400" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-2">Wybrane dni treningowe</h4>
                    {schedule.length > 0 ? (
                      <p className="text-sm text-gray-300">
                        <span className="font-medium text-emerald-300">{schedule.length}/{plan.trainingDaysPerWeek}</span> {schedule.length === 1 ? 'dzień' : 'dni'}: {schedule.join(', ')}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">Nie wybrano jeszcze żadnych dni</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Powiadomienia */}
              <div className="rounded-2xl bg-blue-400/10 border border-blue-400/20 p-6">
                <div className="flex items-start gap-3">
                  <IconKit.Bell size="xl" className="text-blue-400" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-3">Powiadomienia</h4>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={notificationsEnabled}
                        onChange={(e) => setNotificationsEnabled(e.target.checked)}
                        className="w-5 h-5 rounded border-2 border-blue-400/40 bg-white/5 checked:bg-blue-400 checked:border-blue-400 transition-colors cursor-pointer"
                      />
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                        Przypomnij mi o treningach
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-2 ml-8">
                      Otrzymasz powiadomienie w dni treningowe
                    </p>
                  </div>
                </div>
              </div>

              {/* Przycisk zapisz */}
              <div className="flex gap-3">
                <PrimaryButton onClick={saveSchedule} className="flex-1">
                  <IconKit.Document size="sm" className="inline" /> Zapisz harmonogram
                </PrimaryButton>
                <SecondaryButton onClick={() => setSchedule(generateSchedule(plan.trainingDaysPerWeek))}>
                  <IconKit.Copy size="sm" className="inline" /> Resetuj
                </SecondaryButton>
              </div>

              <div className="rounded-2xl bg-purple-400/10 border border-purple-400/20 p-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Wskazówka</h4>
                    <p className="text-sm text-gray-300">
                      Staraj się rozkładać dni treningowe równomiernie w tygodniu, zachowując przynajmniej jeden dzień przerwy między treningami. 
                      Np. dla 3 dni: Poniedziałek, Środa, Piątek.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white mb-6">Statystyki planu</h2>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Struktura planu</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02]">
                      <span className="text-gray-400">Łączna liczba dni</span>
                      <span className="text-white font-bold">{plan.days?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02]">
                      <span className="text-gray-400">Łączna liczba ćwiczeń</span>
                      <span className="text-white font-bold">{totalExercises}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02]">
                      <span className="text-gray-400">Średnio ćwiczeń/dzień</span>
                      <span className="text-white font-bold">{avgExercisesPerDay}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02]">
                      <span className="text-gray-400">Dni treningowe/tydzień</span>
                      <span className="text-white font-bold">{plan.trainingDaysPerWeek}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Wymagania</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Poziom trudności</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
                            style={{ 
                              width: plan.difficultyLevel === 'poczatkujacy' ? '33%' : 
                                     plan.difficultyLevel === 'sredniozaawansowany' ? '66%' : '100%'
                            }}
                          />
                        </div>
                        <span className="text-sm text-white font-semibold">
                          {levelLabels[plan.difficultyLevel] || plan.difficultyLevel}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Wymagane wyposażenie</p>
                      <p className="text-white font-semibold">{equipmentLabels[plan.equipmentRequired] || plan.equipmentRequired}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Cel treningowy</p>
                      <p className="text-white font-semibold">{goalLabels[plan.goalType] || plan.goalType}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dodatkowe informacje */}
              <div className="rounded-2xl bg-gradient-to-r from-emerald-400/10 to-teal-400/10 border border-emerald-400/20 p-6">
                <h3 className="text-lg font-bold text-white mb-3">💡 Dla kogo ten plan?</h3>
                <p className="text-gray-300">
                  Ten plan jest idealny dla osób na poziomie <strong className="text-white">{levelLabels[plan.difficultyLevel] || plan.difficultyLevel}</strong>, 
                  których celem jest <strong className="text-white">{goalLabels[plan.goalType] || plan.goalType}</strong>.
                  {plan.trainingDaysPerWeek <= 3 && ' Niska częstotliwość treningów sprawia, że plan jest łatwy do zintegrowania z napiętym harmonogramem.'}
                  {plan.trainingDaysPerWeek >= 5 && ' Wysoka częstotliwość treningów zapewnia optymalne rezultaty dla osób z doświadczeniem.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal zamiany ćwiczenia */}
      {replaceModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-gradient-to-b from-[#1a1a1a] to-black border border-white/10 p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Zamień ćwiczenie</h2>
                <p className="text-gray-400">
                  Aktualne: <span className="text-emerald-300 font-medium">{replaceModal.currentExercise?.name}</span>
                </p>
              </div>
              <button
                onClick={() => setReplaceModal({ open: false, dayIndex: null, exerciseIndex: null, currentExercise: null })}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <IconKit.Search size="sm" /> Szukaj
                </label>
                <input
                  type="text"
                  value={exerciseFilters.search}
                  onChange={(e) => {
                    setExerciseFilters(prev => ({ ...prev, search: e.target.value }));
                    fetchExercises();
                  }}
                  placeholder="Wpisz nazwę ćwiczenia..."
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <IconKit.Muscle size="sm" /> Partia mięśniowa
                </label>
                <div className="relative">
                  <select
                    value={exerciseFilters.muscle_group}
                    onChange={(e) => {
                      setExerciseFilters(prev => ({ ...prev, muscle_group: e.target.value }));
                      fetchExercises();
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all appearance-none cursor-pointer pr-10"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5 7.5l5 5 5-5' stroke='%2310B981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.75rem center',
                      backgroundSize: '1.25rem'
                    }}
                  >
                    <option value="" className="bg-gray-900 text-white">Wszystkie partie</option>
                    <option value="klatka" className="bg-gray-900 text-white">💪 Klatka piersiowa</option>
                    <option value="plecy" className="bg-gray-900 text-white">🦾 Plecy</option>
                    <option value="nogi" className="bg-gray-900 text-white">🦵 Nogi</option>
                    <option value="ramiona" className="bg-gray-900 text-white">💪 Ramiona</option>
                    <option value="brzuch" className="bg-gray-900 text-white">🔥 Brzuch</option>
                    <option value="barki" className="bg-gray-900 text-white">🏋️ Barki</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Exercise List */}
            {exercisesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-400/30 border-t-emerald-400"></div>
              </div>
            ) : exercises.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Brak ćwiczeń do wyświetlenia</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
                {exercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => replaceExercise(exercise)}
                    className="text-left rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-400/50 transition-all p-4 group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
                        {exercise.name}
                      </h4>
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-400/10 text-emerald-300">
                        {exercise.muscle_group}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2 mb-3">
                      {exercise.description || 'Brak opisu'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {exercise.type && (
                        <span className="px-2 py-0.5 rounded bg-white/5">{exercise.type}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal oceny planu */}
      <RatePlanModal 
        isOpen={showRatePlanModal}
        onClose={() => setShowRatePlanModal(false)}
        planName={plan?.name || 'Twój plan'}
        onRated={() => {
          setShowRatePlanModal(false);
          fetchPlanRating(); // Odśwież ocenę
        }}
      />
    </div>
  );
}

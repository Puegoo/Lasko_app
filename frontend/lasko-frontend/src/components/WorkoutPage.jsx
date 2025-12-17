import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import apiService from '../services/api';
import RatePlanModal from './RatePlanModal';
import ExerciseFeedbackModal from './ExerciseFeedbackModal';
import IconKit from './ui/IconKit';

// ---------- UI Components ----------
const GradientGridBg = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
    <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-[#1DCD9F]/10 blur-3xl" />
    <div className="absolute top-1/3 -right-20 w-96 h-96 rounded-full bg-[#0D7A61]/10 blur-3xl" />
  </div>
);

const PrimaryButton = ({ onClick, children, className = '', disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
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
  </button>
);

const SecondaryButton = ({ onClick, children, className = '' }) => (
  <button
    onClick={onClick}
    className={[
      'inline-flex items-center justify-center rounded-full border-2 border-emerald-400/60 px-7 py-3 text-sm font-bold text-emerald-300',
      'hover:bg-emerald-400/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60',
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

// ---------- Timer Component ----------
const RestTimer = ({ seconds, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    setTimeLeft(seconds);
    setIsRunning(true);
  }, [seconds]);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) {
      if (timeLeft <= 0 && onComplete) {
        onComplete();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeLeft, onComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const progress = ((seconds - timeLeft) / seconds) * 100;

  return (
    <div className="rounded-2xl bg-blue-400/10 border border-blue-400/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <IconKit.Clock size="md" /> Odpoczynek
        </h3>
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="px-3 py-1 rounded-lg bg-blue-400/20 text-blue-300 text-sm font-medium hover:bg-blue-400/30 transition-colors"
        >
          {isRunning ? '⏸️ Pauza' : '▶️ Wznów'}
        </button>
      </div>
      
      <div className="text-center mb-4">
        <div className="text-5xl font-black text-blue-300 font-mono">
          {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </div>
      </div>

      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>

      {timeLeft === 0 && (
        <p className="mt-3 text-center text-emerald-300 font-medium animate-pulse">
          ✅ Czas minął! Następna seria
        </p>
      )}
    </div>
  );
};

// ---------- Main Component ----------
export default function WorkoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const notify = useNotification();
  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [loggedSets, setLoggedSets] = useState({}); // { exerciseId: [{ weight, reps, completed }] }
  const [sessionId, setSessionId] = useState(null);
  const [showTimer, setShowTimer] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [sessionStartTime] = useState(new Date());
  const [allPlanDays, setAllPlanDays] = useState([]); // Wszystkie dni z planu
  const [isRestDay, setIsRestDay] = useState(false); // Czy dziś jest dzień odpoczynku
  const [showDaySelector, setShowDaySelector] = useState(false); // Pokazuj selektor dni
  const [showRatePlanModal, setShowRatePlanModal] = useState(false); // Modal oceny planu
  const [showExerciseFeedbackModal, setShowExerciseFeedbackModal] = useState(false); // Modal feedbacku ćwiczenia
  const [feedbackExercise, setFeedbackExercise] = useState(null); // Ćwiczenie do feedbacku
  const [showJournalModal, setShowJournalModal] = useState(false); // Modal notatki treningowej
  const [journalNote, setJournalNote] = useState('');

  useEffect(() => {
    fetchTodayWorkout();
    checkActiveSession();
  }, []);

  const checkActiveSession = async () => {
    try {
      const response = await apiService.request('/api/workouts/active-session/');
      if (response.has_active_session && response.session_id) {
        setSessionId(response.session_id);
      }
    } catch (error) {
      console.error('[WorkoutPage] Error checking active session:', error);
    }
  };

  const fetchTodayWorkout = async () => {
    try {
      setLoading(true);
      const response = await apiService.request('/api/workouts/today/');
      
      if (response.workout) {
        setWorkout(response.workout);
        setIsRestDay(false);
        setShowDaySelector(false);
        // Inicjalizuj puste serie dla każdego ćwiczenia
        const initialSets = {};
        response.workout.exercises?.forEach(ex => {
          const targetSets = parseInt(ex.target_sets || ex.targetSets || 3);
          initialSets[ex.id] = Array(targetSets).fill(null).map(() => ({
            weight: '',
            reps: '',
            completed: false
          }));
        });
        setLoggedSets(initialSets);
      } else {
        // Brak treningu na dziś - pobierz wszystkie dni z planu
        setIsRestDay(true);
        await fetchAllPlanDays();
      }
    } catch (error) {
      console.error('[WorkoutPage] Error fetching workout:', error);
      notify.error('Nie udało się pobrać dzisiejszego treningu');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPlanDays = async () => {
    try {
      // Pobierz aktywny plan użytkownika
      const activePlanResponse = await apiService.request('/api/recommendations/active-plan/');
      
      if (activePlanResponse.has_active_plan && activePlanResponse.plan) {
        const planId = activePlanResponse.plan.planId || activePlanResponse.plan.id;
        const isCustomPlan = activePlanResponse.plan.isCustomPlan || activePlanResponse.plan.is_custom_plan || false;
        const customPlanId = activePlanResponse.plan.customPlanId || activePlanResponse.plan.custom_plan_id;
        
        // Pobierz szczegóły planu
        const { RecommendationService } = await import('../services/recommendationService');
        const recApi = new RecommendationService();
        
        let planDetails;
        if (isCustomPlan && customPlanId) {
          // Dla custom plans użyj getCustomPlan
          planDetails = await recApi.getCustomPlan(customPlanId);
        } else {
          // Dla standardowych planów użyj getPlanDetailed
          planDetails = await recApi.getPlanDetailed(planId);
        }
        
        const plan = planDetails.plan || planDetails;
        if (plan.days && Array.isArray(plan.days)) {
          setAllPlanDays(plan.days);
        }
      }
    } catch (error) {
      console.error('[WorkoutPage] Error fetching plan days:', error);
    }
  };

  const selectWorkoutDay = async (dayIndex) => {
    const selectedDay = allPlanDays[dayIndex];
    if (!selectedDay) return;

    // Stwórz workout z wybranego dnia
    const activePlanResponse = await apiService.request('/api/recommendations/active-plan/');
    const planId = activePlanResponse.plan?.planId || activePlanResponse.plan?.id;
    const planName = activePlanResponse.plan?.name || 'Plan treningowy';

    setWorkout({
      plan_id: planId,
      plan_name: planName,
      day_id: selectedDay.id,
      name: selectedDay.title || selectedDay.name || `Dzień ${dayIndex + 1}`,
      day_order: selectedDay.day_order || dayIndex + 1,
      weekday: 'Trening zastępczy',
      exercises: selectedDay.exercises || []
    });

    // Inicjalizuj puste serie
    const initialSets = {};
    (selectedDay.exercises || []).forEach(ex => {
      const targetSets = parseInt(ex.target_sets || ex.targetSets || ex.sets || 3);
      initialSets[ex.id] = Array(targetSets).fill(null).map(() => ({
        weight: '',
        reps: '',
        completed: false
      }));
    });
    setLoggedSets(initialSets);
    setIsRestDay(false);
    setShowDaySelector(false);
    setCurrentExerciseIndex(0);
  };

  const startSession = async () => {
    try {
      const response = await apiService.request('/api/workouts/sessions/', {
        method: 'POST',
        body: JSON.stringify({
          plan_id: workout.plan_id,
          plan_day_id: workout.day_id
        })
      });
      
      if (response.session_id) {
        setSessionId(response.session_id);
      }
    } catch (error) {
      console.error('[WorkoutPage] Error starting session:', error);
    }
  };

  const logSet = (exerciseId, setIndex, field, value) => {
    setLoggedSets(prev => {
      const newSets = { ...prev };
      if (!newSets[exerciseId]) {
        newSets[exerciseId] = [];
      }
      if (!newSets[exerciseId][setIndex]) {
        newSets[exerciseId][setIndex] = { weight: '', reps: '', completed: false };
      }
      newSets[exerciseId][setIndex][field] = value;
      return newSets;
    });
  };

  const completeSet = async (exerciseId, setIndex) => {
    const set = loggedSets[exerciseId]?.[setIndex];
    if (!set || !set.weight || !set.reps) {
      notify.warning('Wprowadź ciężar i powtórzenia');
      return;
    }

    // Jeśli to pierwsza seria, rozpocznij sesję
    if (!sessionId) {
      await startSession();
    }

    // Oznacz serię jako wykonaną
    setLoggedSets(prev => {
      const newSets = { ...prev };
      newSets[exerciseId][setIndex].completed = true;
      return newSets;
    });

    // Sprawdź czy to nowy rekord osobisty (PR)
    try {
      const prResponse = await apiService.request('/api/progress/personal-records/check/', {
        method: 'POST',
        body: JSON.stringify({
          exercise_id: exerciseId,
          reps: parseInt(set.reps),
          weight_kg: parseFloat(set.weight)
        })
      });

      if (prResponse.is_pr) {
        const exercise = workout.exercises.find(ex => ex.id === exerciseId);
        notify.success(`🏆 NOWY REKORD OSOBISTY! ${exercise?.name || 'Ćwiczenie'}: ${set.weight}kg × ${set.reps} powtórzeń`, 8000);
      }
    } catch (error) {
      console.error('[WorkoutPage] Error checking PR:', error);
      // Nie przerywaj treningu jeśli sprawdzenie PR się nie powiodło
    }

    // Pokaż timer odpoczynku
    const exercise = workout.exercises.find(ex => ex.id === exerciseId);
    if (exercise && exercise.rest_seconds) {
      setTimerSeconds(exercise.rest_seconds);
      setShowTimer(true);
    }
  };

  const saveJournalNote = async () => {
    // Zapisz notatkę jeśli coś wpisano
    if (journalNote.trim()) {
      try {
        await apiService.request('/api/journal/notes/add/', {
          method: 'POST',
          body: JSON.stringify({
            content: journalNote.trim()
          })
        });
        notify.success('Notatka została zapisana!');
      } catch (error) {
        console.error('[WorkoutPage] Error saving journal note:', error);
        // Nie pokazujemy błędu - notatka nie jest krytyczna
      }
    }

    // Zamknij modal notatki
    setShowJournalModal(false);

    // Sprawdź czy użytkownik powinien ocenić plan
    try {
      const checkResponse = await apiService.request('/api/feedback/check-plan-completion/');
      if (checkResponse.should_rate) {
        // Pokaż modal oceny
        setTimeout(() => setShowRatePlanModal(true), 300);
      } else {
        // Przekieruj do dashboard
        setTimeout(() => navigate('/dashboard'), 500);
      }
    } catch (err) {
      // Jeśli sprawdzenie się nie powiodło, po prostu przekieruj
      setTimeout(() => navigate('/dashboard'), 500);
    }
  };

  const skipJournalNote = () => {
    setShowJournalModal(false);
    
    // Sprawdź czy użytkownik powinien ocenić plan
    setTimeout(async () => {
      try {
        const checkResponse = await apiService.request('/api/feedback/check-plan-completion/');
        if (checkResponse.should_rate) {
          setShowRatePlanModal(true);
        } else {
          navigate('/dashboard');
        }
      } catch (err) {
        navigate('/dashboard');
      }
    }, 300);
  };

  const finishWorkout = async () => {
    if (!sessionId) {
      notify.warning('Nie rozpoczęto sesji treningowej');
      return;
    }

    try {
      const duration = Math.floor((new Date() - sessionStartTime) / 1000 / 60); // minutes
      
      // Zapisz wszystkie serie
      const allSets = [];
      Object.entries(loggedSets).forEach(([exerciseId, sets]) => {
        sets.forEach((set, index) => {
          if (set.completed) {
            allSets.push({
              exercise_id: exerciseId,
              set_order: index + 1,
              weight_kg: parseFloat(set.weight),
              reps: parseInt(set.reps)
            });
          }
        });
      });

      await apiService.request(`/api/workouts/sessions/${sessionId}/finish/`, {
        method: 'POST',
        body: JSON.stringify({
          duration_minutes: duration,
          sets: allSets
        })
      });

      notify.success('🎉 Trening zakończony! Świetna robota!');
      
      // Oznacz że sesja została zakończona (dla DashboardPage)
      localStorage.setItem('workout_finished', 'true');
      
      // Pokaż modal notatki treningowej
      setTimeout(() => setShowJournalModal(true), 500);
    } catch (error) {
      console.error('[WorkoutPage] Error finishing workout:', error);
      notify.error('Nie udało się zakończyć treningu');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Ekran wyboru treningu zastępczego (gdy dziś jest dzień odpoczynku)
  if (isRestDay || (!workout && allPlanDays.length > 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black">
        <GradientGridBg />
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center mb-8">
            <IconKit.Calendar size="2xl" className="text-emerald-400 mx-auto mb-6" />
            <h1 className="text-4xl font-black text-white mb-4">Trening zastępczy</h1>
            <p className="text-gray-400 mb-8">
              Dzisiaj to dzień odpoczynku, ale możesz wybrać trening zastępczy z Twojego planu.
            </p>
          </div>

          {/* Lista dni do wyboru */}
          <div className="grid gap-4 mb-8">
            {allPlanDays.map((day, index) => (
              <button
                key={day.id || index}
                onClick={() => selectWorkoutDay(index)}
                className="relative p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-400/50 hover:bg-white/10 transition-all duration-300 text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-400 font-bold">
                        {day.day_order || index + 1}
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        {day.title || day.name || `Dzień ${index + 1}`}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">
                      {day.exercises?.length || 0} ćwiczeń • 
                      {day.exercises?.reduce((sum, ex) => sum + parseInt(ex.target_sets || ex.sets || 3), 0) || 0} serii
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(day.exercises || []).slice(0, 3).map((ex, i) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-white/5 text-xs text-gray-300">
                          {ex.name}
                        </span>
                      ))}
                      {day.exercises?.length > 3 && (
                        <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-gray-400">
                          +{day.exercises.length - 3} więcej
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex items-center text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-2xl">→</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-center">
            <SecondaryButton onClick={() => navigate('/dashboard')}>
              ← Wróć do Dashboard
            </SecondaryButton>
          </div>
        </div>
      </div>
    );
  }

  // Ekran gdy nie ma aktywnego planu
  if (!workout || !workout.exercises || workout.exercises.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black">
        <GradientGridBg />
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="text-6xl mb-6">😴</div>
            <h1 className="text-4xl font-black text-white mb-4">Brak aktywnego planu</h1>
            <p className="text-gray-400 mb-8">
              Aby rozpocząć trening, najpierw aktywuj plan treningowy.
            </p>
            <SecondaryButton onClick={() => navigate('/dashboard')}>
              ← Wróć do Dashboard
            </SecondaryButton>
          </div>
        </div>
      </div>
    );
  }

  const currentExercise = workout.exercises[currentExerciseIndex];
  const currentSets = loggedSets[currentExercise?.id] || [];
  const completedSets = currentSets.filter(s => s.completed).length;
  const totalSets = currentSets.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black">
      <GradientGridBg />
      
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 19l-7-7 7-7" />
            </svg>
            Wróć
          </button>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              {workout.weekday === 'Trening zastępczy' && (
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-medium mb-2">
                  <IconKit.Calendar size="xs" /> Trening zastępczy
                </div>
              )}
              <h1 className="text-4xl font-black text-white mb-2">
                {workout.name || 'Dzisiejszy trening'}
              </h1>
              <p className="text-gray-400">
                Ćwiczenie {currentExerciseIndex + 1} z {workout.exercises.length}
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold text-emerald-400">
                {completedSets}/{totalSets}
              </div>
              <div className="text-sm text-gray-400">serie</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-300"
              style={{ width: `${(currentExerciseIndex / workout.exercises.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Exercise */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {currentExercise.name}
              </h2>
              {currentExercise.muscle_group && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 text-sm text-emerald-300">
                  <IconKit.Muscle size="sm" /> {currentExercise.muscle_group}
                </span>
              )}
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-400">Cel</div>
              <div className="text-xl font-bold text-white">
                {currentExercise.target_sets || 3} × {currentExercise.target_reps || '10'}
              </div>
            </div>
          </div>

          {/* Sets logging */}
          <div className="space-y-3">
            {currentSets.map((set, index) => (
              <div
                key={index}
                className={[
                  'flex items-center gap-4 p-4 rounded-xl border transition-all',
                  set.completed
                    ? 'border-emerald-400/40 bg-emerald-400/10'
                    : 'border-white/10 bg-white/[0.02]'
                ].join(' ')}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-400 font-bold flex-shrink-0">
                  {index + 1}
                </div>
                
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Ciężar (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={set.weight}
                      onChange={(e) => logSet(currentExercise.id, index, 'weight', e.target.value)}
                      disabled={set.completed}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-400/50 disabled:opacity-50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Powtórzenia</label>
                    <input
                      type="number"
                      value={set.reps}
                      onChange={(e) => logSet(currentExercise.id, index, 'reps', e.target.value)}
                      disabled={set.completed}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-400/50 disabled:opacity-50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                      placeholder="0"
                    />
                  </div>
                </div>

                {set.completed ? (
                  <div className="flex items-center gap-2 text-emerald-300 text-sm font-medium">
                    ✓ Gotowe
                  </div>
                ) : (
                  <button
                    onClick={() => completeSet(currentExercise.id, index)}
                    className="px-4 py-2 rounded-lg bg-emerald-400 text-black font-bold hover:bg-emerald-300 transition-colors"
                  >
                    ✓
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Rest Timer */}
        {showTimer && (
          <RestTimer
            seconds={timerSeconds}
            onComplete={() => setShowTimer(false)}
          />
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          {currentExerciseIndex > 0 && (
            <SecondaryButton onClick={() => setCurrentExerciseIndex(prev => prev - 1)}>
              ← Poprzednie
            </SecondaryButton>
          )}
          
          {currentExerciseIndex < workout.exercises.length - 1 ? (
            <PrimaryButton
              onClick={() => setCurrentExerciseIndex(prev => prev + 1)}
              className="flex-1"
            >
              Następne ćwiczenie →
            </PrimaryButton>
          ) : (
            <PrimaryButton
              onClick={finishWorkout}
              className="flex-1"
            >
              <IconKit.Trophy size="sm" className="inline" /> Zakończ trening
            </PrimaryButton>
          )}
        </div>

        {/* Przycisk feedbacku dla ćwiczenia (opcjonalny - po zakończeniu wszystkich serii) */}
        {completedSets === totalSets && totalSets > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setFeedbackExercise(currentExercise);
                setShowExerciseFeedbackModal(true);
              }}
              className="text-sm text-gray-400 hover:text-emerald-400 transition-colors"
            >
              💭 Dodaj feedback dla tego ćwiczenia
            </button>
          </div>
        )}
      </div>

      {/* Modale */}
      {/* Journal Note Modal */}
      {showJournalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowJournalModal(false)}>
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0b0b0b] p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Jak minął trening?</h3>
                <p className="text-gray-400 text-sm">
                  Dodaj notatkę o treningu - jak się czułeś, co chcesz poprawić, co poszło dobrze
                </p>
              </div>
              <button
                onClick={() => setShowJournalModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <textarea
              value={journalNote}
              onChange={(e) => setJournalNote(e.target.value)}
              placeholder="Np. Świetny trening! Udało mi się podnieść więcej na wyciskaniu. Czuję się zmęczony, ale zadowolony. #PR #motywacja"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 resize-none mb-4"
              rows="6"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={skipJournalNote}
                className="flex-1 rounded-lg border-2 border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200"
              >
                Pomiń
              </button>
              <button
                onClick={saveJournalNote}
                className="flex-1 rounded-lg border-2 border-emerald-400/60 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-4 py-3 text-sm font-semibold text-emerald-300 hover:from-emerald-500/30 hover:to-teal-500/30 hover:border-emerald-400 transition-all duration-200"
              >
                Zapisz notatkę
              </button>
            </div>
          </div>
        </div>
      )}

      <RatePlanModal 
        isOpen={showRatePlanModal}
        onClose={() => {
          setShowRatePlanModal(false);
          navigate('/dashboard');
        }}
        planName={workout?.plan_name || 'Twój plan'}
        onRated={() => {
          setShowRatePlanModal(false);
          navigate('/dashboard');
        }}
      />

      <ExerciseFeedbackModal 
        isOpen={showExerciseFeedbackModal}
        onClose={() => {
          setShowExerciseFeedbackModal(false);
          setFeedbackExercise(null);
        }}
        exercise={feedbackExercise}
        onSubmitted={() => {
          setShowExerciseFeedbackModal(false);
          setFeedbackExercise(null);
        }}
      />
    </div>
  );
}


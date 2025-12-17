// frontend/lasko-frontend/src/components/exercises/ExerciseRecommendations.jsx
import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { RecommendationService } from '../../services/recommendationService';

const RecommendationServiceInstance = new RecommendationService();

// ---------- UI helpers (zgodne ze stylem EnhancedPlanCreator) ----------
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

const PrimaryButton = ({ onClick, children, disabled, className = '' }) => (
  <button
    type="button"
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

const SecondaryButton = ({ onClick, children, disabled, className = '' }) => (
  <button
    type="button"
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

const OptionCard = ({ active, onClick, children, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      'relative rounded-2xl border-2 p-6 text-left transition-all',
      active
        ? 'border-emerald-400 bg-emerald-400/10 shadow-lg shadow-emerald-400/20'
        : 'border-white/10 bg-white/[0.04] hover:border-emerald-400/40 hover:bg-white/[0.06]',
      className,
    ].join(' ')}
  >
    {active && (
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 ring-1 ring-emerald-400/30 transition-opacity group-hover:opacity-100" />
    )}
    {children}
  </button>
);

export default function ExerciseRecommendations({ preferences, onExercisesSelected, onBack }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null); // 🆕 Tylko jedno ćwiczenie na raz
  const [currentDay, setCurrentDay] = useState(0); // 🆕 Aktualny dzień (0-indexed)
  const [planStructure, setPlanStructure] = useState([]); // 🆕 Struktura planu z wybranymi ćwiczeniami
  const scrollPositionRef = useRef(0); // 🆕 Zapamiętaj pozycję scroll

  // 🆕 Oblicz liczbę ćwiczeń na dzień na podstawie czasu treningu
  const calculateExercisesPerDay = (timePerSession) => {
    if (!timePerSession) return 4; // Domyślnie 4 ćwiczenia
    
    // Założenie: każde ćwiczenie zajmuje ~12-15 minut (serie + przerwy)
    // 60 min = 4 ćwiczenia, 45 min = 3 ćwiczenia, 90 min = 6 ćwiczeń
    const minutesPerExercise = 15;
    const calculated = Math.floor(timePerSession / minutesPerExercise);
    return Math.max(2, Math.min(calculated, 8)); // Min 2, max 8 ćwiczeń
  };

  // 🆕 Oblicz liczbę dni na podstawie preferencji
  const daysCount = preferences?.training_days_per_week || 3;
  const exercisesPerDay = calculateExercisesPerDay(preferences?.time_per_session);

  // 🆕 Inicjalizuj strukturę planu
  useEffect(() => {
    const initialDays = Array.from({ length: daysCount }, (_, idx) => ({
      id: `day-${idx}`,
      name: `Dzień ${idx + 1}`,
      day_order: idx + 1,
      exercises: []
    }));
    setPlanStructure(initialDays);
  }, [daysCount]);

  useEffect(() => {
    loadExercises();
  }, [preferences, planStructure, currentDay]); // 🆕 Dodaj planStructure i currentDay jako zależności

  const loadExercises = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 🆕 Zbierz informacje o już wybranych ćwiczeniach i partiach mięśniowych
      const selectedExerciseIds = [];
      const currentDayMuscleGroups = [];
      const weekMuscleGroups = [];
      
      // Ćwiczenia już wybrane w całym planie
      planStructure.forEach(day => {
        day.exercises.forEach(ex => {
          if (ex.exercise_id) {
            selectedExerciseIds.push({ exercise_id: ex.exercise_id });
          }
          if (ex.muscle_group) {
            weekMuscleGroups.push(ex.muscle_group);
          }
        });
      });
      
      // Partie mięśniowe w aktualnym dniu
      if (planStructure[currentDay]) {
        planStructure[currentDay].exercises.forEach(ex => {
          if (ex.muscle_group && !currentDayMuscleGroups.includes(ex.muscle_group)) {
            currentDayMuscleGroups.push(ex.muscle_group);
          }
        });
      }
      
      // Usuń duplikaty z weekMuscleGroups
      const uniqueWeekMuscleGroups = [...new Set(weekMuscleGroups)];
      
      const response = await RecommendationServiceInstance.getRecommendedExercises({
        preferences,
        limit: 50, // 🆕 Zmniejszono do 50 (pokazujemy tylko TOP 3)
        selected_exercises: selectedExerciseIds,
        current_day_muscle_groups: currentDayMuscleGroups,
        week_muscle_groups: uniqueWeekMuscleGroups,
      });
      
      if (response.success && response.exercises) {
        setExercises(response.exercises);
      } else {
        setError('Nie udało się pobrać rekomendacji ćwiczeń.');
      }
    } catch (err) {
      console.error('Error loading exercises:', err);
      setError(err.message || 'Nie udało się pobrać rekomendacji ćwiczeń.');
    } finally {
      setLoading(false);
    }
  };

  // 🆕 TOP 3 najlepiej dopasowane ćwiczenia (dla aktualnego dnia)
  const top3Exercises = useMemo(() => {
    // Filtruj ćwiczenia które już są w planie
    const usedExerciseIds = new Set();
    planStructure.forEach(day => {
      day.exercises.forEach(ex => usedExerciseIds.add(ex.exercise_id));
    });

    return exercises
      .filter(ex => !usedExerciseIds.has(ex.exercise_id))
      .slice(0, 3);
  }, [exercises, planStructure]);

  // 🆕 Obsługa wyboru ćwiczenia
  const handleExerciseSelect = (exercise) => {
    setSelectedExercise(exercise);
  };

  // 🆕 Obsługa kontynuacji - dodaj ćwiczenie do aktualnego dnia
  const handleContinue = () => {
    if (!selectedExercise) return;

    // 🆕 Zapamiętaj pozycję scroll przed zmianą stanu
    scrollPositionRef.current = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;

    const updatedPlan = [...planStructure];
    const currentDayData = updatedPlan[currentDay];
    
    // Dodaj ćwiczenie do aktualnego dnia
    currentDayData.exercises.push({
      exercise_id: selectedExercise.exercise_id,
      name: selectedExercise.name,
      muscle_group: selectedExercise.muscle_group || '', // 🆕 Zapisz muscle_group
      score: selectedExercise.score,
      target_sets: '4',
      target_reps: '8-12',
      rest_seconds: 60,
      exercise_order: currentDayData.exercises.length + 1
    });

    setPlanStructure(updatedPlan);
    setSelectedExercise(null);

    // Sprawdź czy aktualny dzień jest pełny
    if (currentDayData.exercises.length >= exercisesPerDay) {
      // Przejdź do następnego dnia
      if (currentDay < daysCount - 1) {
        setCurrentDay(currentDay + 1);
      } else {
        // Wszystkie dni wypełnione - przejdź do podsumowania
        const allExercises = updatedPlan.flatMap(day => day.exercises);
        onExercisesSelected(allExercises);
      }
    }
  };

  // 🆕 Przywróć pozycję scroll po renderze (użyj useLayoutEffect dla synchronizacji)
  useLayoutEffect(() => {
    if (scrollPositionRef.current > 0) {
      // Użyj setTimeout z małym opóźnieniem aby upewnić się że DOM jest zaktualizowany
      const timeoutId = setTimeout(() => {
        window.scrollTo({
          top: scrollPositionRef.current,
          behavior: 'instant' // Natychmiastowe przewinięcie bez animacji
        });
        // Resetuj po przywróceniu
        scrollPositionRef.current = 0;
      }, 0);
      
      return () => clearTimeout(timeoutId);
    }
  }, [planStructure, currentDay, exercises]);

  // 🆕 Sprawdź czy plan jest kompletny
  const isPlanComplete = planStructure.every(day => day.exercises.length >= exercisesPerDay);
  const currentDayData = planStructure[currentDay] || { exercises: [] };
  const isCurrentDayFull = currentDayData.exercises.length >= exercisesPerDay;

  if (loading) {
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black">
        <GradientGridBg />
        <GlowOrb className="left-[10%] top-32 h-64 w-64 bg-emerald-400/20" />
        <GlowOrb className="right-[15%] bottom-32 h-52 w-52 bg-teal-400/20" />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
            <p className="text-gray-300">Ładowanie rekomendacji ćwiczeń...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black">
        <GradientGridBg />
        <div className="flex items-center justify-center min-h-screen">
          <div className="max-w-md mx-auto p-6">
            <div className="rounded-3xl border border-red-500/40 bg-red-900/20 p-6 text-center">
              <p className="text-red-200 mb-4">{error}</p>
              <PrimaryButton onClick={loadExercises}>
                Spróbuj ponownie
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black">
      <GradientGridBg />
      <GlowOrb className="left-[10%] top-32 h-64 w-64 bg-emerald-400/20" />
      <GlowOrb className="right-[15%] bottom-32 h-52 w-52 bg-teal-400/20" />

      <div className="mx-auto max-w-7xl px-6 pt-28 pb-16">
        {/* Header */}
        <div className="mb-10 text-center">
          <Kicker>Kreator planu treningowego</Kicker>
          <h1 className="mt-4 text-4xl font-black text-white md:text-5xl">
            {isPlanComplete ? 'Plan gotowy!' : `Dzień ${currentDay + 1} - Wybierz ćwiczenie`}
          </h1>
          <p className="mt-3 text-lg text-gray-300 max-w-2xl mx-auto">
            {isPlanComplete 
              ? 'Twój plan treningowy jest gotowy. Kliknij "Kontynuuj" aby przejść do podsumowania.'
              : `Wybierz ćwiczenie ${currentDayData.exercises.length + 1} z ${exercisesPerDay} dla dnia ${currentDay + 1}.`
            }
          </p>
        </div>

        {/* Główna zawartość - 2 kolumny */}
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          {/* Lewa kolumna - TOP 3 ćwiczenia */}
          <div>
            {!isPlanComplete && (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white mb-2">
                    Najlepiej dopasowane ćwiczenia
                  </h2>
                  <p className="text-sm text-gray-400">
                    Wybierz jedno ćwiczenie z TOP 3 rekomendacji
                  </p>
                </div>

                {/* Lista ćwiczeń */}
                <div className="space-y-4 mb-6">
                  {top3Exercises.map((exercise) => {
                    const isSelected = selectedExercise?.exercise_id === exercise.exercise_id;
                    return (
                      <OptionCard
                        key={exercise.exercise_id}
                        active={isSelected}
                        onClick={() => handleExerciseSelect(exercise)}
                        className="cursor-pointer w-full"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-bold text-white flex-1 pr-2">{exercise.name}</h3>
                          {isSelected && (
                            <div className="flex-shrink-0">
                              <svg
                                className="w-6 h-6 text-emerald-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          )}
                        </div>

                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-300">
                              {exercise.score_percent}% dopasowania
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">{exercise.reason}</p>
                        </div>

                        <div className="space-y-1">
                          {exercise.muscle_group && (
                            <div className="text-xs text-gray-500">
                              <span className="font-medium text-gray-400">Grupa:</span>{' '}
                              <span className="text-gray-300">{exercise.muscle_group}</span>
                            </div>
                          )}

                          {exercise.equipment && exercise.equipment.length > 0 && (
                            <div className="text-xs text-gray-500">
                              <span className="font-medium text-gray-400">Sprzęt:</span>{' '}
                              <span className="text-gray-300">
                                {Array.isArray(exercise.equipment)
                                  ? exercise.equipment.join(', ')
                                  : exercise.equipment}
                              </span>
                            </div>
                          )}
                        </div>
                      </OptionCard>
                    );
                  })}
                </div>

                {/* Przyciski */}
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6">
                  <div className="flex gap-3">
                    {onBack && (
                      <SecondaryButton onClick={onBack}>
                        ← Wyjdź
                      </SecondaryButton>
                    )}
                    <PrimaryButton
                      onClick={handleContinue}
                      disabled={!selectedExercise}
                    >
                      Kontynuuj →
                    </PrimaryButton>
                  </div>
                </div>
              </>
            )}

            {isPlanComplete && (
              <div className="rounded-3xl border border-emerald-400/40 bg-emerald-400/10 p-8 text-center">
                <div className="mb-6">
                  <svg className="w-16 h-16 text-emerald-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <h2 className="text-2xl font-bold text-white mb-2">Plan gotowy!</h2>
                  <p className="text-gray-300">
                    Wypełniłeś wszystkie dni treningowe. Kliknij "Kontynuuj" aby przejść do podsumowania.
                  </p>
                </div>
                <PrimaryButton onClick={() => {
                  // 🆕 Przekaż pełną strukturę planu (z dniami) zamiast tylko ćwiczeń
                  onExercisesSelected(planStructure);
                }}>
                  Kontynuuj do podsumowania →
                </PrimaryButton>
              </div>
            )}
          </div>

          {/* Prawa kolumna - Podgląd planu */}
          <div className="lg:sticky lg:top-28">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span>📋</span> Podgląd planu
              </h3>

              <div className="space-y-4 mb-6">
                {planStructure.map((day, dayIdx) => {
                  const isCurrent = dayIdx === currentDay;
                  const isComplete = day.exercises.length >= exercisesPerDay;
                  
                  return (
                    <div 
                      key={day.id} 
                      className={`rounded-2xl border-2 p-4 transition-all ${
                        isCurrent 
                          ? 'border-emerald-400 bg-emerald-400/10' 
                          : isComplete
                          ? 'border-emerald-400/40 bg-emerald-400/5'
                          : 'border-white/10 bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className={`font-semibold ${isCurrent ? 'text-emerald-300' : 'text-white'}`}>
                          {day.name}
                          {isCurrent && <span className="ml-2 text-xs text-emerald-400">(aktualny)</span>}
                        </h4>
                        <span className={`text-xs ${
                          isComplete ? 'text-emerald-300' : 'text-gray-400'
                        }`}>
                          {day.exercises.length}/{exercisesPerDay} ćwiczeń
                        </span>
                      </div>
                      {day.exercises.length > 0 ? (
                        <ul className="space-y-2">
                          {day.exercises.map((exercise, exIdx) => (
                            <li key={exIdx} className="text-sm text-gray-300 flex items-center gap-2">
                              <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="truncate">{exercise.name}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-500 italic">Brak ćwiczeń</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Statystyki */}
              <div className="pt-6 border-t border-white/10">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Dni treningowe</p>
                    <p className="text-lg font-bold text-white">
                      {planStructure.filter(d => d.exercises.length >= exercisesPerDay).length}/{daysCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Łącznie ćwiczeń</p>
                    <p className="text-lg font-bold text-white">
                      {planStructure.reduce((sum, day) => sum + day.exercises.length, 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

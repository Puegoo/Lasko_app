// frontend/lasko-frontend/src/components/exercises/PlanBuilder.jsx
import React, { useState, useEffect } from 'react';
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

export default function PlanBuilder({ 
  selectedExercises, 
  preferences, 
  suggestedStructure,
  onPlanCreated,
  onBack 
}) {
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 🆕 Inicjalizuj dni na podstawie sugerowanej struktury (z ćwiczeniami już przypisanymi)
    if (suggestedStructure && suggestedStructure.days) {
      const initialDays = suggestedStructure.days.map((day, idx) => ({
        id: day.id || `day-${idx}`,
        name: day.name || `Dzień ${idx + 1}`,
        day_order: day.day_order || idx + 1,
        exercises: day.exercises || [] // 🆕 Ćwiczenia już są przypisane
      }));
      setDays(initialDays);
    } else {
      // Fallback - jeśli nie ma struktury, użyj pustych dni
      const daysCount = preferences?.days || preferences?.training_days_per_week || 3;
      const initialDays = Array.from({ length: daysCount }, (_, idx) => ({
        id: `day-${idx}`,
        name: `Dzień ${idx + 1}`,
        day_order: idx + 1,
        exercises: []
      }));
      setDays(initialDays);
    }
  }, [suggestedStructure, preferences]);

  const addExerciseToDay = (dayId, exercise) => {
    setDays(prevDays =>
      prevDays.map(day => {
        if (day.id === dayId) {
          const exerciseOrder = day.exercises.length + 1;
          return {
            ...day,
            exercises: [
              ...day.exercises,
              {
                exercise_id: exercise.exercise_id,
                exercise_name: exercise.name,
                target_sets: '4',
                target_reps: '8-12',
                rest_seconds: 60,
                exercise_order: exerciseOrder
              }
            ]
          };
        }
        return day;
      })
    );
  };

  const removeExerciseFromDay = (dayId, exerciseIndex) => {
    setDays(prevDays =>
      prevDays.map(day => {
        if (day.id === dayId) {
          return {
            ...day,
            exercises: day.exercises.filter((_, idx) => idx !== exerciseIndex)
          };
        }
        return day;
      })
    );
  };

  const updateExerciseInDay = (dayId, exerciseIndex, field, value) => {
    setDays(prevDays =>
      prevDays.map(day => {
        if (day.id === dayId) {
          const updatedExercises = [...day.exercises];
          updatedExercises[exerciseIndex] = {
            ...updatedExercises[exerciseIndex],
            [field]: value
          };
          return {
            ...day,
            exercises: updatedExercises
          };
        }
        return day;
      })
    );
  };

  const handleCreatePlan = async () => {
    if (!planName.trim()) {
      setError('Nazwa planu jest wymagana');
      return;
    }

    // Sprawdź czy każdy dzień ma przynajmniej jedno ćwiczenie
    const emptyDays = days.filter(day => day.exercises.length === 0);
    if (emptyDays.length > 0) {
      setError('Każdy dzień musi zawierać przynajmniej jedno ćwiczenie');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const planData = {
        name: planName,
        description: planDescription || '',
        goal_type: preferences?.goal || 'zdrowie',
        difficulty_level: preferences?.level || 'sredniozaawansowany',
        training_days_per_week: days.length,
        equipment_required: preferences?.equipment || preferences?.equipment_preference || 'bodyweight', // 🆕 Domyślna wartość
        days: days.map(day => ({
          name: day.name,
          day_order: day.day_order,
          exercises: (day.exercises || []).filter(ex => ex && ex.exercise_id).map(ex => ({
            exercise_id: ex.exercise_id,
            target_sets: ex.target_sets || '4',
            target_reps: ex.target_reps || '8-12',
            rest_seconds: parseInt(ex.rest_seconds) || 60,
            exercise_order: ex.exercise_order || 1
          }))
        })).filter(day => day.exercises && day.exercises.length > 0) // 🆕 Filtruj puste dni
      };
      
      // 🆕 Walidacja przed wysłaniem
      if (!planData.days || planData.days.length === 0) {
        setError('Plan musi zawierać przynajmniej jeden dzień z ćwiczeniami');
        setLoading(false);
        return;
      }
      
      console.log('[PlanBuilder] Wysyłanie planu:', JSON.stringify(planData, null, 2));

      const response = await RecommendationServiceInstance.createCustomPlanFromExercises(planData);
      
      if (response.success) {
        onPlanCreated(response);
      } else {
        setError(response.message || 'Nie udało się utworzyć planu');
      }
    } catch (err) {
      console.error('Error creating plan:', err);
      setError(err.message || 'Nie udało się utworzyć planu');
    } finally {
      setLoading(false);
    }
  };

  // Podziel ćwiczenia na dostępne (nie dodane) i dodane
  const availableExercises = selectedExercises.filter(ex => {
    if (!ex || !ex.exercise_id) return false; // 🆕 Bezpieczne sprawdzanie
    return !days.some(day => 
      day.exercises.some(dayEx => dayEx && dayEx.exercise_id === ex.exercise_id)
    );
  });

  const totalExercises = days.reduce((sum, day) => sum + day.exercises.length, 0);

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
            Zbuduj swój plan treningowy
          </h1>
          <p className="mt-3 text-lg text-gray-300 max-w-2xl mx-auto">
            Rozmieść wybrane ćwiczenia w dniach treningowych i ustaw parametry treningowe.
          </p>
        </div>

        {/* Informacje o planie */}
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-3 block text-sm font-semibold uppercase tracking-wide text-gray-400">
                Nazwa planu *
              </label>
              <input
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="np. Mój plan treningowy"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-lg font-semibold text-white outline-none transition-all focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30 placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="mb-3 block text-sm font-semibold uppercase tracking-wide text-gray-400">
                Opis (opcjonalne)
              </label>
              <textarea
                value={planDescription}
                onChange={(e) => setPlanDescription(e.target.value)}
                placeholder="Krótki opis planu..."
                rows={2}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-white outline-none transition-all focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30 placeholder:text-gray-500 resize-none"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-3xl border border-red-500/40 bg-red-900/20 p-4">
            <div className="flex items-start gap-2">
              <span className="text-red-400">⚠️</span>
              <p className="text-sm text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Dni treningowe */}
        <div className="space-y-6 mb-8">
        {days.map((day) => (
            <div key={day.id} className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">{day.name}</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-300">
                  {day.exercises.length} {day.exercises.length === 1 ? 'ćwiczenie' : 'ćwiczeń'}
                </span>
              </div>

              {/* Lista ćwiczeń w dniu */}
              <div className="space-y-3 mb-6">
                {day.exercises.map((exercise, exIdx) => (
                  <div
                    key={exIdx}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 flex items-start gap-4"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-white mb-3">{exercise.exercise_name || exercise.name || 'Ćwiczenie'}</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Serie</label>
                          <input
                            type="text"
                            value={exercise.target_sets}
                            onChange={(e) => updateExerciseInDay(day.id, exIdx, 'target_sets', e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition-all focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Powtórzenia</label>
                          <input
                            type="text"
                            value={exercise.target_reps}
                            onChange={(e) => updateExerciseInDay(day.id, exIdx, 'target_reps', e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition-all focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Przerwa (s)</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={exercise.rest_seconds}
                              onChange={(e) => updateExerciseInDay(day.id, exIdx, 'rest_seconds', e.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 pr-10 text-sm text-white outline-none transition-all focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const current = parseInt(exercise.rest_seconds) || 0;
                                  updateExerciseInDay(day.id, exIdx, 'rest_seconds', (current + 1).toString());
                                }}
                                className="w-6 h-5 flex items-center justify-center rounded bg-emerald-400/20 hover:bg-emerald-400/40 transition-colors group"
                              >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-emerald-400 group-hover:text-emerald-300">
                                  <path d="M6 3L6 9M3 6L9 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const current = parseInt(exercise.rest_seconds) || 0;
                                  const next = Math.max(0, current - 1);
                                  updateExerciseInDay(day.id, exIdx, 'rest_seconds', next.toString());
                                }}
                                className="w-6 h-5 flex items-center justify-center rounded bg-emerald-400/20 hover:bg-emerald-400/40 transition-colors group"
                              >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-emerald-400 group-hover:text-emerald-300">
                                  <path d="M3 6L9 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeExerciseFromDay(day.id, exIdx)}
                      className="text-red-400 hover:text-red-300 transition-colors p-2"
                      title="Usuń ćwiczenie"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* Dodaj ćwiczenie do dnia */}
              {availableExercises.length > 0 && (
                <div className="border-t border-white/10 pt-4">
                  <label className="mb-3 block text-sm font-semibold uppercase tracking-wide text-gray-400">
                    Dodaj ćwiczenie
                  </label>
                  <div className="relative">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          const exercise = selectedExercises.find(ex => ex.exercise_id === parseInt(e.target.value));
                          if (exercise) {
                            addExerciseToDay(day.id, exercise);
                            e.target.value = '';
                          }
                        }
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all appearance-none cursor-pointer pr-10"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5 7.5l5 5 5-5' stroke='%2310B981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.75rem center',
                        backgroundSize: '1.25rem'
                      }}
                    >
                      <option value="" className="bg-gray-900 text-white">Wybierz ćwiczenie...</option>
                      {availableExercises.map(ex => (
                        <option key={ex.exercise_id} value={ex.exercise_id} className="bg-gray-900 text-white">
                          {ex.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Podsumowanie i przyciski */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-sm text-gray-400 mb-1">Łącznie ćwiczeń w planie</p>
              <p className="text-2xl font-black text-white">
                {totalExercises} {totalExercises === 1 ? 'ćwiczenie' : totalExercises < 5 ? 'ćwiczenia' : 'ćwiczeń'}
              </p>
            </div>
            <div className="flex gap-3">
              {onBack && (
                <SecondaryButton onClick={onBack}>
                  ← Wyjdź
                </SecondaryButton>
              )}
              <PrimaryButton
                onClick={handleCreatePlan}
                disabled={loading || !planName.trim() || days.some(day => day.exercises.length === 0)}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Tworzenie...
                  </span>
                ) : (
                  <>🚀 Zapisz i aktywuj plan</>
                )}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

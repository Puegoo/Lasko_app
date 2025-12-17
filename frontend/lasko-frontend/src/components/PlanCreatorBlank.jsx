import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import apiService from '../services/api';
import IconKit from './ui/IconKit';

// UI Helpers
const GradientGridBg = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
    <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-[#1DCD9F]/10 blur-3xl" />
    <div className="absolute top-1/3 -right-20 w-96 h-96 rounded-full bg-[#0D7A61]/10 blur-3xl" />
    <svg className="absolute inset-0 h-full w-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid-blank" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-blank)" />
    </svg>
  </div>
);

const PrimaryButton = ({ onClick, children, disabled, className = '' }) => (
  <button
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

// Navbar
const Navbar = () => {
  const navigate = useNavigate();
  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-3">
        <Link to="/" className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 transition-all duration-300">
          Lasko
        </Link>
        <SecondaryButton onClick={() => navigate('/dashboard')}>
          Anuluj
        </SecondaryButton>
      </div>
    </nav>
  );
};

// Opcje do wyboru
const goalOptions = [
  { value: 'masa', label: 'Masa mięśniowa', icon: '💪' },
  { value: 'sila', label: 'Siła', icon: '⚡' },
  { value: 'wytrzymalosc', label: 'Wytrzymałość', icon: '🏃' },
  { value: 'zdrowie', label: 'Zdrowie ogólne', icon: '❤️' },
  { value: 'spalanie', label: 'Redukcja tkanki tłuszczowej', icon: '🔥' },
];

const levelOptions = [
  { value: 'poczatkujacy', label: 'Początkujący' },
  { value: 'sredniozaawansowany', label: 'Średniozaawansowany' },
  { value: 'zaawansowany', label: 'Zaawansowany' },
];

const equipmentOptions = [
  { value: 'silownia', label: 'Pełna siłownia' },
  { value: 'dom_podstawowy', label: 'Dom (hantle + ławka)' },
  { value: 'masa_ciala', label: 'Dom (brak sprzętu)' },
  { value: 'minimalne', label: 'Minimalne wyposażenie' },
];

const PlanCreatorBlank = () => {
  const navigate = useNavigate();
  const notify = useNotification();
  const [step, setStep] = useState(1); // 1: Basic info, 2: Days & Exercises, 3: Preview
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [exerciseFilters, setExerciseFilters] = useState({
    muscle_group: '',
    search: '',
  });

  // Dane planu
  const [planData, setPlanData] = useState({
    name: '',
    goal: '',
    difficulty_level: '',
    training_days_per_week: 3,
    equipment_required: '',
    description: '',
  });

  // Dni treningowe
  const [planDays, setPlanDays] = useState([]);

  // Walidacja podstawowych danych
  const isBasicInfoValid = () => {
    return (
      planData.name.trim() &&
      planData.goal &&
      planData.difficulty_level &&
      planData.training_days_per_week > 0 &&
      planData.equipment_required
    );
  };

  // Pobierz ćwiczenia
  useEffect(() => {
    if (step === 2) {
      fetchExercises();
    }
  }, [step]);

  // Inicjalizuj dni treningowe
  useEffect(() => {
    if (step === 2 && planData.training_days_per_week > 0) {
      if (planDays.length === 0) {
        const days = Array.from({ length: planData.training_days_per_week }, (_, i) => ({
          day_number: i + 1,
          title: `Dzień ${i + 1}`,
          exercises: [],
        }));
        setPlanDays(days);
      } else if (planDays.length !== planData.training_days_per_week) {
        // Zaktualizuj liczbę dni
        const newDays = Array.from({ length: planData.training_days_per_week }, (_, i) => {
          if (planDays[i]) {
            return planDays[i];
          }
          return {
            day_number: i + 1,
            title: `Dzień ${i + 1}`,
            exercises: [],
          };
        });
        setPlanDays(newDays.slice(0, planData.training_days_per_week));
      }
    }
  }, [step, planData.training_days_per_week]);

  // Filtruj ćwiczenia
  useEffect(() => {
    let filtered = exercises;
    if (exerciseFilters.muscle_group) {
      filtered = filtered.filter(ex => ex.muscle_group === exerciseFilters.muscle_group);
    }
    if (exerciseFilters.search) {
      const searchLower = exerciseFilters.search.toLowerCase();
      filtered = filtered.filter(ex => 
        ex.name.toLowerCase().includes(searchLower) ||
        (ex.description && ex.description.toLowerCase().includes(searchLower))
      );
    }
    setFilteredExercises(filtered);
  }, [exercises, exerciseFilters]);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const response = await apiService.request('/api/exercises/?limit=200');
      if (response.success && response.exercises) {
        setExercises(response.exercises);
      }
    } catch (error) {
      console.error('[PlanCreatorBlank] Error fetching exercises:', error);
      notify.error('Nie udało się pobrać ćwiczeń');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExercise = (dayIndex, exercise, event) => {
    // Zapobiegaj podwójnemu dodawaniu
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    setPlanDays(prev => {
      const newDays = [...prev];
      if (!newDays[dayIndex].exercises) {
        newDays[dayIndex].exercises = [];
      }
      
      // Sprawdź czy ćwiczenie już istnieje
      const exerciseExists = newDays[dayIndex].exercises.some(e => e.exercise_id === exercise.id);
      if (exerciseExists) {
        return newDays; // Nie dodawaj ponownie
      }
      
      newDays[dayIndex].exercises.push({
        exercise_id: exercise.id,
        name: exercise.name,
        target_sets: '3',
        target_reps: '10-12',
        rest_seconds: 60,
        exercise_order: newDays[dayIndex].exercises.length + 1,
      });
      return newDays;
    });
  };

  const handleRemoveExercise = (dayIndex, exerciseIndex) => {
    setPlanDays(prev => {
      const newDays = [...prev];
      newDays[dayIndex].exercises.splice(exerciseIndex, 1);
      // Zaktualizuj kolejność
      newDays[dayIndex].exercises.forEach((ex, idx) => {
        ex.exercise_order = idx + 1;
      });
      return newDays;
    });
  };

  const handleUpdateExercise = (dayIndex, exerciseIndex, field, value) => {
    setPlanDays(prev => {
      const newDays = [...prev];
      if (newDays[dayIndex].exercises[exerciseIndex]) {
        newDays[dayIndex].exercises[exerciseIndex][field] = value;
      }
      return newDays;
    });
  };

  const handleSavePlan = async () => {
    if (!isBasicInfoValid()) {
      notify.error('Uzupełnij wszystkie wymagane pola');
      return;
    }

    // Sprawdź czy wszystkie dni mają ćwiczenia
    const hasEmptyDays = planDays.some(day => !day.exercises || day.exercises.length === 0);
    if (hasEmptyDays) {
      notify.error('Wszystkie dni muszą mieć przynajmniej jedno ćwiczenie');
      return;
    }

    try {
      setLoading(true);

      // Przygotuj dane w formacie wymaganym przez API
      const planPayload = {
        name: planData.name,
        description: planData.description || `Plan treningowy: ${planData.name}`,
        goal_type: planData.goal,
        difficulty_level: planData.difficulty_level,
        training_days_per_week: planData.training_days_per_week,
        equipment_required: planData.equipment_required,
        days: planDays.map((day, index) => ({
          name: day.title,
          day_order: day.day_number || index + 1,
          exercises: (day.exercises || []).map((exercise, exIndex) => ({
            exercise_id: exercise.exercise_id,
            target_sets: exercise.target_sets || '3',
            target_reps: exercise.target_reps || '10-12',
            rest_seconds: exercise.rest_seconds || 60,
            exercise_order: exercise.exercise_order || exIndex + 1,
          })),
        })),
      };

      // Utwórz plan używając endpointu custom-plans
      const planResponse = await apiService.request('/api/recommendations/custom-plans/', {
        method: 'POST',
        body: JSON.stringify(planPayload),
      });

      if (!planResponse.success && !planResponse.plan_id && !planResponse.id) {
        throw new Error(planResponse.error || 'Nie udało się utworzyć planu');
      }

      // Plan został utworzony i automatycznie aktywowany przez endpoint custom-plans

      notify.success('Plan został utworzony i aktywowany!');
      navigate('/dashboard', { 
        state: { 
          message: 'Twój plan treningowy został utworzony i aktywowany!',
          planCreated: true
        }
      });
    } catch (error) {
      console.error('[PlanCreatorBlank] Error saving plan:', error);
      notify.error('Nie udało się zapisać planu: ' + (error.message || 'Nieznany błąd'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      <GradientGridBg />
      <Navbar />

      <div className="pt-24 pb-16 px-4 max-w-6xl mx-auto">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-black text-white">
              {step === 1 && 'Podstawowe informacje'}
              {step === 2 && 'Dni treningowe i ćwiczenia'}
              {step === 3 && 'Podgląd planu'}
            </h1>
            <span className="text-sm text-gray-400">
              Krok {step} z 3
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Krok 1: Podstawowe informacje */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Nazwa planu *
              </label>
              <input
                type="text"
                value={planData.name}
                onChange={(e) => setPlanData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="np. Mój plan treningowy"
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Cel treningowy *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {goalOptions.map(goal => (
                  <button
                    key={goal.value}
                    onClick={() => setPlanData(prev => ({ ...prev, goal: goal.value }))}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      planData.goal === goal.value
                        ? 'border-emerald-400/60 bg-emerald-400/10'
                        : 'border-white/10 bg-white/[0.04] hover:border-white/20'
                    }`}
                  >
                    <div className="text-2xl mb-2">{goal.icon}</div>
                    <div className="text-sm font-semibold text-white">{goal.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Poziom zaawansowania *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {levelOptions.map(level => (
                  <button
                    key={level.value}
                    onClick={() => setPlanData(prev => ({ ...prev, difficulty_level: level.value }))}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      planData.difficulty_level === level.value
                        ? 'border-emerald-400/60 bg-emerald-400/10'
                        : 'border-white/10 bg-white/[0.04] hover:border-white/20'
                    }`}
                  >
                    <div className="text-sm font-semibold text-white">{level.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Liczba dni treningowych w tygodniu *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={planData.training_days_per_week}
                  onChange={(e) => {
                    const rawValue = e.target.value;
                    // Pozwól na puste pole podczas wpisywania
                    if (rawValue === '') {
                      setPlanData(prev => ({ ...prev, training_days_per_week: '' }));
                      return;
                    }
                    const numValue = parseInt(rawValue, 10);
                    // Jeśli to nie jest liczba, nie zmieniaj wartości
                    if (isNaN(numValue)) {
                      return;
                    }
                    // Ogranicz do zakresu 1-7 tylko gdy użytkownik skończy wpisywać
                    const clampedValue = Math.min(7, Math.max(1, numValue));
                    setPlanData(prev => ({ ...prev, training_days_per_week: clampedValue }));
                  }}
                  onBlur={(e) => {
                    // Przy stracie fokusa upewnij się, że wartość jest w zakresie
                    const value = parseInt(e.target.value, 10) || 1;
                    const clampedValue = Math.min(7, Math.max(1, value));
                    setPlanData(prev => ({ ...prev, training_days_per_week: clampedValue }));
                  }}
                  className="w-full px-4 py-3 pr-20 rounded-xl bg-black/40 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-row gap-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPlanData(prev => {
                        const current = parseInt(prev.training_days_per_week) || 1;
                        return {
                          ...prev,
                          training_days_per_week: Math.min(7, current + 1)
                        };
                      });
                    }}
                    disabled={parseInt(planData.training_days_per_week) >= 7}
                    className="w-6 h-5 flex items-center justify-center rounded bg-emerald-400/20 hover:bg-emerald-400/40 transition-colors group disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-emerald-400 group-hover:text-emerald-300">
                      <path d="M6 3L6 9M3 6L9 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPlanData(prev => {
                        const current = parseInt(prev.training_days_per_week) || 1;
                        return {
                          ...prev,
                          training_days_per_week: Math.max(1, current - 1)
                        };
                      });
                    }}
                    disabled={parseInt(planData.training_days_per_week) <= 1}
                    className="w-6 h-5 flex items-center justify-center rounded bg-emerald-400/20 hover:bg-emerald-400/40 transition-colors group disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-emerald-400 group-hover:text-emerald-300">
                      <path d="M3 6L9 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Dostępny sprzęt *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {equipmentOptions.map(eq => (
                  <button
                    key={eq.value}
                    onClick={() => setPlanData(prev => ({ ...prev, equipment_required: eq.value }))}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      planData.equipment_required === eq.value
                        ? 'border-emerald-400/60 bg-emerald-400/10'
                        : 'border-white/10 bg-white/[0.04] hover:border-white/20'
                    }`}
                  >
                    <div className="text-sm font-semibold text-white text-center">{eq.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Opis (opcjonalnie)
              </label>
              <textarea
                value={planData.description}
                onChange={(e) => setPlanData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Dodatkowe informacje o planie..."
                rows="3"
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all resize-none"
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <PrimaryButton onClick={() => {
                if (isBasicInfoValid()) {
                  setStep(2);
                } else {
                  notify.error('Uzupełnij wszystkie wymagane pola');
                }
              }}>
                Dalej
              </PrimaryButton>
            </div>
          </div>
        )}

        {/* Krok 2: Dni treningowe i ćwiczenia */}
        {step === 2 && (
          <div className="space-y-8">
            {/* Filtry ćwiczeń */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Wyszukaj ćwiczenie
                </label>
                <div className="relative">
                  <IconKit.Search size="md" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={exerciseFilters.search}
                    onChange={(e) => setExerciseFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="Nazwa ćwiczenia..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Grupa mięśniowa
                </label>
                <div className="relative">
                  <select
                    value={exerciseFilters.muscle_group}
                    onChange={(e) => setExerciseFilters(prev => ({ ...prev, muscle_group: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all appearance-none cursor-pointer pr-10"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5 7.5l5 5 5-5' stroke='%2310B981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.75rem center',
                      backgroundSize: '1.25rem'
                    }}
                  >
                    <option value="" className="bg-gray-900 text-white">Wszystkie</option>
                    <option value="Klatka piersiowa" className="bg-gray-900 text-white">Klatka piersiowa</option>
                    <option value="Plecy" className="bg-gray-900 text-white">Plecy</option>
                    <option value="Barki" className="bg-gray-900 text-white">Barki</option>
                    <option value="Biceps" className="bg-gray-900 text-white">Biceps</option>
                    <option value="Triceps" className="bg-gray-900 text-white">Triceps</option>
                    <option value="Nogi" className="bg-gray-900 text-white">Nogi</option>
                    <option value="Brzuch" className="bg-gray-900 text-white">Brzuch</option>
                    <option value="Pośladki" className="bg-gray-900 text-white">Pośladki</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dni treningowe */}
            {planDays.map((day, dayIndex) => (
              <div key={dayIndex} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <input
                      type="text"
                      value={day.title}
                      onChange={(e) => {
                        setPlanDays(prev => {
                          const newDays = [...prev];
                          newDays[dayIndex].title = e.target.value;
                          return newDays;
                        });
                      }}
                      className="text-xl font-bold text-white bg-transparent border-none outline-none focus:border-b focus:border-emerald-400/60 pb-1"
                      placeholder={`Dzień ${day.day_number}`}
                    />
                  </div>
                  <span className="text-sm text-gray-400">
                    {day.exercises?.length || 0} ćwiczeń
                  </span>
                </div>

                {/* Lista ćwiczeń w dniu */}
                {day.exercises && day.exercises.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {day.exercises.map((exercise, exIndex) => (
                      <div key={exIndex} className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="font-semibold text-white flex-1 min-w-0 pr-4">
                          <div className="truncate">{exercise.name}</div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-400 whitespace-nowrap">Serie:</label>
                            <input
                              type="text"
                              value={exercise.target_sets}
                              onChange={(e) => handleUpdateExercise(dayIndex, exIndex, 'target_sets', e.target.value)}
                              className="w-20 px-3 py-2 rounded-lg border border-white/20 bg-black/40 text-white text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-400 whitespace-nowrap">Powtórzenia:</label>
                            <input
                              type="text"
                              value={exercise.target_reps}
                              onChange={(e) => handleUpdateExercise(dayIndex, exIndex, 'target_reps', e.target.value)}
                              className="w-24 px-3 py-2 rounded-lg border border-white/20 bg-black/40 text-white text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-400 whitespace-nowrap">Przerwa (s):</label>
                            <div className="relative">
                              <input
                                type="number"
                                value={exercise.rest_seconds}
                                onChange={(e) => handleUpdateExercise(dayIndex, exIndex, 'rest_seconds', parseInt(e.target.value) || 60)}
                                className="w-32 px-3 py-2 pr-12 rounded-lg border border-white/20 bg-black/40 text-white text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                              />
                              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-row gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = parseInt(exercise.rest_seconds) || 0;
                                    handleUpdateExercise(dayIndex, exIndex, 'rest_seconds', current + 1);
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
                                    handleUpdateExercise(dayIndex, exIndex, 'rest_seconds', next);
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
                        <button
                          onClick={() => handleRemoveExercise(dayIndex, exIndex)}
                          className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
                        >
                          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Lista dostępnych ćwiczeń */}
                {loading ? (
                  <div className="text-center py-8 text-gray-400">Ładowanie ćwiczeń...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2">
                    {filteredExercises.map(exercise => {
                      const isAlreadyAdded = day.exercises?.some(e => e.exercise_id === exercise.id);
                      return (
                        <button
                          key={exercise.id}
                          onClick={(e) => {
                            if (!isAlreadyAdded) {
                              handleAddExercise(dayIndex, exercise, e);
                            }
                          }}
                          disabled={isAlreadyAdded}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            isAlreadyAdded
                              ? 'border-emerald-400/40 bg-emerald-400/10 opacity-60 cursor-not-allowed'
                              : 'border-white/10 bg-white/[0.04] hover:border-emerald-400/40 hover:bg-emerald-400/10'
                          }`}
                        >
                          <div className="font-semibold text-white text-sm">{exercise.name}</div>
                          {exercise.muscle_group && (
                            <div className="text-xs text-gray-400 mt-1">{exercise.muscle_group}</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            <div className="flex justify-between gap-4 pt-4">
              <SecondaryButton onClick={() => setStep(1)}>
                Wstecz
              </SecondaryButton>
              <PrimaryButton onClick={() => setStep(3)}>
                Podgląd
              </PrimaryButton>
            </div>
          </div>
        )}

        {/* Krok 3: Podgląd */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-2xl font-bold text-white mb-4">{planData.name}</h2>
              {planData.description && (
                <p className="text-gray-300 mb-4">{planData.description}</p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Cel</div>
                  <div className="text-white font-semibold">
                    {goalOptions.find(g => g.value === planData.goal)?.label || planData.goal}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Poziom</div>
                  <div className="text-white font-semibold">
                    {levelOptions.find(l => l.value === planData.difficulty_level)?.label || planData.difficulty_level}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Dni w tygodniu</div>
                  <div className="text-white font-semibold">{planData.training_days_per_week}</div>
                </div>
                <div>
                  <div className="text-gray-400">Sprzęt</div>
                  <div className="text-white font-semibold">
                    {equipmentOptions.find(e => e.value === planData.equipment_required)?.label || planData.equipment_required}
                  </div>
                </div>
              </div>
            </div>

            {planDays.map((day, dayIndex) => (
              <div key={dayIndex} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <h3 className="text-xl font-bold text-white mb-4">{day.title}</h3>
                <div className="space-y-3">
                  {day.exercises && day.exercises.length > 0 ? (
                    day.exercises.map((exercise, exIndex) => (
                      <div key={exIndex} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                        <div>
                          <div className="font-semibold text-white">{exercise.name}</div>
                          <div className="text-sm text-gray-400 mt-1">
                            {exercise.target_sets} serie × {exercise.target_reps} powtórzeń • Przerwa: {exercise.rest_seconds}s
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 text-center py-4">Brak ćwiczeń</div>
                  )}
                </div>
              </div>
            ))}

            <div className="flex justify-between gap-4 pt-4">
              <SecondaryButton onClick={() => setStep(2)}>
                Wstecz
              </SecondaryButton>
              <PrimaryButton onClick={handleSavePlan} disabled={loading}>
                {loading ? 'Zapisywanie...' : 'Zapisz i aktywuj plan'}
              </PrimaryButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanCreatorBlank;


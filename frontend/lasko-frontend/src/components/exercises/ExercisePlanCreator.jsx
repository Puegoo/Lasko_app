// frontend/lasko-frontend/src/components/exercises/ExercisePlanCreator.jsx
// Wrapper komponentu który integruje rekomendację ćwiczeń z budownikiem planu
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ExerciseRecommendations from './ExerciseRecommendations';
import PlanBuilder from './PlanBuilder';
import { RecommendationService } from '../../services/recommendationService';

const RecommendationServiceInstance = new RecommendationService();

export default function ExercisePlanCreator() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('exercises'); // 'exercises' | 'builder'
  const [preferences, setPreferences] = useState(null);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [suggestedStructure, setSuggestedStructure] = useState(null);

  // Pobierz dane z location.state (przekazane z EnhancedPlanCreator)
  useEffect(() => {
    if (location.state?.preferences) {
      setPreferences(location.state.preferences);
    } else if (location.state?.planData) {
      // Ekstraktuj preferencje z planData
      const planData = location.state.planData;
      const prefs = {
        goal: planData.goal,
        level: planData.level,
        training_days_per_week: planData.trainingDaysPerWeek,
        equipment: planData.equipment,
        time_per_session: planData.timePerSession,
        weight_kg: planData.body?.weightKg,
        height_cm: planData.body?.heightCm,
        bmi: planData.body?.bmi,
        injuries: planData.health?.injuries || [],
        health_conditions: planData.health?.healthConditions || [],
      };
      setPreferences(prefs);
    }
  }, [location.state]);

  // Po wyborze ćwiczeń - przejdź do budownika planu
  // 🆕 planStructure to już gotowa struktura planu z dniami i ćwiczeniami
  const handleExercisesSelected = async (planStructure) => {
    // 🆕 Bezpieczne sprawdzanie - upewnij się że planStructure jest tablicą
    if (!Array.isArray(planStructure)) {
      console.error('[ExercisePlanCreator] planStructure nie jest tablicą:', planStructure);
      return;
    }
    
    // planStructure to tablica dni, każdy dzień ma exercises z polami: exercise_id, name, target_sets, target_reps, rest_seconds, exercise_order
    // 🆕 Upewnij się że ćwiczenia mają poprawną strukturę (exercise_name dla kompatybilności)
    const exercisesWithNames = planStructure.flatMap(day => {
      if (!day || !day.exercises || !Array.isArray(day.exercises)) {
        console.warn('[ExercisePlanCreator] Dzień nie ma ćwiczeń:', day);
        return [];
      }
      return day.exercises.map(ex => ({
        ...ex,
        exercise_name: ex.exercise_name || ex.name, // 🆕 Dodaj exercise_name jeśli nie ma
        name: ex.name || ex.exercise_name // 🆕 Upewnij się że name istnieje
      }));
    });
    setSelectedExercises(exercisesWithNames);
    
    // 🆕 Upewnij się że dni mają ćwiczenia z exercise_name
    const daysWithNames = planStructure.map(day => ({
      ...day,
      exercises: (day.exercises || []).map(ex => ({
        ...ex,
        exercise_name: ex.exercise_name || ex.name,
        name: ex.name || ex.exercise_name
      }))
    }));
    setSuggestedStructure({ days: daysWithNames });
    setMode('builder');
  };

  // Po utworzeniu planu - przekieruj do Dashboard
  const handlePlanCreated = (response) => {
    if (response.success) {
      navigate('/dashboard', { 
        state: { 
          message: 'Twój plan treningowy został utworzony i aktywowany!',
          planCreated: true
        }
      });
    }
  };

  if (mode === 'exercises') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <ExerciseRecommendations
          preferences={preferences}
          onExercisesSelected={handleExercisesSelected}
          onBack={() => navigate('/enhanced-plan-creator')}
        />
      </div>
    );
  }

  if (mode === 'builder') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <PlanBuilder
          selectedExercises={selectedExercises}
          preferences={preferences}
          suggestedStructure={suggestedStructure}
          onPlanCreated={handlePlanCreated}
          onBack={() => setMode('exercises')}
        />
      </div>
    );
  }

  return null;
}


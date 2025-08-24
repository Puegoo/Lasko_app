// frontend/lasko-frontend/src/components/register/EnhancedPlanCreator.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import RegisterBackground from '../../assets/Photos/Register_background.png';

// ✅ Nowe importy usług
import PlanService from '../../services/planService';
import APIClient from '../../services/apiClient';

const EnhancedPlanCreator = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);

  // ✅ Stany dla integracji z API/AI
  const [apiError, setApiError] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [alternatives, setAlternatives] = useState([]);

  // ✅ Sprawdź czy przychodzi z ankiety
  const initialData = location.state?.userData || {};
  const skipBasicInfo = location.state?.skipBasicInfo || false;
  const fromSurvey = location.state?.fromSurvey || false;

  // ✅ Zmień początkowy krok jeśli dane pre-wypełnione
  const [currentStep, setCurrentStep] = useState(skipBasicInfo ? 1 : 0);

  // ✅ Inicjalne dane planu z uwzględnieniem danych z ankiety
  const [planData, setPlanData] = useState({
    // nazwa z automatu, gdy wchodzimy z ankiety
    name: fromSurvey
      ? `Plan ${
          initialData.goal === 'masa'
            ? 'na masę'
            : initialData.goal === 'siła'
            ? 'siłowy'
            : initialData.goal === 'wytrzymałość'
            ? 'wytrzymałościowy'
            : initialData.goal === 'spalanie'
            ? 'spalający'
            : initialData.goal === 'zdrowie'
            ? 'zdrowotny'
            : 'treningowy'
        }`
      : '',
    goal: initialData.goal || '',
    level: initialData.level || '',
    trainingDaysPerWeek: initialData.trainingDaysPerWeek || 3,
    equipment: initialData.equipmentPreference || '',
    planDuration: 8, // tygodnie

    sessionDuration: 60, // minuty
    restDays: 'flexible',
    focusAreas: [],
    avoidances: [],

    weekPlan: [],
    generatedExercises: [],
    notes: '',

    isRecommended: false,
    configMethod: initialData.planConfigMethod || 'creator',

    // ✅ Metadane o źródle danych
    fromSurvey: fromSurvey,
    sourceAlgorithm: location.state?.sourceAlgorithm || null,

    // ✅ Nowe metadane AI/DB
    aiGenerated: false,
    isFromDatabase: false,
    algorithmVersion: '2.1',
    planId: null,
    originalPlanName: null,
    createdBy: null
  });

  const steps = [
    'Informacje podstawowe',
    'Preferencje treningowe',
    'Obszary skupienia',
    'Generowanie planu',
    'Dostosowanie ćwiczeń',
    'Finalizacja'
  ];

  const goals = [
    { value: 'masa', label: 'Budowanie masy mięśniowej', icon: '💪' },
    { value: 'siła', label: 'Zwiększenie siły', icon: '🏋️' },
    { value: 'wytrzymałość', label: 'Poprawa wytrzymałości', icon: '🏃' },
    { value: 'spalanie', label: 'Spalanie tkanki tłuszczowej', icon: '🔥' },
    { value: 'zdrowie', label: 'Ogólne zdrowie i kondycja', icon: '❤️' }
  ];

  const equipmentOptions = [
    { value: 'siłownia', label: 'Pełne wyposażenie siłowni', icon: '🏋️‍♂️' },
    { value: 'dom_podstawowy', label: 'Podstawowy sprzęt domowy', icon: '🏠' },
    { value: 'dom_zaawansowany', label: 'Zaawansowane home gym', icon: '🏡' },
    { value: 'masa_ciała', label: 'Tylko masa ciała', icon: '🤸‍♂️' },
    { value: 'minimalne', label: 'Minimalne wyposażenie', icon: '⚡' }
  ];

  const focusAreasOptions = [
    { id: 'upper_body', label: 'Górna część ciała', icon: '💪' },
    { id: 'lower_body', label: 'Dolna część ciała', icon: '🦵' },
    { id: 'core', label: 'Mięśnie głębokie', icon: '🏋️' },
    { id: 'cardio', label: 'Wytrzymałość kardio', icon: '❤️' },
    { id: 'flexibility', label: 'Elastyczność', icon: '🤸' },
    { id: 'functional', label: 'Trening funkcjonalny', icon: '⚡' }
  ];

  const avoidanceOptions = [
    { id: 'knee_issues', label: 'Problemy z kolanami', icon: '🦵' },
    { id: 'back_issues', label: 'Problemy z kręgosłupem', icon: '🏃' },
    { id: 'shoulder_issues', label: 'Problemy z barkami', icon: '💪' },
    { id: 'time_constraints', label: 'Ograniczenia czasowe', icon: '⏰' },
    { id: 'high_impact', label: 'Unikanie wysokiego obciążenia', icon: '⚠️' },
    { id: 'complex_movements', label: 'Unikanie skomplikowanych ruchów', icon: '🤔' }
  ];

  // --- POMOCNICZE: banner o danych z ankiety (renderowany na początku każdego kroku) ---
  const SurveyInfoBanner = () =>
    fromSurvey ? (
      <div className="mb-6 bg-[#0D7A61]/10 border border-[#0D7A61]/30 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <span className="text-[#1DCD9F] text-lg">📋</span>
          <div>
            <div className="text-[#1DCD9F] text-sm font-bold">Dane z ankiety</div>
            <div className="text-gray-300 text-xs">
              Pola zostały wypełnione na podstawie Twojej ankiety. Możesz je swobodnie zmieniać.
            </div>
          </div>
        </div>
      </div>
    ) : null;

  // =========================
  //  AI / API: GENEROWANIE
  // =========================

  // 🔁 Nowa: asynchroniczna wersja z API + fallback
  const generateRecommendedPlan = async () => {
    console.log('🚀 Uruchamiam zaawansowany algorytm rekomendacyjny AI...');

    try {
      setLoading(true);
      setApiError(null);

      // Przygotuj dane dla API
      const surveyData = {
        goal: planData.goal,
        level: planData.level,
        trainingDaysPerWeek: planData.trainingDaysPerWeek,
        equipment: planData.equipment,
        sessionDuration: planData.sessionDuration,
        focusAreas: planData.focusAreas,
        avoidances: planData.avoidances,
        planDuration: planData.planDuration
      };

      // Inicjalizuj serwisy
      const apiClient = new APIClient();
      const planService = new PlanService(apiClient);

      // Wywołanie algorytmu bazodanowego
      const aiResult = await planService.generateAIPlan(initialData, surveyData);

      console.log('✅ Otrzymano plan z algorytmu AI:', aiResult);

      // Zaktualizuj stan komponentu
      setPlanData((prev) => ({
        ...prev,
        weekPlan: aiResult.weekPlan,
        generatedExercises: aiResult.generatedExercises,

        // Nowe metadane AI
        algorithmVersion: aiResult.algorithmMetadata.version,
        aiGenerated: true,
        isFromDatabase: aiResult.algorithmMetadata.isFromDatabase,
        planId: aiResult.algorithmMetadata.planId,
        originalPlanName: aiResult.algorithmMetadata.planName,
        createdBy: aiResult.algorithmMetadata.createdBy,

        // Zachowaj istniejące metadane
        fromSurvey: fromSurvey,
        sourceAlgorithm: 'ai-database-v2.1'
      }));

      // Zapisz AI insights i alternatywy
      setAiInsights(aiResult.aiInsights);
      setAlternatives(aiResult.alternatives || []);

      console.log('🎯 Plan AI wygenerowany pomyślnie. Score:', aiResult.aiInsights?.score);
    } catch (error) {
      console.error('❌ Błąd algorytmu AI:', error);
      setApiError(error?.message || 'Nieznany błąd serwera');

      // Fallback do lokalnego algorytmu
      console.log('🔄 Przełączam na lokalny algorytm fallback...');
      await generateLocalFallbackPlan();
    } finally {
      setLoading(false);
    }
  };

  // 🔙 Fallback lokalny — używa oryginalnego algorytmu
  const generateLocalFallbackPlan = async () => {
    try {
      const localPlan = generateOriginalRecommendedPlan();

      setPlanData((prev) => ({
        ...prev,
        weekPlan: localPlan,
        generatedExercises: localPlan.flatMap((day) => day.exercises),
        algorithmVersion: '1.0-local-fallback',
        aiGenerated: false,
        isFromDatabase: false
      }));

      setAiInsights({
        score: 75,
        whyRecommended: ['Lokalny algorytm fallback'],
        warnings: ['Plan wygenerowany lokalnie - ograniczona personalizacja'],
        estimatedDuration: planData.sessionDuration,
        isFallback: true
      });

      console.log('⚠️ Użyto lokalnego algorytmu fallback');
    } catch (fallbackError) {
      console.error('❌ Błąd również w fallback algorytmie:', fallbackError);
      setApiError('Nie udało się wygenerować planu. Spróbuj ponownie później.');
    }
  };

  // 📥 Pobieranie alternatywnych planów
  const loadAlternativePlans = async () => {
    try {
      const apiClient = new APIClient();
      const planService = new PlanService(apiClient);

      const altPlans = await planService.getAlternativePlans(initialData, {
        goal: planData.goal,
        level: planData.level,
        trainingDaysPerWeek: planData.trainingDaysPerWeek,
        equipment: planData.equipment
      });

      setAlternatives(altPlans);
    } catch (error) {
      console.error('❌ Błąd ładowania alternatyw:', error);
    }
  };

  // 🔁 Zamiana na alternatywny plan
  const switchToAlternativePlan = async (alternativePlanId) => {
    try {
      setLoading(true);

      const apiClient = new APIClient();
      const response = await apiClient.get(`/api/plans/${alternativePlanId}/detailed`);

      if (response.data?.success) {
        const altPlanData = response.data.plan;

        // Konwertuj dane z API do formatu komponentu
        const convertedWeekPlan = altPlanData.days.map((day, index) => ({
          day: index + 1,
          name: day.name,
          exercises: day.exercises.map((exercise) => ({
            name: exercise.name,
            sets: exercise.target_sets,
            reps: exercise.target_reps,
            rest: exercise.rest_seconds,
            muscle: exercise.muscle_group,
            difficulty: 'medium',
            exerciseId: exercise.id
          })),
          estimatedDuration: day.estimated_duration,
          targetMuscles: day.target_muscle_groups
        }));

        setPlanData((prev) => ({
          ...prev,
          weekPlan: convertedWeekPlan,
          generatedExercises: convertedWeekPlan.flatMap((d) => d.exercises),
          planId: alternativePlanId,
          originalPlanName: altPlanData.name,
          name: altPlanData.name,
          isFromDatabase: true
        }));

        console.log(`✅ Przełączono na alternatywny plan: ${altPlanData.name}`);
      }
    } catch (error) {
      console.error('❌ Błąd przełączania planu:', error);
      setApiError('Nie udało się załadować alternatywnego planu');
    } finally {
      setLoading(false);
    }
  };

  // =========================
  //  ORYGINALNY ALGORYTM (FALLBACK)
  // =========================

  // INTELIGENTNE NAZWY DNI
  const getDayName = (dayNum, totalDays) => {
    const dayNames = {
      3: ['Push (Pchnij)', 'Pull (Pociągnij)', 'Legs (Nogi)'],
      4: ['Górna - Push', 'Dolna - Nogi', 'Górna - Pull', 'Full Body'],
      5: ['Klatka & Triceps', 'Plecy & Biceps', 'Nogi', 'Barki & Core', 'Cardio & Core'],
      6: ['Push A', 'Pull A', 'Legs A', 'Push B', 'Pull B', 'Core & Cardio']
    };

    return dayNames[totalDays]?.[dayNum - 1] || `Dzień ${dayNum}`;
  };

  // ZAAWANSOWANE DOSTOSOWANIA
  const adjustPlanForGoal = (exercises, goal) => {
    return exercises.map((exercise) => {
      let adjustedExercise = { ...exercise };

      switch (goal) {
        case 'siła':
          adjustedExercise.reps = String(adjustedExercise.reps).replace(/\d+-\d+/, (match) => {
            const [min, max] = match.split('-').map(Number);
            return `${Math.max(1, min - 2)}-${Math.max(3, max - 3)}`;
          });
          adjustedExercise.rest = Math.min(180, (adjustedExercise.rest || 90) + 30);
          break;

        case 'wytrzymałość':
          adjustedExercise.reps = String(adjustedExercise.reps).replace(/\d+-\d+/, (match) => {
            const [min, max] = match.split('-').map(Number);
            return `${min + 3}-${max + 5}`;
          });
          adjustedExercise.rest = Math.max(30, (adjustedExercise.rest || 90) - 15);
          break;

        case 'spalanie':
          adjustedExercise.rest = Math.max(45, (adjustedExercise.rest || 90) - 20);
          break;

        default:
          break;
      }

      return adjustedExercise;
    });
  };

  // 🧠 Wyciągnięta oryginalna logika — teraz jako fallback generator
  const generateOriginalRecommendedPlan = () => {
    console.log('🤖 Generowanie lokalnego planu (fallback)...');

    // Rozbudowana baza ćwiczeń z podziałem na sprzęt, cel i poziom
    const exerciseDatabase = {
      siłownia: {
        masa: {
          początkujący: [
            { name: 'Wyciskanie sztangi leżąc', sets: '3', reps: '10-12', rest: 90, muscle: 'Klatka piersiowa', difficulty: 'easy' },
            { name: 'Martwy ciąg klasyczny', sets: '3', reps: '8-10', rest: 120, muscle: 'Plecy, nogi', difficulty: 'medium' },
            { name: 'Przysiad ze sztangą', sets: '3', reps: '10-12', rest: 120, muscle: 'Nogi', difficulty: 'medium' },
            { name: 'Wyciskanie żołnierskie', sets: '3', reps: '8-10', rest: 90, muscle: 'Barki', difficulty: 'easy' },
            { name: 'Wiosłowanie sztangą', sets: '3', reps: '10-12', rest: 90, muscle: 'Plecy', difficulty: 'easy' },
            { name: 'Uginanie ramion ze sztangą', sets: '3', reps: '10-12', rest: 60, muscle: 'Biceps', difficulty: 'easy' }
          ],
          średniozaawansowany: [
            { name: 'Wyciskanie sztangi leżąc', sets: '4', reps: '8-10', rest: 90, muscle: 'Klatka piersiowa', difficulty: 'medium' },
            { name: 'Martwy ciąg klasyczny', sets: '4', reps: '6-8', rest: 120, muscle: 'Plecy, nogi', difficulty: 'hard' },
            { name: 'Przysiad ze sztangą', sets: '4', reps: '8-10', rest: 120, muscle: 'Nogi', difficulty: 'hard' },
            { name: 'Wyciskanie żołnierskie', sets: '4', reps: '6-8', rest: 90, muscle: 'Barki', difficulty: 'medium' },
            { name: 'Podciąganie nachwytem', sets: '3', reps: '8-12', rest: 90, muscle: 'Plecy', difficulty: 'medium' },
            { name: 'Dipsy na poręczach', sets: '3', reps: '8-12', rest: 90, muscle: 'Triceps, klatka', difficulty: 'medium' },
            { name: 'Wyciskanie francuskie', sets: '3', reps: '10-12', rest: 60, muscle: 'Triceps', difficulty: 'easy' }
          ]
        },
        siła: {
          początkujący: [
            { name: 'Przysiad ze sztangą', sets: '3', reps: '5-6', rest: 180, muscle: 'Nogi', difficulty: 'hard' },
            { name: 'Wyciskanie sztangi leżąc', sets: '3', reps: '5-6', rest: 180, muscle: 'Klatka piersiowa', difficulty: 'medium' },
            { name: 'Martwy ciąg klasyczny', sets: '3', reps: '5-6', rest: 180, muscle: 'Plecy, nogi', difficulty: 'hard' },
            { name: 'Wyciskanie żołnierskie', sets: '3', reps: '6-8', rest: 150, muscle: 'Barki', difficulty: 'medium' }
          ],
          średniozaawansowany: [
            { name: 'Przysiad ze sztangą', sets: '5', reps: '3-5', rest: 180, muscle: 'Nogi', difficulty: 'hard' },
            { name: 'Wyciskanie sztangi leżąc', sets: '5', reps: '3-5', rest: 180, muscle: 'Klatka piersiowa', difficulty: 'hard' },
            { name: 'Martwy ciąg klasyczny', sets: '5', reps: '1-5', rest: 180, muscle: 'Plecy, nogi', difficulty: 'hard' },
            { name: 'Wyciskanie żołnierskie', sets: '4', reps: '5-6', rest: 150, muscle: 'Barki', difficulty: 'medium' },
            { name: 'Przysiad przedni', sets: '3', reps: '6-8', rest: 120, muscle: 'Nogi', difficulty: 'hard' }
          ]
        }
      },
      masa_ciała: {
        masa: {
          początkujący: [
            { name: 'Pompki klasyczne', sets: '3', reps: '8-12', rest: 60, muscle: 'Klatka piersiowa', difficulty: 'easy' },
            { name: 'Przysiady z masą ciała', sets: '3', reps: '15-20', rest: 60, muscle: 'Nogi', difficulty: 'easy' },
            { name: 'Plank', sets: '3', reps: '30-45s', rest: 45, muscle: 'Core', difficulty: 'easy' },
            { name: 'Wykroki', sets: '3', reps: '10/noga', rest: 60, muscle: 'Nogi', difficulty: 'easy' },
            { name: 'Burpees', sets: '3', reps: '5-8', rest: 90, muscle: 'Full body', difficulty: 'medium' }
          ],
          średniozaawansowany: [
            { name: 'Pompki klasyczne', sets: '4', reps: '12-20', rest: 60, muscle: 'Klatka piersiowa', difficulty: 'medium' },
            { name: 'Pompki diamentowe', sets: '3', reps: '8-12', rest: 60, muscle: 'Triceps', difficulty: 'hard' },
            { name: 'Przysiady jump', sets: '4', reps: '15-20', rest: 60, muscle: 'Nogi', difficulty: 'medium' },
            { name: 'Plank dynamiczny', sets: '3', reps: '45-60s', rest: 45, muscle: 'Core', difficulty: 'medium' },
            { name: 'Burpees', sets: '4', reps: '10-15', rest: 90, muscle: 'Full body', difficulty: 'hard' },
            { name: 'Mountain climbers', sets: '3', reps: '20/noga', rest: 60, muscle: 'Core, cardio', difficulty: 'medium' }
          ]
        },
        wytrzymałość: {
          początkujący: [
            { name: 'Marsz w miejscu', sets: '3', reps: '60s', rest: 30, muscle: 'Cardio', difficulty: 'easy' },
            { name: 'Jumping jacks', sets: '3', reps: '30s', rest: 45, muscle: 'Full body', difficulty: 'easy' },
            { name: 'Przysiady z masą ciała', sets: '3', reps: '20', rest: 45, muscle: 'Nogi', difficulty: 'easy' },
            { name: 'Plank', sets: '3', reps: '20-30s', rest: 30, muscle: 'Core', difficulty: 'easy' }
          ],
          średniozaawansowany: [
            { name: 'Burpees', sets: '4', reps: '10-15', rest: 60, muscle: 'Full body', difficulty: 'hard' },
            { name: 'Mountain climbers', sets: '4', reps: '30/noga', rest: 45, muscle: 'Core, cardio', difficulty: 'medium' },
            { name: 'Jumping jacks', sets: '4', reps: '60s', rest: 30, muscle: 'Full body', difficulty: 'medium' },
            { name: 'High knees', sets: '4', reps: '45s', rest: 30, muscle: 'Cardio', difficulty: 'medium' }
          ]
        }
      },
      dom_podstawowy: {
        masa: {
          początkujący: [
            { name: 'Pompki na kolanach', sets: '3', reps: '8-12', rest: 60, muscle: 'Klatka piersiowa', difficulty: 'easy' },
            { name: 'Przysiady z masą ciała', sets: '3', reps: '15-20', rest: 60, muscle: 'Nogi', difficulty: 'easy' },
            { name: 'Uginanie z butelkami', sets: '3', reps: '12-15', rest: 60, muscle: 'Biceps', difficulty: 'easy' },
            { name: 'Pompki na ławce', sets: '3', reps: '10-15', rest: 60, muscle: 'Triceps', difficulty: 'easy' }
          ],
          średniozaawansowany: [
            { name: 'Pompki klasyczne', sets: '4', reps: '15-20', rest: 60, muscle: 'Klatka piersiowa', difficulty: 'medium' },
            { name: 'Przysiady z obciążeniem', sets: '4', reps: '15-20', rest: 60, muscle: 'Nogi', difficulty: 'medium' },
            { name: 'Martwy ciąg z butelkami', sets: '3', reps: '12-15', rest: 90, muscle: 'Plecy', difficulty: 'medium' },
            { name: 'Wyciskanie nad głową', sets: '3', reps: '10-12', rest: 90, muscle: 'Barki', difficulty: 'medium' }
          ]
        }
      }
    };

    const equipment = planData.equipment || 'masa_ciała';
    const goal = planData.goal || 'masa';
    const level = planData.level || 'początkujący';
    const days = planData.trainingDaysPerWeek || 3;
    const focusAreas = planData.focusAreas || [];
    const avoidances = planData.avoidances || [];

    console.log('🎯 Parametry lokalnego algorytmu:', { equipment, goal, level, days, focusAreas, avoidances });

    // Wybierz odpowiedni zestaw ćwiczeń
    let availableExercises =
      exerciseDatabase[equipment]?.[goal]?.[level] ||
      exerciseDatabase.masa_ciała[goal]?.[level] ||
      exerciseDatabase.masa_ciała.masa.początkujący;

    // Filtrowanie ograniczeń
    if (avoidances.length > 0) {
      availableExercises = availableExercises.filter((exercise) => {
        if (
          avoidances.includes('knee_issues') &&
          (exercise.name.toLowerCase().includes('przysiad') || exercise.name.toLowerCase().includes('wykrok'))
        ) {
          return false;
        }
        if (avoidances.includes('back_issues') && exercise.name.toLowerCase().includes('martwy ciąg')) {
          return false;
        }
        if (
          avoidances.includes('shoulder_issues') &&
          (exercise.name.toLowerCase().includes('wyciskanie') || exercise.name.toLowerCase().includes('barki'))
        ) {
          return false;
        }
        if (avoidances.includes('complex_movements') && exercise.difficulty === 'hard') {
          return false;
        }
        return true;
      });
    }

    // Priorytetyzacja wg obszarów skupienia
    if (focusAreas.length > 0) {
      availableExercises = availableExercises
        .map((exercise) => {
          let priority = 1;
          if (
            focusAreas.includes('upper_body') &&
            (exercise.muscle.includes('Klatka') ||
              exercise.muscle.includes('Plecy') ||
              exercise.muscle.includes('Barki') ||
              exercise.muscle.includes('Biceps') ||
              exercise.muscle.includes('Triceps'))
          ) {
            priority += 0.5;
          }
          if (focusAreas.includes('lower_body') && exercise.muscle.includes('Nogi')) priority += 0.5;
          if (focusAreas.includes('core') && exercise.muscle.includes('Core')) priority += 0.5;
          if (focusAreas.includes('cardio') && (exercise.muscle.includes('Cardio') || exercise.muscle.includes('Full body')))
            priority += 0.5;
          return { ...exercise, priority };
        })
        .sort((a, b) => (b.priority || 1) - (a.priority || 1));
    }

    // Generowanie planu tygodniowego
    const weekPlan = [];
    const exercisesPerDay = Math.max(3, Math.ceil(availableExercises.length / days));

    for (let day = 1; day <= days; day++) {
      const dayName = getDayName(day, days);
      const startIdx = ((day - 1) * exercisesPerDay) % availableExercises.length;

      let dayExercises = [];
      let usedMuscles = new Set();
      let exerciseIndex = startIdx;

      for (let i = 0; i < exercisesPerDay && dayExercises.length < 6; i++) {
        const exercise = availableExercises[exerciseIndex % availableExercises.length];

        if (!usedMuscles.has(exercise.muscle) || dayExercises.length >= exercisesPerDay - 1) {
          dayExercises.push({ ...exercise });
          usedMuscles.add(exercise.muscle);
        }

        exerciseIndex++;
        if (exerciseIndex > availableExercises.length * 2) break;
      }

      const targetDuration = planData.sessionDuration;
      let estimatedDuration = dayExercises.reduce((total, ex) => {
        const avgTimePerExercise = parseInt(ex.sets) * 2 + parseInt(ex.rest) / 60;
        return total + avgTimePerExercise;
      }, 0);

      while (estimatedDuration > targetDuration && dayExercises.length > 2) {
        const leastPriority = dayExercises.reduce(
          (min, ex, idx) => ((ex.priority || 1) < (dayExercises[min].priority || 1) ? idx : min),
          0
        );
        dayExercises.splice(leastPriority, 1);
        estimatedDuration = dayExercises.reduce((total, ex) => {
          const avgTimePerExercise = parseInt(ex.sets) * 2 + parseInt(ex.rest) / 60;
          return total + avgTimePerExercise;
        }, 0);
      }

      // 🛠️ Dostosuj do celu w fallbacku
      const adjusted = adjustPlanForGoal(dayExercises, planData.goal);

      weekPlan.push({
        day,
        name: dayName,
        exercises: adjusted,
        estimatedDuration: Math.round(estimatedDuration),
        targetMuscles: Array.from(usedMuscles)
      });
    }

    return weekPlan;
  };

  // =========================
  //  Nawigacja krokami
  // =========================
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  // ✅ Automatyczne generowanie planu po wejściu w krok 3 (Generowanie planu)
  useEffect(() => {
    if (currentStep === 3) {
      // uruchamiamy główny generator (API + fallback)
      generateRecommendedPlan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // ✅ DODAJ w handleFinalizePlan informację o źródle
  const handleFinalizePlan = () => {
    console.log('✅ Finalizing plan:', planData);

    const finalPlan = {
      ...planData,
      generatedAt: new Date().toISOString(),
      algorithmVersion: planData.algorithmVersion || '2.1',
      aiGenerated: !!planData.aiGenerated,
      createdFromSurvey: fromSurvey, // flaga
      surveyData: fromSurvey ? initialData : null, // dane ankiety
      aiInsights,
      customizations: {
        goalOptimized: true,
        avoidancesApplied: planData.avoidances.length > 0,
        focusAreasApplied: planData.focusAreas.length > 0,
        durationOptimized: true,
        preFilledFromSurvey: fromSurvey // flaga
      }
    };

    navigate('/dashboard', { state: { newPlan: finalPlan } });
  };

  const toggleFocusArea = (areaId) => {
    setPlanData((prev) => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(areaId)
        ? prev.focusAreas.filter((id) => id !== areaId)
        : [...prev.focusAreas, areaId]
    }));
  };

  const toggleAvoidance = (avoidanceId) => {
    setPlanData((prev) => ({
      ...prev,
      avoidances: prev.avoidances.includes(avoidanceId)
        ? prev.avoidances.filter((id) => id !== avoidanceId)
        : [...prev.avoidances, avoidanceId]
    }));
  };

  const updateExercise = (dayIndex, exerciseIndex, field, value) => {
    setPlanData((prev) => {
      const newWeekPlan = [...prev.weekPlan];
      newWeekPlan[dayIndex].exercises[exerciseIndex][field] = value;
      return { ...prev, weekPlan: newWeekPlan };
    });
  };

  // ZAMIANA ĆWICZENIA
  const replaceExercise = (dayIndex, exerciseIndex) => {
    const currentExercise = planData.weekPlan[dayIndex].exercises[exerciseIndex];
    const alternativesMap = getAlternativeExercises(currentExercise);

    if (alternativesMap.length > 0) {
      const randomAlternative = alternativesMap[Math.floor(Math.random() * alternativesMap.length)];
      updateExercise(dayIndex, exerciseIndex, 'name', randomAlternative.name);
      updateExercise(dayIndex, exerciseIndex, 'muscle', randomAlternative.muscle);
      console.log(`🔄 Zamieniono ćwiczenie na: ${randomAlternative.name}`);
    }
  };

  const getAlternativeExercises = (currentExercise) => {
    const alternativesMap = {
      'Pompki klasyczne': [
        { name: 'Pompki na kolanach', muscle: 'Klatka piersiowa' },
        { name: 'Pompki diamentowe', muscle: 'Triceps' },
        { name: 'Pompki szerokie', muscle: 'Klatka piersiowa' }
      ],
      'Przysiady z masą ciała': [
        { name: 'Przysiady jump', muscle: 'Nogi' },
        { name: 'Przysiady sumo', muscle: 'Nogi' },
        { name: 'Wykroki', muscle: 'Nogi' }
      ],
      'Wyciskanie sztangi leżąc': [
        { name: 'Wyciskanie hantli leżąc', muscle: 'Klatka piersiowa' },
        { name: 'Wyciskanie na maszynie', muscle: 'Klatka piersiowa' },
        { name: 'Rozpiętki z hantlami', muscle: 'Klatka piersiowa' }
      ]
    };

    return alternativesMap[currentExercise.name] || [];
  };

  // =========================
  //  Komponenty paneli AI
  // =========================
  const AIInsightsPanel = () =>
    aiInsights && (
      <div className="bg-gradient-to-r from-[#0D7A61]/20 to-[#1DCD9F]/20 rounded-2xl p-4 border border-[#1DCD9F]/30 mb-6">
        <div className="flex items-center mb-3">
          <span className="text-[#1DCD9F] text-xl mr-2">🤖</span>
          <span className="text-white font-bold">AI Analysis</span>
          <span className="ml-auto text-[#1DCD9F] text-sm font-bold">Score: {aiInsights.score}/100</span>
        </div>

        <div className="text-gray-300 text-sm space-y-2">
          <div>
            <div className="font-semibold text-white mb-1">Dlaczego ten plan:</div>
            <div className="grid grid-cols-1 gap-1">
              {aiInsights.whyRecommended?.slice(0, 4).map((reason, idx) => (
                <div key={idx} className="text-xs flex items-center">
                  <span className="text-[#1DCD9F] mr-1">✓</span>
                  {reason}
                </div>
              ))}
            </div>
          </div>

          {aiInsights.socialProof && (
            <div className="pt-2 border-t border-gray-600">
              <div className="text-[#1DCD9F] text-xs">👥 {aiInsights.socialProof}</div>
            </div>
          )}

          {aiInsights.warnings && aiInsights.warnings.length > 0 && (
            <div className="pt-2 border-t border-gray-600">
              <div className="text-yellow-400 text-xs">⚠️ {aiInsights.warnings.join(', ')}</div>
            </div>
          )}

          <div className="pt-2 border-t border-gray-600 text-gray-400 text-xs">
            {planData.isFromDatabase ? '🗄️ Plan z bazy danych' : '💻 Plan lokalny'} | Algorytm: {planData.algorithmVersion} | Czas:
            ~{aiInsights.estimatedDuration}min
            {aiInsights.isFallback && ' | 🔄 Tryb fallback'}
          </div>
        </div>
      </div>
    );

  const APIErrorPanel = () =>
    apiError && (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
        <div className="flex items-center mb-2">
          <span className="text-red-400 text-lg mr-2">⚠️</span>
          <span className="text-red-400 font-bold">Błąd połączenia z serwerem</span>
        </div>
        <div className="text-red-300 text-sm mb-3">{apiError}</div>
        <div className="text-gray-400 text-xs">Użyto lokalnego algorytmu fallback. Funkcjonalność może być ograniczona.</div>
      </div>
    );

  const AlternativePlansPanel = () =>
    alternatives.length > 0 && (
      <div className="bg-[#1D1D1D] rounded-2xl p-4 border border-[#333333] mb-6">
        <div className="flex items-center mb-3">
          <span className="text-[#1DCD9F] text-lg mr-2">🔄</span>
          <span className="text-white font-bold">Alternatywne plany</span>
          <button onClick={loadAlternativePlans} className="ml-auto text-[#1DCD9F] text-xs hover:text-white transition-colors">
            Odśwież
          </button>
        </div>

        <div className="space-y-2">
          {alternatives.slice(0, 3).map((alt) => (
            <div
              key={alt.planId}
              className="bg-[#333333]/50 rounded-lg p-3 hover:bg-[#333333]/70 transition-colors cursor-pointer"
              onClick={() => switchToAlternativePlan(alt.planId)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">{alt.name}</div>
                  <div className="text-gray-400 text-xs">
                    Score: {alt.score}/100 | {alt.difficulty} | {alt.training_days} dni
                  </div>
                  <div className="text-gray-500 text-xs mt-1">{alt.whyRecommended?.[0]}</div>
                </div>
                <div className="text-[#1DCD9F] text-xs ml-2">Zmień →</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

  // =========================
  //  Render kroków
  // =========================
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: // Informacje podstawowe
        return (
          <div className="space-y-6">
            <SurveyInfoBanner />

            <div className="text-center mb-8">
              <h3 className="text-white text-2xl font-bold mb-4">Podstawowe informacje o planie</h3>
              <p className="text-gray-300">Skonfiguruj podstawowe parametry swojego planu treningowego</p>
            </div>

            {/* Nazwa planu */}
            <div>
              <label className="block text-white text-sm font-bold mb-2">Nazwa planu</label>
              <input
                type="text"
                value={planData.name}
                onChange={(e) => setPlanData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="np. Mój plan na masę"
                className="w-full bg-[#1D1D1D] border border-[#333333] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#1DCD9F] focus:outline-none"
              />
            </div>

            {/* Cel */}
            <div>
              <label className="block text-white text-sm font-bold mb-3">Główny cel treningowy</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {goals.map((goal) => (
                  <div
                    key={goal.value}
                    onClick={() => setPlanData((prev) => ({ ...prev, goal: goal.value }))}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                      planData.goal === goal.value ? 'border-[#1DCD9F] bg-[#1DCD9F]/10' : 'border-[#333333] bg-[#1D1D1D] hover:border-[#555555]'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{goal.icon}</span>
                      <span className="text-white font-medium">{goal.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dni treningowe */}
            <div>
              <label className="block text-white text-sm font-bold mb-3">Ile dni w tygodniu chcesz trenować?</label>
              <div className="grid grid-cols-4 gap-3">
                {[3, 4, 5, 6].map((days) => (
                  <button
                    key={days}
                    onClick={() => setPlanData((prev) => ({ ...prev, trainingDaysPerWeek: days }))}
                    className={`p-4 rounded-xl border-2 font-bold transition-all duration-300 ${
                      planData.trainingDaysPerWeek === days
                        ? 'border-[#1DCD9F] bg-[#1DCD9F]/10 text-[#1DCD9F]'
                        : 'border-[#333333] bg-[#1D1D1D] text-white hover:border-[#555555]'
                    }`}
                  >
                    {days} dni
                  </button>
                ))}
              </div>
            </div>

            {/* Sprzęt */}
            <div>
              <label className="block text-white text-sm font-bold mb-3">Dostępny sprzęt</label>
              <div className="space-y-3">
                {equipmentOptions.map((equipment) => (
                  <div
                    key={equipment.value}
                    onClick={() => setPlanData((prev) => ({ ...prev, equipment: equipment.value }))}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                      planData.equipment === equipment.value ? 'border-[#1DCD9F] bg-[#1DCD9F]/10' : 'border-[#333333] bg-[#1D1D1D] hover:border-[#555555]'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{equipment.icon}</span>
                      <span className="text-white font-medium">{equipment.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 1: // Preferencje treningowe
        return (
          <div className="space-y-6">
            <SurveyInfoBanner />

            <div className="text-center mb-8">
              <h3 className="text-white text-2xl font-bold mb-4">Preferencje treningowe</h3>
              <p className="text-gray-300">Dostosuj plan do swoich potrzeb i ograniczeń</p>
            </div>

            {/* Długość sesji */}
            <div>
              <label className="block text-white text-sm font-bold mb-3">Preferowana długość sesji treningowej</label>
              <div className="grid grid-cols-4 gap-3">
                {[30, 45, 60, 90].map((duration) => (
                  <button
                    key={duration}
                    onClick={() => setPlanData((prev) => ({ ...prev, sessionDuration: duration }))}
                    className={`p-3 rounded-xl border-2 font-bold transition-all duration-300 ${
                      planData.sessionDuration === duration
                        ? 'border-[#1DCD9F] bg-[#1DCD9F]/10 text-[#1DCD9F]'
                        : 'border-[#333333] bg-[#1D1D1D] text-white hover:border-[#555555]'
                    }`}
                  >
                    {duration} min
                  </button>
                ))}
              </div>
            </div>

            {/* Długość planu */}
            <div>
              <label className="block text-white text-sm font-bold mb-3">Długość całego planu</label>
              <div className="grid grid-cols-4 gap-3">
                {[4, 8, 12, 16].map((weeks) => (
                  <button
                    key={weeks}
                    onClick={() => setPlanData((prev) => ({ ...prev, planDuration: weeks }))}
                    className={`p-3 rounded-xl border-2 font-bold transition-all duration-300 ${
                      planData.planDuration === weeks
                        ? 'border-[#1DCD9F] bg-[#1DCD9F]/10 text-[#1DCD9F]'
                        : 'border-[#333333] bg-[#1D1D1D] text-white hover:border-[#555555]'
                    }`}
                  >
                    {weeks} tyg
                  </button>
                ))}
              </div>
            </div>

            {/* Dni odpoczynku */}
            <div>
              <label className="block text-white text-sm font-bold mb-3">Elastyczność dni odpoczynku</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPlanData((prev) => ({ ...prev, restDays: 'flexible' }))}
                  className={`p-4 rounded-xl border-2 font-bold transition-all duration-300 ${
                    planData.restDays === 'flexible'
                      ? 'border-[#1DCD9F] bg-[#1DCD9F]/10 text-[#1DCD9F]'
                      : 'border-[#333333] bg-[#1D1D1D] text-white hover:border-[#555555]'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">🔄</div>
                    <div>Elastyczne</div>
                    <div className="text-xs text-gray-400 mt-1">Mogę przesuwać dni</div>
                  </div>
                </button>
                <button
                  onClick={() => setPlanData((prev) => ({ ...prev, restDays: 'fixed' }))}
                  className={`p-4 rounded-xl border-2 font-bold transition-all duration-300 ${
                    planData.restDays === 'fixed'
                      ? 'border-[#1DCD9F] bg-[#1DCD9F]/10 text-[#1DCD9F]'
                      : 'border-[#333333] bg-[#1D1D1D] text-white hover:border-[#555555]'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">📅</div>
                    <div>Stałe</div>
                    <div className="text-xs text-gray-400 mt-1">Określone dni tygodnia</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );

      case 2: // Obszary skupienia
        return (
          <div className="space-y-6">
            <SurveyInfoBanner />

            <div className="text-center mb-8">
              <h3 className="text-white text-2xl font-bold mb-4">Obszary skupienia i ograniczenia</h3>
              <p className="text-gray-300">Wybierz obszary, na których chcesz się skupić i ewentualne ograniczenia</p>
            </div>

            {/* Obszary skupienia */}
            <div>
              <label className="block text-white text-sm font-bold mb-3">Obszary skupienia (wybierz 1-3)</label>
              <div className="grid grid-cols-2 gap-3">
                {focusAreasOptions.map((area) => (
                  <div
                    key={area.id}
                    onClick={() => toggleFocusArea(area.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                      planData.focusAreas.includes(area.id) ? 'border-[#1DCD9F] bg-[#1DCD9F]/10' : 'border-[#333333] bg-[#1D1D1D] hover:border-[#555555]'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{area.icon}</span>
                      <span className="text-white font-medium">{area.label}</span>
                      {planData.focusAreas.includes(area.id) && <span className="ml-auto text-[#1DCD9F]">✓</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ograniczenia */}
            <div>
              <label className="block text-white text-sm font-bold mb-3">Ograniczenia i rzeczy do unikania (opcjonalne)</label>
              <div className="grid grid-cols-1 gap-3">
                {avoidanceOptions.map((avoidance) => (
                  <div
                    key={avoidance.id}
                    onClick={() => toggleAvoidance(avoidance.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                      planData.avoidances.includes(avoidance.id) ? 'border-red-500 bg-red-500/10' : 'border-[#333333] bg-[#1D1D1D] hover:border-[#555555]'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{avoidance.icon}</span>
                      <span className="text-white font-medium">{avoidance.label}</span>
                      {planData.avoidances.includes(avoidance.id) && <span className="ml-auto text-red-400">⚠️</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 3: // Generowanie planu
        return (
          <div className="space-y-6">
            <SurveyInfoBanner />
            <APIErrorPanel />

            <div className="text-center mb-8">
              <h3 className="text-white text-2xl font-bold mb-4">Generowanie planu treningowego AI</h3>
              <p className="text-gray-300">
                {planData.isFromDatabase
                  ? 'Zaawansowany algorytm analizuje bazę danych planów i dopasowuje do Twoich preferencji'
                  : 'Zaawansowany algorytm tworzy spersonalizowany plan na podstawie Twoich preferencji'}
              </p>
            </div>

            {loading ? (
              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-[#1DCD9F] mx-auto"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl">🤖</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-white text-lg font-bold">
                    {planData.isFromDatabase ? 'Algorytm AI przeszukuje bazę danych...' : 'Algorytm AI analizuje Twoje preferencje...'}
                  </div>
                  <div className="text-gray-300">
                    {planData.isFromDatabase ? 'Wyszukiwanie najlepiej dopasowanych planów' : 'Dobieranie optymalnych ćwiczeń i ich rozłożenia'}
                  </div>
                  <div className="text-gray-400 text-sm">Uwzględnianie ograniczeń i obszarów skupienia</div>
                  <div className="text-gray-500 text-xs">
                    {planData.isFromDatabase ? 'Analiza preferencji podobnych użytkowników' : 'Optymalizacja czasu sesji i progresji'}
                  </div>
                </div>

                <div className="w-full bg-[#333333] rounded-full h-2">
                  <div className="bg-[#1DCD9F] h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <AIInsightsPanel />

                <div className="bg-[#1D1D1D] rounded-2xl p-6 border border-[#333333]">
                  <h4 className="text-[#1DCD9F] font-bold mb-4">
                    {planData.isFromDatabase ? 'Znaleziony plan z bazy danych:' : 'Twoje preferencje do analizy AI:'}
                  </h4>

                  {planData.isFromDatabase && planData.originalPlanName && (
                    <div className="mb-4 p-3 bg-[#0D7A61]/10 rounded-lg border border-[#0D7A61]/30">
                      <div className="text-white font-medium">{planData.originalPlanName}</div>
                      {planData.createdBy && <div className="text-gray-400 text-sm">Autor: {planData.createdBy}</div>}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-white">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Cel:</span>
                        <span>{goals.find((g) => g.value === planData.goal)?.label || 'Nie wybrano'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Dni treningowe:</span>
                        <span>{planData.trainingDaysPerWeek} dni/tydzień</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Długość sesji:</span>
                        <span>{planData.sessionDuration} minut</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Sprzęt:</span>
                        <span className="text-xs">
                          {equipmentOptions.find((e) => e.value === planData.equipment)?.label || 'Nie wybrano'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Długość planu:</span>
                        <span>{planData.planDuration} tygodni</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Obszary skupienia:</span>
                        <span className="text-xs">{planData.focusAreas.length} wybranych</span>
                      </div>
                    </div>
                  </div>

                  {(planData.focusAreas.length > 0 || planData.avoidances.length > 0) && (
                    <div className="mt-4 pt-4 border-t border-[#333333]">
                      {planData.focusAreas.length > 0 && (
                        <div className="mb-2">
                          <span className="text-gray-400 text-sm">Skupienie na: </span>
                          <span className="text-[#1DCD9F] text-sm">
                            {planData.focusAreas.map((area) => focusAreasOptions.find((opt) => opt.id === area)?.label).join(', ')}
                          </span>
                        </div>
                      )}
                      {planData.avoidances.length > 0 && (
                        <div>
                          <span className="text-gray-400 text-sm">Ograniczenia: </span>
                          <span className="text-red-400 text-sm">
                            {planData.avoidances.map((avoid) => avoidanceOptions.find((opt) => opt.id === avoid)?.label).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 4: // Dostosowanie ćwiczeń
        return (
          <div className="space-y-6">
            <SurveyInfoBanner />
            <APIErrorPanel />
            <AIInsightsPanel />
            <AlternativePlansPanel />

            <div className="text-center mb-6">
              <h3 className="text-white text-2xl font-bold mb-4">Twój wygenerowany plan AI</h3>
              <p className="text-gray-300">Możesz dostosować parametry ćwiczeń lub zamienić je na inne</p>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {planData.weekPlan.map((day, dayIndex) => (
                <div key={dayIndex} className="bg-[#1D1D1D] rounded-2xl p-6 border border-[#333333]">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[#1DCD9F] font-bold text-lg">{day.name}</h4>
                    <div className="text-right text-sm">
                      <span className="text-gray-400">~{day.estimatedDuration} min</span>
                      {day.targetMuscles && (
                        <div className="text-xs text-gray-500">
                          {day.targetMuscles.slice(0, 2).join(', ')}
                          {day.targetMuscles.length > 2 && '...'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {day.exercises.map((exercise, exerciseIndex) => (
                      <div key={exerciseIndex} className="bg-[#0D7A61]/10 rounded-xl p-4 border border-[#0D7A61]/30">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="text-white font-medium">{exercise.name}</div>
                            <div className="text-gray-400 text-sm">{exercise.muscle}</div>
                            {exercise.priority > 1 && (
                              <div className="text-[#1DCD9F] text-xs">🎯 Priorytetowe dla Twoich celów</div>
                            )}
                          </div>
                          <button
                            onClick={() => replaceExercise(dayIndex, exerciseIndex)}
                            className="text-gray-400 hover:text-white text-sm ml-2 bg-[#333333] hover:bg-[#555555] px-2 py-1 rounded transition-colors"
                          >
                            Zamień ↻
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mt-3">
                          <div>
                            <label className="text-gray-400 text-xs">Serie</label>
                            <input
                              type="text"
                              value={exercise.sets}
                              onChange={(e) => updateExercise(dayIndex, exerciseIndex, 'sets', e.target.value)}
                              className="w-full bg-[#1D1D1D] border border-[#333333] rounded px-2 py-1 text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-gray-400 text-xs">Powtórzenia</label>
                            <input
                              type="text"
                              value={exercise.reps}
                              onChange={(e) => updateExercise(dayIndex, exerciseIndex, 'reps', e.target.value)}
                              className="w-full bg-[#1D1D1D] border border-[#333333] rounded px-2 py-1 text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-gray-400 text-xs">Odpoczynek (s)</label>
                            <input
                              type="number"
                              value={exercise.rest}
                              onChange={(e) => updateExercise(dayIndex, exerciseIndex, 'rest', parseInt(e.target.value))}
                              className="w-full bg-[#1D1D1D] border border-[#333333] rounded px-2 py-1 text-white text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* AI Insights skrót pod listą */}
            <div className="bg-gradient-to-r from-[#0D7A61]/20 to-[#1DCD9F]/20 rounded-2xl p-4 border border-[#1DCD9F]/30">
              <div className="flex items-center mb-2">
                <span className="text-[#1DCD9F] text-lg mr-2">🤖</span>
                <span className="text-white font-bold">Insights od AI</span>
              </div>
              <div className="text-gray-300 text-sm">
                Plan został zoptymalizowany dla Twojego celu ({goals.find((g) => g.value === planData.goal)?.label}) z
                uwzględnieniem {planData.avoidances.length > 0 ? `${planData.avoidances.length} ograniczeń` : 'braku ograniczeń'} i{' '}
                {planData.focusAreas.length} obszarów skupienia.
                {planData.sessionDuration < 45 && (
                  <div className="mt-1 text-yellow-400">💡 Krótkie sesje (~{planData.sessionDuration}min) - skoncentrowano na kluczowych ćwiczeniach</div>
                )}
              </div>
            </div>
          </div>
        );

      case 5: // Finalizacja
        return (
          <div className="space-y-6">
            <SurveyInfoBanner />
            <AIInsightsPanel />

            <div className="text-center mb-8">
              <h3 className="text-white text-2xl font-bold mb-4">Finalizacja planu AI</h3>
              <p className="text-gray-300">Ostatnie poprawki i aktywacja Twojego spersonalizowanego planu treningowego</p>
            </div>

            {/* Nazwa planu */}
            <div>
              <label className="block text-white text-sm font-bold mb-2">Ostateczna nazwa planu</label>
              <input
                type="text"
                value={planData.name}
                onChange={(e) => setPlanData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Wprowadź nazwę planu"
                className="w-full bg-[#1D1D1D] border border-[#333333] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#1DCD9F] focus:outline-none"
              />
            </div>

            {/* Notatki */}
            <div>
              <label className="block text-white text-sm font-bold mb-2">Notatki (opcjonalne)</label>
              <textarea
                value={planData.notes}
                onChange={(e) => setPlanData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Dodaj swoje notatki do planu..."
                rows={4}
                className="w-full bg-[#1D1D1D] border border-[#333333] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#1DCD9F] focus:outline-none resize-none"
              />
            </div>

            {/* Podsumowanie */}
            <div className="bg-[#1D1D1D] rounded-2xl p-6 border border-[#333333]">
              <h4 className="text-[#1DCD9F] font-bold mb-4">Podsumowanie planu AI:</h4>

              {/* Informacje o źródle — gdy plan bazodanowy */}
              {planData.isFromDatabase && (
                <div className="mb-4 p-3 bg-[#0D7A61]/10 rounded-lg border border-[#0D7A61]/30">
                  <div className="text-white font-medium">📋 Plan bazodanowy: {planData.originalPlanName}</div>
                  <div className="text-gray-400 text-sm">Dostosowany algorytmem AI do Twoich preferencji</div>
                  {planData.createdBy && <div className="text-gray-500 text-xs">Oryginalny autor: {planData.createdBy}</div>}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-white">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cel:</span>
                    <span className="text-sm">{goals.find((g) => g.value === planData.goal)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Dni w tygodniu:</span>
                    <span>{planData.trainingDaysPerWeek}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Długość planu:</span>
                    <span>{planData.planDuration} tygodni</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Algorytm:</span>
                    <span className="text-xs">AI {planData.algorithmVersion}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ćwiczeń łącznie:</span>
                    <span>{planData.generatedExercises.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Średni czas sesji:</span>
                    <span>~{planData.sessionDuration} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Skupienie:</span>
                    <span className="text-sm">{planData.focusAreas.length} obszarów</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ograniczenia:</span>
                    <span className="text-sm">{planData.avoidances.length} uwzględnione</span>
                  </div>
                </div>
              </div>

              {/* Szczegóły algorytmu */}
              <div className="mt-4 pt-4 border-t border-[#333333]">
                <div className="text-gray-400 text-xs">Zastosowane optymalizacje AI:</div>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                  <div className="text-green-400">✓ Dostosowanie do celu treningowego</div>
                  <div className="text-green-400">✓ Optymalizacja czasu sesji</div>
                  {planData.avoidances.length > 0 && <div className="text-green-400">✓ Uwzględnienie ograniczeń</div>}
                  {planData.focusAreas.length > 0 && <div className="text-green-400">✓ Priorytetyzacja obszarów</div>}
                  <div className="text-green-400">✓ {planData.isFromDatabase ? 'Analiza bazy danych' : 'Inteligentny dobór ćwiczeń'}</div>
                  <div className="text-green-400">✓ {planData.isFromDatabase ? 'Collaborative filtering' : 'Balans grup mięśniowych'}</div>
                </div>

                {aiInsights && (
                  <div className="mt-2 text-gray-500 text-xs">
                    AI Score: {aiInsights.score}/100 | Algorytm: {planData.algorithmVersion} |{' '}
                    {planData.isFromDatabase ? 'Źródło: Baza danych' : 'Źródło: Lokalny generator'}
                  </div>
                )}
              </div>
            </div>

            {/* Call to action */}
            <div className="bg-gradient-to-r from-[#0D7A61]/10 to-[#1DCD9F]/10 border border-[#1DCD9F]/30 rounded-2xl p-6">
              <div className="text-center">
                <div className="text-[#1DCD9F] text-4xl mb-3">🚀</div>
                <div className="text-white font-bold text-lg mb-2">Plan AI gotowy do startu!</div>
                <div className="text-gray-300 text-sm mb-4">
                  Twój spersonalizowany plan treningowy został wygenerowany przez zaawansowany algorytm AI z uwzględnieniem wszystkich
                  Twoich preferencji i ograniczeń
                </div>
                <div className="bg-[#0D7A61]/20 rounded-xl p-3 text-xs text-gray-400">
                  <div className="font-bold text-[#1DCD9F] mb-1">Funkcje planu AI:</div>
                  <div className="grid grid-cols-2 gap-1">
                    <div>• Adaptacyjna progresja</div>
                    <div>• Inteligentny dobór ćwiczeń</div>
                    <div>• Automatyczne dostosowania</div>
                    <div>• Tracking postępów</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen w-full px-4 py-10"
      style={{
        backgroundImage: `url(${RegisterBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative'
      }}
    >
      {/* Ciemna nakładka */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] to-[#0D7A61]/90 opacity-90" style={{ mixBlendMode: 'multiply' }}></div>

      {/* Logo */}
      <div className="absolute top-8 left-8 z-10">
        <Link to="/">
          <h1 className="text-[#1DCD9F] text-5xl font-bold">Lasko</h1>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto z-10 relative pt-20">
        {/* Header z krokami */}
        <div className="text-center mb-8">
          <h1 className="text-white text-4xl font-bold mb-2">Kreator planu treningowego AI</h1>
          <p className="text-gray-300 text-sm mb-4">Zaawansowany algorytm dostosuje plan do Twoich potrzeb</p>

          {/* Progress steps */}
          <div className="flex justify-center items-center space-x-2 mb-6 overflow-x-auto">
            {steps.map((step, index) => (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center min-w-max">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      index <= currentStep ? 'bg-[#1DCD9F] text-black' : 'bg-[#333333] text-gray-400'
                    }`}
                  >
                    {index <= currentStep ? (index === currentStep ? index + 1 : '✓') : index + 1}
                  </div>
                  <span className={`text-xs mt-2 text-center max-w-20 ${index <= currentStep ? 'text-white' : 'text-gray-400'}`}>{step}</span>
                </div>
                {index < steps.length - 1 && <div className={`w-8 h-0.5 ${index < currentStep ? 'bg-[#1DCD9F]' : 'bg-[#333333]'}`}></div>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Kontent kroku */}
        <div className="bg-[#0a0a0a]/95 rounded-3xl p-8 border border-[#222222] shadow-[0_0_30px_10px_rgba(0,0,0,0.5)] min-h-[600px]">
          {renderCurrentStep()}

          {/* ✅ Przyciski nawigacji */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-[#333333]">
            <div className="flex space-x-4">
              {fromSurvey && (
                <button
                  onClick={() => navigate('/choose-algorithm', { state: { userData: initialData } })}
                  className="px-4 py-3 text-gray-400 hover:text-white transition-colors duration-300 text-sm"
                >
                  🤖 Zmień na AI
                </button>
              )}

              <button
                onClick={handlePrev}
                disabled={currentStep === 0 || loading}
                className="px-6 py-3 text-gray-400 hover:text-white transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Poprzedni krok
              </button>
            </div>

            {currentStep === steps.length - 1 ? (
              <button
                onClick={handleFinalizePlan}
                disabled={!planData.name.trim() || loading}
                className={`px-8 py-3 rounded-full font-bold transition-all duration-300 ${
                  planData.name.trim()
                    ? 'bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] hover:brightness-110'
                    : 'bg-[#333333] text-gray-500 cursor-not-allowed'
                }`}
              >
                🚀 Aktywuj plan AI!
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white font-bold rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] hover:brightness-110 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Algorytm AI pracuje...
                  </div>
                ) : (
                  'Następny krok →'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPlanCreator;
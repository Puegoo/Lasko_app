import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import RegisterBackground from '../../assets/Photos/Register_background.png';
import { isAuthenticated } from '../../services/authService';
import { RecommendationService } from '../../services/recommendationService';

const ALLOW_DEV_FALLBACK = false; // 🔒 tylko rekomendacje z backendu

const EnhancedPlanCreator = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Wejście z poprzedniego ekranu (ankieta/kreator)
  const initialData = location.state?.userData || {};
  const fromSurvey = !!location.state?.fromSurvey;
  const skipBasicInfo = !!location.state?.skipBasicInfo;

  // UI
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [authMissing, setAuthMissing] = useState(false);

  // Panele AI / alternatywy
  const [aiInsights, setAiInsights] = useState(null);
  const [alternatives, setAlternatives] = useState([]);

  // Walidacja
  const [errors, setErrors] = useState({});

  // Kroki
  const steps = [
    'Wybór algorytmu',
    'Informacje podstawowe',
    'Preferencje treningowe',
    'Obszary skupienia',
    'Generowanie planu',
    'Dostosowanie ćwiczeń',
    'Finalizacja'
  ];
  const [currentStep, setCurrentStep] = useState(skipBasicInfo ? 4 : 0);

  // Słowniki UI
  const goals = [
    { value: 'masa', label: 'Budowanie masy mięśniowej', icon: '💪' },
    { value: 'siła', label: 'Zwiększenie siły', icon: '🏋️' },
    { value: 'wytrzymałość', label: 'Poprawa wytrzymałości', icon: '🏃' },
    { value: 'spalanie', label: 'Spalanie tkanki tłuszczowej', icon: '🔥' },
    { value: 'zdrowie', label: 'Ogólne zdrowie i kondycja', icon: '❤️' }
  ];
  const levels = [
    { value: 'początkujący', label: 'Początkujący' },
    { value: 'średniozaawansowany', label: 'Średniozaawansowany' },
    { value: 'zaawansowany', label: 'Zaawansowany' }
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
  const algoOptions = [
    { value: 'product', title: 'Algorytm produktowy', desc: 'Proponuje plany podobne do wybranych planów (item→item).' },
    { value: 'client',  title: 'Algorytm klientowy',  desc: 'Dopasowuje na podstawie Twojego profilu i preferencji (user/content).' },
    { value: 'hybrid',  title: 'Algorytm hybrydowy',  desc: 'Łączy podejście produktowe i klientowe.' }
  ];

  // Normalizacja danych z ankiety
  const normalizeSurvey = (data) => {
    const mapGoal = (g) => {
      const v = (g || '').toString().toLowerCase();
      if (['mass', 'bulking', 'masa'].includes(v)) return 'masa';
      if (['strength', 'siła', 'power'].includes(v)) return 'siła';
      if (['endurance', 'stamina', 'wytrzymałość'].includes(v)) return 'wytrzymałość';
      if (['fatloss', 'fat_loss', 'spalanie', 'cut'].includes(v)) return 'spalanie';
      if (['health', 'zdrowie', 'wellbeing'].includes(v)) return 'zdrowie';
      return '';
    };
    const mapLevel = (lv) => {
      const v = (lv || '').toString().toLowerCase();
      if (['beginner', 'początkujący'].includes(v)) return 'początkujący';
      if (['intermediate', 'średniozaawansowany', 'sredniozaawansowany'].includes(v)) return 'średniozaawansowany';
      if (['advanced', 'zaawansowany'].includes(v)) return 'zaawansowany';
      return '';
    };
    const mapEquipment = (e) => {
      const v = (e || '').toString().toLowerCase();
      if (['gym', 'siłownia', 'silownia'].includes(v)) return 'siłownia';
      if (['home_basic', 'dom_podstawowy'].includes(v)) return 'dom_podstawowy';
      if (['home_advanced', 'dom_zaawansowany'].includes(v)) return 'dom_zaawansowany';
      if (['bodyweight', 'masa_ciała', 'masa ciala'].includes(v)) return 'masa_ciała';
      if (['minimal', 'minimalne'].includes(v)) return 'minimalne';
      return '';
    };

    return {
      goal: mapGoal(data.goal),
      level: mapLevel(data.level),
      equipment: mapEquipment(data.equipmentPreference || data.equipment),
      trainingDaysPerWeek: Number(data.trainingDaysPerWeek) || 3,
      sessionDuration: Number(data.sessionDuration) || 60,
      planDuration: Number(data.planDuration) || 12,
      focusAreas: Array.isArray(data.focusAreas) ? data.focusAreas : [],
      avoidances: Array.isArray(data.avoidances) ? data.avoidances : [],
      recommendationMethod: ['product', 'client', 'hybrid'].includes(data.recommendationMethod)
        ? data.recommendationMethod
        : 'hybrid'
    };
  };

  // Stan planu
  const [planData, setPlanData] = useState(() => {
    const norm = fromSurvey ? normalizeSurvey(initialData) : {};
    const nameFromGoal =
      norm.goal
        ? `Plan ${
            norm.goal === 'masa'
              ? 'na masę'
              : norm.goal === 'siła'
              ? 'siłowy'
              : norm.goal === 'wytrzymałość'
              ? 'wytrzymałościowy'
              : norm.goal === 'spalanie'
              ? 'spalający'
              : 'treningowy'
          }`
        : '';
    return {
      recommendationMethod: norm.recommendationMethod || 'hybrid',
      name: fromSurvey ? nameFromGoal : '',
      goal: norm.goal || '',
      level: norm.level || '',
      equipment: norm.equipment || '',
      trainingDaysPerWeek: norm.trainingDaysPerWeek ?? 3,
      planDuration: norm.planDuration ?? 12,
      sessionDuration: norm.sessionDuration ?? 60,
      restDays: 'flexible',
      focusAreas: norm.focusAreas || [],
      avoidances: norm.avoidances || [],
      weekPlan: [],
      generatedExercises: [],
      notes: '',
      aiGenerated: false,
      isFromDatabase: false,
      algorithmVersion: null,
      planId: null,
      originalPlanName: null,
      createdBy: null,
      fromSurvey,
      sourceAlgorithm: null
    };
  });

  // Walidacje
  const validateBasics = useMemo(() => {
    const errs = {};
    if (!planData.goal) errs.goal = 'Wybierz cel.';
    if (!planData.level) errs.level = 'Wybierz poziom.';
    if (!planData.equipment) errs.equipment = 'Wybierz sprzęt.';
    if (!planData.trainingDaysPerWeek) errs.trainingDaysPerWeek = 'Wybierz liczbę dni.';
    return errs;
  }, [planData.goal, planData.level, planData.equipment, planData.trainingDaysPerWeek]);

  const validatePreferences = useMemo(() => {
    const errs = {};
    if (!planData.sessionDuration) errs.sessionDuration = 'Wybierz długość sesji.';
    if (!planData.planDuration) errs.planDuration = 'Wybierz długość planu.';
    return errs;
  }, [planData.sessionDuration, planData.planDuration]);

  const isStepValid = (stepIndex) => {
    if (stepIndex === 0) return !!planData.recommendationMethod;
    if (stepIndex === 1) return Object.keys(validateBasics).length === 0;
    if (stepIndex === 2) return Object.keys(validatePreferences).length === 0;
    if (stepIndex === 3) return true;
    if (stepIndex === 4) return (planData.weekPlan?.length || 0) > 0;
    if (stepIndex === 5) return (planData.weekPlan?.length || 0) > 0;
    if (stepIndex === 6) return !!planData.name?.trim();
    return true;
  };

  const showErrorsForStep = (stepIndex) => {
    if (stepIndex === 1) setErrors(validateBasics);
    else if (stepIndex === 2) setErrors(validatePreferences);
    else setErrors({});
  };

  const handleNext = async () => {
    if (!isStepValid(currentStep)) {
      showErrorsForStep(currentStep);
      return;
    }
    setErrors({});
    setCurrentStep((s) => s + 1);
  };

  const handlePrev = () => {
    if (currentStep === 0) return;
    setErrors({});
    setCurrentStep((s) => s - 1);
  };

  // --------------------- Backend helpers ---------------------
  const rec = new RecommendationService();

  const fetchPlanDetails = async (planId) => {
    if (!planId) throw new Error('Brak planId dla szczegółów planu');
    const det = await rec.getPlanDetailed(planId);
    return det; // { success, plan }
  };

  // ----------------- Generowanie rekomendacji -----------------
  const generateRecommendedPlan = async () => {
    setLoading(true);
    setApiError(null);
    try {
      if (!isAuthenticated()) {
        throw new Error('Brak tokenu autoryzacji - zaloguj się ponownie');
      }

      const methodMap = { product: 'produktowo', client: 'klientowo', hybrid: 'hybrydowo' };
      const mode = methodMap[planData.recommendationMethod] || 'hybrid';

      const payload = {
        goal: planData.goal,
        level: planData.level,
        trainingDaysPerWeek: planData.trainingDaysPerWeek,
        equipment: planData.equipment,
        sessionDuration: planData.sessionDuration,
        focusAreas: planData.focusAreas,
        avoidances: planData.avoidances,
        planDuration: planData.planDuration,
        source: fromSurvey ? 'survey' : 'creator'
      };

      const { recommendations } = await rec.getRecommendations({ mode, top: 3, preferences: payload });
      if (!Array.isArray(recommendations) || !recommendations.length) {
        throw new Error('Brak rekomendacji dla wybranych parametrów.');
      }

      const best = recommendations[0]; // ✅ pierwszy wynik
      const bestPlanId = best?.planId ?? best?.id ?? best?.plan_id;
      if (!bestPlanId) {
        throw new Error('Błędna odpowiedź serwera: brak planId w rekomendacji.');
      }

      const det = await rec.getPlanDetailed(bestPlanId);
      if (!det?.success || !det?.plan) {
        throw new Error('Nie udało się pobrać szczegółów planu.');
      }

      const wp = (det.plan.days || []).map((day, idx) => ({
        day: idx + 1,
        name: day.name || `Dzień ${idx + 1}`,
        exercises: (day.exercises || []).map((ex) => ({
          name: ex.name,
          sets: ex.target_sets ?? '3',
          reps: ex.target_reps ?? '8-12',
          rest: ex.rest_seconds ?? 60,
          muscle: ex.muscle_group ?? '',
          difficulty: 'medium',
          exerciseId: ex.id
        })),
        estimatedDuration: Math.round(day.estimated_duration ?? planData.sessionDuration ?? 60),
        targetMuscles: day.target_muscle_groups ?? []
      }));

      setPlanData((prev) => ({
        ...prev,
        name: prev.name || best.name || prev.name,
        weekPlan: wp,
        generatedExercises: wp.flatMap((d) => d.exercises),
        aiGenerated: true,
        isFromDatabase: true,
        algorithmVersion: 'reco-v1',
        planId: bestPlanId,
        originalPlanName: best.name,
        sourceAlgorithm: planData.recommendationMethod + '-ranker'
      }));

      const score =
        best.matchPercentage ??
        (typeof best.score === 'number' ? Math.round(best.score) : undefined);

      setAiInsights({
        score: score != null ? Math.min(100, Math.max(0, score)) : undefined,
        whyRecommended: [
          best.goalType ? `Cel: ${best.goalType}` : null,
          best.difficultyLevel ? `Poziom: ${best.difficultyLevel}` : null,
          best.trainingDaysPerWeek ? `${best.trainingDaysPerWeek} dni/tydzień` : null,
          best.equipmentRequired ? `Sprzęt: ${best.equipmentRequired}` : null
        ].filter(Boolean),
        estimatedDuration: planData.sessionDuration
      });

      // Alternatywy
      const rest = recommendations.slice(1);
      const mappedAlts = rest.map((r) => ({
        planId: r.planId ?? r.id ?? r.plan_id ?? null,
        name: r.name || 'Plan alternatywny',
        score: r.matchPercentage ?? (typeof r.score === 'number' ? Math.round(r.score) : undefined),
        training_days: r.trainingDaysPerWeek ?? r.days_per_week ?? undefined,
        difficulty: r.difficultyLevel ?? r.difficulty ?? undefined,
        whyRecommended: Array.isArray(r.whyRecommended) ? r.whyRecommended : (r.whyRecommended ? [r.whyRecommended] : [])
      }));
      setAlternatives(mappedAlts.filter((a) => a.planId));
    } catch (err) {
      console.error('Recommendation error:', err);
      setAiInsights(null);
      setPlanData((p) => ({ ...p, weekPlan: [], generatedExercises: [] }));
      setApiError(err?.message || 'Błąd serwera. Spróbuj ponownie.');
      setAuthMissing(/token|autoryzacji|401|unauthorized/i.test(String(err?.message || '')));
    } finally {
      setLoading(false);
    }
  };

  // Zmiana na alternatywny plan
  const switchToAlternativePlan = async (alt) => {
    if (!alt?.planId) return;
    try {
      setLoading(true);
      const det = await fetchPlanDetails(alt.planId);
      if (det?.success && det?.plan) {
        const altPlan = det.plan;
        const convertedWeekPlan = (altPlan.days || []).map((day, idx) => ({
          day: idx + 1,
          name: day.name || `Dzień ${idx + 1}`,
          exercises: (day.exercises || []).map((ex) => ({
            name: ex.name,
            sets: ex.target_sets ?? '3',
            reps: ex.target_reps ?? '8-12',
            rest: ex.rest_seconds ?? 60,
            muscle: ex.muscle_group ?? '',
            difficulty: 'medium',
            exerciseId: ex.id
          })),
          estimatedDuration: Math.round(day.estimated_duration ?? 60),
          targetMuscles: day.target_muscle_groups ?? []
        }));

        setPlanData((prev) => ({
          ...prev,
          weekPlan: convertedWeekPlan,
          generatedExercises: convertedWeekPlan.flatMap((d) => d.exercises),
          planId: alt.planId,
          originalPlanName: alt.name,
          name: alt.name || prev.name,
          isFromDatabase: true
        }));

        setAiInsights((prev) => ({
          ...(prev || {}),
          score: alt.score != null ? Math.min(100, Math.max(0, alt.score)) : prev?.score,
          whyRecommended: alt.whyRecommended?.length ? alt.whyRecommended : (prev?.whyRecommended || [])
        }));
      } else {
        setApiError('Nie udało się załadować alternatywnego planu.');
      }
    } catch (e) {
      console.error(e);
      setApiError('Nie udało się załadować alternatywnego planu.');
      setAuthMissing(/token|autoryzacji|401|unauthorized/i.test(String(e?.message || '')));
    } finally {
      setLoading(false);
    }
  };

  // Debounce (StrictMode w dev potrafi odpalić efekt 2x)
  const generatedOnceRef = useRef(false);
  useEffect(() => {
    if (currentStep === 4) {
      if (!isStepValid(1)) {
        setCurrentStep(1);
        showErrorsForStep(1);
        return;
      }
      if (!isStepValid(2)) {
        setCurrentStep(2);
        showErrorsForStep(2);
        return;
      }
      if (!generatedOnceRef.current) {
        generatedOnceRef.current = true;
        generateRecommendedPlan();
      }
    } else {
      generatedOnceRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // ---------- helpery UI ----------
  const toggleFocusArea = (id) => {
    setPlanData((p) => ({
      ...p,
      focusAreas: p.focusAreas.includes(id) ? p.focusAreas.filter((x) => x !== id) : [...p.focusAreas, id]
    }));
  };
  const toggleAvoidance = (id) => {
    setPlanData((p) => ({
      ...p,
      avoidances: p.avoidances.includes(id) ? p.avoidances.filter((x) => x !== id) : [...p.avoidances, id]
    }));
  };
  const updateExercise = (dayIndex, exerciseIndex, field, value) => {
    setPlanData((prev) => {
      const newWeek = [...prev.weekPlan];
      newWeek[dayIndex].exercises[exerciseIndex][field] = value;
      return { ...prev, weekPlan: newWeek };
    });
  };

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

  const replaceExercise = (dayIndex, exerciseIndex) => {
    const current = planData.weekPlan[dayIndex].exercises[exerciseIndex];
    const options = alternativesMap[current.name] || [];
    if (!options.length) return;
    const next = options[Math.floor(Math.random() * options.length)];
    updateExercise(dayIndex, exerciseIndex, 'name', next.name);
    updateExercise(dayIndex, exerciseIndex, 'muscle', next.muscle);
  };

  // --- Finalizacja / aktywacja planu ---
  const handleFinalizePlan = async () => {
    const finalPlan = {
      ...planData,
      generatedAt: new Date().toISOString(),
      algorithmUsed: planData.recommendationMethod,
      aiInsights
    };

    try {
      setLoading(true);
      setApiError(null);

      if (!isAuthenticated()) {
        throw new Error('Brak tokenu autoryzacji - zaloguj się ponownie');
      }

      if (finalPlan.planId) {
        await rec.activatePlan(finalPlan.planId);
      } else {
        await rec.createCustomPlan({
          name: finalPlan.name || 'Mój plan',
          goal: finalPlan.goal || '',
          trainingDays: finalPlan.trainingDaysPerWeek || 3,
          equipment: finalPlan.equipment || '',
          notes: finalPlan.notes || ''
        });
      }

      navigate('/dashboard', { state: { newPlan: finalPlan } });
    } catch (e) {
      console.error(e);
      setApiError(e?.message || 'Nie udało się aktywować planu.');
      setAuthMissing(/token|autoryzacji|401|unauthorized/i.test(String(e?.message || '')));
    } finally {
      setLoading(false);
    }
  };

  // =========================
  //  Render kroków
  // =========================
  const SurveyInfoBanner = () =>
    fromSurvey ? (
      <div className="mb-6 bg-[#0D7A61]/10 border border-[#0D7A61]/30 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <span className="text-[#1DCD9F] text-lg">📋</span>
          <div>
            <div className="text-[#1DCD9F] text-sm font-bold">Dane z ankiety</div>
            <div className="text-gray-300 text-xs">Pola zostały wypełnione na podstawie Twojej ankiety. Możesz je edytować.</div>
          </div>
        </div>
      </div>
    ) : null;

  const FieldError = ({ name }) => (errors[name] ? <div className="text-xs text-red-400 mt-1">{errors[name]}</div> : null);

  const APIErrorPanel = () =>
    apiError ? (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
        <div className="flex items-center mb-2">
          <span className="text-red-400 text-lg mr-2">⚠️</span>
          <span className="text-red-400 font-bold">Błąd rekomendacji</span>
        </div>
        <div className="text-red-300 text-sm mb-3">{apiError}</div>
        <div className="flex gap-3">
          {authMissing ? (
            <>
              <button
                onClick={() =>
                  navigate('/login', {
                    state: {
                      redirectTo: location.pathname,
                      redirectState: { userData: initialData, fromSurvey, skipBasicInfo }
                    }
                  })
                }
                className="px-4 py-2 bg-red-500/20 text-red-200 rounded-lg border border-red-500/40 hover:bg-red-500/30 text-sm"
              >
                Zaloguj
              </button>
              <button
                onClick={() => {
                  navigate('/login', {
                    state: {
                      redirectTo: location.pathname,
                      redirectState: { userData: initialData, fromSurvey, skipBasicInfo }
                    }
                  });
                }}
                className="px-4 py-2 bg-neutral-800 text-neutral-200 rounded-lg border border-neutral-600 hover:bg-neutral-700 text-sm"
              >
                Odśwież token
              </button>
            </>
          ) : (
            <button
              onClick={() => generateRecommendedPlan()}
              className="px-4 py-2 bg-red-500/20 text-red-200 rounded-lg border border-red-500/40 hover:bg-red-500/30 text-sm"
            >
              Spróbuj ponownie
            </button>
          )}
        </div>
      </div>
    ) : null;

  const AIInsightsPanel = () =>
    aiInsights ? (
      <div className="bg-gradient-to-r from-[#0D7A61]/20 to-[#1DCD9F]/20 rounded-2xl p-4 border border-[#1DCD9F]/30 mb-6">
        <div className="flex items-center mb-3">
          <span className="text-[#1DCD9F] text-xl mr-2">🤖</span>
        <span className="text-white font-bold">AI Analysis</span>
          {'score' in aiInsights && aiInsights.score != null && (
            <span className="ml-auto text-[#1DCD9F] text-sm font-bold">Score: {aiInsights.score}/100</span>
          )}
        </div>
        <div className="text-gray-300 text-sm space-y-2">
          {Array.isArray(aiInsights.whyRecommended) && aiInsights.whyRecommended.length > 0 && (
            <div>
              <div className="font-semibold text-white mb-1">Dlaczego ten plan:</div>
              <div className="grid grid-cols-1 gap-1">
                {aiInsights.whyRecommended.slice(0, 4).map((r, i) => (
                  <div key={i} className="text-xs flex items-center">
                    <span className="text-[#1DCD9F] mr-1">✓</span>
                    {r}
                  </div>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(aiInsights.warnings) && aiInsights.warnings.length > 0 && (
            <div className="pt-2 border-t border-gray-600">
              <div className="text-yellow-400 text-xs">⚠️ {aiInsights.warnings.join(', ')}</div>
            </div>
          )}

          <div className="pt-2 border-t border-gray-600 text-gray-400 text-xs">
            {planData.isFromDatabase ? '🗄️ Plan z bazy danych' : '🔎 Rekomendacja dynamiczna'} | Algorytm:{' '}
            {planData.recommendationMethod.toUpperCase()} ({planData.algorithmVersion || 'v1'}) | Czas: ~
            {(aiInsights.estimatedDuration ?? planData.sessionDuration) || 60}min
          </div>
        </div>
      </div>
    ) : null;

  const AlternativePlansPanel = () =>
    alternatives.length > 0 ? (
      <div className="bg-[#1D1D1D] rounded-2xl p-4 border border-[#333333] mb-6">
        <div className="flex items-center mb-3">
          <span className="text-[#1DCD9F] text-lg mr-2">🔄</span>
          <span className="text-white font-bold">Alternatywne plany</span>
        </div>

        <div className="space-y-2">
          {alternatives.slice(0, 3).map((alt) => (
            <div
              key={alt.planId}
              className="bg-[#333333]/50 rounded-lg p-3 hover:bg-[#333333]/70 transition-colors cursor-pointer"
              onClick={() => switchToAlternativePlan(alt)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">{alt.name}</div>
                  <div className="text-gray-400 text-xs">
                    {alt.score != null ? <>Score: {alt.score}/100</> : null}
                    {alt.difficulty ? <> | {alt.difficulty}</> : null}
                    {alt.training_days ? <> | {alt.training_days} dni</> : null}
                  </div>
                  {(
                    Array.isArray(alt.whyRecommended) ? alt.whyRecommended.length > 0 : !!alt.whyRecommended
                  ) && (
                    <div className="text-gray-500 text-xs mt-1">
                      {Array.isArray(alt.whyRecommended) ? alt.whyRecommended[0] : alt.whyRecommended}
                    </div>
                  )}
                </div>
                <div className="text-[#1DCD9F] text-xs ml-2">Zmień →</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ) : null;

  // ------------------ Render kroków ------------------
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h3 className="text-white text-2xl font-bold mb-2">Wybierz algorytm rekomendacji</h3>
              <p className="text-gray-300 text-sm">Możesz w każdej chwili wrócić i zmienić wybór.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {algoOptions.map((a) => {
                const active = planData.recommendationMethod === a.value;
                return (
                  <button
                    key={a.value}
                    onClick={() => setPlanData((p) => ({ ...p, recommendationMethod: a.value }))}
                    className={`text-left p-4 rounded-2xl border-2 transition-all ${
                      active ? 'border-[#1DCD9F] bg-[#1DCD9F]/10' : 'border-[#333333] bg-[#1D1D1D] hover:border-[#555555]'
                    }`}
                  >
                    <div className="text-white font-semibold mb-1">{a.title}</div>
                    <div className="text-gray-400 text-sm">{a.desc}</div>
                    {active && <div className="text-[#1DCD9F] text-xs mt-2">✓ Wybrano</div>}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <SurveyInfoBanner />

            <div className="text-center mb-2">
              <h3 className="text-white text-2xl font-bold mb-4">Podstawowe informacje</h3>
              <p className="text-gray-300 text-sm">Te pola są wymagane do działania rekomendacji.</p>
            </div>

            {/* Nazwa */}
            <div>
              <label className="block text-white text-sm font-bold mb-2">Nazwa planu (opcjonalnie)</label>
              <input
                type="text"
                value={planData.name}
                onChange={(e) => setPlanData((p) => ({ ...p, name: e.target.value }))}
                placeholder="np. Plan siłowy 3-dniowy"
                className="w-full bg-[#1D1D1D] border border-[#333333] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#1DCD9F] focus:outline-none"
              />
            </div>

            {/* Cel */}
            <div>
              <label className="block text-white text-sm font-bold mb-3">Główny cel treningowy *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {goals.map((g) => {
                  const active = planData.goal === g.value;
                  return (
                    <div
                      key={g.value}
                      onClick={() => setPlanData((p) => ({ ...p, goal: g.value }))}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        active ? 'border-[#1DCD9F] bg-[#1DCD9F]/10' : 'border-[#333333] bg-[#1D1D1D] hover:border-[#555555]'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{g.icon}</span>
                        <span className="text-white font-medium">{g.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <FieldError name="goal" />
            </div>

            {/* Poziom */}
            <div>
              <label className="block text-white text-sm font-bold mb-3">Poziom zaawansowania *</label>
              <div className="grid grid-cols-3 gap-3">
                {levels.map((lv) => {
                  const active = planData.level === lv.value;
                  return (
                    <button
                      key={lv.value}
                      onClick={() => setPlanData((p) => ({ ...p, level: lv.value }))}
                      className={`p-3 rounded-xl border-2 font-bold transition-all ${
                        active ? 'border-[#1DCD9F] bg-[#1DCD9F]/10 text-[#1DCD9F]' : 'border-[#333333] bg-[#1D1D1D] text-white hover:border-[#555555]'
                      }`}
                    >
                      {lv.label}
                    </button>
                  );
                })}
              </div>
              <FieldError name="level" />
            </div>

            {/* Dni */}
            <div>
              <label className="block text-white text-sm font-bold mb-3">Dni treningowe / tydzień *</label>
              <div className="grid grid-cols-4 gap-3">
                {[3, 4, 5, 6].map((d) => {
                  const active = planData.trainingDaysPerWeek === d;
                  return (
                    <button
                      key={d}
                      onClick={() => setPlanData((p) => ({ ...p, trainingDaysPerWeek: d }))}
                      className={`p-3 rounded-xl border-2 font-bold transition-all ${
                        active ? 'border-[#1DCD9F] bg-[#1DCD9F]/10 text-[#1DCD9F]' : 'border-[#333333] bg-[#1D1D1D] text-white hover:border-[#555555]'
                      }`}
                    >
                      {d} dni
                    </button>
                  );
                })}
              </div>
              <FieldError name="trainingDaysPerWeek" />
            </div>

            {/* Sprzęt */}
            <div>
              <label className="block text-white text-sm font-bold mb-3">Dostępny sprzęt *</label>
              <div className="space-y-3">
                {equipmentOptions.map((e) => {
                  const active = planData.equipment === e.value;
                  return (
                    <div
                      key={e.value}
                      onClick={() => setPlanData((p) => ({ ...p, equipment: e.value }))}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        active ? 'border-[#1DCD9F] bg-[#1DCD9F]/10' : 'border-[#333333] bg-[#1D1D1D] hover:border-[#555555]'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{e.icon}</span>
                        <span className="text-white font-medium">{e.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <FieldError name="equipment" />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <SurveyInfoBanner />

            <div className="text-center mb-2">
              <h3 className="text-white text-2xl font-bold mb-4">Preferencje treningowe</h3>
              <p className="text-gray-300 text-sm">Doprecyzuj parametry potrzebne algorytmowi.</p>
            </div>

            {/* Długość sesji */}
            <div>
              <label className="block text-white text-sm font-bold mb-3">Preferowana długość sesji *</label>
              <div className="grid grid-cols-4 gap-3">
                {[30, 45, 60, 90].map((duration) => {
                  const active = planData.sessionDuration === duration;
                  return (
                    <button
                      key={duration}
                      onClick={() => setPlanData((p) => ({ ...p, sessionDuration: duration }))}
                      className={`p-3 rounded-xl border-2 font-bold transition-all ${
                        active ? 'border-[#1DCD9F] bg-[#1DCD9F]/10 text-[#1DCD9F]' : 'border-[#333333] bg-[#1D1D1D] text-white hover:border-[#555555]'
                      }`}
                    >
                      {duration} min
                    </button>
                  );
                })}
              </div>
              <FieldError name="sessionDuration" />
            </div>

            {/* Długość planu */}
            <div>
              <label className="block text-white text-sm font-bold mb-3">Długość całego planu *</label>
              <div className="grid grid-cols-4 gap-3">
                {[4, 8, 12, 16].map((weeks) => {
                  const active = planData.planDuration === weeks;
                  return (
                    <button
                      key={weeks}
                      onClick={() => setPlanData((p) => ({ ...p, planDuration: weeks }))}
                      className={`p-3 rounded-xl border-2 font-bold transition-all ${
                        active ? 'border-[#1DCD9F] bg-[#1DCD9F]/10 text-[#1DCD9F]' : 'border-[#333333] bg-[#1D1D1D] text-white hover:border-[#555555]'
                      }`}
                    >
                      {weeks} tyg
                    </button>
                  );
                })}
              </div>
              <FieldError name="planDuration" />
            </div>

            {/* Dni odpoczynku */}
            <div>
              <label className="block text-white text-sm font-bold mb-3">Elastyczność dni odpoczynku</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPlanData((p) => ({ ...p, restDays: 'flexible' }))}
                  className={`p-4 rounded-xl border-2 font-bold transition-all ${
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
                  onClick={() => setPlanData((p) => ({ ...p, restDays: 'fixed' }))}
                  className={`p-4 rounded-xl border-2 font-bold transition-all ${
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

      case 3:
        return (
          <div className="space-y-6">
            <SurveyInfoBanner />

            <div className="text-center mb-2">
              <h3 className="text-white text-2xl font-bold mb-4">Obszary skupienia i ograniczenia</h3>
              <p className="text-gray-300 text-sm">Opcjonalne — pomagają lepiej dopasować plan.</p>
            </div>

            {/* Obszary skupienia */}
            <div>
              <label className="block text-white text-sm font-bold mb-3">Obszary skupienia (0–3)</label>
              <div className="grid grid-cols-2 gap-3">
                {focusAreasOptions.map((area) => (
                  <div
                    key={area.id}
                    onClick={() => toggleFocusArea(area.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      planData.focusAreas.includes(area.id)
                        ? 'border-[#1DCD9F] bg-[#1DCD9F]/10'
                        : 'border-[#333333] bg-[#1D1D1D] hover:border-[#555555]'
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
              <label className="block text-white text-sm font-bold mb-3">Ograniczenia (opcjonalnie)</label>
              <div className="grid grid-cols-1 gap-3">
                {avoidanceOptions.map((avoidance) => (
                  <div
                    key={avoidance.id}
                    onClick={() => toggleAvoidance(avoidance.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      planData.avoidances.includes(avoidance.id)
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-[#333333] bg-[#1D1D1D] hover:border-[#555555]'
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

      case 4:
        return (
          <div className="space-y-6">
            <SurveyInfoBanner />
            <APIErrorPanel />

            <div className="text-center mb-6">
              <h3 className="text-white text-2xl font-bold mb-2">Generowanie planu treningowego</h3>
              <p className="text-gray-300">
                Algorytm: <span className="text-[#1DCD9F] font-semibold">{planData.recommendationMethod.toUpperCase()}</span>
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
                <div className="space-y-1 text-gray-300">
                  <div className="text-white font-semibold">Algorytm analizuje Twoje preferencje…</div>
                  <div className="text-sm">Dobieranie ćwiczeń i struktury tygodnia</div>
                </div>
                <div className="w-full bg-[#333333] rounded-full h-2">
                  <div className="bg-[#1DCD9F] h-2 rounded-full animate-pulse" style={{ width: '75%' }} />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <AIInsightsPanel />

                <div className="bg-[#1D1D1D] rounded-2xl p-6 border border-[#333333]">
                  <h4 className="text-[#1DCD9F] font-bold mb-4">Twoje parametry:</h4>

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
                        <span>{goals.find((g) => g.value === planData.goal)?.label || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Dni treningowe:</span>
                        <span>{planData.trainingDaysPerWeek} / tydz.</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Długość sesji:</span>
                        <span>{planData.sessionDuration} min</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Sprzęt:</span>
                        <span className="text-xs">
                          {equipmentOptions.find((e) => e.value === planData.equipment)?.label || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Długość planu:</span>
                        <span>{planData.planDuration} tygodni</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Obszary skupienia:</span>
                        <span className="text-xs">{(planData.focusAreas?.length ?? 0)} wybranych</span>
                      </div>
                    </div>
                  </div>

                  {(planData.focusAreas.length > 0 || planData.avoidances.length > 0) && (
                    <div className="mt-4 pt-4 border-t border-[#333333]">
                      {planData.focusAreas.length > 0 && (
                        <div className="mb-1 text-sm">
                          <span className="text-gray-400">Skupienie: </span>
                          <span className="text-[#1DCD9F]">
                            {planData.focusAreas
                              .map((a) => focusAreasOptions.find((o) => o.id === a)?.label)
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </div>
                      )}
                      {planData.avoidances.length > 0 && (
                        <div className="text-sm">
                          <span className="text-gray-400">Ograniczenia: </span>
                          <span className="text-red-400">
                            {planData.avoidances
                              .map((a) => avoidanceOptions.find((o) => o.id === a)?.label)
                              .filter(Boolean)
                              .join(', ')}
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

      case 5:
        return (
          <div className="space-y-6">
            <SurveyInfoBanner />
            <AIInsightsPanel />
            <AlternativePlansPanel />

            <div className="text-center mb-4">
              <h3 className="text-white text-2xl font-bold">Twój wygenerowany plan</h3>
              <p className="text-gray-300 text-sm">Możesz edytować parametry lub zamienić ćwiczenia.</p>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {planData.weekPlan.map((day, dayIndex) => (
                <div key={dayIndex} className="bg-[#1D1D1D] rounded-2xl p-6 border border-[#333333]">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[#1DCD9F] font-bold text-lg">{day.name}</h4>
                    <div className="text-right text-sm">
                      <span className="text-gray-400">~{day.estimatedDuration} min</span>
                      {Array.isArray(day.targetMuscles) && day.targetMuscles.length > 0 && (
                        <div className="text-xs text-gray-500">
                          {day.targetMuscles.slice(0, 2).join(', ')}
                          {day.targetMuscles.length > 2 && '…'}
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
                              onChange={(e) => updateExercise(dayIndex, exerciseIndex, 'rest', parseInt(e.target.value || 0))}
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
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <SurveyInfoBanner />
            <AIInsightsPanel />

            <div className="text-center mb-6">
              <h3 className="text-white text-2xl font-bold mb-2">Finalizacja planu</h3>
              <p className="text-gray-300 text-sm">
                Algorytm: <span className="text-[#1DCD9F] font-semibold">{planData.recommendationMethod.toUpperCase()}</span>
              </p>
            </div>

            {/* Nazwa planu */}
            <div>
              <label className="block text-white text-sm font-bold mb-2">Ostateczna nazwa planu *</label>
              <input
                type="text"
                value={planData.name}
                onChange={(e) => setPlanData((p) => ({ ...p, name: e.target.value }))}
                placeholder="np. Hybrydowy 3-dniowy"
                className="w-full bg-[#1D1D1D] border border-[#333333] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#1DCD9F] focus:outline-none"
              />
              {!planData.name?.trim() && <div className="text-xs text-red-400 mt-1">Wpisz nazwę planu.</div>}
            </div>

            {/* Notatki */}
            <div>
              <label className="block text-white text-sm font-bold mb-2">Notatki (opcjonalne)</label>
              <textarea
                value={planData.notes}
                onChange={(e) => setPlanData((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Dodaj swoje notatki do planu…"
                rows={4}
                className="w-full bg-[#1D1D1D] border border-[#333333] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#1DCD9F] focus:outline-none resize-none"
              />
            </div>

            {/* Podsumowanie */}
            <div className="bg-[#1D1D1D] rounded-2xl p-6 border border-[#333333]">
              <h4 className="text-[#1DCD9F] font-bold mb-4">Podsumowanie:</h4>

              {planData.isFromDatabase && (
                <div className="mb-4 p-3 bg-[#0D7A61]/10 rounded-lg border border-[#0D7A61]/30">
                  <div className="text-white font-medium">📋 Plan bazodanowy: {planData.originalPlanName}</div>
                  <div className="text-gray-400 text-sm">Dostosowany algorytmem do Twoich preferencji</div>
                  {planData.createdBy && <div className="text-gray-500 text-xs">Autor: {planData.createdBy}</div>}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-white">
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-gray-400">Cel:</span><span className="text-sm">{goals.find((g) => g.value === planData.goal)?.label || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Dni w tygodniu:</span><span>{planData.trainingDaysPerWeek}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Długość planu:</span><span>{planData.planDuration} tyg</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Algorytm:</span><span className="text-xs">{planData.recommendationMethod.toUpperCase()} ({planData.algorithmVersion || 'v1'})</span></div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-gray-400">Ćwiczeń łącznie:</span><span>{planData.generatedExercises.length}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Średni czas sesji:</span><span>~{planData.sessionDuration} min</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Skupienie:</span><span className="text-sm">{(planData.focusAreas?.length ?? 0)} obsz.</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Ograniczenia:</span><span className="text-sm">{(planData.avoidances?.length ?? 0)}</span></div>
                </div>
              </div>

              {aiInsights && (
                <div className="mt-4 pt-4 border-t border-[#333333] text-gray-500 text-xs">
                  AI Score: {aiInsights.score ?? '—'}/100 | Źródło: {planData.isFromDatabase ? 'Baza planów' : 'Rekomendacja dynamiczna'}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // --- Nawigacja / CTA ---
  const canGoNext =
    currentStep === steps.length - 1
      ? !!planData.name?.trim()
      : isStepValid(currentStep) && (currentStep !== 4 ? true : (planData.weekPlan?.length || 0) > 0) && !loading;

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
          <h1 className="text-white text-4xl font-bold mb-2">Kreator planu treningowego</h1>
          <p className="text-gray-300 text-sm mb-4">Wybierz algorytm i skonfiguruj swoje preferencje</p>

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
                    {index < currentStep ? '✓' : index + 1}
                  </div>
                  <span className={`text-xs mt-2 text-center max-w-20 ${index <= currentStep ? 'text-white' : 'text-gray-400'}`}>
                    {step}
                  </span>
                </div>
                {index < steps.length - 1 && <div className={`w-8 h-0.5 ${index < currentStep ? 'bg-[#1DCD9F]' : 'bg-[#333333]'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Kontent kroku */}
        <div className="bg-[#0a0a0a]/95 rounded-3xl p-8 border border-[#222222] shadow-[0_0_30px_10px_rgba(0,0,0,0.5)] min-h-[600px]">
          {renderCurrentStep()}

          {/* Przyciski nawigacji */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-[#333333]">
            <div className="flex space-x-4">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(0)}
                  disabled={loading}
                  className="px-4 py-3 text-gray-400 hover:text-white transition-colors duration-300 text-sm disabled:opacity-50"
                >
                  ⚙️ Zmień algorytm
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
                disabled={!planData.name?.trim() || loading}
                className={`px-8 py-3 rounded-full font-bold transition-all duration-300 ${
                  planData.name?.trim()
                    ? 'bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] hover:brightness-110'
                    : 'bg-[#333333] text-gray-500 cursor-not-allowed'
                }`}
              >
                🚀 Aktywuj plan
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canGoNext}
                className="px-8 py-3 bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white font-bold rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] hover:brightness-110 disabled:opacity-50"
              >
                {loading && currentStep === 4 ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Algorytm pracuje…
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
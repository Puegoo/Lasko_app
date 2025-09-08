// src/components/register/EnhancedPlanCreator.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import RegisterBackground from '../../assets/Photos/Register_background.png';
import LaskoBody from '../../assets/lasko_pose/lasko_body.webp'; // obraz po prawej w "Pomiary ciała"
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

  // KROKI — zamieniony krok 3 na „Pomiary ciała”
  const steps = [
    'Wybór algorytmu',
    'Informacje podstawowe',
    'Preferencje treningowe',
    'Pomiary ciała',
    'Generowanie planu',
    'Dostosowanie ćwiczeń',
    'Finalizacja'
  ];
  const [currentStep, setCurrentStep] = useState(0);

  // pomocnik do wskaźnika etapu
  const getMaxStep = () => steps.length - 1;

  // Słowniki UI (ikony/obrazy w /public/images)
  const goals = [
    { value: 'masa',          label: 'Budowanie masy mięśniowej',  icon: '/images/goal-mass.webp' },
    { value: 'siła',          label: 'Zwiększenie siły',           icon: '/images/goal-strength.webp' },
    { value: 'wytrzymałość',  label: 'Poprawa wytrzymałości',      icon: '/images/goal-endurance.webp' },
    { value: 'spalanie',      label: 'Spalanie tkanki tłuszczowej',icon: '/images/goal-fatloss.webp' },
    { value: 'zdrowie',       label: 'Ogólne zdrowie i kondycja',  icon: '/images/goal-health.webp' }
  ];
  const levels = [
    { value: 'początkujący',        label: 'Początkujący' },
    { value: 'średniozaawansowany', label: 'Średniozaawansowany' },
    { value: 'zaawansowany',        label: 'Zaawansowany' }
  ];
  const equipmentOptions = [
    { value: 'siłownia',         label: 'Pełne wyposażenie siłowni',    icon: '/images/equipment-gym.webp' },
    { value: 'dom_podstawowy',   label: 'Podstawowy sprzęt domowy',     icon: '/images/equipment-home-basic.webp' },
    { value: 'dom_zaawansowany', label: 'Zaawansowane home gym',        icon: '/images/equipment-home-adv.webp' },
    { value: 'masa_ciała',       label: 'Tylko masa ciała',             icon: '/images/equipment-bodyweight.webp' },
    { value: 'minimalne',        label: 'Minimalne wyposażenie',        icon: '/images/equipment-minimal.webp' }
  ];
  const algoOptions = [
    {
      value: 'product',
      title: 'Algorytm produktowy',
      desc: 'Proponuje plany podobne do wybranych planów (item→item).',
      img: '/images/alg-product.webp'
    },
    {
      value: 'client',
      title: 'Algorytm klientowy',
      desc: 'Dopasowuje na podstawie Twojego profilu i preferencji (user/content).',
      img: '/images/alg-client.webp'
    },
    {
      value: 'hybrid',
      title: 'Algorytm hybrydowy',
      desc: 'Łączy podejście produktowe i klientowe.',
      img: '/images/alg-hybrid.webp'
    }
  ];

  // Normalizacja danych z ankiety
  const normalizeSurvey = (data) => {
    const mapGoal = (g) => {
      const v = (g || '').toString().toLowerCase();
      if (['mass', 'bulking', 'masa'].includes(v)) return 'masa';
      if (['strength', 'siła', 'power', 'sila'].includes(v)) return 'siła';
      if (['endurance', 'stamina', 'wytrzymałość', 'wytrzymalosc'].includes(v)) return 'wytrzymałość';
      if (['fatloss', 'fat_loss', 'spalanie', 'cut'].includes(v)) return 'spalanie';
      if (['health', 'zdrowie', 'wellbeing'].includes(v)) return 'zdrowie';
      return '';
    };
    const mapLevel = (lv) => {
      const v = (lv || '').toString().toLowerCase();
      if (['beginner', 'początkujący', 'poczatkujacy'].includes(v)) return 'początkujący';
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
      body: {
        age: Number(data.age) || null,
        weightKg: Number(data.weightKg) || null,
        heightCm: Number(data.heightCm) || null,
      },
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
      body: {
        age: norm.body?.age ?? '',
        weightKg: norm.body?.weightKg ?? '',
        heightCm: norm.body?.heightCm ?? '',
      },
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

  // BMI
  const bmi = useMemo(() => {
    const w = Number(planData.body?.weightKg);
    const h = Number(planData.body?.heightCm);
    if (!w || !h) return null;
    const hm = h / 100;
    const val = w / (hm * hm);
    return Number.isFinite(val) ? Math.round(val * 10) / 10 : null;
  }, [planData.body]);

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

  const validateBody = useMemo(() => {
    const errs = {};
    const age = Number(planData.body?.age);
    const weight = Number(planData.body?.weightKg);
    const height = Number(planData.body?.heightCm);

    if (!age || age < 13 || age > 90) errs.age = 'Podaj wiek 13–90.';
    if (!weight || weight < 30 || weight > 300) errs.weightKg = 'Podaj wagę 30–300 kg.';
    if (!height || height < 120 || height > 230) errs.heightCm = 'Podaj wzrost 120–230 cm.';

    return errs;
  }, [planData.body]);

  const isStepValid = (stepIndex) => {
    if (stepIndex === 0) return !!planData.recommendationMethod;
    if (stepIndex === 1) return Object.keys(validateBasics).length === 0;
    if (stepIndex === 2) return Object.keys(validatePreferences).length === 0;
    if (stepIndex === 3) return Object.keys(validateBody).length === 0;
    if (stepIndex === 4) return (planData.weekPlan?.length || 0) > 0;
    if (stepIndex === 5) return (planData.weekPlan?.length || 0) > 0;
    if (stepIndex === 6) return !!planData.name?.trim();
    return true;
  };

  const showErrorsForStep = (stepIndex) => {
    if (stepIndex === 1) setErrors(validateBasics);
    else if (stepIndex === 2) setErrors(validatePreferences);
    else if (stepIndex === 3) setErrors(validateBody);
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
        planDuration: planData.planDuration,
        source: fromSurvey ? 'survey' : 'creator',
        body: {
          age: Number(planData.body?.age) || null,
          weightKg: Number(planData.body?.weightKg) || null,
          heightCm: Number(planData.body?.heightCm) || null,
          bmi: bmi
        }
      };

      const { recommendations } = await rec.getRecommendations({ mode, top: 3, preferences: payload });
      if (!Array.isArray(recommendations) || !recommendations.length) {
        throw new Error('Brak rekomendacji dla wybranych parametrów.');
      }

      const best = recommendations[0];
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
          best.equipmentRequired ? `Sprzęt: ${best.equipmentRequired}` : null,
          ...(Array.isArray(best.bodyHints) ? best.bodyHints : [])
        ].filter(Boolean),
        estimatedDuration: planData.sessionDuration
      });

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

  // --- Edycja ćwiczeń (bezpieczne implementacje) ---
  const updateExercise = (dayIndex, exerciseIndex, field, value) => {
    setPlanData((prev) => {
      const weekPlan = prev.weekPlan.map((day, di) => {
        if (di !== dayIndex) return day;
        const exercises = day.exercises.map((ex, ei) => (ei === exerciseIndex ? { ...ex, [field]: value } : ex));
        return { ...day, exercises };
      });
      const generatedExercises = weekPlan.flatMap((d) => d.exercises);
      return { ...prev, weekPlan, generatedExercises };
    });
  };

  // Placeholder „Zamień ćwiczenie”
  const replaceExercise = (dayIndex, exerciseIndex) => {
    setPlanData((prev) => {
      const weekPlan = prev.weekPlan.map((day, di) => {
        if (di !== dayIndex) return day;
        const exercises = day.exercises.map((ex, ei) =>
          ei === exerciseIndex
            ? {
                ...ex,
                name: ex.name + ' (zamiana)',
                reps: ex.reps,
                sets: ex.sets,
                rest: ex.rest
              }
            : ex
        );
        return { ...day, exercises };
      });
      const generatedExercises = weekPlan.flatMap((d) => d.exercises);
      return { ...prev, weekPlan, generatedExercises };
    });
  };

  // Debounce (StrictMode w dev)
  const generatedOnceRef = useRef(false);
  useEffect(() => {
    if (currentStep === 4) {
      if (!isStepValid(1)) { setCurrentStep(1); showErrorsForStep(1); return; }
      if (!isStepValid(2)) { setCurrentStep(2); showErrorsForStep(2); return; }
      if (!isStepValid(3)) { setCurrentStep(3); showErrorsForStep(3); return; }
      if (!generatedOnceRef.current) {
        generatedOnceRef.current = true;
        generateRecommendedPlan();
      }
    } else {
      generatedOnceRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // --- Finalizacja / aktywacja planu ---
  const handleFinalizePlan = async () => {
    const finalPlan = {
      ...planData,
      generatedAt: new Date().toISOString(),
      algorithmUsed: planData.recommendationMethod,
      aiInsights,
      body: { ...planData.body, bmi }
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
  //  UI: panele pomocnicze
  // =========================
  const FieldError = ({ name }) =>
    errors[name] ? <div className="text-xs text-red-400 mt-1">{errors[name]}</div> : null;

  const APIErrorPanel = () =>
    apiError ? (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
        <div className="flex items-center mb-2">
          <img src="/images/warning.webp" alt="" className="w-5 h-5 mr-2" loading="lazy" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <div className="aspect-[16/9] w-full mb-3 overflow-hidden rounded-xl bg-[#111]">
                      <img src={a.img} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="text-white font-semibold mb-1">{a.title}</div>
                    <div className="text-gray-400 text-sm">{a.desc}</div>
                    {active && <div className="text-[#1DCD9F] text-xs mt-2">Wybrano</div>}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        <img src={g.icon} alt="" className="w-6 h-6" loading="lazy" />
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
              <div className="grid grid-cols-3 gap-4">
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
              <div className="grid grid-cols-4 gap-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        <img src={e.icon} alt="" className="w-6 h-6" loading="lazy" />
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
            <div className="text-center mb-2">
              <h3 className="text-white text-2xl font-bold mb-4">Preferencje treningowe</h3>
              <p className="text-gray-300 text-sm">Doprecyzuj parametry potrzebne algorytmowi.</p>
            </div>

            {/* Długość sesji */}
            <div>
              <label className="block text-white text-sm font-bold mb-3">Preferowana długość sesji *</label>
              <div className="grid grid-cols-4 gap-4">
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
              <div className="grid grid-cols-4 gap-4">
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
                    <img src="/images/flex.webp" alt="" className="w-6 h-6 mx-auto mb-2 opacity-80" loading="lazy" />
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
                    <img src="/images/calendar.webp" alt="" className="w-6 h-6 mx-auto mb-2 opacity-80" loading="lazy" />
                    <div>Stałe</div>
                    <div className="text-xs text-gray-400 mt-1">Określone dni tygodnia</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );

      case 3: // ✅ NOWY KROK: Pomiary ciała (lewo: formularz, prawo: obraz)
        return (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <h3 className="text-white text-2xl font-bold mb-4">Pomiary ciała</h3>
              <p className="text-gray-300 text-sm">Wiek, waga i wzrost pomogą lepiej dopasować objętość i trudność.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* Lewy kafelek: formularz */}
              <div className="bg-[#1D1D1D] rounded-2xl p-6 border border-[#333333]">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white text-sm font-bold mb-2">Wiek *</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={13}
                        max={90}
                        value={planData.body?.age ?? ''}
                        onChange={(e) =>
                          setPlanData((p) => ({ ...p, body: { ...p.body, age: e.target.value } }))
                        }
                        placeholder="np. 28"
                        className="w-full bg-[#1D1D1D] border border-[#333333] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#1DCD9F] focus:outline-none"
                      />
                      <img src="/images/user.webp" alt="" className="w-4 h-4 absolute right-3 top-3.5 opacity-60" loading="lazy" />
                    </div>
                    <FieldError name="age" />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-bold mb-2">Waga (kg) *</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min={30}
                        max={300}
                        value={planData.body?.weightKg ?? ''}
                        onChange={(e) =>
                          setPlanData((p) => ({ ...p, body: { ...p.body, weightKg: e.target.value } }))
                        }
                        placeholder="np. 82"
                        className="w-full bg-[#1D1D1D] border border-[#333333] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#1DCD9F] focus:outline-none"
                      />
                      <img src="/images/scale.webp" alt="" className="w-4 h-4 absolute right-3 top-3.5 opacity-60" loading="lazy" />
                    </div>
                    <FieldError name="weightKg" />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-bold mb-2">Wzrost (cm) *</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={120}
                        max={230}
                        value={planData.body?.heightCm ?? ''}
                        onChange={(e) =>
                          setPlanData((p) => ({ ...p, body: { ...p.body, heightCm: e.target.value } }))
                        }
                        placeholder="np. 180"
                        className="w-full bg-[#1D1D1D] border border-[#333333] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#1DCD9F] focus:outline-none"
                      />
                      <img src="/images/height.webp" alt="" className="w-4 h-4 absolute right-3 top-3.5 opacity-60" loading="lazy" />
                    </div>
                    <FieldError name="heightCm" />
                  </div>
                </div>

                {/* BMI podgląd */}
                <div className="mt-6 bg-[#111111] rounded-2xl p-4 border border-[#333333]">
                  <div className="flex items-center">
                    <img src="/images/bmi.webp" alt="" className="w-5 h-5 mr-2 opacity-80" loading="lazy" />
                    <div className="text-white font-semibold">BMI</div>
                    <div className="ml-auto text-[#1DCD9F] font-bold">{bmi ?? '—'}</div>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    BMI jest orientacyjne. Służy jedynie do modyfikacji objętości/poziomu planu.
                  </div>
                </div>
              </div>

              {/* Prawa kolumna: obraz */}
              <div className="rounded-2xl overflow-hidden border border-[#333333] bg-[#0b0b0b] flex items-center justify-center">
                <img
                  src={LaskoBody}
                  alt="Lasko — sylwetka do pomiarów ciała"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
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
                    <img src="/images/ai.webp" alt="" className="w-8 h-8 opacity-80" loading="lazy" />
                  </div>
                </div>
                <div className="space-y-1 text-gray-300">
                  <div className="text-white font-semibold">Algorytm analizuje Twoje dane…</div>
                  <div className="text-sm">Dobieranie ćwiczeń i struktury tygodnia</div>
                </div>
                <div className="w-full bg-[#333333] rounded-full h-2">
                  <div className="bg-[#1DCD9F] h-2 rounded-full animate-pulse" style={{ width: '75%' }} />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {aiInsights && (
                  <div className="bg-gradient-to-r from-[#0D7A61]/20 to-[#1DCD9F]/20 rounded-2xl p-4 border border-[#1DCD9F]/30 mb-2">
                    <div className="flex items-center mb-3">
                      <img src="/images/ai.webp" alt="" className="w-5 h-5 mr-2" loading="lazy" />
                      <span className="text-white font-bold">AI Analysis</span>
                      {'score' in aiInsights && aiInsights.score != null && (
                        <span className="ml-auto text-[#1DCD9F] text-sm font-bold">Score: {aiInsights.score}/100</span>
                      )}
                    </div>
                    {Array.isArray(aiInsights.whyRecommended) && aiInsights.whyRecommended.length > 0 && (
                      <ul className="text-gray-300 text-sm grid grid-cols-1 gap-1">
                        {aiInsights.whyRecommended.slice(0, 4).map((r, i) => (
                          <li key={i} className="text-xs flex items-center">
                            <img src="/images/check.webp" alt="" className="w-4 h-4 mr-2 opacity-80" loading="lazy" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="bg-[#1D1D1D] rounded-2xl p-6 border border-[#333333]">
                  <h4 className="text-[#1DCD9F] font-bold mb-4">Twoje parametry:</h4>

                  {planData.isFromDatabase && planData.originalPlanName && (
                    <div className="mb-4 p-3 bg-[#0D7A61]/10 rounded-lg border border-[#0D7A61]/30">
                      <div className="flex items-center">
                        <img src="/images/plan.webp" alt="" className="w-4 h-4 mr-2 opacity-80" loading="lazy" />
                        <div className="text-white font-medium">{planData.originalPlanName}</div>
                      </div>
                      {planData.createdBy && <div className="text-gray-400 text-sm">Autor: {planData.createdBy}</div>}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
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
                      <div className="flex justify-between">
                        <span className="text-gray-400">Sprzęt:</span>
                        <span className="text-xs">
                          {equipmentOptions.find((e) => e.value === planData.equipment)?.label || '—'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Długość planu:</span>
                        <span>{planData.planDuration} tygodni</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Wiek / Waga / Wzrost:</span>
                        <span>
                          {(planData.body?.age ?? '—')} / {(planData.body?.weightKg ?? '—')}kg / {(planData.body?.heightCm ?? '—')}cm
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">BMI:</span>
                        <span>{bmi ?? '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {alternatives.length > 0 && (
                  <div className="bg-[#1D1D1D] rounded-2xl p-4 border border-[#333333]">
                    <div className="flex items-center mb-3">
                      <img src="/images/swap.webp" alt="" className="w-5 h-5 mr-2" loading="lazy" />
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
                            </div>
                            <div className="text-[#1DCD9F] text-xs ml-2">Zmień →</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
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
                            Zamień
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
                  <div className="flex items-center">
                    <img src="/images/plan.webp" alt="" className="w-4 h-4 mr-2 opacity-80" loading="lazy" />
                    <div className="text-white font-medium">Plan bazodanowy: {planData.originalPlanName}</div>
                  </div>
                  <div className="text-gray-400 text-sm">Dostosowany algorytmem do Twoich danych</div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-gray-400">Cel:</span><span className="text-sm">{goals.find((g) => g.value === planData.goal)?.label || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Dni w tygodniu:</span><span>{planData.trainingDaysPerWeek}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Długość planu:</span><span>{planData.planDuration} tyg</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Algorytm:</span><span className="text-xs">{planData.recommendationMethod.toUpperCase()} ({planData.algorithmVersion || 'v1'})</span></div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-gray-400">Ćwiczeń łącznie:</span><span>{planData.generatedExercises.length}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Śr. czas sesji:</span><span>~{planData.sessionDuration} min</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Wiek/Waga/Wzrost:</span><span>{(planData.body?.age ?? '—')} / {(planData.body?.weightKg ?? '—')}kg / {(planData.body?.heightCm ?? '—')}cm</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">BMI:</span><span>{bmi ?? '—'}</span></div>
                </div>
              </div>
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
      className="min-h-screen w-full px-6 py-8"
      style={{
        backgroundImage: `url(${RegisterBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
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

      {/* WSKAŹNIK ETAPU – prawy górny róg */}
      <div className="absolute top-8 right-8 z-10 text-right">
        <div className="text-white text-sm mb-1">
          Krok {currentStep + 1} z {getMaxStep() + 1}
        </div>
        <div className="w-32 h-2 bg-gray-600 rounded-full mt-2">
          <div
            className="h-full bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / (getMaxStep() + 1)) * 100}%` }}
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto z-10 relative pt-24">
        {/* KAFEL (szerszy, przewijany wewnątrz w razie potrzeby) */}
        <div className="bg-[#0a0a0a]/95 rounded-3xl p-10 border border-[#222222] shadow-[0_0_30px_10px_rgba(0,0,0,0.5)]
                        min-h-[calc(100vh-220px)] overflow-y-auto">
          {APIErrorPanel()}
          {renderCurrentStep()}

          {/* Przyciski nawigacji – jak na stronie głównej */}
          <div className="mt-8 pt-6 border-t border-[#333333]">
            {/* Desktop navigation buttons - visible above 768px */}
            <div className="hidden md:flex gap-2 justify-between items-center">
              <div>
                {currentStep > 0 ? (
                  <button
                    onClick={handlePrev}
                    disabled={loading}
                    className="text-[#e0e0e0] px-6 py-3 rounded-full transition-all duration-300 hover:bg-gradient-to-r hover:from-[#0D7A61] hover:to-[#1DCD9F] hover:text-white hover:shadow-[0_0_15px_rgba(29,205,159,0.5)] font-black disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Poprzedni krok
                  </button>
                ) : (
                  <span />
                )}
              </div>

              {currentStep === steps.length - 1 ? (
                <button
                  onClick={handleFinalizePlan}
                  disabled={!planData.name?.trim() || loading}
                  className="text-[#e0e0e0] px-6 py-3 rounded-full transition-all duration-300 hover:bg-gradient-to-r hover:from-[#0D7A61] hover:to-[#1DCD9F] hover:text-white hover:shadow-[0_0_15px_rgba(29,205,159,0.5)] font-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Aktywuj plan
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!canGoNext}
                  className="text-[#e0e0e0] px-6 py-3 rounded-full transition-all duration-300 hover:bg-gradient-to-r hover:from-[#0D7A61] hover:to-[#1DCD9F] hover:text-white hover:shadow-[0_0_15px_rgba(29,205,159,0.5)] font-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && currentStep === 4 ? 'Algorytm pracuje…' : 'Następny krok →'}
                </button>
              )}
            </div>

            {/* Mobile (pełna szerokość) */}
            <div className="md:hidden grid grid-cols-2 gap-3 mt-3">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0 || loading}
                className="text-[#e0e0e0] px-4 py-3 rounded-full transition-all duration-300 hover:bg-gradient-to-r hover:from-[#0D7A61] hover:to-[#1DCD9F] hover:text-white hover:shadow-[0_0_15px_rgba(29,205,159,0.5)] font-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Wstecz
              </button>
              {currentStep === steps.length - 1 ? (
                <button
                  onClick={handleFinalizePlan}
                  disabled={!planData.name?.trim() || loading}
                  className="text-[#e0e0e0] px-4 py-3 rounded-full transition-all duration-300 hover:bg-gradient-to-r hover:from-[#0D7A61] hover:to-[#1DCD9F] hover:text-white hover:shadow-[0_0_15px_rgba(29,205,159,0.5)] font-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Aktywuj
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!canGoNext}
                  className="text-[#e0e0e0] px-4 py-3 rounded-full transition-all duration-300 hover:bg-gradient-to-r hover:from-[#0D7A61] hover:to-[#1DCD9F] hover:text-white hover:shadow-[0_0_15px_rgba(29,205,159,0.5)] font-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Dalej →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPlanCreator;
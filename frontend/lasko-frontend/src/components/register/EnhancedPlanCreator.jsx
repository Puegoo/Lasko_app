// frontend/lasko-frontend/src/components/register/EnhancedPlanCreator.jsx - KOMPLETNIE NAPRAWIONY
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // ✅ NAPRAWIONE: używaj AuthContext
import RegisterBackground from '../../assets/Photos/Register_background.png';
import LaskoBody from '../../assets/lasko_pose/lasko_body.webp';

// ============================================================================
// DEFINICJE OPCJI I KONFIGURACJI
// ============================================================================
const methodOptions = [
  {
    value: 'product',
    title: 'Na podstawie produktu',
    description: 'Rekomendacje oparte na popularnych planach treningowych',
    icon: '⚡',
    features: ['Najpopularniejsze plany', 'Sprawdzone kombinacje', 'Szybkie wyniki'],
    color: 'from-blue-500/15 to-blue-400/10',
    chipColor: 'bg-blue-500'
  },
  {
    value: 'user', 
    title: 'Na podstawie klienta',
    description: 'Personalizowane rekomendacje na podstawie Twojego profilu',
    icon: '👤',
    features: ['Dostosowane do poziomu', 'Uwzględnia sprzęt', 'Personalizacja'],
    color: 'from-emerald-500/15 to-emerald-400/10',
    chipColor: 'bg-emerald-500'
  },
  {
    value: 'hybrid',
    title: 'Hybrydowo',
    description: 'Kombinacja obu metod dla najlepszych rezultatów',
    icon: '🔄',
    features: ['Najlepsza dokładność', 'Balansuje podejścia', 'Rekomendowane'],
    color: 'from-purple-500/15 to-purple-400/10',
    chipColor: 'bg-purple-500',
    recommended: true
  }
];

const goalOptions = [
  { value: 'masa', label: 'Masa mięśniowa', icon: '💪' },
  { value: 'siła', label: 'Zwiększenie siły', icon: '🏋️' },
  { value: 'redukcja', label: 'Redukcja tkanki tłuszczowej', icon: '🔥' },
  { value: 'wytrzymalosc', label: 'Wytrzymałość', icon: '🏃' },
  { value: 'zdrowie', label: 'Zdrowie ogólne', icon: '❤️' }
];

const levelOptions = [
  { value: 'początkujący', label: 'Początkujący', description: '0-1 rok doświadczenia' },
  { value: 'średniozaawansowany', label: 'Średniozaawansowany', description: '1-3 lata doświadczenia' },
  { value: 'zaawansowany', label: 'Zaawansowany', description: '3+ lata doświadczenia' }
];

const equipmentOptions = [
  { value: 'siłownia', label: 'Pełna siłownia', icon: '🏟️' },
  { value: 'dom_hantle', label: 'Dom (hantle + ławka)', icon: '🏠' },
  { value: 'dom_masa', label: 'Dom (masa własna)', icon: '🤸' },
  { value: 'minimalne', label: 'Minimalne wyposażenie', icon: '⚡' }
];

const EnhancedPlanCreator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ NAPRAWIONE: Używaj AuthContext zamiast nieistniejącego hook
  const { 
    user, 
    isAuthenticated, 
    getToken, 
    generateRecommendations,
    debugAuth 
  } = useAuth();

  // ============================================================================
  // STAN KOMPONENTU
  // ============================================================================
  const initialData = location.state?.userData || {};
  const fromSurvey = location.state?.fromSurvey || false;

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [errors, setErrors] = useState({});

  const [planData, setPlanData] = useState({
    // Metoda rekomendacji (krok 0)
    recommendationMethod: initialData.recommendationMethod || '',
    
    // Podstawy (krok 1)
    goal: initialData.goal || '',
    level: initialData.level || '',
    trainingDaysPerWeek: initialData.trainingDaysPerWeek || 3,
    
    // Preferencje (krok 2)
    equipment: initialData.equipment || '',
    timePerSession: initialData.timePerSession || 60,
    focusAreas: initialData.focusAreas || [],
    avoidances: initialData.avoidances || [],
    
    // Dane ciała (krok 3)
    body: {
      age: initialData.age || '',
      weightKg: initialData.weightKg || '',
      heightCm: initialData.heightCm || '',
      bmi: initialData.bmi || null,
    },
    
    // Nazwa planu (krok 4)
    name: initialData.name || '',
    
    // Wygenerowany plan
    recommendedPlan: null
  });

  // ============================================================================
  // OBLICZENIA I WALIDACJE
  // ============================================================================
  const bmi = useMemo(() => {
    const { weightKg, heightCm } = planData.body;
    if (weightKg && heightCm && weightKg > 0 && heightCm > 0) {
      const bmiValue = weightKg / Math.pow(heightCm / 100, 2);
      return parseFloat(bmiValue.toFixed(1));
    }
    return null;
  }, [planData.body.weightKg, planData.body.heightCm]);

  const bmiCategory = useMemo(() => {
    if (!bmi) return null;
    
    if (bmi < 18.5) return { text: 'Niedowaga', color: 'text-blue-400' };
    if (bmi < 25) return { text: 'Prawidłowa', color: 'text-green-400' };
    if (bmi < 30) return { text: 'Nadwaga', color: 'text-yellow-400' };
    return { text: 'Otyłość', color: 'text-red-400' };
  }, [bmi]);

  // Aktualizuj BMI w danych
  useEffect(() => {
    if (bmi) {
      setPlanData(prev => ({
        ...prev,
        body: { ...prev.body, bmi }
      }));
    }
  }, [bmi]);

  // Walidacje kroków
  const validateBasics = useMemo(() => {
    const errs = {};
    if (!planData.goal) errs.goal = 'Wybierz cel treningowy.';
    if (!planData.level) errs.level = 'Wybierz poziom zaawansowania.';
    if (!planData.trainingDaysPerWeek || planData.trainingDaysPerWeek < 2 || planData.trainingDaysPerWeek > 7) {
      errs.trainingDaysPerWeek = 'Wybierz 2-7 dni treningowych tygodniowo.';
    }
    return errs;
  }, [planData.goal, planData.level, planData.trainingDaysPerWeek]);

  const validatePreferences = useMemo(() => {
    const errs = {};
    if (!planData.equipment) errs.equipment = 'Wybierz dostępne wyposażenie.';
    if (!planData.timePerSession || planData.timePerSession < 15 || planData.timePerSession > 180) {
      errs.timePerSession = 'Czas treningu: 15-180 minut.';
    }
    return errs;
  }, [planData.equipment, planData.timePerSession]);

  const validateBody = useMemo(() => {
    const errs = {};
    const { age, weightKg, heightCm } = planData.body;
    
    if (!age || age < 16 || age > 100) {
      errs.age = 'Podaj wiek między 16 a 100 lat.';
    }
    if (!weightKg || weightKg < 30 || weightKg > 300) {
      errs.weightKg = 'Podaj wagę między 30 a 300 kg.';
    }
    if (!heightCm || heightCm < 120 || heightCm > 250) {
      errs.heightCm = 'Podaj wzrost między 120 a 250 cm.';
    }

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
    if (stepIndex === 4) return !!planData.name?.trim();
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
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const handlePrev = () => {
    setErrors({});
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  // ============================================================================
  // GENEROWANIE REKOMENDACJI - NAPRAWIONE
  // ============================================================================
  const generateRecommendedPlan = async () => {
    setLoading(true);
    setApiError(null);
    
    try {
      // ✅ NAPRAWIONE: Sprawdź autoryzację przez AuthContext
      if (!isAuthenticated()) {
        console.error('❌ [EnhancedPlanCreator] Brak autoryzacji');
        debugAuth(); // Debug dla diagnostyki
        throw new Error('Brak autoryzacji - zaloguj się ponownie');
      }

      console.log('🚀 [EnhancedPlanCreator] Generowanie planu z danymi:', {
        method: planData.recommendationMethod,
        goal: planData.goal,
        level: planData.level,
        equipment: planData.equipment,
        user: user?.username,
        hasToken: !!getToken()
      });

      // Przygotuj preferencje dla API
      const preferences = {
        goal: planData.goal,
        level: planData.level,
        equipment_preference: planData.equipment,
        training_days_per_week: planData.trainingDaysPerWeek,
        time_per_session: planData.timePerSession,
        focus_areas: planData.focusAreas,
        avoidances: planData.avoidances,
        body: planData.body
      };

      // ✅ NAPRAWIONE: Wywołaj generateRecommendations z AuthContext
      const response = await generateRecommendations(
        planData.recommendationMethod, 
        preferences
      );
      
      if (response && response.recommendations && response.recommendations.length > 0) {
        const recommendedPlan = response.recommendations[0]; // Weź pierwszy plan
        
        setPlanData(prev => ({
          ...prev,
          recommendedPlan,
          name: recommendedPlan.name || prev.name
        }));
        
        console.log('✅ [EnhancedPlanCreator] Plan wygenerowany:', recommendedPlan);
        
        // Nawiguj do podsumowania
        navigate('/plan-summary', { 
          state: { 
            planData: { 
              ...planData, 
              recommendedPlan,
              name: recommendedPlan.name || planData.name
            },
            fromCreator: true
          } 
        });
      } else {
        throw new Error('Nie otrzymano rekomendacji planu');
      }
      
    } catch (error) {
      console.error('❌ [EnhancedPlanCreator] Błąd generowania planu:', error);
      setApiError(error.message);
      
      // Jeśli błąd autoryzacji, pokaż dodatkowe debugi
      if (error.message.includes('autoryzacji')) {
        console.error('🔍 [EnhancedPlanCreator] Debug autoryzacji:');
        console.error('- isAuthenticated:', isAuthenticated());
        console.error('- hasToken:', !!getToken());
        console.error('- user:', user);
        debugAuth();
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // RENDEROWANIE KROKÓW
  // ============================================================================

  // Krok 0: Wybór metody rekomendacji
  const renderMethodStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Wybierz metodę rekomendacji
        </h2>
        <p className="text-gray-300 text-lg">
          Jak chcesz żeby Lasko dobierał dla Ciebie plany?
        </p>
      </div>

      <div className="grid gap-6">
        {methodOptions.map(option => (
          <div
            key={option.value}
            onClick={() => setPlanData(prev => ({ ...prev, recommendationMethod: option.value }))}
            className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
              planData.recommendationMethod === option.value
                ? 'border-[#1DCD9F] bg-gradient-to-br from-[#1DCD9F]/10 to-[#0D7A61]/5'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            {option.recommended && (
              <div className="absolute -top-2 -right-2 bg-[#1DCD9F] text-white text-xs px-2 py-1 rounded-full font-bold">
                POLECANE
              </div>
            )}
            
            <div className="flex items-start gap-4">
              <div className="text-3xl">{option.icon}</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">{option.title}</h3>
                <p className="text-gray-300 mb-4">{option.description}</p>
                <div className="flex gap-2 flex-wrap">
                  {option.features.map(feature => (
                    <span key={feature} className={`text-xs px-2 py-1 rounded ${option.chipColor} text-white`}>
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Krok 1: Podstawy
  const renderBasicsStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Podstawy treningowe</h2>
        <p className="text-gray-300 text-lg">Ustal swój cel i poziom zaawansowania</p>
      </div>

      {/* Cel treningowy */}
      <div>
        <label className="block text-white font-bold mb-4">Cel treningowy</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {goalOptions.map(goal => (
            <button
              key={goal.value}
              onClick={() => setPlanData(prev => ({ ...prev, goal: goal.value }))}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                planData.goal === goal.value
                  ? 'border-[#1DCD9F] bg-[#1DCD9F]/10 text-white'
                  : 'border-gray-600 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="text-2xl mb-2">{goal.icon}</div>
              <div className="text-sm font-medium">{goal.label}</div>
            </button>
          ))}
        </div>
        {errors.goal && <p className="text-red-400 text-sm mt-2">{errors.goal}</p>}
      </div>

      {/* Poziom zaawansowania */}
      <div>
        <label className="block text-white font-bold mb-4">Poziom zaawansowania</label>
        <div className="space-y-3">
          {levelOptions.map(level => (
            <button
              key={level.value}
              onClick={() => setPlanData(prev => ({ ...prev, level: level.value }))}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                planData.level === level.value
                  ? 'border-[#1DCD9F] bg-[#1DCD9F]/10 text-white'
                  : 'border-gray-600 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="font-bold">{level.label}</div>
              <div className="text-sm opacity-75">{level.description}</div>
            </button>
          ))}
        </div>
        {errors.level && <p className="text-red-400 text-sm mt-2">{errors.level}</p>}
      </div>

      {/* Dni treningowe */}
      <div>
        <label className="block text-white font-bold mb-4">
          Dni treningowe w tygodniu: {planData.trainingDaysPerWeek}
        </label>
        <input
          type="range"
          min="2"
          max="7"
          value={planData.trainingDaysPerWeek}
          onChange={(e) => setPlanData(prev => ({ 
            ...prev, 
            trainingDaysPerWeek: parseInt(e.target.value) 
          }))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-sm text-gray-400 mt-2">
          <span>2 dni</span>
          <span>7 dni</span>
        </div>
        {errors.trainingDaysPerWeek && (
          <p className="text-red-400 text-sm mt-2">{errors.trainingDaysPerWeek}</p>
        )}
      </div>
    </div>
  );

  // Krok 2: Preferencje
  const renderPreferencesStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Preferencje treningowe</h2>
        <p className="text-gray-300 text-lg">Dostosuj plan do swoich możliwości</p>
      </div>

      {/* Sprzęt */}
      <div>
        <label className="block text-white font-bold mb-4">Dostępne wyposażenie</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {equipmentOptions.map(equipment => (
            <button
              key={equipment.value}
              onClick={() => setPlanData(prev => ({ ...prev, equipment: equipment.value }))}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                planData.equipment === equipment.value
                  ? 'border-[#1DCD9F] bg-[#1DCD9F]/10 text-white'
                  : 'border-gray-600 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{equipment.icon}</span>
                <span className="font-medium">{equipment.label}</span>
              </div>
            </button>
          ))}
        </div>
        {errors.equipment && <p className="text-red-400 text-sm mt-2">{errors.equipment}</p>}
      </div>

      {/* Czas treningu */}
      <div>
        <label className="block text-white font-bold mb-4">
          Czas na trening: {planData.timePerSession} minut
        </label>
        <input
          type="range"
          min="15"
          max="180"
          step="15"
          value={planData.timePerSession}
          onChange={(e) => setPlanData(prev => ({ 
            ...prev, 
            timePerSession: parseInt(e.target.value) 
          }))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-sm text-gray-400 mt-2">
          <span>15 min</span>
          <span>180 min</span>
        </div>
        {errors.timePerSession && (
          <p className="text-red-400 text-sm mt-2">{errors.timePerSession}</p>
        )}
      </div>
    </div>
  );

  // Krok 3: Dane ciała
  const renderBodyStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Twoje parametry</h2>
        <p className="text-gray-300 text-lg">Pomogą nam lepiej dopasować trening</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Wiek */}
          <div>
            <label className="block text-white font-bold mb-2">Wiek</label>
            <input
              type="number"
              min="16"
              max="100"
              value={planData.body.age}
              onChange={(e) => setPlanData(prev => ({
                ...prev,
                body: { ...prev.body, age: parseInt(e.target.value) || '' }
              }))}
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-[#1DCD9F] focus:outline-none"
              placeholder="np. 25"
            />
            {errors.age && <p className="text-red-400 text-sm mt-1">{errors.age}</p>}
          </div>

          {/* Waga */}
          <div>
            <label className="block text-white font-bold mb-2">Waga (kg)</label>
            <input
              type="number"
              min="30"
              max="300"
              step="0.1"
              value={planData.body.weightKg}
              onChange={(e) => setPlanData(prev => ({
                ...prev,
                body: { ...prev.body, weightKg: parseFloat(e.target.value) || '' }
              }))}
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-[#1DCD9F] focus:outline-none"
              placeholder="np. 70.5"
            />
            {errors.weightKg && <p className="text-red-400 text-sm mt-1">{errors.weightKg}</p>}
          </div>

          {/* Wzrost */}
          <div>
            <label className="block text-white font-bold mb-2">Wzrost (cm)</label>
            <input
              type="number"
              min="120"
              max="250"
              value={planData.body.heightCm}
              onChange={(e) => setPlanData(prev => ({
                ...prev,
                body: { ...prev.body, heightCm: parseInt(e.target.value) || '' }
              }))}
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-[#1DCD9F] focus:outline-none"
              placeholder="np. 175"
            />
            {errors.heightCm && <p className="text-red-400 text-sm mt-1">{errors.heightCm}</p>}
          </div>
        </div>

        {/* BMI i podsumowanie */}
        <div className="flex flex-col justify-center">
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-600">
            <h3 className="text-white font-bold text-lg mb-4">Twoje BMI</h3>
            {bmi ? (
              <div className="text-center">
                <div className="text-3xl font-bold text-[#1DCD9F] mb-2">{bmi}</div>
                <div className={`text-lg ${bmiCategory?.color}`}>{bmiCategory?.text}</div>
                <div className="mt-4 text-sm text-gray-400">
                  BMI jest orientacyjne i nie uwzględnia masy mięśniowej
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                Uzupełnij wagę i wzrost aby zobaczyć BMI
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Krok 4: Nazwa planu
  const renderNameStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ostatni krok!</h2>
        <p className="text-gray-300 text-lg">Nadaj nazwę swojemu planowi treningowemu</p>
      </div>

      <div className="max-w-md mx-auto">
        <label className="block text-white font-bold mb-4">Nazwa planu</label>
        <input
          type="text"
          value={planData.name}
          onChange={(e) => setPlanData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white text-center text-lg focus:border-[#1DCD9F] focus:outline-none"
          placeholder="np. Mój plan na masę"
          maxLength={50}
        />
        <div className="text-center text-sm text-gray-400 mt-2">
          {planData.name.length}/50 znaków
        </div>
        {errors.name && <p className="text-red-400 text-sm mt-2 text-center">{errors.name}</p>}
      </div>

      {/* Podsumowanie */}
      <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-600 max-w-2xl mx-auto">
        <h3 className="text-white font-bold text-lg mb-4">Podsumowanie planu</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Metoda:</span>
            <span className="text-white ml-2">
              {methodOptions.find(m => m.value === planData.recommendationMethod)?.title || 'Nie wybrano'}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Cel:</span>
            <span className="text-white ml-2">
              {goalOptions.find(g => g.value === planData.goal)?.label || 'Nie wybrano'}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Poziom:</span>
            <span className="text-white ml-2">{planData.level || 'Nie wybrano'}</span>
          </div>
          <div>
            <span className="text-gray-400">Dni/tydzień:</span>
            <span className="text-white ml-2">{planData.trainingDaysPerWeek}</span>
          </div>
          <div>
            <span className="text-gray-400">Sprzęt:</span>
            <span className="text-white ml-2">
              {equipmentOptions.find(e => e.value === planData.equipment)?.label || 'Nie wybrano'}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Czas/sesja:</span>
            <span className="text-white ml-2">{planData.timePerSession} min</span>
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // GŁÓWNY RENDER
  // ============================================================================
  const steps = [
    renderMethodStep,
    renderBasicsStep, 
    renderPreferencesStep,
    renderBodyStep,
    renderNameStep
  ];

  const stepTitles = [
    'Metoda',
    'Podstawy', 
    'Preferencje',
    'Parametry',
    'Nazwa'
  ];

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4"
      style={{ backgroundImage: `url(${RegisterBackground})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 to-[#0D7A61]/70"></div>

      <div className="relative w-full max-w-4xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {stepTitles.map((title, index) => (
              <div
                key={index}
                className={`flex items-center ${
                  index <= currentStep ? 'text-[#1DCD9F]' : 'text-gray-500'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                    index <= currentStep
                      ? 'bg-[#1DCD9F] border-[#1DCD9F] text-white'
                      : 'border-gray-500 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                <span className="ml-2 text-sm font-medium hidden sm:block">{title}</span>
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Główna zawartość */}
        <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
          {steps[currentStep]()}

          {/* Błędy API */}
          {apiError && (
            <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-300 text-center">{apiError}</p>
              {apiError.includes('autoryzacji') && (
                <div className="mt-2 text-center">
                  <Link 
                    to="/login" 
                    className="text-[#1DCD9F] underline hover:text-[#1DCD9F]/80"
                  >
                    Przejdź do logowania
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Nawigacja */}
          <div className="flex justify-between items-center mt-8">
            <div>
              {currentStep > 0 ? (
                <button
                  onClick={handlePrev}
                  disabled={loading}
                  className="px-6 py-3 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Wstecz
                </button>
              ) : (
                <Link
                  to="/dashboard"
                  className="px-6 py-3 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600 transition-all"
                >
                  Anuluj
                </Link>
              )}
            </div>

            <div>
              {currentStep === steps.length - 1 ? (
                <button
                  onClick={generateRecommendedPlan}
                  disabled={!isStepValid(currentStep) || loading || !isAuthenticated()}
                  className="px-8 py-3 bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white rounded-xl font-bold hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generowanie...
                    </div>
                  ) : (
                    'Wygeneruj plan'
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!isStepValid(currentStep) || loading}
                  className="px-8 py-3 bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white rounded-xl font-bold hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Dalej
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Debug info w trybie development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 bg-gray-900 p-4 rounded-lg text-xs text-gray-300">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <strong>Krok:</strong> {currentStep + 1}/{steps.length}
              </div>
              <div>
                <strong>Autoryzacja:</strong> {isAuthenticated() ? '✅' : '❌'}
              </div>
              <div>
                <strong>Token:</strong> {getToken() ? '✅' : '❌'}
              </div>
              <div>
                <strong>Użytkownik:</strong> {user?.username || '❌'}
              </div>
              <div>
                <strong>BMI:</strong> {bmi || 'brak'}
              </div>
              <div>
                <strong>Kategoria BMI:</strong> {bmiCategory?.text || 'brak'}
              </div>
              <div>
                <strong>Metoda:</strong> {planData.recommendationMethod || 'brak'}
              </div>
              <div>
                <strong>Błędy:</strong> {Object.keys(errors).length}
              </div>
            </div>
            
            <button
              onClick={() => {
                console.log('🔍 [EnhancedPlanCreator] Debug Full State:');
                console.log('planData:', planData);
                console.log('errors:', errors);
                debugAuth();
              }}
              className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs"
            >
              Debug do konsoli
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedPlanCreator;
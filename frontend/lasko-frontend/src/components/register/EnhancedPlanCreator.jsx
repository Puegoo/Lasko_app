// frontend/lasko-frontend/src/components/register/EnhancedPlanCreator.jsx - KOMPLETNIE NAPRAWIONY
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // NAPRAWIONE: używaj hook zamiast context
import RegisterBackground from '../../assets/Photos/Register_background.png';
import LaskoBody from '../../assets/lasko_pose/lasko_body.webp';

// DODANE: Definicje opcji dla pierwszego kroku
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
  const { user, isAuthenticated, getToken, generateRecommendations } = useAuth(); // NAPRAWIONE: użyj hook

  // Wejście z poprzedniego ekranu
  const initialData = location.state?.userData || {};
  const fromSurvey = !!location.state?.fromSurvey;

  // Stan kreatora
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [errors, setErrors] = useState({});

  // Normalizacja danych z ankiety
  const normalizeSurvey = (data) => {
    return {
      goal: data.goal || '',
      level: data.level || '',
      equipment: data.equipment || data.equipmentPreference || '',
      trainingDaysPerWeek: data.trainingDaysPerWeek || data.trainingDays || 3,
      sessionDuration: data.sessionDuration || 60,
      planDuration: data.planDuration || 12,
      recommendationMethod: data.recommendationMethod || 'hybrid',
      body: {
        age: data.age || data.body?.age || '',
        weightKg: data.weightKg || data.weight || data.body?.weightKg || '',
        heightCm: data.heightCm || data.height || data.body?.heightCm || '',
      }
    };
  };

  // Stan planu
  const [planData, setPlanData] = useState(() => {
    const normalized = fromSurvey ? normalizeSurvey(initialData) : {};
    
    return {
      recommendationMethod: normalized.recommendationMethod || 'hybrid',
      name: '',
      goal: normalized.goal || '',
      level: normalized.level || '',
      equipment: normalized.equipment || '',
      trainingDaysPerWeek: normalized.trainingDaysPerWeek || 3,
      planDuration: normalized.planDuration || 12,
      sessionDuration: normalized.sessionDuration || 60,
      
      // Dane biometryczne
      body: {
        age: normalized.body?.age || '',
        weightKg: normalized.body?.weightKg || '',
        heightCm: normalized.body?.heightCm || '',
      },
      
      // Wyniki
      recommendedPlan: null,
      fromSurvey
    };
  });

  // Oblicz BMI
  const bmi = useMemo(() => {
    const weight = parseFloat(planData.body?.weightKg);
    const height = parseFloat(planData.body?.heightCm);
    
    if (!weight || !height || weight <= 0 || height <= 0) return null;
    
    const heightM = height / 100;
    const bmiValue = weight / (heightM * heightM);
    
    return Number.isFinite(bmiValue) ? Math.round(bmiValue * 10) / 10 : null;
  }, [planData.body?.weightKg, planData.body?.heightCm]);

  // Kategoria BMI
  const bmiCategory = useMemo(() => {
    if (!bmi) return null;
    
    if (bmi < 18.5) return { text: 'Niedowaga', color: 'text-blue-400' };
    if (bmi < 25) return { text: 'Prawidłowa', color: 'text-green-400' };
    if (bmi < 30) return { text: 'Nadwaga', color: 'text-yellow-400' };
    return { text: 'Otyłość', color: 'text-red-400' };
  }, [bmi]);

  // Walidacje
  const validateBasics = useMemo(() => {
    const errs = {};
    if (!planData.goal) errs.goal = 'Wybierz cel treningowy.';
    if (!planData.level) errs.level = 'Wybierz poziom zaawansowania.';
    if (!planData.equipment) errs.equipment = 'Wybierz dostępny sprzęt.';
    if (!planData.trainingDaysPerWeek || planData.trainingDaysPerWeek < 1) {
      errs.trainingDaysPerWeek = 'Wybierz liczbę dni treningowych.';
    }
    return errs;
  }, [planData.goal, planData.level, planData.equipment, planData.trainingDaysPerWeek]);

  const validatePreferences = useMemo(() => {
    const errs = {};
    if (!planData.sessionDuration || planData.sessionDuration < 15) {
      errs.sessionDuration = 'Minimalna długość sesji to 15 minut.';
    }
    if (!planData.planDuration || planData.planDuration < 1) {
      errs.planDuration = 'Minimalny czas trwania planu to 1 tydzień.';
    }
    return errs;
  }, [planData.sessionDuration, planData.planDuration]);

  const validateBody = useMemo(() => {
    const errs = {};
    const age = parseFloat(planData.body?.age);
    const weight = parseFloat(planData.body?.weightKg);
    const height = parseFloat(planData.body?.heightCm);

    if (!age || age < 13 || age > 100) {
      errs.age = 'Podaj wiek między 13 a 100 lat.';
    }
    if (!weight || weight < 30 || weight > 300) {
      errs.weightKg = 'Podaj wagę między 30 a 300 kg.';
    }
    if (!height || height < 120 || height > 250) {
      errs.heightCm = 'Podaj wzrost między 120 a 250 cm.';
    }

    return errs;
  }, [planData.body]);

  // Sprawdź czy krok jest poprawny
  const isStepValid = (stepIndex) => {
    if (stepIndex === 0) return !!planData.recommendationMethod;
    if (stepIndex === 1) return Object.keys(validateBasics).length === 0;
    if (stepIndex === 2) return Object.keys(validatePreferences).length === 0;
    if (stepIndex === 3) return Object.keys(validateBody).length === 0;
    if (stepIndex === 4) return !!planData.name?.trim();
    return true;
  };

  // Pokaż błędy dla kroku
  const showErrorsForStep = (stepIndex) => {
    if (stepIndex === 1) setErrors(validateBasics);
    else if (stepIndex === 2) setErrors(validatePreferences);
    else if (stepIndex === 3) setErrors(validateBody);
    else setErrors({});
  };

  // Obsługa nawigacji
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

  // Generowanie rekomendacji
  const generateRecommendedPlan = async () => {
    setLoading(true);
    setApiError(null);
    
    try {
      if (!isAuthenticated()) {
        throw new Error('Brak autoryzacji - zaloguj się ponownie');
      }

      console.log('🚀 Generowanie planu z danymi:', planData);

      const response = await generateRecommendations(planData.recommendationMethod);
      
      if (response && response.recommended_plan) {
        setPlanData(prev => ({
          ...prev,
          recommendedPlan: response.recommended_plan,
          name: response.recommended_plan.name || prev.name
        }));
        
        console.log('✅ Plan wygenerowany:', response.recommended_plan);
        
        // Nawiguj do podsumowania lub następnego ekranu
        navigate('/plan-summary', { 
          state: { 
            planData: { ...planData, recommendedPlan: response.recommended_plan },
            fromCreator: true
          } 
        });
      } else {
        throw new Error('Nie otrzymano rekomendacji planu');
      }
      
    } catch (error) {
      console.error('❌ Błąd generowania planu:', error);
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // KOMPLETNE IMPLEMENTACJE KROKÓW:

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

      <div className="space-y-4">
        {methodOptions.map((method) => {
          const isSelected = planData.recommendationMethod === method.value;
          
          return (
            <button
              key={method.value}
              onClick={() => setPlanData(prev => ({ ...prev, recommendationMethod: method.value }))}
              className={`w-full text-left p-6 rounded-xl border-2 transition-all duration-300 ${
                isSelected 
                  ? 'border-[#1DCD9F] bg-[#1DCD9F]/10' 
                  : 'border-gray-600 bg-[#1D1D1D] hover:border-gray-500'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl mt-1">{method.icon}</div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-bold text-lg">{method.title}</h4>
                    {method.recommended && (
                      <div className="px-3 py-1 bg-[#1DCD9F]/20 rounded-full">
                        <span className="text-[#1DCD9F] text-xs font-medium">Zalecane</span>
                      </div>
                    )}
                    {isSelected && (
                      <div className="w-5 h-5 bg-[#1DCD9F] rounded-full flex items-center justify-center ml-2">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-black">
                          <polyline points="20,6 9,17 4,12" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-3">{method.description}</p>
                  
                  <div className="space-y-1">
                    {method.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <div className="w-1 h-1 bg-[#1DCD9F] rounded-full"></div>
                        <span className="text-gray-400">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Krok 1: Podstawowe informacje
  const renderBasicsStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Podstawowe informacje
        </h2>
        <p className="text-gray-300 text-lg">
          Powiedz nam o swoich celach treningowych
        </p>
      </div>

      {/* Cel */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-4">Cel treningowy</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {goalOptions.map((goal) => (
            <button
              key={goal.value}
              onClick={() => setPlanData(prev => ({ ...prev, goal: goal.value }))}
              className={`p-4 rounded-xl border-2 transition-all ${
                planData.goal === goal.value
                  ? 'border-[#1DCD9F] bg-[#1DCD9F]/10'
                  : 'border-gray-600 bg-[#1D1D1D] hover:border-gray-500'
              }`}
            >
              <div className="text-2xl mb-2">{goal.icon}</div>
              <div className="text-white font-medium">{goal.label}</div>
            </button>
          ))}
        </div>
        {errors.goal && <p className="text-red-400 text-sm mt-1">{errors.goal}</p>}
      </div>

      {/* Poziom */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-4">Poziom zaawansowania</label>
        <div className="space-y-3">
          {levelOptions.map((level) => (
            <button
              key={level.value}
              onClick={() => setPlanData(prev => ({ ...prev, level: level.value }))}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                planData.level === level.value
                  ? 'border-[#1DCD9F] bg-[#1DCD9F]/10'
                  : 'border-gray-600 bg-[#1D1D1D] hover:border-gray-500'
              }`}
            >
              <div className="text-white font-medium">{level.label}</div>
              <div className="text-gray-400 text-sm">{level.description}</div>
            </button>
          ))}
        </div>
        {errors.level && <p className="text-red-400 text-sm mt-1">{errors.level}</p>}
      </div>

      {/* Sprzęt */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-4">Dostępny sprzęt</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {equipmentOptions.map((equipment) => (
            <button
              key={equipment.value}
              onClick={() => setPlanData(prev => ({ ...prev, equipment: equipment.value }))}
              className={`p-4 rounded-xl border-2 transition-all ${
                planData.equipment === equipment.value
                  ? 'border-[#1DCD9F] bg-[#1DCD9F]/10'
                  : 'border-gray-600 bg-[#1D1D1D] hover:border-gray-500'
              }`}
            >
              <div className="text-2xl mb-2">{equipment.icon}</div>
              <div className="text-white font-medium text-sm">{equipment.label}</div>
            </button>
          ))}
        </div>
        {errors.equipment && <p className="text-red-400 text-sm mt-1">{errors.equipment}</p>}
      </div>

      {/* Dni treningowe */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-4">Dni treningowe w tygodniu</label>
        <div className="flex gap-2">
          {[2, 3, 4, 5, 6].map((days) => (
            <button
              key={days}
              onClick={() => setPlanData(prev => ({ ...prev, trainingDaysPerWeek: days }))}
              className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                planData.trainingDaysPerWeek === days
                  ? 'border-[#1DCD9F] bg-[#1DCD9F]/10 text-white'
                  : 'border-gray-600 bg-[#1D1D1D] hover:border-gray-500 text-gray-300'
              }`}
            >
              {days}
            </button>
          ))}
        </div>
        {errors.trainingDaysPerWeek && <p className="text-red-400 text-sm mt-1">{errors.trainingDaysPerWeek}</p>}
      </div>
    </div>
  );

  // Krok 2: Preferencje treningu
  const renderPreferencesStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Preferencje treningu
        </h2>
        <p className="text-gray-300 text-lg">
          Dostosuj plan do swojego stylu życia
        </p>
      </div>

      {/* Czas sesji */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-4">
          Długość sesji treningowej (minuty)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[30, 45, 60, 90].map((duration) => (
            <button
              key={duration}
              onClick={() => setPlanData(prev => ({ ...prev, sessionDuration: duration }))}
              className={`py-3 px-4 rounded-xl border-2 transition-all ${
                planData.sessionDuration === duration
                  ? 'border-[#1DCD9F] bg-[#1DCD9F]/10 text-white'
                  : 'border-gray-600 bg-[#1D1D1D] hover:border-gray-500 text-gray-300'
              }`}
            >
              {duration}
            </button>
          ))}
        </div>
        {errors.sessionDuration && <p className="text-red-400 text-sm mt-1">{errors.sessionDuration}</p>}
      </div>

      {/* Długość planu */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-4">
          Długość planu (tygodnie)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[4, 8, 12, 16].map((weeks) => (
            <button
              key={weeks}
              onClick={() => setPlanData(prev => ({ ...prev, planDuration: weeks }))}
              className={`py-3 px-4 rounded-xl border-2 transition-all ${
                planData.planDuration === weeks
                  ? 'border-[#1DCD9F] bg-[#1DCD9F]/10 text-white'
                  : 'border-gray-600 bg-[#1D1D1D] hover:border-gray-500 text-gray-300'
              }`}
            >
              {weeks}
            </button>
          ))}
        </div>
        {errors.planDuration && <p className="text-red-400 text-sm mt-1">{errors.planDuration}</p>}
      </div>
    </div>
  );

  // Krok 3: Dane biometryczne (już zaimplementowany w oryginalnym pliku)
  const renderBodyStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Pomiary ciała
        </h2>
        <p className="text-gray-300 text-lg">
          Te dane pomogą nam lepiej dostosować plan do Twoich potrzeb
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          {/* Wiek */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Wiek (lata)</label>
            <input
              type="number"
              value={planData.body.age}
              onChange={(e) => setPlanData(prev => ({
                ...prev,
                body: { ...prev.body, age: e.target.value }
              }))}
              className="w-full px-4 py-3 bg-[#1D1D1D] border border-[#333333] rounded-xl text-white focus:border-[#1DCD9F] focus:ring-1 focus:ring-[#1DCD9F]"
              placeholder="np. 25"
              min="13"
              max="100"
            />
            {errors.age && <p className="text-red-400 text-sm mt-1">{errors.age}</p>}
          </div>

          {/* Waga */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Waga (kg)</label>
            <input
              type="number"
              step="0.1"
              value={planData.body.weightKg}
              onChange={(e) => setPlanData(prev => ({
                ...prev,
                body: { ...prev.body, weightKg: e.target.value }
              }))}
              className="w-full px-4 py-3 bg-[#1D1D1D] border border-[#333333] rounded-xl text-white focus:border-[#1DCD9F] focus:ring-1 focus:ring-[#1DCD9F]"
              placeholder="np. 70.5"
              min="30"
              max="300"
            />
            {errors.weightKg && <p className="text-red-400 text-sm mt-1">{errors.weightKg}</p>}
          </div>

          {/* Wzrost */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Wzrost (cm)</label>
            <input
              type="number"
              value={planData.body.heightCm}
              onChange={(e) => setPlanData(prev => ({
                ...prev,
                body: { ...prev.body, heightCm: e.target.value }
              }))}
              className="w-full px-4 py-3 bg-[#1D1D1D] border border-[#333333] rounded-xl text-white focus:border-[#1DCD9F] focus:ring-1 focus:ring-[#1DCD9F]"
              placeholder="np. 175"
              min="120"
              max="250"
            />
            {errors.heightCm && <p className="text-red-400 text-sm mt-1">{errors.heightCm}</p>}
          </div>

          {/* BMI Display */}
          {bmi && (
            <div className="bg-[#1D1D1D] rounded-xl p-4 border border-[#333333]">
              <div className="text-center">
                <p className="text-gray-400 text-sm">Twoje BMI</p>
                <div className="flex items-center justify-center space-x-2 mt-2">
                  <span className="text-white text-2xl font-bold">{bmi}</span>
                  {bmiCategory && (
                    <span className={`text-sm ${bmiCategory.color}`}>
                      ({bmiCategory.text})
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-xs mt-2">
                  Algorytm wykorzysta te dane do lepszego dopasowania planu
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Prawa strona - obrazek */}
        <div className="hidden lg:block">
          <div className="relative">
            <img 
              src={LaskoBody} 
              alt="Pomiary ciała" 
              className="w-full max-w-sm mx-auto opacity-80"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Krok 4: Nazwa planu
  const renderNameStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Nazwij swój plan
        </h2>
        <p className="text-gray-300 text-lg">
          Jak chcesz nazwać swój spersonalizowany plan treningowy?
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <input
          type="text"
          value={planData.name}
          onChange={(e) => setPlanData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-4 py-3 bg-[#1D1D1D] border border-[#333333] rounded-xl text-white text-center focus:border-[#1DCD9F] focus:ring-1 focus:ring-[#1DCD9F]"
          placeholder="np. Mój Plan Siłowy"
          maxLength={50}
        />
        
        <div className="mt-4 text-center">
          <p className="text-gray-400 text-sm mb-2">Sugestie na podstawie Twoich wyborów:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              `Plan ${planData.goal || 'Treningowy'}`,
              `${planData.goal || 'Plan'} ${planData.trainingDaysPerWeek}x`,
              `${planData.level || 'Mój'} ${planData.goal || 'Plan'}`
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setPlanData(prev => ({ ...prev, name: suggestion }))}
                className="px-3 py-1 bg-[#1D1D1D] border border-gray-600 rounded-full text-gray-300 text-sm hover:border-[#1DCD9F] hover:text-white transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Główna funkcja renderowania kroków
  const renderStep = () => {
    switch (currentStep) {
      case 0: return renderMethodStep();
      case 1: return renderBasicsStep();
      case 2: return renderPreferencesStep();
      case 3: return renderBodyStep();
      case 4: return renderNameStep();
      default: return renderMethodStep();
    }
  };

  return (
    <div 
      className="min-h-screen w-full px-4 py-10"
      style={{
        backgroundImage: `url(${RegisterBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative"
      }}
    >
      {/* Ciemna nakładka */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] to-[#0D7A61]/90 opacity-90"
        style={{ mixBlendMode: "multiply" }}
      />
      
      {/* Logo */}
      <div className="absolute top-8 left-8 z-10">
        <Link to="/">
          <h1 className="text-[#1DCD9F] text-5xl font-bold">Lasko</h1>
        </Link>
      </div>

      {/* Główny kontener */}
      <div className="max-w-4xl mx-auto z-10 relative pt-20">
        
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <div className="text-[#1DCD9F] text-sm font-bold">
              KROK {currentStep + 1} Z 5
            </div>
          </div>
          <div className="w-full bg-[#1D1D1D] rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Karta główna */}
        <div className="bg-[#0a0a0a]/95 rounded-3xl shadow-xl p-8 border border-[#222222] shadow-[0_0_30px_10px_rgba(0,0,0,0.5)]">
          
          {/* Błąd API */}
          {apiError && (
            <div className="bg-red-900/20 border border-red-400/60 rounded-lg p-4 mb-6">
              <p className="text-red-300 text-sm">{apiError}</p>
              <button
                onClick={() => setApiError(null)}
                className="mt-2 text-red-400 hover:text-red-300 text-sm underline"
              >
                Ukryj błąd
              </button>
            </div>
          )}

          {/* Renderuj aktualny krok */}
          <div className="min-h-[400px] flex flex-col justify-between">
            {renderStep()}
            
            {/* Nawigacja */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-700">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0 || loading}
                className="px-6 py-3 bg-[#1D1D1D] text-white rounded-xl hover:bg-[#292929] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Wstecz
              </button>
              
              {currentStep === 4 ? (
                <button
                  onClick={generateRecommendedPlan}
                  disabled={!isStepValid(currentStep) || loading}
                  className="px-8 py-3 bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white rounded-xl font-bold hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Generowanie...' : 'Wygeneruj plan'}
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

        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 bg-gray-800 p-4 rounded-lg text-xs text-gray-300">
            <pre>{JSON.stringify({ 
              currentStep, 
              bmi, 
              bmiCategory: bmiCategory?.text,
              isAuthenticated: isAuthenticated(),
              hasToken: !!getToken(),
              planData: {
                recommendationMethod: planData.recommendationMethod,
                goal: planData.goal,
                level: planData.level,
                equipment: planData.equipment
              }
            }, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedPlanCreator;
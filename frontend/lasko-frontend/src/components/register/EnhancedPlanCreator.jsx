// frontend/lasko-frontend/src/components/register/EnhancedPlanCreator.jsx - KOMPLETNIE NAPRAWIONY
// Kreator planów treningowych z poprawioną autoryzacją i generowaniem rekomendacji
import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // ✅ NAPRAWIONE: Używaj AuthContext
import AuthDebug from '../../utils/authDebug'; // ✅ DODANE: Debug tools

// ============================================================================
// DANE KONFIGURACYJNE
// ============================================================================

const methodOptions = [
  { 
    value: 'user', 
    label: 'Na podstawie klienta',
    description: 'Rekomendacje oparte na podobnych użytkownikach',
    icon: '👥'
  },
  { 
    value: 'product', 
    label: 'Na podstawie produktu',
    description: 'Plany dobrane według charakterystyki planów',
    icon: '📋'
  },
  { 
    value: 'hybrid', 
    label: 'Podejście hybrydowe',
    description: 'Kombinacja obydwu metod - najbardziej precyzyjne',
    icon: '🤖'
  }
];

const goalOptions = [
  { value: 'masa', label: 'Masa mięśniowa', icon: '💪' },
  { value: 'sila', label: 'Siła', icon: '🏋️' },
  { value: 'spalanie', label: 'Redukcja tkanki tłuszczowej', icon: '🔥' },
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
  
  // ✅ NAPRAWIONE: Używaj AuthContext zamiast nieistniejącego hooka
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
    recommendationMethod: initialData.recommendationMethod || 'hybrid', // ✅ Domyślna wartość
    
    // Podstawy (krok 1)
    goal: initialData.goal || '',
    level: initialData.level || '',
    trainingDaysPerWeek: initialData.trainingDaysPerWeek || 3,
    
    // Preferencje (krok 2)
    equipment: initialData.equipment || '',
    timePerSession: initialData.timePerSession || 60,
    focusAreas: initialData.focusAreas || [],
    avoidances: initialData.avoidances || [],
    
    // Ciało (krok 3)
    body: {
      age: initialData.age || '',
      weightKg: initialData.weightKg || '',
      heightCm: initialData.heightCm || '',
      activityLevel: initialData.activityLevel || 'średnia'
    },
    
    // Nazwa (krok 4)
    name: initialData.name || '',
    
    // Wygenerowany plan
    recommendedPlan: null
  });

  // ============================================================================
  // WALIDACJA KROKÓW
  // ============================================================================
  const validateBasics = useMemo(() => {
    const errs = {};
    if (!planData.goal) errs.goal = 'Wybierz cel treningowy.';
    if (!planData.level) errs.level = 'Wybierz poziom zaawansowania.';
    if (!planData.trainingDaysPerWeek || planData.trainingDaysPerWeek < 1 || planData.trainingDaysPerWeek > 7) {
      errs.trainingDaysPerWeek = 'Dni treningowe: 1-7.';
    }
    return errs;
  }, [planData.goal, planData.level, planData.trainingDaysPerWeek]);

  const validatePreferences = useMemo(() => {
    const errs = {};
    if (!planData.equipment) {
      errs.equipment = 'Wybierz dostępne wyposażenie.';
    }
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
  // GENEROWANIE REKOMENDACJI - KOMPLETNIE NAPRAWIONE
  // ============================================================================
  const generateRecommendedPlan = async () => {
    setLoading(true);
    setApiError(null);
    
    try {
      // ✅ NAPRAWIONE: Szczegółowa diagnostyka autoryzacji
      console.log('🚀 [EnhancedPlanCreator] === ROZPOCZYNAM GENEROWANIE PLANU ===');
      console.log('🔍 Stan autoryzacji:', {
        isAuthenticated: isAuthenticated(),
        hasUser: !!user,
        hasToken: !!getToken(),
        username: user?.username
      });
      
      if (!isAuthenticated()) {
          console.warn('⚠️ [EnhancedPlanCreator] Nie widzę ważnego access tokena – spróbuję wysłać żądanie (warstwa API zrobi refresh).');
          debugAuth();
        }

      // Przygotuj preferencje dla API - ✅ POPRAWIONA STRUKTURA
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

      console.log('📤 [EnhancedPlanCreator] Wysyłanie preferencji:', preferences);
      console.log('🤖 [EnhancedPlanCreator] Metoda rekomendacji:', planData.recommendationMethod);

      // ✅ NAPRAWIONE: Wywołaj generateRecommendations z AuthContext z obsługą błędów
      const response = await generateRecommendations(
        planData.recommendationMethod, 
        preferences
      );
      
      console.log('📥 [EnhancedPlanCreator] Odpowiedź API:', response);
      
      // ✅ NAPRAWIONE: Lepsze sprawdzanie struktury odpowiedzi
      if (response && response.recommendations && Array.isArray(response.recommendations) && response.recommendations.length > 0) {
        const recommendedPlan = response.recommendations[0]; // Weź pierwszy plan
        
        console.log('✅ [EnhancedPlanCreator] Plan wybrany:', recommendedPlan);
        
        const updatedPlanData = {
          ...planData,
          recommendedPlan,
          name: recommendedPlan.name || planData.name
        };
        
        setPlanData(updatedPlanData);

        sessionStorage.setItem('lasko_plan_draft', JSON.stringify(updatedPlanData));
        
        console.log('✅ [EnhancedPlanCreator] Plan zapisany do stanu');
        
        // Nawiguj do podsumowania
        navigate('/plan-summary', { 
          state: { 
            planData: updatedPlanData,
            fromCreator: true
          } 
        });
      } else {
        // ✅ NAPRAWIONE: Szczegółowe logowanie problemu
        console.error('❌ [EnhancedPlanCreator] Nieprawidłowa struktura odpowiedzi:', response);
        
        if (!response) {
          throw new Error('Brak odpowiedzi z serwera');
        } else if (!response.recommendations) {
          throw new Error('Serwer nie zwrócił rekomendacji');
        } else if (!Array.isArray(response.recommendations)) {
          throw new Error('Rekomendacje mają nieprawidłowy format');
        } else if (response.recommendations.length === 0) {
          throw new Error('Nie znaleziono planów pasujących do Twoich kryteriów. Spróbuj zmienić preferencje.');
        } else {
          throw new Error('Nieoczekiwana struktura danych z serwera');
        }
      }
      
    } catch (error) {
      console.error('❌ [EnhancedPlanCreator] Błąd generowania planu:', error);
      
      // ✅ DODANE: Szczegółowa diagnostyka błędów
      if (error.message.includes('autoryzacji') || error.message.includes('401')) {
        console.error('🔍 [EnhancedPlanCreator] === DIAGNOSTYKA BŁĘDU AUTORYZACJI ===');
        console.error('- isAuthenticated:', isAuthenticated());
        console.error('- hasToken:', !!getToken());
        console.error('- user:', user);
        
        // Uruchom pełną diagnostykę
        await AuthDebug.fullDiagnostic();
        
        setApiError('Sesja wygasła. Zostaniesz przekierowany do logowania.');
        
        // Przekieruj do logowania po 3 sekundach
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Sesja wygasła - zaloguj się ponownie',
              returnTo: '/plan-creator'
            } 
          });
        }, 3000);
      } else {
        // Inne błędy
        const errorMessage = error.message || 'Wystąpił nieoczekiwany błąd podczas generowania planu';
        setApiError(errorMessage);
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
                ? 'border-green-500 bg-green-500/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className="text-3xl">{option.icon}</div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">
                  {option.label}
                </h3>
                <p className="text-gray-400">
                  {option.description}
                </p>
              </div>
              {planData.recommendationMethod === option.value && (
                <div className="text-green-500">
                  ✅
                </div>
              )}
            </div>
          </div>
        ))}
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

      {/* Cel treningowy */}
      <div>
        <label className="block text-white font-semibold mb-3">
          Jaki jest Twój główny cel? *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goalOptions.map(goal => (
            <div
              key={goal.value}
              onClick={() => setPlanData(prev => ({ ...prev, goal: goal.value }))}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                planData.goal === goal.value
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{goal.icon}</span>
                <span className="text-white font-medium">{goal.label}</span>
              </div>
            </div>
          ))}
        </div>
        {errors.goal && <p className="text-red-400 text-sm mt-2">{errors.goal}</p>}
      </div>

      {/* Poziom zaawansowania */}
      <div>
        <label className="block text-white font-semibold mb-3">
          Jaki jest Twój poziom zaawansowania? *
        </label>
        <div className="grid gap-4">
          {levelOptions.map(level => (
            <div
              key={level.value}
              onClick={() => setPlanData(prev => ({ ...prev, level: level.value }))}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                planData.level === level.value
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">{level.label}</span>
                <span className="text-gray-400 text-sm">{level.description}</span>
              </div>
            </div>
          ))}
        </div>
        {errors.level && <p className="text-red-400 text-sm mt-2">{errors.level}</p>}
      </div>

      {/* Dni treningowe */}
      <div>
        <label className="block text-white font-semibold mb-3">
          Ile dni w tygodniu chcesz trenować? *
        </label>
        <div className="flex space-x-4">
          {[1, 2, 3, 4, 5, 6, 7].map(days => (
            <button
              key={days}
              onClick={() => setPlanData(prev => ({ ...prev, trainingDaysPerWeek: days }))}
              className={`w-12 h-12 rounded-full border-2 font-semibold transition-all ${
                planData.trainingDaysPerWeek === days
                  ? 'border-green-500 bg-green-500 text-white'
                  : 'border-gray-600 text-gray-300 hover:border-gray-500'
              }`}
            >
              {days}
            </button>
          ))}
        </div>
        {errors.trainingDaysPerWeek && <p className="text-red-400 text-sm mt-2">{errors.trainingDaysPerWeek}</p>}
      </div>
    </div>
  );

  // Krok 2: Preferencje sprzętowe i czasowe
  const renderPreferencesStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Preferencje treningowe
        </h2>
        <p className="text-gray-300 text-lg">
          Dostosuj plan do swoich możliwości
        </p>
      </div>

      {/* Wyposażenie */}
      <div>
        <label className="block text-white font-semibold mb-3">
          Jakie masz dostępne wyposażenie? *
        </label>
        <div className="grid gap-4">
          {equipmentOptions.map(equipment => (
            <div
              key={equipment.value}
              onClick={() => setPlanData(prev => ({ ...prev, equipment: equipment.value }))}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                planData.equipment === equipment.value
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{equipment.icon}</span>
                <span className="text-white font-medium">{equipment.label}</span>
              </div>
            </div>
          ))}
        </div>
        {errors.equipment && <p className="text-red-400 text-sm mt-2">{errors.equipment}</p>}
      </div>

      {/* Czas sesji */}
      <div>
        <label className="block text-white font-semibold mb-3">
          Ile czasu chcesz poświęcać na jeden trening? *
        </label>
        <input
          type="number"
          min="15"
          max="180"
          value={planData.timePerSession}
          onChange={(e) => setPlanData(prev => ({ ...prev, timePerSession: parseInt(e.target.value) || 60 }))}
          className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
          placeholder="60"
        />
        <p className="text-gray-400 text-sm mt-2">Podaj czas w minutach (15-180)</p>
        {errors.timePerSession && <p className="text-red-400 text-sm mt-2">{errors.timePerSession}</p>}
      </div>
    </div>
  );

  // Krok 3: Parametry ciała
  const renderBodyStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Parametry ciała
        </h2>
        <p className="text-gray-300 text-lg">
          Pomożemy dostosować intensywność treningu
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wiek */}
        <div>
          <label className="block text-white font-semibold mb-3">
            Wiek *
          </label>
          <input
            type="number"
            min="16"
            max="100"
            value={planData.body.age}
            onChange={(e) => setPlanData(prev => ({
              ...prev,
              body: { ...prev.body, age: parseInt(e.target.value) || '' }
            }))}
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
            placeholder="25"
          />
          {errors.age && <p className="text-red-400 text-sm mt-2">{errors.age}</p>}
        </div>

        {/* Waga */}
        <div>
          <label className="block text-white font-semibold mb-3">
            Waga (kg) *
          </label>
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
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
            placeholder="70.0"
          />
          {errors.weightKg && <p className="text-red-400 text-sm mt-2">{errors.weightKg}</p>}
        </div>

        {/* Wzrost */}
        <div>
          <label className="block text-white font-semibold mb-3">
            Wzrost (cm) *
          </label>
          <input
            type="number"
            min="120"
            max="250"
            value={planData.body.heightCm}
            onChange={(e) => setPlanData(prev => ({
              ...prev,
              body: { ...prev.body, heightCm: parseInt(e.target.value) || '' }
            }))}
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
            placeholder="175"
          />
          {errors.heightCm && <p className="text-red-400 text-sm mt-2">{errors.heightCm}</p>}
        </div>
      </div>

      {/* Oblicz BMI dla informacji */}
      {planData.body.weightKg && planData.body.heightCm && (
        <div className="p-4 bg-gray-800 rounded-lg">
          <div className="text-center">
            <p className="text-gray-400 mb-2">Twoje BMI:</p>
            <p className="text-2xl font-bold text-white">
              {((planData.body.weightKg / ((planData.body.heightCm / 100) ** 2))).toFixed(1)}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // Krok 4: Nazwa planu
  const renderNameStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Ostatni krok!
        </h2>
        <p className="text-gray-300 text-lg">
          Nadaj nazwę swojemu planowi treningowemu
        </p>
      </div>

      <div>
        <label className="block text-white font-semibold mb-3">
          Nazwa planu *
        </label>
        <input
          type="text"
          maxLength="50"
          value={planData.name}
          onChange={(e) => setPlanData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white text-lg focus:border-green-500 focus:outline-none"
          placeholder="Np. Mój plan na masę"
        />
        <p className="text-gray-400 text-sm mt-2">
          {planData.name.length}/50 znaków
        </p>
        {errors.name && <p className="text-red-400 text-sm mt-2">{errors.name}</p>}
      </div>

      {/* Podsumowanie */}
      <div className="p-6 bg-gray-800 rounded-lg">
        <h3 className="text-xl font-semibold text-white mb-4">Podsumowanie:</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-gray-400">Metoda:</div>
          <div className="text-white">{methodOptions.find(m => m.value === planData.recommendationMethod)?.label}</div>
          
          <div className="text-gray-400">Cel:</div>
          <div className="text-white">{goalOptions.find(g => g.value === planData.goal)?.label}</div>
          
          <div className="text-gray-400">Poziom:</div>
          <div className="text-white">{planData.level}</div>
          
          <div className="text-gray-400">Dni/tydzień:</div>
          <div className="text-white">{planData.trainingDaysPerWeek}</div>
          
          <div className="text-gray-400">Sprzęt:</div>
          <div className="text-white">{equipmentOptions.find(e => e.value === planData.equipment)?.label}</div>
          
          <div className="text-gray-400">Czas/sesja:</div>
          <div className="text-white">{planData.timePerSession} min</div>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // RENDEROWANIE GŁÓWNE
  // ============================================================================

  const steps = [
    { title: 'Metoda', component: renderMethodStep },
    { title: 'Podstawy', component: renderBasicsStep },
    { title: 'Preferencje', component: renderPreferencesStep },
    { title: 'Ciało', component: renderBodyStep },
    { title: 'Nazwa', component: renderNameStep }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  index <= currentStep 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-600 text-gray-300'
                }`}>
                  {index + 1}
                </div>
                <span className="ml-2 text-sm text-gray-300 hidden sm:block">
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-1 mx-4 ${
                    index < currentStep ? 'bg-green-500' : 'bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Krok */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-700">
          {steps[currentStep].component()}
        </div>

        {/* Błędy API */}
        {apiError && (
          <div className="mt-6 p-4 bg-red-900/50 border border-red-500 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-red-400">❌</span>
              <span className="text-red-300">{apiError}</span>
            </div>
          </div>
        )}

        {/* Nawigacja */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Wstecz
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
            >
              Dalej
            </button>
          ) : (
            <button
              onClick={generateRecommendedPlan}
              disabled={loading || !isStepValid(currentStep)}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generuję plan...</span>
                </>
              ) : (
                <>
                  <span>🤖</span>
                  <span>Wygeneruj plan</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedPlanCreator;
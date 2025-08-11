import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RegisterBackground from '../../assets/Photos/Register_background.png';

const PlanCreatorPage = () => {
  const navigate = useNavigate();
  const [planData, setPlanData] = useState({
    name: '',
    goal: '',
    trainingDays: 3,
    planDuration: 8,
    equipment: '',
    notes: ''
  });

  const [currentStep, setCurrentStep] = useState(0);
  const steps = ['Podstawy', 'Harmonogram', 'Ćwiczenia', 'Podsumowanie'];

  const goals = [
    { value: 'masa', label: 'Budowanie masy', icon: '💪' },
    { value: 'redukcja', label: 'Redukcja', icon: '🔥' },
    { value: 'siła', label: 'Zwiększenie siły', icon: '⚡' },
    { value: 'wytrzymalosc', label: 'Wytrzymałość', icon: '🏃' }
  ];

  const equipmentOptions = [
    { value: 'silownia_full', label: 'Pełna siłownia', icon: '🏋️' },
    { value: 'wolne_ciezary', label: 'Wolne ciężary', icon: '🔩' },
    { value: 'dom_kalistenika', label: 'Ćwiczenia w domu', icon: '🏠' },
    { value: 'mieszany', label: 'Mieszany', icon: '🔄' }
  ];

  const updatePlanData = (field, value) => {
    setPlanData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreatePlan = () => {
    // Tutaj będzie logika tworzenia planu
    console.log('Utworzono plan:', planData);
    navigate('/dashboard', { state: { createdPlan: planData } });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-white text-lg font-bold mb-3">
                Nazwa planu treningowego
              </label>
              <input
                type="text"
                value={planData.name}
                onChange={(e) => updatePlanData('name', e.target.value)}
                placeholder="np. Mój plan na masę"
                className="w-full bg-[#1D1D1D] text-white rounded-2xl py-4 px-5 outline-none text-lg border border-[#333333] focus:border-[#1DCD9F]"
              />
            </div>

            <div>
              <label className="block text-white text-lg font-bold mb-3">
                Główny cel treningu
              </label>
              <div className="grid grid-cols-2 gap-3">
                {goals.map((goal) => (
                  <button
                    key={goal.value}
                    type="button"
                    onClick={() => updatePlanData('goal', goal.value)}
                    className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                      planData.goal === goal.value
                        ? 'border-[#1DCD9F] bg-[#0D7A61]/20 text-white'
                        : 'border-[#333333] bg-[#1D1D1D] text-gray-300 hover:border-[#555555]'
                    }`}
                  >
                    <div className="text-2xl mb-1">{goal.icon}</div>
                    <div className="font-bold">{goal.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white text-lg font-bold mb-3">
                Dostępny sprzęt
              </label>
              <div className="grid grid-cols-2 gap-3">
                {equipmentOptions.map((equipment) => (
                  <button
                    key={equipment.value}
                    type="button"
                    onClick={() => updatePlanData('equipment', equipment.value)}
                    className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                      planData.equipment === equipment.value
                        ? 'border-[#1DCD9F] bg-[#0D7A61]/20 text-white'
                        : 'border-[#333333] bg-[#1D1D1D] text-gray-300 hover:border-[#555555]'
                    }`}
                  >
                    <div className="text-2xl mb-1">{equipment.icon}</div>
                    <div className="font-bold text-sm">{equipment.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-white text-lg font-bold mb-3">
                Ile dni w tygodniu chcesz trenować?
              </label>
              <div className="flex space-x-3">
                {[2, 3, 4, 5, 6].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => updatePlanData('trainingDays', days)}
                    className={`flex-1 py-4 rounded-2xl border-2 transition-all duration-300 ${
                      planData.trainingDays === days
                        ? 'border-[#1DCD9F] bg-[#0D7A61]/20 text-white'
                        : 'border-[#333333] bg-[#1D1D1D] text-gray-300 hover:border-[#555555]'
                    }`}
                  >
                    <div className="text-2xl font-bold">{days}</div>
                    <div className="text-sm">dni</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white text-lg font-bold mb-3">
                Długość planu (tygodnie)
              </label>
              <input
                type="range"
                min="4"
                max="16"
                value={planData.planDuration}
                onChange={(e) => updatePlanData('planDuration', parseInt(e.target.value))}
                className="w-full h-2 bg-[#1D1D1D] rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-white text-sm mt-2">
                <span>4 tygodnie</span>
                <span className="font-bold text-[#1DCD9F]">{planData.planDuration} tygodni</span>
                <span>16 tygodni</span>
              </div>
            </div>

            <div>
              <label className="block text-white text-lg font-bold mb-3">
                Dodatkowe notatki (opcjonalne)
              </label>
              <textarea
                value={planData.notes}
                onChange={(e) => updatePlanData('notes', e.target.value)}
                placeholder="Uwagi, preferencje, ograniczenia..."
                rows="4"
                className="w-full bg-[#1D1D1D] text-white rounded-2xl py-4 px-5 outline-none border border-[#333333] focus:border-[#1DCD9F] resize-none"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-white text-2xl font-bold mb-4">
                Dobieranie ćwiczeń
              </h3>
              <p className="text-gray-300">
                Na podstawie Twoich preferencji automatycznie dobierzemy najlepsze ćwiczenia
              </p>
            </div>

            <div className="bg-[#1D1D1D] rounded-2xl p-6 border border-[#333333]">
              <h4 className="text-[#1DCD9F] font-bold mb-4">Twoje preferencje:</h4>
              <div className="space-y-2 text-white">
                <div className="flex justify-between">
                  <span className="text-gray-400">Cel:</span>
                  <span>{goals.find(g => g.value === planData.goal)?.label || 'Nie wybrano'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Dni treningowe:</span>
                  <span>{planData.trainingDays} dni/tydzień</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sprzęt:</span>
                  <span>{equipmentOptions.find(e => e.value === planData.equipment)?.label || 'Nie wybrano'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Długość:</span>
                  <span>{planData.planDuration} tygodni</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0D7A61]/10 border border-[#0D7A61]/30 rounded-2xl p-4">
              <div className="flex items-center space-x-3">
                <div className="text-[#1DCD9F] text-2xl">🤖</div>
                <div>
                  <div className="text-white font-bold">Automatyczne dobieranie</div>
                  <div className="text-gray-300 text-sm">
                    System automatycznie dobierze ćwiczenia pasujące do Twoich celów i dostępnego sprzętu
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-white text-2xl font-bold mb-4">
                Podsumowanie planu
              </h3>
              <p className="text-gray-300">
                Sprawdź swój plan przed utworzeniem
              </p>
            </div>

            <div className="bg-[#1D1D1D] rounded-2xl p-6 border border-[#333333]">
              <h4 className="text-[#1DCD9F] font-bold text-xl mb-4">
                {planData.name || 'Nowy plan treningowy'}
              </h4>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-[#0a0a0a] rounded-xl">
                  <div className="text-[#1DCD9F] text-2xl font-bold">{planData.trainingDays}</div>
                  <div className="text-gray-400 text-sm">dni/tydzień</div>
                </div>
                <div className="text-center p-4 bg-[#0a0a0a] rounded-xl">
                  <div className="text-[#1DCD9F] text-2xl font-bold">{planData.planDuration}</div>
                  <div className="text-gray-400 text-sm">tygodni</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Główny cel:</span>
                  <span className="text-white">{goals.find(g => g.value === planData.goal)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sprzęt:</span>
                  <span className="text-white">{equipmentOptions.find(e => e.value === planData.equipment)?.label}</span>
                </div>
                {planData.notes && (
                  <div>
                    <span className="text-gray-400">Notatki:</span>
                    <p className="text-white text-sm mt-1">{planData.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#0D7A61]/10 border border-[#0D7A61]/30 rounded-2xl p-4">
              <div className="text-center">
                <div className="text-[#1DCD9F] text-4xl mb-2">✨</div>
                <div className="text-white font-bold">Gotowy do startu!</div>
                <div className="text-gray-300 text-sm">
                  Twój spersonalizowany plan treningowy zostanie utworzony
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
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative"
      }}
    >
      {/* Ciemna nakładka */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] to-[#0D7A61]/90 opacity-90"
        style={{ mixBlendMode: "multiply" }}
      ></div>
      
      {/* Logo */}
      <div className="absolute top-8 left-8 z-10">
        <Link to="/">
          <h1 className="text-[#1DCD9F] text-5xl font-bold">Lasko</h1>
        </Link>
      </div>

      <div className="max-w-2xl mx-auto z-10 relative pt-20">
        {/* Header z krokami */}
        <div className="text-center mb-8">
          <h1 className="text-white text-4xl font-bold mb-4">
            Kreator planu treningowego
          </h1>
          
          {/* Progress steps */}
          <div className="flex justify-center space-x-4 mb-6">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index <= currentStep 
                    ? 'bg-[#1DCD9F] text-black' 
                    : 'bg-[#333333] text-gray-400'
                }`}>
                  {index + 1}
                </div>
                <span className={`ml-2 text-sm ${
                  index <= currentStep ? 'text-white' : 'text-gray-400'
                }`}>
                  {step}
                </span>
                {index < steps.length - 1 && (
                  <div className={`mx-4 w-8 h-0.5 ${
                    index < currentStep ? 'bg-[#1DCD9F]' : 'bg-[#333333]'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content card */}
        <div className="bg-[#0a0a0a]/95 rounded-3xl shadow-xl p-8 border border-[#222222] shadow-[0_0_30px_10px_rgba(0,0,0,0.5)]">
          {renderStepContent()}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`px-8 py-3 rounded-full font-bold transition-all duration-300 ${
                currentStep === 0
                  ? 'bg-[#1D1D1D] text-gray-500 cursor-not-allowed'
                  : 'bg-[#1D1D1D] hover:bg-[#292929] text-white'
              }`}
            >
              Wstecz
            </button>

            {currentStep === steps.length - 1 ? (
              <button
                onClick={handleCreatePlan}
                disabled={!planData.name || !planData.goal || !planData.equipment}
                className={`px-8 py-3 rounded-full font-bold transition-all duration-300 ${
                  !planData.name || !planData.goal || !planData.equipment
                    ? 'bg-[#333333] text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] hover:brightness-110'
                }`}
              >
                Utwórz plan
              </button>
            ) : (
              <button
                onClick={nextStep}
                disabled={
                  (currentStep === 0 && (!planData.goal || !planData.equipment)) ||
                  (currentStep === 1 && !planData.trainingDays)
                }
                className={`px-8 py-3 rounded-full font-bold transition-all duration-300 ${
                  (currentStep === 0 && (!planData.goal || !planData.equipment)) ||
                  (currentStep === 1 && !planData.trainingDays)
                    ? 'bg-[#333333] text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] hover:brightness-110'
                }`}
              >
                Dalej
              </button>
            )}
          </div>
        </div>

        {/* Alternative option */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/recommended-plans')}
            className="text-[#1DCD9F] hover:text-white transition-colors duration-300 text-sm underline"
          >
            Wolę wybrać z gotowych planów
          </button>
        </div>
      </div>

      {/* Custom styles for slider */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #1DCD9F;
          cursor: pointer;
          border: 2px solid #0D7A61;
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #1DCD9F;
          cursor: pointer;
          border: 2px solid #0D7A61;
          box-shadow: none;
        }

        .slider::-webkit-slider-track {
          background: #1D1D1D;
          border-radius: 10px;
        }

        .slider::-moz-range-track {
          background: #1D1D1D;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default PlanCreatorPage;
// frontend/lasko-frontend/src/components/register/PlanRecommendationResult.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Proste komponenty SVG zamiast lucide-react
const Check = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);

const ChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9,18 15,12 9,6"/>
  </svg>
);

const PlanRecommendationResult = ({ formData, onNext, onPrev }) => {
  const navigate = useNavigate();
  const recommendedPlan = formData.recommendedPlan;

  if (!recommendedPlan) {
    return (
      <div className="bg-[#1D1D1D] rounded-3xl p-8 border border-[#292929] h-full flex flex-col justify-center">
        <div className="text-center">
          <p className="text-white text-lg">Brak rekomendowanego planu</p>
          <button onClick={onPrev} className="mt-4 bg-[#1DCD9F] text-black py-2 px-4 rounded-xl">
            Wróć
          </button>
        </div>
      </div>
    );
  }

  const handleViewPlan = () => {
    // Przekieruj bezpośrednio do kreatora planu z rekomendowanym planem
    navigate('/plan-creator', { 
      state: { 
        userData: formData,
        surveyCompleted: true,
        registrationSuccessful: false, // Jeszcze nie skończona rejestracja
        recommendedPlan: recommendedPlan,
        recommendationMethod: formData.recommendationMethod,
        skipBasicInfo: true,
        fromSurvey: true,
        viewMode: true, // Tryb podglądu planu
        canReturn: true // Może wrócić do rejestracji
      } 
    });
  };

  const handleAcceptPlan = () => {
    // Przechodzimy do ostatniego kroku - finalna rejestracja
    onNext();
  };

  const getMethodDisplayName = (method) => {
    const methodNames = {
      'product': 'Na podstawie produktu',
      'user': 'Na podstawie klienta',
      'hybrid': 'Hybrydowo'
    };
    return methodNames[method] || method;
  };

  return (
    <div className="bg-[#1D1D1D] rounded-3xl p-6 border border-[#292929] h-full flex flex-col max-h-[85vh] overflow-y-auto">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-[#1DCD9F] rounded-full flex items-center justify-center mx-auto mb-3">
          <Check />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Plan został dopasowany!</h2>
        <p className="text-[#e0e0e0] text-sm">Twój idealny plan treningowy jest gotowy</p>
      </div>

      <div className="bg-[#0a0a0a] rounded-xl p-5 mb-6 flex-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-white">{recommendedPlan.name}</h3>
          <div className="bg-[#1DCD9F] text-black px-2 py-1 rounded-full text-xs font-semibold">
            {recommendedPlan.match} dopasowania
          </div>
        </div>
        
        <p className="text-[#e0e0e0] text-sm mb-4">{recommendedPlan.description}</p>
        
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-[#1DCD9F]">{recommendedPlan.duration}</div>
            <div className="text-xs text-[#e0e0e0]">Czas trwania</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-[#1DCD9F]">{recommendedPlan.frequency}</div>
            <div className="text-xs text-[#e0e0e0]">Częstotliwość</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-[#1DCD9F]">12</div>
            <div className="text-xs text-[#e0e0e0]">Ćwiczeń</div>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-sm text-[#e0e0e0] mb-2">Metoda dopasowania:</div>
          <div className="bg-[#292929] text-[#1DCD9F] px-3 py-1 rounded-full text-sm inline-block">
            {getMethodDisplayName(recommendedPlan.method)}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-[#e0e0e0] mb-2">Cechy planu:</div>
          <div className="flex flex-wrap gap-2">
            {recommendedPlan.features.map((feature, index) => (
              <span key={index} className="bg-[#292929] text-[#e0e0e0] px-2 py-1 rounded-full text-xs">
                {feature}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 p-3 bg-[#1D1D1D] rounded-lg">
          <div className="text-xs text-[#cccccc] mb-1">Dopasowano na podstawie:</div>
          <div className="text-xs text-[#e0e0e0]">
            Cel: {formData.goal} • Poziom: {formData.level} • {formData.trainingDaysPerWeek} dni/tydzień • {formData.equipmentPreference}
          </div>
        </div>
      </div>

      {/* ✅ TU SĄ POPRAWNE PRZYCISKI */}
      <div className="space-y-3">
        <button 
          className="w-full bg-[#1DCD9F] text-black py-3 px-6 rounded-xl font-semibold hover:bg-[#1BB894] transition-colors flex items-center justify-center gap-2"
          onClick={handleViewPlan}
        >
          Zobacz plan
          <ChevronRight />
        </button>
        
        <button 
          className="w-full bg-[#333333] text-white py-2 px-6 rounded-xl font-semibold hover:bg-[#444444] transition-colors"
          onClick={handleAcceptPlan}
        >
          Akceptuj i zakończ rejestrację
        </button>
        
        <button 
          className="w-full bg-[#555555] text-white py-2 px-6 rounded-xl font-semibold hover:bg-[#666666] transition-colors"
          onClick={onPrev}
        >
          Zmień metodę rekomendacji
        </button>
      </div>

      <div className="text-center mt-4">
        <p className="text-xs text-[#666666]">
          Krok 10 z 11 • Będziesz mógł dostosować plan w kreatorze
        </p>
      </div>
    </div>
  );
};

export default PlanRecommendationResult;
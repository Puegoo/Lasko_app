import React, { useState } from 'react';

const GoalCard = ({ 
  formData, 
  updateFormData, 
  validationErrors = {}, 
  onNext, 
  onPrev, 
  isSubmitting 
}) => {
  const [selectedGoal, setSelectedGoal] = useState(formData.goal || '');

  const goals = [
    { 
      value: 'masa', 
      label: 'Budowanie masy mięśniowej', 
      description: 'Chcę zwiększyć masę i siłę',
      icon: '💪'
    },
    { 
      value: 'redukcja', 
      label: 'Redukcja tkanki tłuszczowej', 
      description: 'Chcę spalić tłuszcz i wyrzeźbić sylwetkę',
      icon: '🔥'
    },
    { 
      value: 'siła', 
      label: 'Zwiększenie siły', 
      description: 'Chcę być silniejszy/silniejsza',
      icon: '⚡'
    },
    { 
      value: 'kondycja', 
      label: 'Poprawa kondycji', 
      description: 'Chcę poprawić wytrzymałość i kondycję',
      icon: '🏃'
    }
  ];

  const handleGoalSelect = (goalValue) => {
    setSelectedGoal(goalValue);
    updateFormData('goal', goalValue);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedGoal) {
      return; // Błędy będą pokazane w UI
    }
    onNext();
  };

  const isValid = () => {
    return selectedGoal && selectedGoal.length > 0;
  };

  return (
    <div className="bg-[#2A2A2A] rounded-3xl p-6 shadow-2xl h-full flex flex-col">
      {/* Nagłówek */}
      <div className="text-center mb-6">
        <h2 className="text-white text-2xl font-bold mb-2">
          Jaki jest Twój główny cel?
        </h2>
        <p className="text-gray-400 text-base">
          Wybierz to, co najlepiej opisuje Twoje zamiary
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* Opcje celów - ograniczona wysokość */}
        <div className="flex-1 flex flex-col justify-start space-y-3 min-h-0 overflow-y-auto">
          {goals.map((goal) => (
            <button
              key={goal.value}
              type="button"
              onClick={() => handleGoalSelect(goal.value)}
              disabled={isSubmitting}
              className={`group relative p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                selectedGoal === goal.value
                  ? 'border-[#1DCD9F] bg-gradient-to-r from-[#0D7A61]/20 to-[#1DCD9F]/20 text-white transform scale-105'
                  : 'border-[#444444] bg-[#1D1D1D] text-gray-300 hover:border-[#1DCD9F]/50 hover:bg-[#252525] hover:transform hover:scale-102'
              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center space-x-3">
                {/* Ikona */}
                <div className={`text-2xl transition-all duration-300 ${
                  selectedGoal === goal.value ? 'scale-110' : 'group-hover:scale-105'
                }`}>
                  {goal.icon}
                </div>
                
                {/* Tekst */}
                <div className="flex-1">
                  <div className={`font-bold text-lg transition-colors duration-300 ${
                    selectedGoal === goal.value ? 'text-[#1DCD9F]' : 'text-white group-hover:text-[#1DCD9F]'
                  }`}>
                    {goal.label}
                  </div>
                  <div className="text-sm opacity-80 mt-1 text-gray-400">
                    {goal.description}
                  </div>
                </div>
                
                {/* Wskaźnik wyboru */}
                <div className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                  selectedGoal === goal.value
                    ? 'border-[#1DCD9F] bg-[#1DCD9F] shadow-[0_0_10px_rgba(29,205,159,0.5)]'
                    : 'border-gray-500 group-hover:border-[#1DCD9F]/50'
                }`}>
                  {selectedGoal === goal.value && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Efekt hover */}
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-[#0D7A61]/5 to-[#1DCD9F]/5 opacity-0 transition-opacity duration-300 ${
                selectedGoal !== goal.value ? 'group-hover:opacity-100' : ''
              }`}></div>
            </button>
          ))}
        </div>

        {/* Wyświetlanie błędów walidacji */}
        {validationErrors.goal && (
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-3 mt-4">
            <p className="text-red-400 text-sm text-center">
              {validationErrors.goal}
            </p>
          </div>
        )}

        {/* Przyciski nawigacji - ZAWSZE WIDOCZNE NA DOLE */}
        <div className="flex justify-between space-x-4 mt-6 pt-4 border-t border-[#444444]">
          <button
            type="button"
            onClick={onPrev}
            disabled={isSubmitting}
            className="px-6 py-3 bg-[#1D1D1D] hover:bg-[#292929] text-white font-bold rounded-full transition-all duration-300 border border-[#444444] hover:border-[#666666] disabled:opacity-50"
          >
            Wstecz
          </button>
          
          <button
            type="submit"
            disabled={!isValid() || isSubmitting}
            className={`flex-1 px-8 py-3 font-bold rounded-full transition-all duration-300 ${
              isValid() && !isSubmitting
                ? 'bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] hover:brightness-110 transform hover:-translate-y-1'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Ładowanie...' : 'Dalej'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GoalCard;
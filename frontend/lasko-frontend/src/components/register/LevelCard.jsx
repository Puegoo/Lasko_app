import React, { useState } from 'react';

const LevelCard = ({ 
  formData, 
  updateFormData, 
  validationErrors = {}, 
  onNext, 
  onPrev, 
  isSubmitting 
}) => {
  const [selectedLevel, setSelectedLevel] = useState(formData.level || '');

  const levels = [
    { 
      value: 'początkujący', 
      label: 'Początkujący', 
      description: 'Dopiero zaczynam przygodę z treningiem',
      details: '0-6 miesięcy doświadczenia',
      icon: '🌱'
    },
    { 
      value: 'sredniozaawansowany', 
      label: 'Średnio zaawansowany', 
      description: 'Mam pewne doświadczenie z treningiem',
      details: '6 miesięcy - 2 lata doświadczenia',
      icon: '💪'
    },
    { 
      value: 'zaawansowany', 
      label: 'Zaawansowany', 
      description: 'Trenuję regularnie od dłuższego czasu',
      details: '2+ lata doświadczenia',
      icon: '🔥'
    }
  ];

  const handleLevelSelect = (levelValue) => {
    setSelectedLevel(levelValue);
    updateFormData('level', levelValue);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedLevel) {
      return; // Błędy będą pokazane w UI
    }
    onNext();
  };

  const isValid = () => {
    return selectedLevel && selectedLevel.length > 0;
  };

  return (
    <div className="bg-[#2A2A2A] rounded-3xl p-6 shadow-2xl h-full flex flex-col">
      {/* Nagłówek */}
      <div className="text-center mb-6">
        <h2 className="text-white text-2xl font-bold mb-2">
          Jaki jest Twój poziom zaawansowania?
        </h2>
        <p className="text-gray-400 text-base">
          Pomoże nam to dostosować plan treningowy
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* Opcje poziomów - ograniczona wysokość */}
        <div className="flex-1 flex flex-col justify-start space-y-3 min-h-0 overflow-y-auto">
          {levels.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => handleLevelSelect(level.value)}
              disabled={isSubmitting}
              className={`group relative p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                selectedLevel === level.value
                  ? 'border-[#1DCD9F] bg-gradient-to-r from-[#0D7A61]/20 to-[#1DCD9F]/20 text-white transform scale-105'
                  : 'border-[#444444] bg-[#1D1D1D] text-gray-300 hover:border-[#1DCD9F]/50 hover:bg-[#252525] hover:transform hover:scale-102'
              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center space-x-3">
                {/* Ikona */}
                <div className={`text-2xl transition-all duration-300 ${
                  selectedLevel === level.value ? 'scale-110' : 'group-hover:scale-105'
                }`}>
                  {level.icon}
                </div>
                
                {/* Tekst */}
                <div className="flex-1">
                  <div className={`font-bold text-lg transition-colors duration-300 ${
                    selectedLevel === level.value ? 'text-[#1DCD9F]' : 'text-white group-hover:text-[#1DCD9F]'
                  }`}>
                    {level.label}
                  </div>
                  <div className="text-sm opacity-80 mt-1 text-gray-400">
                    {level.description}
                  </div>
                  <div className="text-xs opacity-60 mt-1 text-gray-500">
                    {level.details}
                  </div>
                </div>
                
                {/* Wskaźnik wyboru */}
                <div className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                  selectedLevel === level.value
                    ? 'border-[#1DCD9F] bg-[#1DCD9F] shadow-[0_0_10px_rgba(29,205,159,0.5)]'
                    : 'border-gray-500 group-hover:border-[#1DCD9F]/50'
                }`}>
                  {selectedLevel === level.value && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Efekt hover */}
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-[#0D7A61]/5 to-[#1DCD9F]/5 opacity-0 transition-opacity duration-300 ${
                selectedLevel !== level.value ? 'group-hover:opacity-100' : ''
              }`}></div>
            </button>
          ))}
        </div>

        {/* Wyświetlanie błędów walidacji */}
        {validationErrors.level && (
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-3 mt-4">
            <p className="text-red-400 text-sm text-center">
              {validationErrors.level}
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

export default LevelCard;
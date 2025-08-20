import React, { useState } from 'react';

const TrainingDaysCard = ({ 
  formData, 
  updateFormData, 
  validationErrors = {}, 
  onNext, 
  onPrev, 
  isSubmitting 
}) => {
  const [selectedDays, setSelectedDays] = useState(formData.trainingDaysPerWeek || null);

  const daysOptions = [
    { value: 2, label: '2 dni', icon: '🌟' },
    { value: 3, label: '3 dni', icon: '🔥', popular: true },
    { value: 4, label: '4 dni', icon: '💪' },
    { value: 5, label: '5 dni', icon: '⚡' },
    { value: 6, label: '6 dni', icon: '🏆' }
  ];

  const handleDaysSelect = (daysValue) => {
    setSelectedDays(daysValue);
    updateFormData('trainingDaysPerWeek', daysValue);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedDays) {
      return;
    }
    onNext();
  };

  const isValid = () => {
    return selectedDays !== null && selectedDays > 0;
  };

  return (
    <div className="bg-[#2A2A2A] rounded-3xl p-6 shadow-2xl h-full flex flex-col">
      {/* Nagłówek - bardzo skrócony */}
      <div className="text-center mb-4">
        <h2 className="text-white text-xl font-bold mb-1">
          Ile dni w tygodniu chcesz trenować?
        </h2>
        <p className="text-gray-400 text-sm">
          Wybierz realistyczną częstotliwość
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* Opcje dni - kompaktowe */}
        <div className="flex-1 space-y-2 min-h-0 overflow-y-auto">
          {daysOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleDaysSelect(option.value)}
              disabled={isSubmitting}
              className={`group w-full p-3 rounded-lg border-2 transition-all duration-300 text-left ${
                selectedDays === option.value
                  ? 'border-[#1DCD9F] bg-gradient-to-r from-[#0D7A61]/20 to-[#1DCD9F]/20 text-white'
                  : 'border-[#444444] bg-[#1D1D1D] text-gray-300 hover:border-[#1DCD9F]/50 hover:bg-[#252525]'
              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{option.icon}</span>
                  <span className={`font-semibold ${
                    selectedDays === option.value ? 'text-[#1DCD9F]' : 'text-white'
                  }`}>
                    {option.label} w tygodniu
                  </span>
                  {option.popular && (
                    <span className="bg-[#1DCD9F] text-black text-xs px-2 py-1 rounded-full font-bold">
                      POPULARNE
                    </span>
                  )}
                </div>
                
                {/* Wskaźnik wyboru */}
                <div className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                  selectedDays === option.value
                    ? 'border-[#1DCD9F] bg-[#1DCD9F]'
                    : 'border-gray-500'
                }`}>
                  {selectedDays === option.value && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Błędy walidacji */}
        {validationErrors.training_days_per_week && (
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-2 mt-2">
            <p className="text-red-400 text-sm text-center">
              {validationErrors.training_days_per_week}
            </p>
          </div>
        )}

        {/* Przyciski nawigacji - ZAWSZE WIDOCZNE */}
        <div className="flex justify-between space-x-4 mt-4 pt-3 border-t border-[#444444]">
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

export default TrainingDaysCard;
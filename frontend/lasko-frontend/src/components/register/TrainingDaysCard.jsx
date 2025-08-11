import React, { useState } from 'react';

const TrainingDaysCard = ({ formData, updateFormData, onNext, onPrev }) => {
  const [selectedDays, setSelectedDays] = useState(formData.trainingDaysPerWeek || null);

  const daysOptions = [
    { value: 2, label: '2 dni', description: 'Mało czasu, ale chcę zacząć' },
    { value: 3, label: '3 dni', description: 'Optymalne dla początkujących' },
    { value: 4, label: '4 dni', description: 'Dobry balans dla zaawansowanych' },
    { value: 5, label: '5 dni', description: 'Intensywny trening' },
    { value: 6, label: '6 dni', description: 'Bardzo zaawansowany poziom' }
  ];

  const handleDaysSelect = (daysValue) => {
    setSelectedDays(daysValue);
    updateFormData('trainingDaysPerWeek', daysValue);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedDays === null) {
      alert('Proszę wybrać liczbę dni treningowych');
      return;
    }
    onNext();
  };

  return (
    <div className="bg-[#0a0a0a]/95 rounded-3xl shadow-xl p-8 w-full h-[550px] flex flex-col shadow-[0_0_30px_10px_rgba(0,0,0,0.5)] border border-[#222222]">
      <form onSubmit={handleSubmit} className="flex flex-col space-y-6 flex-grow">
        {/* Pasek postępu */}
        <div className="max-w-xs mx-auto w-full h-3 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] rounded-full" style={{ width: '75%' }}></div>
        </div>
        
        <div className="text-center mt-8">
          <h2 className="text-white text-2xl font-bold">Ile dni chcesz trenować?</h2>
          <p className="text-white text-lg">Wybierz realistyczną liczbę dla siebie</p>
        </div>

        {/* Opcje dni treningowych */}
        <div className="flex-grow flex flex-col justify-center space-y-3 max-h-72 overflow-y-auto">
          {daysOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleDaysSelect(option.value)}
              className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                selectedDays === option.value
                  ? 'border-[#1DCD9F] bg-[#0D7A61]/20 text-white'
                  : 'border-[#333333] bg-[#1D1D1D] text-gray-300 hover:border-[#555555] hover:bg-[#252525]'
              }`}
            >
              <div className="font-bold text-lg">{option.label}</div>
              <div className="text-sm opacity-80 mt-1">{option.description}</div>
            </button>
          ))}
        </div>

        {/* Przyciski nawigacji */}
        <div className="mt-auto grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={onPrev}
            className="bg-[#1D1D1D] hover:bg-[#292929] text-white font-bold py-4 rounded-full transition-all duration-300"
          >
            Wstecz
          </button>
          <button
            type="submit"
            className="bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white font-bold py-4 rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] hover:brightness-110"
          >
            Dalej
          </button>
        </div>
      </form>
    </div>
  );
};

export default TrainingDaysCard;
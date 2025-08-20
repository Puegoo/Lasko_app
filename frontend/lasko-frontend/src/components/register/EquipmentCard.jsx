import React, { useState } from 'react';

const EquipmentCard = ({ 
  formData, 
  updateFormData, 
  validationErrors = {}, 
  onNext, 
  onPrev, 
  isSubmitting,
  isLastStep = false
}) => {
  const [selectedEquipment, setSelectedEquipment] = useState(formData.equipmentPreference || '');

  const equipmentOptions = [
    { value: 'siłownia', label: 'Pełna siłownia', icon: '🏋️‍♂️' },
    { value: 'wolne_ciezary', label: 'Wolne ciężary', icon: '🏋️' },
    { value: 'hantle', label: 'Tylko hantle', icon: '💪' },
    { value: 'maszyny', label: 'Maszyny', icon: '⚙️' },
    { value: 'brak', label: 'Brak sprzętu', icon: '🤸‍♂️' }
  ];

  const handleEquipmentSelect = (equipmentValue) => {
    setSelectedEquipment(equipmentValue);
    updateFormData('equipmentPreference', equipmentValue);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedEquipment) return;
    onNext();
  };

  const isValid = () => {
    return selectedEquipment && selectedEquipment.length > 0;
  };

  return (
    <div className="bg-[#2A2A2A] rounded-3xl p-4 shadow-2xl h-full flex flex-col">
      {/* Nagłówek - bardzo skrócony */}
      <div className="text-center mb-3">
        <h2 className="text-white text-lg font-bold mb-1">
          Jaki sprzęt masz do dyspozycji?
        </h2>
        <p className="text-gray-400 text-sm">
          Dostosujemy plan do Twojego wyposażenia
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* Opcje sprzętu - bardzo kompaktowe */}
        <div className="flex-1 space-y-2 min-h-0 overflow-y-auto">
          {equipmentOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleEquipmentSelect(option.value)}
              disabled={isSubmitting}
              className={`group w-full p-2 rounded-lg border-2 transition-all duration-300 text-left ${
                selectedEquipment === option.value
                  ? 'border-[#1DCD9F] bg-gradient-to-r from-[#0D7A61]/20 to-[#1DCD9F]/20 text-white'
                  : 'border-[#444444] bg-[#1D1D1D] text-gray-300 hover:border-[#1DCD9F]/50 hover:bg-[#252525]'
              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-base">{option.icon}</span>
                  <span className={`font-medium text-sm ${
                    selectedEquipment === option.value ? 'text-[#1DCD9F]' : 'text-white'
                  }`}>
                    {option.label}
                  </span>
                </div>
                
                {/* Wskaźnik wyboru */}
                <div className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                  selectedEquipment === option.value
                    ? 'border-[#1DCD9F] bg-[#1DCD9F]'
                    : 'border-gray-500'
                }`}>
                  {selectedEquipment === option.value && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Błędy walidacji */}
        {validationErrors.equipment_preference && (
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-2 mt-2">
            <p className="text-red-400 text-xs text-center">
              {validationErrors.equipment_preference}
            </p>
          </div>
        )}

        {/* Przyciski nawigacji - ZAWSZE WIDOCZNE */}
        <div className="flex justify-between space-x-3 mt-3 pt-3 border-t border-[#444444]">
          <button
            type="button"
            onClick={onPrev}
            disabled={isSubmitting}
            className="px-4 py-2 bg-[#1D1D1D] hover:bg-[#292929] text-white font-bold rounded-full transition-all duration-300 border border-[#444444] hover:border-[#666666] disabled:opacity-50 text-sm"
          >
            Wstecz
          </button>
          
          <button
            type="submit"
            disabled={!isValid() || isSubmitting}
            className={`flex-1 px-6 py-2 font-bold rounded-full transition-all duration-300 text-sm ${
              isValid() && !isSubmitting
                ? 'bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] hover:brightness-110'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Tworzenie konta...' : isLastStep ? 'Zakończ rejestrację' : 'Dalej'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EquipmentCard;
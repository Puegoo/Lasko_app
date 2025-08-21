// frontend/lasko-frontend/src/components/register/EquipmentCard.jsx
import React, { useState } from 'react';

/**
 * Karta wyboru dostępnego sprzętu:
 * - Ciemny motyw, minimalna wysokość, treść wyśrodkowana pionowo
 * - ARIA: radiogroup (przyciski zachowują się jak radio), Enter/Spacja aktywują wybór
 * - Walidacja inline: wybór wymagany, komunikaty spójne z backendem (equipment_preference)
 */
const EquipmentCard = ({
  formData,
  updateFormData,
  validationErrors = {},
  onNext,
  onPrev,
  isSubmitting = false,
  isLastStep = false,
}) => {
  // Wartość aktualnie wybranej opcji (lokalnie + synchronizacja z formData)
  const [selectedEquipment, setSelectedEquipment] = useState(
    formData?.equipmentPreference || ''
  );

  // Zestaw dostępnych opcji sprzętu
  const equipmentOptions = [
    { value: 'siłownia', label: 'Pełna siłownia', icon: '🏋️‍♂️' },
    { value: 'wolne_ciezary', label: 'Wolne ciężary', icon: '🏋️' },
    { value: 'hantle', label: 'Tylko hantle', icon: '💪' },
    { value: 'maszyny', label: 'Maszyny', icon: '⚙️' },
    { value: 'brak', label: 'Brak sprzętu', icon: '🤸‍♂️' },
  ];

  // Zapis wyboru do stanu i modelu formularza
  const handleEquipmentSelect = (equipmentValue) => {
    setSelectedEquipment(equipmentValue);
    updateFormData('equipmentPreference', equipmentValue);
  };

  // Aktywacja klawiaturą (Enter/Spacja)
  const handleKeyActivate = (e, value) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleEquipmentSelect(value);
    }
  };

  // Zatwierdzenie kroku
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedEquipment || isSubmitting) return;
    onNext();
  };

  const isFormValid = Boolean(selectedEquipment);

  return (
    <div
      className={[
        'bg-[#0a0a0a]/95 rounded-3xl shadow-xl p-6 md:p-8 w-full',
        'flex flex-col border border-[#222222] shadow-[0_0_30px_10px_rgba(0,0,0,0.5)]',
        'min-h-[520px]',
      ].join(' ')}
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        {/* Treść wyśrodkowana pionowo */}
        <div className="flex flex-col gap-6 flex-1 justify-center">
          {/* Nagłówek */}
          <div className="text-center">
            <h2 className="text-white text-2xl font-bold">Jaki sprzęt masz do dyspozycji?</h2>
            <p className="text-white/90 text-lg">Dostosujemy plan do Twojego wyposażenia</p>
          </div>

          {/* Opcje (radiogroup) */}
          <div
            role="radiogroup"
            aria-label="Wybór dostępnego sprzętu"
            className="flex flex-col gap-3"
          >
            {equipmentOptions.map((option) => {
              const isActive = selectedEquipment === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  disabled={isSubmitting}
                  onClick={() => handleEquipmentSelect(option.value)}
                  onKeyDown={(e) => handleKeyActivate(e, option.value)}
                  className={[
                    'group relative p-4 rounded-xl text-left transition-all duration-300',
                    'border bg-[#1D1D1D] text-gray-300',
                    isActive
                      ? 'border-[#1DCD9F] bg-gradient-to-r from-[#0D7A61]/20 to-[#1DCD9F]/20 text-white'
                      : 'border-[#444444] hover:border-[#1DCD9F]/50 hover:bg-[#252525]',
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Opis opcji */}
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{option.icon}</span>
                      <span
                        className={[
                          'font-bold text-lg transition-colors duration-300',
                          isActive ? 'text-[#1DCD9F]' : 'text-white',
                        ].join(' ')}
                      >
                        {option.label}
                      </span>
                    </div>

                    {/* Wskaźnik wyboru */}
                    <div
                      className={[
                        'w-5 h-5 rounded-full border-2 transition-all duration-300',
                        isActive
                          ? 'border-[#1DCD9F] bg-[#1DCD9F] shadow-[0_0_10px_rgba(29,205,159,0.5)]'
                          : 'border-gray-500',
                      ].join(' ')}
                      aria-hidden="true"
                    >
                      {isActive && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Subtelny efekt hover dla nieaktywnych */}
                  {!isActive && (
                    <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-[#0D7A61]/5 to-[#1DCD9F]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Błąd walidacji z backendu */}
        {validationErrors.equipment_preference && (
          <div className="bg-red-900/20 border border-red-400/60 rounded-lg p-3 mt-4">
            <p className="text-red-300 text-sm text-center">
              {validationErrors.equipment_preference}
            </p>
          </div>
        )}

        {/* Nawigacja (CTA przy dole) */}
        <div className="mt-auto grid grid-cols-2 gap-4 pt-4">
          <button
            type="button"
            onClick={onPrev}
            disabled={isSubmitting}
            className="bg-[#1D1D1D] hover:bg-[#292929] text-white font-bold py-4 rounded-full transition-all duration-300 disabled:opacity-60"
          >
            Wstecz
          </button>

          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={[
              'py-4 rounded-full font-bold transition-all duration-300',
              isFormValid && !isSubmitting
                ? 'bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] hover:brightness-110'
                : 'bg-gray-600 text-gray-300 cursor-not-allowed',
            ].join(' ')}
            aria-busy={isSubmitting ? 'true' : 'false'}
          >
            {isSubmitting ? 'Tworzenie konta…' : isLastStep ? 'Zakończ rejestrację' : 'Dalej'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EquipmentCard;
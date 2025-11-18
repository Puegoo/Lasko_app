// frontend/lasko-frontend/src/components/register/SurveyChoiceCard.jsx
import React, { useState } from 'react';

const SurveyChoiceCard = ({
  formData,
  updateFormData,
  onNext,
  onPrev,
  isSubmitting = false,
}) => {
  const [selected, setSelected] = useState(formData?.surveyChoice || null);

  const handleSelect = (choice) => {
    if (isSubmitting) return;
    setSelected(choice);
    updateFormData('surveyChoice', choice);
    updateFormData('skipSurvey', choice === 'skip');
  };

  const handleNext = () => {
    if (!selected || isSubmitting) return;
    // Kontynuuj do następnego kroku (rejestracja zostanie wykonana w RegistrationContainer)
    onNext?.();
  };

  const onKeyActivate = (e, choice) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(choice);
    }
  };

  const isDisabled = isSubmitting;

  return (
    <div className="bg-[#0b0b0b]/95 rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] p-6 md:p-8 w-full">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-white text-2xl font-black">Jak chcesz stworzyć swój plan?</h2>
        <p className="text-gray-300 mt-1">
          Wybierz sposób, który najlepiej odpowiada Twoim potrzebom
        </p>
      </div>

      {/* Opcje (radiogroup) */}
      <div
        role="radiogroup"
        aria-label="Wybór sposobu tworzenia planu"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* OPCJA 1: Wypełnij ankietę (zalecane) */}
        <button
          type="button"
          role="radio"
          tabIndex={0}
          aria-checked={selected === 'fill'}
          disabled={isDisabled}
          onClick={() => handleSelect('fill')}
          onKeyDown={(e) => onKeyActivate(e, 'fill')}
          className={[
            'rounded-2xl p-6 transition-all border flex flex-col items-center justify-center text-center min-h-[240px]',
            'bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white border-white/10',
            'hover:brightness-110 hover:shadow-[0_0_20px_rgba(29,205,159,0.6)]',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60',
            isDisabled ? 'opacity-50 cursor-not-allowed' : '',
            selected === 'fill' ? 'ring-2 ring-emerald-400/60' : '',
          ].join(' ')}
        >
          <div className="relative mb-2">
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/90 text-[#0a0a0a] text-[10px] px-2 py-0.5 rounded-full font-extrabold tracking-wide whitespace-nowrap">
              ZALECANE
            </span>
          </div>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" className="text-white mb-4">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="10" y1="9" x2="8" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <div className="font-bold text-xl mb-2">Wypełnij szczegółową ankietę</div>
          <div className="text-sm opacity-95">
            Odpowiedz na pytania o swoje preferencje treningowe
          </div>
          <span
            aria-hidden="true"
            className={[
              'inline-flex h-6 w-6 items-center justify-center rounded-full border-2 mt-4',
              selected === 'fill' ? 'bg-white border-white' : 'border-white/70',
            ].join(' ')}
          >
            {selected === 'fill' && <span className="block h-2 w-2 rounded-full bg-[#0D7A61]" />}
          </span>
        </button>

        {/* OPCJA 2: Szybki kreator (pomiń ankietę) */}
        <button
          type="button"
          role="radio"
          tabIndex={0}
          aria-checked={selected === 'skip'}
          disabled={isDisabled}
          onClick={() => handleSelect('skip')}
          onKeyDown={(e) => onKeyActivate(e, 'skip')}
          className={[
            'rounded-2xl p-6 transition-all border flex flex-col items-center justify-center text-center min-h-[240px]',
            'bg-[#131313] text-white border-white/10 hover:bg-[#171717]',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60',
            isDisabled ? 'opacity-50 cursor-not-allowed' : '',
            selected === 'skip' ? 'ring-2 ring-emerald-400/60' : '',
          ].join(' ')}
        >
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" className="text-white mb-4">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="10" y1="9" x2="8" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <div className="font-bold text-xl mb-2">Przejdź bez ankiety</div>
          <div className="text-sm opacity-90">
            Zacznij treningi natychmiast z podstawowym planem
          </div>
          <span
            aria-hidden="true"
            className={[
              'inline-flex h-6 w-6 items-center justify-center rounded-full border-2 mt-4',
              selected === 'skip' ? 'bg-white border-white' : 'border-white/70',
            ].join(' ')}
          >
            {selected === 'skip' && <span className="block h-2 w-2 rounded-full bg-[#0D7A61]" />}
          </span>
        </button>
      </div>

      {/* Info pod opcjami */}
      <p className="text-center text-sm text-gray-400 mt-4 flex items-center justify-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400">
          <path d="M9 21h6M12 3a7 7 0 0 1 7 7c0 2.5-1.5 4.5-3.5 6.5H9.5C7.5 14.5 6 12.5 6 10a7 7 0 0 1 6-7z"/>
        </svg>
        Zawsze możesz zmienić preferencje później w ustawieniach profilu.
      </p>

      {/* CTA (spójne z innymi kartami) */}
      <div className="grid grid-cols-2 gap-4 pt-6">
        <button
          type="button"
          onClick={onPrev}
          disabled={isDisabled}
          className="bg-[#1D1D1D] hover:bg-[#292929] text-white font-bold py-4 rounded-full transition-all duration-300 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40"
        >
          Wstecz
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!selected || isDisabled}
          className={[
            'py-4 rounded-full font-bold transition-all duration-300',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60',
            selected && !isDisabled
              ? 'bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white hover:brightness-110 hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] active:scale-[0.99]'
              : 'bg-white/10 text-gray-400 cursor-not-allowed',
          ].join(' ')}
        >
          Kontynuuj
        </button>
      </div>
    </div>
  );
};

export default SurveyChoiceCard;
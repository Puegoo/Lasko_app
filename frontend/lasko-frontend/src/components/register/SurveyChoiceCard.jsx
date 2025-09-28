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

  const chooseAndGo = (choice) => {
    if (isSubmitting) return;
    setSelected(choice);
    updateFormData('surveyChoice', choice);
    updateFormData('skipSurvey', choice === 'skip');
    // auto-advance
    onNext?.();
  };

  const onKeyActivate = (e, choice) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      chooseAndGo(choice);
    }
  };

  const baseOption =
    'w-full rounded-2xl p-5 text-left transition-all border flex items-center justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60';

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
        className="flex flex-col gap-4"
      >
        {/* OPCJA 1: Wypełnij ankietę (zalecane) */}
        <button
          type="button"
          role="radio"
          tabIndex={0}
          aria-checked={selected === 'fill'}
          disabled={isDisabled}
          onClick={() => chooseAndGo('fill')}
          onKeyDown={(e) => onKeyActivate(e, 'fill')}
          className={[
            baseOption,
            'bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white border-white/10',
            'hover:brightness-110 hover:shadow-[0_0_20px_rgba(29,205,159,0.6)]',
            isDisabled ? 'opacity-50 cursor-not-allowed' : '',
            selected === 'fill' ? 'ring-2 ring-emerald-400/60' : '',
          ].join(' ')}
        >
          <div className="flex items-center gap-4">
            <span className="text-2xl">📝</span>
            <div>
              <div className="font-bold text-lg">Wypełnij szczegółową ankietę</div>
              <div className="text-sm opacity-95">
                Odpowiedz na pytania o swoje preferencje treningowe
              </div>
            </div>
          </div>
          <div className="relative">
            <span className="absolute -top-7 right-0 bg-white/90 text-[#0a0a0a] text-[10px] px-2 py-0.5 rounded-full font-extrabold tracking-wide">
              ZALECANE
            </span>
            <span
              aria-hidden="true"
              className={[
                'inline-flex h-6 w-6 items-center justify-center rounded-full border-2',
                selected === 'fill' ? 'bg-white border-white' : 'border-white/70',
              ].join(' ')}
            >
              {selected === 'fill' && <span className="block h-2 w-2 rounded-full bg-[#0D7A61]" />}
            </span>
          </div>
        </button>

        {/* OPCJA 2: Szybki kreator (pomiń ankietę) */}
        <button
          type="button"
          role="radio"
          tabIndex={0}
          aria-checked={selected === 'skip'}
          disabled={isDisabled}
          onClick={() => chooseAndGo('skip')}
          onKeyDown={(e) => onKeyActivate(e, 'skip')}
          className={[
            baseOption,
            'bg-[#131313] text-white border-white/10 hover:bg-[#171717]',
            isDisabled ? 'opacity-50 cursor-not-allowed' : '',
            selected === 'skip' ? 'ring-2 ring-emerald-400/60' : '',
          ].join(' ')}
        >
          <div className="flex items-center gap-4">
            <span className="text-2xl">⚡</span>
            <div>
              <div className="font-bold text-lg">Przejdź do szybkiego kreatora</div>
              <div className="text-sm opacity-90">
                Stwórz plan na podstawie podstawowych informacji
              </div>
            </div>
          </div>
          <span
            aria-hidden="true"
            className={[
              'inline-flex h-6 w-6 items-center justify-center rounded-full border-2',
              selected === 'skip' ? 'bg-white border-white' : 'border-white/70',
            ].join(' ')}
          >
            {selected === 'skip' && <span className="block h-2 w-2 rounded-full bg-[#0D7A61]" />}
          </span>
        </button>
      </div>

      {/* Info pod opcjami */}
      <p className="text-center text-sm text-gray-400 mt-4">
        💡 Zawsze możesz zmienić preferencje później w ustawieniach profilu.
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
          onClick={() => selected && chooseAndGo(selected)}
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
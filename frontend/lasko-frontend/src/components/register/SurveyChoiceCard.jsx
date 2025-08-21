// frontend/lasko-frontend/src/components/register/SurveyChoiceCard.jsx
import React, { useState } from 'react';

/**
 * Karta wyboru ankiety:
 * - Dwie opcje: wypełnić ankietę lub pominąć i przejść do kreatora
 * - Ciemny motyw, min. wysokość, zawartość wyśrodkowana pionowo
 * - ARIA: radiogroup dla lepszej dostępności; Enter/Space aktywuje wybór
 */
const SurveyChoiceCard = ({
  formData,
  updateFormData,
  onNext,
  onPrev,
  isSubmitting = false,
}) => {
  const [selected, setSelected] = useState(formData?.surveyChoice || null);

  // Zapis wyboru + flaga pominięcia, następnie przejście dalej
  const handleSurveyChoice = (choice) => {
    setSelected(choice);
    updateFormData('surveyChoice', choice);
    updateFormData('skipSurvey', choice === 'skip');
    if (!isSubmitting) onNext();
  };

  // Obsługa klawiatury na przyciskach (Enter/Space)
  const onKeyActivate = (e, choice) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSurveyChoice(choice);
    }
  };

  const baseBtn =
    'w-full rounded-full font-bold transition-all duration-300 py-6 text-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1DCD9F]/60';

  return (
    <div
      className={[
        'bg-[#0a0a0a]/95 rounded-3xl shadow-xl p-6 md:p-8 w-full',
        'flex flex-col border border-[#222222] shadow-[0_0_30px_10px_rgba(0,0,0,0.5)]',
        'min-h-[520px]',
      ].join(' ')}
    >
      <div className="flex flex-col flex-1">
        {/* Zawartość wyśrodkowana pionowo */}
        <div className="flex flex-col gap-8 flex-1 justify-center">
          {/* Nagłówek */}
          <div className="text-center">
            <h2 className="text-white text-2xl font-bold">Prawie gotowe!</h2>
            <p className="text-white/90 text-lg">
              Chcesz wypełnić krótką ankietę, aby dostać spersonalizowane rekomendacje planów treningowych?
            </p>
          </div>

          {/* Opcje wyboru */}
          <div
            role="radiogroup"
            aria-label="Wybór dotyczący ankiety"
            className="flex flex-col gap-4"
          >
            <button
              type="button"
              role="radio"
              aria-checked={selected === 'fill'}
              disabled={isSubmitting}
              onClick={() => handleSurveyChoice('fill')}
              onKeyDown={(e) => onKeyActivate(e, 'fill')}
              className={[
                baseBtn,
                'bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white',
                'hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] hover:brightness-110',
                isSubmitting ? 'opacity-60 cursor-not-allowed' : '',
              ].join(' ')}
            >
              Tak, wypełnię ankietę (2 minuty)
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={selected === 'skip'}
              disabled={isSubmitting}
              onClick={() => handleSurveyChoice('skip')}
              onKeyDown={(e) => onKeyActivate(e, 'skip')}
              className={[
                baseBtn,
                'bg-[#1D1D1D] text-white hover:bg-[#292929]',
                isSubmitting ? 'opacity-60 cursor-not-allowed' : '',
              ].join(' ')}
            >
              Pomiń – przejdź od razu do kreatora
            </button>
          </div>
        </div>

        {/* Przycisk wstecz przy dole kafelka */}
        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={onPrev}
            disabled={isSubmitting}
            className="w-full bg-[#1D1D1D] hover:bg-[#292929] text-white font-bold py-4 rounded-full transition-all duration-300 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1DCD9F]/60"
          >
            Wstecz
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurveyChoiceCard;
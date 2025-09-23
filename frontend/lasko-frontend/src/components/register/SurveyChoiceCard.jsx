// frontend/lasko-frontend/src/components/register/SurveyChoiceCard.jsx
import React, { useState } from 'react';

/**
 * Karta wyboru ankiety:
 * - Dwie opcje: wypełnić ankietę lub pominąć i przejść do kreatora
 * - Ciemny motyw, min. wysokość, zawartość wyśrodkowana pionowo
 * - ARIA: radiogroup dla lepszej dostępności; Enter/Space aktywuje wybór
 * - NAPRAWIONE: dodane debugowanie, lepsze obsługa kliknięć, disabled state
 */
const SurveyChoiceCard = ({
  formData,
  updateFormData,
  onNext,
  onPrev,
  isSubmitting = false,
}) => {
  const [selected, setSelected] = useState(formData?.surveyChoice || null);
  const [isProcessing, setIsProcessing] = useState(false);

  // DODANE: Debugowanie stanu
  console.log('🔍 SurveyChoiceCard - Debug info:', {
    formData,
    selected,
    isSubmitting,
    isProcessing,
    hasOnNext: typeof onNext === 'function',
    hasUpdateFormData: typeof updateFormData === 'function'
  });

  // NAPRAWIONE: Zapis wyboru + flaga pominięcia, następnie przejście dalej
  const handleSurveyChoice = async (choice) => {
    console.log('🔍 SurveyChoice - handleSurveyChoice wywołane:', { 
      choice, 
      isSubmitting, 
      isProcessing,
      currentSelected: selected 
    });

    // Zapobiegaj wielokrotnym kliknięciom
    if (isSubmitting || isProcessing) {
      console.log('⚠️ SurveyChoice - Ignoruję kliknięcie (już przetwarzam)');
      return;
    }

    try {
      setIsProcessing(true);
      setSelected(choice);
      
      console.log('🔍 SurveyChoice - Aktualizuję formData:', { choice });
      
      // Sprawdź czy funkcje są dostępne
      if (typeof updateFormData !== 'function') {
        console.error('❌ updateFormData nie jest funkcją:', updateFormData);
        return;
      }

      // Aktualizuj dane formularza
      updateFormData('surveyChoice', choice);
      updateFormData('skipSurvey', choice === 'skip');
      
      console.log('🔍 SurveyChoice - Dane zaktualizowane, wywołuję onNext');

      // Sprawdź czy onNext jest funkcją
      if (typeof onNext !== 'function') {
        console.error('❌ onNext nie jest funkcją:', onNext);
        return;
      }

      // Małe opóźnienie żeby user zobaczył wybór
      setTimeout(() => {
        console.log('🔍 SurveyChoice - Wywołuję onNext()');
        onNext();
      }, 300);

    } catch (error) {
      console.error('❌ SurveyChoice - Błąd w handleSurveyChoice:', error);
      alert('Wystąpił błąd. Spróbuj ponownie.');
    } finally {
      // Reset processing po krótkiej chwili
      setTimeout(() => {
        setIsProcessing(false);
      }, 500);
    }
  };

  // DODANE: Obsługa klawiatury na przyciskach (Enter/Space)
  const onKeyActivate = (e, choice) => {
    console.log('🔍 SurveyChoice - Key event:', { key: e.key, choice });
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSurveyChoice(choice);
    }
  };

  // DODANE: Test kliknięcia
  const handleTestClick = (choice) => {
    console.log('🔍 SurveyChoice - Test click:', choice, {
      isSubmitting,
      isProcessing,
      event: 'onClick'
    });
    handleSurveyChoice(choice);
  };

  const baseBtn =
    'w-full rounded-full font-bold transition-all duration-300 py-6 text-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1DCD9F]/60 cursor-pointer';

  const isDisabled = isSubmitting || isProcessing;

  return (
    <div
      className={[
        'bg-[#0a0a0a]/95 rounded-3xl shadow-xl p-6 md:p-8 w-full',
        'flex flex-col border border-[#222222] shadow-[0_0_30px_10px_rgba(0,0,0,0.5)]',
        'min-h-[520px]',
      ].join(' ')}
    >
      <div className="flex flex-col flex-1">
        {/* DODANE: Status debugowania - tylko w development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-2 bg-blue-900/20 border border-blue-400/30 rounded text-xs text-blue-300">
            <div><strong>Selected:</strong> {selected || 'none'}</div>
            <div><strong>Submitting:</strong> {isSubmitting ? 'TAK' : 'NIE'}</div>
            <div><strong>Processing:</strong> {isProcessing ? 'TAK' : 'NIE'}</div>
            <div><strong>Disabled:</strong> {isDisabled ? 'TAK' : 'NIE'}</div>
          </div>
        )}

        {/* Loader overlay */}
        {(isSubmitting || isProcessing) && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-3xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1DCD9F] mx-auto mb-2"></div>
              <p className="text-white text-sm">Przetwarzanie...</p>
            </div>
          </div>
        )}

        {/* Zawartość wyśrodkowana pionowo */}
        <div className="flex flex-col gap-8 flex-1 justify-center">
          {/* Nagłówek */}
          <div className="text-center">
            <h2 className="text-white text-2xl font-bold">Jak chcesz stworzyć swój plan?</h2>
            <p className="text-white/90 text-lg">
              Wybierz sposób, który najlepiej odpowiada Twoim potrzebom
            </p>
          </div>

          {/* Opcje wyboru */}
          <div
            role="radiogroup"
            aria-label="Wybór sposobu tworzenia planu"
            className="flex flex-col gap-4"
          >
            {/* OPCJA 1: Wypełnij ankietę (zalecane) */}
            <button
              type="button"
              role="radio"
              aria-checked={selected === 'fill'}
              disabled={isDisabled}
              onClick={() => handleTestClick('fill')}
              onKeyDown={(e) => onKeyActivate(e, 'fill')}
              className={[
                baseBtn,
                'bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white relative',
                'hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] hover:brightness-110',
                isDisabled ? 'opacity-50 cursor-not-allowed' : '',
                selected === 'fill' ? 'ring-2 ring-[#1DCD9F]' : ''
              ].join(' ')}
              data-testid="survey-option"
            >
              {/* Badge "Zalecane" */}
              <span className="absolute -top-2 -right-2 bg-[#1DCD9F] text-[#0a0a0a] text-xs px-2 py-1 rounded-full font-bold">
                Zalecane
              </span>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">📝</span>
                  <div className="text-left">
                    <div className="font-bold text-lg">Wypełnij szczegółową ankietę</div>
                    <div className="text-sm opacity-90">
                      Odpowiedz na dodatkowe pytania o swoje preferencje treningowe
                    </div>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 ${
                  selected === 'fill' ? 'bg-white border-white' : 'border-gray-400'
                }`}>
                  {selected === 'fill' && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#0D7A61]"></div>
                    </div>
                  )}
                </div>
              </div>
            </button>

            {/* OPCJA 2: Przejdź do szybkiego kreatora */}
            <button
              type="button"
              role="radio"
              aria-checked={selected === 'skip'}
              disabled={isDisabled}
              onClick={() => handleTestClick('skip')}
              onKeyDown={(e) => onKeyActivate(e, 'skip')}
              className={[
                baseBtn,
                'bg-[#2D2D2D] text-white border border-gray-600',
                'hover:bg-[#3D3D3D] hover:border-gray-500',
                isDisabled ? 'opacity-50 cursor-not-allowed' : '',
                selected === 'skip' ? 'ring-2 ring-[#1DCD9F]' : ''
              ].join(' ')}
              data-testid="creator-option"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">⚡</span>
                  <div className="text-left">
                    <div className="font-bold text-lg">Przejdź do szybkiego kreatora</div>
                    <div className="text-sm opacity-90">
                      Stwórz plan na podstawie podstawowych informacji
                    </div>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 ${
                  selected === 'skip' ? 'bg-white border-white' : 'border-gray-400'
                }`}>
                  {selected === 'skip' && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#0D7A61]"></div>
                    </div>
                  )}
                </div>
              </div>
            </button>
          </div>

          {/* Dodatkowe informacje */}
          <div className="text-center text-sm text-gray-400">
            <p>💡 Możesz zawsze zmienić swoje preferencje później w ustawieniach profilu</p>
          </div>
        </div>

        {/* DODANE: Nawigacja na dole (na wypadek gdyby automat nie działał) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="flex gap-4 mt-auto pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onPrev}
              disabled={isDisabled}
              className="flex-1 py-3 rounded-full font-bold bg-transparent border border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white transition-all duration-300"
            >
              ← Wstecz
            </button>
            
            <button
              type="button"
              onClick={() => selected && handleSurveyChoice(selected)}
              disabled={!selected || isDisabled}
              className={[
                'flex-1 py-3 rounded-full font-bold transition-all duration-300',
                selected && !isDisabled
                  ? 'bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white'
                  : 'bg-gray-600 text-gray-300 cursor-not-allowed'
              ].join(' ')}
            >
              Dalej →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveyChoiceCard;
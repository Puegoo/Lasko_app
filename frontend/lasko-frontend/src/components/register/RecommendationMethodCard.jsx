// frontend/lasko-frontend/src/components/register/RecommendationMethodCard.jsx
import React, { useState } from 'react';

/* Lokalne ikonki SVG */
const ChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9,18 15,12 9,6" />
  </svg>
);
const Zap = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
  </svg>
);
const Users = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const Shuffle = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16,3 21,3 21,8" />
    <line x1="4" y1="20" x2="21" y2="3" />
    <polyline points="21,16 21,21 16,21" />
    <line x1="15" y1="15" x2="21" y2="21" />
    <line x1="4" y1="4" x2="9" y2="9" />
  </svg>
);
const Check = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20,6 9,17 4,12" />
  </svg>
);

/**
 * Karta wyboru metody rekomendacji (pionowy układ).
 * - Kafelek wypełnia dostępne miejsce: h-full + flex kolumnowo
 * - Środek przewijalny (lista opcji), stopka zawsze przyklejona na dole
 */
const RecommendationMethodCard = ({
  formData,
  updateFormData,
  onNext,
  onPrev,
  validationErrors = {},
  isSubmitting = false,
}) => {
  const [selectedMethod, setSelectedMethod] = useState(formData?.recommendationMethod || null);
  const [isLoading, setIsLoading] = useState(false);

  const methods = [
    {
      id: 'product',
      title: 'Na podstawie produktu',
      description: 'Rekomendacje oparte na charakterystyce i popularności planów treningowych.',
      icon: Zap,
      features: ['Najpopularniejsze plany', 'Sprawdzone kombinacje ćwiczeń', 'Optymalne dla standardowych celów'],
      tint: 'from-blue-500/15 to-blue-400/10',
      chip: 'bg-blue-500 text-white',
    },
    {
      id: 'user',
      title: 'Na podstawie klienta',
      description: 'Personalizowane rekomendacje bazujące na Twoim profilu i preferencjach.',
      icon: Users,
      features: ['Dostosowane do poziomu', 'Uwzględnia sprzęt', 'Personalizowany harmonogram'],
      tint: 'from-emerald-500/15 to-emerald-400/10',
      chip: 'bg-emerald-500 text-black',
    },
    {
      id: 'hybrid',
      title: 'Hybrydowo',
      description: 'Kombinacja obu metod dla najlepszych rekomendacji.',
      icon: Shuffle,
      features: ['Najlepsza dokładność', 'Balans popularności i personalizacji', 'Adaptacyjne uczenie się'],
      tint: 'from-purple-500/15 to-purple-400/10',
      chip: 'bg-purple-500 text-white',
    },
  ];

  const handleMethodSelect = (methodId) => {
    setSelectedMethod(methodId);
    updateFormData('recommendationMethod', methodId);
  };

  const onKeyActivate = (e, methodId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleMethodSelect(methodId);
    }
  };

  const handleNext = async () => {
    if (!selectedMethod || isSubmitting) return;
    setIsLoading(true);
    updateFormData('recommendationMethod', selectedMethod);

    // symulacja wywołania API
    await new Promise((r) => setTimeout(r, 800));

    const goal = formData?.goal;
    const level = formData?.level;
    const getRecommendedPlanName = () => {
      if (goal === 'masa' && level === 'początkujący') return 'Plan Full Body dla Początkujących – Masa';
      if (goal === 'siła') return 'Plan Siłowy 5x5';
      if (goal === 'redukcja') return 'Plan Redukcyjny High-Volume';
      return 'Plan Uniwersalny Full Body';
    };

    updateFormData('recommendedPlan', {
      id: 1,
      name: getRecommendedPlanName(),
      duration: '8 tygodni',
      frequency: '3 razy w tygodniu',
      match: '94%',
      description: 'Kompleksowy plan dostosowany do preferencji i poziomu zaawansowania.',
      features: ['Wszystkie grupy mięśniowe', 'Progresywne obciążenie', 'Instrukcje wideo'],
      method: selectedMethod,
    });

    setIsLoading(false);
    onNext();
  };

  if (isLoading) {
    return (
      <div className="w-full h-full max-w-[820px] mx-auto bg-[#0a0a0a]/95 rounded-3xl p-8 border border-[#222222] shadow-[0_0_30px_10px_rgba(0,0,0,0.5)] overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#1DCD9F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Dopasowuję rekomendacje…</h2>
          <p className="text-white/80">Analiza odpowiedzi i wybór najlepszego planu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full max-w-[820px] mx-auto bg-[#0a0a0a]/95 rounded-3xl border border-[#222222] shadow-[0_0_30px_10px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
      {/* Nagłówek */}
      <div className="px-6 md:px-8 pt-6 pb-2 flex-none">
        <div className="text-center">
          <h2 className="text-white text-2xl font-bold">Wybierz metodę rekomendacji</h2>
          <p className="text-white/80 text-sm">
            Jak chcesz, żeby Lasko dopasował dla Ciebie idealny plan treningowy?
          </p>
        </div>
      </div>

      {/* Lista opcji — PIONOWO, przewijalna */}
      <div
        role="radiogroup"
        aria-label="Wybór metody rekomendacji"
        className="flex-1 min-h-0 overflow-y-auto px-6 md:px-8 pb-4 space-y-4"
      >
        {methods.map((m) => {
          const Icon = m.icon;
          const isActive = selectedMethod === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              disabled={isSubmitting}
              onClick={() => handleMethodSelect(m.id)}
              onKeyDown={(e) => onKeyActivate(e, m.id)}
              className={[
                'w-full text-left relative rounded-2xl p-4 transition-all duration-300 border block',
                'bg-[#1D1D1D] border-[#2c2c2c]',
                isActive ? 'ring-2 ring-[#1DCD9F] border-[#1DCD9F]' : 'hover:border-[#1DCD9F]/50 hover:bg-[#232323]',
                isSubmitting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1DCD9F]/60',
                'overflow-hidden',
              ].join(' ')}
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${m.tint} ${isActive ? 'opacity-100' : 'opacity-0'} transition-opacity`} />
              {isActive && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-[#1DCD9F] rounded-full flex items-center justify-center text-black">
                  <Check />
                </div>
              )}

              <div className="relative flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#111] grid place-items-center text-white/90">
                  <Icon />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-bold text-lg">{m.title}</h3>
                    <span className={`hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full ${m.chip}`}>opcja</span>
                  </div>
                  <p className="text-white/80 text-sm mt-0.5">{m.description}</p>
                  <ul className="mt-2 space-y-1">
                    {m.features.map((f, i) => (
                      <li key={i} className="flex items-center text-xs text-white/70">
                        <span className="w-1.5 h-1.5 bg-[#1DCD9F] rounded-full mr-2" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Walidacja (poza scroll) */}
      {validationErrors?.recommendationMethod && (
        <div className="px-6 md:px-8 flex-none">
          <p className="text-red-400 text-sm mb-2 text-center">{validationErrors.recommendationMethod}</p>
        </div>
      )}

      {/* Stopka z CTA — zawsze widoczna */}
      <div className="px-6 md:px-8 pb-6 pt-4 border-t border-[#2a2a2a] bg-[#0a0a0a]/95 flex-none">
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={onPrev}
            disabled={isSubmitting}
            className="bg-[#1D1D1D] hover:bg-[#292929] text-white font-bold py-4 rounded-full transition-all duration-300 disabled:opacity-60"
          >
            Wstecz
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!selectedMethod || isSubmitting}
            className={[
              'py-4 rounded-full font-bold transition-all duration-300 flex items-center justify-center gap-2',
              selectedMethod && !isSubmitting
                ? 'bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] hover:brightness-110'
                : 'bg-gray-600 text-gray-300 cursor-not-allowed',
            ].join(' ')}
            aria-busy={isSubmitting ? 'true' : 'false'}
          >
            Dopasuj
            <ChevronRight />
          </button>
        </div>

        <p className="text-center mt-3 text-xs text-white/40">
          Krok 9 z 11 • Metodę możesz zmienić później w ustawieniach
        </p>
      </div>
    </div>
  );
};

export default RecommendationMethodCard;
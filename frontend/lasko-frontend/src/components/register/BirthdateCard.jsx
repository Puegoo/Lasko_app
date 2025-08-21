// frontend/lasko-frontend/src/components/register/BirthdateCard.jsx
import React, { useMemo, useState } from 'react';

/**
 * Karta z datą urodzenia (ciemny motyw, min. wysokość, zawartość wyśrodkowana pionowo).
 * - Walidacja: data wymagana, nie z przyszłości, min. wiek 13 lat
 * - Etykieta "Data urodzenia" nie koliduje z natywnym formatem (ukryta do focusu/wartości)
 * - Spójne stany błędów i dostępność (ARIA)
 */
const BirthdateCard = ({ formData, updateFormData, onNext, onPrev, isSubmitting = false }) => {
  const [focused, setFocused] = useState({ birthDate: false });

  // Minimalny wiek (lata)
  const MIN_AGE = 13;

  // Dzisiejsza data w ISO (YYYY-MM-DD)
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Oblicz wiek na podstawie daty urodzenia (ISO)
  const getAge = (isoDate) => {
    if (!isoDate) return null;
    const today = new Date();
    const dob = new Date(isoDate);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  };

  // Stany pochodne walidacji
  const birthDate = formData?.birthDate || '';
  const hasValue = Boolean(birthDate);
  const isParsable = hasValue && !Number.isNaN(Date.parse(birthDate));
  const notInFuture = isParsable ? birthDate <= todayIso : false;
  const age = isParsable ? getAge(birthDate) : null;
  const ageOk = typeof age === 'number' ? age >= MIN_AGE : false;
  const isFormValid = hasValue && isParsable && notInFuture && ageOk;

  // Aktualizacja modelu formularza
  const handleChange = (e) => updateFormData(e.target.name, e.target.value);

  // Pływająca etykieta (widoczna dopiero przy focusie lub gdy jest wartość)
  const handleFocus = (field) => setFocused((s) => ({ ...s, [field]: true }));
  const handleBlur = (field) => {
    if (!formData?.[field]) setFocused((s) => ({ ...s, [field]: false }));
  };
  const showLabel = focused.birthDate || !!birthDate;

  // Zatwierdzenie
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;
    onNext();
  };

  const birthHasError = hasValue && (!isParsable || !notInFuture || !ageOk);

  return (
    <div
      className={[
        'bg-[#0a0a0a]/95 rounded-3xl shadow-xl p-6 md:p-8 w-full',
        'flex flex-col border border-[#222222] shadow-[0_0_30px_10px_rgba(0,0,0,0.5)]',
        'min-h-[520px]',
      ].join(' ')}
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        {/* Zawartość wyśrodkowana pionowo */}
        <div className="flex flex-col gap-6 flex-1 justify-center">
          {/* Nagłówek */}
          <div className="text-center">
            <h2 className="text-white text-2xl font-bold">Podaj datę urodzenia</h2>
            <p className="text-white/90 text-lg">Pomoże nam to lepiej dostosować treningi</p>
          </div>

          {/* Pole: Data urodzenia */}
          <div className="relative mt-2">
            <input
              type="date"
              name="birthDate"
              id="birthDate"
              value={birthDate}
              onChange={handleChange}
              onFocus={() => handleFocus('birthDate')}
              onBlur={() => handleBlur('birthDate')}
              max={todayIso}
              className={[
                'w-full rounded-full py-4 px-5 text-lg outline-none transition-all duration-200',
                'bg-[#1D1D1D] text-white border',
                birthHasError
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500/40'
                  : 'border-transparent focus:ring-2 focus:ring-[#1DCD9F]/40',
              ].join(' ')}
              required
              disabled={isSubmitting}
              autoComplete="bday"
              aria-label="Data urodzenia"
              aria-invalid={birthHasError ? 'true' : 'false'}
              aria-describedby="birth-error birth-help"
            />

            {/* Etykieta: ukryta dopóki brak focusa i wartości (żeby nie nachodziła na natywny format) */}
            <label
              htmlFor="birthDate"
              className={[
                'absolute left-5 pointer-events-none transition-all duration-200 text-gray-400',
                showLabel ? 'top-1 text-xs opacity-100' : 'opacity-0',
              ].join(' ')}
            >
              Data urodzenia
            </label>

            {/* Komunikaty walidacyjne / pomocnicze */}
            <div className="mt-2 ml-2 space-y-1 text-sm break-words" aria-live="polite">
              {!isParsable && hasValue && (
                <p id="birth-error" className="text-red-400">Podaj poprawną datę.</p>
              )}
              {isParsable && !notInFuture && (
                <p id="birth-error" className="text-red-400">Data nie może być z przyszłości.</p>
              )}
              {isParsable && notInFuture && !ageOk && (
                <p id="birth-error" className="text-red-400">
                  Musisz mieć co najmniej {MIN_AGE} lat.
                </p>
              )}
              {isFormValid && (
                <p id="birth-help" className="text-emerald-400">✓ Świetnie, możemy iść dalej.</p>
              )}
            </div>
          </div>
        </div>

        {/* Nawigacja: przyciski przy dole kafelka */}
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
          >
            {isSubmitting ? 'Ładowanie…' : 'Dalej'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BirthdateCard;
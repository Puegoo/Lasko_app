import React, { useMemo, useState, useId } from 'react';

const BirthdateCard = ({
  formData,
  updateFormData,
  validationErrors = {},
  onNext,
  onPrev,
  isSubmitting = false,
}) => {
  const birthId = useId();
  const [focused, setFocused] = useState({ birthDate: false });

  const MIN_AGE = 16; // wymagane: użytkownik musi mieć > 16 lat

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
  const isFormValid = hasValue && isParsable && notInFuture && ageOk && !isSubmitting;

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
    if (!isFormValid) return;
    onNext();
  };

  const birthHasError = hasValue && (!isParsable || !notInFuture || !ageOk);

  return (
    <div className="bg-[#0b0b0b]/95 rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] p-6 md:p-8 w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-white text-2xl font-black">Podaj datę urodzenia</h2>
          <p className="text-gray-300 mt-1">Pomoże nam to lepiej dostosować treningi</p>
        </div>

        {/* Pole: Data urodzenia */}
        <div className="relative">
          <input
            type="date"
            name="birthDate"
            id={birthId}
            value={birthDate}
            onChange={handleChange}
            onFocus={() => handleFocus('birthDate')}
            onBlur={() => handleBlur('birthDate')}
            max={todayIso}
            className={[
              'peer w-full rounded-2xl py-4 px-5 text-base md:text-lg outline-none transition-all',
              'bg-[#131313] text-white border',
              birthHasError || validationErrors.date_of_birth
                ? 'border-red-500 focus:ring-2 focus:ring-red-500/30'
                : 'border-white/10 focus:ring-2 focus:ring-emerald-400/30',
            ].join(' ')}
            required
            disabled={isSubmitting}
            autoComplete="bday"
            aria-invalid={birthHasError || validationErrors.date_of_birth ? 'true' : 'false'}
            aria-describedby={`${birthId}-error ${birthId}-help`}
            placeholder=" "
          />

          {/* Etykieta: ukryta dopóki brak focusa i wartości (by nie kolidować z natywnym UI) */}
          <label
            htmlFor={birthId}
            className={[
              'pointer-events-none absolute left-5 text-gray-400 transition-all',
              showLabel ? 'top-1 text-xs' : 'opacity-0',
            ].join(' ')}
          >
            Data urodzenia
          </label>

          {/* Komunikaty walidacyjne / pomocnicze */}
          <div className="mt-2 ml-1 space-y-1 text-sm" aria-live="polite">
            {/* Błąd z backendu */}
            {validationErrors.date_of_birth && (
              <p id={`${birthId}-error`} className="text-red-400">
                {validationErrors.date_of_birth}
              </p>
            )}

            {/* Frontendowe błędy (gdy brak backendowych) */}
            {!validationErrors.date_of_birth && hasValue && !isParsable && (
              <p id={`${birthId}-error`} className="text-red-400">
                Nieprawidłowy format daty.
              </p>
            )}
            {!validationErrors.date_of_birth && isParsable && !notInFuture && (
              <p id={`${birthId}-error`} className="text-red-400">
                Data nie może być z przyszłości.
              </p>
            )}
            {!validationErrors.date_of_birth && isParsable && notInFuture && !ageOk && (
              <p id={`${birthId}-error`} className="text-red-400">
                Musisz mieć co najmniej {MIN_AGE} lat{typeof age === 'number' ? ` (masz ${age})` : ''}.
              </p>
            )}

            {/* OK */}
            {!validationErrors.date_of_birth && isFormValid && (
              <p id={`${birthId}-help`} className="text-emerald-400">
                ✓ Wiek: {age} lat
              </p>
            )}

            {/* Domyślny komunikat */}
            {!hasValue && !validationErrors.date_of_birth && (
              <p id={`${birthId}-help`} className="text-gray-400">
                Wybierz datę urodzenia (minimum {MIN_AGE} lat).
              </p>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="grid grid-cols-2 gap-4 pt-2">
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
            disabled={!isFormValid}
            className={[
              'w-full rounded-full py-4 font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60',
              isFormValid
                ? 'bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white hover:brightness-110 hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] active:scale-[0.99]'
                : 'cursor-not-allowed bg-white/10 text-gray-400',
            ].join(' ')}
            aria-busy={isSubmitting ? 'true' : 'false'}
          >
            {isSubmitting ? 'Ładowanie…' : 'Dalej'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BirthdateCard;
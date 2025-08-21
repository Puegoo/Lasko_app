// frontend/lasko-frontend/src/components/register/UserNameCard.jsx
import React, { useEffect, useRef, useState } from 'react';

/**
 * Karta z nazwą użytkownika:
 * - Prefiks "@" wewnątrz pola (flex), klikalny → fokusuje input
 * - Pływająca etykieta bez tła, taki sam ruch jak w NameCard
 * - Walidacja: [a-zA-Z0-9_] 3–20 znaków (inline, ARIA)
 * - Minimalna wysokość, treść wyśrodkowana pionowo, CTA przy dole
 */
const UserNameCard = ({
  formData,
  updateFormData,
  onNext,
  onPrev,
  isSubmitting = false,
}) => {
  // Stan etykiety + kontrolowana wartość (zawsze bez '@')
  const [focused, setFocused] = useState({ username: false });
  const [usernameValue, setUsernameValue] = useState('');
  const inputRef = useRef(null);

  // Reguła walidacji
  const USERNAME_RGX = /^[a-zA-Z0-9_]{3,20}$/;

  // Synchronizacja z formData (usunąć ewentualne '@')
  useEffect(() => {
    const clean = (formData?.username || '').replace(/@/g, '');
    setUsernameValue(clean);
  }, [formData?.username]);

  // Zapis zmian (bez '@')
  const handleChange = (e) => {
    const cleanValue = e.target.value.replace(/@/g, '');
    setUsernameValue(cleanValue);
    updateFormData('username', cleanValue);
  };

  // Pływająca etykieta
  const handleFocus = () => setFocused((s) => ({ ...s, username: true }));
  const handleBlur = () => {
    if (!usernameValue) setFocused((s) => ({ ...s, username: false }));
  };

  // Klik na "@": fokus na input
  const focusInput = () => inputRef.current?.focus();

  // Walidacja pochodna
  const hasValue = (usernameValue || '').trim().length > 0;
  const isFormatValid = USERNAME_RGX.test((usernameValue || '').trim());
  const isFormValid = hasValue && isFormatValid;
  const usernameHasError = hasValue && !isFormatValid;

  // Wyślij krok
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;
    onNext();
  };

  return (
    <div className="bg-[#0a0a0a]/95 rounded-3xl shadow-xl p-6 md:p-8 w-full flex flex-col border border-[#222222] shadow-[0_0_30px_10px_rgba(0,0,0,0.5)] min-h-[520px]">
      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        {/* Treść wyśrodkowana pionowo */}
        <div className="flex flex-col gap-6 flex-1 justify-center">
          {/* Nagłówek */}
          <div className="text-center">
            <h2 className="text-white text-2xl font-bold">Wybierz nazwę użytkownika</h2>
            <p className="text-white/90 text-lg">Będzie widoczna dla innych użytkowników</p>
          </div>

          {/* Pole: nazwa użytkownika */}
          <div className="relative mt-2">
            {/* Wrapper pola jako flex, żeby "@" był częścią pola */}
            <div
              className={[
                'w-full rounded-full py-4 px-5 text-lg transition-all duration-200',
                'bg-[#1D1D1D] text-white border flex items-center',
                usernameHasError
                  ? 'border-red-500 ring-0 focus-within:ring-2 focus-within:ring-red-500/40'
                  : 'border-transparent ring-0 focus-within:ring-2 focus-within:ring-[#1DCD9F]/40',
              ].join(' ')}
            >
              {/* Prefiks @ – klikalny, nie znika */}
              <button
                type="button"
                onClick={focusInput}
                className="text-gray-400 select-none cursor-text mr-1"
                aria-hidden="true"
                tabIndex={-1}
                title="@"
              >
                @
              </button>

              {/* Input bez placeholdera */}
              <input
                type="text"
                id="username"
                name="username"
                ref={inputRef}
                value={usernameValue}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className="bg-transparent outline-none flex-1 text-white"
                autoComplete="username"
                maxLength={20}
                minLength={3}
                aria-invalid={usernameHasError ? 'true' : 'false'}
                aria-describedby="username-help username-error"
              />
            </div>

            {/* Etykieta pływająca – jak w NameCard (bez tła) */}
            <label
              htmlFor="username"
              className={[
                'absolute pointer-events-none transition-all duration-200 text-gray-400',
                focused.username || usernameValue
                  ? 'text-xs top-1 left-5'
                  : 'text-lg top-4 left-12', // odsunięte od "@"
              ].join(' ')}
            >
              Nazwa użytkownika
            </label>

            {/* Komunikaty walidacyjne / pomocnicze */}
            <div className="mt-2 ml-2 space-y-1 text-sm break-words" aria-live="polite">
              {usernameHasError && (
                <p id="username-error" className="text-red-400">
                  Dozwolone: litery, cyfry, „_”, długość 3–20.
                </p>
              )}
              {!usernameHasError && hasValue && (
                <p id="username-help" className="text-emerald-400">
                  ✓ Wygląda dobrze: @{usernameValue}
                </p>
              )}
              {!hasValue && (
                <p id="username-help" className="text-gray-400">
                  Użyj liter, cyfr lub „_”, 3–20 znaków.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Nawigacja */}
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

export default UserNameCard;
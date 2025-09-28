import React, { useEffect, useRef, useState, useId } from 'react';
import { checkUsernameAvailability } from '../../services/validationService';

const UsernameCard = ({
  formData,
  updateFormData,
  validationErrors = {},
  onNext,
  onPrev,
  isSubmitting = false,
}) => {
  const usernameId = useId();

  // Stan etykiety + kontrolowana wartość (zawsze bez '@')
  const [focused, setFocused] = useState({ username: false });
  const [usernameValue, setUsernameValue] = useState('');
  const [usernameStatus, setUsernameStatus] = useState('idle'); // idle | checking | free | taken | error
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
  const usernameHasError = hasValue && !isFormatValid;

  // Async dostępność username
  useEffect(() => {
    if (!hasValue || !isFormatValid) {
      setUsernameStatus('idle');
      return;
    }
    setUsernameStatus('checking');
    const ac = new AbortController();
    const t = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailability(usernameValue.trim(), ac.signal);
        setUsernameStatus(available ? 'free' : 'taken');
      } catch {
        setUsernameStatus('error'); // nie blokuj przy błędzie sieci
      }
    }, 400);

    return () => { clearTimeout(t); ac.abort(); };
  }, [usernameValue, hasValue, isFormatValid]);

  const isChecking = usernameStatus === 'checking';
  const isTaken = usernameStatus === 'taken';
  const isFormValid = hasValue && isFormatValid && !isChecking && !isTaken && !isSubmitting;

  // Wyślij krok
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    onNext();
  };

  return (
    <div className="bg-[#0b0b0b]/95 rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] p-6 md:p-8 w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-white text-2xl font-black">Wybierz nazwę użytkownika</h2>
          <p className="text-gray-300 mt-1">Będzie widoczna dla innych użytkowników</p>
        </div>

        {/* Pole: nazwa użytkownika */}
        <div className="relative">
          <div
            className={[
              'w-full rounded-2xl py-4 px-5 text-base md:text-lg transition-all',
              'bg-[#131313] text-white border flex items-center',
              (usernameHasError || validationErrors.username || isTaken)
                ? 'border-red-500 focus-within:ring-2 focus-within:ring-red-500/30'
                : 'border-white/10 focus-within:ring-2 focus-within:ring-emerald-400/30',
            ].join(' ')}
          >
            <button
              type="button"
              onClick={focusInput}
              className="text-gray-400 select-none cursor-text mr-1 shrink-0"
              aria-hidden="true"
              tabIndex={-1}
              title="@"
            >
              @
            </button>

            <input
              type="text"
              id={usernameId}
              name="username"
              ref={inputRef}
              value={usernameValue}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className="bg-transparent outline-none flex-1 text-white min-w-0"
              autoComplete="username"
              maxLength={20}
              minLength={3}
              disabled={isSubmitting}
              aria-invalid={(usernameHasError || validationErrors.username || isTaken) ? 'true' : 'false'}
              aria-describedby={`${usernameId}-help ${usernameId}-error`}
            />
          </div>

          {/* Etykieta pływająca – odsunięta od „@” */}
          <label
            htmlFor={usernameId}
            className={[
              'absolute pointer-events-none text-gray-400 transition-all',
              (focused.username || usernameValue)
                ? 'text-xs top-1 left-5'
                : 'text-base md:text-lg top-4 left-12',
            ].join(' ')}
          >
            Nazwa użytkownika
          </label>

          {/* Komunikaty walidacyjne / pomocnicze */}
          <div className="mt-2 ml-1 space-y-1 text-sm break-words" aria-live="polite">
            {validationErrors.username && (
              <p id={`${usernameId}-error`} className="text-red-400">
                {validationErrors.username}
              </p>
            )}

            {!validationErrors.username && usernameHasError && (
              <p id={`${usernameId}-error`} className="text-red-400">
                Dozwolone: litery, cyfry i „_”, długość 3–20.
              </p>
            )}

            {!validationErrors.username && isFormatValid && isChecking && (
              <p className="text-gray-400">Sprawdzanie dostępności…</p>
            )}
            {!validationErrors.username && isFormatValid && isTaken && (
              <p className="text-red-400">Ta nazwa użytkownika jest już zajęta.</p>
            )}
            {!validationErrors.username && isFormatValid && usernameStatus === 'free' && hasValue && (
              <p id={`${usernameId}-help`} className="text-emerald-400">
                ✓ Wygląda dobrze: @{usernameValue}
              </p>
            )}
            {!validationErrors.username && usernameStatus === 'error' && (
              <p className="text-amber-300">Nie udało się sprawdzić dostępności. Spróbuj później.</p>
            )}

            {!hasValue && !validationErrors.username && (
              <p id={`${usernameId}-help`} className="text-gray-400">
                Użyj liter, cyfr lub „_”, 3–20 znaków.
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

export default UsernameCard;
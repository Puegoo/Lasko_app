// frontend/lasko-frontend/src/components/register/AccountCard.jsx
import React, { useMemo, useState } from 'react';

/**
 * Karta tworzenia konta.
 * - Spójne walidacje (zgodne z backendem)
 * - Pływające etykiety
 * - Wyraźne stany błędów/sukcesu
 * - Ulepszona dostępność (aria-*), focus ring, klawiszologia
 * - Przełącznik widoczności hasła
 */
const AccountCard = ({
  formData,
  updateFormData,
  validationErrors = {},
  onNext,
  isSubmitting,
}) => {
  // Lokalny stan do animacji etykiet oraz widoczności hasła
  const [focused, setFocused] = useState({ email: false, password: false });
  const [revealPassword, setRevealPassword] = useState(false);

  // Walidacje spójne z backendem
  const validateEmail = (email) => {
    if (!email) return false;
    const emailPattern =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email.trim());
  };

  const validatePassword = (password) => {
    const errors = [];
    if (!password || password.length < 8) errors.push('co najmniej 8 znaków');
    if (!/\d/.test(password || '')) errors.push('co najmniej jedną cyfrę');
    if (!/[a-zA-Z]/.test(password || ''))
      errors.push('co najmniej jedną literę');
    return errors;
  };

  // Normalizacja i aktualizacja formularza
  const handleChange = (e) => {
    const { name, value } = e.target;
    const cleanValue = name === 'email' ? value.trim() : value;
    updateFormData(name, cleanValue);
  };

  const handleFocus = (field) => {
    setFocused((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field) => {
    if (!formData[field]) {
      setFocused((prev) => ({ ...prev, [field]: false }));
    }
  };

  // Obliczenia pochodne – tylko raz na render
  const emailValid = useMemo(
    () => validateEmail(formData.email),
    [formData.email]
  );
  const passwordChecks = useMemo(
    () => (formData.password ? validatePassword(formData.password) : []),
    [formData.password]
  );
  const passwordValid = useMemo(
    () => formData.password && passwordChecks.length === 0,
    [formData.password, passwordChecks]
  );
  const formValid = emailValid && passwordValid;

  // Wysyłka formularza
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formValid || isSubmitting) return;
    onNext();
  };

  return (
    <div className="relative bg-[#1A1A1A] rounded-3xl p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.45)] h-full flex flex-col border border-[#2b2b2b]">
      {/* Nagłówek sekcji */}
      <div className="text-center mb-6">
        <h2 className="text-white text-2xl md:text-3xl font-extrabold tracking-tight">
          Stwórz konto
        </h2>
        <p className="text-gray-400 text-sm md:text-base mt-1">
          Rozpocznij swoją podróż fitness z Lasko
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col h-full gap-4">
        {/* Pole: Email */}
        <div className="relative">
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            onFocus={() => handleFocus('email')}
            onBlur={() => handleBlur('email')}
            className={[
              'peer w-full rounded-2xl py-4 pl-5 pr-12 text-base md:text-lg outline-none',
              'bg-[#121212] text-white border transition-all duration-200',
              (validationErrors.email ||
                (!emailValid && formData.email)) &&
              'border-red-500 focus:ring-2 focus:ring-red-500/40',
              !validationErrors.email &&
                (emailValid || !formData.email) &&
                'border-[#2b2b2b] focus:ring-2 focus:ring-[#1DCD9F]/40',
              'focus:border-transparent',
            ].join(' ')}
            required
            disabled={isSubmitting}
            autoComplete="email"
            aria-invalid={
              Boolean(validationErrors.email || (!emailValid && formData.email))
                ? 'true'
                : 'false'
            }
            aria-describedby="email-help email-error"
            placeholder=" "
          />
          <label
            htmlFor="email"
            className={[
              'absolute left-5',
              'pointer-events-none transition-all duration-200',
              (focused.email || formData.email)
                ? 'top-2 text-xs text-gray-400'
                : 'top-4 text-base text-gray-400',
            ].join(' ')}
          >
            Email
          </label>

          {/* Ikonka statusu */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {formData.email && emailValid && !validationErrors.email && (
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 text-sm"
                aria-hidden="true"
                title="Email poprawny"
              >
                ✓
              </span>
            )}
            {formData.email && !emailValid && (
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 text-red-300 text-sm"
                aria-hidden="true"
                title="Błąd w adresie email"
              >
                !
              </span>
            )}
          </div>

          {/* Komunikaty walidacyjne (ARIA-live) */}
          <div className="mt-2 ml-1 space-y-1 text-sm" aria-live="polite">
            {validationErrors.email && (
              <p id="email-error" className="text-red-400">
                {validationErrors.email}
              </p>
            )}
            {!validationErrors.email &&
              formData.email &&
              !emailValid && (
                <p id="email-help" className="text-red-400">
                  Podaj poprawny adres e‑mail.
                </p>
              )}
            {formData.email && emailValid && !validationErrors.email && (
              <p className="text-emerald-400">Email wygląda poprawnie.</p>
            )}
          </div>
        </div>

        {/* Pole: Hasło */}
        <div className="relative">
          <input
            type={revealPassword ? 'text' : 'password'}
            name="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
            onFocus={() => handleFocus('password')}
            onBlur={() => handleBlur('password')}
            className={[
              'peer w-full rounded-2xl py-4 pl-5 pr-12 text-base md:text-lg outline-none',
              'bg-[#121212] text-white border transition-all duration-200',
              (validationErrors.password || passwordChecks.length > 0) &&
                'border-red-500 focus:ring-2 focus:ring-red-500/40',
              !validationErrors.password &&
                passwordChecks.length === 0 &&
                'border-[#2b2b2b] focus:ring-2 focus:ring-[#1DCD9F]/40',
              'focus:border-transparent',
            ].join(' ')}
            required
            disabled={isSubmitting}
            autoComplete="new-password"
            aria-invalid={
              Boolean(validationErrors.password || passwordChecks.length > 0)
                ? 'true'
                : 'false'
            }
            aria-describedby="password-error password-help"
            placeholder=" "
          />
          <label
            htmlFor="password"
            className={[
              'absolute left-5',
              'pointer-events-none transition-all duration-200',
              (focused.password || formData.password)
                ? 'top-2 text-xs text-gray-400'
                : 'top-4 text-base text-gray-400',
            ].join(' ')}
          >
            Hasło
          </label>

          {/* Przełącznik widoczności hasła */}
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 select-none rounded-xl px-3 py-1 text-xs md:text-sm border border-[#2b2b2b] text-gray-300 hover:text-white hover:border-[#3a3a3a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1DCD9F]/50"
            onClick={() => setRevealPassword((s) => !s)}
            aria-label={revealPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
            disabled={isSubmitting}
          >
            {revealPassword ? 'Ukryj' : 'Pokaż'}
          </button>

          {/* Komunikaty walidacyjne (backend / confirm) */}
          <div className="mt-2 ml-1 space-y-1 text-sm" aria-live="polite">
            {validationErrors.password && (
              <p id="password-error" className="text-red-400">
                {validationErrors.password}
              </p>
            )}
            {validationErrors.password_confirm && (
              <p className="text-red-400">{validationErrors.password_confirm}</p>
            )}
          </div>
        </div>

        {/* Wymagania hasła – kompaktowy checklist */}
        {formData.password && (
          <div className="rounded-2xl border border-[#2b2b2b] bg-[#121212] p-4">
            <p className="text-gray-300 text-sm mb-2">
              Hasło musi zawierać:
            </p>
            <ul className="space-y-1 text-sm">
              <li
                className={
                  (formData.password?.length ?? 0) >= 8
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }
              >
                {(formData.password?.length ?? 0) >= 8 ? '✓' : '✗'} Co najmniej
                8 znaków
              </li>
              <li
                className={
                  /\d/.test(formData.password) ? 'text-emerald-400' : 'text-red-400'
                }
              >
                {/\d/.test(formData.password) ? '✓' : '✗'} Co najmniej jedną
                cyfrę
              </li>
              <li
                className={
                  /[a-zA-Z]/.test(formData.password)
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }
              >
                {/[a-zA-Z]/.test(formData.password) ? '✓' : '✗'} Co najmniej
                jedną literę
              </li>
            </ul>
          </div>
        )}

        {/* Komunikat dot. nazwy użytkownika (z backendu) */}
        {validationErrors.username && (
          <div className="rounded-2xl p-4 border border-red-500/70 bg-red-900/20">
            <p className="text-red-300 text-sm">
              <strong>Problem z nazwą użytkownika:</strong>{' '}
              {validationErrors.username}
            </p>
            <p className="text-red-200/80 text-xs mt-1">
              Nazwa użytkownika jest generowana automatycznie z Twojego imienia.
            </p>
          </div>
        )}

        {/* Zgody (skrót) */}
        <p className="text-center text-xs text-gray-400">
          Kontynuując, akceptujesz{' '}
          <a href="#" className="text-[#1DCD9F] hover:underline">
            Warunki
          </a>{' '}
          i{' '}
          <a href="#" className="text-[#1DCD9F] hover:underline">
            Politykę prywatności
          </a>
          .
        </p>

        {/* CTA */}
        <div className="mt-auto pt-4 border-t border-[#2b2b2b]">
          <button
            type="submit"
            disabled={!formValid || isSubmitting}
            className={[
              'w-full py-3 px-8 font-bold rounded-full transition-all duration-300',
              formValid && !isSubmitting
                ? 'bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white hover:shadow-[0_0_28px_rgba(29,205,159,0.45)] hover:brightness-110 hover:-translate-y-0.5'
                : 'bg-[#2b2b2b] text-gray-400 cursor-not-allowed',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1DCD9F]/60',
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

export default AccountCard;

// frontend/lasko-frontend/src/components/register/AccountCard.jsx
import React, { useMemo, useState } from 'react';

/**
 * Karta tworzenia konta – wysokość dopasowana do zawartości, bez paska progresu.
 * - Ciemny kontener, centralny nagłówek (spójne z NameCard)
 * - Pływające etykiety, czytelne komunikaty błędów
 * - Walidacja zgodna z backendem (regex email, zasady hasła)
 * - Brak sztywnej wysokości; CTA pozostaje w kafelku
 */
const AccountCard = ({
  formData,
  updateFormData,
  validationErrors = {},
  onNext,
  isSubmitting,
}) => {
  // Stan etykiet dla animacji
  const [focused, setFocused] = useState({ email: false, password: false });

  // Walidacje spójne z backendem
  const validateEmail = (email) => {
    if (!email) return false;
    const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return pattern.test(email.trim());
  };

  const validatePassword = (password) => {
    const errors = [];
    if (!password || password.length < 8) errors.push('co najmniej 8 znaków');
    if (!/\d/.test(password || '')) errors.push('co najmniej jedną cyfrę');
    if (!/[a-zA-Z]/.test(password || '')) errors.push('co najmniej jedną literę');
    return errors;
  };

  // Aktualizacja wartości (email bez spacji brzegowych)
  const handleChange = (e) => {
    const { name, value } = e.target;
    updateFormData(name, name === 'email' ? value.trim() : value);
  };

  // Pływające etykiety
  const handleFocus = (field) => setFocused((s) => ({ ...s, [field]: true }));
  const handleBlur = (field) => {
    if (!formData[field]) setFocused((s) => ({ ...s, [field]: false }));
  };

  // Stany pochodne walidacji
  const emailValid = useMemo(() => validateEmail(formData.email), [formData.email]);
  const passwordErrors = useMemo(
    () => (formData.password ? validatePassword(formData.password) : []),
    [formData.password]
  );
  const passwordValid = Boolean(formData.password) && passwordErrors.length === 0;
  const formValid = emailValid && passwordValid;

  // Zatwierdzanie kroku
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formValid || isSubmitting) return;
    onNext();
  };

  return (
    <div className="bg-[#0a0a0a]/95 rounded-3xl shadow-xl p-6 md:p-8 w-full flex flex-col border border-[#222222] shadow-[0_0_30px_10px_rgba(0,0,0,0.5)]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-grow">
        {/* Nagłówek sekcji */}
        <div className="text-center">
          <h2 className="text-white text-2xl font-bold">Stwórz konto</h2>
          <p className="text-white/90 text-lg">Rozpocznij swoją podróż fitness</p>
        </div>

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
              'w-full rounded-full py-4 px-5 text-lg outline-none transition-all duration-200',
              'bg-[#1D1D1D] text-white border',
              validationErrors.email || (!emailValid && formData.email)
                ? 'border-red-500 focus:ring-2 focus:ring-red-500/40'
                : 'border-transparent focus:ring-2 focus:ring-[#1DCD9F]/40',
            ].join(' ')}
            required
            disabled={isSubmitting}
            autoComplete="email"
            aria-invalid={Boolean(validationErrors.email || (!emailValid && formData.email))}
            aria-describedby="email-error email-help"
            placeholder=" "
          />
          <label
            htmlFor="email"
            className={[
              'absolute left-5 pointer-events-none transition-all duration-200 text-gray-400',
              focused.email || formData.email ? 'top-1 text-xs' : 'top-4 text-lg',
            ].join(' ')}
          >
            Email
          </label>

          {/* Komunikaty email */}
          <div className="mt-2 ml-2 text-sm space-y-1 break-words" aria-live="polite">
            {validationErrors.email && (
              <p id="email-error" className="text-red-400">{validationErrors.email}</p>
            )}
            {!validationErrors.email && formData.email && !emailValid && (
              <p id="email-help" className="text-red-400">Podaj poprawny adres e-mail.</p>
            )}
            {formData.email && emailValid && !validationErrors.email && (
              <p className="text-emerald-400">Email wygląda poprawnie.</p>
            )}
          </div>
        </div>

        {/* Pole: Hasło */}
        <div className="relative">
          <input
            type="password"
            name="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
            onFocus={() => handleFocus('password')}
            onBlur={() => handleBlur('password')}
            className={[
              'w-full rounded-full py-4 px-5 text-lg outline-none transition-all duration-200',
              'bg-[#1D1D1D] text-white border',
              validationErrors.password || passwordErrors.length > 0
                ? 'border-red-500 focus:ring-2 focus:ring-red-500/40'
                : 'border-transparent focus:ring-2 focus:ring-[#1DCD9F]/40',
            ].join(' ')}
            required
            disabled={isSubmitting}
            autoComplete="new-password"
            aria-invalid={Boolean(validationErrors.password || passwordErrors.length > 0)}
            aria-describedby="password-error password-help"
            placeholder=" "
          />
          <label
            htmlFor="password"
            className={[
              'absolute left-5 pointer-events-none transition-all duration-200 text-gray-400',
              focused.password || formData.password ? 'top-1 text-xs' : 'top-4 text-lg',
            ].join(' ')}
          >
            Hasło
          </label>

          {/* Komunikaty hasła */}
          <div className="mt-2 ml-2 text-sm space-y-1 break-words" aria-live="polite">
            {validationErrors.password && (
              <p id="password-error" className="text-red-400">{validationErrors.password}</p>
            )}
            {validationErrors.password_confirm && (
              <p className="text-red-400">{validationErrors.password_confirm}</p>
            )}
          </div>
        </div>

        {/* Checklist wymagań hasła */}
        {formData.password && (
          <div className="rounded-2xl border border-[#2b2b2b] bg-[#121212] p-4">
            <p className="text-gray-300 text-sm mb-2">Hasło musi zawierać:</p>
            <ul className="space-y-1 text-sm">
              <li className={formData.password.length >= 8 ? 'text-emerald-400' : 'text-red-400'}>
                {formData.password.length >= 8 ? '✓' : '✗'} Co najmniej 8 znaków
              </li>
              <li className={/\d/.test(formData.password) ? 'text-emerald-400' : 'text-red-400'}>
                {/\d/.test(formData.password) ? '✓' : '✗'} Co najmniej jedną cyfrę
              </li>
              <li className={/[a-zA-Z]/.test(formData.password) ? 'text-emerald-400' : 'text-red-400'}>
                {/[a-zA-Z]/.test(formData.password) ? '✓' : '✗'} Co najmniej jedną literę
              </li>
            </ul>
          </div>
        )}

        {/* Błąd nazwy użytkownika z backendu */}
        {validationErrors.username && (
          <div className="p-3 bg-red-900/20 border border-red-400/60 rounded-lg break-words">
            <p className="text-red-300 text-sm">
              <strong>Problem z nazwą użytkownika:</strong> {validationErrors.username}
            </p>
            <p className="text-red-200/90 text-xs mt-1">
              Nazwa użytkownika jest generowana automatycznie z Twojego imienia.
            </p>
          </div>
        )}

        {/* Zgody */}
        <p className="text-center text-xs text-gray-400">
          Kontynuując, akceptujesz{' '}
          <a href="#" className="text-[#1DCD9F] hover:underline">Warunki</a>{' '}
          i{' '}
          <a href="#" className="text-[#1DCD9F] hover:underline">Politykę prywatności</a>.
        </p>

        {/* CTA */}
        <div className="mt-auto pt-2">
          <button
            type="submit"
            disabled={!formValid || isSubmitting}
            className={[
              'w-full py-4 rounded-full font-bold transition-all duration-300',
              formValid && !isSubmitting
                ? 'bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] hover:brightness-110'
                : 'bg-gray-600 text-gray-300 cursor-not-allowed',
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

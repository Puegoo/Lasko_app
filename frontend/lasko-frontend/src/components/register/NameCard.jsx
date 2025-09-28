// frontend/lasko-frontend/src/components/register/NameCard.jsx
import React, { useMemo, useState, useId } from 'react';

/**
 * NameCard — styl spójny z AccountCard:
 * - Glass container (bg #0b0b0b/95, border white/10, shadow)
 * - Pływająca etykieta (peer)
 * - Te same focus-ring i border stany
 * - A11y: aria-*, region live dla komunikatów
 * - Podpowiedź username (transliteracja PL znaków)
 * - Bez zmian w logice/proposach
 */
const NameCard = ({
  formData,
  updateFormData,
  validationErrors = {},
  onNext,
  onPrev,
  isSubmitting = false,
}) => {
  const nameId = useId();
  const [focused, setFocused] = useState({ name: false });

  // Transliteracja → sugerowana nazwa użytkownika
  const sanitizeUsername = (raw) => {
    if (!raw) return '';
    return raw
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ł/g, 'l').replace(/Ł/g, 'L')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  };

  const suggestedUsername = useMemo(
    () => sanitizeUsername(formData?.name || ''),
    [formData?.name]
  );

  const isFormValid = (formData?.name || '').trim().length >= 2;

  const handleChange = (e) => updateFormData('name', e.target.value);
  const handleFocus = () => setFocused((s) => ({ ...s, name: true }));
  const handleBlur = () => {
    if (!formData?.name) setFocused((s) => ({ ...s, name: false }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;
    onNext();
  };

  const nameHasError =
    Boolean(validationErrors.first_name) ||
    Boolean(validationErrors.username) ||
    (!!formData?.name && !isFormValid);

  return (
    <div className="bg-[#0b0b0b]/95 rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] p-6 md:p-8 w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-white text-2xl font-black">Jak masz na imię?</h2>
          <p className="text-gray-300 mt-1">Powiedz nam, jak mamy się do Ciebie zwracać</p>
        </div>

        {/* Pole: Imię */}
        <div className="relative">
          <input
            type="text"
            name="name"
            id={nameId}
            value={formData?.name || ''}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={[
              'peer w-full rounded-2xl py-4 px-5 text-base md:text-lg outline-none transition-all',
              'bg-[#131313] text-white border',
              nameHasError
                ? 'border-red-500 focus:ring-2 focus:ring-red-500/30'
                : 'border-white/10 focus:ring-2 focus:ring-emerald-400/30',
            ].join(' ')}
            required
            disabled={isSubmitting}
            autoComplete="given-name"
            aria-invalid={nameHasError ? 'true' : 'false'}
            aria-describedby={`${nameId}-error ${nameId}-help`}
            placeholder=" "
          />
          <label
            htmlFor={nameId}
            className={[
              'pointer-events-none absolute left-5 text-gray-400 transition-all',
              (focused.name || formData?.name) ? 'top-1 text-xs' : 'top-4 text-base md:text-lg'
            ].join(' ')}
          >
            Imię
          </label>

          {/* Komunikaty / podpowiedzi */}
          <div className="mt-2 ml-1 text-sm space-y-1" aria-live="polite">
            {validationErrors.first_name && (
              <p id={`${nameId}-error`} className="text-red-400">
                {validationErrors.first_name}
              </p>
            )}

            {validationErrors.username && (
              <div className="p-3 bg-red-900/20 border border-red-400/60 rounded-lg break-words">
                <p className="text-red-300">
                  <strong>Problem z nazwą użytkownika:</strong> {validationErrors.username}
                </p>
                <p className="text-red-200/90 text-xs mt-1">
                  Nazwa użytkownika jest generowana automatycznie z Twojego imienia.
                </p>
              </div>
            )}

            {!validationErrors.first_name && !validationErrors.username && formData?.name && !isFormValid && (
              <p id={`${nameId}-help`} className="text-red-400">
                Imię powinno mieć co najmniej 2 znaki.
              </p>
            )}

            {!validationErrors.first_name && !validationErrors.username && isFormValid && suggestedUsername && (
              <p id={`${nameId}-help`} className="text-emerald-300">
                Proponowana nazwa użytkownika: <strong>@{suggestedUsername}</strong>
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
            disabled={!isFormValid || isSubmitting}
            className={[
              'w-full rounded-full py-4 font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60',
              isFormValid && !isSubmitting
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

export default NameCard;
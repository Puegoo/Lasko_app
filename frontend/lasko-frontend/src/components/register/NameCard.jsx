// frontend/lasko-frontend/src/components/register/NameCard.jsx
import React, { useMemo, useState } from 'react';

/**
 * Karta z imieniem:
 * - Ciemny motyw, pływająca etykieta
 * - Minimalna wysokość kafelka + wyśrodkowanie pionowe treści
 * - Walidacja: min. 2 znaki, komunikaty ARIA
 * - Propozycja nazwy użytkownika (transliteracja PL znaków)
 */
const NameCard = ({
  formData,
  updateFormData,
  validationErrors = {},
  onNext,
  onPrev,
  isSubmitting = false,
}) => {
  // Stan pływającej etykiety
  const [focused, setFocused] = useState({ name: false });

  // Transliteracja imienia → propozycja username (bez diakrytyków i znaków specjalnych)
  const sanitizeUsername = (raw) => {
    if (!raw) return '';
    return raw
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ł/g, 'l')
      .replace(/Ł/g, 'L')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  };

  const suggestedUsername = useMemo(
    () => sanitizeUsername(formData?.name || ''),
    [formData?.name]
  );

  // Walidacja pola (min. 2 znaki)
  const isFormValid = (formData?.name || '').trim().length >= 2;

  // Aktualizacja modelu formularza
  const handleChange = (e) => {
    updateFormData('name', e.target.value);
  };

  // Obsługa etykiety pływającej
  const handleFocus = () => setFocused((s) => ({ ...s, name: true }));
  const handleBlur = () => {
    if (!formData?.name) setFocused((s) => ({ ...s, name: false }));
  };

  // Zatwierdzenie kroku
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;
    onNext();
  };

  // Flagi błędów (UI)
  const nameHasError =
    Boolean(validationErrors.first_name) ||
    Boolean(validationErrors.username) ||
    (!!formData?.name && !isFormValid);

  return (
    <div
      className={[
        'bg-[#0a0a0a]/95 rounded-3xl shadow-xl p-6 md:p-8 w-full',
        'flex flex-col border border-[#222222] shadow-[0_0_30px_10px_rgba(0,0,0,0.5)]',
        'min-h-[520px]',
      ].join(' ')}
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        {/* Treść wyśrodkowana pionowo */}
        <div className="flex flex-col gap-6 flex-1 justify-center">
          {/* Nagłówek */}
          <div className="text-center">
            <h2 className="text-white text-2xl font-bold">Jak masz na imię?</h2>
            <p className="text-white/90 text-lg">Powiedz nam, jak mamy się do Ciebie zwracać</p>
          </div>

          {/* Pole: Imię (pływająca etykieta) */}
          <div className="relative mt-2">
            <input
              type="text"
              id="name"
              name="name"
              value={formData?.name || ''}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className={[
                'w-full rounded-full py-4 px-5 text-lg outline-none transition-all duration-200',
                'bg-[#1D1D1D] text-white border',
                nameHasError
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500/40'
                  : 'border-transparent focus:ring-2 focus:ring-[#1DCD9F]/40',
              ].join(' ')}
              autoComplete="given-name"
              autoFocus
              required
              aria-invalid={nameHasError ? 'true' : 'false'}
              aria-describedby="name-error name-help"
              placeholder=" "
            />
            <label
              htmlFor="name"
              className={[
                'absolute left-5 pointer-events-none transition-all duration-200 text-gray-400',
                focused.name || formData?.name ? 'top-1 text-xs' : 'top-4 text-lg',
              ].join(' ')}
            >
              Imię
            </label>

            {/* Komunikaty walidacyjne / pomocnicze */}
            <div className="mt-2 ml-2 space-y-1 text-sm" aria-live="polite">
              {validationErrors.first_name && (
                <p id="name-error" className="text-red-400">
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

              {!validationErrors.first_name &&
                !validationErrors.username &&
                formData?.name &&
                !isFormValid && (
                  <p id="name-help" className="text-red-400">
                    Imię powinno mieć co najmniej 2 znaki.
                  </p>
                )}

              {!validationErrors.first_name &&
                !validationErrors.username &&
                isFormValid &&
                suggestedUsername && (
                  <p className="text-emerald-400">
                    ✓ Proponowana nazwa użytkownika: @{suggestedUsername}
                  </p>
                )}
            </div>
          </div>
        </div>

        {/* Nawigacja (CTA przy dole kafelka) */}
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

export default NameCard;
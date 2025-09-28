import React, { useMemo, useState, useId, useEffect, useRef } from 'react';
import { checkEmailAvailability } from '../../services/validationService';

const AccountCard = ({
  formData,
  updateFormData,
  validationErrors = {},
  onNext,
  isSubmitting,
}) => {
  const emailId = useId();
  const passId = useId();

  const [focused, setFocused] = useState({ email: false, password: false });
  const [showPw, setShowPw] = useState(false);
  const [caps, setCaps] = useState(false);

  // --- Walidacje spójne z backendem ---
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

  // --- Siła hasła (lokalna, wizualna) ---
  const passwordStrength = (pw) => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
    if (/\d/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return Math.min(s, 5); // 0–5
  };

  // --- Handlery ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    const val = name === 'email' ? value.trim().toLowerCase() : value;
    updateFormData(name, val);
  };

  const handleFocus = (field) => setFocused((s) => ({ ...s, [field]: true }));
  const handleBlur = (field) => {
    if (!formData[field]) setFocused((s) => ({ ...s, [field]: false }));
  };

  const onKeyEvent = (e) => {
    if (e.getModifierState) setCaps(e.getModifierState('CapsLock'));
  };

  const emailValid = useMemo(() => validateEmail(formData.email), [formData.email]);
  const passwordErrors = useMemo(
    () => (formData.password ? validatePassword(formData.password) : []),
    [formData.password]
  );
  const passValid = Boolean(formData.password) && passwordErrors.length === 0;

  // --- Async dostępność e-maila ---
  const [emailStatus, setEmailStatus] = useState('idle'); // idle | checking | free | taken | error
  useEffect(() => {
    if (!formData.email || !emailValid) {
      setEmailStatus('idle');
      return;
    }
    setEmailStatus('checking');
    const ac = new AbortController();
    const t = setTimeout(async () => {
      try {
        const available = await checkEmailAvailability(formData.email, ac.signal);
        setEmailStatus(available ? 'free' : 'taken');
      } catch {
        setEmailStatus('error'); // nie blokuj przy błędzie sieci
      }
    }, 400);

    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [formData.email, emailValid]);

  // --- Kolaps siły hasła (bez rezerwy miejsca) ---
  const collapseRef = useRef(null);
  const [collapseMaxH, setCollapseMaxH] = useState(0);
  const strength = passwordStrength(formData.password);
  useEffect(() => {
    const el = collapseRef.current;
    if (!el) return;
    if (formData.password) setCollapseMaxH(el.scrollHeight);
    else setCollapseMaxH(0);
  }, [formData.password, strength]);

  const strengthLabels = ['Bardzo słabe', 'Słabe', 'OK', 'Dobre', 'Mocne', 'Bardzo mocne'];
  const strengthColors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-emerald-500',
    'bg-emerald-400',
  ];

  const formValid =
    emailValid &&
    passValid &&
    emailStatus !== 'checking' &&
    emailStatus !== 'taken' &&
    !isSubmitting;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formValid) return;
    onNext();
  };

  // Scroll do nagłówka przy błędach backendu
  useEffect(() => {
    if (validationErrors?.email || validationErrors?.password) {
      const top = document.getElementById('account-card-top');
      if (top) top.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [validationErrors]);

  return (
    <div className="bg-[#0b0b0b]/95 rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] p-6 md:p-8 w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Header */}
        <div id="account-card-top" className="text-center">
          <h2 className="text-white text-2xl font-black">Stwórz konto</h2>
          <p className="text-gray-300 mt-1">Rozpocznij swoją podróż fitness</p>
        </div>

        {/* Backend globalny błąd */}
        {validationErrors.non_field_errors && (
          <div className="rounded-2xl border border-red-400/50 bg-red-900/20 p-4 text-sm text-red-200">
            {Array.isArray(validationErrors.non_field_errors)
              ? validationErrors.non_field_errors.join(' ')
              : String(validationErrors.non_field_errors)}
          </div>
        )}

        {/* Email */}
        <div className="relative">
          <input
            type="email"
            name="email"
            id={emailId}
            value={formData.email}
            onChange={handleChange}
            onFocus={() => handleFocus('email')}
            onBlur={() => handleBlur('email')}
            className={[
              'peer w-full rounded-2xl py-4 px-5 text-base md:text-lg outline-none transition-all',
              'bg-[#131313] text-white border',
              validationErrors.email || (!emailValid && formData.email) || emailStatus === 'taken'
                ? 'border-red-500 focus:ring-2 focus:ring-red-500/30'
                : 'border-white/10 focus:ring-2 focus:ring-emerald-400/30',
            ].join(' ')}
            required
            disabled={isSubmitting}
            autoComplete="email"
            aria-invalid={Boolean(
              validationErrors.email || (!emailValid && formData.email) || emailStatus === 'taken'
            )}
            aria-describedby={`${emailId}-error ${emailId}-help`}
            placeholder=" "
            inputMode="email"
          />
          <label
            htmlFor={emailId}
            className={[
              'pointer-events-none absolute left-5 text-gray-400 transition-all',
              (focused.email || formData.email) ? 'top-1 text-xs' : 'top-4 text-base md:text-lg'
            ].join(' ')}
          >
            Email
          </label>

          {/* Info / błędy (bez rezerwy miejsca poza aktualnymi liniami) */}
          <div className="mt-2 ml-1 text-sm space-y-1" aria-live="polite">
            {validationErrors.email && (
              <p id={`${emailId}-error`} className="text-red-400">{validationErrors.email}</p>
            )}
            {!validationErrors.email && formData.email && !emailValid && (
              <p id={`${emailId}-help`} className="text-red-400">Podaj poprawny adres e-mail.</p>
            )}
            {!validationErrors.email && emailValid && emailStatus === 'checking' && (
              <p className="text-gray-400">Sprawdzanie dostępności…</p>
            )}
            {!validationErrors.email && emailValid && emailStatus === 'taken' && (
              <p className="text-red-400">Ten e-mail jest już zajęty.</p>
            )}
            {!validationErrors.email && emailValid && emailStatus === 'free' && (
              <p className="text-emerald-400">✓ Email dostępny.</p>
            )}
             {!validationErrors.email && emailValid && emailStatus === 'error' && (
               <p className="text-amber-300">Nie udało się sprawdzić dostępności (brak zgodnego JSON). Walidacja ostateczna nastąpi przy rejestracji.</p>
             )}
          </div>
        </div>

        {/* Hasło */}
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            name="password"
            id={passId}
            value={formData.password}
            onChange={handleChange}
            onFocus={() => handleFocus('password')}
            onBlur={() => handleBlur('password')}
            onKeyUp={onKeyEvent}
            onKeyDown={onKeyEvent}
            className={[
              'peer w-full rounded-2xl py-4 px-5 pr-14 text-base md:text-lg outline-none transition-all',
              'bg-[#131313] text-white border',
              validationErrors.password || passwordErrors.length > 0
                ? 'border-red-500 focus:ring-2 focus:ring-red-500/30'
                : 'border-white/10 focus:ring-2 focus:ring-emerald-400/30',
            ].join(' ')}
            required
            disabled={isSubmitting}
            autoComplete="new-password"
            aria-invalid={Boolean(validationErrors.password || passwordErrors.length > 0)}
            aria-describedby={`${passId}-error ${passId}-help`}
            placeholder=" "
          />
          <label
            htmlFor={passId}
            className={[
              'pointer-events-none absolute left-5 text-gray-400 transition-all',
              (focused.password || formData.password) ? 'top-1 text-xs' : 'top-4 text-base md:text-lg'
            ].join(' ')}
          >
            Hasło
          </label>

          {/* Toggle podglądu */}
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-gray-300 hover:text-white hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
            aria-label={showPw ? 'Ukryj hasło' : 'Pokaż hasło'}
            tabIndex={-1}
          >
            {showPw ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18M10.58 10.58a3 3 0 104.24 4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M9.88 5.09A10.54 10.54 0 0112 5c7 0 10 7 10 7a13.37 13.37 0 01-3.22 4.18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
            )}
          </button>

          {/* Komunikaty hasła */}
          <div className="mt-2 ml-1 text-sm space-y-1" aria-live="polite">
            {caps && <p className="text-amber-300">Uwaga: włączony Caps Lock.</p>}
            {validationErrors.password && (
              <p id={`${passId}-error`} className="text-red-400">{validationErrors.password}</p>
            )}
            {validationErrors.password_confirm && (
              <p className="text-red-400">{validationErrors.password_confirm}</p>
            )}
          </div>
        </div>

        {/* Pasek siły hasła — płynny kolaps w dół, bez stałej wysokości */}
        <div
          className={['overflow-hidden transition-[max-height] duration-300 ease-out', formData.password ? 'mt-3' : ''].join(' ')}
          style={{ maxHeight: collapseMaxH, willChange: 'max-height' }}
          aria-hidden={!formData.password}
        >
          <div ref={collapseRef}>
            <div className="rounded-2xl border border-white/10 bg-[#101010] p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-gray-300">Siła hasła</p>
                <p className="text-xs text-gray-400">{strengthLabels[strength]}</p>
              </div>
              <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full ${strengthColors[strength] || 'bg-red-500'} transition-all`}
                  style={{ width: `${(strength / 5) * 100}%` }}
                />
              </div>
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
          </div>
        </div>

        {/* Błąd nazwy użytkownika z backendu */}
        {validationErrors.username && (
          <div className="rounded-2xl border border-red-400/60 bg-red-900/20 p-3 text-sm text-red-200">
            <p><strong>Problem z nazwą użytkownika:</strong> {validationErrors.username}</p>
            <p className="mt-1 text-red-200/90 text-xs">
              Nazwa użytkownika jest generowana automatycznie z Twojego imienia.
            </p>
          </div>
        )}

        {/* Zgody */}
        <p className="text-center text-xs text-gray-400">
          Kontynuując, akceptujesz{' '}
          <a href="#" className="text-emerald-300 hover:underline">Warunki</a>{' '}
          i{' '}
          <a href="#" className="text-emerald-300 hover:underline">Politykę prywatności</a>.
        </p>

        {/* CTA */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!formValid}
            className={[
              'w-full rounded-full py-4 font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60',
              formValid
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

export default AccountCard;
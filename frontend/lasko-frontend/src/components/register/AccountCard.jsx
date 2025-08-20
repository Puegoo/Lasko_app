import React, { useState } from 'react';

const AccountCard = ({ 
  formData, 
  updateFormData, 
  validationErrors = {}, // DODANO: Błędy walidacji
  onNext, 
  isSubmitting 
}) => {
  // Stan do obsługi pływającej etykiety
  const [focused, setFocused] = useState({
    email: false,
    password: false
  });

  // POPRAWIONO: Funkcja do obsługi zmiany w polach formularza z debugowaniem
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // DEBUGGING EMAIL
    if (name === 'email') {
      console.log('🔍 EMAIL DEBUG:');
      console.log('   Wprowadzony email:', `"${value}"`);
      console.log('   Długość:', value.length);
      console.log('   Znaki specjalne:', value.split('').filter(char => /[^\w@.-]/.test(char)));
      console.log('   Regex test:', /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value));
      console.log('   Trimmed:', `"${value.trim()}"`);
    }
    
    // Usuń białe znaki z email
    const cleanValue = name === 'email' ? value.trim() : value;
    updateFormData(name, cleanValue);
  };

  // Obsługa wejścia w pole (focus)
  const handleFocus = (field) => {
    setFocused(prev => ({
      ...prev,
      [field]: true
    }));
  };

  // Obsługa wyjścia z pola (blur)
  const handleBlur = (field) => {
    if (!formData[field]) {
      setFocused(prev => ({
        ...prev,
        [field]: false
      }));
    }
  };

  // POPRAWIONO: Walidacja hasła zgodna z backendem
  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push('co najmniej 8 znaków');
    if (!/\d/.test(password)) errors.push('co najmniej jedną cyfrę');
    if (!/[a-zA-Z]/.test(password)) errors.push('co najmniej jedną literę');
    return errors;
  };

  // POPRAWIONO: Walidacja email - dokładnie taka sama jak w backendzie
  const validateEmail = (email) => {
    if (!email) return false;
    // Użyj dokładnie tego samego regex co w backendzie
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email.trim());
  };

  // POPRAWIONO: Walidacja formularza z lepszym debugowaniem
  const isValid = () => {
    const emailValid = validateEmail(formData.email);
    const passwordErrors = validatePassword(formData.password);
    const passwordValid = formData.password && passwordErrors.length === 0;
    
    // DEBUG
    console.log('🔍 VALIDATION DEBUG:');
    console.log('   Email:', `"${formData.email}"`);
    console.log('   Email valid:', emailValid);
    console.log('   Password valid:', passwordValid);
    console.log('   Password errors:', passwordErrors);
    console.log('   Form valid:', emailValid && passwordValid);
    
    return emailValid && passwordValid;
  };

  // Obsługa wysłania formularza
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!isValid()) {
      console.log('❌ Form validation failed');
      return; // Nie pokazuj alert, błędy będą widoczne w UI
    }
    
    if (!isSubmitting) {
      console.log('✅ Form valid, proceeding to next step');
      onNext();
    }
  };

  const passwordErrors = formData.password ? validatePassword(formData.password) : [];

  return (
    <div className="bg-[#2A2A2A] rounded-3xl p-6 shadow-2xl h-full flex flex-col">
      {/* Nagłówek - skrócony */}
      <div className="text-center mb-6">
        <h2 className="text-white text-2xl font-bold mb-2">
          Stwórz konto
        </h2>
        <p className="text-gray-400 text-base">
          Rozpocznij swoją podróż fitness
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* Pole email z pływającą etykietą */}
        <div className="relative mb-4">
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            onFocus={() => handleFocus('email')}
            onBlur={() => handleBlur('email')}
            className={`w-full bg-[#1D1D1D] text-white rounded-full py-4 px-5 outline-none text-lg focus:ring-2 ${
              validationErrors.email || (!validateEmail(formData.email) && formData.email) 
                ? 'ring-2 ring-red-500' 
                : 'focus:ring-[#1DCD9F]'
            }`}
            required
            disabled={isSubmitting}
            autoComplete="email"
            placeholder="" // Usuń placeholder żeby pływająca etykieta działała
          />
          <label 
            htmlFor="email"
            className={`absolute transition-all duration-200 pointer-events-none ${
              validationErrors.email || (!validateEmail(formData.email) && formData.email)
                ? 'text-red-400' 
                : 'text-gray-400'
            } ${
              focused.email || formData.email 
                ? 'text-xs top-1 left-5' 
                : 'text-lg top-4 left-5'
            }`}
          >
            Email
          </label>
          
          {/* Wyświetlanie błędu walidacji email z backendu */}
          {validationErrors.email && (
            <p className="text-red-400 text-sm mt-2 ml-2">{validationErrors.email}</p>
          )}
          
          {/* Walidacja email po stronie frontu */}
          {!validationErrors.email && formData.email && !validateEmail(formData.email) && (
            <p className="text-red-400 text-sm mt-2 ml-2">Podaj poprawny adres e-mail</p>
          )}
          
          {/* Wskaźnik poprawnego email */}
          {formData.email && validateEmail(formData.email) && !validationErrors.email && (
            <p className="text-green-400 text-sm mt-2 ml-2">✓ Email jest poprawny</p>
          )}
        </div>

        {/* Pole hasło z pływającą etykietą */}
        <div className="relative mb-4">
          <input
            type="password"
            name="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
            onFocus={() => handleFocus('password')}
            onBlur={() => handleBlur('password')}
            className={`w-full bg-[#1D1D1D] text-white rounded-full py-4 px-5 outline-none text-lg focus:ring-2 ${
              validationErrors.password || passwordErrors.length > 0 ? 'ring-2 ring-red-500' : 'focus:ring-[#1DCD9F]'
            }`}
            required
            disabled={isSubmitting}
            autoComplete="new-password"
            placeholder="" // Usuń placeholder żeby pływająca etykieta działała
          />
          <label 
            htmlFor="password"
            className={`absolute transition-all duration-200 pointer-events-none ${
              validationErrors.password || passwordErrors.length > 0 ? 'text-red-400' : 'text-gray-400'
            } ${
              focused.password || formData.password 
                ? 'text-xs top-1 left-5' 
                : 'text-lg top-4 left-5'
            }`}
          >
            Hasło
          </label>
          
          {/* Wyświetlanie błędu walidacji hasła z backendu */}
          {validationErrors.password && (
            <p className="text-red-400 text-sm mt-2 ml-2">{validationErrors.password}</p>
          )}
          
          {/* Wyświetlanie błędu potwierdzenia hasła */}
          {validationErrors.password_confirm && (
            <p className="text-red-400 text-sm mt-2 ml-2">{validationErrors.password_confirm}</p>
          )}
        </div>

        {/* Wymagania hasła (tylko jeśli użytkownik zaczął pisać) - kompaktowe */}
        {formData.password && (
          <div className="mb-4 p-3 bg-[#1D1D1D] rounded-lg border border-[#444444]">
            <p className="text-gray-300 text-sm mb-2">Hasło musi zawierać:</p>
            <div className="space-y-1">
              <div className={`flex items-center text-sm ${
                formData.password.length >= 8 ? 'text-green-400' : 'text-red-400'
              }`}>
                <span className="mr-2">{formData.password.length >= 8 ? '✓' : '✗'}</span>
                Co najmniej 8 znaków
              </div>
              <div className={`flex items-center text-sm ${
                /\d/.test(formData.password) ? 'text-green-400' : 'text-red-400'
              }`}>
                <span className="mr-2">{/\d/.test(formData.password) ? '✓' : '✗'}</span>
                Co najmniej jedną cyfrę
              </div>
              <div className={`flex items-center text-sm ${
                /[a-zA-Z]/.test(formData.password) ? 'text-green-400' : 'text-red-400'
              }`}>
                <span className="mr-2">{/[a-zA-Z]/.test(formData.password) ? '✓' : '✗'}</span>
                Co najmniej jedną literę
              </div>
            </div>
          </div>
        )}

        {/* Wyświetlanie błędów username jeśli istnieją */}
        {validationErrors.username && (
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">
              <strong>Problem z nazwą użytkownika:</strong> {validationErrors.username}
            </p>
            <p className="text-red-300 text-xs mt-1">
              Nazwa użytkownika jest generowana automatycznie z Twojego imienia.
            </p>
          </div>
        )}

        {/* Informacja o zgodzie na warunki - skrócona */}
        <div className="text-center text-xs text-gray-400 mb-4">
          <p>
            Kontynuując, zgadzasz się na nasze{' '}
            <a href="#" className="text-[#1DCD9F] hover:underline">
              Warunki
            </a>{' '}
            i{' '}
            <a href="#" className="text-[#1DCD9F] hover:underline">
              Politykę prywatności
            </a>
          </p>
        </div>

        {/* Przycisk dalej - ZAWSZE WIDOCZNY NA DOLE */}
        <div className="mt-auto pt-4 border-t border-[#444444]">
          <button
            type="submit"
            disabled={!isValid() || isSubmitting}
            className={`w-full py-3 px-8 font-bold rounded-full transition-all duration-300 ${
              isValid() && !isSubmitting
                ? 'bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] hover:brightness-110 transform hover:-translate-y-1'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Ładowanie...' : 'Dalej'}
          </button>
        </div>
      </form>

      {/* DEBUG INFO w development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 bg-black text-white text-xs p-2 rounded max-w-xs">
          <div>Email: "{formData.email}"</div>
          <div>Valid: {validateEmail(formData.email) ? 'YES' : 'NO'}</div>
          <div>Errors: {Object.keys(validationErrors).join(', ') || 'None'}</div>
        </div>
      )}
    </div>
  );
};

export default AccountCard;
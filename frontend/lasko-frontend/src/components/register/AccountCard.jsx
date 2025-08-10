// frontend/lasko-frontend/src/components/register/AccountCard.jsx (AKTUALIZACJA)
import React, { useState } from 'react';

const AccountCard = ({ formData, updateFormData, onNext, isSubmitting }) => {
  // Stan do obsługi pływającej etykiety
  const [focused, setFocused] = useState({
    email: false,
    password: false
  });

  // Funkcja do obsługi zmiany w polach formularza
  const handleChange = (e) => {
    const { name, value } = e.target;
    updateFormData(name, value);
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

  // Walidacja formularza
  const isValid = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (
      formData.email &&
      emailRegex.test(formData.email) &&
      formData.password &&
      formData.password.length >= 6
    );
  };

  // Obsługa wysłania formularza
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!isValid()) {
      alert('Proszę wypełnić wszystkie pola poprawnie. Hasło musi mieć co najmniej 6 znaków.');
      return;
    }
    
    if (!isSubmitting) {
      onNext();
    }
  };

  return (
    <div className="bg-[#2A2A2A] rounded-3xl p-8 shadow-2xl h-full flex flex-col">
      {/* Nagłówek */}
      <div className="text-center mb-8">
        <h2 className="text-white text-3xl font-bold mb-2">
          Stwórz konto
        </h2>
        <p className="text-gray-400 text-lg">
          Rozpocznij swoją podróż fitness
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-grow space-y-6">
        {/* Pole email z pływającą etykietą */}
        <div className="relative">
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            onFocus={() => handleFocus('email')}
            onBlur={() => handleBlur('email')}
            className="w-full bg-[#1D1D1D] text-white rounded-full py-4 px-5 outline-none text-lg focus:ring-2 focus:ring-[#1DCD9F]"
            required
            disabled={isSubmitting}
          />
          <label 
            htmlFor="email"
            className={`absolute text-gray-400 transition-all duration-200 pointer-events-none ${
              focused.email || formData.email 
                ? 'text-xs top-1 left-5' 
                : 'text-lg top-4 left-5'
            }`}
          >
            Email
          </label>
        </div>

        {/* Pole hasło z pływającą etykietą */}
        <div className="relative">
          <input
            type="password"
            name="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
            onFocus={() => handleFocus('password')}
            onBlur={() => handleBlur('password')}
            className="w-full bg-[#1D1D1D] text-white rounded-full py-4 px-5 outline-none text-lg focus:ring-2 focus:ring-[#1DCD9F]"
            required
            disabled={isSubmitting}
          />
          <label 
            htmlFor="password"
            className={`absolute text-gray-400 transition-all duration-200 pointer-events-none ${
              focused.password || formData.password 
                ? 'text-xs top-1 left-5' 
                : 'text-lg top-4 left-5'
            }`}
          >
            Hasło
          </label>
        </div>

        {/* Informacja o zgodzie na warunki */}
        <div className="text-center text-sm text-gray-300 mt-2">
          <p>
            Kontynuując, zgadzasz się na nasze{' '}
            <a href="#" className="text-[#1DCD9F] hover:underline">
              Warunki
            </a>{' '}
            i{' '}
            <a href="#" className="text-[#1DCD9F] hover:underline">
              politykę prywatności
            </a>
          </p>
        </div>

        {/* Przycisk dalej */}
        <div className="mt-auto flex justify-center">
          <button
            type="submit"
            disabled={!isValid() || isSubmitting}
            className={`px-8 py-4 bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white font-bold rounded-full transition-all duration-300 ${
              isValid() && !isSubmitting
                ? 'hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] hover:brightness-110 cursor-pointer'
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Ładowanie...' : 'Dalej'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AccountCard;
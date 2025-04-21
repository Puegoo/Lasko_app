import React, { useState } from 'react';

const AccountCard = ({ formData, updateFormData, onNext }) => {
  // Stany do obsługi pływających etykiet
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

  // Obsługa wyjścia z pola (blur) - tylko gdy pole jest puste
  const handleBlur = (field) => {
    if (!formData[field]) {
      setFocused(prev => ({
        ...prev,
        [field]: false
      }));
    }
  };

  // Walidacja formularza przed przejściem dalej
  const handleSubmit = (e) => {
    e.preventDefault();
    // Tutaj możesz dodać walidację
    onNext();
  };

  return (
    <div className="bg-[#0a0a0a]/95 rounded-3xl shadow-xl p-8 w-full h-[550px] flex flex-col shadow-[0_0_30px_10px_rgba(0,0,0,0.5)] border border-[#222222]">
      <form onSubmit={handleSubmit} className="flex flex-col space-y-6 flex-grow">
        {/* Pasek postępu - nad pytaniami, krótszy */}
        <div className="max-w-xs mx-auto w-full h-3 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] rounded-full" style={{ width: '20%' }}></div>
        </div>
        
        <div className="text-center">
          <h2 className="text-white text-2xl font-bold">Witaj w Lasko</h2>
          <p className="text-white text-medium italic">Stwórz konto</p>
        </div>

        {/* Pole email z pływającą etykietą */}
        <div className="relative mt-5">
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            onFocus={() => handleFocus('email')}
            onBlur={() => handleBlur('email')}
            className="w-full bg-[#1D1D1D] text-white rounded-full py-4 px-5 outline-none text-lg"
            required
          />
          <label 
            htmlFor="email"
            className={`absolute text-gray-400 transition-all duration-200 ${
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
            className="w-full bg-[#1D1D1D] text-white rounded-full py-4 px-5 outline-none text-lg"
            required
          />
          <label 
            htmlFor="password"
            className={`absolute text-gray-400 transition-all duration-200 ${
              focused.password || formData.password 
                ? 'text-xs top-1 left-5' 
                : 'text-lg top-4 left-5'
            }`}
          >
            Hasło
          </label>
        </div>

        {/* Informacja o zgodzie na warunki */}
        <div className="text-center text-sm text-white mt-2">
          <p>
            Kontynuując, zgadzasz się na nasze{' '}
            <a href="#" className="text-[#1DCD9F]">
              Warunki
            </a>{' '}
            i{' '}
            <a href="#" className="text-[#1DCD9F]">
              politykę prywatności
            </a>
          </p>
        </div>

        {/* Przycisk dalej - bez przycisku Wstecz na pierwszej karcie */}
        <div className="mt-auto flex justify-center">
          <button
            type="submit"
            className="w-xs bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white font-bold py-4 rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] hover:brightness-110"
          >
            Dalej
          </button>
        </div>
      </form>
    </div>
  );
};

export default AccountCard;
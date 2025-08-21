import React, { useState, useRef, useEffect } from 'react';

const UsernameCard = ({ formData, updateFormData, onNext, onPrev }) => {
  // Stan do obsługi pływającej etykiety
  const [focused, setFocused] = useState({
    username: false
  });

  // Referencja do pola input
  const inputRef = useRef(null);
  
  // Referencja do kontenera z @
  const atSignRef = useRef(null);

  // Stan do przechowywania nazwy użytkownika bez @
  const [usernameValue, setUsernameValue] = useState('');

  // Funkcja do obsługi zmiany w polu formularza
  const handleChange = (e) => {
    const value = e.target.value;
    
    // Usuń znak @ jeśli pojawił się gdzieś w tekście (np. ktoś go wpisał)
    const cleanValue = value.replace(/@/g, '');
    
    setUsernameValue(cleanValue);
    // Zapisz username bez @ do formData (backend może oczekiwać bez @)
    updateFormData('username', cleanValue);
  };

  // Inicjalizacja stanu gdy formData się zmienia
  useEffect(() => {
    if (formData.username && formData.username !== '@' && formData.username !== '') {
      // Usuń prefiks @ jeśli istnieje i ustaw wartość pola
      const cleanUsername = formData.username.replace(/@/g, '');
      setUsernameValue(cleanUsername);
    }
  }, [formData.username]); // 👈 POPRAWKA: dodano dependency

  // Obsługa wejścia w pole (focus)
  const handleFocus = (field) => {
    setFocused(prev => ({
      ...prev,
      [field]: true
    }));
    
    // Przesuń kursor na koniec tekstu
    if (inputRef.current) {
      setTimeout(() => {
        const length = inputRef.current.value.length;
        inputRef.current.selectionStart = length;
        inputRef.current.selectionEnd = length;
      }, 0);
    }
  };

  // Obsługa wyjścia z pola (blur)
  const handleBlur = (field) => {
    if (!usernameValue) {
      setFocused(prev => ({
        ...prev,
        [field]: false
      }));
    }
  };

  // Walidacja przed przejściem dalej
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Sprawdź czy nazwa użytkownika ma jakąś wartość
    if (!usernameValue || usernameValue.trim() === '') {
      alert('Proszę podać nazwę użytkownika');
      return;
    }
    
    // Podstawowa walidacja username
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(usernameValue.trim())) {
      alert('Nazwa użytkownika może zawierać tylko litery, cyfry i podkreślenia (3-20 znaków)');
      return;
    }
    
    onNext();
  };

  // 👈 POPRAWKA: Lepsze zarządzanie event listenerami
  useEffect(() => {
    const atSign = atSignRef.current;
    const input = inputRef.current;
    
    const handleAtSignClick = () => {
      if (input) {
        input.focus();
      }
    };
    
    if (atSign) {
      atSign.addEventListener('click', handleAtSignClick);
    }
    
    // Cleanup funkcja
    return () => {
      if (atSign) {
        atSign.removeEventListener('click', handleAtSignClick);
      }
    };
  }, []); // 👈 POPRAWKA: pusta tablica dependencies

  return (
    <div className="bg-[#0a0a0a]/95 rounded-3xl shadow-xl p-8 w-full h-[550px] flex flex-col shadow-[0_0_30px_10px_rgba(0,0,0,0.5)] border border-[#222222]">
      <form onSubmit={handleSubmit} className="flex flex-col space-y-6 flex-grow">
        {/* Pasek postępu - dynamiczny na podstawie kroku */}
        <div className="max-w-xs mx-auto w-full h-3 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] rounded-full transition-all duration-300" 
            style={{ width: '44%' }} // 👈 POPRAWKA: 4/9 kroków = ~44%
          ></div>
        </div>
        
        <div className="text-center mt-16"> {/* 👈 POPRAWKA: zmniejszono margines */}
          <h2 className="text-white text-2xl font-bold">Wybierz nazwę użytkownika</h2>
          <p className="text-white text-lg">Będzie ona widoczna dla innych użytkowników</p>
        </div>

        {/* Pole nazwy użytkownika z pływającą etykietą i stałym @ */}
        <div className="relative mt-8"> {/* 👈 POPRAWKA: zwiększono margines */}
          <div className="w-full bg-[#1D1D1D] text-white rounded-full py-4 px-5 outline-none text-lg flex items-center border-2 border-transparent focus-within:border-[#1DCD9F] transition-colors duration-200">
            {/* Stały znak @ w szarym kolorze */}
            <span 
              ref={atSignRef} 
              className="text-gray-400 select-none cursor-pointer"
              aria-label="Prefiks nazwy użytkownika"
            >
              @
            </span>
            
            {/* Właściwe pole input bez @ */}
            <input
              type="text"
              name="username"
              id="username"
              ref={inputRef}
              value={usernameValue}
              onChange={handleChange}
              onFocus={() => handleFocus('username')}
              onBlur={() => handleBlur('username')}
              className="bg-transparent outline-none flex-1 ml-1 text-white placeholder-gray-500"
              placeholder="nazwa_uzytkownika"
              required
              autoComplete="username"
              maxLength="20"
              minLength="3"
            />
          </div>
          
          <label 
            htmlFor="username"
            className={`absolute text-gray-400 transition-all duration-200 pointer-events-none ${
              focused.username || usernameValue
                ? 'text-xs -top-2 left-5 bg-[#0a0a0a] px-2' 
                : 'text-lg top-4 left-11' // 👈 POPRAWKA: dostosowano pozycję dla @
            }`}
          >
            Nazwa użytkownika
          </label>
          
          {/* Wskazówka walidacji */}
          <p className="text-gray-500 text-sm mt-2 ml-5">
            3-20 znaków: litery, cyfry, podkreślenia
          </p>
        </div>

        {/* Przyciski nawigacji */}
        <div className="mt-auto grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={onPrev}
            className="bg-[#1D1D1D] hover:bg-[#292929] text-white font-bold py-4 rounded-full transition-all duration-300"
          >
            Wstecz
          </button>
          <button
            type="submit"
            className="bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white font-bold py-4 rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] hover:brightness-110"
          >
            Dalej
          </button>
        </div>
      </form>
    </div>
  );
};

export default UsernameCard;
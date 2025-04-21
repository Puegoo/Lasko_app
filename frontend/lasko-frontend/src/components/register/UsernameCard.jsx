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
    updateFormData('username', '@' + cleanValue);
  };

  // Inicjalizacja stanu gdy formData się zmienia
  useEffect(() => {
    if (formData.username && formData.username !== '@') {
      // Usuń prefiks @ i ustaw wartość pola
      setUsernameValue(formData.username.replace(/@/g, ''));
    }
  }, []);

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
    
    // Sprawdź czy nazwa użytkownika ma jakąś wartość poza @
    if (!usernameValue || usernameValue.trim() === '') {
      alert('Proszę podać nazwę użytkownika');
      return;
    }
    
    onNext();
  };

  // Dostosowanie szerokości kontenera @ do rozmiaru tekstu
  useEffect(() => {
    if (atSignRef.current && inputRef.current) {
      // Upewnij się, że input otrzymuje focus w razie kliknięcia na @
      atSignRef.current.addEventListener('click', () => {
        inputRef.current.focus();
      });
    }
    
    return () => {
      if (atSignRef.current && inputRef.current) {
        atSignRef.current.removeEventListener('click', () => {
          inputRef.current.focus();
        });
      }
    };
  }, []);

  return (
    <div className="bg-[#0a0a0a]/95 rounded-3xl shadow-xl p-8 w-full h-[550px] flex flex-col shadow-[0_0_30px_10px_rgba(0,0,0,0.5)] border border-[#222222]">
      <form onSubmit={handleSubmit} className="flex flex-col space-y-6 flex-grow">
        {/* Pasek postępu - nad pytaniami, krótszy */}
        <div className="max-w-xs mx-auto w-full h-3 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] rounded-full" style={{ width: '80%' }}></div>
        </div>
        
        <div className="text-center mt-24">
          <h2 className="text-white text-2xl font-bold">Wybierz nazwę użytkownika</h2>
          <p className="text-white text-lg">Będzie ona widoczna dla innych użytkowników</p>
        </div>

        {/* Pole nazwy użytkownika z pływającą etykietą i stałym @ */}
        <div className="relative mt-2">
          <div className="w-full bg-[#1D1D1D] text-white rounded-full py-4 px-5 outline-none text-lg flex items-center">
            {/* Stały znak @ w szarym kolorze */}
            <span ref={atSignRef} className="text-gray-400 select-none">@</span>
            
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
              className="bg-transparent outline-none flex-1 ml-1"
              required
            />
          </div>
          
          <label 
            htmlFor="username"
            className={`absolute text-gray-400 transition-all duration-200 ${
              focused.username || usernameValue
                ? 'text-xs top-1 left-5' 
                : 'text-lg top-4 left-5 pl-6'
            }`}
          >
            Nazwa użytkownika
          </label>
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
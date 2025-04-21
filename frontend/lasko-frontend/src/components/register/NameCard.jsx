import React, { useState } from 'react';

const NameCard = ({ formData, updateFormData, onNext, onPrev }) => {
  // Stan do obsługi pływającej etykiety
  const [focused, setFocused] = useState({
    name: false
  });

  // Funkcja do obsługi zmiany w polu formularza
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
    onNext();
  };

  return (
    <div className="bg-[#0a0a0a]/95 rounded-3xl shadow-xl p-8 w-full h-[550px] flex flex-col shadow-[0_0_30px_10px_rgba(0,0,0,0.5)] border border-[#222222]">
      <form onSubmit={handleSubmit} className="flex flex-col space-y-6 flex-grow">
        {/* Pasek postępu - nad pytaniami, krótszy */}
        <div className="max-w-xs mx-auto w-full h-3 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] rounded-full" style={{ width: '40%' }}></div>
        </div>
        
        <div className="text-center mt-24">
          <h2 className="text-white text-2xl font-bold">Jak się nazywasz?</h2>
          <p className="text-white text-lg">Powiedz nam jak mamy się do Ciebie zwracać</p>
        </div>

        {/* Pole imię z pływającą etykietą */}
        <div className="relative mt-2">
          <input
            type="text"
            name="name"
            id="name"
            value={formData.name}
            onChange={handleChange}
            onFocus={() => handleFocus('name')}
            onBlur={() => handleBlur('name')}
            className="w-full bg-[#1D1D1D] text-white rounded-full py-4 px-5 outline-none text-lg"
            required
          />
          <label 
            htmlFor="name"
            className={`absolute text-gray-400 transition-all duration-200 ${
              focused.name || formData.name 
                ? 'text-xs top-1 left-5' 
                : 'text-lg top-4 left-5'
            }`}
          >
            Imię
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

export default NameCard;
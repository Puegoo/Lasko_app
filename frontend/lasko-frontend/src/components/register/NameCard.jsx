// Przykład jak powinna wyglądać NameCard z obsługą błędów walidacji
import React from 'react';

const NameCard = ({ 
  formData, 
  updateFormData, 
  validationErrors = {}, // DODANO: Błędy walidacji
  onNext, 
  onPrev, 
  isSubmitting 
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onNext();
    }
  };

  const isFormValid = formData.name.trim().length >= 2;

  return (
    <div className="bg-white rounded-3xl p-8 shadow-2xl w-full h-full flex flex-col">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Jak masz na imię?</h2>
        <p className="text-gray-600">Podaj swoje imię, abyśmy mogli się do Ciebie zwracać</p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="mb-6">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Imię *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => updateFormData('name', e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1DCD9F] focus:border-transparent transition-all text-lg ${
              validationErrors.first_name || validationErrors.username ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Twoje imię"
            disabled={isSubmitting}
            autoComplete="given-name"
            autoFocus
          />
          
          {/* Wyświetl błędy walidacji z backendu */}
          {validationErrors.first_name && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.first_name}</p>
          )}
          
          {validationErrors.username && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">
                <strong>Problem z nazwą użytkownika:</strong> {validationErrors.username}
              </p>
              <p className="text-red-600 text-xs mt-1">
                Nazwa użytkownika jest generowana automatycznie z Twojego imienia.
              </p>
            </div>
          )}
          
          {/* Podpowiedź dla użytkownika */}
          {formData.name && !validationErrors.first_name && !validationErrors.username && (
            <p className="text-green-600 text-sm mt-1">
              ✓ Nazwa użytkownika: {formData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}
            </p>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="mt-auto flex justify-between gap-4">
          <button
            type="button"
            onClick={onPrev}
            disabled={isSubmitting}
            className="px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            Wstecz
          </button>
          
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all ${
              isFormValid && !isSubmitting
                ? 'bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] hover:shadow-lg transform hover:-translate-y-1'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Ładowanie...' : 'Dalej'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NameCard;
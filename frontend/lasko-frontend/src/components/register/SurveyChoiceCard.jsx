import React from 'react';

const SurveyChoiceCard = ({ formData, updateFormData, onNext, onPrev }) => {
  
  const handleSurveyChoice = (choice) => {
    updateFormData('surveyChoice', choice);
    if (choice === 'skip') {
      // Pomiń ankietę - przejdź bezpośrednio do kreatora planu
      updateFormData('skipSurvey', true);
    } else {
      // Wypełni ankietę
      updateFormData('skipSurvey', false);
    }
    onNext();
  };

  return (
    <div className="bg-[#0a0a0a]/95 rounded-3xl shadow-xl p-8 w-full h-[550px] flex flex-col shadow-[0_0_30px_10px_rgba(0,0,0,0.5)] border border-[#222222]">
      <div className="flex flex-col space-y-6 flex-grow">
        {/* Pasek postępu */}
        <div className="max-w-xs mx-auto w-full h-3 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] rounded-full" style={{ width: '80%' }}></div>
        </div>
        
        <div className="text-center mt-16">
          <h2 className="text-white text-2xl font-bold mb-4">Prawie gotowe!</h2>
          <p className="text-white text-lg mb-8">Chcesz wypełnić krótką ankietę, aby dostać spersonalizowane rekomendacje planów treningowych?</p>
        </div>

        {/* Opcje wyboru */}
        <div className="flex-grow flex flex-col justify-center space-y-4">
          <button
            onClick={() => handleSurveyChoice('fill')}
            className="bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white font-bold py-6 rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] hover:brightness-110 text-lg"
          >
            Tak, wypełnię ankietę (2 minuty)
          </button>
          
          <button
            onClick={() => handleSurveyChoice('skip')}
            className="bg-[#1D1D1D] hover:bg-[#292929] text-white font-bold py-6 rounded-full transition-all duration-300 text-lg"
          >
            Pomiń - przejdź od razu do kreatora
          </button>
        </div>

        {/* Przycisk wstecz */}
        <div className="mt-auto">
          <button
            type="button"
            onClick={onPrev}
            className="w-full bg-[#1D1D1D] hover:bg-[#292929] text-white font-bold py-4 rounded-full transition-all duration-300"
          >
            Wstecz
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurveyChoiceCard;
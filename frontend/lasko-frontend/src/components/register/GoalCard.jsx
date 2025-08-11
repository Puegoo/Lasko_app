import React, { useState } from 'react';

const GoalCard = ({ formData, updateFormData, onNext, onPrev }) => {
  const [selectedGoal, setSelectedGoal] = useState(formData.goal || '');

  const goals = [
    { value: 'masa', label: 'Budowanie masy mięśniowej', description: 'Chcę zwiększyć masę i siłę' },
    { value: 'redukcja', label: 'Redukcja tkanki tłuszczowej', description: 'Chcę spalić tłuszcz i wyrzeźbić sylwetkę' },
    { value: 'siła', label: 'Zwiększenie siły', description: 'Chcę być silniejszy/silniejsza' }
  ];

  const handleGoalSelect = (goalValue) => {
    setSelectedGoal(goalValue);
    updateFormData('goal', goalValue);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedGoal) {
      alert('Proszę wybrać cel treningowy');
      return;
    }
    onNext();
  };

  return (
    <div className="bg-[#0a0a0a]/95 rounded-3xl shadow-xl p-8 w-full h-[550px] flex flex-col shadow-[0_0_30px_10px_rgba(0,0,0,0.5)] border border-[#222222]">
      <form onSubmit={handleSubmit} className="flex flex-col space-y-6 flex-grow">
        {/* Pasek postępu */}
        <div className="max-w-xs mx-auto w-full h-3 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] rounded-full" style={{ width: '25%' }}></div>
        </div>
        
        <div className="text-center mt-8">
          <h2 className="text-white text-2xl font-bold">Jaki jest Twój główny cel?</h2>
          <p className="text-white text-lg">Wybierz to, co najlepiej opisuje Twoje zamiary</p>
        </div>

        {/* Opcje celów */}
        <div className="flex-grow flex flex-col justify-center space-y-3">
          {goals.map((goal) => (
            <button
              key={goal.value}
              type="button"
              onClick={() => handleGoalSelect(goal.value)}
              className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                selectedGoal === goal.value
                  ? 'border-[#1DCD9F] bg-[#0D7A61]/20 text-white'
                  : 'border-[#333333] bg-[#1D1D1D] text-gray-300 hover:border-[#555555] hover:bg-[#252525]'
              }`}
            >
              <div className="font-bold text-lg">{goal.label}</div>
              <div className="text-sm opacity-80 mt-1">{goal.description}</div>
            </button>
          ))}
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

export default GoalCard;
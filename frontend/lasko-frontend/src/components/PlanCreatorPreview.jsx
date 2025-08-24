// frontend/lasko-frontend/src/components/PlanCreatorPreview.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Mock ćwiczeń dla rekomendowanego planu
const generateMockExercises = (goal, level, equipment) => {
  const baseExercises = {
    masa: [
      { name: 'Wyciskanie sztangi na ławce', sets: 4, reps: '8-10', rest: '2-3 min', muscle: 'Klatka piersiowa' },
      { name: 'Przysiad ze sztangą', sets: 4, reps: '8-12', rest: '3 min', muscle: 'Nogi' },
      { name: 'Wiosłowanie sztangą', sets: 4, reps: '8-10', rest: '2-3 min', muscle: 'Plecy' },
      { name: 'Wyciskanie nad głowę', sets: 3, reps: '8-12', rest: '2 min', muscle: 'Barki' },
      { name: 'Martwy ciąg', sets: 3, reps: '6-8', rest: '3 min', muscle: 'Plecy/Nogi' },
      { name: 'Uginanie bicepsów', sets: 3, reps: '10-12', rest: '90s', muscle: 'Biceps' }
    ],
    siła: [
      { name: 'Przysiad ze sztangą', sets: 5, reps: '5', rest: '3-5 min', muscle: 'Nogi' },
      { name: 'Wyciskanie sztangi na ławce', sets: 5, reps: '5', rest: '3-5 min', muscle: 'Klatka piersiowa' },
      { name: 'Martwy ciąg', sets: 5, reps: '5', rest: '3-5 min', muscle: 'Plecy/Nogi' },
      { name: 'Wyciskanie nad głowę', sets: 5, reps: '5', rest: '3 min', muscle: 'Barki' },
      { name: 'Wiosłowanie sztangą', sets: 4, reps: '6-8', rest: '3 min', muscle: 'Plecy' }
    ],
    redukcja: [
      { name: 'Burpees', sets: 4, reps: '10-15', rest: '60s', muscle: 'Całe ciało' },
      { name: 'Przysiad z wyskokiem', sets: 4, reps: '15-20', rest: '60s', muscle: 'Nogi' },
      { name: 'Pompki', sets: 4, reps: '12-20', rest: '60s', muscle: 'Klatka piersiowa' },
      { name: 'Plank', sets: 3, reps: '30-60s', rest: '60s', muscle: 'Brzuch' },
      { name: 'Mountain climbers', sets: 4, reps: '20-30', rest: '45s', muscle: 'Kardio' },
      { name: 'Unoszenie nóg w zwisie', sets: 3, reps: '10-15', rest: '60s', muscle: 'Brzuch' }
    ]
  };

  return baseExercises[goal] || baseExercises.masa;
};

const PlanCreatorPreview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData, recommendedPlan, viewMode, canReturn } = location.state || {};
  
  const [selectedDay, setSelectedDay] = useState(1);
  const [planData, setPlanData] = useState(recommendedPlan);
  
  // Generuj mock ćwiczeń na podstawie preferencji użytkownika
  const exercises = generateMockExercises(userData?.goal, userData?.level, userData?.equipmentPreference);
  
  // Mock dni treningowych
  const trainingDays = [
    { day: 1, name: 'Dzień 1 - Full Body A', focus: 'Główne grupy mięśniowe' },
    { day: 2, name: 'Dzień 2 - Full Body B', focus: 'Uzupełniające ćwiczenia' },
    { day: 3, name: 'Dzień 3 - Full Body C', focus: 'Intensywność i wytrzymałość' }
  ];

  const handleBackToRegistration = () => {
    if (canReturn) {
      navigate('/register', { 
        state: { 
          continueFrom: 'recommendation-result',
          userData: userData 
        }
      });
    } else {
      navigate('/dashboard');
    }
  };

  const handleSavePlan = () => {
    // Tutaj będzie logika zapisywania planu
    console.log('Zapisywanie planu:', planData);
    
    if (canReturn) {
      // Wróć do rejestracji z zaakceptowanym planem
      navigate('/register', { 
        state: { 
          continueFrom: 'final-registration',
          userData: { ...userData, acceptedPlan: planData }
        }
      });
    } else {
      // Przejdź do dashboard
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="bg-[#1D1D1D] border-b border-[#292929] p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Kreator Planu Treningowego</h1>
            <p className="text-[#e0e0e0] mt-1">
              {viewMode ? 'Podgląd rekomendowanego planu' : 'Dostosuj plan do swoich potrzeb'}
            </p>
          </div>
          
          <div className="flex gap-3">
            {canReturn && (
              <button
                onClick={handleBackToRegistration}
                className="bg-[#333333] text-white px-6 py-2 rounded-xl hover:bg-[#444444] transition-colors"
              >
                Wróć do rejestracji
              </button>
            )}
            
            <button
              onClick={handleSavePlan}
              className="bg-[#1DCD9F] text-black px-6 py-2 rounded-xl hover:bg-[#1BB894] transition-colors font-semibold"
            >
              {canReturn ? 'Akceptuj plan' : 'Zapisz plan'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar - Informacje o planie */}
          <div className="lg:col-span-1">
            <div className="bg-[#1D1D1D] rounded-xl p-6 border border-[#292929] sticky top-6">
              <h3 className="text-lg font-bold text-white mb-4">Informacje o planie</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-[#e0e0e0] mb-1">Nazwa planu</div>
                  <div className="text-white font-semibold">{planData?.name}</div>
                </div>
                
                <div>
                  <div className="text-sm text-[#e0e0e0] mb-1">Czas trwania</div>
                  <div className="text-[#1DCD9F] font-semibold">{planData?.duration}</div>
                </div>
                
                <div>
                  <div className="text-sm text-[#e0e0e0] mb-1">Częstotliwość</div>
                  <div className="text-[#1DCD9F] font-semibold">{planData?.frequency}</div>
                </div>
                
                <div>
                  <div className="text-sm text-[#e0e0e0] mb-1">Dopasowanie</div>
                  <div className="bg-[#1DCD9F] text-black px-2 py-1 rounded-full text-sm font-semibold inline-block">
                    {planData?.match}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-[#e0e0e0] mb-2">Twoje preferencje</div>
                  <div className="space-y-1 text-sm">
                    <div>Cel: <span className="text-[#1DCD9F]">{userData?.goal}</span></div>
                    <div>Poziom: <span className="text-[#1DCD9F]">{userData?.level}</span></div>
                    <div>Sprzęt: <span className="text-[#1DCD9F]">{userData?.equipmentPreference}</span></div>
                    <div>Dni/tydzień: <span className="text-[#1DCD9F]">{userData?.trainingDaysPerWeek}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Plan treningowy */}
          <div className="lg:col-span-3">
            
            {/* Wybór dnia treningowego */}
            <div className="bg-[#1D1D1D] rounded-xl p-6 border border-[#292929] mb-6">
              <h3 className="text-lg font-bold text-white mb-4">Wybierz dzień treningowy</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {trainingDays.map((day) => (
                  <button
                    key={day.day}
                    onClick={() => setSelectedDay(day.day)}
                    className={`p-4 rounded-xl transition-all ${
                      selectedDay === day.day
                        ? 'bg-[#1DCD9F] text-black'
                        : 'bg-[#0a0a0a] text-white hover:bg-[#333333]'
                    } border border-[#292929]`}
                  >
                    <div className="font-semibold">{day.name}</div>
                    <div className={`text-sm mt-1 ${selectedDay === day.day ? 'text-black' : 'text-[#e0e0e0]'}`}>
                      {day.focus}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Lista ćwiczeń */}
            <div className="bg-[#1D1D1D] rounded-xl p-6 border border-[#292929]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">
                  Ćwiczenia - {trainingDays.find(d => d.day === selectedDay)?.name}
                </h3>
                <div className="text-sm text-[#e0e0e0]">
                  {exercises.length} ćwiczeń
                </div>
              </div>

              <div className="space-y-4">
                {exercises.map((exercise, index) => (
                  <div key={index} className="bg-[#0a0a0a] rounded-lg p-4 border border-[#292929]">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-white font-semibold">{exercise.name}</h4>
                        <div className="text-sm text-[#1DCD9F] mt-1">{exercise.muscle}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-[#e0e0e0]">Serie × Powtórzenia</div>
                        <div className="text-white font-semibold">{exercise.sets} × {exercise.reps}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-[#e0e0e0]">
                        Przerwa: <span className="text-white">{exercise.rest}</span>
                      </div>
                      <button className="text-[#1DCD9F] hover:text-[#1BB894] transition-colors">
                        Edytuj ćwiczenie
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dodaj ćwiczenie */}
              <button className="w-full mt-6 bg-[#333333] text-white py-3 px-6 rounded-xl hover:bg-[#444444] transition-colors border-2 border-dashed border-[#555555]">
                + Dodaj ćwiczenie
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanCreatorPreview;
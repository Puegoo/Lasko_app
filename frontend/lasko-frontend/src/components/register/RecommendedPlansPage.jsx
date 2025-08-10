import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

const RecommendedPlansPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [recommendedPlans, setRecommendedPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const surveyData = location.state?.surveyData;

  useEffect(() => {
    if (!surveyData) {
      navigate('/register');
      return;
    }
    
    // Symulacja ładowania rekomendacji
    fetchRecommendedPlans();
  }, [surveyData, navigate]);

  const fetchRecommendedPlans = async () => {
    try {
      setLoading(true);
      
      // Tutaj będzie zapytanie do backendu z algorytmem rekomendacji
      // Na razie symulujemy dane
      const mockPlans = [
        {
          id: 1,
          name: `Plan ${surveyData.trainingDaysPerWeek}-dniowy: ${surveyData.goal.charAt(0).toUpperCase() + surveyData.goal.slice(1)}`,
          description: `Idealny plan dla poziomu ${surveyData.level} z ${surveyData.trainingDaysPerWeek} dniami treningowymi`,
          score: 95,
          matchReasons: [
            `Dopasowany cel: ${surveyData.goal}`,
            `Poziom: ${surveyData.level}`,
            `${surveyData.trainingDaysPerWeek} dni w tygodniu`,
            `Sprzęt: ${surveyData.equipmentPreference}`
          ],
          duration: '8 tygodni',
          difficulty: surveyData.level,
          equipment: surveyData.equipmentPreference
        },
        {
          id: 2,
          name: `Alternatywny plan ${surveyData.goal}`,
          description: `Zmodyfikowany plan dla Twojego celu`,
          score: 87,
          matchReasons: [
            `Dopasowany cel: ${surveyData.goal}`,
            `Elastyczne dni treningowe`,
            `Sprzęt: ${surveyData.equipmentPreference}`
          ],
          duration: '6 tygodni',
          difficulty: surveyData.level,
          equipment: surveyData.equipmentPreference
        },
        {
          id: 3,
          name: `Plan progresywny ${surveyData.goal}`,
          description: `Plan z progresywnym wzrostem intensywności`,
          score: 82,
          matchReasons: [
            `Cel: ${surveyData.goal}`,
            `Progresywny dla poziomu ${surveyData.level}`,
            `Sprzęt: ${surveyData.equipmentPreference}`
          ],
          duration: '12 tygodni',
          difficulty: surveyData.level,
          equipment: surveyData.equipmentPreference
        }
      ];
      
      setTimeout(() => {
        setRecommendedPlans(mockPlans);
        setLoading(false);
      }, 1500);
      
    } catch (error) {
      console.error('Błąd podczas pobierania rekomendacji:', error);
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    // Tutaj będzie logika aktywacji planu
    console.log('Wybrano plan:', plan);
    // Przekierowanie do dashboardu z aktywnym planem
    navigate('/dashboard', { state: { activePlan: plan } });
  };

  const goToPlanCreator = () => {
    navigate('/plan-creator');
  };

  if (!surveyData) {
    return null;
  }

  return (
    <div 
      className="min-h-screen w-full px-4 py-10"
      style={{
        backgroundImage: "url('/src/assets/Photos/Register_background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative"
      }}
    >
      {/* Ciemna nakładka */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] to-[#0D7A61]/90 opacity-90"
        style={{ mixBlendMode: "multiply" }}
      ></div>
      
      {/* Logo */}
      <div className="absolute top-8 left-8 z-10">
        <Link to="/">
          <h1 className="text-[#1DCD9F] text-5xl font-bold">Lasko</h1>
        </Link>
      </div>

      <div className="max-w-6xl mx-auto z-10 relative pt-20">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-white text-4xl font-bold mb-4">
            Rekomendowane plany dla Ciebie
          </h1>
          <p className="text-gray-300 text-lg">
            Na podstawie Twojej ankiety przygotowaliśmy najlepsze plany treningowe
          </p>
        </div>

        {loading ? (
          /* Loading spinner */
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#1DCD9F]"></div>
            <span className="text-white text-lg ml-4">Analizujemy Twoje odpowiedzi...</span>
          </div>
        ) : (
          <>
            {/* Plany */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {recommendedPlans.map((plan, index) => (
                <div
                  key={plan.id}
                  className="bg-[#0a0a0a]/95 rounded-3xl p-6 border border-[#222222] shadow-[0_0_30px_10px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-[#1DCD9F]/50"
                >
                  {/* Badge z dopasowaniem */}
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white px-3 py-1 rounded-full text-sm font-bold">
                      {plan.score}% dopasowania
                    </span>
                    {index === 0 && (
                      <span className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                        NAJLEPSZY
                      </span>
                    )}
                  </div>

                  <h3 className="text-white text-xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-300 text-sm mb-4">{plan.description}</p>

                  {/* Detale planu */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Czas trwania:</span>
                      <span className="text-white">{plan.duration}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Poziom:</span>
                      <span className="text-white">{plan.difficulty}</span>
                    </div>
                  </div>

                  {/* Powody dopasowania */}
                  <div className="mb-6">
                    <h4 className="text-white text-sm font-bold mb-2">Dlaczego to dopasowanie:</h4>
                    <ul className="space-y-1">
                      {plan.matchReasons.map((reason, i) => (
                        <li key={i} className="text-[#1DCD9F] text-xs flex items-center">
                          <span className="mr-2">✓</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Przycisk wyboru */}
                  <button
                    onClick={() => handlePlanSelect(plan)}
                    className="w-full bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white font-bold py-3 rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] hover:brightness-110"
                  >
                    Wybierz ten plan
                  </button>
                </div>
              ))}
            </div>

            {/* Alternatywna opcja */}
            <div className="text-center">
              <div className="bg-[#1D1D1D] rounded-2xl p-6 border border-[#333333] max-w-md mx-auto">
                <h3 className="text-white text-lg font-bold mb-2">
                  Żaden plan Ci nie pasuje?
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Stwórz własny plan treningowy w kreatorze
                </p>
                <button
                  onClick={goToPlanCreator}
                  className="w-full bg-[#1D1D1D] hover:bg-[#292929] border border-[#555555] text-white font-bold py-3 rounded-full transition-all duration-300"
                >
                  Przejdź do kreatora planu
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RecommendedPlansPage;
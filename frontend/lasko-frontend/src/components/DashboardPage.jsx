// frontend/lasko-frontend/src/components/DashboardPage.jsx (NAPRAWIONY BŁĄD SKŁADNI)
import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import RegisterBackground from '../assets/Photos/Register_background.png';

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  
  // Stan z poprzedniego kroku (po aktywacji planu)
  const activePlan = location.state?.activePlan;
  const createdPlan = location.state?.createdPlan;
  const displayPlan = activePlan || createdPlan;
  
  // Stan lokalny
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [userPlans, setUserPlans] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState(null);

  // Pobierz dane użytkownika przy załadowaniu
  useEffect(() => {
    if (isAuthenticated()) {
      fetchUserData();
    }
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // ✅ profil (via apiService → auto-refresh + spójny format)
      const profileData = await apiService.fetchUserProfile();
      if (profileData?.profile) {
        setUserProfile(profileData.profile);
        console.log('✅ Profil użytkownika załadowany:', profileData.profile);
      }

      // ✅ rekomendacje (ujednolicony endpoint POST /api/recommendations/)
      const recoData = await apiService.generateRecommendations('hybrid', {});
      setRecommendations(recoData?.recommendations || []);
      console.log('✅ Rekomendacje załadowane:', recoData?.recommendations);

    } catch (err) {
      console.error('❌ Błąd ładowania danych:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCreateNewPlan = () => {
    navigate('/enhanced-plan-creator');
  };

  const handleEditProfile = () => {
    navigate('/profile/edit');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1DCD9F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Ładowanie dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen w-full px-4 py-10"
      style={{
        backgroundImage: `url(${RegisterBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative"
      }}
    >
      {/* Ciemna nakładka */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] to-[#0D7A61]/90 opacity-90"
        style={{ mixBlendMode: "multiply" }}
      />
      
      {/* Nawigacja */}
      <nav className="relative z-10 max-w-7xl mx-auto flex justify-between items-center mb-8">
        <Link to="/">
          <h1 className="text-[#1DCD9F] text-4xl font-bold">Lasko</h1>
        </Link>
        
        <div className="flex items-center space-x-4">
          <span className="text-white">Witaj, {user?.username || 'Użytkowniku'}!</span>
          <button
            onClick={handleLogout}
            className="text-gray-300 hover:text-white transition-colors"
          >
            Wyloguj
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto z-10 relative">
        
        {/* Błąd */}
        {error && (
          <div className="bg-red-900/20 border border-red-400/60 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Welcome message */}
        <div className="text-center mb-8">
          <h1 className="text-white text-4xl font-bold mb-4">
            {displayPlan ? 'Plan aktywowany! 🎉' : 'Twój Dashboard'}
          </h1>
          <p className="text-gray-300 text-lg">
            {displayPlan 
              ? 'Gratulacje! Twój plan treningowy jest już aktywny.'
              : 'Zarządzaj swoimi treningami i śledź postępy'
            }
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Lewa kolumna - Aktywny plan / Szybkie akcje */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Kondycjonalne renderowanie - NAPRAWIONE */}
            {displayPlan ? (
              /* Aktywny plan */
              <div className="bg-[#0a0a0a]/95 rounded-3xl shadow-xl p-6 border border-[#222222]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] rounded-full flex items-center justify-center">
                      <span className="text-white text-xl">🎯</span>
                    </div>
                    <div>
                      <h2 className="text-white text-xl font-bold">Aktywny plan</h2>
                      <p className="text-gray-400 text-sm">
                        {displayPlan.biometricMatch ? 'Dopasowany z analizą biometryczną' : 'Twój plan treningowy'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#1DCD9F] text-sm font-bold">
                      {displayPlan.matchPercentage ? `${displayPlan.matchPercentage}% dopasowania` : 'Aktywny'}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-white text-2xl font-bold mb-2">
                    {displayPlan.name || displayPlan.originalPlanName || 'Twój plan treningowy'}
                  </h3>
                  <p className="text-gray-300">
                    {displayPlan.description || `Plan treningowy dostosowany do Twoich celów`}
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-[#1D1D1D] rounded-xl border border-[#333333]">
                    <div className="text-[#1DCD9F] text-2xl font-bold">
                      {displayPlan.trainingDaysPerWeek || displayPlan.trainingDays || '3'}
                    </div>
                    <div className="text-gray-400 text-xs">dni/tydzień</div>
                  </div>
                  
                  <div className="text-center p-3 bg-[#1D1D1D] rounded-xl border border-[#333333]">
                    <div className="text-[#1DCD9F] text-2xl font-bold">
                      {displayPlan.sessionDuration || '60'}
                    </div>
                    <div className="text-gray-400 text-xs">min/sesja</div>
                  </div>

                  <div className="text-center p-3 bg-[#1D1D1D] rounded-xl border border-[#333333]">
                    <div className="text-[#1DCD9F] text-2xl font-bold">
                      {displayPlan.durationWeeks || displayPlan.planDuration || '12'}
                    </div>
                    <div className="text-gray-400 text-xs">tygodni</div>
                  </div>

                  <div className="text-center p-3 bg-[#1D1D1D] rounded-xl border border-[#333333]">
                    <div className="text-[#1DCD9F] text-2xl font-bold">0</div>
                    <div className="text-gray-400 text-xs">treningów</div>
                  </div>
                </div>

                {/* Powody dopasowania */}
                {displayPlan.matchReasons && displayPlan.matchReasons.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-white text-sm font-bold mb-3">Dlaczego ten plan?</h4>
                    <div className="flex flex-wrap gap-2">
                      {displayPlan.matchReasons.map((reason, index) => (
                        <span 
                          key={index}
                          className="bg-[#1DCD9F]/10 text-[#1DCD9F] text-xs px-3 py-1 rounded-full border border-[#1DCD9F]/20"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button className="flex-1 bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white px-4 py-3 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] transition-all">
                    Rozpocznij trening
                  </button>
                  <button className="px-6 py-3 bg-[#1D1D1D] text-white rounded-xl hover:bg-[#292929] transition-colors">
                    Szczegóły planu
                  </button>
                </div>
              </div>
            ) : (
              /* Brak aktywnego planu - NAPRAWIONE NAWIASY */
              <div className="bg-[#0a0a0a]/95 rounded-3xl shadow-xl p-8 border border-[#222222] text-center">
                <div className="w-20 h-20 bg-[#1D1D1D] rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">💪</span>
                </div>
                <h2 className="text-white text-2xl font-bold mb-4">
                  Stwórz swój pierwszy plan treningowy
                </h2>
                <p className="text-gray-400 mb-8">
                  Algorytm AI przeanalizuje Twoje cele, poziom zaawansowania i dane biometryczne, 
                  aby stworzyć idealny plan dopasowany tylko do Ciebie.
                </p>
                <button 
                  onClick={handleCreateNewPlan}
                  className="bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white px-8 py-4 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] hover:brightness-110 transition-all"
                >
                  Stwórz plan treningowy
                </button>
              </div>
            )}

            {/* Szybkie akcje */}
            <div className="bg-[#0a0a0a]/95 rounded-3xl shadow-xl p-6 border border-[#222222]">
              <h2 className="text-white text-xl font-bold mb-6">Szybkie akcje</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { icon: '📊', title: 'Postępy', desc: 'Śledź wyniki', action: () => console.log('Postępy') },
                  { icon: '🏋️‍♂️', title: 'Ćwiczenia', desc: 'Biblioteka ćwiczeń', action: () => console.log('Ćwiczenia') },
                  { icon: '🎯', title: 'Cele', desc: 'Zarządzaj celami', action: () => console.log('Cele') },
                  { icon: '⚙️', title: 'Ustawienia', desc: 'Preferencje', action: handleEditProfile },
                  { icon: '📱', title: 'Aplikacja', desc: 'Pobierz aplikację', action: () => console.log('App') },
                  { icon: '❓', title: 'Pomoc', desc: 'Centrum pomocy', action: () => console.log('Pomoc') },
                ].map((item, index) => (
                  <button
                    key={index}
                    onClick={item.action}
                    className="p-4 bg-[#1D1D1D] rounded-xl border border-[#333333] hover:border-[#1DCD9F]/50 transition-all text-left group"
                  >
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <div className="text-white text-sm font-bold group-hover:text-[#1DCD9F] transition-colors">
                      {item.title}
                    </div>
                    <div className="text-gray-400 text-xs">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Prawa kolumna - Profil i rekomendacje */}
          <div className="space-y-6">
            
            {/* Profil użytkownika */}
            <div className="bg-[#0a0a0a]/95 rounded-3xl shadow-xl p-6 border border-[#222222]">
              <h2 className="text-white text-lg font-bold mb-4">Twój profil</h2>
              
              {userProfile ? (
                <div className="space-y-4">
                  <div className="text-center pb-4 border-b border-gray-700">
                    <div className="w-16 h-16 bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white text-xl font-bold">
                        {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <h3 className="text-white font-bold">{user?.username}</h3>
                    <p className="text-gray-400 text-sm">{user?.email}</p>
                  </div>
                  
                  {/* Dane biometryczne */}
                  {(userProfile.age || userProfile.weight_kg || userProfile.height_cm || userProfile.bmi) && (
                    <div>
                      <h4 className="text-white text-sm font-bold mb-2">Dane biometryczne</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {userProfile.age && (
                          <div className="bg-[#1D1D1D] p-2 rounded-lg">
                            <span className="text-gray-500">Wiek:</span>
                            <span className="text-white ml-1">{userProfile.age} lat</span>
                          </div>
                        )}
                        {userProfile.weight_kg && (
                          <div className="bg-[#1D1D1D] p-2 rounded-lg">
                            <span className="text-gray-500">Waga:</span>
                            <span className="text-white ml-1">{userProfile.weight_kg} kg</span>
                          </div>
                        )}
                        {userProfile.height_cm && (
                          <div className="bg-[#1D1D1D] p-2 rounded-lg">
                            <span className="text-gray-500">Wzrost:</span>
                            <span className="text-white ml-1">{userProfile.height_cm} cm</span>
                          </div>
                        )}
                        {userProfile.bmi && (
                          <div className="bg-[#1D1D1D] p-2 rounded-lg">
                            <span className="text-gray-500">BMI:</span>
                            <span className={`ml-1 ${
                              userProfile.bmi_category === 'normal' ? 'text-green-400' :
                              userProfile.bmi_category === 'overweight' ? 'text-yellow-400' :
                              userProfile.bmi_category === 'obese' ? 'text-red-400' : 'text-blue-400'
                            }`}>
                              {userProfile.bmi}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Preferencje treningowe */}
                  {(userProfile.goal || userProfile.level || userProfile.equipment_preference) && (
                    <div>
                      <h4 className="text-white text-sm font-bold mb-2">Preferencje</h4>
                      <div className="space-y-2 text-sm">
                        {userProfile.goal && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Cel:</span>
                            <span className="text-white">{userProfile.goal}</span>
                          </div>
                        )}
                        {userProfile.level && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Poziom:</span>
                            <span className="text-white">{userProfile.level}</span>
                          </div>
                        )}
                        {userProfile.equipment_preference && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Sprzęt:</span>
                            <span className="text-white">{userProfile.equipment_preference}</span>
                          </div>
                        )}
                        {userProfile.training_days_per_week && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Dni/tydz:</span>
                            <span className="text-white">{userProfile.training_days_per_week}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <button 
                    onClick={handleEditProfile}
                    className="w-full bg-[#1D1D1D] text-white px-4 py-3 rounded-xl hover:bg-[#292929] transition-colors"
                  >
                    Edytuj profil
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-400 mb-4">Uzupełnij swój profil</p>
                  <button 
                    onClick={handleEditProfile}
                    className="bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white px-4 py-2 rounded-xl font-bold"
                  >
                    Uzupełnij profil
                  </button>
                </div>
              )}
            </div>

            {/* Rekomendacje planów */}
            {recommendations.length > 0 && (
              <div className="bg-[#0a0a0a]/95 rounded-3xl shadow-xl p-6 border border-[#222222]">
                <h2 className="text-white text-lg font-bold mb-4">Polecane plany</h2>
                <div className="space-y-3">
                  {recommendations.slice(0, 3).map((plan, index) => (
                    <div 
                      key={index}
                      className="p-4 bg-[#1D1D1D] rounded-xl border border-[#333333] hover:border-[#1DCD9F]/50 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white text-sm font-bold">{plan.name}</h3>
                        {plan.matchPercentage && (
                          <span className="text-[#1DCD9F] text-xs">
                            {plan.matchPercentage}%
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs">{plan.description}</p>
                      {plan.matchReasons && plan.matchReasons.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {plan.matchReasons.slice(0, 2).map((reason, ridx) => (
                            <span 
                              key={ridx}
                              className="bg-[#1DCD9F]/10 text-[#1DCD9F] text-xs px-2 py-1 rounded"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button 
                  onClick={handleCreateNewPlan}
                  className="w-full mt-4 bg-[#1D1D1D] text-white px-4 py-3 rounded-xl hover:bg-[#292929] transition-colors"
                >
                  Zobacz więcej planów
                </button>
              </div>
            )}

            {/* Tips */}
            <div className="bg-[#0a0a0a]/95 rounded-3xl shadow-xl p-6 border border-[#222222]">
              <h2 className="text-white text-lg font-bold mb-4">💡 Wskazówka</h2>
              <p className="text-gray-300 text-sm mb-4">
                Regularnie aktualizuj swoje dane biometryczne, aby algorytm mógł lepiej 
                dostosowywać plany do Twoich postępów.
              </p>
              <Link 
                to="/profile/edit" 
                className="text-[#1DCD9F] text-sm hover:text-white transition-colors"
              >
                Aktualizuj dane →
              </Link>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">
            Potrzebujesz pomocy?{' '}
            <Link to="/help" className="text-[#1DCD9F] hover:text-white transition-colors">
              Skontaktuj się z nami
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import RegisterBackground from '../assets/Photos/Register_background.png';

const DashboardPage = () => {
  const location = useLocation();
  const activePlan = location.state?.activePlan;
  const createdPlan = location.state?.createdPlan;

  const displayPlan = activePlan || createdPlan;

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
      ></div>
      
      {/* Logo */}
      <div className="absolute top-8 left-8 z-10">
        <Link to="/">
          <h1 className="text-[#1DCD9F] text-5xl font-bold">Lasko</h1>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto z-10 relative pt-20">
        {/* Welcome message */}
        <div className="text-center mb-8">
          <h1 className="text-white text-4xl font-bold mb-4">
            Witaj w Lasko! 🎉
          </h1>
          <p className="text-gray-300 text-lg">
            Gratulacje! Twoje konto zostało utworzone pomyślnie.
          </p>
        </div>

        {/* Plan info */}
        {displayPlan && (
          <div className="bg-[#0a0a0a]/95 rounded-3xl shadow-xl p-8 border border-[#222222] shadow-[0_0_30px_10px_rgba(0,0,0,0.5)] mb-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
                <span>✨</span>
                <span>Aktywny plan</span>
              </div>
              <h2 className="text-white text-2xl font-bold">
                {displayPlan.name || 'Twój nowy plan treningowy'}
              </h2>
              <p className="text-gray-300 mt-2">
                {displayPlan.description || `Plan treningowy dostosowany do Twoich celów`}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-[#1D1D1D] rounded-2xl border border-[#333333]">
                <div className="text-[#1DCD9F] text-3xl font-bold">
                  {displayPlan.trainingDays || displayPlan.trainingDaysPerWeek || '3'}
                </div>
                <div className="text-gray-400 text-sm">dni treningowych</div>
              </div>
              
              <div className="text-center p-4 bg-[#1D1D1D] rounded-2xl border border-[#333333]">
                <div className="text-[#1DCD9F] text-3xl font-bold">
                  {displayPlan.duration || `${displayPlan.planDuration || 8} tygodni`}
                </div>
                <div className="text-gray-400 text-sm">czas trwania</div>
              </div>
              
              <div className="text-center p-4 bg-[#1D1D1D] rounded-2xl border border-[#333333]">
                <div className="text-[#1DCD9F] text-lg font-bold">
                  {displayPlan.goal || displayPlan.difficulty || 'Cel'}
                </div>
                <div className="text-gray-400 text-sm">główny cel</div>
              </div>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#0a0a0a]/95 rounded-3xl p-6 border border-[#222222] shadow-[0_0_20px_5px_rgba(0,0,0,0.3)]">
            <div className="text-center">
              <div className="text-4xl mb-4">🏋️‍♂️</div>
              <h3 className="text-white text-xl font-bold mb-2">Rozpocznij trening</h3>
              <p className="text-gray-300 text-sm mb-4">
                Czas na pierwszy trening z Twoim nowym planem
              </p>
              <button className="w-full bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white font-bold py-3 rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] hover:brightness-110">
                Start treningu
              </button>
            </div>
          </div>

          <div className="bg-[#0a0a0a]/95 rounded-3xl p-6 border border-[#222222] shadow-[0_0_20px_5px_rgba(0,0,0,0.3)]">
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-white text-xl font-bold mb-2">Twoje postępy</h3>
              <p className="text-gray-300 text-sm mb-4">
                Śledź swoje osiągnięcia i postępy
              </p>
              <button className="w-full bg-[#1D1D1D] hover:bg-[#292929] border border-[#333333] text-white font-bold py-3 rounded-full transition-all duration-300">
                Zobacz statystyki
              </button>
            </div>
          </div>
        </div>

        {/* Next steps */}
        <div className="bg-[#0D7A61]/10 border border-[#0D7A61]/30 rounded-2xl p-6">
          <h3 className="text-[#1DCD9F] font-bold text-lg mb-4">Co dalej?</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-white">
              <span className="text-[#1DCD9F]">✓</span>
              <span>Konto zostało utworzone</span>
            </div>
            <div className="flex items-center space-x-3 text-white">
              <span className="text-[#1DCD9F]">✓</span>
              <span>Plan treningowy został {activePlan ? 'wybrany' : 'utworzony'}</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-300">
              <span className="text-gray-500">○</span>
              <span>Rozpocznij swój pierwszy trening</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-300">
              <span className="text-gray-500">○</span>
              <span>Uzupełnij profil użytkownika</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            Potrzebujesz pomocy? Sprawdź nasz{' '}
            <Link to="/help" className="text-[#1DCD9F] hover:text-white transition-colors">
              przewodnik dla początkujących
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
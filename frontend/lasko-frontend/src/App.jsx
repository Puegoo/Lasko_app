// frontend/lasko-frontend/src/App.jsx - NAPRAWIONY - USUŃ PODWÓJNY ROUTER
import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom'; // ✅ USUNIĘTO Router i BrowserRouter
import { useAuth } from './contexts/AuthContext'; // ✅ USUNIĘTO AuthProvider import

// Komponenty
import RegistrationContainer from './components/register/RegistrationContainer.jsx';
import AlgorithmChoicePage from './components/register/AlgorithmChoicePage';
import EnhancedPlanCreator from './components/register/EnhancedPlanCreator';
import DashboardPage from './components/DashboardPage';
import PlanCreatorPreview from './components/PlanCreatorPreview';
import LoginPage from './components/auth/LoginPage';
import PlanSummary from './components/register/PlanSummary.jsx';

// Assets
import laskoHi from './assets/Lasko_pose/Lasko_Hi.png';
import whoIsLasko from './assets/Lasko_pose/whoislasko.png';
import laskoCropHi from './assets/Lasko_pose/Lasko_crop_Hi.png';
import instagramIcon from './assets/icons/instagram.svg';
import twitterIcon from './assets/icons/twitter.svg';
import tiktokIcon from './assets/icons/tiktok.svg';
import facebookIcon from './assets/icons/facebook.svg';

// Pomocniczy komponent do ochrony tras
const ProtectedRoute = ({ children }) => {
  // opierajmy się na funkcji isAuthenticated z kontekstu (jest odporna na opóźnienia inicjalizacji) 
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1DCD9F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Ładowanie...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

// Pomocniczy nagłówek sekcji
const SectionHeading = ({ kicker, title, subtitle }) => (
  <div className="text-center max-w-3xl mx-auto mb-8">
    {kicker && (
      <p className="text-[#1DCD9F] uppercase tracking-widest text-sm font-extrabold mb-2">{kicker}</p>
    )}
    <h3 className="text-white text-3xl md:text-4xl font-black mb-3">{title}</h3>
    {subtitle && <p className="text-[#e0e0e0] text-lg">{subtitle}</p>}
  </div>
);

// Strona główna (landing page)
const HomePage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      
      {/* Nawigacja */}
      <nav className="fixed top-0 left-0 right-0 bg-black/90 backdrop-blur-sm z-50 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-[#1DCD9F] text-3xl font-bold">
            Lasko
          </Link>
          
          <div className="flex items-center space-x-6">
            {user ? (
              <>
                <span className="text-white">Witaj, {user.username}!</span>
                <Link 
                  to="/dashboard"
                  className="bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white px-6 py-3 rounded-full font-bold hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] transition-all duration-300"
                >
                  Dashboard
                </Link>
                <button 
                  onClick={logout}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Wyloguj
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Logowanie
                </Link>
                <Link 
                  to="/register"
                  className="bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white px-6 py-3 rounded-full font-bold hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] transition-all duration-300"
                >
                  Zarejestruj się
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[70vh]">
            
            {/* Lewa strona - tekst */}
            <div className="space-y-8">
              <div className="inline-flex items-center space-x-2 bg-[#1DCD9F]/10 text-[#1DCD9F] px-4 py-2 rounded-full text-sm font-bold">
                <span>✨</span>
                <span>Inteligentne rekomendacje planów treningowych</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black text-white leading-tight">
                Twój osobisty
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F]">
                  {" "}trener AI
                </span>
              </h1>
              
              <p className="text-xl text-gray-300 leading-relaxed">
                Algorytm AI analizuje Twoje cele, poziom zaawansowania, dostępny sprzęt i parametry biometryczne, 
                aby stworzyć idealny plan treningowy dopasowany tylko do Ciebie.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {user ? (
                  <Link 
                    to="/dashboard"
                    className="bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] hover:brightness-110 transition-all duration-300 text-center"
                  >
                    Przejdź do Dashboard
                  </Link>
                ) : (
                  <>
                    <Link 
                      to="/register"
                      className="bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] hover:brightness-110 transition-all duration-300 text-center"
                    >
                      Rozpocznij za darmo
                    </Link>
                    <Link 
                      to="/login"
                      className="border-2 border-[#1DCD9F] text-[#1DCD9F] px-8 py-4 rounded-full font-bold text-lg hover:bg-[#1DCD9F] hover:text-black transition-all duration-300 text-center"
                    >
                      Mam już konto
                    </Link>
                  </>
                )}
              </div>
            </div>
            
            {/* Prawa strona - obrazek */}
            <div className="relative">
              <div className="relative z-10">
                <img 
                  src={laskoHi} 
                  alt="Lasko - Twój osobisty trener AI" 
                  className="w-full max-w-lg mx-auto drop-shadow-2xl"
                />
              </div>
              
              {/* Dekoracyjne elementy */}
              <div className="absolute top-1/4 -left-4 w-24 h-24 bg-[#1DCD9F]/20 rounded-full blur-xl animate-pulse" />
              <div className="absolute bottom-1/4 -right-4 w-32 h-32 bg-[#0D7A61]/20 rounded-full blur-xl animate-pulse delay-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Sekcja "Jak to działa" */}
      <div className="py-20 px-6 bg-gradient-to-b from-transparent to-[#0D7A61]/5">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            kicker="Proces"
            title="Jak działa Lasko AI?"
            subtitle="Prosty, trzystopniowy proces do idealnego planu treningowego"
          />
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Wypełnij ankietę",
                description: "Odpowiedz na pytania o swoje cele, poziom, dostępny sprzęt oraz parametry biometryczne (wiek, waga, wzrost)",
                icon: "📝"
              },
              {
                step: "02", 
                title: "AI analizuje dane",
                description: "Nasz algorytm uwzględnia wszystkie parametry w tym BMI, wiek i cel treningowy, aby znaleźć najlepsze dopasowanie",
                icon: "🤖"
              },
              {
                step: "03",
                title: "Otrzymaj plan",
                description: "Dostań spersonalizowany plan treningowy z dopasowanymi ćwiczeniami, progresją i harmonogramem",
                icon: "🎯"
              }
            ].map((item, index) => (
              <div key={index} className="relative group">
                <div className="bg-[#0a0a0a]/80 border border-[#222222] rounded-2xl p-8 h-full hover:border-[#1DCD9F]/50 transition-all duration-300 group-hover:transform group-hover:-translate-y-2">
                  <div className="text-6xl mb-4">{item.icon}</div>
                  <div className="text-[#1DCD9F] text-sm font-bold mb-2">KROK {item.step}</div>
                  <h3 className="text-white text-xl font-bold mb-4">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-[#1DCD9F] text-2xl font-bold mb-4 md:mb-0">
              Lasko
            </div>
            
            <div className="flex space-x-6">
              {[
                { icon: instagramIcon, href: "#", label: "Instagram" },
                { icon: twitterIcon, href: "#", label: "Twitter" },
                { icon: tiktokIcon, href: "#", label: "TikTok" },
                { icon: facebookIcon, href: "#", label: "Facebook" }
              ].map((social, index) => (
                <a 
                  key={index}
                  href={social.href} 
                  className="text-gray-400 hover:text-[#1DCD9F] transition-colors"
                  aria-label={social.label}
                >
                  <img src={social.icon} alt={social.label} className="w-6 h-6" />
                </a>
              ))}
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
            <p>&copy; 2024 Lasko. Wszystkie prawa zastrzeżone.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ✅ GŁÓWNA APLIKACJA - TYLKO Routes (BEZ ROUTER I AUTHPROVIDER)
const App = () => {
  return (
    <Routes>
      {/* Strona główna */}
      <Route path="/" element={<HomePage />} />
      
      {/* Logowanie */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Rejestracja */}
      <Route path="/register" element={<RegistrationContainer />} />
      
      {/* Wybór algorytmu (po rejestracji) */}
      <Route path="/choose-algorithm" element={<AlgorithmChoicePage />} />
      
      {/* Kreator planu (rozszerzony) */}
      <Route path="/enhanced-plan-creator" element={<EnhancedPlanCreator />} />
      
      {/* Chronione trasy - wymagają zalogowania */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />

     {/* ✅ NOWA TRASA: podsumowanie planu po wygenerowaniu */}
     <Route path="/plan-summary" element={
       <ProtectedRoute>
         <PlanSummary />
       </ProtectedRoute>
     } />
      
      <Route path="/plan-preview" element={
        <ProtectedRoute>
          <PlanCreatorPreview />
        </ProtectedRoute>
      } />
      
      {/* Przekierowanie nieznanych tras */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
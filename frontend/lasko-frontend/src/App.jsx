import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import RegistrationContainer from './components/register/RegistrationContainer.jsx';
import RecommendedPlansPage from './components/register/RecommendedPlansPage';
import PlanCreatorPage from './components/register/PlanCreatorPage';
import DashboardPage from './components/DashboardPage';

// --- POPRAWKA: Importowanie obrazków ---
// Importujemy każdy obrazek, aby Vite mógł poprawnie przetworzyć ścieżki
import laskoHi from './assets/Lasko_pose/Lasko_Hi.png';
import whoIsLasko from './assets/Lasko_pose/whoislasko.png';
import laskoCropHi from './assets/Lasko_pose/Lasko_crop_Hi.png';
import instagramIcon from './assets/icons/instagram.svg';
import twitterIcon from './assets/icons/twitter.svg';
import tiktokIcon from './assets/icons/tiktok.svg';
import facebookIcon from './assets/icons/facebook.svg';
// --- KONIEC POPRAWKI ---


const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegistrationContainer />} />
        <Route path="/recommended-plans" element={<RecommendedPlansPage />} />
        <Route path="/plan-creator" element={<PlanCreatorPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </Router>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      {/* Hero section with logo and mascot */}
      <div className="max-w-6xl mx-auto bg-[#1D1D1D] rounded-3xl shadow-md border border-[#222222] p-10 mb-8 relative overflow-visible">
        <div className="absolute top-2 right-2 z-20">
          {/* Desktop navigation buttons - visible above 768px */}
          <div className="hidden md:flex gap-1 justify-end">
            <Link to="/" className="text-[#e0e0e0] px-6 py-3 rounded-full transition-all duration-300 hover:bg-gradient-to-r hover:from-[#0D7A61] hover:to-[#1DCD9F] hover:text-white hover:shadow-[0_0_15px_rgba(29,205,159,0.5)] text-medium font-black">Zaloguj się</Link>
            <Link to="/register" className="text-[#e0e0e0] px-6 py-3 rounded-full transition-all duration-300 hover:bg-gradient-to-r hover:from-[#0D7A61] hover:to-[#1DCD9F] hover:text-white hover:shadow-[0_0_15px_rgba(29,205,159,0.5)] text-medium font-black">Zapisz się</Link>
          </div>
          
          {/* Mobile hamburger menu - visible below 768px */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-[#e0e0e0] p-3 rounded-full transition-all duration-300 hover:bg-gradient-to-r hover:from-[#0D7A61] hover:to-[#1DCD9F] hover:text-white"
              aria-label="Menu"
            >
              {/* Hamburger icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Mobile menu dropdown */}
            {mobileMenuOpen && (
              <div className="absolute right-0 top-12 w-48 bg-[#1D1D1D] rounded-xl shadow-md border border-[#292929] p-2 z-30">
                <Link 
                  to="/" 
                  className="block text-[#e0e0e0] px-4 py-3 rounded-full transition-all duration-300 hover:bg-gradient-to-r hover:from-[#0D7A61] hover:to-[#1DCD9F] hover:text-white font-black"
                >
                  Zaloguj się
                </Link>
                <Link 
                  to="/register" 
                  className="block text-[#e0e0e0] px-4 py-3 rounded-full transition-all duration-300 hover:bg-gradient-to-r hover:from-[#0D7A61] hover:to-[#1DCD9F] hover:text-white font-black"
                >
                  Zapisz się
                </Link>
              </div>
            )}
          </div>
        </div>
        
        <div className="max-w-xl z-10">
          <h1 className="text-[#1DCD9F] text-5xl font-bold mb-3">Lasko</h1>
          <h2 className="text-[#FFFFFF] text-4xl font-bold mb-8 leading-tight">
            Dynamiczny Trening,<br />
            Planowanie i Optymalizacja
          </h2>
          <button 
            onClick={() => navigate('/register')}
            className="bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-lg text-white font-bold py-3 px-12 rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] hover:brightness-110 active:brightness-90 active:scale-[0.98]"
          >
            Zaczynajmy
          </button>
        </div>
        
        {/* Stworek wychodzący poza kafelek - znika przy szerokości poniżej 930px */}
        {/* --- POPRAWKA: Użycie zaimportowanej zmiennej --- */}
        <img 
          src={laskoHi} 
          alt="Lasko Mascot" 
          className="absolute right-[6%] -bottom-38 w-92 h-auto z-10 hidden lg:block"
        />
      </div>

      {/* Grid layout for content boxes - z poprawionymi wysokościami kafelków */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top row with equal heights */}
        <div className="grid grid-cols-1 gap-6">
          {/* Progress tracking box - referencyjny kafelek */}
          <div className="bg-[#1D1D1D] rounded-3xl p-8 text-white shadow-md border border-[#292929] h-48">
            <h3 className="text-3xl font-bold mb-3 text-[#FFFFFF]">Śledź swoje postępy</h3>
            <p className="text-xl text-[#e0e0e0]">
              Analizuj wyniki treningów<br />
              i osiągaj swoje cele
            </p>
          </div>
        </div>

        {/* Meet Lasko box - dopasowana wysokość */}
        <div className="hidden md:block relative">
          {/* Wersja na większe ekrany - tylko dla lg i większych */}
          <div className="hidden lg:flex bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] rounded-3xl py-3 px-4 shadow-md justify-center items-center h-24 absolute bottom-0 inset-x-0">
            <h3 className="text-white text-3xl font-bold text-center">
              Poznaj Lasko
            </h3>
          </div>
          
          {/* Wersja na średnie ekrany - tylko dla md do lg */}
          <div className="hidden md:flex lg:hidden bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] rounded-3xl p-8 shadow-md justify-center items-center h-48">
            <h3 className="text-white text-3xl font-bold text-center">
              Poznaj Lasko
            </h3>
          </div>
        </div>

        {/* Lewa kolumna z dwoma kafelkami */}
        <div className="grid grid-cols-1 gap-6">
          {/* Customize training box */}
          <div className="bg-[#1D1D1D] rounded-3xl p-8 shadow-md border border-[#292929]">
            <h3 className="text-[#FFFFFF] text-3xl font-bold mb-3">Dostosuj treningi</h3>
            <p className="text-[#e0e0e0] text-xl">
              Personalizuj plan treningowy<br />
              do swoich celów
            </p>
          </div>

          {/* Find motivation box */}
          <div className="bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] rounded-3xl p-8 shadow-md">
            <h3 className="text-white text-3xl font-bold mb-3">Znajdź motywację</h3>
            <p className="text-white text-xl">
              Otrzymuj codzienne wsparcie<br />
              i inspirujące wyzwania od Lasko
            </p>
          </div>
        </div>

        {/* Who is Lasko box */}
        <div className="bg-[#000000] rounded-3xl p-8 shadow-md border border-[#333333] shadow-[0_0_20px_rgba(29,205,159,0.2)] relative">
          <h3 className="text-3xl font-bold mb-3 text-white">Kim jest Lasko?</h3>
          <p className="text-xl mb-5 text-[#e0e0e0]">
            Lasko to stworek który będzie ci towarzyszył w twojej wędrówce aby stać się kimś lepszym.
          </p>
          <div className="flex items-center justify-center gap-4">
          {/* --- POPRAWKA: Użycie zaimportowanej zmiennej --- */}
          <img 
            src={whoIsLasko} 
            alt="Tajemniczy obrazek Lasko" 
            className="w-full h-auto max-h-64 object-contain"/>
          </div>
        </div>

        {/* Message from Lasko box - z powiększonym i obniżonym stworkiem */}
        <div className="bg-[#1D1D1D] rounded-3xl p-6 shadow-md border border-[#292929] relative overflow-visible">
          <div className="flex flex-col justify-between min-h-[140px] pl-0 md:pl-12 lg:pl-0">
            {/* Tekst - oddalony od obrazka */}
            <div className="text-[#e0e0e0] italic text-base md:text-lg font-semibold z-10 mb-12">
              <p className="mb-2">Hej, jestem Lasko! Wiem, że zmiana bywa trudna... Dlatego właśnie tu jestem.</p>
              <p className="text-right">Razem znajdziemy sposób na Ciebie – ten najlepszy</p>
            </div>
            
            {/* Kontener dla obrazka - na samym dole kafelka */}
            <div className="absolute bottom-0 left-0 h-36 w-full">
              {/* Obrazek powiększony i obniżony na sam dół kafelka */}
              {/* --- POPRAWKA: Użycie zaimportowanej zmiennej --- */}
              <img 
                src={laskoCropHi} 
                alt="Lasko Icon" 
                className="absolute left-4 bottom-4 w-50 h-auto transform translate-y-1/5"
                style={{ aspectRatio: '2982/1195' }}
              />
            </div>
          </div>
        </div>
        
        {/* Train everywhere box */}
        <div className="bg-[#1D1D1D] rounded-3xl p-8 shadow-md border border-[#292929]">
          <h3 className="text-3xl font-bold mb-3 text-white">Trenuj wszędzie</h3>
          <p className="text-xl text-[#e0e0e0]">
            Korzystaj z treningów online i<br />
            offline – nawet w podróży!
          </p>
        </div>
      </div>

      {/* Example text section */}
      <div className="max-w-6xl mx-auto mt-8 bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] rounded-3xl p-8 shadow-md">
        <h3 className="text-white text-3xl font-bold mb-5 text-center">Przykładowy tekst</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white text-center text-lg">
          <p>Lorem impsum, lorem ipsum, lorem</p>
          <p>Lorem impsum, lorem ipsum, lorem</p>
          <p>Lorem impsum, lorem ipsum, lorem</p>
        </div>
      </div>

      {/* Poprawiona stopka, aby teksty się nie nakładały */}
      <footer className="relative max-w-6xl mx-auto mt-10 bg-[#1D1D1D] rounded-3xl shadow-md border border-[#292929]">
        <div className="px-6 py-4">
          {/* Wersja mobilna (elementy jeden pod drugim) */}
          <div className="flex flex-col space-y-3 md:hidden">
            <div className="text-center text-[#e0e0e0]">
              © 2025 Lasko. Wszelkie prawa zastrzeżone.
            </div>
            <div className="flex justify-center space-x-4 text-[#e0e0e0]">
              <a href="#" className="hover:text-[#1DCD9F] transition">Regulamin</a>
              <a href="#" className="hover:text-[#1DCD9F] transition">Polityka prywatności</a>
            </div>
            <div className="flex justify-center space-x-3">
              {/* --- POPRAWKA: Użycie zaimportowanych zmiennych --- */}
              <a href="#" className="hover:opacity-80 transition">
                <img src={instagramIcon} alt="Instagram" className="w-8 h-8" />
              </a>
              <a href="#" className="hover:opacity-80 transition">
                <img src={twitterIcon} alt="X (Twitter)" className="w-8 h-8" />
              </a>
              <a href="#" className="hover:opacity-80 transition">
                <img src={tiktokIcon} alt="TikTok" className="w-8 h-8" />
              </a>
              <a href="#" className="hover:opacity-80 transition">
                <img src={facebookIcon} alt="Facebook" className="w-8 h-8" />
              </a>
            </div>
          </div>

          {/* Wersja desktopowa (elementy obok siebie) */}
          <div className="hidden md:grid md:grid-cols-3 md:gap-4 md:items-center">
            {/* Lewa strona: Regulamin */}
            <div className="flex space-x-4 text-[#e0e0e0]">
              <a href="#" className="hover:text-[#1DCD9F] transition">Regulamin</a>
              <a href="#" className="hover:text-[#1DCD9F] transition">Polityka prywatności</a>
            </div>

            {/* Środek: copyright */}
            <div className="text-center text-[#e0e0e0]">
              © 2025 Lasko. Wszelkie prawa zastrzeżone.
            </div>

            {/* Prawa strona: social media */}
            <div className="flex justify-end space-x-3">
              {/* --- POPRAWKA: Użycie zaimportowanych zmiennych --- */}
              <a href="#" className="hover:opacity-80 transition">
                <img src={instagramIcon} alt="Instagram" className="w-8 h-8" />
              </a>
              <a href="#" className="hover:opacity-80 transition">
                <img src={twitterIcon} alt="X (Twitter)" className="w-8 h-8" />
              </a>
              <a href="#" className="hover:opacity-80 transition">
                <img src={tiktokIcon} alt="TikTok" className="w-8 h-8" />
              </a>
              <a href="#" className="hover:opacity-80 transition">
                <img src={facebookIcon} alt="Facebook" className="w-8 h-8" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
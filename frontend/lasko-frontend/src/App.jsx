// frontend/lasko-frontend/src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import RegistrationContainer from './components/register/RegistrationContainer.jsx';
import AlgorithmChoicePage from './components/register/AlgorithmChoicePage'; // NOWY IMPORT
import EnhancedPlanCreator from './components/register/EnhancedPlanCreator'; // Tylko ten kreator
import DashboardPage from './components/DashboardPage';
import PlanCreatorPreview from './components/PlanCreatorPreview';

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

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Główna strona */}
        <Route path="/" element={<HomePage />} />
        
        {/* Rejestracja */}
        <Route path="/register" element={<RegistrationContainer />} />
        
        {/* NOWA ROUTE - wybór algorytmu */}
        <Route path="/choose-algorithm" element={<AlgorithmChoicePage />} />
        
        {/* JEDYNA ścieżka po rejestracji - kreator planu */}
        <Route path="/plan-creator" element={<EnhancedPlanCreator />} />
        
        {/* Dashboard */}
        <Route path="/dashboard" element={<DashboardPage />} />
        
        {/* Fallback dla nieistniejących ścieżek */}
        <Route path="*" element={<HomePage />} />

        <Route path="/plan-creator" element={<PlanCreatorPreview />} />

        <Route path="/enhanced-plan-creator" element={<EnhancedPlanCreator />} />

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
          <p className="text-[#e0e0e0] text-lg mb-6">
            Zmień nawyki w stały progres. Lasko łączy inteligentne planowanie, dopasowane treningi i
            motywację w jednym miejscu. Dla początkujących i zaawansowanych.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => navigate('/register')}
              className="bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-lg text-white font-bold py-3 px-8 rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] hover:brightness-110 active:brightness-90 active:scale-[0.98]"
            >
              Zaczynajmy
            </button>
          </div>
        </div>
        
        {/* Stworek wychodzący poza kafelik - znika przy szerokości poniżej 930px */}
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
          <div className="bg-gradient-to-r from-[#0D7A61] to-[#1D1D9F] rounded-3xl p-8 shadow-md" style={{backgroundImage:'linear-gradient(to right, #0D7A61, #1DCD9F)'}}>
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
            Lasko to stworek, który będzie Ci towarzyszył w drodze do lepszej wersji siebie –
            przypomni o treningu, dopasuje obciążenia, a gdy trzeba, doda otuchy.
          </p>
          <div className="flex items-center justify-center gap-4">
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
              <p className="text-right">Razem znajdziemy sposób na Ciebie – ten najlepszy.</p>
            </div>
            
            {/* Kontener dla obrazka - na samym dole kafelka */}
            <div className="absolute bottom-0 left-0 h-36 w-full">
              {/* Obrazek powiększony i obniżony na sam dół kafelka */}
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

      {/* Dlaczego Lasko */}
      <div className="max-w-6xl mx-auto mt-8 bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] rounded-3xl p-8 shadow-md">
        <SectionHeading
          kicker="Dlaczego Lasko"
          title="Skup się na progresie, resztą zajmiemy się my"
          subtitle="Inteligentne planowanie, realne wyniki i motywacja, która nie gaśnie."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white">
          <div className="bg-black/20 rounded-2xl p-5">
            <h4 className="text-2xl font-bold mb-2">Automatyczne planowanie</h4>
            <p>Algorytmy sugerują objętość, intensywność i dni odpoczynku, bazując na Twoich danych.</p>
          </div>
          <div className="bg-black/20 rounded-2xl p-5">
            <h4 className="text-2xl font-bold mb-2">Trening szyty na miarę</h4>
            <p>Ćwiczenia dobierane do celów (siła, wytrzymałość, sylwetka) i dostępnego sprzętu.</p>
          </div>
          <div className="bg-black/20 rounded-2xl p-5">
            <h4 className="text-2xl font-bold mb-2">Motywacja od Lasko</h4>
            <p>Wyzwania, powiadomienia i nagrody, które pomagają wracać na matę i siłownię.</p>
          </div>
        </div>
      </div>

      {/* Funkcje szczegółowe */}
      <section className="max-w-6xl mx-auto mt-10">
        <SectionHeading
          kicker="Funkcje"
          title="Wszystko, czego potrzebuje Twój plan"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              t: 'Adaptacyjny progres',
              d: 'Obciążenia i objętość rosną, gdy rośnie Twoja forma – a spadają, gdy ciało potrzebuje luzu.'
            },
            {
              t: 'Biblioteka ćwiczeń',
              d: 'Instrukcje i wideo do najważniejszych ruchów – od przysiadów po mobilizację barków.'
            },
            {
              t: 'Śledzenie regeneracji',
              d: 'Sen, tętno spoczynkowe, RPE – łącz dane, aby trenować mądrzej.'
            },
            {
              t: 'Integracje',
              d: 'Zgrywaj aktywności z zegarka lub telefonu, aby mieć pełny obraz tygodnia.'
            },
            {
              t: 'Plan dnia',
              d: 'Dokładny plan treningu z przerwami i podpowiedziami technicznymi.'
            },
            {
              t: 'Statystyki i wykresy',
              d: 'PR-y, serie, powtórzenia i objętość – wszystko pod ręką.'
            },
          ].map((f, i) => (
            <div key={i} className="bg-[#1D1D1D] rounded-3xl p-6 border border-[#292929] hover:border-[#1DCD9F] transition">
              <h4 className="text-white text-xl font-bold mb-2">{f.t}</h4>
              <p className="text-[#e0e0e0]">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Jak to działa */}
      <section className="max-w-6xl mx-auto mt-10">
        <SectionHeading kicker="Jak to działa" title="3 kroki do mądrzejszego treningu" />
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-6 list-decimal list-inside">
          <li className="bg-[#1D1D1D] rounded-3xl p-6 border border-[#292929] text-[#e0e0e0]">
            <h5 className="text-white text-xl font-bold mb-2">Krótka ankieta</h5>
            Określ cel, poziom i dostępny sprzęt.
          </li>
          <li className="bg-[#1D1D1D] rounded-3xl p-6 border border-[#292929] text-[#e0e0e0]">
            <h5 className="text-white text-xl font-bold mb-2">Twój plan</h5>
            Otrzymasz gotowy plan na 4–8 tygodni z adaptacją.
          </li>
          <li className="bg-[#1D1D1D] rounded-3xl p-6 border border-[#292929] text-[#e0e0e0]">
            <h5 className="text-white text-xl font-bold mb-2">Codzienne wsparcie</h5>
            Lasko przypomni, zmotywuje i pokaże postępy.
          </li>
        </ol>
      </section>

      {/* Opinie */}
      <section className="max-w-6xl mx-auto mt-10">
        <SectionHeading kicker="Opinie" title="Co mówią użytkownicy" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { n: 'Marta', r: '5/5', t: 'W 12 tygodni podciągnęłam się z 0 do 5 powtórzeń. Plan był klarowny i motywujący.' },
            { n: 'Kamil', r: '5/5', t: 'Przestałem błądzić po siłowni. Każda sesja ma cel – i widzę to w liczbach.' },
            { n: 'Ola', r: '4.5/5', t: 'Najbardziej lubię przypomnienia i krótkie wskazówki techniczne w trakcie treningu.' },
          ].map((o, i) => (
            <div key={i} className="bg-[#1D1D1D] rounded-3xl p-6 border border-[#292929]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#1DCD9F]/20 flex items-center justify-center text-white font-bold">
                  {o.n[0]}
                </div>
                <div>
                  <p className="text-white font-bold">{o.n}</p>
                  <p className="text-[#e0e0e0] text-sm">Ocena: {o.r}</p>
                </div>
              </div>
              <p className="text-[#e0e0e0]">"{o.t}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-6xl mx-auto mt-10">
        <SectionHeading kicker="FAQ" title="Częste pytania" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {q:'Czy Lasko jest dla początkujących?', a:'Tak. Ankieta startowa dopasuje objętość i poziom trudności do Twojego doświadczenia.'},
            {q:'Czy potrzebuję siłowni?', a:'Nie. Możesz wybrać trening bez sprzętu, z hantlami lub pełną siłownią.'},
            {q:'Ile to kosztuje?', a:'Start jest darmowy. Później możesz wybrać plan płatny z dodatkowymi funkcjami.'},
            {q:'Czy mogę przerwać plan?', a:'Tak. Pauzuj, cofaj tydzień lub zmieniaj cel w każdej chwili.'},
          ].map((item, idx) => (
            <details key={idx} className="bg-[#1D1D1D] rounded-2xl p-5 border border-[#292929]">
              <summary className="cursor-pointer text-white font-bold">{item.q}</summary>
              <p className="mt-2 text-[#e0e0e0]">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA końcowe */}
      <section className="max-w-6xl mx-auto mt-10 bg-[#111] rounded-3xl border border-[#292929] p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="text-white text-2xl md:text-3xl font-black mb-2">Gotowy na mądrzejszy trening?</h4>
            <p className="text-[#e0e0e0]">Dołącz teraz i zacznij widzieć postępy w liczbach – nie tylko w lustrze.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/register')} className="bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white font-bold px-6 py-3 rounded-full hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] transition">Zacznij za darmo</button>
          </div>
        </div>
      </section>

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
              <a href="#" className="hover:opacity-80 transition" aria-label="Instagram">
                <img src={instagramIcon} alt="Instagram" className="w-8 h-8" />
              </a>
              <a href="#" className="hover:opacity-80 transition" aria-label="X (Twitter)">
                <img src={twitterIcon} alt="X (Twitter)" className="w-8 h-8" />
              </a>
              <a href="#" className="hover:opacity-80 transition" aria-label="TikTok">
                <img src={tiktokIcon} alt="TikTok" className="w-8 h-8" />
              </a>
              <a href="#" className="hover:opacity-80 transition" aria-label="Facebook">
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
              <a href="#" className="hover:opacity-80 transition" aria-label="Instagram">
                <img src={instagramIcon} alt="Instagram" className="w-8 h-8" />
              </a>
              <a href="#" className="hover:opacity-80 transition" aria-label="X (Twitter)">
                <img src={twitterIcon} alt="X (Twitter)" className="w-8 h-8" />
              </a>
              <a href="#" className="hover:opacity-80 transition" aria-label="TikTok">
                <img src={tiktokIcon} alt="TikTok" className="w-8 h-8" />
              </a>
              <a href="#" className="hover:opacity-80 transition" aria-label="Facebook">
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
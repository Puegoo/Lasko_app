import React from 'react';

const App = () => {
  return (
    <div className="min-h-screen bg-[#d9ece8] p-6">
      {/* Hero section with logo and mascot */}
      <div className="max-w-6xl mx-auto bg-[#eff6ef] rounded-3xl shadow-md p-10 mb-8 relative overflow-visible">
        <div className="absolute top-6 right-10 z-20">
          <div className="flex gap-4 justify-end">
            <a href="#" className="text-[#096179] hover:underline text-lg font-semibold">Zaloguj się</a>
            <a href="#" className="text-[#096179] hover:underline text-lg font-semibold">Zapisz się</a>
          </div>
        </div>
        
        <div className="max-w-xl z-10">
          <h1 className="text-[#76bbe5] text-5xl font-bold mb-3">Lasko</h1>
          <h2 className="text-[#096179] text-4xl font-bold mb-8 leading-tight">
            Dynamiczny Trening,<br />
            Planowanie i Optymalizacja
          </h2>
          <button className="bg-[#c3e2a9] text-[#096179] font-semibold py-3 px-12 rounded-full hover:bg-[#a3d289] transition text-lg">
            Zaczynajmy
          </button>
        </div>
        
        {/* Stworek wychodzący poza kafelek */}
        <img 
          src="src/assets/Lasko_Hi.svg" 
          alt="Lasko Mascot" 
          className="absolute right-[6%] -bottom-32 w-96 h-96 z-10"
        />
      </div>

      {/* Grid layout for content boxes */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Progress tracking box - większy kafelek */}
        <div className="bg-[#76bbe5] rounded-3xl p-8 text-white shadow-md h-48">
          <h3 className="text-3xl font-bold mb-3">Śledź swoje postępy</h3>
          <p className="text-xl">
            Analizuj wyniki treningów<br />
            i osiągaj swoje cele
          </p>
        </div>

        {/* Meet Lasko box - mniejsza wysokość, bez zdjęcia */}
        <div className="md:mt-24 bg-[#c3e2a9] rounded-3xl py-3 px-4 shadow-md flex justify-center items-center h-24">
          <h3 className="text-[#096179] text-3xl font-bold text-center">
            Poznaj Lasko
          </h3>
        </div>

        {/* Lewa kolumna z dwoma kafelkami */}
        <div className="grid grid-cols-1 gap-6">
          {/* Customize training box */}
          <div className="bg-[#c3e2a9] rounded-3xl p-8 shadow-md">
            <h3 className="text-[#096179] text-3xl font-bold mb-3">Dostosuj treningi</h3>
            <p className="text-[#096179] text-xl">
              Personalizuj plan treningowy<br />
              do swoich celów
            </p>
          </div>

          {/* Find motivation box */}
          <div className="bg-[#096179] rounded-3xl p-8 text-white shadow-md">
            <h3 className="text-3xl font-bold mb-3">Znajdź motywację</h3>
            <p className="text-xl">
              Otrzymuj codzienne wsparcie<br />
              i inspirujące wyzwania od Lasko
            </p>
          </div>
        </div>

        {/* Who is Lasko box */}
        <div className="bg-[#096179] rounded-3xl p-8 text-white shadow-md relative">
          <h3 className="text-3xl font-bold mb-3">Kim jest Lasko?</h3>
          <p className="text-xl mb-5">
            Lasko to stworek który będzie ci towarzyszył w twojej wędrówce aby stać się kimś lepszym.
          </p>
          <div className="flex justify-center mt-6">
            <div className="flex items-center justify-center">
              <span className="text-[#76bbe5] text-6xl mr-5">?</span>
              <span className="text-[#76bbe5] text-8xl">?</span>
              <span className="text-[#76bbe5] text-6xl ml-5">?</span>
            </div>
          </div>
        </div>

        {/* Message from Lasko box - nowy układ z wyższym obrazkiem */}
        <div className="bg-[#eff6ef] rounded-3xl p-8 shadow-md relative overflow-visible">
          <div className="text-[#096179] italic text-lg">
            <p>Hej, jestem Lasko! Wiem, że zmiana bywa trudna... Dlatego właśnie tu jestem.</p>
            <p className="text-right mt-2">Razem znajdziemy sposób na Ciebie – ten najlepszy</p>
          </div>
          {/* Obrazek wyżej w kafelku, ale nadal wychodzący poza */}
          <img 
            src="src/assets/Lasko_Mascot.png" 
            alt="Lasko Icon" 
            className="absolute left-4 bottom-2 w-36 h-auto -mb-0 transform translate-y-1/8"
            style={{ aspectRatio: '2982/1195' }}
          />
        </div>
        
        {/* Train everywhere box */}
        <div className="bg-[#76bbe5] rounded-3xl p-8 text-white shadow-md">
          <h3 className="text-3xl font-bold mb-3">Trenuj wszędzie</h3>
          <p className="text-xl">
            Korzystaj z treningów online i<br />
            offline – nawet w podróży!
          </p>
        </div>
      </div>

      {/* Example text section */}
      <div className="max-w-6xl mx-auto mt-8 bg-[#c3e2a9] rounded-3xl p-8 shadow-md">
        <h3 className="text-[#096179] text-3xl font-bold mb-5 text-center">Przykładowy tekst</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-[#096179] text-center text-lg">
          <p>Lorem impsum, lorem ipsum, lorem</p>
          <p>Lorem impsum, lorem ipsum, lorem</p>
          <p>Lorem impsum, lorem ipsum, lorem</p>
        </div>
      </div>

      {/* Nowa, minimalistyczna stopka */}
      <footer className="max-w-6xl mx-auto mt-10 bg-[#eff6ef] rounded-3xl shadow-md">
        <div className="px-6 py-5">
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <span className="text-[#096179] font-medium mr-1">Śledź nas:</span>
              <a href="#" className="hover:opacity-80 transition">
                <img src="src/assets/instagram.svg" alt="Instagram" className="w-8 h-8" />
              </a>
              <a href="#" className="hover:opacity-80 transition">
                <img src="src/assets/twitter.svg" alt="X (Twitter)" className="w-8 h-8" />
              </a>
              <a href="#" className="hover:opacity-80 transition">
                <img src="src/assets/tiktok.svg" alt="TikTok" className="w-8 h-8" />
              </a>
              <a href="#" className="hover:opacity-80 transition">
                <img src="src/assets/facebook.svg" alt="Facebook" className="w-8 h-8" />
              </a>
            </div>
            
            <div className="flex items-center mb-4 md:mb-0">
              <span className="text-[#096179] font-medium mr-3">O nas:</span>
              <a href="#" className="text-[#096179] hover:text-[#76bbe5] transition mr-3">Nasza misja</a>
              <a href="#" className="text-[#096179] hover:text-[#76bbe5] transition">Zespół</a>
            </div>
            
            <div className="flex items-center">
              <div className="mr-4">
                <span className="text-[#096179] font-medium block mb-1">Kontakt:</span>
                <a href="mailto:Kontakt@lasko.pl" className="text-[#096179] hover:text-[#76bbe5] transition">Kontakt@lasko.pl</a>
              </div>
              <div className="border-l border-[#096179] pl-4">
                <a href="#" className="block text-[#096179] hover:text-[#76bbe5] transition mb-1">Regulamin</a>
                <a href="#" className="block text-[#096179] hover:text-[#76bbe5] transition">Polityka prywatności</a>
              </div>
            </div>
          </div>
          
          <div className="text-center text-[#096179] mt-4 text-sm">
            © 2025 Lasko. Wszelkie prawa zastrzeżone.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
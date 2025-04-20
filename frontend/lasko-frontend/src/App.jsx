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
          src="src/assets/Lasko_Hi.png" 
          alt="Lasko Mascot" 
          className="absolute right-[6%] -bottom-32 w-96 h-96 z-10 max-lg930:hidden"
        />
      </div>

      {/* Grid layout for content boxes */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Progress tracking box */}
        <div className="bg-[#76bbe5] rounded-3xl p-8 text-white shadow-md h-48">
          <h3 className="text-3xl font-bold mb-3">Śledź swoje postępy</h3>
          <p className="text-xl">
            Analizuj wyniki treningów<br />
            i osiągaj swoje cele
          </p>
        </div>

        {/* Meet Lasko box */}
        <div className="md:mt-24 bg-[#c3e2a9] rounded-3xl py-3 px-4 shadow-md flex justify-center items-center h-24 max-md768:hidden">
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
          <div className="flex items-center justify-center gap-4">
            <img 
              src="src/assets/whoislasko.png" 
              alt="Tajemniczy obrazek Lasko" 
              className="w-full h-auto max-h-64 object-contain"
            />
          </div>
        </div>

        {/* Message from Lasko box */}
        <div className="bg-[#eff6ef] rounded-3xl p-8 shadow-md relative overflow-visible">
          <div className="text-[#096179] italic text-lg">
            <p>Hej, jestem Lasko! Wiem, że zmiana bywa trudna... Dlatego właśnie tu jestem.</p>
            <p className="text-right mt-2">Razem znajdziemy sposób na Ciebie – ten najlepszy</p>
          </div>
          <img 
            src="src/assets/Lasko_crop_Hi.png" 
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

      {/* Stopka */}
      <footer className="relative max-w-6xl mx-auto mt-10 bg-[#eff6ef] rounded-3xl shadow-md">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between relative">
            
            {/* Lewa strona: linki */}
            <div className="flex space-x-4 text-[#096179] max-md768:hidden">
              <a href="#" className="hover:text-[#76bbe5] transition">Regulamin</a>
              <a href="#" className="hover:text-[#76bbe5] transition">Polityka prywatności</a>
            </div>

            {/* Środek: copyright */}
            <div className="absolute left-1/2 transform -translate-x-1/2 text-[#096179] whitespace-nowrap max-md768:hidden">
              © 2025 Lasko. Wszelkie prawa zastrzeżone.
            </div>

            {/* Prawa strona: social media */}
            <div className="flex space-x-3">
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
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

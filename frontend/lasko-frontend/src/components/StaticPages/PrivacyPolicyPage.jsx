import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicyPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black">
      {/* Gradient Grid Background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-[#1DCD9F]/10 blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 rounded-full bg-[#0D7A61]/10 blur-3xl" />
        <svg className="absolute inset-0 h-full w-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Navbar */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-4">
          <Link to="/" className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
            Lasko
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full border-2 border-emerald-400/60 px-7 py-3 text-sm font-bold text-emerald-300 hover:bg-emerald-400/10 transition-colors"
          >
            Powrót
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-6 pt-32 pb-16">
        <h1 className="mb-8 text-4xl font-black text-white md:text-5xl">Polityka Prywatności</h1>
        <div className="space-y-8 rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-gray-300">
          <section>
            <h2 className="mb-4 text-2xl font-bold text-white">1. Administrator danych</h2>
            <p className="mb-4 leading-relaxed">
              Administratorem danych osobowych jest Lasko Sp. z o.o. z siedzibą w Warszawie, 
              ul. Sportowa 15, 00-123 Warszawa, NIP: 1234567890, REGON: 123456789.
            </p>
            <p className="mb-4 leading-relaxed">
              W sprawach dotyczących ochrony danych osobowych można kontaktować się z nami pod adresem e-mail: 
              <a href="mailto:rodo@lasko.pl" className="text-emerald-400 hover:text-emerald-300 underline ml-1">rodo@lasko.pl</a>.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-white">2. Podstawa prawna przetwarzania</h2>
            <p className="mb-4 leading-relaxed">
              Przetwarzamy dane osobowe na podstawie:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Wykonania umowy o świadczenie usług (art. 6 ust. 1 lit. b RODO)</li>
              <li>Zgody użytkownika (art. 6 ust. 1 lit. a RODO)</li>
              <li>Prawnie uzasadnionego interesu administratora (art. 6 ust. 1 lit. f RODO)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-white">3. Zakres przetwarzanych danych</h2>
            <p className="mb-4 leading-relaxed">
              W ramach Platformy przetwarzamy następujące kategorie danych osobowych:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong className="text-white">Dane identyfikacyjne:</strong> imię, nazwa użytkownika, adres e-mail</li>
              <li><strong className="text-white">Dane profilowe:</strong> data urodzenia, waga, wzrost, cel treningowy, poziom zaawansowania</li>
              <li><strong className="text-white">Dane treningowe:</strong> zapisane treningi, wyniki, statystyki</li>
              <li><strong className="text-white">Dane techniczne:</strong> adres IP, typ przeglądarki, informacje o urządzeniu</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-white">4. Cel przetwarzania</h2>
            <p className="mb-4 leading-relaxed">
              Dane osobowe przetwarzamy w celu:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Świadczenia usług dostępnych na Platformie</li>
              <li>Personalizacji rekomendacji treningowych</li>
              <li>Śledzenia postępów użytkownika</li>
              <li>Komunikacji z użytkownikiem</li>
              <li>Prowadzenia statystyk i analiz</li>
              <li>Wykrywania i zapobiegania nadużyciom</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-white">5. Okres przechowywania danych</h2>
            <p className="mb-4 leading-relaxed">
              Dane osobowe przechowujemy przez czas niezbędny do realizacji celów, dla których zostały zebrane, 
              a także przez okres wymagany przepisami prawa (np. przepisy podatkowe).
            </p>
            <p className="mb-4 leading-relaxed">
              Po zakończeniu okresu przechowywania dane są usuwane lub anonimizowane.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-white">6. Udostępnianie danych</h2>
            <p className="mb-4 leading-relaxed">
              Dane osobowe mogą być udostępniane:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Podmiotom świadczącym usługi informatyczne i hostingowe</li>
              <li>Dostawcom narzędzi analitycznych</li>
              <li>Organom państwowym na podstawie obowiązujących przepisów prawa</li>
            </ul>
            <p className="mb-4 leading-relaxed">
              Nie sprzedajemy ani nie udostępniamy danych osobowych użytkowników podmiotom trzecim w celach 
              marketingowych bez ich zgody.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-white">7. Prawa użytkownika</h2>
            <p className="mb-4 leading-relaxed">
              Użytkownik ma prawo do:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Dostępu do swoich danych osobowych</li>
              <li>Sprostowania danych</li>
              <li>Usunięcia danych (prawo do bycia zapomnianym)</li>
              <li>Ograniczenia przetwarzania</li>
              <li>Przenoszenia danych</li>
              <li>Wniesienia sprzeciwu wobec przetwarzania</li>
              <li>Cofnięcia zgody w dowolnym momencie</li>
              <li>Wniesienia skargi do organu nadzorczego (UODO)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-white">8. Pliki cookies</h2>
            <p className="mb-4 leading-relaxed">
              Platforma wykorzystuje pliki cookies w celu zapewnienia prawidłowego funkcjonowania serwisu, 
              analizy ruchu oraz personalizacji treści. Szczegółowe informacje znajdują się w 
              ustawieniach przeglądarki.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-white">9. Bezpieczeństwo</h2>
            <p className="mb-4 leading-relaxed">
              Stosujemy odpowiednie środki techniczne i organizacyjne zapewniające bezpieczeństwo przetwarzanych 
              danych osobowych, w tym szyfrowanie połączeń SSL/TLS oraz regularne audyty bezpieczeństwa.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-white">10. Zmiany w Polityce Prywatności</h2>
            <p className="mb-4 leading-relaxed">
              Zastrzegamy sobie prawo do wprowadzania zmian w Polityce Prywatności. O istotnych zmianach 
              poinformujemy użytkowników za pośrednictwem Platformy lub poczty elektronicznej.
            </p>
            <p className="mb-4 leading-relaxed text-sm text-gray-400">
              Ostatnia aktualizacja: 1 stycznia 2024 r.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;


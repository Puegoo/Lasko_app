import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const TermsPage = () => {
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
        <h1 className="mb-8 text-4xl font-black text-white md:text-5xl">Regulamin</h1>
        <div className="space-y-8 rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-gray-300">
          <section>
            <h2 className="mb-4 text-2xl font-bold text-white">1. Postanowienia ogólne</h2>
            <p className="mb-4 leading-relaxed">
              Niniejszy regulamin określa zasady korzystania z platformy Lasko, aplikacji treningowej oferującej 
              inteligentne rekomendacje planów treningowych oraz narzędzia do śledzenia postępów.
            </p>
            <p className="mb-4 leading-relaxed">
              Administratorem platformy Lasko jest Lasko Sp. z o.o. z siedzibą w Warszawie, ul. Sportowa 15, 
              00-123 Warszawa, NIP: 1234567890, REGON: 123456789.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-white">2. Definicje</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-white">Platforma</strong> - aplikacja internetowa Lasko dostępna pod adresem lasko.pl</li>
              <li><strong className="text-white">Użytkownik</strong> - osoba fizyczna korzystająca z Platformy</li>
              <li><strong className="text-white">Konto</strong> - indywidualne konto użytkownika utworzone na Platformie</li>
              <li><strong className="text-white">Usługa</strong> - wszystkie funkcjonalności dostępne na Platformie</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-white">3. Warunki korzystania</h2>
            <p className="mb-4 leading-relaxed">
              Z Platformy mogą korzystać osoby, które ukończyły 16 lat. Osoby niepełnoletnie mogą korzystać 
              z Platformy za zgodą rodzica lub opiekuna prawnego.
            </p>
            <p className="mb-4 leading-relaxed">
              Użytkownik zobowiązuje się do podawania prawdziwych danych podczas rejestracji i aktualizacji 
              profilu. Podanie nieprawdziwych danych może skutkować zablokowaniem konta.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-white">4. Rejestracja i konto</h2>
            <p className="mb-4 leading-relaxed">
              Aby korzystać z pełnej funkcjonalności Platformy, należy utworzyć konto użytkownika poprzez 
              wypełnienie formularza rejestracyjnego.
            </p>
            <p className="mb-4 leading-relaxed">
              Użytkownik jest odpowiedzialny za zachowanie poufności danych logowania. Administrator nie ponosi 
              odpowiedzialności za szkody wynikające z udostępnienia danych logowania osobom trzecim.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-white">5. Usługi Platformy</h2>
            <p className="mb-4 leading-relaxed">
              Platforma oferuje następujące usługi:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Inteligentne rekomendacje planów treningowych</li>
              <li>Katalog ćwiczeń z instrukcjami</li>
              <li>Śledzenie postępów i statystyk treningowych</li>
              <li>Dziennik treningowy</li>
              <li>Kalendarz treningów</li>
            </ul>
            <p className="mb-4 leading-relaxed">
              Administrator zastrzega sobie prawo do modyfikacji, czasowego zawieszenia lub trwałego 
              wyłączenia funkcjonalności Platformy bez wcześniejszego powiadomienia.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-white">6. Odpowiedzialność</h2>
            <p className="mb-4 leading-relaxed">
              Platforma Lasko dostarcza informacji i rekomendacji treningowych w celach edukacyjnych. 
              Przed rozpoczęciem jakiegokolwiek programu treningowego zalecamy konsultację z lekarzem lub 
              certyfikowanym trenerem personalnym.
            </p>
            <p className="mb-4 leading-relaxed">
              Administrator nie ponosi odpowiedzialności za ewentualne szkody wynikające z korzystania 
              z rekomendowanych planów treningowych. Użytkownik korzysta z Platformy na własną odpowiedzialność.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-white">7. Ochrona danych osobowych</h2>
            <p className="mb-4 leading-relaxed">
              Zasady przetwarzania danych osobowych określa <Link to="/privacy-policy" className="text-emerald-400 hover:text-emerald-300 underline">Polityka Prywatności</Link>.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-white">8. Prawa autorskie</h2>
            <p className="mb-4 leading-relaxed">
              Wszystkie treści dostępne na Platformie, w tym teksty, grafiki, logo i oprogramowanie, 
              są chronione prawem autorskim i stanowią własność Administratora lub podmiotów trzecich.
            </p>
            <p className="mb-4 leading-relaxed">
              Użytkownik nie może kopiować, modyfikować ani rozpowszechniać treści Platformy bez 
              pisemnej zgody Administratora.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-white">9. Reklamacje</h2>
            <p className="mb-4 leading-relaxed">
              Reklamacje dotyczące funkcjonowania Platformy można składać na adres e-mail: 
              <a href="mailto:kontakt@lasko.pl" className="text-emerald-400 hover:text-emerald-300 underline ml-1">kontakt@lasko.pl</a>.
            </p>
            <p className="mb-4 leading-relaxed">
              Administrator rozpatruje reklamacje w terminie 14 dni roboczych od daty ich otrzymania.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-white">10. Postanowienia końcowe</h2>
            <p className="mb-4 leading-relaxed">
              Administrator zastrzega sobie prawo do zmiany Regulaminu. Zmiany wchodzą w życie z chwilą 
              opublikowania na Platformie.
            </p>
            <p className="mb-4 leading-relaxed">
              W sprawach nieuregulowanych niniejszym Regulaminem stosuje się przepisy prawa polskiego.
            </p>
            <p className="mb-4 leading-relaxed text-sm text-gray-400">
              Regulamin obowiązuje od dnia 1 stycznia 2024 r.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;


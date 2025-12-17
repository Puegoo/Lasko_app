import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const ContactPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Symulacja wysłania formularza
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

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
      <div className="mx-auto max-w-6xl px-6 pt-32 pb-16">
        <div className="text-center mb-12">
          <h1 className="mb-4 text-4xl font-black text-white md:text-5xl">Skontaktuj się z nami</h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Masz pytania? Chcesz podzielić się opinią? Jesteśmy tutaj, aby Ci pomóc!
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Informacje kontaktowe */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8">
              <h2 className="mb-6 text-2xl font-bold text-white">Dane kontaktowe</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/20">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-emerald-400">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-white">Adres</h3>
                    <p className="text-gray-400">
                      Lasko Sp. z o.o.<br />
                      ul. Sportowa 15<br />
                      00-123 Warszawa<br />
                      Polska
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/20">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-emerald-400">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-white">E-mail</h3>
                    <a href="mailto:kontakt@lasko.pl" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                      kontakt@lasko.pl
                    </a>
                    <br />
                    <a href="mailto:rodo@lasko.pl" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                      rodo@lasko.pl
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/20">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-emerald-400">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-white">Telefon</h3>
                    <a href="tel:+48123456789" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                      +48 123 456 789
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/20">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-emerald-400">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-white">Godziny pracy</h3>
                    <p className="text-gray-400">
                      Poniedziałek - Piątek: 9:00 - 17:00<br />
                      Sobota - Niedziela: Zamknięte
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dane firmy */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <h3 className="mb-3 text-lg font-semibold text-white">Dane firmy</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <p>NIP: 1234567890</p>
                <p>REGON: 123456789</p>
                <p>KRS: 0000123456</p>
              </div>
            </div>
          </div>

          {/* Formularz kontaktowy */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8">
            <h2 className="mb-6 text-2xl font-bold text-white">Wyślij wiadomość</h2>
            
            {submitted ? (
              <div className="rounded-lg bg-emerald-400/20 border border-emerald-400/40 p-6 text-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mx-auto mb-4 text-emerald-400">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className="text-lg font-semibold text-white">Wiadomość wysłana!</p>
                <p className="text-gray-400 mt-2">Odpowiemy najszybciej jak to możliwe.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-300">
                    Imię i nazwisko *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 transition-colors"
                    placeholder="Jan Kowalski"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-300">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 transition-colors"
                    placeholder="jan.kowalski@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block mb-2 text-sm font-medium text-gray-300">
                    Temat *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 transition-colors"
                    placeholder="Pytanie dotyczące funkcji"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block mb-2 text-sm font-medium text-gray-300">
                    Wiadomość *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows="6"
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 transition-colors resize-none"
                    placeholder="Napisz swoją wiadomość..."
                  />
                </div>

                <button
                  type="submit"
                  className="group relative w-full inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-bold text-white transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 active:scale-[0.98]"
                >
                  <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] opacity-90 transition-opacity group-hover:opacity-100" />
                  <span className="absolute inset-0 -z-10 rounded-full blur-md bg-emerald-500/20 group-hover:bg-emerald-500/30" />
                  <span className="relative">Wyślij wiadomość</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;


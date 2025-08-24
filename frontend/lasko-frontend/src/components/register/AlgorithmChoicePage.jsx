// frontend/lasko-frontend/src/components/register/AlgorithmChoicePage.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import RegisterBackground from '../../assets/Photos/Register_background.png';

/**
 * Strona wyboru ścieżki i algorytmu rekomendacji:
 * - Kafelek wycentrowany na środku viewportu (flex + min-h-screen)
 * - Dwie ścieżki (AI / Kreator) + trzy algorytmy dla ścieżki AI (pionowo, jak radio)
 * - ARIA: radiogroup dla obu sekcji, obsługa Enter/Spacja
 * - Spójny ciemny motyw, ringle focus, CTA przy dole
 */
const AlgorithmChoicePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userData = location.state?.userData || {};

  const [selectedAlgorithm, setSelectedAlgorithm] = useState('hybrydowo');
  const [selectedPath, setSelectedPath] = useState('ai'); // 'ai' | 'creator'

  const algorithmOptions = [
    {
      value: 'hybrydowo',
      name: 'Hybrydowy (Zalecany)',
      icon: '🎯',
      description:
        'Łączy dopasowanie do Twojej ankiety z popularnością wśród podobnych użytkowników.',
      pros: ['Najlepsze dopasowanie', 'Sprawdzone przez innych', 'Balans preferencji'],
      badge: 'NAJLEPSZY',
      details:
        'Analiza ankiety + wybory użytkowników o zbliżonym profilu (cel, poziom, dni, sprzęt).',
    },
    {
      value: 'produkt',
      name: 'Na podstawie ankiety',
      icon: '📋',
      description:
        'Dokładne dopasowanie wyłącznie do Twoich odpowiedzi w ankiecie.',
      pros: ['100% spersonalizowane', 'Oparte na preferencjach', 'Precyzyjne dopasowanie'],
      badge: null,
      details: 'Uwzględnia tylko Twoje odpowiedzi: cel, poziom, dni, sprzęt.',
    },
    {
      value: 'klient',
      name: 'Popularne wśród podobnych',
      icon: '👥',
      description:
        'Plany wybierane najczęściej przez osoby o podobnym profilu treningowym.',
      pros: ['Społeczne rekomendacje', 'Popularne wybory', 'Zweryfikowane w praktyce'],
      badge: null,
      details:
        'Proponuje plany najczęściej aktywowane przez osoby o Twoim celu i poziomie.',
    },
  ];

  const pathOptions = [
    {
      value: 'ai',
      name: 'AI dobierze plan',
      icon: '🤖',
      description: 'System automatycznie wybierze najlepsze plany z bazy.',
      action: 'Zobacz rekomendacje AI',
      subtitle: 'Szybko i efektywnie',
    },
    {
      value: 'creator',
      name: 'Stworzę własny plan',
      icon: '🛠️',
      description: 'Użyj kreatora do zbudowania planu od podstaw.',
      action: 'Przejdź do kreatora',
      subtitle: 'Pełna kontrola',
    },
  ];

  // Nawigacja po wyborze
  const handleProceed = () => {
    if (selectedPath === 'ai') {
      navigate('/recommended-plans', {
        state: {
          userData,
          selectedAlgorithm,
          algorithmDetails: algorithmOptions.find((o) => o.value === selectedAlgorithm),
        },
      });
    } else {
      navigate('/plan-creator', {
        state: {
          userData,
          skipBasicInfo: true,
          fromSurvey: true,
        },
      });
    }
  };

  // Podsumowanie profilu dla nagłówka
  const getUserProfileSummary = () => {
    const goalLabels = {
      masa: 'budowanie masy',
      siła: 'zwiększenie siły',
      wytrzymałość: 'poprawa wytrzymałości',
      spalanie: 'spalanie tkanki tłuszczowej',
      zdrowie: 'poprawa zdrowia',
    };
    const equipmentLabels = {
      siłownia: 'siłownia',
      dom_podstawowy: 'sprzęt domowy',
      masa_ciała: 'masa ciała',
      dom_zaawansowany: 'home gym',
    };
    return {
      goal: goalLabels[userData.goal] || userData.goal || 'nieokreślony cel',
      level: userData.level || 'nieokreślony poziom',
      days: userData.trainingDaysPerWeek || 'X',
      equipment:
        equipmentLabels[userData.equipmentPreference] ||
        userData.equipmentPreference ||
        'nieokreślony sprzęt',
    };
  };
  const profileSummary = getUserProfileSummary();

  // Obsługa aktywacji Enter/Spacja (radiogroup)
  const keyActivate = (e, fn) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fn();
    }
  };

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden"
      style={{
        backgroundImage: `url(${RegisterBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Nakładka */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] to-[#0D7A61]/90 opacity-90 mix-blend-multiply" />

      {/* Logo */}
      <div className="absolute top-8 left-8 z-10">
        <Link to="/" aria-label="Strona główna">
          <h1 className="text-[#1DCD9F] text-5xl font-bold">Lasko</h1>
        </Link>
      </div>

      {/* Kafelek wycentrowany */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
        <div
          className={[
            'bg-[#0a0a0a]/95 rounded-3xl border border-[#222222]',
            'shadow-[0_0_30px_10px_rgba(0,0,0,0.5)]',
            'w-full max-w-[860px]', // szerokość kafelka
            'p-6 md:p-8',
          ].join(' ')}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-white text-3xl md:text-4xl font-bold mb-3">
              Jak chcesz otrzymać rekomendacje?
            </h1>
            <p className="text-gray-300 text-base md:text-lg mb-4">
              Wybierz metodę dopasowania planów treningowych do Twoich potrzeb
            </p>

            <div className="bg-[#0D7A61]/20 border border-[#0D7A61]/30 rounded-xl p-4 max-w-2xl mx-auto">
              <div className="text-[#1DCD9F] text-sm font-bold mb-2">
                📋 Twój profil z ankiety:
              </div>
              <div className="text-gray-300 text-sm">
                <span className="text-white">{profileSummary.goal}</span> •
                <span className="text-white"> {profileSummary.level}</span> •
                <span className="text-white"> {profileSummary.days} dni/tydzień</span> •
                <span className="text-white"> {profileSummary.equipment}</span>
              </div>
            </div>
          </div>

          {/* Ścieżka (AI / Kreator) – pionowo */}
          <div className="mb-8">
            <h3 className="text-white text-xl font-bold mb-4 flex items-center">
              <span className="mr-3">🛤️</span>
              Wybierz ścieżkę:
            </h3>

            <div
              role="radiogroup"
              aria-label="Wybór ścieżki"
              className="flex flex-col gap-4"
            >
              {pathOptions.map((path) => {
                const active = selectedPath === path.value;
                return (
                  <button
                    key={path.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSelectedPath(path.value)}
                    onKeyDown={(e) => keyActivate(e, () => setSelectedPath(path.value))}
                    className={[
                      'text-left p-5 rounded-2xl transition-all duration-300 border-2',
                      active
                        ? 'border-[#1DCD9F] bg-[#1DCD9F]/10 shadow-[0_0_20px_rgba(29,205,159,0.25)]'
                        : 'border-[#333333] bg-[#1D1D1D] hover:border-[#555555]',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1DCD9F]/60',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-4xl leading-none">{path.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-bold text-lg">{path.name}</h4>
                          <span className="text-gray-400 text-xs">{path.subtitle}</span>
                        </div>
                        <p className="text-gray-300 text-sm mt-1">{path.description}</p>
                        <div
                          className={[
                            'mt-3 text-sm font-medium',
                            active ? 'text-[#1DCD9F]' : 'text-gray-400',
                          ].join(' ')}
                        >
                          {path.action}
                        </div>
                      </div>
                      {/* radio-indicator */}
                      <div
                        className={[
                          'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0',
                          active ? 'border-[#1DCD9F] bg-[#1DCD9F]' : 'border-gray-500',
                        ].join(' ')}
                        aria-hidden="true"
                      >
                        {active && <div className="w-3 h-3 bg-white rounded-full" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trzy algorytmy AI – pionowo */}
          {selectedPath === 'ai' && (
            <div className="mb-8">
              <h3 className="text-white text-xl font-bold mb-4 flex items-center">
                <span className="mr-3">🤖</span>
                Wybierz algorytm AI:
              </h3>

              <div
                role="radiogroup"
                aria-label="Wybór algorytmu AI"
                className="flex flex-col gap-4"
              >
                {algorithmOptions.map((algorithm) => {
                  const active = selectedAlgorithm === algorithm.value;
                  return (
                    <button
                      key={algorithm.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setSelectedAlgorithm(algorithm.value)}
                      onKeyDown={(e) =>
                        keyActivate(e, () => setSelectedAlgorithm(algorithm.value))
                      }
                      className={[
                        'text-left p-5 rounded-2xl transition-all duration-300 border-2',
                        active
                          ? 'border-[#1DCD9F] bg-[#1DCD9F]/10 shadow-[0_0_15px_rgba(29,205,159,0.2)]'
                          : 'border-[#333333] bg-[#1D1D1D] hover:border-[#555555]',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1DCD9F]/60',
                      ].join(' ')}
                    >
                      <div className="flex items-start gap-4">
                        <span className="text-3xl leading-none">{algorithm.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white font-bold text-lg">{algorithm.name}</h4>
                            {algorithm.badge && (
                              <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold">
                                {algorithm.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-300 text-sm">{algorithm.description}</p>
                          <p className="text-gray-400 text-xs italic mt-1">
                            {algorithm.details}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                            {algorithm.pros.map((pro, idx) => (
                              <div key={idx} className="text-[#1DCD9F] text-xs flex items-center">
                                <span className="mr-1">✓</span>
                                {pro}
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* radio-indicator */}
                        <div
                          className={[
                            'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0',
                            active ? 'border-[#1DCD9F] bg-[#1DCD9F]' : 'border-gray-500',
                          ].join(' ')}
                          aria-hidden="true"
                        >
                          {active && <div className="w-3 h-3 bg-white rounded-full" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Podsumowanie */}
          <div className="bg-[#1D1D1D] rounded-2xl p-6 border border-[#333333] mb-6">
            <h4 className="text-[#1DCD9F] font-bold mb-4 flex items-center">
              <span className="mr-2">📊</span>
              Podsumowanie Twoich wyborów:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Ścieżka:</span>
                  <span className="text-white font-medium">
                    {pathOptions.find((p) => p.value === selectedPath)?.name}
                  </span>
                </div>
                {selectedPath === 'ai' && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Algorytm AI:</span>
                    <span className="text-white font-medium">
                      {algorithmOptions.find((a) => a.value === selectedAlgorithm)?.name}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Twój cel:</span>
                  <span className="text-white font-medium">{profileSummary.goal}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Poziom:</span>
                  <span className="text-white font-medium">{profileSummary.level}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Dni/tydzień:</span>
                  <span className="text-white font-medium">{profileSummary.days}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#333333]">
              <div className="text-gray-400 text-sm mb-2">Co otrzymasz:</div>
              {selectedPath === 'ai' ? (
                <div className="text-white text-sm">
                  📋 {selectedAlgorithm === 'hybrydowo' ? '2–3 najlepsze' : '3–5'} planów dopasowanych
                  algorytmem{' '}
                  <span className="text-[#1DCD9F] font-medium">
                    {algorithmOptions.find((a) => a.value === selectedAlgorithm)?.name}
                  </span>
                  <div className="text-gray-400 text-xs mt-1">
                    + wyjaśnienie dopasowania do Twojego profilu
                  </div>
                </div>
              ) : (
                <div className="text-white text-sm">
                  🛠️ Kreator planu z danymi pre-wypełnionymi z ankiety
                  <div className="text-gray-400 text-xs mt-1">
                    + pełna możliwość dostosowania szczegółów
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-3 text-gray-400 hover:text-white transition-colors duration-300 flex items-center"
            >
              <span className="mr-2">←</span>
              Wróć do ankiety
            </button>

            <button
              onClick={handleProceed}
              className="px-8 py-4 bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white font-bold rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] hover:brightness-110 flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1DCD9F]/60"
            >
              {selectedPath === 'ai' ? (
                <>
                  <span className="mr-2">🤖</span>
                  Pokaż rekomendacje AI
                </>
              ) : (
                <>
                  <span className="mr-2">🛠️</span>
                  Otwórz kreator planu
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlgorithmChoicePage;
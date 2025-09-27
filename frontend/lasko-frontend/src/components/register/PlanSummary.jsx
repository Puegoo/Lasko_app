// frontend/src/components/register/PlanSummary.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function PlanSummary() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [planData, setPlanData] = useState(state?.planData || null);

  useEffect(() => {
    if (!state?.planData) {
      const raw = sessionStorage.getItem('lasko_plan_draft');
      if (raw) {
        try {
          setPlanData(JSON.parse(raw));
        } catch {
          setPlanData(null);
        }
      }
    }
  }, [state]);

  if (!planData) {
    return (
      <div className="min-h-screen bg-black text-white grid place-items-center p-6">
        <div className="max-w-md w-full bg-gray-900/60 border border-gray-700 rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold mb-3">Brak danych planu</h2>
          <p className="text-gray-300">
            Nie znaleziono danych planu do wyświetlenia. Wróć do kreatora i spróbuj ponownie.
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <button
              onClick={() => navigate('/enhanced-plan-creator')}
              className="px-5 py-2 rounded bg-green-600 hover:bg-green-500 font-semibold"
            >
              Wróć do kreatora
            </button>
            <Link
              to="/dashboard"
              className="px-5 py-2 rounded bg-gray-700 hover:bg-gray-600 font-semibold"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { recommendedPlan, name, goal, level, trainingDaysPerWeek, timePerSession, equipment } = {
    ...planData,
    equipment: planData.equipment ?? planData.equipment_preference
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 p-6 text-white">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold">Podsumowanie planu</h1>
          <div className="text-sm text-gray-300">
            Użytkownik: <span className="font-semibold">{user?.username}</span>
          </div>
        </header>

        <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">{name || 'Twój spersonalizowany plan'}</h2>
            <p className="text-gray-300 mt-1">
              Cel: <b>{goal}</b> • Poziom: <b>{level}</b> • Dni/tydz.: <b>{trainingDaysPerWeek}</b> • Czas/sesja: <b>{timePerSession} min</b> • Sprzęt: <b>{equipment}</b>
            </p>
          </div>

          {recommendedPlan ? (
            <div className="space-y-4">
              <div className="p-4 bg-gray-800/60 rounded-xl border border-gray-700">
                <h3 className="text-xl font-semibold mb-2">{recommendedPlan.name || 'Plan'}</h3>
                {recommendedPlan.description && (
                  <p className="text-gray-300 mb-3">{recommendedPlan.description}</p>
                )}
                {/* Przykład struktury — dostosuj do realnych pól */}
                {Array.isArray(recommendedPlan.days) && recommendedPlan.days.length > 0 && (
                  <div className="space-y-3">
                    {recommendedPlan.days.map((day, idx) => (
                      <div key={idx} className="p-3 bg-gray-900/50 rounded border border-gray-700">
                        <div className="font-semibold mb-1">Dzień {idx + 1}: {day.title || 'Trening'}</div>
                        {Array.isArray(day.exercises) && day.exercises.length > 0 ? (
                          <ul className="list-disc list-inside text-gray-300">
                            {day.exercises.map((ex, i) => (
                              <li key={i}>
                                {ex.name} {ex.sets ? `• ${ex.sets}x${ex.reps ?? '-'}` : ''}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-gray-400">Brak listy ćwiczeń</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-gray-400">Brak szczegółów planu (nie znam struktury – sprawdź payload z API)</div>
          )}

          <div className="mt-8 flex gap-3">
            <button
              onClick={() => navigate('/enhanced-plan-creator')}
              className="px-5 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 font-semibold"
            >
              Wróć do kreatora
            </button>
            <Link
              to="/dashboard"
              className="px-5 py-3 rounded-lg bg-green-600 hover:bg-green-500 font-semibold"
            >
              Przejdź do Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
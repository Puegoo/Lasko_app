// src/components/PlanCreatorPreview.jsx
import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PlanCreatorPreview = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const planData = location.state?.planData || null;
  const plan = planData?.recommendedPlan || null;

  const goBack = () => navigate(-1);

  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6">Podsumowanie planu</h1>
          <div className="p-6 bg-gray-900/60 border border-gray-700 rounded-xl text-gray-300">
            Nie mam nic do wyświetlenia. Wróć do kreatora i wygeneruj plan.
            <div className="mt-4">
              <Link to="/enhanced-plan-creator" className="text-green-400 underline">Przejdź do kreatora</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-3xl font-bold text-white">Podsumowanie planu</h1>
          <div className="text-sm text-gray-300">Użytkownik: <span className="font-semibold text-white">{user?.username}</span></div>
        </div>

        <div className="p-6 bg-gray-900/60 border border-gray-700 rounded-2xl">
          <h2 className="text-2xl font-semibold text-white mb-2">{planData?.name || plan.name}</h2>
          <div className="text-gray-400 mb-4">
            Cel: <span className="text-white">{plan.goal || '—'}</span> ·{' '}
            Poziom: <span className="text-white">{plan.level || '—'}</span> ·{' '}
            Dni/tydz.: <span className="text-white">{plan.training_days_per_week ?? '—'}</span> ·{' '}
            Sprzęt: <span className="text-white">{plan.equipment || '—'}</span>
          </div>

          <div className="p-4 bg-gray-800/70 rounded-xl border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
            <p className="text-gray-300 whitespace-pre-wrap">{plan.description || '—'}</p>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={goBack}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Wróć do kreatora
            </button>
            <Link
              to="/dashboard"
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
            >
              Przejdź do Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanCreatorPreview;
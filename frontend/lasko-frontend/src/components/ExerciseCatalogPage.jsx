import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import apiService from '../services/api';
import IconKit from './ui/IconKit';

// ---------- UI helpers ----------
const GradientGridBg = () => (
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
);

const SecondaryButton = ({ onClick, to, children, className = '' }) => {
  const Comp = to ? 'a' : 'button';
  const props = to ? { href: to } : { onClick };

  return (
    <Comp
      {...props}
      className={[
        'inline-flex items-center justify-center rounded-full border-2 border-emerald-400/60 px-7 py-3 text-sm font-bold text-emerald-300',
        'hover:bg-emerald-400/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60',
        className,
      ].join(' ')}
    >
      {children}
    </Comp>
  );
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-400/30 border-t-emerald-400"></div>
  </div>
);

// ---------- Main Component ----------
export default function ExerciseCatalogPage() {
  const navigate = useNavigate();
  const notify = useNotification();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    muscle_group: '',
    type: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0
  });

  useEffect(() => {
    fetchExercises();
  }, [pagination.page, filters]);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      const response = await apiService.request(`/api/exercises/?${params}`);
      
      if (response.success) {
        setExercises(response.exercises || []);
        setPagination(prev => ({
          ...prev,
          ...response.pagination
        }));
      }
    } catch (error) {
      console.error('[ExerciseCatalog] Error fetching exercises:', error);
      notify.error('Nie udało się pobrać listy ćwiczeń');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getMuscleGroupEmoji = (muscleGroup) => {
    const emojis = {
      'klatka': '💪',
      'plecy': '🦾',
      'nogi': '🦵',
      'ramiona': '💪',
      'brzuch': '🔥',
      'barki': '🏋️',
      'triceps': '💪',
      'biceps': '💪',
      'pośladki': '🍑',
      'łydki': '🦵',
      'przedramiona': '💪',
      'core': '🔥',
      'cardio': '❤️'
    };
    return emojis[muscleGroup?.toLowerCase()] || '🏋️';
  };

  const getTypeLabel = (type) => {
    const labels = {
      'strength': 'Siła',
      'hypertrophy': 'Hipertrofia',
      'endurance': 'Wytrzymałość',
      'power': 'Moc',
      'cardio': 'Cardio',
      'flexibility': 'Elastyczność'
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black">
      <GradientGridBg />
      
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 19l-7-7 7-7" />
            </svg>
            Wróć
          </button>
          
          <div className="flex items-center gap-4 mb-4">
            <IconKit.Dumbbell size="2xl" className="text-emerald-400" />
            <h1 className="text-5xl font-black text-white">
              Katalog Ćwiczeń
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Przeglądaj i filtruj dostępne ćwiczenia
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 backdrop-blur-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <IconKit.Search size="sm" /> Szukaj
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Wpisz nazwę ćwiczenia..."
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
              />
            </div>

            {/* Muscle Group */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <IconKit.Muscle size="sm" /> Partia mięśniowa
              </label>
              <div className="relative">
                <select
                  value={filters.muscle_group}
                  onChange={(e) => handleFilterChange('muscle_group', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all appearance-none cursor-pointer pr-10"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5 7.5l5 5 5-5' stroke='%2310B981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1.25rem'
                  }}
                >
                  <option value="" className="bg-gray-900 text-white">Wszystkie partie</option>
                  <option value="klatka" className="bg-gray-900 text-white">💪 Klatka piersiowa</option>
                  <option value="plecy" className="bg-gray-900 text-white">🦾 Plecy</option>
                  <option value="nogi" className="bg-gray-900 text-white">🦵 Nogi</option>
                  <option value="ramiona" className="bg-gray-900 text-white">💪 Ramiona</option>
                  <option value="brzuch" className="bg-gray-900 text-white">🔥 Brzuch</option>
                  <option value="barki" className="bg-gray-900 text-white">🏋️ Barki</option>
                </select>
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <IconKit.Target size="sm" /> Typ treningu
              </label>
              <div className="relative">
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all appearance-none cursor-pointer pr-10"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5 7.5l5 5 5-5' stroke='%2310B981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1.25rem'
                  }}
                >
                  <option value="" className="bg-gray-900 text-white">Wszystkie typy</option>
                  <option value="strength" className="bg-gray-900 text-white">💪 Siła</option>
                  <option value="hypertrophy" className="bg-gray-900 text-white">📈 Hipertrofia</option>
                  <option value="endurance" className="bg-gray-900 text-white">⚡ Wytrzymałość</option>
                  <option value="power" className="bg-gray-900 text-white">🚀 Moc</option>
                  <option value="cardio" className="bg-gray-900 text-white">❤️ Cardio</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
            <span>Znaleziono: {pagination.total} ćwiczeń</span>
            {(filters.search || filters.muscle_group || filters.type) && (
              <button
                onClick={() => {
                  setFilters({ muscle_group: '', type: '', search: '' });
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <IconKit.Close size="xs" className="inline" /> Wyczyść filtry
              </button>
            )}
          </div>
        </div>

        {/* Exercise List */}
        {loading ? (
          <LoadingSpinner />
        ) : exercises.length === 0 ? (
          <div className="text-center py-12">
            <IconKit.Search size="2xl" className="text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Brak wyników</h2>
            <p className="text-gray-400">Spróbuj zmienić filtry wyszukiwania</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-400/30 transition-all duration-300 p-6 group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">
                        {getMuscleGroupEmoji(exercise.muscle_group)}
                      </span>
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                          {exercise.name}
                        </h3>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">
                          {exercise.muscle_group}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-400 mb-4 line-clamp-3">
                    {exercise.description || 'Brak opisu'}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-300 text-xs font-medium">
                      {getTypeLabel(exercise.type)}
                    </span>
                  </div>

                  {/* Media Links */}
                  {(exercise.video_url || exercise.image_url) && (
                    <div className="mt-4 pt-4 border-t border-white/10 flex gap-3">
                      {exercise.video_url && (
                        <a
                          href={exercise.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                        >
                          📹 Wideo
                        </a>
                      )}
                      {exercise.image_url && (
                        <a
                          href={exercise.image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                        >
                          🖼️ Zdjęcie
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-6 py-2 rounded-full border border-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
                >
                  ← Poprzednia
                </button>
                
                <span className="text-gray-400">
                  Strona {pagination.page} z {pagination.total_pages}
                </span>

                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.total_pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.total_pages}
                  className="px-6 py-2 rounded-full border border-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
                >
                  Następna →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


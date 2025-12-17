import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import apiService from '../services/api';
import IconKit from './ui/IconKit';
import ExerciseDetailModal from './ExerciseDetailModal';

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
  const location = useLocation();
  const notify = useNotification();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    muscle_group: '',
    type: '',
    search: '',
    favorites_only: false
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0
  });
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Sprawdź parametry URL przy montowaniu komponentu
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('favorites') === 'true') {
      setFilters(prev => ({ ...prev, favorites_only: true }));
    }
    setInitialLoadDone(true);
  }, []);

  useEffect(() => {
    // Nie fetchuj dopóki nie sprawdzono URL
    if (initialLoadDone) {
      fetchExercises();
    }
  }, [pagination.page, filters, initialLoadDone]);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      
      // Jeśli jest aktywny filtr ulubionych, użyj dedykowanego endpointu
      if (filters.favorites_only) {
        const response = await apiService.request('/api/exercises/favorites/');
        if (response.success) {
          setExercises(response.favorites || []);
          setPagination({
            page: 1,
            limit: 20,
            total: response.count || 0,
            total_pages: 1
          });
        }
      } else {
        const params = new URLSearchParams({
          page: pagination.page,
          limit: pagination.limit,
          muscle_group: filters.muscle_group,
          type: filters.type,
          search: filters.search
        });

        const response = await apiService.request(`/api/exercises/?${params}`);
        
        if (response.success) {
          setExercises(response.exercises || []);
          setPagination(prev => ({
            ...prev,
            ...response.pagination
          }));
        }
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

  const handleToggleFavorite = async (exerciseId, event) => {
    event.stopPropagation(); // Zapobiega otworzeniu modalu
    try {
      // Optymistyczna aktualizacja UI (natychmiastowa zmiana)
      setExercises(prev => prev.map(ex => 
        ex.id === exerciseId 
          ? { ...ex, is_favorite: !ex.is_favorite }
          : ex
      ));

      const response = await apiService.request(`/api/exercises/${exerciseId}/favorite/`, {
        method: 'POST'
      });
      
      if (response.success) {
        notify.success(response.message);
        // Zaktualizuj stan na podstawie odpowiedzi z serwera (w razie różnic)
        setExercises(prev => prev.map(ex => 
          ex.id === exerciseId 
            ? { ...ex, is_favorite: response.is_favorite }
            : ex
        ));
      }
    } catch (error) {
      console.error('[ExerciseCatalog] Error toggling favorite:', error);
      notify.error('Nie udało się zaktualizować ulubionych');
      // Cofnij optymistyczną zmianę
      setExercises(prev => prev.map(ex => 
        ex.id === exerciseId 
          ? { ...ex, is_favorite: !ex.is_favorite }
          : ex
      ));
    }
  };

  const handleOpenDetail = (exerciseId) => {
    setSelectedExerciseId(exerciseId);
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedExerciseId(null);
    // Odśwież listę na wypadek zmian (np. oceny, ulubione)
    fetchExercises();
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
      'flexibility': 'Elastyczność',
      'compound': 'Wielostawowe',
      'isolation': 'Izolowane'
    };
    return labels[type?.toLowerCase()] || type;
  };

  const translateMuscleGroup = (muscleGroup) => {
    const translations = {
      'chest': 'klatka piersiowa',
      'back': 'plecy',
      'legs': 'nogi',
      'shoulders': 'barki',
      'arms': 'ramiona',
      'biceps': 'biceps',
      'triceps': 'triceps',
      'forearms': 'przedramiona',
      'abs': 'brzuch',
      'core': 'core',
      'glutes': 'pośladki',
      'hamstrings': 'ścięgna podkolanowe',
      'quadriceps': 'czworogłowy uda',
      'calves': 'łydki',
      'klatka': 'klatka piersiowa',
      'plecy': 'plecy',
      'nogi': 'nogi',
      'ramiona': 'ramiona',
      'brzuch': 'brzuch',
      'barki': 'barki'
    };
    return translations[muscleGroup?.toLowerCase()] || muscleGroup;
  };

  const translateDescription = (description) => {
    if (!description) return description;
    
    const replacements = {
      'compound': 'wielostawowe',
      'Compound': 'Wielostawowe',
      'isolation': 'izolowane',
      'Isolation': 'Izolowane',
      'chest': 'klatka piersiowa',
      'Chest': 'Klatka piersiowa',
      'back': 'plecy',
      'Back': 'Plecy',
      'legs': 'nogi',
      'Legs': 'Nogi',
      'shoulders': 'barki',
      'Shoulders': 'Barki',
      'arms': 'ramiona',
      'Arms': 'Ramiona',
      'biceps': 'biceps',
      'Biceps': 'Biceps',
      'triceps': 'triceps',
      'Triceps': 'Triceps',
      'grupa:': 'partia mięśniowa:',
      'group:': 'partia mięśniowa:',
      'exercise': 'ćwiczenie',
      'Exercise': 'Ćwiczenie'
    };
    
    let translated = description;
    Object.entries(replacements).forEach(([eng, pol]) => {
      const regex = new RegExp(`\\b${eng}\\b`, 'g');
      translated = translated.replace(regex, pol);
    });
    
    return translated;
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
          {/* Quick Filter Buttons */}
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => handleFilterChange('favorites_only', !filters.favorites_only)}
              className={[
                'px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2',
                filters.favorites_only
                  ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              ].join(' ')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={filters.favorites_only ? 'text-white' : 'text-red-400'}>
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
              </svg>
              Ulubione {filters.favorites_only && pagination.total > 0 && `(${pagination.total})`}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                Szukaj
              </label>
              <div className="relative">
                <IconKit.Search size="md" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Wpisz nazwę ćwiczenia..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
                />
              </div>
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
                  <option value="klatka" className="bg-gray-900 text-white">Klatka piersiowa</option>
                  <option value="plecy" className="bg-gray-900 text-white">Plecy</option>
                  <option value="nogi" className="bg-gray-900 text-white">Nogi</option>
                  <option value="ramiona" className="bg-gray-900 text-white">Ramiona</option>
                  <option value="brzuch" className="bg-gray-900 text-white">Brzuch</option>
                  <option value="barki" className="bg-gray-900 text-white">Barki</option>
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
                  <option value="strength" className="bg-gray-900 text-white">Siła</option>
                  <option value="hypertrophy" className="bg-gray-900 text-white">Hipertrofia</option>
                  <option value="endurance" className="bg-gray-900 text-white">Wytrzymałość</option>
                  <option value="power" className="bg-gray-900 text-white">Moc</option>
                  <option value="cardio" className="bg-gray-900 text-white">Cardio</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
            <span>
              {filters.favorites_only 
                ? `Ulubione: ${pagination.total} ćwiczeń` 
                : `Znaleziono: ${pagination.total} ćwiczeń`
              }
            </span>
            {(filters.search || filters.muscle_group || filters.type || filters.favorites_only) && (
              <button
                onClick={() => {
                  setFilters({ muscle_group: '', type: '', search: '', favorites_only: false });
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
                  className={`rounded-2xl bg-white/5 p-6 group cursor-pointer transition-all duration-300 ${
                    exercise.is_favorite 
                      ? 'border-2 border-red-500/60 hover:border-red-500/80 shadow-lg shadow-red-500/20' 
                      : 'border border-white/10 hover:bg-white/10 hover:border-emerald-400/30'
                  }`}
                  onClick={() => handleOpenDetail(exercise.id)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                          {exercise.name}
                        </h3>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">
                          {translateMuscleGroup(exercise.muscle_group)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Favorite Button */}
                    <button
                      onClick={(e) => handleToggleFavorite(exercise.id, e)}
                      className="p-2 rounded-full hover:bg-white/10 transition-all group/fav"
                      title={exercise.is_favorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
                    >
                      {exercise.is_favorite ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-red-500">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
                        </svg>
                      ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-gray-500 group-hover/fav:text-red-400 group-hover/fav:scale-110 transition-all">
                          <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z" fill="currentColor"/>
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* User Rating */}
                  {exercise.user_rating && (
                    <div className="mb-3 flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-yellow-400">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
                      </svg>
                      <span className="text-sm text-gray-300">
                        Twoja ocena: {exercise.user_rating}/5
                      </span>
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-sm text-gray-400 mb-4 line-clamp-3">
                    {translateDescription(exercise.description) || 'Brak opisu'}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-300 text-xs font-medium">
                      {getTypeLabel(exercise.type)}
                    </span>
                  </div>
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

        {/* Exercise Detail Modal */}
        <ExerciseDetailModal
          exerciseId={selectedExerciseId}
          isOpen={showDetailModal}
          onClose={handleCloseDetail}
        />
      </div>
    </div>
  );
}


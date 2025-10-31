import React, { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import apiService from '../services/api';
import IconKit from './ui/IconKit';

// Star Rating Component
const StarRating = ({ rating, onRate, readonly = false }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (value) => {
    if (!readonly && onRate) {
      onRate(value);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => handleClick(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          className={`transition-all ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
          disabled={readonly}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className={star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-600'}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
          </svg>
        </button>
      ))}
    </div>
  );
};

// Trend Indicator Component
const TrendIndicator = ({ trend, value }) => {
  if (trend === 'increasing') {
    return (
      <div className="flex items-center gap-1 text-emerald-400">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 3L13 8L8 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(-90 8 8)" />
        </svg>
        <span className="text-sm font-bold">+{value?.toFixed(1)}%</span>
      </div>
    );
  } else if (trend === 'decreasing') {
    return (
      <div className="flex items-center gap-1 text-red-400">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 3L13 8L8 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(90 8 8)" />
        </svg>
        <span className="text-sm font-bold">{value?.toFixed(1)}%</span>
      </div>
    );
  }
  return <span className="text-sm text-gray-400">Stabilny</span>;
};

// Translate tag names to Polish
const translateTag = (tagName) => {
  const translations = {
    'compound': 'wielostawowe',
    'isolation': 'izolowane',
    'core': 'core',
    'upper body': 'górna partia',
    'lower body': 'dolna partia',
    'push': 'pchnięcie',
    'pull': 'ciągnięcie',
    'bodyweight': 'masa ciała',
    'barbell': 'sztanga',
    'dumbbell': 'hantle',
    'machine': 'maszyna',
    'cable': 'wyciąg',
    'beginner': 'początkujący',
    'intermediate': 'średniozaawansowany',
    'advanced': 'zaawansowany',
    'strength': 'siła',
    'hypertrophy': 'hipertrofia',
    'endurance': 'wytrzymałość',
    'power': 'moc',
    'cardio': 'cardio',
    'flexibility': 'elastyczność'
  };
  return translations[tagName?.toLowerCase()] || tagName;
};

// Translate muscle groups to Polish
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
    'traps': 'barki (trapez)',
    'lats': 'plecy (najszerszy)',
    'delts': 'barki (deltoid)'
  };
  return translations[muscleGroup?.toLowerCase()] || muscleGroup;
};

// Translate description (replace English terms with Polish)
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

// Main Modal Component
export default function ExerciseDetailModal({ exerciseId, isOpen, onClose }) {
  const notify = useNotification();
  const [loading, setLoading] = useState(true);
  const [exercise, setExercise] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, statistics, alternatives

  useEffect(() => {
    if (isOpen && exerciseId) {
      fetchExerciseDetails();
      fetchExerciseStatistics();
    }
  }, [isOpen, exerciseId]);

  const fetchExerciseDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.request(`/api/exercises/${exerciseId}/detail/`);
      if (response.success) {
        setExercise(response.exercise);
      }
    } catch (error) {
      console.error('[ExerciseDetailModal] Error fetching details:', error);
      notify.error('Nie udało się pobrać szczegółów ćwiczenia');
    } finally {
      setLoading(false);
    }
  };

  const fetchExerciseStatistics = async () => {
    try {
      const response = await apiService.request(`/api/exercises/${exerciseId}/statistics/`);
      if (response.success) {
        setStatistics(response.statistics);
      }
    } catch (error) {
      console.error('[ExerciseDetailModal] Error fetching statistics:', error);
      // Nie pokazujemy błędu - statystyki nie są krytyczne
    }
  };

  const handleRate = async (rating) => {
    try {
      const response = await apiService.request(`/api/exercises/${exerciseId}/rate/`, {
        method: 'POST',
        body: JSON.stringify({ rating })
      });
      
      if (response.success) {
        notify.success(`Oceniono na ${rating} gwiazdek`);
        // Odśwież dane
        setExercise(prev => ({
          ...prev,
          user_rating: rating,
          average_rating: response.new_average,
          rating_count: response.rating_count
        }));
      }
    } catch (error) {
      console.error('[ExerciseDetailModal] Error rating exercise:', error);
      notify.error('Nie udało się zapisać oceny');
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const response = await apiService.request(`/api/exercises/${exerciseId}/favorite/`, {
        method: 'POST'
      });
      
      if (response.success) {
        notify.success(response.message);
        setExercise(prev => ({
          ...prev,
          is_favorite: response.is_favorite
        }));
      }
    } catch (error) {
      console.error('[ExerciseDetailModal] Error toggling favorite:', error);
      notify.error('Nie udało się zaktualizować ulubionych');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-black border border-white/10 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <IconKit.Close size="md" className="text-white" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[90vh] p-8 scrollbar-hide">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
            </div>
          ) : !exercise ? (
            <div className="text-center py-20 text-gray-400">
              Nie znaleziono szczegółów ćwiczenia
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-start gap-4 mb-4">
                  {/* Favorite Button - PO LEWEJ */}
                  <button
                    onClick={handleToggleFavorite}
                    className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-all group flex-shrink-0"
                    title={exercise.is_favorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
                  >
                    {exercise.is_favorite ? (
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-red-500">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
                      </svg>
                    ) : (
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-gray-400 group-hover:text-red-400 group-hover:scale-110 transition-all">
                        <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z" fill="currentColor"/>
                      </svg>
                    )}
                  </button>

                  <div className="flex-1">
                    <h2 className="text-4xl font-black text-white mb-2">
                      {exercise.name}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-300 font-medium">
                        {translateMuscleGroup(exercise.muscle_group)}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-blue-400/10 text-blue-300 font-medium">
                        {translateTag(exercise.type)}
                      </span>
                      {exercise.user_session_count > 0 && (
                        <span className="text-gray-500">
                          Wykonano {exercise.user_session_count}x
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rating Section */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Twoja ocena:</p>
                      <StarRating 
                        rating={exercise.user_rating || 0} 
                        onRate={handleRate}
                      />
                    </div>
                    {exercise.average_rating && (
                      <div className="text-right">
                        <p className="text-sm text-gray-400 mb-1">Średnia ocena:</p>
                        <div className="flex items-center gap-2 justify-end">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-yellow-400">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
                          </svg>
                          <span className="text-2xl font-bold text-yellow-400">
                            {exercise.average_rating.toFixed(1)}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({exercise.rating_count} ocen)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="mb-6 flex gap-2 border-b border-white/10">
                {[
                  { id: 'overview', label: '📖 Przegląd' },
                  { id: 'statistics', label: '📊 Statystyki' },
                  { id: 'alternatives', label: '🔄 Alternatywy' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={[
                      'px-6 py-3 font-medium transition-all',
                      activeTab === tab.id
                        ? 'text-emerald-400 border-b-2 border-emerald-400'
                        : 'text-gray-400 hover:text-white'
                    ].join(' ')}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Description */}
                  {exercise.description && (
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                      <h3 className="text-xl font-bold text-white mb-3">Opis</h3>
                      <p className="text-gray-300 leading-relaxed">{translateDescription(exercise.description)}</p>
                    </div>
                  )}

                  {/* Video & Image */}
                  {(exercise.video_url || exercise.image_url) && (
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                      <h3 className="text-xl font-bold text-white mb-4">Media</h3>
                      <div className="space-y-3">
                        {exercise.video_url && (
                          <div>
                            {exercise.video_url.includes('youtube.com') || exercise.video_url.includes('youtu.be') ? (
                              <div className="aspect-video rounded-xl overflow-hidden">
                                <iframe
                                  src={exercise.video_url.replace('watch?v=', 'embed/')}
                                  className="w-full h-full"
                                  allowFullScreen
                                  title="Exercise video"
                                />
                              </div>
                            ) : (
                              <a
                                href={exercise.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                              >
                                <IconKit.Play size="sm" />
                                Otwórz wideo
                              </a>
                            )}
                          </div>
                        )}
                        {exercise.image_url && (
                          <a
                            href={exercise.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                              <circle cx="8.5" cy="8.5" r="1.5"/>
                              <polyline points="21 15 16 10 5 21"/>
                            </svg>
                            Zobacz zdjęcie
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Equipment */}
                  {exercise.equipment && exercise.equipment.length > 0 && (
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                      <h3 className="text-xl font-bold text-white mb-4">Wymagany sprzęt</h3>
                      <div className="flex flex-wrap gap-2">
                        {exercise.equipment.map((eq) => (
                          <span
                            key={eq.id}
                            className="px-4 py-2 rounded-full bg-purple-400/10 text-purple-300 text-sm font-medium"
                          >
                            {eq.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {exercise.tags && exercise.tags.length > 0 && (
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                      <h3 className="text-xl font-bold text-white mb-4">Tagi</h3>
                      <div className="flex flex-wrap gap-2">
                        {exercise.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="px-4 py-2 rounded-full bg-gray-700 text-gray-300 text-sm"
                          >
                            #{translateTag(tag.name)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}


                  {/* Personal Record */}
                  {exercise.personal_record && (
                    <div className="rounded-2xl bg-gradient-to-br from-yellow-400/10 to-orange-400/10 border border-yellow-400/30 p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">🏆</span>
                        <h3 className="text-xl font-bold text-white">Osobisty rekord</h3>
                      </div>
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-black text-yellow-400">
                          {exercise.personal_record.value} kg
                        </span>
                        <span className="text-lg text-gray-400">
                          × {exercise.personal_record.reps} powtórzeń
                        </span>
                      </div>
                      {exercise.personal_record.date && (
                        <p className="text-sm text-gray-500 mt-2">
                          Ustanowiono: {new Date(exercise.personal_record.date).toLocaleDateString('pl-PL')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'statistics' && statistics && (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
                      <div className="text-3xl font-black text-emerald-400">
                        {statistics.total_sessions}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">Sesje</div>
                    </div>
                    {statistics.last_performed && (
                      <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
                        <div className="text-lg font-bold text-white">
                          {new Date(statistics.last_performed).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">Ostatnio</div>
                      </div>
                    )}
                    {statistics.personal_record && (
                      <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
                        <div className="text-2xl font-black text-yellow-400">
                          {statistics.personal_record.value}kg
                        </div>
                        <div className="text-sm text-gray-400 mt-1">🏆 Rekord</div>
                      </div>
                    )}
                    {statistics.progress.recent_average_weight && (
                      <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
                        <div className="text-3xl font-black text-blue-400">
                          {statistics.progress.recent_average_weight.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">kg śr.</div>
                      </div>
                    )}
                    {statistics.progress.progress_percentage !== null && (
                      <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
                        <TrendIndicator 
                          trend={statistics.progress.trend} 
                          value={statistics.progress.progress_percentage}
                        />
                        <div className="text-sm text-gray-400 mt-1">Trend</div>
                      </div>
                    )}
                  </div>

                  {/* History */}
                  {statistics.history && statistics.history.length > 0 && (
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                      <h3 className="text-xl font-bold text-white mb-4">Historia wykonań</h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {statistics.history.map((entry, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-xl bg-black/40 hover:bg-black/60 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-500">
                                {new Date(entry.date).toLocaleDateString('pl-PL')}
                              </span>
                              <span className="text-white font-medium">
                                Seria {entry.set_number}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-emerald-400 font-bold">
                                {entry.reps} x {entry.weight ? `${entry.weight}kg` : 'BW'}
                              </span>
                              {entry.notes && (
                                <span className="text-xs text-gray-500 italic max-w-[200px] truncate">
                                  {entry.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'alternatives' && (
                <div className="space-y-6">
                  {exercise.alternatives && exercise.alternatives.length > 0 ? (
                    <div className="grid gap-4">
                      {exercise.alternatives.map((alt) => (
                        <div
                          key={alt.id}
                          className="rounded-2xl bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition-colors cursor-pointer"
                          onClick={() => {
                            // Można tu dodać nawigację do alternatywnego ćwiczenia
                            notify.info(`Kliknięto: ${alt.name}`);
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-lg font-bold text-white mb-1">{alt.name}</h4>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs px-2 py-1 rounded-full bg-emerald-400/10 text-emerald-300">
                                  {translateMuscleGroup(alt.muscle_group)}
                                </span>
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-400/10 text-blue-300">
                                  {translateTag(alt.type)}
                                </span>
                              </div>
                              {alt.reason && (
                                <p className="text-sm text-gray-400">{translateDescription(alt.reason)}</p>
                              )}
                            </div>
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                              <path d="M9 18l6-6-6-6" />
                            </svg>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      Brak zdefiniowanych alternatyw dla tego ćwiczenia
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}


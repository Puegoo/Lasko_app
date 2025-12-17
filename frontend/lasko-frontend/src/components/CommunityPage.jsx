import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import apiService from '../services/api';
import IconKit from './ui/IconKit';

// ---------- UI Components ----------
const GradientGridBg = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
    <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-[#1DCD9F]/10 blur-3xl" />
    <div className="absolute top-1/3 -right-20 w-96 h-96 rounded-full bg-[#0D7A61]/10 blur-3xl" />
  </div>
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-400/30 border-t-emerald-400"></div>
  </div>
);

// Karta użytkownika
const UserCard = ({ user, onClick, showSimilarity = false }) => {
  const goalLabels = {
    'masa': 'Masa',
    'redukcja': 'Redukcja',
    'sila': 'Siła',
    'wytrzymalosc': 'Wytrzymałość'
  };

  const levelLabels = {
    'poczatkujacy': 'Początkujący',
    'sredniozaawansowany': 'Średnio zaawansowany',
    'zaawansowany': 'Zaawansowany'
  };

  const formatLastWorkout = (dateStr) => {
    if (!dateStr) return 'Brak danych';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Dziś';
    if (diffDays === 1) return 'Wczoraj';
    if (diffDays < 7) return `${diffDays} dni temu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tyg. temu`;
    return `${Math.floor(diffDays / 30)} mies. temu`;
  };

  return (
    <div
      onClick={onClick}
      className="rounded-2xl bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {user.profile_picture ? (
              <img
                src={`http://localhost:8000${user.profile_picture}`}
                alt={user.first_name || user.username}
                className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400/20"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-black font-bold text-lg">
                {(user.first_name || user.username || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                {user.first_name || user.username}
              </h3>
              <p className="text-sm text-gray-400">@{user.username}</p>
            </div>
          </div>
        </div>
        
        {showSimilarity && user.similarity_score && (
          <div className="flex flex-col items-end">
            <div className="text-3xl font-bold text-emerald-400">{user.similarity_score}%</div>
            <div className="text-xs text-gray-400">dopasowanie</div>
          </div>
        )}
      </div>

      {/* Profile info */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {user.goal && (
          <div className="flex items-center gap-2 text-sm">
            <IconKit.Target size="sm" className="text-blue-400" />
            <span className="text-gray-300">{goalLabels[user.goal] || user.goal}</span>
          </div>
        )}
        {user.level && (
          <div className="flex items-center gap-2 text-sm">
            <IconKit.ChartUp size="sm" className="text-purple-400" />
            <span className="text-gray-300">{levelLabels[user.level] || user.level}</span>
          </div>
        )}
        {user.training_days_per_week && (
          <div className="flex items-center gap-2 text-sm">
            <IconKit.Calendar size="sm" className="text-yellow-400" />
            <span className="text-gray-300">{user.training_days_per_week}×/tydzień</span>
          </div>
        )}
        {user.equipment_preference && (
          <div className="flex items-center gap-2 text-sm">
            <IconKit.Dumbbell size="sm" className="text-emerald-400" />
            <span className="text-gray-300">{user.equipment_preference}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <IconKit.Dumbbell size="xs" className="text-emerald-400" />
            <span className="text-gray-300">{user.total_workouts || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <IconKit.Trophy size="xs" className="text-yellow-400" />
            <span className="text-gray-300">{user.total_prs || 0}</span>
          </div>
        </div>
        <div className="text-xs text-gray-400">
          {formatLastWorkout(user.last_workout)}
        </div>
      </div>
    </div>
  );
};

// Modal profilu użytkownika
const UserProfileModal = ({ userId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [plans, setPlans] = useState(null);
  const notify = useNotification();

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [profileRes, statsRes, plansRes] = await Promise.all([
        apiService.request(`/api/community/user/${userId}/`),
        apiService.request(`/api/community/user/${userId}/stats/`),
        apiService.request(`/api/community/user/${userId}/plans/`)
      ]);

      if (profileRes.success) setProfile(profileRes.profile);
      if (statsRes.success) setStats(statsRes.stats);
      if (plansRes.success) setPlans(plansRes);

    } catch (error) {
      console.error('[UserProfileModal] Error:', error);
      notify.error('Nie udało się pobrać profilu użytkownika');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const goalLabels = {
    'masa': 'Masa',
    'redukcja': 'Redukcja',
    'sila': 'Siła',
    'wytrzymalosc': 'Wytrzymałość'
  };

  const levelLabels = {
    'poczatkujacy': 'Początkujący',
    'sredniozaawansowany': 'Średnio zaawansowany',
    'zaawansowany': 'Zaawansowany'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-[#1a1a1a] to-black border border-white/10 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-[#1a1a1a] to-[#1a1a1a]/95 backdrop-blur-sm border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <IconKit.Star size="lg" className="text-emerald-400" />
            Profil Użytkownika
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <IconKit.Close size="md" className="text-gray-400" />
          </button>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="p-6 space-y-6">
            {/* Profile info */}
            {profile && (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-black font-bold text-3xl">
                    {(profile.first_name || profile.username || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {profile.first_name || profile.username}
                    </h3>
                    <p className="text-gray-400">@{profile.username}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {profile.goal && (
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Cel</div>
                      <div className="text-white font-semibold">{goalLabels[profile.goal] || profile.goal}</div>
                    </div>
                  )}
                  {profile.level && (
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Poziom</div>
                      <div className="text-white font-semibold">{levelLabels[profile.level] || profile.level}</div>
                    </div>
                  )}
                  {profile.training_days_per_week && (
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Treningi</div>
                      <div className="text-white font-semibold">{profile.training_days_per_week}×/tydzień</div>
                    </div>
                  )}
                  {profile.equipment_preference && (
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Sprzęt</div>
                      <div className="text-white font-semibold">{profile.equipment_preference}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Statistics */}
            {stats && (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <IconKit.ChartBar size="md" className="text-blue-400" />
                  Statystyki
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-xs text-gray-400 mb-1">Treningi</div>
                    <div className="text-2xl font-bold text-emerald-400">{stats.total_workouts}</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-xs text-gray-400 mb-1">Streak</div>
                    <div className="text-2xl font-bold text-yellow-400">{stats.current_streak} dni</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-xs text-gray-400 mb-1">Rekordy</div>
                    <div className="text-2xl font-bold text-purple-400">{stats.personal_records}</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-xs text-gray-400 mb-1">Łączny czas</div>
                    <div className="text-2xl font-bold text-blue-400">{formatDuration(stats.total_minutes)}</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-xs text-gray-400 mb-1">Średni czas</div>
                    <div className="text-2xl font-bold text-teal-400">{stats.avg_duration}m</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-xs text-gray-400 mb-1">Wolumen</div>
                    <div className="text-2xl font-bold text-orange-400">{Math.round(stats.total_volume / 1000)}t</div>
                  </div>
                </div>

                {/* Top exercises */}
                {stats.top_exercises && stats.top_exercises.length > 0 && (
                  <div className="mt-6">
                    <div className="text-sm font-semibold text-white mb-3">Top 3 Ćwiczenia</div>
                    <div className="space-y-2">
                      {stats.top_exercises.map((ex, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-emerald-400/20 flex items-center justify-center text-xs font-bold text-emerald-400">
                              {idx + 1}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-white">{ex.name}</div>
                              <div className="text-xs text-gray-400">{ex.muscle_group}</div>
                            </div>
                          </div>
                          <div className="text-sm font-bold text-emerald-400">
                            {ex.times_trained}× trenowany
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Plans */}
            {plans && (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <IconKit.Document size="md" className="text-purple-400" />
                  Plany Treningowe
                </h4>

                {/* Active plan */}
                {plans.active_plan ? (
                  <div className="mb-6">
                    <div className="text-sm font-semibold text-emerald-400 mb-2">Aktywny Plan</div>
                    <div className="bg-white/5 rounded-xl p-4 border border-emerald-400/20">
                      <div className="text-white font-bold mb-1">{plans.active_plan.name}</div>
                      <div className="text-sm text-gray-400 mb-3">{plans.active_plan.description}</div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="px-2 py-1 rounded-full bg-blue-400/20 text-blue-400">
                          {goalLabels[plans.active_plan.goal_type] || plans.active_plan.goal_type}
                        </span>
                        <span className="px-2 py-1 rounded-full bg-purple-400/20 text-purple-400">
                          {plans.active_plan.training_days_per_week}×/tydzień
                        </span>
                        {plans.active_plan.rating && (
                          <span className="flex items-center gap-1 text-yellow-400">
                            <IconKit.Star size="xs" /> {plans.active_plan.rating}/5
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-400 text-sm mb-6">
                    Brak aktywnego planu
                  </div>
                )}

                {/* Completed plans */}
                {plans.completed_plans && plans.completed_plans.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-gray-400 mb-2">Ukończone Plany</div>
                    <div className="space-y-2">
                      {plans.completed_plans.map((plan, idx) => (
                        <div key={idx} className="bg-white/5 rounded-lg p-3">
                          <div className="text-sm font-semibold text-white">{plan.name}</div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                            <span>{plan.goal_type}</span>
                            <span>•</span>
                            <span>{plan.training_days_per_week}×/tydzień</span>
                            {plan.rating && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-yellow-400">
                                  <IconKit.Star size="xs" /> {plan.rating}/5
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ---------- Main Component ----------
export default function CommunityPage() {
  const navigate = useNavigate();
  const notify = useNotification();
  const [activeTab, setActiveTab] = useState('similar');
  const [loading, setLoading] = useState(true);
  const [similarUsers, setSimilarUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [goalFilter, setGoalFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 30;
  const searchTimeoutRef = useRef(null);

  const fetchSimilarUsers = async (page = 1) => {
    try {
      setLoading(true);
      const response = await apiService.request(`/api/community/similar-users/?limit=${itemsPerPage}&page=${page}`);
      
      if (response.success) {
        setSimilarUsers(response.users);
        // Calculate total pages based on total users
        const total = response.total || response.users.length;
        setTotalPages(Math.ceil(total / itemsPerPage));
      }
    } catch (error) {
      console.error('[CommunityPage] Error fetching similar users:', error);
      notify.error('Nie udało się pobrać podobnych użytkowników');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      if (page === 1) setCurrentPage(1);
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (goalFilter) params.append('goal', goalFilter);
      if (levelFilter) params.append('level', levelFilter);
      params.append('limit', itemsPerPage);
      params.append('page', page);
      
      const response = await apiService.request(`/api/community/search/?${params.toString()}`);
      
      if (response.success) {
        setSearchResults(response.users);
        const total = response.total || response.users.length;
        setTotalPages(Math.ceil(total / itemsPerPage));
      } else {
        setSearchResults([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('[CommunityPage] Error searching users:', error);
      notify.error('Nie udało się wyszukać użytkowników');
      setSearchResults([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, goalFilter, levelFilter, itemsPerPage, notify]);

  useEffect(() => {
    if (activeTab === 'similar') {
      setCurrentPage(1);
      fetchSimilarUsers(1);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'similar') {
      fetchSimilarUsers(currentPage);
    }
    // For search tab, pagination is handled by the debounced effect below
  }, [currentPage, activeTab]);

  // Debounced search when searchQuery, goalFilter, or levelFilter changes
  useEffect(() => {
    if (activeTab === 'search') {
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        if (searchQuery || goalFilter || levelFilter) {
          handleSearch(currentPage);
        } else {
          setSearchResults([]);
          setTotalPages(1);
        }
      }, 500); // 500ms debounce

      return () => {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, goalFilter, levelFilter, activeTab, currentPage]);

  const clearFilters = () => {
    setSearchQuery('');
    setGoalFilter('');
    setLevelFilter('');
    setSearchResults([]);
    setCurrentPage(1);
    setTotalPages(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black">
      <GradientGridBg />
      
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 19l-7-7 7-7" />
            </svg>
            Wróć do Dashboard
          </button>
          
          <div className="flex items-center gap-4 mb-4">
            <IconKit.Star size="2xl" className="text-emerald-400" />
            <h1 className="text-5xl font-black text-white">
              Społeczność
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Znajdź podobnych użytkowników i porównuj swoje postępy
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('similar')}
            className={`px-6 py-3 rounded-full font-bold transition-all ${
              activeTab === 'similar'
                ? 'bg-emerald-400 text-black'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <IconKit.Star size="sm" className="inline mr-2" />
            Podobni Użytkownicy
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-6 py-3 rounded-full font-bold transition-all ${
              activeTab === 'search'
                ? 'bg-emerald-400 text-black'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <IconKit.Search size="md" />
              Wyszukaj
            </span>
          </button>
        </div>

        {/* Content */}
        {activeTab === 'similar' && (
          <div>
            {loading ? (
              <LoadingSpinner />
            ) : similarUsers.length === 0 ? (
              <div className="text-center py-16">
                <IconKit.Star size="2xl" className="text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">
                  Nie znaleziono podobnych użytkowników
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Uzupełnij swój profil, aby znaleźć użytkowników o podobnych celach
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {similarUsers.map((user) => (
                    <UserCard
                      key={user.user_id}
                      user={user}
                      showSimilarity={true}
                      onClick={() => setSelectedUser(user.user_id)}
                    />
                  ))}
                </div>

                {/* Pagination for similar users */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    >
                      <IconKit.ChevronLeft size="sm" /> Poprzednia
                    </button>
                    
                    <div className="flex gap-1">
                      {[...Array(totalPages)].map((_, idx) => {
                        const page = idx + 1;
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                                currentPage === page
                                  ? 'bg-emerald-400 text-black'
                                  : 'bg-white/5 hover:bg-white/10 text-white'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return <span key={page} className="text-gray-500">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    >
                      Następna <IconKit.ChevronRight size="sm" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div>
            {/* Search form */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Search input */}
                <div className="md:col-span-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                    Szukaj po nazwie użytkownika
                  </label>
                  <div className="relative">
                    <IconKit.Search size="md" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Wpisz nazwę użytkownika..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                    />
                  </div>
                </div>

                {/* Goal filter */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                    <IconKit.Target size="sm" /> Cel
                  </label>
                  <select
                    value={goalFilter}
                    onChange={(e) => setGoalFilter(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/60 appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%239CA3AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 1rem center',
                      backgroundSize: '12px'
                    }}
                  >
                    <option value="">Wszystkie</option>
                    <option value="masa">Masa</option>
                    <option value="redukcja">Redukcja</option>
                    <option value="sila">Siła</option>
                    <option value="wytrzymalosc">Wytrzymałość</option>
                  </select>
                </div>

                {/* Level filter */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                    <IconKit.ChartUp size="sm" /> Poziom
                  </label>
                  <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/60 appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%239CA3AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 1rem center',
                      backgroundSize: '12px'
                    }}
                  >
                    <option value="">Wszystkie</option>
                    <option value="poczatkujacy">Początkujący</option>
                    <option value="sredniozaawansowany">Średnio zaawansowany</option>
                    <option value="zaawansowany">Zaawansowany</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => handleSearch(1)}
                    className="flex-1 px-6 py-3 rounded-xl bg-emerald-400 text-black font-bold hover:bg-emerald-500 transition-colors"
                  >
                    <span className="inline-flex items-center gap-2">
                      <IconKit.Search size="sm" />
                      Szukaj
                    </span>
                  </button>
                  {(searchQuery || goalFilter || levelFilter) && (
                    <button
                      onClick={clearFilters}
                      className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <IconKit.Close size="sm" className="text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Search results */}
            {loading ? (
              <LoadingSpinner />
            ) : searchResults.length === 0 ? (
              <div className="text-center py-16">
                <IconKit.Search size="2xl" className="text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">
                  {searchQuery || goalFilter || levelFilter 
                    ? 'Nie znaleziono użytkowników spełniających kryteria'
                    : 'Wpisz frazę lub wybierz filtry aby wyszukać użytkowników'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.map((user) => (
                    <UserCard
                      key={user.user_id}
                      user={user}
                      showSimilarity={false}
                      onClick={() => setSelectedUser(user.user_id)}
                    />
                  ))}
                </div>

                {/* Pagination for search results */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    >
                      <IconKit.ChevronLeft size="sm" /> Poprzednia
                    </button>
                    
                    <div className="flex gap-1">
                      {[...Array(totalPages)].map((_, idx) => {
                        const page = idx + 1;
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                                currentPage === page
                                  ? 'bg-emerald-400 text-black'
                                  : 'bg-white/5 hover:bg-white/10 text-white'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return <span key={page} className="text-gray-500">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    >
                      Następna <IconKit.ChevronRight size="sm" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      {selectedUser && (
        <UserProfileModal
          userId={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}


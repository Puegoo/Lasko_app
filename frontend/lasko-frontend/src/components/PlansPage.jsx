import React, { useState, useEffect } from 'react';
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

const Kicker = ({ children }) => (
  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
    {children}
  </div>
);

// Plan Card Component
const PlanCard = ({ plan, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="group relative rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-left transition-all hover:border-emerald-400/40 hover:bg-white/[0.06] cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
            {plan.name}
          </h3>
          {plan.description && (
            <p className="text-sm text-gray-400 line-clamp-2">{plan.description}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {plan.goal && (
          <span className="px-3 py-1 text-xs rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
            <IconKit.Target size="xs" className="inline mr-1" />
            {plan.goal}
          </span>
        )}
        {plan.difficulty_level && (
          <span className="px-3 py-1 text-xs rounded-full bg-blue-400/10 text-blue-400 border border-blue-400/20">
            <IconKit.ChartBar size="xs" className="inline mr-1" />
            {plan.difficulty_level}
          </span>
        )}
        {plan.training_days_per_week && (
          <span className="px-3 py-1 text-xs rounded-full bg-purple-400/10 text-purple-400 border border-purple-400/20">
            <IconKit.Calendar size="xs" className="inline mr-1" />
            {plan.training_days_per_week}x/tydz.
          </span>
        )}
        {plan.equipment_required && (
          <span className="px-3 py-1 text-xs rounded-full bg-orange-400/10 text-orange-400 border border-orange-400/20">
            <IconKit.Dumbbell size="xs" className="inline mr-1" />
            {plan.equipment_required}
          </span>
        )}
      </div>

      {plan.auth_account_id === null && (
        <div className="absolute top-4 right-4">
          <span className="px-2 py-1 text-xs rounded bg-yellow-400/20 text-yellow-400 border border-yellow-400/30">
            <IconKit.Star size="xs" className="inline mr-1" />
            Systemowy
          </span>
        </div>
      )}
    </div>
  );
};

// ---------- Main Component ----------
export default function PlansPage() {
  const navigate = useNavigate();
  const notify = useNotification();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [goalFilter, setGoalFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [daysFilter, setDaysFilter] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      // Fetch all plans from the database
      const response = await apiService.request('/api/recommendations/plans/');
      
      if (response.success && response.plans) {
        setPlans(response.plans);
      }
    } catch (error) {
      console.error('[PlansPage] Error fetching plans:', error);
      notify.error('Nie udało się pobrać planów treningowych');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // Filter plans based on search criteria
    let filtered = [...plans];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(plan =>
        plan.name.toLowerCase().includes(query) ||
        (plan.description && plan.description.toLowerCase().includes(query))
      );
    }

    if (goalFilter) {
      filtered = filtered.filter(plan => plan.goal === goalFilter);
    }

    if (levelFilter) {
      filtered = filtered.filter(plan => plan.difficulty_level === levelFilter);
    }

    if (daysFilter) {
      filtered = filtered.filter(plan => plan.training_days_per_week === parseInt(daysFilter));
    }

    if (equipmentFilter) {
      filtered = filtered.filter(plan => plan.equipment_required === equipmentFilter);
    }

    return filtered;
  };

  const clearFilters = () => {
    setSearchQuery('');
    setGoalFilter('');
    setLevelFilter('');
    setDaysFilter('');
    setEquipmentFilter('');
  };

  const filteredPlans = handleSearch();

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black">
      <GradientGridBg />
      
      <div className="relative mx-auto max-w-7xl px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-4 flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-emerald-400"
          >
            ← Powrót do Dashboard
          </button>
          <Kicker>Biblioteka Planów</Kicker>
          <h1 className="mb-4 flex items-center gap-3 text-4xl font-black text-white">
            <IconKit.Document size="2xl" className="text-purple-400" />
            Plany Treningowe
          </h1>
          <p className="text-lg text-gray-400">
            Wyszukaj i aktywuj plan treningowy dopasowany do Twoich celów
          </p>
        </div>

        {/* Search and Filters */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search input */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <IconKit.Search size="sm" /> Szukaj planu
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Wpisz nazwę lub opis planu..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
              />
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

            {/* Days per week filter */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <IconKit.Calendar size="sm" /> Dni treningowe
              </label>
              <select
                value={daysFilter}
                onChange={(e) => setDaysFilter(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/60 appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%239CA3AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '12px'
                }}
              >
                <option value="">Wszystkie</option>
                <option value="1">1x/tydz.</option>
                <option value="2">2x/tydz.</option>
                <option value="3">3x/tydz.</option>
                <option value="4">4x/tydz.</option>
                <option value="5">5x/tydz.</option>
                <option value="6">6x/tydz.</option>
                <option value="7">7x/tydz.</option>
              </select>
            </div>

            {/* Equipment filter */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <IconKit.Dumbbell size="sm" /> Sprzęt
              </label>
              <select
                value={equipmentFilter}
                onChange={(e) => setEquipmentFilter(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/60 appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%239CA3AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '12px'
                }}
              >
                <option value="">Wszystkie</option>
                <option value="Siłownia">Siłownia</option>
                <option value="Dom">Dom</option>
                <option value="Hantle">Hantle</option>
                <option value="Maszyny">Maszyny</option>
                <option value="Własny ciężar">Własny ciężar</option>
              </select>
            </div>

            {/* Clear filters button */}
            {(searchQuery || goalFilter || levelFilter || daysFilter || equipmentFilter) && (
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                >
                  <IconKit.Close size="xs" className="inline mr-2" />
                  Wyczyść filtry
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <LoadingSpinner />
        ) : filteredPlans.length === 0 ? (
          <div className="text-center py-16">
            <IconKit.Search size="2xl" className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">
              {searchQuery || goalFilter || levelFilter || daysFilter || equipmentFilter
                ? 'Nie znaleziono planów spełniających kryteria'
                : 'Brak dostępnych planów treningowych'}
            </p>
            {(searchQuery || goalFilter || levelFilter || daysFilter || equipmentFilter) && (
              <button
                onClick={clearFilters}
                className="mt-4 px-6 py-2 rounded-xl bg-emerald-400 text-black font-semibold hover:bg-emerald-500 transition-colors"
              >
                Wyczyść filtry
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-400">
              Znaleziono <span className="text-white font-semibold">{filteredPlans.length}</span> {
                filteredPlans.length === 1 ? 'plan' :
                filteredPlans.length < 5 ? 'plany' : 'planów'
              }
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onClick={() => navigate(`/plan/${plan.id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


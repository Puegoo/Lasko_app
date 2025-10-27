import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import apiService from '../services/api';
import { DeleteButton } from './ui/ActionButtons';
import IconKit from './ui/IconKit';

// ---------- UI Components ----------
const GradientGridBg = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
    <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-[#1DCD9F]/10 blur-3xl" />
    <div className="absolute top-1/3 -right-20 w-96 h-96 rounded-full bg-[#0D7A61]/10 blur-3xl" />
  </div>
);

const PrimaryButton = ({ onClick, children, className = '', disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`group relative inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-bold text-white transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 active:scale-[0.98] ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
  >
    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" />
    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 blur transition-opacity group-hover:opacity-80" />
    <span className="relative flex items-center gap-2">{children}</span>
  </button>
);

const SecondaryButton = ({ onClick, children, className = '' }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center justify-center rounded-full border-2 border-emerald-400/60 px-7 py-3 text-sm font-bold text-emerald-300 hover:bg-emerald-400/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 ${className}`}
  >
    {children}
  </button>
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-400/30 border-t-emerald-400"></div>
  </div>
);

// Simple Line Chart Component (bez zewnętrznych bibliotek)
const SimpleLineChart = ({ data, xKey, yKey, color = '#10B981', height = 200 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        Brak danych do wyświetlenia
      </div>
    );
  }

  const values = data.map(d => d[yKey]).filter(v => v !== null && v !== undefined && !isNaN(v));
  
  if (values.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        Brak prawidłowych danych do wyświetlenia
      </div>
    );
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  // Dla pojedynczego punktu
  if (data.length === 1) {
    return (
      <div className="relative flex items-center justify-center" style={{ height: `${height}px` }}>
        <div className="text-center">
          <div className="text-4xl font-bold text-emerald-400 mb-2">
            {data[0][yKey]}
          </div>
          <div className="text-sm text-gray-400">
            {data[0][xKey]}
          </div>
          <div className="mt-4 text-xs text-gray-500">
            Dodaj więcej pomiarów aby zobaczyć wykres
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ height: `${height}px` }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="overflow-visible">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(percent => (
          <line
            key={percent}
            x1="0"
            y1={percent}
            x2="100"
            y2={percent}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* Line */}
        <polyline
          points={data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - ((d[yKey] - minValue) / range) * 100;
            return `${x},${y}`;
          }).join(' ')}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Points */}
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = 100 - ((d[yKey] - minValue) / range) * 100;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="2"
              fill={color}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
    </div>
  );
};

// ---------- Main Component ----------
export default function ProgressPage() {
  const navigate = useNavigate();
  const notify = useNotification();
  const [activeTab, setActiveTab] = useState('weight'); // weight | records | metrics
  const [loading, setLoading] = useState(true);
  
  // Measurements state
  const [measurements, setMeasurements] = useState([]);
  const [bodyStats, setBodyStats] = useState(null);
  const [newMeasurement, setNewMeasurement] = useState({
    weight_kg: '',
    body_fat_percentage: '',
    notes: ''
  });
  
  // Personal Records state
  const [personalRecords, setPersonalRecords] = useState([]);
  
  // Progress Metrics state
  const [progressMetrics, setProgressMetrics] = useState([]);
  const [newMetric, setNewMetric] = useState({
    metric_name: 'biceps_cm',
    metric_value: '',
    notes: ''
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchMeasurements(),
      fetchBodyStats(),
      fetchPersonalRecords(),
      fetchProgressMetrics()
    ]);
    setLoading(false);
  };

  const fetchMeasurements = async () => {
    try {
      const response = await apiService.request('/api/progress/measurements/?days=90');
      if (response.success) {
        setMeasurements(response.measurements || []);
      }
    } catch (error) {
      console.error('[ProgressPage] Error fetching measurements:', error);
    }
  };

  const fetchBodyStats = async () => {
    try {
      const response = await apiService.request('/api/progress/body-stats/');
      if (response.success) {
        setBodyStats(response.stats);
      }
    } catch (error) {
      console.error('[ProgressPage] Error fetching body stats:', error);
    }
  };

  const fetchPersonalRecords = async () => {
    try {
      const response = await apiService.request('/api/progress/personal-records/');
      if (response.success) {
        setPersonalRecords(response.records || []);
      }
    } catch (error) {
      console.error('[ProgressPage] Error fetching personal records:', error);
    }
  };

  const fetchProgressMetrics = async () => {
    try {
      const response = await apiService.request('/api/progress/metrics/');
      if (response.success) {
        setProgressMetrics(response.metrics || []);
      }
    } catch (error) {
      console.error('[ProgressPage] Error fetching progress metrics:', error);
    }
  };

  const handleAddMeasurement = async (e) => {
    e.preventDefault();
    
    if (!newMeasurement.weight_kg) {
      notify.warning('Podaj wagę');
      return;
    }

    try {
      const response = await apiService.request('/api/progress/measurements/add/', {
        method: 'POST',
        body: JSON.stringify({
          weight_kg: parseFloat(newMeasurement.weight_kg),
          body_fat_percentage: newMeasurement.body_fat_percentage ? parseFloat(newMeasurement.body_fat_percentage) : null,
          notes: newMeasurement.notes
        })
      });

      if (response.success) {
        notify.success('Pomiar został zapisany!');
        setNewMeasurement({ weight_kg: '', body_fat_percentage: '', notes: '' });
        await fetchMeasurements();
        await fetchBodyStats();
      }
    } catch (error) {
      console.error('[ProgressPage] Error adding measurement:', error);
      notify.error('Nie udało się zapisać pomiaru');
    }
  };

  const handleAddMetric = async (e) => {
    e.preventDefault();
    
    if (!newMetric.metric_value) {
      notify.warning('Podaj wartość');
      return;
    }

    try {
      const response = await apiService.request('/api/progress/metrics/add/', {
        method: 'POST',
        body: JSON.stringify({
          metric_name: newMetric.metric_name,
          metric_value: parseFloat(newMetric.metric_value),
          notes: newMetric.notes
        })
      });

      if (response.success) {
        notify.success('Metryka została zapisana!');
        setNewMetric({ metric_name: 'biceps_cm', metric_value: '', notes: '' });
        await fetchProgressMetrics();
      }
    } catch (error) {
      console.error('[ProgressPage] Error adding metric:', error);
      notify.error('Nie udało się zapisać metryki');
    }
  };

  const deleteMeasurement = async (id) => {
    if (!confirm('Czy na pewno chcesz usunąć ten pomiar?')) return;

    try {
      await apiService.request(`/api/progress/measurements/${id}/`, {
        method: 'DELETE'
      });
      notify.success('Pomiar został usunięty');
      await fetchMeasurements();
      await fetchBodyStats();
    } catch (error) {
      notify.error('Nie udało się usunąć pomiaru');
    }
  };

  // Grupuj PR po ćwiczeniach
  const groupedPRs = personalRecords.reduce((acc, pr) => {
    if (!acc[pr.exercise_name]) {
      acc[pr.exercise_name] = [];
    }
    acc[pr.exercise_name].push(pr);
    return acc;
  }, {});

  // Grupuj metryki po nazwie
  const groupedMetrics = progressMetrics.reduce((acc, metric) => {
    if (!acc[metric.metric_name]) {
      acc[metric.metric_name] = [];
    }
    acc[metric.metric_name].push(metric);
    return acc;
  }, {});

  const metricLabels = {
    'biceps_cm': 'Obwód bicepsa',
    'chest_cm': 'Obwód klatki',
    'waist_cm': 'Obwód talii',
    'thigh_cm': 'Obwód uda',
    'calf_cm': 'Obwód łydki',
    'height_cm': 'Wzrost',
    '1rm_bench': '1RM Wyciskanie',
    '1rm_squat': '1RM Przysiad',
    '1rm_deadlift': '1RM Martwy ciąg'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

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
            <IconKit.ChartUp size="2xl" className="text-emerald-400" />
            <h1 className="text-5xl font-black text-white">
              Moje Postępy
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Śledź swoje wyniki, pomiary i rekordy osobiste
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('weight')}
            className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'weight'
                ? 'bg-emerald-400 text-black'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            <IconKit.ChartUp size="sm" /> Waga i Pomiary
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'records'
                ? 'bg-emerald-400 text-black'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            <IconKit.Trophy size="sm" /> Rekordy Osobiste
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'metrics'
                ? 'bg-emerald-400 text-black'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            <IconKit.ChartBar size="sm" /> Metryki Ciała
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* TAB: Waga i Pomiary */}
          {activeTab === 'weight' && (
            <>
              {/* Stats Cards */}
              {bodyStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  {/* BMI */}
                  <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/20 p-6">
                    <div className="text-sm text-gray-400 mb-2">BMI</div>
                    <div className="text-3xl font-bold text-white mb-1">
                      {bodyStats.bmi?.toFixed(1) || '-'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {bodyStats.bmi < 18.5 ? 'Niedowaga' :
                       bodyStats.bmi < 25 ? 'Prawidłowa' :
                       bodyStats.bmi < 30 ? 'Nadwaga' : 'Otyłość'}
                    </div>
                  </div>

                  {/* BMR */}
                  <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/20 p-6">
                    <div className="text-sm text-gray-400 mb-2">BMR</div>
                    <div className="text-3xl font-bold text-white mb-1">
                      {bodyStats.bmr || '-'}
                    </div>
                    <div className="text-xs text-gray-500">kcal/dzień</div>
                  </div>

                  {/* TDEE */}
                  <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-400/20 p-6">
                    <div className="text-sm text-gray-400 mb-2">TDEE</div>
                    <div className="text-3xl font-bold text-white mb-1">
                      {bodyStats.tdee || '-'}
                    </div>
                    <div className="text-xs text-gray-500">kcal/dzień</div>
                  </div>

                  {/* Body Fat */}
                  <div className="rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-400/20 p-6">
                    <div className="text-sm text-gray-400 mb-2">Tkanka tłuszczowa</div>
                    <div className="text-3xl font-bold text-white mb-1">
                      {bodyStats.body_fat_percentage?.toFixed(1) || '-'}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {bodyStats.fat_mass?.toFixed(1)}kg tłuszczu
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Wykres wagi */}
                <div className="lg:col-span-2 rounded-2xl bg-white/5 border border-white/10 p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Wykres wagi</h3>
                  {measurements.length > 0 ? (
                    <>
                      <SimpleLineChart 
                        data={[...measurements].reverse()} 
                        xKey="date" 
                        yKey="weight_kg"
                        color="#10B981"
                        height={250}
                      />
                      <div className="mt-4 flex justify-between text-sm text-gray-400">
                        <span>{measurements[measurements.length - 1]?.date}</span>
                        <span>{measurements[0]?.date}</span>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Aktualna</div>
                          <div className="text-lg font-bold text-emerald-400">
                            {measurements[0]?.weight_kg?.toFixed(1)} kg
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Zmiana</div>
                          <div className={`text-lg font-bold ${
                            measurements.length > 1 && measurements[0].weight_kg > measurements[measurements.length - 1].weight_kg
                              ? 'text-red-400'
                              : 'text-emerald-400'
                          }`}>
                            {measurements.length > 1 
                              ? `${(measurements[0].weight_kg - measurements[measurements.length - 1].weight_kg).toFixed(1)} kg`
                              : '-'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Pomiarów</div>
                          <div className="text-lg font-bold text-white">
                            {measurements.length}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      Brak pomiarów. Dodaj pierwszy pomiar aby zobaczyć wykres!
                    </div>
                  )}
                </div>

                {/* Dodaj pomiar */}
                <div className="rounded-2xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Dodaj pomiar</h3>
                  <form onSubmit={handleAddMeasurement} className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Waga (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newMeasurement.weight_kg}
                        onChange={(e) => setNewMeasurement(prev => ({ ...prev, weight_kg: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                        placeholder="75.5"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Tkanka tłuszczowa (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newMeasurement.body_fat_percentage}
                        onChange={(e) => setNewMeasurement(prev => ({ ...prev, body_fat_percentage: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                        placeholder="15.2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Notatki (opcjonalnie)</label>
                      <textarea
                        value={newMeasurement.notes}
                        onChange={(e) => setNewMeasurement(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 resize-none"
                        rows="3"
                        placeholder="Po porannym treningu..."
                      />
                    </div>

                    <PrimaryButton type="submit" className="w-full">
                      <IconKit.Document size="sm" className="inline" /> Zapisz pomiar
                    </PrimaryButton>
                  </form>

                  {/* Historia pomiarów */}
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">Ostatnie pomiary</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {measurements.slice(0, 5).map(m => (
                        <div key={m.id} className="flex items-center justify-between text-sm p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                          <div>
                            <div className="text-white font-medium">{m.weight_kg} kg</div>
                            <div className="text-xs text-gray-400">{m.date}</div>
                          </div>
                          <DeleteButton
                            onClick={() => deleteMeasurement(m.id)}
                            size="xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB: Rekordy Osobiste */}
          {activeTab === 'records' && (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <IconKit.Trophy size="lg" className="text-yellow-400" /> Twoje Rekordy Osobiste
                </h3>
                <div className="text-sm text-gray-400">
                  {personalRecords.length} rekordów
                </div>
              </div>

              {Object.keys(groupedPRs).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(groupedPRs).map(([exerciseName, records]) => (
                    <div key={exerciseName} className="rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-400/20 p-6">
                      <h4 className="text-lg font-bold text-white mb-4">{exerciseName}</h4>
                      <div className="space-y-2">
                        {records.slice(0, 3).map((record, idx) => (
                          <div key={record.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-300">{record.reps} powtórzeń</span>
                            <span className="text-yellow-400 font-bold">{record.weight_kg} kg</span>
                            {idx === 0 && (
                              <span className="text-xs px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-300">
                                Najlepszy
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-400">
                        Ostatni rekord: {records[0]?.record_date}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏋️</div>
                  <h3 className="text-xl font-bold text-white mb-2">Brak rekordów osobistych</h3>
                  <p className="text-gray-400 mb-4">
                    Rozpocznij trening i automatycznie zapiszemy Twoje pierwsze PR!
                  </p>
                  <SecondaryButton onClick={() => navigate('/workout/today')}>
                    Rozpocznij trening
                  </SecondaryButton>
                </div>
              )}
            </div>
          )}

          {/* TAB: Metryki Ciała */}
          {activeTab === 'metrics' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Dodaj metrykę */}
              <div className="rounded-2xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 p-6">
                <h3 className="text-xl font-bold text-white mb-4">Dodaj metrykę</h3>
                <form onSubmit={handleAddMetric} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Typ metryki</label>
                    <select
                      value={newMetric.metric_name}
                      onChange={(e) => setNewMetric(prev => ({ ...prev, metric_name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 appearance-none cursor-pointer"
                    >
                      <option value="biceps_cm">💪 Obwód bicepsa (cm)</option>
                      <option value="chest_cm">🫁 Obwód klatki (cm)</option>
                      <option value="waist_cm">⭕ Obwód talii (cm)</option>
                      <option value="thigh_cm">🦵 Obwód uda (cm)</option>
                      <option value="calf_cm">🦵 Obwód łydki (cm)</option>
                      <option value="1rm_bench">🏋️ 1RM Wyciskanie (kg)</option>
                      <option value="1rm_squat">🏋️ 1RM Przysiad (kg)</option>
                      <option value="1rm_deadlift">🏋️ 1RM Martwy ciąg (kg)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Wartość</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newMetric.metric_value}
                      onChange={(e) => setNewMetric(prev => ({ ...prev, metric_value: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                      placeholder="35.0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Notatki (opcjonalnie)</label>
                    <textarea
                      value={newMetric.notes}
                      onChange={(e) => setNewMetric(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 resize-none"
                      rows="2"
                      placeholder="Po pompce..."
                    />
                  </div>

                  <PrimaryButton type="submit" className="w-full">
                    <IconKit.Document size="sm" className="inline" /> Zapisz metrykę
                  </PrimaryButton>
                </form>
              </div>

              {/* Wykresy metryk */}
              <div className="lg:col-span-2 space-y-4">
                {Object.keys(groupedMetrics).length > 0 ? (
                  Object.entries(groupedMetrics).map(([metricName, metrics]) => (
                    <div key={metricName} className="rounded-2xl bg-white/5 border border-white/10 p-6">
                      <h4 className="text-lg font-bold text-white mb-4">
                        {metricLabels[metricName] || metricName}
                      </h4>
                      {metrics.length > 1 ? (
                        <>
                          <SimpleLineChart 
                            data={[...metrics].reverse()} 
                            xKey="measurement_date" 
                            yKey="metric_value"
                            color="#8B5CF6"
                            height={150}
                          />
                          <div className="mt-3 flex justify-between text-sm">
                            <span className="text-gray-400">
                              Start: {metrics[metrics.length - 1]?.metric_value} {metricName.includes('cm') ? 'cm' : 'kg'}
                            </span>
                            <span className="text-emerald-400 font-medium">
                              Teraz: {metrics[0]?.metric_value} {metricName.includes('cm') ? 'cm' : 'kg'}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-400 text-sm">
                          Dodaj więcej pomiarów aby zobaczyć trend
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500 rounded-2xl bg-white/5 border border-white/10">
                    Brak metryk. Dodaj pierwszy pomiar!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


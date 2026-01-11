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

const SecondaryButton = ({ onClick, children, className = '' }) => (
<button
onClick={onClick}
className={`inline-flex items-center justify-center rounded-full border-2 border-emerald-400/60 px-7 py-3 text-sm font-bold text-emerald-300 hover:bg-emerald-400/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 ${className}`}
>
{children}
</button>
);

// Komponent wykresu liniowego (wolumen)
const VolumeChart = ({ data }) => {
if (!data || data.length === 0) {
return (
<div className="text-center py-12 text-gray-400">
Brak danych do wyświetlenia
</div>
);
}

const values = data.map(d => d.total_volume).filter(v => v !== null && v !== undefined && !isNaN(v));
if (values.length === 0) {
return (
<div className="text-center py-12 text-gray-400">
Brak prawidłowych danych do wyświetlenia
</div>
);
}

const minVolume = Math.min(...values);
const maxVolume = Math.max(...values);
const range = maxVolume - minVolume || 1;
const padding = range * 0.1;
const adjustedMin = Math.max(0, minVolume - padding);
const adjustedMax = maxVolume + padding;
const adjustedRange = adjustedMax - adjustedMin;

const height = 300;

if (data.length === 1) {
return (
<div className="text-center py-12">
<div className="text-4xl font-bold text-emerald-400">{Math.round(data[0].total_volume)} kg</div>
<div className="text-sm text-gray-400 mt-2">{data[0].period}</div>
</div>
);
}

// Oblicz punkty dla wykresu
const points = data.map((d, i) => {
const x = data.length === 1 ? 50 : (i / (data.length - 1)) * 100;
const y = 100 - (((d.total_volume - adjustedMin) / adjustedRange) * 90 + 5);
return { x, y, volume: d.total_volume, period: d.period };
});

const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');

return (
<div className="relative" style={{ height: `${height}px` }}>
<svg
width="100%"
height="100%"
viewBox="0 0 100 100"
preserveAspectRatio="none"
style={{ display: 'block' }}
>
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
{/* Gradient fill */}
<defs>
<linearGradient id="volumeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
<stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
<stop offset="100%" stopColor="#10B981" stopOpacity="0" />
</linearGradient>
</defs>
{/* Area fill */}
<polygon
points={`0,100 ${pointsString} 100,100`}
fill="url(#volumeGradient)"
/>
{/* Line */}
<polyline
points={pointsString}
fill="none"
stroke="#10B981"
strokeWidth="2.5"
strokeLinecap="round"
strokeLinejoin="round"
vectorEffect="non-scaling-stroke"
/>
</svg>
{/* Labels */}
<div className="flex justify-between mt-2 text-xs text-gray-400">
<span>{data[0]?.period}</span>
<span>{data[data.length - 1]?.period}</span>
</div>
</div>
);
};

// Komponent heatmapy (GitHub style)
const TrainingHeatmap = ({ data }) => {
if (!data || data.length === 0) {
return (
<div className="text-center py-8 text-gray-400">
Brak danych treningowych
</div>
);
}

// Przygotuj dane dla ostatnich 365 dni
const today = new Date();
const daysArray = [];
for (let i = 364; i >= 0; i--) {
const date = new Date(today);
date.setDate(date.getDate() - i);
const dateStr = date.toISOString().split('T')[0];
const dayData = data.find(d => d.date === dateStr);
daysArray.push({
date: dateStr,
count: dayData?.session_count || 0,
duration: dayData?.total_duration || 0
});
}

// Grupuj po tygodniach (7 dni)
const weeks = [];
for (let i = 0; i < daysArray.length; i += 7) {
weeks.push(daysArray.slice(i, i + 7));
}

const getColor = (count) => {
if (count === 0) return 'bg-white/5';
if (count === 1) return 'bg-emerald-400/30';
if (count === 2) return 'bg-emerald-400/60';
return 'bg-emerald-400';
};

return (
<div className="overflow-x-auto">
<div className="inline-block min-w-full">
<div className="flex gap-1">
{weeks.map((week, weekIdx) => (
<div key={weekIdx} className="flex flex-col gap-1">
{week.map((day, dayIdx) => (
<div
key={dayIdx}
className={`w-3 h-3 rounded-sm ${getColor(day.count)} transition-all hover:ring-2 hover:ring-emerald-400 cursor-pointer`}
title={`${day.date}: ${day.count} ${day.count === 1 ? 'trening' : 'treningów'}${day.duration ? `, ${day.duration} min` : ''}`}
/>
))}
</div>
))}
</div>
{/* Legend */}
<div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
<span>Mniej</span>
<div className="w-3 h-3 rounded-sm bg-white/5" />
<div className="w-3 h-3 rounded-sm bg-emerald-400/30" />
<div className="w-3 h-3 rounded-sm bg-emerald-400/60" />
<div className="w-3 h-3 rounded-sm bg-emerald-400" />
<span>Więcej</span>
</div>
</div>
</div>
);
};

// Komponent wykresu słupkowego (częstotliwość)
const FrequencyBarChart = ({ data }) => {
if (!data || data.length === 0) {
return (
<div className="text-center py-12 text-gray-400">
Brak danych do wyświetlenia
</div>
);
}

const maxCount = Math.max(...data.map(d => d.session_count));

const muscleLabels = {
'klatka': 'Klatka',
'plecy': 'Plecy',
'nogi': 'Nogi',
'ramiona': 'Ramiona',
'brzuch': 'Brzuch',
'barki': 'Barki',
'biceps': 'Biceps',
'triceps': 'Triceps'
};

return (
<div className="space-y-3">
{data.map((item, idx) => {
const percentage = (item.session_count / maxCount) * 100;
return (
<div key={idx}>
<div className="flex items-center justify-between mb-1">
<span className="text-sm text-gray-300">
{muscleLabels[item.muscle_group] || item.muscle_group}
</span>
<span className="text-sm font-bold text-emerald-400">
{item.session_count} {item.session_count === 1 ? 'trening' : 'treningów'}
</span>
</div>
<div className="h-8 bg-white/5 rounded-lg overflow-hidden">
<div
className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-500 flex items-center justify-end px-3"
style={{ width: `${percentage}%` }}
>
{percentage > 20 && (
<span className="text-xs font-bold text-black">
{Math.round(item.total_volume)} kg
</span>
)}
</div>
</div>
</div>
);
})}
</div>
);
};

// Karta statystyki
const StatCard = ({ label, value, icon, color = 'emerald' }) => {
const colorClasses = {
emerald: 'from-emerald-400/10 to-teal-400/10 border-emerald-400/20',
blue: 'from-blue-400/10 to-cyan-400/10 border-blue-400/20',
purple: 'from-purple-400/10 to-pink-400/10 border-purple-400/20',
yellow: 'from-yellow-400/10 to-orange-400/10 border-yellow-400/20'
};

return (
<div className={`rounded-2xl bg-gradient-to-br ${colorClasses[color]} border p-6`}>
<div className="flex items-start justify-between">
<div>
<div className="text-sm text-gray-400 mb-2">{label}</div>
<div className="text-3xl font-bold text-white">{value}</div>
</div>
<div className="text-3xl opacity-70">{icon}</div>
</div>
</div>
);
};

// ---------- Main Component ----------
export default function StatisticsPage() {
const navigate = useNavigate();
const notify = useNotification();
const [loading, setLoading] = useState(true);
const [generalStats, setGeneralStats] = useState(null);
const [volumeData, setVolumeData] = useState([]);
const [frequencyData, setFrequencyData] = useState([]);
const [heatmapData, setHeatmapData] = useState([]);
const [topExercises, setTopExercises] = useState([]);
const [volumePeriod, setVolumePeriod] = useState('month');

useEffect(() => {
fetchAllStatistics();
}, [volumePeriod]);

const fetchAllStatistics = async () => {
try {
setLoading(true);
// Pobierz wszystkie statystyki równolegle
const [generalRes, volumeRes, frequencyRes, heatmapRes, exercisesRes] = await Promise.all([
apiService.request('/api/statistics/general/'),
apiService.request(`/api/statistics/volume/?period=${volumePeriod}&group_by=week`),
apiService.request('/api/statistics/muscle-frequency/?days=90'),
apiService.request('/api/statistics/heatmap/?days=365'),
apiService.request('/api/statistics/exercises/?limit=10')
]);

if (generalRes.success) setGeneralStats(generalRes.stats);
if (volumeRes.success) setVolumeData(volumeRes.data);
if (frequencyRes.success) setFrequencyData(frequencyRes.data);
if (heatmapRes.success) setHeatmapData(heatmapRes.data);
if (exercisesRes.success) setTopExercises(exercisesRes.exercises);

} catch (error) {
console.error('[StatisticsPage] Error fetching statistics:', error);
notify.error('Nie udało się pobrać statystyk');
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
<IconKit.ChartBar size="2xl" className="text-emerald-400" />
<h1 className="text-5xl font-black text-white">
Dashboard Statystyk
</h1>
</div>
<p className="text-gray-400 text-lg">
Szczegółowa analiza Twoich treningów i postępów
</p>
</div>

{loading ? (
<LoadingSpinner />
) : (
<div className="space-y-8">
{/* Statystyki ogólne */}
{generalStats && (
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
<StatCard
label="Łączna liczba treningów"
value={generalStats.total_workouts}
icon={<IconKit.Dumbbell size="xl" className="text-emerald-400" />}
color="emerald"
/>
<StatCard
label="Obecny streak"
value={`${generalStats.current_streak} ${generalStats.current_streak === 1 ? 'dzień' : 'dni'}`}
icon={<IconKit.Trophy size="xl" className="text-yellow-400" />}
color="yellow"
/>
<StatCard
label="Łączny czas treningu"
value={formatDuration(generalStats.total_minutes)}
icon={<IconKit.Clock size="xl" className="text-blue-400" />}
color="blue"
/>
<StatCard
label="Łączny wolumen"
value={`${Math.round(generalStats.total_volume / 1000)}t`}
icon={<IconKit.ChartUp size="xl" className="text-purple-400" />}
color="purple"
/>
</div>
)}

{/* Wykres wolumenu */}
<div className="rounded-2xl bg-white/5 border border-white/10 p-6">
<div className="flex items-center justify-between mb-6">
<h2 className="text-2xl font-bold text-white flex items-center gap-3">
<IconKit.ChartUp size="lg" className="text-emerald-400" /> Wolumen Treningowy
</h2>
<div className="flex gap-2">
{['week', 'month', 'year'].map(period => (
<button
key={period}
onClick={() => setVolumePeriod(period)}
className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
volumePeriod === period
? 'bg-emerald-400 text-black'
: 'bg-white/5 text-gray-400 hover:bg-white/10'
}`}
>
{period === 'week' && 'Tydzień'}
{period === 'month' && 'Miesiąc'}
{period === 'year' && 'Rok'}
</button>
))}
</div>
</div>
<VolumeChart data={volumeData} />
<div className="mt-4 text-sm text-gray-400 text-center">
Wolumen = ciężar × powtórzenia we wszystkich seriach
</div>
</div>

{/* Pozostałe sekcje - pod głównym layoutem */}
<div className="space-y-6">
{/* Częstotliwość partii mięśniowych */}
<div className="rounded-2xl bg-white/5 border border-white/10 p-6">
<h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
<IconKit.Muscle size="lg" className="text-blue-400" /> Częstotliwość Treningu Partii
</h2>
<FrequencyBarChart data={frequencyData} />
<div className="mt-6 text-sm text-gray-400 text-center">
Ostatnie 90 dni
</div>
</div>

{/* Heatmap kalendarz */}
<div className="rounded-2xl bg-white/5 border border-white/10 p-6">
<h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
<IconKit.Calendar size="lg" className="text-purple-400" /> Kalendarz Treningowy
</h2>
<TrainingHeatmap data={heatmapData} />
<div className="mt-4 text-sm text-gray-400 text-center">
Ostatnie 365 dni • {heatmapData.length} dni z treningiem
</div>
</div>

{/* Top 10 ćwiczeń */}
{topExercises.length > 0 && (
<div className="rounded-2xl bg-white/5 border border-white/10 p-6">
<h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
<IconKit.Star size="lg" className="text-yellow-400" /> Top 10 Ćwiczeń
</h2>
<div className="space-y-4">
{topExercises.map((ex, idx) => (
<div
key={ex.exercise_id}
className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
>
<div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-400/20 flex items-center justify-center">
<span className="text-sm font-bold text-emerald-400">#{idx + 1}</span>
</div>
<div className="flex-1">
<div className="font-semibold text-white">{ex.name}</div>
<div className="text-xs text-gray-400">{ex.muscle_group}</div>
</div>
<div className="text-right">
<div className="text-sm font-bold text-emerald-400">
{ex.times_trained} {ex.times_trained === 1 ? 'raz' : 'razy'}
</div>
<div className="text-xs text-gray-400">
{ex.total_sets} serii • {Math.round(ex.total_volume)} kg
</div>
</div>
</div>
))}
</div>
</div>
)}
</div>
</div>
)}
</div>
</div>
);
}
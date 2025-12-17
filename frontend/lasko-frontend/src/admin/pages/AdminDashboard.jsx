import React, { useEffect, useState } from 'react';
import adminApi from '../../services/adminApi';

const StatCard = ({ title, value, sublabel, icon }) => {
  const formatNumber = (num) => {
    if (typeof num === 'string' || num === null || num === undefined || num === '—') return num;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <div className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-black/40 px-6 py-5 shadow-[0_10px_35px_rgba(16,185,129,0.08)] hover:border-emerald-400/30 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(16,185,129,0.15)]">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-widest text-emerald-300/80 font-semibold">{title}</p>
          <p className="mt-3 text-4xl font-black text-white tabular-nums">{formatNumber(value)}</p>
          {sublabel && <p className="mt-2 text-xs text-gray-400 leading-relaxed">{sublabel}</p>}
        </div>
        {icon && (
          <div className="ml-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/20 group-hover:bg-emerald-500/20 transition-colors">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

const TrendCard = ({ title, value, change, help, icon }) => {
  const isPositive = change >= 0;
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-black/40 to-black/60 px-6 py-5 hover:border-white/20 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {icon && <div className="text-emerald-400">{icon}</div>}
            <p className="text-sm text-gray-400 font-medium">{title}</p>
          </div>
          <p className="text-3xl font-black text-white tabular-nums">{value}</p>
        </div>
        {change !== 0 && (
          <div className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold ${isPositive ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30' : 'bg-rose-500/15 text-rose-300 border border-rose-400/30'}`}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={isPositive ? '' : 'rotate-180'}>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      {help && <p className="mt-3 text-xs text-gray-500 leading-relaxed border-t border-white/5 pt-3">{help}</p>}
    </div>
  );
};

const LoadingState = () => (
  <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-gray-400">
    Ładowanie danych...
  </div>
);

const ErrorState = ({ message }) => (
  <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-6 py-5 text-rose-200">
    <p className="font-semibold">Błąd ładowania danych</p>
    <p className="text-sm text-rose-100/80">{message}</p>
  </div>
);

// Komponent wykresu słupkowego
const BarChart = ({ data, color = '#10B981', height = 200, title }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
        <p className="text-gray-500">Brak danych</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count || 0));
  const chartHeight = height - 50; // miejsce na osie i etykiety

  return (
    <div className="relative" style={{ height: `${height}px` }}>
      {/* Oś Y - wartości */}
      {maxCount > 0 && (
        <div className="absolute left-0 top-0 bottom-12 flex flex-col justify-between text-xs text-gray-500 w-10 pr-2 text-right">
          <span>{maxCount}</span>
          <span>{Math.round(maxCount / 2)}</span>
          <span>0</span>
        </div>
      )}
      
      {/* Wykres */}
      <div className="absolute left-10 right-0 bottom-8 top-0 flex items-end justify-between gap-0.5">
        {data.map((item, index) => {
          const barHeight = maxCount > 0 ? ((item.count || 0) / maxCount) * chartHeight : 0;
          const date = item.date ? new Date(item.date) : null;
          const dateLabel = date ? `${date.getDate()}/${date.getMonth() + 1}` : '';
          const showLabel = index % Math.max(1, Math.ceil(data.length / 10)) === 0;
          
          return (
            <div 
              key={index} 
              className="flex-1 flex flex-col items-center justify-end group relative h-full"
            >
              <div 
                className="w-full rounded-t transition-all duration-200 hover:opacity-90 cursor-pointer border-t border-white/20"
                style={{ 
                  height: `${Math.max(barHeight, 2)}px`,
                  background: `linear-gradient(to top, ${color}, ${color}80)`,
                  minHeight: item.count > 0 ? '3px' : '0'
                }}
                title={`${item.date?.split('T')[0] || 'N/A'}: ${item.count}`}
              />
              {showLabel && (
                <span className="text-[10px] text-gray-500 mt-1 whitespace-nowrap">
                  {dateLabel}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [recoStats, setRecoStats] = useState(null);
  const [trainingStats, setTrainingStats] = useState(null);
  const [activityStats, setActivityStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [summaryData, statsData, trainingData, activityData] = await Promise.all([
          adminApi.getDashboardSummary(),
          adminApi.getRecommendationStats(),
          adminApi.getTrainingStatistics().catch(() => null),
          adminApi.getUserActivityStatistics().catch(() => null),
        ]);
        setSummary(summaryData?.summary || summaryData);
        setRecoStats(statsData);
        setTrainingStats(trainingData);
        setActivityStats(activityData);
      } catch (err) {
        console.error('[AdminDashboard] Błąd pobierania danych:', err);
        setError(err.message || 'Nie udało się załadować danych');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Panel administratora</h1>
        <p className="text-sm text-gray-400">Podgląd metryk i aktywności platformy.</p>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <StatCard 
              title="Zarejestrowani użytkownicy" 
              value={summary?.total_users ?? '—'} 
              sublabel={`Aktywni: ${summary?.active_users ?? '—'}`}
              icon={
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
            />
            <StatCard 
              title="Nowi (7 dni)" 
              value={summary?.new_users_week ?? '—'} 
              sublabel="Użytkownicy dołączający w ostatnim tygodniu"
              icon={
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              }
            />
            <StatCard 
              title="Aktywne plany" 
              value={summary?.active_plans ?? '—'} 
              sublabel="Liczba użytkowników z aktywnym planem"
              icon={
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              }
            />
            <StatCard 
              title="Ulubione ćwiczenia" 
              value={summary?.favorite_exercises ?? '—'} 
              sublabel="Łączna liczba polubień"
              icon={
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              }
            />
            <StatCard 
              title="Średnia ocena planów" 
              value={summary?.average_plan_rating ? `${summary.average_plan_rating.toFixed(1)} / 5` : '—'} 
              sublabel="Na podstawie ocen użytkowników"
              icon={
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              }
            />
            <StatCard 
              title="Żądania rekomendacji" 
              value={summary?.recommendation_requests_week ?? '—'} 
              sublabel="Ostatnie 7 dni"
              icon={
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              }
            />
          </section>

          {/* Statystyki rekomendacji */}
          {recoStats && (
            <section className="grid gap-4 md:grid-cols-2">
              <TrendCard
                title="Rekomendacje – łączna liczba"
                value={recoStats?.total_logs ?? '—'}
                change={recoStats?.total_logs && recoStats.total_logs > 0 ? Math.round((recoStats?.activations_last_week ?? 0) / recoStats.total_logs * 100) : 0}
                help="Odsetek aktywacji planu względem wszystkich rekomendacji w ostatnich 7 dniach"
                icon={
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
                  </svg>
                }
              />
              {recoStats?.average_score !== null && recoStats?.average_score !== undefined && recoStats.average_score > 0 && (
                <TrendCard
                  title="Średni score rekomendacji"
                  value={`${recoStats.average_score.toFixed(1)} / 100`}
                  change={0}
                  help="Średni wynik dopasowania – wyższy oznacza lepsze rekomendacje"
                  icon={
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  }
                />
              )}
            </section>
          )}

          {/* Statystyki treningów */}
          {trainingStats && (
            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard 
                title="Sesje treningowe" 
                value={trainingStats.total_sessions ?? '—'} 
                sublabel={`Ostatnie 7 dni: ${trainingStats.sessions_last_7_days ?? 0}`}
                icon={
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                }
              />
              <StatCard 
                title="Łączny czas" 
                value={trainingStats.total_duration_minutes ? `${Math.round(trainingStats.total_duration_minutes / 60)}h` : '—'} 
                sublabel={`Średnio: ${trainingStats.avg_session_duration ? Math.round(trainingStats.avg_session_duration) : 0}min`}
                icon={
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                }
              />
              <StatCard 
                title="Wolumen treningowy" 
                value={trainingStats.total_volume_kg ? `${Math.round(trainingStats.total_volume_kg / 1000)}t` : '—'} 
                sublabel="Łączna masa (kg × powtórzenia)"
                icon={
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
                    <path d="M6 3h12l4 6-10 13L2 9z" />
                  </svg>
                }
              />
              <StatCard 
                title="Aktywni trenujący" 
                value={trainingStats.users_with_sessions ?? '—'} 
                sublabel="Użytkownicy z co najmniej 1 sesją"
                icon={
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                }
              />
            </section>
          )}

          {/* Top ćwiczenia */}
          {trainingStats?.top_exercises && trainingStats.top_exercises.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-white mb-4">Top 10 Ćwiczeń</h2>
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-black/40 to-black/60 p-6">
                <div className="grid gap-3">
                  {trainingStats.top_exercises.map((exercise, index) => (
                    <div key={exercise.id} className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-4 py-3 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-400">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{exercise.name}</div>
                          <div className="text-xs text-gray-400">{exercise.muscle_group}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-right">
                          <div className="text-gray-400 text-xs">Sesje</div>
                          <div className="font-bold text-white">{exercise.session_count}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-400 text-xs">Serie</div>
                          <div className="font-bold text-white">{exercise.set_count}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-400 text-xs">Wolumen</div>
                          <div className="font-bold text-emerald-400">{Math.round(exercise.total_volume / 1000)}t</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Wykresy aktywności */}
          <section className="grid gap-6 lg:grid-cols-2">
            {/* Wykres rejestracji użytkowników */}
            {activityStats?.registrations_by_day ? (
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-black/40 to-black/60 p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white">Zarejestrowani użytkownicy</h3>
                  <p className="text-sm text-gray-400 mt-1">Rejestracje w ostatnich 30 dniach</p>
                </div>
                {activityStats.registrations_by_day.length > 0 ? (
                  <BarChart 
                    data={activityStats.registrations_by_day} 
                    color="#10B981" 
                    height={280}
                  />
                ) : (
                  <div className="text-center text-gray-500 py-12">Brak danych</div>
                )}
              </div>
            ) : null}

            {/* Wykres sesji treningowych */}
            {trainingStats?.sessions_by_day ? (
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-black/40 to-black/60 p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white">Sesje treningowe</h3>
                  <p className="text-sm text-gray-400 mt-1">Sesje w ostatnich 30 dniach</p>
                </div>
                {trainingStats.sessions_by_day.length > 0 ? (
                  <BarChart 
                    data={trainingStats.sessions_by_day} 
                    color="#3B82F6" 
                    height={280}
                  />
                ) : (
                  <div className="text-center text-gray-500 py-12">Brak danych</div>
                )}
              </div>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;





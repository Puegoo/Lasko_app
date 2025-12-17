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

const AdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [recoStats, setRecoStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [summaryData, statsData] = await Promise.all([
          adminApi.getDashboardSummary(),
          adminApi.getRecommendationStats(),
        ]);
        setSummary(summaryData?.summary || summaryData);
        setRecoStats(statsData);
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

          <section className="grid gap-4 lg:grid-cols-3">
            <TrendCard
              title="Rekomendacje – łączna liczba"
              value={recoStats?.total_logs ?? '—'}
              change={recoStats?.total_logs ? Math.round((recoStats?.activations_last_week ?? 0) / Math.max(recoStats?.total_logs || 1, 1) * 100) : 0}
              help="Odsetek aktywacji planu względem wszystkich rekomendacji w ostatnich 7 dniach"
              icon={
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
                </svg>
              }
            />
            <TrendCard
              title="Średni score rekomendacji"
              value={recoStats?.average_score ? `${recoStats.average_score.toFixed(1)} / 100` : '—'}
              change={0}
              help="Średni wynik dopasowania – wyższy oznacza lepsze rekomendacje"
              icon={
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              }
            />
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-black/40 to-black/60 px-6 py-5 hover:border-white/20 transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <p className="text-sm text-gray-400 font-medium">Wersje algorytmu</p>
              </div>
              <div className="space-y-2">
                {recoStats?.versions?.length ? (
                  recoStats.versions.map((item) => (
                    <div key={item.algorithm_version} className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-emerald-400">v{item.algorithm_version}</span>
                        <span className="text-gray-400 text-xs">•</span>
                        <span className="text-gray-300">{item.count} logów</span>
                      </div>
                      <span className="font-bold text-emerald-300 tabular-nums">{item.average_score?.toFixed(1) ?? '—'}</span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-6 text-center">
                    <p className="text-xs text-gray-500">Brak danych o wersjach algorytmu.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;





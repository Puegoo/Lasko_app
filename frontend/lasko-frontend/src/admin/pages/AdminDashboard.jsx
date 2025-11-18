import React, { useEffect, useState } from 'react';
import adminApi from '../../services/adminApi';

const StatCard = ({ title, value, sublabel }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-5 shadow-[0_10px_35px_rgba(16,185,129,0.08)]">
    <p className="text-xs uppercase tracking-widest text-emerald-300">{title}</p>
    <p className="mt-2 text-3xl font-bold text-white">{value}</p>
    {sublabel && <p className="mt-1 text-xs text-gray-400">{sublabel}</p>}
  </div>
);

const TrendCard = ({ title, value, change, help }) => (
  <div className="rounded-2xl border border-white/10 bg-black/40 px-6 py-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      </div>
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${change >= 0 ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}
      >
        {change >= 0 ? '+' : ''}{change}%
      </span>
    </div>
    {help && <p className="mt-2 text-xs text-gray-500">{help}</p>}
  </div>
);

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
            <StatCard title="Zarejestrowani użytkownicy" value={summary?.total_users ?? '—'} sublabel={`Aktywni: ${summary?.active_users ?? '—'}`} />
            <StatCard title="Nowi (7 dni)" value={summary?.new_users_week ?? '—'} sublabel="Użytkownicy dołączający w ostatnim tygodniu" />
            <StatCard title="Aktywne plany" value={summary?.active_plans ?? '—'} sublabel="Liczba użytkowników z aktywnym planem" />
            <StatCard title="Ulubione ćwiczenia" value={summary?.favorite_exercises ?? '—'} sublabel="Łączna liczba polubień" />
            <StatCard title="Średnia ocena planów" value={`${summary?.average_plan_rating?.toFixed?.(2) ?? '—'} / 5`} sublabel="Na podstawie ocen użytkowników" />
            <StatCard title="Żądania rekomendacji" value={summary?.recommendation_requests_week ?? '—'} sublabel="Ostatnie 7 dni" />
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <TrendCard
              title="Rekomendacje – łączna liczba"
              value={recoStats?.total_logs ?? '—'}
              change={Math.round((recoStats?.activations_last_week ?? 0) / Math.max(recoStats?.total_logs || 1, 1) * 100)}
              help="Odsetek aktywacji planu względem wszystkich rekomendacji w ostatnich 7 dniach"
            />
            <TrendCard
              title="Średni score rekomendacji"
              value={`${recoStats?.average_score?.toFixed?.(1) ?? '—'} / 100`}
              change={0}
              help="Średni wynik dopasowania – wyższy oznacza lepsze rekomendacje"
            />
            <div className="rounded-2xl border border-white/10 bg-black/40 px-6 py-5">
              <p className="text-sm text-gray-400">Wersje algorytmu</p>
              <div className="mt-3 space-y-2">
                {recoStats?.versions?.length ? (
                  recoStats.versions.map((item) => (
                    <div key={item.algorithm_version} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm">
                      <span className="font-semibold text-white">v{item.algorithm_version}</span>
                      <span className="text-gray-300">{item.count} logów</span>
                      <span className="text-emerald-300">{item.average_score.toFixed(1)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">Brak danych o wersjach algorytmu.</p>
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


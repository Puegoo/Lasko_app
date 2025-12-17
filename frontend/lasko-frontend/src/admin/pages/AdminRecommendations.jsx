import React, { useEffect, useState } from 'react';
import adminApi from '../../services/adminApi';

const StatsCard = ({ title, value, description }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
    <p className="text-xs uppercase tracking-widest text-gray-500">{title}</p>
    <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    {description && <p className="mt-1 text-xs text-gray-400">{description}</p>}
  </div>
);

const AdminRecommendations = () => {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const data = await adminApi.getRecommendationStats();
        setStats(data);
      } catch (err) {
        console.error('[AdminRecommendations] Błąd statystyk:', err);
        setError(err.message || 'Nie udało się pobrać statystyk');
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoadingLogs(true);
        const data = await adminApi.getRecommendationLogs({ page, page_size: pageSize });
        setLogs(data?.results || []);
        setTotal(data?.pagination?.total || 0);
      } catch (err) {
        console.error('[AdminRecommendations] Błąd logów:', err);
        setError(err.message || 'Nie udało się pobrać logów');
      } finally {
        setLoadingLogs(false);
      }
    };
    fetchLogs();
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Rekomendacje</h1>
        <p className="text-sm text-gray-400">Monitoruj działanie algorytmu rekomendacji planów.</p>
      </div>

      {loadingStats ? (
        <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-gray-400">
          Ładowanie statystyk...
        </div>
      ) : stats ? (
        <section className="grid gap-4 md:grid-cols-4">
          <StatsCard title="Łączna liczba rekomendacji" value={stats.total_logs ?? '—'} />
          <StatsCard title="Średni score" value={stats.average_score?.toFixed?.(2) ?? '—'} description="Wszystkie logi" />
          <StatsCard title="Aktywacje w 7 dni" value={stats.activations_last_week ?? '—'} description="Użytkownicy uruchamiający plan" />
          <div className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm">
            <p className="text-xs uppercase tracking-widest text-gray-500">Wersje algorytmu</p>
            <div className="mt-3 space-y-2">
              {stats.versions?.length ? (
                stats.versions.map((item) => (
                  <div key={item.algorithm_version} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs">
                    <span className="text-white font-semibold">v{item.algorithm_version}</span>
                    <span className="text-gray-400">{item.count} logów</span>
                    <span className="text-emerald-300">{item.average_score.toFixed(1)}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">Brak danych o wersjach.</p>
              )}
            </div>
          </div>
        </section>
      ) : (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-6 py-5 text-rose-200">{error}</div>
      )}

      <section className="rounded-2xl border border-white/10 bg-black/30">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 className="text-lg font-semibold text-white">Logi rekomendacji</h2>
          <p className="text-xs text-gray-500">Łącznie: {total}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5 text-sm text-gray-300">
            <thead className="bg-white/5 text-xs uppercase tracking-widest text-gray-400">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Użytkownik</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Wersja algorytmu</th>
                <th className="px-4 py-3">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loadingLogs ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-xs text-gray-500">Ładowanie logów...</td></tr>
              ) : error ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-xs text-rose-300">{error}</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-xs text-gray-500">Brak logów.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 text-xs text-gray-500">#{log.id}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-white">{log.username || '—'}</p>
                      <p className="text-xs text-gray-500">ID: {log.user_id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-white">{log.plan_name || '—'}</p>
                      <p className="text-xs text-gray-500">ID: {log.plan_id}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-emerald-300 font-semibold">{log.score?.toFixed?.(1) ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">v{log.algorithm_version}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{log.created_at ? new Date(log.created_at).toLocaleString() : '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs text-gray-400">
          <span>Strona {page} z {Math.max(1, Math.ceil(total / pageSize))}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-full border border-white/10 px-3 py-1 disabled:opacity-40" disabled={page === 1}>Poprzednia</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-full border border-white/10 px-3 py-1 disabled:opacity-40" disabled={page === totalPages}>Następna</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminRecommendations;





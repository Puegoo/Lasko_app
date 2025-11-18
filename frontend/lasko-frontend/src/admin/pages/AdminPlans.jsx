import React, { useEffect, useMemo, useState } from 'react';
import adminApi from '../../services/adminApi';

const PlanRow = ({ plan, onSelect }) => (
  <tr className="border-b border-white/5 hover:bg-white/5">
    <td className="px-4 py-3 text-xs text-gray-400">#{plan.id}</td>
    <td className="px-4 py-3">
      <button onClick={() => onSelect(plan.id)} className="text-left text-sm font-semibold text-white hover:text-emerald-300">
        {plan.name}
      </button>
      <p className="text-xs text-gray-500">{plan.goal_type} • {plan.difficulty_level}</p>
    </td>
    <td className="px-4 py-3 text-sm text-gray-300">{plan.training_days_per_week}</td>
    <td className="px-4 py-3 text-sm text-gray-300">{plan.equipment_required}</td>
    <td className="px-4 py-3 text-sm text-gray-300">{plan.activation_count}</td>
    <td className="px-4 py-3 text-sm text-gray-300">{plan.completed_count}</td>
    <td className="px-4 py-3 text-sm text-white">{plan.average_rating?.toFixed?.(2) ?? '—'}</td>
  </tr>
);

const PlanDetail = ({ plan }) => (
  <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
    <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
    <p className="mt-2 text-sm text-gray-400">{plan.description || 'Brak opisu.'}</p>
    <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-300">
      <div><span className="text-gray-500">Cel:</span> {plan.goal_type}</div>
      <div><span className="text-gray-500">Poziom:</span> {plan.difficulty_level}</div>
      <div><span className="text-gray-500">Dni / tydzień:</span> {plan.training_days_per_week}</div>
      <div><span className="text-gray-500">Sprzęt:</span> {plan.equipment_required}</div>
      <div><span className="text-gray-500">Aktywacje:</span> {plan.activation_count}</div>
      <div><span className="text-gray-500">Ukończone:</span> {plan.completed_count}</div>
      <div><span className="text-gray-500">Śr. ocena:</span> {plan.average_rating?.toFixed?.(2) ?? '—'}</div>
      <div><span className="text-gray-500">Utworzono:</span> {plan.created_at ? new Date(plan.created_at).toLocaleString() : '—'}</div>
    </div>
    <div className="mt-6 space-y-4">
      {plan.days?.map((day) => (
        <div key={day.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between text-sm text-white">
            <span className="font-semibold">{day.name}</span>
            <span className="text-xs text-gray-400">Kolejność: {day.day_order}</span>
          </div>
          <div className="mt-3 space-y-2 text-sm text-gray-300">
            {day.exercises?.map((ex) => (
              <div key={ex.id} className="rounded-lg border border-white/5 bg-black/40 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">{ex.name}</span>
                  <span className="text-xs text-gray-500">{ex.muscle_group}</span>
                </div>
                <p className="text-xs text-gray-500">Serie: {ex.target_sets || '—'} • Powt.: {ex.target_reps || '—'} • Pauza: {ex.rest_seconds || '—'} s</p>
              </div>
            ))}
            {!day.exercises?.length && <p className="text-xs text-gray-500">Brak ćwiczeń.</p>}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AdminPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [filters, setFilters] = useState({ search: '', goal: '', level: '', status: '' });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const data = await adminApi.getPlans({
          page,
          page_size: pageSize,
          search: filters.search,
          goal: filters.goal,
          level: filters.level,
          status: filters.status,
        });
        setPlans(data?.results || []);
        setTotal(data?.pagination?.total || 0);
      } catch (err) {
        console.error('[AdminPlans] Błąd pobierania:', err);
        setError(err.message || 'Nie udało się pobrać planów');
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [page, pageSize, filters]);

  const handleExport = () => adminApi.exportPlansCsv();

  const handleSelectPlan = async (planId) => {
    try {
      const data = await adminApi.getPlan(planId);
      setSelectedPlan(data);
    } catch (err) {
      console.error('[AdminPlans] Błąd ładowania planu:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Plany treningowe</h1>
          <p className="text-sm text-gray-400">Analizuj plany oraz ich skuteczność.</p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/10"
        >
          Eksportuj CSV
        </button>
      </div>

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:grid-cols-5">
        <input
          value={filters.search}
          onChange={(e) => {
            setPage(1);
            setFilters((prev) => ({ ...prev, search: e.target.value }));
          }}
          placeholder="Szukaj planów"
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-emerald-400/40 focus:outline-none"
        />
        <input
          value={filters.goal}
          onChange={(e) => {
            setPage(1);
            setFilters((prev) => ({ ...prev, goal: e.target.value }));
          }}
          placeholder="Cel (np. zdrowie)"
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-emerald-400/40 focus:outline-none"
        />
        <input
          value={filters.level}
          onChange={(e) => {
            setPage(1);
            setFilters((prev) => ({ ...prev, level: e.target.value }));
          }}
          placeholder="Poziom (np. poczatkujacy)"
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-emerald-400/40 focus:outline-none"
        />
        <div className="relative">
          <select
            value={filters.status}
            onChange={(e) => {
              setPage(1);
              setFilters((prev) => ({ ...prev, status: e.target.value }));
            }}
            className="w-full px-4 py-3 pr-10 rounded-xl bg-black/40 border border-white/20 text-sm text-white focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5 7.5l5 5 5-5' stroke='%2310B981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
              backgroundSize: '1.25rem'
            }}
          >
            <option value="" className="bg-gray-900 text-white">Wszystkie</option>
            <option value="active" className="bg-gray-900 text-white">Aktywne</option>
            <option value="inactive" className="bg-gray-900 text-white">Nieaktywne</option>
          </select>
        </div>
        <div className="flex items-center justify-end text-xs text-gray-500">Łącznie: {total}</div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/5 text-sm text-gray-200">
              <thead className="bg-white/5 text-xs uppercase tracking-widest text-gray-400">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Dni</th>
                  <th className="px-4 py-3">Sprzęt</th>
                  <th className="px-4 py-3">Aktywacje</th>
                  <th className="px-4 py-3">Ukończone</th>
                  <th className="px-4 py-3">Śr. ocena</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">Ładowanie planów...</td></tr>
                ) : error ? (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-rose-300">{error}</td></tr>
                ) : plans.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">Brak planów spełniających kryteria.</td></tr>
                ) : (
                  plans.map((plan) => (
                    <PlanRow key={plan.id} plan={plan} onSelect={handleSelectPlan} />
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs text-gray-400">
            <span>Strona {page} z {totalPages}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-full border border-white/10 px-3 py-1 disabled:opacity-40" disabled={page === 1}>Poprzednia</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-full border border-white/10 px-3 py-1 disabled:opacity-40" disabled={page === totalPages}>Następna</button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedPlan ? (
            <PlanDetail plan={selectedPlan} />
          ) : (
            <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-sm text-gray-500">
              Wybierz plan, aby zobaczyć szczegóły.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPlans;


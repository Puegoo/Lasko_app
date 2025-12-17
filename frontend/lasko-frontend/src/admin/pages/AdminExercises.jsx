import React, { useEffect, useState } from 'react';
import adminApi from '../../services/adminApi';

const ExerciseCard = ({ exercise }) => (
  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 transition-shadow hover:shadow-[0_15px_40px_rgba(16,185,129,0.15)]">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-white">{exercise.name}</h3>
      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">{exercise.muscle_group}</span>
    </div>
    <p className="mt-1 text-xs uppercase tracking-widest text-gray-500">{exercise.type}</p>
    <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
      <span>Ocena: <strong className="text-white">{exercise.average_rating?.toFixed?.(2) ?? '—'}</strong></span>
      <span>Ulubione: <strong className="text-white">{exercise.favorite_count ?? 0}</strong></span>
    </div>
  </div>
);

const AdminExercises = () => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('');
  const [type, setType] = useState('');

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        const data = await adminApi.getExercises({ search, muscle_group: group, type });
        setExercises(data?.results || []);
      } catch (err) {
        console.error('[AdminExercises] Błąd pobierania:', err);
        setError(err.message || 'Nie udało się pobrać ćwiczeń');
      } finally {
        setLoading(false);
      }
    };
    fetchExercises();
  }, [search, group, type]);

  const handleExport = () => {
    adminApi.exportExercisesCsv();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Katalog ćwiczeń</h1>
          <p className="text-sm text-gray-400">Zarządzaj bazą ćwiczeń i analizuj popularność.</p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/10"
        >
          Eksportuj CSV
        </button>
      </div>

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:grid-cols-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Szukaj po nazwie lub opisie"
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-emerald-400/40 focus:outline-none"
        />
        <input
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          placeholder="Partia mięśniowa (np. chest)"
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-emerald-400/40 focus:outline-none"
        />
        <input
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="Typ (compound/isolation)"
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-emerald-400/40 focus:outline-none"
        />
        <div className="flex items-center justify-end text-xs text-gray-500">Łącznie: {exercises.length}</div>
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-gray-400">
          Ładowanie ćwiczeń...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-6 py-5 text-rose-200">
          {error}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {exercises.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))}
          {!exercises.length && (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-sm text-gray-400">
              Brak ćwiczeń spełniających kryteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminExercises;





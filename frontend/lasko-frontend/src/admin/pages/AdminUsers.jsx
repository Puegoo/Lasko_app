import React, { useEffect, useState, useMemo } from 'react';
import adminApi from '../../services/adminApi';
import { useNotification } from '../../contexts/NotificationContext';

const StatusBadge = ({ active }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-300' : 'bg-rose-300'}`} />
    {active ? 'Aktywny' : 'Zablokowany'}
  </span>
);

const LoadingRow = () => (
  <tr className="border-b border-white/5">
    <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">Ładowanie...</td>
  </tr>
);

const EmptyRow = () => (
  <tr className="border-b border-white/5">
    <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">Brak użytkowników spełniających kryteria.</td>
  </tr>
);

// Confirm Modal Component
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Potwierdź', cancelText = 'Anuluj' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-br from-black/95 to-black/80 backdrop-blur-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 pointer-events-none" />
        
        <div className="relative p-6">
          {/* Icon */}
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 border border-amber-400/30">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-xl font-black text-white text-center mb-3">
            {title}
          </h3>

          {/* Message */}
          <p className="text-gray-300 text-center mb-6 leading-relaxed">
            {message}
          </p>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border-2 border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 rounded-lg border-2 border-amber-400/60 bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-4 py-3 text-sm font-semibold text-amber-300 hover:from-amber-500/30 hover:to-orange-500/30 hover:border-amber-400 transition-all duration-200"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminUsers = () => {
  const notify = useNotification();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [resettingUserId, setResettingUserId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, userId: null, username: null });

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const handleResetPasswordClick = (userId, username) => {
    setConfirmModal({ isOpen: true, userId, username });
  };

  const handleConfirmReset = async () => {
    const { userId, username } = confirmModal;
    setConfirmModal({ isOpen: false, userId: null, username: null });

    try {
      setResettingUserId(userId);
      await adminApi.resetUserPassword(userId, 'password123');
      notify.success(`Hasło zostało zresetowane dla użytkownika ${username}`);
    } catch (err) {
      console.error('[AdminUsers] Błąd resetowania hasła:', err);
      notify.error(err.message || 'Nie udało się zresetować hasła');
    } finally {
      setResettingUserId(null);
    }
  };

  const handleCancelReset = () => {
    setConfirmModal({ isOpen: false, userId: null, username: null });
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await adminApi.getUsers({ page, page_size: pageSize, search, status: statusFilter });
        setUsers(data?.results || []);
        setTotal(data?.pagination?.total || 0);
      } catch (err) {
        console.error('[AdminUsers] Błąd pobierania:', err);
        setError(err.message || 'Nie udało się pobrać użytkowników');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [page, pageSize, search, statusFilter]);

  const handleExport = async () => {
    try {
      await adminApi.exportUsersCsv();
      notify.success('Plik CSV został pobrany');
    } catch (error) {
      console.error('[AdminUsers] Błąd eksportu:', error);
      notify.error(error.message || 'Nie udało się pobrać pliku CSV');
    }
  };

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={handleCancelReset}
        onConfirm={handleConfirmReset}
        title="Resetowanie hasła"
        message={
          <>
            Czy na pewno chcesz zresetować hasło dla użytkownika <strong className="text-white">{confirmModal.username}</strong>?<br />
            <span className="text-amber-300 font-semibold">Nowe hasło będzie: password123</span>
          </>
        }
        confirmText="Resetuj hasło"
        cancelText="Anuluj"
      />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Użytkownicy</h1>
          <p className="text-sm text-gray-400">Przeglądaj i zarządzaj kontami użytkowników.</p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/10"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-emerald-300"><path d="M12 3v12m0 0 4-4m-4 4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Eksportuj CSV
        </button>
      </div>

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 lg:grid-cols-4">
        <input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Szukaj po nazwie lub e-mailu"
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-emerald-400/40 focus:outline-none"
        />
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
            className="w-full px-4 py-3 pr-10 rounded-xl bg-black/40 border border-white/20 text-sm text-white focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5 7.5l5 5 5-5' stroke='%2310B981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
              backgroundSize: '1.25rem'
            }}
          >
            <option value="" className="bg-gray-900 text-white">Wszyscy</option>
            <option value="active" className="bg-gray-900 text-white">Aktywni</option>
            <option value="inactive" className="bg-gray-900 text-white">Nieaktywni</option>
          </select>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-gray-400">Łącznie: {total}</div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-300 disabled:opacity-40"
          >
            Poprzednia
          </button>
          <span className="text-xs text-gray-400">
            strona {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-300 disabled:opacity-40"
          >
            Następna
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-widest text-gray-400">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Użytkownik</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Data rejestracji</th>
                <th className="px-4 py-3">Ostatnie logowanie</th>
                <th className="px-4 py-3">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {loading ? (
                <LoadingRow />
              ) : error ? (
                <tr className="border-b border-white/5">
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-rose-300">{error}</td>
                </tr>
              ) : users.length === 0 ? (
                <EmptyRow />
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 text-xs text-gray-400">#{user.id}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-white">{user.username}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{user.email}</td>
                    <td className="px-4 py-3"><StatusBadge active={user.is_active} /></td>
                    <td className="px-4 py-3 text-xs text-gray-400">{user.date_joined ? new Date(user.date_joined).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{user.last_login ? new Date(user.last_login).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleResetPasswordClick(user.id, user.username)}
                        disabled={resettingUserId === user.id}
                        className="inline-flex items-center justify-center rounded-lg border border-amber-400/40 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Zresetuj hasło do 'password123'"
                      >
                        {resettingUserId === user.id ? (
                          <>
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-amber-300 border-t-transparent mr-1.5" />
                            Resetowanie...
                          </>
                        ) : (
                          'Resetuj hasło'
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;


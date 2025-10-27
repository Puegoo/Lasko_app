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

// Calendar Day Component
const CalendarDay = ({ day, session, isScheduled, isToday, onClick }) => {
  const hasSession = session !== null;
  
  return (
    <div
      onClick={onClick}
      className={`
        relative min-h-[100px] p-2 rounded-lg border transition-all
        ${isToday ? 'border-emerald-400 bg-emerald-400/10' : 'border-white/10 bg-white/5'}
        ${hasSession ? 'cursor-pointer hover:bg-white/10' : ''}
        ${!day ? 'bg-transparent border-transparent' : ''}
      `}
    >
      {day && (
        <>
          <div className={`text-sm font-bold mb-1 ${isToday ? 'text-emerald-400' : 'text-white'}`}>
            {day}
          </div>
          
          {/* Scheduled indicator */}
          {isScheduled && !hasSession && (
            <div className="text-xs px-2 py-1 rounded bg-blue-400/20 text-blue-400 mb-1">
              Zaplanowany
            </div>
          )}
          
          {/* Session indicator */}
          {hasSession && session && (
            <div className="space-y-1">
              <div className="text-xs px-2 py-1 rounded bg-emerald-400/20 text-emerald-400 font-medium">
                <IconKit.Dumbbell size="xs" className="inline mr-1" />
                Trening
              </div>
              {session.duration_minutes && (
                <div className="text-xs text-gray-400">
                  <IconKit.Clock size="xs" className="inline mr-1" />
                  {session.duration_minutes}m
                </div>
              )}
              {session.exercises_count > 0 && (
                <div className="text-xs text-gray-400">
                  {session.exercises_count} ćwiczeń
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Session Details Modal
const SessionDetailsModal = ({ sessionId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const notify = useNotification();

  useEffect(() => {
    fetchSessionDetails();
  }, [sessionId]);

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.request(`/api/calendar/session/${sessionId}/`);
      
      if (response.success) {
        setSession(response.session);
      }
    } catch (error) {
      console.error('[SessionDetailsModal] Error:', error);
      notify.error('Nie udało się pobrać szczegółów sesji');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pl-PL', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-[#1a1a1a] to-black border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-[#1a1a1a] to-[#1a1a1a]/95 backdrop-blur-sm border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <IconKit.Dumbbell size="lg" className="text-emerald-400" />
            Szczegóły Treningu
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <IconKit.Close size="md" className="text-gray-400" />
          </button>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : session ? (
          <div className="p-6 space-y-6">
            {/* Session info */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <IconKit.Calendar size="md" className="text-emerald-400" />
                  <div>
                    <div className="text-xs text-gray-400">Data</div>
                    <div className="text-white font-semibold">{formatDate(session.session_date)}</div>
                  </div>
                </div>
                {session.duration_minutes && (
                  <div className="flex items-center gap-3">
                    <IconKit.Clock size="md" className="text-blue-400" />
                    <div>
                      <div className="text-xs text-gray-400">Czas trwania</div>
                      <div className="text-white font-semibold">{session.duration_minutes} minut</div>
                    </div>
                  </div>
                )}
                {session.plan_name && (
                  <div className="flex items-center gap-3">
                    <IconKit.Document size="md" className="text-purple-400" />
                    <div>
                      <div className="text-xs text-gray-400">Plan</div>
                      <div className="text-white font-semibold">{session.plan_name}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Exercises */}
            {session.exercises && session.exercises.length > 0 && (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <IconKit.Dumbbell size="md" className="text-emerald-400" />
                  Ćwiczenia ({session.exercises.length})
                </h3>
                <div className="space-y-3">
                  {session.exercises.map((ex, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-white">{ex.name}</div>
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-400/20 text-blue-400">
                          {ex.muscle_group}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>{ex.sets_count} serii</span>
                        <span>•</span>
                        <span>Max: {ex.max_weight} kg</span>
                        <span>•</span>
                        <span>Wolumen: {Math.round(ex.total_volume)} kg</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {session.notes && (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <IconKit.Notebook size="md" className="text-yellow-400" />
                  Notatki
                </h3>
                <p className="text-gray-300">{session.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-400">
            Nie znaleziono sesji treningowej
          </div>
        )}
      </div>
    </div>
  );
};

// ---------- Main Component ----------
export default function CalendarPage() {
  const navigate = useNavigate();
  const notify = useNotification();
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [sessions, setSessions] = useState([]);
  const [scheduledDays, setScheduledDays] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    fetchCalendarData();
  }, [currentMonth]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const monthStr = currentMonth.toISOString().slice(0, 7); // YYYY-MM
      const response = await apiService.request(`/api/calendar/?month=${monthStr}`);
      
      if (response.success) {
        setSessions(response.sessions);
        // Parse scheduled_days if it's a JSON string
        let scheduledDays = response.scheduled_days || [];
        if (typeof scheduledDays === 'string') {
          try {
            scheduledDays = JSON.parse(scheduledDays);
          } catch (e) {
            console.error('[CalendarPage] Error parsing scheduled_days:', e);
            scheduledDays = [];
          }
        }
        setScheduledDays(scheduledDays);
        console.log('[CalendarPage] Scheduled days from API:', scheduledDays);
      }
    } catch (error) {
      console.error('[CalendarPage] Error fetching calendar:', error);
      notify.error('Nie udało się pobrać kalendarza');
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (delta) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + delta);
    setCurrentMonth(newMonth);
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Generate calendar grid
  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of month
    const firstDay = new Date(year, month, 1);
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from Monday (1) instead of Sunday (0)
    const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    
    const days = [];
    
    // Mapping day names to numbers (matching JavaScript getDay())
    const dayNameToNumber = {
      'Niedziela': 0,
      'Poniedziałek': 1,
      'Wtorek': 2,
      'Środa': 3,
      'Czwartek': 4,
      'Piątek': 5,
      'Sobota': 6
    };
    
    // Convert scheduledDays (array of Polish day names) to day numbers
    const scheduledDayNumbers = scheduledDays
      .map(dayName => dayNameToNumber[dayName])
      .filter(num => num !== undefined);
    
    console.log('[CalendarPage] scheduledDays:', scheduledDays);
    console.log('[CalendarPage] scheduledDayNumbers:', scheduledDayNumbers);
    
    // Empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const session = sessions.find(s => s.date === dateStr);
      const dayOfWeek = new Date(year, month, day).getDay();
      const isScheduled = scheduledDayNumbers.includes(dayOfWeek);
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
      
      days.push({
        day,
        date: dateStr,
        session,
        isScheduled,
        isToday
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendar();
  const monthName = currentMonth.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });

  // Calculate streak
  const calculateStreak = () => {
    if (sessions.length === 0) return 0;
    
    const sortedDates = sessions.map(s => new Date(s.date)).sort((a, b) => b - a);
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const sessionDate of sortedDates) {
      sessionDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((currentDate - sessionDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === streak) {
        streak++;
      } else if (diffDays > streak) {
        break;
      }
    }
    
    return streak;
  };

  const streak = calculateStreak();
  const completedDays = sessions.length;
  const scheduledCount = scheduledDays.length * 4; // Assume 4 weeks

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
            <IconKit.ChevronLeft size="md" />
            Wróć do Dashboard
          </button>
          
          <div className="flex items-center gap-4 mb-4">
            <IconKit.Calendar size="2xl" className="text-emerald-400" />
            <h1 className="text-5xl font-black text-white">
              Kalendarz Treningowy
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Śledź swoje treningi - zaplanowane vs wykonane
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <div className="flex items-center gap-3">
              <IconKit.Trophy size="lg" className="text-yellow-400" />
              <div>
                <div className="text-sm text-gray-400">Obecny Streak</div>
                <div className="text-3xl font-bold text-white">{streak} dni</div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <div className="flex items-center gap-3">
              <IconKit.Dumbbell size="lg" className="text-emerald-400" />
              <div>
                <div className="text-sm text-gray-400">Treningi w tym miesiącu</div>
                <div className="text-3xl font-bold text-white">{completedDays}</div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <div className="flex items-center gap-3">
              <IconKit.Target size="lg" className="text-blue-400" />
              <div>
                <div className="text-sm text-gray-400">Postęp planu</div>
                <div className="text-3xl font-bold text-white">
                  {scheduledCount > 0 ? Math.round((completedDays / scheduledCount) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => changeMonth(-1)}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors flex items-center gap-2"
            >
              <IconKit.ChevronLeft size="sm" />
              Poprzedni
            </button>
            
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-white capitalize">{monthName}</h2>
              <button
                onClick={goToToday}
                className="px-4 py-2 rounded-lg bg-emerald-400/20 hover:bg-emerald-400/30 text-emerald-400 font-medium transition-colors"
              >
                Dziś
              </button>
            </div>
            
            <button
              onClick={() => changeMonth(1)}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors flex items-center gap-2"
            >
              Następny
              <IconKit.ChevronRight size="sm" />
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mb-6 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-400/20 border border-emerald-400/40"></div>
              <span className="text-gray-400">Trening wykonany</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-400/20 border border-blue-400/40"></div>
              <span className="text-gray-400">Zaplanowany</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-400 border border-emerald-400"></div>
              <span className="text-gray-400">Dzisiaj</span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nie'].map((day) => (
              <div key={day} className="text-center text-sm font-bold text-gray-400 py-2">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {calendarDays.map((dayData, idx) => (
              <CalendarDay
                key={idx}
                day={dayData?.day}
                session={dayData?.session}
                isScheduled={dayData?.isScheduled}
                isToday={dayData?.isToday}
                onClick={() => {
                  if (dayData?.session) {
                    setSelectedSession(dayData.session.session_id);
                  }
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Session Details Modal */}
      {selectedSession && (
        <SessionDetailsModal
          sessionId={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
}


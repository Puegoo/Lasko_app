import React, { useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import apiService from '../services/api';

const ExerciseFeedbackModal = ({ isOpen, onClose, exercise, onSubmitted }) => {
  const notify = useNotification();
  const [difficultyRating, setDifficultyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !exercise) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      const response = await apiService.request('/api/feedback/exercise/', {
        method: 'POST',
        body: JSON.stringify({
          exercise_id: exercise.id,
          difficulty_rating: difficultyRating || null,
          subjective_notes: notes
        })
      });

      if (response.success) {
        notify.success(`Feedback dla "${exercise.name}" został zapisany!`);
        if (onSubmitted) onSubmitted();
        handleClose();
      }
    } catch (error) {
      console.error('[ExerciseFeedbackModal] Error submitting feedback:', error);
      notify.error('Nie udało się zapisać feedbacku: ' + (error.message || 'Nieznany błąd'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setDifficultyRating(0);
    setHoverRating(0);
    setNotes('');
    onClose();
  };

  const getDifficultyLabel = (rating) => {
    const labels = {
      1: '😊 Bardzo łatwe',
      2: '🙂 Łatwe',
      3: '😐 Średnie',
      4: '😓 Trudne',
      5: '🥵 Bardzo trudne'
    };
    return labels[rating] || 'Wybierz trudność';
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-gradient-to-b from-[#1a1a1a] to-black border border-white/10 p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Jak było?</h2>
            <p className="text-sm text-gray-400">
              {exercise.name}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Difficulty Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Jak trudne było to ćwiczenie?
            </label>
            <div className="flex justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficultyRating(level)}
                  onMouseEnter={() => setHoverRating(level)}
                  onMouseLeave={() => setHoverRating(0)}
                  className={`w-12 h-12 rounded-full font-bold transition-all ${
                    (hoverRating || difficultyRating) >= level
                      ? 'bg-gradient-to-br from-emerald-400 to-teal-400 text-black scale-110'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <div className="text-center text-sm text-gray-400">
              {getDifficultyLabel(hoverRating || difficultyRating)}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notatki (opcjonalnie)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 resize-none"
              rows="3"
              placeholder="Problemy z techniką? Ból? Inne uwagi..."
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="flex-1 px-6 py-3 rounded-xl border-2 border-white/20 text-gray-300 font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-bold hover:shadow-lg hover:shadow-emerald-400/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Wysyłanie...' : 'Wyślij'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExerciseFeedbackModal;


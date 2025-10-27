import React, { useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import apiService from '../services/api';

const RatePlanModal = ({ isOpen, onClose, planName, onRated }) => {
  const notify = useNotification();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [markCompleted, setMarkCompleted] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      notify.warning('Wybierz ocenę (1-5 gwiazdek)');
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiService.request('/api/feedback/rate-plan/', {
        method: 'POST',
        body: JSON.stringify({
          rating,
          feedback_text: feedbackText,
          mark_completed: markCompleted
        })
      });

      if (response.success) {
        notify.success(`Plan "${planName}" został oceniony! Dziękujemy za feedback.`);
        if (onRated) onRated(rating, feedbackText);
        onClose();
      }
    } catch (error) {
      console.error('[RatePlanModal] Error submitting rating:', error);
      notify.error('Nie udało się zapisać oceny: ' + (error.message || 'Nieznany błąd'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-gradient-to-b from-[#1a1a1a] to-black border border-white/10 p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">⭐</div>
          <h2 className="text-2xl font-bold text-white mb-2">Oceń swój plan</h2>
          <p className="text-gray-400">
            Jak oceniasz plan <span className="text-emerald-300 font-medium">"{planName}"</span>?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Stars */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110 active:scale-95"
              >
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill={(hoverRating || rating) >= star ? '#F59E0B' : 'none'}
                  stroke={(hoverRating || rating) >= star ? '#F59E0B' : '#6B7280'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            ))}
          </div>

          {/* Rating Text */}
          <div className="text-center">
            {rating > 0 && (
              <div className="text-lg font-medium text-yellow-400">
                {rating === 5 && '⭐ Doskonały!'}
                {rating === 4 && '😊 Bardzo dobry'}
                {rating === 3 && '👍 Dobry'}
                {rating === 2 && '😐 Przeciętny'}
                {rating === 1 && '😞 Słaby'}
              </div>
            )}
          </div>

          {/* Feedback Text */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Komentarz (opcjonalnie)
            </label>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 resize-none"
              rows="4"
              placeholder="Co myślisz o tym planie? Co można poprawić?"
            />
          </div>

          {/* Mark as Completed */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
            <input
              type="checkbox"
              id="mark-completed"
              checked={markCompleted}
              onChange={(e) => setMarkCompleted(e.target.checked)}
              className="w-5 h-5 rounded bg-black/40 border-white/20 text-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
            />
            <label htmlFor="mark-completed" className="text-sm text-gray-300 cursor-pointer">
              Oznacz plan jako ukończony
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSkip}
              disabled={submitting}
              className="flex-1 px-6 py-3 rounded-xl border-2 border-white/20 text-gray-300 font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Pomiń
            </button>
            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-bold hover:shadow-lg hover:shadow-emerald-400/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  Wysyłanie...
                </span>
              ) : (
                'Wyślij ocenę'
              )}
            </button>
          </div>
        </form>

        {/* Info */}
        <p className="mt-4 text-xs text-center text-gray-500">
          Twoja opinia pomoże nam ulepszać rekomendacje dla wszystkich użytkowników
        </p>
      </div>
    </div>
  );
};

export default RatePlanModal;


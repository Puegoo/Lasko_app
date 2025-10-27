import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, duration };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Convenience methods
  const success = useCallback((message, duration) => addNotification(message, 'success', duration), [addNotification]);
  const error = useCallback((message, duration) => addNotification(message, 'error', duration), [addNotification]);
  const warning = useCallback((message, duration) => addNotification(message, 'warning', duration), [addNotification]);
  const info = useCallback((message, duration) => addNotification(message, 'info', duration), [addNotification]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    warning,
    info
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  );
};

// Notification Container Component
const NotificationContainer = ({ notifications, onRemove }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {notifications.map(notification => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

// Individual Toast Component
const NotificationToast = ({ notification, onRemove }) => {
  const { id, message, type } = notification;

  const styles = {
    success: {
      bg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      icon: '✓',
      borderColor: 'border-emerald-400'
    },
    error: {
      bg: 'bg-gradient-to-r from-red-500 to-rose-500',
      icon: '✕',
      borderColor: 'border-red-400'
    },
    warning: {
      bg: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      icon: '⚠',
      borderColor: 'border-yellow-400'
    },
    info: {
      bg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      icon: 'ℹ',
      borderColor: 'border-blue-400'
    }
  };

  const style = styles[type] || styles.info;

  return (
    <div
      className={`pointer-events-auto min-w-[320px] max-w-md rounded-xl border-2 ${style.borderColor} shadow-2xl overflow-hidden animate-slide-in-right`}
      role="alert"
    >
      <div className={`${style.bg} p-4`}>
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white/20 text-white font-bold text-sm">
            {style.icon}
          </div>

          {/* Message */}
          <div className="flex-1 text-white text-sm font-medium leading-relaxed">
            {message}
          </div>

          {/* Close Button */}
          <button
            onClick={() => onRemove(id)}
            className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
            aria-label="Zamknij"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 5l10 10M15 5l-10 10" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/10">
        <div 
          className="h-full bg-white/40 animate-progress" 
          style={{ animationDuration: `${notification.duration}ms` }}
        />
      </div>
    </div>
  );
};

// Add custom animations to your global CSS or Tailwind config
// For now, we'll use inline style tag
const style = document.createElement('style');
style.textContent = `
  @keyframes slide-in-right {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes progress {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }

  .animate-slide-in-right {
    animation: slide-in-right 0.3s ease-out;
  }

  .animate-progress {
    animation: progress linear;
  }
`;
if (typeof document !== 'undefined' && !document.getElementById('notification-styles')) {
  style.id = 'notification-styles';
  document.head.appendChild(style);
}


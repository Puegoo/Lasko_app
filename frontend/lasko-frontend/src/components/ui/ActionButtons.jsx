import React from 'react';

/**
 * Jednolite przyciski akcji używane w całym systemie
 */

// Przycisk Edytuj
export const EditButton = ({ onClick, children = 'Edytuj', className = '', size = 'sm' }) => {
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  };

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 font-medium hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-200 ${className}`}
    >
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4L7 8L4 5" />
        <path d="M2 12l3-1 9-9-2-2-9 9z" />
      </svg>
      {children}
    </button>
  );
};

// Przycisk Usuń
export const DeleteButton = ({ onClick, children = 'Usuń', className = '', size = 'sm' }) => {
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  };

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-medium hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-200 ${className}`}
    >
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
      {children}
    </button>
  );
};

// Przycisk Anuluj
export const CancelButton = ({ onClick, children = 'Anuluj', className = '', size = 'sm' }) => {
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  };

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} rounded-lg bg-gray-500/10 border border-gray-500/30 text-gray-400 font-medium hover:bg-gray-500/20 hover:border-gray-500/50 transition-all duration-200 ${className}`}
    >
      {children}
    </button>
  );
};

// Przycisk Zapisz
export const SaveButton = ({ onClick, children = 'Zapisz', className = '', size = 'sm', disabled = false }) => {
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-medium hover:bg-emerald-500/30 hover:border-emerald-500/60 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
      </svg>
      {children}
    </button>
  );
};

// Przycisk Zamień
export const ReplaceButton = ({ onClick, children = 'Zamień', className = '', size = 'sm' }) => {
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  };

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 font-medium hover:bg-purple-500/20 hover:border-purple-500/50 transition-all duration-200 ${className}`}
    >
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10" />
        <polyline points="23 20 23 14 17 14" />
        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
      </svg>
      {children}
    </button>
  );
};


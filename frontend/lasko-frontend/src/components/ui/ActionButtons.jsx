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
      className={`inline-flex items-center justify-center ${sizeClasses[size]} rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 font-medium hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-200 ${className}`}
    >
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
      className={`inline-flex items-center justify-center ${sizeClasses[size]} rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-medium hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-200 ${className}`}
    >
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
      className={`inline-flex items-center justify-center ${sizeClasses[size]} rounded-lg bg-gray-500/10 border border-gray-500/30 text-gray-400 font-medium hover:bg-gray-500/20 hover:border-gray-500/50 transition-all duration-200 ${className}`}
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
      className={`inline-flex items-center justify-center ${sizeClasses[size]} rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-medium hover:bg-emerald-500/30 hover:border-emerald-500/60 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
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
      className={`inline-flex items-center justify-center ${sizeClasses[size]} rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 font-medium hover:bg-purple-500/20 hover:border-purple-500/50 transition-all duration-200 ${className}`}
    >
      {children}
    </button>
  );
};


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import apiService from '../services/api';
import { EditButton, DeleteButton, SaveButton, CancelButton } from './ui/ActionButtons';
import IconKit from './ui/IconKit';

// ---------- UI Components ----------
const GradientGridBg = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
    <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-[#1DCD9F]/10 blur-3xl" />
    <div className="absolute top-1/3 -right-20 w-96 h-96 rounded-full bg-[#0D7A61]/10 blur-3xl" />
  </div>
);

const PrimaryButton = ({ onClick, children, className = '', disabled = false, type = 'button' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`group relative inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-bold text-white transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 active:scale-[0.98] ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
  >
    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" />
    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 blur transition-opacity group-hover:opacity-80" />
    <span className="relative flex items-center gap-2">{children}</span>
  </button>
);

const SecondaryButton = ({ onClick, children, className = '' }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center justify-center rounded-full border-2 border-emerald-400/60 px-7 py-3 text-sm font-bold text-emerald-300 hover:bg-emerald-400/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 ${className}`}
  >
    {children}
  </button>
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-400/30 border-t-emerald-400"></div>
  </div>
);

// ---------- Main Component ----------
export default function JournalPage() {
  const navigate = useNavigate();
  const notify = useNotification();
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchNotes();
    fetchTags();
  }, [selectedTag, searchQuery]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        days: 90,
        ...(searchQuery && { search: searchQuery }),
        ...(selectedTag && { tag: selectedTag })
      });

      const response = await apiService.request(`/api/journal/notes/?${params}`);
      if (response.success) {
        setNotes(response.notes || []);
      }
    } catch (error) {
      console.error('[JournalPage] Error fetching notes:', error);
      notify.error('Nie udało się pobrać notatek');
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await apiService.request('/api/journal/tags/');
      if (response.success) {
        setAllTags(response.tags || []);
      }
    } catch (error) {
      console.error('[JournalPage] Error fetching tags:', error);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    
    if (!newNote.trim()) {
      notify.warning('Wpisz treść notatki');
      return;
    }

    try {
      const response = await apiService.request('/api/journal/notes/add/', {
        method: 'POST',
        body: JSON.stringify({
          content: newNote.trim()
        })
      });

      if (response.success) {
        notify.success('Notatka została zapisana!');
        setNewNote('');
        setShowAddForm(false);
        await fetchNotes();
        await fetchTags();
      }
    } catch (error) {
      console.error('[JournalPage] Error adding note:', error);
      notify.error('Nie udało się zapisać notatki');
    }
  };

  const handleUpdateNote = async (noteId, content) => {
    try {
      const response = await apiService.request(`/api/journal/notes/${noteId}/`, {
        method: 'PUT',
        body: JSON.stringify({
          content: content.trim()
        })
      });

      if (response.success) {
        notify.success('Notatka została zaktualizowana!');
        setEditingNote(null);
        await fetchNotes();
        await fetchTags();
      }
    } catch (error) {
      console.error('[JournalPage] Error updating note:', error);
      notify.error('Nie udało się zaktualizować notatki');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Czy na pewno chcesz usunąć tę notatkę?')) return;

    try {
      const response = await apiService.request(`/api/journal/notes/${noteId}/delete/`, {
        method: 'DELETE'
      });

      if (response.success) {
        notify.success('Notatka została usunięta!');
        await fetchNotes();
        await fetchTags();
      }
    } catch (error) {
      console.error('[JournalPage] Error deleting note:', error);
      notify.error('Nie udało się usunąć notatki');
    }
  };

  const exportToPDF = () => {
    // Stwórz HTML dla PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Dziennik Treningowy - Lasko</title>
        <style>
          @page {
            margin: 2cm;
          }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          h1 {
            color: #10B981;
            margin-bottom: 30px;
            border-bottom: 3px solid #10B981;
            padding-bottom: 10px;
          }
          .meta {
            margin-bottom: 30px;
            color: #666;
          }
          .note {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          .note-date {
            color: #666;
            font-size: 14px;
            margin-bottom: 8px;
          }
          .note-content {
            padding: 15px;
            background: #f5f5f5;
            border-left: 4px solid #10B981;
            white-space: pre-wrap;
            margin-bottom: 10px;
          }
          .note-tags {
            margin-top: 10px;
          }
          .tag {
            display: inline-block;
            background: #10B981;
            color: white;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 12px;
            margin-right: 5px;
            margin-bottom: 5px;
          }
          @media print {
            body {
              margin: 0;
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <h1>📝 Dziennik Treningowy</h1>
        <div class="meta">
          <p><strong>Wygenerowano:</strong> ${new Date().toLocaleString('pl-PL')}</p>
          <p><strong>Liczba notatek:</strong> ${notes.length}</p>
        </div>
        
        ${notes.map(note => `
          <div class="note">
            <div class="note-date">
              📅 ${new Date(note.note_date).toLocaleString('pl-PL')}
            </div>
            <div class="note-content">${note.content}</div>
            ${note.tags && note.tags.length > 0 ? `
              <div class="note-tags">
                ${note.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </body>
      </html>
    `;

    // Otwórz nowe okno z dokumentem
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Poczekaj aż dokument się załaduje i uruchom drukowanie
      printWindow.onload = () => {
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          notify.info('Wybierz "Zapisz jako PDF" w oknie drukowania');
        }, 250);
      };
    } else {
      notify.error('Nie udało się otworzyć okna eksportu. Sprawdź ustawienia blokady wyskakujących okien.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Dzisiaj';
    if (diffDays === 1) return 'Wczoraj';
    if (diffDays < 7) return `${diffDays} dni temu`;
    return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black">
      <GradientGridBg />
      
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 19l-7-7 7-7" />
            </svg>
            Wróć do Dashboard
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <IconKit.Notebook size="2xl" className="text-emerald-400" />
                <h1 className="text-5xl font-black text-white">
                  Dziennik Treningowy
                </h1>
              </div>
              <p className="text-gray-400 text-lg">
                Twoje notatki, refleksje i obserwacje z treningów
              </p>
            </div>
            
            <div className="flex gap-3">
              <SecondaryButton onClick={exportToPDF}>
                <IconKit.Download size="sm" className="inline" /> Pobierz PDF
              </SecondaryButton>
              <PrimaryButton onClick={() => setShowAddForm(!showAddForm)}>
                {showAddForm ? <><IconKit.Close size="sm" className="inline" /> Anuluj</> : <><IconKit.Plus size="sm" className="inline" /> Dodaj notatkę</>}
              </PrimaryButton>
            </div>
          </div>
        </div>

        {/* Add Note Form */}
        {showAddForm && (
          <div className="mb-8 rounded-2xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Nowa notatka</h3>
            <form onSubmit={handleAddNote} className="space-y-4">
              <div>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 resize-none"
                  rows="6"
                  placeholder="Wpisz swoją notatkę...&#10;&#10;Możesz używać tagów: #świetnytrening #zmęczenie #kontuzja #PR"
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setNewNote('');
                    setShowAddForm(false);
                  }}
                  className="px-6 py-2 rounded-xl border-2 border-white/20 text-gray-300 font-medium hover:bg-white/5 transition-colors"
                >
                  Anuluj
                </button>
                <PrimaryButton type="submit">
                  <IconKit.Document size="sm" className="inline" /> Zapisz notatkę
                </PrimaryButton>
              </div>
            </form>
            
            {/* Suggested Tags */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs text-gray-400 mb-2">Popularne tagi:</p>
              <div className="flex flex-wrap gap-2">
                {['#świetnytrening', '#zmęczenie', '#PR', '#ból', '#energia', '#motywacja', '#postęp'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setNewNote(prev => prev + (prev ? ' ' : '') + tag + ' ')}
                    className="px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-300 text-xs font-medium hover:bg-emerald-400/20 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 rounded-2xl bg-white/5 border border-white/10 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                <IconKit.Search size="sm" /> Szukaj
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Wpisz słowo kluczowe..."
                className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>

            {/* Tag Filter */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">🏷️ Filtruj po tagu</label>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/20 text-white focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 appearance-none cursor-pointer"
              >
                <option value="">Wszystkie notatki</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag} className="bg-gray-900">#{tag}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
            <span>Znaleziono: {notes.length} notatek</span>
            {(searchQuery || selectedTag) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTag('');
                }}
                className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
              >
                <IconKit.Close size="xs" /> Wyczyść filtry
              </button>
            )}
          </div>
        </div>

        {/* Notes List */}
        {loading ? (
          <LoadingSpinner />
        ) : notes.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📔</div>
            <h2 className="text-2xl font-bold text-white mb-2">Brak notatek</h2>
            <p className="text-gray-400 mb-6">
              {searchQuery || selectedTag 
                ? 'Nie znaleziono notatek pasujących do filtrów'
                : 'Zacznij pisać swój dziennik treningowy!'}
            </p>
            {!showAddForm && (
              <PrimaryButton onClick={() => setShowAddForm(true)}>
                <IconKit.Plus size="sm" className="inline" /> Dodaj pierwszą notatkę
              </PrimaryButton>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded-2xl bg-white/5 border border-white/10 p-6 hover:bg-white/[0.07] transition-colors"
              >
                {/* Date */}
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-gray-400 flex items-center gap-2">
                    <IconKit.Calendar size="sm" /> {formatDate(note.note_date)}
                  </div>
                  <div className="flex gap-2">
                    {editingNote?.id !== note.id && (
                      <>
                        <EditButton
                          onClick={() => setEditingNote({ id: note.id, content: note.content })}
                        />
                        <DeleteButton
                          onClick={() => handleDeleteNote(note.id)}
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Content */}
                {editingNote?.id === note.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editingNote.content}
                      onChange={(e) => setEditingNote(prev => ({ ...prev, content: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 resize-none"
                      rows="4"
                    />
                    <div className="flex justify-end gap-2">
                      <CancelButton
                        onClick={() => setEditingNote(null)}
                        size="md"
                      />
                      <SaveButton
                        onClick={() => handleUpdateNote(note.id, editingNote.content)}
                        size="md"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-white whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </div>
                )}

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2">
                    {note.tags.map((tag, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedTag(tag)}
                        className="px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-300 text-xs font-medium hover:bg-emerald-400/20 transition-colors"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


import React, { useState, useEffect, useRef } from 'react';
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

const PrimaryButton = ({ onClick, children, disabled = false, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center rounded-full bg-emerald-400 px-7 py-3 text-sm font-bold text-black hover:bg-emerald-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

const SecondaryButton = ({ onClick, children, disabled = false, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center rounded-full border-2 border-emerald-400/60 px-7 py-3 text-sm font-bold text-emerald-300 hover:bg-emerald-400/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

// Input field component
const InputField = ({ label, icon, ...props }) => (
  <div>
    <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
      {icon}
      {label}
    </label>
    <input
      {...props}
      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
    />
  </div>
);

// Number input with custom arrows
const NumberInputField = ({ label, icon, value, onChange, min, max, placeholder }) => {
  const handleIncrement = () => {
    const currentValue = parseInt(value) || 0;
    if (!max || currentValue < max) {
      onChange({ target: { value: (currentValue + 1).toString() } });
    }
  };

  const handleDecrement = () => {
    const currentValue = parseInt(value) || 0;
    if (!min || currentValue > min) {
      onChange({ target: { value: (currentValue - 1).toString() } });
    }
  };

  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
        {icon}
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] pr-10"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
          <button
            type="button"
            onClick={handleIncrement}
            className="w-6 h-5 flex items-center justify-center rounded bg-emerald-400/20 hover:bg-emerald-400/40 transition-colors group"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-emerald-400 group-hover:text-emerald-300">
              <path d="M6 3L6 9M3 6L9 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleDecrement}
            className="w-6 h-5 flex items-center justify-center rounded bg-emerald-400/20 hover:bg-emerald-400/40 transition-colors group"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-emerald-400 group-hover:text-emerald-300">
              <path d="M3 6L9 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Profile Picture Upload Component
const ProfilePictureUpload = ({ currentPicture, onUpload }) => {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(currentPicture);
  const [uploading, setUploading] = useState(false);
  const notify = useNotification();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      notify.error('Proszę wybrać plik obrazu');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      notify.error('Plik jest za duży. Maksymalny rozmiar to 5MB');
      return;
    }

    try {
      setUploading(true);

      // Convert to Base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        setPreview(base64String);

        // Upload to server
        const response = await apiService.request('/api/settings/profile-picture/', {
          method: 'POST',
          body: JSON.stringify({ image: base64String })
        });

        if (response.success) {
          notify.success('Zdjęcie profilowe zostało zaktualizowane!');
          onUpload(response.profile_picture);
        } else {
          notify.error('Nie udało się przesłać zdjęcia');
          setPreview(currentPicture);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('[ProfilePictureUpload] Error:', error);
      notify.error('Wystąpił błąd podczas przesyłania zdjęcia');
      setPreview(currentPicture);
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div className="relative group">
        {preview ? (
          <img
            src={preview.startsWith('/media') ? `http://localhost:8000${preview}` : preview}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border-4 border-emerald-400/20"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-black font-bold text-5xl">
            {getInitials(currentPicture)}
          </div>
        )}
        
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-400/30 border-t-emerald-400"></div>
          </div>
        )}
        
        <button
          onClick={handleClick}
          disabled={uploading}
          className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-emerald-400 text-black hover:bg-emerald-500 transition-colors flex items-center justify-center disabled:opacity-50"
        >
          <IconKit.Plus size="sm" />
        </button>
      </div>
      
      <p className="text-sm text-gray-400 text-center">
        Kliknij aby zmienić zdjęcie profilowe<br />
        (max 5MB, JPG/PNG/GIF)
      </p>
    </div>
  );
};

// ---------- Main Component ----------
export default function SettingsPage() {
  const navigate = useNavigate();
  const notify = useNotification();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  
  // Profile form
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    bio: '',
    date_of_birth: '',
    goal: '',
    level: '',
    training_days_per_week: '',
    equipment_preference: '',
    preferred_session_duration: ''
  });
  
  // Password form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Delete account form
  const [deleteForm, setDeleteForm] = useState({
    password: '',
    confirmation: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await apiService.request('/api/settings/');
      
      if (response.success) {
        setSettings(response.settings);
        setProfileForm({
          first_name: response.settings.first_name || '',
          bio: response.settings.bio || '',
          date_of_birth: response.settings.date_of_birth || '',
          goal: response.settings.goal || '',
          level: response.settings.level || '',
          training_days_per_week: response.settings.training_days_per_week || '',
          equipment_preference: response.settings.equipment_preference || '',
          preferred_session_duration: response.settings.preferred_session_duration || 60
        });
      }
    } catch (error) {
      console.error('[SettingsPage] Error fetching settings:', error);
      notify.error('Nie udało się pobrać ustawień');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const response = await apiService.request('/api/settings/profile/', {
        method: 'PUT',
        body: JSON.stringify(profileForm)
      });

      if (response.success) {
        notify.success('Profil został zaktualizowany!');
        fetchSettings();
      }
    } catch (error) {
      console.error('[SettingsPage] Error updating profile:', error);
      notify.error('Nie udało się zaktualizować profilu');
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.current_password || !passwordForm.new_password) {
      notify.warning('Uzupełnij wszystkie pola');
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      notify.error('Nowe hasła nie pasują do siebie');
      return;
    }

    if (passwordForm.new_password.length < 8) {
      notify.error('Nowe hasło musi mieć co najmniej 8 znaków');
      return;
    }

    try {
      const response = await apiService.request('/api/settings/change-password/', {
        method: 'POST',
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password
        })
      });

      if (response.success) {
        notify.success('Hasło zostało zmienione!');
        setPasswordForm({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      }
    } catch (error) {
      console.error('[SettingsPage] Error changing password:', error);
      if (error.message.includes('incorrect')) {
        notify.error('Obecne hasło jest nieprawidłowe');
      } else {
        notify.error('Nie udało się zmienić hasła');
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteForm.password || deleteForm.confirmation !== 'DELETE') {
      notify.error('Potwierdź usunięcie wpisując "DELETE"');
      return;
    }

    try {
      const response = await apiService.request('/api/settings/account/', {
        method: 'DELETE',
        body: JSON.stringify(deleteForm)
      });

      if (response.success) {
        notify.success('Konto zostało usunięte');
        localStorage.clear();
        sessionStorage.clear();
        navigate('/');
      }
    } catch (error) {
      console.error('[SettingsPage] Error deleting account:', error);
      notify.error('Nie udało się usunąć konta');
    }
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
          
          <div className="flex items-center gap-4 mb-4">
            <IconKit.Settings size="2xl" className="text-emerald-400" />
            <h1 className="text-5xl font-black text-white">
              Ustawienia
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Zarządzaj swoim profilem i preferencjami
          </p>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div>
            {/* Tabs */}
            <div className="flex gap-4 mb-8 flex-wrap">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-3 rounded-full font-bold transition-all ${
                  activeTab === 'profile'
                    ? 'bg-emerald-400 text-black'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <IconKit.Star size="sm" className="inline mr-2" />
                Profil
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`px-6 py-3 rounded-full font-bold transition-all ${
                  activeTab === 'password'
                    ? 'bg-emerald-400 text-black'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <IconKit.Settings size="sm" className="inline mr-2" />
                Hasło
              </button>
              <button
                onClick={() => setActiveTab('danger')}
                className={`px-6 py-3 rounded-full font-bold transition-all ${
                  activeTab === 'danger'
                    ? 'bg-red-500 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <IconKit.Close size="sm" className="inline mr-2" />
                Strefa Niebezpieczna
              </button>
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Profile Picture */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                  <h2 className="text-xl font-bold text-white mb-6">Zdjęcie Profilowe</h2>
                  <ProfilePictureUpload
                    currentPicture={settings?.profile_picture || settings?.first_name || settings?.username}
                    onUpload={(newPicture) => {
                      setSettings(prev => ({ ...prev, profile_picture: newPicture }));
                    }}
                  />
                </div>

                {/* Basic Info */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                  <h2 className="text-xl font-bold text-white mb-6">Podstawowe Informacje</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="Imię"
                      icon={<IconKit.Star size="sm" />}
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, first_name: e.target.value }))}
                      placeholder="Twoje imię"
                    />
                    <InputField
                      label="Data urodzenia"
                      icon={<IconKit.Calendar size="sm" />}
                      type="date"
                      value={profileForm.date_of_birth}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    />
                  </div>
                  <div className="mt-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                      <IconKit.Notebook size="sm" /> Bio
                    </label>
                    <textarea
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Opowiedz coś o sobie..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 resize-none"
                    />
                  </div>
                </div>

                {/* Training Preferences */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                  <h2 className="text-xl font-bold text-white mb-6">Preferencje Treningowe</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                        <IconKit.Target size="sm" /> Cel
                      </label>
                      <div className="relative">
                        <select
                          value={profileForm.goal}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, goal: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all appearance-none cursor-pointer pr-10"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5 7.5l5 5 5-5' stroke='%2310B981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.75rem center',
                            backgroundSize: '1.25rem'
                          }}
                        >
                          <option value="" className="bg-gray-900 text-white">Wybierz cel</option>
                          <option value="masa" className="bg-gray-900 text-white">Masa mięśniowa</option>
                          <option value="redukcja" className="bg-gray-900 text-white">Redukcja tkanki tłuszczowej</option>
                          <option value="sila" className="bg-gray-900 text-white">Siła</option>
                          <option value="wytrzymalosc" className="bg-gray-900 text-white">Wytrzymałość</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                        <IconKit.ChartUp size="sm" /> Poziom
                      </label>
                      <div className="relative">
                        <select
                          value={profileForm.level}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, level: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all appearance-none cursor-pointer pr-10"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5 7.5l5 5 5-5' stroke='%2310B981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.75rem center',
                            backgroundSize: '1.25rem'
                          }}
                        >
                          <option value="" className="bg-gray-900 text-white">Wybierz poziom</option>
                          <option value="poczatkujacy" className="bg-gray-900 text-white">Początkujący</option>
                          <option value="sredniozaawansowany" className="bg-gray-900 text-white">Średnio zaawansowany</option>
                          <option value="zaawansowany" className="bg-gray-900 text-white">Zaawansowany</option>
                        </select>
                      </div>
                    </div>
                    <NumberInputField
                      label="Dni treningowe / tydzień"
                      icon={<IconKit.Calendar size="sm" />}
                      min={1}
                      max={7}
                      value={profileForm.training_days_per_week}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, training_days_per_week: parseInt(e.target.value) || '' }))}
                      placeholder="3-5"
                    />
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                        <IconKit.Dumbbell size="sm" /> Dostępny sprzęt
                      </label>
                      <div className="relative">
                        <select
                          value={profileForm.equipment_preference}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, equipment_preference: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all appearance-none cursor-pointer pr-10"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5 7.5l5 5 5-5' stroke='%2310B981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.75rem center',
                            backgroundSize: '1.25rem'
                          }}
                        >
                          <option value="" className="bg-gray-900 text-white">Wybierz sprzęt</option>
                          <option value="full" className="bg-gray-900 text-white">Pełna siłownia</option>
                          <option value="home" className="bg-gray-900 text-white">Sprzęt domowy</option>
                          <option value="minimal" className="bg-gray-900 text-white">Minimalny sprzęt</option>
                          <option value="bodyweight" className="bg-gray-900 text-white">Tylko waga własna</option>
                        </select>
                      </div>
                    </div>
                    <NumberInputField
                      label="Preferowany czas treningu (minuty)"
                      icon={<IconKit.Clock size="sm" />}
                      min={15}
                      max={180}
                      value={profileForm.preferred_session_duration}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, preferred_session_duration: parseInt(e.target.value) || 60 }))}
                      placeholder="60"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end gap-4">
                  <SecondaryButton onClick={() => fetchSettings()}>
                    <IconKit.Close size="sm" className="inline mr-2" />
                    Anuluj
                  </SecondaryButton>
                  <PrimaryButton onClick={handleProfileUpdate}>
                    <IconKit.Document size="sm" className="inline mr-2" />
                    Zapisz zmiany
                  </PrimaryButton>
                </div>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <div className="space-y-6">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                  <h2 className="text-xl font-bold text-white mb-6">Zmiana Hasła</h2>
                  <div className="space-y-4 max-w-md">
                    <InputField
                      label="Obecne hasło"
                      icon={<IconKit.Settings size="sm" />}
                      type="password"
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                      placeholder="••••••••"
                    />
                    <InputField
                      label="Nowe hasło"
                      icon={<IconKit.Settings size="sm" />}
                      type="password"
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                      placeholder="••••••••"
                    />
                    <InputField
                      label="Potwierdź nowe hasło"
                      icon={<IconKit.Settings size="sm" />}
                      type="password"
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                      placeholder="••••••••"
                    />
                    <div className="pt-4">
                      <PrimaryButton onClick={handlePasswordChange} className="w-full">
                        <IconKit.Settings size="sm" className="inline mr-2" />
                        Zmień hasło
                      </PrimaryButton>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <div className="space-y-6">
                <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-6">
                  <h2 className="text-xl font-bold text-red-400 mb-2">Usuń Konto</h2>
                  <p className="text-gray-400 mb-6">
                    Ta akcja jest nieodwracalna. Wszystkie Twoje dane, treningi i postępy zostaną trwale usunięte.
                  </p>
                  <div className="space-y-4 max-w-md">
                    <InputField
                      label="Potwierdź hasło"
                      icon={<IconKit.Settings size="sm" />}
                      type="password"
                      value={deleteForm.password}
                      onChange={(e) => setDeleteForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="••••••••"
                    />
                    <InputField
                      label='Wpisz "DELETE" aby potwierdzić'
                      icon={<IconKit.Close size="sm" />}
                      value={deleteForm.confirmation}
                      onChange={(e) => setDeleteForm(prev => ({ ...prev, confirmation: e.target.value }))}
                      placeholder="DELETE"
                    />
                    <div className="pt-4">
                      <button
                        onClick={handleDeleteAccount}
                        className="w-full px-7 py-3 rounded-full bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
                      >
                        <IconKit.Close size="sm" className="inline mr-2" />
                        Usuń konto trwale
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


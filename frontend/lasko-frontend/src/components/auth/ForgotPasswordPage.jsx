import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import RegisterBackground from '../../assets/Photos/Register_background.png';
import laskoHi from '../../assets/Lasko_pose/Lasko_Hi.png';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email jest wymagany');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await apiService.request('/api/auth/forgot-password/', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.error || 'Nie udało się wysłać emaila z resetowaniem hasła');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.message || 'Nie udało się wysłać emaila. Spróbuj ponownie później.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center px-4"
      style={{
        backgroundImage: `url(${RegisterBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative"
      }}
    >
      {/* Ciemna nakładka */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] to-[#0D7A61]/90 opacity-90"
        style={{ mixBlendMode: "multiply" }}
      />
      
      {/* Logo w lewym górnym rogu */}
      <div className="absolute top-6 left-4 z-10">
        <Link to="/" className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
          Lasko
        </Link>
      </div>

      {/* Główny kontener */}
      <div className="w-full max-w-md z-10 relative">
        
        {/* Karta formularza */}
        <div className="bg-[#0a0a0a]/95 rounded-3xl shadow-xl p-8 border border-[#222222] shadow-[0_0_30px_10px_rgba(0,0,0,0.5)]">
          
          {/* Nagłówek */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4">
              <img 
                src={laskoHi} 
                alt="Lasko" 
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="text-white text-3xl font-bold mb-2">
              Zapomniałeś hasła?
            </h2>
            <p className="text-gray-400 text-lg">
              Podaj swój email, a wyślemy Ci link do resetowania hasła
            </p>
          </div>

          {success ? (
            <div className="space-y-6">
              <div className="bg-emerald-900/20 border border-emerald-400/60 rounded-lg p-6 text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <h3 className="text-white text-xl font-bold mb-2">Email wysłany!</h3>
                <p className="text-gray-300">
                  Wysłaliśmy link do resetowania hasła na adres <strong className="text-emerald-300">{email}</strong>
                </p>
                <p className="text-gray-400 text-sm mt-4">
                  Sprawdź swoją skrzynkę pocztową i kliknij w link, aby zresetować hasło.
                </p>
              </div>
              <Link
                to="/login"
                className="block w-full text-center py-4 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] hover:brightness-110 transition-all duration-300"
              >
                Powrót do logowania
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Błąd */}
              {error && (
                <div className="bg-red-900/20 border border-red-400/60 rounded-lg p-4">
                  <p className="text-red-300 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-gray-300 text-sm font-medium">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Wpisz swój email"
                  disabled={isLoading}
                  className="w-full px-4 py-4 bg-[#1D1D1D] border border-[#333333] rounded-xl text-white placeholder-gray-500 focus:border-[#1DCD9F] focus:ring-1 focus:ring-[#1DCD9F] transition-all duration-300 disabled:opacity-50"
                  autoComplete="email"
                  required
                />
              </div>

              {/* Przycisk */}
              <button
                type="submit"
                disabled={isLoading}
                className={`
                  w-full py-4 px-6 rounded-xl font-bold transition-all duration-300
                  ${isLoading 
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] text-white hover:shadow-[0_0_20px_rgba(29,205,159,0.6)] hover:brightness-110'
                  }
                `}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                    <span>Wysyłanie...</span>
                  </div>
                ) : (
                  'Wyślij link resetujący'
                )}
              </button>
            </form>
          )}

          {/* Powrót do logowania */}
          <div className="mt-8 text-center">
            <p className="text-gray-400">
              Pamiętasz hasło?{' '}
              <Link 
                to="/login" 
                className="text-[#1DCD9F] hover:text-white transition-colors duration-300 font-medium"
              >
                Zaloguj się
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;


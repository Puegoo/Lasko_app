// frontend/lasko-frontend/src/components/auth/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import RegisterBackground from '../../assets/Photos/Register_background.png';
import laskoHi from '../../assets/Lasko_pose/Lasko_Hi.png';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Przekierowanie po logowaniu
  const from = location.state?.from?.pathname || '/dashboard';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Wyczyść błąd przy wpisywaniu
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Wszystkie pola są wymagane');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Użyj metody z AuthContext
      await login({
        login: formData.email, // backend akceptuje email lub username w polu 'login'
        password: formData.password
      });
      
      // Przekieruj po udanym logowaniu
      navigate(from, { replace: true });
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Błąd logowania. Sprawdź dane i spróbuj ponownie.');
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

      {/* Główny kontener logowania */}
      <div className="w-full max-w-md z-10 relative">
        
        {/* Karta logowania */}
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
              Witaj ponownie!
            </h2>
            <p className="text-gray-400 text-lg">
              Zaloguj się do swojego konta
            </p>
          </div>

          {/* Formularz logowania */}
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
                Email lub nazwa użytkownika
              </label>
              <input
                type="text"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Wpisz swój email"
                disabled={isLoading}
                className="w-full px-4 py-4 bg-[#1D1D1D] border border-[#333333] rounded-xl text-white placeholder-gray-500 focus:border-[#1DCD9F] focus:ring-1 focus:ring-[#1DCD9F] transition-all duration-300 disabled:opacity-50"
                autoComplete="email"
              />
            </div>

            {/* Hasło */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-gray-300 text-sm font-medium">
                Hasło
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Wpisz swoje hasło"
                  disabled={isLoading}
                  className="w-full px-4 py-4 bg-[#1D1D1D] border border-[#333333] rounded-xl text-white placeholder-gray-500 focus:border-[#1DCD9F] focus:ring-1 focus:ring-[#1DCD9F] transition-all duration-300 disabled:opacity-50 pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-300"
                  aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Przycisk logowania */}
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
                  <span>Logowanie...</span>
                </div>
              ) : (
                'Zaloguj się'
              )}
            </button>
          </form>

          {/* Dodatkowe linki */}
          <div className="mt-8 text-center space-y-4">
            <p className="text-gray-400">
              <Link 
                to="/forgot-password" 
                className="text-[#1DCD9F] hover:text-white transition-colors duration-300"
              >
                Zapomniałeś hasła?
              </Link>
            </p>
            
            <div className="border-t border-gray-700 pt-6">
              <p className="text-gray-400">
                Nie masz konta?{' '}
                <Link 
                  to="/register" 
                  className="text-[#1DCD9F] hover:text-white transition-colors duration-300 font-medium"
                >
                  Zarejestruj się
                </Link>
              </p>
            </div>
          </div>
        </div>
        
        {/* Info pod formularzem */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            Masz problemy z logowaniem?{' '}
            <Link to="/contact" className="text-[#1DCD9F] hover:text-white transition-colors">
              Skontaktuj się z nami
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
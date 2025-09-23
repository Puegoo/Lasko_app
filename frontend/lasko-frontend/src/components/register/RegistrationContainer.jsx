// frontend/lasko-frontend/src/components/register/RegistrationContainer.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isAuthenticated } from '../../services/authService';
import saveUserProfile from '../../services/saveUserProfile';
import AccountCard from './AccountCard';
import NameCard from './NameCard';
import BirthdateCard from './BirthdateCard';
import UsernameCard from './UsernameCard';
import SurveyChoiceCard from './SurveyChoiceCard';
import RegisterBackground from '../../assets/Photos/Register_background.png';

const RegistrationContainer = () => {
  const navigate = useNavigate();
  const { register, login } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState('next');
  const [animating, setAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    birthDate: '',
    username: '',
    surveyChoice: '',
    skipSurvey: false,
  });

  // DODANE: Debugowanie stanu formularza
  useEffect(() => {
    console.log('🔍 RegistrationContainer - Stan:', {
      currentStep,
      formData,
      validationErrors,
      isSubmitting,
      animating
    });
  }, [currentStep, formData, validationErrors, isSubmitting, animating]);

  const getFieldDisplayName = (field) => {
    const fieldNames = {
      username: 'Nazwa użytkownika',
      email: 'Email',
      password: 'Hasło',
      password_confirm: 'Potwierdzenie hasła',
      first_name: 'Imię',
      date_of_birth: 'Data urodzenia',
    };
    return fieldNames[field] || field;
  };

  // ULEPSZONE: Funkcja updateFormData z debugowaniem
  function updateFormData(field, value) {
    console.log('🔍 updateFormData wywołane:', { field, value, prevValue: formData[field] });
    
    setFormData((prev) => {
      const newFormData = {
        ...prev,
        [field]: value,
      };
      console.log('🔍 updateFormData - nowy stan:', newFormData);
      return newFormData;
    });

    // Usuń błąd walidacji dla tego pola
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        console.log('🔍 Usunięto błąd walidacji dla:', field);
        return newErrors;
      });
    }
  }

  function getMaxStep() {
    return 4; // Account, Name, Birthdate, Username, SurveyChoice
  }

  function goToNextStep() {
    console.log('🔍 goToNextStep wywołane:', { currentStep, animating, isSubmitting });
    
    if (animating) {
      console.log('⚠️ Animacja w toku, ignoruję');
      return;
    }

    if (isSubmitting) {
      console.log('⚠️ Już wysyłam dane, ignoruję');
      return;
    }
    
    const maxStep = getMaxStep();
    console.log('🔍 Porównanie kroków:', { currentStep, maxStep });
    
    if (currentStep < maxStep) {
      console.log('🔍 Przechodzę do następnego kroku');
      setDirection('next');
      setAnimating(true);
      setTimeout(() => {
        setCurrentStep((prev) => {
          const newStep = prev + 1;
          console.log('🔍 Nowy krok ustawiony:', newStep);
          return newStep;
        });
        setAnimating(false);
      }, 250);
    } else {
      console.log('🔍 Ostatni krok - wywołuję handleSurveyDecision');
      console.log('🔍 Stan formData przed wysłaniem:', formData);
      handleSurveyDecision();
    }
  }

  function goToPrevStep() {
    console.log('🔍 goToPrevStep wywołane:', { currentStep, animating });
    
    if (animating || currentStep === 0) {
      console.log('⚠️ Nie mogę cofnąć - animacja lub pierwszy krok');
      return;
    }
    
    setDirection('prev');
    setAnimating(true);
    setTimeout(() => {
      setCurrentStep((prev) => prev - 1);
      setAnimating(false);
    }, 250);
  }

  function renderCurrentCard() {
    console.log('🔍 renderCurrentCard dla kroku:', currentStep);
    
    switch (currentStep) {
      case 0:
        return (
          <AccountCard
            formData={formData}
            updateFormData={updateFormData}
            validationErrors={validationErrors}
            onNext={goToNextStep}
            isSubmitting={isSubmitting}
          />
        );
      case 1:
        return (
          <NameCard
            formData={formData}
            updateFormData={updateFormData}
            validationErrors={validationErrors}
            onNext={goToNextStep}
            onPrev={goToPrevStep}
            isSubmitting={isSubmitting}
          />
        );
      case 2:
        return (
          <BirthdateCard
            formData={formData}
            updateFormData={updateFormData}
            validationErrors={validationErrors}
            onNext={goToNextStep}
            onPrev={goToPrevStep}
            isSubmitting={isSubmitting}
          />
        );
      case 3:
        return (
          <UsernameCard
            formData={formData}
            updateFormData={updateFormData}
            validationErrors={validationErrors}
            onNext={goToNextStep}
            onPrev={goToPrevStep}
            isSubmitting={isSubmitting}
          />
        );
      case 4:
        return (
          <SurveyChoiceCard
            formData={formData}
            updateFormData={updateFormData}
            validationErrors={validationErrors}
            onNext={goToNextStep}
            onPrev={goToPrevStep}
            isSubmitting={isSubmitting}
          />
        );
      default:
        console.error('❌ Nieznany krok:', currentStep);
        return (
          <div className="bg-red-900/20 border border-red-400 rounded-lg p-4 text-red-300">
            <h3>Błąd: Nieznany krok {currentStep}</h3>
            <button onClick={() => setCurrentStep(0)} className="mt-2 text-red-400 underline">
              Wróć do początku
            </button>
          </div>
        );
    }
  }

  const handleSurveyDecision = async () => {
    console.log('🔍 handleSurveyDecision rozpoczęte:', { formData, isSubmitting });
    
    if (isSubmitting) {
      console.log('⚠️ Już wysyłam dane, ignoruję kolejne wywołanie');
      return;
    }
    
    setIsSubmitting(true);
    setValidationErrors({}); // Wyczyść poprzednie błędy
    
    try {
      const registrationData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password_confirm: formData.password,
        first_name: formData.name,
        date_of_birth: formData.birthDate,
      };

      console.log('🔄 Rejestracja podstawowych danych:', registrationData);

      const response = await register(registrationData);
      console.log('✅ Rejestracja podstawowa udana:', response);

      // Jeżeli po register nadal brak tokenu — wykonaj login
      if (!isAuthenticated()) {
        console.log('🔄 Brak tokenu po rejestracji, wykonuję login');
        await login({ email: formData.email, password: formData.password });
      }

      // Best-effort zapis profilu tylko gdy mamy token
      if (isAuthenticated()) {
        console.log('🔄 Zapisuję profil użytkownika');
        const userProfileData = {
          registrationComplete: true,
          surveyChoice: formData.surveyChoice,
          skipSurvey: formData.skipSurvey,
        };
        await saveUserProfile(userProfileData);
      }

      // Nawigacja w zależności od wyboru
      const navigationState = {
        userData: formData,
        surveyCompleted: false,
        registrationSuccessful: true,
        skipBasicInfo: false,
        fromSurvey: false,
      };

      if (formData.skipSurvey) {
        console.log('🔄 Przekierowuję do kreatora planu (pominięcie ankiety)');
        navigate('/plan-creator', {
          state: {
            ...navigationState,
            mode: 'manual',
          },
        });
      } else {
        console.log('🔄 Przekierowuję do szczegółowej ankiety');
        navigate('/enhanced-plan-creator', {
          state: {
            ...navigationState,
            skipBasicInfo: true,
            fromSurvey: true,
            mode: 'survey',
          },
        });
      }
    } catch (error) {
      console.error('❌ Błąd rejestracji:', error);

      if (error.validationErrors) {
        console.log('🔍 Błędy walidacji z serwera:', error.validationErrors);
        
        const mappedErrors = {};
        Object.entries(error.validationErrors).forEach(([field, messages]) => {
          const messagesList = Array.isArray(messages) ? messages : [messages];
          mappedErrors[field] = messagesList.join(', ');
        });

        setValidationErrors(mappedErrors);

        const errorMessages = Object.entries(error.validationErrors)
          .map(([field, messages]) => {
            const fieldName = getFieldDisplayName(field);
            const messagesList = Array.isArray(messages) ? messages : [messages];
            return `${fieldName}: ${messagesList.join(', ')}`;
          })
          .join('\n');

        alert(`Błędy rejestracji:\n${errorMessages}`);
        
        // Przejdź do kroku z błędem
        if (mappedErrors.email || mappedErrors.password) setCurrentStep(0);
        else if (mappedErrors.first_name) setCurrentStep(1);
        else if (mappedErrors.date_of_birth) setCurrentStep(2);
        else if (mappedErrors.username) setCurrentStep(3);
        
      } else {
        const errorMessage = error.message || 'Nieoczekiwany błąd podczas rejestracji';
        console.error('❌ Błąd ogólny:', errorMessage);
        alert(`Błąd: ${errorMessage}. Spróbuj ponownie.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full px-4 py-10 relative"
      style={{
        backgroundImage: `url(${RegisterBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] to-[#0D7A61]/90 opacity-90"
        style={{ mixBlendMode: 'multiply' }}
      ></div>

      <div className="absolute top-8 left-8 z-10">
        <Link to="/">
          <h1 className="text-[#1DCD9F] text-5xl font-bold">Lasko</h1>
        </Link>
      </div>

      <div className="absolute top-8 right-8 z-10 text-right">
        <div className="text-white text-sm mb-1">
          Krok {currentStep + 1} z {getMaxStep() + 1}
        </div>
        <div className="w-32 h-2 bg-gray-600 rounded-full mt-2">
          <div
            className="h-full bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / (getMaxStep() + 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* DODANE: Panel debugowania w trybie development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs p-2 rounded max-w-xs z-50">
          <div><strong>Krok:</strong> {currentStep}</div>
          <div><strong>Animacja:</strong> {animating ? 'TAK' : 'NIE'}</div>
          <div><strong>Wysyłanie:</strong> {isSubmitting ? 'TAK' : 'NIE'}</div>
          <div><strong>Błędy:</strong> {Object.keys(validationErrors).length}</div>
          <div><strong>Email:</strong> {formData.email}</div>
          <div><strong>Nazwa:</strong> {formData.name}</div>
          <div><strong>Username:</strong> {formData.username}</div>
        </div>
      )}

      <div className="max-w-lg w-full mx-auto z-10 relative overflow-hidden" style={{ height: 'min(650px, 85vh)' }}>
        {isSubmitting && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 rounded-3xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1DCD9F] mx-auto mb-4"></div>
              <p className="text-white text-lg">Tworzenie konta...</p>
              <p className="text-gray-300 text-sm mt-2">
                {formData.skipSurvey ? 'Przekierowujemy do kreatora planu' : 'Przekierowujemy do szczegółowej ankiety'}
              </p>
            </div>
          </div>
        )}

        <div
          className={`absolute inset-0 transition-all duration-500 ease-in-out ${
            animating
              ? direction === 'next'
                ? '-translate-x-full opacity-0'
                : 'translate-x-full opacity-0'
              : 'translate-x-0 opacity-100'
          }`}
        >
          {renderCurrentCard()}
        </div>
      </div>
    </div>
  );
};

export default RegistrationContainer;
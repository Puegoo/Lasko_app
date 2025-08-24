// frontend/lasko-frontend/src/components/register/RegistrationContainer.jsx (NOWY PRZEPŁYW)
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import saveUserProfile from '../../services/recommendationService';
import AccountCard from './AccountCard';
import NameCard from './NameCard';
import BirthdateCard from './BirthdateCard';
import UsernameCard from './UsernameCard';
import SurveyChoiceCard from './SurveyChoiceCard';
import RegisterBackground from '../../assets/Photos/Register_background.png';

const RegistrationContainer = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
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
    skipSurvey: false
  });

  const getFieldDisplayName = (field) => {
    const fieldNames = {
      'username': 'Nazwa użytkownika',
      'email': 'Email',
      'password': 'Hasło',
      'password_confirm': 'Potwierdzenie hasła',
      'first_name': 'Imię',
      'date_of_birth': 'Data urodzenia'
    };
    
    return fieldNames[field] || field;
  };

  function updateFormData(field, value) {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }

  // UPROSZCZONA logika kroków - tylko podstawowe dane
  function getMaxStep() {
    return 4; // Account, Name, Birthdate, Username, SurveyChoice
  }

  function goToNextStep() {
    if (animating) return;

    const maxStep = getMaxStep();

    if (currentStep < maxStep) {
      setDirection('next');
      setAnimating(true);
      
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setAnimating(false);
      }, 250);
    } else {
      // Ostatni krok - decyzja o ankiecie
      handleSurveyDecision();
    }
  }

  function goToPrevStep() {
    if (animating || currentStep === 0) return;

    setDirection('prev');
    setAnimating(true);
    
    setTimeout(() => {
      setCurrentStep(prev => prev - 1);
      setAnimating(false);
    }, 250);
  }

  // UPROSZCZONA funkcja renderowania kroków
  function renderCurrentCard() {
    switch (currentStep) {
      case 0: return <AccountCard formData={formData} updateFormData={updateFormData} validationErrors={validationErrors} onNext={goToNextStep} isSubmitting={isSubmitting} />;
      case 1: return <NameCard formData={formData} updateFormData={updateFormData} validationErrors={validationErrors} onNext={goToNextStep} onPrev={goToPrevStep} isSubmitting={isSubmitting} />;
      case 2: return <BirthdateCard formData={formData} updateFormData={updateFormData} validationErrors={validationErrors} onNext={goToNextStep} onPrev={goToPrevStep} isSubmitting={isSubmitting} />;
      case 3: return <UsernameCard formData={formData} updateFormData={updateFormData} validationErrors={validationErrors} onNext={goToNextStep} onPrev={goToPrevStep} isSubmitting={isSubmitting} />;
      case 4: return <SurveyChoiceCard formData={formData} updateFormData={updateFormData} validationErrors={validationErrors} onNext={goToNextStep} onPrev={goToPrevStep} isSubmitting={isSubmitting} />;
      default: return null;
    }
  }

  // NOWA funkcja obsługująca decyzję o ankiecie
  const handleSurveyDecision = async () => {
    setIsSubmitting(true);
    
    try {
      // Przygotuj podstawowe dane do rejestracji
      const registrationData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password_confirm: formData.password,
        first_name: formData.name,
        date_of_birth: formData.birthDate
      };

      console.log('🔄 Rejestracja podstawowych danych:', registrationData);

      // Rejestracja użytkownika z podstawowymi danymi
      const response = await register(registrationData);
      console.log('✅ Rejestracja podstawowa udana:', response);

      // Zapisz podstawowe dane do localStorage
      const userProfileData = {
        registrationComplete: true,
        surveyChoice: formData.surveyChoice,
        skipSurvey: formData.skipSurvey
      };
      
      saveUserProfile(userProfileData);

      // NOWY PRZEPŁYW PRZEKIEROWAŃ
      if (formData.skipSurvey) {
        // Jeśli pomija ankietę → bezpośrednio do kreatora planu (tryb manual)
        navigate('/plan-creator', { 
          state: { 
            userData: formData,
            surveyCompleted: false,
            registrationSuccessful: true,
            skipBasicInfo: false,
            fromSurvey: false,
            mode: 'manual' // Tryb manualny - użytkownik sam konfiguruje wszystko
          } 
        });
      } else {
        // Jeśli chce ankietę → do szczegółowej ankiety w EnhancedPlanCreator
        navigate('/enhanced-plan-creator', { 
          state: { 
            userData: formData,
            surveyCompleted: false,
            registrationSuccessful: true,
            skipBasicInfo: true, // Pomijamy podstawowe info bo już je mamy
            fromSurvey: true,
            mode: 'survey' // Tryb ankietowy - prowadzi przez szczegółową ankietę
          } 
        });
      }
      
    } catch (error) {
      console.error('❌ Błąd rejestracji:', error);
      
      if (error.validationErrors) {
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
      } else {
        alert(`Błąd: ${error.message || 'Nieoczekiwany błąd'}. Spróbuj ponownie.`);
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
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      {/* Ciemna nakładka */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] to-[#0D7A61]/90 opacity-90"
        style={{ mixBlendMode: "multiply" }}
      ></div>
      
      {/* Logo */}
      <div className="absolute top-8 left-8 z-10">
        <Link to="/">
          <h1 className="text-[#1DCD9F] text-5xl font-bold">Lasko</h1>
        </Link>
      </div>

      {/* Pasek postępu */}
      <div className="absolute top-8 right-8 z-10 text-right">
        <div className="text-white text-sm mb-1">
          Krok {currentStep + 1} z {getMaxStep() + 1}
        </div>
        <div className="w-32 h-2 bg-gray-600 rounded-full mt-2">
          <div 
            className="h-full bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] rounded-full transition-all duration-300"
            style={{ 
              width: `${((currentStep + 1) / (getMaxStep() + 1)) * 100}%` 
            }}
          />
        </div>
      </div>
      
      {/* Kontener kart */}
      <div className="max-w-lg w-full mx-auto z-10 relative overflow-hidden" style={{ height: 'min(650px, 85vh)' }}>
        {/* Loading overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 rounded-3xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1DCD9F] mx-auto mb-4"></div>
              <p className="text-white text-lg">
                Tworzenie konta...
              </p>
              <p className="text-gray-300 text-sm mt-2">
                {formData.skipSurvey 
                  ? 'Przekierowujemy do kreatora planu' 
                  : 'Przekierowujemy do szczegółowej ankiety'
                }
              </p>
            </div>
          </div>
        )}
        
        {/* Obecnie widoczna karta */}
        <div 
          className={`absolute inset-0 transition-all duration-500 ease-in-out ${
            animating 
              ? direction === 'next' 
                ? 'transform translate-x-full opacity-0' 
                : 'transform -translate-x-full opacity-0'
              : 'transform translate-x-0 opacity-100'
          }`}
        >
          {renderCurrentCard()}
        </div>
      </div>

      {/* DEBUG INFO - tylko w development */}
      {process.env.NODE_ENV === 'development' && (
        <>
          {/* Błędy walidacji */}
          {Object.keys(validationErrors).length > 0 && (
            <div className="absolute bottom-4 left-4 bg-red-600 text-white p-4 rounded max-w-md z-50">
              <h4 className="font-bold">Błędy walidacji:</h4>
              <pre className="text-xs mt-2">{JSON.stringify(validationErrors, null, 2)}</pre>
            </div>
          )}
          
          {/* Stan formularza */}
          <div className="absolute bottom-4 right-4 bg-blue-600 text-white p-4 rounded max-w-sm z-50">
            <h4 className="font-bold">Stan formularza:</h4>
            <div className="text-xs mt-2">
              <div>Krok: {currentStep}/{getMaxStep()}</div>
              <div>Name: "{formData.name}"</div>
              <div>Username: "{formData.username}"</div>
              <div>Survey Choice: "{formData.surveyChoice}"</div>
              <div>Skip Survey: {formData.skipSurvey ? 'YES' : 'NO'}</div>
              <div className="mt-1 text-yellow-200">
                Przekierowanie: {formData.skipSurvey ? '/plan-creator' : '/enhanced-plan-creator'}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RegistrationContainer;
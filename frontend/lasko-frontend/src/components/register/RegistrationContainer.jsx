import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../contexts/NotificationContext';
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
  const notify = useNotification();

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

  function updateFormData(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function getMaxStep() {
    return 4; // Account, Name, Birthdate, Username, SurveyChoice
  }

  function goToNextStep() {
    if (animating || isSubmitting) return;

    const maxStep = getMaxStep();
    if (currentStep < maxStep) {
      setDirection('next');
      setAnimating(true);
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
        setAnimating(false);
      }, 250);
    } else {
      handleSurveyDecision();
    }
  }

  function goToPrevStep() {
    if (animating || currentStep === 0) return;
    setDirection('prev');
    setAnimating(true);
    setTimeout(() => {
      setCurrentStep((prev) => prev - 1);
      setAnimating(false);
    }, 250);
  }

  function renderCurrentCard() {
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
    if (isSubmitting) return;

    setIsSubmitting(true);
    setValidationErrors({});

    try {
      const registrationData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password_confirm: formData.password,
        first_name: formData.name,
        date_of_birth: formData.birthDate,
      };

      await register(registrationData);

      if (!isAuthenticated()) {
        await login({ email: formData.email, password: formData.password });
      }

      if (isAuthenticated()) {
        const userProfileData = {
          registrationComplete: true,
          surveyChoice: formData.surveyChoice,
          skipSurvey: formData.skipSurvey,
        };
        await saveUserProfile(userProfileData);
      }

      const navigationState = {
        userData: formData,
        surveyCompleted: false,
        registrationSuccessful: true,
        skipBasicInfo: false,
        fromSurvey: false,
      };

      if (formData.skipSurvey) {
        navigate('/plan-creator', { state: { ...navigationState, mode: 'manual' } });
      } else {
        navigate('/enhanced-plan-creator', {
          state: { ...navigationState, skipBasicInfo: true, fromSurvey: true, mode: 'survey' },
        });
      }
    } catch (error) {
      if (error.validationErrors) {
        const mappedErrors = {};
        Object.entries(error.validationErrors).forEach(([field, messages]) => {
          const list = Array.isArray(messages) ? messages : [messages];
          mappedErrors[field] = list.join(', ');
        });
        setValidationErrors(mappedErrors);

        const errorMsg = Object.entries(error.validationErrors)
          .map(([field, messages]) => {
            const fieldName = getFieldDisplayName(field);
            const list = Array.isArray(messages) ? messages : [messages];
            return `${fieldName}: ${list.join(', ')}`;
          })
          .join('; ');

        notify.error(`Błędy rejestracji: ${errorMsg}`, 8000);

        if (mappedErrors.email || mappedErrors.password) setCurrentStep(0);
        else if (mappedErrors.first_name) setCurrentStep(1);
        else if (mappedErrors.date_of_birth) setCurrentStep(2);
        else if (mappedErrors.username) setCurrentStep(3);
      } else {
        const errorMessage = error?.message || 'Nieoczekiwany błąd podczas rejestracji';
        notify.error(`${errorMessage}. Spróbuj ponownie.`, 6000);
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
      />

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

      <div
        className="max-w-lg w-full mx-auto z-10 relative"
        style={{ minHeight: 'min(650px, 85vh)' }}
      >
        {/* Usunięto overlay ze spinnerem i tekstami podczas isSubmitting */}

        {/* zakotwiczenie karty od góry, rośnie w dół */}
        <div className="absolute inset-x-0 top-0 flex justify-center items-start px-2 pt-20 md:pt-[12vh]">
          <div
            className={`w-full transition-all duration-500 ease-in-out ${
              animating
                ? (direction === 'next'
                    ? '-translate-x-full opacity-0'
                    : 'translate-x-full opacity-0')
                : 'translate-x-0 opacity-100'
            }`}
          >
            {renderCurrentCard()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationContainer;
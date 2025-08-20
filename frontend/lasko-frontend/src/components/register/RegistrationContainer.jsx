import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AccountCard from './AccountCard';
import NameCard from './NameCard';
import BirthdateCard from './BirthdateCard';
import SurveyChoiceCard from './SurveyChoiceCard';
import GoalCard from './GoalCard';
import LevelCard from './LevelCard';
import TrainingDaysCard from './TrainingDaysCard';
import EquipmentCard from './EquipmentCard';
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
    surveyChoice: '',
    skipSurvey: false,
    // Dane z ankiety
    goal: '',
    level: '',
    trainingDaysPerWeek: null,
    equipmentPreference: ''
  });

  const getFieldDisplayName = (field) => {
    const fieldNames = {
      'username': 'Nazwa użytkownika',
      'email': 'Email',
      'password': 'Hasło',
      'password_confirm': 'Potwierdzenie hasła',
      'first_name': 'Imię',
      'date_of_birth': 'Data urodzenia',
      'goal': 'Cel',
      'level': 'Poziom',
      'training_days_per_week': 'Dni treningowe w tygodniu',
      'equipment_preference': 'Preferencje sprzętu'
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

  function goToNextStep() {
    if (animating) return;

    const maxStep = formData.skipSurvey ? 3 : 7;
    
    if (currentStep < maxStep) {
      setDirection('next');
      setAnimating(true);
      
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setAnimating(false);
      }, 250);
    } else {
      handleSubmitRegistration();
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

  async function handleSubmitRegistration() {
    setIsSubmitting(true);
    setValidationErrors({});
    
    try {
      const registrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        birthDate: formData.birthDate || null,
        goal: formData.goal || '',
        level: formData.level || '',
        trainingDaysPerWeek: formData.trainingDaysPerWeek || null,
        equipmentPreference: formData.equipmentPreference || '',
      };

      console.log('🔍 DEBUGGING - Szczegóły rejestracji:');
      console.log('='.repeat(50));
      console.log('📝 Dane z formularza:');
      console.log('   name:', `"${formData.name}"`);
      console.log('   email:', `"${formData.email}"`);
      console.log('   goal:', `"${formData.goal}"`);
      console.log('   level:', `"${formData.level}"`);
      console.log('   trainingDaysPerWeek:', formData.trainingDaysPerWeek);
      console.log('   equipmentPreference:', `"${formData.equipmentPreference}"`);
      console.log('   skipSurvey:', formData.skipSurvey);
      console.log('📤 Dane wysyłane do API:', registrationData);
      console.log('='.repeat(50));

      console.log('RegistrationContainer: Wysyłanie danych rejestracji:', registrationData);

      const response = await register(registrationData);
      
      console.log('RegistrationContainer: Rejestracja udana:', response);
      
      navigate('/dashboard');
      
    } catch (error) {
      console.error('RegistrationContainer: Błąd rejestracji:', error);
      
      console.log('🚨 DEBUGGING - Szczegóły błędu:');
      console.log('='.repeat(50));
      console.log('❌ Error object:', error);
      console.log('❌ Error message:', error.message);
      console.log('❌ Validation errors:', error.validationErrors);
      console.log('❌ Error field:', error.field);
      console.log('='.repeat(50));
      
      if (error.validationErrors) {
        const mappedErrors = {};
        Object.entries(error.validationErrors).forEach(([field, messages]) => {
          const messagesList = Array.isArray(messages) ? messages : [messages];
          mappedErrors[field] = messagesList.join(', ');
        });
        
        setValidationErrors(mappedErrors);
        
        console.log('🔄 DEBUGGING - Mapowanie błędów:');
        console.log('Original errors:', error.validationErrors);
        console.log('Mapped errors:', mappedErrors);
        
        const errorMessages = Object.entries(error.validationErrors)
          .map(([field, messages]) => {
            const fieldName = getFieldDisplayName(field);
            const messagesList = Array.isArray(messages) ? messages : [messages];
            return `${fieldName}: ${messagesList.join(', ')}`;
          })
          .join('\n');
        
        alert(`Błędy walidacji:\n${errorMessages}`);
        
        const errorField = error.field;
        console.log('📍 Przechodzę do kroku dla pola:', errorField);
        
        if (['username', 'email', 'password', 'password_confirm'].includes(errorField)) {
          setCurrentStep(0);
          console.log('➡️ Przejście do kroku 0 (AccountCard)');
        } else if (['first_name'].includes(errorField)) {
          setCurrentStep(1);
          console.log('➡️ Przejście do kroku 1 (NameCard)');
        } else if (['date_of_birth'].includes(errorField)) {
          setCurrentStep(2);
          console.log('➡️ Przejście do kroku 2 (BirthdateCard)');
        } else if (['goal'].includes(errorField)) {
          setCurrentStep(4);
          console.log('➡️ Przejście do kroku 4 (GoalCard)');
        } else if (['level'].includes(errorField)) {
          setCurrentStep(5);
          console.log('➡️ Przejście do kroku 5 (LevelCard)');
        } else if (['training_days_per_week'].includes(errorField)) {
          setCurrentStep(6);
          console.log('➡️ Przejście do kroku 6 (TrainingDaysCard)');
        } else if (['equipment_preference'].includes(errorField)) {
          setCurrentStep(7);
          console.log('➡️ Przejście do kroku 7 (EquipmentCard)');
        } else {
          setCurrentStep(0);
          console.log('➡️ Przejście do kroku 0 (domyślnie)');
        }
      } else {
        console.log('❌ Ogólny błąd bez szczegółów walidacji');
        alert(`Błąd rejestracji: ${error.message}`);
        setCurrentStep(0);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function getNextStep() {
    if (currentStep === 3 && formData.skipSurvey) {
      return currentStep + 4;
    }
    return currentStep + 1;
  }

  function renderCurrentCard() {
    const cardProps = {
      formData,
      updateFormData,
      validationErrors,
      onNext: goToNextStep,
      onPrev: goToPrevStep,
      isSubmitting: isSubmitting
    };
    
    switch (currentStep) {
      case 0:
        return <AccountCard {...cardProps} />;
      case 1:
        return <NameCard {...cardProps} />;
      case 2:
        return <BirthdateCard {...cardProps} />;
      case 3:
        return <SurveyChoiceCard {...cardProps} />;
      case 4:
        return <GoalCard {...cardProps} />;
      case 5:
        return <LevelCard {...cardProps} />;
      case 6:
        return <TrainingDaysCard {...cardProps} />;
      case 7:
        return <EquipmentCard {...cardProps} isLastStep={true} />;
      default:
        return null;
    }
  }

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center px-4 py-10"
      style={{
        backgroundImage: `url(${RegisterBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative"
      }}
    >
      {/* Ciemna nakładka z turkusowym odcieniem */}
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
      
      {/* Wskaźnik postępu */}
      <div className="absolute top-8 right-8 z-10">
        <div className="text-white text-sm">
          Krok {currentStep + 1} z {formData.skipSurvey ? 4 : 8}
        </div>
        <div className="w-32 h-2 bg-gray-600 rounded-full mt-2">
          <div 
            className="h-full bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] rounded-full transition-all duration-300"
            style={{ 
              width: `${((currentStep + 1) / (formData.skipSurvey ? 4 : 8)) * 100}%` 
            }}
          />
        </div>
      </div>
      
      {/* ZMIENIONA WYSOKOŚĆ KONTENERA */}
      <div className="max-w-lg w-full mx-auto z-10 relative overflow-hidden" style={{ height: 'min(650px, 85vh)' }}>
        {/* Loading overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 rounded-3xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1DCD9F] mx-auto mb-4"></div>
              <p className="text-white text-lg">Tworzenie konta...</p>
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

      {/* DEBUG INFO */}
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
              <div>Krok: {currentStep}</div>
              <div>Goal: "{formData.goal}"</div>
              <div>Level: "{formData.level}"</div>
              <div>Equipment: "{formData.equipmentPreference}"</div>
              <div>Days: {formData.trainingDaysPerWeek}</div>
              <div>Skip Survey: {formData.skipSurvey ? 'YES' : 'NO'}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RegistrationContainer;
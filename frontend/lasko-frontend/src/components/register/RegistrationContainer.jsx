
// frontend/lasko-frontend/src/components/register/RegistrationContainer.jsx (AKTUALIZACJA)
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

  // Funkcja do aktualizacji danych formularza
  function updateFormData(field, value) {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }

  // Funkcja do przejścia do następnego kroku z animacją
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
      // Ostatni krok - wyślij formularz
      handleSubmitRegistration();
    }
  }

  // Funkcja do przejścia do poprzedniego kroku z animacją
  function goToPrevStep() {
    if (animating || currentStep === 0) return;

    setDirection('prev');
    setAnimating(true);
    
    setTimeout(() => {
      setCurrentStep(prev => prev - 1);
      setAnimating(false);
    }, 250);
  }

  // Funkcja do wysłania formularza rejestracji
  async function handleSubmitRegistration() {
    setIsSubmitting(true);
    
    try {
      // Przygotuj dane do wysłania
      const registrationData = {
        username: formData.name.toLowerCase().replace(/\s+/g, ''), // Generuj username z imienia
        email: formData.email,
        password: formData.password,
        first_name: formData.name,
        date_of_birth: formData.birthDate || null,
        goal: formData.goal || '',
        level: formData.level || '',
        training_days_per_week: formData.trainingDaysPerWeek || null,
        equipment_preference: formData.equipmentPreference || '',
      };

      console.log('Wysyłanie danych rejestracji:', registrationData);

      // Wyślij dane do API
      const response = await register(registrationData);
      
      console.log('Rejestracja udana:', response);
      
      // Przekieruj do strony głównej lub dashboardu
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Błąd rejestracji:', error);
      
      // Pokaż komunikat błędu (możesz dodać toast notification)
      alert(`Błąd rejestracji: ${error.message}`);
      
      // Wróć do pierwszego kroku w przypadku błędu
      setCurrentStep(0);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Sprawdź który krok omijamy jeśli użytkownik wybierze pominięcie ankiety
  function getNextStep() {
    if (currentStep === 3 && formData.skipSurvey) {
      return currentStep + 4; // Pomiń kroki ankiety (4-7)
    }
    return currentStep + 1;
  }

  // Funkcja renderująca odpowiednią kartę
  function renderCurrentCard() {
    const nextStep = direction === 'next' ? currentStep + 1 : currentStep - 1;
    
    switch (currentStep) {
      case 0:
        return (
          <AccountCard 
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
            isSubmitting={isSubmitting}
          />
        );
      case 1:
        return (
          <NameCard
            formData={formData}
            updateFormData={updateFormData}
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
            onNext={goToNextStep}
            onPrev={goToPrevStep}
            isSubmitting={isSubmitting}
          />
        );
      case 3:
        return (
          <SurveyChoiceCard
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
            onPrev={goToPrevStep}
            isSubmitting={isSubmitting}
          />
        );
      case 4:
        return (
          <GoalCard
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
            onPrev={goToPrevStep}
            isSubmitting={isSubmitting}
          />
        );
      case 5:
        return (
          <LevelCard
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
            onPrev={goToPrevStep}
            isSubmitting={isSubmitting}
          />
        );
      case 6:
        return (
          <TrainingDaysCard
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
            onPrev={goToPrevStep}
            isSubmitting={isSubmitting}
          />
        );
      case 7:
        return (
          <EquipmentCard
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
            onPrev={goToPrevStep}
            isSubmitting={isSubmitting}
            isLastStep={true}
          />
        );
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
      
      {/* Kontener dla kart rejestracji */}
      <div className="max-w-lg w-full mx-auto z-10 relative overflow-hidden h-[550px]">
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
    </div>
  );
};

export default RegistrationContainer;

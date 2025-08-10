import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AccountCard from './AccountCard';
import NameCard from './NameCard';
import BirthdateCard from './BirthdateCard';
import SurveyChoiceCard from './SurveyChoiceCard';
import GoalCard from './GoalCard';
import LevelCard from './LevelCard';
import TrainingDaysCard from './TrainingDaysCard';
import EquipmentCard from './EquipmentCard';

const RegistrationContainer = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState('next');
  const [animating, setAnimating] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    birthDate: '',
    surveyChoice: '', // 'fill' lub 'skip'
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
    const maxStep = formData.skipSurvey ? 4 : 8; // 4 dla pominięcia ankiety, 8 dla pełnej ankiety
    
    if (animating || currentStep >= maxStep) {
      if (currentStep >= maxStep) {
        // Zakończenie rejestracji
        handleRegistrationComplete();
      }
      return;
    }
    
    setAnimating(true);
    setDirection('next');
    
    setTimeout(() => {
      let nextStep = currentStep + 1;
      
      // Jeśli użytkownik wybrał pominięcie ankiety po kroku 3 (SurveyChoiceCard)
      if (currentStep === 3 && formData.skipSurvey) {
        // Przejdź bezpośrednio do kreatora planu
        handleRegistrationComplete();
        return;
      }
      
      setCurrentStep(nextStep);
      setAnimating(false);
    }, 600);
  }

  // Funkcja do przejścia do poprzedniego kroku z animacją
  function goToPrevStep() {
    if (animating || currentStep <= 0) return;
    
    setAnimating(true);
    setDirection('prev');
    
    setTimeout(() => {
      let prevStep = currentStep - 1;
      
      // Jeśli cofamy się z ankiety do wyboru ankiety, resetuj dane ankiety
      if (currentStep === 4) {
        setFormData(prev => ({
          ...prev,
          goal: '',
          level: '',
          trainingDaysPerWeek: null,
          equipmentPreference: ''
        }));
      }
      
      setCurrentStep(prevStep);
      setAnimating(false);
    }, 600);
  }

  // Funkcja obsługująca zakończenie rejestracji
  const handleRegistrationComplete = async () => {
    try {
      // Tutaj będzie wysłanie danych do backendu
      console.log('Dane rejestracji:', formData);
      
      if (formData.skipSurvey) {
        // Przekieruj do kreatora planu
        navigate('/plan-creator');
      } else {
        // Przekieruj do rekomendacji planów
        navigate('/recommended-plans', { state: { surveyData: formData } });
      }
    } catch (error) {
      console.error('Błąd podczas rejestracji:', error);
      alert('Wystąpił błąd podczas rejestracji. Spróbuj ponownie.');
    }
  };

  // Renderowanie aktualnej karty
  const renderCard = () => {
    switch (currentStep) {
      case 0:
        return (
          <AccountCard 
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
          />
        );
      case 1:
        return (
          <NameCard
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
            onPrev={goToPrevStep}
          />
        );
      case 2:
        return (
          <BirthdateCard
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
            onPrev={goToPrevStep}
          />
        );
      case 3:
        return (
          <SurveyChoiceCard
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
            onPrev={goToPrevStep}
          />
        );
      case 4:
        return (
          <GoalCard
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
            onPrev={goToPrevStep}
          />
        );
      case 5:
        return (
          <LevelCard
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
            onPrev={goToPrevStep}
          />
        );
      case 6:
        return (
          <TrainingDaysCard
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
            onPrev={goToPrevStep}
          />
        );
      case 7:
        return (
          <EquipmentCard
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
            onPrev={goToPrevStep}
          />
        );
      default:
        return null;
    }
  };

  // Renderowanie następnej karty dla animacji
  const renderNextCard = () => {
    const nextStep = direction === 'next' ? currentStep + 1 : currentStep - 1;
    
    switch (nextStep) {
      case 0:
        return (
          <AccountCard 
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
          />
        );
      case 1:
        return (
          <NameCard
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
            onPrev={goToPrevStep}
          />
        );
      case 2:
        return (
          <BirthdateCard
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
            onPrev={goToPrevStep}
          />
        );
      case 3:
        return (
          <SurveyChoiceCard
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
            onPrev={goToPrevStep}
          />
        );
      case 4:
        return (
          <GoalCard
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
            onPrev={goToPrevStep}
          />
        );
      case 5:
        return (
          <LevelCard
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
            onPrev={goToPrevStep}
          />
        );
      case 6:
        return (
          <TrainingDaysCard
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
            onPrev={goToPrevStep}
          />
        );
      case 7:
        return (
          <EquipmentCard
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
            onPrev={goToPrevStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center px-4 py-10"
      style={{
        backgroundImage: "url('/src/assets/Photos/Register_background.png')",
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
      
      {/* Kontener dla kart rejestracji */}
      <div className="max-w-lg w-full mx-auto z-10 relative overflow-hidden h-[550px]">
        {/* Obecnie widoczna karta */}
        <div 
          className={`absolute inset-0 transition-all duration-500 ease-in-out ${
            animating ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
          }`}
        >
          {renderCard()}
        </div>
        
        {/* Animowana następna/poprzednia karta */}
        {animating && (
          <div 
            className={`absolute inset-0 transition-all duration-500 ease-in-out ${
              direction === 'next' 
                ? 'translate-y-full opacity-0 animate-card-slide-up' 
                : '-translate-y-full opacity-0 animate-card-slide-down'
            }`}
          >
            {renderNextCard()}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationContainer;
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AccountCard from './AccountCard';
import NameCard from './NameCard';
import BirthdateCard from './BirthdateCard';
import UsernameCard from './UserNameCard';

const RegistrationContainer = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState('next'); // 'next' lub 'prev'
  const [animating, setAnimating] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    birthDate: '',
    username: '@',
  });

  // Aktualizacja danych formularza - używana przez wszystkie karty
  function updateFormData(field, value) {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }

  // Funkcja do przejścia do następnego kroku z animacją
  function goToNextStep() {
    if (animating || currentStep >= 3) return; // 3 to ostatni indeks (teraz mamy 4 karty)
    
    setAnimating(true);
    setDirection('next');
    
    // Po zakończeniu animacji, aktualizujemy step
    setTimeout(() => {
      setCurrentStep(prev => prev + 1);
      setAnimating(false);
    }, 600);
  }

  // Funkcja do przejścia do poprzedniego kroku z animacją
  function goToPrevStep() {
    if (animating || currentStep <= 0) return;
    
    setAnimating(true);
    setDirection('prev');
    
    // Po zakończeniu animacji, aktualizujemy step
    setTimeout(() => {
      setCurrentStep(prev => prev - 1);
      setAnimating(false);
    }, 600);
  }

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
          <UsernameCard
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

  // Renderowanie następnej karty (dla animacji)
  const renderNextCard = () => {
    if (direction === 'next') {
      switch (currentStep) {
        case 0:
          return (
            <NameCard
              formData={formData}
              updateFormData={updateFormData}
              onNext={goToNextStep}
              onPrev={goToPrevStep}
            />
          );
        case 1:
          return (
            <BirthdateCard
              formData={formData}
              updateFormData={updateFormData}
              onNext={goToNextStep}
              onPrev={goToPrevStep}
            />
          );
        case 2:
          return (
            <UsernameCard
              formData={formData}
              updateFormData={updateFormData}
              onNext={goToNextStep}
              onPrev={goToPrevStep}
            />
          );
        default:
          return null;
      }
    } else {
      // Kierunek 'prev'
      switch (currentStep) {
        case 1:
          return (
            <AccountCard 
              formData={formData}
              updateFormData={updateFormData}
              onNext={goToNextStep}
            />
          );
        case 2:
          return (
            <NameCard
              formData={formData}
              updateFormData={updateFormData}
              onNext={goToNextStep}
              onPrev={goToPrevStep}
            />
          );
        case 3:
          return (
            <BirthdateCard
              formData={formData}
              updateFormData={updateFormData}
              onNext={goToNextStep}
              onPrev={goToPrevStep}
            />
          );
        default:
          return null;
      }
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center px-4 py-10"
      style={{
        backgroundImage: "url('src/assets/photos/Register_background.png')",
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
// // frontend/lasko-frontend/src/components/register/GoalCard.jsx
// import React, { useState } from 'react';

// /**
//  * Karta wyboru głównego celu treningowego.
//  * - Ciemny motyw, minimalna wysokość, treść wyśrodkowana pionowo
//  * - ARIA: radiogroup (przyciski zachowują się jak radio)
//  * - Walidacja inline: wybór wymagany
//  */
// const GoalCard = ({
//   formData,
//   updateFormData,
//   validationErrors = {},
//   onNext,
//   onPrev,
//   isSubmitting = false,
// }) => {
//   // Wartość zaznaczonego celu (kontrolowana lokalnie i w formData)
//   const [selectedGoal, setSelectedGoal] = useState(formData?.goal || '');

//   // Dostępne opcje celu
//   const goals = [
//     {
//       value: 'masa',
//       label: 'Budowanie masy mięśniowej',
//       description: 'Chcę zwiększyć masę i siłę',
//       icon: '💪',
//     },
//     {
//       value: 'redukcja',
//       label: 'Redukcja tkanki tłuszczowej',
//       description: 'Chcę spalić tłuszcz i wyrzeźbić sylwetkę',
//       icon: '🔥',
//     },
//     {
//       value: 'siła',
//       label: 'Zwiększenie siły',
//       description: 'Chcę być silniejszy/silniejsza',
//       icon: '⚡',
//     },
//     {
//       value: 'kondycja',
//       label: 'Poprawa kondycji',
//       description: 'Chcę poprawić wytrzymałość i kondycję',
//       icon: '🏃',
//     },
//   ];

//   // Zapis wyboru
//   const handleGoalSelect = (goalValue) => {
//     setSelectedGoal(goalValue);
//     updateFormData('goal', goalValue);
//   };

//   // Obsługa aktywacji klawiszem Enter/Space
//   const handleKeyActivate = (event, goalValue) => {
//     if (event.key === 'Enter' || event.key === ' ') {
//       event.preventDefault();
//       handleGoalSelect(goalValue);
//     }
//   };

//   // Zatwierdzenie kroku
//   const handleSubmit = (event) => {
//     event.preventDefault();
//     if (!selectedGoal || isSubmitting) return;
//     onNext();
//   };

//   const isFormValid = Boolean(selectedGoal);

//   return (
//     <div
//       className={[
//         'bg-[#0a0a0a]/95 rounded-3xl shadow-xl p-6 md:p-8 w-full',
//         'flex flex-col border border-[#222222] shadow-[0_0_30px_10px_rgba(0,0,0,0.5)]',
//         'min-h-[520px]',
//       ].join(' ')}
//     >
//       <form onSubmit={handleSubmit} className="flex flex-col flex-1">
//         {/* Treść wyśrodkowana pionowo */}
//         <div className="flex flex-col gap-6 flex-1 justify-center">
//           {/* Nagłówek sekcji */}
//           <div className="text-center">
//             <h2 className="text-white text-2xl font-bold">Jaki jest Twój główny cel?</h2>
//             <p className="text-white/90 text-lg">Wybierz to, co najlepiej opisuje Twoje zamiary</p>
//           </div>

//           {/* Opcje wyboru celu (radiogroup) */}
//           <div
//             role="radiogroup"
//             aria-label="Wybór głównego celu treningowego"
//             className="flex flex-col gap-3"
//           >
//             {goals.map((goal) => {
//               const isActive = selectedGoal === goal.value;
//               return (
//                 <button
//                   key={goal.value}
//                   type="button"
//                   role="radio"
//                   aria-checked={isActive}
//                   disabled={isSubmitting}
//                   onClick={() => handleGoalSelect(goal.value)}
//                   onKeyDown={(e) => handleKeyActivate(e, goal.value)}
//                   className={[
//                     'relative p-4 rounded-xl text-left transition-all duration-300',
//                     'border bg-[#1D1D1D] text-gray-300',
//                     isActive
//                       ? 'border-[#1DCD9F] bg-gradient-to-r from-[#0D7A61]/20 to-[#1DCD9F]/20 text-white'
//                       : 'border-[#444444] hover:border-[#1DCD9F]/50 hover:bg-[#252525]',
//                     isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
//                   ].join(' ')}
//                 >
//                   <div className="flex items-center gap-3">
//                     {/* Ikona celu */}
//                     <div
//                       className={[
//                         'text-2xl transition-transform duration-300',
//                         isActive ? 'scale-110' : 'group-hover:scale-105',
//                       ].join(' ')}
//                     >
//                       {goal.icon}
//                     </div>

//                     {/* Teksty */}
//                     <div className="flex-1">
//                       <div
//                         className={[
//                           'font-bold text-lg transition-colors duration-300',
//                           isActive ? 'text-[#1DCD9F]' : 'text-white',
//                         ].join(' ')}
//                       >
//                         {goal.label}
//                       </div>
//                       <div className="text-sm text-gray-400 mt-1">{goal.description}</div>
//                     </div>

//                     {/* Wskaźnik wyboru (radio) */}
//                     <div
//                       className={[
//                         'w-5 h-5 rounded-full border-2 transition-all duration-300',
//                         isActive
//                           ? 'border-[#1DCD9F] bg-[#1DCD9F] shadow-[0_0_10px_rgba(29,205,159,0.5)]'
//                           : 'border-gray-500',
//                       ].join(' ')}
//                       aria-hidden="true"
//                     >
//                       {isActive && (
//                         <div className="w-full h-full flex items-center justify-center">
//                           <div className="w-2 h-2 bg-white rounded-full" />
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   {/* Subtelny efekt tła przy hover (dla nieaktywnych) */}
//                   {!isActive && (
//                     <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-[#0D7A61]/5 to-[#1DCD9F]/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
//                   )}
//                 </button>
//               );
//             })}
//           </div>
//         </div>

//         {/* Błędy walidacji backendu */}
//         {validationErrors.goal && (
//           <div className="bg-red-900/20 border border-red-400/60 rounded-lg p-3 mt-4">
//             <p className="text-red-300 text-sm text-center">{validationErrors.goal}</p>
//           </div>
//         )}

//         {/* Nawigacja (CTA przy dole) */}
//         <div className="mt-auto grid grid-cols-2 gap-4 pt-4">
//           <button
//             type="button"
//             onClick={onPrev}
//             disabled={isSubmitting}
//             className="bg-[#1D1D1D] hover:bg-[#292929] text-white font-bold py-4 rounded-full transition-all duration-300 disabled:opacity-60"
//           >
//             Wstecz
//           </button>

//           <button
//             type="submit"
//             disabled={!isFormValid || isSubmitting}
//             className={[
//               'py-4 rounded-full font-bold transition-all duration-300',
//               isFormValid && !isSubmitting

//                 : 'bg-gray-600 text-gray-300 cursor-not-allowed',
//             ].join(' ')}
//             aria-busy={isSubmitting ? 'true' : 'false'}
//           >
//             {isSubmitting ? 'Ładowanie…' : 'Dalej'}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default GoalCard;
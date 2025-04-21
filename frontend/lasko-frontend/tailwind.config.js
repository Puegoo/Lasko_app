/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        screens: {
          'max-lg930': { 'max': '930px' },
        },
        keyframes: {
          cardSlideUp: {
            '0%': { transform: 'translateY(100%)', opacity: '0' },
            '100%': { transform: 'translateY(0)', opacity: '1' },
          },
          cardSlideDown: {
            '0%': { transform: 'translateY(-100%)', opacity: '0' },
            '100%': { transform: 'translateY(0)', opacity: '1' },
          }
        },
        animation: {
          'card-slide-up': 'cardSlideUp 500ms forwards ease-out',
          'card-slide-down': 'cardSlideDown 500ms forwards ease-out',
        },
      },
    },
    plugins: [],
}
  
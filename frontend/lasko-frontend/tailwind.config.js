/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'card-slide-up': 'slideUp 0.5s ease-in-out forwards',
        'card-slide-down': 'slideDown 0.5s ease-in-out forwards',
      },
      keyframes: {
        slideUp: {
          '0%': {
            transform: 'translateY(100%)',
            opacity: '0'
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1'
          }
        },
        slideDown: {
          '0%': {
            transform: 'translateY(-100%)',
            opacity: '0'
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1'
          }
        }
      },
      colors: {
        'lasko-primary': '#1DCD9F',
        'lasko-secondary': '#0D7A61',
        'lasko-dark': '#0a0a0a',
        'lasko-gray': '#1D1D1D',
      }
    },
  },
  plugins: [],
}
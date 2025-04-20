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
      },
    },
    plugins: [],
  }
  
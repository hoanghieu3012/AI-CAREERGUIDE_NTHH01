/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1', // Primary Indigo
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        gamify: {
          gold: '#F59E0B',
          amber: '#D97706',
          green: '#10B981',
          emerald: '#059669',
          coral: '#F43F5E',
          sky: '#0EA5E9',
          violet: '#8B5CF6',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'Be Vietnam Pro', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'gamify': '0 10px 25px -5px rgba(99, 102, 241, 0.15), 0 8px 10px -6px rgba(99, 102, 241, 0.1)',
        'gamify-hover': '0 20px 30px -10px rgba(99, 102, 241, 0.25)',
        'badge': '0 4px 14px 0 rgba(245, 158, 11, 0.39)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}

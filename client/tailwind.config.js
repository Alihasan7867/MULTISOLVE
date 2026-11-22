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
          dark: '#174D40',       // Primary green
          forest: '#133E34',     // Darker shade for hovers
          lime: '#98E66B',       // Secondary green
          limeDark: '#78C74D',
          limeLight: '#E8F8DE',
          bg: '#F5F5F5',         // Page background
          card: '#FFFFFF',       // Card background
          border: '#EAEAEA',     // Thin subtle borders
          text: '#171717',       // Primary text
          muted: '#929292',      // Secondary text
          danger: '#F87171',
          dangerBg: '#FEE2E2',
          success: '#98E66B',
          successBg: '#ECFDF5',
          warning: '#FBBF24',
          warningBg: '#FEF3C7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.03)',
        'card': '0 4px 20px -2px rgba(23, 77, 64, 0.05)',
        'dropdown': '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
}

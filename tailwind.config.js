/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: {
      xs: '420px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#ecfdf7',
          100: '#d1faeb',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        ink: '#172126',
      },
      boxShadow: {
        soft: '0 12px 30px rgba(23, 33, 38, 0.08)',
      },
    },
  },
  plugins: [],
};

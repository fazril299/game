/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        skyholm: {
          bg: '#F3EDE8',
          card: 'rgba(255, 255, 255, 0.88)',
          cardDark: 'rgba(15, 23, 42, 0.88)',
          ink: '#111827',
          muted: '#6B7280',
          accent: '#2B3BFF',
          accentHover: '#1E2CCC',
          gold: '#C5A059',
          border: 'rgba(0, 0, 0, 0.07)',
          borderDark: 'rgba(255, 255, 255, 0.1)',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Newsreader', 'Playfair Display', 'Georgia', 'serif'],
        display: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'luxury': '0 20px 40px -15px rgba(0, 0, 0, 0.07)',
        'luxury-hover': '0 30px 60px -15px rgba(0, 0, 0, 0.12)',
        'float': '0 12px 36px rgba(0, 0, 0, 0.08)',
        'glow-blue': '0 0 25px rgba(43, 59, 255, 0.4)',
      },
      animation: {
        'float-slow': 'floating 6s ease-in-out infinite',
        'pulse-subtle': 'subtlePulse 3s ease-in-out infinite',
      },
      keyframes: {
        floating: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        subtlePulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        }
      }
    },
  },
  plugins: [],
}

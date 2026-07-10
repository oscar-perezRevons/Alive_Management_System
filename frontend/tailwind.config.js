const config = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#4f46e5',
          dark: '#3730a3',
          light: '#eeebff',
        },
        secondary: {
          DEFAULT: '#8b5cf6',
          dark: '#6d28d9',
          light: '#f5f3ff',
        },
        alive: {
          blue: '#3b82f6',
          indigo: '#4f46e5',
          violet: '#8b5cf6',
          dark: '#0f172a',
          sidebar: '#0a0f24',
        }
      },
      boxShadow: {
        'premium': '0 10px 30px -10px rgba(0, 0, 0, 0.08)',
        'premium-hover': '0 20px 40px -15px rgba(0, 0, 0, 0.12)',
        'glow-primary': '0 0 15px rgba(79, 70, 229, 0.15)',
      }
    },
  },
  plugins: [],
};

export default config;
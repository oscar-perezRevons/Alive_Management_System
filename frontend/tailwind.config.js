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
        'glow-indigo': '0 0 25px rgba(99, 102, 241, 0.25), 0 0 50px rgba(99, 102, 241, 0.1)',
        'glow-violet': '0 0 25px rgba(139, 92, 246, 0.25), 0 0 50px rgba(139, 92, 246, 0.1)',
        'glow-amber': '0 0 25px rgba(245, 158, 11, 0.25), 0 0 50px rgba(245, 158, 11, 0.1)',
        'glow-emerald': '0 0 25px rgba(16, 185, 129, 0.2), 0 0 50px rgba(16, 185, 129, 0.08)',
        'card-hover': '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 30px rgba(99, 102, 241, 0.08)',
        'card-hover-dark': '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.15)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 3s infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
      },
      backgroundSize: {
        '300%': '300% 300%',
      },
    },
  },
  plugins: [],
};

export default config;
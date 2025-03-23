// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  safelist: [
    // Add frequently used dynamic classes
    'bg-green-50', 'bg-green-100', 'bg-red-50', 'bg-red-100', 'bg-blue-50', 'bg-blue-100',
    'text-green-600', 'text-green-700', 'text-green-800',
    'text-red-600', 'text-red-700', 'text-red-800',
    'text-blue-600', 'text-blue-700', 'text-blue-800',
    'border-green-200', 'border-green-300', 'border-green-500',
    'border-red-200', 'border-red-300', 'border-red-500',
    'border-blue-200', 'border-blue-300', 'border-blue-500',
    'hover:bg-green-600', 'hover:bg-red-600', 'hover:bg-blue-600',
    'dark:bg-gray-900', 'dark:bg-gray-800', 'dark:text-white', 'dark:text-gray-200',
    'animate-fade-in-down', 'animate-scale-in', 'animate-slide-in-right', 'animate-pulse-subtle'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3498db",
          dark: "#2980b9",
        },
        secondary: "#2c3e50",
        success: "#2ecc71",
        danger: "#e74c3c",
        warning: "#f39c12",
        info: "#3498db",
        light: "#ecf0f1",
        dark: "#2c3e50",
        gray: {
          750: '#2D3748', // Custom gray between 700 and 800 for dark mode
        }
      },
      animation: {
        'fade-in-down': 'fade-in-down 0.3s ease-out forwards',
        'scale-in': 'scale-in 0.3s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.3s ease-out forwards',
        'pulse-subtle': 'pulse-subtle 2s infinite',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-subtle': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-5px)' },
          '40%, 80%': { transform: 'translateX(5px)' },
        }
      },
      boxShadow: {
        'inner-lg': 'inset 0 2px 15px 0 rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    // Uncomment if you install @tailwindcss/typography
    // require('@tailwindcss/typography'),
  ],
  future: {
    hoverOnlyWhenSupported: true,
  }
}
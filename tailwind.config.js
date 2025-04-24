// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // We'll still use darkMode class for consistency with libraries
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6366f1", // indigo-500
          lighter: "#818cf8", // indigo-400
          darker: "#4f46e5",  // indigo-600
        },
        background: {
          DEFAULT: "#1f2937", // gray-800
          lighter: "#374151", // gray-700
          darker: "#111827",  // gray-900
        },
        card: {
          DEFAULT: "#1e293b", // gray-800/slate-800
          lighter: "#334155", // slate-700
          darker: "#0f172a",  // slate-900
        },
        text: {
          DEFAULT: "#f3f4f6", // gray-100
          muted: "#9ca3af",   // gray-400
          dark: "#1f2937",    // gray-800 (for any light text on dark bg)
        },
        success: "#10b981", // emerald-500
        danger: "#ef4444",  // red-500
        warning: "#f59e0b", // amber-500
        info: "#3b82f6",    // blue-500
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'expand-in': 'expandIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float': 'float 3s ease-in-out infinite',
        'pulse-subtle': 'blinkPulse 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        expandIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        blinkPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      boxShadow: {
        'soft': '0 5px 15px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 15px rgba(99, 102, 241, 0.3)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
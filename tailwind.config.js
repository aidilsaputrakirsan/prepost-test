/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
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
    'fadeIn', 'pulse'
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
      },
    },
  },
  plugins: [],
  future: {
    hoverOnlyWhenSupported: true,
  }
}
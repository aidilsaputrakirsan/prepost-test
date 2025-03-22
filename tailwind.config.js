/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
      "./pages/**/*.{js,ts,jsx,tsx,mdx}",
      "./components/**/*.{js,ts,jsx,tsx,mdx}",
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
  }
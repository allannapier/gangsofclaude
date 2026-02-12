/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'marinelli-red': '#dc2626',
        'rossetti-gold': '#ca8a04',
        'falcone-purple': '#7c3aed',
        'moretti-green': '#16a34a',
      },
    },
  },
  plugins: [],
}

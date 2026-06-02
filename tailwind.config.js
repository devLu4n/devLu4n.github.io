/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0D1322',
        blueCustom: '#2563EB',
        blueLt: '#E3F0FF',
        orangeCustom: '#FF6A00',
        whiteCustom: '#F2F4F8',
        bgCustom: '#F7FAFF',
        borderColor: '#E2EAF8',
        textCustom: '#0D1322',
        mutedCustom: '#6B7A99',
      },
      borderWidth: {
        '1.5': '1.5px',
      },
      boxShadow: {
        'search': '0 4px 32px rgba(37,99,235,0.10)',
        'card': '0 6px 32px rgba(37,99,235,0.10)',
      }
    },
  },
  plugins: [],
}
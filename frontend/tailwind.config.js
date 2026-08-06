/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0F172A',
        blueCustom: '#0369A1',
        blueDark: '#075985',
        blueLt: '#E0F2FE',
        orangeCustom: '#D97706',
        orangeDark: '#B45309',
        orangeLt: '#FEF3C7',
        whiteCustom: '#F8FAFC',
        bgCustom: '#F8FAFC',
        borderColor: '#E2E8F0',
        borderCustom: '#CBD5E1',
        lineCustom: '#E2E8F0',
        textCustom: '#020617',
        mutedCustom: '#475569',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderWidth: {
        '1.5': '1.5px',
      },
      boxShadow: {
        'search': '0 8px 24px rgba(15,23,42,.08)',
        'card': '0 12px 32px rgba(15,23,42,.08)',
        'glass': '0 24px 64px rgba(15,23,42,.12)',
        'button': '0 8px 20px rgba(3,105,161,.22)',
        'soft': '0 4px 16px rgba(15,23,42,.06)',
      }
    },
  },
  plugins: [],
}

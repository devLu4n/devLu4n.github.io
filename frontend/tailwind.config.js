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
        blueDark: '#2459D4',
        blueLt: '#E3F0FF',
        orangeCustom: '#FF6A00',
        orangeDark: '#E95500',
        orangeLt: '#FFE9D6',
        whiteCustom: '#F2F4F8',
        bgCustom: '#F7FAFF',
        borderColor: '#E2EAF8',
        borderCustom: '#D9E0EC',
        lineCustom: '#D8DFEC',
        textCustom: '#0D1322',
        mutedCustom: '#6B7A99',
      },
      borderWidth: {
        '1.5': '1.5px',
      },
      boxShadow: {
        'search': '0 4px 32px rgba(37,99,235,0.10)',
        'card': '0 6px 32px rgba(37,99,235,0.10)',
        'glass': '0 30px 80px rgba(22,31,58,.14)',
        'button': '0 10px 24px rgba(255,107,11,.25)',
        'soft': '0 10px 30px rgba(11,17,32,0.06)',
      }
    },
  },
  plugins: [],
}

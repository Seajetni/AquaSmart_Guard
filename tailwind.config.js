/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Kanit', 'Inter', 'sans-serif'],
      },
      colors: {
        ocean: {
          900: '#0b192c',
          800: '#1e3e62',
          700: '#005b94',
          600: '#008bce',
          500: '#00b4d8',
          400: '#90e0ef',
          100: '#caf0f8',
        },
      },
    },
  },
  plugins: [],
};

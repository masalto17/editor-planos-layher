/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        masalto: {
          rojo: '#E30613',
          negro: '#000000',
          gris: '#777777',
        },
      },
    },
  },
  plugins: [],
};

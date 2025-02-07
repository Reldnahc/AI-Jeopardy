/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        jump: {
          '0%, 15%': { transform: 'translateY(0)' },
          '25%': { transform: 'translateY(-10px)' },
          '35%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        // 2.5s total duration ensures that after the jump, there’s a pause before the wave repeats.
        jump: 'jump 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

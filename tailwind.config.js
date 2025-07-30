/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './index.html',
  ],
  theme: {
    extend: {
      colors: {
        'genfuze-blue': '#00FF41',
        black: '#000000',
        card: '#181818',
        'gray-800': '#1F2937',
        'gray-900': '#111827',
        'blue-500': '#3B82F6',
        'purple-500': '#A259FF',
        'green-500': '#22C55E',
        'yellow-500': '#FFD600',
        'red-500': '#FF4C60',
        white: '#FFFFFF',
        'gray-400': '#9CA3AF',
        'gray-600': '#4B5563',
        'blue-400': '#60A5FA',
        'green-400': '#34D399',
        'purple-400': '#A78BFA',
        primary: '#2563eb',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
};

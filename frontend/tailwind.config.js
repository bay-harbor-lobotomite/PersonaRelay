/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}", // Common for Next.js or Vite in a 'src' folder
  ],
  theme: {
    extend: {
      colors: {
        'neural': {
          'night': '#121212',      // Primary Background: bg-neural-night
          'graphite': '#1E1E1E',   // Secondary Background: bg-neural-graphite
          'light-graphite': '#282828', // Hover Surface / Borders: bg-neural-light-graphite
        },
        // Typography
        'text': {
          'primary': '#FFFFFF',      // text-text-primary
          'secondary': '#B3B3B3',    // text-text-secondary
          'tertiary': '#535353',     // text-text-tertiary
        },
        // Accents & Actions
        'accent': {
          'green': '#1DB954',     // Primary Action: bg-accent-green, text-accent-green
          'blue': '#3D7BDE',      // Secondary (AI/Data): bg-accent-blue, text-accent-blue
        },
        // System / Feedback
        'system': {
          'error': '#E63946',      // bg-system-error, text-system-error
        }
      },
      borderRadius: {
        'medium': '8px', // You can use this with `rounded-medium`
      }
    },
  },
  plugins: [], 
};
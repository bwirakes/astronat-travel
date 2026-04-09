/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'planet-sun': 'var(--color-planet-sun)',
        'planet-moon': 'var(--color-planet-moon)',
        'planet-mercury': 'var(--color-planet-mercury)',
        'planet-venus': 'var(--color-planet-venus)',
        'planet-mars': 'var(--color-planet-mars)',
        'planet-jupiter': 'var(--color-planet-jupiter)',
        'planet-saturn': 'var(--color-planet-saturn)',
        'planet-uranus': 'var(--color-planet-uranus)',
        'planet-neptune': 'var(--color-planet-neptune)',
        'planet-pluto': 'var(--color-planet-pluto)',
      },
      fontFamily: {
        primary: 'var(--font-primary)',
        secondary: 'var(--font-secondary)',
        body: 'var(--font-body)',
        'display-alt-1': 'var(--font-display-alt-1)',
        'display-alt-2': 'var(--font-display-alt-2)',
        mono: 'var(--font-mono)',
      },
      borderRadius: {
        none: 'var(--radius-none)',
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      }
    },
  },
  plugins: [],
};

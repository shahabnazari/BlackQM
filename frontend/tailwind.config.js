/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      fontFamily: {
        'sans': ['var(--font-sans)'],
        'mono': ['var(--font-mono)'],
      },
      colors: {
        // Apple Semantic Colors
        'bg': 'var(--color-bg)',
        'surface': 'var(--color-surface)',
        'surface-secondary': 'var(--color-surface-secondary)',
        
        'text': 'var(--color-text)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',
        
        'primary': 'var(--color-primary)',
        'primary-dark': 'var(--color-primary-dark)',
        
        'success': 'var(--color-success)',
        'warning': 'var(--color-warning)',
        'danger': 'var(--color-danger)',
        'info': 'var(--color-info)',
        
        'border': 'var(--color-border)',
        'border-secondary': 'var(--color-border-secondary)',
        
        'fill': 'var(--color-fill)',
        'fill-secondary': 'var(--color-fill-secondary)',
        
        // System colors with RGB values for opacity support
        'system-blue': 'rgb(0 122 255 / <alpha-value>)',
        'system-green': 'rgb(52 199 89 / <alpha-value>)',
        'system-red': 'rgb(255 59 48 / <alpha-value>)',
        'system-orange': 'rgb(255 149 0 / <alpha-value>)',
        'system-yellow': 'rgb(255 204 0 / <alpha-value>)',
        'system-purple': 'rgb(175 82 222 / <alpha-value>)',
        'system-pink': 'rgb(255 45 85 / <alpha-value>)',
        'system-teal': 'rgb(89 173 196 / <alpha-value>)',
      },
      spacing: {
        '1': 'var(--space-1)',
        '2': 'var(--space-2)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '5': 'var(--space-5)',
        '6': 'var(--space-6)',
        '7': 'var(--space-7)',
        '8': 'var(--space-8)',
        '9': 'var(--space-9)',
        '10': 'var(--space-10)',
        '11': 'var(--space-11)',
        '12': 'var(--space-12)',
        '14': 'var(--space-14)',
        '16': 'var(--space-16)',
        '20': 'var(--space-20)',
        '24': 'var(--space-24)',
        '28': 'var(--space-28)',
        '32': 'var(--space-32)',
      },
      fontSize: {
        'xs': 'var(--text-xs)',
        'sm': 'var(--text-sm)',
        'base': 'var(--text-base)',
        'lg': 'var(--text-lg)',
        'xl': 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
        '4xl': 'var(--text-4xl)',
        '5xl': 'var(--text-5xl)',
        '6xl': 'var(--text-6xl)',
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        'full': 'var(--radius-full)',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
      },
      animation: {
        'apple-scale': 'apple-scale var(--duration-fast) var(--ease-out)',
        'apple-fade-in': 'apple-fade-in var(--duration-normal) var(--ease-out)',
        'apple-slide-up': 'apple-slide-up var(--duration-normal) var(--ease-out)',
      },
      keyframes: {
        'apple-scale': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)' },
        },
        'apple-fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'apple-slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      },
      transitionDuration: {
        'fast': 'var(--duration-fast)',
        'normal': 'var(--duration-normal)',
        'slow': 'var(--duration-slow)',
        'slower': 'var(--duration-slower)',
      },
      transitionTimingFunction: {
        'apple-out': 'var(--ease-out)',
        'apple-in-out': 'var(--ease-in-out)',
        'apple-bounce': 'var(--ease-bounce)',
      },
    },
  },
  plugins: [],
}

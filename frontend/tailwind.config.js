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
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      colors: {
        // Enhanced Design System - Best of Apple + Industry Leaders
        bg: 'var(--enhanced-bg-primary, var(--apple-bg-primary))',
        surface: 'var(--enhanced-bg-elevated, var(--apple-bg-elevated))',
        'surface-secondary':
          'var(--enhanced-bg-secondary, var(--apple-bg-secondary))',
        'surface-tertiary': 'var(--apple-bg-tertiary)',
        'surface-grouped': 'var(--apple-bg-grouped)',
        'surface-interactive': 'var(--enhanced-bg-interactive)',

        // Material Effects
        material: {
          thin: 'var(--apple-material-thin)',
          regular: 'var(--apple-material-regular)',
          thick: 'var(--apple-material-thick)',
          chrome: 'var(--apple-material-chrome)',
        },

        text: 'var(--enhanced-text-primary, var(--apple-text-primary))',
        'text-secondary':
          'var(--enhanced-text-secondary, var(--apple-text-secondary))',
        'text-tertiary':
          'var(--enhanced-text-tertiary, var(--apple-text-tertiary))',
        'text-quaternary': 'var(--apple-text-quaternary)',
        'text-disabled': 'var(--enhanced-text-disabled)',
        'text-readable': 'var(--enhanced-text-tertiary)', // Minimum readable

        primary: 'var(--color-primary)',
        'primary-dark': 'var(--color-primary-dark)',

        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        info: 'var(--color-info)',

        separator: 'var(--enhanced-border-regular, var(--apple-separator))',
        'separator-opaque': 'var(--apple-separator-opaque)',
        border: 'var(--enhanced-border-regular, var(--apple-separator))',
        'border-strong': 'var(--enhanced-border-strong)',
        'border-subtle': 'var(--enhanced-border-subtle)',
        'border-secondary': 'var(--apple-separator-opaque)',

        fill: 'var(--apple-fill-primary)',
        'fill-secondary': 'var(--apple-fill-secondary)',
        'fill-tertiary': 'var(--apple-fill-tertiary)',
        'fill-quaternary': 'var(--apple-fill-quaternary)',
        'fill-empty': 'var(--enhanced-fill-empty)',
        'fill-empty-hover': 'var(--enhanced-fill-empty-hover)',
        'fill-empty-border': 'var(--enhanced-fill-empty-border)',

        // Additional mappings with 'color-' prefix for new components
        'color-bg': 'var(--color-bg)',
        'color-surface': 'var(--color-surface)',
        'color-surface-secondary': 'var(--color-surface-secondary)',
        'color-text': 'var(--color-text)',
        'color-text-secondary': 'var(--color-text-secondary)',
        'color-text-tertiary': 'var(--color-text-tertiary)',
        'color-primary': 'var(--color-primary)',
        'color-primary-dark': 'var(--color-primary-dark)',
        'color-success': 'var(--color-success)',
        'color-warning': 'var(--color-warning)',
        'color-danger': 'var(--color-danger)',
        'color-info': 'var(--color-info)',
        'color-border': 'var(--color-border)',
        'color-border-secondary': 'var(--color-border-secondary)',
        'color-fill': 'var(--color-fill)',
        'color-fill-secondary': 'var(--color-fill-secondary)',

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
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        5: 'var(--space-5)',
        6: 'var(--space-6)',
        7: 'var(--space-7)',
        8: 'var(--space-8)',
        9: 'var(--space-9)',
        10: 'var(--space-10)',
        11: 'var(--space-11)',
        12: 'var(--space-12)',
        14: 'var(--space-14)',
        16: 'var(--space-16)',
        20: 'var(--space-20)',
        24: 'var(--space-24)',
        28: 'var(--space-28)',
        32: 'var(--space-32)',
      },
      fontSize: {
        xs: 'var(--text-xs)',
        sm: 'var(--text-sm)',
        base: 'var(--text-base)',
        lg: 'var(--text-lg)',
        xl: 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
        '4xl': 'var(--text-4xl)',
        '5xl': 'var(--text-5xl)',
        '6xl': 'var(--text-6xl)',
      },
      borderRadius: {
        xs: 'var(--apple-radius-xs)',
        sm: 'var(--apple-radius-sm)',
        md: 'var(--apple-radius-md)',
        lg: 'var(--apple-radius-lg)',
        xl: 'var(--apple-radius-xl)',
        '2xl': 'var(--apple-radius-2xl)',
        full: 'var(--apple-radius-full)',
      },
      boxShadow: {
        xs: 'var(--apple-shadow-xs)',
        sm: 'var(--apple-shadow-sm)',
        md: 'var(--apple-shadow-md)',
        lg: 'var(--apple-shadow-lg)',
        xl: 'var(--apple-shadow-xl)',
        blue: 'var(--apple-shadow-blue)',
        success: 'var(--apple-shadow-success)',
        none: '0 0 #0000',
      },
      backdropBlur: {
        xs: 'var(--apple-blur-sm)',
        sm: 'var(--apple-blur-md)',
        md: 'var(--apple-blur-lg)',
        lg: 'var(--apple-blur-xl)',
      },
      borderWidth: {
        DEFAULT: '1px',
        0: '0px',
        0.5: '0.5px',
        2: '2px',
        4: '4px',
        8: '8px',
      },
      animation: {
        'apple-scale': 'apple-scale var(--duration-fast) var(--ease-out)',
        'apple-fade-in': 'apple-fade-in var(--duration-normal) var(--ease-out)',
        'apple-slide-up':
          'apple-slide-up var(--duration-normal) var(--ease-out)',
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
        },
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        normal: 'var(--duration-normal)',
        slow: 'var(--duration-slow)',
        slower: 'var(--duration-slower)',
      },
      transitionTimingFunction: {
        'apple-out': 'var(--ease-out)',
        'apple-in-out': 'var(--ease-in-out)',
        'apple-bounce': 'var(--ease-bounce)',
      },
    },
  },
  plugins: [],
};

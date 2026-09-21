import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        graphite: 'var(--color-graphite)',
        ivory: 'var(--color-ivory)',
        surface: 'var(--color-surface)',
        sun: 'var(--color-sun)',
        'sun-soft': 'var(--color-sun-soft)',
        'sun-ink': 'var(--color-sun-ink)',
        muted: 'var(--color-muted)',
        'muted-dark': 'var(--color-muted-dark)',
        line: 'var(--color-line)',
        'line-soft': 'var(--color-line-soft)',
        chip: 'var(--color-chip)',
        'bar-neutral': 'var(--color-bar-neutral)',
        success: 'var(--color-success)',
        'success-soft': 'var(--color-success-soft)',
        danger: 'var(--color-danger)',
        'danger-soft': 'var(--color-danger-soft)',
        info: 'var(--color-info)',
        'info-soft': 'var(--color-info-soft)',
        'neutral-chip': 'var(--color-neutral-chip)',
        'neutral-chip-soft': 'var(--color-neutral-chip-soft)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        field: '14px',
        button: '18px',
        card: '22px',
        hero: '30px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,27,45,0.06)',
        segment: '0 1px 2px rgba(15,27,45,0.08)',
      },
      backdropBlur: {
        chrome: '20px',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config

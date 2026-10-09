import type { Config } from 'tailwindcss'

/** Cores vêm de variáveis CSS (trocam no tema escuro). Para os modificadores de opacidade
 * (`bg-sun/15`, `text-muted/60`) funcionarem, a cor vira uma função que usa `color-mix`. */
function cor(variavel: string) {
  return ({ opacityValue }: { opacityValue?: string }) =>
    opacityValue === undefined || opacityValue === '1'
      ? `var(${variavel})`
      : `color-mix(in srgb, var(${variavel}) calc(${opacityValue} * 100%), transparent)`
}

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        graphite: cor('--color-graphite'),
        ivory: cor('--color-ivory'),
        'on-dark': cor('--color-on-dark'),
        surface: cor('--color-surface'),
        sun: cor('--color-sun'),
        'sun-soft': cor('--color-sun-soft'),
        'sun-ink': cor('--color-sun-ink'),
        muted: cor('--color-muted'),
        'muted-dark': cor('--color-muted-dark'),
        line: cor('--color-line'),
        'line-soft': cor('--color-line-soft'),
        chip: cor('--color-chip'),
        'bar-neutral': cor('--color-bar-neutral'),
        success: cor('--color-success'),
        'success-soft': cor('--color-success-soft'),
        danger: cor('--color-danger'),
        'danger-soft': cor('--color-danger-soft'),
        info: cor('--color-info'),
        'info-soft': cor('--color-info-soft'),
        'neutral-chip': cor('--color-neutral-chip'),
        'neutral-chip-soft': cor('--color-neutral-chip-soft'),
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

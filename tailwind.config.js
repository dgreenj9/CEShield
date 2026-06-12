/** @type {import('tailwindcss').Config} */
// Design tokens for CE Shield.
// Source of truth: src/utils/constants.js (legacy `colors` object). Tokens are
// duplicated here so Tailwind utilities (`bg-brand-blue`, `text-slate-medium`)
// work without spraying `style={{}}` everywhere. When changing a color, change
// both — until the legacy inline-style code is migrated.

const brand = {
  blue: '#3b82f6',
  'blue-strong': '#2563eb',
  purple: '#8b5cf6',
  'light-blue': '#e0f2fe',
  'muted-purple': '#e9d5ff',
  'muted-teal': '#cffafe',
  // Editorial accent used by LIBRARIAN-REVIEWED / strong-evidence surfaces.
  // Sage green reads "clinical, considered" without the saturation of
  // brand-blue or the loudness of the default Tailwind green.
  evidence: '#2F6B4D',
  'evidence-soft': '#E8EFEA',
};

const slate = {
  dark: '#1e293b',
  medium: '#475569',
  light: '#f1f5f9',
};

const ink = {
  dark: '#111827',
  gray: '#6b7280',
};

// Paper palette — warm off-white background and slightly creamier card
// surface. Replaces the previous pure-white app surface; the small temperature
// shift is the single biggest "this isn't a Tailwind template" signal.
const paper = {
  bg: '#FAFAF6',    // page background
  card: '#FFFFFF',  // cards / panels (kept clean for contrast)
  rule: '#E8E6DF',  // hairline divider tone
};

const evidence = {
  strong: '#22c55e',  // tier: Strong (70-100)
  good: '#3b82f6',    // tier: Good (50-69)
  moderate: '#fbbf24', // tier: Moderate (30-49)
  limited: '#94a3b8',  // tier: Limited (0-29)
};

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand,
        slate,
        ink,
        evidence,
        paper,
        'gray-bg': '#f9fafb',
      },
      borderRadius: {
        none: '0',
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        full: '9999px',
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.625rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.15' }],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)',
        elev: '0 4px 12px rgba(15, 23, 42, 0.08)',
        floating: '0 12px 32px rgba(15, 23, 42, 0.12)',
        focus: `0 0 0 3px ${brand.blue}40`,
      },
      ringColor: {
        brand: brand.blue,
      },
      fontFamily: {
        // Inter for body text — clean, neutral, but slightly more characterful
        // than system-ui defaults.
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        // Fraunces serif for page titles, hero, big stats. Variable-axis,
        // looks like a journal headline rather than a SaaS template.
        display: [
          'Fraunces',
          'ui-serif',
          'Georgia',
          'Cambria',
          '"Times New Roman"',
          'Times',
          'serif',
        ],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        'slide-up': {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'slide-up': 'slide-up 200ms ease-out',
      },
    },
  },
  plugins: [],
};

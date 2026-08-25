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

// Atlas evidence-tier scale — the only place color encodes data. Tiers stay
// within the accent family: petrol → mid-petrol → ochre → stone.
const evidence = {
  strong: '#235E6B',   // tier: Strong (70-100)
  good: '#4E7E8B',     // tier: Good (50-69)
  moderate: '#C77B2E', // tier: Moderate (30-49)
  limited: '#B9B4A6',  // tier: Limited (0-29)
};

// "Atlas" design tokens — the ground-up redesign (2026-08). Scientific-atlas
// art direction: warm paper ground, 1px ink rules, a single petrol accent,
// ochre as the only warning voice. Zero radius, zero shadow on Atlas
// surfaces. Source of truth: docs/design (Atlas handoff) +
// src/components/atlas/theme.js (JS mirror for inline-styled components).
const atlas = {
  paper: '#FAFAF5',
  band: '#F2F1E9',
  notice: '#F6F3E7',
  ink: '#1B1A17',
  'ink-body': '#45433C',
  'ink-muted': '#56544C',
  'rule-minor': '#D5D3C6',
  'rule-faint': '#E4E2D6',
  'rule-faintest': '#EEECDF',
  accent: '#235E6B',
  'accent-hover': '#17434E',
  'accent-mid': '#4E7E8B',
  'accent-tint': '#D9E4E6',
  warn: '#C77B2E',
  dim: '#B9B4A6',
  'on-accent': '#FAFAF5',
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
        atlas,
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
        // Atlas type system: Figtree for body/UI/labels/tabular numerals.
        // No serif and no monospace anywhere — deliberate override of the
        // previous Fraunces + JetBrains Mono pairing.
        sans: [
          'Figtree',
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
        // Instrument Sans for display: h1/h2/h3, big numerals, score chips.
        display: [
          '"Instrument Sans"',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
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

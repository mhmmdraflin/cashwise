/**
 * CashWise Anti-Slop Design Tokens
 * Source of truth for Web (Tailwind/CSS) and cross-platform UI.
 */

export const colors = {
  // Primary brand & text
  primary: {
    DEFAULT: '#0F172A', // Slate 900
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
  // Semantics: Income & Safe Budget
  income: {
    DEFAULT: '#059669', // Emerald 600
    light: '#ECFDF5',   // Emerald 50 (background)
    border: '#A7F3D0',  // Emerald 200
    dark: '#047857',    // Emerald 700 (text on light)
  },
  // Semantics: Expense & Danger/Over-Budget
  expense: {
    DEFAULT: '#E11D48', // Rose 600
    light: '#FFF1F2',   // Rose 50 (background)
    border: '#FECDD3',  // Rose 200
    dark: '#BE123C',    // Rose 700 (text on light)
  },
  // Semantics: Warning (70-90% Budget Limit)
  warning: {
    DEFAULT: '#D97706', // Amber 600
    light: '#FFFBEB',   // Amber 50
    border: '#FDE68A',  // Amber 200
    dark: '#B45309',    // Amber 700
  },
  // Interactive Accent (CTA & Active Tab)
  accent: {
    DEFAULT: '#4F46E5', // Indigo 600
    hover: '#4338CA',   // Indigo 700
    light: '#EEF2FF',   // Indigo 50
    border: '#C7D2FE',  // Indigo 200
  },
  // Surface & Layout
  surface: {
    bg: '#F8FAFC',      // Slate 50 (page background)
    card: '#FFFFFF',    // Pure White (card surface)
    subtle: '#F1F5F9',  // Slate 100 (nested items)
    border: '#E2E8F0',  // Slate 200 (crisp dividing lines)
    borderStrong: '#CBD5E1', // Slate 300
  },
  // Text Hierarchies
  text: {
    primary: '#0F172A',   // Slate 900 (headings, main numbers)
    secondary: '#475569', // Slate 600 (labels, descriptions)
    muted: '#64748B',     // Slate 500 (timestamps, placeholders)
    inverted: '#FFFFFF',
  },
} as const;

export const typography = {
  fontFamily: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace',
  },
  fontSize: {
    hero: ['2rem', { lineHeight: '2.5rem', fontWeight: '700' }],         // 32px
    titleLg: ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],      // 24px
    titleMd: ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }], // 20px
    base: ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],         // 16px
    bodySm: ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],  // 14px
    caption: ['0.75rem', { lineHeight: '1rem', fontWeight: '500' }],     // 12px
  },
} as const;

export const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem',  // 8px
  md: '1rem',    // 16px
  lg: '1.5rem',  // 24px
  xl: '2rem',    // 32px
  xxl: '3rem',   // 48px
} as const;

export const radii = {
  sm: '0.375rem', // 6px
  md: '0.5rem',   // 8px (standard buttons, cards)
  lg: '0.75rem',  // 12px (modals, dialogs)
  full: '9999px',
} as const;

export const elevation = {
  none: 'none',
  card: '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)',
  dropdown: '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
  modal: '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.06)',
} as const;

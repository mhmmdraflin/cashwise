/**
 * CashWise Tailwind CSS Preset
 * Plug-and-play theme configuration for web/tailwind.config.ts.
 */

import { colors, elevation, radii, typography } from './tokens';

export const cashwiseTailwindConfig = {
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        income: colors.income,
        expense: colors.expense,
        warning: colors.warning,
        accent: colors.accent,
        surface: colors.surface,
        appText: colors.text,
      },
      fontFamily: {
        sans: typography.fontFamily.sans.split(', '),
        mono: typography.fontFamily.mono.split(', '),
      },
      borderRadius: radii,
      boxShadow: elevation,
    },
  },
};

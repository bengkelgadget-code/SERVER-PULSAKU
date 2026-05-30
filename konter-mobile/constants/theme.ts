export const Colors = {
  primary: '#6366F1',      // Indigo-500
  primaryDark: '#4F46E5',  // Indigo-600
  primaryLight: '#818CF8', // Indigo-400
  primaryBg: '#EEF2FF',    // Indigo-50

  accent: '#10B981',       // Emerald-500
  accentDark: '#059669',   // Emerald-600
  accentLight: '#34D399',  // Emerald-400
  accentBg: '#ECFDF5',     // Emerald-50

  warning: '#F59E0B',      // Amber-500
  error: '#EF4444',        // Red-500
  success: '#22C55E',      // Green-500

  white: '#FFFFFF',
  black: '#0F172A',

  gray50:  '#F8FAFC',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F172A',

  // Gradient pairs
  gradientPrimary: ['#6366F1', '#8B5CF6'] as const,
  gradientAccent:  ['#10B981', '#06B6D4'] as const,
  gradientWarm:    ['#F59E0B', '#EF4444'] as const,
  gradientCard:    ['#FFFFFF', '#F1F5F9'] as const,
};

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  xxl:  48,
};

export const Radius = {
  sm:   8,
  md:   12,
  lg:   20,
  xl:   28,
  full: 9999,
};

export const FontSize = {
  xs:   11,
  sm:   13,
  md:   15,
  lg:   17,
  xl:   20,
  xxl:  24,
  xxxl: 32,
};

export const Shadow = {
  sm: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

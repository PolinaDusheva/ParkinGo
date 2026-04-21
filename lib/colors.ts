export const COLORS = {
  light: {
    background: '#FFFFFF',
    groupedBackground: '#F2F2F7',
    surface: '#FFFFFF',
    text: '#000000',
    textSecondary: '#8E8E93',
    separator: '#C6C6C8',
    destructive: '#FF3B30',
    tint: '#4A90D9',
  },
  dark: {
    background: '#000000',
    groupedBackground: '#1C1C1E',
    surface: '#2C2C2E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    separator: '#38383A',
    destructive: '#FF453A',
    tint: '#0A84FF',
  },
} as const;

export type AppColors = (typeof COLORS)['light'];

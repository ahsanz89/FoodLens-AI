import { useColorScheme } from 'react-native';

export const palette = {
  primary: '#2E8B57',
  secondary: '#FF9F43',
  success: '#2E8B57',
  warning: '#E7A23B',
  error: '#D9534F',
};

export const lightColors = {
  ...palette,
  background: '#FAFAF7',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F3EF',
  text: '#202522',
  textSecondary: '#5F6762', // darkened from #777F79 for AA contrast on white
  border: '#E3E7E2',
  primaryOn: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.45)',
};

export const darkColors: typeof lightColors = {
  ...palette,
  primary: '#3DA66A',
  background: '#121513',
  surface: '#1B1F1C',
  surfaceAlt: '#252A26',
  text: '#F2F4F1',
  textSecondary: '#A9B1AB',
  border: '#2E342F',
  primaryOn: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.6)',
};

export type Colors = typeof lightColors;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 14, lg: 20, pill: 999 };
export const font = { sm: 13, base: 15, md: 17, lg: 20, xl: 26, xxl: 32 };
export const MIN_TOUCH = 48;

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? darkColors : lightColors;
}

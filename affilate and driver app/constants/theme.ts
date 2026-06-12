import { Platform } from 'react-native';

// Brand colour palette — matches Customer-End design language
export const BLACK = '#030303';
export const BLACK_2 = '#090A09';
export const ROSE_GOLD = '#D7B46A';
export const ROSE_GOLD_2 = '#FFE9B0';
export const GOLD = '#C9A24A';
export const GOLD_DARK = '#8D6F22';
export const CARD = '#111211';
export const CARD_2 = '#171817';
export const TEXT = '#F8F3EF';
export const MUTED = '#B8B0A4';
export const LINE = '#342F24';
export const WHITE = '#FFFFFF';
export const SUCCESS = '#4CAF50';
export const WARNING = '#FF9800';
export const DANGER = '#E53935';
export const INFO = '#2196F3';

export const FONT_REGULAR = Platform.select({
  ios: 'Avenir Next',
  android: 'sans-serif',
  default: 'System',
});

export const FONT_LIGHT = Platform.select({
  ios: 'Avenir Next',
  android: 'sans-serif-light',
  default: 'System',
});

export const FONT_MEDIUM = Platform.select({
  ios: 'Avenir Next',
  android: 'sans-serif-medium',
  default: 'System',
});

export const Colors = {
  light: {
    text: TEXT,
    background: BLACK,
    tint: ROSE_GOLD,
    icon: MUTED,
    tabIconDefault: MUTED,
    tabIconSelected: ROSE_GOLD,
  },
  dark: {
    text: TEXT,
    background: BLACK,
    tint: ROSE_GOLD,
    icon: MUTED,
    tabIconDefault: MUTED,
    tabIconSelected: ROSE_GOLD,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
};

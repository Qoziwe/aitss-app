// Design tokens. Values are taken 1:1 from the approved UI design (light and dark).
// Never hardcode colors in components: read them with useTheme() / useThemedStyles().

export type Scheme = 'light' | 'dark';
export type ThemeMode = Scheme | 'system';

export type Colors = {
  bg: string;
  card: string;
  fill: string;
  line: string;
  text: string;
  muted: string;
  accent: string;
  onAccent: string;
  accentSoft: string;
  ok: string;
  okSoft: string;
  okBar: string;
  warn: string;
  warnSoft: string;
  warnBar: string;
  bad: string;
  badSoft: string;
  badBar: string;
};

export const lightColors: Colors = {
  bg: '#F7F7F4',
  card: '#FFFFFF',
  fill: '#F2F2EE',
  line: '#E9E9E3',
  text: '#1A1B1F',
  muted: '#62646C',
  accent: '#4350D9',
  onAccent: '#FFFFFF',
  accentSoft: '#EEEFFC',
  ok: '#17703F',
  okSoft: '#E0F2E8',
  okBar: '#1F9A5B',
  warn: '#8F5200',
  warnSoft: '#FAEED2',
  warnBar: '#C27A00',
  bad: '#B3261E',
  badSoft: '#FBE3E0',
  badBar: '#D93C31',
};

export const darkColors: Colors = {
  bg: '#0E0F12',
  card: '#17181D',
  fill: '#1F2026',
  line: '#26272E',
  text: '#EEEEF1',
  muted: '#A0A1AC',
  accent: '#9AA4FF',
  onAccent: '#0E0F12',
  accentSoft: '#25284D',
  ok: '#62D69D',
  okSoft: '#133121',
  okBar: '#4CC98A',
  warn: '#F2B552',
  warnSoft: '#352807',
  warnBar: '#F2B552',
  bad: '#FF8F80',
  badSoft: '#3A1713',
  badBar: '#FF7A6B',
};

export const colorsByScheme: Record<Scheme, Colors> = {
  light: lightColors,
  dark: darkColors,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  giant: 48,
} as const;

export const radius = {
  sm: 10,
  md: 12,
  lg: 14,
  xl: 18,
  pill: 999,
} as const;

// React Native has no fontWeight for custom fonts: one family name per weight.
export const fonts = {
  body: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  heading: 'SpaceGrotesk_600SemiBold',
  headingBold: 'SpaceGrotesk_700Bold',
} as const;

export const fontSize = {
  xs: 13,
  sm: 14,
  md: 15,
  lg: 17,
  h3: 18,
  h2: 30,
  h1: 44,
  num: 40,
} as const;

export const breakpoints = {
  // Width from which the side menu is shown instead of the bottom tab bar.
  wide: 900,
} as const;

// Minimum touch target (px).
export const minTouch = 44;

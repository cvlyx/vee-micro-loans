const PRIMARY = '#6B21A8';
const SECONDARY = '#9333EA';
const ACCENT = '#A855F7';

export const Colors = {
  primary: PRIMARY,
  secondary: SECONDARY,
  accent: ACCENT,
  light: '#E9D5FF',
  lavender: '#F3E8FF',
  dark: '#1A0533',
  background: '#F9F5FF',
  white: '#FFFFFF',
  text: '#1A0533',
  textSecondary: '#7C6B8A',
  textMuted: '#9B8AA8',
  border: '#E9D5FF',
  borderLight: '#F3E8FF',
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  card: '#FFFFFF',
  cardAlt: '#F9F5FF',
  overlay: 'rgba(107, 33, 168, 0.08)',
  gradientStart: '#6B21A8',
  gradientEnd: '#9333EA',
  gradientLight: '#C084FC',
  // Admin light theme - surfaces & text for light bg
  adminCardBg: '#FFFFFF',
  adminCardBorder: 'rgba(107, 33, 168, 0.15)',
  adminMutedBg: 'rgba(26, 5, 51, 0.04)',
  adminMutedBorder: 'rgba(26, 5, 51, 0.08)',
  adminPlaceholder: 'rgba(26, 5, 51, 0.4)',
  adminIconMuted: '#7C6B8A',
  // Dark mode
  darkBackground: '#0F0720',
  darkCard: '#1E0D3A',
  darkBorder: '#2D1554',
  darkText: '#F3E8FF',
  darkTextSecondary: '#9F7FC4',
};

export default {
  light: {
    text: Colors.text,
    background: Colors.background,
    tint: Colors.primary,
    tabIconDefault: Colors.textMuted,
    tabIconSelected: Colors.primary,
  },
  dark: {
    text: Colors.darkText,
    background: Colors.darkBackground,
    tint: Colors.accent,
    tabIconDefault: '#5A4070',
    tabIconSelected: Colors.accent,
  },
};

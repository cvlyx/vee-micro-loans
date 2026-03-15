// Vee Micro Loans - Sharp Yellow Theme
const PRIMARY = '#FFB800';      // Bright golden yellow
const SECONDARY = '#FFA000';    // Deep amber yellow
const ACCENT = '#FFC107';       // Material amber

export const Colors = {
  primary: PRIMARY,
  secondary: SECONDARY,
  accent: ACCENT,
  light: '#FFF8E1',            // Light yellow tint
  lavender: '#FFFDE7',          // Very light yellow
  dark: '#3D3200',              // Dark yellow/brown
  background: '#FFFEF5',        // Warm white background
  white: '#FFFFFF',
  text: '#3D3200',
  textSecondary: '#8A7A4A',
  textMuted: '#A89860',
  border: '#FFE082',
  borderLight: '#FFF8E1',
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#FF8F00',
  warningLight: '#FFF3E0',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  card: '#FFFFFF',
  cardAlt: '#FFFEF5',
  overlay: 'rgba(255, 184, 0, 0.08)',
  gradientStart: '#FFB800',
  gradientEnd: '#FFA000',
  gradientLight: '#FFD54F',
  // Admin light theme - surfaces & text for light bg
  adminCardBg: '#FFFFFF',
  adminCardBorder: 'rgba(255, 184, 0, 0.25)',
  adminMutedBg: 'rgba(61, 50, 0, 0.04)',
  adminMutedBorder: 'rgba(61, 50, 0, 0.08)',
  adminPlaceholder: 'rgba(61, 50, 0, 0.4)',
  adminIconMuted: '#8A7A4A',
  // Dark mode
  darkBackground: '#1A1500',
  darkCard: '#2D2600',
  darkBorder: '#3D3200',
  darkText: '#FFF8E1',
  darkTextSecondary: '#C4B060',
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

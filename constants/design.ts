/**
 * Professionelles Design-System für MediWallet
 * Enthält Farben, Spacing, Typografie und Design-Tokens
 */

export const DesignSystem = {
  // Farbpalette - Professionelle medizinische Farben
  colors: {
    primary: {
      main: '#2563EB', // Modernes Blau
      light: '#3B82F6',
      dark: '#1E40AF',
      contrast: '#FFFFFF',
    },
    secondary: {
      main: '#10B981', // Gesundes Grün
      light: '#34D399',
      dark: '#059669',
      contrast: '#FFFFFF',
    },
    accent: {
      main: '#8B5CF6', // Modernes Lila
      light: '#A78BFA',
      dark: '#7C3AED',
      contrast: '#FFFFFF',
    },
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    
    // Neutrale Farben
    neutral: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
    
    // Dark Mode Farben
    dark: {
      background: '#0F172A',
      surface: '#1E293B',
      surfaceElevated: '#334155',
      text: '#F1F5F9',
      textSecondary: '#CBD5E1',
      border: '#334155',
    },
    
    // Light Mode Farben
    light: {
      background: '#FFFFFF',
      surface: '#F8FAFC',
      surfaceElevated: '#FFFFFF',
      text: '#0F172A',
      textSecondary: '#475569',
      border: '#E2E8F0',
    },
  },
  
  // Spacing-System (8px Grid)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  
  // Border Radius
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  
  // Typografie
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      semibold: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
    fontWeight: {
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },
  
  // Schatten
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  
  // Animationen
  animation: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: {
      easeInOut: 'ease-in-out',
      easeOut: 'ease-out',
      easeIn: 'ease-in',
    },
  },
};

// Helper-Funktionen für Theme-abhängige Farben
export const getThemeColors = (isDark: boolean) => ({
  background: isDark ? DesignSystem.colors.dark.background : DesignSystem.colors.light.background,
  surface: isDark ? DesignSystem.colors.dark.surface : DesignSystem.colors.light.surface,
  surfaceElevated: isDark 
    ? DesignSystem.colors.dark.surfaceElevated 
    : DesignSystem.colors.light.surfaceElevated,
  text: isDark ? DesignSystem.colors.dark.text : DesignSystem.colors.light.text,
  textSecondary: isDark 
    ? DesignSystem.colors.dark.textSecondary 
    : DesignSystem.colors.light.textSecondary,
  border: isDark ? DesignSystem.colors.dark.border : DesignSystem.colors.light.border,
});


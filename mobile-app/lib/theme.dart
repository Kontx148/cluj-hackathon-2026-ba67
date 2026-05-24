import 'package:flutter/material.dart';

/// Warm-red civic palette mirroring the Figma design tokens
/// (see `Votera Civic App Design/src/styles/theme.css`).
class CivicPalette {
  // Primary
  static const Color primary = Color(0xFFD64545);
  static const Color primaryDark = Color(0xFFE05555);
  static const Color onPrimary = Color(0xFFFFFFFF);

  // Secondary / accent (soft peach)
  static const Color secondary = Color(0xFFFFE4DC);
  static const Color secondaryDark = Color(0xFF3A2025);

  // Surfaces
  static const Color background = Color(0xFFFFF8F4);
  static const Color card = Color(0xFFFFFFFF);
  static const Color muted = Color(0xFFF5EDE9);
  static const Color inputBg = Color(0xFFFFF0EB);

  // Dark mode
  static const Color darkBackground = Color(0xFF1A0F12);
  static const Color darkCard = Color(0xFF2A1A1E);
  static const Color darkSecondary = Color(0xFF3A2025);
  static const Color darkMuted = Color(0xFF2E1B1F);

  // Text
  static const Color ink = Color(0xFF1F1316);
  static const Color cream = Color(0xFFFFF8F4);
  static const Color mutedFg = Color(0xFF7A6B6E);
  static const Color mutedFgDark = Color(0xFFA08888);

  // Borders
  static const Color border = Color(0x191F1316); // ~rgba(31,19,22,0.1)
  static const Color borderDark = Color(0x1AFFF8F4); // rgba(255,248,244,0.1)

  // Status colors (Tailwind-derived) used for election pills and
  // "open for public input" badges.
  static const Color statusAmberBg = Color(0xFFFEF3C7); // amber-100
  static const Color statusAmberFg = Color(0xFF92400E); // amber-800
  static const Color statusEmeraldBg = Color(0xFFD1FAE5); // emerald-100
  static const Color statusEmeraldFg = Color(0xFF065F46); // emerald-800
  static const Color statusEmeraldStrong = Color(0xFF059669); // emerald-600
  static const Color statusSkyBg = Color(0xFFE0F2FE); // sky-100
  static const Color statusSkyFg = Color(0xFF075985); // sky-800
  static const Color statusGrayBg = Color(0xFFF3F4F6); // gray-100
  static const Color statusGrayFg = Color(0xFF6B7280); // gray-500

  // Warning / offline banner
  static const Color amberBannerBg = Color(0xFFFFFBEB); // amber-50
  static const Color amberBannerFg = Color(0xFFB45309); // amber-700
  static const Color amberBannerBorder = Color(0xFFFDE68A); // amber-200
}

ThemeData buildCivicTheme({required bool dark}) {
  if (dark) {
    final scheme = ColorScheme.fromSeed(
      seedColor: CivicPalette.primary,
      brightness: Brightness.dark,
    ).copyWith(
      primary: CivicPalette.primaryDark,
      onPrimary: CivicPalette.onPrimary,
      primaryContainer: CivicPalette.darkSecondary,
      onPrimaryContainer: CivicPalette.primaryDark,
      secondary: CivicPalette.darkSecondary,
      onSecondary: CivicPalette.cream,
      surface: CivicPalette.darkCard,
      onSurface: CivicPalette.cream,
      surfaceContainerHighest: CivicPalette.darkMuted,
      outline: CivicPalette.borderDark,
    );
    return _baseTheme(
      scheme: scheme,
      scaffold: CivicPalette.darkBackground,
      onSurface: CivicPalette.cream,
      muted: CivicPalette.mutedFgDark,
    );
  }

  final scheme = ColorScheme.fromSeed(
    seedColor: CivicPalette.primary,
    brightness: Brightness.light,
  ).copyWith(
    primary: CivicPalette.primary,
    onPrimary: CivicPalette.onPrimary,
    primaryContainer: CivicPalette.secondary,
    onPrimaryContainer: CivicPalette.primary,
    secondary: CivicPalette.secondary,
    onSecondary: CivicPalette.ink,
    surface: CivicPalette.card,
    onSurface: CivicPalette.ink,
    surfaceContainerHighest: CivicPalette.muted,
    outline: CivicPalette.border,
  );

  return _baseTheme(
    scheme: scheme,
    scaffold: CivicPalette.background,
    onSurface: CivicPalette.ink,
    muted: CivicPalette.mutedFg,
  );
}

ThemeData _baseTheme({
  required ColorScheme scheme,
  required Color scaffold,
  required Color onSurface,
  required Color muted,
}) {
  return ThemeData(
    useMaterial3: true,
    brightness: scheme.brightness,
    scaffoldBackgroundColor: scaffold,
    colorScheme: scheme,
    textTheme: _textTheme(onSurface, muted),
    cardTheme: CardThemeData(
      elevation: 0,
      color: scheme.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: scheme.outline),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: scheme.primary,
        foregroundColor: scheme.onPrimary,
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
        textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
        minimumSize: const Size(0, 48),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: scheme.primary,
        textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: scheme.primary,
        side: BorderSide(color: scheme.primary.withValues(alpha: 0.4)),
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
        minimumSize: const Size(0, 48),
      ),
    ),
    chipTheme: ChipThemeData(
      side: BorderSide(color: scheme.outline),
      backgroundColor: scheme.surfaceContainerHighest,
      selectedColor: scheme.primary,
      labelStyle: TextStyle(color: muted, fontWeight: FontWeight.w700, fontSize: 12),
      secondaryLabelStyle:
          TextStyle(color: scheme.onPrimary, fontWeight: FontWeight.w700, fontSize: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: scheme.surface,
      indicatorColor: Colors.transparent,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      labelTextStyle: WidgetStatePropertyAll(
        TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: onSurface),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: scheme.inverseSurface,
      contentTextStyle: TextStyle(color: scheme.onInverseSurface),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: scheme.surfaceContainerHighest,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: scheme.outline),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: scheme.outline),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: scheme.primary, width: 1.5),
      ),
    ),
    dividerTheme: DividerThemeData(
      color: scheme.outline,
      thickness: 1,
      space: 1,
    ),
  );
}

TextTheme _textTheme(Color onSurface, Color muted) {
  return TextTheme(
    displaySmall: TextStyle(
      fontSize: 30,
      fontWeight: FontWeight.w800,
      letterSpacing: -0.6,
      color: onSurface,
    ),
    headlineMedium: TextStyle(
      fontSize: 23,
      fontWeight: FontWeight.w800,
      letterSpacing: -0.4,
      color: onSurface,
      height: 1.15,
    ),
    headlineSmall: TextStyle(
      fontSize: 20,
      fontWeight: FontWeight.w800,
      letterSpacing: -0.3,
      color: onSurface,
    ),
    titleLarge: TextStyle(
      fontSize: 15,
      fontWeight: FontWeight.w700,
      color: onSurface,
      height: 1.3,
    ),
    titleMedium: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w700,
      color: onSurface,
    ),
    titleSmall: TextStyle(
      fontSize: 13,
      fontWeight: FontWeight.w700,
      color: onSurface,
    ),
    bodyLarge: TextStyle(fontSize: 14, color: onSurface, height: 1.45),
    bodyMedium: TextStyle(fontSize: 12, color: muted, height: 1.5),
    bodySmall: TextStyle(fontSize: 11, color: muted, height: 1.4),
    labelLarge: TextStyle(
      fontSize: 13,
      fontWeight: FontWeight.w700,
      color: onSurface,
    ),
    labelMedium: TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w600,
      color: muted,
    ),
    labelSmall: TextStyle(
      fontSize: 10,
      fontWeight: FontWeight.w800,
      letterSpacing: 1.4,
      color: muted,
    ),
  );
}

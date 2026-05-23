import 'package:flutter/material.dart';

/// Warm-red civic palette. Friendly, inviting, low cognitive load.
class CivicPalette {
  static const Color warmRed = Color(0xFFD64545);
  static const Color warmRedDeep = Color(0xFFB23535);
  static const Color warmRedSoft = Color(0xFFFFE4DC);

  static const Color cream = Color(0xFFFFF8F4);
  static const Color creamSurface = Color(0xFFFFFFFF);
  static const Color ink = Color(0xFF1F1316);
  static const Color muted = Color(0xFF7A6B6E);
  static const Color outline = Color(0xFFEFE2DD);

  static const Color darkBg = Color(0xFF1A0F12);
  static const Color darkSurface = Color(0xFF26181C);
  static const Color darkOutline = Color(0x33FFFFFF);

  static const Color success = Color(0xFF2F9E44);
  static const Color warn = Color(0xFFE0A800);
}

ThemeData buildCivicTheme({required bool dark}) {
  if (dark) {
    final scheme = ColorScheme.fromSeed(
      seedColor: CivicPalette.warmRed,
      brightness: Brightness.dark,
    ).copyWith(
      surface: CivicPalette.darkSurface,
      onSurface: const Color(0xFFFDF7F4),
      outline: CivicPalette.darkOutline,
    );
    return _baseTheme(
      scheme: scheme,
      scaffold: CivicPalette.darkBg,
      onSurface: const Color(0xFFFDF7F4),
      muted: const Color(0xFFC8B7BB),
    );
  }

  final scheme = ColorScheme.fromSeed(
    seedColor: CivicPalette.warmRed,
    brightness: Brightness.light,
  ).copyWith(
    primary: CivicPalette.warmRed,
    onPrimary: Colors.white,
    primaryContainer: CivicPalette.warmRedSoft,
    onPrimaryContainer: CivicPalette.warmRedDeep,
    surface: CivicPalette.creamSurface,
    onSurface: CivicPalette.ink,
    surfaceContainerHighest: CivicPalette.cream,
    outline: CivicPalette.outline,
  );

  return _baseTheme(
    scheme: scheme,
    scaffold: CivicPalette.cream,
    onSurface: CivicPalette.ink,
    muted: CivicPalette.muted,
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
        side: BorderSide(color: scheme.outline.withValues(alpha: 0.6)),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: scheme.primary,
        foregroundColor: scheme.onPrimary,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: scheme.primary,
        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: scheme.primary,
        side: BorderSide(color: scheme.primary.withValues(alpha: 0.4)),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    ),
    chipTheme: ChipThemeData(
      side: BorderSide(color: scheme.outline.withValues(alpha: 0.6)),
      backgroundColor: scheme.surface,
      selectedColor: scheme.primaryContainer,
      labelStyle: TextStyle(color: onSurface, fontWeight: FontWeight.w600),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: scheme.surface,
      indicatorColor: scheme.primaryContainer,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      labelTextStyle: WidgetStatePropertyAll(
        TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: onSurface,
        ),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: scheme.inverseSurface,
      contentTextStyle: TextStyle(color: scheme.onInverseSurface),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
      fontSize: 26,
      fontWeight: FontWeight.w700,
      letterSpacing: -0.4,
      color: onSurface,
    ),
    titleLarge: TextStyle(
      fontSize: 18,
      fontWeight: FontWeight.w700,
      color: onSurface,
    ),
    titleMedium: TextStyle(
      fontSize: 15,
      fontWeight: FontWeight.w600,
      color: onSurface,
    ),
    bodyLarge: TextStyle(fontSize: 15, color: onSurface, height: 1.4),
    bodyMedium: TextStyle(fontSize: 14, color: muted, height: 1.4),
    bodySmall: TextStyle(fontSize: 12.5, color: muted, height: 1.4),
    labelLarge: TextStyle(
      fontSize: 13,
      fontWeight: FontWeight.w700,
      color: onSurface,
    ),
    labelSmall: TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w600,
      letterSpacing: 1.2,
      color: muted,
    ),
  );
}

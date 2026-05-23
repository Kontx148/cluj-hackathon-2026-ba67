import 'package:flutter/material.dart';

ThemeData buildCivicTheme({required bool dark}) {
  if (dark) {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: const Color(0xFF0E1422),
      colorScheme: const ColorScheme.dark(
        primary: Color(0xFFE8EBF6),
        onPrimary: Color(0xFF1A2238),
        surface: Color(0xFF1A2238),
        onSurface: Color(0xFFF5F7FB),
        outline: Color(0x33FFFFFF),
      ),
      textTheme: _textTheme(const Color(0xFFF5F7FB), const Color(0xFF9AA6BE)),
    );
  }

  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    scaffoldBackgroundColor: const Color(0xFFF7F8FA),
    colorScheme: const ColorScheme.light(
      primary: Color(0xFF3B3F8C),
      onPrimary: Colors.white,
      surface: Colors.white,
      onSurface: Color(0xFF0F1729),
      outline: Color(0xFFE1E6EE),
    ),
    textTheme: _textTheme(const Color(0xFF0F1729), const Color(0xFF5A6B85)),
  );
}

TextTheme _textTheme(Color onSurface, Color muted) {
  return TextTheme(
    headlineMedium: TextStyle(
      fontSize: 32,
      fontWeight: FontWeight.w700,
      letterSpacing: -0.5,
      color: onSurface,
    ),
    titleMedium: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.w600,
      color: onSurface,
    ),
    bodyMedium: TextStyle(fontSize: 14, color: muted),
    labelSmall: TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w600,
      letterSpacing: 1.2,
      color: muted,
    ),
  );
}

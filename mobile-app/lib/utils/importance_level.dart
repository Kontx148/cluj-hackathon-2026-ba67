import 'package:flutter/material.dart';

import '../l10n/app_locale.dart';

/// Public-facing importance scale (1–5) shown on cards and filters.
abstract final class ImportanceLevel {
  static const min = 1;
  static const max = 5;

  static String label(int level, [AppLocale locale = AppLocale.en]) {
    final n = level.clamp(min, max);
    if (locale == AppLocale.ro) {
      return switch (n) {
        1 => 'Scăzută',
        2 => 'Moderată',
        3 => 'Semnificativă',
        4 => 'Ridicată',
        5 => 'Critică',
        _ => 'Necunoscută',
      };
    }
    return switch (n) {
      1 => 'Low',
      2 => 'Moderate',
      3 => 'Significant',
      4 => 'High',
      5 => 'Critical',
      _ => 'Unknown',
    };
  }

  static String publicLabel(int level, [AppLocale locale = AppLocale.en]) {
    final n = level.clamp(min, max);
    return '${label(n, locale)} ($n/$max)';
  }

  /// Citizen-facing color scale (calm → urgent).
  static Color color(int level) {
    return switch (level.clamp(min, max)) {
      1 => const Color(0xFF6B7280),
      2 => const Color(0xFF0891B2),
      3 => const Color(0xFFD97706),
      4 => const Color(0xFFEA580C),
      5 => const Color(0xFFDC2626),
      _ => const Color(0xFF6B7280),
    };
  }

  static Color surfaceColor(int level) {
    return color(level).withValues(alpha: 0.12);
  }
}

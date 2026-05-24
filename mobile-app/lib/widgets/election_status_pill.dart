import 'package:flutter/material.dart';

import '../l10n/app_strings.dart';
import '../l10n/locale_scope.dart';
import '../models/election.dart';
import '../theme.dart';

/// Rounded uppercase status pill, mirroring the Figma `StatusPill` component.
class ElectionStatusPill extends StatelessWidget {
  const ElectionStatusPill({super.key, required this.status});

  final ElectionStatus status;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final strings = context.strings;
    final (label, bg, fg) = _styleFor(status, strings, theme);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: fg,
          fontSize: 10,
          fontWeight: FontWeight.w800,
          letterSpacing: 1.0,
        ),
      ),
    );
  }

  static (String label, Color bg, Color fg) _styleFor(
    ElectionStatus status,
    AppStrings strings,
    ThemeData theme,
  ) {
    return switch (status) {
      ElectionStatus.open => (
        strings.statusOpen,
        theme.colorScheme.primary,
        theme.colorScheme.onPrimary,
      ),
      ElectionStatus.proposed => (
        strings.statusProposed,
        CivicPalette.statusAmberBg,
        CivicPalette.statusAmberFg,
      ),
      ElectionStatus.approved => (
        strings.statusApproved,
        CivicPalette.statusEmeraldBg,
        CivicPalette.statusEmeraldFg,
      ),
      ElectionStatus.frozen => (
        strings.statusFrozen,
        CivicPalette.statusSkyBg,
        CivicPalette.statusSkyFg,
      ),
      ElectionStatus.tallying => (
        strings.statusTallying,
        CivicPalette.statusAmberBg,
        CivicPalette.statusAmberFg,
      ),
      ElectionStatus.decrypted => (
        strings.statusDecrypted,
        CivicPalette.statusEmeraldBg,
        CivicPalette.statusEmeraldFg,
      ),
      ElectionStatus.finished => (
        strings.statusFinished,
        CivicPalette.statusGrayBg,
        CivicPalette.statusGrayFg,
      ),
      ElectionStatus.unknown => (
        status.name.toUpperCase(),
        CivicPalette.statusGrayBg,
        CivicPalette.statusGrayFg,
      ),
    };
  }
}

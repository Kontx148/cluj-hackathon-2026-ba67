import 'package:flutter/material.dart';

import '../l10n/app_strings.dart';
import '../l10n/locale_scope.dart';
import '../models/election.dart';
import '../theme.dart';

/// Status pill — solid fill + contrasting text (matches Figma `StatusPill`).
class ElectionStatusPill extends StatelessWidget {
  const ElectionStatusPill({super.key, required this.status});

  final ElectionStatus status;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final (label, bg, fg) = _styleFor(status, strings);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
        boxShadow: [
          BoxShadow(
            color: bg.withValues(alpha: 0.35),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Text(
        label,
        style: TextStyle(
          color: fg,
          fontSize: 11,
          fontWeight: FontWeight.w800,
          letterSpacing: 1.0,
        ),
      ),
    );
  }

  static (String label, Color bg, Color fg) _styleFor(
    ElectionStatus status,
    AppStrings strings,
  ) {
    return switch (status) {
      ElectionStatus.open => (
        strings.statusOpen,
        CivicPalette.primary,
        CivicPalette.onPrimary,
      ),
      ElectionStatus.proposed => (
        strings.statusProposed,
        CivicPalette.statusProposedSolid,
        CivicPalette.onPrimary,
      ),
      ElectionStatus.approved => (
        strings.statusApproved,
        CivicPalette.statusApprovedSolid,
        CivicPalette.onPrimary,
      ),
      ElectionStatus.frozen => (
        strings.statusFrozen,
        CivicPalette.statusFrozenSolid,
        CivicPalette.onPrimary,
      ),
      ElectionStatus.tallying => (
        strings.statusTallying,
        CivicPalette.statusTallyingSolid,
        CivicPalette.onPrimary,
      ),
      ElectionStatus.decrypted => (
        strings.statusDecrypted,
        CivicPalette.statusDecryptedSolid,
        CivicPalette.onPrimary,
      ),
      ElectionStatus.finished => (
        strings.statusFinished,
        CivicPalette.statusFinishedSolid,
        CivicPalette.onPrimary,
      ),
      ElectionStatus.unknown => (
        status.name.toUpperCase(),
        CivicPalette.statusFinishedSolid,
        CivicPalette.onPrimary,
      ),
    };
  }
}

/// Small tag shown beside DESCHIS when this device already cast a vote.
class VotedTag extends StatelessWidget {
  const VotedTag({super.key});

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: CivicPalette.statusApprovedSolid,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        strings.alreadyVotedTag,
        style: const TextStyle(
          color: CivicPalette.onPrimary,
          fontSize: 11,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.6,
        ),
      ),
    );
  }
}

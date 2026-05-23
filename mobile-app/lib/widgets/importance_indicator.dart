import 'package:flutter/material.dart';

import '../l10n/app_strings.dart';
import '../utils/importance_level.dart';

/// Importance shown clearly to the public (label + colored dots).
class ImportanceIndicator extends StatelessWidget {
  const ImportanceIndicator({
    super.key,
    required this.level,
    this.compact = false,
    this.showLabel = true,
  });

  final int level;
  final bool compact;
  final bool showLabel;

  @override
  Widget build(BuildContext context) {
    final n = level.clamp(ImportanceLevel.min, ImportanceLevel.max);
    final accent = ImportanceLevel.color(n);

    if (compact) {
      return Semantics(
        label: '${AppStrings.importance}: ${ImportanceLevel.publicLabel(n)}',
        child: _ColoredDots(level: n, accent: accent),
      );
    }

    return Semantics(
      label: '${AppStrings.importance}: ${ImportanceLevel.publicLabel(n)}',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            AppStrings.importance,
            style: Theme.of(context).textTheme.labelSmall,
          ),
          if (showLabel) ...[
            const SizedBox(height: 2),
            Text(
              ImportanceLevel.publicLabel(n),
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: accent,
                  ),
            ),
          ],
          const SizedBox(height: 4),
          _ColoredDots(level: n, accent: accent),
        ],
      ),
    );
  }
}

class ImportanceBadge extends StatelessWidget {
  const ImportanceBadge({super.key, required this.level});

  final int level;

  @override
  Widget build(BuildContext context) {
    final n = level.clamp(ImportanceLevel.min, ImportanceLevel.max);
    final accent = ImportanceLevel.color(n);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: ImportanceLevel.surfaceColor(n),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: accent.withValues(alpha: 0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            ImportanceLevel.label(n),
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: accent,
                ),
          ),
          const SizedBox(height: 4),
          _ColoredDots(level: n, accent: accent),
        ],
      ),
    );
  }
}

class _ColoredDots extends StatelessWidget {
  const _ColoredDots({required this.level, required this.accent});

  final int level;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(ImportanceLevel.max, (index) {
        final filled = index < level;
        return Padding(
          padding: const EdgeInsets.only(left: 2),
          child: Icon(
            Icons.circle,
            size: 8,
            color: filled
                ? accent
                : Theme.of(context).colorScheme.outline.withValues(alpha: 0.5),
          ),
        );
      }),
    );
  }
}

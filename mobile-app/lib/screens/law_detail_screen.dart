import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:url_launcher/url_launcher.dart';

import '../l10n/locale_scope.dart';
import '../models/feed_item.dart';
import '../theme.dart';
import '../utils/feed_item_localization.dart';

class LawDetailScreen extends StatelessWidget {
  const LawDetailScreen({super.key, required this.item});

  final FeedItem item;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final locale = context.appLocale;
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: Text(strings.lawDetailTitle),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: theme.colorScheme.outline),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        item.source,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    _ImportanceDots(value: item.importance),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  item.localizedTitle(locale),
                  style: theme.textTheme.titleLarge?.copyWith(fontSize: 18),
                ),
                if (item.actionPossible) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: CivicPalette.statusEmeraldBg,
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: const Color(0xFFA7F3D0)),
                    ),
                    child: Text(
                      strings.civicAction,
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: CivicPalette.statusEmeraldFg,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),
          Text(
            strings.lawSummaryHeading,
            style: theme.textTheme.titleLarge?.copyWith(fontSize: 14),
          ),
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: theme.colorScheme.outline),
            ),
            child: Text(
              item.localizedPlainSummary(locale) ?? strings.lawSummaryPending,
              style: theme.textTheme.bodyMedium?.copyWith(
                height: 1.5,
                fontStyle: item.hasPlainSummary ? null : FontStyle.italic,
                color: item.hasPlainSummary
                    ? null
                    : theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          if (item.tags.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text(
              strings.filterTopics,
              style: theme.textTheme.titleLarge?.copyWith(fontSize: 14),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: item.tags
                  .map(
                    (tag) => Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: CivicPalette.muted,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        tag.startsWith('#') ? tag.substring(1) : tag,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: theme.textTheme.bodyMedium?.color,
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ],
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: () => launchUrl(
                Uri.parse(item.link),
                mode: LaunchMode.externalApplication,
              ),
              icon: const HugeIcon(
                icon: HugeIcons.strokeRoundedLinkSquare01,
                color: CivicPalette.onPrimary,
                size: 16,
              ),
              label: Text(strings.lawOfficialSource),
            ),
          ),
        ],
      ),
    );
  }
}

class _ImportanceDots extends StatelessWidget {
  const _ImportanceDots({required this.value});

  final int value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final clamped = value.clamp(1, 5);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (i) {
        final filled = i < clamped;
        return Padding(
          padding: const EdgeInsets.only(left: 3),
          child: Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: filled
                  ? theme.colorScheme.primary
                  : theme.colorScheme.outline,
              shape: BoxShape.circle,
            ),
          ),
        );
      }),
    );
  }
}

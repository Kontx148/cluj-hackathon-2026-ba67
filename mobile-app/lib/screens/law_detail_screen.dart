import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../l10n/locale_scope.dart';
import '../models/feed_item.dart';
import '../utils/feed_item_localization.dart';
import '../widgets/importance_indicator.dart';

class LawDetailScreen extends StatelessWidget {
  const LawDetailScreen({super.key, required this.item});

  final FeedItem item;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final locale = context.appLocale;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(strings.lawDetailTitle),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  item.source,
                  style: theme.textTheme.labelSmall,
                ),
              ),
              ImportanceBadge(level: item.importance),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            item.localizedTitle(locale),
            style: theme.textTheme.headlineSmall,
          ),
          if (item.actionPossible) ...[
            const SizedBox(height: 12),
            _InfoBanner(
              icon: Icons.campaign_outlined,
              text: strings.civicAction,
              color: const Color(0xFF059669),
            ),
          ],
          const SizedBox(height: 20),
          Text(
            strings.lawSummaryHeading,
            style: theme.textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(
            item.localizedPlainSummary(locale) ?? strings.lawSummaryPending,
            style: theme.textTheme.bodyLarge?.copyWith(
              height: 1.45,
              fontStyle: item.hasPlainSummary ? null : FontStyle.italic,
              color: item.hasPlainSummary
                  ? null
                  : theme.colorScheme.onSurfaceVariant,
            ),
          ),
          if (item.tags.isNotEmpty) ...[
            const SizedBox(height: 20),
            Text(
              strings.filterTopics,
              style: theme.textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: item.tags
                  .map(
                    (tag) => Chip(
                      label: Text(
                        tag.startsWith('#') ? tag.substring(1) : tag,
                      ),
                    ),
                  )
                  .toList(),
            ),
          ],
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: () => launchUrl(Uri.parse(item.link)),
            icon: const Icon(Icons.open_in_new),
            label: Text(strings.lawOfficialSource),
          ),
        ],
      ),
    );
  }
}

class _InfoBanner extends StatelessWidget {
  const _InfoBanner({
    required this.icon,
    required this.text,
    required this.color,
  });

  final IconData icon;
  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: color,
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

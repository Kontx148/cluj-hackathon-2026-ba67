import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:url_launcher/url_launcher.dart';

import '../constants/feed_tags.dart';
import '../l10n/app_locale.dart';
import '../l10n/app_strings.dart';
import '../l10n/locale_scope.dart';
import '../models/feed_item.dart';
import '../services/feed_service.dart';
import '../theme.dart';
import '../utils/feed_filter.dart';
import '../utils/feed_item_localization.dart';
import '../utils/feed_section.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  final _feedService = FeedService();
  late Future<List<FeedItem>> _feedFuture;

  FeedSection? _sectionFilter;
  FeedLevel? _levelFilter;
  int? _importanceFilter;
  String? _topicFilter;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  Future<void> _reload() async {
    setState(() {
      _feedFuture = _feedService.fetchFeed();
    });
    await _feedFuture;
  }

  void _clearFilters() {
    setState(() {
      _sectionFilter = null;
      _levelFilter = null;
      _importanceFilter = null;
      _topicFilter = null;
    });
  }

  FeedFilters _filters(AppLocale locale) => FeedFilters(
        section: _sectionFilter,
        language: locale,
        level: _levelFilter,
        tag: _topicFilter,
        importance: _importanceFilter,
      );

  int get _activeFilterCount =>
      [_sectionFilter, _levelFilter, _importanceFilter, _topicFilter]
          .where((e) => e != null)
          .length;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final strings = context.strings;
    final locale = context.appLocale;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: FutureBuilder<List<FeedItem>>(
          future: _feedFuture,
          builder: (context, snapshot) {
            final loading = snapshot.connectionState == ConnectionState.waiting;
            final hasError = snapshot.hasError;
            final all = snapshot.data ?? const <FeedItem>[];
            final filtered = _filters(locale).apply(all);

            return RefreshIndicator(
              onRefresh: _reload,
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  SliverToBoxAdapter(
                    child: _Header(strings: strings, locale: locale),
                  ),
                  SliverToBoxAdapter(
                    child: _FilterRow(
                      strings: strings,
                      section: _sectionFilter,
                      level: _levelFilter,
                      importance: _importanceFilter,
                      topic: _topicFilter,
                      onSection: (s) => setState(
                        () => _sectionFilter = _sectionFilter == s ? null : s,
                      ),
                      onLevel: (l) => setState(
                        () => _levelFilter = _levelFilter == l ? null : l,
                      ),
                      onImportance: (i) => setState(
                        () => _importanceFilter =
                            _importanceFilter == i ? null : i,
                      ),
                      onTopic: (t) => setState(
                        () => _topicFilter = _topicFilter == t ? null : t,
                      ),
                    ),
                  ),
                  if (_activeFilterCount > 0)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 6, 16, 0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              strings.resultsCount(filtered.length),
                              style: theme.textTheme.bodyMedium,
                            ),
                            TextButton(
                              onPressed: _clearFilters,
                              child: Text(strings.clearFilters),
                            ),
                          ],
                        ),
                      ),
                    ),
                  if (loading)
                    const SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(child: CircularProgressIndicator()),
                    )
                  else if (hasError)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              HugeIcon(
                                icon: HugeIcons.strokeRoundedAlert02,
                                color: theme.colorScheme.error,
                                size: 32,
                              ),
                              const SizedBox(height: 12),
                              Text(strings.loadError,
                                  style: theme.textTheme.titleMedium),
                              const SizedBox(height: 6),
                              Text(
                                strings.loadErrorHint,
                                textAlign: TextAlign.center,
                                style: theme.textTheme.bodyMedium,
                              ),
                              const SizedBox(height: 12),
                              FilledButton(
                                onPressed: _reload,
                                child: Text(strings.retry),
                              ),
                            ],
                          ),
                        ),
                      ),
                    )
                  else if (filtered.isEmpty)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: _EmptyState(
                        strings: strings,
                        onReset: _clearFilters,
                      ),
                    )
                  else
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, i) {
                            final item = filtered[i];
                            return Padding(
                              padding: EdgeInsets.only(
                                bottom: i == filtered.length - 1 ? 0 : 12,
                              ),
                              child: _CivicCard(item: item, locale: locale),
                            );
                          },
                          childCount: filtered.length,
                        ),
                      ),
                    ),
                  SliverToBoxAdapter(
                    child: _Footer(strings: strings),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

// ─── Header ─────────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  const _Header({required this.strings, required this.locale});

  final AppStrings strings;
  final AppLocale locale;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  strings.eyebrow,
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: theme.colorScheme.primary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  strings.civicFeedTitle,
                  style: theme.textTheme.headlineMedium,
                ),
                const SizedBox(height: 4),
                Text(
                  strings.tagline,
                  style: theme.textTheme.bodyMedium,
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          _LangSwitch(locale: locale),
        ],
      ),
    );
  }
}

class _LangSwitch extends StatelessWidget {
  const _LangSwitch({required this.locale});

  final AppLocale locale;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scope = LocaleScope.of(context);
    final next = locale == AppLocale.en ? AppLocale.ro : AppLocale.en;
    return InkWell(
      onTap: () => scope.onLocaleChanged(next),
      borderRadius: BorderRadius.circular(999),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          next.label.toUpperCase().substring(0, 2),
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.0,
          ),
        ),
      ),
    );
  }
}

// ─── Filter row ─────────────────────────────────────────────────────────────

class _FilterRow extends StatelessWidget {
  const _FilterRow({
    required this.strings,
    required this.section,
    required this.level,
    required this.importance,
    required this.topic,
    required this.onSection,
    required this.onLevel,
    required this.onImportance,
    required this.onTopic,
  });

  final AppStrings strings;
  final FeedSection? section;
  final FeedLevel? level;
  final int? importance;
  final String? topic;
  final ValueChanged<FeedSection> onSection;
  final ValueChanged<FeedLevel> onLevel;
  final ValueChanged<int> onImportance;
  final ValueChanged<String> onTopic;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 12, bottom: 4),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          children: [
            _Chip(
              label: strings.sectionLaws,
              selected: section == FeedSection.laws,
              onTap: () => onSection(FeedSection.laws),
            ),
            const SizedBox(width: 8),
            _Chip(
              label: strings.sectionNews,
              selected: section == FeedSection.news,
              onTap: () => onSection(FeedSection.news),
            ),
            _Divider(),
            _Chip(
              label: strings.levelEu,
              selected: level == FeedLevel.eu,
              onTap: () => onLevel(FeedLevel.eu),
            ),
            const SizedBox(width: 8),
            _Chip(
              label: strings.levelRomania,
              selected: level == FeedLevel.romania,
              onTap: () => onLevel(FeedLevel.romania),
            ),
            const SizedBox(width: 8),
            _Chip(
              label: strings.levelLocal,
              selected: level == FeedLevel.local,
              onTap: () => onLevel(FeedLevel.local),
            ),
            _Divider(),
            for (var i = 1; i <= 5; i++) ...[
              _ImportanceChip(
                value: i,
                selected: importance == i,
                onTap: () => onImportance(i),
              ),
              const SizedBox(width: 6),
            ],
            _Divider(),
            for (var i = 0; i < 6 && i < FeedTags.topics.length; i++) ...[
              _Chip(
                label: _stripHash(FeedTags.topics[i]),
                selected: topic == FeedTags.topics[i],
                onTap: () => onTopic(FeedTags.topics[i]),
              ),
              const SizedBox(width: 8),
            ],
            const SizedBox(width: 8),
          ],
        ),
      ),
    );
  }

  static String _stripHash(String t) {
    return t.startsWith('#')
        ? t.substring(1).replaceAll('-', ' ')
        : t;
  }
}

class _Chip extends StatelessWidget {
  const _Chip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Material(
      color: selected
          ? theme.colorScheme.primary
          : theme.colorScheme.surfaceContainerHighest,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: selected
                  ? theme.colorScheme.onPrimary
                  : theme.textTheme.bodyMedium?.color,
            ),
          ),
        ),
      ),
    );
  }
}

class _ImportanceChip extends StatelessWidget {
  const _ImportanceChip({
    required this.value,
    required this.selected,
    required this.onTap,
  });

  final int value;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Material(
      color: selected
          ? theme.colorScheme.primary
          : theme.colorScheme.surfaceContainerHighest,
      shape: const CircleBorder(),
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: SizedBox(
          width: 30,
          height: 30,
          child: Center(
            child: Text(
              '$value',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: selected
                    ? theme.colorScheme.onPrimary
                    : theme.textTheme.bodyMedium?.color,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Divider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: 1,
      height: 22,
      margin: const EdgeInsets.symmetric(horizontal: 8),
      color: theme.colorScheme.outline,
    );
  }
}

// ─── Card ──────────────────────────────────────────────────────────────────

class _CivicCard extends StatelessWidget {
  const _CivicCard({required this.item, required this.locale});

  final FeedItem item;
  final AppLocale locale;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final strings = context.strings;
    return Container(
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
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              _LevelGlyph(level: item.level),
              const SizedBox(width: 8),
              _ImportanceDots(value: item.importance),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            item.localizedTitle(locale),
            style: theme.textTheme.titleLarge?.copyWith(fontSize: 14),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 6),
          Text(
            item.localizedSummary(locale),
            style: theme.textTheme.bodyMedium,
            maxLines: 4,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              if (item.actionPossible)
                Tooltip(
                  message: strings.civicActionHint,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: CivicPalette.statusEmeraldBg,
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(
                        color: const Color(0xFFA7F3D0),
                      ),
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
                ),
              for (final t in item.tags.take(3))
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    t.startsWith('#') ? t.substring(1) : t,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: theme.textTheme.bodyMedium?.color,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Align(
            alignment: Alignment.centerRight,
            child: InkWell(
              borderRadius: BorderRadius.circular(8),
              onTap: () => launchUrl(
                Uri.parse(item.link),
                mode: LaunchMode.externalApplication,
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 6,
                  vertical: 4,
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    HugeIcon(
                      icon: HugeIcons.strokeRoundedLinkSquare01,
                      color: theme.colorScheme.primary,
                      size: 11,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      strings.open,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: theme.colorScheme.primary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LevelGlyph extends StatelessWidget {
  const _LevelGlyph({required this.level});

  final FeedLevel level;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = theme.textTheme.bodyMedium?.color ?? theme.colorScheme.onSurface;
    final icon = switch (level) {
      FeedLevel.eu => HugeIcons.strokeRoundedGlobal,
      FeedLevel.local => HugeIcons.strokeRoundedLocation01,
      FeedLevel.romania => null,
    };
    if (icon == null) return const SizedBox.shrink();
    return HugeIcon(icon: icon, color: color, size: 11);
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

// ─── Empty + footer ─────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.strings, required this.onReset});

  final AppStrings strings;
  final VoidCallback onReset;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: HugeIcon(
                  icon: HugeIcons.strokeRoundedNews01,
                  color: theme.textTheme.bodyMedium?.color ??
                      theme.colorScheme.onSurface,
                  size: 26,
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(strings.emptyFeedTitle,
                style: theme.textTheme.titleLarge?.copyWith(fontSize: 16)),
            const SizedBox(height: 4),
            Text(strings.emptyFeedSubtitle,
                style: theme.textTheme.bodyMedium),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: onReset,
              child: Text(strings.resetFilters),
            ),
          ],
        ),
      ),
    );
  }
}

class _Footer extends StatelessWidget {
  const _Footer({required this.strings});

  final AppStrings strings;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 28, 16, 16),
      child: Column(
        children: [
          Container(
            height: 1,
            color: theme.colorScheme.outline,
          ),
          const SizedBox(height: 14),
          Text(
            strings.footer,
            textAlign: TextAlign.center,
            style: theme.textTheme.bodySmall,
          ),
          const SizedBox(height: 4),
          Text(
            strings.footerSlogan,
            textAlign: TextAlign.center,
            style: theme.textTheme.bodySmall?.copyWith(
              fontSize: 10,
              color: theme.textTheme.bodyMedium?.color?.withValues(alpha: 0.6),
            ),
          ),
        ],
      ),
    );
  }
}

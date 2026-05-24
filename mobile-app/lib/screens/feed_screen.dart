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
                    child: _FeedFilterBar(
                      strings: strings,
                      section: _sectionFilter,
                      level: _levelFilter,
                      importance: _importanceFilter,
                      topic: _topicFilter,
                      activeCount: _activeFilterCount,
                      onApply: (values) {
                        setState(() {
                          _sectionFilter = values.section;
                          _levelFilter = values.level;
                          _importanceFilter = values.importance;
                          _topicFilter = values.topic;
                        });
                      },
                      onReset: _clearFilters,
                    ),
                  ),
                  if (_activeFilterCount > 0)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
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
    final scope = LocaleScope.of(context);
    final next = locale == AppLocale.en ? AppLocale.ro : AppLocale.en;
    return InkWell(
      onTap: () => scope.onLocaleChanged(next),
      borderRadius: BorderRadius.circular(999),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: CivicPalette.muted,
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

typedef _FeedFilterValues = ({
  FeedSection? section,
  FeedLevel? level,
  int? importance,
  String? topic,
});

/// Dropdown-style filter control — opens a sheet with per-field dropdowns + reset.
class _FeedFilterBar extends StatelessWidget {
  const _FeedFilterBar({
    required this.strings,
    required this.section,
    required this.level,
    required this.importance,
    required this.topic,
    required this.activeCount,
    required this.onApply,
    required this.onReset,
  });

  final AppStrings strings;
  final FeedSection? section;
  final FeedLevel? level;
  final int? importance;
  final String? topic;
  final int activeCount;
  final void Function(_FeedFilterValues values) onApply;
  final VoidCallback onReset;

  String _summary() {
    if (activeCount == 0) return strings.feedFiltersSummaryAll;
    final parts = <String>[];
    if (section != null) {
      parts.add(
        section == FeedSection.laws ? strings.sectionLaws : strings.sectionNews,
      );
    }
    if (level != null) {
      parts.add(switch (level!) {
        FeedLevel.eu => strings.levelEu,
        FeedLevel.romania => strings.levelRomania,
        FeedLevel.local => strings.levelLocal,
      });
    }
    if (importance != null) parts.add('≥$importance');
    if (topic != null) parts.add(_stripHash(topic!));
    return parts.join(' · ');
  }

  Future<void> _openSheet(BuildContext context) async {
    var draftSection = section;
    var draftLevel = level;
    var draftImportance = importance;
    var draftTopic = topic;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            void setDraft(VoidCallback fn) => setSheetState(fn);

            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 12,
                bottom: MediaQuery.paddingOf(context).bottom + 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: CivicPalette.border,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    strings.feedFiltersSheetTitle,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 16),
                  _FilterDropdown<FeedSection?>(
                    label: strings.filterSection,
                    hint: strings.filterSectionHint,
                    value: draftSection,
                    items: [
                      _FilterMenuItem(null, strings.feedFilterAll),
                      _FilterMenuItem(
                        FeedSection.laws,
                        strings.sectionLaws,
                      ),
                      _FilterMenuItem(
                        FeedSection.news,
                        strings.sectionNews,
                      ),
                    ],
                    onChanged: (v) =>
                        setDraft(() => draftSection = v),
                  ),
                  const SizedBox(height: 12),
                  _FilterDropdown<FeedLevel?>(
                    label: strings.filterLevel,
                    hint: strings.filterLevelHint,
                    value: draftLevel,
                    items: [
                      _FilterMenuItem(null, strings.feedFilterAll),
                      _FilterMenuItem(FeedLevel.eu, strings.levelEu),
                      _FilterMenuItem(
                        FeedLevel.romania,
                        strings.levelRomania,
                      ),
                      _FilterMenuItem(FeedLevel.local, strings.levelLocal),
                    ],
                    onChanged: (v) => setDraft(() => draftLevel = v),
                  ),
                  const SizedBox(height: 12),
                  _FilterDropdown<int?>(
                    label: strings.filterImportance,
                    hint: strings.filterImportanceHint,
                    value: draftImportance,
                    items: [
                      _FilterMenuItem(null, strings.allImportance),
                      for (var i = 1; i <= 5; i++)
                        _FilterMenuItem(i, '≥ $i'),
                    ],
                    onChanged: (v) => setDraft(() => draftImportance = v),
                  ),
                  const SizedBox(height: 12),
                  _FilterDropdown<String?>(
                    label: strings.filterTopics,
                    hint: strings.filterTopicsHint,
                    value: draftTopic,
                    items: [
                      _FilterMenuItem(null, strings.allTags),
                      for (final t in FeedTags.topics)
                        _FilterMenuItem(t, _stripHash(t)),
                    ],
                    onChanged: (v) => setDraft(() => draftTopic = v),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            setSheetState(() {
                              draftSection = null;
                              draftLevel = null;
                              draftImportance = null;
                              draftTopic = null;
                            });
                            onReset();
                            Navigator.pop(ctx);
                          },
                          child: Text(strings.resetFilters),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 2,
                        child: FilledButton(
                          onPressed: () {
                            onApply((
                              section: draftSection,
                              level: draftLevel,
                              importance: draftImportance,
                              topic: draftTopic,
                            ));
                            Navigator.pop(ctx);
                          },
                          child: Text(strings.applyFilters),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final hasFilters = activeCount > 0;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: Row(
        children: [
          Expanded(
            child: Material(
              color: CivicPalette.muted,
              borderRadius: BorderRadius.circular(14),
              child: InkWell(
                onTap: () => _openSheet(context),
                borderRadius: BorderRadius.circular(14),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 12,
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.tune_rounded,
                        size: 20,
                        color: hasFilters
                            ? CivicPalette.primary
                            : CivicPalette.mutedFg,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              strings.feedFiltersButton,
                              style: theme.textTheme.labelMedium?.copyWith(
                                color: CivicPalette.mutedFg,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              _summary(),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: theme.textTheme.titleSmall?.copyWith(
                                color: hasFilters
                                    ? CivicPalette.primary
                                    : CivicPalette.ink,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Icon(
                        Icons.keyboard_arrow_down_rounded,
                        color: CivicPalette.mutedFg,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          if (hasFilters) ...[
            const SizedBox(width: 8),
            IconButton(
              tooltip: strings.clearFilters,
              onPressed: onReset,
              style: IconButton.styleFrom(
                backgroundColor: CivicPalette.muted,
                foregroundColor: CivicPalette.primary,
              ),
              icon: const Icon(Icons.close_rounded, size: 20),
            ),
          ],
        ],
      ),
    );
  }

  static String _stripHash(String t) {
    return t.startsWith('#') ? t.substring(1).replaceAll('-', ' ') : t;
  }
}

class _FilterMenuItem<T> {
  const _FilterMenuItem(this.value, this.label);
  final T value;
  final String label;
}

class _FilterDropdown<T> extends StatelessWidget {
  const _FilterDropdown({
    required this.label,
    required this.hint,
    required this.value,
    required this.items,
    required this.onChanged,
  });

  final String label;
  final String hint;
  final T value;
  final List<_FilterMenuItem<T>> items;
  final ValueChanged<T> onChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: theme.textTheme.labelLarge),
        const SizedBox(height: 4),
        InputDecorator(
          decoration: InputDecoration(
            hintText: hint,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 14,
              vertical: 4,
            ),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<T>(
              value: value,
              isExpanded: true,
              items: items
                  .map(
                    (e) => DropdownMenuItem<T>(
                      value: e.value,
                      child: Text(e.label),
                    ),
                  )
                  .toList(),
              onChanged: (v) => onChanged(v as T),
            ),
          ),
        ),
      ],
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
                    color: CivicPalette.muted,
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
              decoration: const BoxDecoration(
                color: CivicPalette.muted,
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

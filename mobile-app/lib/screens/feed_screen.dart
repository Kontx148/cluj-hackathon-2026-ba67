import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:url_launcher/url_launcher.dart';

import '../constants/feed_tags.dart';
import '../l10n/app_locale.dart';
import '../l10n/app_strings.dart';
import '../l10n/locale_scope.dart';
import '../models/feed_item.dart';
import '../services/feed_service.dart';
import '../utils/feed_item_localization.dart';
import '../utils/feed_filter.dart';
import '../utils/feed_section.dart';
import '../utils/importance_level.dart';
import '../widgets/importance_indicator.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  final _feedService = FeedService();
  late Future<List<FeedItem>> _feedFuture;

  FeedLevel? _levelFilter = FeedLevel.romania;
  String? _tagFilter;
  int? _importanceFilter;
  FeedSection _section = FeedSection.laws;
  bool _showFilters = false;

  FeedFilters _filters(AppLocale locale) => FeedFilters(
        section: _section,
        language: locale,
        level: _levelFilter,
        tag: _tagFilter,
        importance: _importanceFilter,
      );

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

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final locale = context.appLocale;

    return Scaffold(
      body: SafeArea(
        child: FutureBuilder<List<FeedItem>>(
          future: _feedFuture,
          builder: (context, snapshot) {
            return RefreshIndicator(
              onRefresh: _reload,
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  SliverToBoxAdapter(
                    child: _buildHeader(context, strings, locale),
                  ),
                  ..._buildFeedSlivers(context, snapshot, strings, locale),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.only(top: 24, bottom: 32),
                      child: Text(
                        strings.footer,
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.labelSmall,
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  List<Widget> _buildFeedSlivers(
    BuildContext context,
    AsyncSnapshot<List<FeedItem>> snapshot,
    AppStrings strings,
    AppLocale locale,
  ) {
    final theme = Theme.of(context);
    if (snapshot.connectionState == ConnectionState.waiting) {
      return const [
        SliverFillRemaining(
          hasScrollBody: false,
          child: Center(child: CircularProgressIndicator()),
        ),
      ];
    }
    if (snapshot.hasError) {
      return [
        SliverFillRemaining(
          hasScrollBody: false,
          child: Center(
            child: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    HugeIcon(
                      icon: HugeIcons.strokeRoundedAlert02,
                      color: theme.colorScheme.error,
                      size: 36,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      strings.loadError,
                      style: theme.textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${snapshot.error}\n\n${strings.loadErrorHint}',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: _reload,
                      child: Text(strings.retry),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ];
    }

    final allItems = snapshot.data ?? [];
    final items = _filters(locale).apply(allItems);

    if (items.isEmpty) {
      return [
        SliverFillRemaining(
          hasScrollBody: false,
          child: Center(
            child: Text(
              strings.noResults,
              style: theme.textTheme.bodyMedium,
            ),
          ),
        ),
      ];
    }

    return [
      SliverList.separated(
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) =>
            _FeedCard(item: items[index], locale: locale),
      ),
    ];
  }

  Widget _buildHeader(
    BuildContext context,
    AppStrings strings,
    AppLocale locale,
  ) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: theme.colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: HugeIcon(
                  icon: HugeIcons.strokeRoundedAiBrain02,
                  color: theme.colorScheme.primary,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(strings.eyebrow, style: theme.textTheme.labelSmall),
                    const SizedBox(height: 2),
                    Text(strings.appName,
                        style: theme.textTheme.headlineMedium),
                  ],
                ),
              ),
              IconButton(
                tooltip: strings.refresh,
                onPressed: _reload,
                icon: HugeIcon(
                  icon: HugeIcons.strokeRoundedRefresh,
                  color: theme.colorScheme.onSurface,
                  size: 20,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(strings.tagline, style: theme.textTheme.bodyMedium),
          const SizedBox(height: 16),
          SegmentedButton<FeedSection>(
            segments: [
              ButtonSegment(
                value: FeedSection.laws,
                label: Text(strings.sectionLaws),
              ),
              ButtonSegment(
                value: FeedSection.news,
                label: Text(strings.sectionNews),
              ),
            ],
            selected: {_section},
            onSelectionChanged: (selection) {
              setState(() {
                _section = selection.first;
                _levelFilter =
                    _section == FeedSection.laws ? FeedLevel.romania : null;
                _tagFilter = null;
              });
            },
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: SegmentedButton<AppLocale>(
                  segments: [
                    for (final option in AppLocale.values)
                      ButtonSegment(
                        value: option,
                        label: Text(option.label),
                      ),
                  ],
                  selected: {locale},
                  onSelectionChanged: (selection) {
                    LocaleScope.of(context).onLocaleChanged(selection.first);
                  },
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filledTonal(
                tooltip: 'Filters',
                onPressed: () => setState(() => _showFilters = !_showFilters),
                isSelected: _showFilters,
                icon: HugeIcon(
                  icon: HugeIcons.strokeRoundedSettings02,
                  color: theme.colorScheme.primary,
                  size: 20,
                ),
              ),
            ],
          ),
          if (_showFilters) ...[
            const SizedBox(height: 12),
            _FilterSection(
              title: strings.filterLevel,
              child: _horizontalChips([
                _chip(
                  label: strings.allLevels,
                  selected: _levelFilter == null,
                  onTap: () => setState(() => _levelFilter = null),
                ),
                _chip(
                  label: strings.levelEu,
                  selected: _levelFilter == FeedLevel.eu,
                  onTap: () => setState(() => _levelFilter = FeedLevel.eu),
                ),
                _chip(
                  label: strings.levelRomania,
                  selected: _levelFilter == FeedLevel.romania,
                  onTap: () => setState(() => _levelFilter = FeedLevel.romania),
                ),
                _chip(
                  label: strings.levelLocal,
                  selected: _levelFilter == FeedLevel.local,
                  onTap: () => setState(() => _levelFilter = FeedLevel.local),
                ),
              ]),
            ),
            _FilterSection(
              title: strings.filterImportance,
              child: _importanceDropdown(context, strings, locale),
            ),
            _FilterSection(
              title: strings.filterTopics,
              child: _topicDropdown(context, strings),
            ),
          ],
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  String _tagShortLabel(String tag) {
    return tag.startsWith('#') ? tag.substring(1).replaceAll('-', ' ') : tag;
  }

  Widget _filterDropdown<T>({
    required T? value,
    required List<DropdownMenuItem<T?>> items,
    required ValueChanged<T?> onChanged,
  }) {
    return InputDecorator(
      decoration: InputDecoration(
        contentPadding: const EdgeInsets.symmetric(horizontal: 12),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<T?>(
          value: value,
          isExpanded: true,
          isDense: true,
          items: items,
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _importanceDropdown(
    BuildContext context,
    AppStrings strings,
    AppLocale locale,
  ) {
    return _filterDropdown<int?>(
      value: _importanceFilter,
      items: [
        DropdownMenuItem<int?>(
          value: null,
          child: Text(strings.allImportance),
        ),
        for (var i = ImportanceLevel.min; i <= ImportanceLevel.max; i++)
          DropdownMenuItem<int?>(
            value: i,
            child: Row(
              children: [
                Icon(Icons.circle, size: 10, color: ImportanceLevel.color(i)),
                const SizedBox(width: 8),
                Text(ImportanceLevel.label(i, locale)),
              ],
            ),
          ),
      ],
      onChanged: (value) => setState(() => _importanceFilter = value),
    );
  }

  Widget _topicDropdown(BuildContext context, AppStrings strings) {
    return _filterDropdown<String?>(
      value: _tagFilter,
      items: [
        DropdownMenuItem<String?>(
          value: null,
          child: Text(strings.allTags),
        ),
        for (final tag in FeedTags.topics)
          DropdownMenuItem<String?>(
            value: tag,
            child: Text(_tagShortLabel(tag)),
          ),
      ],
      onChanged: (value) => setState(() => _tagFilter = value),
    );
  }

  Widget _horizontalChips(List<Widget> chips) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(children: chips),
    );
  }

  Widget _chip({
    required String label,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onTap(),
      ),
    );
  }
}

class _FilterSection extends StatelessWidget {
  const _FilterSection({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title.toUpperCase(),
            style: Theme.of(context).textTheme.labelSmall,
          ),
          const SizedBox(height: 6),
          child,
        ],
      ),
    );
  }
}

class _FeedCard extends StatelessWidget {
  const _FeedCard({required this.item, required this.locale});

  final FeedItem item;
  final AppLocale locale;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _LevelBadge(level: item.level),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      item.source,
                      style: theme.textTheme.labelSmall,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  ImportanceBadge(level: item.importance),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                item.localizedTitle(locale),
                style: theme.textTheme.titleMedium,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 8),
              Text(
                item.localizedSummary(locale),
                style: theme.textTheme.bodyMedium,
                maxLines: 4,
                overflow: TextOverflow.ellipsis,
              ),
              if (item.tags.isNotEmpty) ...[
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: item.tags.map((t) {
                    return Chip(
                      label: Text(
                        t.startsWith('#') ? t.substring(1) : t,
                        style: const TextStyle(fontSize: 11),
                      ),
                      visualDensity: VisualDensity.compact,
                      padding: EdgeInsets.zero,
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    );
                  }).toList(),
                ),
              ],
              const SizedBox(height: 12),
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  if (item.actionPossible)
                    Expanded(
                      child: Tooltip(
                        message: strings.civicActionHint,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color:
                                const Color(0xFF2F9E44).withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: const Color(0xFF2F9E44)
                                  .withValues(alpha: 0.35),
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const HugeIcon(
                                icon: HugeIcons.strokeRoundedTaskDone02,
                                color: Color(0xFF2F9E44),
                                size: 14,
                              ),
                              const SizedBox(width: 6),
                              Flexible(
                                child: Text(
                                  strings.civicAction,
                                  style: theme.textTheme.labelSmall?.copyWith(
                                    color: const Color(0xFF2F9E44),
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    )
                  else
                    const Spacer(),
                  TextButton(
                    onPressed: () => launchUrl(Uri.parse(item.link)),
                    child: Text(strings.open),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LevelBadge extends StatelessWidget {
  const _LevelBadge({required this.level});

  final FeedLevel level;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final label = switch (level) {
      FeedLevel.eu => strings.levelEu,
      FeedLevel.romania => strings.levelRomania,
      FeedLevel.local => strings.levelLocal,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: Theme.of(context).colorScheme.primary,
            ),
      ),
    );
  }
}

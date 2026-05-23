import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../constants/feed_tags.dart';
import '../l10n/app_strings.dart';
import '../models/feed_item.dart';
import '../services/feed_service.dart';
import '../utils/feed_filter.dart';
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

  FeedLevel? _levelFilter;
  String? _tagFilter;
  int? _importanceFilter;

  FeedFilters get _filters => FeedFilters(
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
                  SliverToBoxAdapter(child: _buildHeader(context)),
                  ..._buildFeedSlivers(context, snapshot),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.only(top: 24, bottom: 32),
                      child: Text(
                        AppStrings.footer,
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
  ) {
    if (snapshot.connectionState == ConnectionState.waiting) {
      return const [
        SliverFillRemaining(
          child: Center(child: CircularProgressIndicator()),
        ),
      ];
    }
    if (snapshot.hasError) {
      return [
        SliverFillRemaining(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  AppStrings.loadError,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                Text(
                  '${snapshot.error}\n\n${AppStrings.loadErrorHint}',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: _reload,
                  child: const Text(AppStrings.retry),
                ),
              ],
            ),
          ),
        ),
      ];
    }

    final allItems = snapshot.data ?? [];
    final items = _filters.apply(allItems);

    if (items.isEmpty) {
      return [
        SliverFillRemaining(
          child: Center(
            child: Text(
              AppStrings.noResults,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ),
      ];
    }

    return [
      SliverList.separated(
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) => _NewsCard(item: items[index]),
      ),
    ];
  }

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            AppStrings.eyebrow,
            style: Theme.of(context).textTheme.labelSmall,
          ),
          Text(
            AppStrings.title,
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 4),
          Text(
            AppStrings.tagline,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              IconButton(
                onPressed: _reload,
                tooltip: AppStrings.refresh,
                icon: const Icon(Icons.refresh),
              ),
              Text(
                AppStrings.refresh,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ],
          ),
          const SizedBox(height: 8),
          _FilterSection(
            title: AppStrings.filterLevel,
            child: _horizontalChips([
              _chip(
                label: AppStrings.allLevels,
                selected: _levelFilter == null,
                onTap: () => setState(() => _levelFilter = null),
              ),
              _chip(
                label: AppStrings.levelEu,
                selected: _levelFilter == FeedLevel.eu,
                onTap: () => setState(() => _levelFilter = FeedLevel.eu),
              ),
              _chip(
                label: AppStrings.levelRomania,
                selected: _levelFilter == FeedLevel.romania,
                onTap: () => setState(() => _levelFilter = FeedLevel.romania),
              ),
              _chip(
                label: AppStrings.levelLocal,
                selected: _levelFilter == FeedLevel.local,
                onTap: () => setState(() => _levelFilter = FeedLevel.local),
              ),
            ]),
          ),
          _FilterSection(
            title: AppStrings.filterImportance,
            child: _importanceDropdown(context),
          ),
          _FilterSection(
            title: AppStrings.filterTopics,
            child: _topicDropdown(context),
          ),
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

  Widget _importanceDropdown(BuildContext context) {
    return _filterDropdown<int?>(
      value: _importanceFilter,
      items: [
        const DropdownMenuItem<int?>(
          value: null,
          child: Text(AppStrings.allImportance),
        ),
        for (var i = ImportanceLevel.min; i <= ImportanceLevel.max; i++)
          DropdownMenuItem<int?>(
            value: i,
            child: Row(
              children: [
                Icon(Icons.circle, size: 10, color: ImportanceLevel.color(i)),
                const SizedBox(width: 8),
                Text(ImportanceLevel.label(i)),
              ],
            ),
          ),
      ],
      onChanged: (value) => setState(() => _importanceFilter = value),
    );
  }

  Widget _topicDropdown(BuildContext context) {
    return _filterDropdown<String?>(
      value: _tagFilter,
      items: [
        const DropdownMenuItem<String?>(
          value: null,
          child: Text(AppStrings.allTags),
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

class _NewsCard extends StatelessWidget {
  const _NewsCard({required this.item});

  final FeedItem item;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Card(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: theme.colorScheme.outline),
        ),
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
                item.title,
                style: theme.textTheme.titleMedium,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 8),
              Text(
                item.displaySummary,
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
                        message: AppStrings.civicActionHint,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFF059669).withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: const Color(0xFF059669).withValues(alpha: 0.35),
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.campaign_outlined,
                                size: 16,
                                color: Color(0xFF059669),
                              ),
                              const SizedBox(width: 6),
                              Flexible(
                                child: Text(
                                  AppStrings.civicAction,
                                  style: theme.textTheme.labelSmall?.copyWith(
                                    color: const Color(0xFF059669),
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
                    child: const Text(AppStrings.open),
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
    final label = switch (level) {
      FeedLevel.eu => AppStrings.levelEu,
      FeedLevel.romania => AppStrings.levelRomania,
      FeedLevel.local => AppStrings.levelLocal,
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

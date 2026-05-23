import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../l10n/app_strings.dart';
import '../models/feed_item.dart';
import '../services/feed_service.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  final _feedService = FeedService();
  FeedLevel? _levelFilter;
  late Future<List<FeedItem>> _feedFuture;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() {
    setState(() {
      _feedFuture = _feedService.fetchFeed(level: _levelFilter);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: FutureBuilder<List<FeedItem>>(
          future: _feedFuture,
          builder: (context, snapshot) {
            return RefreshIndicator(
              onRefresh: () async => _reload(),
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

    final items = snapshot.data ?? [];
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
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
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
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                FilterChip(
                  label: const Text(AppStrings.allLevels),
                  selected: _levelFilter == null,
                  onSelected: (_) {
                    setState(() => _levelFilter = null);
                    _reload();
                  },
                ),
                const SizedBox(width: 8),
                FilterChip(
                  label: const Text(AppStrings.levelEu),
                  selected: _levelFilter == FeedLevel.eu,
                  onSelected: (_) {
                    setState(() => _levelFilter = FeedLevel.eu);
                    _reload();
                  },
                ),
                const SizedBox(width: 8),
                FilterChip(
                  label: const Text(AppStrings.levelRomania),
                  selected: _levelFilter == FeedLevel.romania,
                  onSelected: (_) {
                    setState(() => _levelFilter = FeedLevel.romania);
                    _reload();
                  },
                ),
                const SizedBox(width: 8),
                FilterChip(
                  label: const Text(AppStrings.levelLocal),
                  selected: _levelFilter == FeedLevel.local,
                  onSelected: (_) {
                    setState(() => _levelFilter = FeedLevel.local);
                    _reload();
                  },
                ),
              ],
            ),
          ),
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
                  children: item.tags
                      .take(4)
                      .map(
                        (t) => Chip(
                          label: Text(t, style: const TextStyle(fontSize: 11)),
                          visualDensity: VisualDensity.compact,
                          padding: EdgeInsets.zero,
                          materialTapTargetSize:
                              MaterialTapTargetSize.shrinkWrap,
                        ),
                      )
                      .toList(),
                ),
              ],
              const SizedBox(height: 12),
              Row(
                children: [
                  Text(
                    '●' * item.importance.clamp(1, 5),
                    style: theme.textTheme.labelSmall,
                  ),
                  if (item.actionPossible) ...[
                    const SizedBox(width: 12),
                    Text(
                      AppStrings.civicAction,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: const Color(0xFF059669),
                      ),
                    ),
                  ],
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

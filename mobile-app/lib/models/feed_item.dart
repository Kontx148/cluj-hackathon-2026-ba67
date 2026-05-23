enum FeedLevel { eu, romania, local }

class FeedItem {
  const FeedItem({
    required this.id,
    required this.title,
    required this.link,
    required this.description,
    required this.publishedAt,
    required this.source,
    required this.sourceId,
    required this.level,
    this.sourceLang = 'en',
    this.summary,
    this.tags = const [],
    this.importance = 3,
    this.actionPossible = false,
    this.entityType,
    this.voteDate,
    this.feedCategory,
  });

  final String id;
  final String title;
  final String link;
  final String description;
  final String publishedAt;
  final String source;
  final String sourceId;
  final FeedLevel level;
  final String sourceLang;
  final String? summary;
  final List<String> tags;
  final int importance;
  final bool actionPossible;
  final String? entityType;
  final String? voteDate;
  /// `news` or `law` — which tab/section this item belongs to.
  final String? feedCategory;

  String get displaySummary => summary ?? description;

  static FeedLevel _parseLevel(String raw) {
    return switch (raw) {
      'EU' => FeedLevel.eu,
      'Romania' => FeedLevel.romania,
      _ => FeedLevel.local,
    };
  }

  factory FeedItem.fromJson(Map<String, dynamic> json) {
    return FeedItem(
      id: json['id'] as String,
      title: json['title'] as String,
      link: json['link'] as String,
      description: json['description'] as String? ?? '',
      publishedAt: json['publishedAt'] as String,
      source: json['source'] as String,
      sourceId: json['sourceId'] as String,
      level: _parseLevel(json['level'] as String),
      sourceLang: json['sourceLang'] as String? ?? 'en',
      summary: json['summary'] as String? ?? json['summary_en'] as String?,
      tags: (json['tags'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      importance: (json['importance'] as num?)?.toInt() ?? 3,
      actionPossible: json['actionPossible'] as bool? ?? false,
      entityType: json['entityType'] as String?,
      voteDate: json['voteDate'] as String?,
      feedCategory: json['feedCategory'] as String?,
    );
  }
}

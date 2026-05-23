import '../models/feed_item.dart';

class FeedFilters {
  const FeedFilters({
    this.level,
    this.tag,
    this.importance,
  });

  final FeedLevel? level;
  final String? tag;
  final int? importance;

  List<FeedItem> apply(List<FeedItem> items) {
    return items.where((item) {
      if (level != null && item.level != level) return false;
      if (tag != null && !item.tags.contains(tag)) return false;
      if (importance != null && item.importance != importance) return false;
      return true;
    }).toList();
  }
}

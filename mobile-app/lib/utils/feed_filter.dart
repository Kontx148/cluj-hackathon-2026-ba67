import '../l10n/app_locale.dart';
import '../models/feed_item.dart';
import 'feed_section.dart';

class FeedFilters {
  const FeedFilters({
    this.section,
    this.language,
    this.level,
    this.tag,
    this.importance,
  });

  final FeedSection? section;
  final AppLocale? language;
  final FeedLevel? level;
  final String? tag;
  final int? importance;

  List<FeedItem> apply(List<FeedItem> items) {
    return items.where((item) {
      if (section != null && feedSectionForItem(item) != section) {
        return false;
      }
      // Upcoming votes are Romanian official sources only — UI language must not hide them.
      if (language != null &&
          section != FeedSection.laws &&
          item.sourceLang != language!.code) {
        return false;
      }
      if (level != null && item.level != level) return false;
      if (tag != null && !item.tags.contains(tag)) return false;
      if (importance != null && item.importance < importance!) return false;
      return true;
    }).toList();
  }
}

import '../l10n/app_locale.dart';
import '../models/feed_item.dart';

extension FeedItemLocalization on FeedItem {
  String localizedTitle(AppLocale locale) {
    if (locale == AppLocale.en &&
        titleEn != null &&
        titleEn!.trim().isNotEmpty) {
      return titleEn!;
    }
    return title;
  }

  String localizedSummary(AppLocale locale) {
    if (locale == AppLocale.en) {
      if (sourceLang == 'ro' &&
          summary != null &&
          summary!.trim().isNotEmpty) {
        return summary!;
      }
      if (descriptionEn != null && descriptionEn!.trim().isNotEmpty) {
        return descriptionEn!;
      }
    }
    if (description.trim().isNotEmpty) return description;
    return summary ?? '';
  }
}

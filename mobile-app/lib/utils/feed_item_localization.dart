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

  /// Official description — used for news cards.
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

  /// Gemini plain summary for laws (required after Senat workflow runs).
  String? localizedPlainSummary(AppLocale locale) {
    if (locale == AppLocale.en) {
      final text = plainSummaryEn?.trim();
      return text != null && text.isNotEmpty ? text : null;
    }
    final text = plainSummary?.trim();
    return text != null && text.isNotEmpty ? text : null;
  }

  /// Card/detail preview for laws — plain summary only.
  String? localizedLawPreview(AppLocale locale) {
    final plain = localizedPlainSummary(locale);
    if (plain == null) return null;
    final firstParagraph = plain.split('\n').first.trim();
    return firstParagraph.length > 220
        ? '${firstParagraph.substring(0, 217)}…'
        : firstParagraph;
  }
}

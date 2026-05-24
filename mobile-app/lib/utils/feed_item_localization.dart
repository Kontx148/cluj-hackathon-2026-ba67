import '../l10n/app_locale.dart';
import '../models/feed_item.dart';
import '../models/law_plain_summary.dart';

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

  /// Structured plain summary (JSON) or legacy prose wrapper.
  LawPlainSummary? localizedStructuredSummary(AppLocale locale) {
    return LawPlainSummary.parse(localizedPlainSummary(locale));
  }

  /// Card/detail preview for laws — TL;DR bullets or first section.
  String? localizedLawPreview(AppLocale locale) {
    final structured = localizedStructuredSummary(locale);
    if (structured == null) return null;
    final preview = structured.previewText.trim();
    return preview.isEmpty ? null : preview;
  }
}

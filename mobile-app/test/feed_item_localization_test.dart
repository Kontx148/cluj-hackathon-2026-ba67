import 'package:civicai/l10n/app_locale.dart';
import 'package:civicai/models/feed_item.dart';
import 'package:civicai/utils/feed_item_localization.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const roBill = FeedItem(
    id: '1',
    title: 'B246 / 2026 — Propunere legislativă',
    titleEn: 'B246 / 2026 — Legislative proposal',
    link: 'https://example.com',
    description: 'Propunere legislativă pentru abrogarea',
    publishedAt: '2026-05-01T00:00:00Z',
    source: 'Senat',
    sourceId: 'senat-plx',
    level: FeedLevel.romania,
    sourceLang: 'ro',
    feedCategory: 'law',
    summary: 'Legislative proposal to repeal',
  );

  test('shows Romanian text in RO locale', () {
    expect(roBill.localizedTitle(AppLocale.ro), contains('Propunere'));
    expect(roBill.localizedSummary(AppLocale.ro), contains('abrogarea'));
  });

  test('shows English text in EN locale', () {
    expect(roBill.localizedTitle(AppLocale.en), contains('Legislative'));
    expect(roBill.localizedSummary(AppLocale.en), contains('Legislative proposal'));
  });

  test('prefers Gemini plain summary for law preview', () {
    const withPlain = FeedItem(
      id: '2',
      title: 'B1',
      link: 'https://example.com',
      description: 'Official text',
      publishedAt: '2026-05-01T00:00:00Z',
      source: 'Senat',
      sourceId: 'senat-plx',
      level: FeedLevel.romania,
      sourceLang: 'ro',
      feedCategory: 'law',
      plainSummary: 'Pe scurt: această lege schimbă regulile fiscale.',
      plainSummaryEn: 'In short: this bill changes tax rules.',
    );
    expect(
      withPlain.localizedPlainSummary(AppLocale.ro),
      contains('Pe scurt'),
    );
    expect(
      withPlain.localizedLawPreview(AppLocale.en),
      contains('In short'),
    );
  });
}

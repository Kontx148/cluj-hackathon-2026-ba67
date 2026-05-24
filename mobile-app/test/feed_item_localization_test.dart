import 'package:votera/l10n/app_locale.dart';
import 'package:votera/models/feed_item.dart';
import 'package:votera/utils/feed_item_localization.dart';
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
}

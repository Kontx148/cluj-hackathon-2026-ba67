import 'package:civicai/l10n/app_locale.dart';
import 'package:civicai/models/feed_item.dart';
import 'package:civicai/utils/feed_filter.dart';
import 'package:civicai/utils/feed_section.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const sample = FeedItem(
    id: '1',
    title: 'Test',
    link: 'https://example.com',
    description: 'Desc',
    publishedAt: '2026-05-01T00:00:00Z',
    source: 'Src',
    sourceId: 'src',
    level: FeedLevel.eu,
    tags: ['#healthcare', '#bill-proposal'],
    importance: 4,
  );

  test('filters by tag', () {
    const filters = FeedFilters(tag: '#healthcare');
    expect(filters.apply([sample]), hasLength(1));

    const noMatch = FeedFilters(tag: '#defense');
    expect(noMatch.apply([sample]), isEmpty);
  });

  test('filters by importance', () {
    expect(const FeedFilters(importance: 4).apply([sample]), hasLength(1));
    expect(const FeedFilters(importance: 5).apply([sample]), isEmpty);
  });

  test('filters by section', () {
    const lawItem = FeedItem(
      id: '2',
      title: 'Bill',
      link: 'https://example.com/bill',
      description: 'Desc',
      publishedAt: '2026-05-01T00:00:00Z',
      source: 'Senat',
      sourceId: 'senat-plx',
      level: FeedLevel.romania,
      entityType: 'bill',
      feedCategory: 'law',
      sourceLang: 'ro',
    );

    expect(
      const FeedFilters(section: FeedSection.laws).apply([sample, lawItem]),
      hasLength(1),
    );
    expect(
      const FeedFilters(section: FeedSection.news).apply([sample, lawItem]),
      hasLength(1),
    );
  });

  test('filters by language for news only', () {
    const roNews = FeedItem(
      id: '3',
      title: 'Știre',
      link: 'https://example.ro',
      description: 'Desc',
      publishedAt: '2026-05-01T00:00:00Z',
      source: 'G4Media',
      sourceId: 'g4media',
      level: FeedLevel.romania,
      feedCategory: 'news',
      sourceLang: 'ro',
    );

    expect(
      const FeedFilters(language: AppLocale.en).apply([sample, roNews]),
      hasLength(1),
    );
    expect(
      const FeedFilters(language: AppLocale.ro).apply([sample, roNews]),
      hasLength(1),
    );
    expect(
      const FeedFilters(
        section: FeedSection.news,
        language: AppLocale.en,
      ).apply([sample, roNews]),
      hasLength(1),
    );
    expect(
      const FeedFilters(
        section: FeedSection.news,
        language: AppLocale.ro,
      ).apply([sample, roNews]),
      hasLength(1),
    );
    expect(
      const FeedFilters(
        section: FeedSection.news,
        language: AppLocale.ro,
      ).apply([roNews]).first.sourceLang,
      'ro',
    );
  });

  test('does not filter laws by UI language', () {
    const roBill = FeedItem(
      id: '4',
      title: 'B246 / 2026',
      link: 'https://www.senat.ro/',
      description: 'Desc',
      publishedAt: '2026-05-01T00:00:00Z',
      source: 'Senat',
      sourceId: 'senat-plx',
      level: FeedLevel.romania,
      feedCategory: 'law',
      sourceLang: 'ro',
    );

    expect(
      const FeedFilters(
        section: FeedSection.laws,
        language: AppLocale.en,
      ).apply([sample, roBill]),
      hasLength(1),
    );
  });
}

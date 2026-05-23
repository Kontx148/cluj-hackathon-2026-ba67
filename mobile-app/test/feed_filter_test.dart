import 'package:civicai/models/feed_item.dart';
import 'package:civicai/utils/feed_filter.dart';
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
}

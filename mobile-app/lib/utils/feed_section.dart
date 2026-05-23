import '../models/feed_item.dart';

enum FeedSection { news, laws }

const _lawSourceIds = {
  'senat-plx',
  'cdep-plx',
  'monitorul-oficial',
  'eur-lex',
  'ep-oeil',
  'legislatie-just',
  'primaria-cluj',
};

const _newsSourceIds = {
  'g4media',
  'ep-thinktank',
  'digi24',
  'transtelex',
  'maszol',
};

FeedSection feedSectionForItem(FeedItem item) {
  final explicit = item.feedCategory;
  if (explicit == 'news') return FeedSection.news;
  if (explicit == 'law') return FeedSection.laws;

  if (_newsSourceIds.contains(item.sourceId)) return FeedSection.news;
  if (_lawSourceIds.contains(item.sourceId)) return FeedSection.laws;

  return switch (item.entityType) {
    'bill' || 'law' || 'vote' || 'local_official' => FeedSection.laws,
    'news' || 'party_program' || 'politician_stance' => FeedSection.news,
    _ => FeedSection.news,
  };
}

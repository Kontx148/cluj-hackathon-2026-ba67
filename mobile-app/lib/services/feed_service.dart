import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../config.dart';
import '../models/feed_item.dart';

class FeedService {
  static const _newsAssetPath = 'data/news-items.json';
  static const _lawAssetPath = 'data/law-items.json';
  static const _cacheKey = 'civic_feed_cache_v1';

  Future<List<FeedItem>> fetchFeed() async {
    if (useRemoteFeedApi) {
      try {
        final items = await _fetchFromApi();
        await _saveCache(items);
        return items;
      } catch (_) {
        final cached = await _loadCache();
        if (cached != null && cached.isNotEmpty) {
          return cached;
        }
      }
    }
    return _fetchFromAssets();
  }

  Future<void> _saveCache(List<FeedItem> items) async {
    final prefs = await SharedPreferences.getInstance();
    final payload = items.map(_itemToJson).toList();
    await prefs.setString(_cacheKey, jsonEncode(payload));
  }

  Future<List<FeedItem>?> _loadCache() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_cacheKey);
    if (raw == null || raw.isEmpty) return null;
    try {
      final list = jsonDecode(raw) as List<dynamic>;
      return list
          .map((e) => FeedItem.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return null;
    }
  }

  Future<List<FeedItem>> _fetchFromAssets() async {
    final results = await Future.wait([
      rootBundle.loadString(_newsAssetPath),
      rootBundle.loadString(_lawAssetPath),
    ]);

    final news = _parseItems(jsonDecode(results[0]) as Map<String, dynamic>);
    final laws = _parseItems(jsonDecode(results[1]) as Map<String, dynamic>);
    return _sortItems([...news, ...laws]);
  }

  Future<List<FeedItem>> _fetchFromApi() async {
    final uri = Uri.parse('$civicFeedApiBase/api/feed');
    final response =
        await http.get(uri).timeout(const Duration(seconds: 10));
    if (response.statusCode != 200) {
      throw Exception(
        'Feed API ${response.statusCode}: ${response.body}',
      );
    }
    return _parseItems(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  List<FeedItem> _parseItems(Map<String, dynamic> body) {
    final items = body['items'] as List<dynamic>? ?? [];
    return items
        .map((e) => FeedItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  List<FeedItem> _sortItems(List<FeedItem> parsed) {
    parsed.sort(
      (a, b) => DateTime.parse(b.publishedAt)
          .compareTo(DateTime.parse(a.publishedAt)),
    );
    return parsed;
  }

  Map<String, dynamic> _itemToJson(FeedItem item) {
    return {
      'id': item.id,
      'title': item.title,
      'link': item.link,
      'description': item.description,
      'publishedAt': item.publishedAt,
      'source': item.source,
      'sourceId': item.sourceId,
      'level': switch (item.level) {
        FeedLevel.eu => 'EU',
        FeedLevel.romania => 'Romania',
        FeedLevel.local => 'Local',
      },
      'sourceLang': item.sourceLang,
      if (item.titleEn != null) 'title_en': item.titleEn,
      if (item.descriptionEn != null) 'description_en': item.descriptionEn,
      if (item.summary != null) 'summary': item.summary,
      'tags': item.tags,
      'importance': item.importance,
      'actionPossible': item.actionPossible,
      if (item.entityType != null) 'entityType': item.entityType,
      if (item.voteDate != null) 'voteDate': item.voteDate,
      if (item.feedCategory != null) 'feedCategory': item.feedCategory,
      if (item.plainSummary != null) 'plain_summary': item.plainSummary,
      if (item.plainSummaryEn != null) 'plain_summary_en': item.plainSummaryEn,
    };
  }
}

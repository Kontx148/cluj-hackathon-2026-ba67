import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;
import 'package:http/http.dart' as http;

import '../config.dart';
import '../models/feed_item.dart';

class FeedService {
  static const _newsAssetPath = 'data/news-items.json';
  static const _lawAssetPath = 'data/law-items.json';

  Future<List<FeedItem>> fetchFeed() async {
    // The remote feed API is only used when CIVIC_FEED_API_BASE is set at
    // compile time.  The bundled JSON is the default and always the fallback.
    if (useRemoteFeedApi) {
      try {
        return await _fetchFromApi();
      } catch (_) {
        // Fall through to bundled assets.
      }
    }
    return _fetchFromAssets();
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
}

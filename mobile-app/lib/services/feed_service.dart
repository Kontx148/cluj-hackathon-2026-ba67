import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;
import 'package:http/http.dart' as http;

import '../config.dart';
import '../models/feed_item.dart';

class FeedService {
  static const _assetPath = 'data/feed-items.json';

  Future<List<FeedItem>> fetchFeed() async {
    if (useRemoteFeedApi) {
      return _fetchFromApi();
    }
    return _fetchFromAssets();
  }

  Future<List<FeedItem>> _fetchFromAssets() async {
    final raw = await rootBundle.loadString(_assetPath);
    return _parseItems(jsonDecode(raw) as Map<String, dynamic>);
  }

  Future<List<FeedItem>> _fetchFromApi() async {
    final uri = Uri.parse('$apiBase/api/feed');
    final response = await http.get(uri).timeout(const Duration(seconds: 15));
    if (response.statusCode != 200) {
      throw Exception('Feed API ${response.statusCode}: ${response.body}');
    }
    return _parseItems(jsonDecode(response.body) as Map<String, dynamic>);
  }

  List<FeedItem> _parseItems(Map<String, dynamic> body) {
    final items = body['items'] as List<dynamic>? ?? [];
    final parsed = items
        .map((e) => FeedItem.fromJson(e as Map<String, dynamic>))
        .toList();

    parsed.sort(
      (a, b) =>
          DateTime.parse(b.publishedAt).compareTo(DateTime.parse(a.publishedAt)),
    );

    return parsed;
  }
}

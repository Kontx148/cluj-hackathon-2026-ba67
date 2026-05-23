import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../config.dart';
import '../data/demo_elections.dart';
import '../models/election.dart';

/// Result returned by [ElectionsService.fetchElections].
@immutable
class ElectionsResult {
  const ElectionsResult({
    required this.elections,
    required this.offline,
  });

  final List<Election> elections;

  /// `true` when the backend was unreachable and demo data is shown.
  final bool offline;
}

class ElectionsService {
  ElectionsService({http.Client? client, String? baseUrl})
      : _client = client ?? http.Client(),
        _baseUrl = baseUrl ?? gatewayBase;

  final http.Client _client;
  final String _baseUrl;

  Future<ElectionsResult> fetchElections() async {
    if (_baseUrl.isEmpty) {
      return ElectionsResult(
        elections: buildDemoElections(),
        offline: true,
      );
    }
    try {
      final uri = Uri.parse('$_baseUrl/elections');
      final response =
          await _client.get(uri).timeout(const Duration(seconds: 10));
      if (response.statusCode != 200) {
        throw Exception(
          'Elections API ${response.statusCode}: ${response.body}',
        );
      }
      final body = jsonDecode(response.body) as Map<String, dynamic>;
      final list = body['elections'] as List<dynamic>? ?? const [];
      final elections = list
          .map((e) => Election.fromJson(e as Map<String, dynamic>))
          .toList();
      return ElectionsResult(elections: elections, offline: false);
    } catch (_) {
      return ElectionsResult(
        elections: buildDemoElections(),
        offline: true,
      );
    }
  }
}

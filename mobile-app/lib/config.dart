/// Base URL of the **election chain gateway** (not the civic feed API on :3001).
///
/// Defaults to the hosted gateway at `165.232.67.137:4001`.
/// Override at run time (either name works):
///   `flutter run --dart-define=GATEWAY_BASE=http://10.0.2.2:4001`
///   `flutter run --dart-define=API_BASE=http://10.0.2.2:4001`
const String _gatewayFromEnv = String.fromEnvironment('GATEWAY_BASE');
const String _apiBaseAlias = String.fromEnvironment('API_BASE');

String _resolveGatewayBase() {
  if (_gatewayFromEnv.isNotEmpty) return _gatewayFromEnv;
  if (_apiBaseAlias.isNotEmpty) return _apiBaseAlias;
  return 'http://165.232.67.137:4001';
}

final String gatewayBase = _resolveGatewayBase();

/// Kept for backwards compat — same as [gatewayBase].
final String apiBase = gatewayBase;

/// Civic feed API (n8n / feed-api on :3001).
///
/// Defaults to the hosted feed-api at `165.232.67.137:3001` so release builds
/// on a phone (no Mac attached) still load live data over Wi‑Fi/cellular.
/// Override for local Docker:
///   `flutter run --dart-define=CIVIC_FEED_API_BASE=http://10.0.2.2:3001`
/// Bundled JSON only (no network):
///   `flutter run --dart-define=CIVIC_FEED_API_BASE=bundled`
const String _feedFromEnv = String.fromEnvironment('CIVIC_FEED_API_BASE');

String _resolveFeedApiBase() {
  if (_feedFromEnv == 'bundled') return '';
  if (_feedFromEnv.isNotEmpty) return _feedFromEnv;
  return 'http://165.232.67.137:3001';
}

final String civicFeedApiBase = _resolveFeedApiBase();

/// Fetch from feed-api when a base URL is configured (default: production VPS).
bool get useRemoteFeedApi => civicFeedApiBase.isNotEmpty;

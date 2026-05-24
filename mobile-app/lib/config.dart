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

/// The civic feed **always** uses bundled assets in this build.
/// No remote feed API is wired up; set this only if you add a live feed
/// backend and want to override the bundled JSON.
const String civicFeedApiBase = String.fromEnvironment(
  'CIVIC_FEED_API_BASE',
  defaultValue: '',
);

/// Whether to fetch the civic feed from a remote API instead of bundled assets.
/// This is `false` by default — the bundled JSON is always used unless you
/// explicitly provide a CIVIC_FEED_API_BASE at compile time.
bool get useRemoteFeedApi => civicFeedApiBase.isNotEmpty;

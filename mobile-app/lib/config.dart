/// Base URL of the **election chain gateway**.
///
/// Defaults to the hosted gateway at `165.232.67.137:4001`.
/// Override at run time:
///   `flutter run --dart-define=GATEWAY_BASE=http://10.0.2.2:4001`
const String gatewayBase = String.fromEnvironment(
  'GATEWAY_BASE',
  defaultValue: 'http://165.232.67.137:4001',
);

/// Kept for backwards compat — same as gatewayBase.
const String apiBase = gatewayBase;

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

/// When empty (default), the app loads [data/feed-items.json] from bundled assets.
/// Set at run time for a remote API, e.g.:
/// `flutter run --dart-define=API_BASE=http://10.0.2.2:3001`
const String apiBase = String.fromEnvironment('API_BASE', defaultValue: '');

bool get useRemoteFeedApi => apiBase.isNotEmpty;

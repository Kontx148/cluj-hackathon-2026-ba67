import 'package:shared_preferences/shared_preferences.dart';

/// Persists which elections this device has successfully voted in.
///
/// Used only for UX (a “already voted” tag on the list). Re-voting is still
/// allowed; the backend enforces one vote per digital ID.
class VoteHistoryService {
  static const _storageKey = 'voted_election_ids';

  Future<Set<String>> votedElectionIds() async {
    final prefs = await SharedPreferences.getInstance();
    return (prefs.getStringList(_storageKey) ?? const []).toSet();
  }

  Future<bool> hasVoted(String electionId) async {
    final ids = await votedElectionIds();
    return ids.contains(electionId);
  }

  Future<void> markVoted(String electionId) async {
    final prefs = await SharedPreferences.getInstance();
    final ids = prefs.getStringList(_storageKey) ?? [];
    if (!ids.contains(electionId)) {
      ids.add(electionId);
      await prefs.setStringList(_storageKey, ids);
    }
  }
}

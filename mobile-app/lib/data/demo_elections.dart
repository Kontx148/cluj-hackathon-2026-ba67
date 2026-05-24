import '../models/election.dart';

/// Hardcoded demo elections used when the gateway is unreachable.
///
/// These mirror the elections that exist on the deployed gateway at
/// `165.232.67.137:4001`, so the UI can be demoed offline.
///
/// The `OPEN` demo election uses a mock key — selecting it lets you run
/// through the full UI wizard. The vote submission will fail (or show a
/// meaningful error) if the backend is still unreachable, but the UX flow
/// is fully explorable.
List<Election> buildDemoElections() {
  final base = DateTime.now();
  return [
    Election(
      id: 'DEMO-LOCAL-2026',
      name: 'Demo: Local Council Vote 2026',
      type: 'LOCAL',
      status: ElectionStatus.open,
      districts: ['CJ-01'],
      candidates: const [
        ElectionCandidate(
          id: 'candidate-a',
          name: 'Elena Ionescu',
          subtext: 'Partidul Național Democrat',
        ),
        ElectionCandidate(
          id: 'candidate-b',
          name: 'Mihai Popescu',
          subtext: 'Uniunea Civică Română',
        ),
        ElectionCandidate(
          id: 'candidate-c',
          name: 'Andrei Muresan',
          subtext: 'Alianța Verde',
        ),
      ],
      startsAt: base.subtract(const Duration(hours: 1)),
      endsAt: base.add(const Duration(hours: 6)),
    ),
    Election(
      id: 'RO-PRESIDENTIAL-2029',
      name: 'Romanian Presidential Election 2029',
      type: 'PRESIDENTIAL',
      status: ElectionStatus.finished,
      districts: ['CJ-01', 'B-01', 'BV-01'],
      candidates: const [
        ElectionCandidate(
          id: 'candidate-a',
          name: 'Elena Ionescu',
          subtext: 'Partidul Național Democrat',
        ),
        ElectionCandidate(
          id: 'candidate-b',
          name: 'Mihai Popescu',
          subtext: 'Uniunea Civică Română',
        ),
        ElectionCandidate(
          id: 'candidate-c',
          name: 'Andrei Muresan',
          subtext: 'Alianța Verde',
        ),
      ],
      startsAt: DateTime(2029, 11, 10, 7),
      endsAt: DateTime(2029, 11, 10, 21),
    ),
  ];
}

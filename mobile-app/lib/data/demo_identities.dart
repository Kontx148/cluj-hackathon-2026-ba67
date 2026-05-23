/// Demo digital IDs the user can pick when "developer mode" is on.
///
/// The two `eligible` entries match the validator's bundled
/// `validator/data/eligible-voters.json` so a vote with them is accepted.
/// The `ineligible` entry is for showing the rejection flow.
class DemoIdentity {
  const DemoIdentity({
    required this.digitalId,
    required this.name,
    required this.eligible,
    this.note,
  });

  final String digitalId;
  final String name;
  final bool eligible;
  final String? note;
}

const List<DemoIdentity> demoIdentities = [
  DemoIdentity(
    digitalId: 'RO123456789',
    name: 'Test User 1',
    eligible: true,
    note: 'Eligible — on validator allowlist',
  ),
  DemoIdentity(
    digitalId: 'RO987654321',
    name: 'Test User 2',
    eligible: true,
    note: 'Eligible — on validator allowlist',
  ),
  DemoIdentity(
    digitalId: 'RO000000000',
    name: 'Mr. Ineligible',
    eligible: false,
    note: 'Not on the allowlist — vote will be rejected',
  ),
];

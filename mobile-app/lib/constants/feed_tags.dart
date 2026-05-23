/// Topic and type labels used for filtering (see design/STRINGS.json).
abstract final class FeedTags {
  static const topics = [
    '#healthcare',
    '#education',
    '#taxation',
    '#infrastructure',
    '#environment',
    '#public-safety',
    '#digitalization',
    '#social-policy',
    '#energy',
    '#defense',
  ];

  static const types = [
    '#law-in-force',
    '#bill-proposal',
    '#vote-upcoming',
    '#party-program',
    '#representative-stance',
    '#local-decision',
  ];

  static const all = [...topics, ...types];
}

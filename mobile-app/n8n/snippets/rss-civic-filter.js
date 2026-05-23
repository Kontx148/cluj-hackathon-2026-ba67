/**
 * Shared n8n Code node logic for RSS → civic news records.
 * Copy into workflows; set SOURCE_ID, SOURCE_NAME, LEVEL, KEYWORD_SET.
 *
 * KEYWORD_SET: 'romaniaNational' | 'localCluj' (patterns in data/civic-keywords.json)
 */
const KEYWORDS = {
  romaniaNational:
    /salari|pensii|pensie|tax|tva|impozit|sanat|spital|medic|invatam|scoal|universit|locuin|chiri|energie|electric|gaze|pret|inflat|protest|guvern|parlament|cetat|consum|drepturi|munc[aă]|somaj|reform|buget|subvent|acciz|copii|familie|infrastruct|drum|autostr|corupt|justit|democrat|aleger|vot|lege|ordonan|proiect|senat|deputat|minister|PNL|PSD|AUR|USR/i,
  localCluj:
    /cluj|primar|consiliu|HCL|taxa local|transport|tramv|autobuz|STCF|parc|construct|locuin|scoal|gradinit|spital|politie|strad|cartier|florest|turda|dej|consultare|buget local|trafic|locuitor|maszol|udmr|rmdsz|kolozs|monitorul/i,
};

// --- configure per workflow ---
const SOURCE_ID = 'hotnews';
const SOURCE_NAME = 'HotNews';
const LEVEL = 'Romania';
const KEYWORD_SET = 'romaniaNational';

const keywords = KEYWORDS[KEYWORD_SET];
const records = $input
  .all()
  .map(({ json: item }) => item)
  .filter((item) => keywords.test(`${item.title} ${item.contentSnippet || ''}`))
  .slice(0, 20)
  .map((item) => ({
    sourceId: SOURCE_ID,
    sourceName: SOURCE_NAME,
    level: LEVEL,
    sourceLang: 'ro',
    entityType: 'news',
    feedCategory: 'news',
    externalId: item.link,
    title: item.title,
    detailUrl: item.link,
    description: String(item.contentSnippet || item.title || '')
      .replace(/<[^>]+>/g, ' ')
      .trim()
      .slice(0, 500),
    publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
  }));

return [{ json: { records } }];

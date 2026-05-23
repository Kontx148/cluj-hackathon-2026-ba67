export type Level = "EU" | "Romania" | "Local";

export interface FeedSource {
  id: string;
  name: string;
  url: string;
  level: Level;
  lang: "ro" | "hu" | "en";
}

export const SOURCES: FeedSource[] = [
  { id: "ep-thinktank", name: "EP Think Tank", url: "https://epthinktank.eu/feed/", level: "EU", lang: "en" },
  { id: "g4media", name: "G4Media", url: "https://www.g4media.ro/feed", level: "Romania", lang: "ro" },
  { id: "digi24", name: "Digi24", url: "https://www.digi24.ro/rss", level: "Romania", lang: "ro" },
  { id: "hotnews", name: "HotNews", url: "https://www.hotnews.ro/rss", level: "Romania", lang: "ro" },
  { id: "pressone", name: "PressOne", url: "https://pressone.ro/feed", level: "Romania", lang: "ro" },
  // Local — Transylvania / Cluj (Hungarian-language sources)
  { id: "maszol", name: "Maszol", url: "https://maszol.ro/rss", level: "Local", lang: "hu" },
  { id: "transtelex", name: "Transtelex", url: "https://transtelex.ro/rss", level: "Local", lang: "hu" },
];

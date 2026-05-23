import { createServerFn } from "@tanstack/react-start";
import { XMLParser } from "fast-xml-parser";
import { SOURCES, type FeedSource, type Level } from "./sources";

export interface FeedItem {
  id: string;
  title: string;
  link: string;
  description: string;
  publishedAt: string;
  source: string;
  sourceId: string;
  level: Level;
  sourceLang: "ro" | "hu" | "en";
  // AI-enriched (optional, may be missing if AI call failed)
  summary?: string;
  summary_en?: string; // legacy alias
  tags?: string[];
  importance?: number; // 1-5
  actionPossible?: boolean;
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
let cache: { items: FeedItem[]; at: number } | null = null;

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchSource(src: FeedSource, perSource: number): Promise<FeedItem[]> {
  try {
    const res = await fetch(src.url, {
      headers: {
        "User-Agent": "CivicAI/1.0 (+civic-engagement-mvp)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.warn(`[feed] ${src.id} HTTP ${res.status}`);
      return [];
    }
    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    const parsed = parser.parse(xml);

    // RSS 2.0
    const rssItems = parsed?.rss?.channel?.item;
    // Atom
    const atomItems = parsed?.feed?.entry;
    const rawItems: any[] = Array.isArray(rssItems)
      ? rssItems
      : rssItems
        ? [rssItems]
        : Array.isArray(atomItems)
          ? atomItems
          : atomItems
            ? [atomItems]
            : [];

    return rawItems.slice(0, perSource).map((it: any) => {
      const title = stripHtml(String(it.title?.["#text"] ?? it.title ?? ""));
      const link = String(
        typeof it.link === "string" ? it.link : (it.link?.["@_href"] ?? it.link?.["#text"] ?? it.guid ?? ""),
      );
      const description = stripHtml(
        String(it.description ?? it.summary ?? it["content:encoded"] ?? it.content?.["#text"] ?? it.content ?? ""),
      ).slice(0, 600);
      const publishedAt = String(it.pubDate ?? it.published ?? it.updated ?? new Date().toISOString());
      return {
        id: hash(`${src.id}|${link || title}`),
        title,
        link,
        description,
        publishedAt,
        source: src.name,
        sourceId: src.id,
        level: src.level,
        sourceLang: src.lang,
      } as FeedItem;
    });
  } catch (e) {
    console.warn(`[feed] ${src.id} failed:`, e instanceof Error ? e.message : e);
    return [];
  }
}

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const enrichTool = {
  type: "function" as const,
  function: {
    name: "enrich_items",
    description: "Return enriched metadata for each news item",
    parameters: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              summary: { type: "string", description: "2-3 sentence English summary" },
              tags: {
                type: "array",
                items: { type: "string" },
                description:
                  "Tags from: #EU,#Romania,#Cluj,#healthcare,#education,#taxation,#infrastructure,#environment,#public-safety,#digitalization,#social-policy,#energy,#defense,#law-in-force,#bill-proposal,#vote-upcoming,#party-program,#representative-stance,#local-decision,#consultation,#petition",
              },
              importance: { type: "integer", minimum: 1, maximum: 5 },
              action_possible: { type: "boolean" },
            },
            required: ["id", "summary", "tags", "importance", "action_possible"],
            additionalProperties: false,
          },
        },
      },
      required: ["items"],
      additionalProperties: false,
    },
  },
};

async function enrichBatch(items: FeedItem[]): Promise<Map<string, Partial<FeedItem>>> {
  const out = new Map<string, Partial<FeedItem>>();
  const key = process.env.LOVABLE_API_KEY;
  if (!key || items.length === 0) return out;

  const payload = items.map((i) => ({
    id: i.id,
    level: i.level,
    source: i.source,
    title: i.title,
    description: i.description,
  }));

  try {
    const res = await fetch(AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a Romanian/EU legal and political assistant for CivicAI. For each item, return a concise English summary, pick relevant tags, score importance 1-5 (citizen impact), and flag if civic action is possible. Be neutral and factual.",
          },
          {
            role: "user",
            content: `Process these ${items.length} items:\n${JSON.stringify(payload)}`,
          },
        ],
        tools: [enrichTool],
        tool_choice: { type: "function", function: { name: "enrich_items" } },
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!res.ok) {
      console.warn(`[ai] HTTP ${res.status}: ${await res.text().catch(() => "")}`);
      return out;
    }
    const data = await res.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments ? JSON.parse(call.function.arguments) : null;
    if (args?.items && Array.isArray(args.items)) {
      for (const e of args.items) {
        out.set(String(e.id), {
          summary: e.summary ?? e.summary_en,
          summary_en: e.summary ?? e.summary_en,
          tags: Array.isArray(e.tags) ? e.tags : [],
          importance: typeof e.importance === "number" ? e.importance : 3,
          actionPossible: !!e.action_possible,
        });
      }
    }
  } catch (e) {
    console.warn("[ai] enrich failed:", e instanceof Error ? e.message : e);
  }
  return out;
}

async function buildFeed(perSource: number, totalCap: number): Promise<FeedItem[]> {
  const results = await Promise.all(SOURCES.map((s) => fetchSource(s, perSource)));
  const all = results
    .flat()
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, totalCap);

  // Dedup by title similarity (cheap: lowercase first 50 chars)
  const seen = new Set<string>();
  const deduped = all.filter((it) => {
    const k = it.title.toLowerCase().slice(0, 50);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  // Enrich in batches of 8 to keep prompts small
  const batchSize = 8;
  for (let i = 0; i < deduped.length; i += batchSize) {
    const batch = deduped.slice(i, i + batchSize);
    const enriched = await enrichBatch(batch);
    for (const item of batch) {
      const e = enriched.get(item.id);
      if (e) Object.assign(item, e);
    }
  }

  return deduped;
}

export const getFeed = createServerFn({ method: "GET" }).handler(async () => {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) {
    return { items: cache.items, cachedAt: cache.at, fresh: false };
  }
  const items = await buildFeed(6, 30);
  cache = { items, at: now };
  return { items, cachedAt: now, fresh: true };
});

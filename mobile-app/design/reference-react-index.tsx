import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState, Suspense } from "react";
import { getFeed, type FeedItem } from "@/lib/feed.functions";
import { SOURCES } from "@/lib/sources";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, RefreshCw, Sparkles, Globe2, Landmark, Building2 } from "lucide-react";

const feedQuery = queryOptions({
  queryKey: ["feed"],
  queryFn: () => getFeed(),
  staleTime: 5 * 60 * 1000,
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(feedQuery),
  component: HomePage,
  pendingComponent: PageSkeleton,
});

const COPY = {
  title: "CivicAI",
  tagline: "EU, Romanian, and local politics in one place — explained clearly.",
  search: "Search by title, source, or tag…",
  refresh: "Refresh",
  all: "All",
  topics: "Topics",
  levels: "Level",
  types: "Type",
  nothing: "No results for the current filters.",
  action: "Civic action possible",
  importance: "Importance",
  source: "Source",
  open: "Open",
  powered: "AI-generated summary (demo)",
};

const TOPIC_TAGS = [
  "#healthcare",
  "#education",
  "#taxation",
  "#infrastructure",
  "#environment",
  "#public-safety",
  "#digitalization",
  "#social-policy",
  "#energy",
  "#defense",
];

const TYPE_TAGS = [
  "#law-in-force",
  "#bill-proposal",
  "#vote-upcoming",
  "#party-program",
  "#representative-stance",
  "#local-decision",
];

function levelIcon(level: string) {
  if (level === "EU") return <Globe2 className="size-3.5" />;
  if (level === "Romania") return <Landmark className="size-3.5" />;
  return <Building2 className="size-3.5" />;
}

function PageSkeleton() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-3 h-5 w-96" />
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      </div>
    </main>
  );
}

function HomePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Feed />
    </Suspense>
  );
}

function Feed() {
  const { data, refetch, isFetching } = useSuspenseQuery(feedQuery);
  const [level, setLevel] = useState<"all" | "EU" | "Romania" | "Local">("all");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const t = COPY;
  const items = data.items;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (level !== "all" && it.level !== level) return false;
      if (activeTopic && !(it.tags ?? []).includes(activeTopic)) return false;
      if (activeType && !(it.tags ?? []).includes(activeType)) return false;
      if (q) {
        const hay = `${it.title} ${it.source} ${(it.tags ?? []).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, level, activeTopic, activeType, search]);

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              <Sparkles className="size-3.5" />
              <span>{t.powered}</span>
            </div>
            <h1 className="mt-1 text-4xl font-bold tracking-tight md:text-5xl">{t.title}</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">{t.tagline}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
              {t.refresh}
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col gap-4">
          <Input
            placeholder={t.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.levels}:</span>
            {(["all", "EU", "Romania", "Local"] as const).map((lv) => (
              <Button
                key={lv}
                size="sm"
                variant={level === lv ? "default" : "outline"}
                onClick={() => setLevel(lv)}
                className="h-7 rounded-full px-3 text-xs"
              >
                {lv === "all" ? t.all : lv}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.topics}:</span>
            {TOPIC_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTopic(activeTopic === tag ? null : tag)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  activeTopic === tag
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:border-primary/60"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.types}:</span>
            {TYPE_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveType(activeType === tag ? null : tag)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  activeType === tag
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:border-primary/60"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{t.source}:</span>
            {SOURCES.map((s) => (
              <Badge key={s.id} variant="secondary" className="font-normal">
                {s.name}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0 ? (
            <p className="col-span-full py-16 text-center text-muted-foreground">{t.nothing}</p>
          ) : (
            filtered.map((item) => <NewsCard key={item.id} item={item} t={t} />)
          )}
        </div>
      </section>

      <footer className="mt-12 border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        CivicAI · Hackathon MVP · Cluj 2026
      </footer>
    </main>
  );
}

function NewsCard({ item, t }: { item: FeedItem; t: typeof COPY }) {
  const summary =
    (item as FeedItem & { summary?: string }).summary ??
    item.summary_en ??
    item.description.slice(0, 200);
  const importance = item.importance ?? 0;
  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 text-xs">
          <Badge variant="outline" className="gap-1">
            {levelIcon(item.level)}
            {item.level}
          </Badge>
          <span className="text-muted-foreground">{item.source}</span>
        </div>
        <CardTitle className="mt-2 line-clamp-3 text-base leading-snug">{item.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-3">
        <p className="line-clamp-4 text-sm text-muted-foreground">{summary}</p>
        {item.tags && item.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {item.tags.slice(0, 6).map((tg) => (
              <span key={tg} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">
                {tg}
              </span>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2 pt-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {importance > 0 && (
            <span title={t.importance} className="font-mono">
              {"●".repeat(importance)}
              <span className="opacity-30">{"●".repeat(5 - importance)}</span>
            </span>
          )}
          {item.actionPossible && (
            <Badge variant="default" className="h-5 bg-emerald-600 px-1.5 text-[10px] hover:bg-emerald-700">
              {t.action}
            </Badge>
          )}
        </div>
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {t.open}
          <ExternalLink className="size-3" />
        </a>
      </CardFooter>
    </Card>
  );
}

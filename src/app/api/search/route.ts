import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

/**
 * Real, keyless web/knowledge search. Works with zero configuration via
 * DuckDuckGo's Instant Answer API + Wikipedia. If TAVILY_API_KEY (or
 * BRAVE_API_KEY) is set, it upgrades to a full web-search provider.
 *
 * This is what lets Aria's agents fetch *real, live* information — even in the
 * fully-offline simulated brain mode.
 */
interface Result {
  title: string;
  snippet: string;
  url: string;
}

const UA = "AriaOS/1.0 (+https://github.com/skmdroid/aria)";

async function tavily(query: string, key: string): Promise<Result[]> {
  const r = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      api_key: key,
      query,
      max_results: 6,
      search_depth: "basic",
    }),
  });
  if (!r.ok) throw new Error("tavily failed");
  const d = await r.json();
  return (d.results || []).map((x: { title: string; content: string; url: string }) => ({
    title: x.title,
    snippet: x.content,
    url: x.url,
  }));
}

async function duckduckgo(query: string): Promise<Result[]> {
  const u = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  const r = await fetch(u, { headers: { "user-agent": UA } });
  if (!r.ok) return [];
  const d = await r.json();
  const out: Result[] = [];
  if (d.AbstractText) {
    out.push({
      title: d.Heading || query,
      snippet: d.AbstractText,
      url: d.AbstractURL || "",
    });
  }
  for (const t of d.RelatedTopics || []) {
    if (t.Text && t.FirstURL) {
      out.push({ title: t.Text.split(" - ")[0], snippet: t.Text, url: t.FirstURL });
    } else if (t.Topics) {
      for (const s of t.Topics.slice(0, 2)) {
        if (s.Text && s.FirstURL)
          out.push({ title: s.Text.split(" - ")[0], snippet: s.Text, url: s.FirstURL });
      }
    }
    if (out.length >= 6) break;
  }
  return out;
}

async function wikipedia(query: string): Promise<Result[]> {
  const u = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    query,
  )}&srlimit=4&format=json&origin=*`;
  const r = await fetch(u, { headers: { "user-agent": UA } });
  if (!r.ok) return [];
  const d = await r.json();
  return (d?.query?.search || []).map(
    (x: { title: string; snippet: string }): Result => ({
      title: x.title,
      snippet: x.snippet.replace(/<[^>]+>/g, ""),
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(x.title.replace(/ /g, "_"))}`,
    }),
  );
}

export async function POST(req: NextRequest) {
  let query = "";
  try {
    ({ query } = await req.json());
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  if (!query || query.length < 2) {
    return NextResponse.json({ results: [], source: "none" });
  }

  const tavilyKey = process.env.TAVILY_API_KEY;
  try {
    if (tavilyKey) {
      const results = await tavily(query, tavilyKey);
      if (results.length) return NextResponse.json({ results, source: "tavily" });
    }
  } catch {
    /* fall through to keyless */
  }

  // keyless: combine DuckDuckGo + Wikipedia, de-duped
  const [ddg, wiki] = await Promise.all([
    duckduckgo(query).catch(() => []),
    wikipedia(query).catch(() => []),
  ]);
  const seen = new Set<string>();
  const results = [...ddg, ...wiki]
    .filter((r) => r.snippet && (seen.has(r.url) ? false : (seen.add(r.url), true)))
    .slice(0, 6);

  return NextResponse.json({ results, source: "ddg+wikipedia" });
}

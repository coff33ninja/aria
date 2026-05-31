import type { SearchResult, Tool, ToolResult } from "./types";

/** Low-level client call to the keyless search backend. */
export async function searchWeb(query: string): Promise<{
  results: SearchResult[];
  source: string;
}> {
  try {
    const r = await fetch("/api/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (!r.ok) return { results: [], source: "none" };
    const d = await r.json();
    return { results: d.results || [], source: d.source || "none" };
  } catch {
    return { results: [], source: "none" };
  }
}

/** Render search results as a sourced markdown brief. */
export function formatResearch(query: string, results: SearchResult[]): string {
  if (!results.length) {
    return `Searched the web for **${query}** but came back empty-handed — the live sources had nothing usable. Falling back to reasoning.`;
  }
  const bullets = results
    .map((r) => {
      const snip = r.snippet.length > 220 ? r.snippet.slice(0, 217) + "…" : r.snippet;
      const host = r.url ? r.url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] : "";
      return `• **${r.title}** — ${snip}${host ? ` _(${host})_` : ""}`;
    })
    .join("\n");
  const sources = results
    .filter((r) => r.url)
    .map((r, i) => `${i + 1}. [${r.title}](${r.url})`)
    .join("\n");
  return `Pulled **live** results for **${query}**:\n\n${bullets}\n\n**Sources**\n${sources}`;
}

/* ───────────────────────── Tool registry ───────────────────────── */

export const webSearchTool: Tool<{ query: string }> = {
  name: "web_search",
  description:
    "Search the live web for current, factual information. Returns titles, snippets and source URLs.",
  parameters: {
    query: { type: "string", description: "The search query" },
  },
  async run({ query }): Promise<ToolResult> {
    const { results, source } = await searchWeb(query);
    return {
      ok: results.length > 0,
      summary: results.length
        ? `Found ${results.length} live results (${source})`
        : "No live results found",
      data: results,
    };
  },
};

export const TOOLS: Record<string, Tool> = {
  web_search: webSearchTool as Tool,
};

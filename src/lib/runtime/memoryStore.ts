export interface MemoryEntry {
  id: string;
  text: string;
  embedding: number[];
  source: "chat" | "mission" | "file" | "name";
  ts: number;
}

/** Cosine similarity between two vectors. */
function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

/** Simple in-memory vector store. Call `add()` to insert, `search()` to query. */
export class MemoryStore {
  private entries: MemoryEntry[] = [];

  get all() { return this.entries; }

  load(data: MemoryEntry[]) { this.entries = data; }

  add(entry: MemoryEntry) { this.entries.push(entry); }

  remove(id: string) {
    this.entries = this.entries.filter((e) => e.id !== id);
  }

  /** Return top-k entries by cosine similarity above threshold. */
  search(query: number[], k = 5, threshold = 0.4): MemoryEntry[] {
    const scored = this.entries.map((e) => ({
      entry: e,
      score: cosine(query, e.embedding),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.filter((s) => s.score >= threshold).slice(0, k).map((s) => s.entry);
  }
}

export const memoryStore = new MemoryStore();

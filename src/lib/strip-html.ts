const NAMED_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&#39;": "'",
  "&nbsp;": "\u00a0",
  "&ndash;": "\u2013",
  "&mdash;": "\u2014",
  "&lsquo;": "\u2018",
  "&rsquo;": "\u2019",
  "&ldquo;": "\u201c",
  "&rdquo;": "\u201d",
  "&hellip;": "\u2026",
  "&copy;": "\u00a9",
  "&reg;": "\u00ae",
  "&bull;": "\u2022",
  "&middot;": "\u00b7",
  "&deg;": "\u00b0",
  "&plusmn;": "\u00b1",
  "&times;": "\u00d7",
  "&divide;": "\u00f7",
  "&micro;": "\u00b5",
  "&cent;": "\u00a2",
  "&pound;": "\u00a3",
  "&euro;": "\u20ac",
  "&yen;": "\u00a5",
  "&sect;": "\u00a7",
  "&raquo;": "\u00bb",
  "&laquo;": "\u00ab",
  "&trade;": "\u2122",
};

const BLOCK_CLOSE = /<\/(?:p|div|li|tr|h[1-6]|blockquote|figcaption|details|summary)>/gi;

function decodeEntity(entity: string): string {
  const named = NAMED_ENTITIES[entity];
  if (named) return named;
  if (entity.startsWith("&#x") || entity.startsWith("&#X")) {
    const code = parseInt(entity.slice(3, -1), 16);
    return isNaN(code) ? " " : String.fromCodePoint(code);
  }
  if (entity.startsWith("&#")) {
    const code = parseInt(entity.slice(2, -1), 10);
    return isNaN(code) ? " " : String.fromCodePoint(code);
  }
  return " ";
}

export function stripHtml(html: string): string {
  if (typeof html !== "string") return "";
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(BLOCK_CLOSE, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&[^;]+;/g, decodeEntity)
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

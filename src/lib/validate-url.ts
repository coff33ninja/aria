export function validateUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "Invalid URL";
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return "Only http/https URLs are allowed";
  }
  return null;
}

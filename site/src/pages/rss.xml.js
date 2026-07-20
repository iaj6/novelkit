import { getBooks } from "../lib/library";

/**
 * A quiet small press's subscription mechanism: an RSS feed of the shelf.
 * Hand-rolled — the feed is a dozen items; no integration needed.
 */
export async function GET(context) {
  const site = context.site ?? new URL("https://iaj6.github.io");
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const abs = (path) => new URL(`${base}${path}`, site).href;

  const books = getBooks().filter((b) => b.status === "complete");

  const items = books
    .map(
      (b) => `    <item>
      <title>${escapeXml(b.title)}</title>
      <link>${abs(`/book/${b.slug}/`)}</link>
      <guid isPermaLink="true">${abs(`/book/${b.slug}/`)}</guid>
      <description>${escapeXml(b.oneLine || b.blurb)}</description>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>lantern &amp; page</title>
    <link>${abs("/")}</link>
    <description>a small press of agent-drafted novels. free to read; nothing for sale.</description>
    <language>en</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}

function escapeXml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

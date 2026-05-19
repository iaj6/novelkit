import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * Astro builds run from the site/ directory (the project root for Astro).
 * The library lives at ../library/ relative to that. Using process.cwd()
 * is more robust than import.meta.url, which Vite rewrites during bundling.
 *
 * PUBLIC_BOOKS_DIR is where scripts/sync-library.sh deposits each book's
 * synced artifacts (plus generated WebP versions). The site lib peeks
 * into it to know which optimized formats exist for each book.
 */
const LIBRARY_DIR = resolve(process.cwd(), "..", "library");
const PUBLIC_BOOKS_DIR = resolve(process.cwd(), "public", "books");

export interface BookArtifacts {
  epub?: string;
  pdf?: string;
  html?: string;
  cover?: string;       // original PNG (archival)
  coverWebp?: string;   // optimized WebP for the book detail page
  coverThumb?: string;  // 600px WebP for the landing grid
  audioElevenlabs: string[];
  audioOpenai: string[];
}

export interface Book {
  slug: string;
  title: string;
  blurb: string;
  oneLine: string;
  chapterCount: number;
  hasManuscript: boolean;
  status: "draft" | "in-progress" | "complete";
  artifacts: BookArtifacts;
}

const PITCH_BLURB_MAX_CHARS = 600;
const ONE_LINE_MAX_CHARS = 180;

function safeReadFile(path: string): string {
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return "";
  }
}

function safeReadJson<T = unknown>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as T;
  } catch {
    return null;
  }
}

/**
 * Read the first prose paragraph from canon/pitch.md (skipping headings
 * and blank lines). Returns the paragraph as a single-line string, capped.
 */
function readBlurb(bookDir: string): string {
  const md = safeReadFile(join(bookDir, "canon", "pitch.md"));
  if (!md) return "";

  const lines = md.split("\n");
  let i = 0;
  // Skip leading headings and blanks.
  while (i < lines.length && (lines[i].startsWith("#") || lines[i].trim() === "")) {
    i++;
  }
  // Collect until next blank line.
  const para: string[] = [];
  while (i < lines.length && lines[i].trim() !== "") {
    para.push(lines[i].trim());
    i++;
  }

  let text = para.join(" ").trim();
  // Strip markdown emphasis markers for plain display.
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/\*([^*]+)\*/g, "$1");
  text = text.replace(/_([^_]+)_/g, "$1");

  if (text.length > PITCH_BLURB_MAX_CHARS) {
    const cut = text.slice(0, PITCH_BLURB_MAX_CHARS);
    const lastSpace = cut.lastIndexOf(" ");
    text = (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + "…";
  }
  return text;
}

// Minimum length for a candidate "first sentence". Avoids one-liners
// that turn into things like "Coldwater Reach, Maine." or "It is.".
const ONE_LINE_MIN_CHARS = 30;

// Abbreviations whose trailing period is NOT a sentence boundary. Without
// this guard, a pitch starting with "Dr. Elena Hartmann…" extracts as just
// "Dr." for the one-line summary. Add more if other pitches break.
const ABBREV_TERMINATOR_RE =
  /\b(?:Dr|Mr|Mrs|Ms|Sr|Jr|St|Mt|Lt|Capt|Gen|Sgt|Prof|vs|etc|e\.g|i\.e|U\.S|U\.K)\.$/;

/**
 * Derive a one-line summary from the blurb.
 *
 * Walks through sentence terminators; skips any that:
 *   - are part of a known abbreviation (Dr., Mr., etc.) — otherwise
 *     pitches like "Dr. Elena Hartmann…" extract as just "Dr.";
 *   - produce a candidate shorter than ONE_LINE_MIN_CHARS — otherwise
 *     "Coldwater Reach, Maine. Autumn 1943. …" extracts as just the
 *     non-informative town name.
 *
 * Falls through to the raw blurb (capped) if no acceptable boundary is
 * found in the input.
 */
export function deriveOneLine(blurb: string): string {
  if (!blurb) return "";

  let searchFrom = 0;
  while (searchFrom < blurb.length) {
    const rest = blurb.slice(searchFrom);
    // Find the next sentence terminator within the remainder.
    const m = rest.match(/[.!?]/);
    if (!m || m.index === undefined) break;

    const endPos = searchFrom + m.index + 1;
    const candidate = blurb.slice(0, endPos).trim();

    if (ABBREV_TERMINATOR_RE.test(candidate) || candidate.length < ONE_LINE_MIN_CHARS) {
      searchFrom = endPos;
      continue;
    }

    return capOneLine(candidate);
  }

  // No acceptable sentence boundary — cap the whole blurb.
  return capOneLine(blurb);
}

function capOneLine(text: string): string {
  if (text.length <= ONE_LINE_MAX_CHARS) return text;
  const cut = text.slice(0, ONE_LINE_MAX_CHARS);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + "…";
}

function countChapters(bookDir: string): number {
  const draftDir = join(bookDir, "draft");
  if (!existsSync(draftDir)) return 0;
  try {
    return readdirSync(draftDir).filter((f) => /^\d{2}-.+\.md$/.test(f)).length;
  } catch {
    return 0;
  }
}

function listMp3s(dir: string): string[] {
  if (!existsSync(dir)) return [];
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith(".mp3"))
      .sort();
  } catch {
    return [];
  }
}

/**
 * Read artifact availability from site/public/books/<slug>/ — the
 * deployed source of truth. The site bundle ships only what's here,
 * so what we report is what users actually get.
 *
 * Locally, `npm run sync` copies library/<slug>/build/* into this
 * directory (and generates WebP variants of covers). In CI/deployed,
 * whatever's been committed to public/books/ shows up.
 */
function readArtifacts(slug: string): BookArtifacts {
  const publicSlugDir = join(PUBLIC_BOOKS_DIR, slug);
  const artifacts: BookArtifacts = {
    audioElevenlabs: [],
    audioOpenai: [],
  };
  if (!existsSync(publicSlugDir)) return artifacts;

  const tryFile = (relName: string): string | undefined => {
    return existsSync(join(publicSlugDir, relName)) ? relName : undefined;
  };

  artifacts.epub = tryFile(`${slug}.epub`);
  artifacts.pdf = tryFile(`${slug}.pdf`);
  artifacts.html = tryFile(`${slug}.html`);
  artifacts.cover = tryFile("cover.png");
  artifacts.coverWebp = tryFile("cover.webp");
  artifacts.coverThumb = tryFile("cover-thumb.webp");
  artifacts.audioElevenlabs = listMp3s(join(publicSlugDir, "audiobook"));
  artifacts.audioOpenai = listMp3s(join(publicSlugDir, "audiobook-openai"));

  return artifacts;
}

function determineStatus(
  chapterCount: number,
  hasManuscript: boolean,
  artifacts: BookArtifacts
): Book["status"] {
  // Complete if any publishable artifact exists.
  if (artifacts.epub || artifacts.pdf || artifacts.html) return "complete";
  // In-progress if drafted but not published.
  if (chapterCount > 0 || hasManuscript) return "in-progress";
  return "draft";
}

interface CdkConfig {
  title?: string;
  model?: string;
  visibility?: string;
}

/**
 * Returns the public books in the library, sorted by title.
 *
 * Books are filtered by their `visibility` field in cdk.config.json:
 * only `"public"` books appear here. `"private"` (or any other / missing
 * value) is treated as not-publishable and excluded. Authors flip the
 * field with `cdk publish <dir>` / `cdk unpublish <dir>`.
 *
 * Within the included set, downloads gracefully hide when their
 * artifacts aren't present.
 */
export function getBooks(): Book[] {
  if (!existsSync(LIBRARY_DIR)) return [];

  const entries = readdirSync(LIBRARY_DIR, { withFileTypes: true });
  const books: Book[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(".")) continue;

    const slug = entry.name;
    const bookDir = join(LIBRARY_DIR, slug);
    const config = safeReadJson<CdkConfig>(join(bookDir, "cdk.config.json"));
    if (!config) continue; // Skip non-book directories.

    // Only books explicitly marked "public" appear on the site.
    // Anything else (missing field, "private", typo) → hidden.
    if (config.visibility !== "public") continue;

    const blurb = readBlurb(bookDir);
    const oneLine = deriveOneLine(blurb);
    const chapterCount = countChapters(bookDir);
    const hasManuscript = existsSync(join(bookDir, "manuscript.md"));
    const artifacts = readArtifacts(slug);

    books.push({
      slug,
      title: config.title || slug,
      blurb,
      oneLine,
      chapterCount,
      hasManuscript,
      status: determineStatus(chapterCount, hasManuscript, artifacts),
      artifacts,
    });
  }

  return books.sort((a, b) => a.title.localeCompare(b.title));
}

export function getBook(slug: string): Book | null {
  return getBooks().find((b) => b.slug === slug) ?? null;
}

/**
 * Prepend Astro's BASE_URL to a root-relative path. Use this for every
 * internal href / src so the site works whether deployed at
 * username.github.io/novelkit/ (base="/novelkit/") or at a custom
 * domain (base="/").
 *
 * Accepts paths with or without a leading slash:
 *   url("/about")  → "/novelkit/about"
 *   url("about")   → "/novelkit/about"
 */
export function url(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const tail = path.startsWith("/") ? path : `/${path}`;
  return `${base}${tail}`;
}

/**
 * Resolve a book artifact path for use as a static URL. Assumes files
 * have been synced into site/public/books/<slug>/ by scripts/sync-library.sh.
 */
export function artifactUrl(slug: string, name: string): string {
  return url(`/books/${slug}/${name}`);
}

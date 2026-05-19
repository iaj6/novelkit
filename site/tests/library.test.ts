import { describe, it, expect } from "vitest";
import {
  url,
  artifactUrl,
  deriveOneLine,
  getBooks,
  getBook,
  type Book,
} from "../src/lib/library.js";

// ── deriveOneLine — abbreviation + short-sentence handling ─────────

describe("deriveOneLine()", () => {
  it("returns empty for empty input", () => {
    expect(deriveOneLine("")).toBe("");
  });

  it("returns the first sentence for a normal blurb", () => {
    const blurb = "A literary novel set in 1943 Maine. Three POV characters intersect.";
    expect(deriveOneLine(blurb)).toBe("A literary novel set in 1943 Maine.");
  });

  it("skips the abbreviation 'Dr.' at the start of the blurb", () => {
    // Real bug from the-cold-signal: pitch starts with "Dr. Elena Hartmann…"
    // and our old regex extracted just "Dr.".
    const blurb =
      "Dr. Elena Hartmann, sixty-four, is a career astrobiologist who has spent thirty years at radio observatories.";
    const out = deriveOneLine(blurb);
    expect(out).not.toBe("Dr.");
    expect(out).toContain("Elena Hartmann");
  });

  it("skips other common abbreviations", () => {
    for (const abbrev of ["Mr", "Mrs", "Ms", "St", "Jr", "Sr", "Mt", "Lt", "Capt", "Prof"]) {
      const blurb = `${abbrev}. Someone has been doing something interesting for years.`;
      const out = deriveOneLine(blurb);
      expect(out).not.toBe(`${abbrev}.`);
      expect(out).toContain("Someone");
    }
  });

  it("skips a too-short first sentence and pulls more", () => {
    // Real case from coldwater-reach-v031: "Coldwater Reach, Maine. Autumn 1943. …"
    const blurb =
      "Coldwater Reach, Maine. Autumn 1943. A man's body washes up on the breakwater.";
    const out = deriveOneLine(blurb);
    // First sentence is only 24 chars (< MIN_LEN=30) so it gets skipped.
    expect(out).not.toBe("Coldwater Reach, Maine.");
    expect(out).toContain("Autumn 1943");
  });

  it("caps long results at the max-chars limit", () => {
    const blurb =
      "A literary novel of considerable length describing many things in great detail without ever pausing to breathe or letting up on the relentless cascade of subordinate clauses that somehow keep coming.";
    const out = deriveOneLine(blurb);
    expect(out.endsWith("…")).toBe(true);
  });

  it("handles a blurb with no terminator at all", () => {
    const blurb = "Just words without any punctuation just a flow of words";
    expect(deriveOneLine(blurb)).toBe("Just words without any punctuation just a flow of words");
  });

  it("respects ? and ! terminators when the sentence is long enough", () => {
    // "What are you doing here today?" is exactly 30 chars — at the threshold.
    expect(deriveOneLine("What are you doing here today? She asked again.")).toBe(
      "What are you doing here today?"
    );
  });

  it("treats short exclamations the same as short statements (extends them)", () => {
    // "Get out of here right now!" is only 26 chars; below MIN_LEN, so the
    // function keeps walking to the next sentence to get something useful.
    const out = deriveOneLine("Get out of here right now! She turned away.");
    expect(out).toContain("Get out of here right now");
    expect(out).toContain("turned away");
  });
});

// ── url() / artifactUrl() — pure helpers, base-aware ────────────────

describe("url()", () => {
  it("prepends the BASE_URL to a leading-slash path", () => {
    const out = url("/about");
    expect(out.endsWith("/about")).toBe(true);
  });

  it("normalizes a path without a leading slash", () => {
    const a = url("/about");
    const b = url("about");
    expect(a).toBe(b);
  });

  it("handles a root '/' input", () => {
    const out = url("/");
    // The result is the base URL with a trailing slash.
    expect(out.endsWith("/")).toBe(true);
  });

  it("preserves nested paths", () => {
    expect(url("/book/coldwater-reach/").endsWith("/book/coldwater-reach/")).toBe(true);
  });
});

describe("artifactUrl()", () => {
  it("composes a /books/<slug>/<file> path", () => {
    const out = artifactUrl("coldwater-reach", "cover.webp");
    expect(out.endsWith("/books/coldwater-reach/cover.webp")).toBe(true);
  });

  it("includes the base prefix when present", () => {
    const out = artifactUrl("x", "cover.png");
    const u = url("/books/x/cover.png");
    expect(out).toBe(u);
  });
});

// ── getBooks() / getBook() — integration against the real library/ ──
//
// These tests rely on the committed library/ fixtures. They exercise the
// full helper chain (readBlurb, deriveOneLine, countChapters, listMp3s,
// determineStatus) without per-test fs setup, since the library is a
// stable input.

describe("getBooks() (against real library/)", () => {
  const books = getBooks();

  it("returns at least one book", () => {
    expect(books.length).toBeGreaterThan(0);
  });

  it("books are sorted alphabetically by title", () => {
    const titles = books.map((b) => b.title);
    const sorted = [...titles].sort((a, b) => a.localeCompare(b));
    expect(titles).toEqual(sorted);
  });

  it("each book has a non-empty slug and title", () => {
    for (const b of books) {
      expect(b.slug).toBeTruthy();
      expect(b.title).toBeTruthy();
    }
  });

  it("each book has a status from the expected enum", () => {
    const allowed = new Set(["draft", "in-progress", "complete"]);
    for (const b of books) {
      expect(allowed.has(b.status)).toBe(true);
    }
  });

  it("each book has an artifacts object with the expected shape", () => {
    for (const b of books) {
      expect(b.artifacts).toBeTruthy();
      expect(Array.isArray(b.artifacts.audioElevenlabs)).toBe(true);
      expect(Array.isArray(b.artifacts.audioOpenai)).toBe(true);
    }
  });

  it("coldwater-reach has 30 chapters", () => {
    const cw = books.find((b) => b.slug === "coldwater-reach");
    expect(cw).toBeDefined();
    expect(cw!.chapterCount).toBe(30);
  });

  it("books with chapters have non-empty blurb and oneLine", () => {
    const withChapters = books.filter((b) => b.chapterCount > 0);
    expect(withChapters.length).toBeGreaterThan(0);
    for (const b of withChapters) {
      expect(b.blurb.length).toBeGreaterThan(0);
      expect(b.oneLine.length).toBeGreaterThan(0);
      // oneLine should be a single sentence or less; no internal paragraph breaks.
      expect(b.oneLine).not.toContain("\n\n");
    }
  });

  it("oneLine is shorter than blurb (or equal if blurb is one sentence)", () => {
    for (const b of getBooks()) {
      if (b.blurb && b.oneLine) {
        expect(b.oneLine.length).toBeLessThanOrEqual(b.blurb.length);
      }
    }
  });

  it("blurb does not contain markdown emphasis markers", () => {
    for (const b of getBooks()) {
      if (b.blurb) {
        expect(b.blurb).not.toContain("**");
        // Single `*` and `_` are stripped, so they should be absent
        // outside of legitimate punctuation contexts.
      }
    }
  });
});

describe("getBook()", () => {
  it("returns a book by slug", () => {
    const b = getBook("coldwater-reach");
    expect(b).not.toBeNull();
    expect(b!.slug).toBe("coldwater-reach");
  });

  it("returns null for an unknown slug", () => {
    expect(getBook("does-not-exist")).toBeNull();
  });

  it("returns null for a private (unpublished) book even if it exists on disk", () => {
    // tiny-toy is in library/ but its cdk.config.json has visibility="private",
    // so it should not be reachable through getBook either.
    expect(getBook("tiny-toy")).toBeNull();
  });
});

// ── visibility filter ──────────────────────────────────────────────

describe("visibility filtering", () => {
  it("excludes books with visibility !== 'public'", () => {
    const slugs = new Set(getBooks().map((b) => b.slug));
    // These are the books currently flagged private; they must NOT appear.
    expect(slugs.has("coldwater-reach-v031")).toBe(false);
    expect(slugs.has("the-hollowback")).toBe(false);
    expect(slugs.has("tiny-toy")).toBe(false);
  });

  it("includes books with visibility === 'public'", () => {
    const slugs = new Set(getBooks().map((b) => b.slug));
    // These are the currently published books — at least these should appear.
    expect(slugs.has("coldwater-reach")).toBe(true);
    expect(slugs.has("the-cold-signal")).toBe(true);
    expect(slugs.has("vilcabamba-expedition")).toBe(true);
    expect(slugs.has("tiny-toy-output")).toBe(true);
  });

  it("does not show duplicate titles on the landing", () => {
    // The whole reason we added visibility: hide in-progress siblings so a
    // user doesn't see "Coldwater Reach" listed twice on the landing.
    const titles = getBooks().map((b) => b.title);
    const dupes = titles.filter((t, i) => titles.indexOf(t) !== i);
    expect(dupes).toEqual([]);
  });
});

// ── status detection ────────────────────────────────────────────────

describe("book status determination", () => {
  it("at least one book has 'complete' or 'in-progress' status", () => {
    const books = getBooks();
    const advanced = books.filter(
      (b) => b.status === "complete" || b.status === "in-progress"
    );
    expect(advanced.length).toBeGreaterThan(0);
  });

  it("a book reports artifacts.cover/coverWebp/coverThumb consistently with its slug", () => {
    for (const b of getBooks()) {
      if (b.artifacts.cover) {
        expect(b.artifacts.cover).toBe("cover.png");
      }
      if (b.artifacts.coverWebp) {
        expect(b.artifacts.coverWebp).toBe("cover.webp");
      }
      if (b.artifacts.coverThumb) {
        expect(b.artifacts.coverThumb).toBe("cover-thumb.webp");
      }
    }
  });
});

// Type-check: Book shape is exported correctly.
describe("Book type", () => {
  it("includes the expected fields when sampled", () => {
    const b: Book = getBooks()[0];
    expect(b).toHaveProperty("slug");
    expect(b).toHaveProperty("title");
    expect(b).toHaveProperty("blurb");
    expect(b).toHaveProperty("oneLine");
    expect(b).toHaveProperty("chapterCount");
    expect(b).toHaveProperty("hasManuscript");
    expect(b).toHaveProperty("status");
    expect(b).toHaveProperty("artifacts");
  });
});

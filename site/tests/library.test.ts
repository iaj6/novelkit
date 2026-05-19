import { describe, it, expect } from "vitest";
import {
  url,
  artifactUrl,
  getBooks,
  getBook,
  type Book,
} from "../src/lib/library.js";

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

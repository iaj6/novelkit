import { describe, it, expect, vi, beforeEach } from "vitest";

// Audio (and the tts manifest) are gitignored under public/books, so the real
// library/ fixtures can never exercise getAudiobook's populated path in CI.
// Mock node:fs so we can drive that path (and listMp3s's readdir/sort/catch)
// deterministically. vi.mock is file-scoped, so the real-fs integration tests
// in library.test.ts are unaffected.
vi.mock("node:fs", () => ({
  existsSync: vi.fn(() => false),
  readdirSync: vi.fn(() => []),
  readFileSync: vi.fn(() => {
    throw new Error("ENOENT");
  }),
}));

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { getAudiobook } from "../src/lib/library.js";

const existsMock = vi.mocked(existsSync);
const readdirMock = vi.mocked(readdirSync);
const readFileMock = vi.mocked(readFileSync);

const endsWith = (p: unknown, suffix: string) => String(p).endsWith(suffix);

beforeEach(() => {
  vi.clearAllMocks();
  existsMock.mockReturnValue(false);
  readdirMock.mockReturnValue([] as never);
  readFileMock.mockImplementation(() => {
    throw new Error("ENOENT");
  });
});

describe("getAudiobook() populated paths (fs mocked)", () => {
  it("prefers the ElevenLabs audiobook/ dir and labels tracks from the tts manifest", () => {
    existsMock.mockImplementation((p) => endsWith(p, "/audiobook"));
    readdirMock.mockImplementation((p) =>
      (endsWith(p, "/audiobook") ? ["02-chapter.mp3", "01-the-finding.mp3", "notes.txt"] : []) as never
    );
    readFileMock.mockImplementation((p) => {
      if (endsWith(p, "manifest.json")) {
        return JSON.stringify({ chapters: [{ slug: "01-the-finding", title: "The Finding" }] });
      }
      throw new Error("ENOENT");
    });

    const ab = getAudiobook("somebook");
    expect(ab).not.toBeNull();
    expect(ab!.source).toBe("audiobook");
    // non-mp3 filtered out; results sorted
    expect(ab!.tracks.map((t) => t.file)).toEqual(["01-the-finding.mp3", "02-chapter.mp3"]);
    // manifest title wins for the matching slug; humanized fallback otherwise
    expect(ab!.tracks[0].label).toBe("The Finding");
    expect(ab!.tracks[1].label).toBe("Chapter 2");
  });

  it("falls back to audiobook-openai/ and humanized labels when audiobook/ is empty and no manifest exists", () => {
    existsMock.mockImplementation((p) => endsWith(p, "/audiobook-openai"));
    readdirMock.mockImplementation((p) =>
      (endsWith(p, "/audiobook-openai") ? ["01-a.mp3"] : []) as never
    );
    // readFileMock left throwing → safeReadJson returns null → manifest?.chapters ?? []

    const ab = getAudiobook("b");
    expect(ab).not.toBeNull();
    expect(ab!.source).toBe("audiobook-openai");
    expect(ab!.tracks[0].label).toBe("1 · a");
  });

  it("skips manifest chapters missing a slug or title and humanizes those tracks", () => {
    existsMock.mockImplementation((p) => endsWith(p, "/audiobook"));
    readdirMock.mockImplementation((p) =>
      (endsWith(p, "/audiobook") ? ["01-x.mp3", "02-y.mp3"] : []) as never
    );
    readFileMock.mockImplementation((p) => {
      if (endsWith(p, "manifest.json")) {
        return JSON.stringify({
          chapters: [{ slug: "01-x" }, { title: "Orphan" }, { slug: "02-y", title: "Has Both" }],
        });
      }
      throw new Error("ENOENT");
    });

    const ab = getAudiobook("b");
    expect(ab!.tracks[0].label).toBe("1 · x"); // slug present, title missing → not mapped → humanized
    expect(ab!.tracks[1].label).toBe("Has Both");
  });

  it("returns null when the directory read throws (listMp3s catch path)", () => {
    existsMock.mockImplementation((p) => endsWith(p, "/audiobook"));
    readdirMock.mockImplementation((p) => {
      if (endsWith(p, "/audiobook")) throw new Error("EACCES");
      return [] as never;
    });

    expect(getAudiobook("b")).toBeNull();
  });

  it("returns null when neither audio directory exists", () => {
    // all mocks default to absent/empty
    expect(getAudiobook("b")).toBeNull();
  });
});

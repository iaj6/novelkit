import type { ManuscriptChapter } from "../manuscript.js";
import type { ColdRead } from "./schema.js";

export const QUOTE_VERDICTS = ["exact", "near", "misattributed", "absent"] as const;
export type QuoteVerdict = (typeof QUOTE_VERDICTS)[number];

export type QuoteCheck = {
  lens: string;
  chapter: string;
  text: string;
  verdict: QuoteVerdict;
  /** Set when the quote was found in a chapter other than the one cited. */
  foundIn?: string;
};

export type LensTally = {
  lens: string;
  exact: number;
  near: number;
  misattributed: number;
  absent: number;
  /** Chapter refs in strongest/weakest that do not resolve to a real chapter. */
  badChapterRefs: string[];
};

/**
 * Book-INDEPENDENT health metrics for the panel itself.
 *
 * These exist because the natural way to judge a review panel — "did it find the
 * defects I already know about in this manuscript?" — measures the book, not the
 * harness, and does not transfer to the next book. These do: they can be computed for
 * any manuscript and compared across the whole library.
 */
export type PanelHealth = {
  lenses: number;
  scores: { min: number; max: number; mean: number; spread: number };
  /** would_finish verdict -> count. */
  finish: Record<string, number>;
  claims: { strongest: number; weakest: number; fewestWeaknessesOnALens: number };
  quotes: { total: number; fabricationRate: number };
  /** Human-readable warnings about the PANEL, not the book. Empty is good. */
  flags: string[];
};

export type VerificationReport = {
  generated_at: string;
  per_lens: LensTally[];
  /** Every quote that is not `exact` — the ones a synthesizer must discount. */
  problems: QuoteCheck[];
  totals: { exact: number; near: number; misattributed: number; absent: number };
  panel_health: PanelHealth;
};

/** A panel whose scores cluster this tightly is suspect: one judgement in N costumes. */
export const MIN_HEALTHY_SPREAD = 1.5;
/** Below this, "the panel agreed" is not a meaningful statement. */
export const MIN_USEFUL_LENSES = 3;

export function computePanelHealth(reads: ColdRead[], totals: VerificationReport["totals"]): PanelHealth {
  const scores = reads.map((r) => r.score_out_of_10);
  const min = scores.length ? Math.min(...scores) : 0;
  const max = scores.length ? Math.max(...scores) : 0;
  const mean = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const spread = max - min;

  const finish: Record<string, number> = {};
  for (const r of reads) finish[r.would_finish] = (finish[r.would_finish] ?? 0) + 1;

  const weakestCounts = reads.map((r) => r.weakest.length);
  const quoteTotal = totals.exact + totals.near + totals.misattributed + totals.absent;
  const fabricationRate = quoteTotal === 0 ? 0 : totals.absent / quoteTotal;

  const flags: string[] = [];
  if (reads.length < MIN_USEFUL_LENSES) {
    flags.push(
      `only ${reads.length} lens${reads.length === 1 ? "" : "es"} — too few for agreement to mean anything`
    );
  } else if (spread < MIN_HEALTHY_SPREAD) {
    flags.push(
      `score spread ${spread.toFixed(1)} is narrow — lenses with different priorities returned nearly the same number, which can indicate one judgement in several costumes rather than independent reads`
    );
  }
  if (totals.absent > 0) {
    flags.push(
      `${totals.absent} fabricated quote${totals.absent === 1 ? "" : "s"} (${(fabricationRate * 100).toFixed(1)}%) — discount the affected lenses`
    );
  }
  if (totals.misattributed > 0) {
    flags.push(`${totals.misattributed} misattributed quote${totals.misattributed === 1 ? "" : "s"}`);
  }
  if (quoteTotal === 0) flags.push("no quotes cited — nothing in this panel is mechanically checkable");

  return {
    lenses: reads.length,
    scores: { min, max, mean: Number(mean.toFixed(2)), spread: Number(spread.toFixed(2)) },
    finish,
    claims: {
      strongest: reads.reduce((n, r) => n + r.strongest.length, 0),
      weakest: reads.reduce((n, r) => n + r.weakest.length, 0),
      fewestWeaknessesOnALens: weakestCounts.length ? Math.min(...weakestCounts) : 0,
    },
    quotes: { total: quoteTotal, fabricationRate: Number(fabricationRate.toFixed(4)) },
    flags,
  };
}

/**
 * Collapse whitespace runs to a single space. This is the ONLY difference forgiven
 * at the `exact` tier: reviewers reproduce quotes without the source's line wrapping,
 * which is not a fidelity problem. Everything else must match character for character.
 */
export function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Additionally fold typographic variants. A reviewer who retypes a curly quote as a
 * straight one, or an em dash as a hyphen, is sloppy but is not inventing text — that
 * is a materially different failure from fabrication and gets its own tier.
 */
export function normalizeTypography(s: string): string {
  return normalizeWhitespace(s)
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[‐-―−]/g, "-")
    .replace(/…/g, "...");
}

/**
 * Resolve a reviewer's chapter reference to a chapter.
 *
 * Reviewers are handed project-relative PATHS to read ("draft/04-the-file-opens.md")
 * and cite what they were given, while chapter ids are bare slugs
 * ("04-the-file-opens"). Comparing the two forms directly marked 24 of 29 correctly
 * attributed quotes as "misattributed" on the first full panel run — a pure
 * false-positive machine, and exactly the failure this harness exists to avoid.
 *
 * So accept the forms a reviewer plausibly writes: the bare id, a path, a filename,
 * any case, or a chapter number. Anything still unresolved is treated as a real
 * attribution failure, not silently forgiven.
 */
export function resolveChapterRef(
  ref: string,
  chapters: ManuscriptChapter[]
): ManuscriptChapter | undefined {
  const raw = ref.trim();
  if (!raw) return undefined;

  const exact = chapters.find((c) => c.id === raw);
  if (exact) return exact;

  // "draft/09-the-bracket.md" / "revision-1/09-the-bracket.md" / "09-the-bracket.md"
  const base = raw.split("/").pop()!.replace(/\.md$/i, "");
  const byBase = chapters.find((c) => c.id === base);
  if (byBase) return byBase;

  const lower = base.toLowerCase();
  const byCase = chapters.find((c) => c.id.toLowerCase() === lower);
  if (byCase) return byCase;

  // "09", "9", "Chapter 9", "ch. 09" — only when it identifies exactly one chapter.
  const num = lower.match(/\d{1,3}/);
  if (num) {
    const padded = String(parseInt(num[0], 10)).padStart(2, "0");
    const hits = chapters.filter((c) => c.id.startsWith(`${padded}-`));
    if (hits.length === 1) return hits[0];
  }
  return undefined;
}

/**
 * Classify one quote against the manuscript.
 *
 * Tiers, in order:
 *   exact         — substring of the cited chapter after whitespace collapse
 *   near          — substring of the cited chapter after typographic folding too
 *   misattributed — matches some OTHER chapter (reviewer read the book, mislabeled it)
 *   absent        — matches nowhere (reviewer invented it)
 *
 * Separating `misattributed` from `absent` matters: the first discredits a citation,
 * the second discredits the reviewer.
 */
export function classifyQuote(
  quoteText: string,
  citedChapter: string,
  chapters: ManuscriptChapter[]
): { verdict: QuoteVerdict; foundIn?: string } {
  const needleWs = normalizeWhitespace(quoteText);
  const needleTypo = normalizeTypography(quoteText);
  if (needleWs.length === 0) return { verdict: "absent" };

  const cited = resolveChapterRef(citedChapter, chapters);
  if (cited) {
    if (normalizeWhitespace(cited.text).includes(needleWs)) return { verdict: "exact" };
    if (normalizeTypography(cited.text).includes(needleTypo)) return { verdict: "near" };
  }

  for (const c of chapters) {
    if (cited && c.id === cited.id) continue;
    if (normalizeTypography(c.text).includes(needleTypo)) {
      return { verdict: "misattributed", foundIn: c.id };
    }
  }
  return { verdict: "absent" };
}

/** Chapter refs on strongest/weakest claims that do not name a real chapter. */
export function verifyChapterRefs(read: ColdRead, chapters: ManuscriptChapter[]): string[] {
  const refs = [...read.strongest, ...read.weakest].flatMap((c) => c.chapters);
  // Same resolver as quotes, so a path-form ref is not reported as a broken ref.
  return Array.from(new Set(refs.filter((r) => !resolveChapterRef(r, chapters))));
}

/**
 * Deterministic verification of a whole panel. Pure over its inputs (the timestamp
 * is supplied by the caller) so it is trivially testable.
 */
export function verifyPanel(
  reads: ColdRead[],
  chapters: ManuscriptChapter[],
  generatedAt: string
): VerificationReport {
  const per_lens: LensTally[] = [];
  const problems: QuoteCheck[] = [];
  const totals = { exact: 0, near: 0, misattributed: 0, absent: 0 };

  for (const read of reads) {
    const tally: LensTally = {
      lens: read.lens,
      exact: 0,
      near: 0,
      misattributed: 0,
      absent: 0,
      badChapterRefs: verifyChapterRefs(read, chapters),
    };
    for (const q of read.quotes) {
      const { verdict, foundIn } = classifyQuote(q.text, q.chapter, chapters);
      tally[verdict] += 1;
      totals[verdict] += 1;
      if (verdict !== "exact") {
        problems.push({ lens: read.lens, chapter: q.chapter, text: q.text, verdict, foundIn });
      }
    }
    per_lens.push(tally);
  }

  return {
    generated_at: generatedAt,
    per_lens,
    problems,
    totals,
    panel_health: computePanelHealth(reads, totals),
  };
}

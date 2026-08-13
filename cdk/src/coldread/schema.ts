import { z } from "zod";

export const FINISH_VERDICTS = ["yes", "no", "reluctantly", "skimmed"] as const;
export type FinishVerdict = (typeof FINISH_VERDICTS)[number];

/**
 * A quote a reviewer leans on. Every one of these is mechanically checked against
 * the manuscript, so the reviewer is told to quote short and quote exactly.
 */
export const ColdReadQuoteSchema = z.object({
  chapter: z.string().describe("Chapter id the quote comes from, e.g. '09-the-bracket'."),
  text: z.string().describe("Verbatim excerpt. Short. Will be mechanically verified."),
  why: z.string().describe("What this quote demonstrates."),
});
export type ColdReadQuote = z.infer<typeof ColdReadQuoteSchema>;

/**
 * A judgement with chapter refs attached, so the claim is locatable and the auditor
 * has somewhere to look. Code cannot verify the claim itself, but it can verify the
 * chapters are real.
 *
 * `chapters` is a LIST, not a single id. An earlier single-anchor version made
 * cross-chapter observations awkward to express, and on the first full panel run the
 * two defects the harness most needed to surface were both cross-chapter — an
 * anachronism spanning five chapters and a fact contradiction between two. A schema
 * that cannot comfortably hold a finding suppresses it.
 */
export const ColdReadClaimSchema = z.object({
  chapters: z
    .array(z.string())
    .min(1)
    .describe(
      "Chapter ids this claim covers, e.g. ['22-nine-numbered']. List every chapter when the issue spans several."
    ),
  claim: z.string(),
});
export type ColdReadClaim = z.infer<typeof ColdReadClaimSchema>;

export const ColdReadSchema = z.object({
  lens: z.string(),
  score_out_of_10: z.number().min(0).max(10),
  would_finish: z.enum(FINISH_VERDICTS),
  verdict: z.string().describe("2-4 paragraph honest assessment in the lens voice."),
  // A floor of 3, not 1. The prototype this harness replaces asked for "3-5 specific
  // weaknesses" and its reviewers surfaced concrete defects (a stray template
  // placeholder, an anachronistic street name). Relaxing the floor to 1 let a reviewer
  // who liked the book stop at a single high-level reservation, and the same defects
  // went unreported. The floor is what makes a reviewer keep digging.
  strongest: z.array(ColdReadClaimSchema).min(3).describe("3-5 specific strengths."),
  weakest: z
    .array(ColdReadClaimSchema)
    .min(3)
    .describe(
      "3-5 specific weaknesses. Keep looking until you have at least three; include concrete " +
        "defects (contradictions, anachronisms, editorial artifacts left in the text), not only " +
        "high-level reservations."
    ),
  quotes: z.array(ColdReadQuoteSchema),
  put_down_points: z
    .array(z.string())
    .describe("Chapters or moments where a reader would stop. Empty array if none."),
  who_is_this_for: z.string(),
});
export type ColdRead = z.infer<typeof ColdReadSchema>;

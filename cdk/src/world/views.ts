import type { WorldTables, ProjectedFact } from "./project.js";

/**
 * Markdown VIEWS exported from the world-model. These let press/ and human
 * readers keep consuming familiar markdown while the store is the source of
 * truth — the store is never read directly by press.
 *
 * M2 ships only the two that earn it: renderCanonContinuity (the ONE press-
 * critical view — press/build_cover_prompt.py reads canon/continuity.md) and
 * renderGlossary (a strict improvement: actually alphabetized + deduped). The
 * other four legacy logs (story-arc / scene-log / chapter-craft / drafted
 * continuity) are deferred until a consumer wants them.
 *
 * Pure functions: same tables -> identical markdown.
 */

const CONTINUITY_PREAMBLE = "Hard facts that must not break in later drafting. These are binding.";
const GLOSSARY_PREAMBLE = "Alphabetical. Definitions are brief and specific to this story's usage.";
export const LEDGER_SENTINEL = "Store-derived; do not edit by hand.";
const LEDGER_PREAMBLE =
  "The accumulating fact ledger — every durable fact established so far, by chapter. Later drafting must stay consistent with these. " +
  LEDGER_SENTINEL;

function renderFactLine(f: ProjectedFact): string {
  // Imported / free-text facts are stored whole under the "statement" attribute.
  if (f.attribute === "statement") return String(f.value);
  // Atomized facts (entity.attribute = value), as the drafter will produce later.
  const unit = f.unit ? ` ${f.unit}` : "";
  const neg = f.polarity === "negated" ? "not " : "";
  return `${f.entity} — ${f.attribute}: ${neg}${String(f.value)}${unit}`;
}

/**
 * Render the live canon-tier facts as canon/continuity.md — the press-critical
 * view. Preserves event/import order (the authored numbering); superseded,
 * retracted, and drafted-tier facts are excluded.
 */
export function renderCanonContinuity(tables: WorldTables): string {
  const canon = [...tables.facts.values()].filter((f) => f.status === "live" && f.tier === "canon");
  const body = canon.length
    ? canon.map((f, i) => `${i + 1}. ${renderFactLine(f)}`).join("\n")
    : "(none yet)";
  return `# Continuity\n\n${CONTINUITY_PREAMBLE}\n\n${body}\n`;
}

/**
 * Render the live DRAFTED-tier facts as logs/continuity.md — the accreting ledger
 * the drafter reads while writing later chapters (the store-derived replacement for
 * the hand-appended markdown). Grouped by provenance chapter (codepoint order =
 * reading order via the NN- prefix); within a chapter, event order. Canon-tier,
 * superseded, and retracted facts are excluded. Pure: same tables -> identical
 * markdown — no wall-clock, unlike the legacy `## <ISO timestamp>` blocks.
 */
export function renderFactLedger(tables: WorldTables): string {
  const byChapter = new Map<string, ProjectedFact[]>();
  for (const f of tables.facts.values()) {
    if (f.status !== "live" || f.tier !== "drafted") continue;
    const arr = byChapter.get(f.provenance.chapter);
    if (arr) arr.push(f);
    else byChapter.set(f.provenance.chapter, [f]);
  }
  const chapters = [...byChapter.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const body = chapters.length
    ? chapters
        .map((ch) => `## ${ch}\n${byChapter.get(ch)!.map((f) => `- ${renderFactLine(f)}`).join("\n")}`)
        .join("\n\n")
    : "(none yet)";
  return `# Continuity ledger\n\n${LEDGER_PREAMBLE}\n\n${body}\n`;
}

/**
 * Render entities (those with a gloss) as canon/glossary.md — alphabetized by
 * display_name using codepoint order (locale-independent, matching the store's
 * determinism guarantee) and deduped (entities are unique by id). Fixes the
 * legacy log's decaying-order + duplicate-term drift.
 */
export function renderGlossary(tables: WorldTables): string {
  const entries = [...tables.entities.values()]
    .filter((e) => e.short_gloss !== undefined && e.short_gloss !== "")
    .sort((a, b) => (a.display_name < b.display_name ? -1 : a.display_name > b.display_name ? 1 : 0))
    .map((e) => `**${e.display_name}** — ${e.short_gloss}`);
  const body = entries.length ? entries.join("\n\n") : "(none yet)";
  return `# Glossary\n\n${GLOSSARY_PREAMBLE}\n\n---\n\n${body}\n`;
}

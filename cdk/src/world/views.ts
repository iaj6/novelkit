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

/**
 * Hand-rolled ANSI escape helpers — no dependency.
 *
 * Auto-disables when stdout isn't a TTY (e.g. piped into a file or `tee`)
 * so logs stay clean. Honors the standard NO_COLOR and FORCE_COLOR env
 * conventions.
 *
 * The phase() helper assigns each CDK phase a distinct color so the
 * run log is scannable at a glance during long runs.
 */

const enabled: boolean = (() => {
  if (process.env.NO_COLOR != null) return false;
  if (process.env.FORCE_COLOR != null) return true;
  return Boolean(process.stdout.isTTY);
})();

function wrap(open: string, close: string): (text: string) => string {
  return (text: string) =>
    enabled ? `\x1b[${open}m${text}\x1b[${close}m` : text;
}

// Styles
export const bold = wrap("1", "22");
export const dim = wrap("2", "22");
export const italic = wrap("3", "23");

// 8-color foreground
export const red = wrap("31", "39");
export const green = wrap("32", "39");
export const yellow = wrap("33", "39");
export const blue = wrap("34", "39");
export const magenta = wrap("35", "39");
export const cyan = wrap("36", "39");
export const gray = wrap("90", "39");

// Bright variants
export const brightRed = wrap("91", "39");
export const brightGreen = wrap("92", "39");
export const brightYellow = wrap("93", "39");
export const brightBlue = wrap("94", "39");
export const brightCyan = wrap("96", "39");

/**
 * Bracketed, color-coded phase prefix used in every CLI log line.
 * Picks a distinct color per phase for at-a-glance scanning:
 *   architect → cyan (planning)
 *   plotter   → magenta (structure)
 *   threads   → blue (weaving)
 *   drafter   → yellow (the warm act of writing)
 *   editor-*  → green (refinement)
 *   reader    → cyan (overview)
 *   audit/repair → magenta / red (investigative / corrective)
 */
export function phase(name: string): string {
  if (name === "architect") return brightCyan(`[${name}]`);
  if (name === "plotter") return magenta(`[${name}]`);
  if (name === "threads") return blue(`[${name}]`);
  if (name === "drafter") return brightYellow(`[${name}]`);
  if (name.startsWith("editor")) return green(`[${name}]`);
  if (name === "reader") return cyan(`[${name}]`);
  if (name === "continuity-fact-audit") return magenta(`[${name}]`);
  if (name === "repair-fact-normalize") return red(`[${name}]`);
  return `[${name}]`;
}

/** Format a USD cost amount in green. */
export function cost(usd: number, digits = 4): string {
  return green(`$${usd.toFixed(digits)}`);
}

/** Whether colors are actually being emitted (for tests / diagnostics). */
export const colorEnabled: boolean = enabled;

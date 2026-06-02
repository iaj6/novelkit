import { runAgent } from "../agentRunner.js";
import { loadState, isComplete, markComplete } from "../state.js";

export async function runResearcher(projectRoot: string) {
  const state = await loadState(projectRoot);
  if (isComplete(state, "researcher")) {
    console.log("[researcher] already complete — skipping (use `cdk run --force` to re-run)");
    return;
  }
  const result = await runAgent({
    phase: "researcher",
    projectRoot,
    userPrompt:
      "Read brief.md, then ground its fact-heavy elements in primary sources. Produce canon/research.md (topic-organized, with inline [cite:NN] citations) and canon/research-bibliography.md. Classify the brief's domain before designing your sections — your dossier shape must come from the brief, not from any default template. Run the citation self-audit before stopping. Then stop.",
  });
  await markComplete(state, projectRoot, "researcher");
  return result;
}

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

/**
 * Surface which credential / billing path a run will use, so a stray
 * `ANTHROPIC_API_KEY` can't silently route a long run onto pay-as-you-go API
 * credits instead of the Claude subscription. (The Agent SDK ranks an env API
 * key ABOVE subscription OAuth — confirmed the hard way: a ~13.5h run billed ~$74
 * to credits before "Credit balance is too low" killed it mid-run.)
 *
 * This is a PRE-FLIGHT HEURISTIC for the banner; it cannot know what the SDK will
 * actually resolve. The authoritative answer is the SDK's `system`/`init` message
 * `apiKeySource`, surfaced once per run by agentRunner as the `auth:` line. This
 * never unsets the key, never blocks the run — it warns only.
 */
export type BillingMode = {
  /** Best-effort label for the banner. */
  label: string;
  /** True when an env credential will route to pay-as-you-go API billing, overriding any subscription. */
  apiKeyInEnv: boolean;
  /** True when a Claude Code subscription login was found on disk. */
  subscriptionLoginPresent: boolean;
  /** A warning to print when an env key will silently override a subscription, else null. */
  warning: string | null;
};

/** True if a Claude Code subscription OAuth login exists on disk (~/.claude/.credentials.json, or an oauthAccount in ~/.claude.json). */
export function hasSubscriptionLogin(home: string = os.homedir()): boolean {
  try {
    if (fs.existsSync(path.join(home, ".claude", ".credentials.json"))) return true;
  } catch {
    /* ignore */
  }
  try {
    const dotClaude = path.join(home, ".claude.json");
    // Cheap substring scan instead of a full JSON.parse of a ~120KB-and-growing file, just to
    // detect the top-level oauthAccount key on the pre-run banner path.
    if (fs.existsSync(dotClaude) && /"oauthAccount"\s*:/.test(fs.readFileSync(dotClaude, "utf-8"))) {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

const isSet = (v: string | undefined): boolean => typeof v === "string" && v.trim().length > 0;
// Match the SDK's truthiness (1/true/yes/on, case-insensitive, trimmed) so the banner agrees
// with where the run actually routes — under-recognizing a flag mislabels the billing path.
const isOn = (v: string | undefined): boolean =>
  typeof v === "string" && ["1", "true", "yes", "on"].includes(v.trim().toLowerCase());

/**
 * Classify the billing/credential mode from the environment + whether a subscription
 * login exists. Pure and injectable for tests (pass `env` and `subscriptionLoginPresent`).
 */
export function detectBillingMode(
  env: NodeJS.ProcessEnv = process.env,
  subscriptionLoginPresent: boolean = hasSubscriptionLogin()
): BillingMode {
  const apiKeyInEnv = isSet(env.ANTHROPIC_API_KEY) || isSet(env.ANTHROPIC_AUTH_TOKEN);
  const bedrock = isOn(env.CLAUDE_CODE_USE_BEDROCK);
  const vertex = isOn(env.CLAUDE_CODE_USE_VERTEX);

  let label: string;
  if (bedrock) label = "AWS Bedrock (env)";
  else if (vertex) label = "Google Vertex (env)";
  else if (apiKeyInEnv) label = "API key in env — pay-as-you-go";
  else if (subscriptionLoginPresent) label = "Claude subscription (OAuth login)";
  else label = "unknown (no env key, no subscription login found)";

  // Only warn when the env key would ACTUALLY be the billing path: under Bedrock/Vertex routing the
  // stray key does not bill pay-as-you-go, so the override warning would be a false alarm.
  const warning =
    apiKeyInEnv && subscriptionLoginPresent && !bedrock && !vertex
      ? "ANTHROPIC_API_KEY/AUTH_TOKEN in env OVERRIDES your Claude subscription and bills pay-as-you-go. Unset it to use the subscription."
      : null;

  return { label, apiKeyInEnv, subscriptionLoginPresent, warning };
}

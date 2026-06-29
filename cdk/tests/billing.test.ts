import { describe, it, expect } from "vitest";
import { detectBillingMode } from "../src/billing.js";

const env = (o: Record<string, string>): NodeJS.ProcessEnv => o as NodeJS.ProcessEnv;

describe("detectBillingMode", () => {
  it("warns when an env API key would override an existing subscription login", () => {
    const m = detectBillingMode(env({ ANTHROPIC_API_KEY: "sk-ant-test" }), /* subscriptionLoginPresent */ true);
    expect(m.apiKeyInEnv).toBe(true);
    expect(m.warning).toMatch(/override/i);
    expect(m.label).toMatch(/pay-as-you-go/i);
  });

  it("does NOT warn when an API key is set but there is no subscription to override", () => {
    const m = detectBillingMode(env({ ANTHROPIC_API_KEY: "sk-ant-test" }), false);
    expect(m.apiKeyInEnv).toBe(true);
    expect(m.warning).toBeNull();
  });

  it("reports subscription when no env key and a login is present", () => {
    const m = detectBillingMode(env({}), true);
    expect(m.apiKeyInEnv).toBe(false);
    expect(m.warning).toBeNull();
    expect(m.label).toMatch(/subscription/i);
  });

  it("reports unknown when no key and no login", () => {
    const m = detectBillingMode(env({}), false);
    expect(m.apiKeyInEnv).toBe(false);
    expect(m.label).toMatch(/unknown/i);
  });

  it("treats an empty/whitespace ANTHROPIC_API_KEY as unset", () => {
    expect(detectBillingMode(env({ ANTHROPIC_API_KEY: "   " }), true).apiKeyInEnv).toBe(false);
  });

  it("counts ANTHROPIC_AUTH_TOKEN as an env credential too", () => {
    const m = detectBillingMode(env({ ANTHROPIC_AUTH_TOKEN: "tok" }), true);
    expect(m.apiKeyInEnv).toBe(true);
    expect(m.warning).toMatch(/override/i);
  });

  it("recognizes Bedrock / Vertex env routing", () => {
    expect(detectBillingMode(env({ CLAUDE_CODE_USE_BEDROCK: "1" }), false).label).toMatch(/bedrock/i);
    expect(detectBillingMode(env({ CLAUDE_CODE_USE_VERTEX: "true" }), false).label).toMatch(/vertex/i);
  });

  it("does NOT warn when an env key is present but routing is Bedrock/Vertex (the key isn't the billing path)", () => {
    const m = detectBillingMode(env({ ANTHROPIC_API_KEY: "sk", CLAUDE_CODE_USE_BEDROCK: "1" }), true);
    expect(m.warning).toBeNull();
    expect(m.label).toMatch(/bedrock/i);
  });

  it("recognizes SDK-style truthiness (yes / on / spaced) for the routing flags", () => {
    expect(detectBillingMode(env({ CLAUDE_CODE_USE_BEDROCK: "yes" }), false).label).toMatch(/bedrock/i);
    expect(detectBillingMode(env({ CLAUDE_CODE_USE_VERTEX: " On " }), false).label).toMatch(/vertex/i);
  });
});

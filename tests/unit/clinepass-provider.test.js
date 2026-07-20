import { describe, expect, it } from "vitest";
import clinepass from "../../open-sse/providers/registry/clinepass.js";

describe("ClinePass provider contract", () => {
  it("uses API-key auth and exposes normalized model aliases", () => {
    expect(clinepass.category).toBe("apikey");
    expect(clinepass.hasOAuth).toBeUndefined();
    expect(clinepass.authModes).toBeUndefined();

    const kimi = clinepass.models.find((model) => model.id === "kimi-k2.7-code");
    expect(kimi).toMatchObject({
      upstreamModelId: "cline-pass/kimi-k2.7-code",
    });
  });
});

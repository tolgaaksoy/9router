import { describe, expect, it } from "vitest";
import REGISTRY from "../../open-sse/providers/registry/index.js";
import { hasSpecializedExecutor } from "../../open-sse/executors/index.js";

const byId = Object.fromEntries(REGISTRY.map((provider) => [provider.id, provider]));

describe("PR #2328 provider registration", () => {
  it("registers Qoder CN as a separate regional provider", () => {
    expect(byId["qoder-cn"]).toMatchObject({
      id: "qoder-cn",
      alias: "qdc",
      category: "free",
    });
    expect(byId["qoder-cn"].alias).not.toBe(byId.qoder.alias);
  });

  it("registers Zed with an executor and OAuth support", () => {
    expect(byId.zed).toMatchObject({
      id: "zed",
      category: "oauth",
      authType: "oauth",
    });
    expect(byId.zed.authModes).toContain("oauth");
    expect(hasSpecializedExecutor("zed")).toBe(true);
  });
});

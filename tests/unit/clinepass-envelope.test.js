import { describe, expect, it } from "vitest";
import { unwrapClinepassEnvelope } from "../../open-sse/utils/clinepassEnvelope.js";

describe("ClinePass response envelope", () => {
  it("unwraps a successful completion before OpenAI response processing", () => {
    const completion = { choices: [{ message: { content: "ok" } }] };
    expect(unwrapClinepassEnvelope({ success: true, data: completion }, "clinepass")).toEqual({
      body: completion,
      error: null,
    });
  });

  it("turns a ClinePass envelope error into a provider error", () => {
    expect(unwrapClinepassEnvelope({ success: false, error: "empty response content" }, "clinepass")).toEqual({
      body: null,
      error: { message: "empty response content", status: null },
    });
  });
});

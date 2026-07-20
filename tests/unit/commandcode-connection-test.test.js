import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getProviderConnectionById: vi.fn(),
  updateProviderConnection: vi.fn(),
  resolveConnectionProxyConfig: vi.fn(),
  testProxyUrl: vi.fn(),
}));

vi.mock("@/lib/localDb", () => ({
  getProviderConnectionById: mocks.getProviderConnectionById,
  updateProviderConnection: mocks.updateProviderConnection,
}));

vi.mock("@/lib/network/connectionProxy", () => ({
  resolveConnectionProxyConfig: mocks.resolveConnectionProxyConfig,
}));

vi.mock("@/lib/network/proxyTest", () => ({
  testProxyUrl: mocks.testProxyUrl,
}));

vi.mock("open-sse/utils/proxyFetch.js", () => ({
  proxyAwareFetch: vi.fn(),
}));

const originalFetch = global.fetch;

describe("CommandCode connection testing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getProviderConnectionById.mockResolvedValue({
      id: "connection-1",
      provider: "commandcode",
      authType: "apikey",
      apiKey: "user_test_key",
      providerSpecificData: {},
    });
    mocks.resolveConnectionProxyConfig.mockResolvedValue({});
    mocks.updateProviderConnection.mockResolvedValue(undefined);
    global.fetch = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("probes CommandCode instead of reporting that provider tests are unsupported", async () => {
    const { testSingleConnection } = await import(
      "../../src/app/api/providers/[id]/test/testUtils.js"
    );

    const result = await testSingleConnection("connection-1");

    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
    expect(global.fetch).toHaveBeenCalledOnce();
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.commandcode.ai/alpha/generate",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer user_test_key",
          "Content-Type": "application/json",
          "x-command-code-version": "0.25.7",
          "x-cli-environment": "cli",
          "x-session-id": expect.any(String),
        }),
        body: expect.stringContaining("ping"),
      })
    );
  });
});

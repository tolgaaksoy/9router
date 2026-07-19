import { describe, expect, it } from "vitest";
import {
  buildZedUserAuthHeader,
  decodeZedPrivateKeyVerifier,
  encodeZedPrivateKeyVerifier,
  parseZedCallbackPayload,
} from "../../open-sse/shared/zedAuth.js";

describe("Zed authentication helpers", () => {
  it("round-trips the native-app private key verifier", () => {
    const privateKey = "-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----";
    expect(decodeZedPrivateKeyVerifier(encodeZedPrivateKeyVerifier(privateKey))).toBe(privateKey);
  });

  it("parses the native callback URL", () => {
    expect(parseZedCallbackPayload("http://127.0.0.1/?user_id=user-1&access_token=token-1")).toEqual({
      userId: "user-1",
      encryptedAccessToken: "token-1",
    });
  });

  it("builds Zed user authentication from stored credentials", () => {
    expect(buildZedUserAuthHeader({
      accessToken: "token-1",
      providerSpecificData: { userId: "user-1" },
    })).toBe("user-1 token-1");
  });
});

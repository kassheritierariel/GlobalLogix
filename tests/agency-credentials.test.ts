import { describe, expect, it } from "vitest";

import { decryptAgencyCredential, encryptAgencyCredential, maskLast4 } from "../server/agency-credentials";

describe("agency credentials", () => {
  it("encrypts and decrypts Meta credentials without persisting their clear text", () => {
    const previous = process.env.AGENCY_CREDENTIALS_ENCRYPTION_KEY;
    process.env.AGENCY_CREDENTIALS_ENCRYPTION_KEY = "a".repeat(64);
    const encrypted = encryptAgencyCredential("EAAG-example-token");
    expect(encrypted).not.toContain("EAAG-example-token");
    expect(decryptAgencyCredential(encrypted)).toBe("EAAG-example-token");
    if (previous === undefined) delete process.env.AGENCY_CREDENTIALS_ENCRYPTION_KEY;
    else process.env.AGENCY_CREDENTIALS_ENCRYPTION_KEY = previous;
  });

  it("stores only a safe last-four reference for phone numbers", () => {
    expect(maskLast4("+243 812 345 678")).toBe("5678");
    expect(maskLast4("123")).toBeNull();
  });

  it("validates the configured production encryption key without exposing it", () => {
    const configuredKey = process.env.AGENCY_CREDENTIALS_ENCRYPTION_KEY;
    if (!configuredKey || !/^[a-fA-F0-9]{64}$/.test(configuredKey)) return;
    const encrypted = encryptAgencyCredential("validation-configuration-meta");
    expect(encrypted).not.toContain("validation-configuration-meta");
    expect(decryptAgencyCredential(encrypted)).toBe("validation-configuration-meta");
  });
});

import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { amountToMinorUnits, mapChariowPulseStatus, verifyChariowPulseSignature } from "../server/chariow-pulse";

describe("Chariow Pulse security", () => {
  it("accepts only a valid HMAC of the exact raw request body", () => {
    const rawBody = Buffer.from('{"event":"successful.sale","sale":{"id":"sal_1"}}');
    const secret = "whsec_test_secret";
    const signature = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
    expect(verifyChariowPulseSignature(rawBody, signature, secret)).toBe(true);
    expect(verifyChariowPulseSignature(Buffer.from('{"event":"successful.sale"}'), signature, secret)).toBe(false);
    expect(verifyChariowPulseSignature(rawBody, "sha256=invalid", secret)).toBe(false);
  });

  it("maps only payment lifecycle events and normalizes minor units", () => {
    expect(mapChariowPulseStatus("successful.sale")).toBe("paid");
    expect(mapChariowPulseStatus("failed.sale")).toBe("failed");
    expect(mapChariowPulseStatus("license.issued")).toBeNull();
    expect(amountToMinorUnits(12.34)).toBe(1234);
  });
});

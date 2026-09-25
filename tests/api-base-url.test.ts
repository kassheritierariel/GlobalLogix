import { describe, expect, it } from "vitest";
import { resolveApiBaseUrl } from "../lib/api-base-url";

describe("résolution de l’API Web", () => {
  it("utilise le même domaine que le frontend publié", () => {
    expect(resolveApiBaseUrl("https://ancienne-api.example.com", { protocol: "https:", hostname: "globallogix.example.com", port: "", origin: "https://globallogix.example.com" })).toBe("https://globallogix.example.com");
  });

  it("redirige le domaine Metro vers le serveur API en développement", () => {
    expect(resolveApiBaseUrl("", { protocol: "https:", hostname: "8081-sandbox.example.com", port: "", origin: "https://8081-sandbox.example.com" })).toBe("https://3000-sandbox.example.com");
  });
});

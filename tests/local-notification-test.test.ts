import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("diagnostic de notification locale", () => {
  it("demande la permission puis déclenche une notification locale sans destinataire", () => {
    const notifications = readFileSync("lib/notifications.ts", "utf8");

    expect(notifications).toContain("export async function triggerLocalNotificationTest()");
    expect(notifications).toContain("await ensureNotificationPermission()");
    expect(notifications).toContain("Notifications.scheduleNotificationAsync");
    expect(notifications).toContain('type: "local_notification_test"');
    expect(notifications).toContain("trigger: null");
    expect(notifications).not.toContain("ExponentPushToken[");
  });

  it("annonce clairement la limitation Web et conserve l’enregistrement distant séparé", () => {
    const notifications = readFileSync("lib/notifications.ts", "utf8");
    const settings = readFileSync("app/(tabs)/settings.tsx", "utf8");

    expect(notifications).toContain('Platform.OS === "web"');
    expect(notifications).toContain("pas sur le Web");
    expect(settings).toContain("Tester une notification locale");
    expect(settings).toContain("Activer les alertes distantes");
    expect(settings).toContain("triggerLocalNotificationTest");
  });
});

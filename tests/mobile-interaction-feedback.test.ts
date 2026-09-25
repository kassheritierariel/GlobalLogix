import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("retours d’interaction mobiles", () => {
  it("anime les pressions tout en respectant la réduction des mouvements", () => {
    const component = readFileSync("components/animated-pressable.tsx", "utf8");
    expect(component).toContain("AccessibilityInfo.isReduceMotionEnabled()");
    expect(component).toContain('AccessibilityInfo.addEventListener("reduceMotionChanged"');
    expect(component).toContain("Animated.parallel");
    expect(component).toContain("haptic[hapticFeedback]()");
  });

  it("active le retour haptique et les transitions de navigation", () => {
    const tabs = readFileSync("app/(tabs)/_layout.tsx", "utf8");
    const root = readFileSync("app/_layout.tsx", "utf8");
    const hapticTab = readFileSync("components/haptic-tab.tsx", "utf8");
    expect(tabs).toContain('animation: Platform.OS === "web" ? "none" : "fade"');
    expect(tabs).toContain("tabBarButton: HapticTab");
    expect(root).toContain('animation: Platform.OS === "web" ? "fade" : "slide_from_right"');
    expect(hapticTab).toContain("haptic.selection()");
  });

  it("affiche un splash plein écran pendant Google Sign-In", () => {
    const login = readFileSync("app/login.tsx", "utf8");
    const splash = readFileSync("components/google-auth-splash.tsx", "utf8");
    expect(login).toContain("<ScrollView");
    expect(login).toContain('keyboardShouldPersistTaps="handled"');
    expect(login).toContain("<GoogleAuthSplash");
    expect(login).toContain("visible={isGoogleSubmitting}");
    expect(splash).toContain('presentationStyle="fullScreen"');
    expect(splash).toContain('accessibilityRole="progressbar"');
    expect(splash).toContain("Chargement de votre espace");
    expect(splash).toContain("Firebase Auth · Session chiffrée · Isolation par agence");
    expect(splash).toContain("AccessibilityInfo.isReduceMotionEnabled()");
  });
});

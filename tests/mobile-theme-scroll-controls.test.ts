import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const mainTabScreens = [
  "app/(tabs)/index.tsx",
  "app/(tabs)/shipments.tsx",
  "app/(tabs)/tracking.tsx",
  "app/(tabs)/exceptions.tsx",
  "app/(tabs)/settings.tsx",
];

describe("thème et navigation mobile", () => {
  it("propose un bouton sombre persistant dans la palette Haut/Bas", () => {
    const controls = readFileSync("components/scroll-jump-controls.tsx", "utf8");
    const toggle = readFileSync("components/theme-toggle-button.tsx", "utf8");
    const provider = readFileSync("lib/theme-provider.tsx", "utf8");

    expect(controls).toContain("useThemeContext()");
    expect(controls).toContain("<ThemeToggleButton />");
    expect(toggle).toContain('setColorScheme(dark ? "light" : "dark")');
    expect(toggle).toContain('dark ? "Activer le mode clair" : "Activer le mode sombre"');
    expect(toggle).toContain('name={dark ? "light-mode" : "dark-mode"}');
    expect(provider).toContain('AsyncStorage.setItem("globallogix:color-scheme", scheme)');
  });

  it("rend le mode sombre disponible avant même la connexion", () => {
    const login = readFileSync("app/login.tsx", "utf8");
    expect(login).toContain("<ThemeToggleButton />");
    expect(login).toContain("formCardDark");
    expect(login).toContain("inputDark");
  });

  it("affiche Haut/Bas sur chacun des cinq onglets opérationnels", () => {
    for (const path of mainTabScreens) {
      expect(readFileSync(path, "utf8"), path).toContain("<ScrollJumpControls");
    }
  });

  it("adapte aussi la barre d’onglets au thème sombre", () => {
    const tabs = readFileSync("app/(tabs)/_layout.tsx", "utf8");
    expect(tabs).toContain("useThemeContext()");
    expect(tabs).toContain("tabBarDark");
    expect(tabs).toContain('dark ? "#F7D116" : "#003F87"');
  });
});

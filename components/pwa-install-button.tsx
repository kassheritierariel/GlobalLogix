import { MaterialIcon } from "@/components/material-icon";
import { AnimatedPressable } from "@/components/animated-pressable";
import { useThemeContext } from "@/lib/theme-provider";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

type InstallChoice = { outcome: "accepted" | "dismissed" };
type InstallPrompt = Event & {
  prompt: () => Promise<InstallChoice | void>;
  userChoice: Promise<InstallChoice>;
};
type InstallWindow = Window & { __globallogixInstallPrompt?: InstallPrompt | null };

function isInstalled() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

function installationHelp() {
  if (typeof window === "undefined") return "Ouvrez GlobalLogix sur son domaine HTTPS pour l’installer.";
  if (window.location.protocol !== "https:" || window.location.hostname.endsWith(".manus.computer")) {
    return "L’installation est disponible depuis le domaine public HTTPS, pas depuis l’aperçu temporaire.";
  }
  const agent = window.navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(agent)) {
    return "Sur iPhone/iPad : ouvrez ce site dans Safari, touchez Partager, puis « Sur l’écran d’accueil ».";
  }
  if (/Android/i.test(agent)) {
    return "Sur Android : dans Chrome, ouvrez le menu ⋮ puis « Installer l’application » ou « Ajouter à l’écran d’accueil ».";
  }
  if (/Macintosh/i.test(agent) && /Safari/i.test(agent) && !/Chrome|Chromium|Edg/i.test(agent)) {
    return "Sur Mac : dans Safari, ouvrez Fichier puis « Ajouter au Dock ».";
  }
  return "Dans Chrome ou Edge, ouvrez le menu ⋮ puis « Installer l’application » (ou l’icône d’installation dans la barre d’adresse).";
}

export function PwaInstallButton({ compact = false }: { compact?: boolean }) {
  const { colorScheme } = useThemeContext();
  const dark = colorScheme === "dark";
  const [available, setAvailable] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const browser = window as InstallWindow;
    const markAvailable = () => setAvailable(Boolean(browser.__globallogixInstallPrompt));
    const capture = (event: Event) => {
      event.preventDefault();
      browser.__globallogixInstallPrompt = event as InstallPrompt;
      markAvailable();
    };
    const onInstalled = () => {
      browser.__globallogixInstallPrompt = null;
      setAvailable(false);
      setInstalled(true);
      setFeedback("GlobalLogix est maintenant installée sur cet appareil.");
    };
    setInstalled(isInstalled());
    markAvailable();
    browser.addEventListener("globallogix:install-available", markAvailable);
    browser.addEventListener("beforeinstallprompt", capture);
    browser.addEventListener("appinstalled", onInstalled);
    return () => {
      browser.removeEventListener("globallogix:install-available", markAvailable);
      browser.removeEventListener("beforeinstallprompt", capture);
      browser.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (Platform.OS !== "web" || installed) return null;

  const install = async () => {
    if (busy) return;
    const browser = window as InstallWindow;
    const prompt = browser.__globallogixInstallPrompt;
    if (!available || !prompt) {
      setFeedback(installationHelp());
      return;
    }
    setBusy(true);
    setFeedback("Ouverture de la fenêtre d’installation…");
    browser.__globallogixInstallPrompt = null;
    setAvailable(false);
    try {
      const result = await prompt.prompt();
      const choice = result?.outcome ? result : await prompt.userChoice;
      setFeedback(choice.outcome === "accepted"
        ? "Installation acceptée. Vérifiez l’écran d’accueil ou le menu des applications."
        : "Installation annulée. Vous pourrez réessayer depuis le menu de votre navigateur.");
    } catch {
      setFeedback(installationHelp());
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={compact ? styles.compact : [styles.card, dark && styles.cardDark]}>
      {!compact ? <View style={styles.heading}>
        <View style={[styles.icon, dark && styles.iconDark]}>
          <MaterialIcon name="download" size={21} color={dark ? "#F7D116" : "#007FFF"} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, dark && styles.titleDark]}>GlobalLogix sur votre appareil</Text>
          <Text style={[styles.description, dark && styles.descriptionDark]}>Un accès rapide depuis votre écran d’accueil ou votre ordinateur.</Text>
        </View>
      </View> : null}
      <AnimatedPressable
        accessibilityLabel="Installer l’application GlobalLogix"
        accessibilityRole="button"
        accessibilityState={{ busy }}
        disabled={busy}
        hapticFeedback="none"
        onPress={() => void install()}
        style={[styles.button, dark && styles.buttonDark, compact && styles.compactButton, busy && styles.buttonBusy]}
      >
        <Text style={[styles.buttonText, (dark || compact) && styles.buttonTextDark]}>{busy ? "Installation en cours…" : compact ? "↓  Installer GlobalLogix" : "Installer GlobalLogix"}</Text>
      </AnimatedPressable>
      {feedback ? <Text accessibilityLiveRegion="polite" style={[styles.feedback, dark && styles.descriptionDark, compact && styles.compactFeedback]}>{feedback}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#EAF4FF", borderColor: "#B9D9F7", borderRadius: 16, borderWidth: 1, marginTop: 16, padding: 14 },
  cardDark: { backgroundColor: "#173858", borderColor: "#315673" },
  compact: { alignItems: "center", alignSelf: "center", marginTop: 18, maxWidth: 320 },
  heading: { alignItems: "center", flexDirection: "row" },
  icon: { alignItems: "center", backgroundColor: "#D8EBFF", borderRadius: 12, height: 42, justifyContent: "center", width: 42 },
  iconDark: { backgroundColor: "#244568" },
  copy: { flex: 1, marginLeft: 12 },
  title: { color: "#062B5C", fontSize: 14, fontWeight: "800" },
  titleDark: { color: "#F6FAFF" },
  description: { color: "#52677C", fontSize: 12, lineHeight: 17, marginTop: 3 },
  descriptionDark: { color: "#B6C8D9" },
  button: { alignItems: "center", backgroundColor: "#007FFF", borderRadius: 11, justifyContent: "center", minHeight: 46, marginTop: 12, paddingHorizontal: 12 },
  buttonDark: { backgroundColor: "#F7D116" },
  compactButton: { backgroundColor: "#F7D116", borderRadius: 20, marginTop: 0, minHeight: 38, paddingHorizontal: 16 },
  buttonBusy: { opacity: 0.7 },
  buttonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  buttonTextDark: { color: "#062B5C" },
  feedback: { color: "#365976", fontSize: 12, lineHeight: 18, marginTop: 10 },
  compactFeedback: { color: "#FFFFFF", textAlign: "center" },
});

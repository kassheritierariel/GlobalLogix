import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as FileSystem from "expo-file-system/legacy";
import * as MailComposer from "expo-mail-composer";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import QRCode from "react-native-qrcode-svg";
import { useRef, useState } from "react";
import { Alert, Platform, Pressable, Share, StyleSheet, Text, View } from "react-native";

import { buildTrackingQrPrintHtml } from "@/lib/tracking-share-qr-format";

export type TrackingShareLink = {
  url: string;
  expiresAt: string;
};

type TrackingShareQrProps = TrackingShareLink & {
  trackingNumber: string;
};

type QrSvgReference = {
  toDataURL: (callback: (base64: string) => void) => void;
};

const clientMessage = (trackingNumber: string, url: string, expiresAt: string) => `Bonjour,\n\nSuivez votre colis ${trackingNumber} sur GlobalLogix : ${url}\n\nCe lien sécurisé est valable jusqu’au ${new Date(expiresAt).toLocaleString("fr-FR")}.`;

/** Affiche localement le QR d’un lien sécurisé et ses sorties contrôlées par l’OS. */
export function TrackingShareQr({ url, expiresAt, trackingNumber }: TrackingShareQrProps) {
  const qrRef = useRef<QrSvgReference | null>(null);
  const [action, setAction] = useState<"export" | "print" | "email" | "message" | null>(null);

  const getQrDataUri = () => new Promise<string>((resolve, reject) => {
    if (!qrRef.current) {
      reject(new Error("Le QR code n’est pas encore prêt."));
      return;
    }
    qrRef.current.toDataURL((base64) => resolve(`data:image/png;base64,${base64}`));
  });

  const withAction = async (nextAction: NonNullable<typeof action>, callback: () => Promise<void>) => {
    try {
      setAction(nextAction);
      await callback();
    } catch (error) {
      Alert.alert("Action indisponible", error instanceof Error ? error.message : "Cette action n’a pas pu être effectuée.");
    } finally {
      setAction(null);
    }
  };

  const exportQr = () => withAction("export", async () => {
    const dataUri = await getQrDataUri();
    const filename = `globallogix-qr-${trackingNumber.replace(/[^a-z0-9-]/gi, "-")}.png`;
    if (Platform.OS === "web") {
      const anchor = document.createElement("a");
      anchor.href = dataUri;
      anchor.download = filename;
      anchor.click();
      return;
    }
    if (!(await Sharing.isAvailableAsync())) throw new Error("L’export de fichiers n’est pas disponible sur cet appareil.");
    const base64 = dataUri.split(",")[1];
    if (!base64) throw new Error("Le QR code n’a pas pu être préparé pour l’export.");
    const uri = `${FileSystem.cacheDirectory ?? ""}${filename}`;
    await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
    await Sharing.shareAsync(uri, { dialogTitle: "Enregistrer ou partager le QR code", mimeType: "image/png", UTI: "public.png" });
  });

  const printQr = () => withAction("print", async () => {
    const html = buildTrackingQrPrintHtml({ trackingNumber, expiresAt, qrDataUri: await getQrDataUri() });
    if (Platform.OS === "web") {
      const popup = window.open("", "_blank");
      if (!popup) throw new Error("Autorisez les fenêtres contextuelles pour imprimer le QR code.");
      popup.document.write(html);
      popup.document.close();
      popup.focus();
      popup.print();
      return;
    }
    await Print.printAsync({ html });
  });

  const composeEmail = () => withAction("email", async () => {
    if (!(await MailComposer.isAvailableAsync())) throw new Error("Configurez un compte e-mail sur cet appareil pour envoyer le suivi.");
    await MailComposer.composeAsync({ subject: `Suivi GlobalLogix · ${trackingNumber}`, body: clientMessage(trackingNumber, url, expiresAt) });
  });

  const shareMessage = () => withAction("message", async () => {
    await Share.share({ title: `Suivi GlobalLogix · ${trackingNumber}`, message: clientMessage(trackingNumber, url, expiresAt), url });
  });

  const label = (idle: string, current: NonNullable<typeof action>) => action === current ? "Préparation…" : idle;

  return (
    <View style={styles.card} accessibilityLabel="QR code du lien de suivi sécurisé">
      <View style={styles.heading}>
        <View style={styles.icon}><MaterialIcons name="qr-code-2" size={20} color="#007FFF" /></View>
        <View style={styles.copy}><Text style={styles.title}>Accès client par QR code</Text><Text style={styles.subtitle}>Le client peut scanner ce code sur son téléphone.</Text></View>
      </View>
      <View style={styles.codeFrame}><QRCode getRef={(ref) => { qrRef.current = ref as unknown as QrSvgReference; }} value={url} size={164} color="#062B5C" backgroundColor="#FFFFFF" quietZone={8} /></View>
      <View style={styles.notice}><MaterialIcons name="schedule" size={15} color="#936200" /><Text style={styles.noticeText}>Lien sécurisé valable jusqu’au {new Date(expiresAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}.</Text></View>
      <View style={styles.actions}>
        <Pressable disabled={action !== null} onPress={() => void exportQr()} style={({ pressed }) => [styles.action, pressed && styles.pressed, action !== null && styles.disabled]}><MaterialIcons name="download" size={16} color="#062B5C" /><Text style={styles.actionText}>{label("Exporter PNG", "export")}</Text></Pressable>
        <Pressable disabled={action !== null} onPress={() => void printQr()} style={({ pressed }) => [styles.action, pressed && styles.pressed, action !== null && styles.disabled]}><MaterialIcons name="print" size={16} color="#062B5C" /><Text style={styles.actionText}>{label("Imprimer", "print")}</Text></Pressable>
        <Pressable disabled={action !== null} onPress={() => void composeEmail()} style={({ pressed }) => [styles.action, styles.emailAction, pressed && styles.pressed, action !== null && styles.disabled]}><MaterialIcons name="email" size={16} color="#CE1126" /><Text style={styles.emailText}>{label("E-mail", "email")}</Text></Pressable>
        <Pressable disabled={action !== null} onPress={() => void shareMessage()} style={({ pressed }) => [styles.action, styles.messageAction, pressed && styles.pressed, action !== null && styles.disabled]}><MaterialIcons name="forum" size={16} color="#007FFF" /><Text style={styles.messageText}>{label("Messagerie", "message")}</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#F4F9FF", borderColor: "#B9D9F7", borderRadius: 16, borderWidth: 1, marginTop: 12, padding: 14 },
  heading: { alignItems: "center", flexDirection: "row" },
  icon: { alignItems: "center", backgroundColor: "#E7F3FF", borderRadius: 18, height: 36, justifyContent: "center", marginRight: 9, width: 36 },
  copy: { flex: 1 },
  title: { color: "#062B5C", fontSize: 13, fontWeight: "800" },
  subtitle: { color: "#5B6D84", fontSize: 11, lineHeight: 16, marginTop: 2 },
  codeFrame: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#D7E4F0", borderRadius: 12, borderWidth: 1, marginTop: 12, padding: 10 },
  notice: { alignItems: "flex-start", flexDirection: "row", marginTop: 10 },
  noticeText: { color: "#936200", flex: 1, fontSize: 10, lineHeight: 15, marginLeft: 6 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 12 },
  action: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#B9D9F7", borderRadius: 9, borderWidth: 1, flexDirection: "row", minHeight: 34, paddingHorizontal: 9 },
  emailAction: { borderColor: "#F0BAC2" },
  messageAction: { backgroundColor: "#E7F3FF" },
  actionText: { color: "#062B5C", fontSize: 10, fontWeight: "800", marginLeft: 4 },
  emailText: { color: "#CE1126", fontSize: 10, fontWeight: "800", marginLeft: 4 },
  messageText: { color: "#007FFF", fontSize: 10, fontWeight: "800", marginLeft: 4 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.55 },
});

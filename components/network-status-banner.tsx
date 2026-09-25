import { MaterialIcon } from "@/components/material-icon";
import { haptic } from "@/lib/haptics";
import * as Network from "expo-network";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type BannerStatus = "hidden" | "offline" | "checking" | "online";

function isOffline(state: Network.NetworkState) {
  if (Platform.OS === "web" && typeof navigator !== "undefined") return navigator.onLine === false;
  return state.isConnected === false || state.isInternetReachable === false;
}

export function NetworkStatusBanner() {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<BannerStatus>("hidden");
  const offset = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const wasOffline = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setStatus("hidden"), 2800);
  }, []);

  const applyNetworkState = useCallback((state: Network.NetworkState) => {
    if (isOffline(state)) {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      wasOffline.current = true;
      setStatus("offline");
      return;
    }
    if (wasOffline.current) {
      wasOffline.current = false;
      setStatus("online");
      scheduleHide();
    }
  }, [scheduleHide]);

  useEffect(() => {
    if (__DEV__ && Platform.OS === "web" && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("previewOfflineBanner") === "1") {
      wasOffline.current = true;
      setStatus("offline");
      return;
    }
    if (Platform.OS === "web" && typeof window !== "undefined") {
      let mounted = true;
      const showOffline = () => {
        if (!mounted) return;
        if (hideTimer.current) clearTimeout(hideTimer.current);
        wasOffline.current = true;
        setStatus("offline");
      };
      const handleOffline = async () => {
        try {
          const response = await fetch(`/api/health?network-event=${Date.now()}`, { cache: "no-store" });
          if (!response.ok) showOffline();
        } catch {
          showOffline();
        }
      };
      const handleOnline = () => {
        if (!wasOffline.current) return;
        wasOffline.current = false;
        setStatus("online");
        scheduleHide();
      };
      if (navigator.onLine === false) void handleOffline();
      const offlineListener = () => { void handleOffline(); };
      window.addEventListener("offline", offlineListener);
      window.addEventListener("online", handleOnline);
      return () => {
        mounted = false;
        window.removeEventListener("offline", offlineListener);
        window.removeEventListener("online", handleOnline);
        if (hideTimer.current) clearTimeout(hideTimer.current);
      };
    }
    let mounted = true;
    void Network.getNetworkStateAsync().then((state) => {
      if (mounted) applyNetworkState(state);
    }).catch(() => undefined);
    const subscription = Network.addNetworkStateListener((state) => {
      if (mounted) applyNetworkState(state);
    });
    return () => {
      mounted = false;
      subscription.remove();
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [applyNetworkState, scheduleHide]);

  useEffect(() => {
    const visible = status !== "hidden";
    Animated.parallel([
      Animated.timing(offset, {
        toValue: visible ? 0 : -150,
        duration: visible ? 240 : 180,
        easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: visible ? 180 : 140,
        useNativeDriver: true,
      }),
    ]).start();
  }, [offset, opacity, status]);

  const retry = async () => {
    if (status === "checking") return;
    setStatus("checking");
    try {
      const reachable = Platform.OS === "web"
        ? await fetch(`/api/health?network-check=${Date.now()}`, { cache: "no-store" }).then((response) => response.ok)
        : !isOffline(await Network.getNetworkStateAsync());
      if (!reachable) {
        wasOffline.current = true;
        setStatus("offline");
        haptic.error();
        return;
      }
      wasOffline.current = false;
      setStatus("online");
      haptic.success();
      scheduleHide();
    } catch {
      wasOffline.current = true;
      setStatus("offline");
      haptic.error();
    }
  };

  const online = status === "online";
  const checking = status === "checking";

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]}>
      <Animated.View
        accessibilityElementsHidden={status === "hidden"}
        accessibilityLiveRegion="assertive"
        accessibilityRole="alert"
        importantForAccessibility={status === "hidden" ? "no-hide-descendants" : "yes"}
        style={[
          styles.banner,
          online ? styles.bannerOnline : styles.bannerOffline,
          { opacity, pointerEvents: status === "hidden" ? "none" : "auto", top: Platform.OS === "web" ? 12 : insets.top + 8, transform: [{ translateY: offset }] },
        ]}
      >
        <View style={[styles.iconWrap, online && styles.iconWrapOnline]}>
          <MaterialIcon name={online ? "wifi" : "wifi-off"} size={20} color={online ? "#147A46" : "#CE1126"} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{online ? "Connexion rétablie" : checking ? "Vérification en cours" : "Connexion Internet perdue"}</Text>
          <Text style={styles.message}>{online ? "La synchronisation des expéditions reprend automatiquement." : checking ? "GlobalLogix vérifie l’accès au réseau…" : "Mode hors ligne : certaines données peuvent ne pas être à jour."}</Text>
        </View>
        {!online ? (
          <Pressable
            accessibilityLabel="Réessayer la connexion Internet"
            accessibilityRole="button"
            disabled={checking}
            onPress={() => void retry()}
            style={({ pressed }) => [styles.retry, pressed && styles.retryPressed, checking && styles.retryDisabled]}
          >
            {checking ? <ActivityIndicator color="#062B5C" size="small" /> : <Text style={styles.retryText}>Réessayer</Text>}
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { pointerEvents: "box-none" },
  banner: { alignItems: "center", borderRadius: 18, borderWidth: 1, elevation: 12, flexDirection: "row", left: 12, maxWidth: 620, minHeight: 76, padding: 12, position: "absolute", right: 12, shadowColor: "#001D3D", shadowOffset: { height: 8, width: 0 }, shadowOpacity: 0.22, shadowRadius: 18, zIndex: 1000 },
  bannerOffline: { backgroundColor: "#FFF7E8", borderColor: "#F0C36A" },
  bannerOnline: { backgroundColor: "#E8F7EE", borderColor: "#8CC8A5" },
  iconWrap: { alignItems: "center", backgroundColor: "#FFE3DE", borderRadius: 12, height: 40, justifyContent: "center", width: 40 },
  iconWrapOnline: { backgroundColor: "#D6F0E0" },
  copy: { flex: 1, marginHorizontal: 10 },
  title: { color: "#062B5C", fontSize: 13, fontWeight: "900" },
  message: { color: "#52677C", fontSize: 10, lineHeight: 15, marginTop: 3 },
  retry: { alignItems: "center", backgroundColor: "#F7D116", borderRadius: 11, justifyContent: "center", minHeight: 40, minWidth: 80, paddingHorizontal: 11 },
  retryPressed: { opacity: 0.78, transform: [{ scale: 0.97 }] },
  retryDisabled: { opacity: 0.72 },
  retryText: { color: "#062B5C", fontSize: 11, fontWeight: "900" },
});

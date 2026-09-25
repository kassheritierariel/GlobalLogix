import {
  AccessibilityInfo,
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { haptic } from "@/lib/haptics";

type HapticFeedback = "light" | "medium" | "selection" | "none";

type AnimatedPressableProps = Omit<PressableProps, "children" | "style"> & {
  children: ReactNode;
  hapticFeedback?: HapticFeedback;
  style?: StyleProp<ViewStyle>;
};

export function AnimatedPressable({
  children,
  disabled,
  hapticFeedback = "light",
  onPressIn,
  onPressOut,
  style,
  ...props
}: AnimatedPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  const animate = (pressed: boolean) => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: pressed && !reduceMotion ? 0.975 : 1,
        duration: reduceMotion ? 0 : pressed ? 80 : 140,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: pressed ? 0.86 : 1,
        duration: reduceMotion ? 0 : pressed ? 80 : 140,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View style={{ opacity, transform: [{ scale }] }}>
      <Pressable
        {...props}
        disabled={disabled}
        onPressIn={(event) => {
          animate(true);
          if (!disabled && hapticFeedback !== "none") haptic[hapticFeedback]();
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          animate(false);
          onPressOut?.(event);
        }}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

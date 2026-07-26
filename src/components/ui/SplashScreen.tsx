import React, { useEffect } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");

interface SplashScreenProps {
  onComplete: () => void;
}

const COLORS = ["#0894FF", "#C959DD", "#FF2E54", "#FF9004"];

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);
  const containerOpacity = useSharedValue(0);
  const bannerOpacity = useSharedValue(0);
  const bannerScale = useSharedValue(0.95);

  useEffect(() => {
    // 0. Fade in overall container
    containerOpacity.value = withTiming(1, { duration: 500 });

    // 1. Start rotation (Color Shift effect)
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 4000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // 2. Initial fade in for glow
    opacity.value = withTiming(0.8, { duration: 1000 });

    // 3. Banner entrance
    bannerOpacity.value = withDelay(500, withTiming(1, { duration: 800 }));
    bannerScale.value = withDelay(
      500,
      withTiming(1, {
        duration: 1000,
        easing: Easing.out(Easing.back(1)),
      })
    );

    // 4. Complete splash with fade out
    const timer = setTimeout(() => {
      containerOpacity.value = withTiming(0, { duration: 500 }, (finished) => {
        if (finished) {
          runOnJS(onComplete)();
        }
      });
    }, 4000);

    return () => clearTimeout(timer);
  }, [rotation, opacity, bannerOpacity, bannerScale, containerOpacity, onComplete]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const animatedGlowContainerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
    opacity: opacity.value,
  }));

  const bannerStyle = useAnimatedStyle(() => ({
    opacity: bannerOpacity.value,
    transform: [{ scale: bannerScale.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      {/* Background Color Shift Glow */}
      <View style={styles.glowWrapper}>
        <Animated.View style={[styles.glowContainer, animatedGlowContainerStyle]}>
          <View style={[styles.blob, { backgroundColor: COLORS[0], top: 0, left: 0 }]} />
          <View style={[styles.blob, { backgroundColor: COLORS[1], top: 0, right: 0 }]} />
          <View style={[styles.blob, { backgroundColor: COLORS[2], bottom: 0, right: 0 }]} />
          <View style={[styles.blob, { backgroundColor: COLORS[3], bottom: 0, left: 0 }]} />
        </Animated.View>
      </View>

      <BlurView intensity={100} style={StyleSheet.absoluteFill} tint="dark" />

      <View style={styles.content}>
        <Animated.View style={bannerStyle}>
          <Image
            source={require("../../../assets/images/brand/Banner.svg")}
            style={styles.banner}
            contentFit="contain"
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  glowWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  glowContainer: {
    width: width * 1.5,
    height: width * 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  blob: {
    position: "absolute",
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    opacity: 0.6,
  },
  content: {
    width: "100%",
    alignItems: "center",
    zIndex: 20,
  },
  banner: {
    width: width * 0.85,
    height: 120,
  },
});

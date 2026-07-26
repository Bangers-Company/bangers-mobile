import React, { useEffect } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { useTheme } from "react-native-paper";
import Animated, {
  Easing,
  useAnimatedKeyboard,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface AuthBottomSheetProps {
  children: React.ReactNode;
  isOpen?: boolean;
}

export const AuthBottomSheet: React.FC<AuthBottomSheetProps> = ({
  children,
  isOpen = true,
}) => {
  const { height: screenHeight } = useWindowDimensions();
  const theme = useTheme();
  const keyboard = useAnimatedKeyboard();

  // Initial translation (off-screen)
  const baseTranslateY = useSharedValue(screenHeight);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      baseTranslateY.value = withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.back(0)), // Linear/Smooth out
      });
      opacity.value = withTiming(1, { duration: 500 });
    } else {
      baseTranslateY.value = withTiming(screenHeight, { duration: 400 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [isOpen, baseTranslateY, screenHeight, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    // Subtract keyboard height (negative transform moves it UP)
    return {
      transform: [{ translateY: baseTranslateY.value - keyboard.height.value }],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.sheet,
        {
          backgroundColor: theme.colors.surface,
          shadowColor: "#000",
        },
        animatedStyle,
      ]}
    >
      <View style={styles.handleContainer}>
        <View
          style={[
            styles.handle,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />
      </View>
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    elevation: 24,
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    minHeight: "50%",
    paddingBottom: 24,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.5,
  },
  content: {
    paddingHorizontal: 24,
    flexGrow: 1,
  },
});

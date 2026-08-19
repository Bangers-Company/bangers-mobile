import React, { useEffect } from "react";
import { StyleSheet, View, useWindowDimensions, Keyboard } from "react-native";
import { useAppTheme } from "../../context/ThemeProvider";
import Animated, {
  Easing,
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
  const theme = useAppTheme();

  // Initial translation (off-screen)
  const baseTranslateY = useSharedValue(screenHeight);
  const opacity = useSharedValue(0);
  const keyboardOffset = useSharedValue(0);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      keyboardOffset.value = withTiming(e.endCoordinates.height, {
        duration: 180,
      });
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      keyboardOffset.value = withTiming(0, { duration: 180 });
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardOffset]);

  useEffect(() => {
    if (isOpen) {
      baseTranslateY.value = withTiming(0, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      });
      opacity.value = withTiming(1, { duration: 400 });
    } else {
      baseTranslateY.value = withTiming(screenHeight, { duration: 350 });
      opacity.value = withTiming(0, { duration: 250 });
    }
  }, [isOpen, baseTranslateY, screenHeight, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: baseTranslateY.value - keyboardOffset.value },
      ],
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
            { backgroundColor: theme.colors.surfaceVariant },
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

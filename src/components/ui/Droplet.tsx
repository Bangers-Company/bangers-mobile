import { ChevronUp } from "lucide-react-native";
import React from "react";
import { StyleSheet } from "react-native";
import { TouchableRipple, useTheme } from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface DropletProps {
  visible: boolean;
  onPress: () => void;
  position?: "top" | "bottom";
  topOffset?: number;
}

export const Droplet: React.FC<DropletProps> = ({
  visible,
  onPress,
  position = "bottom",
  topOffset = 0,
}) => {
  const theme = useTheme();

  const animatedStyle = useAnimatedStyle(() => {
    const isTop = position === "top";
    const hiddenY = isTop ? -100 : 100;
    return {
      transform: [
        { translateY: withSpring(visible ? 0 : hiddenY) },
        { scale: withSpring(visible ? 1 : 0) },
      ],
      opacity: withTiming(visible ? 1 : 0),
    };
  });

  const positionStyle =
    position === "top"
      ? { top: topOffset, bottom: undefined }
      : { bottom: 100, top: undefined };

  return (
    <Animated.View style={[styles.container, positionStyle, animatedStyle]}>
      <TouchableRipple
        onPress={onPress}
        style={[styles.droplet, { backgroundColor: theme.colors.primary }]}
        rippleColor="rgba(255, 255, 255, 0.3)"
      >
        <ChevronUp
          color="white"
          size={24}
          style={{ transform: [{ rotate: position === "top" ? "0deg" : "0deg" }] }}
        />
      </TouchableRipple>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1000,
  },
  droplet: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});

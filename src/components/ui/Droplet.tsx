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
}

export const Droplet: React.FC<DropletProps> = ({ visible, onPress }) => {
  const theme = useTheme();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: withSpring(visible ? 0 : 100) },
        { scale: withSpring(visible ? 1 : 0) },
      ],
      opacity: withTiming(visible ? 1 : 0),
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableRipple
        onPress={onPress}
        style={[styles.droplet, { backgroundColor: theme.colors.primary }]}
        rippleColor="rgba(255, 255, 255, 0.3)"
      >
        <ChevronUp color="white" size={24} />
      </TouchableRipple>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100, // Above BottomNav
    right: 24,
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

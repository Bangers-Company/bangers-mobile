import { PropsWithChildren, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import { ChevronRight } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

export function Collapsible({
  children,
  title,
}: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const rotateStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: withTiming(isOpen ? "90deg" : "0deg") }],
    };
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.heading}
        onPress={() => setIsOpen((value) => !value)}
        activeOpacity={0.8}
      >
        <Animated.View style={rotateStyle}>
          <ChevronRight size={18} color="#a60df2" />
        </Animated.View>

        <Text variant="titleMedium" style={styles.title}>
          {title}
        </Text>
      </TouchableOpacity>
      {isOpen && <View style={styles.content}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  title: {
    fontWeight: "600",
  },
  content: {
    marginTop: 6,
    marginLeft: 30,
  },
});

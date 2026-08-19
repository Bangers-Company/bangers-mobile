import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "@gluestack-ui/themed";
import { useAppTheme } from "../../context/ThemeProvider";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";

interface PasswordStrengthProps {
  password?: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password = "" }) => {
  const theme = useAppTheme();

  const strength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  }, [password]);

  const strengthColor = useMemo(() => {
    switch (strength) {
      case 1: return "#ff5252"; // Red
      case 2: return "#ffd740"; // Yellow
      case 3: return "#4caf50"; // Green
      case 4: return theme.colors.primary; // Accent
      default: return "#888888";
    }
  }, [strength, theme.colors.primary]);

  const strengthLabel = useMemo(() => {
    switch (strength) {
      case 1: return "Weak";
      case 2: return "Fair";
      case 3: return "Good";
      case 4: return "Strong";
      default: return "Too Short";
    }
  }, [strength]);

  const animatedStyle = useAnimatedStyle(() => {
    const widthPercent = (strength / 4) * 100;
    return {
      width: withTiming(`${widthPercent}%`, { duration: 300 }),
      backgroundColor: withTiming(strengthColor, { duration: 300 }),
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>
          Password Strength
        </Text>
        <Text style={[styles.status, { color: strengthColor }]}>
          {strengthLabel}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: "rgba(150, 150, 150, 0.2)" }]}>
        <Animated.View style={[styles.bar, animatedStyle]} />
      </View>
      <Text style={styles.hint}>
        Use at least 8 characters, a capital letter, a number and a symbol.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    opacity: 0.6,
  },
  status: {
    fontSize: 11,
    fontWeight: "800",
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
  },
  hint: {
    opacity: 0.4,
    fontSize: 10,
    marginTop: 4,
  },
});


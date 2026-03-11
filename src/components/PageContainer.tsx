import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "nativewind";
import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUIStore } from "../store/useUIStore";
import { getGradientColors } from "../utils/theme";

interface PageContainerProps extends ViewProps {
  children: React.ReactNode;
  withPadding?: boolean;
  withSafeArea?: boolean;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  withPadding = true,
  withSafeArea = true,
  style,
  ...props
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { colorScheme: systemColorScheme } = useColorScheme();
  const themeMode = useUIStore((state) => state.themeMode);
  const accentColor = useUIStore((state) => state.accentColor);
  const isAmoled = useUIStore((state) => state.isAmoled);

  const isDark =
    themeMode === "system"
      ? systemColorScheme === "dark"
      : themeMode === "dark";

  const effectiveAmoled = isDark && isAmoled;
  const mode = effectiveAmoled ? "amoled" : isDark ? "dark" : "light";
  const gradientColors = getGradientColors(accentColor, mode);

  return (
    <LinearGradient
      colors={gradientColors as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <View
        style={[
          styles.container,
          withPadding && styles.padding,
          withSafeArea && {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  padding: {
    paddingHorizontal: 20,
  },
});

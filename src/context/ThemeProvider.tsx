import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavDefaultTheme,
  ThemeProvider as NavigationProvider,
} from "@react-navigation/native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useMemo } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  adaptNavigationTheme,
  MD3DarkTheme,
  MD3LightTheme,
  PaperProvider,
} from "react-native-paper";
import { useUIStore } from "../store/useUIStore";
import {
  addAlpha,
  COLORS,
  getDynamicBackground,
  getDynamicSurface,
} from "../utils/theme";

const { LightTheme: AdaptedLight, DarkTheme: AdaptedDark } =
  adaptNavigationTheme({
    reactNavigationLight: NavDefaultTheme,
    reactNavigationDark: NavDarkTheme,
  });

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { colorScheme: systemColorScheme } = useColorScheme();
  const themeMode = useUIStore((state) => state.themeMode);
  const isAmoled = useUIStore((state) => state.isAmoled);
  const storedAccent = useUIStore((state) => state.accentColor);
  const accentColor = storedAccent || COLORS.primary;

  const isDark =
    themeMode === "system"
      ? systemColorScheme === "dark"
      : themeMode === "dark";

  const themeData = useMemo(() => {
    const effectiveAmoled = isDark && isAmoled;
    const mode = effectiveAmoled ? "amoled" : isDark ? "dark" : "light";
    const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;

    const bgColor = getDynamicBackground(accentColor, mode);
    const surfaceColor = getDynamicSurface(accentColor, mode);

    return {
      baseTheme,
      bgColor,
      surfaceColor,
      isDark,
    };
  }, [isDark, accentColor, isAmoled]);

  const { baseTheme, bgColor, surfaceColor } = themeData;

  // Shared values for animation
  const animBg = useSharedValue(bgColor);
  const animSurface = useSharedValue(surfaceColor);
  const animPrimary = useSharedValue(accentColor);

  useEffect(() => {
    animBg.value = withTiming(bgColor, { duration: 400 });
    animSurface.value = withTiming(surfaceColor, { duration: 400 });
    animPrimary.value = withTiming(accentColor, { duration: 400 });
  }, [bgColor, surfaceColor, accentColor, animBg, animSurface, animPrimary]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: animBg.value,
      flex: 1,
    };
  });

  const theme = useMemo(() => {
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: accentColor,
        background: bgColor,
        surface: surfaceColor,
        surfaceVariant: addAlpha(surfaceColor, 0.7),
        primaryContainer: addAlpha(accentColor, 0.1),
        onPrimaryContainer: accentColor,
        onSurface: isDark ? COLORS.text.dark : COLORS.text.light,
        onBackground: isDark ? COLORS.text.dark : COLORS.text.light,
        elevation: {
          ...baseTheme.colors.elevation,
          level1: surfaceColor,
          level2: addAlpha(surfaceColor, 0.9),
        },
      },
    };
  }, [baseTheme, accentColor, bgColor, surfaceColor, isDark]);

  const navigationTheme = useMemo(
    () => ({
      ...(isDark ? AdaptedDark : AdaptedLight),
      colors: {
        ...(isDark ? AdaptedDark.colors : AdaptedLight.colors),
        primary: accentColor,
        background: "transparent",
        card: theme.colors.surface,
        text: theme.colors.onSurface,
      },
    }),
    [isDark, accentColor, theme.colors.surface, theme.colors.onSurface],
  );

  return (
    <PaperProvider theme={theme}>
      <NavigationProvider value={navigationTheme}>
        <Animated.View style={animatedStyle}>{children}</Animated.View>
      </NavigationProvider>
    </PaperProvider>
  );
};

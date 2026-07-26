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

const fontConfig = {
  displayLarge: { fontFamily: "Inter_800ExtraBold", fontSize: 57, lineHeight: 64, letterSpacing: -0.25 },
  displayMedium: { fontFamily: "Inter_800ExtraBold", fontSize: 45, lineHeight: 52, letterSpacing: 0 },
  displaySmall: { fontFamily: "Inter_800ExtraBold", fontSize: 36, lineHeight: 44, letterSpacing: 0 },
  headlineLarge: { fontFamily: "Inter_700Bold", fontSize: 32, lineHeight: 40, letterSpacing: 0 },
  headlineMedium: { fontFamily: "Inter_700Bold", fontSize: 28, lineHeight: 36, letterSpacing: 0 },
  headlineSmall: { fontFamily: "Inter_700Bold", fontSize: 24, lineHeight: 32, letterSpacing: 0 },
  titleLarge: { fontFamily: "Inter_600SemiBold", fontSize: 22, lineHeight: 28, letterSpacing: 0 },
  titleMedium: { fontFamily: "Inter_600SemiBold", fontSize: 16, lineHeight: 24, letterSpacing: 0.15 },
  titleSmall: { fontFamily: "Inter_600SemiBold", fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },
  labelLarge: { fontFamily: "Inter_500Medium", fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },
  labelMedium: { fontFamily: "Inter_500Medium", fontSize: 12, lineHeight: 16, letterSpacing: 0.5 },
  labelSmall: { fontFamily: "Inter_500Medium", fontSize: 11, lineHeight: 16, letterSpacing: 0.5 },
  bodyLarge: { fontFamily: "Inter_400Regular", fontSize: 16, lineHeight: 24, letterSpacing: 0.5 },
  bodyMedium: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, letterSpacing: 0.25 },
  bodySmall: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
};

const { LightTheme: AdaptedLight, DarkTheme: AdaptedDark } =
  adaptNavigationTheme({
    reactNavigationLight: NavDefaultTheme,
    reactNavigationDark: NavDarkTheme,
  });

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { colorScheme: systemColorScheme } = useColorScheme();
  const { themeMode, isAmoled, accentColor: storedAccent } = useUIStore();
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
      fonts: {
        ...baseTheme.fonts,
        ...fontConfig,
      },
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

import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavDefaultTheme,
  ThemeProvider as NavigationProvider,
} from "@react-navigation/native";
import {
  PaperProvider,
  MD3DarkTheme,
  MD3LightTheme,
} from "react-native-paper";
import { useColorScheme } from "nativewind";
import React, { createContext, useContext, useEffect, useMemo } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { GluestackUIProvider, createConfig } from "@gluestack-ui/themed";
import { config as defaultConfig } from "@gluestack-ui/config";
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

export type AppTheme = {
  isDark: boolean;
  colors: {
    primary: string;
    onPrimary: string;
    background: string;
    surface: string;
    surfaceVariant: string;
    primaryContainer: string;
    onPrimaryContainer: string;
    onSurface: string;
    onBackground: string;
    outline: string;
    error: string;
    elevation: {
      level1: string;
      level2: string;
    };
  };
  fonts: typeof fontConfig;
};

const ThemeContext = createContext<AppTheme>({
  isDark: true,
  colors: {
    primary: COLORS.primary,
    onPrimary: "#ffffff",
    background: COLORS.background.dark,
    surface: COLORS.surface.dark,
    surfaceVariant: addAlpha(COLORS.surface.dark, 0.7),
    primaryContainer: addAlpha(COLORS.primary, 0.1),
    onPrimaryContainer: COLORS.primary,
    onSurface: COLORS.text.dark,
    onBackground: COLORS.text.dark,
    outline: "#94a3b8",
    error: COLORS.error,
    elevation: {
      level1: COLORS.surface.dark,
      level2: addAlpha(COLORS.surface.dark, 0.9),
    },
  },
  fonts: fontConfig,
});

export const useAppTheme = () => useContext(ThemeContext);
export const useTheme = useAppTheme; // Compatibility alias

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

    const bgColor = getDynamicBackground(accentColor, mode);
    const surfaceColor = getDynamicSurface(accentColor, mode);

    return {
      bgColor,
      surfaceColor,
      isDark,
    };
  }, [isDark, accentColor, isAmoled]);

  const { bgColor, surfaceColor } = themeData;

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

  const theme: AppTheme = useMemo(() => {
    return {
      isDark,
      fonts: fontConfig,
      colors: {
        primary: accentColor,
        onPrimary: "#ffffff",
        background: bgColor,
        surface: surfaceColor,
        surfaceVariant: addAlpha(surfaceColor, 0.7),
        primaryContainer: addAlpha(accentColor, 0.15),
        onPrimaryContainer: accentColor,
        onSurface: isDark ? COLORS.text.dark : COLORS.text.light,
        onBackground: isDark ? COLORS.text.dark : COLORS.text.light,
        outline: isDark ? "#94a3b8" : "#64748b",
        error: COLORS.error,
        elevation: {
          level1: surfaceColor,
          level2: addAlpha(surfaceColor, 0.9),
        },
      },
    };
  }, [accentColor, bgColor, surfaceColor, isDark]);


  const gluestackThemeConfig = useMemo(() => {
    const baseConfig = (defaultConfig as any)?.theme || defaultConfig || {};
    const baseTokens = baseConfig.tokens || {};
    const baseColors = baseTokens.colors || {};

    return createConfig({
      ...baseConfig,
      tokens: {
        ...baseTokens,
        colors: {
          ...baseColors,
          primary500: accentColor,
          primary600: addAlpha(accentColor, 0.8),
          primary700: addAlpha(accentColor, 0.9),
          primary400: addAlpha(accentColor, 0.7),
          primary300: addAlpha(accentColor, 0.5),
          primary200: addAlpha(accentColor, 0.3),
          primary100: addAlpha(accentColor, 0.15),
          primary50: addAlpha(accentColor, 0.08),
          textLight900: "#0f172a",
          textLight800: "#1e293b",
          textLight700: "#334155",
          textLight600: "#475569",
          textLight500: "#64748b",
          textLight400: "#94a3b8",
          textDark50: "#ffffff",
          textDark100: "#f8fafc",
          textDark200: "#e2e8f0",
          textDark300: "#cbd5e1",
          textDark400: "#94a3b8",
          textDark500: "#64748b",
        },
      },
    });
  }, [accentColor]);



  const paperTheme = useMemo(() => {
    const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;
    return {
      ...baseTheme,
      dark: isDark,
      colors: {
        ...baseTheme.colors,
        primary: accentColor,
        onPrimary: "#ffffff",
        primaryContainer: addAlpha(accentColor, 0.15),
        onPrimaryContainer: accentColor,
        background: bgColor,
        onBackground: isDark ? COLORS.text.dark : COLORS.text.light,
        surface: surfaceColor,
        onSurface: isDark ? COLORS.text.dark : COLORS.text.light,
        surfaceVariant: addAlpha(surfaceColor, 0.7),
        onSurfaceVariant: isDark ? "#cbd5e1" : "#475569",
        outline: isDark ? "#94a3b8" : "#64748b",
        elevation: {
          ...baseTheme.colors.elevation,
          level1: surfaceColor,
          level2: addAlpha(surfaceColor, 0.9),
        },
      },
    };
  }, [isDark, accentColor, bgColor, surfaceColor]);

  const navigationTheme = useMemo(
    () => ({
      ...(isDark ? NavDarkTheme : NavDefaultTheme),
      colors: {
        ...(isDark ? NavDarkTheme.colors : NavDefaultTheme.colors),
        primary: accentColor,
        background: "transparent",
        card: theme.colors.surface,
        text: theme.colors.onSurface,
      },
    }),
    [isDark, accentColor, theme.colors.surface, theme.colors.onSurface],
  );

  return (
    <GluestackUIProvider config={gluestackThemeConfig} colorMode={isDark ? "dark" : "light"}>
      <PaperProvider theme={paperTheme}>
        <ThemeContext.Provider value={theme}>
          <NavigationProvider value={navigationTheme}>
            <Animated.View style={animatedStyle}>{children}</Animated.View>
          </NavigationProvider>
        </ThemeContext.Provider>
      </PaperProvider>
    </GluestackUIProvider>
  );
};



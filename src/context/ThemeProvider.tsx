import {
    DarkTheme as NavDarkTheme,
    DefaultTheme as NavDefaultTheme,
    ThemeProvider as NavigationProvider,
} from "@react-navigation/native";
import React, { useMemo } from "react";
import { useColorScheme } from "react-native";
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
  const systemColorScheme = useColorScheme();
  const { themeMode, isAmoled } = useUIStore();
  const accentColor =
    useUIStore((state) => state.accentColor) || COLORS.primary;

  const isDark =
    themeMode === "system"
      ? systemColorScheme === "dark"
      : themeMode === "dark";

  const theme = useMemo(() => {
    const effectiveAmoled = isDark && isAmoled;
    const mode = effectiveAmoled ? "amoled" : isDark ? "dark" : "light";
    const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;

    const bgColor = getDynamicBackground(accentColor, mode);
    const surfaceColor = getDynamicSurface(accentColor, mode);

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
        elevation: {
          ...baseTheme.colors.elevation,
          level1: surfaceColor,
          level2: addAlpha(surfaceColor, 0.9),
        },
      },
    };
  }, [themeMode, isDark, accentColor, isAmoled]);

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
    [
      isDark,
      accentColor,
      theme.colors.background,
      theme.colors.surface,
      theme.colors.onSurface,
    ],
  );

  return (
    <PaperProvider theme={theme}>
      <NavigationProvider value={navigationTheme}>
        {children}
      </NavigationProvider>
    </PaperProvider>
  );
};

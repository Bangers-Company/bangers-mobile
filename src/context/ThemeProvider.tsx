import {
    DarkTheme as NavDarkTheme,
    DefaultTheme as NavDefaultTheme,
    ThemeProvider as NavigationProvider,
} from "@react-navigation/native";
import React, { useMemo } from "react";
import { useColorScheme } from "react-native";
import {
    PaperProvider,
    adaptNavigationTheme
} from "react-native-paper";
import { useMaterialYou } from "../hooks/useMaterialYou";
import { useUIStore } from "../store/useUIStore";
import { AppAmoledTheme, AppDarkTheme, AppLightTheme } from "../utils/theme";

const { LightTheme: AdaptedLight, DarkTheme: AdaptedDark } =
  adaptNavigationTheme({
    reactNavigationLight: NavDefaultTheme,
    reactNavigationDark: NavDarkTheme,
  });

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const themeMode = useUIStore((state) => state.themeMode);
  const { primary: accentColor } = useMaterialYou();

  const isDark =
    themeMode === "system"
      ? systemColorScheme === "dark"
      : themeMode !== "light";

  const theme = useMemo(() => {
    let baseTheme;
    if (themeMode === "amoled") {
      baseTheme = AppAmoledTheme;
    } else if (isDark) {
      baseTheme = AppDarkTheme;
    } else {
      baseTheme = AppLightTheme;
    }

    // Apply Material YOU accent if applicable (stubbed in useMaterialYou)
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: accentColor,
      },
    };
  }, [themeMode, isDark, accentColor]);

  const navigationTheme = useMemo(
    () => ({
      ...(isDark ? AdaptedDark : AdaptedLight),
      colors: {
        ...(isDark ? AdaptedDark.colors : AdaptedLight.colors),
        primary: accentColor,
        background: theme.colors.background,
      },
    }),
    [isDark, accentColor, theme.colors.background],
  );

  return (
    <PaperProvider theme={theme}>
      <NavigationProvider value={navigationTheme}>
        {children}
      </NavigationProvider>
    </PaperProvider>
  );
};

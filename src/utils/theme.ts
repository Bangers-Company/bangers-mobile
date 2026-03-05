import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";

export const COLORS = {
  primary: "#a60df2",
  background: {
    light: "#f7f5f8",
    dark: "#1c1022",
    amoled: "#0a050c", // As seen in Event Details wireframe
  },
  surface: {
    light: "#ffffff",
    dark: "#2d1b36",
    amoled: "#12081a",
  },
  text: {
    light: "#1c1022",
    dark: "#f7f5f8",
    amoled: "#f7f5f8",
  },
  error: "#ff5252",
};

export const AppLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background.light,
    surface: COLORS.surface.light,
    onSurface: COLORS.text.light,
    secondaryContainer: "#f0e6f7",
  },
};

export const AppDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background.dark,
    surface: COLORS.surface.dark,
    onSurface: COLORS.text.dark,
    secondaryContainer: "#3d264a",
  },
};

export const AppAmoledTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background.amoled,
    surface: COLORS.surface.amoled,
    onSurface: COLORS.text.amoled,
    secondaryContainer: "#261233",
  },
};

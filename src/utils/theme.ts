export const COLORS = {
  primary: "#a60df2",
  background: {
    light: "#f7f5f8",
    dark: "#1c1022",
    amoled: "#000000",
  },
  surface: {
    light: "#ffffff",
    dark: "#2d1b36",
    amoled: "#12081a",
  },
  text: {
    light: "#0f172a",
    dark: "#ffffff",
    amoled: "#ffffff",
  },
  error: "#ff5252",
};

/**
 * Generates a background color based on the accent color and theme mode.
 */
export const getDynamicBackground = (
  accentColor: string | null,
  mode: "light" | "dark" | "amoled",
) => {
  if (mode === "amoled") return "#000000";

  const accent = accentColor || COLORS.primary;
  const r = parseInt(accent.slice(1, 3), 16);
  const g = parseInt(accent.slice(3, 5), 16);
  const b = parseInt(accent.slice(5, 7), 16);

  const toHex = (c: number) =>
    Math.max(0, Math.min(255, Math.round(c)))
      .toString(16)
      .padStart(2, "0");

  if (mode === "light") {
    const nr = Math.round(255 * 0.97 + r * 0.03);
    const ng = Math.round(255 * 0.97 + g * 0.03);
    const nb = Math.round(255 * 0.97 + b * 0.03);
    return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
  } else {
    const nr = Math.round(15 * 0.95 + r * 0.05);
    const ng = Math.round(15 * 0.95 + g * 0.05);
    const nb = Math.round(15 * 0.95 + b * 0.05);
    return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
  }
};

/**
 * Generates consistent, smooth gradient colors for container backgrounds.
 * Eliminates harsh accent color flashes during screen transitions.
 */
export const getGradientColors = (
  accentColor: string | null,
  mode: "light" | "dark" | "amoled",
): string[] => {
  if (mode === "amoled") return ["#000000", "#000000"];

  const accent = accentColor || COLORS.primary;
  const r = parseInt(accent.slice(1, 3), 16);
  const g = parseInt(accent.slice(3, 5), 16);
  const b = parseInt(accent.slice(5, 7), 16);

  const toHex = (c: number) =>
    Math.max(0, Math.min(255, Math.round(c)))
      .toString(16)
      .padStart(2, "0");

  if (mode === "light") {
    const start = `#f8f9fa`;
    const endR = Math.round(255 * 0.94 + r * 0.06);
    const endG = Math.round(255 * 0.94 + g * 0.06);
    const endB = Math.round(255 * 0.94 + b * 0.06);
    const end = `#${toHex(endR)}${toHex(endG)}${toHex(endB)}`;
    return [start, end];
  } else {
    const start = "#0f0f14";
    const endR = Math.round(15 * 0.9 + r * 0.1);
    const endG = Math.round(15 * 0.9 + g * 0.1);
    const endB = Math.round(15 * 0.9 + b * 0.1);
    const end = `#${toHex(endR)}${toHex(endG)}${toHex(endB)}`;
    return [start, end];
  }
};

export const getDynamicSurface = (
  accentColor: string | null,
  mode: "light" | "dark" | "amoled",
) => {
  if (mode === "amoled") return "#12081a";

  const accent = accentColor || COLORS.primary;
  const r = parseInt(accent.slice(1, 3), 16);
  const g = parseInt(accent.slice(3, 5), 16);
  const b = parseInt(accent.slice(5, 7), 16);

  const toHex = (c: number) =>
    Math.max(0, Math.min(255, Math.round(c)))
      .toString(16)
      .padStart(2, "0");

  if (mode === "light") {
    return "#ffffff";
  } else {
    const nr = Math.round(24 * 0.92 + r * 0.08);
    const ng = Math.round(24 * 0.92 + g * 0.08);
    const nb = Math.round(24 * 0.92 + b * 0.08);
    return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
  }
};

export const addAlpha = (hexColor: string, alpha: number): string => {
  if (!hexColor || !hexColor.startsWith("#")) return hexColor;
  const normalizedHex = hexColor.length === 4 
    ? `#${hexColor[1]}${hexColor[1]}${hexColor[2]}${hexColor[2]}${hexColor[3]}${hexColor[3]}` 
    : hexColor;
  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  const alphaHex = Math.round(clampedAlpha * 255)
    .toString(16)
    .padStart(2, "0");
  return `${normalizedHex.slice(0, 7)}${alphaHex}`;
};

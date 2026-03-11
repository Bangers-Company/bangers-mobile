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
    light: "#1c1022",
    dark: "#f7f5f8",
    amoled: "#f7f5f8",
  },
  error: "#ff5252",
};

/**
 * Generates a background color based on the accent color and theme mode.
 * @param accentColor The chosen accent color in hex format
 * @param mode 'light' | 'dark' | 'amoled'
 */
export const getDynamicBackground = (
  accentColor: string | null,
  mode: "light" | "dark" | "amoled",
) => {
  if (mode === "amoled") return "#000000";

  const accent = accentColor || COLORS.primary;

  // Simple hex to rgb
  const r = parseInt(accent.slice(1, 3), 16);
  const g = parseInt(accent.slice(3, 5), 16);
  const b = parseInt(accent.slice(5, 7), 16);

  const toHex = (c: number) =>
    Math.max(0, Math.min(255, Math.round(c)))
      .toString(16)
      .padStart(2, "0");

  if (mode === "light") {
    // Subtler background tint (4% mix)
    const nr = Math.round(255 * 0.96 + r * 0.04);
    const ng = Math.round(255 * 0.96 + g * 0.04);
    const nb = Math.round(255 * 0.96 + b * 0.04);
    return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
  } else {
    // Dark mode: Use neutral base (18, 18, 18) to avoid color clashing
    // Mix 7% accent for slightly more visible tint
    const nr = Math.round(18 * 0.93 + r * 0.07);
    const ng = Math.round(18 * 0.93 + g * 0.07);
    const nb = Math.round(18 * 0.93 + b * 0.07);
    return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
  }
};

/**
 * Generates gradient colors based on the accent color and theme mode.
 * @returns [color1, color2]
 */
export const getGradientColors = (
  accentColor: string | null,
  mode: "light" | "dark" | "amoled",
): string[] => {
  if (mode === "amoled") return ["#000000", "#000000"];

  const accent = accentColor || COLORS.primary;

  // Simple hex to rgb
  const r = parseInt(accent.slice(1, 3), 16);
  const g = parseInt(accent.slice(3, 5), 16);
  const b = parseInt(accent.slice(5, 7), 16);

  const toHex = (c: number) =>
    Math.max(0, Math.min(255, Math.round(c)))
      .toString(16)
      .padStart(2, "0");

  if (mode === "light") {
    // Light mode: White at top, color tint at bottom
    const start = `#ffffff`;
    const endR = Math.round(255 * 0.85 + r * 0.15);
    const endG = Math.round(255 * 0.85 + g * 0.15);
    const endB = Math.round(255 * 0.85 + b * 0.15);
    const end = `#${toHex(endR)}${toHex(endG)}${toHex(endB)}`;
    return [start, end];
  } else {
    // Dark mode: Dark base at top, color tint at bottom
    const start = "#0a050c";
    const endR = Math.round(r * 0.2);
    const endG = Math.round(g * 0.2);
    const endB = Math.round(b * 0.2);
    const end = `#${toHex(endR)}${toHex(endG)}${toHex(endB)}`;
    return [start, end];
  }
};

/**
 * Generates a surface color based on the accent color and theme mode.
 */
export const getDynamicSurface = (
  accentColor: string | null,
  mode: "light" | "dark" | "amoled",
) => {
  if (mode === "amoled") return "#12081a"; // Keep amoled surface consistent

  const accent = accentColor || COLORS.primary;
  const r = parseInt(accent.slice(1, 3), 16);
  const g = parseInt(accent.slice(3, 5), 16);
  const b = parseInt(accent.slice(5, 7), 16);

  const toHex = (c: number) =>
    Math.max(0, Math.min(255, Math.round(c)))
      .toString(16)
      .padStart(2, "0");

  if (mode === "light") {
    // Subtler surface (4% mix)
    const nr = Math.round(255 * 0.96 + r * 0.04);
    const ng = Math.round(255 * 0.96 + g * 0.04);
    const nb = Math.round(255 * 0.96 + b * 0.04);
    return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
  } else {
    // Use neutral dark surface base (30, 30, 30)
    // Mix 12% accent for vibrant surfaces (popovers, cards)
    const nr = Math.round(30 * 0.88 + r * 0.12);
    const ng = Math.round(30 * 0.88 + g * 0.12);
    const nb = Math.round(30 * 0.88 + b * 0.12);
    return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
  }
};

/**
 * Safely adds alpha transparency to a color string (hex, rgb, or rgba).
 * @param color Color string
 * @param opacity Opacity from 0 to 1
 */
export const addAlpha = (color: string, opacity: number) => {
  // If it's already rgba, replace the alpha channel
  if (color.startsWith("rgba")) {
    return color.replace(/[\d\.]+\)$/g, `${opacity})`);
  }

  // If it's rgb, convert to rgba
  if (color.startsWith("rgb")) {
    return color.replace("rgb", "rgba").replace(/\)$/g, `, ${opacity})`);
  }

  // If it's hex, append hex alpha
  if (color.startsWith("#")) {
    const alpha = Math.round(opacity * 255)
      .toString(16)
      .padStart(2, "0");
    return `${color}${alpha}`;
  }

  return color;
};

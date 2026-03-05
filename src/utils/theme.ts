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

  if (mode === "light") {
    // For light mode: mix 99% white with 1% accent
    const nr = Math.round(255 * 0.99 + r * 0.01);
    const ng = Math.round(255 * 0.99 + g * 0.01);
    const nb = Math.round(255 * 0.99 + b * 0.01);
    return `rgb(${nr}, ${ng}, ${nb})`;
  } else {
    // For dark mode: mix 97% near-black with 3% accent
    // Using a base dark color of #0a050c (very dark)
    const nr = Math.round(10 * 0.97 + r * 0.03);
    const ng = Math.round(5 * 0.97 + g * 0.03);
    const nb = Math.round(12 * 0.97 + b * 0.03);
    return `rgb(${nr}, ${ng}, ${nb})`;
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

  if (mode === "light") {
    // Even more subtle highlight for surface
    const nr = Math.round(255 * 0.98 + r * 0.02);
    const ng = Math.round(255 * 0.98 + g * 0.02);
    const nb = Math.round(255 * 0.98 + b * 0.02);
    return `rgb(${nr}, ${ng}, ${nb})`;
  } else {
    // Slightly lighter than background for dark mode surface
    const nr = Math.round(25 * 0.95 + r * 0.05);
    const ng = Math.round(15 * 0.95 + g * 0.05);
    const nb = Math.round(30 * 0.95 + b * 0.05);
    return `rgb(${nr}, ${ng}, ${nb})`;
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

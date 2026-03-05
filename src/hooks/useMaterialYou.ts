import { Platform } from "react-native";
import { useUIStore } from "../store/useUIStore";
import { COLORS } from "../utils/theme";

export const useMaterialYou = () => {
  const accentColor = useUIStore((state) => state.accentColor);

  // In a real Android environment with react-native-material-you,
  // we would extract the system accent color here.
  // For now, we return the user-selected accent color or the default primary.

  const isAndroid = Platform.OS === "android";

  return {
    primary: accentColor || COLORS.primary,
    isSupported: isAndroid,
  };
};

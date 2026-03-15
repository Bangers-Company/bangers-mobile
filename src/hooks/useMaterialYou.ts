import { Platform } from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "../store/redux/store";
import { COLORS } from "../utils/theme";

export const useMaterialYou = () => {
  const accentColor = useSelector((state: RootState) => state.ui.accentColor);

  // In a real Android environment with react-native-material-you,
  // we would extract the system accent color here.
  // For now, we return the user-selected accent color or the default primary.

  const isAndroid = Platform.OS === "android";

  return {
    primary: accentColor || COLORS.primary,
    isSupported: isAndroid,
  };
};

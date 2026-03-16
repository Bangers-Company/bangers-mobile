import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import {
  Calendar,
  Home,
  LucideIcon,
  Music2,
  Search,
  User,
  Users,
} from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Text, TouchableRipple, useTheme } from "react-native-paper";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { RootState } from "../../store/redux/store";
import { addAlpha } from "../../utils/theme";
import { useSharedScroll } from "../../hooks/useSharedScroll";

interface NavItem {
  label: string;
  icon: LucideIcon;
  route: string;
}

export const BottomNav: React.FC = () => {
  const theme = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { isBottomNavVisible } = useSelector((state: RootState) => state.ui);
  const scrollOffset = useSharedScroll();
  const insets = useSafeAreaInsets();

  const isEventPage = pathname.startsWith("/event/");
  const pathSegments = pathname.split("/");
  const eventId = isEventPage ? pathSegments[2] : null;

  const dashboardItems: NavItem[] = [
    { label: "Home", icon: Home, route: "/(tabs)/" },
    { label: "Search", icon: Search, route: "/(tabs)/search" },
    { label: "Profile", icon: User, route: "/(tabs)/profile" },
  ];

  const eventItems: NavItem[] = eventId
    ? [
        { label: "Home", icon: Home, route: `/event/${eventId}` },
        { label: "Line-up", icon: Music2, route: `/event/${eventId}/lineup` },
        {
          label: "Schedule",
          icon: Calendar,
          route: `/event/${eventId}/schedule`,
        },
        { label: "Visitors", icon: Users, route: `/event/${eventId}/visitors` },
      ]
    : [];

  const items = isEventPage ? eventItems : dashboardItems;

  const renderItem = (item: NavItem, index: number) => {
    // Determine active state with strict matching for event routes
    const isActive =
      pathname === item.route ||
      (item.route === "/(tabs)/" &&
        (pathname === "/" || pathname === "/home")) ||
      (item.route === "/(tabs)/search" && pathname === "/search") ||
      (item.route === "/(tabs)/profile" && pathname === "/profile");
    const Icon = item.icon;

    return (
      <TouchableRipple
        key={index}
        onPress={() => router.navigate(item.route as any)}
        rippleColor={addAlpha(theme.colors.primary, 0.2)}
        style={[styles.item]}
      >
        <View style={styles.itemContent}>
          {isActive && (
            <LinearGradient
              colors={[
                addAlpha(theme.colors.primary, 0.15),
                addAlpha(theme.colors.primary, 0.05),
              ]}
              style={StyleSheet.absoluteFillObject}
            />
          )}
          <Icon
            size={24}
            color={isActive ? theme.colors.primary : theme.colors.outline}
            strokeWidth={isActive ? 2.5 : 2}
          />
          {isActive && (
            <Text
              variant="labelSmall"
              style={[
                styles.label,
                {
                  color: isActive ? theme.colors.primary : theme.colors.outline,
                },
              ]}
            >
              {item.label}
            </Text>
          )}
        </View>
      </TouchableRipple>
    );
  };

  const bgColorTo = addAlpha(theme.colors.surface, 0.85);
  const borderColorTo = addAlpha(theme.colors.outlineVariant, 0.3);

  const animatedContainerStyle = useAnimatedStyle(() => {
    const offset = scrollOffset.value;
    const margin = interpolate(offset, [0, 50], [0, 24], "clamp");
    const borderRadius = interpolate(offset, [0, 50], [0, 100], "clamp");
    const bottomPos = interpolate(
      offset,
      [0, 50],
      [0, insets.bottom + 16],
      "clamp",
    );
    const paddingBottom = interpolate(
      offset,
      [0, 50],
      [insets.bottom + 8, 8],
      "clamp",
    );
    const opacity = interpolate(offset, [0, 50], [0, 0.2], "clamp");

    // Dynamic color values
    const bgColor = interpolateColor(
      offset,
      [0, 50],
      [theme.colors.surface, bgColorTo],
    );
    const borderColor = interpolateColor(
      offset,
      [0, 50],
      [theme.colors.outlineVariant, borderColorTo],
    );

    return {
      marginHorizontal: margin,
      borderRadius: borderRadius,
      bottom: bottomPos,
      paddingBottom: paddingBottom,
      shadowOpacity: opacity,
      left: margin,
      right: margin,
      backgroundColor: bgColor,
      borderColor: borderColor,
    };
  });

  if (!isBottomNavVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        animatedContainerStyle,
        {
          shadowColor: theme.colors.shadow,
        },
      ]}
    >
      <View style={styles.inner}>{items.map(renderItem)}</View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    padding: 8,
  },
  item: {
    borderRadius: 100,
    overflow: "hidden",
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  label: {
    fontWeight: "700",
    textTransform: "uppercase",
    fontSize: 10,
  },
});

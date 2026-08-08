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
import { Text, Pressable } from "@gluestack-ui/themed";
import { useAppTheme } from "../../context/ThemeProvider";
import { useTranslation } from "react-i18next";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
} from "react-native-reanimated";


import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUIStore } from "../../store/useUIStore";
import { addAlpha } from "../../utils/theme";
import { useSharedScroll } from "../../hooks/useSharedScroll";

interface NavItem {
  label: string;
  icon: LucideIcon;
  route: string;
}

export const BottomNav: React.FC = () => {
  const theme = useAppTheme();
  const pathname = usePathname();
  const router = useRouter();
  const isBottomNavVisible = useUIStore((state) => state.isBottomNavVisible);
  const scrollOffset = useSharedScroll();
  const insets = useSafeAreaInsets();

  const isEventPage = pathname.startsWith("/event/");
  const pathSegments = pathname.split("/");
  const eventId = isEventPage ? pathSegments[2] : null;

  const { t } = useTranslation();
  const dashboardItems: NavItem[] = [
    { label: t("navigation.home"), icon: Home, route: "/(tabs)/" },
    { label: t("common.search"), icon: Search, route: "/(tabs)/search" },
    { label: t("navigation.profile"), icon: User, route: "/(tabs)/profile" },
  ];

  const eventItems: NavItem[] = eventId
    ? [
        { label: t("navigation.home"), icon: Home, route: `/event/${eventId}` },
        { label: t("navigation.lineup"), icon: Music2, route: `/event/${eventId}/lineup` },
        {
          label: t("navigation.schedule"),
          icon: Calendar,
          route: `/event/${eventId}/schedule`,
        },
        { label: t("navigation.visitors"), icon: Users, route: `/event/${eventId}/visitors` },
      ]
    : [];

  const items = isEventPage ? eventItems : dashboardItems;

  const renderItem = (item: NavItem, index: number) => {
    const isActive =
      pathname === item.route ||
      (item.route === "/(tabs)/" &&
        (pathname === "/" || pathname === "/home")) ||
      (item.route === "/(tabs)/search" && pathname === "/search") ||
      (item.route === "/(tabs)/profile" && pathname === "/profile");
    const Icon = item.icon;

    const inactiveColor = theme.isDark ? "#94a3b8" : "#64748b";

    return (
      <Pressable
        key={index}
        onPress={() => router.navigate(item.route as any)}
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
            color={isActive ? theme.colors.primary : inactiveColor}
            strokeWidth={isActive ? 2.5 : 2}
          />
          {isActive && (
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? theme.colors.primary : inactiveColor,
                },
              ]}
            >
              {item.label}
            </Text>
          )}
        </View>
      </Pressable>
    );

  };

  const surfaceFrom = theme.colors.surface || "#ffffff";
  const surfaceVariantFrom = theme.colors.surfaceVariant || "#e0e0e0";

  const bgColorStart = addAlpha(surfaceFrom, 1);
  const bgColorEnd = addAlpha(surfaceFrom, 0.85);
  const borderColorStart = addAlpha(surfaceVariantFrom, 1);
  const borderColorEnd = addAlpha(surfaceVariantFrom, 0.3);

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

    const bgColor = interpolateColor(
      offset,
      [0, 50],
      [bgColorStart, bgColorEnd],
    );
    const borderColor = interpolateColor(
      offset,
      [0, 50],
      [borderColorStart, borderColorEnd],
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
          shadowColor: "#000",
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


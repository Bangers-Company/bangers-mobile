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
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Text, Pressable } from "@gluestack-ui/themed";
import { useAppTheme } from "../../context/ThemeProvider";
import { useTranslation } from "react-i18next";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { format, parseISO } from "date-fns";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUIStore } from "../../store/useUIStore";
import { useTimetableStore } from "../../store/useTimetableStore";
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

  const availableDays = useTimetableStore((state) => state.availableDays);
  const selectedDay = useTimetableStore((state) => state.selectedDay);
  const setSelectedDay = useTimetableStore((state) => state.setSelectedDay);

  const isEventPage = pathname.startsWith("/event/");
  const pathSegments = pathname.split("/");
  const eventId = isEventPage ? pathSegments[2] : null;
  const isSchedulePage = isEventPage && pathname.endsWith("/schedule");

  const showDayTabs = isSchedulePage;

  // Floating transition animation progress shared value
  const floatingProgress = useSharedValue(showDayTabs ? 1 : 0);

  // Trigger animation safely inside useEffect
  useEffect(() => {
    floatingProgress.value = withTiming(showDayTabs ? 1 : 0, {
      duration: 180,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [showDayTabs, floatingProgress]);

  const { t, i18n } = useTranslation();
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

  const animatedItemContentStyle = useAnimatedStyle(() => {
    const scrollFloat = interpolate(scrollOffset.value, [0, 50], [0, 1], "clamp");
    const floatVal = Math.max(scrollFloat, floatingProgress.value);
    return {
      paddingHorizontal: interpolate(floatVal, [0, 1], [16, 12], "clamp"),
      paddingVertical: interpolate(floatVal, [0, 1], [8, 6], "clamp"),
      gap: interpolate(floatVal, [0, 1], [8, 5], "clamp"),
    };
  });

  const renderNavItem = (item: NavItem, index: number) => {
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
        <Animated.View style={[styles.itemContent, animatedItemContentStyle]}>
          {isActive && (
            <LinearGradient
              colors={[
                addAlpha(theme.colors.primary, 0.18),
                addAlpha(theme.colors.primary, 0.06),
              ]}
              style={StyleSheet.absoluteFillObject}
            />
          )}
          <Icon
            size={21}
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
        </Animated.View>
      </Pressable>
    );
  };

  const renderDayItem = (day: string) => {
    const isActive = selectedDay === day;
    let dayLabel = "";
    try {
      const dateObj = new Date(day.includes("T") ? day : `${day}T12:00:00`);
      const rawName = dateObj.toLocaleDateString(i18n.language || "nl-NL", { weekday: "long" });
      dayLabel = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    } catch {
      dayLabel = day;
    }

    return (
      <Pressable
        key={day}
        onPress={() => setSelectedDay(day)}
        style={[
          styles.dayTab,
          isActive
            ? {
                backgroundColor: addAlpha(theme.colors.primary, 0.16),
                borderColor: theme.colors.primary,
              }
            : {
                backgroundColor: addAlpha(theme.colors.surfaceVariant, 0.35),
                borderColor: addAlpha(theme.colors.outline, 0.12),
              },
        ]}
      >
        {isActive && (
          <View
            style={[
              styles.activeDot,
              { backgroundColor: theme.colors.primary },
            ]}
          />
        )}
        <Text
          style={[
            styles.dayTabText,
            {
              color: isActive
                ? theme.colors.primary
                : addAlpha(theme.colors.onSurface, 0.65),
            },
            isActive && styles.dayTabTextActive,
          ]}
          numberOfLines={1}
        >
          {dayLabel}
        </Text>
      </Pressable>
    );
  };

  const surfaceFrom = theme.colors.surface || "#ffffff";
  const surfaceVariantFrom = theme.colors.surfaceVariant || "#e0e0e0";

  const bgColorStart = addAlpha(surfaceFrom, 1);
  const bgColorEnd = addAlpha(surfaceFrom, 0.94);
  const borderColorStart = addAlpha(surfaceVariantFrom, 1);
  const borderColorEnd = addAlpha(theme.colors.primary, 0.3);

  const animatedContainerStyle = useAnimatedStyle(() => {
    const scrollFloat = interpolate(scrollOffset.value, [0, 50], [0, 1], "clamp");
    const floatVal = Math.max(scrollFloat, floatingProgress.value);

    // Dynamic morphing into a 100% capsule stadium pill
    const margin = interpolate(floatVal, [0, 1], [0, 24], "clamp");
    const borderRadius = interpolate(floatVal, [0, 1], [0, 100], "clamp");
    const bottomPos = interpolate(
      floatVal,
      [0, 1],
      [0, Math.max(insets.bottom + 10, 18)],
      "clamp",
    );
    const paddingBottom = interpolate(
      floatVal,
      [0, 1],
      [insets.bottom + 8, 0],
      "clamp",
    );
    const shadowOpacity = interpolate(floatVal, [0, 1], [0, 0.32], "clamp");

    const bgColor = interpolateColor(
      floatVal,
      [0, 1],
      [bgColorStart, bgColorEnd],
    );
    const borderColor = interpolateColor(
      floatVal,
      [0, 1],
      [borderColorStart, borderColorEnd],
    );

    return {
      marginHorizontal: margin,
      borderRadius: borderRadius,
      bottom: bottomPos,
      paddingBottom: paddingBottom,
      shadowOpacity: shadowOpacity,
      left: margin,
      right: margin,
      backgroundColor: bgColor,
      borderColor: borderColor,
    };
  });

  const navItemsStyle = useAnimatedStyle(() => ({
    opacity: 1 - floatingProgress.value,
    transform: [{ scale: interpolate(floatingProgress.value, [0, 1], [1, 0.94]) }],
  }));

  const dayItemsStyle = useAnimatedStyle(() => ({
    opacity: floatingProgress.value,
    transform: [{ scale: interpolate(floatingProgress.value, [0, 1], [0.94, 1]) }],
  }));

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
      <View style={{ position: "relative", width: "100%" }}>
        {/* Layer 1: Event Navigation Icons */}
        <Animated.View
          style={[styles.inner, navItemsStyle]}
          pointerEvents={showDayTabs ? "none" : "auto"}
        >
          {items.map(renderNavItem)}
        </Animated.View>

        {/* Layer 2: Timetable Day Tabs (Overlayed seamlessly without rebuilding) */}
        <Animated.View
          style={[styles.dayInner, dayItemsStyle, styles.overlayLayer]}
          pointerEvents={showDayTabs ? "auto" : "none"}
        >
          {availableDays.length > 0 ? availableDays.map(renderDayItem) : null}
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    elevation: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  overlayLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dayInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  dayTab: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginHorizontal: 3,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    gap: 4,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  dayTabText: {
    fontWeight: "800",
    textTransform: "uppercase",
    fontSize: 11,
    letterSpacing: 0.4,
  },
  dayTabTextActive: {
    fontWeight: "900",
  },
  item: {
    borderRadius: 100,
    overflow: "hidden",
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 100,
    overflow: "hidden",
  },
  label: {
    fontWeight: "800",
    textTransform: "uppercase",
    fontSize: 10,
    letterSpacing: 0.4,
  },
});

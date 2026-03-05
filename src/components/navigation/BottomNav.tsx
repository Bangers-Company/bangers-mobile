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
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

interface NavItem {
  label: string;
  icon: LucideIcon;
  route: string;
}

export const BottomNav: React.FC = () => {
  const theme = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const isEventPage = pathname.startsWith("/event/");

  const dashboardItems: NavItem[] = [
    { label: "Home", icon: Home, route: "/(tabs)/home" },
    { label: "Search", icon: Search, route: "/(tabs)/search" },
    { label: "Profile", icon: User, route: "/(tabs)/profile" },
  ];

  const eventItems: NavItem[] = [
    { label: "Home", icon: Home, route: "/" },
    { label: "Line-up", icon: Music2, route: `${pathname}/lineup` },
    { label: "Schedule", icon: Calendar, route: `${pathname}/schedule` },
    { label: "Visitors", icon: Users, route: `${pathname}/visitors` },
  ];

  const items = isEventPage ? eventItems : dashboardItems;

  const renderItem = (item: NavItem, index: number) => {
    const isActive =
      pathname === item.route || (item.route === "/" && pathname === "/home");
    const Icon = item.icon;

    return (
      <TouchableOpacity
        key={index}
        onPress={() => router.push(item.route as any)}
        style={[
          styles.item,
          isActive &&
            !isEventPage && {
              backgroundColor: theme.colors.primary,
              borderRadius: 100,
            },
        ]}
      >
        <Icon
          size={24}
          color={
            isActive
              ? isEventPage
                ? theme.colors.primary
                : "white"
              : theme.colors.outline
          }
          strokeWidth={isActive ? 2.5 : 2}
        />
        {(isActive || isEventPage) && (
          <Text
            variant="labelSmall"
            style={[
              styles.label,
              {
                color: isActive
                  ? isEventPage
                    ? theme.colors.primary
                    : "white"
                  : theme.colors.outline,
              },
            ]}
          >
            {item.label}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.container,
        isEventPage ? styles.eventContainer : styles.dashboardContainer,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.outlineVariant,
          shadowColor: theme.colors.shadow,
        },
      ]}
    >
      <View style={styles.inner}>{items.map(renderItem)}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    borderRadius: 100,
    borderWidth: 1,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  dashboardContainer: {
    marginHorizontal: 32,
  },
  eventContainer: {
    marginHorizontal: 16,
    borderRadius: 24,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    padding: 8,
  },
  item: {
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

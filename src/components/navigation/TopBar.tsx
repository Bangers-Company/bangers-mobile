import { usePathname, useRouter } from "expo-router";
import {
    Bell,
    Calendar,
    History as HistoryIcon,
    LogOut,
    Settings,
    User,
} from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";
import {
    Avatar,
    Divider,
    IconButton,
    Menu,
    Text,
    TouchableRipple,
    useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/useAuthStore";

export const TopBar: React.FC = () => {
  const { top } = useSafeAreaInsets();
  const theme = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [menuVisible, setMenuVisible] = React.useState(false);

  const isEventPage = pathname.startsWith("/event/");

  if (isEventPage) {
    return (
      <View style={[styles.eventHeader, { top: top + 10 }]}>
        <IconButton
          icon="chevron-left"
          mode="contained"
          containerColor="rgba(0,0,0,0.3)"
          iconColor="white"
          onPress={() => router.back()}
        />
        <IconButton
          icon="share-variant"
          mode="contained"
          containerColor="rgba(0,0,0,0.3)"
          iconColor="white"
          onPress={() => {}}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: top + 10, backgroundColor: theme.colors.background },
      ]}
    >
      <View style={styles.content}>
        <Text
          variant="headlineMedium"
          style={[styles.logo, { color: theme.colors.primary }]}
        >
          Bangers
        </Text>

        <View style={styles.rightSection}>
          <IconButton
            icon={() => (
              <Bell size={24} color={theme.colors.onSurfaceVariant} />
            )}
            onPress={() => {}}
          />
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            contentStyle={[
              styles.menuContent,
              { backgroundColor: theme.colors.surface },
            ]}
            anchor={
              <TouchableRipple
                onPress={() => setMenuVisible(true)}
                style={styles.avatarWrapper}
                rippleColor="rgba(0, 0, 0, .1)"
              >
                <Avatar.Image
                  size={40}
                  source={{
                    uri:
                      user?.profile_media?.url ||
                      "https://via.placeholder.com/40",
                  }}
                />
              </TouchableRipple>
            }
          >
            {/* Section 1: Profile */}
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                router.push("/(tabs)/profile" as any);
              }}
              leadingIcon={() => (
                <User size={20} color={theme.colors.primary} />
              )}
              title="My Profile"
              titleStyle={styles.menuTitle}
            />

            <Divider style={styles.menuDivider} />

            {/* Section 2: Events */}
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
              }}
              leadingIcon={() => (
                <Calendar size={20} color={theme.colors.onSurfaceVariant} />
              )}
              title="Attended Events"
              titleStyle={styles.menuTitle}
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
              }}
              leadingIcon={() => (
                <HistoryIcon size={20} color={theme.colors.onSurfaceVariant} />
              )}
              title="Past Events"
              titleStyle={styles.menuTitle}
            />

            <Divider style={styles.menuDivider} />

            {/* Section 3: Settings & Logout */}
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                router.push("/settings");
              }}
              leadingIcon={() => (
                <Settings size={20} color={theme.colors.onSurfaceVariant} />
              )}
              title="Settings"
              titleStyle={styles.menuTitle}
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                useAuthStore.getState().logout();
                router.replace("/(auth)/login");
              }}
              leadingIcon={() => (
                <LogOut size={20} color={theme.colors.error} />
              )}
              title="Logout"
              titleStyle={[styles.menuTitle, { color: theme.colors.error }]}
            />
          </Menu>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    fontWeight: "800",
    letterSpacing: -1,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eventHeader: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 100,
  },
  avatarWrapper: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  menuContent: {
    borderRadius: 16,
    paddingVertical: 8,
    marginTop: 40,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  menuDivider: {
    marginVertical: 4,
    opacity: 0.5,
  },
});

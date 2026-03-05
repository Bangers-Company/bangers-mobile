import { usePathname, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Avatar, IconButton, Menu, Text, useTheme } from "react-native-paper";
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
  const isDashboard =
    pathname === "/" || pathname === "/home" || pathname.includes("(tabs)");

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
          <IconButton icon="bell-outline" size={24} onPress={() => {}} />

          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <TouchableOpacity onPress={() => setMenuVisible(true)}>
                <Avatar.Image
                  size={40}
                  source={{
                    uri:
                      user?.profile_media?.url ||
                      "https://via.placeholder.com/40",
                  }}
                />
              </TouchableOpacity>
            }
          >
            <Menu.Item
              onPress={() => router.push("/profile")}
              title="Profile"
            />
            <Menu.Item onPress={() => {}} title="Settings" />
            <Menu.Item
              onPress={() => useAuthStore.getState().logout()}
              title="Logout"
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
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.1)",
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
});

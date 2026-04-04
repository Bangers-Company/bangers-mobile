import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  Bell,
  Calendar,
  History as HistoryIcon,
  LogOut,
  Settings,
  User,
} from "lucide-react-native";
import React, { useMemo } from "react";
import {
  InteractionManager,
  StyleSheet,
  View,
} from "react-native";
import {
  Avatar,
  Badge,
  Divider,
  IconButton,
  Menu,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useFriendRequests } from "../../hooks/useFriendship";
import { useAuthStore } from "../../store/useAuthStore";
import { useTimetableStore } from "../../store/useTimetableStore";
import { resolveMediaUrl } from "../../utils/format";

export const TopBar: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [menuVisible, setMenuVisible] = React.useState(false);

  const { data: friendRequests = [] } = useFriendRequests();
  const {
    groups,
    groupsFetched,
    fetchGroups,
  } = useTimetableStore();

  const closeAndNavigate = (path: string, replace = false) => {
    setMenuVisible(false);
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        if (replace) router.replace(path as any);
        else router.push(path as any);
      }, 100);
    });
  };

  const notifications = useMemo(() => {
    const groupInvitations = groups.filter(
      (g) => g.pivot?.invitation_status === "pending",
    );
    return [
      ...friendRequests.map((r) => ({ ...r, type: "friend" })),
      ...groupInvitations.map((g) => ({ ...g, type: "group" })),
    ];
  }, [friendRequests, groups]);

  React.useEffect(() => {
    if (user && !groupsFetched) {
      fetchGroups();
    }
  }, [user, groupsFetched, fetchGroups]);

  return (
    <View style={[styles.container, { backgroundColor: "transparent" }]}>
      <View style={styles.content}>
        <Image
          source={require("../../../assets/images/brand/logo.svg")}
          style={styles.logoImage}
          contentFit="contain"
        />

        <View style={styles.rightSection}>
          <View>
            <IconButton
              icon={() => (
                <Bell size={24} color={theme.colors.onSurfaceVariant} />
              )}
              onPress={() => router.push("/notifications" as any)}
            />
            {notifications.length > 0 && (
              <Badge size={16} style={styles.badge}>
                {notifications.length}
              </Badge>
            )}
          </View>

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
                {user?.profile_media_url ? (
                  <Avatar.Image
                    size={44}
                    source={{ uri: resolveMediaUrl(user.profile_media_url) || "https://via.placeholder.com/44" }}
                    style={{ backgroundColor: "transparent", borderRadius: 12 }}
                  />
                ) : (
                  <Avatar.Text
                    size={44}
                    label={user?.first_name?.charAt(0) || "U"}
                    style={{ backgroundColor: theme.colors.primary, borderRadius: 12 }}
                  />
                )}
              </TouchableRipple>
            }
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                router.push("/(tabs)/profile");
              }}
              leadingIcon={() => (
                <User size={20} color={theme.colors.primary} />
              )}
              title={t("navigation.profile")}
              titleStyle={styles.menuTitle}
            />
            <Divider style={styles.menuDivider} />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                router.push("/events/attended" as any);
              }}
              leadingIcon={() => (
                <Calendar size={20} color={theme.colors.onSurfaceVariant} />
              )}
              title={t("profile.sections.past")}
              titleStyle={styles.menuTitle}
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                router.push("/events/past" as any);
              }}
              leadingIcon={() => (
                <HistoryIcon size={20} color={theme.colors.onSurfaceVariant} />
              )}
              title={t("navigation.events")}
              titleStyle={styles.menuTitle}
            />
            <Divider style={styles.menuDivider} />
            <Menu.Item
              onPress={() => closeAndNavigate("/settings")}
              leadingIcon={() => (
                <Settings size={20} color={theme.colors.onSurfaceVariant} />
              )}
              title={t("navigation.settings")}
              titleStyle={styles.menuTitle}
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                logout();
                useTimetableStore.getState().reset();
                router.replace("/(auth)/login");
              }}
              leadingIcon={() => (
                <LogOut size={20} color={theme.colors.error} />
              )}
              title={t("common.logout")}
              titleStyle={[styles.menuTitle, { color: theme.colors.error }]}
            />
          </Menu>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 8, zIndex: 10 },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 48,
  },
  logoImage: { width: 50, height: "100%" },
  rightSection: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatarWrapper: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  menuContent: { borderRadius: 16, paddingVertical: 8, marginTop: 40 },
  menuTitle: { fontSize: 16, fontWeight: "600" },
  menuDivider: { marginVertical: 4, opacity: 0.5 },
  badge: { position: "absolute", top: 6, right: 8 },
});

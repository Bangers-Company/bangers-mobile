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
import React, { useMemo, useState } from "react";
import {
  InteractionManager,
  StyleSheet,
  View,
} from "react-native";
import {
  Box,
  Text,
  Badge,
  BadgeText,
  Avatar as GluestackAvatar,
  AvatarFallbackText,
  AvatarImage,
  Pressable,
  Popover,
  PopoverBackdrop,
  PopoverContent,
  PopoverBody,
} from "@gluestack-ui/themed";
import { useAppTheme } from "../../context/ThemeProvider";
import { useTranslation } from "react-i18next";
import { useFriendRequests } from "../../hooks/useFriendship";
import { useAuthStore } from "../../store/useAuthStore";
import { useTimetableStore } from "../../store/useTimetableStore";
import { resolveMediaUrl, getUserDisplayName } from "../../utils/format";

import { addAlpha } from "../../utils/theme";


export const TopBar: React.FC = () => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [menuVisible, setMenuVisible] = useState(false);

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
          <View style={{ position: "relative" }}>
            <Pressable
              onPress={() => router.push("/notifications" as any)}
              style={{ padding: 8 }}
            >
              <Bell size={24} color={theme.colors.onSurface} />
            </Pressable>
            {notifications.length > 0 && (
              <Badge style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
                <BadgeText style={{ color: "#fff", fontSize: 10, fontWeight: "bold" }}>
                  {notifications.length}
                </BadgeText>
              </Badge>
            )}
          </View>

          <Popover
            isOpen={menuVisible}
            onClose={() => setMenuVisible(false)}
            placement="top right"
            offset={4}
            trigger={(triggerProps) => (
              <Pressable
                {...triggerProps}
                onPress={() => setMenuVisible(true)}
                style={styles.avatarWrapper}
              >
                <GluestackAvatar size="md" style={{ backgroundColor: theme.colors.primary }}>
                  {resolveMediaUrl(user?.profile_media_url) ? (
                    <AvatarImage source={{ uri: resolveMediaUrl(user?.profile_media_url)! }} alt="User Avatar" />
                  ) : (
                    <AvatarFallbackText style={{ color: "#ffffff" }}>
                      {getUserDisplayName(user).charAt(0).toUpperCase()}
                    </AvatarFallbackText>
                  )}
                </GluestackAvatar>

              </Pressable>
            )}
          >
            <PopoverBackdrop />
            <PopoverContent
              style={[
                styles.menuContent,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: addAlpha(theme.colors.onSurface, 0.15),
                  borderWidth: 1,
                },
              ]}
            >
              <PopoverBody style={{ paddingVertical: 4, paddingHorizontal: 0 }}>
                <Pressable
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    router.push("/(tabs)/profile");
                  }}
                >
                  <User size={20} color={theme.colors.primary} />
                  <Text style={[styles.menuTitle, { color: theme.colors.onSurface }]}>
                    {t("navigation.profile")}
                  </Text>
                </Pressable>

                <View style={[styles.separator, { backgroundColor: addAlpha(theme.colors.onSurface, 0.1) }]} />
                
                <Pressable
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    router.push("/events/attended" as any);
                  }}
                >
                  <Calendar size={20} color={theme.colors.onSurface} />
                  <Text style={[styles.menuTitle, { color: theme.colors.onSurface }]}>
                    {t("profile.sections.past")}
                  </Text>
                </Pressable>

                <View style={[styles.separator, { backgroundColor: addAlpha(theme.colors.onSurface, 0.1) }]} />

                <Pressable
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    router.push("/events/past" as any);
                  }}
                >
                  <HistoryIcon size={20} color={theme.colors.onSurface} />
                  <Text style={[styles.menuTitle, { color: theme.colors.onSurface }]}>
                    {t("navigation.events")}
                  </Text>
                </Pressable>

                <View style={[styles.separator, { backgroundColor: addAlpha(theme.colors.onSurface, 0.1) }]} />

                <Pressable
                  style={styles.menuItem}
                  onPress={() => closeAndNavigate("/settings")}
                >
                  <Settings size={20} color={theme.colors.onSurface} />
                  <Text style={[styles.menuTitle, { color: theme.colors.onSurface }]}>
                    {t("navigation.settings")}
                  </Text>
                </Pressable>

                <View style={[styles.separator, { backgroundColor: addAlpha(theme.colors.onSurface, 0.1) }]} />

                <Pressable
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    logout();
                    useTimetableStore.getState().reset();
                    router.replace("/(auth)/login");
                  }}
                >
                  <LogOut size={20} color="#ff5252" />
                  <Text style={[styles.menuTitle, { color: "#ff5252" }]}>
                    {t("common.logout")}
                  </Text>
                </Pressable>
              </PopoverBody>
            </PopoverContent>
          </Popover>
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
  },
  menuContent: {
    borderRadius: 16,
    paddingVertical: 4,
    minWidth: 190,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  separator: {
    height: 1,
    width: "100%",
  },
  menuTitle: { fontSize: 15, fontWeight: "600" },
  badge: { position: "absolute", top: 2, right: 2, borderRadius: 10, minWidth: 18, height: 18, justifyContent: "center", alignItems: "center" },
});



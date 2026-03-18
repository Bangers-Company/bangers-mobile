import { useRouter } from "expo-router";
import {
    Bell,
    Calendar,
    History as HistoryIcon,
    LogOut,
    Settings,
    User,
    Users,
} from "lucide-react-native";
import React, { useRef, useMemo } from "react";
import { Animated, Dimensions, StyleSheet, View, InteractionManager } from "react-native";
import {
    Avatar,
    Badge,
    Button,
    Divider,
    IconButton,
    Menu,
    Text,
    TouchableRipple,
    useTheme,
} from "react-native-paper";
import { friendsApi } from "../../api/friends";
import { useAuthStore } from "../../store/useAuthStore";
import { resolveMediaUrl } from "../../utils/format";
import { useTimetableStore } from "../../store/useTimetableStore";
import { useFriendRequests } from "../../hooks/useFriends";
import { useQueryClient } from "@tanstack/react-query";

export const TopBar: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [notifVisible, setNotifVisible] = React.useState(false);

  const { data: friendRequests = [] } = useFriendRequests();
  const { groups, groupsFetched, fetchGroups, acceptInvitation, rejectInvitation } = useTimetableStore();

  const closeAndNavigate = (path: string, replace = false) => {
    setMenuVisible(false);
    setNotifVisible(false);
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        if (replace) router.replace(path as any);
        else router.push(path as any);
      }, 100);
    });
  };

  const notifications = useMemo(() => {
    const groupInvitations = groups.filter(g => g.pivot?.invitation_status === 'pending');
    return [
      ...friendRequests.map((r: any) => ({ ...r, type: 'friend' })),
      ...groupInvitations.map(g => ({ ...g, type: 'group' }))
    ];
  }, [friendRequests, groups]);

  React.useEffect(() => {
    if (user && !groupsFetched) {
      fetchGroups();
    }
  }, [user, groupsFetched, fetchGroups]);

  const [removingIds, setRemovingIds] = React.useState<Set<string>>(new Set());
  const slideAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;
  const fadeAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;

  const handleNotificationAction = async (
    id: string,
    action: "accept" | "reject",
    type: "friend" | "group" = "friend",
    itemId: string
  ) => {
    try {
      if (type === "friend") {
        if (action === "accept") {
          await friendsApi.acceptRequest(id);
          queryClient.invalidateQueries({ queryKey: ['profile'] });
        } else {
          await friendsApi.rejectRequest(id);
        }
        queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
      } else {
        if (action === "accept") {
          await acceptInvitation(id);
        } else {
          await rejectInvitation(id);
        }
        await fetchGroups();
      }

      if (!slideAnimations[itemId]) {
        slideAnimations[itemId] = new Animated.Value(0);
        fadeAnimations[itemId] = new Animated.Value(1);
      }

      setRemovingIds((prev) => new Set(prev).add(itemId));

      Animated.parallel([
        Animated.timing(slideAnimations[itemId], {
          toValue: Dimensions.get("window").width,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnimations[itemId], {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setRemovingIds((prev) => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });

        delete slideAnimations[itemId];
        delete fadeAnimations[itemId];

        if (notifications.length <= 1) {
          setTimeout(() => setNotifVisible(false), 100);
        }
      });
    } catch (e) {
      console.error("Failed request action", e);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: "transparent" }]}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={[styles.logo, { color: theme.colors.primary }]}>Bangers</Text>

        <View style={styles.rightSection}>
          <Menu
            visible={notifVisible}
            onDismiss={() => setNotifVisible(false)}
            contentStyle={[styles.notifContent, { backgroundColor: theme.colors.surface }]}
            anchor={
              <View>
                <IconButton
                  icon={() => <Bell size={24} color={theme.colors.onSurfaceVariant} />}
                  onPress={() => setNotifVisible(true)}
                />
                {notifications.length > 0 && (
                  <Badge size={16} style={styles.badge}>{notifications.length}</Badge>
                )}
              </View>
            }
          >
            {notifications.length === 0 ? (
              <Menu.Item title="No new notifications" titleStyle={{ opacity: 0.5 }} />
            ) : (
              notifications.map((notif) => {
                const isGroup = notif.type === 'group';
                const id = isGroup ? notif.id : notif.requester!.id;
                const itemId = notif.id;

                if (!slideAnimations[itemId]) {
                  slideAnimations[itemId] = new Animated.Value(0);
                  fadeAnimations[itemId] = new Animated.Value(1);
                }

                return (
                  <Animated.View
                    key={itemId}
                    style={[
                      styles.requestItem,
                      {
                        transform: [{ translateX: slideAnimations[itemId] }],
                        opacity: fadeAnimations[itemId],
                      },
                    ]}
                  >
                    {isGroup ? (
                       <Avatar.Icon size={36} icon={() => <Users size={20} color="white" />} style={{ backgroundColor: theme.colors.primary, alignSelf: "flex-start", marginTop: 4 }} />
                    ) : (
                      <Avatar.Text size={36} label={notif.requester?.first_name?.charAt(0) || "U"} style={{ backgroundColor: theme.colors.primary, alignSelf: "flex-start", marginTop: 4 }} />
                    )}
                    <View style={styles.requestInfo}>
                      <Text variant="bodyMedium" style={styles.requestText}>
                        {isGroup ? <>Invitation to join <Text style={styles.requestName}>{notif.name}</Text></> :
                          <><Text style={styles.requestName}>{notif.requester?.first_name} {notif.requester?.last_name}</Text> sent you a friend request.</>
                        }
                      </Text>
                      <View style={styles.requestActions}>
                        <Button
                          mode="contained"
                          onPress={() => handleNotificationAction(id, "accept", isGroup ? "group" : "friend", itemId)}
                          contentStyle={{ paddingHorizontal: 0, height: 32 }}
                          labelStyle={{ fontSize: 12, marginHorizontal: 8 }}
                          style={{ borderRadius: 8, flex: 1 }}
                          disabled={removingIds.has(itemId)}
                        >
                          Accept
                        </Button>
                        <Button
                          mode="outlined"
                          onPress={() => handleNotificationAction(id, "reject", isGroup ? "group" : "friend", itemId)}
                          contentStyle={{ paddingHorizontal: 0, height: 32 }}
                          labelStyle={{ fontSize: 12, marginHorizontal: 8 }}
                          style={{ borderRadius: 8, flex: 1, borderColor: theme.colors.outlineVariant }}
                          textColor={theme.colors.onSurface}
                          disabled={removingIds.has(itemId)}
                        >
                          Decline
                        </Button>
                      </View>
                    </View>
                  </Animated.View>
                );
              })
            )}
          </Menu>

          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            contentStyle={[styles.menuContent, { backgroundColor: theme.colors.surface }]}
            anchor={
              <TouchableRipple onPress={() => setMenuVisible(true)} style={styles.avatarWrapper} rippleColor="rgba(0, 0, 0, .1)">
                {user?.profile_media_url ? (
                  <Avatar.Image size={40} source={{ uri: resolveMediaUrl(user.profile_media_url) || "https://via.placeholder.com/40" }} />
                ) : (
                  <Avatar.Text size={40} label={user?.first_name?.charAt(0) || "U"} style={{ backgroundColor: theme.colors.primary }} />
                )}
              </TouchableRipple>
            }
          >
            <Menu.Item onPress={() => closeAndNavigate("/(tabs)/profile")} leadingIcon={() => <User size={20} color={theme.colors.primary} />} title="My Profile" titleStyle={styles.menuTitle} />
            <Divider style={styles.menuDivider} />
            <Menu.Item onPress={() => setMenuVisible(false)} leadingIcon={() => <Calendar size={20} color={theme.colors.onSurfaceVariant} />} title="Attended Events" titleStyle={styles.menuTitle} />
            <Menu.Item onPress={() => setMenuVisible(false)} leadingIcon={() => <HistoryIcon size={20} color={theme.colors.onSurfaceVariant} />} title="Past Events" titleStyle={styles.menuTitle} />
            <Divider style={styles.menuDivider} />
            <Menu.Item onPress={() => closeAndNavigate("/settings")} leadingIcon={() => <Settings size={20} color={theme.colors.onSurfaceVariant} />} title="Settings" titleStyle={styles.menuTitle} />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                setTimeout(() => {
                  useTimetableStore.getState().reset();
                  useAuthStore.getState().logout();
                  router.replace("/(auth)/login");
                }, 200);
              }}
              leadingIcon={() => <LogOut size={20} color={theme.colors.error} />}
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
  container: { paddingHorizontal: 16, paddingBottom: 8, zIndex: 10 },
  content: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logo: { fontWeight: "800", letterSpacing: -1 },
  rightSection: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatarWrapper: { borderRadius: 20, overflow: "hidden", borderWidth: 2, borderColor: "transparent" },
  menuContent: { borderRadius: 16, paddingVertical: 8, marginTop: 40 },
  menuTitle: { fontSize: 16, fontWeight: "600" },
  menuDivider: { marginVertical: 4, opacity: 0.5 },
  badge: { position: "absolute", top: 6, right: 8 },
  notifContent: { borderRadius: 16, paddingTop: 8, marginTop: 40, width: 280 },
  requestItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  requestInfo: { flex: 1, gap: 8 },
  requestText: { lineHeight: 20, opacity: 0.9 },
  requestName: { fontWeight: "bold" },
  requestActions: { flexDirection: "row", gap: 8, marginTop: 2 },
});

import { usePathname, useRouter } from "expo-router";
import {
  Bell,
  Calendar,
  History as HistoryIcon,
  LogOut,
  Settings,
  User,
} from "lucide-react-native";
import React, { useRef } from "react";
import { StyleSheet, View, Animated, Dimensions } from "react-native";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/useAuthStore";
import { friendsApi, Friendship } from "../../api/friends";
import { resolveMediaUrl } from "../../utils/format";

export const TopBar: React.FC = () => {
  const { top } = useSafeAreaInsets();
  const theme = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [notifVisible, setNotifVisible] = React.useState(false);
  // Generic notifications array; currently contains friend request notifications
  const [notifications, setNotifications] = React.useState<Friendship[]>([]);

  React.useEffect(() => {
    if (user) {
      // Fetch friend request notifications as initial notification type
      friendsApi.getRequests().then((res) => {
        setNotifications(res.data.data);
      }).catch(console.error);
    }
  }, [user]);

  const [removingIds, setRemovingIds] = React.useState<Set<string>>(new Set());
  const slideAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;
  const fadeAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;

  const handleNotificationAction = async (id: string, action: 'accept' | 'reject') => {
    try {
      if (action === 'accept') {
        await friendsApi.acceptRequest(id);
      } else {
        await friendsApi.rejectRequest(id);
      }

      // Initialize animation values if they don't exist yet
      if (!slideAnimations[id]) {
        slideAnimations[id] = new Animated.Value(0);
        fadeAnimations[id] = new Animated.Value(1);
      }

      setRemovingIds(prev => new Set(prev).add(id));

      Animated.parallel([
        Animated.timing(slideAnimations[id], {
          toValue: Dimensions.get('window').width, // Slide out to the right
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnimations[id], {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        })
      ]).start(() => {
        setNotifications((prev) => prev.filter((r) => r.requester?.id !== id));
        setRemovingIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });

        // Clean up animations
        delete slideAnimations[id];
        delete fadeAnimations[id];

        if (notifications.length <= 1) {
          setNotifVisible(false);
        }
      });

    } catch (e) {
      console.error("Failed request action", e);
    }
  };

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
          onPress={() => { }}
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
                const id = notif.requester!.id;

                // Initialize anim values if not present
                if (!slideAnimations[id]) {
                  slideAnimations[id] = new Animated.Value(0);
                  fadeAnimations[id] = new Animated.Value(1);
                }

                return (
                  <Animated.View
                    key={notif.id}
                    style={[
                      styles.requestItem,
                      {
                        transform: [{ translateX: slideAnimations[id] }],
                        opacity: fadeAnimations[id]
                      }
                    ]}
                  >
                    <Avatar.Text size={36} label={notif.requester?.first_name?.charAt(0) || "U"} style={{ backgroundColor: theme.colors.primary, alignSelf: "flex-start", marginTop: 4 }} />
                    <View style={styles.requestInfo}>
                      <Text variant="bodyMedium" style={styles.requestText}>
                        <Text style={styles.requestName}>{notif.requester?.first_name} {notif.requester?.last_name}</Text> sent you a friend request.
                      </Text>
                      <View style={styles.requestActions}>
                        <Button
                          mode="contained"
                          onPress={() => handleNotificationAction(id, 'accept')}
                          contentStyle={{ paddingHorizontal: 0, height: 32 }}
                          labelStyle={{ fontSize: 12, marginHorizontal: 8 }}
                          style={{ borderRadius: 8, flex: 1 }}
                          disabled={removingIds.has(id)}
                        >
                          Accept
                        </Button>
                        <Button
                          mode="outlined"
                          onPress={() => handleNotificationAction(id, 'reject')}
                          contentStyle={{ paddingHorizontal: 0, height: 32 }}
                          labelStyle={{ fontSize: 12, marginHorizontal: 8 }}
                          style={{ borderRadius: 8, flex: 1, borderColor: theme.colors.outlineVariant }}
                          textColor={theme.colors.onSurface}
                          disabled={removingIds.has(id)}
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
                    size={40}
                    source={{
                      uri: resolveMediaUrl(user.profile_media_url) || "https://via.placeholder.com/40",
                    }}
                  />
                ) : (
                  <Avatar.Text
                    size={40}
                    label={user?.first_name?.charAt(0) || "U"}
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                )}
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
  badge: {
    position: "absolute",
    top: 6,
    right: 8,
  },
  notifContent: {
    borderRadius: 16,
    paddingTop: 8,
    marginTop: 40,
    width: 280,
  },
  notifTitle: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    fontWeight: "bold",
  },
  cardDivider: {
    opacity: 0.3,
    marginBottom: 8,
  },
  requestItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  requestInfo: {
    flex: 1,
    gap: 8,
  },
  requestText: {
    lineHeight: 20,
    opacity: 0.9,
  },
  requestName: {
    fontWeight: "bold",
  },
  requestActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
});

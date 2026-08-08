import { useRouter } from "expo-router";
import { ArrowLeft, Users, Check, X, BellCheck, Bell } from "lucide-react-native";
import React from "react";
import { StyleSheet, View, ScrollView, RefreshControl } from "react-native";
import {
  Avatar as GluestackAvatar,
  AvatarFallbackText,
  AvatarImage,
  Text,
  Divider,
  Pressable,
} from "@gluestack-ui/themed";
import { useAppTheme } from "../src/context/ThemeProvider";
import { useTranslation } from "react-i18next";
import { PageContainer } from "../src/components/PageContainer";
import { useFriendRequests } from "../src/hooks/useFriendship";
import { useGroups, useAcceptInvitation, useRejectInvitation } from "../src/hooks/useTimetables";
import { useNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from "../src/hooks/useNotifications";
import { resolveMediaUrl, getUserDisplayName } from "../src/utils/format";


export default function NotificationsScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();

  const { data: friendRequests = [], isLoading: friendLoading, refetch: refetchFriends, accept, reject } = useFriendRequests();
  const { data: groups = [], isLoading: groupsLoading, refetch: refetchGroups } = useGroups();
  const { data: notificationFeed, isLoading: notifLoading, refetch: refetchNotifications } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  const markRead = useMarkNotificationRead();

  const acceptGroup = useAcceptInvitation();
  const rejectGroup = useRejectInvitation();

  const groupInvites = groups.filter((g) => g.pivot?.invitation_status === "pending");
  const isLoading = friendLoading || groupsLoading || notifLoading;

  const onRefresh = async () => {
    await Promise.all([refetchFriends(), refetchGroups(), refetchNotifications()]);
  };

  const unreadCount = notificationFeed?.unread_count || 0;
  const notificationsList = notificationFeed?.data || [];

  return (
    <PageContainer withPadding={false}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
          <ArrowLeft size={24} color={theme.colors.onSurface} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          {t("notifications.title", "Notifications")}
        </Text>
        {unreadCount > 0 ? (
          <Pressable onPress={() => markAllRead.mutate()} style={{ padding: 8 }}>
            <BellCheck size={22} color={theme.colors.primary} />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
      >
        {/* Real-time Notification Activity Stream */}
        {notificationsList.length > 0 && (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionLabel, { color: theme.colors.onSurface }]}>
                  {t("notifications.recentActivity", "Recent Activity")}
                </Text>
                {unreadCount > 0 && (
                  <View style={[styles.unreadBadge, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                  </View>
                )}
              </View>

              {notificationsList.map((item) => {
                const isUnread = !item.read_at;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      if (isUnread) {
                        markRead.mutate(item.id);
                      }
                      if (item.data?.type === "FRIEND_REQUEST_ACCEPTED" && item.data.acceptor_id) {
                        router.push(`/user/${item.data.acceptor_id}` as any);
                      } else if (item.data?.type === "GROUP_INVITATION_ACCEPTED" && item.data.group_id) {
                        router.push(`/notifications` as any);
                      }
                    }}
                    style={[
                      styles.notificationCard,
                      isUnread && { backgroundColor: "rgba(166,13,242,0.12)", borderColor: "rgba(166,13,242,0.3)", borderWidth: 1 },
                    ]}
                  >
                    <View style={styles.userInfo}>
                      <View style={[styles.groupIcon, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <Bell size={22} color={theme.colors.primary} />
                      </View>
                      <View style={styles.textContainer}>
                        <Text style={[styles.name, { color: theme.colors.onSurface }]}>
                          {item.data?.title || "Notification"}
                        </Text>
                        <Text style={[styles.subtitle, { color: theme.colors.onSurface }]}>
                          {item.data?.message || ""}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <Divider style={styles.divider} />
          </>
        )}

        {/* Friend Requests Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.colors.onSurface }]}>
            {t("notifications.friends", "Friend Requests")} ({friendRequests.length})
          </Text>
          {friendRequests.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>{t("notifications.emptyFriends", "No pending friend requests")}</Text>
          ) : (
            friendRequests.map((request) => (
              <View key={request.id} style={styles.notificationCard}>
                <View style={styles.userInfo}>
                  <GluestackAvatar size="md" style={{ backgroundColor: theme.colors.primary }}>
                    {resolveMediaUrl(request.requester?.profile_media_url) ? (
                      <AvatarImage source={{ uri: resolveMediaUrl(request.requester?.profile_media_url)! }} alt="Requester Avatar" />
                    ) : (
                      <AvatarFallbackText style={{ color: "#ffffff" }}>
                        {getUserDisplayName(request.requester).charAt(0).toUpperCase()}
                      </AvatarFallbackText>
                    )}
                  </GluestackAvatar>

                  <View style={styles.textContainer}>
                    <Text style={[styles.name, { color: theme.colors.onSurface }]}>
                      {request.requester?.first_name} {request.requester?.last_name}
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.colors.onSurface }]}>
                      {t("notifications.friendRequestSub", "sent you a friend request")}
                    </Text>
                  </View>
                </View>
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => accept.mutate(request.requester?.id!)}
                    style={[styles.actionBtn, { backgroundColor: addAlpha(theme.colors.primary, 0.15) }]}
                  >
                    <Check size={20} color={theme.colors.primary} />
                  </Pressable>
                  <Pressable
                    onPress={() => reject.mutate(request.requester?.id!)}
                    style={[styles.actionBtn, { backgroundColor: "rgba(255,82,82,0.15)" }]}
                  >
                    <X size={20} color="#ff5252" />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>

        <Divider style={styles.divider} />

        {/* Group Invitations Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.colors.onSurface }]}>
            {t("notifications.groups", "Group Invitations")} ({groupInvites.length})
          </Text>
          {groupInvites.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>{t("notifications.emptyGroups", "No pending group invitations")}</Text>
          ) : (
            groupInvites.map((group) => (
              <View key={group.id} style={styles.notificationCard}>
                <View style={styles.userInfo}>
                  <View style={[styles.groupIcon, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <Users size={24} color={theme.colors.primary} />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={[styles.name, { color: theme.colors.onSurface }]}>
                      {group.name}
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.colors.onSurface }]}>
                      {t("timetable.groups.invitedBy", {
                        name:
                          group.owner?.name ||
                          (group.owner?.first_name ? `${group.owner.first_name} ${group.owner.last_name || ""}`.trim() : null) ||
                          group.owner?.username ||
                          t("common.someone", "someone"),
                      })}
                    </Text>
                  </View>
                </View>
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => acceptGroup.mutate(group.id)}
                    style={[styles.actionBtn, { backgroundColor: addAlpha(theme.colors.primary, 0.15) }]}
                  >
                    <Check size={20} color={theme.colors.primary} />
                  </Pressable>
                  <Pressable
                    onPress={() => rejectGroup.mutate(group.id)}
                    style={[styles.actionBtn, { backgroundColor: "rgba(255,82,82,0.15)" }]}
                  >
                    <X size={20} color="#ff5252" />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  section: {
    padding: 24,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    opacity: 0.6,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "bold",
  },
  unreadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.6,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    opacity: 0.4,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    marginHorizontal: 24,
    opacity: 0.1,
  },
});


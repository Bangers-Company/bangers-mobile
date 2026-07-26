import { useRouter } from "expo-router";
import { ArrowLeft, Users, Check, X, BellCheck, Bell } from "lucide-react-native";
import React from "react";
import { StyleSheet, View, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import {
  Avatar,
  IconButton,
  Text,
  useTheme,
  Divider,
} from "react-native-paper";
import { useTranslation } from "react-i18next";
import { PageContainer } from "../src/components/PageContainer";
import { useFriendRequests } from "../src/hooks/useFriendship";
import { useGroups, useAcceptInvitation, useRejectInvitation } from "../src/hooks/useTimetables";
import { useNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from "../src/hooks/useNotifications";
import { resolveMediaUrl } from "../src/utils/format";

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
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
        <IconButton
          icon={() => <ArrowLeft size={24} color={theme.colors.onSurface} />}
          onPress={() => router.back()}
        />
        <Text variant="titleLarge" style={styles.headerTitle}>
          {t("notifications.title", "Notifications")}
        </Text>
        {unreadCount > 0 ? (
          <IconButton
            icon={() => <BellCheck size={22} color={theme.colors.primary} />}
            onPress={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          />
        ) : (
          <View style={{ width: 48 }} />
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
                <Text variant="labelLarge" style={styles.sectionLabel}>
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
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
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
                        <Text variant="titleMedium" style={styles.name}>
                          {item.data?.title || "Notification"}
                        </Text>
                        <Text variant="bodySmall" style={styles.subtitle}>
                          {item.data?.message || ""}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Divider style={styles.divider} />
          </>
        )}

        {/* Friend Requests Section */}
        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.sectionLabel}>
            {t("notifications.friends", "Friend Requests")} ({friendRequests.length})
          </Text>
          {friendRequests.length === 0 ? (
            <Text style={styles.emptyText}>{t("notifications.emptyFriends", "No pending friend requests")}</Text>
          ) : (
            friendRequests.map((request) => (
              <View key={request.id} style={styles.notificationCard}>
                <View style={styles.userInfo}>
                  {request.requester?.profile_media_url ? (
                    <Avatar.Image
                      size={48}
                      source={{ uri: resolveMediaUrl(request.requester.profile_media_url) || "" }}
                      style={{ borderRadius: 14 }}
                    />
                  ) : (
                    <Avatar.Text
                      size={48}
                      label={request.requester?.first_name?.charAt(0) || "U"}
                      style={{ borderRadius: 14 }}
                    />
                  )}
                  <View style={styles.textContainer}>
                    <Text variant="titleMedium" style={styles.name}>
                      {request.requester?.first_name} {request.requester?.last_name}
                    </Text>
                    <Text variant="bodySmall" style={styles.subtitle}>
                      {t("notifications.friendRequestSub", "sent you a friend request")}
                    </Text>
                  </View>
                </View>
                <View style={styles.actions}>
                  <IconButton
                    icon={() => <Check size={20} color={theme.colors.primary} />}
                    mode="contained-tonal"
                    onPress={() => accept.mutate(request.requester?.id!)}
                    loading={accept.isPending}
                  />
                  <IconButton
                    icon={() => <X size={20} color={theme.colors.error} />}
                    mode="contained-tonal"
                    onPress={() => reject.mutate(request.requester?.id!)}
                    loading={reject.isPending}
                  />
                </View>
              </View>
            ))
          )}
        </View>

        <Divider style={styles.divider} />

        {/* Group Invitations Section */}
        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.sectionLabel}>
            {t("notifications.groups", "Group Invitations")} ({groupInvites.length})
          </Text>
          {groupInvites.length === 0 ? (
            <Text style={styles.emptyText}>{t("notifications.emptyGroups", "No pending group invitations")}</Text>
          ) : (
            groupInvites.map((group) => (
              <View key={group.id} style={styles.notificationCard}>
                <View style={styles.userInfo}>
                  <View style={[styles.groupIcon, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <Users size={24} color={theme.colors.primary} />
                  </View>
                  <View style={styles.textContainer}>
                    <Text variant="titleMedium" style={styles.name}>
                      {group.name}
                    </Text>
                    <Text variant="bodySmall" style={styles.subtitle}>
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
                  <IconButton
                    icon={() => <Check size={20} color={theme.colors.primary} />}
                    mode="contained-tonal"
                    onPress={() => acceptGroup.mutate(group.id)}
                    loading={acceptGroup.isPending}
                  />
                  <IconButton
                    icon={() => <X size={20} color={theme.colors.error} />}
                    mode="contained-tonal"
                    onPress={() => rejectGroup.mutate(group.id)}
                    loading={rejectGroup.isPending}
                  />
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
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  headerTitle: {
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
    opacity: 0.6,
    textTransform: "uppercase",
    letterSpacing: 1,
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
    fontWeight: "bold",
  },
  subtitle: {
    opacity: 0.6,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
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

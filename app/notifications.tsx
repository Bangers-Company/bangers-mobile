import { useRouter } from "expo-router";
import { ArrowLeft, Users, Check, X, Bell, UserPlus, Sparkles } from "lucide-react-native";
import React from "react";
import { StyleSheet, View, ScrollView, RefreshControl } from "react-native";
import {
  Avatar as GluestackAvatar,
  AvatarFallbackText,
  AvatarImage,
  Text,
  Pressable,
} from "@gluestack-ui/themed";
import { useAppTheme } from "../src/context/ThemeProvider";
import { useTranslation } from "react-i18next";
import { PageContainer } from "../src/components/PageContainer";
import { useFriendRequests } from "../src/hooks/useFriendship";
import { useGroups, useAcceptInvitation, useRejectInvitation } from "../src/hooks/useTimetables";
import { useNotifications, useMarkNotificationRead } from "../src/hooks/useNotifications";
import { resolveMediaUrl, getUserDisplayName } from "../src/utils/format";
import { addAlpha } from "../src/utils/theme";

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();

  const { data: friendRequests = [], isLoading: friendLoading, refetch: refetchFriends, accept, reject } = useFriendRequests();
  const { data: groups = [], isLoading: groupsLoading, refetch: refetchGroups } = useGroups();
  const { data: notificationFeed, isLoading: notifLoading, refetch: refetchNotifications } = useNotifications();
  const markRead = useMarkNotificationRead();

  const acceptGroup = useAcceptInvitation();
  const rejectGroup = useRejectInvitation();

  const groupInvites = groups.filter((g: any) => g.pivot?.invitation_status === "pending");
  const isLoading = friendLoading || groupsLoading || notifLoading;

  const onRefresh = async () => {
    await Promise.all([refetchFriends(), refetchGroups(), refetchNotifications()]);
  };

  const unreadCount = notificationFeed?.unread_count || 0;
  const notificationsList = notificationFeed?.data || [];

  const totalItemCount = notificationsList.length + friendRequests.length + groupInvites.length;

  return (
    <PageContainer withPadding={false}>
      {/* Sleek Glass Header with centered title and balanced sides */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: addAlpha(theme.colors.outline, 0.12) }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={22} color={theme.colors.onSurface} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          {t("notifications.title", "Notifications")}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {totalItemCount === 0 && !isLoading ? (
          <View style={[styles.emptyContainer, { backgroundColor: addAlpha(theme.colors.surface, 0.6), borderColor: addAlpha(theme.colors.outline, 0.12) }]}>
            <View style={[styles.emptyIconCircle, { backgroundColor: addAlpha(theme.colors.primary, 0.12) }]}>
              <Bell size={32} color={theme.colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
              {t("notifications.emptyTitle", "All caught up!")}
            </Text>
            <Text style={[styles.emptySub, { color: addAlpha(theme.colors.onSurface, 0.6) }]}>
              {t("notifications.emptySub", "No new notifications or pending requests at the moment.")}
            </Text>
          </View>
        ) : null}

        {/* Real-time Notification Activity Stream */}
        {notificationsList.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <Sparkles size={18} color={theme.colors.primary} />
                <Text style={[styles.sectionLabel, { color: theme.colors.onSurface }]}>
                  {t("notifications.recentActivity", "Recent Activity")}
                </Text>
              </View>
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
                    {
                      backgroundColor: isUnread
                        ? addAlpha(theme.colors.primary, 0.1)
                        : addAlpha(theme.colors.surface, 0.75),
                      borderColor: isUnread
                        ? theme.colors.primary
                        : addAlpha(theme.colors.outline, 0.15),
                      borderWidth: isUnread ? 1.5 : 1,
                    },
                  ]}
                >
                  <View style={styles.userInfo}>
                    <View style={[styles.iconCircle, { backgroundColor: addAlpha(theme.colors.primary, 0.15) }]}>
                      <Bell size={20} color={theme.colors.primary} />
                    </View>
                    <View style={styles.textContainer}>
                      <Text style={[styles.name, { color: theme.colors.onSurface }]}>
                        {item.data?.title || "Notification"}
                      </Text>
                      <Text style={[styles.subtitle, { color: addAlpha(theme.colors.onSurface, 0.75) }]}>
                        {item.data?.message || ""}
                      </Text>
                    </View>
                  </View>
                  {isUnread && (
                    <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Friend Requests Section */}
        {friendRequests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <UserPlus size={18} color={theme.colors.primary} />
                <Text style={[styles.sectionLabel, { color: theme.colors.onSurface }]}>
                  {t("notifications.friends", "Friend Requests")}
                </Text>
              </View>
              <View style={[styles.countBadge, { backgroundColor: addAlpha(theme.colors.primary, 0.18) }]}>
                <Text style={[styles.countBadgeText, { color: theme.colors.primary }]}>{friendRequests.length}</Text>
              </View>
            </View>

            {friendRequests.map((request) => {
              const requester: any = request.requester || request.user1 || request.user2 || request.user || request.sender || request.from || request;
              const displayName = getUserDisplayName(requester);
              const username = requester?.username ? `@${requester.username}` : "";
              const avatarUrl = resolveMediaUrl(
                requester?.profile_media_url ||
                requester?.profile_photo_url ||
                requester?.avatar_url ||
                requester?.avatar
              );
              const targetUserId = requester?.id || request.requester_id || request.user_id_1 || request.user_id || request.id;

              return (
                <View
                  key={request.id}
                  style={[
                    styles.notificationCard,
                    {
                      backgroundColor: addAlpha(theme.colors.surface, 0.85),
                      borderColor: addAlpha(theme.colors.outline, 0.15),
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Pressable
                    style={styles.userInfo}
                    onPress={() => targetUserId && router.push(`/user/${targetUserId}` as any)}
                  >
                    <GluestackAvatar size="md" style={{ backgroundColor: theme.colors.primary }}>
                      {avatarUrl ? (
                        <AvatarImage source={{ uri: avatarUrl }} alt="Requester Avatar" />
                      ) : (
                        <AvatarFallbackText style={{ color: "#ffffff" }}>
                          {displayName.charAt(0).toUpperCase()}
                        </AvatarFallbackText>
                      )}
                    </GluestackAvatar>

                    <View style={styles.textContainer}>
                      <Text style={[styles.name, { color: theme.colors.onSurface }]}>
                        {displayName}
                      </Text>
                      <Text style={[styles.subtitle, { color: addAlpha(theme.colors.onSurface, 0.75) }]}>
                        {username ? `${username} • ` : ""}
                        {t("notifications.friendRequestSub", "sent you a friend request")}
                      </Text>
                    </View>
                  </Pressable>
                  <View style={styles.actions}>
                    <Pressable
                      onPress={() => accept.mutate(targetUserId)}
                      style={[styles.actionBtn, { backgroundColor: addAlpha(theme.colors.primary, 0.18), borderColor: theme.colors.primary, borderWidth: 1 }]}
                    >
                      <Check size={18} color={theme.colors.primary} />
                    </Pressable>
                    <Pressable
                      onPress={() => reject.mutate(targetUserId)}
                      style={[styles.actionBtn, { backgroundColor: "rgba(255,82,82,0.12)", borderColor: "rgba(255,82,82,0.3)", borderWidth: 1 }]}
                    >
                      <X size={18} color="#ff5252" />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Group Invitations Section */}
        {groupInvites.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <Users size={18} color={theme.colors.primary} />
                <Text style={[styles.sectionLabel, { color: theme.colors.onSurface }]}>
                  {t("notifications.groups", "Group Invitations")}
                </Text>
              </View>
              <View style={[styles.countBadge, { backgroundColor: addAlpha(theme.colors.primary, 0.18) }]}>
                <Text style={[styles.countBadgeText, { color: theme.colors.primary }]}>{groupInvites.length}</Text>
              </View>
            </View>

            {groupInvites.map((group: any) => (
              <View
                key={group.id}
                style={[
                  styles.notificationCard,
                  {
                    backgroundColor: addAlpha(theme.colors.surface, 0.85),
                    borderColor: addAlpha(theme.colors.outline, 0.15),
                    borderWidth: 1,
                  },
                ]}
              >
                <View style={styles.userInfo}>
                  <View style={[styles.iconCircle, { backgroundColor: addAlpha(theme.colors.primary, 0.15) }]}>
                    <Users size={20} color={theme.colors.primary} />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={[styles.name, { color: theme.colors.onSurface }]}>
                      {group.name}
                    </Text>
                    <Text style={[styles.subtitle, { color: addAlpha(theme.colors.onSurface, 0.75) }]}>
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
                    style={[styles.actionBtn, { backgroundColor: addAlpha(theme.colors.primary, 0.18), borderColor: theme.colors.primary, borderWidth: 1 }]}
                  >
                    <Check size={18} color={theme.colors.primary} />
                  </Pressable>
                  <Pressable
                    onPress={() => rejectGroup.mutate(group.id)}
                    style={[styles.actionBtn, { backgroundColor: "rgba(255,82,82,0.12)", borderColor: "rgba(255,82,82,0.3)", borderWidth: 1 }]}
                  >
                    <X size={18} color="#ff5252" />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 12,
    width: 40,
    alignItems: "flex-start",
  },
  headerSpacer: {
    width: 40,
  },
  section: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sectionTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  unreadBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  unreadBadgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
  countBadge: {
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 10,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 40,
    gap: 10,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptySub: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});

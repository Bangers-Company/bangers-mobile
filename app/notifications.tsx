import { useRouter } from "expo-router";
import { ArrowLeft, Users, Check, X } from "lucide-react-native";
import React from "react";
import { StyleSheet, View, ScrollView, RefreshControl } from "react-native";
import {
  Avatar,
  Button,
  IconButton,
  Text,
  useTheme,
  Divider,
} from "react-native-paper";
import { useTranslation } from "react-i18next";
import { PageContainer } from "../src/components/PageContainer";
import { useFriendRequests } from "../src/hooks/useFriendship";
import { useTimetableStore } from "../src/store/useTimetableStore";
import { resolveMediaUrl } from "../src/utils/format";

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { data: friendRequests = [], isLoading: friendLoading, refetch: refetchFriends, accept, reject } = useFriendRequests();
  const { groups, fetchGroups } = useTimetableStore();

  const groupInvites = groups.filter(g => g.pivot?.invitation_status === 'pending');
  const isLoading = friendLoading;

  const onRefresh = async () => {
    await Promise.all([refetchFriends(), fetchGroups()]);
  };

  return (
    <PageContainer withPadding={false}>
      <View style={styles.header}>
        <IconButton
          icon={() => <ArrowLeft size={24} color={theme.colors.onSurface} />}
          onPress={() => router.back()}
        />
        <Text variant="titleLarge" style={styles.headerTitle}>
          {t("notifications.title")}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
      >
        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.sectionLabel}>
            {t("notifications.friends")} ({friendRequests.length})
          </Text>
          {friendRequests.length === 0 ? (
            <Text style={styles.emptyText}>{t("notifications.emptyFriends")}</Text>
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
                      {t("notifications.friendRequestSub")}
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

        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.sectionLabel}>
            {t("notifications.groups")} ({groupInvites.length})
          </Text>
          {groupInvites.length === 0 ? (
            <Text style={styles.emptyText}>{t("notifications.emptyGroups")}</Text>
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
                      {t("notifications.groupInviteSub")}
                    </Text>
                  </View>
                </View>
                <View style={styles.actions}>
                  <Button 
                    mode="contained" 
                    onPress={() => {
                      alert(t("settings.notifications.joinSuccess") || "Successfully joined group!");
                    }}
                  >
                    {t("common.join")}
                  </Button>
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
  sectionLabel: {
    opacity: 0.6,
    textTransform: "uppercase",
    marginBottom: 16,
    letterSpacing: 1,
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

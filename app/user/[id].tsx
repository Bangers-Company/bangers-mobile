import { useQueryClient } from "@tanstack/react-query";
import { Image as ExpoImage } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  Clock,
  History,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  Check,
  X,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Avatar,
  Button,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import { useTranslation } from "react-i18next";
import ContentLoader, { Rect } from "react-content-loader/native";
import Animated, { useAnimatedScrollHandler } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EventCard, EventCardSkeleton } from "../../src/components/event/EventCard";
import { PageContainer } from "../../src/components/PageContainer";
import { AnimatedCounter } from "../../src/components/ui/AnimatedCounter";
import {
  useFriendshipActions,
  useFriendshipStatus,
} from "../../src/hooks/useFriendship";
import { useUser } from "../../src/hooks/useUser";
import { useAuthStore } from "../../src/store/useAuthStore";
import { getUserAvatarUrl, getUserDisplayName } from "../../src/utils/format";
import { addAlpha } from "../../src/utils/theme";
import { useSharedScroll } from "../../src/hooks/useSharedScroll";

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const scrollOffset = useSharedScroll();

  const {
    data: profileUser,
    isLoading: userLoading,
    error: userError,
    refetch: refetchUser,
  } = useUser(id);

  const { data: friendshipStatus = "none" } = useFriendshipStatus(id);
  const { sendRequest, acceptRequest, removeFriend, rejectRequest } = useFriendshipActions(id);
  const [actionLoading, setActionLoading] = useState(false);

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refetchUser(),
      queryClient.invalidateQueries({ queryKey: ["friendship", id] }),
    ]);
  }, [id, refetchUser, queryClient]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (ev) => {
      scrollOffset.value = ev.contentOffset.y;
    },
  });

  const handleFriendAction = async () => {
    if (!id || actionLoading) return;
    setActionLoading(true);
    try {
      if (friendshipStatus === "none") {
        await sendRequest.mutateAsync();
      } else if (friendshipStatus === "pending_received") {
        await acceptRequest.mutateAsync();
      } else if (friendshipStatus === "friends") {
        await removeFriend.mutateAsync();
      }
    } catch (e) {
      console.error("Failed friend action", e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectAction = async () => {
    if (!id || actionLoading) return;
    setActionLoading(true);
    try {
      await rejectRequest.mutateAsync();
    } catch (e) {
      console.error("Failed reject action", e);
    } finally {
      setActionLoading(false);
    }
  };

  if (userLoading && !profileUser) {
    return (
      <PageContainer style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </PageContainer>
    );
  }

  if (userError || !profileUser) {
    return (
      <PageContainer style={styles.center}>
        <Text variant="titleMedium" style={{ color: theme.colors.error }}>
          {(userError as any)?.message || "User not found"}
        </Text>
        <Button
          mode="contained"
          onPress={() => router.back()}
          style={{ marginTop: 16 }}
        >
          Go Back
        </Button>
      </PageContainer>
    );
  }

  const isSelf = currentUser?.id === id;

  const rawAttending = profileUser.upcoming_events || profileUser.attendingEvents;
  const attendingEvents = Array.isArray(rawAttending)
    ? rawAttending
    : (rawAttending as any)?.data || [];

  const rawPast = profileUser.past_events || profileUser.pastEvents;
  const pastEvents = Array.isArray(rawPast)
    ? rawPast
    : (rawPast as any)?.data || [];

  const friendsCount = profileUser.friends_count || 0;

  const statItems = [
    {
      label: t("profile.stats.events", "Events"),
      value: attendingEvents.length,
      icon: Calendar,
      route: null,
    },
    {
      label: t("profile.stats.past", "Past"),
      value: pastEvents.length,
      icon: History,
      route: null,
    },
    {
      label: t("profile.stats.friends", "Friends"),
      value: friendsCount,
      icon: Users,
      route: isSelf ? `/friends/me` : null,
    },
  ];

  return (
    <PageContainer withPadding={false} withSafeArea={true}>
      <Animated.ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={userLoading} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
        }
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
      >
        {/* Header matching app/(tabs)/profile.tsx layout exactly */}
        <View style={styles.header}>
          <View style={styles.topRightActions}>
            <TouchableOpacity
              style={[
                styles.settingsBtn,
                {
                  backgroundColor: addAlpha(theme.colors.surface, 0.8),
                  borderColor: addAlpha(theme.colors.outline, 0.15),
                },
              ]}
              onPress={() => router.back()}
            >
              <ArrowLeft size={18} color={theme.colors.onSurface} />
            </TouchableOpacity>
          </View>

          <View style={styles.profileHeader}>
            <View style={styles.avatarWrapper}>
              {getUserAvatarUrl(profileUser) ? (
                <ExpoImage
                  source={{ uri: getUserAvatarUrl(profileUser)! }}
                  style={{ width: 84, height: 84, borderRadius: 26 }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              ) : (
                <Avatar.Text
                  size={84}
                  label={getUserDisplayName(profileUser).charAt(0).toUpperCase()}
                  style={{ backgroundColor: theme.colors.primary, borderRadius: 26 }}
                  color="#ffffff"
                />
              )}
            </View>

            <View style={styles.profileInfoContainer}>
              <View style={styles.profileInfo}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <Text variant="headlineSmall" style={[styles.userName, { color: theme.colors.onSurface }]}>
                    {getUserDisplayName(profileUser)}
                  </Text>

                  {profileUser.roles?.includes("admin") && (
                    <ShieldAlert size={22} color={theme.colors.error} />
                  )}
                  {!profileUser.roles?.includes("admin") &&
                    profileUser.roles?.includes("moderator") && (
                      <ShieldCheck size={22} color={theme.colors.primary} />
                    )}
                </View>
                <Text variant="bodyMedium" style={[styles.userEmail, { color: addAlpha(theme.colors.onSurface, 0.6) }]}>
                  @{profileUser.username}
                </Text>

                {/* Friend Action Button */}
                {!isSelf && currentUser && (
                  <View style={{ marginTop: 8, flexDirection: "row", gap: 8, alignItems: "center" }}>
                    {friendshipStatus === "none" && (
                      <TouchableOpacity
                        onPress={handleFriendAction}
                        disabled={actionLoading || sendRequest.isPending}
                        style={[styles.friendActionBtn, { backgroundColor: theme.colors.primary }]}
                      >
                        <UserPlus size={14} color="#ffffff" />
                        <Text style={styles.friendActionBtnText}>
                          {t("user.addFriend", "Add Friend")}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {friendshipStatus === "pending_sent" && (
                      <TouchableOpacity
                        disabled
                        style={[styles.friendActionBtn, { backgroundColor: addAlpha(theme.colors.surfaceVariant, 0.4), borderColor: addAlpha(theme.colors.outline, 0.2), borderWidth: 1 }]}
                      >
                        <Clock size={14} color={addAlpha(theme.colors.onSurface, 0.7)} />
                        <Text style={[styles.friendActionBtnText, { color: addAlpha(theme.colors.onSurface, 0.7) }]}>
                          {t("user.requestSent", "Request Sent")}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {friendshipStatus === "pending_received" && (
                      <>
                        <TouchableOpacity
                          onPress={handleFriendAction}
                          disabled={actionLoading || acceptRequest.isPending}
                          style={[styles.friendActionBtn, { backgroundColor: theme.colors.primary }]}
                        >
                          <Check size={14} color="#ffffff" />
                          <Text style={styles.friendActionBtnText}>
                            {t("user.acceptRequest", "Accept")}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleRejectAction}
                          disabled={actionLoading || rejectRequest.isPending}
                          style={[styles.friendActionBtn, { backgroundColor: "rgba(255,82,82,0.14)", borderColor: "rgba(255,82,82,0.3)", borderWidth: 1 }]}
                        >
                          <X size={14} color="#ff5252" />
                          <Text style={[styles.friendActionBtnText, { color: "#ff5252" }]}>
                            {t("common.decline", "Decline")}
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {friendshipStatus === "friends" && (
                      <TouchableOpacity
                        onPress={handleFriendAction}
                        disabled={actionLoading || removeFriend.isPending}
                        style={[styles.friendActionBtn, { backgroundColor: addAlpha(theme.colors.primary, 0.12), borderColor: theme.colors.primary, borderWidth: 1.5 }]}
                      >
                        <UserCheck size={14} color={theme.colors.primary} />
                        <Text style={[styles.friendActionBtnText, { color: theme.colors.primary }]}>
                          {t("user.friends", "Friends")}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Music Genre Interest Pills */}
          {profileUser.genres && profileUser.genres.length > 0 && (
            <Animated.ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.genresScroll}
              style={styles.genresContainer}
            >
              {profileUser.genres.map((genre: any) => (
                <View
                  key={genre.id}
                  style={[
                    styles.genreBadge,
                    {
                      backgroundColor: addAlpha(theme.colors.primary, 0.12),
                      borderColor: addAlpha(theme.colors.primary, 0.25),
                    },
                  ]}
                >
                  <Sparkles size={11} color={theme.colors.primary} style={{ marginRight: 4 }} />
                  <Text variant="labelMedium" style={{ color: theme.colors.primary, fontWeight: "800", fontSize: 11 }}>
                    {genre.name}
                  </Text>
                </View>
              ))}
            </Animated.ScrollView>
          )}

          {/* 3-Card Stat Grid */}
          <View style={styles.statsContainer}>
            {statItems.map((item, index) => (
              <TouchableRipple
                key={index}
                onPress={() => {
                  if (item.route) {
                    router.push(item.route as any);
                  }
                }}
                style={[
                  styles.statItemRipple,
                  {
                    backgroundColor: addAlpha(theme.colors.surface, 0.85),
                    borderColor: addAlpha(theme.colors.outline, 0.15),
                  },
                ]}
                rippleColor="rgba(0, 0, 0, .05)"
              >
                <View style={styles.statItem}>
                  <item.icon
                    size={20}
                    color={theme.colors.primary}
                    style={{ marginBottom: 4 }}
                  />
                  {userLoading && !profileUser ? (
                    <ContentLoader
                      viewBox="0 0 40 20"
                      width={40}
                      height={20}
                      backgroundColor="rgba(128,128,128,0.2)"
                      foregroundColor="rgba(128,128,128,0.4)"
                    >
                      <Rect x="0" y="0" rx="4" ry="4" width="40" height="20" />
                    </ContentLoader>
                  ) : (
                    <AnimatedCounter
                      value={item.value}
                      variant="titleMedium"
                      textStyle={{ fontWeight: "900", textAlign: "center" }}
                    />
                  )}
                  <Text
                    variant="labelSmall"
                    style={{
                      color: addAlpha(theme.colors.onSurface, 0.6),
                      fontWeight: "700",
                      marginTop: 2,
                      textAlign: "center",
                      width: "100%",
                    }}
                  >
                    {item.label}
                  </Text>
                </View>
              </TouchableRipple>
            ))}
          </View>
        </View>

        {/* Section 1: Upcoming Festivals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              {t("profile.sections.upcoming") || "Upcoming Festivals"}
            </Text>
          </View>
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {userLoading && attendingEvents.length === 0 ? (
              <>
                <EventCardSkeleton variant="horizontal" style={{ marginRight: 14 }} />
                <EventCardSkeleton variant="horizontal" style={{ marginRight: 14 }} />
              </>
            ) : attendingEvents.length > 0 ? (
              attendingEvents.map((event: any) => (
                <EventCard
                  key={event.id}
                  event={event}
                  variant="horizontal"
                  style={{ marginRight: 14 }}
                  onPress={() => router.push(`/event/${event.id}` as any)}
                />
              ))
            ) : (
              <View style={[styles.emptyBox, { backgroundColor: addAlpha(theme.colors.surface, 0.6), borderColor: addAlpha(theme.colors.outline, 0.12) }]}>
                <Text style={{ color: addAlpha(theme.colors.onSurface, 0.6), fontSize: 13 }}>
                  No upcoming events joined yet.
                </Text>
              </View>
            )}
          </Animated.ScrollView>
        </View>

        {/* Section 2: Past Festival Memories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              {t("profile.sections.past") || "Past Festival Memories"}
            </Text>
          </View>
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {userLoading && pastEvents.length === 0 ? (
              <EventCardSkeleton variant="horizontal" style={{ marginRight: 14 }} />
            ) : pastEvents.length > 0 ? (
              pastEvents.map((event: any) => (
                <EventCard
                  key={event.id}
                  event={event}
                  variant="horizontal"
                  style={{ marginRight: 14 }}
                  onPress={() => router.push(`/event/${event.id}` as any)}
                />
              ))
            ) : (
              <View style={[styles.emptyBox, { backgroundColor: addAlpha(theme.colors.surface, 0.6), borderColor: addAlpha(theme.colors.outline, 0.12) }]}>
                <Text style={{ color: addAlpha(theme.colors.onSurface, 0.6), fontSize: 13 }}>
                  No past event history.
                </Text>
              </View>
            )}
          </Animated.ScrollView>
        </View>
      </Animated.ScrollView>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  topRightActions: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 8,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  avatarWrapper: {
    position: "relative",
  },
  profileInfoContainer: {
    flex: 1,
  },
  profileInfo: {
    gap: 2,
  },
  userName: {
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  userEmail: {
    fontSize: 13,
    fontWeight: "600",
  },
  friendActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  friendActionBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  genresContainer: {
    marginBottom: 16,
  },
  genresScroll: {
    gap: 8,
  },
  genreBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  statItemRipple: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  statItem: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  section: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  horizontalScroll: {
    paddingRight: 16,
  },
  emptyBox: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    width: 280,
    alignItems: "center",
    justifyContent: "center",
  },
});

import { useRouter, useFocusEffect } from "expo-router";
import { Calendar, History, Users, ShieldAlert, ShieldCheck, Pencil } from "lucide-react-native";
import React, { useCallback } from "react";
import { RefreshControl, StyleSheet, View, TouchableOpacity } from "react-native";
import {
  Avatar,
  Button,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import { useTranslation } from "react-i18next";
import ContentLoader, { Rect } from "react-content-loader/native";
import { useProfile } from "../../src/hooks/useProfile";
import { Image as ExpoImage } from "expo-image";
import { getUserAvatarUrl, getUserDisplayName } from "../../src/utils/format";

import { useSharedScroll } from "../../src/hooks/useSharedScroll";
import Animated, { useAnimatedScrollHandler } from "react-native-reanimated";
import {
  EventCard,
  EventCardSkeleton,
} from "../../src/components/event/EventCard";
import { AnimatedCounter } from "../../src/components/ui/AnimatedCounter";
import { EditProfileModal } from "../../src/components/modals/EditProfileModal";
import { useUIStore } from "../../src/store/useUIStore";
import { useAuthStore } from "../../src/store/useAuthStore";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const [focusKey, setFocusKey] = React.useState(0);
  const { data: userProfile, isLoading: loading, refetch: refreshProfile } = useProfile();
  const [localUser, setLocalUser] = React.useState<any>(null);

  React.useEffect(() => {
    const loadLocal = async () => {
      const { usersRepository } = await import("../../src/database/repositories/users.repository");
      const me = await usersRepository.getMe();
      if (me) setLocalUser(me);
    };
    loadLocal();
  }, []);
  
  const [isEditModalVisible, setIsEditModalVisible] = React.useState(false);

  const authUser = useAuthStore((state) => state.user);
  const user = authUser || userProfile || localUser;
  const attendingEvents = user?.attendingEvents || [];
  const pastEvents = user?.pastEvents || [];
  const friendsCount = user?.friends_count || 0;

  const scrollOffset = useSharedScroll();

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
      setFocusKey(prev => prev + 1);
    }, [refreshProfile])
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (ev) => {
      scrollOffset.value = ev.contentOffset.y;
    },
  });

  const statItems = [
    {
      label: t("profile.stats.events"),
      value: attendingEvents?.length || user?.stats?.upcoming_count || 0,
      icon: Calendar,
      route: null,
    },
    {
      label: t("profile.stats.past"),
      value: pastEvents?.length || user?.stats?.past_count || 0,
      icon: History,
      route: null,
    },
    {
      label: t("profile.stats.friends"),
      value: friendsCount || 0,
      icon: Users,
      route: `/friends/me`,
    },
  ];

  return (
    <Animated.ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refreshProfile} />
      }
      onScroll={scrollHandler}
      scrollEventThrottle={16}
    >
      <View style={styles.header}>
        <View style={styles.profileHeader}>
          <TouchableOpacity 
            onPress={() => {
              if (useUIStore.getState().isOffline) {
                alert(t("common.offline_warning"));
                return;
              }
              setIsEditModalVisible(true);
            }} 
            activeOpacity={0.7}
          >
            <View style={styles.avatarWrapper}>
              {getUserAvatarUrl(user) ? (
                <ExpoImage
                  source={{ uri: getUserAvatarUrl(user)! }}
                  style={{ width: 80, height: 80, borderRadius: 22 }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              ) : (
                <Avatar.Text
                  size={80}
                  label={getUserDisplayName(user).charAt(0).toUpperCase()}
                  style={{ backgroundColor: theme.colors.primary, borderRadius: 22 }}
                  color="#ffffff"
                />
              )}
              <TouchableRipple
                onPress={() => setIsEditModalVisible(true)}
                style={[styles.editIconBadge, { backgroundColor: theme.colors.primary }]}
                rippleColor="rgba(255, 255, 255, 0.3)"
                borderless
              >
                <Pencil size={14} color="#fff" />
              </TouchableRipple>
            </View>
          </TouchableOpacity>
          <View style={styles.profileInfoContainer}>
            <View style={styles.profileInfo}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text variant="headlineSmall" style={[styles.userName, { color: theme.colors.onSurface }]}>
                  {getUserDisplayName(user)}
                </Text>

                {user?.roles?.includes('admin') && (
                  <ShieldAlert size={24} color={theme.colors.error} />
                )}
                {!user?.roles?.includes('admin') &&
                  user?.roles?.includes('moderator') && (
                    <ShieldCheck size={24} color={theme.colors.primary} />
                  )}
              </View>
              <Text variant="bodyMedium" style={styles.userEmail}>
                @{user?.username}
              </Text>
            </View>
          </View>
        </View>

        {user?.genres && user.genres.length > 0 && (
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.genresScroll}
            style={styles.genresContainer}
          >
            {user.genres.map((genre) => (
              <View 
                key={genre.id} 
                style={[styles.genreBadge, { backgroundColor: theme.colors.surfaceVariant }]}
              >
                <Text variant="labelMedium" style={styles.genreText}>
                  {genre.name}
                </Text>
              </View>
            ))}
          </Animated.ScrollView>
        )}

        <View style={styles.statsContainer} key={focusKey}>
          {statItems.map((item, index) => (
            <TouchableRipple
              key={index}
              onPress={() => {
                if (item.route) {
                  router.push(item.route as any);
                }
              }}
              style={styles.statItemRipple}
              rippleColor="rgba(0, 0, 0, .05)"
            >
              <View style={styles.statItem}>
                <item.icon
                  size={20}
                  color={theme.colors.primary}
                  style={{ marginBottom: 4 }}
                />
                {loading && !user ? (
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
                    style={styles.statValue}
                  />
                )}
                <Text variant="labelSmall" style={styles.statLabel}>
                   {item.label}
                </Text>
              </View>
            </TouchableRipple>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            {t("profile.sections.upcoming")}
          </Text>
          <Button
            mode="text"
            onPress={() => { }}
            textColor={theme.colors.primary}
          >
            {t("common.viewAll")}
          </Button>
        </View>
        <Animated.ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {loading && attendingEvents.length === 0 ? (
            <>
              <EventCardSkeleton variant="horizontal" style={{ marginRight: 16 }} />
              <EventCardSkeleton variant="horizontal" style={{ marginRight: 16 }} />
              <EventCardSkeleton variant="horizontal" style={{ marginRight: 16 }} />
            </>
          ) : attendingEvents.length > 0 ? (
            attendingEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                variant="horizontal"
                style={{ marginRight: 16 }}
                onPress={(e) => router.push(`/event/${e.id}` as any)}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>{t("profile.sections.noUpcoming") || "No upcoming events"}</Text>
          )}
        </Animated.ScrollView>
      </View>

      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          {t("profile.sections.past")}
        </Text>
        <Animated.ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {loading && pastEvents.length === 0 ? (
            <>
              <EventCardSkeleton variant="horizontal" style={{ marginRight: 16 }} />
              <EventCardSkeleton variant="horizontal" style={{ marginRight: 16 }} />
              <EventCardSkeleton variant="horizontal" style={{ marginRight: 16 }} />
            </>
          ) : pastEvents.length > 0 ? (
            pastEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                variant="horizontal"
                style={{ marginRight: 16 }}
                onPress={(e) => router.push(`/event/${e.id}` as any)}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>{t("profile.sections.noPast") || "No past events recorded"}</Text>
          )}
        </Animated.ScrollView>
      </View>

      <View style={styles.footer}>
        <Text variant="labelSmall" style={styles.versionText}>
          Version 1.0.0 (Beta)
        </Text>
      </View>

      {user && (
        <EditProfileModal
          visible={isEditModalVisible}
          user={user}
          onClose={() => setIsEditModalVisible(false)}
        />
      )}
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 40,
    alignItems: "center",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    width: "100%",
  },
  profileInfoContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  userEmail: {
    opacity: 0.6,
  },
  genresContainer: {
    marginTop: 16,
    width: "100%",
  },
  genresScroll: {
    gap: 8,
  },
  genreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  genreText: {
    fontWeight: "600",
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 24,
    backgroundColor: "rgba(0,0,0,0.03)",
    padding: 20,
    borderRadius: 24,
  },
  statItemRipple: {
    flex: 1,
    borderRadius: 16,
  },
  statItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  statValue: {
  },
  statLabel: {
    opacity: 0.5,
    textTransform: "uppercase",
    fontSize: 10,
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 12,
    marginLeft: 4,
  },
  footer: {
    padding: 40,
    alignItems: "center",
    gap: 16,
    paddingBottom: 120,
  },
  versionText: {
    opacity: 0.3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  horizontalScroll: {
    paddingRight: 24,
    minHeight: 130,
  },
  emptyText: {
    opacity: 0.5,
    fontStyle: "italic",
    paddingVertical: 12,
  },
  avatarWrapper: {
    position: "relative",
  },
  editIconBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});

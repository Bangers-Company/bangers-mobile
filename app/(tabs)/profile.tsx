import { useRouter, useFocusEffect } from "expo-router";
import { Calendar, History, Users, ShieldAlert, ShieldCheck, Pencil, Sparkles, Settings } from "lucide-react-native";
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
import { addAlpha } from "../../src/utils/theme";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
        <RefreshControl refreshing={loading} onRefresh={refreshProfile} tintColor={theme.colors.primary} />
      }
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
    >
      {/* Top Glass Card Header */}
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
            onPress={() => router.push("/settings" as any)}
          >
            <Settings size={18} color={theme.colors.onSurface} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileHeader}>
          <TouchableOpacity 
            onPress={() => {
              if (useUIStore.getState().isOffline) {
                alert(t("common.offline_warning"));
                return;
              }
              setIsEditModalVisible(true);
            }} 
            activeOpacity={0.8}
          >
            <View style={styles.avatarWrapper}>
              {getUserAvatarUrl(user) ? (
                <ExpoImage
                  source={{ uri: getUserAvatarUrl(user)! }}
                  style={{ width: 84, height: 84, borderRadius: 26 }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              ) : (
                <Avatar.Text
                  size={84}
                  label={getUserDisplayName(user).charAt(0).toUpperCase()}
                  style={{ backgroundColor: theme.colors.primary, borderRadius: 26 }}
                  color="#ffffff"
                />
              )}
              <TouchableRipple
                onPress={() => setIsEditModalVisible(true)}
                style={[styles.editIconBadge, { backgroundColor: theme.colors.primary }]}
                rippleColor="rgba(255, 255, 255, 0.3)"
                borderless
              >
                <Pencil size={13} color="#fff" />
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
                  <ShieldAlert size={22} color={theme.colors.error} />
                )}
                {!user?.roles?.includes('admin') &&
                  user?.roles?.includes('moderator') && (
                    <ShieldCheck size={22} color={theme.colors.primary} />
                  )}
              </View>
              <Text variant="bodyMedium" style={[styles.userEmail, { color: addAlpha(theme.colors.onSurface, 0.6) }]}>
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
            {user.genres.map((genre: any) => (
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

        <View style={styles.statsContainer} key={focusKey}>
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

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {t("profile.sections.upcoming") || "Upcoming Festivals"}
          </Text>
          <Button
            mode="text"
            onPress={() => { }}
            textColor={theme.colors.primary}
            labelStyle={{ fontWeight: "800", fontSize: 12 }}
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
          {loading && pastEvents.length === 0 ? (
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

      <EditProfileModal
        visible={isEditModalVisible}
        onClose={() => {
          setIsEditModalVisible(false);
          refreshProfile();
        }}
        user={user}
      />
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  topRightActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
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
  editIconBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
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

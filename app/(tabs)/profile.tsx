import { useRouter, useFocusEffect } from "expo-router";
import { Calendar, History, Users, ShieldAlert, ShieldCheck } from "lucide-react-native";
import React, { useCallback } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import {
  Avatar,
  Button,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import ContentLoader, { Rect } from "react-content-loader/native";
import { useProfile } from "../../src/hooks/useProfile";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../src/store/redux/store";
import { setScrollOffset } from "../../src/store/redux/uiSlice";
import { resolveMediaUrl } from "../../src/utils/format";
import {
  EventCard,
  EventCardSkeleton,
} from "../../src/components/event/EventCard";
import { AnimatedCounter } from "../../src/components/ui/AnimatedCounter";

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [focusKey, setFocusKey] = React.useState(0);
  const { user, attendingEvents, pastEvents, friendsCount, loading, refreshProfile } =
    useProfile();

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
      setFocusKey(prev => prev + 1);
    }, [refreshProfile])
  );

  const handleScroll = (event: any) => {
    dispatch(setScrollOffset(event.nativeEvent.contentOffset.y));
  };

  const statItems = [
    {
      label: "Attending Events",
      value: attendingEvents?.length || user?.stats?.upcoming_count || 0,
      icon: Calendar,
      route: null,
    },
    {
      label: "Past events",
      value: pastEvents?.length || user?.stats?.past_count || 0,
      icon: History,
      route: null,
    },
    {
      label: "Friends",
      value: friendsCount || 0,
      icon: Users,
      route: `/friends/me`,
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refreshProfile} />
      }
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      <View style={styles.header}>
        <View style={styles.profileHeader}>
          {user?.profile_media_url ? (
            <Avatar.Image
              size={80}
              source={{
                uri: resolveMediaUrl(user.profile_media_url) || undefined,
              }}
            />
          ) : (
            <Avatar.Text
              size={80}
              label={user?.first_name?.charAt(0) || "U"}
              style={{ backgroundColor: theme.colors.primary }}
            />
          )}
          <View style={styles.profileInfo}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text variant="headlineSmall" style={styles.userName}>
                {user?.first_name} {user?.last_name}
              </Text>
              {user?.roles?.some((r: any) => (typeof r === 'string' ? r === 'admin' : r?.name === 'admin')) && (
                <ShieldAlert size={24} color={theme.colors.error} />
              )}
              {!user?.roles?.some((r: any) => (typeof r === 'string' ? r === 'admin' : r?.name === 'admin')) &&
                user?.roles?.some((r: any) => (typeof r === 'string' ? r === 'moderator' : r?.name === 'moderator')) && (
                  <ShieldCheck size={24} color={theme.colors.primary} />
                )}
            </View>
            <Text variant="bodyMedium" style={styles.userEmail}>
              @{user?.username}
            </Text>
          </View>
        </View>

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
                {loading ? (
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
            Attending Events
          </Text>
          <Button
            mode="text"
            onPress={() => { }}
            textColor={theme.colors.primary}
          >
            View All
          </Button>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {loading ? (
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
                onPress={(e: any) => router.push(`/event/${e.id}` as any)}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>No upcoming events</Text>
          )}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Past Events
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {loading ? (
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
                onPress={(e: any) => router.push(`/event/${e.id}` as any)}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>No past events recorded</Text>
          )}
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <Text variant="labelSmall" style={styles.versionText}>
          Version 1.0.0 (Beta)
        </Text>
      </View>
    </ScrollView>
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
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 32,
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
    fontWeight: "bold",
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
  listSection: {
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 20,
    overflow: "hidden",
  },
  footer: {
    padding: 40,
    alignItems: "center",
    gap: 16,
    paddingBottom: 120,
  },
  logoutButton: {
    width: "100%",
    borderRadius: 16,
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
  eventCard: {
    width: 200,
    height: 120,
    borderRadius: 16,
    overflow: "hidden",
  },
  eventCardContent: {
    flex: 1,
    padding: 16,
    justifyContent: "flex-end",
  },
  eventInfo: {
    gap: 4,
  },
  pastEventsList: {
    gap: 12,
  },
  pastEventItem: {
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 16,
  },
  emptyText: {
    opacity: 0.5,
    fontStyle: "italic",
    paddingVertical: 12,
  },
});

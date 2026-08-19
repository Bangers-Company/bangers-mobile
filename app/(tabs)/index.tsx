import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, StyleSheet, View } from "react-native";
import { Button, ButtonText, Text } from "@gluestack-ui/themed";
import { useAppTheme } from "../../src/context/ThemeProvider";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MyEventsCarousel } from "../../src/components/dashboard/MyEventsCarousel";
import { SuggestedEvents } from "../../src/components/dashboard/SuggestedEvents";
import { OnboardingModal } from "../../src/components/modals/OnboardingModal";
import { TopBar } from "../../src/components/navigation/TopBar";
import { HomeGreeting } from "../../src/components/home/HomeGreeting";
import { Droplet } from "../../src/components/ui/Droplet";
import { useDashboardData } from "../../src/hooks/useDashboardData";
import { useSharedScroll } from "../../src/hooks/useSharedScroll";
import { useAuthStore } from "../../src/store/useAuthStore";
import { Event } from "../../src/types/event";

export default function HomeScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, loading, refreshing, refresh, error } = useDashboardData();
  const [showDroplet, setShowDroplet] = React.useState(false);
  const scrollRef = React.useRef<Animated.ScrollView>(null);
  const scrollOffset = useSharedScroll();

  const user = useAuthStore((state) => state.user);
  const isJustRegistered = useAuthStore((state) => state.isJustRegistered);

  const [showOnboarding, setShowOnboarding] = React.useState(
    isJustRegistered || user?.last_login_at === null,
  );

  React.useEffect(() => {
    if (isJustRegistered) {
      setShowOnboarding(true);
    }
  }, [isJustRegistered]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (ev) => {
      scrollOffset.value = ev.contentOffset.y;

      if (ev.contentOffset.y > 200 !== showDroplet) {
        runOnJS(setShowDroplet)(ev.contentOffset.y > 200);
      }
    },
  });

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  if (error && !data) {
    return (
      <View
        style={[styles.center, { backgroundColor: theme.colors.background }]}
      >
        <TopBar />
        <View style={styles.loadingWrapper}>
          <Text style={{ color: "#ff5252", fontSize: 16, fontWeight: "bold" }}>
            {t("common.errorTitle") || "Failed to load events"}
          </Text>
          <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            {error.message}
          </Text>
          <Button onPress={refresh} variant="outline" style={{ marginTop: 24 }}>
            <ButtonText>{t("common.tryAgain") || "Try Again"}</ButtonText>
          </Button>
        </View>
      </View>
    );
  }

  const rawAttending = data?.attending_events;
  const attendingEvents: Event[] = Array.isArray(rawAttending)
    ? rawAttending
    : (rawAttending as any)?.data || [];

  const rawUpcoming = data?.upcoming_events;
  const upcomingEvents: Event[] = Array.isArray(rawUpcoming)
    ? rawUpcoming
    : (rawUpcoming as any)?.data || [];

  const rawSuggested = data?.suggested_events;
  const suggestedEvents: Event[] = Array.isArray(rawSuggested)
    ? rawSuggested
    : (rawSuggested as any)?.data || [];

  // HomeGreeting ONLY appears if there is an attending event happening TODAY
  const todayHappeningEvent = React.useMemo(() => {
    const allAttending = [...attendingEvents];

    // Also include any event from upcoming/suggested where user is marked as attending/going
    [...upcomingEvents, ...suggestedEvents].forEach((ev) => {
      if (((ev as any).is_attending || ev.user_status === "going") && !allAttending.some((a) => a.id === ev.id)) {
        allAttending.push(ev);
      }
    });

    if (allAttending.length === 0) return null;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const todayYMD = `${year}-${month}-${day}`;

    return (
      allAttending.find((ev: Event) => {
        if (!ev.start_date) return false;
        // Cleanly extract YYYY-MM-DD from "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DDTHH:MM:SS"
        const startYMD = String(ev.start_date).trim().substring(0, 10);
        const endDateStr = ev.end_date || ev.start_date;
        const endYMD = String(endDateStr).trim().substring(0, 10);

        return todayYMD >= startYMD && todayYMD <= endYMD;
      }) || null
    );
  }, [attendingEvents, upcomingEvents, suggestedEvents]);

  // My Festivals carousel filters out today's happening event so it shows the NEXT ones
  const myFestivalsList = React.useMemo(() => {
    if (!attendingEvents) return [];
    if (!todayHappeningEvent) return attendingEvents;
    return attendingEvents.filter((ev: Event) => ev.id !== todayHappeningEvent.id);
  }, [attendingEvents, todayHappeningEvent]);

  return (
    <View style={styles.container}>
      <Droplet
        visible={showDroplet}
        onPress={scrollToTop}
        position="top"
        topOffset={insets.top + 8}
      />
      <Animated.ScrollView
        ref={scrollRef}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        {/* HomeGreeting: ONLY appears if an attending event is happening TODAY */}
        {todayHappeningEvent && (
          <HomeGreeting
            event={todayHappeningEvent}
            onPress={() =>
              router.push(`/event/${todayHappeningEvent.id}/schedule?from=home` as any)
            }
          />
        )}

        {(loading || myFestivalsList.length > 0) && (
          <MyEventsCarousel
            title={t("dashboard.myEvents")}
            events={myFestivalsList}
            loading={loading && myFestivalsList.length === 0}
            onPress={(ev) => router.push(`/event/${ev.id}` as any)}
          />
        )}

        {(loading || upcomingEvents.length > 0) && (
          <MyEventsCarousel
            title={t("dashboard.maybeInterested")}
            events={upcomingEvents}
            loading={loading && upcomingEvents.length === 0}
            onPress={(ev) => router.push(`/event/${ev.id}` as any)}
          />
        )}

        <SuggestedEvents
          events={suggestedEvents}
          onRefresh={refresh}
          refreshing={refreshing}
          loading={loading && suggestedEvents.length === 0}
          onEventPress={(ev) => router.push(`/event/${ev.id}` as any)}
        />
      </Animated.ScrollView>

      {user && (
        <OnboardingModal
          visible={showOnboarding}
          user={user}
          onComplete={() => setShowOnboarding(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
  },
  scrollContent: {},
});

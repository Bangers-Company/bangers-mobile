import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MyEventsCarousel } from "../../src/components/dashboard/MyEventsCarousel";
import { SuggestedEvents } from "../../src/components/dashboard/SuggestedEvents";
import { OnboardingModal } from "../../src/components/modals/OnboardingModal";
import { TopBar } from "../../src/components/navigation/TopBar";
import { Droplet } from "../../src/components/ui/Droplet";
import { useDashboardData } from "../../src/hooks/useDashboardData";
import { useSharedScroll } from "../../src/hooks/useSharedScroll";
import { useAuthStore } from "../../src/store/useAuthStore";

export default function HomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, loading, refreshing, refresh, error } = useDashboardData();
  const [showDroplet, setShowDroplet] = React.useState(false);
  const scrollRef = React.useRef<Animated.ScrollView>(null);
  const scrollOffset = useSharedScroll();

  const user = useAuthStore((state) => state.user);
  const [showOnboarding, setShowOnboarding] = React.useState(
    user?.last_login_at === null,
  );

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
          <Text variant="bodyLarge" style={{ color: theme.colors.error }}>
            {t("common.error.title") || "Failed to load events"}
          </Text>
          <Text variant="bodySmall" style={styles.loadingText}>
            {error.message}
          </Text>
          <Button mode="outlined" onPress={refresh} style={{ marginTop: 24 }}>
            {t("common.tryAgain") || "Try Again"}
          </Button>
        </View>
      </View>
    );
  }

  // Full-screen loading removed in favor of inline skeletons

  const rawAttending = data?.attending_events;
  const attendingEvents = Array.isArray(rawAttending)
    ? rawAttending
    : (rawAttending as any)?.data || [];

  const rawUpcoming = data?.upcoming_events;
  const upcomingEvents = Array.isArray(rawUpcoming)
    ? rawUpcoming
    : (rawUpcoming as any)?.data || [];

  const rawSuggested = data?.suggested_events;
  const suggestedEvents = Array.isArray(rawSuggested)
    ? rawSuggested
    : (rawSuggested as any)?.data || [];

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
        {(loading || attendingEvents.length > 0) && (
          <MyEventsCarousel
            title={t("dashboard.myEvents")}
            events={attendingEvents}
            loading={loading && attendingEvents.length === 0}
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
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.6,
  },
  scrollContent: {
    paddingTop: 16,
  },
});

import { useRouter } from "expo-router";
import React from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MyEventsCarousel } from "../../src/components/dashboard/MyEventsCarousel";
import { SuggestedEvents } from "../../src/components/dashboard/SuggestedEvents";
import { TopBar } from "../../src/components/navigation/TopBar";
import { Droplet } from "../../src/components/ui/Droplet";
import { useDashboardData } from "../../src/hooks/useDashboardData";
import { useUIStore } from "../../src/store/useUIStore";

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const { data, loading, refreshing, refresh, error } = useDashboardData();
  const [showDroplet, setShowDroplet] = React.useState(false);
  const scrollRef = React.useRef<ScrollView>(null);
  const setScrollOffset = useUIStore((state) => state.setScrollOffset);

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowDroplet(offsetY > 300);
    setScrollOffset(offsetY);
  };

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
            Failed to load events
          </Text>
          <Text variant="bodySmall" style={styles.loadingText}>
            {error.message}
          </Text>
          <Button mode="outlined" onPress={refresh} style={{ marginTop: 24 }}>
            Try Again
          </Button>
        </View>
      </View>
    );
  }

  if (loading && !data) {
    return (
      <View
        style={[styles.center, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyMedium" style={styles.loadingText}>
            Loading your events...
          </Text>
        </View>
      </View>
    );
  }

  const rawAttending = data?.attending_events;
  const attendingEvents = Array.isArray(rawAttending)
    ? rawAttending
    : rawAttending?.data || [];

  const rawUpcoming = data?.upcoming_events;
  const upcomingEvents = Array.isArray(rawUpcoming)
    ? rawUpcoming
    : rawUpcoming?.data || [];

  const rawSuggested = data?.suggested_events;
  const suggestedEvents = Array.isArray(rawSuggested)
    ? rawSuggested
    : rawSuggested?.data || [];

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
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
          { paddingBottom: bottom + 100 },
        ]}
      >
        <Droplet visible={showDroplet} onPress={scrollToTop} />
        {/* Attending Section */}
        {attendingEvents.length > 0 && (
          <MyEventsCarousel
            title="My Events"
            events={attendingEvents}
            onPress={(ev) => router.push(`/event/${ev.id}` as any)}
          />
        )}

        {/* Upcoming Section */}
        {upcomingEvents.length > 0 && (
          <MyEventsCarousel
            title="Maybe interested in"
            events={upcomingEvents}
            onPress={(ev) => router.push(`/event/${ev.id}` as any)}
          />
        )}

        {/* Suggested Section */}
        <SuggestedEvents
          events={suggestedEvents}
          onRefresh={refresh}
          refreshing={refreshing}
          onEventPress={(ev) => router.push(`/event/${ev.id}` as any)}
        />
      </ScrollView>


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

import { useLocalSearchParams, useRouter } from "expo-router";
import { CalendarClock } from "lucide-react-native";
import React from "react";
import { ScrollView, StyleSheet, View, Dimensions } from "react-native";
import ContentLoader, { Rect, Circle } from "react-content-loader/native";
import { ActivityIndicator, Button, IconButton, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PageContainer } from "../../../src/components/PageContainer";
import { addAlpha } from "../../../src/utils/theme";
import { useUIStore } from "../../../src/store/useUIStore";

import { useEventStore } from "../../../src/store/useEventStore";

export default function ScheduleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  
  const setScrollOffset = useUIStore((state) => state.setScrollOffset);
  const cachedData = useEventStore((state) => state.events[id]);
  const loading = useEventStore((state) => state.loadingEvents[id]);

  const handleScroll = (e: any) => {
    setScrollOffset(e.nativeEvent.contentOffset.y);
  };

  const { width: SCREEN_WIDTH } = Dimensions.get("window");

  if (loading || !cachedData?.event) {
    return (
      <PageContainer withPadding={false} withSafeArea={false}>
        <View style={{ paddingTop: top + 10, paddingHorizontal: 16 }}>
          <ContentLoader 
            speed={2} 
            width={SCREEN_WIDTH} 
            height={800} 
            viewBox={`0 0 ${SCREEN_WIDTH} 800`}
            backgroundColor="rgba(128,128,128,0.2)"
            foregroundColor="rgba(128,128,128,0.4)"
          >
            {/* Header placeholder */}
            <Rect x="0" y="0" rx="4" ry="4" width={SCREEN_WIDTH * 0.4} height="28" />
            <Rect x="0" y="36" rx="4" ry="4" width={SCREEN_WIDTH * 0.2} height="16" />
            
            {/* Center icon and text placeholder */}
            <Circle cx={SCREEN_WIDTH / 2 - 16} cy="250" r="60" />
            <Rect x={SCREEN_WIDTH / 2 - 100 - 16} y="340" rx="8" ry="8" width="200" height="24" />
            <Rect x={40} y="380" rx="4" ry="4" width={SCREEN_WIDTH - 112} height="16" />
            <Rect x={80} y="404" rx="4" ry="4" width={SCREEN_WIDTH - 192} height="16" />
            <Rect x={SCREEN_WIDTH / 2 - 80 - 16} y="450" rx="16" ry="16" width="160" height="40" />
          </ContentLoader>
        </View>
      </PageContainer>
    );
  }

  return (
    <PageContainer withPadding={false} withSafeArea={false}>
      <View style={[styles.header, { paddingTop: top + 10, paddingBottom: 10 }]}>
        <View style={styles.headerRow}>
          <IconButton icon="chevron-left" onPress={() => router.push("/(tabs)")} />
          <View style={{ flex: 1 }}>
            <Text variant="titleLarge" style={styles.headerTitle} numberOfLines={1}>Schedule</Text>
            <Text variant="bodySmall" style={styles.headerSubtitle} numberOfLines={1}>Timetables</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: bottom + 120 }]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={[styles.iconBox, { backgroundColor: addAlpha(theme.colors.primary, 0.1) }]}>
           <CalendarClock size={64} color={theme.colors.primary} />
        </View>
        <Text variant="headlineSmall" style={styles.comingSoon}>Coming Soon</Text>
        <Text variant="bodyMedium" style={styles.description}>
          The timetable feature is currently under development. Soon, you'll be able to view official schedules, create your own personal timetable, and share it with your friends!
        </Text>
        <Button mode="contained" onPress={() => router.push("/(tabs)")} style={styles.backButton}>
           Return to Dashboard
        </Button>
      </ScrollView>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontWeight: "900",
  },
  headerSubtitle: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  iconBox: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  comingSoon: {
    fontWeight: "900",
    marginBottom: 16,
  },
  description: {
    opacity: 0.7,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  backButton: {
    borderRadius: 16,
  },
});

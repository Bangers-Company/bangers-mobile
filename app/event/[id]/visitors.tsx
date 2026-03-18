import { useLocalSearchParams, useRouter } from "expo-router";
import { ShieldAlert, ShieldCheck } from "lucide-react-native";
import React, { useState } from "react";
import ContentLoader, { Circle, Rect } from "react-content-loader/native";
import { Dimensions, StyleSheet, View } from "react-native";
import {
  Avatar,
  Button,
  IconButton,
  Surface,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useAnimatedScrollHandler } from "react-native-reanimated";
import { PageContainer } from "../../../src/components/PageContainer";
import { User } from "../../../src/types/user";
import { resolveMediaUrl } from "../../../src/utils/format";
import { useSharedScroll } from "../../../src/hooks/useSharedScroll";
import { useEvent, useAttendees } from "../../../src/hooks/useEvent";

export default function VisitorsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const scrollOffset = useSharedScroll();

  const { data: event, isLoading: eventLoading, error: eventError, refetch: refetchEvent } = useEvent(id as string);
  const { data: attendees = [], isLoading: attendeesLoading, refetch: refetchAttendees } = useAttendees(id as string);
  
  const loading = eventLoading || attendeesLoading;
  const error = eventError ? (eventError as any).message : null;

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchEvent(), refetchAttendees()]);
    setRefreshing(false);
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (ev) => {
      scrollOffset.value = ev.contentOffset.y;
    },
  });

  const { width: SCREEN_WIDTH } = Dimensions.get("window");

  if (error && !event) {
    return (
      <PageContainer style={styles.center}>
        <Text variant="titleMedium" style={{ color: theme.colors.error }}>
          {error}
        </Text>
        <Button
          mode="contained"
          onPress={onRefresh}
          style={{ marginTop: 16 }}
        >
          Try Again
        </Button>
      </PageContainer>
    );
  }

  if (loading && !event) {
    return (
      <PageContainer withPadding={false} withSafeArea={false}>
        <View style={{ paddingTop: top, paddingHorizontal: 16 }}>
          <ContentLoader
            speed={2}
            width={SCREEN_WIDTH}
            height={800}
            viewBox={`0 0 ${SCREEN_WIDTH} 800`}
            backgroundColor="rgba(128,128,128,0.2)"
            foregroundColor="rgba(128,128,128,0.4)"
          >
            <Rect x="0" y="0" rx="4" ry="4" width={SCREEN_WIDTH * 0.4} height="28" />
            <Rect x="0" y="36" rx="4" ry="4" width={SCREEN_WIDTH * 0.2} height="16" />

            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <React.Fragment key={i}>
                <Circle cx="24" cy={100 + i * 80} r="24" />
                <Rect x="64" y={86 + i * 80} rx="4" ry="4" width={SCREEN_WIDTH * 0.5} height="16" />
                <Rect x="64" y={110 + i * 80} rx="4" ry="4" width={SCREEN_WIDTH * 0.3} height="12" />
              </React.Fragment>
            ))}
          </ContentLoader>
        </View>
      </PageContainer>
    );
  }

  const renderVisitor = ({ item }: { item: User }) => {
    const isAdmin = item.roles?.some((r: any) =>
      typeof r === "string" ? r === "admin" : r?.name === "admin",
    );
    const isModerator =
      !isAdmin &&
      item.roles?.some((r: any) =>
        typeof r === "string" ? r === "moderator" : r?.name === "moderator",
      );

    return (
      <Surface
        style={[styles.visitorCard, { backgroundColor: theme.colors.surface }]}
        elevation={1}
      >
        <TouchableRipple
          onPress={() => router.push(`/user/${item.id}` as any)}
          style={styles.visitorRipple}
          rippleColor="rgba(0,0,0,0.05)"
        >
          <View style={styles.visitorContent}>
            <Avatar.Image
              size={48}
              source={{
                uri:
                  resolveMediaUrl(item.profile_media_url) ||
                  "https://via.placeholder.com/48",
              }}
            />
            <View style={styles.visitorInfo}>
              <View style={styles.nameRow}>
                <Text variant="titleMedium" style={styles.visitorName}>
                  {item.first_name} {item.last_name}
                </Text>
                {isAdmin && <ShieldAlert size={16} color={theme.colors.error} />}
                {isModerator && <ShieldCheck size={16} color={theme.colors.primary} />}
              </View>
              <Text variant="bodySmall" style={styles.visitorUsername}>
                @{item.username}
              </Text>
            </View>
          </View>
        </TouchableRipple>
      </Surface>
    );
  };

  return (
    <PageContainer withPadding={false} withSafeArea={false}>
      <View style={[styles.header, { paddingTop: top / 4, paddingBottom: 10 }]}>
        <View style={styles.headerRow}>
          <IconButton icon="chevron-left" onPress={() => router.back()} />
          <View style={{ flex: 1 }}>
            <Text variant="titleLarge" style={styles.headerTitle} numberOfLines={1}>Visitors</Text>
            <Text variant="bodySmall" style={styles.headerSubtitle} numberOfLines={1}>
              {attendees.length} attending
            </Text>
          </View>
        </View>
      </View>

      <Animated.FlatList
        data={attendees}
        keyExtractor={(item) => item.id}
        renderItem={renderVisitor}
        contentContainerStyle={[styles.listContent, { paddingBottom: bottom + 120 }]}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyMedium" style={{ opacity: 0.5 }}>
              Be the first to say you&apos;re going!
            </Text>
          </View>
        }
      />
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 16, zIndex: 10 },
  headerRow: { flexDirection: "row", alignItems: "center" },
  headerTitle: { fontWeight: "900" },
  headerSubtitle: { opacity: 0.6 },
  listContent: { padding: 16, gap: 12 },
  visitorCard: { borderRadius: 16, overflow: "hidden" },
  visitorRipple: { padding: 16 },
  visitorContent: { flexDirection: "row", alignItems: "center", gap: 16 },
  visitorInfo: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  visitorName: { fontWeight: "800" },
  visitorUsername: { opacity: 0.6 },
  emptyContainer: { padding: 40, alignItems: "center", marginTop: 60 },
});

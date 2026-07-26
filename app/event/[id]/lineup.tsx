import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import ContentLoader, { Rect } from "react-content-loader/native";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  IconButton,
  Surface,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PageContainer } from "../../../src/components/PageContainer";
import { useEvent } from "../../../src/hooks/useEvent";
import { Act, Stage } from "../../../src/types/event";
import { addAlpha } from "../../../src/utils/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function LineupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();

  const {
    data: event,
    isLoading: loading,
    error: eventError,
  } = useEvent(id as string);
  const error = eventError ? (eventError as any).message : null;

  const [selectedDateIndex, setSelectedDateIndex] = useState<number>(0);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const horizontalListRef = useRef<FlatList>(null);
  const tabListRef = useRef<FlatList>(null);
  const isTappingTab = useRef(false);

  if (error && !event) {
    return (
      <PageContainer style={styles.center}>
        <Text variant="titleMedium" style={{ color: theme.colors.error }}>
          {error || "Event not found"}
        </Text>
        <Button
          mode="contained"
          onPress={() => router.push("/(tabs)")}
          style={{ marginTop: 16 }}
        >
          Go Back
        </Button>
      </PageContainer>
    );
  }

  if (loading || !event) {
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
            {/* Header placeholder */}
            <Rect
              x="0"
              y="0"
              rx="4"
              ry="4"
              width={SCREEN_WIDTH * 0.4}
              height="28"
            />
            <Rect
              x="0"
              y="36"
              rx="4"
              ry="4"
              width={SCREEN_WIDTH * 0.2}
              height="16"
            />

            {/* Tabs placeholder */}
            <Rect x="0" y="80" rx="16" ry="16" width="80" height="32" />
            <Rect x="90" y="80" rx="16" ry="16" width="100" height="32" />
            <Rect x="200" y="80" rx="16" ry="16" width="90" height="32" />

            <Rect x="0" y="130" rx="16" ry="16" width="100" height="40" />
            <Rect x="110" y="130" rx="16" ry="16" width="120" height="40" />

            {/* Acts placeholder */}
            <Rect
              x="0"
              y="190"
              rx="12"
              ry="12"
              width={SCREEN_WIDTH - 32}
              height="65"
            />
            <Rect
              x="0"
              y="263"
              rx="12"
              ry="12"
              width={SCREEN_WIDTH - 32}
              height="65"
            />
            <Rect
              x="0"
              y="336"
              rx="12"
              ry="12"
              width={SCREEN_WIDTH - 32}
              height="65"
            />
            <Rect
              x="0"
              y="409"
              rx="12"
              ry="12"
              width={SCREEN_WIDTH - 32}
              height="65"
            />
            <Rect
              x="0"
              y="482"
              rx="12"
              ry="12"
              width={SCREEN_WIDTH - 32}
              height="65"
            />
          </ContentLoader>
        </View>
      </PageContainer>
    );
  }

  const stages: Stage[] = event.stages || [];
  const acts: Act[] = event.acts || [];

  const uniqueDates = Array.from(
    new Set(acts.map((a) => a.date).filter(Boolean)),
  ) as string[];
  uniqueDates.sort();

  const currentSelectedDate =
    uniqueDates.length > 0 ? uniqueDates[selectedDateIndex] : null;

  const currentDayActs = currentSelectedDate
    ? acts.filter((a) => a.date === currentSelectedDate)
    : acts;

  const groupedActs: { id: string; name: string; acts: Act[] }[] = [];

  if (stages.length > 0) {
    stages.forEach((stage) => {
      const stageActs = currentDayActs.filter((a) => a.stage_id === stage.id);
      if (stageActs.length > 0) {
        groupedActs.push({
          id: stage.id,
          name: stage.name,
          acts: stageActs.sort((a, b) => {
            const nameA =
              a.artists && a.artists.length > 0 ? a.artists[0].name : a.name;
            const nameB =
              b.artists && b.artists.length > 0 ? b.artists[0].name : b.name;
            return nameA.localeCompare(nameB);
          }),
        });
      }
    });
  }

  const unassignedActs = currentDayActs.filter(
    (a) => !stages.find((s) => s.id === a.stage_id),
  );
  if (unassignedActs.length > 0) {
    groupedActs.push({
      id: "all",
      name: stages.length > 0 ? "Other / TBA" : "All Acts",
      acts: unassignedActs.sort((a, b) => {
        const nameA =
          a.artists && a.artists.length > 0 ? a.artists[0].name : a.name;
        const nameB =
          b.artists && b.artists.length > 0 ? b.artists[0].name : b.name;
        return nameA.localeCompare(nameB);
      }),
    });
  }

  const handleDaySelect = (index: number) => {
    setSelectedDateIndex(index);
    setActiveTabIndex(0);
    setTimeout(() => {
      horizontalListRef.current?.scrollToIndex({ index: 0, animated: false });
      tabListRef.current?.scrollToIndex({
        index: 0,
        animated: false,
        viewPosition: 0.5,
      });
    }, 100);
  };

  const handleTabPress = (index: number) => {
    isTappingTab.current = true;
    setActiveTabIndex(index);
    horizontalListRef.current?.scrollToIndex({ index, animated: true });
    tabListRef.current?.scrollToIndex({
      index,
      animated: true,
      viewPosition: 0.5,
    });
    setTimeout(() => {
      isTappingTab.current = false;
    }, 500);
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isTappingTab.current) return;
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / SCREEN_WIDTH);
    if (
      newIndex !== activeTabIndex &&
      newIndex >= 0 &&
      newIndex < groupedActs.length
    ) {
      setActiveTabIndex(newIndex);
      tabListRef.current?.scrollToIndex({
        index: newIndex,
        animated: true,
        viewPosition: 0.5,
      });
    }
  };

  const isActLive = (act: Act) => {
    if (!act.date || !act.start_time || !act.end_time) return false;
    const [year, month, day] = act.date.split("-").map(Number);
    const [startH, startM] = act.start_time.split(":").map(Number);
    const [endH, endM] = act.end_time.split(":").map(Number);
    if (
      isNaN(year) ||
      isNaN(month) ||
      isNaN(day) ||
      isNaN(startH) ||
      isNaN(endH)
    )
      return false;
    const startDate = new Date(year, month - 1, day, startH, startM);
    let endDate = new Date(year, month - 1, day, endH, endM);
    if (endDate < startDate) endDate.setDate(endDate.getDate() + 1);
    return now >= startDate && now < endDate;
  };

  const renderAct = ({ item: act }: { item: Act }) => {
    const actName =
      act.artists && act.artists.length > 0 ? act.artists[0].name : act.name;
    const isLive = isActLive(act);
    return (
      <Surface
        style={[styles.actCard, { backgroundColor: theme.colors.surface }]}
        elevation={1}
      >
        <TouchableRipple
          onPress={() => {}}
          style={styles.actRipple}
          rippleColor="rgba(0,0,0,0.1)"
        >
          <View style={styles.actContent}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text
                variant="bodyLarge"
                style={styles.actName}
                numberOfLines={1}
              >
                {actName}
              </Text>
              {act.start_time && act.end_time && (
                <Text variant="bodySmall" style={styles.actTime}>
                  {act.start_time.substring(0, 5)} -{" "}
                  {act.end_time.substring(0, 5)}
                </Text>
              )}
            </View>
            {isLive && (
              <View style={styles.liveBadge}>
                <View
                  style={[
                    styles.liveDot,
                    { backgroundColor: theme.colors.error },
                  ]}
                />
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.error, fontWeight: "bold" }}
                >
                  LIVE
                </Text>
              </View>
            )}
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
            <Text
              variant="titleLarge"
              style={styles.headerTitle}
              numberOfLines={1}
            >
              Line-up
            </Text>
            <Text
              variant="bodySmall"
              style={styles.headerSubtitle}
              numberOfLines={1}
            >
              {event.name}
            </Text>
          </View>
        </View>

        {uniqueDates.length > 0 && (
          <View style={styles.dayContainer}>
            <FlatList
              data={uniqueDates}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.dayListContent}
              renderItem={({ item, index }) => (
                <TouchableRipple
                  onPress={() => handleDaySelect(index)}
                  style={[
                    styles.dayItem,
                    selectedDateIndex === index && {
                      borderBottomColor: theme.colors.primary,
                      borderBottomWidth: 2,
                    },
                  ]}
                  rippleColor="rgba(0,0,0,0.1)"
                >
                  <Text
                    variant="titleMedium"
                    style={[
                      selectedDateIndex === index
                        ? { color: theme.colors.primary, fontWeight: "bold" }
                        : { color: theme.colors.onSurface, opacity: 0.6 },
                    ]}
                  >
                    {(() => {
                      const d = new Date(item);
                      return isNaN(d.getTime())
                        ? item
                        : d.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "long",
                            day: "numeric",
                          });
                    })()}
                  </Text>
                </TouchableRipple>
              )}
            />
          </View>
        )}

        {groupedActs.length > 0 && (
          <View style={styles.tabContainer}>
            <FlatList
              ref={tabListRef}
              data={groupedActs}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.tabListContent}
              renderItem={({ item, index }) => (
                <TouchableRipple
                  onPress={() => handleTabPress(index)}
                  style={[
                    styles.tabItem,
                    activeTabIndex === index
                      ? { backgroundColor: theme.colors.primary }
                      : {
                          backgroundColor: addAlpha(
                            theme.colors.onSurface,
                            0.05,
                          ),
                        },
                  ]}
                  rippleColor="rgba(255,255,255,0.2)"
                >
                  <Text
                    variant="labelLarge"
                    style={[
                      styles.tabText,
                      activeTabIndex === index
                        ? { color: theme.colors.onPrimary }
                        : { color: theme.colors.onSurface },
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableRipple>
              )}
            />
          </View>
        )}
      </View>

      {groupedActs.length > 0 ? (
        <FlatList
          style={{ flex: 1 }}
          ref={horizontalListRef}
          data={groupedActs}
          horizontal
          pagingEnabled
          snapToInterval={SCREEN_WIDTH}
          snapToAlignment="start"
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyExtractor={(item) => item.id}
          getItemLayout={(data, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          renderItem={({ item }) => (
            <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
              <FlashList
                data={item.acts}
                keyExtractor={(act) => act.id}
                renderItem={renderAct}
                estimatedItemSize={65}
                contentContainerStyle={[
                  styles.actsListContent,
                  { paddingBottom: bottom + 60 },
                ]}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text variant="bodyMedium" style={{ opacity: 0.5 }}>
                      No acts scheduled yet.
                    </Text>
                  </View>
                }
              />
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text variant="titleMedium" style={{ opacity: 0.5 }}>
            Line-up has not been announced.
          </Text>
        </View>
      )}
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  header: {
    backgroundColor: "transparent",
    zIndex: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  headerTitle: { fontWeight: "900" },
  headerSubtitle: { opacity: 0.6 },
  dayContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    marginBottom: 8,
  },
  dayListContent: { paddingHorizontal: 16, gap: 24 },
  dayItem: { paddingVertical: 12, paddingHorizontal: 4 },
  tabContainer: { height: 48 },
  tabListContent: { paddingHorizontal: 16, gap: 8, alignItems: "center" },
  tabItem: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24 },
  tabText: { fontWeight: "bold" },
  actsListContent: { padding: 12, gap: 8 },
  actCard: { borderRadius: 12, overflow: "hidden", marginBottom: 8 },
  actRipple: { padding: 12 },
  actContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actName: { fontWeight: "700", flex: 1 },
  actTime: { opacity: 0.6, fontWeight: "500" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(255,0,0,0.1)",
    borderRadius: 12,
    gap: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
});

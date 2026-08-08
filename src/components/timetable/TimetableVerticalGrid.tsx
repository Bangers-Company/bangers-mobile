import React, { useRef, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "@gluestack-ui/themed";
import { useAppTheme } from "../../context/ThemeProvider";
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSharedScroll } from "../../hooks/useSharedScroll";
import { Timetable, TimetableEntry } from "../../types/timetable";
import { addAlpha } from "../../utils/theme";
import { TimetableActItem } from "./TimetableActItem";

interface VerticalGridProps {
  timetable: Timetable;
  templateTimetable?: Timetable | null;
  onEntryPress: (entry: TimetableEntry) => void;
  onEntryLongPress: (entry: TimetableEntry) => void;
  isPersonal: boolean;
  currentTime?: Date;
}

const HOUR_HEIGHT = 100;
const STAGE_WIDTH = 180;
const TIME_COLUMN_WIDTH = 60;

export const TimetableVerticalGrid: React.FC<VerticalGridProps> = ({
  timetable,
  templateTimetable,
  onEntryPress,
  onEntryLongPress,
  isPersonal,
  currentTime,
}) => {
  const theme = useAppTheme();

  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollOffset = useSharedScroll();
  const horizontalScrollOffset = useSharedValue(0);

  const verticalScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollOffset.value = event.contentOffset.y;
    },
  });

  const horizontalScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      horizontalScrollOffset.value = event.contentOffset.x;
    },
  });

  const timeAxisStyle = useAnimatedStyle(() => {
    const isScrolledHorizontally = horizontalScrollOffset.value > 10;
    return {
      opacity: isScrolledHorizontally ? 0 : 1,
    };
  });

  const timeSidebarScrollStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: -scrollOffset.value }],
    };
  });

  // 1. Group by stage and calculate time range
  const stageMap: Record<
    string,
    { id: string; name: string; entries: TimetableEntry[] }
  > = {};

  if (templateTimetable) {
    (templateTimetable?.entries || []).forEach((entry) => {
      if (!stageMap[entry.stage.id]) {
        stageMap[entry.stage.id] = { ...entry.stage, entries: [] };
      }
    });
  }

  (timetable?.entries || []).forEach((entry) => {
    if (!stageMap[entry.stage.id]) {
      stageMap[entry.stage.id] = { ...entry.stage, entries: [] };
    }
    stageMap[entry.stage.id].entries.push(entry);
  });
  const stages = Object.values(stageMap).filter((s) => s.entries.length > 0);

  // 2. Festival hour calculation (6 AM is the start of a "new day")
  const toFestivalHour = (date: Date) => {
    const h = date.getHours();
    return h < 6 ? h + 24 : h;
  };

  // 3. Dynamic Time Range Calculation
  // DEFAULT: 09:00 to 02:00 (26)
  let min = 48; // Start with max value
  let max = 0;  // Start with min value

  const entries = timetable?.entries || [];
  if (entries.length === 0) {
    min = 9;
    max = 26;
  } else {
    entries.forEach((entry) => {
      const start = toFestivalHour(new Date(entry.start_time));
      const end = toFestivalHour(new Date(entry.end_time));
      if (start < min) min = start;
      if (end > max) max = end;
    });

    // 1 hour before first act, 1 hour after last act
    min = Math.floor(min - 1);
    max = Math.ceil(max + 1);

    // Safety bounds
    if (min < 0) min = 0;
    if (max > 48) max = 48;
    if (max <= min) max = min + 1;
  }

  const timeRange = { start: min, end: max };

  // 4. Auto-scroll to current time
  useEffect(() => {
    if (currentTime && scrollRef.current) {
      const currentPos = getPosition(currentTime.toISOString());
      const isVisible = toFestivalHour(currentTime) >= timeRange.start && 
                        toFestivalHour(currentTime) <= timeRange.end;

      if (isVisible) {
        // Use a small timeout to ensure the layout is ready
        const timer = setTimeout(() => {
          scrollRef.current?.scrollTo({
            y: Math.max(0, currentPos - 100), // Center it a bit better
            animated: true,
          });
        }, 100);
        return () => clearTimeout(timer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timetable?.id, timeRange.start]); // Re-run if timetable changes or range shifts

  const hours = Array.from(
    { length: Math.min(48, Math.max(0, timeRange.end - timeRange.start + 1)) },
    (_, i) => timeRange.start + i,
  );

  const getPosition = (timeStr: string) => {
    const date = new Date(timeStr);
    const hour = toFestivalHour(date) + date.getMinutes() / 60;
    return (hour - timeRange.start) * HOUR_HEIGHT;
  };

  const getDurationHeight = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return diffHours * HOUR_HEIGHT;
  };

  return (
    <View style={[styles.container]}>
      {/* 1. Time Sidebar - Absolute and synced with vertical scroll, fades during movement */}
      <Animated.View
        style={[
          styles.timeSidebarOverlay,
          timeAxisStyle,
        ]}
      >
        <Animated.View style={[timeSidebarScrollStyle, { paddingTop: 40 }]}>
          {hours.map((hour) => {
            const displayHour = hour >= 24 ? hour - 24 : hour;
            const displayString = `${displayHour
              .toString()
              .padStart(2, "0")}:00`;
            return (
              <View key={hour} style={styles.timeLabelContainer}>
                <Text variant="labelSmall" style={styles.timeLabel}>
                  {displayString}
                </Text>
              </View>
            );
          })}
        </Animated.View>
      </Animated.View>

      {/* 2. Main Grid - Uses horizontal and vertical scrolling with sticky headers */}
      <Animated.ScrollView
        horizontal
        style={{ flex: 1 }}
        onScroll={horizontalScrollHandler}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
      >
        <View>
          {/* Sticky Stage Headers - Outside vertical scroll, but inside horizontal scroll */}
          <View
            style={[
              styles.stageHeaders,
              { zIndex: 10 },
            ]}
          >
            <View style={{ width: TIME_COLUMN_WIDTH }} />
            {stages.map((stage) => (
              <View
                key={stage.id}
                style={[styles.stageHeader, { width: STAGE_WIDTH }]}
              >
                <Text
                  variant="labelLarge"
                  style={styles.stageName}
                  numberOfLines={1}
                >
                  {stage.name}
                </Text>
              </View>
            ))}
          </View>

          <Animated.ScrollView
            ref={scrollRef}
            onScroll={verticalScrollHandler}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
          >
            {/* Grid Body */}
            <View style={{ flexDirection: "row" }}>
              <View style={{ width: TIME_COLUMN_WIDTH }} />
              <View
                style={[
                  styles.gridBody,
                  {
                    width: stages.length * STAGE_WIDTH,
                    height: hours.length * HOUR_HEIGHT,
                  },
                ]}
              >
                {hours.map((hour) => (
                  <View
                    key={hour}
                    style={[
                      styles.gridLine,
                      {
                        top: (hour - timeRange.start) * HOUR_HEIGHT,
                        width: stages.length * STAGE_WIDTH,
                        borderTopColor: addAlpha(theme.colors.outline, 0.1),
                      },
                    ]}
                  />
                ))}

                {stages.map((stage, sIdx) => (
                  <View
                    key={stage.id}
                    style={[
                      styles.stageColumn,
                      { width: STAGE_WIDTH, left: sIdx * STAGE_WIDTH },
                    ]}
                  >
                    {stage.entries.map((entry) => {
                      const top = getPosition(entry.start_time);
                      const height = getDurationHeight(
                        entry.start_time,
                        entry.end_time,
                      );

                      return (
                        <TimetableActItem
                          key={entry.id}
                          entry={entry}
                          isPersonal={isPersonal}
                          onPress={onEntryPress}
                          onLongPress={onEntryLongPress}
                          style={{
                            top,
                            height: height - 4,
                            width: STAGE_WIDTH - 8,
                          }}
                          variant="vertical"
                        />
                      );
                    })}
                  </View>
                ))}

                {currentTime &&
                  toFestivalHour(currentTime) >= timeRange.start &&
                  toFestivalHour(currentTime) <= timeRange.end && (
                    <View
                      style={[
                        styles.currentTimeLine,
                        {
                          top: getPosition(currentTime.toISOString()),
                          left: 0,
                          width: stages.length * STAGE_WIDTH,
                          backgroundColor: theme.colors.error,
                        },
                      ]}
                    />
                  )}
              </View>
            </View>
          </Animated.ScrollView>
        </View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    overflow: "hidden",
  },
  timeSidebarOverlay: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: TIME_COLUMN_WIDTH,
    zIndex: 100,
    borderRightWidth: 1,
    borderRightColor: "rgba(0,0,0,0.05)",
    overflow: "hidden",
  },
  timeLabelContainer: {
    height: HOUR_HEIGHT,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: -10,
  },
  timeLabel: {
    opacity: 0.5,
    marginTop: -8,
  },
  stageHeaders: {
    flexDirection: "row",
    height: 40,
    alignItems: "center",
  },
  stageHeader: {
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  stageName: {
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  gridBody: {
    flex: 1,
    position: "relative",
  },
  gridLine: {
    position: "absolute",
    left: 0,
    borderTopWidth: 1,
  },
  stageColumn: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderRightWidth: 1,
    borderRightColor: "rgba(0,0,0,0.02)",
  },
  entryCard: {
    position: "absolute",
    left: 4,
    right: 4,
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    overflow: "hidden",
  },
  entryContent: {
    flex: 1,
  },
  entryTitle: {
    fontWeight: "bold",
    lineHeight: 14,
  },
  entryTime: {
    fontSize: 10,
    marginTop: 2,
  },
  currentTimeLine: {
    position: "absolute",
    height: 2,
    zIndex: 10,
  },
});

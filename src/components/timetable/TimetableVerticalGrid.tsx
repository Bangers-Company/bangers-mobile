import React, { useRef, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "@gluestack-ui/themed";
import { useAppTheme } from "../../context/ThemeProvider";
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { Timetable, TimetableEntry } from "../../types/timetable";
import { sortStages } from "../../utils/stageSort";
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

const HOUR_HEIGHT = 120;
const STAGE_WIDTH = 180;
const TIME_COLUMN_WIDTH = 55;

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
  const verticalScrollOffset = useSharedValue(0);
  const horizontalScrollOffset = useSharedValue(0);

  const verticalScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      verticalScrollOffset.value = event.contentOffset.y;
    },
  });

  const horizontalScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      horizontalScrollOffset.value = event.contentOffset.x;
    },
  });

  // Time sidebar bar stays 100% sticky at left (0 elastic bounce) and slides LEFT off-screen only when scrolling right horizontally (x > 0)
  const timeSidebarStyle = useAnimatedStyle(() => {
    const clampedX = Math.max(0, horizontalScrollOffset.value);
    const translateX = -Math.min(TIME_COLUMN_WIDTH, clampedX);
    const opacity = Math.max(0, 1 - clampedX / TIME_COLUMN_WIDTH);
    return {
      opacity,
      transform: [{ translateX }],
      pointerEvents: opacity === 0 ? "none" : "auto",
    };
  });

  // Sticky stage header bar translates horizontally in 1:1 sync with horizontal scroll while staying floating at top
  const stageHeaderStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: -horizontalScrollOffset.value }],
    };
  });

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

  const stages = sortStages(
    Object.values(stageMap).filter((s) => s.entries.length > 0),
  );

  const toFestivalHour = (date: Date) => {
    const h = date.getHours();
    return h < 6 ? h + 24 : h;
  };

  let min = 48;
  let max = 0;

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

    min = Math.floor(min - 1);
    max = Math.ceil(max + 1);

    if (min < 0) min = 0;
    if (max > 48) max = 48;
    if (max <= min) max = min + 1;
  }

  const timeRange = { start: min, end: max };

  useEffect(() => {
    if (currentTime && scrollRef.current) {
      const currentPos = getPosition(currentTime.toISOString());
      const isVisible =
        toFestivalHour(currentTime) >= timeRange.start &&
        toFestivalHour(currentTime) <= timeRange.end;

      if (isVisible) {
        const timer = setTimeout(() => {
          scrollRef.current?.scrollTo({
            y: Math.max(0, currentPos - 100),
            animated: true,
          });
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [timetable?.id, timeRange.start]);

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
      {/* Main Full-Screen Viewport */}
      <View style={{ flex: 1, position: "relative" }}>
        {/* Floating Stage Header Bar - Dynamic theme surface styling */}
        <View style={styles.floatingStageHeaderContainer} pointerEvents="box-none">
          <Animated.View style={[styles.floatingStageHeaderInner, stageHeaderStyle]} pointerEvents="box-none">
            {stages.map((stage, sIdx) => (
              <View
                key={stage.id}
                style={[
                  styles.stageHeaderContainer,
                  { width: STAGE_WIDTH, left: sIdx * STAGE_WIDTH + TIME_COLUMN_WIDTH },
                ]}
                pointerEvents="box-none"
              >
                <View
                  style={[
                    styles.floatingStageBadge,
                    {
                      backgroundColor: addAlpha(theme.colors.surface, 0.94),
                      borderColor: addAlpha(theme.colors.primary, 0.35),
                    },
                  ]}
                >
                  <View style={[styles.stageDot, { backgroundColor: theme.colors.primary }]} />
                  <Text
                    style={[styles.floatingStageTitle, { color: theme.colors.onSurface }]}
                    numberOfLines={1}
                  >
                    {stage.name}
                  </Text>
                </View>
              </View>
            ))}
          </Animated.View>
        </View>

        {/* Outer Vertical ScrollView */}
        <Animated.ScrollView
          ref={scrollRef}
          onScroll={verticalScrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          <View style={{ flexDirection: "row", position: "relative" }}>
            {/* Native Timestamps Sidebar - Clamped zero-bounce sticky positioning */}
            <Animated.View
              style={[
                styles.nativeTimeSidebar,
                {
                  backgroundColor: addAlpha(theme.colors.surface, 0.92),
                  borderRightColor: addAlpha(theme.colors.outline, 0.15),
                },
                timeSidebarStyle,
              ]}
            >
              <View style={{ height: 36 }} />
              {hours.map((hour) => {
                const displayHour = hour >= 24 ? hour - 24 : hour;
                const displayString = `${displayHour
                  .toString()
                  .padStart(2, "0")}:00`;
                return (
                  <View
                    key={hour}
                    style={[styles.timeSlot, { height: HOUR_HEIGHT }]}
                  >
                    <Text
                      style={[styles.timeText, { color: addAlpha(theme.colors.onSurface, 0.65) }]}
                    >
                      {displayString}
                    </Text>
                  </View>
                );
              })}
            </Animated.View>

            {/* Inner Horizontal Scroll Container for Grid Columns */}
            <Animated.ScrollView
              horizontal
              onScroll={horizontalScrollHandler}
              scrollEventThrottle={16}
              showsHorizontalScrollIndicator={false}
              style={{ flex: 1 }}
            >
              <View style={{ flex: 1 }}>
                {/* Grid Body */}
                <View
                  style={[
                    styles.gridBody,
                    {
                      width: stages.length * STAGE_WIDTH + TIME_COLUMN_WIDTH,
                      height: hours.length * HOUR_HEIGHT,
                      paddingTop: 36,
                      paddingLeft: TIME_COLUMN_WIDTH,
                    },
                  ]}
                >
                  {/* Horizontal Grid Lines */}
                  {hours.map((hour) => (
                    <View
                      key={hour}
                      style={[
                        styles.gridLine,
                        {
                          top: (hour - timeRange.start) * HOUR_HEIGHT + 36,
                          width: stages.length * STAGE_WIDTH + TIME_COLUMN_WIDTH,
                          borderTopColor: addAlpha(theme.colors.outline, 0.1),
                        },
                      ]}
                    />
                  ))}

                  {/* Stage Columns */}
                  {stages.map((stage, sIdx) => (
                    <View
                      key={stage.id}
                      style={[
                        styles.stageColumn,
                        { width: STAGE_WIDTH, left: sIdx * STAGE_WIDTH + TIME_COLUMN_WIDTH },
                      ]}
                    >
                      {/* Act Cards - Full column width */}
                      {stage.entries.map((entry) => {
                        const top = getPosition(entry.start_time) + 36;
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
                              left: 4,
                              position: "absolute",
                            }}
                            variant="vertical"
                          />
                        );
                      })}
                    </View>
                  ))}

                  {/* Current Time Line Indicator */}
                  {currentTime &&
                    toFestivalHour(currentTime) >= timeRange.start &&
                    toFestivalHour(currentTime) <= timeRange.end && (
                      <View
                        style={[
                          styles.currentTimeLine,
                          {
                            top: getPosition(currentTime.toISOString()) + 36,
                            left: 0,
                            width: stages.length * STAGE_WIDTH + TIME_COLUMN_WIDTH,
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  floatingStageHeaderContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 36,
    zIndex: 120,
    overflow: "hidden",
  },
  floatingStageHeaderInner: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
  },
  nativeTimeSidebar: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: TIME_COLUMN_WIDTH,
    borderRightWidth: 1,
    zIndex: 150,
  },
  timeSlot: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 2,
  },
  timeText: {
    fontWeight: "600",
    fontSize: 11,
  },
  stageHeaderContainer: {
    position: "absolute",
    top: 4,
    left: 4,
    height: 28,
    justifyContent: "flex-start",
  },
  floatingStageBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  stageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  floatingStageTitle: {
    fontWeight: "800",
    textTransform: "uppercase",
    fontSize: 9.5,
    letterSpacing: 0.6,
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
    borderRightColor: "rgba(0,0,0,0.04)",
  },
  currentTimeLine: {
    position: "absolute",
    height: 2,
    zIndex: 15,
  },
});

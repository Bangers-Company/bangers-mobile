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

interface HorizontalGridProps {
  timetable: Timetable;
  templateTimetable?: Timetable | null;
  onEntryPress: (entry: TimetableEntry) => void;
  onEntryLongPress: (entry: TimetableEntry) => void;
  isPersonal: boolean;
  currentTime?: Date;
}

const HOUR_WIDTH = 220;
const STAGE_HEIGHT = 120;
const TIME_HEADER_HEIGHT = 32;
const STAGE_LABEL_WIDTH = 175;

export const TimetableHorizontalGrid: React.FC<HorizontalGridProps> = ({
  timetable,
  templateTimetable,
  onEntryPress,
  onEntryLongPress,
  isPersonal,
  currentTime,
}) => {
  const theme = useAppTheme();

  const scrollRef = useRef<Animated.ScrollView>(null);
  const horizontalScrollOffset = useSharedValue(0);
  const verticalScrollOffset = useSharedValue(0);

  const horizontalScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      horizontalScrollOffset.value = event.contentOffset.x;
    },
  });

  const verticalScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      verticalScrollOffset.value = event.contentOffset.y;
    },
  });

  // Time header bar stays 100% sticky at top (0 elastic bounce) and slides UP off-screen only when scrolling down vertically (y > 0)
  const timeHeaderStyle = useAnimatedStyle(() => {
    const clampedY = Math.max(0, verticalScrollOffset.value);
    const translateY = -Math.min(TIME_HEADER_HEIGHT, clampedY);
    const opacity = Math.max(0, 1 - clampedY / TIME_HEADER_HEIGHT);
    return {
      opacity,
      transform: [{ translateY }],
      pointerEvents: opacity === 0 ? "none" : "auto",
    };
  });

  // Group by stage and calculate time range
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
            x: Math.max(0, currentPos - 100),
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
    return (hour - timeRange.start) * HOUR_WIDTH;
  };

  const getDurationWidth = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return diffHours * HOUR_WIDTH;
  };

  return (
    <View style={[styles.container]}>
      {/* Outer Vertical ScrollView */}
      <Animated.ScrollView
        style={{ flex: 1 }}
        onScroll={verticalScrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View>
          {/* Sticky Left Stage Header Sidebar */}
          <View
            style={[
              styles.stickyStageSidebar,
              { height: stages.length * STAGE_HEIGHT, paddingTop: TIME_HEADER_HEIGHT },
            ]}
          >
            {stages.map((stage, sIdx) => (
              <View
                key={stage.id}
                style={[
                  styles.stageHeaderContainer,
                  { height: STAGE_HEIGHT, top: sIdx * STAGE_HEIGHT + TIME_HEADER_HEIGHT },
                ]}
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
          </View>

          {/* Inner Horizontal ScrollView - Timestamps & Grid Content are in the EXACT SAME native ScrollView for 0ms hardware sync */}
          <Animated.ScrollView
            ref={scrollRef}
            horizontal
            onScroll={horizontalScrollHandler}
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
          >
            <View style={{ position: "relative" }}>
              {/* Native Timestamps Header Bar - Clamped zero-bounce sticky positioning */}
              <Animated.View
                style={[
                  styles.nativeTimeHeaderBar,
                  {
                    backgroundColor: addAlpha(theme.colors.surface, 0.92),
                    borderBottomColor: addAlpha(theme.colors.outline, 0.15),
                  },
                  timeHeaderStyle,
                ]}
              >
                {hours.map((hour) => {
                  const displayHour = hour >= 24 ? hour - 24 : hour;
                  const displayString = `${displayHour
                    .toString()
                    .padStart(2, "0")}:00`;
                  return (
                    <View
                      key={hour}
                      style={[styles.timeSlot, { width: HOUR_WIDTH }]}
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

              {/* Grid Body */}
              <View
                style={[
                  styles.gridBody,
                  {
                    width: hours.length * HOUR_WIDTH,
                    height: stages.length * STAGE_HEIGHT + TIME_HEADER_HEIGHT,
                    paddingTop: TIME_HEADER_HEIGHT,
                  },
                ]}
              >
                {/* Vertical Grid Lines */}
                {hours.map((hour) => (
                  <View
                    key={hour}
                    style={[
                      styles.gridLine,
                      {
                        left: (hour - timeRange.start) * HOUR_WIDTH,
                        height: stages.length * STAGE_HEIGHT + TIME_HEADER_HEIGHT,
                        borderLeftColor: addAlpha(theme.colors.outline, 0.1),
                      },
                    ]}
                  />
                ))}

                {/* Stages Rows */}
                {stages.map((stage, sIdx) => (
                  <View
                    key={stage.id}
                    style={[
                      styles.stageRow,
                      { height: STAGE_HEIGHT, top: sIdx * STAGE_HEIGHT + TIME_HEADER_HEIGHT },
                    ]}
                  >
                    {/* Act Cards - Full row height */}
                    {stage.entries.map((entry) => {
                      const left = getPosition(entry.start_time);
                      const width = getDurationWidth(
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
                            left,
                            width: width - 4,
                            top: 4,
                            bottom: 4,
                            position: "absolute",
                          }}
                          variant="horizontal"
                        />
                      );
                    })}
                  </View>
                ))}

                {/* Current Time Indicator */}
                {currentTime &&
                  toFestivalHour(currentTime) >= timeRange.start &&
                  toFestivalHour(currentTime) <= timeRange.end && (
                    <View
                      style={[
                        styles.currentTimeLine,
                        {
                          left: getPosition(currentTime.toISOString()),
                          height: stages.length * STAGE_HEIGHT + TIME_HEADER_HEIGHT,
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
    overflow: "hidden",
  },
  nativeTimeHeaderBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    height: TIME_HEADER_HEIGHT,
    alignItems: "center",
    borderBottomWidth: 1,
    zIndex: 150,
  },
  timeSlot: {
    alignItems: "flex-start",
    paddingLeft: 8,
  },
  timeText: {
    fontWeight: "600",
    fontSize: 11,
  },
  stickyStageSidebar: {
    position: "absolute",
    top: 0,
    left: 0,
    width: STAGE_LABEL_WIDTH,
    zIndex: 100,
  },
  stageHeaderContainer: {
    position: "absolute",
    left: 6,
    top: 4,
    width: STAGE_LABEL_WIDTH - 10,
    justifyContent: "flex-start",
  },
  floatingStageBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: STAGE_LABEL_WIDTH - 10,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
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
    top: 0,
    borderLeftWidth: 1,
  },
  stageRow: {
    position: "absolute",
    left: 0,
    right: 0,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  currentTimeLine: {
    position: "absolute",
    width: 2,
    zIndex: 15,
  },
});

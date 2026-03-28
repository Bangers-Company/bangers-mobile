import React, { useRef, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import Animated, { useAnimatedScrollHandler, useSharedValue, useAnimatedStyle } from "react-native-reanimated";
import { Timetable, TimetableEntry } from "../../types/timetable";
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
const STAGE_LABEL_WIDTH = 100;

export const TimetableHorizontalGrid: React.FC<HorizontalGridProps> = ({
  timetable,
  templateTimetable,
  onEntryPress,
  onEntryLongPress,
  isPersonal,
  currentTime,
}) => {
  const theme = useTheme();
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

  const timeHeaderStyle = useAnimatedStyle(() => {
    return {
      opacity: 1,
    };
  });

  // Group by stage and calculate time range
  const stageMap: Record<
    string,
    { id: string; name: string; entries: TimetableEntry[] }
  > = {};
  
  // If template exists, initialize all stages from it
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
            x: Math.max(0, currentPos - 100), // Center it a bit better
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
      <Animated.ScrollView 
        style={{ flex: 1 }}
        onScroll={verticalScrollHandler}
        scrollEventThrottle={16}
      >
        <View style={{ flexDirection: "row" }}>
          {/* Stage Sidebar */}
          <View style={[styles.stageSidebar]}>
            <View style={styles.sidebarHeader} />
            {stages.map((stage) => (
              <View key={stage.id} style={styles.stageLabelContainer}>
                <Text
                  variant="labelMedium"
                  style={styles.stageLabel}
                  numberOfLines={2}
                >
                  {stage.name}
                </Text>
              </View>
            ))}
          </View>

          <Animated.ScrollView
            ref={scrollRef}
            horizontal
            onScroll={horizontalScrollHandler}
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
          >
            <View>
              {/* Time Header - Fades during movement */}
              <Animated.View style={[styles.timeHeader, timeHeaderStyle]}>
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
                      <Text variant="labelSmall" style={styles.timeText}>
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
                  height: stages.length * STAGE_HEIGHT,
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
                      height: stages.length * STAGE_HEIGHT,
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
                    { height: STAGE_HEIGHT, top: sIdx * STAGE_HEIGHT },
                  ]}
                >
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
                          // height is managed by stageRow container usually, but let's be explicit if needed
                          top: 4,
                          bottom: 4,
                          position: 'absolute',
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
                        height: stages.length * STAGE_HEIGHT,
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
  stageSidebar: {
    width: STAGE_LABEL_WIDTH,
    zIndex: 5,
    borderRightWidth: 1,
    borderRightColor: "rgba(0,0,0,0.05)",
  },
  sidebarHeader: {
    height: 30,
  },
  stageLabelContainer: {
    height: STAGE_HEIGHT,
    paddingHorizontal: 8,
    justifyContent: "center",
  },
  stageLabel: {
    fontWeight: "bold",
    textTransform: "uppercase",
    fontSize: 10,
  },
  timeHeader: {
    flexDirection: "row",
    height: 30,
    alignItems: "center",
  },
  timeSlot: {
    alignItems: "flex-start",
    paddingLeft: 2,
  },
  timeText: {
    opacity: 0.5,
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
    borderBottomColor: "rgba(0,0,0,0.02)",
  },
  entryCard: {
    position: "absolute",
    top: 4,
    bottom: 4,
    borderRadius: 8,
    borderWidth: 1,
    padding: 6,
    overflow: "hidden",
  },
  entryContent: {
    flex: 1,
    justifyContent: "center",
  },
  entryTitle: {
    fontWeight: "bold",
    fontSize: 11,
    lineHeight: 12,
  },
  entryTime: {
    fontSize: 9,
    marginTop: 1,
  },
  currentTimeLine: {
    position: "absolute",
    width: 2,
    zIndex: 10,
  },
});

import React from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { Text, useTheme } from "react-native-paper";
import Animated, { useAnimatedScrollHandler } from "react-native-reanimated";
import { Timetable, TimetableEntry } from "../../types/timetable";
import { addAlpha } from "../../utils/theme";
import { TimetableActItem } from "./TimetableActItem";
import { useSharedScroll } from "../../hooks/useSharedScroll";

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
  const theme = useTheme();
  const scrollOffset = useSharedScroll();

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollOffset.value = event.contentOffset.y;
    },
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
  const stages = Object.values(stageMap);

  const toFestivalHour = (date: Date) => {
    const h = date.getHours();
    return h < 6 ? h + 24 : h;
  };

  let min = 9;
  let max = 26;

  (timetable?.entries || []).forEach((entry) => {
    const start = toFestivalHour(new Date(entry.start_time));
    const end = toFestivalHour(new Date(entry.end_time));
    if (start < min) min = Math.floor(start);
    if (end + 1 > max) max = Math.ceil(end + 1);
  });

  const timeRange = { start: min, end: max };

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
    <View style={styles.container}>
      <Animated.ScrollView 
        style={{ flex: 1 }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <View style={{ flexDirection: "row" }}>
          <View style={[styles.timeSidebar]}>
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
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={styles.stageHeaders}>
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
                          width: stages.length * STAGE_WIDTH,
                          backgroundColor: theme.colors.error,
                        },
                      ]}
                    />
                  )}
              </View>
            </View>
          </ScrollView>
        </View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  timeSidebar: {
    width: TIME_COLUMN_WIDTH,
    zIndex: 5,
    borderRightWidth: 1,
    borderRightColor: "rgba(0,0,0,0.05)",
    paddingTop: 40, 
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

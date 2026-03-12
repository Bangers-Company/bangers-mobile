import { format } from "date-fns";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text, TouchableRipple, useTheme } from "react-native-paper";
import { Timetable, TimetableEntry } from "../../types/timetable";
import { addAlpha } from "../../utils/theme";

interface VerticalGridProps {
  timetable: Timetable;
  onEntryPress: (entry: TimetableEntry) => void;
  isPersonal: boolean;
  currentTime?: Date;
}

const HOUR_HEIGHT = 100;
const STAGE_WIDTH = 180;
const TIME_COLUMN_WIDTH = 60;

export const TimetableVerticalGrid: React.FC<VerticalGridProps> = ({
  timetable,
  onEntryPress,
  isPersonal,
  currentTime,
}) => {
  const theme = useTheme();

  // 1. Group by stage and calculate time range
  const stages = useMemo(() => {
    const stageMap: Record<
      string,
      { id: string; name: string; entries: TimetableEntry[] }
    > = {};
    timetable.entries.forEach((entry) => {
      if (!stageMap[entry.stage.id]) {
        stageMap[entry.stage.id] = { ...entry.stage, entries: [] };
      }
      stageMap[entry.stage.id].entries.push(entry);
    });
    return Object.values(stageMap);
  }, [timetable.entries]);

  const toFestivalHour = (date: Date) => {
    const h = date.getHours();
    return h < 6 ? h + 24 : h;
  };

  const timeRange = useMemo(() => {
    // Default range: 09:00 AM to 02:00 AM (next day = 26)
    let min = 9;
    let max = 26;

    timetable.entries.forEach((entry) => {
      const start = toFestivalHour(new Date(entry.start_time));
      const end = toFestivalHour(new Date(entry.end_time));
      if (start < min) min = Math.floor(start);
      if (end + 1 > max) max = Math.ceil(end + 1);
    });

    return { start: min, end: max };
  }, [timetable.entries]);

  const hours = Array.from(
    { length: timeRange.end - timeRange.start + 1 },
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
      <ScrollView style={{ flex: 1 }}>
        <View style={{ flexDirection: "row" }}>
          {/* Time Sidebar */}
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
              {/* Stage Headers */}
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

              {/* Grid Body */}
              <View
                style={[
                  styles.gridBody,
                  {
                    width: stages.length * STAGE_WIDTH,
                    height: hours.length * HOUR_HEIGHT,
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
                        top: (hour - timeRange.start) * HOUR_HEIGHT,
                        width: stages.length * STAGE_WIDTH,
                        borderTopColor: addAlpha(theme.colors.outline, 0.1),
                      },
                    ]}
                  />
                ))}

                {/* Stages Columns */}
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
                      const isFavorited = isPersonal; // In this view context for now

                      return (
                        <TouchableRipple
                          key={entry.id}
                          style={[
                            styles.entryCard,
                            {
                              top,
                              height: height - 4,
                              backgroundColor: isFavorited
                                ? theme.colors.primary
                                : addAlpha(theme.colors.surfaceVariant, 0.8),
                              borderColor: isFavorited
                                ? theme.colors.primaryContainer
                                : theme.colors.outlineVariant,
                            },
                          ]}
                          onPress={() => onEntryPress(entry)}
                        >
                          <View style={styles.entryContent}>
                            <Text
                              variant="labelSmall"
                              style={[
                                styles.entryTitle,
                                {
                                  color: isFavorited
                                    ? "white"
                                    : theme.colors.onSurface,
                                },
                              ]}
                              numberOfLines={2}
                            >
                              {entry.act.name}
                            </Text>
                            <Text
                              variant="labelSmall"
                              style={[
                                styles.entryTime,
                                {
                                  color: isFavorited
                                    ? "rgba(255,255,255,0.8)"
                                    : theme.colors.outline,
                                },
                              ]}
                            >
                              {format(new Date(entry.start_time), "HH:mm")} -{" "}
                              {format(new Date(entry.end_time), "HH:mm")}
                            </Text>
                          </View>
                        </TouchableRipple>
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
      </ScrollView>
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
    paddingTop: 40, // Match header height
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

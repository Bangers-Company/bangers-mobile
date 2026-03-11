import React, { useState, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme, Text, TouchableRipple } from "react-native-paper";
import { Timetable, TimetableEntry } from "../../types/timetable";
import { TimetableVerticalGrid } from "./TimetableVerticalGrid";
import { TimetableHorizontalGrid } from "./TimetableHorizontalGrid";
import { useTimetableStore } from "../../store/useTimetableStore";
import { addAlpha } from "../../utils/theme";

interface TimetableGridProps {
  timetable: Timetable;
  isPersonal: boolean;
  onEntryPress: (entry: TimetableEntry) => void;
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  timetable,
  isPersonal,
  onEntryPress,
}) => {
  const theme = useTheme();
  const viewMode = useTimetableStore((state) => state.viewMode);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Day Logic
  const days = useMemo(() => {
    const dayMap = new Set<string>();
    timetable.entries.forEach(e => {
      dayMap.add(e.start_time.split("T")[0]);
    });
    return Array.from(dayMap).sort();
  }, [timetable.entries]);

  const [selectedDay, setSelectedDay] = useState(days[0] || "");

  const filteredEntries = useMemo(() => {
    if (!selectedDay) return timetable.entries;
    return timetable.entries.filter(e => e.start_time.startsWith(selectedDay));
  }, [timetable.entries, selectedDay]);

  const currentTimetable = { ...timetable, entries: filteredEntries };

  return (
    <View style={styles.container}>
      {/* Grid Content */}
      <View style={{ flex: 1 }}>
        {viewMode === "vertical" ? (
          <TimetableVerticalGrid 
            timetable={currentTimetable}
            onEntryPress={onEntryPress}
            isPersonal={isPersonal}
            currentTime={currentTime}
          />
        ) : (
          <TimetableHorizontalGrid 
            timetable={currentTimetable}
            onEntryPress={onEntryPress}
            isPersonal={isPersonal}
            currentTime={currentTime}
          />
        )}
      </View>

      {/* Day Selector (Tabs in bottom area context) */}
      {days.length > 1 && (
        <View style={[styles.dayContainer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant }]}>
          <View style={styles.dayInner}>
            {days.map((day, idx) => {
              const isActive = selectedDay === day;
              return (
                <TouchableRipple
                  key={day}
                  onPress={() => setSelectedDay(day)}
                  style={[
                    styles.dayTab,
                    isActive && { backgroundColor: addAlpha(theme.colors.primary, 0.1) }
                  ]}
                >
                  <Text 
                    variant="labelLarge" 
                    style={[styles.dayTabText, { color: isActive ? theme.colors.primary : theme.colors.outline }]}
                  >
                    Day {idx + 1}
                  </Text>
                </TouchableRipple>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

import { useMemo } from "react";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dayContainer: {
    paddingBottom: 20,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  dayInner: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 16,
  },
  dayTab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 100,
  },
  dayTabText: {
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});

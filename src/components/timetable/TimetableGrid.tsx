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
    // 1. Find the earliest calendar date in the timetable
    const calendarDates = timetable.entries.map(e => e.start_time.split("T")[0]).sort();
    const firstCalendarDate = calendarDates[0] || "";

    const getFestivalDate = (dateStr: string) => {
      const date = new Date(dateStr);
      const calendarDate = dateStr.split("T")[0];
      const hour = date.getHours();
      
      // Only shift back if it's NOT the first calendar day of the event
      // This prevents "Friday 02:00 AM" from becoming "Thursday" if the festival starts Friday
      if (hour < 6 && calendarDate !== firstCalendarDate) {
        const festivalDate = new Date(date);
        festivalDate.setDate(festivalDate.getDate() - 1);
        
        const year = festivalDate.getFullYear();
        const month = (festivalDate.getMonth() + 1).toString().padStart(2, "0");
        const day = festivalDate.getDate().toString().padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
      
      return calendarDate;
    };

    const dayMap = new Set<string>();
    timetable.entries.forEach(e => {
      dayMap.add(getFestivalDate(e.start_time));
    });
    return {
      days: Array.from(dayMap).sort(),
      getFestivalDate // Export it for use in filtering
    };
  }, [timetable.entries]);

  const { days: availableDays, getFestivalDate } = days;
  const [selectedDay, setSelectedDay] = useState("");

  useEffect(() => {
    if (availableDays.length > 0 && !selectedDay) {
      setSelectedDay(availableDays[0]);
    }
  }, [availableDays]);

  const filteredEntries = useMemo(() => {
    if (!selectedDay) return [];
    return timetable.entries.filter(e => getFestivalDate(e.start_time) === selectedDay);
  }, [timetable.entries, selectedDay, getFestivalDate]);

  const insets = useSafeAreaInsets();
  const currentTimetable = { ...timetable, entries: filteredEntries };

  return (
    <View style={styles.container}>
      {/* Grid Content */}
      <View style={{ flex: 1, marginBottom: availableDays.length > 1 ? 60 + insets.bottom : 0 }}>
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

      {/* Day Selector (Custom Bottom Nav) */}
      {availableDays.length > 1 && (
        <View style={[
          styles.dayContainer, 
          { 
            backgroundColor: theme.colors.surface, 
            borderTopColor: theme.colors.outlineVariant,
            paddingBottom: insets.bottom,
            shadowColor: theme.colors.shadow,
          }
        ]}>
          <View style={styles.dayInner}>
            {availableDays.map((day: string, idx: number) => {
              const isActive = selectedDay === day;
              return (
                <TouchableRipple
                  key={day}
                  onPress={() => setSelectedDay(day)}
                  style={[
                    styles.dayTab,
                    isActive && { backgroundColor: addAlpha(theme.colors.primary, 0.1) }
                  ]}
                  rippleColor={addAlpha(theme.colors.primary, 0.2)}
                >
                  <Text 
                    variant="labelLarge" 
                    style={[styles.dayTabText, { color: isActive ? theme.colors.primary : theme.colors.outline }]}
                    numberOfLines={1}
                  >
                    {format(parseISO(day), "EEEE")}
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
import { format, parseISO } from "date-fns";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dayContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    elevation: 8,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dayInner: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 12,
  },
  dayTab: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: "center",
  },
  dayTabText: {
    fontWeight: "800",
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: 1,
  },
});

import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text, TouchableRipple, useTheme } from "react-native-paper";
import { useTimetableStore } from "../../store/useTimetableStore";
import { Timetable, TimetableEntry } from "../../types/timetable";
import { addAlpha } from "../../utils/theme";
import { TimetableHorizontalGrid } from "./TimetableHorizontalGrid";
import { TimetableVerticalGrid } from "./TimetableVerticalGrid";
import { ActInfoBottomSheet } from "./ActInfoBottomSheet";

import { format, parseISO } from "date-fns";
import { Calendar } from "lucide-react-native";
import {
  useSafeAreaInsets,
} from "react-native-safe-area-context";

interface TimetableGridProps {
  timetable: Timetable;
  templateTimetable?: Timetable | null;
  isPersonal: boolean;
  onEntryPress: (entry: TimetableEntry) => void;
  toggleMutation?: any;
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  timetable,
  templateTimetable,
  isPersonal,
  onEntryPress,
  toggleMutation,
}) => {
  const theme = useTheme();
  const viewMode = useTimetableStore((state) => state.viewMode);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(
    null,
  );
  const [infoVisible, setInfoVisible] = useState(false);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Merge attendance from personal/group timetable into template (official) timetable
  // This ensures the personal/group view is a 1-to-1 copy of the official schedule
  const mergedTimetable = useMemo(() => {
    if (!templateTimetable) return timetable;

    const attendanceMap = new Map();
    (timetable?.entries || []).forEach(e => {
      // Use act_id or entry ID to match? 
      // If personal timetable has entries, we want to match by the common entry/act
      attendanceMap.set(e.id, e.pivot);
    });

    return {
      ...templateTimetable,
      id: timetable.id, // Keep the personal/group timetable ID for actions
      name: timetable.name,
      entries: templateTimetable.entries.map(e => ({
        ...e,
        pivot: attendanceMap.get(e.id) || { is_attending: false, attending_count: 0 }
      }))
    };
  }, [timetable, templateTimetable]);

  // Day Logic
  const days = useMemo(() => {
    const sourceEntries = mergedTimetable?.entries || [];
    
    // 1. Find the earliest calendar date
    const calendarDates = sourceEntries
      .map((e) => e.start_time.split("T")[0])
      .sort();
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
    sourceEntries.forEach((e) => {
      dayMap.add(getFestivalDate(e.start_time));
    });
    return {
      days: Array.from(dayMap).sort(),
      getFestivalDate, // Export it for use in filtering
    };
  }, [mergedTimetable?.entries]);

  const { days: availableDays, getFestivalDate } = days;
  const [selectedDay, setSelectedDay] = useState("");

  useEffect(() => {
    if (availableDays.length > 0) {
      if (!selectedDay || !availableDays.includes(selectedDay)) {
        setSelectedDay(availableDays[0]);
      }
    }
  }, [availableDays, selectedDay]);

  // Optimistic timetable that only contains entries for the selected day
  const dailyTimetable = useMemo(() => {
    if (!selectedDay || !mergedTimetable?.entries) return mergedTimetable;
    return {
      ...mergedTimetable,
      entries: (mergedTimetable.entries as TimetableEntry[]).filter(
        (e) => getFestivalDate(e.start_time) === selectedDay
      )
    };
  }, [selectedDay, mergedTimetable, getFestivalDate]);

  const insets = useSafeAreaInsets();

  if (availableDays.length === 0) {
    return (
      <View style={styles.emptyGrid}>
        <Calendar size={48} color={theme.colors.outline} style={{ opacity: 0.3 }} />
        <Text variant="titleMedium" style={{ marginTop: 16, opacity: 0.5 }}>
          No timetable available yet
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={{
          flex: 1,
          marginBottom: availableDays.length > 1 ? 70 + insets.bottom : 0,
        }}
      >
        {viewMode === "vertical" ? (
          <TimetableVerticalGrid
            timetable={dailyTimetable}
            templateTimetable={templateTimetable}
            onEntryPress={onEntryPress}
            onEntryLongPress={(entry) => {
              setSelectedEntry(entry);
              setInfoVisible(true);
            }}
            isPersonal={isPersonal}
            currentTime={currentTime}
          />
        ) : (
          <TimetableHorizontalGrid
            timetable={dailyTimetable}
            templateTimetable={templateTimetable}
            onEntryPress={onEntryPress}
            onEntryLongPress={(entry: TimetableEntry) => {
              setSelectedEntry(entry);
              setInfoVisible(true);
            }}
            isPersonal={isPersonal}
            currentTime={currentTime}
          />
        )}
      </View>

      {/* Day Selector (Custom Bottom Nav) */}
      {availableDays.length > 1 && (
        <View
          style={[
            styles.dayContainer,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.outlineVariant,
              shadowColor: theme.colors.shadow,
            },
          ]}
        >
          <View style={[styles.dayInner, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            {availableDays.map((day: string, idx: number) => {
              const isActive = selectedDay === day;
              return (
                <TouchableRipple
                  key={day}
                  onPress={() => setSelectedDay(day)}
                  style={[
                    styles.dayTab,
                    isActive && {
                      backgroundColor: addAlpha(theme.colors.primary, 0.1),
                    },
                  ]}
                  rippleColor={addAlpha(theme.colors.primary, 0.2)}
                >
                  <Text
                    variant="labelLarge"
                    style={[
                      styles.dayTabText,
                      {
                        color: isActive
                          ? theme.colors.primary
                          : theme.colors.outline,
                      },
                    ]}
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

      <ActInfoBottomSheet
        visible={infoVisible}
        onDismiss={() => setInfoVisible(false)}
        entry={selectedEntry}
      />
    </View>
  );
};

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
  emptyGrid: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
});

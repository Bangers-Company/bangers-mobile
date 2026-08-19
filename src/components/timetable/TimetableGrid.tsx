import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "@gluestack-ui/themed";
import { useAppTheme } from "../../context/ThemeProvider";
import { useTimetableStore } from "../../store/useTimetableStore";
import { Timetable, TimetableEntry } from "../../types/timetable";
import { addAlpha } from "../../utils/theme";
import { TimetableHorizontalGrid } from "./TimetableHorizontalGrid";
import { TimetableVerticalGrid } from "./TimetableVerticalGrid";
import { ActInfoBottomSheet } from "./ActInfoBottomSheet";
import { Calendar, Clock } from "lucide-react-native";
import { useTranslation } from "react-i18next";

interface TimetableGridProps {
  timetable: Timetable;
  templateTimetable?: Timetable | null;
  isPersonal: boolean;
  onEntryPress: (entry: TimetableEntry) => void;
  toggleMutation?: import("@tanstack/react-query").UseMutationResult<any, any, any, any>;
  groupId?: string | null;
  timetableId?: string | null;
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  timetable,
  templateTimetable,
  isPersonal,
  onEntryPress,
  toggleMutation,
  groupId,
  timetableId,
}) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const viewMode = useTimetableStore((state) => state.viewMode);
  const storeSelectedDay = useTimetableStore((state) => state.selectedDay);
  const setSelectedDayInStore = useTimetableStore((state) => state.setSelectedDay);
  const setAvailableDaysInStore = useTimetableStore((state) => state.setAvailableDays);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(null);
  const [infoVisible, setInfoVisible] = useState(false);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Day Logic
  const firstCalendarDate = useMemo(() => {
    const sourceEntries = (templateTimetable?.entries && templateTimetable.entries.length > 0) 
      ? templateTimetable.entries 
      : (timetable?.entries || []);
    const calendarDates = sourceEntries
      .map((e: TimetableEntry) => e.start_time.split("T")[0])
      .sort();
    return calendarDates[0] || "";
  }, [timetable.entries, templateTimetable?.entries]);

  const getFestivalDate = React.useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    const calendarDate = dateStr.split("T")[0];
    const hour = date.getHours();

    if (hour < 6 && calendarDate !== firstCalendarDate) {
      const festivalDate = new Date(date);
      festivalDate.setDate(festivalDate.getDate() - 1);

      const year = festivalDate.getFullYear();
      const month = (festivalDate.getMonth() + 1).toString().padStart(2, "0");
      const day = festivalDate.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    return calendarDate;
  }, [firstCalendarDate]);

  const availableDays = useMemo(() => {
    const sourceEntries = (templateTimetable?.entries && templateTimetable.entries.length > 0) 
      ? templateTimetable.entries 
      : (timetable?.entries || []);
    const dayMap = new Set<string>();
    sourceEntries.forEach((e: TimetableEntry) => {
      dayMap.add(getFestivalDate(e.start_time));
    });
    return Array.from(dayMap).sort();
  }, [timetable.entries, templateTimetable?.entries, getFestivalDate]);

  const [localSelectedDay, setLocalSelectedDay] = useState("");

  // Sync available days to store for smooth BottomNav morphing
  useEffect(() => {
    if (availableDays.length > 0) {
      setAvailableDaysInStore(availableDays);
    }
  }, [availableDays, setAvailableDaysInStore]);

  useEffect(() => {
    if (availableDays.length > 0) {
      if (!localSelectedDay || !availableDays.includes(localSelectedDay)) {
        const initial = availableDays[0];
        setLocalSelectedDay(initial);
        if (!storeSelectedDay || !availableDays.includes(storeSelectedDay)) {
          setSelectedDayInStore(initial);
        }
      }
    }
  }, [availableDays, localSelectedDay, storeSelectedDay, setSelectedDayInStore]);

  const activeDay = (storeSelectedDay && availableDays.includes(storeSelectedDay))
    ? storeSelectedDay 
    : (localSelectedDay || availableDays[0] || "");

  // Optimistic timetable that only contains entries for the selected day
  const dailyTimetable = useMemo(() => {
    if (!activeDay || !timetable?.entries) return timetable;
    return {
      ...timetable,
      entries: (timetable.entries as TimetableEntry[]).filter(
        (e) => getFestivalDate(e.start_time) === activeDay
      )
    };
  }, [activeDay, timetable, getFestivalDate]);

  if (availableDays.length === 0) {
    return (
      <View style={styles.emptyGrid}>
        <View style={[styles.emptyIconWrapper, { backgroundColor: addAlpha(theme.colors.primary, 0.12), borderColor: addAlpha(theme.colors.primary, 0.3) }]}>
          <Clock size={36} color={theme.colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
          {t("timetable.notYetAvailable") || "Not yet available"}
        </Text>
        <Text style={[styles.emptySub, { color: addAlpha(theme.colors.onSurface, 0.65) }]}>
          {t("timetable.notYetAvailableSub") || "The official timetable for this festival has not been published yet. Check back soon!"}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Full-Screen Timetable Grid Viewport */}
      <View style={{ flex: 1 }}>
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

      <ActInfoBottomSheet
        visible={infoVisible}
        onDismiss={() => setInfoVisible(false)}
        entry={selectedEntry}
        isGroup={!!groupId}
        groupId={groupId}
        timetableId={timetableId}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  emptyGrid: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingBottom: 40,
    gap: 12,
    width: "100%",
  },
  emptyIconWrapper: {
    width: 68,
    height: 68,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.4,
    textAlign: "center",
    alignSelf: "center",
    width: "100%",
  },
  emptySub: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    alignSelf: "center",
    maxWidth: 290,
    lineHeight: 20,
    width: "100%",
  },
});

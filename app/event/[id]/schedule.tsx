import { useLocalSearchParams, useRouter } from "expo-router";
import { Plus, LayoutGrid, Share2 } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { IconButton, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PageContainer } from "../../../src/components/PageContainer";
import { useUIStore } from "../../../src/store/useUIStore";
import { useEventStore } from "../../../src/store/useEventStore";
import { useAuthStore } from "../../../src/store/useAuthStore";
import { useTimetableStore } from "../../../src/store/useTimetableStore";
import { TimetableOverview } from "../../../src/components/timetable/TimetableOverview";
import { TimetableGrid } from "../../../src/components/timetable/TimetableGrid";
import { CreateTimetableModal } from "../../../src/components/timetable/CreateTimetableModal";
import { Timetable, TimetableEntry } from "../../../src/types/timetable";

export default function ScheduleScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);

  const { 
    officialTimetable, 
    personalTimetable, 
    loading, 
    fetchOfficial, 
    fetchPersonal,
    createPersonal,
    toggleEntry,
    viewMode,
    setViewMode
  } = useTimetableStore();

  const [selectedTimetable, setSelectedTimetable] = useState<Timetable | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);

  const cachedEvent = useEventStore((state) => state.events[eventId])?.event;
  const official = officialTimetable[eventId] || (cachedEvent?.official_timetable ? { ...cachedEvent.official_timetable, event_id: eventId, entries: [] } as Timetable : null);
  const personal = personalTimetable[eventId] || (cachedEvent?.personal_timetable ? { ...cachedEvent.personal_timetable, event_id: eventId, entries: [] } as Timetable : null);
  const isLoading = loading[eventId];

  const setIsBottomNavVisible = useUIStore((state) => state.setIsBottomNavVisible);

  useEffect(() => {
    if (selectedTimetable) {
      setIsBottomNavVisible(false);
    } else {
      setIsBottomNavVisible(true);
    }
    return () => setIsBottomNavVisible(true);
  }, [selectedTimetable]);

  useEffect(() => {
    if (eventId) {
      if (!officialTimetable[eventId]) fetchOfficial(eventId);
      if (!personalTimetable[eventId] && cachedEvent?.personal_timetable) {
        fetchPersonal(eventId);
      }
    }
  }, [eventId, cachedEvent?.personal_timetable]);

  const handleCreate = async (name: string) => {
    setCreating(true);
    try {
      // Duplicate official entries as baseline
      const entries = official?.entries || [];
      await createPersonal(eventId, name, entries);
      setCreateModalVisible(false);
    } finally {
      setCreating(false);
    }
  };

  const handleEntryPress = (entry: TimetableEntry) => {
    if (personal && selectedTimetable?.id === personal.id) {
       toggleEntry(personal.id, entry.id, true, eventId);
    } else {
       // On official, maybe show act details? For now, do nothing or show toast
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "vertical" ? "horizontal" : "vertical");
  };

  return (
    <PageContainer withPadding={false} withSafeArea={false}>
      <View style={[styles.header, { paddingTop: top + 10 }]}>
        <View style={styles.headerRow}>
          {selectedTimetable ? (
             <IconButton icon="arrow-left" onPress={() => setSelectedTimetable(null)} />
          ) : (
             <IconButton icon="chevron-left" onPress={() => router.push("/(tabs)")} />
          )}
          
          <View style={{ flex: 1 }}>
            <Text variant="titleLarge" style={styles.headerTitle} numberOfLines={1}>
              {selectedTimetable ? selectedTimetable.name : "Timetables"}
            </Text>
            <Text variant="bodySmall" style={styles.headerSubtitle} numberOfLines={1}>
              {selectedTimetable ? (selectedTimetable.is_official ? "Official Schedule" : "My Plan") : "Schedules"}
            </Text>
          </View>

          <View style={styles.headerActions}>
            {selectedTimetable ? (
              <>
                <IconButton 
                  icon={() => <LayoutGrid size={20} color={theme.colors.primary} />} 
                  onPress={toggleViewMode} 
                />
                <IconButton 
                  icon={() => <Share2 size={20} color={theme.colors.outline} />} 
                  disabled 
                  onPress={() => {}} 
                />
              </>
            ) : (
              official && !personal && (
                <IconButton 
                  icon={() => <Plus size={24} color={theme.colors.primary} />} 
                  onPress={() => setCreateModalVisible(true)} 
                />
              )
            )}
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {selectedTimetable ? (
          <TimetableGrid 
            timetable={selectedTimetable}
            isPersonal={selectedTimetable.id === personal?.id}
            onEntryPress={handleEntryPress}
          />
        ) : (
          <TimetableOverview 
            official={official}
            personal={personal}
            loading={isLoading}
            onSelect={setSelectedTimetable}
            onCreatePersonal={() => setCreateModalVisible(true)}
          />
        )}
      </View>

      <CreateTimetableModal 
        visible={createModalVisible}
        onDismiss={() => setCreateModalVisible(false)}
        onConfirm={handleCreate}
        loading={creating}
      />
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    backgroundColor: "transparent",
    zIndex: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontWeight: "900",
  },
  headerSubtitle: {
    opacity: 0.6,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
});


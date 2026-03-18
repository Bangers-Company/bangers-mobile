import { useLocalSearchParams, useRouter } from "expo-router";
import { LayoutGrid, Plus, Share2 } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { IconButton, Text, useTheme, ActivityIndicator } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PageContainer } from "../../../src/components/PageContainer";
import { CreateGroupModal } from "../../../src/components/timetable/CreateGroupModal";
import { CreateTimetableModal } from "../../../src/components/timetable/CreateTimetableModal";
import { TimetableGrid } from "../../../src/components/timetable/TimetableGrid";
import { TimetableOverview } from "../../../src/components/timetable/TimetableOverview";
import { useAuthStore } from "../../../src/store/useAuthStore";
import { useTimetableStore } from "../../../src/store/useTimetableStore";
import { Timetable, TimetableEntry } from "../../../src/types/timetable";
import { 
  useOfficialTimetable, 
  usePersonalTimetable, 
  useGroups, 
  useToggleAttendance 
} from "../../../src/hooks/useTimetables";
import { useUIStore } from "../../../src/store/useUIStore";
import { useEvent } from "../../../src/hooks/useEvent";

const EMPTY_ARRAY: any[] = [];

export default function ScheduleScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const { top } = useSafeAreaInsets();

  const [selectedTimetableId, setSelectedTimetableId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false);
  const [loadingPersonalOp, setLoadingPersonalOp] = useState(false);
  const [loadingGroupsOp, setLoadingGroupsOp] = useState(false);

  // TanStack Query Hooks
  const { data: event } = useEvent(eventId as string);
  const { data: officialQuery, isLoading: isLoadingOfficial } = useOfficialTimetable(eventId);
  const { data: personalQuery, isLoading: isLoadingPersonal } = usePersonalTimetable(eventId);
  const { data: groupsQuery, isLoading: isLoadingGroups } = useGroups();
  const toggleMutation = useToggleAttendance();

  // Zustand Store
  const {
    createPersonal,
    deletePersonal,
    acceptInvitation,
    rejectInvitation,
    createGroup,
    deleteGroup,
    createGroupTimetable,
    viewMode,
    setViewMode,
  } = useTimetableStore();

  const setIsBottomNavVisible = useUIStore((state) => state.setIsBottomNavVisible);

  // Derive timetables from queries
  const official = React.useMemo(() => {
    return officialQuery || (event?.official_timetable ? {
      ...event.official_timetable,
      event_id: eventId,
      entries: (event.official_timetable as any).entries || [],
    } as Timetable : null);
  }, [officialQuery, event, eventId]);
  
  const personal = React.useMemo(() => personalQuery || (event as any)?.personal_timetable || null, [personalQuery, event]);
  const groups = React.useMemo(() => groupsQuery || EMPTY_ARRAY, [groupsQuery]);

  const selectedTimetable = React.useMemo(() => {
    if (selectedTimetableId) {
      if (selectedTimetableId === official?.id) return official;
      if (selectedTimetableId === personal?.id) return personal;
      const g = groups.find((g: any) => g.id === selectedGroupId);
      const t = g?.timetables?.find((t: any) => t.id === selectedTimetableId);
      if (t) return t;
    }
    return null;
  }, [selectedTimetableId, official, personal, groups, selectedGroupId]);

  const isPersonal = !!selectedTimetable && 
    (selectedTimetable.id === personal?.id || !!selectedGroupId);

  // Handle BottomNav visibility
  useEffect(() => {
    setIsBottomNavVisible(!selectedTimetable);
    return () => setIsBottomNavVisible(true);
  }, [selectedTimetable, setIsBottomNavVisible]);

  const handleDeletePersonal = async (id: string) => {
    Alert.alert("Delete Timetable", "Are you sure you want to delete your personal timetable?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          setLoadingPersonalOp(true);
          try {
            await deletePersonal(eventId, id);
            if (selectedTimetableId === id) setSelectedTimetableId(null);
          } finally { setLoadingPersonalOp(false); }
        }
      }
    ]);
  };

  const handleDeleteGroup = async (group: any) => {
    const isOwner = group.owner_id === (useAuthStore.getState().user?.id);
    const title = isOwner ? "Delete Group" : "Leave Group";
    const message = isOwner 
      ? "Are you sure you want to delete this group? This will remove all members and schedules for everyone."
      : "Are you sure you want to leave this group? You will lose access to its schedules.";

    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      { text: isOwner ? "Delete" : "Leave", style: "destructive", onPress: async () => {
          setLoadingGroupsOp(true);
          try {
            await deleteGroup(group.id);
            if (selectedGroupId === group.id) {
               setSelectedTimetableId(null);
               setSelectedGroupId(null);
            }
          } finally { setLoadingGroupsOp(false); }
        }
      }
    ]);
  };

  const handleCreate = async (name: string) => {
    setLoadingPersonalOp(true);
    try {
      await createPersonal(eventId, name);
      setCreateModalVisible(false);
      if (personalQuery) setSelectedTimetableId(personalQuery.id);
    } catch (e) { console.error(e); } finally { setLoadingPersonalOp(false); }
  };

  const handleCreateGroup = async (name: string, members: string[]) => {
    setLoadingGroupsOp(true);
    try {
      await createGroup(name, members);
      setCreateGroupModalVisible(false);
    } catch (e) { console.error(e); } finally { setLoadingGroupsOp(false); }
  };

  const handleEntryPress = React.useCallback((entry: TimetableEntry) => {
    if (!selectedTimetable || selectedTimetable.is_official) return;
    toggleMutation.mutate({
      id: selectedTimetable.id,
      entryId: entry.id,
      isGroup: !!selectedGroupId,
      type: selectedGroupId ? 'group' : 'personal',
      targetId: selectedGroupId || eventId
    });
  }, [selectedTimetable, selectedGroupId, eventId, toggleMutation]);

  const toggleViewMode = () => {
    setViewMode(viewMode === "vertical" ? "horizontal" : "vertical");
  };

  return (
    <PageContainer withPadding={false} withSafeArea={false}>
      <View style={[styles.header, { paddingTop: top / 4 }]}>
        <View style={styles.headerRow}>
          {selectedTimetable ? (
            <IconButton icon="arrow-left" onPress={() => { setSelectedTimetableId(null); setSelectedGroupId(null); }} />
          ) : (
            <IconButton icon="chevron-left" onPress={() => router.back()} />
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
                <IconButton icon={() => <LayoutGrid size={20} color={theme.colors.primary} />} onPress={toggleViewMode} />
                <IconButton icon={() => <Share2 size={20} color={theme.colors.outline} />} disabled onPress={() => {}} />
              </>
            ) : (
              official && !personal && (
                <IconButton icon={() => <Plus size={24} color={theme.colors.primary} />} onPress={() => setCreateModalVisible(true)} />
              )
            )}
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {selectedTimetable ? (
          ((isLoadingOfficial && selectedTimetable.id === official?.id) || 
           (isLoadingPersonal && selectedTimetable.id === personal?.id)) && 
          (!selectedTimetable.entries || selectedTimetable.entries.length === 0) ? (
            <View style={styles.center}><ActivityIndicator color={theme.colors.primary} /></View>
          ) : (
            <TimetableGrid
              timetable={selectedTimetable}
              templateTimetable={official}
              isPersonal={isPersonal}
              onEntryPress={handleEntryPress}
              toggleMutation={toggleMutation}
            />
          )
        ) : (
          <TimetableOverview
            official={official}
            personal={personal}
            groups={groups}
            loadingOfficial={isLoadingOfficial}
            loadingPersonal={loadingPersonalOp || isLoadingPersonal}
            loadingGroups={loadingGroupsOp || isLoadingGroups}
            onSelect={(t: Timetable) => setSelectedTimetableId(t.id)}
            onCreatePersonal={() => setCreateModalVisible(true)}
            onDeletePersonal={handleDeletePersonal}
            onAcceptInvitation={async (gid: string) => {
               setLoadingGroupsOp(true);
               try { await acceptInvitation(gid); } finally { setLoadingGroupsOp(false); }
            }}
            onRejectInvitation={async (gid) => {
              setLoadingGroupsOp(true);
              try { await rejectInvitation(gid); } finally { setLoadingGroupsOp(false); }
            }}
            onCreateGroup={() => setCreateGroupModalVisible(true)}
            onDeleteGroup={(group: any) => handleDeleteGroup(group)}
            onSelectGroup={async (group: any) => {
              setLoadingGroupsOp(true);
              try {
                const updatedGroup = groups.find((g: any) => g.id === group.id) || group;
                const groupSchedule = (updatedGroup.timetables || []).find((t: any) => 
                  String(t.event_id).toLowerCase() === String(eventId).toLowerCase()
                );
                
                if (groupSchedule) {
                  setSelectedTimetableId(groupSchedule.id);
                  setSelectedGroupId(updatedGroup.id);
                } else {
                  await createGroupTimetable(updatedGroup.id, eventId, `${updatedGroup.name} Schedule`);
                }
              } catch (e) { console.error("Failed to select/create group schedule", e); } finally { setLoadingGroupsOp(false); }
            }}
          />
        )}
      </View>

      <CreateTimetableModal
        visible={createModalVisible}
        onDismiss={() => setCreateModalVisible(false)}
        onConfirm={handleCreate}
        loading={loadingPersonalOp}
        title="Create Personal Timetable"
      />

      <CreateGroupModal
        visible={createGroupModalVisible}
        onDismiss={() => setCreateGroupModalVisible(false)}
        onConfirm={handleCreateGroup}
        loading={loadingGroupsOp}
      />
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 8, paddingBottom: 8, backgroundColor: "transparent", zIndex: 10 },
  headerRow: { flexDirection: "row", alignItems: "center" },
  headerTitle: { fontWeight: "900" },
  headerSubtitle: { opacity: 0.6 },
  headerActions: { flexDirection: "row", alignItems: "center" },
  content: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});

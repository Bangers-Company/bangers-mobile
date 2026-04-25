import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { LayoutGrid, Plus, Share2 } from "lucide-react-native";
import React, { useEffect, useState, useCallback } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { IconButton, Text, useTheme, ActivityIndicator, Portal } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PageContainer } from "../../../src/components/PageContainer";
import { CreateGroupModal } from "../../../src/components/timetable/CreateGroupModal";
import { ConfirmDeleteModal } from "../../../src/components/modals/ConfirmDeleteModal";
import { TimetableGrid } from "../../../src/components/timetable/TimetableGrid";
import { TimetableOverview } from "../../../src/components/timetable/TimetableOverview";
import { useAuthStore } from "../../../src/store/useAuthStore";
import { useTimetableStore } from "../../../src/store/useTimetableStore";
import { Timetable, TimetableEntry } from "../../../src/types/timetable";
import { 
  useOfficialTimetable, 
  useGroups, 
  useGroupTimetable,
  useToggleAttendance,
  useAcceptInvitation,
  useRejectInvitation
} from "../../../src/hooks/useTimetables";
import { timetablesApi } from "../../../src/api/timetables";
import { useQueryClient } from "@tanstack/react-query";

import { useUIStore } from "../../../src/store/useUIStore";
import { useEvent } from "../../../src/hooks/useEvent";

const EMPTY_ARRAY: any[] = [];

export default function ScheduleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const { top } = useSafeAreaInsets();

  const [selectedTimetableId, setSelectedTimetableId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<any>(null);
  const [loadingGroupsOp, setLoadingGroupsOp] = useState(false);

  // TanStack Query Hooks
  const queryClient = useQueryClient();
  const { data: event } = useEvent(id as string);
  const { data: officialQuery, isLoading: isLoadingOfficial } = useOfficialTimetable(id as string);
  const { data: groupsQuery, isLoading: isLoadingGroups } = useGroups(id as string);
  const { data: specificGroupTimetable, isLoading: isLoadingSpecificGroup } = useGroupTimetable(selectedGroupId, selectedTimetableId);
  const toggleMutation = useToggleAttendance();
  const acceptMutation = useAcceptInvitation();
  const rejectMutation = useRejectInvitation();

  // Zustand Store
  const {
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
      event_id: id,
      entries: (event.official_timetable as any).entries || [],
    } as Timetable : null);
  }, [officialQuery, event, id]);
  
  const groups = React.useMemo(() => groupsQuery || EMPTY_ARRAY, [groupsQuery]);

  const selectedTimetable = React.useMemo(() => {
    if (selectedTimetableId) {
      if (selectedTimetableId === official?.id) return official;
      if (specificGroupTimetable && specificGroupTimetable.id === selectedTimetableId) return specificGroupTimetable;
      
      const g = groups.find((g: any) => g.id === selectedGroupId);
      const t = g?.timetables?.find((t: any) => t.id === selectedTimetableId);
      if (t) return t;
    }
    return null;
  }, [selectedTimetableId, official, groups, selectedGroupId, specificGroupTimetable]);

  const isPersonal = !!selectedTimetable && 
    (selectedTimetable.is_official || !!selectedGroupId);

  // Handle BottomNav visibility
  useFocusEffect(
    useCallback(() => {
      if (selectedTimetable) {
        setIsBottomNavVisible(false);
      }
      return () => {
        setIsBottomNavVisible(true);
      };
    }, [selectedTimetable, setIsBottomNavVisible])
  );

  const handleDeleteGroup = (group: any) => {
    setGroupToDelete(group);
    setDeleteModalVisible(true);
  };

  const confirmDeleteGroup = async () => {
    if (!groupToDelete) return;
    const group = groupToDelete;
    setLoadingGroupsOp(true);
    try {
      await deleteGroup(group.id);
      if (selectedGroupId === group.id) {
         setSelectedTimetableId(null);
         setSelectedGroupId(null);
      }
      setDeleteModalVisible(false);
    } finally { 
      setLoadingGroupsOp(false); 
      setGroupToDelete(null);
    }
  };

  const handleCreateGroup = async (name: string, members: string[]) => {
    setLoadingGroupsOp(true);
    try {
      await createGroup(name, members, id as string);
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      setCreateGroupModalVisible(false);
    } catch (e) { console.error(e); } finally { setLoadingGroupsOp(false); }
  };

  const handleEntryPress = React.useCallback((entry: TimetableEntry) => {
    if (!selectedTimetable) return;
    
    toggleMutation.mutate({
      id: selectedTimetable.id,
      entryId: entry.id,
      isGroup: !!selectedGroupId,
      type: selectedGroupId ? 'group' : 'official',
      targetId: selectedGroupId || (id as string),
      eventId: id as string
    });
  }, [selectedTimetable, selectedGroupId, id, toggleMutation]);

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
              {selectedTimetable ? (selectedTimetable.is_official ? "Official Schedule" : "Group Plan") : "Schedules"}
            </Text>
          </View>

          <View style={styles.headerActions}>
            {selectedTimetable && (
              <>
                <IconButton icon={() => <LayoutGrid size={20} color={theme.colors.primary} />} onPress={toggleViewMode} />
                <IconButton icon={() => <Share2 size={20} color={theme.colors.outline} />} disabled onPress={() => {}} />
              </>
            )}
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {selectedTimetable ? (
          (isLoadingOfficial && selectedTimetable.id === official?.id) && 
          (!selectedTimetable.entries || selectedTimetable.entries.length === 0) ? (
            <View style={styles.center}><ActivityIndicator color={theme.colors.primary} /></View>
          ) : (
            <TimetableGrid
              timetable={selectedTimetable}
              templateTimetable={official}
              isPersonal={isPersonal}
              onEntryPress={handleEntryPress}
              toggleMutation={toggleMutation}
              groupId={selectedGroupId}
              timetableId={selectedTimetableId}
            />
          )
        ) : (
          <TimetableOverview
            official={official}
            groups={groups}
            loadingOfficial={isLoadingOfficial}
            loadingGroups={loadingGroupsOp || isLoadingGroups}
            onSelect={(t: Timetable) => setSelectedTimetableId(t.id)}
            onAcceptInvitation={async (gid: string) => {
               acceptMutation.mutate(gid);
            }}
            onRejectInvitation={async (gid) => {
               rejectMutation.mutate(gid);
            }}
            onCreateGroup={() => {
              if (useUIStore.getState().isOffline) {
                alert(t("common.offline_warning"));
                return;
              }
              setCreateGroupModalVisible(true);
            }}
            onDeleteGroup={(group: any) => handleDeleteGroup(group)}
            onSelectGroup={async (group: any) => {
              setLoadingGroupsOp(true);
              try {
                const updatedGroup = groups.find((g: any) => g.id === group.id) || group;
                const groupSchedule = (updatedGroup.timetables || []).find((t: any) => 
                  String(t.event_id).toLowerCase() === String(id).toLowerCase()
                );
                
                if (groupSchedule) {
                  setSelectedTimetableId(groupSchedule.id);
                  setSelectedGroupId(updatedGroup.id);
                } else {
                  const res = await timetablesApi.createGroupTimetable(updatedGroup.id, { event_id: id as string, name: `${updatedGroup.name} Schedule` });
                  queryClient.invalidateQueries({ queryKey: ["groups"] });
                  setSelectedGroupId(updatedGroup.id);
                  setSelectedTimetableId(res.data.id);
                }
              } catch (e) { console.error("Failed to select/create group schedule", e); } finally { setLoadingGroupsOp(false); }
            }}
          />
        )}
      </View>

      <CreateGroupModal
        visible={createGroupModalVisible}
        onDismiss={() => setCreateGroupModalVisible(false)}
        onConfirm={handleCreateGroup}
        loading={loadingGroupsOp}
      />

      <ConfirmDeleteModal
        visible={deleteModalVisible}
        title={groupToDelete?.owner_id === useAuthStore.getState().user?.id ? "Delete Group" : "Leave Group"}
        message={groupToDelete?.owner_id === useAuthStore.getState().user?.id 
          ? `Are you sure you want to delete ${groupToDelete?.name}? This will remove all members and schedules.`
          : `Are you sure you want to leave ${groupToDelete?.name}?`}
        onConfirm={confirmDeleteGroup}
        onDismiss={() => {
          setDeleteModalVisible(false);
          setGroupToDelete(null);
        }}
        loading={loadingGroupsOp}
        confirmLabel={groupToDelete?.owner_id === useAuthStore.getState().user?.id ? "Delete" : "Leave"}
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

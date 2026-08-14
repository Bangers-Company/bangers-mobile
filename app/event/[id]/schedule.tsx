import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { ChevronDown, LayoutGrid, Share2 } from "lucide-react-native";
import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { IconButton, Text, useTheme, ActivityIndicator } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PageContainer } from "../../../src/components/PageContainer";
import { CreateGroupModal } from "../../../src/components/timetable/CreateGroupModal";
import { ConfirmDeleteModal } from "../../../src/components/modals/ConfirmDeleteModal";
import { TimetableGrid } from "../../../src/components/timetable/TimetableGrid";
import { TimetableSelectorBottomSheet } from "../../../src/components/timetable/TimetableSelectorBottomSheet";
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

import { useTranslation } from "react-i18next";
import { useUIStore } from "../../../src/store/useUIStore";
import { useEvent } from "../../../src/hooks/useEvent";
import { addAlpha } from "../../../src/utils/theme";

const EMPTY_ARRAY: any[] = [];

export default function ScheduleScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const theme = useTheme();
  const router = useRouter();
  const { top } = useSafeAreaInsets();

  const [selectedTimetableId, setSelectedTimetableId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectorSheetVisible, setSelectorSheetVisible] = useState(false);
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
    createGroup,
    deleteGroup,
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

  // Default to official timetable when official becomes available
  useEffect(() => {
    if (!selectedTimetableId && !selectedGroupId && official?.id) {
      setSelectedTimetableId(official.id);
    }
  }, [official?.id, selectedTimetableId, selectedGroupId]);

  const selectedTimetable = React.useMemo(() => {
    if (selectedTimetableId) {
      if (selectedTimetableId === official?.id) return official;
      if (specificGroupTimetable && specificGroupTimetable.id === selectedTimetableId) return specificGroupTimetable;
      
      const g = groups.find((g: any) => g.id === selectedGroupId);
      const t = g?.timetables?.find((t: any) => t.id === selectedTimetableId);
      if (t) return t;
    }
    // Fallback to official if available
    if (official) return official;
    return null;
  }, [selectedTimetableId, official, groups, selectedGroupId, specificGroupTimetable]);

  const isPersonal = !!selectedTimetable && 
    (selectedTimetable.is_official || !!selectedGroupId);

  // Handle BottomNav visibility
  useFocusEffect(
    useCallback(() => {
      setIsBottomNavVisible(false);
      return () => {
        setIsBottomNavVisible(true);
      };
    }, [setIsBottomNavVisible])
  );

  const handleSelectOfficial = () => {
    setSelectedGroupId(null);
    if (official) {
      setSelectedTimetableId(official.id);
    }
  };

  const handleSelectGroup = async (group: any) => {
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
    } catch (e) {
      console.error("Failed to select/create group schedule", e);
    } finally {
      setLoadingGroupsOp(false);
    }
  };

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
         setSelectedGroupId(null);
         setSelectedTimetableId(official?.id || null);
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
      const newGroup = await createGroup(name, members, id as string);
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      setCreateGroupModalVisible(false);
      if (newGroup?.id) {
        handleSelectGroup(newGroup);
      }
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoadingGroupsOp(false); 
    }
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
          <IconButton icon="chevron-left" iconColor={theme.colors.onSurface} onPress={() => router.back()} />

          <Pressable
            style={[styles.selectorPill, { backgroundColor: addAlpha(theme.colors.onSurface, 0.06) }]}
            onPress={() => setSelectorSheetVisible(true)}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.selectorTitleRow}>
                <Text variant="titleMedium" style={[styles.headerTitle, { color: theme.colors.onSurface }]} numberOfLines={1}>
                  {selectedTimetable ? selectedTimetable.name : (official?.name || t("timetable.sections.official"))}
                </Text>
                <ChevronDown size={18} color={theme.colors.primary} style={{ marginLeft: 4 }} />
              </View>
              <Text variant="bodySmall" style={[styles.headerSubtitle, { color: theme.colors.onSurface }]} numberOfLines={1}>
                {selectedGroupId 
                  ? (groups.find((g: any) => g.id === selectedGroupId)?.name || t("timetable.groupBadge")) 
                  : t("timetable.officialBadge")}
              </Text>
            </View>
          </Pressable>

          <View style={styles.headerActions}>
            <IconButton icon={() => <LayoutGrid size={20} color={theme.colors.primary} />} onPress={toggleViewMode} />
            <IconButton icon={() => <Share2 size={20} color={theme.colors.outline} />} disabled onPress={() => {}} />
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {selectedTimetable ? (
          ((isLoadingOfficial && selectedTimetable.id === official?.id) || 
           (isLoadingSpecificGroup && selectedGroupId && (!selectedTimetable.entries || selectedTimetable.entries.length === 0))) ? (
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
          <View style={styles.center}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
          </View>
        )}
      </View>

      <TimetableSelectorBottomSheet
        visible={selectorSheetVisible}
        onDismiss={() => setSelectorSheetVisible(false)}
        official={official}
        groups={groups}
        selectedTimetableId={selectedTimetableId}
        selectedGroupId={selectedGroupId}
        onSelectOfficial={handleSelectOfficial}
        onSelectGroup={handleSelectGroup}
        onAcceptInvitation={(gid: string) => acceptMutation.mutate(gid)}
        onRejectInvitation={(gid: string) => rejectMutation.mutate(gid)}
        onCreateGroup={() => {
          if (useUIStore.getState().isOffline) {
            alert(t("common.offline_warning"));
            return;
          }
          setCreateGroupModalVisible(true);
        }}
        onDeleteGroup={handleDeleteGroup}
      />

      <CreateGroupModal
        visible={createGroupModalVisible}
        onDismiss={() => setCreateGroupModalVisible(false)}
        onConfirm={handleCreateGroup}
        loading={loadingGroupsOp}
      />

      <ConfirmDeleteModal
        visible={deleteModalVisible}
        title={groupToDelete?.owner_id === useAuthStore.getState().user?.id 
          ? t("timetable.groups.deleteModal.titleDelete") 
          : t("timetable.groups.deleteModal.titleLeave")}
        message={groupToDelete?.owner_id === useAuthStore.getState().user?.id 
          ? t("timetable.groups.deleteModal.messageDelete", { name: groupToDelete?.name })
          : t("timetable.groups.deleteModal.messageLeave", { name: groupToDelete?.name })}
        onConfirm={confirmDeleteGroup}
        onDismiss={() => {
          setDeleteModalVisible(false);
          setGroupToDelete(null);
        }}
        loading={loadingGroupsOp}
        confirmLabel={groupToDelete?.owner_id === useAuthStore.getState().user?.id 
          ? t("timetable.groups.deleteModal.confirmDelete") 
          : t("timetable.groups.deleteModal.confirmLeave")}
      />
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 8, paddingBottom: 8, backgroundColor: "transparent", zIndex: 10 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  selectorPill: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    justifyContent: "center",
  },
  selectorTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: { fontWeight: "900", fontSize: 16 },
  headerSubtitle: { opacity: 0.6, fontSize: 11 },
  headerActions: { flexDirection: "row", alignItems: "center" },
  content: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});

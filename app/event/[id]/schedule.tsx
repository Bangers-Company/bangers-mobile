import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { ChevronDown, LayoutGrid, List, Share2, Clock } from "lucide-react-native";
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
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();

  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (from === "home") {
      router.navigate("/(tabs)" as any);
    } else {
      router.navigate(`/event/${id}` as any);
    }
  };

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

  const isTimetableAvailable = React.useMemo(() => {
    if (!selectedTimetable) return false;
    const entries = selectedTimetable.entries || [];
    return entries.length > 0;
  }, [selectedTimetable]);

  // Hide BottomNav when timetable is unavailable/unpublished ("Not yet available")
  useFocusEffect(
    useCallback(() => {
      setIsBottomNavVisible(isTimetableAvailable);
      return () => {
        setIsBottomNavVisible(true);
      };
    }, [setIsBottomNavVisible, isTimetableAvailable])
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

  const titleText = selectedTimetable ? selectedTimetable.name : (official?.name || t("timetable.sections.official"));
  const groupName = selectedGroupId ? groups.find((g: any) => g.id === selectedGroupId)?.name : null;

  return (
    <PageContainer withPadding={false} withSafeArea={false}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 16) }]}>
        <View style={styles.headerRow}>
          <IconButton
            icon="chevron-left"
            iconColor={theme.colors.onSurface}
            size={24}
            style={styles.backButton}
            onPress={handleBack}
          />

          {/* Selector Glass Pill - Centered text layout */}
          <Pressable
            style={[
              styles.selectorPill,
              {
                backgroundColor: addAlpha(theme.colors.primary, 0.1),
                borderColor: addAlpha(theme.colors.primary, 0.22),
                opacity: isTimetableAvailable ? 1 : 0.8,
              },
            ]}
            disabled={!isTimetableAvailable}
            onPress={() => isTimetableAvailable && setSelectorSheetVisible(true)}
          >
            <View style={styles.selectorContentWrapper}>
              <View style={styles.selectorTitleRow}>
                <Text
                  variant="titleMedium"
                  style={[styles.headerTitle, { color: theme.colors.onSurface }]}
                  numberOfLines={1}
                >
                  {titleText}
                </Text>
                {isTimetableAvailable && (
                  <ChevronDown size={16} color={theme.colors.primary} style={{ marginLeft: 6 }} />
                )}
              </View>

              {groupName && (
                <Text
                  variant="bodySmall"
                  style={[styles.headerSubtitle, { color: addAlpha(theme.colors.onSurface, 0.65) }]}
                  numberOfLines={1}
                >
                  {groupName}
                </Text>
              )}
            </View>
          </Pressable>

          {isTimetableAvailable && (
            <View style={styles.headerActions}>
              <Pressable
                style={[
                  styles.actionBtn,
                  { backgroundColor: addAlpha(theme.colors.primary, 0.12), borderColor: addAlpha(theme.colors.primary, 0.28) },
                ]}
                onPress={toggleViewMode}
              >
                {viewMode === "vertical" ? (
                  <LayoutGrid size={18} color={theme.colors.primary} />
                ) : (
                  <List size={18} color={theme.colors.primary} />
                )}
              </Pressable>
            </View>
          )}
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
        ) : isLoadingOfficial ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconWrapper,
                {
                  backgroundColor: addAlpha(theme.colors.primary, 0.12),
                  borderColor: addAlpha(theme.colors.primary, 0.3),
                },
              ]}
            >
              <Clock size={36} color={theme.colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
              {t("timetable.notYetAvailable") || "Not yet available"}
            </Text>
            <Text style={[styles.emptySub, { color: addAlpha(theme.colors.onSurface, 0.65) }]}>
              {t("timetable.notYetAvailableSub") ||
                "The official timetable for this festival has not been published yet. Check back soon!"}
            </Text>
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: "transparent",
    zIndex: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backButton: {
    margin: 0,
  },
  selectorPill: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  selectorContentWrapper: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  selectorTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontWeight: "800", fontSize: 16, textAlign: "center" },
  headerSubtitle: { fontSize: 11.5, fontWeight: "500", marginTop: 1, textAlign: "center" },
  headerActions: { flexDirection: "row", alignItems: "center" },
  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: {
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

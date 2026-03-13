import { useLocalSearchParams, useRouter } from "expo-router";
import { LayoutGrid, Plus, Share2 } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { IconButton, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PageContainer } from "../../../src/components/PageContainer";
import { CreateGroupModal } from "../../../src/components/timetable/CreateGroupModal";
import { CreateTimetableModal } from "../../../src/components/timetable/CreateTimetableModal";
import { TimetableGrid } from "../../../src/components/timetable/TimetableGrid";
import { TimetableOverview } from "../../../src/components/timetable/TimetableOverview";
import { useEventStore } from "../../../src/store/useEventStore";
import { useAuthStore } from "../../../src/store/useAuthStore";
import { useTimetableStore } from "../../../src/store/useTimetableStore";
import { useUIStore } from "../../../src/store/useUIStore";
import { Timetable, TimetableEntry } from "../../../src/types/timetable";

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

  const {
    officialTimetable,
    personalTimetable,
    groups,
    loading,
    fetchGroups,
    fetchOfficial,
    fetchPersonal,
    fetchGroupTimetable,
    createPersonal,
    deletePersonal,
    toggleAttend,
    acceptInvitation,
    rejectInvitation,
    createGroup,
    deleteGroup,
    createGroupTimetable,
    viewMode,
    setViewMode,
  } = useTimetableStore();

  const cachedEvent = useEventStore((state) => state.events[eventId]?.event);
  const isLoading = loading[eventId];
  const setIsBottomNavVisible = useUIStore((state) => state.setIsBottomNavVisible);

  // Initial Fetch
  useEffect(() => {
    if (eventId) {
      fetchOfficial(eventId);
      fetchPersonal(eventId);
      fetchGroups();
    }
  }, [eventId, fetchOfficial, fetchPersonal, fetchGroups]);

  // Derive timetables
  const official = officialTimetable[eventId] || (cachedEvent?.official_timetable ? {
    ...cachedEvent.official_timetable,
    event_id: eventId,
    entries: (cachedEvent.official_timetable as any).entries || [],
  } as Timetable : null);

  const personal = personalTimetable[eventId] || (cachedEvent as any)?.personal_timetable || null;

  const selectedTimetable = (() => {
    if (selectedTimetableId) {
      if (selectedTimetableId === official?.id) return official;
      if (selectedTimetableId === personal?.id) return personal;
      const g = groups.find(g => g.id === selectedGroupId);
      const t = g?.timetables?.find((t: any) => t.id === selectedTimetableId);
      if (t) return t;
    }
    return null;
  })();

  const isPersonal = !!selectedTimetable && 
    (selectedTimetable.id === personal?.id || !!selectedGroupId);

  // Fetch group detail if missing
  useEffect(() => {
    if (selectedGroupId && selectedTimetableId) {
      const group = groups.find(g => g.id === selectedGroupId);
      const timetable = group?.timetables?.find((t: any) => t.id === selectedTimetableId);
      if (timetable && (!timetable.entries || timetable.entries.length === 0)) {
        fetchGroupTimetable(selectedGroupId, selectedTimetableId);
      }
    }
  }, [selectedGroupId, selectedTimetableId, groups, fetchGroupTimetable]);

  // Handle BottomNav visibility
  useEffect(() => {
    if (selectedTimetable) {
      setIsBottomNavVisible(false);
    } else {
      setIsBottomNavVisible(true);
    }
    return () => setIsBottomNavVisible(true);
  }, [selectedTimetable, setIsBottomNavVisible]);

  const handleDeletePersonal = async (id: string) => {
    Alert.alert(
      "Delete Timetable",
      "Are you sure you want to delete your personal timetable?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            setLoadingPersonalOp(true);
            try {
              await deletePersonal(eventId, id);
              if (selectedTimetableId === id) {
                setSelectedTimetableId(null);
              }
              await fetchPersonal(eventId); // Explicit sync
            } finally {
              setLoadingPersonalOp(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteGroup = async (group: any) => {
    const isOwner = group.owner_id === (useAuthStore.getState().user?.id);
    const title = isOwner ? "Delete Group" : "Leave Group";
    const message = isOwner 
      ? "Are you sure you want to delete this group? This will remove all members and schedules for everyone."
      : "Are you sure you want to leave this group? You will lose access to its schedules.";

    Alert.alert(
      title,
      message,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: isOwner ? "Delete" : "Leave", 
          style: "destructive",
          onPress: async () => {
            setLoadingGroupsOp(true);
            try {
              await deleteGroup(group.id);
              if (selectedGroupId === group.id) {
                 setSelectedTimetableId(null);
                 setSelectedGroupId(null);
              }
              await fetchGroups(); // Explicit sync
            } finally {
              setLoadingGroupsOp(false);
            }
          }
        }
      ]
    );
  };

  const handleCreate = async (name: string) => {
    setLoadingPersonalOp(true);
    try {
      await createPersonal(eventId, name);
      setCreateModalVisible(false);
      await fetchPersonal(eventId); 
      // Finding it by eventId in store after fetch
      const currentPersonal = useTimetableStore.getState().personalTimetable[eventId];
      if (currentPersonal) {
        setSelectedTimetableId(currentPersonal.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPersonalOp(false);
    }
  };

  const handleCreateGroup = async (name: string, members: string[]) => {
    setLoadingGroupsOp(true);
    try {
      await createGroup(name, members);
      setCreateGroupModalVisible(false);
      await fetchGroups(); // Explicit sync
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingGroupsOp(false);
    }
  };


  const handleEntryPress = (entry: TimetableEntry) => {
    if (!selectedTimetable || selectedTimetable.is_official) return;
    toggleAttend(selectedTimetable.id, entry.id, !!selectedGroupId, eventId, selectedGroupId || undefined);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "vertical" ? "horizontal" : "vertical");
  };

  return (
    <PageContainer withPadding={false} withSafeArea={false}>
      <View style={[styles.header, { paddingTop: top / 4 }]}>
        <View style={styles.headerRow}>
          {selectedTimetable ? (
            <IconButton
              icon="arrow-left"
              onPress={() => {
                setSelectedTimetableId(null);
                setSelectedGroupId(null);
              }}
            />
          ) : (
            <IconButton
              icon="chevron-left"
              onPress={() => router.push("/(tabs)")}
            />
          )}

          <View style={{ flex: 1 }}>
            <Text
              variant="titleLarge"
              style={styles.headerTitle}
              numberOfLines={1}
            >
              {selectedTimetable ? selectedTimetable.name : "Timetables"}
            </Text>
            <Text
              variant="bodySmall"
              style={styles.headerSubtitle}
              numberOfLines={1}
            >
              {selectedTimetable
                ? selectedTimetable.is_official
                  ? "Official Schedule"
                  : "My Plan"
                : "Schedules"}
            </Text>
          </View>

          <View style={styles.headerActions}>
            {selectedTimetable ? (
              <>
                <IconButton
                  icon={() => (
                    <LayoutGrid size={20} color={theme.colors.primary} />
                  )}
                  onPress={toggleViewMode}
                />
                <IconButton
                  icon={() => <Share2 size={20} color={theme.colors.outline} />}
                  disabled
                  onPress={() => {}}
                />
              </>
            ) : (
              official &&
              !personal && (
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
            templateTimetable={official}
            isPersonal={isPersonal}
            onEntryPress={handleEntryPress}
          />
        ) : (
          <TimetableOverview
            official={official}
            personal={personal}
            groups={groups}
            loadingOfficial={isLoading}
            loadingPersonal={loadingPersonalOp}
            loadingGroups={loadingGroupsOp}
            onSelect={(t: Timetable) => setSelectedTimetableId(t.id)}
            onCreatePersonal={() => setCreateModalVisible(true)}
            onDeletePersonal={handleDeletePersonal}
            onAcceptInvitation={async (gid: string) => {
               setLoadingGroupsOp(true);
               try {
                 await acceptInvitation(gid);
                 await fetchGroups();
               } finally {
                 setLoadingGroupsOp(false);
               }
            }}
            onRejectInvitation={async (gid) => {
              setLoadingGroupsOp(true);
              try {
                await rejectInvitation(gid);
                await fetchGroups();
              } finally {
                setLoadingGroupsOp(false);
              }
            }}
            onCreateGroup={() => setCreateGroupModalVisible(true)}
            onDeleteGroup={(group: any) => handleDeleteGroup(group)}
            onSelectGroup={async (group: any) => {
              console.log("onSelectGroup triggered for group:", group.id);
              
              setLoadingGroupsOp(true);
              try {
                // If group has no timetables or we need to ensure they are loaded
                if (!group.timetables || group.timetables.length === 0) {
                  console.log("Fetching group timetables for:", group.id);
                  await fetchGroups(); // Deep refresh
                }

                // Refresh the group reference from the latest store state
                const updatedGroup = useTimetableStore.getState().groups.find(g => g.id === group.id) || group;
                
                const groupSchedule = (updatedGroup.timetables || []).find((t: any) => 
                  String(t.event_id).toLowerCase() === String(eventId).toLowerCase()
                );
                
                if (groupSchedule) {
                  console.log("Match found! Selecting timetable:", groupSchedule.id);
                  setSelectedTimetableId(groupSchedule.id);
                  setSelectedGroupId(updatedGroup.id);
                } else {
                  console.log("No match found for eventId. Auto-creating group schedule.");
                  // Auto-create instead of showing a modal
                  await createGroupTimetable(updatedGroup.id, eventId, `${updatedGroup.name} Schedule`);
                  
                  // Fetch fresh data and select it
                  await fetchGroups();
                  const finalGroup = useTimetableStore.getState().groups.find(g => g.id === group.id);
                  const newT = finalGroup?.timetables?.find((t: any) => 
                    String(t.event_id).toLowerCase() === String(eventId).toLowerCase()
                  );
                  
                  if (newT) {
                    setSelectedTimetableId(newT.id);
                    setSelectedGroupId(finalGroup?.id || group.id);
                  }
                }
              } catch (e) {
                console.error("Failed to select/create group schedule", e);
              } finally {
                setLoadingGroupsOp(false);
              }
            }}
          />
        )}
      </View>

      <CreateTimetableModal
        visible={createModalVisible}
        onDismiss={() => {
          setCreateModalVisible(false);
        }}
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

import React, { useEffect } from "react";
import { StyleSheet, View, ScrollView, Dimensions, Pressable as RNPressable, PanResponder } from "react-native";
import { Text, Button, ButtonText, Pressable } from "@gluestack-ui/themed";
import { Globe, Users, Check, Plus, Trash2, LogOut, X } from "lucide-react-native";
import { useAppTheme } from "../../context/ThemeProvider";
import { useTranslation } from "react-i18next";
import { addAlpha } from "../../utils/theme";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Timetable } from "../../types/timetable";
import { Group } from "../../types/group";
import { useAuthStore } from "../../store/useAuthStore";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface TimetableSelectorBottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  official: Timetable | null;
  groups: Group[];
  selectedTimetableId: string | null;
  selectedGroupId: string | null;
  onSelectOfficial: () => void;
  onSelectGroup: (group: Group) => void;
  onAcceptInvitation: (groupId: string) => void;
  onRejectInvitation: (groupId: string) => void;
  onCreateGroup: () => void;
  onDeleteGroup: (group: Group) => void;
}

export const TimetableSelectorBottomSheet: React.FC<TimetableSelectorBottomSheetProps> = ({
  visible,
  onDismiss,
  official,
  groups,
  selectedTimetableId,
  selectedGroupId,
  onSelectOfficial,
  onSelectGroup,
  onAcceptInvitation,
  onRejectInvitation,
  onCreateGroup,
  onDeleteGroup,
}) => {
  const theme = useAppTheme();
  const { top } = useSafeAreaInsets();
  const { t } = useTranslation();
  const currentUser = useAuthStore((state) => state.user);

  const translateY = useSharedValue(-SCREEN_HEIGHT);
  const opacity = useSharedValue(0);

  const invitations = groups.filter((g) => g.pivot?.invitation_status === "pending");
  const activeGroups = groups.filter((g) => g.pivot?.invitation_status === "accepted");

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, {
        damping: 24,
        stiffness: 120,
        overshootClamping: true,
      });
      opacity.value = withTiming(1, { duration: 250 });
    } else {
      translateY.value = withTiming(-SCREEN_HEIGHT, { duration: 250 });
      opacity.value = withTiming(0, { duration: 250 });
    }
  }, [visible, translateY, opacity]);

  const handleDismiss = React.useCallback(() => {
    translateY.value = withTiming(-SCREEN_HEIGHT, { duration: 250 }, () => {
      runOnJS(onDismiss)();
    });
    opacity.value = withTiming(0, { duration: 250 });
  }, [onDismiss, opacity, translateY]);

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return gestureState.dy < -10;
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy < 0) {
            translateY.value = gestureState.dy;
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy < -50 || gestureState.vy < -0.4) {
            handleDismiss();
          } else {
            translateY.value = withSpring(0, {
              damping: 24,
              stiffness: 120,
              overshootClamping: true,
            });
          }
        },
      }),
    [handleDismiss, translateY]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible) return null;

  const isOfficialSelected = !selectedGroupId && (selectedTimetableId === official?.id || !selectedTimetableId);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: theme.colors.surface,
            paddingTop: Math.max(top + 12, 48),
          },
          animatedStyle,
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
            {t("timetable.selectTimetable") || "Select Timetable"}
          </Text>
          <RNPressable style={styles.closeBtn} onPress={handleDismiss}>
            <X size={20} color={theme.colors.onSurface} />
          </RNPressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Official Schedule */}
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {t("timetable.sections.official") || "Official Schedule"}
          </Text>

          {official && (
            <Pressable
              style={[
                styles.itemCard,
                { backgroundColor: addAlpha(theme.colors.onSurface, 0.04) },
                isOfficialSelected && {
                  borderColor: theme.colors.primary,
                  borderWidth: 2,
                  backgroundColor: addAlpha(theme.colors.primary, 0.08),
                },
              ]}
              onPress={() => {
                onSelectOfficial();
                handleDismiss();
              }}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: addAlpha(theme.colors.primary, 0.15) }]}>
                  <Globe size={22} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                    {official.name}
                  </Text>
                  <Text style={[styles.cardSub, { color: theme.colors.onSurface }]}>
                    {t("timetable.sections.officialSubtitle") || "Official Event Timetable"}
                  </Text>
                </View>
                {isOfficialSelected && (
                  <View style={[styles.checkmarkCircle, { backgroundColor: theme.colors.primary }]}>
                    <Check size={14} color="#fff" strokeWidth={3} />
                  </View>
                )}
              </View>
            </Pressable>
          )}

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.colors.primary, marginTop: 20 }]}>
                {t("timetable.sections.invitations", { count: invitations.length }) ||
                  `Invitations (${invitations.length})`}
              </Text>
              {invitations.map((group) => (
                <View
                  key={group.id}
                  style={[
                    styles.itemCard,
                    {
                      backgroundColor: addAlpha(theme.colors.onSurface, 0.04),
                      borderLeftWidth: 4,
                      borderLeftColor: theme.colors.primary,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.iconBox, { backgroundColor: addAlpha(theme.colors.primary, 0.15) }]}>
                      <Users size={22} color={theme.colors.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                        {group.name}
                      </Text>
                      <Text style={[styles.cardSub, { color: theme.colors.onSurface }]}>
                        {t("timetable.groups.invitedBy", {
                          name:
                            group.owner?.name ||
                            (group.owner?.first_name
                              ? `${group.owner.first_name} ${group.owner.last_name || ""}`.trim()
                              : null) ||
                            group.owner?.username ||
                            t("common.someone") ||
                            "someone",
                        })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.invitationActions}>
                    <Button
                      variant="outline"
                      onPress={() => onRejectInvitation(group.id)}
                      style={{ flex: 1, borderRadius: 10, height: 38 }}
                    >
                      <ButtonText style={{ fontSize: 13 }}>{t("common.decline") || "Decline"}</ButtonText>
                    </Button>
                    <Button
                      onPress={() => onAcceptInvitation(group.id)}
                      style={{ flex: 1, borderRadius: 10, height: 38, backgroundColor: theme.colors.primary }}
                    >
                      <ButtonText style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
                        {t("common.accept") || "Accept"}
                      </ButtonText>
                    </Button>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Group Timetables */}
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface, marginTop: 20 }]}>
            {t("timetable.sections.groups") || "Groups"}
          </Text>

          {activeGroups.map((group) => {
            const isGroupSelected = selectedGroupId === group.id;
            const isOwner = group.owner_id === currentUser?.id;

            return (
              <Pressable
                key={group.id}
                style={[
                  styles.itemCard,
                  { backgroundColor: addAlpha(theme.colors.onSurface, 0.04) },
                  isGroupSelected && {
                    borderColor: theme.colors.primary,
                    borderWidth: 2,
                    backgroundColor: addAlpha(theme.colors.primary, 0.08),
                  },
                ]}
                onPress={() => {
                  onSelectGroup(group);
                  handleDismiss();
                }}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: addAlpha(theme.colors.primary, 0.15) }]}>
                    <Users size={22} color={theme.colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                      {group.name}
                    </Text>
                    <Text style={[styles.cardSub, { color: theme.colors.onSurface }]}>
                      {t("timetable.groups.memberCount", { count: group.members_count || 1 }) ||
                        `${group.members_count || 1} Members`}
                    </Text>
                  </View>

                  <View style={styles.groupRightActions}>
                    {isGroupSelected && (
                      <View style={[styles.checkmarkCircle, { backgroundColor: theme.colors.primary, marginRight: 8 }]}>
                        <Check size={14} color="#fff" strokeWidth={3} />
                      </View>
                    )}
                    <RNPressable
                      style={styles.deleteIconBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDismiss();
                        onDeleteGroup(group);
                      }}
                      hitSlop={8}
                    >
                      {isOwner ? (
                        <Trash2 size={18} color={theme.colors.error || "#ef4444"} />
                      ) : (
                        <LogOut size={18} color={theme.colors.error || "#ef4444"} />
                      )}
                    </RNPressable>
                  </View>
                </View>
              </Pressable>
            );
          })}

          {/* Create New Group Button */}
          <Pressable
            style={[styles.createBtn, { borderColor: addAlpha(theme.colors.primary, 0.4) }]}
            onPress={() => {
              handleDismiss();
              onCreateGroup();
            }}
          >
            <View style={[styles.createIconBox, { backgroundColor: addAlpha(theme.colors.primary, 0.12) }]}>
              <Plus size={20} color={theme.colors.primary} />
            </View>
            <Text style={[styles.createBtnText, { color: theme.colors.primary }]}>
              {t("timetable.groups.create") || "Create Group"}
            </Text>
          </Pressable>
        </ScrollView>

        <RNPressable
          style={{ width: "100%", paddingVertical: 10, alignItems: "center", justifyContent: "center" }}
          onPress={handleDismiss}
        >
          <View style={styles.handleBottom} />
        </RNPressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    zIndex: 1000,
  },
  sheet: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_HEIGHT * 0.82,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 20,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    zIndex: 1001,
  },
  handleBottom: {
    width: 36,
    height: 4,
    backgroundColor: "rgba(128, 128, 128, 0.4)",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: "rgba(128, 128, 128, 0.15)",
  },
  scrollContent: {
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    opacity: 0.8,
  },
  itemCard: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  cardSub: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  checkmarkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  invitationActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  groupRightActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  deleteIconBtn: {
    padding: 6,
    marginLeft: 4,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 14,
    marginBottom: 10,
  },
  createIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  createBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
});

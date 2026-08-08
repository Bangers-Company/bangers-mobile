import React from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { Box, Text, Spinner, Button, ButtonText, Pressable } from "@gluestack-ui/themed";
import { useAppTheme } from "../../context/ThemeProvider";
import { Calendar, Users, Globe, ChevronRight } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { addAlpha } from "../../utils/theme";
import { Group } from "../../types/group";
import { Timetable } from "../../types/timetable";

interface TimetableOverviewProps {
  official: Timetable | null;
  groups: Group[];
  loadingGroups: boolean;
  loadingOfficial: boolean;
  onSelect: (timetable: Timetable) => void;
  onAcceptInvitation: (groupId: string) => void;
  onRejectInvitation: (groupId: string) => void;
  onCreateGroup: () => void;
  onDeleteGroup: (group: Group) => void;
  onSelectGroup: (group: Group) => void;
}

export const TimetableOverview: React.FC<TimetableOverviewProps> = ({
  official,
  groups,
  loadingGroups,
  loadingOfficial,
  onSelect,
  onAcceptInvitation,
  onRejectInvitation,
  onCreateGroup,
  onDeleteGroup,
  onSelectGroup,
}) => {
  const theme = useAppTheme();
  const { t } = useTranslation();

  const invitations = groups.filter(g => g.pivot?.invitation_status === 'pending');
  const activeGroups = groups.filter(g => g.pivot?.invitation_status === 'accepted');

  if (loadingOfficial && !official) {
    return (
      <View style={styles.center}>
        <Spinner color={theme.colors.primary} />
      </View>
    );
  }

  if (!official && activeGroups.length === 0 && invitations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.iconBox, { backgroundColor: addAlpha(theme.colors.error, 0.1) }]}>
          <Calendar size={48} color={theme.colors.error} />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
          {t("timetable.empty.title") || "Not Published Yet"}
        </Text>
        <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
          {t("timetable.empty.description") || "Sorry, please wait for the official timetable to be published for this event, or create a group to start planning."}
        </Text>
        <Button 
          onPress={onCreateGroup} 
          style={{ marginTop: 24, backgroundColor: theme.colors.primary, borderRadius: 12 }}
        >
          <ButtonText style={{ color: "#fff", fontWeight: "700" }}>
            {t("timetable.groups.create") || "Create Group"}
          </ButtonText>
        </Button>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {official && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {t("timetable.sections.official") || "Official Schedule"}
          </Text>
          <Pressable
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
            onPress={() => onSelect(official)}
          >
            <View style={styles.cardHeader}>
              <Globe size={24} color={theme.colors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>{official.name}</Text>
                <Text style={styles.cardSub}>
                  {t("timetable.sections.officialSubtitle") || "Official Event Timetable"}
                </Text>
              </View>
              <ChevronRight size={20} color="#888" />
            </View>
          </Pressable>
        </>
      )}

      {invitations.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            {t("timetable.sections.invitations", { count: invitations.length }) || `Invitations (${invitations.length})`}
          </Text>
          {invitations.map(group => (
            <View key={group.id} style={[styles.card, { backgroundColor: theme.colors.surface, borderLeftWidth: 4, borderLeftColor: theme.colors.primary }]}>
              <View style={styles.cardHeader}>
                <Users size={24} color={theme.colors.primary} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>{group.name}</Text>
                  <Text style={styles.cardSub}>
                    {t("timetable.groups.invitedBy", { 
                      name: group.owner?.name || 
                            (group.owner?.first_name ? `${group.owner.first_name} ${group.owner.last_name || ""}`.trim() : null) ||
                            group.owner?.username || 
                            t("common.someone") || "someone"
                    })}
                  </Text>
                </View>
              </View>
              <View style={styles.actions}>
                <Button variant="outline" onPress={() => onRejectInvitation(group.id)} style={{ flex: 1, borderRadius: 10 }}>
                  <ButtonText>{t("common.decline") || "Decline"}</ButtonText>
                </Button>
                <Button onPress={() => onAcceptInvitation(group.id)} style={{ flex: 1, borderRadius: 10, backgroundColor: theme.colors.primary }}>
                  <ButtonText style={{ color: "#fff", fontWeight: "700" }}>{t("common.accept") || "Accept"}</ButtonText>
                </Button>
              </View>
            </View>
          ))}
        </>
      )}

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          {t("timetable.sections.groups") || "Groups"}
        </Text>
        {loadingGroups && <Spinner color={theme.colors.primary} />}
      </View>
      
      {activeGroups.map(group => (
        <Pressable 
          key={group.id} 
          style={[styles.card, { backgroundColor: theme.colors.surface }]} 
          onPress={() => onSelectGroup(group)}
          onLongPress={() => onDeleteGroup(group)}
        >
          <View style={styles.cardHeader}>
            <Users size={24} color={theme.colors.primary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>{group.name}</Text>
              <Text style={styles.cardSub}>
                {t("timetable.groups.memberCount", { count: group.members_count || 1 }) || `${group.members_count || 1} Members • Long press to delete`}
              </Text>
            </View>
            <ChevronRight size={20} color="#888" />
          </View>
        </Pressable>
      ))}

      <Pressable 
        style={[styles.createPlaceholder, { height: activeGroups.length > 0 ? 80 : 100 }]} 
        onPress={onCreateGroup}
        disabled={loadingGroups}
      >
        {loadingGroups ? (
          <Spinner color={theme.colors.primary} />
        ) : (
          <>
            <Users size={activeGroups.length > 0 ? 20 : 24} color={theme.colors.primary} />
            <Text 
              style={{ color: theme.colors.primary, marginTop: 4, fontWeight: "600" }}
            >
              {activeGroups.length > 0 
                ? t("timetable.groups.createAnother") || "Create another group" 
                : t("timetable.groups.createFirst") || "Create your first group"}
            </Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 16,
  },
  card: {
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  cardSub: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  createPlaceholder: {
    height: 100,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: addAlpha("#000", 0.1),
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  iconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 12,
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.7,
    lineHeight: 22,
  },
});


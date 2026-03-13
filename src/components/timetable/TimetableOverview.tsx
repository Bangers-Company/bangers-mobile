import React from "react";
import { StyleSheet, View, TouchableOpacity, ScrollView } from "react-native";
import { Text, useTheme, ActivityIndicator, IconButton, Card, Button } from "react-native-paper";
import { Calendar, Users, Globe } from "lucide-react-native";
import { addAlpha } from "../../utils/theme";
import { Timetable } from "../../types/timetable";

interface TimetableOverviewProps {
  official: Timetable | null;
  personal: Timetable | null;
  groups: any[];
  loadingPersonal: boolean;
  loadingGroups: boolean;
  loadingOfficial: boolean;
  onSelect: (timetable: Timetable) => void;
  onCreatePersonal: () => void;
  onDeletePersonal: (id: string) => void;
  onAcceptInvitation: (groupId: string) => void;
  onRejectInvitation: (groupId: string) => void;
  onCreateGroup: () => void;
  onDeleteGroup: (group: any) => void;
  onSelectGroup: (group: any) => void;
}

export const TimetableOverview: React.FC<TimetableOverviewProps> = ({
  official,
  personal,
  groups,
  loadingPersonal,
  loadingGroups,
  loadingOfficial,
  onSelect,
  onCreatePersonal,
  onDeletePersonal,
  onAcceptInvitation,
  onRejectInvitation,
  onCreateGroup,
  onDeleteGroup,
  onSelectGroup,
}) => {
  const theme = useTheme();

  const invitations = groups.filter(g => g.pivot?.invitation_status === 'pending');
  const activeGroups = groups.filter(g => g.pivot?.invitation_status === 'accepted');

  if (loadingOfficial && !official) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (!official) {
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.iconBox, { backgroundColor: addAlpha(theme.colors.error, 0.1) }]}>
          <Calendar size={48} color={theme.colors.error} />
        </View>
        <Text variant="headlineSmall" style={styles.emptyTitle}>Not Published Yet</Text>
        <Text variant="bodyMedium" style={styles.emptyText}>
          Sorry, please wait for the official timetable to be published for this event.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="titleMedium" style={styles.sectionTitle}>Official Schedule</Text>
      <Card
        style={styles.card}
        onPress={() => onSelect(official)}
      >
        <Card.Title
          title={official.name}
          subtitle="Official Event Timetable"
          left={(props) => <Globe {...props} size={24} color={theme.colors.primary} />}
          right={(props) => <IconButton {...props} icon="chevron-right" />}
        />
      </Card>

      {invitations.length > 0 && (
        <>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Invitations ({invitations.length})
          </Text>
          {invitations.map(group => (
            <Card key={group.id} style={[styles.card, { borderLeftWidth: 4, borderLeftColor: theme.colors.primary }]}>
              <Card.Title
                title={group.name}
                subtitle={`Invited by ${group.owner?.name}`}
                left={(props) => <Users {...props} size={24} color={theme.colors.primary} />}
              />
              <Card.Actions>
                <Button mode="text" onPress={() => onRejectInvitation(group.id)}>Decline</Button>
                <Button mode="contained" onPress={() => onAcceptInvitation(group.id)}>Accept</Button>
              </Card.Actions>
            </Card>
          ))}
        </>
      )}

      <View style={styles.sectionHeader}>
        <Text variant="titleMedium" style={styles.sectionTitle}>My Timetables</Text>
        {loadingPersonal && <ActivityIndicator size="small" color={theme.colors.primary} />}
      </View>

      {personal ? (
        <Card 
          style={styles.card} 
          onPress={() => onSelect(personal)}
          onLongPress={() => onDeletePersonal(personal.id)}
        >
          <Card.Title
            title={personal.name || "Personal Timetable"}
            subtitle="Your custom schedule • Long press to delete"
            left={(props) => <Calendar {...props} size={24} color={theme.colors.primary} />}
            right={(props) => <IconButton {...props} icon="chevron-right" />}
          />
        </Card>
      ) : (
        <TouchableOpacity 
          style={styles.createPlaceholder} 
          onPress={onCreatePersonal}
          disabled={loadingPersonal}
        >
          {loadingPersonal ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <>
              <Calendar size={24} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={{ color: theme.colors.primary, marginTop: 4 }}>
                Create your personal timetable
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <View style={styles.sectionHeader}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Groups</Text>
        {loadingGroups && <ActivityIndicator size="small" color={theme.colors.primary} />}
      </View>
      
      {activeGroups.map(group => (
        <Card 
          key={group.id} 
          style={styles.card} 
          onPress={() => onSelectGroup(group)}
          onLongPress={() => onDeleteGroup(group)}
        >
          <Card.Title
            title={group.name}
            subtitle={`${group.timetables?.length || 0} Timetables • Long press to delete`}
            left={(props) => <Users {...props} size={24} color={theme.colors.primary} />}
            right={(props) => <IconButton {...props} icon="chevron-right" />}
          />
        </Card>
      ))}

      <TouchableOpacity 
        style={[styles.createPlaceholder, { height: activeGroups.length > 0 ? 80 : 100 }]} 
        onPress={onCreateGroup}
        disabled={loadingGroups}
      >
        {loadingGroups ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <>
            <Users size={activeGroups.length > 0 ? 20 : 24} color={theme.colors.primary} />
            <Text 
              variant={activeGroups.length > 0 ? "bodySmall" : "bodyMedium"} 
              style={{ color: theme.colors.primary, marginTop: 4 }}
            >
              {activeGroups.length > 0 ? "Create another group" : "Create your first group"}
            </Text>
          </>
        )}
      </TouchableOpacity>
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
  createPlaceholderSmall: {
    height: 48,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: addAlpha("#000", 0.1),
    borderRadius: 16,
    flexDirection: 'row',
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
    fontWeight: "900",
    marginBottom: 12,
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.7,
    lineHeight: 22,
  },
});

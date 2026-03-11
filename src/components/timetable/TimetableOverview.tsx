import React from "react";
import { StyleSheet, View, TouchableOpacity, ScrollView } from "react-native";
import { Text, useTheme, ActivityIndicator, IconButton, Card, Button } from "react-native-paper";
import { Calendar, User, Users, ChevronRight, Plus, Globe } from "lucide-react-native";
import { addAlpha } from "../../utils/theme";
import { Timetable } from "../../types/timetable";

interface TimetableOverviewProps {
  official: Timetable | null;
  personal: Timetable | null;
  loading: boolean;
  onSelect: (timetable: Timetable) => void;
  onCreatePersonal: () => void;
}

export const TimetableOverview: React.FC<TimetableOverviewProps> = ({
  official,
  personal,
  loading,
  onSelect,
  onCreatePersonal,
}) => {
  const theme = useTheme();

  if (loading && !official) {
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

      <View style={styles.sectionHeader}>
        <Text variant="titleMedium" style={styles.sectionTitle}>My Timetables</Text>
        {!personal && (
          <Button 
            mode="text" 
            onPress={onCreatePersonal}
            icon={() => <Plus size={18} color={theme.colors.primary} />}
          >
            Create
          </Button>
        )}
      </View>

      {personal ? (
        <Card
          style={styles.card}
          onPress={() => onSelect(personal)}
        >
          <Card.Title
            title={personal.name}
            subtitle="Personal Schedule"
            left={(props) => <User {...props} size={24} color={theme.colors.secondary} />}
            right={(props) => <IconButton {...props} icon="chevron-right" />}
          />
        </Card>
      ) : (
        <TouchableOpacity style={styles.createPlaceholder} onPress={onCreatePersonal}>
          <Plus size={32} color={theme.colors.outline} />
          <Text variant="bodyMedium" style={{ color: theme.colors.outline, marginTop: 8 }}>
            Create personal timetable
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.sectionHeader}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Groups</Text>
        <Text variant="bodySmall" style={{ color: theme.colors.outline }}>Coming Soon</Text>
      </View>
      
      <Card style={[styles.card, { opacity: 0.5 }]} disabled>
         <Card.Title
            title="Shared Force"
            subtitle="Group Timetable (Disabled)"
            left={(props) => <Users {...props} size={24} color={theme.colors.outline} />}
            right={(props) => <IconButton {...props} icon="lock" />}
          />
      </Card>
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

import { Sparkles } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Text, TouchableRipple, useTheme } from "react-native-paper";
import { Event } from "../../types/event";
import { EventCard } from "../event/EventCard";

interface SuggestedEventsProps {
  events: Event[];
  onRefresh?: () => void;
  refreshing?: boolean;
  onEventPress?: (event: Event) => void;
}

export const SuggestedEvents: React.FC<SuggestedEventsProps> = ({
  events,
  onRefresh,
  refreshing,
  onEventPress,
}) => {
  const theme = useTheme();

  if (events.length === 0 && !refreshing) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Sparkles size={20} color={theme.colors.primary} />
          <Text variant="headlineSmall" style={styles.title}>
            Suggested for You
          </Text>
        </View>
        <TouchableRipple onPress={onRefresh} style={styles.refreshButton}>
          <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
            Refresh
          </Text>
        </TouchableRipple>
      </View>

      <View style={styles.list}>
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            variant="compact"
            onPress={onEventPress}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  refreshButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  list: {
    gap: 12,
  },
});

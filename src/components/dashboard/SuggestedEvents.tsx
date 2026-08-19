import { Sparkles } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Text, Pressable } from "@gluestack-ui/themed";
import { useAppTheme } from "../../context/ThemeProvider";
import { useTranslation } from "react-i18next";
import { Event } from "../../types/event";
import { EventHorizontalCard } from "../event/EventHorizontalCard";
import { EventHorizontalCardSkeleton } from "./EventHorizontalCardSkeleton";

interface SuggestedEventsProps {
  events: Event[];
  onRefresh?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  onEventPress?: (event: Event) => void;
}

export const SuggestedEvents: React.FC<SuggestedEventsProps> = ({
  events,
  onRefresh,
  refreshing,
  loading = false,
  onEventPress,
}) => {
  const { t } = useTranslation();
  const theme = useAppTheme();

  if (!loading && events.length === 0 && !refreshing) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Sparkles size={20} color={theme.colors.primary} />
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            {t("dashboard.suggested")}
          </Text>
        </View>
        <Pressable onPress={onRefresh} style={styles.refreshButton}>
          <Text style={{ color: theme.colors.primary, fontWeight: "600" }}>
            {t("common.next")}
          </Text>
        </Pressable>
      </View>

      <View style={styles.list}>
        {loading ? (
          <>
            <EventHorizontalCardSkeleton />
            <EventHorizontalCardSkeleton />
            <EventHorizontalCardSkeleton />
          </>
        ) : (
          events.map((event) => (
            <EventHorizontalCard
              key={event.id}
              event={event}
              onPress={onEventPress}
            />
          ))
        )}
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
    fontSize: 22,
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


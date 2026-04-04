import { MapPin, Users } from "lucide-react-native";
import React from "react";
import { StyleSheet, View, StyleProp, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { Card, Surface, Text, TouchableRipple, useTheme } from "react-native-paper";
import { Event } from "../../types/event";
import { resolveMediaUrl } from "../../utils/format";

interface EventHorizontalCardProps {
  event: Event;
  onPress?: (event: Event) => void;
  style?: StyleProp<ViewStyle>;
}

export const EventHorizontalCard: React.FC<EventHorizontalCardProps> = ({
  event,
  onPress,
  style,
}) => {
  const theme = useTheme();
  const bannerUrl = resolveMediaUrl(event.banner?.url);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface },
        style,
      ]}
      elevation={1}
    >
      <TouchableRipple
        onPress={() => onPress?.(event)}
        rippleColor="rgba(0,0,0,0.1)"
        style={styles.ripple}
        accessibilityLabel={`${event.name}, ${event.location}, ${event.attendee_count ?? 0} attending`}
        accessibilityRole="button"
        accessibilityHint="Opens event details"
      >
        <View style={styles.horizontalContainer}>
          <View style={styles.imageContainer}>
            {bannerUrl ? (
              <Image source={{ uri: bannerUrl }} style={styles.image} />
            ) : (
              <View
                style={[
                  styles.image,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
              />
            )}
            <View style={styles.overlay} />
            <Surface style={styles.dateBadge} elevation={4}>
              <Text variant="labelSmall" style={styles.dateText}>
                {formatDate(event.start_date)}
              </Text>
            </Surface>
          </View>

          <View
            style={styles.content}
            accessibilityLabel={`${event.name} event details`}
            accessibilityLiveRegion="polite"
          >
            <Text variant="titleMedium" style={styles.title} numberOfLines={1}>
              {event.name}
            </Text>

            {event.genres && event.genres.length > 0 && (
              <View style={[styles.genreBadgeCard, { backgroundColor: theme.colors.primaryContainer }]}>
                <Text variant="labelSmall" style={[styles.genreTextCard, { color: theme.colors.onPrimaryContainer }]}>
                  {event.genres[0].name}
                </Text>
              </View>
            )}

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <MapPin size={14} color={theme.colors.primary} />
                <Text
                  variant="bodySmall"
                  style={styles.metaText}
                  numberOfLines={1}
                >
                  {event.location}
                </Text>
              </View>

              <View style={styles.metaItem}>
                <Users size={14} color={theme.colors.primary} />
                <Text variant="bodySmall" style={styles.metaText}>
                  {event.attendee_count ?? 0} attending
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableRipple>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginVertical: 4,
    overflow: "hidden",
  },
  ripple: {
    borderRadius: 16,
  },
  horizontalContainer: {
    flexDirection: "row",
  },
  imageContainer: {
    height: 100,
    width: 100,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  dateBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  dateText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 10,
  },
  content: {
    padding: 12,
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontWeight: "900",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: "column",
    gap: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    opacity: 0.7,
    fontWeight: "600",
    fontSize: 12,
  },
  genreBadgeCard: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  genreTextCard: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});

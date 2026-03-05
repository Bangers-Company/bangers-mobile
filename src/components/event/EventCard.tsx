import { Calendar, ChevronRight, MapPin } from "lucide-react-native";
import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { Card, Text, TouchableRipple, useTheme } from "react-native-paper";
import { Event } from "../../types/event";
import { resolveMediaUrl } from "../../utils/format";

interface EventCardProps {
  event: Event;
  onPress?: (event: Event) => void;
  variant?: "featured" | "compact";
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onPress,
  variant = "compact",
}) => {
  const theme = useTheme();
  const bannerUrl = resolveMediaUrl(event.banner?.url);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (variant === "featured") {
    return (
      <TouchableRipple
        onPress={() => onPress?.(event)}
        style={styles.featuredContainer}
        rippleColor="rgba(255, 255, 255, .2)"
      >
        <Card style={styles.featuredCard}>
          <View style={styles.imageWrapper}>
            {bannerUrl ? (
              <Image source={{ uri: bannerUrl }} style={styles.featuredImage} />
            ) : (
              <View
                style={[
                  styles.placeholderImage,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
              />
            )}
            <View style={styles.overlay} />
            <View style={styles.featuredContent}>
              <View style={styles.dateBadge}>
                <Text variant="labelLarge" style={styles.dateText}>
                  {formatDate(event.start_date)}
                </Text>
              </View>
              <Text variant="headlineSmall" style={styles.featuredTitle}>
                {event.name}
              </Text>
              <View style={styles.locationRow}>
                <MapPin size={14} color="rgba(255,255,255,0.8)" />
                <Text variant="bodySmall" style={styles.featuredLocation}>
                  {event.location}
                </Text>
              </View>
            </View>
          </View>
        </Card>
      </TouchableRipple>
    );
  }

  return (
    <TouchableRipple
      onPress={() => onPress?.(event)}
      style={styles.compactRipple}
      rippleColor="rgba(0, 0, 0, .05)"
    >
      <Card
        style={[
          styles.compactCard,
          { borderColor: theme.colors.outlineVariant },
        ]}
      >
        <View style={styles.compactRow}>
          {bannerUrl ? (
            <Image source={{ uri: bannerUrl }} style={styles.compactImage} />
          ) : (
            <View
              style={[
                styles.compactImage,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
            />
          )}
          <View style={styles.compactContent}>
            <Text
              variant="titleMedium"
              style={styles.compactTitle}
              numberOfLines={1}
            >
              {event.name}
            </Text>
            <View style={styles.compactMeta}>
              <View style={styles.metaItem}>
                <Calendar size={12} color={theme.colors.outline} />
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.outline }}
                >
                  {formatDate(event.start_date)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <MapPin size={12} color={theme.colors.outline} />
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.outline }}
                  numberOfLines={1}
                >
                  {event.location}
                </Text>
              </View>
            </View>
          </View>
          <ChevronRight size={18} color={theme.colors.outline} />
        </View>
      </Card>
    </TouchableRipple>
  );
};

const styles = StyleSheet.create({
  featuredContainer: {
    marginVertical: 8,
    borderRadius: 24,
    overflow: "hidden",
  },
  featuredCard: {
    borderRadius: 24,
    height: 220,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  imageWrapper: {
    flex: 1,
    position: "relative",
  },
  featuredImage: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholderImage: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  featuredContent: {
    flex: 1,
    padding: 16,
    justifyContent: "flex-end",
  },
  dateBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  dateText: {
    color: "#fff",
    fontWeight: "bold",
  },
  featuredTitle: {
    color: "#fff",
    fontWeight: "800",
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  featuredLocation: {
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  compactRipple: {
    marginVertical: 6,
    borderRadius: 16,
    overflow: "hidden",
  },
  compactCard: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 0,
    backgroundColor: "transparent",
  },
  compactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  compactImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  compactContent: {
    flex: 1,
    gap: 4,
  },
  compactTitle: {
    fontWeight: "700",
  },
  compactMeta: {
    flexDirection: "row",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});

import { MapPin, Users } from "lucide-react-native";
import React from "react";
import { StyleSheet, View, StyleProp, ViewStyle } from "react-native";
import { Image } from "expo-image";
import {
  Card,
  Surface,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import { Event } from "../../types/event";
import { resolveMediaUrl } from "../../utils/format";

interface EventListCardProps {
  event: Event;
  onPress?: (event: Event) => void;
  style?: StyleProp<ViewStyle>;
  variant?: "default" | "compact";
}

export const EventListCard: React.FC<EventListCardProps> = ({
  event,
  onPress,
  style,
  variant = "default",
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
        variant === "compact" && styles.compactCard,
        style,
      ]}
      elevation={variant === "compact" ? 1 : 2}
    >
      <TouchableRipple
        onPress={() => onPress?.(event)}
        rippleColor="rgba(0,0,0,0.1)"
        style={styles.ripple}
      >
        <View style={variant === "compact" ? styles.horizontalContainer : null}>
          {/* Banner Image with Date Overlay */}
          <View
            style={[
              styles.imageContainer,
              variant === "compact" && styles.compactImageContainer,
            ]}
          >
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
            <Surface
              style={[
                styles.dateBadge,
                variant === "compact" && styles.compactDateBadge,
              ]}
              elevation={4}
            >
              <Text
                variant={variant === "compact" ? "labelSmall" : "labelMedium"}
                style={styles.dateText}
              >
                {formatDate(event.start_date)}
              </Text>
            </Surface>
          </View>

          {/* Content Section */}
          <View
            style={[
              styles.content,
              variant === "compact" && styles.compactContent,
            ]}
          >
            <Text
              variant={variant === "compact" ? "titleMedium" : "titleLarge"}
              style={[
                styles.title,
                variant === "compact" && styles.compactTitle,
              ]}
              numberOfLines={1}
            >
              {event.name}
            </Text>

            <View
              style={[
                styles.metaRow,
                variant === "compact" && styles.compactMetaRow,
              ]}
            >
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
                  {variant === "compact"
                    ? (event.attendee_count ?? 0)
                    : `${event.attendee_count ?? 0} attending`}
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
    borderRadius: 24,
    marginVertical: 8,
    overflow: "hidden",
  },
  ripple: {
    borderRadius: 24,
  },
  imageContainer: {
    width: "100%",
    height: 180,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  dateBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  dateText: {
    color: "white",
    fontWeight: "bold",
  },
  content: {
    padding: 20,
  },
  title: {
    fontWeight: "900",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    opacity: 0.7,
    fontWeight: "600",
  },
  compactCard: {
    borderRadius: 16,
    marginVertical: 4,
  },
  compactImageContainer: {
    height: 100,
    width: 100,
  },
  compactDateBadge: {
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  compactContent: {
    padding: 12,
    flex: 1,
    justifyContent: "center",
  },
  compactTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  horizontalContainer: {
    flexDirection: "row",
  },
  compactMetaRow: {
    flexDirection: "column",
    gap: 4,
    alignItems: "flex-start",
  },
});

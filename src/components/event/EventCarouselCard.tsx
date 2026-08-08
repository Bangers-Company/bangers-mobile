import { MapPin, Users } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Box, Text, Pressable } from "@gluestack-ui/themed";
import { useAppTheme } from "../../context/ThemeProvider";
import Animated, {
  Extrapolate,
  SharedValue,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Event } from "../../types/event";
import { resolveMediaUrl } from "../../utils/format";

interface EventCarouselCardProps {
  event: Event;
  index: number;
  scrollX: SharedValue<number>;
  snapToInterval: number;
  cardWidth: number;
  cardMargin: number;
  onPress?: (event: Event) => void;
}

export const EventCarouselCard: React.FC<EventCarouselCardProps> = ({
  event,
  index,
  scrollX,
  snapToInterval,
  cardWidth,
  cardMargin,
  onPress,
}) => {
  const theme = useAppTheme();
  const bannerUrl = resolveMediaUrl(event.banner?.url);

  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * snapToInterval,
      index * snapToInterval,
      (index + 1) * snapToInterval,
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.9, 1, 0.9],
      Extrapolate.CLAMP,
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.6, 1, 0.6],
      Extrapolate.CLAMP,
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          width: cardWidth,
          marginHorizontal: cardMargin,
          // @ts-ignore - Web only
          scrollSnapAlign: "center",
        },
      ]}
    >
      <Pressable onPress={() => onPress?.(event)}>
        <Box
          style={[styles.card, { backgroundColor: theme.colors.surface }]}
        >
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
            <Box style={styles.dateBadge}>
              <Text style={styles.dateText}>
                {new Date(event.start_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            </Box>
          </View>
          <View style={styles.content}>
            <Text style={styles.eventName} numberOfLines={1}>
              {event.name}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.locationRow}>
                <MapPin size={14} color={theme.colors.primary} />
                <Text
                  style={styles.location}
                  numberOfLines={1}
                >
                  {event.location}
                </Text>
              </View>
              <View style={styles.locationRow}>
                <Users size={14} color={theme.colors.primary} />
                <Text style={styles.location}>
                  {event.attendee_count ?? 0} attending
                </Text>
              </View>
            </View>

            {event.genres && event.genres.length > 0 && (
              <View style={styles.genreContainer}>
                {event.genres.slice(0, 2).map((genre) => (
                  <Box
                    key={genre.id}
                    style={[styles.genreBadge, { backgroundColor: theme.colors.primaryContainer }]}
                  >
                    <Text style={[styles.genreText, { color: theme.colors.onPrimaryContainer }]}>
                      {genre.name}
                    </Text>
                  </Box>
                ))}
              </View>
            )}
          </View>
        </Box>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  imageContainer: {
    height: 180,
    position: "relative",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.1)",
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
    fontSize: 12,
  },
  content: {
    padding: 20,
  },
  eventName: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  location: {
    fontSize: 12,
    opacity: 0.7,
    fontWeight: "600",
  },
  genreContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  genreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  genreText: {
    fontWeight: "bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});


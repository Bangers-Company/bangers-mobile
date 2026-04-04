import { Calendar, ChevronRight, MapPin } from "lucide-react-native";
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
import { Event as AppEvent } from "../../types/event";
import { resolveMediaUrl } from "../../utils/format";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface EventCardProps {
  event: AppEvent;
  onPress?: (event: AppEvent) => void;
  variant?: "featured" | "compact" | "horizontal";
  style?: StyleProp<ViewStyle>;
}

export const EventCardSkeleton: React.FC<{
  variant?: "featured" | "compact" | "horizontal";
  style?: StyleProp<ViewStyle>;
}> = ({ variant = "compact", style }) => {
  const theme = useTheme();

  const opacity = useRepeatTiming(0.4, 0.7, 1000);
  const scale = useRepeatTiming(0.98, 1, 1000);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const skeletonColor = theme.colors.primaryContainer;

  if (variant === "horizontal") {
    return (
      <Animated.View
        style={[
          styles.horizontalSkeleton,
          animatedStyle,
          { backgroundColor: skeletonColor },
          style,
        ]}
      />
    );
  }

  if (variant === "featured") {
    return (
      <Animated.View
        style={[
          styles.featuredSkeleton,
          animatedStyle,
          { backgroundColor: skeletonColor },
          style,
        ]}
      />
    );
  }

  return (
    <Animated.View
      style={[
        styles.compactSkeleton,
        animatedStyle,
        { backgroundColor: skeletonColor },
        style,
      ]}
    />
  );
};

// Helper hook for repetition
const useRepeatTiming = (from: number, to: number, duration: number) => {
  const value = useSharedValue(from);

  React.useEffect(() => {
    value.value = withRepeat(
      withSequence(
        withTiming(to, { duration }),
        withTiming(from, { duration }),
      ),
      -1,
      true,
    );
  }, []);

  return value;
};

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onPress,
  variant = "compact",
  style,
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

  if (variant === "horizontal") {
    return (
      <View style={[styles.horizontalCard, style]}>
        <TouchableRipple
          onPress={() => onPress?.(event)}
          style={StyleSheet.absoluteFill}
          rippleColor="rgba(255, 255, 255, .2)"
        >
          <Surface style={styles.horizontalSurface} elevation={1}>
            {bannerUrl ? (
              <Image
                source={{ uri: bannerUrl }}
                style={styles.horizontalImage}
              />
            ) : (
              <View
                style={[
                  styles.horizontalImage,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
              />
            )}
            <View style={styles.overlay} />
            <View style={styles.horizontalContent}>
              <Text
                variant="titleMedium"
                style={styles.horizontalTitle}
                numberOfLines={1}
              >
                {event.name || "Untitled Event"}
              </Text>
              <View style={styles.locationRow}>
                <MapPin size={12} color="rgba(255,255,255,0.9)" />
                <Text
                  variant="bodySmall"
                  style={styles.horizontalLocation}
                  numberOfLines={1}
                >
                  {event.location || "No location"}
                </Text>
              </View>
            </View>
          </Surface>
        </TouchableRipple>
      </View>
    );
  }

  if (variant === "featured") {
    return (
      <TouchableRipple
        onPress={() => onPress?.(event)}
        style={[styles.featuredContainer, style]}
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
      style={[styles.compactRipple, style]}
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
  horizontalCard: {
    width: 200,
    height: 120,
    borderRadius: 16,
    overflow: "hidden",
  },
  horizontalSurface: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  horizontalImage: {
    ...StyleSheet.absoluteFillObject,
  },
  horizontalContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    justifyContent: "flex-end",
  },
  horizontalTitle: {
    color: "#fff",
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  horizontalLocation: {
    color: "rgba(255,255,255,0.9)",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  horizontalSkeleton: {
    width: 200,
    height: 120,
    borderRadius: 16,
  },
  featuredSkeleton: {
    width: "100%",
    height: 220,
    borderRadius: 24,
    marginVertical: 8,
  },
  compactSkeleton: {
    width: "100%",
    height: 84,
    borderRadius: 16,
    marginVertical: 6,
  },
});

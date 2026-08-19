import { Box, Pressable, Text } from "@gluestack-ui/themed";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar, MapPin, Sparkles, UserCheck, Users } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import Animated, {
  Extrapolate,
  SharedValue,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useAppTheme } from "../../context/ThemeProvider";
import { Event } from "../../types/event";
import { formatDateRange, resolveMediaUrl } from "../../utils/format";
import { addAlpha } from "../../utils/theme";

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
  const { t } = useTranslation();
  const theme = useAppTheme();
  const bannerUrl = resolveMediaUrl(event.banner?.url);
  const dateFormatted = formatDateRange(event.start_date, event.end_date);

  const friendsCount = (event as any).friends_count ?? (event as any).friends_attending_count ?? 0;
  const attendeesCount = event.attendee_count ?? 0;

  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * snapToInterval,
      index * snapToInterval,
      (index + 1) * snapToInterval,
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.93, 1, 0.93],
      Extrapolate.CLAMP,
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.7, 1, 0.7],
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
          style={[
            styles.cardContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: addAlpha(theme.colors.primary, 0.35),
              shadowColor: theme.colors.primary,
            },
          ]}
        >
          {/* Banner Image Container */}
          <View style={styles.imageWrapper}>
            {bannerUrl ? (
              <ExpoImage
                source={{ uri: bannerUrl }}
                style={styles.bannerImage}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <View
                style={[
                  styles.bannerImage,
                  { backgroundColor: addAlpha(theme.colors.primary, 0.25) },
                ]}
              />
            )}

            {/* Gradient Dark Overlay */}
            <LinearGradient
              colors={["rgba(0,0,0,0.45)", "transparent", "rgba(0,0,0,0.85)"]}
              style={styles.gradientOverlay}
            />

            {/* Top Floating Date Badge */}
            <View style={styles.topBadgeRow}>
              {event.genres && event.genres.length > 0 && (
                <View
                  style={[
                    styles.genreTag,
                    {
                      backgroundColor: addAlpha(theme.colors.primary, 0.85),
                      borderColor: theme.colors.primary,
                    },
                  ]}
                >
                  <Sparkles size={11} color="#ffffff" />
                  <Text style={styles.genreTagText}>
                    {event.genres[0].name}
                  </Text>
                </View>
              )}
              <View
                style={[
                  styles.datePill,
                  {
                    backgroundColor: "rgba(18, 18, 20, 0.75)",
                    borderColor: addAlpha("#ffffff", 0.2),
                  },
                ]}
              >
                <Calendar size={13} color="#ffffff" />
                <Text style={styles.datePillText}>{dateFormatted}</Text>
              </View>
            </View>

            {/* Title & Location Overlay inside Hero */}
            <View style={styles.imageBottomContent}>
              <Text style={styles.eventTitle} numberOfLines={2}>
                {event.name}
              </Text>
              {event.location && (
                <View style={styles.locationRow}>
                  <MapPin size={14} color={theme.colors.primary} />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {event.location}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Social Stats & Attendees Footer */}
          <View style={styles.footerDetails}>
            <View style={styles.statsRow}>
              {/* Attendees Pill */}
              <View
                style={[
                  styles.statPill,
                  {
                    backgroundColor: addAlpha(theme.colors.onSurface, 0.06),
                    borderColor: addAlpha(theme.colors.onSurface, 0.1),
                  },
                ]}
              >
                <Users size={14} color={theme.colors.primary} />
                <Text style={[styles.statText, { color: theme.colors.onSurface }]}>
                  {attendeesCount} {t("events.attendees")}
                </Text>
              </View>

              {/* Friends Going Pill */}
              <View
                style={[
                  styles.statPill,
                  {
                    backgroundColor: addAlpha(theme.colors.primary, 0.12),
                    borderColor: addAlpha(theme.colors.primary, 0.3),
                  },
                ]}
              >
                <UserCheck size={14} color={theme.colors.primary} />
                <Text style={[styles.statText, { color: theme.colors.primary }]}>
                  {friendsCount > 0 ? `${friendsCount} ${t('profile.stats.friends')}` : `0 ${t('profile.stats.friends')}`}
                </Text>
              </View>
            </View>
          </View>
        </Box>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  imageWrapper: {
    height: 220,
    position: "relative",
    justifyContent: "space-between",
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    zIndex: 10,
  },
  genreTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
  },
  genreTagText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    marginLeft: "auto",
  },
  datePillText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  imageBottomContent: {
    padding: 16,
    zIndex: 10,
    gap: 4,
  },
  eventTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.6,
    lineHeight: 26,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  locationText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 13,
    fontWeight: "600",
  },
  footerDetails: {
    padding: 14,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  statText: {
    fontSize: 12,
    fontWeight: "700",
  },
});

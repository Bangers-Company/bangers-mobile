import { Box, Pressable, Text } from "@gluestack-ui/themed";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar, MapPin, UserCheck, Users } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { useAppTheme } from "../../context/ThemeProvider";
import { Event } from "../../types/event";
import { formatDateRange, resolveMediaUrl } from "../../utils/format";
import { addAlpha } from "../../utils/theme";

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
  const { t } = useTranslation();
  const theme = useAppTheme();
  const bannerUrl = resolveMediaUrl(event.banner?.url);
  const dateFormatted = formatDateRange(event.start_date, event.end_date);

  const friendsCount = (event as any).friends_count ?? (event as any).friends_attending_count ?? 0;
  const attendeesCount = event.attendee_count ?? 0;

  return (
    <Box
      style={[
        styles.cardContainer,
        {
          backgroundColor: theme.colors.surface,
          borderColor: addAlpha(theme.colors.primary, 0.35),
          shadowColor: theme.colors.primary,
        },
        style,
      ]}
    >
      <Pressable
        onPress={() => onPress?.(event)}
        style={styles.pressable}
      >
        <View style={styles.horizontalRow}>
          {/* Banner Thumbnail */}
          <View style={styles.imageWrapper}>
            {bannerUrl ? (
              <ExpoImage
                source={{ uri: bannerUrl }}
                style={styles.image}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <View
                style={[
                  styles.image,
                  { backgroundColor: addAlpha(theme.colors.primary, 0.2) },
                ]}
              />
            )}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.6)"]}
              style={styles.imageGradient}
            />

            {event.genres && event.genres.length > 0 && (
              <View
                style={[
                  styles.genreChip,
                  { backgroundColor: addAlpha(theme.colors.primary, 0.85) },
                ]}
              >
                <Text style={styles.genreText}>
                  {event.genres[0].name}
                </Text>
              </View>
            )}
          </View>

          {/* Details Content */}
          <View style={styles.contentBody}>
            <Text style={[styles.title, { color: theme.colors.onSurface }]} numberOfLines={1}>
              {event.name}
            </Text>

            {/* Date Range Row */}
            <View style={styles.infoRow}>
              <Calendar size={13} color={theme.colors.primary} />
              <Text style={[styles.infoText, { color: theme.colors.primary, fontWeight: "700" }]}>
                {dateFormatted}
              </Text>
            </View>

            {/* Location Row */}
            {event.location && (
              <View style={styles.infoRow}>
                <MapPin size={13} color={addAlpha(theme.colors.onSurface, 0.65)} />
                <Text style={[styles.infoText, { color: addAlpha(theme.colors.onSurface, 0.7) }]} numberOfLines={1}>
                  {event.location}
                </Text>
              </View>
            )}

            {/* Attendance & Friends Row */}
            <View style={styles.statsRow}>
              <View style={styles.statBadge}>
                <Users size={12} color={theme.colors.primary} />
                <Text style={[styles.statText, { color: theme.colors.onSurface }]}>
                  {attendeesCount}
                </Text>
              </View>

              <View style={styles.statBadge}>
                <UserCheck size={12} color={theme.colors.primary} />
                <Text style={[styles.statText, { color: theme.colors.primary }]}>
                  {friendsCount > 0 ? `${friendsCount} ${t("profile.stats.friends")}` : `0 ${t("profile.stats.friends")}`}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </Box>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    marginVertical: 4,
  },
  pressable: {
    borderRadius: 20,
  },
  horizontalRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    gap: 12,
  },
  imageWrapper: {
    width: 104,
    height: 104,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  genreChip: {
    position: "absolute",
    bottom: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  genreText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  contentBody: {
    flex: 1,
    gap: 3,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  infoText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(128,128,128,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statText: {
    fontSize: 11,
    fontWeight: "700",
  },
});

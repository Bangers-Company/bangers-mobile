import { MapPin, Users, UserCheck, Calendar } from "lucide-react-native";
import React from "react";
import { StyleSheet, View, StyleProp, ViewStyle } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Box, Text, Pressable } from "@gluestack-ui/themed";
import { useAppTheme } from "../../context/ThemeProvider";
import { Event } from "../../types/event";
import { resolveMediaUrl, formatDateRange } from "../../utils/format";
import { addAlpha } from "../../utils/theme";

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
          borderColor: addAlpha(theme.colors.onSurface, 0.12),
        },
        style,
      ]}
    >
      <Pressable onPress={() => onPress?.(event)} style={styles.pressable}>
        <View style={styles.cardInner}>
          {/* Banner Image */}
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
                  { backgroundColor: addAlpha(theme.colors.primary, 0.25) },
                ]}
              />
            )}
            <LinearGradient
              colors={["rgba(0,0,0,0.3)", "transparent", "rgba(0,0,0,0.7)"]}
              style={styles.gradientOverlay}
            />

            {/* Date Range Badge */}
            <View style={styles.topBadgeRow}>
              <View
                style={[
                  styles.datePill,
                  {
                    backgroundColor: "rgba(18, 18, 20, 0.75)",
                    borderColor: addAlpha("#ffffff", 0.2),
                  },
                ]}
              >
                <Calendar size={12} color="#ffffff" />
                <Text style={styles.datePillText}>{dateFormatted}</Text>
              </View>
            </View>
          </View>

          {/* Content Body */}
          <View style={styles.contentBody}>
            <Text style={[styles.title, { color: theme.colors.onSurface }]} numberOfLines={1}>
              {event.name}
            </Text>

            <View style={styles.metaRow}>
              {event.location && (
                <View style={styles.metaItem}>
                  <MapPin size={13} color={theme.colors.primary} />
                  <Text style={[styles.metaText, { color: addAlpha(theme.colors.onSurface, 0.7) }]} numberOfLines={1}>
                    {event.location}
                  </Text>
                </View>
              )}

              <View style={styles.metaItem}>
                <Users size={13} color={theme.colors.primary} />
                <Text style={[styles.metaText, { color: addAlpha(theme.colors.onSurface, 0.7) }]}>
                  {attendeesCount} attending
                </Text>
              </View>

              <View style={styles.metaItem}>
                <UserCheck size={13} color={theme.colors.primary} />
                <Text style={[styles.metaText, { color: theme.colors.primary, fontWeight: "700" }]}>
                  {friendsCount > 0 ? `${friendsCount} friends` : "0 friends"}
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
    borderRadius: 22,
    borderWidth: 1,
    marginVertical: 6,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  pressable: {
    borderRadius: 22,
  },
  cardInner: {
    overflow: "hidden",
  },
  imageWrapper: {
    width: "100%",
    height: 160,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topBadgeRow: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
  },
  datePillText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
  contentBody: {
    padding: 14,
    gap: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

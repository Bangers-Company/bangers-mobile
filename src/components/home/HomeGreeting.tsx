import { Image as ExpoImage } from "expo-image";
import { Calendar, ChevronRight, MapPin, Radio, Sparkles } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import { useAppTheme } from "../../context/ThemeProvider";
import { Event } from "../../types/event";
import { formatDateRange, resolveMediaUrl } from "../../utils/format";
import { addAlpha } from "../../utils/theme";

interface HomeGreetingProps {
  event: Event | null;
  onPress: () => void;
}

export const HomeGreeting: React.FC<HomeGreetingProps> = ({ event, onPress }) => {
  const { t, i18n } = useTranslation();
  const theme = useAppTheme();

  if (!event) return null;

  const imageUrl = event.banner?.url
    ? resolveMediaUrl(event.banner.url)
    : (event as any).image_url || null;

  const dateFormatted = formatDateRange(event.start_date, event.end_date, i18n.language);

  return (
    <View style={styles.outerPadding}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.82}
        style={[
          styles.glassCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.primary,
          },
        ]}
      >
        {/* Top Header Row with Badges */}
        <View style={styles.topRow} pointerEvents="none">
          <View
            style={[
              styles.liveBadge,
              {
                backgroundColor: "transparent",
                borderColor: addAlpha(theme.colors.primary, 0.5),
              },
            ]}
          >
            <Sparkles size={12} color={theme.colors.primary} />
            <Text style={[styles.liveText, { color: theme.colors.primary }]}>
              {t("dashboard.happeningToday") || "HAPPENING TODAY"}
            </Text>
          </View>

          {dateFormatted ? (
            <View style={styles.dateBadge}>
              <Calendar size={12} color={addAlpha(theme.colors.onSurface, 0.7)} />
              <Text style={[styles.dateText, { color: addAlpha(theme.colors.onSurface, 0.75) }]}>
                {dateFormatted}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Main Body Row: Image + Text Details + Vertically Centered Right Arrow */}
        <View style={styles.contentRow} pointerEvents="none">
          {imageUrl ? (
            <ExpoImage
              source={{ uri: imageUrl }}
              style={styles.eventImage}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.eventImageFallback}>
              <Radio size={22} color={theme.colors.primary} />
            </View>
          )}

          <View style={styles.textWrapper}>
            <Text
              style={[styles.eventTitle, { color: theme.colors.onSurface }]}
              numberOfLines={1}
            >
              {event.name}
            </Text>

            {event.location && (
              <View style={styles.locationRow}>
                <MapPin size={11} color={addAlpha(theme.colors.onSurface, 0.65)} />
                <Text
                  style={[
                    styles.locationText,
                    { color: addAlpha(theme.colors.onSurface, 0.65) },
                  ]}
                  numberOfLines={1}
                >
                  {event.location}
                </Text>
              </View>
            )}

            <Text style={[styles.actionText, { color: theme.colors.primary }]}>
              {t("dashboard.tapToView") || "Tap to open timetable schedule →"}
            </Text>
          </View>

          {/* Vertically Centered Arrow on Right */}
          <View style={styles.chevronCircle}>
            <ChevronRight size={18} color={theme.colors.primary} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  outerPadding: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  glassCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 12,
    gap: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    gap: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    fontWeight: "700",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  eventImage: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
  eventImageFallback: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(150, 150, 150, 0.2)",
  },
  textWrapper: {
    flex: 1,
    gap: 2,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 11.5,
    fontWeight: "600",
  },
  actionText: {
    fontSize: 10.5,
    fontWeight: "800",
    marginTop: 1,
  },
  chevronCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
});

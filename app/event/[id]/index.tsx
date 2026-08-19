import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Calendar, Heart, MapPin, Users, Share2, Sparkles, ChevronRight, Check, Plus, ChevronLeft } from "lucide-react-native";
import React, { useState, useRef, useEffect, useCallback } from "react";
import ContentLoader, { Rect } from "react-content-loader/native";
import { Dimensions, Image, RefreshControl, StyleSheet, View, ScrollView, Pressable as RNPressable, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { Button, IconButton, Surface, Text, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Droplet } from "../../../src/components/ui/Droplet";
import { useDashboardData } from "../../../src/hooks/useDashboardData";
import { useAuthStore } from "../../../src/store/useAuthStore";
import { resolveMediaUrl, formatDate } from "../../../src/utils/format";
import { addAlpha } from "../../../src/utils/theme";
import Animated, { useAnimatedScrollHandler, runOnJS } from "react-native-reanimated";
import { useSharedScroll } from "../../../src/hooks/useSharedScroll";
import { AnimatedCounter } from "../../../src/components/ui/AnimatedCounter";
import { useQueryClient } from "@tanstack/react-query";
import { useEvent, useAttendees } from "../../../src/hooks/useEvent";
import { useAttendance } from "../../../src/hooks/useAttendance";
import { Act } from "../../../src/types/act";
import { Pressable } from "@gluestack-ui/themed";

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [showDroplet, setShowDroplet] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const currentUser = useAuthStore((state) => state.user);
  const { refresh: refreshDashboard } = useDashboardData();
  const scrollOffset = useSharedScroll();
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchEventData = useCallback((force = false) => {
    if (force) {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['attendees', id] });
    }
  }, [id, queryClient]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEventData();
    }, [fetchEventData])
  );

  const { data: event, isLoading: eventLoading, error: eventError } = useEvent(id as string);
  const { data: attendees = [] } = useAttendees(id as string);
  const { updateAttendance: updateAttendanceMutation, removeAttendance: removeAttendanceMutation } = useAttendance(id as string);
  
  const loading = eventLoading;
  const error = eventError ? (eventError as any).message : null;

  const isGoing = event?.user_status === "going";
  const isInterested = event?.user_status === "interested";

  const [actionLoading, setActionLoading] = useState(false);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (ev) => {
      scrollOffset.value = ev.contentOffset.y;
      
      if ((ev.contentOffset.y > 300) !== showDroplet) {
         runOnJS(setShowDroplet)(ev.contentOffset.y > 300);
      }
    },
  });

  const scrollToTop = () => {
    (scrollRef.current as any)?.scrollTo({ y: 0, animated: true });
  };

  const toggleAttendance = async (status: "going" | "interested") => {
    if (!event || !currentUser) return;

    try {
      setActionLoading(true);
      if (event.user_status === status) {
        await removeAttendanceMutation.mutateAsync();
      } else {
        await updateAttendanceMutation.mutateAsync(status);
      }
    } catch (err) {
      console.error("Failed to toggle attendance", err);
    } finally {
      setActionLoading(false);
    }
  };

  const { width } = Dimensions.get("window");

  if (error && !event) {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: theme.colors.background }]}>
        <Text variant="titleMedium" style={{ color: theme.colors.error }}>
          {error || "Event not found"}
        </Text>
        <Button
          mode="contained"
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.push("/(tabs)");
          }}
          style={{ marginTop: 16 }}
        >
          Go Back
        </Button>
      </View>
    );
  }

  if (loading && !event) {
    return (
      <View style={[styles.container, { flex: 1, backgroundColor: theme.colors.background }]}>
        <ContentLoader
          speed={2}
          width={width}
          height={800}
          viewBox={`0 0 ${width} 800`}
          backgroundColor="rgba(128,128,128,0.2)"
          foregroundColor="rgba(128,128,128,0.4)"
        >
          <Rect x="0" y="0" rx="0" ry="0" width={width} height="350" />
          <Rect x="20" y="370" rx="16" ry="16" width={width - 40} height="40" />
          <Rect x="20" y="425" rx="16" ry="16" width={width - 40} height="70" />
          <Rect x="20" y="510" rx="16" ry="16" width={width - 40} height="70" />
          <Rect x="20" y="595" rx="16" ry="16" width={width - 40} height="120" />
        </ContentLoader>
      </View>
    );
  }

  if (!event) return null;

  const bannerUrl = resolveMediaUrl(event.banner?.url);
  const startEndMerged =
    event.end_date && event.end_date !== event.start_date
      ? `${formatDate(event.start_date)} - ${formatDate(event.end_date)}`
      : formatDate(event.start_date);

  const acts = event.acts || [];
  const previewActs = acts.slice(0, 4);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Droplet
        visible={showDroplet}
        onPress={scrollToTop}
        position="top"
        topOffset={insets.top + 8}
      />

      <Animated.ScrollView
        ref={scrollRef as any}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 90 },
        ]}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={loading || false}
            onRefresh={() => {
              fetchEventData(true);
              refreshDashboard();
            }}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Parallax Hero Banner */}
        <View style={styles.heroBannerContainer}>
          {bannerUrl ? (
            <Image source={{ uri: bannerUrl }} style={styles.heroBannerImage} />
          ) : (
            <View
              style={[
                styles.heroBannerImage,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
            />
          )}
          <View style={styles.heroGradientOverlay} />

          {/* Hero Banner Floating Title */}
          <View style={styles.heroTitleContainer}>
            {event.genres && event.genres.length > 0 && (
              <View style={[styles.heroTagBadge, { backgroundColor: addAlpha(theme.colors.primary, 0.25), borderColor: theme.colors.primary }]}>
                <Sparkles size={12} color={theme.colors.primary} />
                <Text style={[styles.heroTagText, { color: theme.colors.primary }]}>
                  {event.genres[0].name}
                </Text>
              </View>
            )}
            <Text style={styles.heroEventTitle} numberOfLines={2}>
              {event.name}
            </Text>
          </View>
        </View>

        {/* Content Section Cards */}
        <View style={styles.contentBody}>
          {/* Glass Date & Location Card */}
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: addAlpha(theme.colors.surface, 0.88),
                borderColor: addAlpha(theme.colors.outline, 0.15),
              },
            ]}
          >
            <View style={styles.infoCardRow}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: addAlpha(theme.colors.primary, 0.12) },
                ]}
              >
                <Calendar size={22} color={theme.colors.primary} />
              </View>
              <View style={styles.infoTexts}>
                <Text style={[styles.infoTitle, { color: theme.colors.onSurface }]}>
                  {startEndMerged}
                </Text>
                <Text style={[styles.infoSubtitle, { color: addAlpha(theme.colors.onSurface, 0.6) }]}>
                  {t("profile.sections.date") || "Festival Dates"}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: addAlpha(theme.colors.outline, 0.1) }]} />

            <View style={styles.infoCardRow}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: addAlpha(theme.colors.primary, 0.12) },
                ]}
              >
                <MapPin size={22} color={theme.colors.primary} />
              </View>
              <View style={styles.infoTexts}>
                <Text style={[styles.infoTitle, { color: theme.colors.onSurface }]}>
                  {event.location}
                </Text>
                <Text style={[styles.infoSubtitle, { color: addAlpha(theme.colors.onSurface, 0.6) }]}>
                  {t("profile.sections.location") || "Location"}
                </Text>
              </View>
            </View>
          </View>

          {/* Social Attendance Card */}
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: addAlpha(theme.colors.surface, 0.88),
                borderColor: addAlpha(theme.colors.outline, 0.15),
              },
            ]}
          >
            <View style={styles.socialCardRow}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: addAlpha(theme.colors.primary, 0.12) },
                ]}
              >
                <Users size={22} color={theme.colors.primary} />
              </View>
              <View style={styles.infoTexts}>
                <View style={styles.attendeeCountRow}>
                  <AnimatedCounter
                    value={event.attendee_count ?? attendees.length}
                    variant="titleLarge"
                    textStyle={[styles.counterText, { color: theme.colors.onSurface }]}
                  />
                  <Text style={[styles.counterLabel, { color: addAlpha(theme.colors.onSurface, 0.6) }]}>
                    {t("common.going") || "Attending"}
                  </Text>
                </View>
                <Text style={[styles.infoSubtitle, { color: addAlpha(theme.colors.onSurface, 0.5) }]}>
                  {isGoing ? "You are attending this festival" : "Join party squad"}
                </Text>
              </View>

              <Pressable
                onPress={() => toggleAttendance("going")}
                disabled={actionLoading}
                style={[
                  styles.attendActionButton,
                  isGoing
                    ? {
                        backgroundColor: addAlpha(theme.colors.primary, 0.16),
                        borderColor: theme.colors.primary,
                      }
                    : {
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.primary,
                      },
                ]}
              >
                {isGoing ? (
                  <Check size={18} color={theme.colors.primary} />
                ) : (
                  <Plus size={18} color="#ffffff" />
                )}
                <Text
                  style={[
                    styles.attendActionText,
                    { color: isGoing ? theme.colors.primary : "#ffffff" },
                  ]}
                >
                  {isGoing ? t("common.going") : t("common.attend")}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Genres Section */}
          {event.genres && event.genres.length > 0 && (
            <View style={styles.genresContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.genresScroll}
              >
                {event.genres.map((genre) => (
                  <View
                    key={genre.id}
                    style={[
                      styles.genrePill,
                      {
                        backgroundColor: addAlpha(theme.colors.surface, 0.8),
                        borderColor: addAlpha(theme.colors.primary, 0.3),
                      },
                    ]}
                  >
                    <Text style={[styles.genreText, { color: theme.colors.primary }]}>
                      {genre.name}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* About Section */}
          {event.description && (
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: addAlpha(theme.colors.surface, 0.88),
                  borderColor: addAlpha(theme.colors.outline, 0.15),
                },
              ]}
            >
              <Text style={[styles.sectionHeading, { color: theme.colors.onSurface }]}>
                {t("profile.sections.about") || "About Event"}
              </Text>
              <Text style={[styles.descriptionBody, { color: addAlpha(theme.colors.onSurface, 0.8) }]}>
                {event.description}
              </Text>
            </View>
          )}

          {/* Lineup Highlights Section */}
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: addAlpha(theme.colors.surface, 0.88),
                borderColor: addAlpha(theme.colors.outline, 0.15),
              },
            ]}
          >
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeading, { color: theme.colors.onSurface }]}>
                {t("profile.sections.lineup") || "Lineup Highlights"}
              </Text>
              <Pressable
                onPress={() => router.navigate(`/event/${id}/lineup` as any)}
                style={styles.seeAllBtn}
              >
                <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
                  {t("profile.sections.viewLineup") || "View All"}
                </Text>
                <ChevronRight size={16} color={theme.colors.primary} />
              </Pressable>
            </View>

            {acts.length > 0 ? (
              <View style={styles.actGrid}>
                {previewActs.map((act: Act) => (
                  <View
                    key={act.id}
                    style={[
                      styles.actTile,
                      {
                        backgroundColor: addAlpha(theme.colors.surfaceVariant, 0.4),
                        borderColor: addAlpha(theme.colors.outline, 0.12),
                      },
                    ]}
                  >
                    <Text
                      style={[styles.actTileTitle, { color: theme.colors.onSurface }]}
                      numberOfLines={2}
                    >
                      {act.artists && act.artists.length > 0
                        ? act.artists[0].name
                        : act.name}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noLineupBox}>
                <Text style={{ color: addAlpha(theme.colors.onSurface, 0.6), fontSize: 13 }}>
                  Line-up hasn&apos;t been announced yet.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Animated.ScrollView>

      {/* Floating Glass Header Bar */}
      <View
        pointerEvents="box-none"
        style={[styles.floatingHeader, { top: Math.max(insets.top + 8, 16), zIndex: 9999, elevation: 20 }]}
      >
        <RNPressable
          hitSlop={10}
          style={({ pressed }) => [
            styles.headerIconBtn,
            {
              backgroundColor: addAlpha(theme.colors.surface, 0.85),
              borderColor: addAlpha(theme.colors.outline, 0.2),
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push("/(tabs)");
            }
          }}
        >
          <ChevronLeft size={22} color={theme.colors.onSurface} />
        </RNPressable>

        <View style={styles.headerRightActions} pointerEvents="box-none">
          <RNPressable
            hitSlop={10}
            style={({ pressed }) => [
              styles.headerIconBtn,
              {
                backgroundColor: addAlpha(theme.colors.surface, 0.85),
                borderColor: addAlpha(theme.colors.outline, 0.2),
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            onPress={() => toggleAttendance("interested")}
          >
            <Heart
              size={20}
              color={isInterested ? theme.colors.error : theme.colors.onSurface}
              fill={isInterested ? theme.colors.error : "transparent"}
            />
          </RNPressable>

          <RNPressable
            hitSlop={10}
            style={({ pressed }) => [
              styles.headerIconBtn,
              {
                backgroundColor: addAlpha(theme.colors.surface, 0.85),
                borderColor: addAlpha(theme.colors.outline, 0.2),
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            onPress={() => {}}
          >
            <Share2 size={19} color={theme.colors.onSurface} />
          </RNPressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  floatingHeader: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 100,
  },
  headerRightActions: {
    flexDirection: "row",
    gap: 10,
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  scrollContent: {
    paddingTop: 0,
  },
  heroBannerContainer: {
    width: "100%",
    height: 380,
    position: "relative",
  },
  heroBannerImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  heroTitleContainer: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
  },
  heroTagBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  heroTagText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  heroEventTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: -0.5,
    lineHeight: 34,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  contentBody: {
    paddingHorizontal: 16,
    marginTop: -20,
    gap: 14,
  },
  infoCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    gap: 12,
  },
  infoCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  infoTexts: {
    flex: 1,
  },
  infoTitle: {
    fontWeight: "800",
    fontSize: 15,
  },
  infoSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1,
  },
  divider: {
    height: 1,
    width: "100%",
  },
  socialCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  attendeeCountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  counterText: {
    fontWeight: "900",
    fontSize: 17,
  },
  counterLabel: {
    fontWeight: "700",
    fontSize: 14,
  },
  attendActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  attendActionText: {
    fontWeight: "800",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  genresContainer: {
    marginVertical: 2,
  },
  genresScroll: {
    gap: 8,
  },
  genrePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  genreText: {
    fontWeight: "800",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionHeading: {
    fontWeight: "800",
    fontSize: 16,
  },
  descriptionBody: {
    fontSize: 13.5,
    lineHeight: 21,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeAllText: {
    fontWeight: "800",
    fontSize: 12,
  },
  actGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  actTile: {
    flexBasis: "48%",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 70,
  },
  actTileTitle: {
    fontWeight: "800",
    fontSize: 13,
    textAlign: "center",
  },
  noLineupBox: {
    paddingVertical: 12,
    alignItems: "center",
  },
});

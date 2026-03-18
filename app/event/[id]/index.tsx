import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Calendar, Heart, MapPin, Users } from "lucide-react-native";
import React, { useState, useRef, useEffect, useCallback } from "react";
import ContentLoader, { Rect } from "react-content-loader/native";
import { Dimensions, Image, RefreshControl, StyleSheet, View, ScrollView } from "react-native";
import {
  Button,
  IconButton,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { eventsApi } from "../../../src/api/events";
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

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
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

    if (status === "going") {
      try {
        setActionLoading(true);
        if (event.user_status === "going") {
          await removeAttendanceMutation.mutateAsync();
        } else {
          await updateAttendanceMutation.mutateAsync();
        }
      } catch (err) {
        console.error("Failed to toggle attendance", err);
      } finally {
        setActionLoading(false);
      }
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
          onPress={() => router.back()}
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
          <Rect x="0" y="0" rx="0" ry="0" width={width} height="300" />
          <Rect x="24" y="324" rx="8" ry="8" width={width * 0.6} height="32" />
          <Rect x="24" y="368" rx="4" ry="4" width={width * 0.4} height="20" />
          <Rect x="24" y="412" rx="4" ry="4" width={width - 48} height="16" />
          <Rect x="24" y="436" rx="4" ry="4" width={width - 48} height="16" />
          <Rect x="24" y="460" rx="4" ry="4" width={width * 0.8} height="16" />
          <Rect x="24" y="520" rx="16" ry="16" width={width - 48} height="80" />
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
    <View style={styles.container}>
      <Droplet
        visible={showDroplet}
        onPress={scrollToTop}
        position="top"
        topOffset={insets.top + 8}
      />
      <View style={[styles.eventHeader, { top: insets.top / 4 }]}>
        <IconButton
          icon="chevron-left"
          size={24}
          containerColor="rgba(0,0,0,0.5)"
          iconColor="white"
          onPress={() => router.back()}
        />
        <View style={styles.headerRight}>
          <IconButton
            icon={() => (
              <Heart
                size={20}
                color={isInterested ? theme.colors.error : "white"}
                fill={isInterested ? theme.colors.error : "transparent"}
              />
            )}
            size={24}
            containerColor="rgba(0,0,0,0.5)"
            onPress={() => toggleAttendance("interested")}
            loading={actionLoading}
          />
          <IconButton
            icon="share-variant"
            size={24}
            containerColor="rgba(0,0,0,0.5)"
            iconColor="white"
            onPress={() => {}}
          />
        </View>
      </View>

      <Animated.ScrollView
        ref={scrollRef as any}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
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
        <View style={styles.bannerWrapper}>
          {bannerUrl ? (
            <Image source={{ uri: bannerUrl }} style={styles.bannerImage} />
          ) : (
            <View
              style={[
                styles.bannerImage,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
            />
          )}
          <View style={styles.bannerOverlay} />
        </View>

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text variant="displaySmall" style={styles.eventName}>
              {event.name}
            </Text>
          </View>

          <View style={styles.metaSection}>
            <View style={styles.metaRow}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: addAlpha(theme.colors.primary, 0.1) },
                ]}
              >
                <Calendar size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.metaTexts}>
                <Text variant="bodyLarge" style={styles.metaTitle}>
                  {startEndMerged}
                </Text>
                <Text variant="bodyMedium" style={styles.metaSubtitle}>
                  Dates
                </Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: addAlpha(theme.colors.primary, 0.1) },
                ]}
              >
                <MapPin size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.metaTexts}>
                <Text variant="bodyLarge" style={styles.metaTitle}>
                  {event.location}
                </Text>
                <Text variant="bodyMedium" style={styles.metaSubtitle}>
                  Location
                </Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: addAlpha(theme.colors.primary, 0.1) },
                ]}
              >
                <Users size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.metaTexts}>
                <AnimatedCounter
                  value={event.attendee_count ?? attendees.length}
                  variant="bodyLarge"
                  style={styles.metaTitle}
                />
                <Text variant="bodyMedium" style={styles.metaSubtitle}>
                  Going
                </Text>
              </View>

              <Button
                mode={isGoing ? "outlined" : "contained"}
                onPress={() => toggleAttendance("going")}
                loading={actionLoading}
                style={styles.attendButton}
              >
                {isGoing ? "Attending" : "Attend"}
              </Button>
            </View>
          </View>

          {event.description && (
            <View style={styles.descriptionSection}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                About
              </Text>
              <Text variant="bodyMedium" style={styles.descriptionText}>
                {event.description}
              </Text>
            </View>
          )}

          <View style={styles.lineupSection}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Line-up
            </Text>
            {acts.length > 0 ? (
              <>
                <View style={styles.actGrid}>
                  {previewActs.map((act: Act) => (
                    <Surface key={act.id} style={styles.actCard} elevation={1}>
                      <Text
                        variant="bodyLarge"
                        style={styles.actName}
                        numberOfLines={2}
                      >
                        {act.artists && act.artists.length > 0
                          ? act.artists[0].name
                          : act.name}
                      </Text>
                    </Surface>
                  ))}
                </View>
                <Button
                  mode="text"
                  onPress={() => router.push(`/event/${id}/lineup` as any)}
                  style={styles.viewFullButton}
                >
                  View full line-up
                </Button>
              </>
            ) : (
              <Surface style={styles.noLineup} elevation={0}>
                <Text variant="bodyMedium" style={{ opacity: 0.6 }}>
                  Line-up hasn&apos;t been announced yet.
                </Text>
                <Button
                  mode="text"
                  onPress={() => router.push(`/event/${id}/lineup` as any)}
                >
                  Check anyway
                </Button>
              </Surface>
            )}
          </View>
        </View>
      </Animated.ScrollView>
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
  },
  eventHeader: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 100,
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  bannerWrapper: {
    width: "100%",
    height: 350,
    position: "relative",
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  content: {
    padding: 24,
    marginTop: -40,
    backgroundColor: "transparent",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  titleSection: {
    paddingBottom: 24,
  },
  eventName: {
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 40,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  metaSection: {
    gap: 16,
    marginBottom: 32,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  metaTexts: {
    flex: 1,
  },
  metaTitle: {
    fontWeight: "bold",
  },
  metaSubtitle: {
    opacity: 0.6,
  },
  attendButton: {
    borderRadius: 12,
  },
  descriptionSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 16,
    opacity: 0.8,
  },
  descriptionText: {
    lineHeight: 22,
    opacity: 0.8,
  },
  lineupSection: {
    marginBottom: 32,
  },
  actGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  actCard: {
    flexBasis: "47%",
    padding: 16,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 80,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  actName: {
    fontWeight: "bold",
    textAlign: "center",
  },
  viewFullButton: {
    marginTop: 16,
  },
  noLineup: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  scrollContent: {
    paddingTop: 16,
  },
});

import { format } from "date-fns";
import { Calendar, Clock, MapPin, Users } from "lucide-react-native";
import React, { useEffect } from "react";
import { StyleSheet, View, Pressable, Dimensions } from "react-native";
import {
  Button,
  Divider,
  IconButton,
  Portal,
  Text,
  useTheme,
} from "react-native-paper";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  runOnJS
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TimetableEntry } from "../../types/timetable";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ActInfoBottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  entry: TimetableEntry | null;
  isGroup?: boolean;
  groupId?: string | null;
  timetableId?: string | null;
}

export const ActInfoBottomSheet: React.FC<ActInfoBottomSheetProps> = ({
  visible,
  onDismiss,
  entry,
  isGroup = false,
  groupId,
  timetableId
}) => {
  const theme = useTheme();
  const { bottom } = useSafeAreaInsets();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);

  const attendees = entry?.attendees || [];
  const isLoadingAttendees = false;

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { 
        damping: 20, 
        stiffness: 90,
        overshootClamping: true
      });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [visible, translateY, opacity]);

  const handleDismiss = () => {
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, () => {
      runOnJS(onDismiss)();
    });
    opacity.value = withTiming(0, { duration: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // useDerivedValue or simply don't check .value here to avoid the warning.
  // Instead of unmounting based on .value, we can use a separate state or just rely on 'visible'
  // or just render it always and let opacity handle it if it's not too heavy.
  if (!visible && !entry) return null;

  const startTime = entry ? new Date(entry.start_time) : new Date();
  const endTime = entry ? new Date(entry.end_time) : new Date();

  return (
    <Portal>
      {visible && (
        <View style={StyleSheet.absoluteFill}>
          <Animated.View style={[styles.backdrop, backdropStyle]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />
          </Animated.View>
          
          <Animated.View 
            style={[
              styles.sheet, 
              { backgroundColor: theme.colors.surface, paddingBottom: bottom + 24 },
              animatedStyle
            ]}
          >
            <View style={styles.handle} />
            
            {entry && (
              <>
                <View style={styles.header}>
                  <View style={styles.headerText}>
                    <Text variant="headlineSmall" style={styles.title}>
                      {entry.act.name}
                    </Text>
                    {entry.act.artists && entry.act.artists.length > 0 && (
                      <Text variant="bodyMedium" style={{ opacity: 0.7 }}>
                        {entry.act.artists.map((a) => a.name).join(", ")}
                      </Text>
                    )}
                  </View>
                  <IconButton icon="close" onPress={handleDismiss} />
                </View>

                <Divider style={styles.divider} />

                <View style={styles.content}>
                  <View style={styles.infoRow}>
                    <View style={styles.iconCircle}>
                      <MapPin size={20} color={theme.colors.primary} />
                    </View>
                    <View>
                      <Text variant="labelLarge" style={styles.infoLabel}>
                        Stage
                      </Text>
                      <Text variant="bodyLarge">{entry.stage.name}</Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.iconCircle}>
                      <Clock size={20} color={theme.colors.primary} />
                    </View>
                    <View>
                      <Text variant="labelLarge" style={styles.infoLabel}>
                        Time
                      </Text>
                      <Text variant="bodyLarge">
                        {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.iconCircle}>
                      <Calendar size={20} color={theme.colors.primary} />
                    </View>
                    <View>
                      <Text variant="labelLarge" style={styles.infoLabel}>
                        Date
                      </Text>
                      <Text variant="bodyLarge">{format(startTime, "EEEE, MMMM do")}</Text>
                    </View>
                  </View>

                  {isGroup && (
                    <View style={styles.groupSection}>
                      <View style={styles.infoRow}>
                        <View style={styles.iconCircle}>
                          <Users size={20} color={theme.colors.primary} />
                        </View>
                        <View>
                          <Text variant="labelLarge" style={styles.infoLabel}>
                            Who&apos;s going?
                          </Text>
                          <Text variant="bodySmall" style={{ opacity: 0.6 }}>
                            From your group
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.friendList}>
                        {isLoadingAttendees ? (
                           <Text variant="bodyMedium" style={styles.emptyFriends}>Loading attendees...</Text>
                        ) : attendees && attendees.length > 0 ? (
                           attendees.map((a: import("../../types/user").User) => (
                             <Text key={a.id} variant="bodyMedium" style={{ marginBottom: 4 }}>• {a.name}</Text>
                           ))
                        ) : (
                           <Text variant="bodyMedium" style={styles.emptyFriends}>
                              No one from your group is attending yet.
                           </Text>
                        )}
                      </View>
                    </View>
                  )}

                  {entry.act.description && (
                    <View style={styles.descriptionSection}>
                      <Text variant="labelLarge" style={styles.infoLabel}>
                        About
                      </Text>
                      <Text variant="bodyMedium" style={styles.description}>
                        {entry.act.description}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.footer}>
                  <Button
                    mode="contained"
                    onPress={handleDismiss}
                    style={styles.closeButton}
                    contentStyle={{ height: 48 }}
                  >
                    Got it
                  </Button>
                </View>
              </>
            )}
          </Animated.View>
        </View>
      )}
    </Portal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 8,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  divider: {
    marginBottom: 24,
  },
  content: {
    gap: 24,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    opacity: 0.6,
    marginBottom: 2,
    textTransform: "uppercase",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  groupSection: {
    marginTop: 8,
  },
  friendList: {
    marginTop: 12,
    paddingLeft: 60,
  },
  emptyFriends: {
    opacity: 0.5,
    fontStyle: "italic",
  },
  descriptionSection: {
    marginTop: 8,
  },
  description: {
    marginTop: 8,
    lineHeight: 20,
    opacity: 0.8,
  },
  footer: {
    marginTop: 32,
  },
  closeButton: {
    borderRadius: 16,
  },
});

import { format } from "date-fns";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Text, TouchableRipple, useTheme } from "react-native-paper";
import { TimetableEntry } from "../../types/timetable";

interface TimetableActItemProps {
  entry: TimetableEntry;
  isPersonal: boolean;
  onPress: (entry: TimetableEntry) => void;
  onLongPress: (entry: TimetableEntry) => void;
  style?: any;
  variant?: "vertical" | "horizontal";
}

export const TimetableActItem: React.FC<TimetableActItemProps> = ({
  entry,
  isPersonal,
  onPress,
  onLongPress,
  style,
  variant = "vertical",
}) => {
  const theme = useTheme();
  
  // Since Redux updates the state immediately in 'pending', 
  // we just render what's in the entry object!
  // Support both official (entry.is_attending) and group (entry.pivot.is_attending)
  const isFavorited = entry.is_attending || (entry.pivot?.is_attending ?? false);
  const attendingCount = entry.pivot?.attending_count ?? 0;

  const backgroundColor = isFavorited
    ? theme.colors.primary
    : theme.colors.surfaceVariant;
    
  const borderColor = isFavorited
    ? theme.colors.primaryContainer
    : theme.colors.outlineVariant;
    
  const textColor = isFavorited ? "white" : theme.colors.onSurface;
  const secondaryTextColor = isFavorited ? "rgba(255,255,255,0.8)" : theme.colors.onSurfaceVariant;

  return (
    <View
      style={[
        styles.entryCard,
        style,
        {
          backgroundColor,
          borderColor,
        },
      ]}
    >
      <TouchableRipple
        onPress={() => onPress(entry)}
        onLongPress={() => onLongPress(entry)}
        delayLongPress={500}
        style={styles.touchable}
        rippleColor={isFavorited ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"}
      >
        <View style={styles.entryContent}>
          <View style={styles.titleRow}>
            <Text
              variant={variant === "vertical" ? "labelSmall" : "labelSmall"}
              style={[
                styles.entryTitle,
                { color: textColor },
                variant === "horizontal" && { fontSize: 11, lineHeight: 12 }
              ]}
              numberOfLines={2}
            >
              {entry.act.name}
            </Text>
            {!isPersonal && attendingCount > 0 && (
              <View style={[styles.countBadge, { backgroundColor: isFavorited ? 'rgba(255,255,255,0.2)' : theme.colors.primaryContainer }]}>
                 <Text style={[styles.countText, { color: isFavorited ? 'white' : theme.colors.primary }]}>{attendingCount}</Text>
              </View>
            )}
          </View>
          <Text
            variant="labelSmall"
            style={[
              styles.entryTime,
              { color: secondaryTextColor },
              variant === "horizontal" && { fontSize: 9 }
            ]}
          >
            {format(new Date(entry.start_time), "HH:mm")}
            {variant === "vertical" && ` - ${format(new Date(entry.end_time), "HH:mm")}`}
          </Text>
        </View>
      </TouchableRipple>
    </View>
  );
};

const styles = StyleSheet.create({
  entryCard: {
    position: "absolute",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  touchable: {
    flex: 1,
    padding: 8,
  },
  entryContent: {
    flex: 1,
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  entryTitle: {
    fontWeight: "bold",
    lineHeight: 14,
    flex: 1,
    marginRight: 4,
  },
  entryTime: {
    fontSize: 10,
    marginTop: 2,
  },
  countBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 9,
    fontWeight: 'bold',
  }
});

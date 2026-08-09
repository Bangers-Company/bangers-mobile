import { format } from "date-fns";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Text, Pressable } from "@gluestack-ui/themed";
import { useAppTheme } from "../../context/ThemeProvider";
import { TimetableEntry } from "../../types/timetable";

interface TimetableActItemProps {
  entry: TimetableEntry;
  isPersonal: boolean;
  onPress: (entry: TimetableEntry) => void;
  onLongPress: (entry: TimetableEntry) => void;
  style?: any;
  variant?: "vertical" | "horizontal";
}

export const TimetableActItem: React.FC<TimetableActItemProps> = React.memo(({
  entry,
  isPersonal,
  onPress,
  onLongPress,
  style,
  variant = "vertical",
}) => {
  const theme = useAppTheme();
  
  const isFavorited = entry.is_attending || (entry.pivot?.is_attending ?? false);
  const attendingCount = entry.pivot?.attending_count ?? 0;

  const backgroundColor = isFavorited
    ? theme.colors.primary
    : theme.colors.surfaceVariant;
    
  const borderColor = isFavorited
    ? theme.colors.primaryContainer
    : theme.colors.surfaceVariant;
    
  const textColor = isFavorited ? "white" : theme.colors.onSurface;
  const secondaryTextColor = isFavorited ? "rgba(255,255,255,0.8)" : theme.colors.onSurface;

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
      <Pressable
        onPress={() => onPress(entry)}
        onLongPress={() => onLongPress(entry)}
        delayLongPress={500}
        style={styles.touchable}
      >
        <View style={styles.entryContent}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.entryTitle,
                { color: textColor },
                variant === "horizontal" && { fontSize: 11, lineHeight: 12 }
              ]}
              numberOfLines={2}
            >
              {entry.act.name}
            </Text>
          </View>
          <Text
            style={[
              styles.entryTime,
              { color: secondaryTextColor },
              variant === "horizontal" && { fontSize: 9 }
            ]}
          >
            {format(new Date(entry.start_time), "HH:mm")}
            {variant === "vertical" && ` - ${format(new Date(entry.end_time), "HH:mm")}`}
          </Text>
          {attendingCount > 0 && (
            <View style={[styles.countDot, { backgroundColor: isFavorited ? 'white' : theme.colors.primary }]}>
               <Text style={[styles.countDotText, { color: isFavorited ? theme.colors.primary : 'white' }]}>
                 {attendingCount}
               </Text>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.entry.id === nextProps.entry.id &&
    prevProps.entry.is_attending === nextProps.entry.is_attending &&
    prevProps.entry.pivot?.is_attending === nextProps.entry.pivot?.is_attending &&
    prevProps.entry.pivot?.attending_count === nextProps.entry.pivot?.attending_count &&
    prevProps.isPersonal === nextProps.isPersonal &&
    prevProps.variant === nextProps.variant &&
    JSON.stringify(prevProps.style) === JSON.stringify(nextProps.style)
  );
});

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
    fontSize: 11,
  },
  entryTime: {
    fontSize: 10,
    marginTop: 2,
  },
  countDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countDotText: {
    fontSize: 9,
    fontWeight: 'bold',
  }
});


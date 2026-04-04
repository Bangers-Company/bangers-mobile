import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, useTheme } from 'react-native-paper';
import { Skeleton } from '../ui/Skeleton';

export const EventHorizontalCardSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <Card
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      elevation={1}
    >
      <View style={styles.horizontalContainer}>
        <View style={styles.imageContainer}>
          <Skeleton width="100%" height="100%" borderRadius={0} />
          <View style={styles.dateBadge}>
            <Skeleton width={40} height={14} borderRadius={4} />
          </View>
        </View>

        <View style={styles.content}>
          <Skeleton width="80%" height={22} borderRadius={4} style={{ marginBottom: 6 }} />
          <Skeleton width="40%" height={18} borderRadius={6} style={{ marginBottom: 8 }} />
          <View style={styles.metaRow}>
            <Skeleton width={120} height={14} borderRadius={4} />
            <Skeleton width={100} height={14} borderRadius={4} />
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginVertical: 4,
    overflow: "hidden",
  },
  horizontalContainer: {
    flexDirection: "row",
  },
  imageContainer: {
    height: 100,
    width: 100,
    position: "relative",
  },
  dateBadge: {
    position: "absolute",
    top: 6,
    right: 6,
  },
  content: {
    padding: 12,
    flex: 1,
    justifyContent: "center",
  },
  metaRow: {
    flexDirection: "column",
    gap: 6,
  },
});

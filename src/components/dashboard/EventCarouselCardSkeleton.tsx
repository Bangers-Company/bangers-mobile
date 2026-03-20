import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Card, useTheme } from 'react-native-paper';
import { Skeleton } from '../ui/Skeleton';

interface EventCarouselCardSkeletonProps {
  cardWidth: number;
  cardMargin: number;
}

export const EventCarouselCardSkeleton: React.FC<EventCarouselCardSkeletonProps> = ({
  cardWidth,
  cardMargin,
}) => {
  const theme = useTheme();

  return (
    <View style={{ width: cardWidth, marginHorizontal: cardMargin }}>
      <Card
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        elevation={2}
      >
        <View style={styles.imageContainer}>
          <Skeleton width="100%" height="100%" borderRadius={0} />
          <View style={styles.dateBadge}>
            <Skeleton width={80} height={24} borderRadius={12} />
          </View>
        </View>
        <View style={styles.content}>
          <Skeleton width="80%" height={28} borderRadius={4} style={{ marginBottom: 12 }} />
          <View style={styles.metaRow}>
            <Skeleton width={100} height={16} borderRadius={4} />
            <Skeleton width={80} height={16} borderRadius={4} />
          </View>
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: "hidden",
  },
  imageContainer: {
    height: 180,
    position: "relative",
  },
  dateBadge: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  content: {
    padding: 20,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
});

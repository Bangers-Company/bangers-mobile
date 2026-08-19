import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Box } from '@gluestack-ui/themed';
import { useAppTheme } from '../../context/ThemeProvider';
import { Skeleton } from '../ui/Skeleton';

interface EventCarouselCardSkeletonProps {
  cardWidth: number;
  cardMargin: number;
}

export const EventCarouselCardSkeleton: React.FC<EventCarouselCardSkeletonProps> = ({
  cardWidth,
  cardMargin,
}) => {
  const theme = useAppTheme();

  return (
    <View style={{ width: cardWidth, marginHorizontal: cardMargin }}>
      <Box
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
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
      </Box>
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


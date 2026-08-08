import React from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { Text } from "@gluestack-ui/themed";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { Event } from "../../types/event";
import { EventCarouselCard } from "../event/EventCarouselCard";
import { EventCarouselCardSkeleton } from "./EventCarouselCardSkeleton";

interface MyEventsCarouselProps {
  events: Event[];
  title?: string;
  loading?: boolean;
  onPress?: (event: Event) => void;
}

const CARD_WIDTH_RATIO = 0.9;

export const MyEventsCarousel: React.FC<MyEventsCarouselProps> = ({
  events,
  title = "Your Events",
  loading = false,
  onPress,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const scrollX = useSharedValue(0);

  const cardWidth = windowWidth * CARD_WIDTH_RATIO;
  const cardMargin = 12;
  const snapToInterval = cardWidth + cardMargin * 2;

  const snapOffsets = (loading ? [0, 1] : events).map((_, index) => index * snapToInterval);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  if (!loading && events.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {title}
      </Text>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        snapToOffsets={snapOffsets}
        snapToAlignment="center"
        decelerationRate={0.9}
        disableIntervalMomentum={true}
        pagingEnabled={false}
        contentContainerStyle={{
          paddingHorizontal: (windowWidth - snapToInterval) / 2,
        }}
        style={{
          // @ts-ignore - Web only
          scrollSnapType: "x mandatory",
        }}
      >
        {loading ? (
          <>
            <EventCarouselCardSkeleton cardWidth={cardWidth} cardMargin={cardMargin} />
            <EventCarouselCardSkeleton cardWidth={cardWidth} cardMargin={cardMargin} />
          </>
        ) : (
          events.map((event, index) => (
            <EventCarouselCard
              key={event.id}
              event={event}
              index={index}
              scrollX={scrollX}
              snapToInterval={snapToInterval}
              cardWidth={cardWidth}
              cardMargin={cardMargin}
              onPress={onPress}
            />
          ))
        )}
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    marginLeft: 16,
    marginBottom: 16,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  card: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  imageContainer: {
    height: 180,
    position: "relative",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  dateBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  dateText: {
    color: "white",
    fontWeight: "bold",
  },
  content: {
    padding: 16,
  },
  eventName: {
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  genreContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  location: {
    opacity: 0.7,
    fontWeight: "600",
  },
});


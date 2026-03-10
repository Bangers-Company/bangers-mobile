import { MapPin } from "lucide-react-native";
import React from "react";
import { Image, StyleSheet, View, useWindowDimensions } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import Animated, {
  Extrapolate,
  SharedValue,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { Event } from "../../types/event";
import { resolveMediaUrl } from "../../utils/format";

interface MyEventsCarouselProps {
  events: Event[];
  title?: string;
  onPress?: (event: Event) => void;
}

const CARD_WIDTH_RATIO = 0.8;

interface CarouselItemProps {
  event: Event;
  index: number;
  scrollX: SharedValue<number>;
  snapToInterval: number;
  cardWidth: number;
  cardMargin: number;
  onPress?: (event: Event) => void;
}

const CarouselItem: React.FC<CarouselItemProps> = ({
  event,
  index,
  scrollX,
  snapToInterval,
  cardWidth,
  cardMargin,
  onPress,
}) => {
  const theme = useTheme();
  const bannerUrl = resolveMediaUrl(event.banner?.url);

  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * snapToInterval,
      index * snapToInterval,
      (index + 1) * snapToInterval,
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.9, 1, 0.9],
      Extrapolate.CLAMP,
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.6, 1, 0.6],
      Extrapolate.CLAMP,
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          width: cardWidth,
          marginHorizontal: cardMargin,
          // @ts-ignore - Web only
          scrollSnapAlign: "center",
        },
      ]}
    >
      <Card style={styles.card} onPress={() => onPress?.(event)}>
        <View style={styles.imageContainer}>
          {bannerUrl ? (
            <Image source={{ uri: bannerUrl }} style={styles.image} />
          ) : (
            <View
              style={[
                styles.image,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
            />
          )}
          <View style={styles.overlay} />
          <View style={styles.content}>
            <Text variant="titleLarge" style={styles.eventName}>
              {event.name}
            </Text>
            <View style={styles.locationRow}>
              <MapPin size={14} color="rgba(255,255,255,0.7)" />
              <Text variant="bodySmall" style={styles.location}>
                {event.location}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </Animated.View>
  );
};

export const MyEventsCarousel: React.FC<MyEventsCarouselProps> = ({
  events,
  title = "Your Events",
  onPress,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const scrollX = useSharedValue(0);

  const cardWidth = windowWidth * CARD_WIDTH_RATIO;
  const cardMargin = 12;
  const snapToInterval = cardWidth + cardMargin * 2;

  const snapOffsets = events.map((_, index) => index * snapToInterval);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  if (events.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
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
        {events.map((event, index) => (
          <CarouselItem
            key={event.id}
            event={event}
            index={index}
            scrollX={scrollX}
            snapToInterval={snapToInterval}
            cardWidth={cardWidth}
            cardMargin={cardMargin}
            onPress={onPress}
          />
        ))}
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
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  content: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  eventName: {
    color: "#fff",
    fontWeight: "bold",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  location: {
    color: "rgba(255,255,255,0.7)",
  },
});

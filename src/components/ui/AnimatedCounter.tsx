import React, { useEffect } from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withSequence,
  FadeIn,
  FadeOut
} from 'react-native-reanimated';

interface AnimatedCounterProps {
  value: string | number;
  variant?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<import('react-native').TextStyle>;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ 
  value, 
  style,
  textStyle
}) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.2, { damping: 10, stiffness: 100 }),
      withSpring(1, { damping: 10, stiffness: 100 })
    );
  }, [value, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <View 
      style={[styles.container, style]}
      accessibilityLabel={`Counter value: ${value}`}
      accessibilityLiveRegion="polite"
    >
      <Animated.View style={animatedStyle} key={value}>
        <Animated.View entering={FadeIn} exiting={FadeOut}>
          <Text style={[styles.text, textStyle]}>
            {value}
          </Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: 'bold',
  },
});


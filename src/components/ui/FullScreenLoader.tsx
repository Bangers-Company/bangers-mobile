import React from 'react';
import { View, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

interface FullScreenLoaderProps {
  visible: boolean;
  message?: string;
}

export const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({ visible, message }) => {
  const theme = useTheme();

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible}>
      <View style={styles.container}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
        <Animated.View 
          entering={FadeIn} 
          exiting={FadeOut}
          style={[styles.content, { backgroundColor: theme.colors.surface }]}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          {message && (
            <Text variant="titleMedium" style={styles.text}>
              {message}
            </Text>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  content: {
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    gap: 16,
    minWidth: 150,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  text: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

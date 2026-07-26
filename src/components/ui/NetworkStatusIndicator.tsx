import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff } from 'lucide-react-native';
import { useTheme, Text, Surface } from 'react-native-paper';
import { useUIStore } from '../../store/useUIStore';
import { useTranslation } from 'react-i18next';

export const NetworkStatusIndicator = () => {
  const { isOffline, setIsOffline } = useUIStore();
  const theme = useTheme();
  const { t } = useTranslation();
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const offline = state.isConnected === false || state.isInternetReachable === false;
      setIsOffline(offline);
      
      Animated.timing(opacity, {
        toValue: offline ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });

    return () => unsubscribe();
  }, []);

  if (!isOffline) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Surface style={[styles.badge, { backgroundColor: theme.colors.errorContainer }]} elevation={2}>
        <WifiOff size={14} color={theme.colors.error} />
        <Text variant="labelSmall" style={[styles.text, { color: theme.colors.error }]}>
          {t("common.offline") || "Offline"}
        </Text>
      </Surface>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 9999,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  text: {
    fontWeight: 'bold',
    textTransform: 'uppercase',
  }
});

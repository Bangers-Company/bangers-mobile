import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff } from 'lucide-react-native';
import { Box, Text } from '@gluestack-ui/themed';
import { useAppTheme } from '../../context/ThemeProvider';
import { useUIStore } from '../../store/useUIStore';
import { useTranslation } from 'react-i18next';

export const NetworkStatusIndicator = () => {
  const { isOffline, setIsOffline } = useUIStore();
  const theme = useAppTheme();
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

  const errorColor = "#ff5252";

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Box style={[styles.badge, { backgroundColor: "rgba(255, 82, 82, 0.15)" }]}>
        <WifiOff size={14} color={errorColor} />
        <Text style={[styles.text, { color: errorColor }]}>
          {t("common.offline") || "Offline"}
        </Text>
      </Box>
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
    fontSize: 11,
    textTransform: 'uppercase',
  }
});


import React from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { Modal, Portal, Text, Button, useTheme, Surface } from 'react-native-paper';
import { AlertTriangle, Trash2 } from 'lucide-react-native';
import { addAlpha } from '../../utils/theme';
import { useTranslation } from 'react-i18next';

interface ConfirmDeleteModalProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onDismiss: () => void;
  loading?: boolean;
  confirmLabel?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  visible,
  title,
  message,
  onConfirm,
  onDismiss,
  loading,
  confirmLabel = "Delete",
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const scale = React.useRef(new Animated.Value(0.9)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }).start();
    } else {
      scale.setValue(0.9);
    }
  }, [visible]);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.container}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Surface style={[styles.content, { backgroundColor: theme.colors.surface }]} elevation={5}>
            <View style={[styles.iconWrapper, { backgroundColor: addAlpha(theme.colors.error, 0.1) }]}>
              <Trash2 size={28} color={theme.colors.error} />
            </View>
            
            <Text variant="headlineSmall" style={styles.title}>
              {title}
            </Text>
            
            <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.outline }]}>
              {message}
            </Text>

            <View style={styles.actions}>
              <Button 
                mode="text" 
                onPress={onDismiss} 
                style={styles.button}
                disabled={loading}
              >
                {t("common.cancel")}
              </Button>
              <Button 
                mode="contained" 
                onPress={onConfirm} 
                loading={loading}
                disabled={loading}
                style={[styles.button, { backgroundColor: theme.colors.error }]}
                contentStyle={styles.confirmContent}
              >
                {confirmLabel}
              </Button>
            </View>
          </Surface>
        </Animated.View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  content: {
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 16,
  },
  confirmContent: {
    height: 48,
  }
});

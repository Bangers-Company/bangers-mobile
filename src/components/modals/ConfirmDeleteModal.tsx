import React from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  Button,
  ButtonText,
  Text,
  Box,
} from '@gluestack-ui/themed';
import { useAppTheme } from '../../context/ThemeProvider';
import { Trash2 } from 'lucide-react-native';
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
  const theme = useAppTheme();
  const { t } = useTranslation();
  const scale = React.useRef(new Animated.Value(0.9)).current;
  const errorColor = "#ff5252";

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
    <Modal isOpen={visible} onClose={onDismiss}>
      <ModalBackdrop />
      <ModalContent style={[styles.content, { backgroundColor: theme.colors.surface }]}>
        <Animated.View style={{ transform: [{ scale }], width: '100%', alignItems: 'center' }}>
          <View style={[styles.iconWrapper, { backgroundColor: addAlpha(errorColor, 0.1) }]}>
            <Trash2 size={28} color={errorColor} />
          </View>
          
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            {title}
          </Text>
          
          <Text style={[styles.message, { color: theme.colors.onSurface }]}>
            {message}
          </Text>

          <View style={styles.actions}>
            <Button 
              onPress={onDismiss} 
              isDisabled={loading}
              variant="outline"
              style={[styles.button, { borderColor: addAlpha(theme.colors.onSurface, 0.3) }]}
            >
              <ButtonText style={{ color: theme.colors.onSurface }}>{t("common.cancel")}</ButtonText>
            </Button>

            <Button 
              onPress={onConfirm} 
              isDisabled={loading}
              style={[styles.button, { backgroundColor: errorColor }]}
            >
              <ButtonText style={{ color: "#fff", fontWeight: "700" }}>{confirmLabel}</ButtonText>
            </Button>
          </View>
        </Animated.View>
      </ModalContent>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 12,
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});


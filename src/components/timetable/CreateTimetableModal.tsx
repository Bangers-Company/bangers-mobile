import React, { useState } from "react";
import { StyleSheet, View, TextInput as RNTextInput } from "react-native";
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  Text,
  Button,
  ButtonText,
} from "@gluestack-ui/themed";
import { useAppTheme } from "../../context/ThemeProvider";

interface CreateTimetableModalProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: (name: string) => void;
  loading?: boolean;
  title?: string;
  placeholder?: string;
}

export const CreateTimetableModal: React.FC<CreateTimetableModalProps> = ({
  visible,
  onDismiss,
  onConfirm,
  loading,
  title = "Create Timetable",
  placeholder = "e.g. My Summer Fest Plan",
}) => {
  const [name, setName] = useState("");
  const theme = useAppTheme();

  const handleConfirm = () => {
    if (name.trim()) {
      onConfirm(name);
      setName("");
    }
  };

  return (
    <Modal isOpen={visible} onClose={onDismiss}>
      <ModalBackdrop />
      <ModalContent style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurface }]}>
          Enter a name for this item to get started.
        </Text>
        
        <View style={styles.inputRow}>
          <RNTextInput
            placeholder={placeholder}
            placeholderTextColor="#888"
            value={name}
            onChangeText={setName}
            autoFocus
            style={[styles.rnInput, { color: theme.colors.onSurface }]}
          />
        </View>

        <View style={styles.actions}>
          <Button onPress={onDismiss} isDisabled={loading} variant="outline" style={styles.button}>
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button 
            onPress={handleConfirm} 
            isDisabled={!name.trim() || loading}
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
          >
            <ButtonText style={{ color: "#fff", fontWeight: "700" }}>Create</ButtonText>
          </Button>
        </View>
      </ModalContent>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderRadius: 24,
    width: "90%",
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 20,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(150,150,150,0.3)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 24,
  },
  rnInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  button: {
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
});


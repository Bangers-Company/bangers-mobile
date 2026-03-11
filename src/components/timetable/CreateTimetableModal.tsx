import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Modal, Portal, Text, TextInput, Button, useTheme } from "react-native-paper";

interface CreateTimetableModalProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: (name: string) => void;
  loading?: boolean;
}

export const CreateTimetableModal: React.FC<CreateTimetableModalProps> = ({
  visible,
  onDismiss,
  onConfirm,
  loading,
}) => {
  const [name, setName] = useState("");
  const theme = useTheme();

  const handleConfirm = () => {
    if (name.trim()) {
      onConfirm(name);
      setName("");
    }
  };

  return (
    <Portal>
      <Modal 
        visible={visible} 
        onDismiss={onDismiss} 
        contentContainerStyle={[styles.container, { backgroundColor: theme.colors.surface }]}
      >
        <Text variant="headlineSmall" style={styles.title}>Create Timetable</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Give your personal schedule a name. All official acts will be added as a baseline.
        </Text>
        
        <TextInput
          label="Timetable Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          placeholder="e.g. My Summer Fest Plan"
          autoFocus
        />

        <View style={styles.actions}>
          <Button onPress={onDismiss} disabled={loading}>Cancel</Button>
          <Button 
            mode="contained" 
            onPress={handleConfirm} 
            loading={loading}
            disabled={!name.trim() || loading}
          >
            Create
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    margin: 20,
    borderRadius: 24,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.7,
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    marginBottom: 24,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
});

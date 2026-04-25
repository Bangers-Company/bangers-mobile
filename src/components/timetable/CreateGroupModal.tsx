import React, { useState, useEffect } from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity } from "react-native";
import { Modal, Portal, Text, TextInput, Button, useTheme, Avatar, Checkbox, ActivityIndicator } from "react-native-paper";
import { Search, ChevronRight } from "lucide-react-native";
import { friendsApi } from "../../api/friends";
import { User } from "../../types/user";
import { addAlpha } from "../../utils/theme";
import { useTranslation } from "react-i18next";

interface CreateGroupModalProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: (name: string, members: string[]) => void;
  loading?: boolean;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  visible,
  onDismiss,
  onConfirm,
  loading,
}) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loadingFriends, setLoadingFriends] = useState(false);
  const theme = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    if (visible && step === 2) {
      loadFriends();
    }
  }, [visible, step]);

  const loadFriends = async () => {
    setLoadingFriends(true);
    try {
      const res = await friendsApi.getFriends();
      setFriends(res.data || []);
    } catch (e) {
      console.error(e);
      setFriends([]);
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleNext = () => {
    if (name.trim()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleConfirm = () => {
    if (name.trim()) {
      onConfirm(name, selectedFriends);
      // Reset state on success happens in parent usually, but we can reset internal
    }
  };

  // Reset when closing
  useEffect(() => {
    if (!visible) {
      setStep(1);
      setName("");
      setSelectedFriends([]);
      setSearch("");
    }
  }, [visible]);

  const toggleFriend = (id: string) => {
    setSelectedFriends(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const filteredFriends = friends.filter(f => 
    f.username.toLowerCase().includes(search.toLowerCase()) || 
    `${f.first_name} ${f.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Portal>
      <Modal 
        visible={visible} 
        onDismiss={onDismiss} 
        contentContainerStyle={[styles.container, { backgroundColor: theme.colors.surface }]}
      >
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            {step === 1 ? t("timetable.groups.createModal.titleStep1") : t("timetable.groups.createModal.titleStep2")}
          </Text>
          <Text variant="bodySmall" style={styles.stepIndicator}>
            {t("timetable.groups.createModal.stepIndicator", { current: step, total: 2 })}
          </Text>
        </View>

        {step === 1 ? (
          <View>
            <Text variant="bodyMedium" style={styles.subtitle}>
              {t("timetable.groups.createModal.nameSubtitle")}
            </Text>
            <TextInput
              label={t("timetable.groups.createModal.nameLabel")}
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              placeholder={t("timetable.groups.createModal.namePlaceholder")}
              autoFocus
            />
            <View style={styles.actions}>
              <Button onPress={onDismiss}>{t("common.cancel")}</Button>
              <Button 
                mode="contained" 
                onPress={handleNext} 
                disabled={!name.trim()}
                icon={() => <ChevronRight size={18} color="white" />}
                contentStyle={{ flexDirection: 'row-reverse' }}
              >
                {t("common.next")}
              </Button>
            </View>
          </View>
        ) : (
          <View style={{ maxHeight: 400 }}>
             <Text variant="bodyMedium" style={styles.subtitle}>
              {t("timetable.groups.createModal.inviteSubtitle", { name })}
            </Text>
            
            <TextInput
              placeholder={t("timetable.groups.createModal.searchPlaceholder")}
              value={search}
              onChangeText={setSearch}
              mode="outlined"
              style={styles.searchInput}
              left={<TextInput.Icon icon={() => <Search size={20} color={theme.colors.outline} />} />}
            />

            {loadingFriends ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            ) : (
              <ScrollView style={styles.friendList}>
                {filteredFriends.length > 0 ? (
                  filteredFriends.map(friend => (
                    <TouchableOpacity 
                      key={friend.id} 
                      style={styles.friendItem}
                      onPress={() => toggleFriend(friend.id)}
                    >
                      <Avatar.Text 
                        size={40} 
                        label={(friend.username || friend.first_name || "U").substring(0, 2).toUpperCase()} 
                        style={{ backgroundColor: addAlpha(theme.colors.primary, 0.1) }}
                        labelStyle={{ color: theme.colors.primary }}
                      />
                      <View style={styles.friendInfo}>
                        <Text variant="bodyLarge">{friend.username}</Text>
                        <Text variant="bodySmall" style={{ opacity: 0.6 }}>{friend.first_name} {friend.last_name}</Text>
                      </View>
                      <Checkbox 
                        status={selectedFriends.includes(friend.id) ? 'checked' : 'unchecked'} 
                        onPress={() => toggleFriend(friend.id)}
                      />
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text variant="bodyMedium" style={{ opacity: 0.5 }}>{t("timetable.groups.createModal.noFriends")}</Text>
                  </View>
                )}
              </ScrollView>
            )}

            <View style={[styles.actions, { marginTop: 16 }]}>
              <Button onPress={handleBack} disabled={loading}>{t("common.back")}</Button>
              <Button 
                mode="contained" 
                onPress={handleConfirm} 
                loading={loading}
                disabled={loading}
              >
                {selectedFriends.length > 0 
                  ? t("timetable.groups.createModal.createWithCount", { count: selectedFriends.length }) 
                  : t("timetable.groups.createModal.titleStep1")}
              </Button>
            </View>
          </View>
        )}
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    margin: 16,
    borderRadius: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  title: {
    fontWeight: "bold",
  },
  stepIndicator: {
    opacity: 0.5,
    fontWeight: 'bold',
  },
  subtitle: {
    opacity: 0.7,
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    marginBottom: 24,
  },
  searchInput: {
    marginBottom: 12,
    height: 48,
  },
  friendList: {
    maxHeight: 250,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  loadingContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

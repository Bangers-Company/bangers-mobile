import React, { useState, useEffect } from "react";
import { StyleSheet, View, ScrollView, TextInput as RNTextInput } from "react-native";
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  Text,
  Button,
  ButtonText,
  Checkbox,
  CheckboxIndicator,
  CheckboxIcon,
  CheckIcon,
  Avatar as GluestackAvatar,
  AvatarFallbackText,
  Spinner,
  Pressable,
} from "@gluestack-ui/themed";
import { useAppTheme } from "../../context/ThemeProvider";
import { Search, ChevronRight } from "lucide-react-native";
import { friendsApi } from "../../api/friends";
import { User } from "../../types/user";
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
  const theme = useAppTheme();
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
    }
  };

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
    <Modal isOpen={visible} onClose={onDismiss}>
      <ModalBackdrop />
      <ModalContent style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            {step === 1 ? t("timetable.groups.createModal.titleStep1") : t("timetable.groups.createModal.titleStep2")}
          </Text>
          <Text style={styles.stepIndicator}>
            {t("timetable.groups.createModal.stepIndicator", { current: step, total: 2 })}
          </Text>
        </View>

        {step === 1 ? (
          <View style={styles.step1Content}>
            <View style={styles.inputRow}>
              <RNTextInput
                placeholder={t("timetable.groups.createModal.namePlaceholder")}
                placeholderTextColor="#888"
                value={name}
                onChangeText={setName}
                autoFocus
                style={[styles.rnInput, { color: theme.colors.onSurface }]}
              />
            </View>

            <View style={styles.actions}>
              <Button onPress={onDismiss} variant="outline" style={styles.button}>
                <ButtonText>{t("common.cancel")}</ButtonText>
              </Button>
              <Button 
                onPress={handleNext} 
                isDisabled={!name.trim()}
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
              >
                <ButtonText style={{ color: "#fff", fontWeight: "700" }}>{t("common.next")}</ButtonText>
              </Button>
            </View>
          </View>
        ) : (
          <View style={styles.step2Content}>
            <View style={[styles.inputRow, { marginBottom: 12 }]}>
              <Search size={18} color="#888" style={{ marginRight: 8 }} />
              <RNTextInput
                placeholder={t("timetable.groups.createModal.searchPlaceholder")}
                placeholderTextColor="#888"
                value={search}
                onChangeText={setSearch}
                style={[styles.rnInput, { color: theme.colors.onSurface }]}
              />
            </View>

            {loadingFriends ? (
              <View style={styles.centerLoading}>
                <Spinner color={theme.colors.primary} />
              </View>
            ) : (
              <ScrollView style={styles.friendList}>
                {filteredFriends.length > 0 ? (
                  filteredFriends.map(friend => {
                    const isSelected = selectedFriends.includes(friend.id);
                    return (
                      <Pressable 
                        key={friend.id} 
                        style={styles.friendRow}
                        onPress={() => toggleFriend(friend.id)}
                      >
                        <GluestackAvatar size="md" style={{ backgroundColor: theme.colors.primary }}>
                          <AvatarFallbackText style={{ color: "#ffffff" }}>
                            {(friend.first_name || friend.username || "U").charAt(0).toUpperCase()}
                          </AvatarFallbackText>
                        </GluestackAvatar>

                        
                        <View style={styles.friendInfo}>
                          <Text style={[styles.friendName, { color: theme.colors.onSurface }]}>
                            {friend.first_name ? `${friend.first_name} ${friend.last_name}` : friend.username}
                          </Text>
                          <Text style={styles.friendUsername}>
                            @{friend.username}
                          </Text>
                        </View>

                        <Checkbox 
                          value={friend.id} 
                          isChecked={isSelected} 
                          onChange={() => toggleFriend(friend.id)}
                          aria-label={`Select ${friend.username}`}
                        >
                          <CheckboxIndicator style={{ borderColor: theme.colors.primary }}>
                            <CheckboxIcon as={CheckIcon} />
                          </CheckboxIndicator>
                        </Checkbox>
                      </Pressable>
                    );
                  })
                ) : (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ opacity: 0.5 }}>{t("timetable.groups.createModal.noFriends")}</Text>
                  </View>
                )}
              </ScrollView>
            )}

            <View style={[styles.actions, { marginTop: 16 }]}>
              <Button onPress={handleBack} isDisabled={loading} variant="outline" style={styles.button}>
                <ButtonText>{t("common.back")}</ButtonText>
              </Button>
              <Button 
                onPress={handleConfirm} 
                isDisabled={loading}
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
              >
                <ButtonText style={{ color: "#fff", fontWeight: "700" }}>
                  {selectedFriends.length > 0 
                    ? t("timetable.groups.createModal.createWithCount", { count: selectedFriends.length }) 
                    : t("timetable.groups.createModal.titleStep1")}
                </ButtonText>
              </Button>
            </View>
          </View>
        )}
      </ModalContent>
    </Modal>

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

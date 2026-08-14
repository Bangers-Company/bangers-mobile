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
import { Search } from "lucide-react-native";
import { friendsApi } from "../../api/friends";
import { User } from "../../types/user";
import { useTranslation } from "react-i18next";
import { Image as ExpoImage } from "expo-image";
import { addAlpha } from "../../utils/theme";
import { getUserAvatarUrl, getUserDisplayName } from "../../utils/format";

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
  const [nameFocused, setNameFocused] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
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
      setNameFocused(false);
      setSearchFocused(false);
    }
  }, [visible]);

  const toggleFriend = (id: string) => {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const filteredFriends = friends.filter(
    (f) =>
      f.username.toLowerCase().includes(search.toLowerCase()) ||
      `${f.first_name} ${f.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal isOpen={visible} onClose={onDismiss}>
      <ModalBackdrop />
      <ModalContent style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            {step === 1
              ? t("timetable.groups.createModal.titleStep1")
              : t("timetable.groups.createModal.titleStep2")}
          </Text>
          <Text style={styles.stepIndicator}>
            {t("timetable.groups.createModal.stepIndicator", { current: step, total: 2 })}
          </Text>
        </View>

        {step === 1 ? (
          <View style={styles.step1Content}>
            <View
              style={[
                styles.inputRow,
                {
                  borderColor: nameFocused
                    ? theme.colors.primary
                    : addAlpha(theme.colors.onSurface, 0.2),
                  backgroundColor: nameFocused
                    ? addAlpha(theme.colors.primary, 0.08)
                    : addAlpha(theme.colors.onSurface, 0.03),
                },
              ]}
            >
              <RNTextInput
                placeholder={t("timetable.groups.createModal.namePlaceholder")}
                placeholderTextColor="#888"
                value={name}
                onChangeText={setName}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                autoFocus
                style={[styles.rnInput, { color: theme.colors.onSurface }]}
              />
            </View>

            <View style={styles.actions}>
              <Button
                onPress={onDismiss}
                variant="outline"
                style={[
                  styles.button,
                  { borderColor: addAlpha(theme.colors.onSurface, 0.2) },
                ]}
              >
                <ButtonText style={{ color: theme.colors.onSurface }}>
                  {t("common.cancel")}
                </ButtonText>
              </Button>
              <Button
                onPress={handleNext}
                isDisabled={!name.trim()}
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
              >
                <ButtonText style={{ color: "#fff", fontWeight: "700" }}>
                  {t("common.next")}
                </ButtonText>
              </Button>
            </View>
          </View>
        ) : (
          <View style={styles.step2Content}>
            <View
              style={[
                styles.inputRow,
                {
                  borderColor: searchFocused
                    ? theme.colors.primary
                    : addAlpha(theme.colors.onSurface, 0.2),
                  backgroundColor: searchFocused
                    ? addAlpha(theme.colors.primary, 0.08)
                    : addAlpha(theme.colors.onSurface, 0.03),
                },
              ]}
            >
              <Search
                size={18}
                color={searchFocused ? theme.colors.primary : "#888"}
                style={{ marginRight: 8 }}
              />
              <RNTextInput
                placeholder={t("timetable.groups.createModal.searchPlaceholder")}
                placeholderTextColor="#888"
                value={search}
                onChangeText={setSearch}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                style={[styles.rnInput, { color: theme.colors.onSurface }]}
              />
            </View>

            {loadingFriends ? (
              <View style={styles.centerLoading}>
                <Spinner color={theme.colors.primary} />
              </View>
            ) : (
              <ScrollView style={styles.friendList} showsVerticalScrollIndicator={false}>
                {filteredFriends.length > 0 ? (
                  filteredFriends.map((friend) => {
                    const isSelected = selectedFriends.includes(friend.id);
                    return (
                      <Pressable
                        key={friend.id}
                        style={[
                          styles.friendRow,
                          isSelected && {
                            backgroundColor: addAlpha(theme.colors.primary, 0.08),
                          },
                        ]}
                        onPress={() => toggleFriend(friend.id)}
                      >
                        <GluestackAvatar
                          size="md"
                          style={{ backgroundColor: theme.colors.primary, overflow: "hidden" }}
                        >
                          {getUserAvatarUrl(friend) ? (
                            <ExpoImage
                              source={{ uri: getUserAvatarUrl(friend)! }}
                              style={{ width: "100%", height: "100%", borderRadius: 100 }}
                              contentFit="cover"
                              cachePolicy="memory-disk"
                            />
                          ) : (
                            <AvatarFallbackText style={{ color: "#ffffff" }}>
                              {getUserDisplayName(friend).charAt(0).toUpperCase()}
                            </AvatarFallbackText>
                          )}
                        </GluestackAvatar>

                        <View style={styles.friendInfo}>
                          <Text
                            style={[styles.friendName, { color: theme.colors.onSurface }]}
                          >
                            {friend.first_name
                              ? `${friend.first_name} ${friend.last_name || ""}`.trim()
                              : friend.username}
                          </Text>
                          <Text style={[styles.friendUsername, { color: theme.colors.onSurface }]}>
                            @{friend.username}
                          </Text>
                        </View>

                        <Checkbox
                          value={friend.id}
                          isChecked={isSelected}
                          onChange={() => toggleFriend(friend.id)}
                          aria-label={`Select ${friend.username}`}
                        >
                          <CheckboxIndicator
                            style={{
                              borderColor: theme.colors.primary,
                              borderRadius: 6,
                            }}
                          >
                            <CheckboxIcon as={CheckIcon} />
                          </CheckboxIndicator>
                        </Checkbox>
                      </Pressable>
                    );
                  })
                ) : (
                  <View style={{ padding: 24, alignItems: "center" }}>
                    <Text style={{ opacity: 0.5 }}>
                      {t("timetable.groups.createModal.noFriends")}
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}

            <View style={styles.actions}>
              <Button
                onPress={handleBack}
                isDisabled={loading}
                variant="outline"
                style={[
                  styles.button,
                  { borderColor: addAlpha(theme.colors.onSurface, 0.2) },
                ]}
              >
                <ButtonText style={{ color: theme.colors.onSurface }}>
                  {t("common.back")}
                </ButtonText>
              </Button>
              <Button
                onPress={handleConfirm}
                isDisabled={loading}
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
              >
                <ButtonText style={{ color: "#fff", fontWeight: "700" }}>
                  {selectedFriends.length > 0
                    ? t("timetable.groups.createModal.createWithCount", {
                        count: selectedFriends.length,
                      })
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
    width: "92%",
    maxWidth: 480,
    padding: 24,
    borderRadius: 28,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
  },
  stepIndicator: {
    opacity: 0.6,
    fontWeight: "700",
    fontSize: 13,
  },
  step1Content: {
    gap: 20,
  },
  step2Content: {
    gap: 16,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  rnInput: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  friendList: {
    maxHeight: 320,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginBottom: 4,
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendName: {
    fontSize: 15,
    fontWeight: "700",
  },
  friendUsername: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 12,
  },
  button: {
    borderRadius: 16,
    height: 48,
    paddingHorizontal: 22,
  },
  centerLoading: {
    height: 160,
    justifyContent: "center",
    alignItems: "center",
  },
});

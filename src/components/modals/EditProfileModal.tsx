import React, { useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  Text,
  Button,
  ButtonText,
  Switch,
  Avatar as GluestackAvatar,
  AvatarFallbackText,
  AvatarImage,
  Pressable,
} from "@gluestack-ui/themed";
import { useAppTheme } from "../../context/ThemeProvider";
import { useTranslation } from "react-i18next";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { User } from "../../types/user";
import { userApi } from "../../api/user";
import { mediaApi } from "../../api/media";
import { useAuthStore } from "../../store/useAuthStore";
import { Camera, Image as ImageIcon, X } from "lucide-react-native";

interface EditProfileModalProps {
  visible: boolean;
  user: User;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  user,
  onClose,
}) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();
  
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState(user.first_name || "");
  const [lastName, setLastName] = useState(user.last_name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [dobString, setDobString] = useState(user.dob ? user.dob.split('T')[0] : "");
  const [isPublic, setIsPublic] = useState(user.is_public);
  const [profileImage, setProfileImage] = useState<string | null>(user.profile_media_url || null);

  const handlePickImage = async (useCamera: boolean = false) => {
    const permissionResult = useCamera 
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(t("profile.edit.permissionRequired"), useCamera ? t("profile.edit.cameraPermissionMsg") : t("profile.edit.libraryPermissionMsg"));
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let profile_media_id = user.profile_media?.id;

      // 1. Upload Image if changed
      if (profileImage && profileImage !== user.profile_media_url) {
        const filename = profileImage.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        const file = {
          uri: profileImage,
          name: filename,
          type,
        };

        const mediaResponse = await mediaApi.upload(file as any, "profile_picture");
        profile_media_id = mediaResponse.data.id;
      }

      // 2. Update Profile
      const response = await userApi.updateProfile(user.id, {
        first_name: firstName,
        last_name: lastName,
        bio: bio,
        dob: dobString || undefined,
        is_public: isPublic,
        profile_media_id,
      } as any);

      setUser(response.data);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      onClose();
    } catch (err) {
      console.error("Failed to update profile", err);
      Alert.alert(t("common.error"), t("profile.edit.updateError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={visible} onClose={onClose}>
      <ModalBackdrop />
      <ModalContent style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>{t("profile.edit.title")}</Text>
            <Pressable onPress={onClose} style={{ padding: 4 }}>
              <X size={24} color={theme.colors.onSurface} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.imageContainer}>
              <View style={styles.avatarWrapper}>
                <GluestackAvatar size="xl" style={{ backgroundColor: theme.colors.primary }}>
                  {profileImage ? (
                    <AvatarImage source={{ uri: profileImage }} alt="Profile" />
                  ) : (
                    <AvatarFallbackText style={{ color: "#ffffff" }}>
                      {(user.first_name || user.username || "U").charAt(0).toUpperCase()}
                    </AvatarFallbackText>
                  )}
                </GluestackAvatar>

                <View style={styles.imageActions}>
                  <Pressable 
                    style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                    onPress={() => handlePickImage(true)}
                  >
                    <Camera size={16} color="white" />
                  </Pressable>
                  <Pressable 
                    style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                    onPress={() => handlePickImage(false)}
                  >
                    <ImageIcon size={16} color="white" />
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.form}>
              <View style={styles.row}>
                <View style={[styles.inputRow, { flex: 1 }]}>
                  <RNTextInput
                    placeholder={t("profile.edit.firstName")}
                    placeholderTextColor="#888"
                    value={firstName}
                    onChangeText={setFirstName}
                    style={[styles.rnInput, { color: theme.colors.onSurface }]}
                  />
                </View>
                <View style={[styles.inputRow, { flex: 1 }]}>
                  <RNTextInput
                    placeholder={t("profile.edit.lastName")}
                    placeholderTextColor="#888"
                    value={lastName}
                    onChangeText={setLastName}
                    style={[styles.rnInput, { color: theme.colors.onSurface }]}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <RNTextInput
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#888"
                  value={dobString}
                  onChangeText={setDobString}
                  keyboardType="numeric"
                  maxLength={10}
                  style={[styles.rnInput, { color: theme.colors.onSurface }]}
                />
              </View>

              <View style={[styles.inputRow, { minHeight: 100 }]}>
                <RNTextInput
                  placeholder={t("profile.edit.bio")}
                  placeholderTextColor="#888"
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  style={[styles.rnInput, { color: theme.colors.onSurface, textAlignVertical: "top" }]}
                />
              </View>

              <View style={styles.privacyRow}>
                <View style={styles.privacyLabel}>
                  <Text style={{ color: theme.colors.onSurface, fontWeight: "600" }}>{t("profile.edit.publicProfile")}</Text>
                  <Text style={{ color: theme.colors.onSurface, opacity: 0.6, fontSize: 12 }}>{t("profile.edit.publicProfileSub")}</Text>
                </View>
                <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ true: theme.colors.primary }} />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              onPress={handleSave}
              isDisabled={loading}
              style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
            >
              <ButtonText style={{ color: "#fff", fontWeight: "700" }}>
                {t("common.save")}
              </ButtonText>
            </Button>
          </View>
        </KeyboardAvoidingView>
      </ModalContent>
    </Modal>
  );
};


const styles = StyleSheet.create({
  modalContent: {
    margin: 16,
    borderRadius: 24,
    overflow: "hidden",
    height: "90%",
    backgroundColor: "transparent",
  },
  blurContainer: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: "rgba(10, 10, 15, 0.8)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 24,
    paddingRight: 8,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.15)",
  },
  headerTitle: {
    fontWeight: "bold",
  },
  scrollContent: {
    padding: 24,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarWrapper: {
    position: "relative",
  },
  imageActions: {
    position: "absolute",
    bottom: -10,
    right: -20,
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 24,
    paddingHorizontal: 4,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
  },
  form: {
    gap: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(150,150,150,0.3)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  rnInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  privacyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  privacyLabel: {
    flex: 1,
  },
  privacySub: {
    opacity: 0.6,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  saveButton: {
    borderRadius: 12,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
});



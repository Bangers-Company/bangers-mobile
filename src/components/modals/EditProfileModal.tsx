import React, { useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import {
  Modal,
  Portal,
  Text,
  Button,
  TextInput,
  Switch,
  useTheme,
  Avatar,
  IconButton,
} from "react-native-paper";
import { useTranslation } from "react-i18next";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { User } from "../../types/user";
import { userApi } from "../../api/user";
import { mediaApi } from "../../api/media";
import { useAuthStore } from "../../store/useAuthStore";
import { Camera, Image as ImageIcon, X } from "lucide-react-native";
import { DatePickerInput } from "react-native-paper-dates";

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
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();
  
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState(user.first_name || "");
  const [lastName, setLastName] = useState(user.last_name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [dob, setDob] = useState<Date | undefined>(user.dob ? new Date(user.dob) : undefined);
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
        dob: dob?.toISOString().split('T')[0],
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
    <Portal>
      {visible && (
        <Animated.View 
          entering={FadeIn} 
          exiting={FadeOut}
          style={StyleSheet.absoluteFill}
        >
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        </Animated.View>
      )}
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.modalContent}
        theme={{ colors: { backdrop: "transparent" } }}
      >
        <BlurView intensity={100} tint="dark" style={styles.blurContainer}>
          <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
            style={{ flex: 1 }}
          >
            <View style={styles.header}>
              <Text variant="titleLarge" style={styles.headerTitle}>{t("profile.edit.title")}</Text>
              <IconButton icon={() => <X size={24} color={theme.colors.onSurface} />} onPress={onClose} />
            </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.imageContainer}>
              <View style={styles.avatarWrapper}>
                {profileImage ? (
                  <Avatar.Image size={100} source={{ uri: profileImage }} style={{ borderRadius: 28 }} />
                ) : (
                  <Avatar.Text size={100} label={(user.username || user.first_name || "U").substring(0, 2).toUpperCase()} style={{ borderRadius: 28 }} />
                )}
                <View style={styles.imageActions}>
                  <IconButton 
                    icon={() => <Camera size={20} color="white" />} 
                    style={styles.actionButton}
                    onPress={() => handlePickImage(true)}
                  />
                  <IconButton 
                    icon={() => <ImageIcon size={20} color="white" />} 
                    style={styles.actionButton}
                    onPress={() => handlePickImage(false)}
                  />
                </View>
              </View>
            </View>

            <View style={styles.form}>
              <View style={styles.row}>
                <TextInput
                  label={t("profile.edit.firstName")}
                  value={firstName}
                  onChangeText={setFirstName}
                  mode="outlined"
                  style={[styles.pillInput, { flex: 1 }]}
                  outlineStyle={styles.pillOutline}
                />
                <TextInput
                  label={t("profile.edit.lastName")}
                  value={lastName}
                  onChangeText={setLastName}
                  mode="outlined"
                  style={[styles.pillInput, { flex: 1 }]}
                  outlineStyle={styles.pillOutline}
                />
              </View>

              <DatePickerInput
                locale={i18n.language}
                label={t("profile.edit.dob")}
                value={dob}
                onChange={(d) => setDob(d)}
                inputMode="start"
                mode="outlined"
                style={styles.pillInput}
                outlineStyle={styles.pillOutline}
              />

              <TextInput
                label={t("profile.edit.bio")}
                value={bio}
                onChangeText={setBio}
                mode="outlined"
                multiline
                numberOfLines={6}
                style={[styles.pillInput, { minHeight: 120 }]}
                outlineStyle={styles.pillOutline}
              />

              <View style={styles.privacyRow}>
                <View style={styles.privacyLabel}>
                  <Text variant="bodyLarge">{t("profile.edit.publicProfile")}</Text>
                  <Text variant="bodySmall" style={styles.privacySub}>{t("profile.edit.publicProfileSub")}</Text>
                </View>
                <Switch value={isPublic} onValueChange={setIsPublic} />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={loading}
              disabled={loading}
              style={styles.saveButton}
              contentStyle={styles.saveButtonContent}
            >
              {t("common.save")}
            </Button>
          </View>
          </KeyboardAvoidingView>
        </BlurView>
      </Modal>
    </Portal>
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
    margin: 0,
  },
  form: {
    gap: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  input: {
    backgroundColor: "transparent",
  },
  pillInput: {
    backgroundColor: "transparent",
  },
  pillOutline: {
    borderRadius: 14,
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
  },
  saveButtonContent: {
    height: 52,
  },
});

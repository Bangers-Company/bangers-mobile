import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
  Modal,
  Pressable as RNPressable,
  Dimensions,
  PanResponder,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import {
  Text,
  Button,
  ButtonText,
  Switch,
  Avatar as GluestackAvatar,
  AvatarFallbackText,
  Pressable,
} from "@gluestack-ui/themed";
import { useAppTheme } from "../../context/ThemeProvider";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { User } from "../../types/user";
import { userApi } from "../../api/user";
import { mediaApi } from "../../api/media";
import { useAuthStore } from "../../store/useAuthStore";
import { getUserAvatarUrl, getUserDisplayName } from "../../utils/format";
import { Image as ExpoImage } from "expo-image";
import { Camera, ChevronDown, Image as ImageIcon, X } from "lucide-react-native";
import { addAlpha } from "../../utils/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface EditProfileBottomSheetProps {
  visible: boolean;
  user: User;
  onClose: () => void;
}

export const EditProfileBottomSheet: React.FC<EditProfileBottomSheetProps> = ({
  visible,
  user,
  onClose,
}) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { top, bottom } = useSafeAreaInsets();
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Form State - Pre-filled from User
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [dobString, setDobString] = useState(user?.dob ? user.dob.split("T")[0] : "");
  const [isPublic, setIsPublic] = useState(Boolean(user?.is_public));
  const [profileImage, setProfileImage] = useState<string | null>(getUserAvatarUrl(user) || null);

  // Focus states for input styling
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Pre-fill data whenever bottom sheet opens or user updates
  useEffect(() => {
    if (visible && user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setBio(user.bio || "");
      setDobString(user.dob ? user.dob.split("T")[0] : "");
      setIsPublic(Boolean(user.is_public));
      setProfileImage(getUserAvatarUrl(user) || null);
    }
  }, [visible, user]);

  // Bottom Sheet Dimensions & Anchored Offsets
  const maxSheetHeight = SCREEN_HEIGHT - top;
  const halfPageOffset = SCREEN_HEIGHT * 0.48; // Opens at ~52% Half-Page height
  const fullPageOffset = 0; // Full screen height

  // Animation Shared Values
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const dragY = useSharedValue(0);
  const opacity = useSharedValue(0);

  // Crisp, firm position transition without bouncy elastic overshoot
  const animateToPos = (targetPos: number, duration: number = 220) => {
    translateY.value = withTiming(targetPos, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  };

  const handleInputFocus = (field: string) => {
    setFocusedField(field);
    if (!isFullScreen) {
      setIsFullScreen(true);
      animateToPos(fullPageOffset, 220);
    }
  };

  useEffect(() => {
    if (visible) {
      dragY.value = 0;
      setIsFullScreen(false);
      opacity.value = withTiming(1, { duration: 200 });
      // Open crisply to Half-Page
      animateToPos(halfPageOffset, 220);
    } else {
      opacity.value = withTiming(0, { duration: 180 });
      translateY.value = withTiming(SCREEN_HEIGHT, {
        duration: 220,
        easing: Easing.in(Easing.cubic),
      });
    }
  }, [visible]);

  const handleDismiss = () => {
    opacity.value = withTiming(0, { duration: 180 });
    translateY.value = withTiming(
      SCREEN_HEIGHT,
      { duration: 220, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(setIsFullScreen)(false);
          runOnJS(onClose)();
        }
      }
    );
  };

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => {
    const rawPos = translateY.value + dragY.value;
    const clampedY = Math.max(fullPageOffset, rawPos);
    return {
      transform: [{ translateY: clampedY }],
    };
  });

  const handlePickImage = async (useCamera: boolean = false) => {
    const permissionResult = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        t("profile.edit.permissionRequired"),
        useCamera
          ? t("profile.edit.cameraPermissionMsg")
          : t("profile.edit.libraryPermissionMsg")
      );
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    const newFullName = `${firstName} ${lastName}`.trim();
    // 1. Prepare optimistic user object
    const optimisticUser: User = {
      ...user,
      first_name: firstName,
      last_name: lastName,
      full_name: newFullName,
      name: newFullName,
      display_name: newFullName,
      bio: bio,
      dob: dobString || user?.dob,
      is_public: isPublic,
      profile_media_url: profileImage || user?.profile_media_url,
      profile_photo_url: profileImage || user?.profile_photo_url,
    };

    // 2. OPTIMISTIC UPDATE: Update Zustand store & React Query cache instantly (0ms latency!)
    setUser(optimisticUser);
    queryClient.setQueryData(["profile"], (old: any) => ({
      ...old,
      ...optimisticUser,
    }));
    queryClient.setQueryData(["user", user.id], (old: any) => ({
      ...old,
      ...optimisticUser,
    }));
    queryClient.setQueryData(["me"], (old: any) => ({
      ...old,
      ...optimisticUser,
    }));

    try {
      const { usersRepository } = await import("../../database/repositories/users.repository");
      await usersRepository.upsertMe(optimisticUser);
    } catch (e) {
      console.warn("Could not sync optimistic me to local database", e);
    }

    // 3. Dismiss bottom sheet IMMEDIATELY (0ms waiting!)
    handleDismiss();

    // 4. Perform background API call & local SQLite sync
    try {
      let profile_media_id = user.profile_media?.id;

      if (profileImage && profileImage !== getUserAvatarUrl(user)) {
        const filename = profileImage.split("/").pop() || "profile.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        const file = {
          uri: profileImage,
          name: filename,
          type,
        };

        const mediaResponse = await mediaApi.upload(file as any, "profile_picture");
        profile_media_id = mediaResponse.data.id;
      }

      const response = await userApi.updateProfile(user.id, {
        first_name: firstName,
        last_name: lastName,
        bio: bio,
        dob: dobString || undefined,
        is_public: isPublic,
        profile_media_id,
      } as any);

      // Sync real server response
      setUser(response.data);
      queryClient.setQueryData(["profile"], (old: any) => ({
        ...old,
        ...response.data,
      }));

      try {
        const { usersRepository } = await import("../../database/repositories/users.repository");
        await usersRepository.upsertMe(response.data);
      } catch (e) {
        console.warn("Could not sync me to local database", e);
      }

      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["user", user.id] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    } catch (err) {
      console.error("Background profile update failed", err);
      // Revert to original user data on error
      setUser(user);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    }
  };

  // PanResponder for drag gestures: Swiping DOWN saves and closes, Swiping UP expands full screen
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 3,
      onPanResponderMove: (_, gestureState) => {
        dragY.value = gestureState.dy;
      },
      onPanResponderRelease: (_, gestureState) => {
        const totalDy = gestureState.dy;
        const vy = gestureState.vy;
        dragY.value = 0;

        if (!isFullScreen) {
          // Currently in HALF PAGE mode
          if (totalDy < -40 || vy < -0.4) {
            // Swiped UP -> Expand firmly to FULL SCREEN
            setIsFullScreen(true);
            animateToPos(fullPageOffset, 220);
          } else if (totalDy > 80 || vy > 0.5) {
            // Swiped DOWN -> Auto-Save profile and Close sheet!
            handleSave();
          } else {
            // Snap back to HALF PAGE firmly
            animateToPos(halfPageOffset, 180);
          }
        } else {
          // Currently in FULL SCREEN mode
          if (totalDy > 60 || vy > 0.5) {
            // Swiped DOWN -> Auto-Save profile and Close sheet!
            handleSave();
          } else {
            // Snap back to FULL SCREEN firmly
            animateToPos(fullPageOffset, 180);
          }
        }
      },
    })
  ).current;

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleDismiss}>
      <View style={styles.container}>
        <RNPressable style={StyleSheet.absoluteFill} onPress={handleSave}>
          <Animated.View
            style={[
              styles.backdrop,
              { backgroundColor: "rgba(0, 0, 0, 0.65)" },
              backdropStyle,
            ]}
          />
        </RNPressable>

        <Animated.View
          style={[
            styles.sheet,
            {
              height: maxSheetHeight,
              backgroundColor: theme.colors.surface,
              paddingBottom: Math.max(bottom, 16),
            },
            sheetStyle,
          ]}
        >
          {/* Real-Time Drag Handle & Header Section with ChevronDown Swipe Indicator */}
          <View
            {...panResponder.panHandlers}
            style={[
              styles.topSwipeArea,
              { paddingTop: isFullScreen ? Math.max(top, 12) : 6 },
            ]}
          >
            <View style={styles.dragHandleContainer}>
              <View
                style={[
                  styles.dragHandle,
                  { backgroundColor: addAlpha(theme.colors.onSurface, 0.3) },
                ]}
              />
              <ChevronDown
                size={20}
                color={addAlpha(theme.colors.onSurface, 0.5)}
                style={{ marginTop: 2 }}
              />
            </View>

            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
                {t("profile.edit.title", "Profiel bewerken")}
              </Text>
              <Pressable onPress={handleSave} style={styles.iconButton}>
                <X size={22} color={theme.colors.onSurface} />
              </Pressable>
            </View>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Profile Image Avatar Section */}
              <View style={styles.imageContainer}>
                <View style={styles.avatarWrapper}>
                  <GluestackAvatar size="xl" style={{ backgroundColor: theme.colors.primary, overflow: "hidden" }}>
                    {profileImage ? (
                      <ExpoImage
                        source={{ uri: profileImage }}
                        style={{ width: "100%", height: "100%", borderRadius: 100 }}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <AvatarFallbackText style={{ color: "#ffffff" }}>
                        {getUserDisplayName(user).charAt(0).toUpperCase()}
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

              {/* Form Fields */}
              <View style={styles.form}>
                <View style={styles.row}>
                  <View
                    style={[
                      styles.inputContainer,
                      { flex: 1 },
                      focusedField === "firstName" && {
                        borderColor: theme.colors.primary,
                        backgroundColor: addAlpha(theme.colors.primary, 0.05),
                      },
                    ]}
                  >
                    <RNTextInput
                      placeholder={t("profile.edit.firstName", "Voornaam")}
                      placeholderTextColor="#888"
                      value={firstName}
                      onChangeText={setFirstName}
                      onFocus={() => handleInputFocus("firstName")}
                      onBlur={() => setFocusedField(null)}
                      style={[styles.rnInput, { color: theme.colors.onSurface }]}
                    />
                  </View>
                  <View
                    style={[
                      styles.inputContainer,
                      { flex: 1 },
                      focusedField === "lastName" && {
                        borderColor: theme.colors.primary,
                        backgroundColor: addAlpha(theme.colors.primary, 0.05),
                      },
                    ]}
                  >
                    <RNTextInput
                      placeholder={t("profile.edit.lastName", "Achternaam")}
                      placeholderTextColor="#888"
                      value={lastName}
                      onChangeText={setLastName}
                      onFocus={() => handleInputFocus("lastName")}
                      onBlur={() => setFocusedField(null)}
                      style={[styles.rnInput, { color: theme.colors.onSurface }]}
                    />
                  </View>
                </View>

                {/* Date of Birth Input */}
                <View
                  style={[
                    styles.inputContainer,
                    focusedField === "dob" && {
                      borderColor: theme.colors.primary,
                      backgroundColor: addAlpha(theme.colors.primary, 0.05),
                    },
                  ]}
                >
                  <RNTextInput
                    placeholder="Geboortedatum (JJJJ-MM-DD)"
                    placeholderTextColor="#888"
                    value={dobString}
                    onChangeText={setDobString}
                    onFocus={() => handleInputFocus("dob")}
                    onBlur={() => setFocusedField(null)}
                    keyboardType="numeric"
                    maxLength={10}
                    style={[styles.rnInput, { color: theme.colors.onSurface }]}
                  />
                </View>

                {/* Bio Input */}
                <View
                  style={[
                    styles.inputContainer,
                    { minHeight: 110, alignItems: "flex-start" },
                    focusedField === "bio" && {
                      borderColor: theme.colors.primary,
                      backgroundColor: addAlpha(theme.colors.primary, 0.05),
                    },
                  ]}
                >
                  <RNTextInput
                    placeholder={t("profile.edit.bio", "Bio / Over jezelf")}
                    placeholderTextColor="#888"
                    value={bio}
                    onChangeText={setBio}
                    onFocus={() => handleInputFocus("bio")}
                    onBlur={() => setFocusedField(null)}
                    multiline
                    style={[
                      styles.rnInput,
                      { color: theme.colors.onSurface, textAlignVertical: "top" },
                    ]}
                  />
                </View>

                {/* Public Profile Switch */}
                <View
                  style={[
                    styles.privacyRow,
                    { borderTopColor: addAlpha(theme.colors.onSurface, 0.1) },
                  ]}
                >
                  <View style={styles.privacyLabel}>
                    <Text
                      style={{ color: theme.colors.onSurface, fontWeight: "600", fontSize: 15 }}
                    >
                      {t("profile.edit.publicProfile", "Openbaar profiel")}
                    </Text>
                    <Text
                      style={{ color: theme.colors.onSurface, opacity: 0.6, fontSize: 12, marginTop: 2 }}
                    >
                      {t(
                        "profile.edit.publicProfileSub",
                        "Andere gebruikers kunnen je rooster en favorieten inzien"
                      )}
                    </Text>
                  </View>
                  <Switch
                    value={isPublic}
                    onValueChange={setIsPublic}
                    trackColor={{ true: theme.colors.primary }}
                  />
                </View>
              </View>
            </ScrollView>

            <View
              style={[
                styles.footer,
                { borderTopColor: addAlpha(theme.colors.onSurface, 0.1) },
              ]}
            >
              <Button
                onPress={handleSave}
                isDisabled={loading}
                style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
              >
                <ButtonText style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                  {loading ? t("common.saving", "Opslaan...") : t("common.save", "Opslaan")}
                </ButtonText>
              </Button>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Export alias EditProfileModal for backwards compatibility
export const EditProfileModal = EditProfileBottomSheet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    width: "100%",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  topSwipeArea: {
    width: "100%",
  },
  dragHandleContainer: {
    alignItems: "center",
    paddingTop: 6,
    paddingBottom: 2,
  },
  dragHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  iconButton: {
    padding: 6,
    borderRadius: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarWrapper: {
    position: "relative",
  },
  imageActions: {
    position: "absolute",
    bottom: -6,
    right: -12,
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  actionButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(150,150,150,0.3)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  privacyLabel: {
    flex: 1,
    paddingRight: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  saveButton: {
    borderRadius: 16,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
});

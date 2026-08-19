import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Dimensions,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  TextInput as RNTextInput,
  LayoutChangeEvent,
} from "react-native";
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  Text,
  Button,
  ButtonText,
  Pressable,
} from "@gluestack-ui/themed";
import { useAppTheme } from "../../context/ThemeProvider";
import { useTranslation } from "react-i18next";
import { BlurView } from "expo-blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { User, Genre } from "../../types/user";
import { userApi } from "../../api/user";
import { genreApi } from "../../api/genres";
import { useAuthStore } from "../../store/useAuthStore";
import { Music, User as UserIcon, PartyPopper, CheckCircle } from "lucide-react-native";
import { addAlpha } from "../../utils/theme";

interface OnboardingModalProps {
  visible: boolean;
  user: User;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  visible,
  user,
  onComplete,
}) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const setUser = useAuthStore((state) => state.setUser);
  const setIsJustRegistered = useAuthStore((state) => state.setIsJustRegistered);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [availableGenres, setAvailableGenres] = useState<Genre[]>([]);
  const [contentWidth, setContentWidth] = useState(300);

  // Form State
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [bio, setBio] = useState(user?.bio || "");

  // Animation
  const slideAnim = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      fetchGenres();
    }
  }, [visible]);

  const fetchGenres = async () => {
    try {
      const response = await genreApi.getGenres();
      setAvailableGenres(response.data);
    } catch (err) {
      console.error("Failed to fetch genres", err);
    }
  };

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    if (width > 0 && width !== contentWidth) {
      setContentWidth(width);
      slideAnim.value = -step * width;
    }
  };

  const handleNext = () => {
    if (step < 3) {
      const nextStep = step + 1;
      setStep(nextStep);
      slideAnim.value = withTiming(-nextStep * contentWidth, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      const prevStep = step - 1;
      setStep(prevStep);
      slideAnim.value = withTiming(-prevStep * contentWidth, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await userApi.updateProfile(user.id, {
        first_name: firstName,
        last_name: lastName,
        bio: bio,
        genres: selectedGenres,
      } as any);

      setUser(response.data);
      setIsJustRegistered(false);
      onComplete();
    } catch (err) {
      console.error("Failed to complete onboarding", err);
      setIsJustRegistered(false);
      onComplete();
    } finally {
      setLoading(false);
    }
  };

  const toggleGenre = (id: string) => {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideAnim.value }],
  }));

  const renderStep = () => {
    return (
      <Animated.View style={[styles.stepsContainer, { width: contentWidth * 4 }, animatedStyle]}>
        {/* STEP 0: Welcome Greeting */}
        <View style={[styles.stepPage, { width: contentWidth }]}>
          <View style={[styles.iconContainer, { backgroundColor: addAlpha(theme.colors.primary, 0.15) }]}>
            <PartyPopper size={44} color={theme.colors.primary} />
          </View>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            {t("onboarding.welcome.title") || "Welcome to Bangers!"}
          </Text>
          <Text style={[styles.description, { color: addAlpha(theme.colors.onSurface, 0.7) }]}>
            {t("onboarding.welcome.description") || "Your ultimate festival companion is ready. Let's personalize your festival experience in a few quick steps!"}
          </Text>
        </View>

        {/* STEP 1: Identity */}
        <View style={[styles.stepPage, { width: contentWidth }]}>
          <View style={[styles.iconContainer, { backgroundColor: addAlpha(theme.colors.primary, 0.15) }]}>
            <UserIcon size={38} color={theme.colors.primary} />
          </View>
          <Text style={[styles.stepTitle, { color: theme.colors.onSurface }]}>
            {t("onboarding.identity.title") || "What's your name?"}
          </Text>
          <Text style={[styles.stepSub, { color: addAlpha(theme.colors.onSurface, 0.6) }]}>
            {t("onboarding.identity.subtitle") || "Let your festival crew know who you are"}
          </Text>
          <View style={styles.form}>
            <View style={styles.nameRow}>
              <View
                style={[
                  styles.inputRow,
                  {
                    flex: 1,
                    backgroundColor: addAlpha(theme.colors.surface, 0.8),
                    borderColor: addAlpha(theme.colors.outline, 0.15),
                  },
                ]}
              >
                <RNTextInput
                  placeholder={t("onboarding.identity.firstName") || "First Name"}
                  placeholderTextColor="#888"
                  value={firstName}
                  onChangeText={setFirstName}
                  style={[styles.rnInput, { color: theme.colors.onSurface }]}
                />
              </View>
              <View
                style={[
                  styles.inputRow,
                  {
                    flex: 1,
                    backgroundColor: addAlpha(theme.colors.surface, 0.8),
                    borderColor: addAlpha(theme.colors.outline, 0.15),
                  },
                ]}
              >
                <RNTextInput
                  placeholder={t("onboarding.identity.lastName") || "Last Name"}
                  placeholderTextColor="#888"
                  value={lastName}
                  onChangeText={setLastName}
                  style={[styles.rnInput, { color: theme.colors.onSurface }]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* STEP 2: Genres */}
        <View style={[styles.stepPage, { width: contentWidth }]}>
          <View style={[styles.iconContainer, { backgroundColor: addAlpha(theme.colors.primary, 0.15) }]}>
            <Music size={38} color={theme.colors.primary} />
          </View>
          <Text style={[styles.stepTitle, { color: theme.colors.onSurface }]}>
            {t("onboarding.genres.title") || "Favorite Music Styles"}
          </Text>
          <Text style={[styles.stepSub, { color: addAlpha(theme.colors.onSurface, 0.6) }]}>
            {t("onboarding.genres.subtitle") || "Pick genres to get tailored stage suggestions"}
          </Text>
          <ScrollView
            style={styles.genresScroll}
            contentContainerStyle={styles.genresGrid}
            showsVerticalScrollIndicator={false}
          >
            {availableGenres.map((genre) => {
              const isSelected = selectedGenres.includes(genre.id);
              return (
                <Pressable
                  key={genre.id}
                  onPress={() => toggleGenre(genre.id)}
                  style={[
                    styles.genreBadge,
                    isSelected
                      ? {
                          backgroundColor: addAlpha(theme.colors.primary, 0.2),
                          borderColor: theme.colors.primary,
                        }
                      : {
                          backgroundColor: addAlpha(theme.colors.surface, 0.6),
                          borderColor: addAlpha(theme.colors.outline, 0.12),
                        },
                  ]}
                >
                  <Text
                    style={[
                      styles.genreText,
                      {
                        color: isSelected
                          ? theme.colors.primary
                          : addAlpha(theme.colors.onSurface, 0.8),
                      },
                    ]}
                  >
                    {genre.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* STEP 3: Ready */}
        <View style={[styles.stepPage, { width: contentWidth }]}>
          <View style={[styles.iconContainer, { backgroundColor: addAlpha(theme.colors.primary, 0.15) }]}>
            <CheckCircle size={44} color={theme.colors.primary} />
          </View>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            {t("onboarding.ready.title") || "You're all set!"}
          </Text>
          <Text style={[styles.description, { color: addAlpha(theme.colors.onSurface, 0.7) }]}>
            {t("onboarding.ready.description") || "Explore lineup timetables, add acts to your schedule, and dance with friends!"}
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <Modal isOpen={visible} onClose={onComplete}>
      <ModalBackdrop style={styles.backdrop} />
      <ModalContent
        style={[
          styles.modalContent,
          {
            backgroundColor: addAlpha(theme.colors.surface, 0.95),
            borderColor: addAlpha(theme.colors.primary, 0.3),
          },
        ]}
      >
        <BlurView intensity={Platform.OS === "ios" ? 40 : 100} tint="dark" style={styles.blurContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.avoidingView}
          >
            {/* Step Indicators */}
            <View style={styles.indicatorContainer}>
              {[0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.indicator,
                    {
                      backgroundColor:
                        i === step
                          ? theme.colors.primary
                          : addAlpha(theme.colors.onSurface, 0.18),
                      width: i === step ? 24 : 8,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Dynamic Measurement Window */}
            <View style={styles.sliderWindow} onLayout={handleLayout}>
              {renderStep()}
            </View>

            {/* Controls */}
            <View style={styles.controlsRow}>
              {step > 0 ? (
                <Button
                  variant="outline"
                  onPress={handlePrev}
                  style={[
                    styles.navBtn,
                    { borderColor: addAlpha(theme.colors.outline, 0.2) },
                  ]}
                >
                  <ButtonText style={{ color: theme.colors.onSurface }}>
                    {t("common.back") || "Back"}
                  </ButtonText>
                </Button>
              ) : (
                <View style={{ width: 80 }} />
              )}

              {step < 3 ? (
                <Button
                  onPress={handleNext}
                  style={[styles.navBtn, { backgroundColor: theme.colors.primary }]}
                >
                  <ButtonText style={{ color: "#ffffff", fontWeight: "800" }}>
                    {t("common.next") || "Next"}
                  </ButtonText>
                </Button>
              ) : (
                <Button
                  onPress={handleSubmit}
                  isDisabled={loading}
                  style={[styles.navBtn, { backgroundColor: theme.colors.primary }]}
                >
                  <ButtonText style={{ color: "#ffffff", fontWeight: "900" }}>
                    {loading ? t("common.saving") || "Saving..." : t("common.getStarted") || "Get Started"}
                  </ButtonText>
                </Button>
              )}
            </View>
          </KeyboardAvoidingView>
        </BlurView>
      </ModalContent>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
  modalContent: {
    width: "88%",
    maxWidth: 440,
    alignSelf: "center",
    borderRadius: 26,
    borderWidth: 1,
    overflow: "hidden",
    height: "65%",
    maxHeight: 520,
  },
  blurContainer: {
    flex: 1,
    padding: 20,
  },
  avoidingView: {
    flex: 1,
    justifyContent: "space-between",
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  indicator: {
    height: 6,
    borderRadius: 3,
  },
  sliderWindow: {
    flex: 1,
    overflow: "hidden",
    width: "100%",
  },
  stepsContainer: {
    flexDirection: "row",
    height: "100%",
  },
  stepPage: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 19,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 4,
  },
  stepSub: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 14,
  },
  description: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 8,
  },
  form: {
    width: "100%",
    marginTop: 10,
  },
  nameRow: {
    flexDirection: "row",
    gap: 10,
  },
  inputRow: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  rnInput: {
    fontSize: 14,
    fontWeight: "600",
  },
  genresScroll: {
    width: "100%",
    maxHeight: 180,
  },
  genresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  genreBadge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  genreText: {
    fontSize: 12,
    fontWeight: "800",
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
  },
  navBtn: {
    minWidth: 90,
    height: 44,
    borderRadius: 14,
  },
});

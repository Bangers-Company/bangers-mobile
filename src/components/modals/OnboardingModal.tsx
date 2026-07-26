import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Dimensions,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import {
  Modal,
  Portal,
  Text,
  Button,
  TextInput,
  Chip,
  useTheme,
  IconButton,
} from "react-native-paper";
import { useTranslation } from "react-i18next";
import { BlurView } from "expo-blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { User, Genre } from "../../types/user";
import { userApi } from "../../api/user";
import { genreApi } from "../../api/genres";
import { useAuthStore } from "../../store/useAuthStore";
import { Music, User as UserIcon, BookOpen, PartyPopper, CheckCircle } from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MODAL_MARGIN = 20;
const LAYOUT_PADDING = 24;
const PAGE_WIDTH = SCREEN_WIDTH - (MODAL_MARGIN * 2) - (LAYOUT_PADDING * 2);

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
  const theme = useTheme();
  const setUser = useAuthStore((state) => state.setUser);
  
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [availableGenres, setAvailableGenres] = useState<Genre[]>([]);
  
  // Form State
  const [firstName, setFirstName] = useState(user.first_name || "");
  const [lastName, setLastName] = useState(user.last_name || "");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [bio, setBio] = useState(user.bio || "");

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

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
      slideAnim.value = withTiming(-(step + 1) * PAGE_WIDTH, {
        duration: 400,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      slideAnim.value = withTiming(-(step - 1) * PAGE_WIDTH, {
        duration: 400,
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
      onComplete();
    } catch (err) {
      console.error("Failed to complete onboarding", err);
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
      <Animated.View style={[styles.stepsContainer, animatedStyle]}>
        {/* STEP 0: Welcome */}
        <View style={styles.stepPage}>
           <PartyPopper size={64} color={theme.colors.primary} style={styles.icon} />
           <Text variant="headlineLarge" style={styles.title}>{t("onboarding.welcome.title")}</Text>
           <Text variant="bodyLarge" style={styles.description}>
             {t("onboarding.welcome.description")}
           </Text>
        </View>

        {/* STEP 1: Identity */}
        <View style={styles.stepPage}>
           <UserIcon size={48} color={theme.colors.primary} style={styles.icon} />
           <Text variant="headlineMedium" style={styles.stepTitle}>{t("onboarding.identity.title")}</Text>
           <Text variant="bodyMedium" style={styles.stepSub}>{t("onboarding.identity.subtitle")}</Text>
           <View style={styles.form}>
            <View style={styles.nameRow}>
              <TextInput
                label={t("onboarding.identity.firstName")}
                value={firstName}
                onChangeText={setFirstName}
                mode="outlined"
                style={[styles.pillInput, { flex: 1 }]}
                outlineStyle={styles.pillOutline}
              />
              <TextInput
                label={t("onboarding.identity.lastName")}
                value={lastName}
                onChangeText={setLastName}
                mode="outlined"
                style={[styles.pillInput, { flex: 1 }]}
                outlineStyle={styles.pillOutline}
              />
            </View>
           </View>
        </View>

        {/* STEP 2: Genres */}
        <View style={styles.stepPage}>
           <Music size={48} color={theme.colors.primary} style={styles.icon} />
           <Text variant="headlineMedium" style={styles.stepTitle}>{t("onboarding.genres.title")}</Text>
           <Text variant="bodyMedium" style={styles.stepSub}>{t("onboarding.genres.subtitle")}</Text>
           <ScrollView contentContainerStyle={styles.genresList}>
             <View style={styles.chipGrid}>
               {availableGenres.map((genre) => (
                  <Chip
                    key={genre.id}
                    selected={selectedGenres.includes(genre.id)}
                    onPress={() => toggleGenre(genre.id)}
                    style={[
                      styles.chip,
                      selectedGenres.includes(genre.id) && {
                        backgroundColor: theme.colors.primary,
                        shadowColor: theme.colors.primary,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.8,
                        shadowRadius: 10,
                        elevation: 10,
                      }
                    ]}
                    selectedColor={selectedGenres.includes(genre.id) ? "white" : undefined}
                    showSelectedCheck
                  >
                   {genre.name}
                 </Chip>
               ))}
             </View>
           </ScrollView>
        </View>

        {/* STEP 3: Bio */}
        <View style={styles.stepPage}>
           <BookOpen size={48} color={theme.colors.primary} style={styles.icon} />
           <Text variant="headlineMedium" style={styles.stepTitle}>{t("onboarding.bio.title")}</Text>
           <Text variant="bodyMedium" style={styles.stepSub}>{t("onboarding.bio.subtitle")}</Text>
            <TextInput
              label={t("onboarding.bio.title")}
              value={bio}
              onChangeText={setBio}
              mode="outlined"
              multiline
              numberOfLines={6}
              style={styles.pillTextArea}
              outlineStyle={styles.pillOutline}
              placeholder={t("onboarding.bio.placeholder")}
            />
        </View>

        {/* STEP 4: Features */}
        <View style={styles.stepPage}>
           <CheckCircle size={64} color={theme.colors.primary} style={styles.icon} />
           <Text variant="headlineMedium" style={styles.stepTitle}>{t("onboarding.finish.title")}</Text>
           <View style={styles.featureList}>
             <View style={styles.featureItem}>
               <PartyPopper size={20} color={theme.colors.secondary} />
               <Text variant="bodyMedium" style={styles.featureText}>{t("onboarding.finish.feature1")}</Text>
             </View>
             <View style={styles.featureItem}>
               <UserIcon size={20} color={theme.colors.secondary} />
               <Text variant="bodyMedium" style={styles.featureText}>{t("onboarding.finish.feature2")}</Text>
             </View>
             <View style={styles.featureItem}>
               <Music size={20} color={theme.colors.secondary} />
               <Text variant="bodyMedium" style={styles.featureText}>{t("onboarding.finish.feature3")}</Text>
             </View>
           </View>
        </View>
      </Animated.View>
    );
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
        dismissable={false}
        contentContainerStyle={styles.modalContent}
        theme={{ colors: { backdrop: "transparent" } }}
      >
        <BlurView intensity={100} tint="dark" style={styles.blurContainer}>
          <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
            style={styles.layout}
          >
            <View style={styles.header}>
              <View style={styles.headerColumn}>
                {step > 0 && (
                  <IconButton
                    icon="chevron-left"
                    onPress={handleBack}
                    size={24}
                  />
                )}
              </View>
              
              <View style={styles.progressContainer}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.progressDot,
                      {
                        backgroundColor:
                          i <= step
                            ? theme.colors.primary
                            : theme.colors.surfaceVariant,
                        shadowColor: i <= step ? theme.colors.primary : "transparent",
                      },
                    ]}
                  />
                ))}
              </View>

              <View style={styles.headerColumn} />
            </View>

            <View style={styles.contentWrapper}>
              {renderStep()}
            </View>

            <View style={styles.footer}>
              <Button
                mode="contained"
                onPress={handleNext}
                loading={loading}
                disabled={loading || (step === 1 && (!firstName || !lastName))}
                style={styles.nextButton}
                contentStyle={styles.buttonContent}
              >
                {step === 4 ? t("onboarding.finish.ready") : t("common.next")}
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
    margin: MODAL_MARGIN,
    borderRadius: 24,
    overflow: "hidden",
    height: "65%",
    backgroundColor: "transparent",
  },
  blurContainer: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: "rgba(10, 10, 15, 0.8)",
  },
  layout: {
    flex: 1,
    padding: LAYOUT_PADDING,
    paddingBottom: 32, // More room for bottom button
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    height: 48,
  },
  headerColumn: {
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  progressContainer: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
    justifyContent: "center",
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  contentWrapper: {
    flex: 1,
    overflow: "hidden",
  },
  stepsContainer: {
    flexDirection: "row",
    width: PAGE_WIDTH * 5,
    flex: 1,
  },
  stepPage: {
    width: PAGE_WIDTH,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 16,
  },
  description: {
    textAlign: "center",
    opacity: 0.7,
    lineHeight: 24,
  },
  stepTitle: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  stepSub: {
    opacity: 0.6,
    marginBottom: 32,
  },
  form: {
    width: "100%",
    gap: 16,
  },
  nameRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
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
  genresList: {
    flexGrow: 1,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    paddingBottom: 20,
  },
  chip: {
    marginBottom: 4,
  },
  textArea: {
    width: "100%",
    backgroundColor: "transparent",
    minHeight: 140,
  },
  pillTextArea: {
    width: "100%",
    backgroundColor: "transparent",
    minHeight: 140,
  },
  featureList: {
    gap: 20,
    marginTop: 20,
    width: "100%",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    opacity: 0.8,
  },
  footer: {
    marginTop: 24,
  },
  nextButton: {
    borderRadius: 12,
  },
  buttonContent: {
    height: 52,
  },
});

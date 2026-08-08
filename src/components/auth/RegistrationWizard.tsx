import React, { useState, useMemo } from "react";
import { StyleSheet, View, useWindowDimensions, TextInput as RNTextInput, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import {
  Button,
  ButtonText,
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckIcon,
  Text,
  Input,
  InputField,
} from "@gluestack-ui/themed";
import { useAppTheme } from "../../context/ThemeProvider";
import { Calendar, Lock, Mail, ChevronLeft, User as UserIcon } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { PasswordStrength } from "./PasswordStrength";

interface RegistrationData {
  email: string;
  username: string;
  password?: string;
  dob: Date;
  agreedToPolicies: boolean;
}

interface RegistrationWizardProps {
  onRegister: (data: RegistrationData) => Promise<{ success: boolean; field?: 'email' | 'username' | 'password'; error?: string } | void>;
  loading: boolean;
  onBackToLogin: () => void;
}

export const RegistrationWizard: React.FC<RegistrationWizardProps> = ({
  onRegister,
  loading,
  onBackToLogin,
}) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { width: screenWidth } = useWindowDimensions();

  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dobString, setDobString] = useState("");
  const [agreedToPolicies, setAgreedToPolicies] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedDob = useMemo(() => {
    if (!dobString || dobString.length < 10) return undefined;
    const parts = dobString.split("-");
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      if (!isNaN(d.getTime())) return d;
    }
    return undefined;
  }, [dobString]);

  // Verification Logic
  const canGoNext = useMemo(() => {
    switch (step) {
      case 0: return email.includes("@") && email.includes(".");
      case 1: return username.length >= 3;
      case 2: return password.length >= 8 && password === confirmPassword;
      case 3:
        if (!parsedDob) return false;
        const age = new Date().getFullYear() - parsedDob.getFullYear();
        return age >= 18;
      case 4: return agreedToPolicies;
      default: return false;
    }
  }, [step, email, username, password, confirmPassword, parsedDob, agreedToPolicies]);

  const handleNext = async () => {
    if (!canGoNext) {
      if (step === 3 && parsedDob) {
        setError("You must be 18 or older to join.");
      }
      return;
    }
    setError(null);
    if (step < 4) {
      setStep(step + 1);
    } else {
      const result = await onRegister({ email, username, password, dob: parsedDob!, agreedToPolicies });
      if (result && !result.success) {
        if (result.field === 'email') setStep(0);
        else if (result.field === 'username') setStep(1);
        else if (result.field === 'password') setStep(2);
        setError(result.error || t("common.error"));
      }
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      onBackToLogin();
    }
  };

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { 
          translateX: withTiming(-step * (screenWidth - 48), { 
            duration: 400,
            easing: Easing.bezier(0.33, 1, 0.68, 1)
          }) 
        },
      ],
    };
  });

  const renderStepContent = () => (
    <View style={styles.contentWrapper}>
      <View style={styles.headerRow}>
        <Pressable onPress={handleBack} style={styles.backButtonIcon}>
          <ChevronLeft size={24} color={theme.colors.onSurface} strokeWidth={2.5} />
        </Pressable>
      </View>
      <Animated.View style={[styles.stepContainer, containerAnimatedStyle]}>
        {/* STEP 0: EMAIL */}
        <View style={[styles.step, { width: screenWidth - 48 }]}>
          <Text style={[styles.stepTitle, { color: theme.colors.onSurface }]}>{t("auth.register.steps.email.title")}</Text>
          <Text style={[styles.stepSubtitle, { color: theme.colors.onSurface }]}>{t("auth.register.steps.email.subtitle")}</Text>
          <View style={styles.inputRow}>
            <Mail size={20} color="#888" style={{ marginRight: 8 }} />
            <RNTextInput
              placeholder="email@example.com"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={[styles.rnInput, { color: theme.colors.onSurface }]}
            />
          </View>
        </View>

        {/* STEP 1: USERNAME */}
        <View style={[styles.step, { width: screenWidth - 48 }]}>
          <Text style={[styles.stepTitle, { color: theme.colors.onSurface }]}>{t("auth.register.steps.username.title")}</Text>
          <Text style={[styles.stepSubtitle, { color: theme.colors.onSurface }]}>{t("auth.register.steps.username.subtitle")}</Text>
          <View style={styles.inputRow}>
            <UserIcon size={20} color="#888" style={{ marginRight: 8 }} />
            <RNTextInput
              placeholder={t("auth.register.usernamePlaceholder")}
              placeholderTextColor="#888"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              style={[styles.rnInput, { color: theme.colors.onSurface }]}
            />
          </View>
        </View>

        {/* STEP 2: PASSWORD */}
        <View style={[styles.step, { width: screenWidth - 48 }]}>
          <Text style={[styles.stepTitle, { color: theme.colors.onSurface }]}>{t("auth.register.steps.password.title")}</Text>
          <Text style={[styles.stepSubtitle, { color: theme.colors.onSurface }]}>{t("auth.register.steps.password.subtitle")}</Text>
          <View style={styles.inputRow}>
            <Lock size={20} color="#888" style={{ marginRight: 8 }} />
            <RNTextInput
              placeholder={t("auth.login.password")}
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={[styles.rnInput, { color: theme.colors.onSurface }]}
            />
          </View>
          <PasswordStrength password={password} />
          <View style={[styles.inputRow, { marginTop: 12 }]}>
            <Lock size={20} color="#888" style={{ marginRight: 8 }} />
            <RNTextInput
              placeholder={t("auth.login.password")}
              placeholderTextColor="#888"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              style={[styles.rnInput, { color: theme.colors.onSurface }]}
            />
          </View>
        </View>

        {/* STEP 3: BIRTHDAY */}
        <View style={[styles.step, { width: screenWidth - 48 }]}>
          <Text style={[styles.stepTitle, { color: theme.colors.onSurface }]}>{t("auth.register.steps.birthday.title")}</Text>
          <Text style={[styles.stepSubtitle, { color: theme.colors.onSurface }]}>{t("auth.register.steps.birthday.subtitle")}</Text>
          <View style={styles.inputRow}>
            <Calendar size={20} color="#888" style={{ marginRight: 8 }} />
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
          {error && <Text style={[styles.error, { color: "#ff5252" }]}>{error}</Text>}
        </View>

        {/* STEP 4: POLICIES */}
        <View style={[styles.step, { width: screenWidth - 48 }]}>
          <Text style={[styles.stepTitle, { color: theme.colors.onSurface }]}>{t("auth.register.steps.policies.title")}</Text>
          <Text style={[styles.stepSubtitle, { color: theme.colors.onSurface }]}>{t("auth.register.steps.policies.subtitle")}</Text>
          <Pressable 
            style={styles.policyRow} 
            onPress={() => setAgreedToPolicies(!agreedToPolicies)}
          >
            <Checkbox 
              value="agreed" 
              isChecked={agreedToPolicies} 
              onChange={setAgreedToPolicies}
              aria-label="Agree to policies"
            >
              <CheckboxIndicator style={{ borderColor: theme.colors.primary }}>
                <CheckboxIcon as={CheckIcon} />
              </CheckboxIndicator>
            </Checkbox>
            <Text style={[styles.policyText, { color: theme.colors.onSurface }]}>
              {t("auth.register.policyAgreement")}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.overflowHidden}>
        {renderStepContent()}
      </View>

      <View style={styles.footer}>
        <Pressable onPress={onBackToLogin} disabled={loading && step === 0} style={{ padding: 12 }}>
          <Text style={{ color: theme.colors.primary, fontWeight: "600" }}>Cancel</Text>
        </Pressable>
        <Button
          onPress={handleNext}
          isDisabled={!canGoNext || loading}
          style={[styles.nextButton, { backgroundColor: theme.colors.primary }]}
        >
          <ButtonText style={{ color: "#fff", fontWeight: "700" }}>
            {step === 4 ? t("auth.register.register") : t("common.next")}
          </ButtonText>
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
  },
  headerRow: {
    height: 48,
    justifyContent: "center",
    marginLeft: -12,
    marginBottom: 8,
  },
  backButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  overflowHidden: {
    overflow: "hidden",
  },
  stepContainer: {
    flexDirection: "row",
  },
  step: {
    paddingTop: 0,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 20,
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
    fontSize: 16,
    padding: 0,
  },
  policyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 12,
  },
  policyText: {
    flex: 1,
    fontSize: 13,
    opacity: 0.8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
  },
  nextButton: {
    borderRadius: 12,
    minWidth: 120,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    marginTop: 12,
    fontSize: 12,
    textAlign: "center",
    fontWeight: "700",
  },
});


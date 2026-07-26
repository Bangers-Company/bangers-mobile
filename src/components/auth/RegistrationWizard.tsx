import React, { useState, useMemo } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import {
  Button,
  Checkbox,
  Text,
  TextInput,
  useTheme,
  TouchableRipple,
} from "react-native-paper";
import { Calendar, Lock, Mail, ChevronLeft, User as UserIcon } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { DatePickerInput } from "react-native-paper-dates";
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
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dob, setDob] = useState<Date | undefined>(undefined);
  const [agreedToPolicies, setAgreedToPolicies] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verification Logic
  const canGoNext = useMemo(() => {
    switch (step) {
      case 0: return email.includes("@") && email.includes(".");
      case 1: return username.length >= 3;
      case 2: return password.length >= 8 && password === confirmPassword;
      case 3:
        if (!dob) return false;
        const age = new Date().getFullYear() - dob.getFullYear();
        return age >= 18;
      case 4: return agreedToPolicies;
      default: return false;
    }
  }, [step, email, username, password, confirmPassword, dob, agreedToPolicies]);

  const handleNext = async () => {
    if (!canGoNext) {
      if (step === 2 && dob) {
        setError("You must be 18 or older to join.");
      }
      return;
    }
    setError(null);
    if (step < 4) {
      setStep(step + 1);
    } else {
      const result = await onRegister({ email, username, password, dob: dob!, agreedToPolicies });
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
            easing: Easing.bezier(0.33, 1, 0.68, 1) // Ease Out Cubic
          }) 
        },
      ],
    };
  });

  const renderStepContent = () => (
    <View style={styles.contentWrapper}>
      <View style={styles.headerRow}>
        <TouchableRipple onPress={handleBack} style={styles.backButtonIcon} borderless>
          <ChevronLeft size={24} color={theme.colors.onSurface} strokeWidth={2.5} />
        </TouchableRipple>
      </View>
      <Animated.View style={[styles.stepContainer, containerAnimatedStyle]}>
        {/* STEP 0: EMAIL */}
        <View style={[styles.step, { width: screenWidth - 48 }]}>
          <Text variant="headlineSmall" style={styles.stepTitle}>{t("auth.register.steps.email.title")}</Text>
          <Text variant="bodyMedium" style={styles.stepSubtitle}>{t("auth.register.steps.email.subtitle")}</Text>
          <TextInput
            mode="outlined"
            placeholder="email@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.pillInput}
            outlineStyle={styles.pillOutline}
            left={<TextInput.Icon icon={() => <Mail size={20} color={theme.colors.outline} />} />}
            activeOutlineColor={theme.colors.primary}
          />
        </View>

        {/* STEP 1: USERNAME */}
        <View style={[styles.step, { width: screenWidth - 48 }]}>
          <Text variant="headlineSmall" style={styles.stepTitle}>{t("auth.register.steps.username.title")}</Text>
          <Text variant="bodyMedium" style={styles.stepSubtitle}>{t("auth.register.steps.username.subtitle")}</Text>
          <TextInput
            mode="outlined"
            placeholder={t("auth.register.usernamePlaceholder")}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            style={styles.pillInput}
            outlineStyle={styles.pillOutline}
            left={<TextInput.Icon icon={() => <UserIcon size={20} color={theme.colors.outline} />} />}
            activeOutlineColor={theme.colors.primary}
          />
        </View>

        {/* STEP 2: PASSWORD */}
        <View style={[styles.step, { width: screenWidth - 48 }]}>
          <Text variant="headlineSmall" style={styles.stepTitle}>{t("auth.register.steps.password.title")}</Text>
          <Text variant="bodyMedium" style={styles.stepSubtitle}>{t("auth.register.steps.password.subtitle")}</Text>
          <TextInput
            mode="outlined"
            placeholder={t("auth.login.password")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.pillInput}
            outlineStyle={styles.pillOutline}
            left={<TextInput.Icon icon={() => <Lock size={20} color={theme.colors.outline} />} />}
            activeOutlineColor={theme.colors.primary}
          />
          <PasswordStrength password={password} />
          <TextInput
            mode="outlined"
            placeholder={t("auth.login.password")}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={[styles.pillInput, { marginTop: 12 }]}
            outlineStyle={styles.pillOutline}
            error={confirmPassword.length > 0 && confirmPassword !== password}
            left={<TextInput.Icon icon={() => <Lock size={20} color={theme.colors.outline} />} />}
            activeOutlineColor={theme.colors.primary}
          />
        </View>

        {/* STEP 3: BIRTHDAY */}
        <View style={[styles.step, { width: screenWidth - 48 }]}>
          <Text variant="headlineSmall" style={styles.stepTitle}>{t("auth.register.steps.birthday.title")}</Text>
          <Text variant="bodyMedium" style={styles.stepSubtitle}>{t("auth.register.steps.birthday.subtitle")}</Text>
          <DatePickerInput
            locale={i18n.language}
            label=""
            value={dob}
            onChange={(d) => setDob(d)}
            inputMode="start"
            mode="outlined"
            style={styles.pillInput}
            outlineStyle={styles.pillOutline}
            left={<TextInput.Icon icon={() => <Calendar size={20} color={theme.colors.outline} />} />}
            activeOutlineColor={theme.colors.primary}
          />
          {error && <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>}
        </View>

        {/* STEP 4: POLICIES */}
        <View style={[styles.step, { width: screenWidth - 48 }]}>
          <Text variant="headlineSmall" style={styles.stepTitle}>{t("auth.register.steps.policies.title")}</Text>
          <Text variant="bodyMedium" style={styles.stepSubtitle}>{t("auth.register.steps.policies.subtitle")}</Text>
          <View style={styles.policyRow}>
            <Checkbox.Android
              status={agreedToPolicies ? "checked" : "unchecked"}
              onPress={() => setAgreedToPolicies(!agreedToPolicies)}
              color={theme.colors.primary}
            />
            <Text variant="bodySmall" style={styles.policyText}>
              {t("auth.register.policyAgreement")}
            </Text>
          </View>
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
        <Button mode="text" onPress={onBackToLogin} disabled={loading && step === 0}>
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleNext}
          loading={loading}
          disabled={!canGoNext || loading}
          style={styles.nextButton}
          contentStyle={styles.nextButtonContent}
        >
          {step === 4 ? t("auth.register.register") : t("common.next")}
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
    marginLeft: -12, // Align with left edge better
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
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    opacity: 0.6,
    marginBottom: 20,
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
  policyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 8,
  },
  policyText: {
    flex: 1,
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
  },
  nextButtonContent: {
    height: 48,
  },
  error: {
    marginTop: 12,
    fontSize: 12,
    textAlign: "center",
    fontWeight: "700",
  },
});

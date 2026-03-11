import { useRouter } from "expo-router";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react-native";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View
} from "react-native";
import {
    Button,
    Text,
    TextInput,
    TouchableRipple,
    useTheme,
} from "react-native-paper";
import { PageContainer } from "../../src/components/PageContainer";

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleResetRequest = async () => {
    if (!email) return;

    setLoading(true);
    try {
      // In a real implementation, we would call the API here
      // For now, let's simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSubmitted(true);
    } catch (err) {
      console.error("Password reset error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <PageContainer style={[styles.center, { padding: 24 }]}>
        <View
          style={[
            styles.successIcon,
            { backgroundColor: "rgba(74, 222, 128, 0.15)" },
          ]}
        >
          <CheckCircle2 size={60} color="#4ade80" />
        </View>
        <Text variant="headlineSmall" style={styles.successTitle}>
          Check your email
        </Text>
        <Text variant="bodyMedium" style={styles.successText}>
          We&apos;ve sent a password reset link to {email}. Please check your
          inbox and follow the instructions.
        </Text>
        <Button
          mode="contained"
          onPress={() => router.replace("/(auth)/login" as any)}
          style={styles.button}
        >
          Back to Login
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer withPadding={false} withSafeArea={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableRipple
            onPress={() => router.back()}
            style={[
              styles.backButtonCircular,
              { backgroundColor: theme.colors.surface },
            ]}
            rippleColor="rgba(0, 0, 0, .1)"
          >
            <ArrowLeft
              size={24}
              color={theme.colors.onSurface}
              strokeWidth={2.5}
            />
          </TouchableRipple>

          <View style={styles.header}>
            <Text variant="displaySmall" style={styles.title}>
              Reset Password
            </Text>
            <Text variant="titleMedium" style={styles.subtitle}>
              Enter your email address and we&apos;ll send you a link to reset
              your password.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text variant="labelLarge" style={styles.label}>
                Email Address
              </Text>
              <TextInput
                mode="outlined"
                placeholder="hello@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                outlineColor={theme.colors.outlineVariant}
                activeOutlineColor={theme.colors.primary}
                style={styles.input}
                left={
                  <TextInput.Icon
                    icon={() => <Mail size={20} color={theme.colors.outline} />}
                  />
                }
              />
            </View>

            <Button
              mode="contained"
              onPress={handleResetRequest}
              loading={loading}
              disabled={loading || !email}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Send Reset Link
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButtonCircular: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontWeight: "800",
    letterSpacing: -1,
    marginBottom: 12,
  },
  subtitle: {
    opacity: 0.6,
    fontWeight: "500",
    lineHeight: 24,
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    marginLeft: 4,
    opacity: 0.8,
  },
  input: {
    backgroundColor: "transparent",
  },
  button: {
    borderRadius: 12,
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: "bold",
  },
  successIcon: {
    padding: 20,
    borderRadius: 30,
    marginBottom: 24,
  },
  successTitle: {
    fontWeight: "800",
    marginBottom: 12,
  },
  successText: {
    textAlign: "center",
    opacity: 0.6,
    lineHeight: 22,
    marginBottom: 32,
  },
});

import { useRouter } from "expo-router";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react-native";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  TextInput as RNTextInput,
} from "react-native";
import {
  Button,
  ButtonText,
  Text,
  Pressable,
} from "@gluestack-ui/themed";
import { useAppTheme } from "../../src/context/ThemeProvider";
import { PageContainer } from "../../src/components/PageContainer";

export default function ForgotPasswordScreen() {
  const theme = useAppTheme();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleResetRequest = async () => {
    if (!email) return;

    setLoading(true);
    try {
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
        <Text style={[styles.successTitle, { color: theme.colors.onSurface }]}>
          Check your email
        </Text>
        <Text style={[styles.successText, { color: theme.colors.onSurface }]}>
          We&apos;ve sent a password reset link to {email}. Please check your
          inbox and follow the instructions.
        </Text>
        <Button
          onPress={() => router.replace("/(auth)/login" as any)}
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
        >
          <ButtonText style={{ color: "#fff", fontWeight: "700" }}>Back to Login</ButtonText>
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
          <Pressable
            onPress={() => router.back()}
            style={[
              styles.backButtonCircular,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <ArrowLeft
              size={24}
              color={theme.colors.onSurface}
              strokeWidth={2.5}
            />
          </Pressable>

          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
              Reset Password
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.onSurface }]}>
              Enter your email address and we&apos;ll send you a link to reset
              your password.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.onSurface }]}>
                Email Address
              </Text>
              <View style={styles.inputRow}>
                <Mail size={20} color="#888" style={{ marginRight: 10 }} />
                <RNTextInput
                  placeholder="hello@example.com"
                  placeholderTextColor="#888"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.rnInput, { color: theme.colors.onSurface }]}
                />
              </View>
            </View>

            <Button
              onPress={handleResetRequest}
              isDisabled={loading || !email}
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
            >
              <ButtonText style={{ color: "#fff", fontWeight: "700" }}>
                Send Reset Link
              </ButtonText>
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
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -1,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
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
    fontSize: 14,
    fontWeight: "600",
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
  button: {
    borderRadius: 12,
    marginTop: 8,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  successIcon: {
    padding: 20,
    borderRadius: 30,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
  },
  successText: {
    textAlign: "center",
    opacity: 0.6,
    lineHeight: 22,
    marginBottom: 32,
    fontSize: 15,
  },
});


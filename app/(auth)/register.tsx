import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Bolt,
  Calendar,
  Fingerprint,
  Lock,
  Mail,
  User,
} from "lucide-react-native";
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
import {
  DatePickerInput,
  en,
  registerTranslation,
} from "react-native-paper-dates";
import Animated, {
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { authApi } from "../../src/api/auth";
import { useAuthStore } from "../../src/store/useAuthStore";

// Register English translation for the date picker
registerTranslation("en", en);

function AnimatedInput({
  children,
  isFocused,
}: {
  children: React.ReactNode;
  isFocused: boolean;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(isFocused ? 1.02 : 1) }],
    };
  });

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

export default function RegisterScreen() {
  const theme = useTheme();
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState<Date | undefined>(undefined);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!email || !username || !password || !firstName || !lastName || !dob) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Format date to YYYY-MM-DD
      const formattedDob = dob.toISOString().split("T")[0];

      const response = await authApi.register({
        email,
        username,
        password,
        first_name: firstName,
        last_name: lastName,
        dob: formattedDob,
      });

      setAuth(
        response.data.accessToken,
        response.data.refreshToken,
        response.data.user,
      );
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
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
            Join the vibe
          </Text>
          <Text variant="titleMedium" style={styles.subtitle}>
            Create your account to start your journey
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text variant="labelLarge" style={styles.label}>
                First Name
              </Text>
              <AnimatedInput isFocused={focusedField === "firstName"}>
                <TextInput
                  mode="outlined"
                  placeholder="John"
                  value={firstName}
                  onChangeText={setFirstName}
                  onFocus={() => setFocusedField("firstName")}
                  onBlur={() => setFocusedField(null)}
                  outlineColor={theme.colors.outlineVariant}
                  activeOutlineColor={theme.colors.primary}
                  style={styles.input}
                  left={
                    <TextInput.Icon
                      icon={() => (
                        <User
                          size={20}
                          color={
                            focusedField === "firstName"
                              ? theme.colors.primary
                              : theme.colors.outline
                          }
                        />
                      )}
                    />
                  }
                />
              </AnimatedInput>
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text variant="labelLarge" style={styles.label}>
                Last Name
              </Text>
              <AnimatedInput isFocused={focusedField === "lastName"}>
                <TextInput
                  mode="outlined"
                  placeholder="Doe"
                  value={lastName}
                  onChangeText={setLastName}
                  onFocus={() => setFocusedField("lastName")}
                  onBlur={() => setFocusedField(null)}
                  outlineColor={theme.colors.outlineVariant}
                  activeOutlineColor={theme.colors.primary}
                  style={styles.input}
                />
              </AnimatedInput>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text variant="labelLarge" style={styles.label}>
              Username
            </Text>
            <AnimatedInput isFocused={focusedField === "username"}>
              <TextInput
                mode="outlined"
                placeholder="johndoe"
                value={username}
                onChangeText={setUsername}
                onFocus={() => setFocusedField("username")}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="none"
                outlineColor={theme.colors.outlineVariant}
                activeOutlineColor={theme.colors.primary}
                style={styles.input}
                left={
                  <TextInput.Icon
                    icon={() => (
                      <Fingerprint
                        size={20}
                        color={
                          focusedField === "username"
                            ? theme.colors.primary
                            : theme.colors.outline
                        }
                      />
                    )}
                  />
                }
              />
            </AnimatedInput>
          </View>

          <View style={styles.inputGroup}>
            <Text variant="labelLarge" style={styles.label}>
              Email
            </Text>
            <AnimatedInput isFocused={focusedField === "email"}>
              <TextInput
                mode="outlined"
                placeholder="john@example.com"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                keyboardType="email-address"
                autoCapitalize="none"
                outlineColor={theme.colors.outlineVariant}
                activeOutlineColor={theme.colors.primary}
                style={styles.input}
                left={
                  <TextInput.Icon
                    icon={() => (
                      <Mail
                        size={20}
                        color={
                          focusedField === "email"
                            ? theme.colors.primary
                            : theme.colors.outline
                        }
                      />
                    )}
                  />
                }
              />
            </AnimatedInput>
          </View>

          <View style={styles.inputGroup}>
            <Text variant="labelLarge" style={styles.label}>
              Password
            </Text>
            <AnimatedInput isFocused={focusedField === "password"}>
              <TextInput
                mode="outlined"
                placeholder="********"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                secureTextEntry
                outlineColor={theme.colors.outlineVariant}
                activeOutlineColor={theme.colors.primary}
                style={styles.input}
                left={
                  <TextInput.Icon
                    icon={() => (
                      <Lock
                        size={20}
                        color={
                          focusedField === "password"
                            ? theme.colors.primary
                            : theme.colors.outline
                        }
                      />
                    )}
                  />
                }
              />
            </AnimatedInput>
          </View>

          <View style={styles.inputGroup}>
            <Text variant="labelLarge" style={styles.label}>
              Date of Birth
            </Text>
            <DatePickerInput
              locale="en"
              label=""
              value={dob}
              onChange={(d) => setDob(d)}
              inputMode="start"
              mode="outlined"
              outlineColor={theme.colors.outlineVariant}
              activeOutlineColor={theme.colors.primary}
              style={styles.input}
              left={
                <TextInput.Icon
                  icon={() => (
                    <Calendar size={20} color={theme.colors.outline} />
                  )}
                />
              }
            />
          </View>

          {error && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
          )}

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Create Account
          </Button>
        </View>

        <View style={styles.dividerRow}>
          <View
            style={[
              styles.divider,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />
          <Text variant="labelSmall" style={styles.dividerText}>
            OR CONTINUE WITH
          </Text>
          <View
            style={[
              styles.divider,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />
        </View>

        <View style={styles.socialRow}>
          <TouchableRipple
            onPress={() => {}}
            style={[
              styles.socialButton,
              { borderColor: theme.colors.outlineVariant },
            ]}
          >
            <View style={styles.socialContent}>
              <View style={styles.socialIcon}>
                <Bolt size={20} color={theme.colors.primary} />
              </View>
              <Text variant="labelLarge" style={styles.socialLabel}>
                Google
              </Text>
            </View>
          </TouchableRipple>

          {Platform.OS === "ios" && (
            <TouchableRipple
              onPress={() => {}}
              style={[
                styles.socialButton,
                { borderColor: theme.colors.outlineVariant },
              ]}
            >
              <View style={styles.socialContent}>
                <View style={styles.socialIcon}>
                  <Lock size={20} color="#000" />
                </View>
                <Text variant="labelLarge" style={styles.socialLabel}>
                  Apple
                </Text>
              </View>
            </TouchableRipple>
          )}
        </View>

        <View style={styles.footer}>
          <Text variant="bodyMedium" style={styles.footerText}>
            Already have an account?{" "}
          </Text>
          <TouchableRipple
            onPress={() => router.replace("/(auth)/login" as any)}
            style={styles.footerRipple}
          >
            <Text
              variant="bodyMedium"
              style={[styles.footerLink, { color: theme.colors.primary }]}
            >
              Sign In
            </Text>
          </TouchableRipple>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.6,
    fontWeight: "500",
    lineHeight: 22,
  },
  form: {
    gap: 20,
  },
  row: {
    flexDirection: "row",
    gap: 16,
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
  errorText: {
    textAlign: "center",
    fontSize: 12,
    marginTop: -8,
  },
  button: {
    marginTop: 12,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: "bold",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 32,
    gap: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    opacity: 0.5,
  },
  dividerText: {
    opacity: 0.5,
    fontWeight: "700",
  },
  socialRow: {
    flexDirection: "row",
    gap: 16,
  },
  socialButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  socialContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  socialLabel: {
    fontWeight: "700",
  },
  socialIcon: {
    marginRight: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 40,
  },
  footerText: {
    opacity: 0.6,
  },
  footerRipple: {
    borderRadius: 4,
  },
  footerLink: {
    fontWeight: "800",
  },
});

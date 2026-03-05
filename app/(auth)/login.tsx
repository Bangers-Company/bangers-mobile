import { useRouter } from "expo-router";
import { Bolt, Eye, EyeOff, Lock, Mail } from "lucide-react-native";
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
    Checkbox,
    Text,
    TextInput,
    TouchableRipple,
    useTheme,
} from "react-native-paper";
import Animated, {
    useAnimatedStyle,
    withSpring,
} from "react-native-reanimated";
import { authApi } from "../../src/api/auth";
import { useAuthStore } from "../../src/store/useAuthStore";

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

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await authApi.login({ email, password });
      setAuth(
        response.data.accessToken,
        response.data.refreshToken,
        response.data.user,
      );
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Invalid email or password");
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
        <View style={styles.header}>
          <View
            style={[
              styles.logoContainer,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Bolt size={36} color="white" fill="white" />
          </View>
          <Text variant="displayMedium" style={styles.title}>
            Bangers
          </Text>
          <Text variant="titleMedium" style={styles.subtitle}>
            The ultimate high-energy experience
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text variant="labelLarge" style={styles.label}>
              Email
            </Text>
            <AnimatedInput isFocused={focusedField === "email"}>
              <TextInput
                mode="outlined"
                placeholder="Enter your email"
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
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                secureTextEntry={!showPassword}
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
                right={
                  <TextInput.Icon
                    icon={() =>
                      showPassword ? (
                        <EyeOff size={20} color={theme.colors.outline} />
                      ) : (
                        <Eye size={20} color={theme.colors.outline} />
                      )
                    }
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />
            </AnimatedInput>
          </View>

          {error && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
          )}

          <View style={styles.forgotRow}>
            <View style={styles.rememberMe}>
              <Checkbox.Android
                status={rememberMe ? "checked" : "unchecked"}
                onPress={() => setRememberMe(!rememberMe)}
                color={theme.colors.primary}
              />
              <Text variant="bodySmall" style={styles.rememberText}>
                Remember me
              </Text>
            </View>
            <TouchableRipple
              onPress={() => router.push("/(auth)/forgot-password" as any)}
              style={styles.forgotRipple}
            >
              <Text
                variant="bodySmall"
                style={[styles.forgotText, { color: theme.colors.primary }]}
              >
                Forgot password?
              </Text>
            </TouchableRipple>
          </View>

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.loginButton}
            contentStyle={styles.loginButtonContent}
            labelStyle={styles.loginButtonLabel}
          >
            Sign In
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
            Don&apos;t have an account?{" "}
          </Text>
          <TouchableRipple
            onPress={() => router.push("/(auth)/register" as any)}
            style={styles.footerRipple}
          >
            <Text
              variant="bodyMedium"
              style={[styles.footerLink, { color: theme.colors.primary }]}
            >
              Create Account
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
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    elevation: 8,
    shadowColor: "#a60df2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  title: {
    fontWeight: "800",
    letterSpacing: -2,
    marginBottom: 4,
  },
  subtitle: {
    opacity: 0.6,
    fontWeight: "500",
  },
  form: {
    width: "100%",
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
  forgotRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  rememberMe: {
    flexDirection: "row",
    alignItems: "center",
  },
  rememberText: {
    opacity: 0.6,
  },
  forgotRipple: {
    padding: 4,
    borderRadius: 4,
  },
  forgotText: {
    fontWeight: "700",
  },
  loginButton: {
    marginTop: 16,
    borderRadius: 12,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  loginButtonLabel: {
    fontSize: 18,
    fontWeight: "bold",
  },
  errorText: {
    textAlign: "center",
    fontSize: 12,
    marginTop: -8,
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

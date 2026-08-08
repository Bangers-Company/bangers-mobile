import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TextInput as RNTextInput,
} from "react-native";
import { useTranslation } from "react-i18next";
import {
  Button,
  ButtonText,
  Text,
  Pressable,
} from "@gluestack-ui/themed";
import { useAppTheme } from "../../src/context/ThemeProvider";
import { authApi } from "../../src/api/auth";
import { PageContainer } from "../../src/components/PageContainer";
import { useAuthStore } from "../../src/store/useAuthStore";
import { loginSchema } from "../../src/validation/schemas";
import { AuthBottomSheet } from "../../src/components/auth/AuthBottomSheet";
import { RegistrationWizard } from "../../src/components/auth/RegistrationWizard";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

export default function AuthScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const params = useLocalSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [isRegistering, setIsRegistering] = useState(params.mode === "register");
  
  // Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (data: { email: string; username: string; password?: string; dob: Date }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.register({
        email: data.email,
        password: data.password,
        username: data.username,
        dob: data.dob.toISOString().split("T")[0],
      });
      setAuth(
        {
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        },
        response.data.user,
      );
    } catch (err: any) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message || "";
      
      if (status === 409) {
        if (message.toLowerCase().includes("username")) {
          return { success: false, field: 'username' as const, error: t("auth.register.usernameTaken") };
        }
        return { success: false, field: 'email' as const, error: t("auth.register.emailTaken") };
      }
      return { success: false, error: t("common.error") };
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await authApi.login({ email, password });
      setAuth(
        {
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        },
        response.data.user,
      );
    } catch (err: any) {
      setError(t("auth.login.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer withPadding={false} withSafeArea={false}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* TOP BANNER */}
        <View style={styles.bannerContainer}>
          <Animated.View 
            entering={FadeInDown.delay(200).duration(800)}
            style={styles.animatedBanner}
          >
            <Image
              source={require("../../assets/images/brand/Banner.svg")}
              style={styles.brandBanner}
              contentFit="contain"
            />
          </Animated.View>
        </View>

        {/* BOTTOM SHEET */}
        <AuthBottomSheet isOpen={true}>
          <View style={styles.sheetInner}>
            {isRegistering ? (
              <RegistrationWizard 
                onRegister={handleRegister}
                loading={loading}
                onBackToLogin={() => setIsRegistering(false)}
              />
            ) : (
              <Animated.View entering={FadeIn.duration(400)}>
                <Text style={[styles.title, { color: theme.colors.onSurface }]}>{t("auth.login.title")}</Text>
                <Text style={[styles.subtitle, { color: theme.colors.onSurface }]}>{t("auth.login.subtitle")}</Text>
                
                <View style={styles.form}>
                  <View style={styles.inputRow}>
                    <Mail size={20} color="#888" style={{ marginRight: 10 }} />
                    <RNTextInput
                      placeholder={t("auth.login.email")}
                      placeholderTextColor="#888"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      style={[styles.rnInput, { color: theme.colors.onSurface }]}
                    />
                  </View>

                  <View style={styles.inputRow}>
                    <Lock size={20} color="#888" style={{ marginRight: 10 }} />
                    <RNTextInput
                      placeholder={t("auth.login.password")}
                      placeholderTextColor="#888"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      style={[styles.rnInput, { color: theme.colors.onSurface }]}
                    />
                    <Pressable onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                      {showPassword ? <EyeOff size={20} color="#888" /> : <Eye size={20} color="#888" />}
                    </Pressable>
                  </View>

                  {error && <Text style={[styles.error, { color: "#ff5252" }]}>{error}</Text>}

                  <Button
                    onPress={handleLogin}
                    isDisabled={loading}
                    style={[styles.mainButton, { backgroundColor: theme.colors.primary }]}
                  >
                    <ButtonText style={{ color: "#fff", fontWeight: "700" }}>
                      Sign In
                    </ButtonText>
                  </Button>

                  <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.colors.onSurface }]}>{t("auth.login.newHere")} </Text>
                    <Pressable 
                      onPress={() => setIsRegistering(true)}
                    >
                      <Text style={[styles.footerLink, { color: theme.colors.primary }]}>
                        {t("auth.login.createAccount")}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </Animated.View>
            )}
          </View>
        </AuthBottomSheet>
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bannerContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 80,
  },
  animatedBanner: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  brandBanner: {
    width: "100%",
    height: 140,
  },
  sheetInner: {
    width: "100%",
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -1,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 24,
  },
  form: {
    gap: 16,
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
  error: {
    textAlign: "center",
    fontSize: 12,
  },
  mainButton: {
    marginTop: 12,
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  footerText: {
    opacity: 0.6,
    fontSize: 14,
  },
  footerLink: {
    fontWeight: "800",
    fontSize: 14,
  },
});


import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useTheme } from "react-native-paper";

export default function RegisterRedirect() {
  const router = useRouter();
  const theme = useTheme();

  useEffect(() => {
    // Redirect to the consolidated Auth screen in registration mode
    router.replace({
      pathname: "/(auth)/login",
      params: { mode: "register" }
    } as any);
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background }}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

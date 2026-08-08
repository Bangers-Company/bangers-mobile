import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { View } from "react-native";
import { Spinner } from "@gluestack-ui/themed";
import { useAppTheme } from "../../src/context/ThemeProvider";

export default function RegisterRedirect() {
  const router = useRouter();
  const theme = useAppTheme();

  useEffect(() => {
    router.replace({
      pathname: "/(auth)/login",
      params: { mode: "register" }
    } as any);
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background }}>
      <Spinner size="large" color={theme.colors.primary} />
    </View>
  );
}


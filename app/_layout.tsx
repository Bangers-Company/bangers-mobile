import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";
import { ThemeProvider } from "../src/context/ThemeProvider";
import "../src/global.css";
import { useAuthStore } from "../src/store/useAuthStore";

export const unstable_settings = {
  initialRouteName: "(auth)",
};

export default function RootLayout() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const segments = useSegments();
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  // Handle store hydration
  useEffect(() => {
    console.log("[RootLayout] Starting hydration check...");
    let hydrationFinished = false;

    const finishHydration = () => {
      if (hydrationFinished) return;
      console.log("[RootLayout] Hydration finished successfully.");
      hydrationFinished = true;
      setIsHydrated(true);
    };

    if (useAuthStore.persist.hasHydrated()) {
      finishHydration();
    } else {
      const unsub = useAuthStore.persist.onFinishHydration(() => {
        finishHydration();
      });

      // Fallback: Proceed anyway after 1.5s
      const timer = setTimeout(() => {
        console.log("[RootLayout] Hydration timeout reached, forcing proceed.");
        finishHydration();
      }, 1500);

      return () => {
        unsub();
        clearTimeout(timer);
      };
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = segments[0] === "(auth)";
    const handleRedirect = () => {
      if (!accessToken && !inAuthGroup) {
        router.replace("/login" as any);
      } else if (accessToken && inAuthGroup) {
        router.replace("/" as any);
      }
    };

    // Use a small delay to ensure router is ready
    const timer = setTimeout(handleRedirect, 100);
    return () => clearTimeout(timer);
  }, [accessToken, segments, isHydrated, router]);

  if (!isHydrated) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#040405",
        }}
      >
        <ActivityIndicator size="large" color="#a60df2" />
        <View style={{ marginTop: 20 }}>
          <ActivityIndicator size="small" color="#ffffff" />
        </View>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

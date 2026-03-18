import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";
import { ThemeProvider } from "../src/context/ThemeProvider";
import { initDatabase } from "../src/database/sqlite";
import "../src/global.css";
import { useAuthStore } from "../src/store/useAuthStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ScrollProvider } from "../src/hooks/useSharedScroll";

const queryClient = new QueryClient();

export const unstable_settings = {
  initialRouteName: "(auth)",
};

export default function RootLayout() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const segments = useSegments();
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const [isHydrated, setIsHydrated] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);

  // Handle database initialization
  useEffect(() => {
    initDatabase()
      .then(() => {
        console.log("[RootLayout] Database initialized successfully.");
        setIsDbReady(true);
      })
      .catch((err) => {
        console.error("[RootLayout] Database initialization failed:", err);
        setIsDbReady(true);
      });
  }, []);

  // Handle store hydration
  useEffect(() => {
    let hydrationFinished = false;

    const finishHydration = () => {
      if (hydrationFinished) return;
      hydrationFinished = true;
      setIsHydrated(true);
    };

    if (useAuthStore.persist.hasHydrated()) {
      finishHydration();
    } else {
      const unsub = useAuthStore.persist.onFinishHydration(() => {
        finishHydration();
      });

      const timer = setTimeout(() => {
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
        routerRef.current.replace("/login" as any);
      } else if (accessToken && inAuthGroup) {
        routerRef.current.replace("/" as any);
      }
    };

    const timer = setTimeout(handleRedirect, 100);
    return () => clearTimeout(timer);
  }, [accessToken, segments, isHydrated]);

  if (!isHydrated || !isDbReady) {
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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ScrollProvider>
          <Stack
            screenOptions={{
              animation: "slide_from_right",
              headerShown: false,
            }}
          >
            <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
            <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
            <Stack.Screen
              name="modal"
              options={{ presentation: "modal", title: "Modal" }}
            />
            <Stack.Screen
              name="settings"
              options={{ animation: "slide_from_bottom" }}
            />
            <Stack.Screen name="user/[id]" />
            <Stack.Screen name="friends/[id]" />
          </Stack>
          <StatusBar style="auto" />
        </ScrollProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

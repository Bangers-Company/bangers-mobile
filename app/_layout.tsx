import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";
import { ThemeProvider } from "../src/context/ThemeProvider";
import { initDatabase } from "../src/database/sqlite";
import "../src/global.css";
import { registerLogoutCallback, useAuthStore } from "../src/store/useAuthStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ScrollProvider } from "../src/hooks/useSharedScroll";
import { Text, TouchableOpacity } from "react-native";
import * as SQLite from "expo-sqlite";
import { LoadingProvider } from "../src/providers/LoadingProvider";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

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
  const [dbError, setDbError] = useState<Error | null>(null);

  // Register QueryClient cleanup on logout — runs once on mount
  useEffect(() => {
    registerLogoutCallback(() => {
      queryClient.clear();
    });
  }, []);

  const retryDbInit = () => {
    setDbError(null);
    initDatabase()
      .then(() => {
        console.log("[RootLayout] Database initialized on retry.");
        setIsDbReady(true);
      })
      .catch((err) => {
        console.error("[RootLayout] Database retry failed:", err);
        setDbError(err);
      });
  };

  const resetDatabase = async () => {
    try {
      await SQLite.deleteDatabaseAsync("bangers.db");
      // Re-initialize
      retryDbInit();
    } catch (err) {
      console.error("[RootLayout] Failed to reset database:", err);
      setDbError(err as Error);
    }
  };

  // Handle database initialization
  useEffect(() => {
    initDatabase()
      .then(() => {
        console.log("[RootLayout] Database initialized successfully.");
        setIsDbReady(true);
      })
      .catch((err) => {
        console.error("[RootLayout] Database initialization failed:", err);
        setDbError(err);
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

  if (dbError) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#040405",
          padding: 32,
        }}
      >
        <Text
          style={{
            color: "#ff5252",
            fontSize: 20,
            fontWeight: "bold",
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          Database Error
        </Text>
        <Text
          style={{
            color: "#ffffff",
            fontSize: 14,
            opacity: 0.7,
            textAlign: "center",
            marginBottom: 24,
            lineHeight: 20,
          }}
        >
          Failed to initialize the local database. This might be caused by
          insufficient storage or a corrupted database file.
        </Text>
        <View style={{ gap: 12, width: "100%" }}>
          <TouchableOpacity
            onPress={retryDbInit}
            style={{
              backgroundColor: "#a60df2",
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={resetDatabase}
            style={{
              backgroundColor: "rgba(255,82,82,0.2)",
              borderWidth: 1,
              borderColor: "rgba(255,82,82,0.3)",
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#ff5252", fontWeight: "bold" }}>
              Reset Database
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
        <LoadingProvider>
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
        </LoadingProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

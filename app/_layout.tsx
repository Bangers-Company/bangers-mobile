import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import "react-native-reanimated";
import { ThemeProvider } from "../src/context/ThemeProvider";
import { initDatabase } from "../src/database/sqlite";
import "../src/global.css";
import "../src/i18n";
import { registerLogoutCallback, useAuthStore } from "../src/store/useAuthStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ScrollProvider } from "../src/hooks/useSharedScroll";
import * as SQLite from "expo-sqlite";
import { LoadingProvider } from "../src/providers/LoadingProvider";
import { GlobalErrorBoundary } from "../src/components/GlobalErrorBoundary";
import { logger } from "../src/utils/logger";
import * as SplashScreen from "expo-splash-screen";
import { NotificationService } from "../src/services/notifications/NotificationService";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from "@expo-google-fonts/inter";
import { NetworkStatusIndicator } from "../src/components/ui/NetworkStatusIndicator";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

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
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.accessToken;
  const segments = useSegments();
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const [isHydrated, setIsHydrated] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);
  const [dbError, setDbError] = useState<Error | null>(null);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  useEffect(() => {
    // Hide Expo's splash screen as soon as we are ready to show our custom one
    if (isHydrated && isDbReady && (fontsLoaded || fontError)) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, isHydrated, isDbReady]);

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
        logger.info("[RootLayout] Database initialized on retry.");
        setIsDbReady(true);
      })
      .catch((err) => {
        logger.error("[RootLayout] Database retry failed:", err);
        setDbError(err);
      });
  };

  const resetDatabase = async () => {
    try {
      await SQLite.deleteDatabaseAsync("bangers.db");
      // Re-initialize
      retryDbInit();
    } catch (err) {
      logger.error("[RootLayout] Failed to reset database:", err);
      setDbError(err as Error);
    }
  };

  useEffect(() => {
    initDatabase()
      .then(() => {
        logger.info("[RootLayout] Database initialized successfully.");
        setIsDbReady(true);
      })
      .catch((err) => {
        logger.error("[RootLayout] Database initialization failed:", err);
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
    if (isDbReady && isHydrated) {
      NotificationService.initialize();
    }
  }, [isDbReady, isHydrated]);

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

  if (!isHydrated || !isDbReady || !fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000",
        }}
      />
    );
  }


  return (
    <GlobalErrorBoundary>
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
                  options={{ animation: "slide_from_right" }}
                />
                <Stack.Screen
                  name="notifications"
                  options={{ animation: "slide_from_right" }}
                />
                <Stack.Screen 
                  name="user/[id]" 
                  options={{ animation: "slide_from_right" }}
                />
                <Stack.Screen 
                  name="friends/[id]" 
                  options={{ animation: "slide_from_right" }}
                />
              </Stack>
              <StatusBar style="auto" />
              <NetworkStatusIndicator />
            </ScrollProvider>
          </LoadingProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
}

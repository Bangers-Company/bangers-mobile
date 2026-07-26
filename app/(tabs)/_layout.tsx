import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";
import { BottomNav } from "../../src/components/navigation/BottomNav";
import { ScrollResetHandler } from "../../src/components/navigation/ScrollResetHandler";
import { TopBar } from "../../src/components/navigation/TopBar";
import { PageContainer } from "../../src/components/PageContainer";
import { useTranslation } from "react-i18next";

export default function TabLayout() {
  const { t } = useTranslation();
  return (
    <PageContainer withPadding={false}>
      <ScrollResetHandler />
      <TopBar />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: "none" },
          animation: "shift",
        }}
      >
        <Tabs.Screen name="index" options={{ title: t("navigation.home") }} />
        <Tabs.Screen name="search" options={{ title: t("common.search") }} />
        <Tabs.Screen name="profile" options={{ title: t("navigation.profile") }} />
      </Tabs>
      <BottomNav />
    </PageContainer>
  );
}


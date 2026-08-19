import { Tabs, useLocalSearchParams } from "expo-router";
import React from "react";
import { BottomNav } from "../../../src/components/navigation/BottomNav";
import { ScrollResetHandler } from "../../../src/components/navigation/ScrollResetHandler";
import { useTranslation } from "react-i18next";
import { PageContainer } from "../../../src/components/PageContainer";

export default function EventLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();

  return (
    <PageContainer withPadding={false} withSafeArea={{ top: false, bottom: false }}>
      <ScrollResetHandler />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: "none" },
          animation: "none",
          freezeOnBlur: true,
        }}
        backBehavior="firstRoute"
      >
        <Tabs.Screen name="index" options={{ title: t("navigation.info") }} />
        <Tabs.Screen name="lineup" options={{ title: t("navigation.lineup") }} />
        <Tabs.Screen name="schedule" options={{ title: t("navigation.schedule") }} />
        <Tabs.Screen name="visitors" options={{ title: t("navigation.visitors") }} />
      </Tabs>
      <BottomNav />
    </PageContainer>
  );
}

import { Tabs, useLocalSearchParams } from "expo-router";
import React from "react";
import { BottomNav } from "../../../src/components/navigation/BottomNav";
import { ScrollResetHandler } from "../../../src/components/navigation/ScrollResetHandler";
import { PageContainer } from "../../../src/components/PageContainer";

export default function EventLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <PageContainer withPadding={false} withSafeArea={{ top: true, bottom: false }}>
      <ScrollResetHandler />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: "none" },
          animation: "shift",
        }}
        backBehavior="history"
      >
        <Tabs.Screen name="index" options={{ title: "Event Details" }} />
        <Tabs.Screen name="lineup" options={{ title: "Line-up" }} />
        <Tabs.Screen name="schedule" options={{ title: "Schedule" }} />
        <Tabs.Screen name="visitors" options={{ title: "Visitors" }} />
      </Tabs>
      <BottomNav />
    </PageContainer>
  );
}

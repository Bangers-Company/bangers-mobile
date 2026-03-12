import { Tabs, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { BottomNav } from "../../../src/components/navigation/BottomNav";
import { PageContainer } from "../../../src/components/PageContainer";
import { useEventStore } from "../../../src/store/useEventStore";

export default function EventLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const fetchFullEvent = useEventStore((state) => state.fetchFullEvent);

  useEffect(() => {
    if (id) {
      fetchFullEvent(id); 
    }
  }, [id, fetchFullEvent]);

  return (
    <PageContainer withPadding={false} withSafeArea={{ top: true, bottom: false }}>
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

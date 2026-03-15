import { Tabs, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { BottomNav } from "../../../src/components/navigation/BottomNav";
import { ScrollResetHandler } from "../../../src/components/navigation/ScrollResetHandler";
import { PageContainer } from "../../../src/components/PageContainer";
import { AppDispatch } from "../../../src/store/redux/store";
import { fetchFullEvent } from "../../../src/store/redux/eventSlice";

export default function EventLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (id) {
      dispatch(fetchFullEvent({ id })); 
    }
  }, [id, dispatch]);

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

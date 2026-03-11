import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";
import { BottomNav } from "../../src/components/navigation/BottomNav";
import { TopBar } from "../../src/components/navigation/TopBar";
import { PageContainer } from "../../src/components/PageContainer";

export default function TabLayout() {
  return (
    <PageContainer withPadding={false}>
      <TopBar />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: "none" },
          animation: "shift",
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="search" options={{ title: "Search" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>
      <BottomNav />
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

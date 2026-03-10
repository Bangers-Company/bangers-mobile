import { Stack } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { BottomNav } from "../../src/components/navigation/BottomNav";
import { TopBar } from "../../src/components/navigation/TopBar";

export default function TabLayout() {
  return (
    <View style={styles.container}>
      <TopBar />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" options={{ title: "Home" }} />
        <Stack.Screen name="search" options={{ title: "Search" }} />
        <Stack.Screen name="profile" options={{ title: "Profile" }} />
      </Stack>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

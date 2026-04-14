import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#16B3A6",
        tabBarInactiveTintColor: "#6B7280",
        tabBarStyle: { backgroundColor: "#141A24", borderTopColor: "#1B2231" },
        headerStyle: { backgroundColor: "#0B0F17" },
        headerTitleStyle: { color: "#E5E7EB" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Today" }} />
      <Tabs.Screen name="history" options={{ title: "History" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}

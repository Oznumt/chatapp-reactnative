import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
      <Stack.Screen name="blockedUsers" options={{ title: "Engellenen Kullanıcılar" }} />
    </Stack>
  );
}

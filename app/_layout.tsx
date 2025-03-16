import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { auth } from "../firebaseConfig";

export default function RootLayout() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      if (!user) {
        router.replace("/(auth)");
      } else {
        router.replace("/(app)/home");
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
    </Stack>
  );
}

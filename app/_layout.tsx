import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack initialRouteName="(auth)/login">
        <Stack.Screen name="(auth)/login" options={{ title: "Login" }} />
        <Stack.Screen name="(auth)/register" options={{ title: "Register" }} />
        <Stack.Screen name="(user)/home" options={{ title: "Bioskop" }} />
        <Stack.Screen name="(user)/locations" options={{ title: "Daftar Lokasi" }} />
        <Stack.Screen name="(user)/movies" options={{ title: "Daftar Film" }} />
        <Stack.Screen name="(user)/movie_detail" options={{ title: "Detail Film" }} />
        <Stack.Screen name="(user)/booking_seat" options={{ title: "Pilih Kursi" }} />
        <Stack.Screen name="(user)/topup" options={{ title: "Top Up Saldo" }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

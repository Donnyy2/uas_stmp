import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";

export default function Home() {
  const [username, setUsername] = useState("");

  const loadUser = async () => {
    const name = await AsyncStorage.getItem("username");
    setUsername(name ?? "");
  };

  const logout = async () => {
    await AsyncStorage.clear();
    router.replace("/auth/login");
  };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selamat datang, {username}!</Text>
      <Text>Aplikasi Bioskopi — Cafe + Mini Cinema</Text>

      <View style={{ marginTop: 20 }}>
        <Button title="Top Up Saldo" onPress={() => router.push("/user/topup")} />
      </View>

      <View style={{ marginTop: 20 }}>
        <Button color="red" title="Logout" onPress={logout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
});

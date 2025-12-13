import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";

export default function Home() {
  const [username, setUsername] = useState("");
  const [saldo, setSaldo] = useState(0);


  const loadUser = async () => {
    const storedName = await AsyncStorage.getItem("username");
    const finalName = storedName ?? "";
    setUsername(finalName);

    const options = {
      method: "POST",
      headers: new Headers({
        "Content-Type": "application/x-www-form-urlencoded",
      }),
      body: "user_name=" + finalName,
    };

    try {
      const response = await fetch(
        "https://ubaya.cloud/react/160422136/UAS/get_user.php", 
        options
      );
      const resjson = await response.json();
      if (resjson.result === "success") {
        setSaldo(resjson.data.saldo);
      }
    } catch (e: any) {
      console.log("Error fetching user:", e.message);
    }
  };

 
  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [])
  );


  const logout = async () => {
    await AsyncStorage.clear();
    router.replace("/auth/login" as any);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selamat datang, {username}!</Text>
      <Text style={styles.subtitle}>Aplikasi Bioskopi — Cafe + Mini Cinema</Text>

      <View style={{ marginTop: 20 }}>
        <Text style={{fontSize: 16, fontWeight: 'bold', marginBottom: 10}}>Menu Utama</Text>
        <Button 
          title="🎬 Pesan Tiket Bioskop" 
          color="#2c3e50"
          onPress={() => router.push("/(user)/locations" as any)} 
        />
      </View>

      <View style={{ marginTop: 20 }}>
        <Text style={styles.balance}>Saldo Anda: Rp {saldo}</Text>
      </View>

      <View style={{ marginTop: 20 }}>
        <Button title="Top Up Saldo" onPress={() => router.push("/(user)/topup" as any)} />
      </View>

      <View style={{ marginTop: 20 }}>
        <Button color="red" title="Logout" onPress={logout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    padding: 20,
    flex: 1,
    backgroundColor: '#fff'
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 5 },
  subtitle: { fontSize: 16, marginBottom: 20 },
  balance: { fontSize: 18, fontWeight: "600" },
});

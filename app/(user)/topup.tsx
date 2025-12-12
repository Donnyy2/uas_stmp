import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";

export default function Topup() {
  const [amount, setAmount] = useState("");

  const doTopup = async () => {
    const username = await AsyncStorage.getItem("username");

    const options = {
      method: "POST",
      headers: new Headers({
        "Content-Type": "application/x-www-form-urlencoded",
      }),
      body: "user_name=" + username + "&amount=" + amount,
    };

    try {
      const response = await fetch(
        "https://ubaya.cloud/react/[NRP]/topup.php", 
        options
      );
      const resjson = await response.json();

      if (resjson.result === "success") {
        Alert.alert("Topup Berhasil", "Saldo berhasil ditambahkan.", [
          {
            text: "OK",
            onPress: () => router.replace("/user/home")
          }
        ]);
      } else {
        Alert.alert("Gagal", "Terjadi error.");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text>Jumlah Top Up</Text>
      <TextInput
        style={styles.input}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      <Button title="Top Up" onPress={doTopup} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderColor: "#aaa",
  },
});

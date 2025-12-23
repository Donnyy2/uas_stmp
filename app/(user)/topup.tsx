import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Button, Platform, StyleSheet, Text, TextInput, View } from "react-native";

export default function Topup() {
  const [amount, setAmount] = useState("");

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      alert(title + ": " + message);
    } else {
      Alert.alert(title, message);
    }
  };

  const normalizeAmountInput = (text: string) => {
    const withDot = text.replace(/,/g, ".");
    const digitsAndDotsOnly = withDot.replace(/[^0-9.]/g, "");

    const firstDotIndex = digitsAndDotsOnly.indexOf(".");
    if (firstDotIndex === -1) return digitsAndDotsOnly;

    const before = digitsAndDotsOnly.slice(0, firstDotIndex + 1);
    const after = digitsAndDotsOnly.slice(firstDotIndex + 1).replace(/\./g, "");
    return before + after;
  };

  const isValidIntOrFloat = (text: string) => {
    const normalized = text.trim().replace(/,/g, ".");
    return /^\d+(\.\d+)?$/.test(normalized);
  };

  const doTopup = async () => {
    const username = await AsyncStorage.getItem("username");

    if (!username) {
      if (Platform.OS === "web") {
        alert("Sesi berakhir, silakan login ulang.");
      } else {
        Alert.alert("Error", "Sesi berakhir, silakan login ulang.");
      }
      router.replace("/(auth)/login" as any);
      return;
    }

    if (!amount || amount.trim() === "") {
      showAlert("Error", "Masukkan jumlah top up.");
      return;
    }

    const normalizedAmount = amount.trim().replace(/,/g, ".");
    if (!isValidIntOrFloat(normalizedAmount)) {
      showAlert("Error", "Jumlah top up harus berupa angka (int/float). Contoh: 10000 atau 10000.5");
      return;
    }

    const options = {
      method: "POST",
      headers: new Headers({
        "Content-Type": "application/x-www-form-urlencoded",
      }),
      body: "user_name=" + username + "&amount=" + normalizedAmount,
    };

    try {
      const response = await fetch(
        "https://ubaya.cloud/react/160422136/UAS/topup.php",
        options
      );
      const resjson = await response.json();

      if (resjson.result === "success") {
        setAmount("");
        if (Platform.OS === "web") {
          alert("Topup Berhasil: Saldo berhasil ditambahkan.");
          router.replace("/(user)/home" as any);
        } else {
          Alert.alert("Topup Berhasil", "Saldo berhasil ditambahkan.", [
            {
              text: "OK",
              onPress: () => router.replace("/(user)/home" as any),
            },
          ]);
        }
      } else {
        const message = resjson.message || "Terjadi error.";
        if (Platform.OS === "web") {
          alert("Gagal: " + message);
        } else {
          Alert.alert("Gagal", message);
        }
      }
    } catch (e: any) {
      if (Platform.OS === "web") {
        alert("Error: " + e.message);
      } else {
        Alert.alert("Error", e.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text>Jumlah Top Up</Text>
      <TextInput
        style={styles.input}
        onChangeText={(text) => setAmount(normalizeAmountInput(text))}
        value={amount}
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

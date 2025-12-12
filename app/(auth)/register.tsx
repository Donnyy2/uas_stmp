import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";
import { useValidation } from "react-simple-form-validator";

export default function Register() {
  const [userid, setUserid] = useState("");
  const [password, setPassword] = useState("");
  const [nama, setNama] = useState("");

  const { isFieldInError, getErrorsInField, isFormValid } = useValidation({
    fieldsRules: {
      userid: { required: true },
      password: { required: true, minlength: 4 },
      nama: { required: true },
    },
    state: { userid, password, nama },
  });

  const doRegister = async () => {
    const options = {
      method: "POST",
      headers: new Headers({
        "Content-Type": "application/x-www-form-urlencoded",
      }),
      body:
        "user_id=" +
        userid +
        "&user_password=" +
        password +
        "&user_name=" +
        nama,
    };

    try {
      const response = await fetch(
        "https://ubaya.cloud/react/nrp/register.php",
        options
      );
      const resjson = await response.json();

      if (resjson.result === "success") {
        Alert.alert("Registrasi Berhasil", "Silakan login.");
        router.replace("/auth/login");
      } else {
        Alert.alert("Gagal", "User ID sudah digunakan.");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text>User ID</Text>
      <TextInput style={styles.input} onChangeText={setUserid} />

      <Text>Password</Text>
      <TextInput
        style={styles.input}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Text>Nama Lengkap</Text>
      <TextInput style={styles.input} onChangeText={setNama} />

      {isFormValid ? (
        <Button title="Registrasi" onPress={doRegister} />
      ) : (
        <Text style={{ color: "gray" }}>Lengkapi data terlebih dahulu</Text>
      )}
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

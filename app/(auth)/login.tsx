import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { useValidation } from "react-simple-form-validator";

export default function Login() {
  const [userid, setUserid] = useState("");
  const [password, setPassword] = useState("");

  const { isFieldInError, getErrorsInField, isFormValid } = useValidation({
    fieldsRules: {
      userid: { required: true },
      password: { required: true },
    },
    state: { userid, password },
  });

  const handleLogin = async () => {
    const options = {
      method: "POST",
      headers: new Headers({
        "Content-Type": "application/x-www-form-urlencoded",
      }),
      body: "user_id=" + userid + "&user_password=" + password,
    };

    const response = await fetch(
      "https://ubaya.cloud/react/160422136/UAS/login.php",
      options
    );
    const json = await response.json();

    if (json.result == "success") {
      try {
        await AsyncStorage.setItem("username", json.user_name);
        await AsyncStorage.setItem("userid", userid);
        alert("Login successful");
        router.replace("/(user)/home" as any);
      } catch (e) {
        console.error("Error saving data to AsyncStorage", e);
        alert("Error saving data to AsyncStorage");
      }
    } else {
      alert("Username or password is incorrect");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>User ID</Text>
      <TextInput style={styles.input} onChangeText={setUserid} />

      {isFieldInError("userid") &&
        getErrorsInField("userid").map((err, idx) => (
          <Text key={idx} style={styles.error}>{err}</Text>
        ))}

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        onChangeText={setPassword}
        value={password}
        secureTextEntry
      />

      {isFieldInError("password") &&
        getErrorsInField("password").map((err, idx) => (
          <Text key={idx} style={styles.error}>{err}</Text>
        ))}

      {isFormValid ? (
        <Button title="Login" onPress={() => {
          handleLogin().catch((e) => alert("Error: " + e.message));
        }} />
      ) : (
        <Text style={{ color: "gray" }}>Lengkapi data terlebih dahulu</Text>
      )}

      <Link href="/(auth)/register">
        <Text style={{ marginTop: 20, color: "blue" }}>
          Belum punya akun? Register
        </Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderColor: "#aaa",
    borderRadius: 5,
    backgroundColor: '#fff',
    color: '#000',
  },
  error: { color: "red", fontSize: 12, marginBottom: 5 },
  label: { marginBottom: 5, fontWeight: 'bold' }
});

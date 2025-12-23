import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type OrderRow = {
  order_id: number;
  total: string | number;
  created_at: string;
  schedule_id?: number | string | null;
  title?: string | null;
  studio_name?: string | null;
  show_time?: string | null;
};

export default function History() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);

  const showAlert = (t: string, m: string) => {
    if (Platform.OS === "web") {
      alert(`${t}\n\n${m}`);
      return;
    }
    Alert.alert(t, m);
  };

  const fetchOrders = async () => {
    try {
      const username = await AsyncStorage.getItem("username");
      if (!username) {
        showAlert("Error", "Sesi berakhir, silakan login ulang.");
        router.replace("/(auth)/login" as any);
        return;
      }

      const body = "user_name=" + encodeURIComponent(username);
      const resp = await fetch(
        "https://ubaya.cloud/react/160422136/UAS/get_orders.php",
        {
          method: "POST",
          headers: new Headers({
            "Content-Type": "application/x-www-form-urlencoded",
          }),
          body,
        }
      );

      const text = await resp.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }

      if (json?.result === "success" && Array.isArray(json.data)) {
        setOrders(json.data);
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.log(e);
      showAlert("Error", "Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const renderItem = ({ item }: { item: OrderRow }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/(user)/order_detail" as any,
          params: { orderId: item.order_id },
        } as any)
      }
    >
      <Text style={styles.title}>Order #{item.order_id}</Text>
      <Text style={styles.sub}>
        {item.title ? item.title : "(Tanpa tiket)"}
        {item.studio_name ? ` • ${item.studio_name}` : ""}
        {item.show_time ? ` • ${item.show_time}` : ""}
      </Text>
      <Text style={styles.sub}>Tanggal: {item.created_at}</Text>
      <Text style={styles.total}>
        Rp {Number(item.total || 0).toLocaleString("id-ID")}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>History Pemesanan</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#2c3e50" />
      ) : orders.length === 0 ? (
        <Text>Tidak ada history pemesanan.</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(it) => String(it.order_id)}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 20, fontWeight: "bold", marginBottom: 14 },
  card: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#fafafa",
  },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  sub: { color: "gray", marginBottom: 4 },
  total: { fontSize: 16, fontWeight: "bold", color: "#2c3e50", marginTop: 6 },
});

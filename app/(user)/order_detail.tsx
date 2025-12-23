import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type OrderHeader = {
  order_id: number;
  user_name: string;
  total: string | number;
  created_at: string;
  schedule_id?: number | string | null;
  show_time?: string | null;
  studio_name?: string | null;
  title?: string | null;
};

type OrderItem = {
  product_id: number;
  name: string;
  unit_price: string | number;
  qty: number;
};

export default function OrderDetail() {
  const params = useLocalSearchParams();
  const orderIdParam = params.orderId;

  const goHome = React.useCallback(() => {
    router.replace({ pathname: "/(user)/home" as any } as any);
  }, []);

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderHeader | null>(null);
  const [seats, setSeats] = useState<string[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);

  const showAlert = (t: string, m: string) => {
    if (Platform.OS === "web") {
      alert(`${t}\n\n${m}`);
      return;
    }
    Alert.alert(t, m);
  };

  const fetchDetail = async () => {
    try {
      const username = await AsyncStorage.getItem("username");
      const order_id = Number(Array.isArray(orderIdParam) ? orderIdParam[0] : orderIdParam) || 0;
      if (!order_id) {
        showAlert("Error", "Order ID tidak valid");
        return;
      }

      const body =
        "order_id=" + encodeURIComponent(String(order_id)) +
        (username ? "&user_name=" + encodeURIComponent(username) : "");

      const resp = await fetch(
        "https://ubaya.cloud/react/160422136/UAS/get_order_detail.php",
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

      if (json?.result === "success") {
        setOrder(json.order);
        setSeats(Array.isArray(json.seats) ? json.seats : []);
        setItems(Array.isArray(json.items) ? json.items : []);
      } else {
        showAlert("Gagal", json?.message || "Gagal ambil detail order");
      }
    } catch (e) {
      console.log(e);
      showAlert("Error", "Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        goHome();
        return true;
      });
      return () => sub.remove();
    }, [goHome])
  );

  const itemsTotal = items.reduce((s, it) => {
    const unit = Number(it.unit_price) || 0;
    return s + unit * (Number(it.qty) || 0);
  }, 0);

  return (
    <>
      <Stack.Screen
        options={{
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={goHome}
              accessibilityRole="button"
              accessibilityLabel="Kembali ke Home"
              style={{ paddingHorizontal: 12, paddingVertical: 6 }}
            >
              <MaterialIcons name="arrow-back" size={24} color="#2c3e50" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Keterangan Pembelian</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2c3e50" style={{ marginTop: 30 }} />
      ) : !order ? (
        <Text>Data order tidak ditemukan.</Text>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Order</Text>
            <Text style={styles.line}>ID: {order.order_id}</Text>
            <Text style={styles.line}>Tanggal: {order.created_at}</Text>
            <Text style={styles.line}>
              Total: Rp {Number(order.total || 0).toLocaleString("id-ID")}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Tiket</Text>
            {order.schedule_id ? (
              <>
                <Text style={styles.line}>{order.title}</Text>
                <Text style={styles.subLine}>
                  {order.studio_name ? order.studio_name : ""}
                  {order.show_time ? ` • ${order.show_time}` : ""}
                </Text>
                <Text style={styles.line}>
                  Kursi: {seats.length ? seats.join(", ") : "-"}
                </Text>
              </>
            ) : (
              <Text style={styles.subLine}>Tidak pesan tiket</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Makanan/Minuman</Text>
            {items.length === 0 ? (
              <Text style={styles.subLine}>Tidak pesan makanan/minuman</Text>
            ) : (
              items.map((it) => (
                <View key={it.product_id} style={styles.itemRow}>
                  <Text style={{ flex: 1 }}>{it.name} x{it.qty}</Text>
                  <Text>
                    Rp {(Number(it.unit_price) * Number(it.qty)).toLocaleString("id-ID")}
                  </Text>
                </View>
              ))
            )}
            <Text style={[styles.line, { marginTop: 8 }]}>Total item: Rp {itemsTotal.toLocaleString("id-ID")}</Text>
          </View>
        </>
      )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    minHeight: "100%",
  },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 14 },
  card: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    backgroundColor: "#fafafa",
  },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 8 },
  line: { fontSize: 14, marginBottom: 4 },
  subLine: { fontSize: 13, color: "gray", marginBottom: 6 },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
});

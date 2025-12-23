import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type MenuItem = { id: number; name: string; type?: string; price: number };

export default function OrderFood() {
  const params = useLocalSearchParams();
  const { scheduleId, title, price, studio, time, seats, cafeLocationId, cafeLocationName } = params;

  const isTicketFlow = Number(scheduleId) > 0;

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchMenu = async () => {
    try {
      const baseUrl = "https://ubaya.cloud/react/160422136/UAS/get_menu.php";
      const locId = Number(cafeLocationId) || 0;
      const url = locId > 0 ? `${baseUrl}?location_id=${locId}` : baseUrl;

      const response = await fetch(url);
      const text = await response.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }

      if (json?.result === "success" && Array.isArray(json.data)) {
        setMenu(json.data);
      } else {
        setMenu([]);
      }
    } catch (e) {
      console.log("fetchMenu error", e);
      setMenu([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const changeQty = (productId: number, delta: number) => {
    setQuantities((prev) => {
      const next = { ...prev };
      const cur = next[productId] ?? 0;
      const val = Math.max(0, cur + delta);
      if (val === 0) delete next[productId];
      else next[productId] = val;
      return next;
    });
  };

  const foodTotal = menu.reduce((sum, m) => {
    const qty = quantities[m.id] ?? 0;
    return sum + qty * (Number(m.price) || 0);
  }, 0);

  const goNext = () => {
    const hasAnyItem = Object.keys(quantities).length > 0;
    if (!isTicketFlow && !hasAnyItem) {
      Alert.alert("Pilih Menu", "Untuk pesan makanan/minuman, minimal pilih 1 item.");
      return;
    }

    const itemsParam = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([pid, qty]) => `${pid}:${qty}`)
      .join(",");

    router.push({
      pathname: "/(user)/order_summary" as any,
      params: {
        scheduleId,
        title,
        price,
        studio,
        time,
        seats,
        cafeLocationId,
        cafeLocationName,
        items: itemsParam,
      },
    } as any);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pesan Makanan & Minuman</Text>
        {!!cafeLocationName && !title && (
          <Text style={styles.headerSub}>Lokasi Café: {cafeLocationName}</Text>
        )}
        {!!title && (
          <Text style={styles.headerSub}>
            {title}
            {studio ? ` • ${studio}` : ""}
            {time ? ` • ${time}` : ""}
          </Text>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2c3e50" style={{ marginTop: 30 }} />
      ) : menu.length === 0 ? (
        <Text style={{ color: "gray" }}>Menu belum tersedia.</Text>
      ) : (
        <View>
          {menu.map((m) => {
            const qty = quantities[m.id] ?? 0;
            return (
              <View key={m.id} style={styles.itemRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={{ fontWeight: "600" }}>{m.name}</Text>
                  <Text style={{ color: "gray" }}>
                    Rp {Number(m.price || 0).toLocaleString("id-ID")}
                  </Text>
                </View>
                <View style={styles.qtyRow}>
                  <TouchableOpacity
                    onPress={() => changeQty(m.id, -1)}
                    style={styles.qtyButton}
                  >
                    <Text style={{ fontSize: 18 }}>-</Text>
                  </TouchableOpacity>
                  <Text style={{ minWidth: 20, textAlign: "center" }}>{qty}</Text>
                  <TouchableOpacity
                    onPress={() => changeQty(m.id, +1)}
                    style={styles.qtyButton}
                  >
                    <Text style={{ fontSize: 18 }}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.footer}>
        <View>
          <Text style={{ color: "gray" }}>Total Makanan/Minuman:</Text>
          <Text style={styles.totalText}>Rp {foodTotal.toLocaleString("id-ID")}</Text>
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={goNext}>
          <Text style={styles.nextButtonText}>Lanjut</Text>
        </TouchableOpacity>
      </View>

      {isTicketFlow && (
        <TouchableOpacity
          onPress={goNext}
          style={{ marginTop: 16, alignSelf: "center" }}
        >
          <Text style={{ color: "#2c3e50", textDecorationLine: "underline" }}>
            Lewati makanan/minuman
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    minHeight: "100%",
  },
  header: { marginBottom: 16, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  headerSub: { marginTop: 6, color: "gray", textAlign: "center" },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyButton: {
    width: 34,
    height: 34,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  totalText: { fontSize: 18, fontWeight: "bold", color: "#2c3e50" },
  nextButton: {
    backgroundColor: "#2c3e50",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  nextButtonText: { color: "white", fontWeight: "bold", fontSize: 14 },
});

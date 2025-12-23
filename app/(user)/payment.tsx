import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type MenuItem = { id: number; name: string; type?: string; price: number };

type QtyMap = Record<number, number>;

function parseItemsParam(itemsParam: string | string[] | undefined): QtyMap {
  const raw = Array.isArray(itemsParam) ? itemsParam[0] : itemsParam;
  if (!raw) return {};
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const out: QtyMap = {};
  for (const p of parts) {
    const [pidStr, qtyStr] = p.split(":").map((x) => x.trim());
    const pid = Number(pidStr);
    const qty = Number(qtyStr);
    if (!Number.isFinite(pid) || !Number.isFinite(qty) || pid <= 0 || qty <= 0) continue;
    out[pid] = (out[pid] ?? 0) + qty;
  }
  return out;
}

export default function Payment() {
  const params = useLocalSearchParams();
  const { scheduleId, title, price, studio, time, seats, items, cafeLocationName } = params;

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [processing, setProcessing] = useState(false);

  const showAlert = (t: string, m: string, onOk?: () => void) => {
    if (Platform.OS === "web") {
      alert(`${t}\n\n${m}`);
      onOk?.();
      return;
    }
    Alert.alert(t, m, onOk ? [{ text: "OK", onPress: onOk }] : undefined);
  };

  const quantities = useMemo(() => parseItemsParam(items), [items]);

  const seatList = useMemo(() => {
    const raw = Array.isArray(seats) ? seats[0] : seats;
    if (!raw) return [];
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }, [seats]);

  const seatPrice = Number(price) || 0;
  const ticketTotal = seatList.length * seatPrice;

  const fetchMenu = async () => {
    try {
      const response = await fetch(
        "https://ubaya.cloud/react/160422136/UAS/get_menu.php"
      );
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
      setLoadingMenu(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const itemLines = useMemo(() => {
    const byId = new Map(menu.map((m) => [Number(m.id), m] as const));
    return Object.entries(quantities)
      .map(([pidStr, qty]) => {
        const pid = Number(pidStr);
        const m = byId.get(pid);
        const unit = Number(m?.price ?? 0);
        return {
          product_id: pid,
          name: m?.name ?? `Produk #${pid}`,
          qty,
          line: unit * qty,
        };
      })
      .filter((x) => x.qty > 0);
  }, [menu, quantities]);

  const foodTotal = itemLines.reduce((s, x) => s + x.line, 0);
  const grandTotal = ticketTotal + foodTotal;

  const handlePay = async () => {
    const sid = Number(scheduleId) || 0;
    const hasTicket = sid > 0;
    const hasFood = itemLines.length > 0;

    if (hasTicket && seatList.length === 0) {
      showAlert("Pilih Kursi", "Kursi belum dipilih.");
      return;
    }

    if (!hasTicket && !hasFood) {
      showAlert("Belum Ada Pesanan", "Silakan pesan tiket dan/atau makanan/minuman.");
      return;
    }

    setProcessing(true);
    try {
      const username = await AsyncStorage.getItem("username");
      if (!username) {
        showAlert("Error", "Sesi berakhir, silakan login ulang.");
        router.replace("/(auth)/login" as any);
        return;
      }

      const seatsParam = seatList.join(",");
      const itemsParam = Object.entries(quantities)
        .filter(([, q]) => q > 0)
        .map(([pid, q]) => `${pid}:${q}`)
        .join(",");

      const bodyData =
        "user_name=" + encodeURIComponent(username) +
        "&schedule_id=" + encodeURIComponent(String(sid)) +
        "&seats=" + encodeURIComponent(seatsParam) +
        "&items=" + encodeURIComponent(itemsParam);

      const response = await fetch(
        "https://ubaya.cloud/react/160422136/UAS/create_order.php",
        {
          method: "POST",
          headers: new Headers({
            "Content-Type": "application/x-www-form-urlencoded",
          }),
          body: bodyData,
        }
      );

      const text = await response.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }

      if (json?.result === "success") {
        const orderId = json.order_id;
        showAlert(
          "Berhasil!",
          "Pembayaran berhasil. Pesanan tersimpan.",
          () =>
            router.replace({
              pathname: "/(user)/order_detail" as any,
              params: { orderId },
            } as any)
        );
        return;
      }

      const msg = (json?.message ?? "").toString();
      const lower = msg.toLowerCase();
      if (lower.includes("saldo") && (lower.includes("tidak cukup") || lower.includes("kurang"))) {
        showAlert(
          "Saldo Tidak Cukup",
          "Saldo kamu tidak cukup untuk melanjutkan pembayaran. Silakan top up terlebih dahulu."
        );
        return;
      }

      if (!json) {
        showAlert("Gagal", "Server mengembalikan respons tidak valid.");
        return;
      }

      showAlert("Gagal", msg || "Gagal melakukan pembayaran.");
    } catch (e) {
      console.log(e);
      showAlert("Error", "Terjadi kesalahan koneksi.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Pembayaran</Text>

      {!!cafeLocationName && Number(scheduleId) === 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Lokasi Café</Text>
          <Text style={styles.line}>{cafeLocationName}</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Grand Total</Text>
        <Text style={styles.grandTotal}>Rp {grandTotal.toLocaleString("id-ID")}</Text>
        {loadingMenu && <ActivityIndicator style={{ marginTop: 10 }} />}
      </View>

      <TouchableOpacity
        style={[styles.payButton, processing && { backgroundColor: "#ccc" }]}
        disabled={processing}
        onPress={handlePay}
      >
        {processing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.payButtonText}>Bayar Sekarang</Text>
        )}
      </TouchableOpacity>

      {Number(scheduleId) > 0 && (
        <Text style={styles.subText}>
          {title}
          {studio ? ` • ${studio}` : ""}
          {time ? ` • ${time}` : ""}
        </Text>
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
  line: { fontSize: 14 },
  grandTotal: { fontSize: 22, fontWeight: "bold", color: "#2c3e50" },
  payButton: {
    backgroundColor: "#27ae60",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  payButtonText: { color: "white", fontWeight: "bold" },
  subText: { marginTop: 16, color: "gray", textAlign: "center" },
});

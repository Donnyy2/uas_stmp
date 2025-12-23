import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
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

export default function BookingSeat() {
    const params = useLocalSearchParams();
    const { scheduleId, title, price, studio, time } = params;

    const [bookedSeats, setBookedSeats] = useState<string[]>([]);
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    const rows = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const cols = [1, 2, 3, 4, 5, 6, 7, 8];

    const fetchBookedSeats = async () => {
        try {
            console.log("Fetching seats for schedule:", scheduleId);

            const options = {
                method: 'POST',
                headers: new Headers({
                    'Content-Type': 'application/x-www-form-urlencoded'
                }),
                body: "schedule_id=" + scheduleId
            };

            const response = await fetch(
                "https://ubaya.cloud/react/160422136/UAS/get_seats.php",
                options
            );
            const json = await response.json();
            console.log("Seats data:", json);

            if (json.result === "success") {
                setBookedSeats(json.booked_seats);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookedSeats();
    }, []);

    const toggleSeat = (seatId: string) => {
        setSelectedSeats((prev) =>
            prev.includes(seatId) ? prev.filter((s) => s !== seatId) : [...prev, seatId]
        );
    };

    const seatPrice = Number(price) || 0;
    const totalPrice = selectedSeats.length * seatPrice;

    const showAlert = (title: string, message: string, onOk?: () => void) => {
        if (Platform.OS === 'web') {
            alert(`${title}\n\n${message}`);
            onOk?.();
            return;
        }

        Alert.alert(title, message, onOk ? [{ text: "OK", onPress: onOk }] : undefined);
    };

    const handleBooking = async () => {
        if (selectedSeats.length === 0) {
            showAlert("Pilih Kursi", "Silakan pilih kursi terlebih dahulu.");
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

            // seats format: A-1,B-2,C-3
            const seatsParam = selectedSeats.join(",");
            const bodyData =
                "user_name=" + encodeURIComponent(username) +
                "&schedule_id=" + encodeURIComponent(String(scheduleId)) +
                "&seats=" + encodeURIComponent(seatsParam) +
                "&price=" + encodeURIComponent(String(seatPrice));

            const options = {
                method: 'POST',
                headers: new Headers({
                    'Content-Type': 'application/x-www-form-urlencoded'
                }),
                body: bodyData
            };

            console.log("Sending booking:", bodyData);

            const response = await fetch(
                "https://ubaya.cloud/react/160422136/UAS/book_ticket.php",
                options
            );
            const text = await response.text();
            let json: any = null;
            try {
                json = JSON.parse(text);
            } catch {
                json = null;
            }
            console.log("Booking result:", json);

            if (json?.result === "success") {
                showAlert(
                    "Berhasil!",
                    "Tiket berhasil dipesan. Saldo Anda telah terpotong.",
                    () => router.replace("/(user)/home" as any)
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

            showAlert("Gagal", msg || "Gagal memesan tiket.");
        } catch (error) {
            console.error(error);
            showAlert("Error", "Terjadi kesalahan koneksi.");
        } finally {
            setProcessing(false);
        }
    };

    const renderSeat = (row: string, col: number) => {
        const seatId = `${row}-${col}`;
        const isBooked = bookedSeats.includes(seatId);
        const isSelected = selectedSeats.includes(seatId);

        return (
            <TouchableOpacity
                key={seatId}
                disabled={isBooked}
                onPress={() => toggleSeat(seatId)}
                style={[
                    styles.seat,
                    isBooked ? styles.seatBooked : isSelected ? styles.seatSelected : styles.seatAvailable,
                    col === 4 && { marginRight: 20 },
                ]}
            >
                <Text style={[styles.seatText, (isBooked || isSelected) && { color: "white" }]}>
                    {col}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.header}>{title}</Text>
                <Text style={styles.subHeader}>{studio} • {time}</Text>
            </View>

            <View style={styles.screenContainer}>
                <View style={styles.screenLine} />
                <Text style={styles.screenText}>LAYAR</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#2c3e50" style={{ marginVertical: 50 }} />
            ) : (
                <View style={styles.seatContainer}>
                    {rows.map((row) => (
                        <View key={row} style={styles.rowContainer}>
                            <Text style={styles.rowLabel}>{row}</Text>
                            {cols.map((col) => renderSeat(row, col))}
                        </View>
                    ))}
                </View>
            )}

            <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                    <View style={[styles.seatLegend, styles.seatAvailable]} />
                    <Text style={styles.legendText}>Tersedia</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.seatLegend, styles.seatSelected]} />
                    <Text style={styles.legendText}>Dipilih</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.seatLegend, styles.seatBooked]} />
                    <Text style={styles.legendText}>Terisi</Text>
                </View>
            </View>

            <View style={styles.footer}>
                <View>
                    <Text style={{ color: 'gray' }}>Total Harga:</Text>
                    <Text style={styles.priceText}>
                        Rp {totalPrice ? totalPrice.toLocaleString("id-ID") : "0"}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.bookButton, (selectedSeats.length === 0 || processing) && { backgroundColor: "#ccc" }]}
                    disabled={selectedSeats.length === 0 || processing}
                    onPress={handleBooking}
                >
                    {processing ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.bookButtonText}>Bayar Sekarang</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fff',
        minHeight: '100%',
    },
    headerContainer: { marginBottom: 20, alignItems: 'center' },
    header: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 5 },
    subHeader: { fontSize: 14, color: "gray" },
    screenContainer: { alignItems: "center", marginBottom: 20 },
    screenLine: { width: "80%", height: 4, backgroundColor: "#2c3e50", borderRadius: 2, marginBottom: 5 },
    screenText: { fontSize: 10, color: "gray" },
    seatContainer: { alignItems: "center" },
    rowContainer: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    rowLabel: { width: 20, fontWeight: "bold", marginRight: 10, textAlign: "center" },
    seat: { width: 30, height: 30, borderRadius: 4, justifyContent: "center", alignItems: "center", marginHorizontal: 2 },
    seatAvailable: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#ccc" },
    seatSelected: { backgroundColor: "#f39c12", borderColor: "#e67e22" },
    seatBooked: { backgroundColor: "#e74c3c", borderColor: "#c0392b" },
    seatText: { fontSize: 10, color: "#333" },
    legendContainer: { flexDirection: "row", justifyContent: "center", marginTop: 20, gap: 15 },
    legendItem: { flexDirection: "row", alignItems: "center" },
    seatLegend: { width: 15, height: 15, borderRadius: 2, marginRight: 5 },
    legendText: { fontSize: 12 },
    footer: { marginTop: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTopWidth: 1, borderTopColor: '#eee' },
    priceText: { fontSize: 18, fontWeight: "bold", color: "#2c3e50" },
    bookButton: { backgroundColor: "#27ae60", paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8 },
    bookButtonText: { color: "white", fontWeight: "bold", fontSize: 14 },
});
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

export default function MovieDetail() {
  const params = useLocalSearchParams();
  const { 
    scheduleId, 
    title, 
    price, 
    studio, 
    time, 
    overview 
  } = params;

  const formatRupiah = (num: string) => {
    return "Rp " + Number(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Lokasi Studio:</Text>
        <Text style={styles.value}>{studio}</Text>
        
        <Text style={styles.label}>Jam Tayang:</Text>
        <Text style={styles.value}>{time}</Text>
        
        <Text style={styles.label}>Harga Tiket:</Text>
        <Text style={styles.price}>{formatRupiah(price as string)}</Text>
      </View>

      <View style={styles.overviewContainer}>
        <Text style={styles.sectionTitle}>Sinopsis</Text>
        <Text style={styles.overviewText}>
          {overview ? overview : "Tidak ada deskripsi untuk film ini."}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button 
          title="Pilih Kursi" 
          color="#2c3e50"
          onPress={() => {
            router.push({
              pathname: "/(user)/booking_seat" as any,
              params: { 
                scheduleId, 
                title, 
                price,
                studio,
                time
              }
            });
          }} 
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  infoContainer: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  label: {
    fontSize: 14,
    color: 'gray',
    marginTop: 5,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'green',
    marginTop: 5,
  },
  overviewContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  overviewText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#444',
    textAlign: 'justify',
  },
  buttonContainer: {
    marginBottom: 40,
  }
});
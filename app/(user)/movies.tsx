import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet, Text, TouchableOpacity, View
} from "react-native";

interface MovieSchedule {
  schedule_id: number;
  movie_id: number;
  title: string;
  studio_name: string;
  show_time: string;
  price: number;
  overview?: string; 
}

export default function Movies() {
  const { locationId, locationName } = useLocalSearchParams();
  
  const [schedules, setSchedules] = useState<MovieSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMovies = async () => {
    try {
      const options = {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/x-www-form-urlencoded'
        }),
        body: "location_id=" + locationId
      };

      const response = await fetch(
        "https://ubaya.cloud/react/160422136/UAS/get_movies_by_location.php",
        options
      );
      const json = await response.json();

      if (json.result === "success") {
        setSchedules(json.data);
      } else {
        setSchedules([]);
      }
    } catch (error) {
      Alert.alert("Error", "Gagal mengambil data jadwal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (locationId) {
      fetchMovies();
    }
  }, [locationId]);

  const formatRupiah = (num: number) => {
    return "Rp " + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const renderItem = ({ item }: { item: MovieSchedule }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => {
        router.push({
            pathname: "/(user)/movie_detail" as any,
            params: { 
                scheduleId: item.schedule_id, 
                title: item.title,
                price: item.price,
                studio: item.studio_name,
                time: item.show_time,
                overview: item.overview || ""
            }
        });
      }}
    >
      <View style={{ padding: 10 }}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.info}>🏠 {item.studio_name}</Text>
        <Text style={styles.info}>🕒 {item.show_time}</Text>
        <Text style={styles.price}>{formatRupiah(item.price)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Film di {locationName}</Text>

      {loading ? (
        <ActivityIndicator size="large" color="blue" />
      ) : schedules.length === 0 ? (
        <Text>Tidak ada jadwal tayang di lokasi ini.</Text>
      ) : (
        <FlatList
          data={schedules}
          keyExtractor={(item) => item.schedule_id.toString()}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  card: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
    borderRadius: 5,
    backgroundColor: '#fafafa'
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  info: {
    fontSize: 14,
    marginBottom: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "green",
    marginTop: 5,
  }
});
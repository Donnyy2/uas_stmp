import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Location {
  id: number;
  name: string;
  city: string;
  address: string;
  image_url: string;
};

export default function CafeLocations() {
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);

  const fetchLocations = async () => {
    try {
      const response = await fetch(
        "https://ubaya.cloud/react/160422136/UAS/get_locations.php"
      );
      const json = await response.json();

      if (json.result === "success") {
        setLocations(json.data);
      } else {
        Alert.alert("Error", json.message);
      }
    } catch (e) {
      Alert.alert("Error", "Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const renderItem = ({ item }: { item: Location }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        router.push({
          pathname: "/(user)/order_food" as any,
          params: {
            scheduleId: 0,
            cafeLocationId: item.id,
            cafeLocationName: item.name,
          },
        } as any);
      }}
    >
      <Image source={{ uri: item.image_url }} style={styles.image} />
      <View style={{ padding: 10 }}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.subtitle}>
          {item.city} - {item.address}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Daftar Lokasi Café</Text>
      {loading ? (
        <ActivityIndicator size="large" color="blue" />
      ) : (
        <FlatList
          data={locations}
          keyExtractor={(it) => String(it.id)}
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
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  card: {
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 15,
    borderRadius: 5,
  },
  image: {
    width: "100%",
    height: 150,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    color: "gray",
    marginTop: 5,
  },
});

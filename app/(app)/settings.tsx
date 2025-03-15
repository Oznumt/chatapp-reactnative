import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

export default function Settings() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Başlık */}
      <Text style={styles.title}>Ayarlar</Text>

      {/* Engellenen Kullanıcılar Butonu */}
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => {
          console.log("Engellenen Kullanıcılar butonuna basıldı!"); // Konsola mesaj bas
          router.push("/blockedUsers"); // Sayfaya yönlendir
        }}
        activeOpacity={0.7} // Basılma efekti için
      >
        <MaterialIcons name="block" size={24} color="white" />
        <Text style={styles.buttonText}>Engellenen Kullanıcılar</Text>
      </TouchableOpacity>
    </View>
  );
}

// 📌 Stil Tanımları
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF3B30", // Kırmızı buton
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
});

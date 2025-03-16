import { View, StyleSheet, TouchableOpacity, Text, Alert } from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "../../firebaseConfig";
import { deleteUser } from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";

export default function Settings() {
  const router = useRouter();

  const handleDeleteAccount = async () => {
    const user = auth.currentUser; 

    if (!user) {
      Alert.alert("Error", "No authenticated user found.");
      return;
    }

    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const userDocRef = doc(db, "users", user.uid);
              await deleteDoc(userDocRef);
              await deleteUser(user); 
              router.replace("/(auth)");
            } catch (error) {
              Alert.alert("Error", "Failed to delete account.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/blockedUsers")}
      >
        <Text style={styles.buttonText}>Blocked Users</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
        <Text style={styles.deleteButtonText}>Delete Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 20,
    paddingTop: 40, 
  },
  button: {
    backgroundColor: "#1E90FF",
    padding: 16,
    borderRadius: 12,
    width: "100%", 
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
    padding: 16,
    borderRadius: 12,
    width: "100%", 
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
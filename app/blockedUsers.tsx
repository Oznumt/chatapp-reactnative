import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Image } from "react-native";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore"; 
import { auth, db } from "../firebaseConfig";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

export default function BlockedUsers() {
  const [blockedUsers, setBlockedUsers] = useState<{ id: string; name: string; photoURL?: string | undefined }[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      if (!auth.currentUser) return;
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const blockedIds: string[] = userSnap.data().blockedUsers || [];

        const blockedUsersData = await Promise.all(
          blockedIds.map(async (userId: string): Promise<{ id: string; name: string; photoURL?: string | undefined }> => {
            const userDoc = await getDoc(doc(db, "users", userId));
            if (userDoc.exists()) {
              return {
                id: userId,
                name: userDoc.data().name || "Unknown User",
                photoURL: userDoc.data().photoURL ?? undefined,
              };
            }
            return { id: userId, name: "Unknown User", photoURL: undefined };
          })
        );

        setBlockedUsers(blockedUsersData);
      }
    };

    fetchBlockedUsers();
  }, []);

  const unblockUser = async (userId: string) => {
    if (!auth.currentUser) return;

    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        blockedUsers: arrayRemove(userId), 
      });

      setBlockedUsers((prev) => prev.filter((user) => user.id !== userId));
      Alert.alert("Success", "User unblocked successfully!");
    } catch (error) {
      Alert.alert("Error", "Could not unblock user.");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/home")}>
        <MaterialIcons name="arrow-back" size={24} color="#000000" />
        <Text style={styles.backText}>Blocked Users</Text>
      </TouchableOpacity>

      <FlatList
        data={blockedUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.userRow}>
            {item.photoURL ? (
              <Image source={{ uri: item.photoURL }} style={styles.profileImage} />
            ) : (
              <View style={styles.iconContainer}>
                <MaterialIcons name="person" size={30} color="white" />
              </View>
            )}
            <Text style={styles.userName}>{item.name}</Text>
            <TouchableOpacity onPress={() => unblockUser(item.id)} style={styles.unblockButton}>
              <Text style={styles.unblockText}>Unblock</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginBottom: 10,
  },
  backText: {
    fontSize: 18,
    color: "#000000",
    marginLeft: 5,
    fontWeight: "bold",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#DDD",
    paddingHorizontal: 10,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1E90FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  unblockButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  unblockText: {
    color: "#FFF",
    fontWeight: "bold",
  },
});

import { useRouter } from "expo-router";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert } from "react-native";
import { useEffect, useState } from "react";
import { collection, query, onSnapshot, updateDoc, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { MaterialIcons } from "@expo/vector-icons";

export default function Home() {
  const router = useRouter();
  const [users, setUsers] = useState<{
    id: string;
    name: string;
    photoURL?: string;
    unreadCount?: number;
  }[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const fetchBlockedUsers = async () => {
      const userRef = doc(db, "users", auth.currentUser!.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setBlockedUsers(userSnap.data().blockedUsers || []);
      }
    };

    fetchBlockedUsers();
  }, [auth.currentUser]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, "users"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userList = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          photoURL: doc.data().photoURL || null,
        }))
        .filter((user) => user.id !== auth.currentUser!.uid && !blockedUsers.includes(user.id));

      userList.forEach((user) => {
        const chatId = [auth.currentUser!.uid, user.id].sort().join("_");
        const messagesQuery = query(collection(db, `chats/${chatId}/messages`));

        onSnapshot(messagesQuery, (msgSnapshot) => {
          const unreadCount = msgSnapshot.docs.filter(
            (doc) => doc.data().sender !== auth.currentUser!.uid && doc.data().status === "sent"
          ).length;

          setUsers((prevUsers) =>
            prevUsers.map((u) => (u.id === user.id ? { ...u, unreadCount } : u))
          );
        });
      });

      setUsers(userList);
    });

    return () => unsubscribe();
  }, [blockedUsers, auth.currentUser]);

  const blockUser = async (userId: string) => {
    if (!auth.currentUser) return;
    try {
      const userRef = doc(db, "users", auth.currentUser!.uid);
      const updatedBlockedUsers = [...blockedUsers, userId];
      await updateDoc(userRef, { blockedUsers: updatedBlockedUsers });
      setBlockedUsers(updatedBlockedUsers);
      Alert.alert("User Blocked", "This user has been blocked successfully.");
    } catch (error) {
      Alert.alert("Error", "Failed to block the user.");
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userCard}
            onPress={() =>
              router.push({ pathname: "/chat", params: { receiverId: item.id, receiverName: item.name } })
            }
            onLongPress={() =>
              Alert.alert("Block User", `Do you want to block ${item.name}?`, [
                { text: "Cancel", style: "cancel" },
                { text: "Block", onPress: () => blockUser(item.id), style: "destructive" },
              ])
            }
          >
            {item.photoURL ? (
              <Image source={{ uri: item.photoURL }} style={styles.profileImage} />
            ) : (
              <View style={styles.iconContainer}>
                <MaterialIcons name="person" size={30} color="white" />
              </View>
            )}
            <Text style={styles.userText}>{item.name}</Text>

            {typeof item.unreadCount === "number" && item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCountText}>{String(item.unreadCount)}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 12,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginVertical: 6,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEE",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1E90FF",
    justifyContent: "center",
    alignItems: "center",
  },
  userText: {
    fontSize: 16,
    marginLeft: 14,
    fontWeight: "500",
    color: "#222",
  },
  unreadBadge: {
    backgroundColor: "#1E90FF",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "auto",
  },
  unreadCountText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
});

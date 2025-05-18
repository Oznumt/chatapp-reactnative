import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, TextInput, Modal } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { collection, addDoc, onSnapshot, getDoc, doc, deleteDoc, query, limit } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { useRouter } from "expo-router";

interface Group {
  id: string;
  name: string;
  createdBy?: string;
}

export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [unreadCounts, setUnreadCounts] = useState<{ [groupId: string]: number }>({});
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "groups"), async (snapshot) => {
      const groupList: Group[] = [];
      for (const docSnap of snapshot.docs) {
        const group = { id: docSnap.id, ...docSnap.data() } as Group;
        groupList.push(group);
        listenToUnread(group.id);
      }
      setGroups(groupList);
    });

    return () => unsubscribe();
  }, []);

  const listenToUnread = (groupId: string) => {
    const msgRef = collection(db, `groups/${groupId}/messages`);
    const q = query(msgRef, limit(50));
    onSnapshot(q, (snapshot) => {
      let count = 0;
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const seenBy = data.seenBy || [];
        if (data.sender !== auth.currentUser?.uid && !seenBy.includes(auth.currentUser?.uid)) {
          count++;
        }
      });
      setUnreadCounts((prev) => ({ ...prev, [groupId]: count }));
    });
  };

  const handleGroupPress = async (groupId: string, groupName: string) => {
    const groupSnap = await getDoc(doc(db, "groups", groupId));
    const groupData = groupSnap.data();
    const isMember = groupData?.members?.includes(auth.currentUser?.uid);

    if (isMember) {
      router.push({ pathname: "/groupChat", params: { groupId, groupName } });
    } else {
      router.push({ pathname: "/groupDetails", params: { groupId, groupName } });
    }
  };

  const handleGroupLongPress = async (group: Group) => {
    if (group.createdBy === auth.currentUser?.uid) {
      Alert.alert("Delete Group", "Are you sure you want to delete this group?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteDoc(doc(db, "groups", group.id));
          },
        },
      ]);
    } else {
      Alert.alert("Permission Denied", "Only the group creator can delete this group.");
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert("Error", "Please enter a group name.");
      return;
    }

    const currentUid = auth.currentUser?.uid;
    if (!currentUid) return;

    try {
      await addDoc(collection(db, "groups"), {
        name: newGroupName.trim(),
        createdAt: new Date(),
        createdBy: currentUid,
        members: [currentUid],
        admins: [currentUid],
      });
      setNewGroupName("");
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "Failed to create group.");
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.groupItem}
            onPress={() => handleGroupPress(item.id, item.name)}
            onLongPress={() => handleGroupLongPress(item)}
          >
            <MaterialIcons name="group" size={28} color="#1E90FF" />
            <Text style={styles.groupName}>{item.name}</Text>
            {unreadCounts[item.id] > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unreadCounts[item.id]}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.popupCard}>
            <Text style={styles.modalTitle}>New Group</Text>
            <TextInput
              placeholder="Group name"
              value={newGroupName}
              onChangeText={setNewGroupName}
              style={styles.input}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={handleCreateGroup}>
                <Text style={styles.modalButtonText}>Create</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: "#CCC" }]} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <MaterialIcons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
  },
  groupItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    marginVertical: 6,
    position: "relative",
  },
  groupName: {
    marginLeft: 12,
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: "#1E90FF",
    borderRadius: 12,
    minWidth: 24,
    paddingHorizontal: 6,
    paddingVertical: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#1E90FF",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  popupCard: {
    width: "85%",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: "#FAFAFA",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    backgroundColor: "#1E90FF",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
});

import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { auth, db } from "../firebaseConfig";
import { getDoc, doc, updateDoc, deleteDoc, arrayRemove, arrayUnion } from "firebase/firestore";
import { MaterialIcons } from "@expo/vector-icons";

export default function GroupDetails() {
  const { groupId, groupName } = useLocalSearchParams();
  const router = useRouter();
  const [group, setGroup] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const currentUser = auth.currentUser;

  const isAdmin = (uid: string) => group?.admins?.includes(uid);
  const isOwner = currentUser?.uid === group?.createdBy;
  const inGroup = group?.members?.includes(currentUser?.uid);

  useEffect(() => {
    const fetchGroupData = async () => {
      const groupSnap = await getDoc(doc(db, "groups", groupId as string));
      const groupData = groupSnap.data();
      setGroup(groupData);

      if (!groupData) return;

      const memberData = await Promise.all(
        groupData.members.map(async (uid: string) => {
          const userSnap = await getDoc(doc(db, "users", uid));
          return {
            id: uid,
            name: userSnap.data()?.name || "Unknown",
            email: userSnap.data()?.email || "",
          };
        })
      );
      setUsers(memberData);
    };

    fetchGroupData();
  }, [groupId]);

  const handleMakeAdmin = async (uid: string) => {
    if (!group) return;
    await updateDoc(doc(db, "groups", groupId as string), {
      admins: arrayUnion(uid),
    });
    setGroup((prev: any) => ({ ...prev, admins: [...prev.admins, uid] }));
  };

  const handleRemoveUser = async (uid: string) => {
    if (!group) return;
    if (!isOwner && isAdmin(uid)) {
      Alert.alert("Unauthorized", "Only the group creator can remove admins.");
      return;
    }

    await updateDoc(doc(db, "groups", groupId as string), {
      members: arrayRemove(uid),
      admins: arrayRemove(uid),
    });
    setUsers((prev) => prev.filter((user) => user.id !== uid));
  };

  const handleLeaveGroup = async () => {
    if (isOwner) {
      Alert.alert("Action not allowed", "You are the creator of the group and cannot leave.");
      return;
    }
    await updateDoc(doc(db, "groups", groupId as string), {
      members: arrayRemove(currentUser?.uid),
      admins: arrayRemove(currentUser?.uid),
    });
    router.replace("/groups");
  };

  const handleJoinGroup = async () => {
    await updateDoc(doc(db, "groups", groupId as string), {
      members: arrayUnion(currentUser?.uid),
    });
    setGroup((prev: any) => ({ ...prev, members: [...prev.members, currentUser?.uid] }));
    router.replace({ pathname: "/groupChat", params: { groupId, groupName: group?.name || "Group" } });
  };

  const handleDeleteGroup = async () => {
    Alert.alert("Delete Group", "This action is irreversible. Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteDoc(doc(db, "groups", groupId as string));
          router.replace("/groups");
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{group?.name || "Group"}</Text>
      </View>

      <View style={{ flex: 1, marginTop: 16 }}>
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isCurrent = item.id === currentUser?.uid;
            return (
              <View style={styles.userCard}>
                <MaterialIcons name="person" size={30} color="#3b82f6" />
                <View style={styles.userInfo}>
                  <Text>{item.name}</Text>
                  <Text style={styles.email}>{item.email}</Text>
                </View>
                {isAdmin(item.id) && <Text style={styles.adminLabel}>admin</Text>}
                <TouchableOpacity
                  disabled={!((isOwner || (isAdmin(currentUser?.uid || "") && !isAdmin(item.id))) && !isCurrent)}
                  onPress={() => handleRemoveUser(item.id)}
                >
                  <MaterialIcons name="remove-circle-outline" size={24} color={((isOwner || (isAdmin(currentUser?.uid || "") && !isAdmin(item.id))) && !isCurrent) ? "red" : "#ccc"} />
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={!(isOwner && !isAdmin(item.id) && !isCurrent)}
                  onPress={() => handleMakeAdmin(item.id)}
                >
                  <MaterialIcons name="star-outline" size={24} color={(isOwner && !isAdmin(item.id) && !isCurrent) ? "green" : "#ccc"} />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.joinButton, inGroup && styles.disabledButton]}
          onPress={handleJoinGroup}
          disabled={inGroup}
        >
          <Text style={styles.joinText}>Join Group</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.leaveButton, (!inGroup || isOwner) && styles.disabledButton]}
          onPress={handleLeaveGroup}
          disabled={!inGroup || isOwner}
        >
          <Text style={styles.leaveText}>Leave Group</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.deleteButton, !isOwner && styles.disabledButton]}
          onPress={handleDeleteGroup}
          disabled={!isOwner}
        >
          <Text style={styles.deleteText}>Delete Group</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF", padding: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#DDD",
    paddingHorizontal: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 16,
    color: "#333",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E5E7EB",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  userInfo: { marginLeft: 10, flex: 1 },
  email: { fontSize: 12, color: "#555" },
  adminLabel: {
    color: "green",
    fontWeight: "bold",
    fontSize: 12,
    marginRight: 10,
    textTransform: "uppercase",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingBottom: 30,
    paddingTop: 10,
  },
  joinButton: {
    backgroundColor: "#333",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  leaveButton: {
    backgroundColor: "#CCC",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: "#B00020",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.4,
  },
  joinText: { color: "white", fontWeight: "bold" },
  leaveText: { color: "black", fontWeight: "bold" },
  deleteText: { color: "white", fontWeight: "bold" },
});
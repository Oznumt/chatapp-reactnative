import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert } from "react-native";
import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import { auth, db, storage } from "../../firebaseConfig";
import { updateDoc, doc, getDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes, deleteObject } from "firebase/storage";
import { MaterialIcons } from "@expo/vector-icons";

export default function Profile() {
  const [name, setName] = useState("");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!auth.currentUser) return;
      setEmail(auth.currentUser.email || "");
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setName(userSnap.data().name || "");
        setPhotoURL(userSnap.data().photoURL || null);
      }
    };
    fetchUserProfile();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    if (!auth.currentUser) {
      Alert.alert("Error", "You need to be logged in to upload a profile picture.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(uri);
      if (!response.ok) throw new Error("Failed to fetch image from URI");

      const blob = await response.blob();
      const storageRef = ref(storage, `profilePictures/${auth.currentUser.uid}.jpg`);

      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      setPhotoURL(downloadURL);

      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, { photoURL: downloadURL });

      Alert.alert("Success", "Profile picture updated successfully!");
    } catch (error) {
      const err = error as Error;
      Alert.alert("Upload Failed", `Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const removeProfileImage = async () => {
    if (!auth.currentUser || !photoURL) return;

    setLoading(true);

    try {
      const storageRef = ref(storage, `profilePictures/${auth.currentUser.uid}.jpg`);
      await deleteObject(storageRef);

      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, { photoURL: null });

      setPhotoURL(null);
      Alert.alert("Success", "Profile picture removed successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to remove profile picture.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setLoading(true);

    try {
      const finalName = name.trim() || email;
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, { name: finalName, photoURL });
      Alert.alert("Profile Updated", "Your profile has been successfully updated.");
    } catch (error) {
      Alert.alert("Update Failed", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      
      <TouchableOpacity onPress={pickImage} style={styles.profileImageContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#1E90FF" />
        ) : photoURL ? (
          <Image source={{ uri: photoURL }} style={styles.profileImage} />
        ) : (
          <View style={styles.defaultProfile}>
            <MaterialIcons name="photo-camera" size={36} color="white" />
          </View>
        )}
      </TouchableOpacity>

      {photoURL && (
        <TouchableOpacity onPress={removeProfileImage}>
          <Text style={styles.removeText}>Remove Profile Image</Text>
        </TouchableOpacity>
      )}

      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        value={name}
        onChangeText={setName}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
    alignItems: "center",
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#EEE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  defaultProfile: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
    backgroundColor: "#1E90FF",
    alignItems: "center",
    justifyContent: "center",
  },
  removeText: {
    color: "red",
    fontSize: 14,
    marginBottom: 10,
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: "#F9F9F9",
  },
  saveButton: {
    width: "100%",
    backgroundColor: "#1E90FF",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  saveText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

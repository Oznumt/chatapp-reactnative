import { useLocalSearchParams, useRouter } from "expo-router";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Alert,
    Image,
    Modal,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    updateDoc,
    doc,
    deleteDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import { auth, db, storage } from "../firebaseConfig";
import { MaterialIcons } from "@expo/vector-icons";
import moment from "moment";

interface Message {
    id: string;
    text?: string;
    mediaUrl?: string;
    sender: string;
    timestamp: any;
    status: string;
}

export default function Chat() {
    const router = useRouter();
    const { receiverId, receiverName } = useLocalSearchParams();
    const [messages, setMessages] = useState<Message[]>([]);
    const [message, setMessage] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
    const flatListRef = useRef<FlatList<Message>>(null);

    const chatId = auth.currentUser?.uid && receiverId
        ? [auth.currentUser.uid, receiverId].sort().join("_")
        : null;

    useEffect(() => {
        if (!chatId) return;

        const q = query(collection(db, `chats/${chatId}/messages`), orderBy("timestamp"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const msgs: Message[] = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Message[];
            setMessages(msgs);

            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        });

        return () => unsubscribe();
    }, [chatId]);

    useEffect(() => {
        markMessagesAsRead();
    }, [messages]);

    const markMessagesAsRead = async () => {
        if (!chatId || !auth.currentUser) return;

        const unreadMessages = messages.filter(
            (msg) => msg.sender !== auth.currentUser?.uid && msg.status === "sent"
        );

        for (const msg of unreadMessages) {
            await updateDoc(doc(db, `chats/${chatId}/messages`, msg.id), { status: "read" });
        }
    };

    const deleteMessage = async (messageId: string) => {
        if (!chatId || !auth.currentUser) return;

        try {
            await deleteDoc(doc(db, `chats/${chatId}/messages`, messageId));
        } catch (error) {
            console.error("Message Delete error", error);
        }
    };

    const sendMessage = async () => {
        if (!message.trim() || !chatId || !auth.currentUser) return;

        const messageToSend = message;
        setMessage("");

        await addDoc(collection(db, `chats/${chatId}/messages`), {
            text: messageToSend,
            sender: auth.currentUser.uid,
            timestamp: new Date(),
            status: "sent",
        });
    };

    
    const pickMedia = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            uploadMedia(result.assets[0].uri);
        }
    };

    const uploadMedia = async (uri: string) => {
        if (!chatId || !auth.currentUser) return;

        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            const storageRef = ref(storage, `chatMedia/${chatId}/${Date.now()}`);

            await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(storageRef);

            await addDoc(collection(db, `chats/${chatId}/messages`), {
                mediaUrl: downloadURL,
                sender: auth.currentUser.uid,
                timestamp: new Date(),
                status: "sent",
            });
        } catch (error) {
            console.error("Media upload failed:", error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color="#1E90FF" />
                </TouchableOpacity>
                <Text style={styles.chatTitle}>{receiverName}</Text>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.chatContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                renderItem={({ item, index }) => {
                    const messageDate = moment(item.timestamp?.toDate()).format("DD/MM/YYYY");
                    const prevMessageDate =
                        index > 0 ? moment(messages[index - 1].timestamp?.toDate()).format("DD/MM/YYYY") : null;

                    return (
                        <>
                            {messageDate !== prevMessageDate && <Text style={styles.dateHeader}>{messageDate}</Text>}

                            <TouchableOpacity
                                onLongPress={() => {
                                    if (item.sender === auth.currentUser?.uid) {
                                        Alert.alert(
                                            "Delete Message", "Are you sure you want to delete this message?", [
                                            { text: "Cancel", style: "cancel" },
                                            { text: "Delete", style: "destructive", onPress: () => deleteMessage(item.id) },
                                        ]);
                                    }
                                }}
                                onPress={() => item.mediaUrl && (setSelectedMedia(item.mediaUrl), setModalVisible(true))}
                            >
                                <View style={[item.sender === auth.currentUser?.uid ? styles.myMessageContainer : styles.otherMessageContainer]}>
                                    {item.mediaUrl ? (
                                        <Image source={{ uri: item.mediaUrl }} style={{ width: 200, height: 200, borderRadius: 10 }} />
                                    ) : (
                                        <Text style={item.sender === auth.currentUser?.uid ? styles.myMessage : styles.otherMessage}>{item.text}</Text>
                                    )}

                                    <View style={styles.messageInfo}>
                                        {item.sender === auth.currentUser?.uid && (
                                            <Text style={[styles.statusText, item.status === "read" ? styles.readText : styles.sentText]}>{item.status}</Text>
                                        )}
                                        <Text style={[styles.timestamp, item.sender !== auth.currentUser?.uid && styles.timestampOther]}>
                                            {moment(item.timestamp?.toDate()).format("HH:mm")}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </>
                    );
                }}
            />

            <View style={styles.inputContainer}>
                <TouchableOpacity onPress={pickMedia}>
                    <MaterialIcons name="image" size={28} color="#1E90FF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={pickMedia}>
                    <MaterialIcons name="attach-file" size={28} color="#1E90FF" />
                </TouchableOpacity>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        value={message}
                        onChangeText={setMessage}
                    />
                </View>
                <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                    <MaterialIcons name="send" size={28} color="white" />
                </TouchableOpacity>
            </View>
            <Modal visible={modalVisible} transparent={true} animationType="fade">
                <View style={styles.modalContainer}>
                    <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                        <MaterialIcons name="close" size={28} color="white" />
                    </TouchableOpacity>
                    {selectedMedia && <Image source={{ uri: selectedMedia }} style={styles.fullImage} />}
                </View>
            </Modal>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#DDD",
    },
    chatTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginLeft: 10,
        color: "#333",
    },
    dateHeader: {
        alignSelf: "center",
        marginVertical: 10,
        fontSize: 12,
        color: "#666",
    },
    chatContent: {
        paddingHorizontal: 20,
    },
    myMessageContainer: {
        alignSelf: "flex-end",
        backgroundColor: "#1E90FF",
        borderRadius: 12,
        marginVertical: 5,
        padding: 10,
        maxWidth: "75%",
    },
    otherMessageContainer: {
        alignSelf: "flex-start",
        backgroundColor: "#F1F1F1",
        borderRadius: 12,
        marginVertical: 5,
        padding: 10,
        maxWidth: "75%",
    },
    myMessage: {
        color: "#FFFFFF",
        fontSize: 16,
    },
    otherMessage: {
        color: "#333",
        fontSize: 16,
    },
    messageInfo: {
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        marginTop: 5,
    },
    statusText: {
        fontSize: 12,
        marginRight: 5,
        fontWeight: "bold",
    },
    sentText: {
        color: "#FFA500",
    },
    readText: {
        color: "#008000",
    },
    timestamp: {
        fontSize: 12,
        color: "#FFF",
        marginLeft: 5,
        opacity: 0.8,
    },
    timestampOther: {
        color: "#666",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: "#DDD",
        backgroundColor: "#F9F9F9",
    },
    inputWrapper: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: "#DDD",
        marginHorizontal: 10,
    },
    input: {
        height: 40,
    },
    sendButton: {
        backgroundColor: "#1E90FF",
        padding: 10,
        borderRadius: 50,
    },
    deleteButton: {
        marginLeft: 10,
        padding: 5,
        backgroundColor: "red",
        borderRadius: 5,
    },

    modalContainer: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.8)",
        justifyContent: "center",
        alignItems: "center",
    },
    fullImage: {
        width: "90%",
        height: "80%",
        resizeMode: "contain",
    },
    closeButton: {
        position: "absolute",
        top: 40,
        right: 20,
    },
});


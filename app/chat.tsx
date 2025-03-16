import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
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
  DocumentData,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { MaterialIcons } from "@expo/vector-icons";
import moment from "moment";


interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: any;
  status: string;
}

export default function Chat() {
  const router = useRouter();
  const { receiverId, receiverName } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const flatListRef = useRef<FlatList<Message>>(null);

  const chatId = auth.currentUser?.uid && receiverId
    ? [auth.currentUser.uid, receiverId].sort().join("_")
    : null;

  useEffect(() => {
    if (!chatId) return;

    const q = query(collection(db, `chats/${chatId}/messages`), orderBy("timestamp"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs: Message[] = querySnapshot.docs.map((doc) => {
        const data = doc.data() as DocumentData;
        return {
          id: doc.id,
          text: data.text || "",
          sender: data.sender || "",
          timestamp: data.timestamp || new Date(),
          status: data.status || "sent",
        };
      });
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
      console.error("Mesaj silme başarısız:", error);
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
            
            {messageDate !== prevMessageDate && (
              <Text style={styles.dateHeader}>{messageDate}</Text>
            )}

            <TouchableOpacity
              onLongPress={() => {
                if (item.sender === auth.currentUser?.uid) {
                  Alert.alert(
                    "Delete Message",
                    "Are you sure you want to delete this message?",
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Delete", style: "destructive", onPress: () => deleteMessage(item.id) },
                    ]
                  );
                }
              }}
            >
              <View
                style={[
                  item.sender === auth.currentUser?.uid
                    ? styles.myMessageContainer
                    : styles.otherMessageContainer,
                ]}
              >
                <Text style={item.sender === auth.currentUser?.uid ? styles.myMessage : styles.otherMessage}>
                  {item.text}
                </Text>

                <View style={styles.messageInfo}>
                  {item.sender === auth.currentUser?.uid && (
                    <Text style={[styles.statusText, item.status === "read" ? styles.readText : styles.sentText]}>
                      {item.status}
                    </Text>
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
      <TouchableOpacity>
        <MaterialIcons name="image" size={28} color="#1E90FF" />
      </TouchableOpacity>
      <TouchableOpacity>
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
});


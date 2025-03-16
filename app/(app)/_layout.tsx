import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem, DrawerContentComponentProps } from "@react-navigation/drawer";
import { MaterialIcons } from "@expo/vector-icons";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Home from "./home";
import Groups from "./groups";
import Profile from "./profile";
import Settings from "./settings";
import { signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { useRouter } from "expo-router";


const Drawer = createDrawerNavigator();

export default function AppLayout() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: { backgroundColor: "#FFFFFF", width: 250 }, // Beyaz arka plan
        drawerLabelStyle: { fontSize: 16, color: "#333" },
        drawerActiveTintColor: "#1E90FF", // Mavi vurgu
        drawerInactiveTintColor: "#666",
      }}
    >
      <Drawer.Screen
        name="home"
        component={Home}
        options={{
          title: "Home",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="groups"
        component={Groups}
        options={{
          title: "Groups",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="group" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="profile"
        component={Profile}
        options={{
          title: "Profile",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="settings"
        component={Settings}
        options={{
          title: "Settings",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/(auth)");
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContainer}>
      
      <View style={styles.header}>
        <MaterialIcons name="chat" size={40} color="#1E90FF" />
      </View>
      <View style={styles.separator} />
      
      <DrawerItemList {...props} />

      <View style={styles.logoutContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="white" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
  },
  header: {
    alignItems: "center",
    paddingVertical: 20,
  },
  separator: {
    height: 1,
    backgroundColor: "#DDD",
    marginHorizontal: 20,
    marginBottom: 20,
  },
  drawerLabel: {
    fontSize: 16,
    color: "#333",
  },
  logoutContainer: {
    marginTop: "auto",
    padding: 20,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF3B30",
    padding: 15,
    borderRadius: 10,
    justifyContent: "center",
  },
  logoutText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
});

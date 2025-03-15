import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {

  apiKey: "AIzaSyB-Ain4vIrfI-uVeCGDnGQp-9PoelbotQw",

  authDomain: "chatapp-reactnative-ecc5e.firebaseapp.com",

  projectId: "chatapp-reactnative-ecc5e",

  storageBucket: "chatapp-reactnative-ecc5e.firebasestorage.app",

  messagingSenderId: "411033495623",

  appId: "1:411033495623:web:ac67e4e62b9ee18953a962",

  measurementId: "G-D958V7VZPX"

};


const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);
const storage = getStorage(app);
export { auth, db, storage };
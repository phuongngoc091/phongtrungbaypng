import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA4u-vUbM0RG_FhiM6LOsSykAAj3JR6X8A",
  authDomain: "app-trung-bay.firebaseapp.com",
  projectId: "app-trung-bay",
  storageBucket: "app-trung-bay.firebasestorage.app",
  messagingSenderId: "219676420875",
  appId: "1:219676420875:web:9b98654bee083faa04100e",
  databaseURL: "https://app-trung-bay-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const rtdb = getDatabase(app);

// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase Web Config (jipup-f211b 프로젝트)
const firebaseConfig = {
  apiKey: "AIzaSyBuSIb90zt2afWwYFpJYKsfZEiFZvzyHD0",
  authDomain: "jipup-f211b.firebaseapp.com",
  projectId: "jipup-f211b",
  storageBucket: "jipup-f211b.firebasestorage.app",
  messagingSenderId: "19543738748",
  appId: "1:19543738748:web:53f16cb5165756df5f7cf9",
  measurementId: "G-9422BHL4ER",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Auth instance (🔥 이거만 export하면 됨)
export const auth = getAuth(app);

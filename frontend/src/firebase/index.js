// src/firebase/index.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBuSIb90zt2afWwYFpJYKsfZEiFZvzyHD0",
  authDomain: "jipup-f211b.firebaseapp.com",
  projectId: "jipup-f211b",
  storageBucket: "jipup-f211b.appspot.com",   // 🔥 수정됨
  messagingSenderId: "19543738748",
  appId: "1:19543738748:web:53f16cb5165756df5f7cf9",
  measurementId: "G-9422BHL4ER"
}

// Initialize
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;

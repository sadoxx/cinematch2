// ============================================
// FIREBASE CONFIGURATION
// ============================================

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Our Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyCpHtoGVMxKUJEKBvChve0sAWR9sGYPK6s",
  authDomain: "cinematch-c02c1.firebaseapp.com",
  projectId: "cinematch-c02c1",
  storageBucket: "cinematch-c02c1.firebasestorage.app",
  messagingSenderId: "232811548864",
  appId: "1:232811548864:web:dd91a7fffe1f795b5b1d25",
  measurementId: "G-9C4PJS31RQ"
};

// Connect to Firebase
const app = initializeApp(firebaseConfig);

// Connect to our database
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;

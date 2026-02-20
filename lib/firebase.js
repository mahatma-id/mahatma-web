import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC1cZ1Rui7xUo125VhuVEZ1oIqj0DSWGPk",
  authDomain: "mahatmaid.firebaseapp.com",
  projectId: "mahatmaid",
  storageBucket: "mahatmaid.firebasestorage.app",
  messagingSenderId: "853601666171",
  appId: "1:853601666171:web:372227251832aef05d4ede",
  measurementId: "G-12K45HRN7S"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
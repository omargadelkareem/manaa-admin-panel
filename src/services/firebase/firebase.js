import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDYDjEgh_3uP4CP9lB-4AxTWMd93kp1eBE",
  authDomain: "manaa-hr-system.firebaseapp.com",
  databaseURL: "https://manaa-hr-system-default-rtdb.firebaseio.com",
  projectId: "manaa-hr-system",
  storageBucket: "manaa-hr-system.firebasestorage.app",
  messagingSenderId: "158091803534",
  appId: "1:158091803534:web:2920c103b8f0ecc06d02df",
};

const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);

export default app;

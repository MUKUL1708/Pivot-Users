// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBfcUdX6thAZ-RBiDJCXOcjOq27Z3Cet4I",
  authDomain: "fir-mart-e9e21.firebaseapp.com",
  projectId: "fir-mart-e9e21",
  storageBucket: "fir-mart-e9e21.firebasestorage.app",
  messagingSenderId: "58204415374",
  appId: "1:58204415374:web:613ee6291af1a6b34330df",
  measurementId: "G-2CQ2G7TPPR"
};

// Initialize Firebase
console.log('🔥 Initializing Firebase with config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  storageBucket: firebaseConfig.storageBucket
});

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

console.log('✅ Firebase initialized successfully');
console.log('📊 Analytics:', analytics ? 'Enabled' : 'Disabled');
console.log('🗄️ Firestore:', db ? 'Connected' : 'Not connected');

export { app, analytics, db };

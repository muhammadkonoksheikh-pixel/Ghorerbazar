// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
// আমরা getFirestore এর বদলে initializeFirestore ইমপোর্ট করব
import { initializeFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBzU4nQPDZ7ycffqFvKZoZX4cgkszlr6uM",
    authDomain: "ghorer-bazar-95872.firebaseapp.com",
    databaseURL: "https://ghorer-bazar-95872-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "ghorer-bazar-95872",
    storageBucket: "ghorer-bazar-95872.firebasestorage.app",
    messagingSenderId: "587544797274",
    appId: "1:587544797274:web:95c707fb2ec3cff0db7863"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// বাংলাদেশের মোবাইল ও ব্রডব্যান্ড নেটওয়ার্ক ব্লকিং এড়াতে Long Polling ফোর্স করা হলো
const db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true
});

const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };

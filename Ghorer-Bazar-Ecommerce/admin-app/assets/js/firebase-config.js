import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBzU4nQPDZ7ycffqFvKZoZX4cgkszlr6uM",
    authDomain: "ghorer-bazar-95872.firebaseapp.com",
    databaseURL: "https://ghorer-bazar-95872-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "ghorer-bazar-95872",
    storageBucket: "ghorer-bazar-95872.firebasestorage.app",
    messagingSenderId: "587544797274",
    appId: "1:587544797274:web:95c707fb2ec3cff0db7863"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
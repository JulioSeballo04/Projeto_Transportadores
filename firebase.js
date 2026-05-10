// ── Firebase Config ──
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDJR3aWnDet0JUjMdYCcxaH9AcNTjUs4PI",
  authDomain: "balofinho-transportadores.firebaseapp.com",
  projectId: "balofinho-transportadores",
  storageBucket: "balofinho-transportadores.firebasestorage.app",
  messagingSenderId: "890397970934",
  appId: "1:890397970934:web:c0377a35d992559396f7d7"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const auth = getAuth(app);

export { db, auth, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged };

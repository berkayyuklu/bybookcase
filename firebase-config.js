import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "SENIN_API_KEYIN",
    authDomain: "PROJE_ADIN.firebaseapp.com",
    projectId: "PROJE_ADIN",
    storageBucket: "PROJE_ADIN.appspot.com",
    messagingSenderId: "ID_NUMARAN",
    appId: "APP_ID_NUMARAN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();
export { signInWithPopup, collection, addDoc, query, getDocs };

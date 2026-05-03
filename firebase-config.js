// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDfm1ANzzvyZGFiAksYlOzkzvbqg8KJnCU",
  authDomain: "mybookcase-a277f.firebaseapp.com",
  projectId: "mybookcase-a277f",
  storageBucket: "mybookcase-a277f.firebasestorage.app",
  messagingSenderId: "313022286313",
  appId: "1:313022286313:web:eb1eff757e42cca70e6378",
  measurementId: "G-WTR8J98FW2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

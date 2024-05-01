// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes } from "firebase/storage";
import { getFirestore, collection, addDoc } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyBukdTdi8A-hAR8Bp4X-r_FD3UwX50evJk",
  authDomain: "biryani-agbiryani.firebaseapp.com",
  projectId: "biryani-agbiryani",
  storageBucket: "biryani-agbiryani.appspot.com",
  messagingSenderId: "1059775110087",
  appId: "1:1059775110087:web:a72e3cebf73eb0ba0957e2",
  measurementId: "G-T9JQCELT3L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const storage = getStorage()
const db = getFirestore(app)

export default {
    app,
    storage,
    db
}
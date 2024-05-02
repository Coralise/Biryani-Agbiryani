// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
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

async function getDishes(options = {}) {
  let dishesColl = collection(db, "dishes")
  let docs
  if (Object.keys(options).length == 0) {
    docs = await getDocs(dishesColl)
  } else {
    docs = await getDocs(query(dishesColl, where("Category", "==", options.category)))
  }
  return docs.docs.map(e => {return {...e.data(), DocID: e.id}})
}

async function getImageUrl(path) {
  let url = await getDownloadURL(ref(storage, path))
  return url
}

export default {
    app,
    storage,
    db,
    getDishes,
    getImageUrl
}
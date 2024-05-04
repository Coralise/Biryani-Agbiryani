// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { getFirestore, collection, getDoc, doc, getDocs, query, where, setDoc } from "firebase/firestore";
import { browserLocalPersistence, createUserWithEmailAndPassword, getAuth, setPersistence, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
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
const auth = getAuth(app)

setPersistence(auth, browserLocalPersistence)

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

async function getCartDishes(cart) {
  let dishesPromises = Object.keys(cart).map(id => getDoc(doc(db, "dishes", id)))
  let dishes = (await Promise.all(dishesPromises)).map(e => { return {...e.data(), Count: cart[e.id], DocID: e.id} })
  return dishes
}

async function getImageUrl(path) {
  let url = await getDownloadURL(ref(storage, path))
  return url
}

async function checkVoucherCode(code) {
  code = code.toUpperCase()
  let codeDetails = await getDoc(doc(db, "vouchers", code))
  return codeDetails.data() !== undefined && codeDetails.data().RemainingUses > 0 ? codeDetails.data() : undefined
}

async function validateVouchers(usedVouchers) {
  let promisedVouchers = Object.keys(usedVouchers).map(voucher => getDoc(doc(db, "vouchers", voucher)))
  let vouchers = (await Promise.all(promisedVouchers)).map(e => { return {...e.data(), Code: e.id} })
  let invalidVouchers = []
  for (let voucher of vouchers) if (voucher.RemainingUses <= 0) invalidVouchers.push(voucher.Code)
  return invalidVouchers
}

function getUser() {
  return auth.currentUser
}

async function login(email, pass) {
  try {
    let userCreds = await signInWithEmailAndPassword(auth, email, pass)
    let userDetails = await getDoc(doc(db, "users", email))
    return {...userCreds, details: userDetails.data()}
  } catch (e) {
    return undefined
  }
}

async function signup(email, pass, nickname) {
  try {
    let userCreds = await createUserWithEmailAndPassword(auth, email, pass)

    await updateProfile(userCreds.user, {
      displayName: nickname
    })

    await setDoc(doc(db, "users", email), {
      Admin: false
    })

    let userDetails = await getDoc(doc(db, "users", email))
    return {...userCreds, details: userDetails.data()}
  } catch (e) {
    return undefined
  }
}

async function logout() {
  signOut(auth).then(() => {
    return true
  }).catch(e => {
    return false
  })
}

export default {
    app,
    storage,
    db,
    getDishes,
    getCartDishes,
    getImageUrl,
    checkVoucherCode,
    validateVouchers,
    getUser,
    login,
    signup,
    logout
}
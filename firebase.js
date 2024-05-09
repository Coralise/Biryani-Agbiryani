// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { getFirestore, collection, getDoc, doc, getDocs, query, where, setDoc, updateDoc } from "firebase/firestore";
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

async function useVoucher(voucher) {
  let details = (await getDoc(doc(db, "vouchers", voucher))).data()
  await updateDoc(doc(db, "vouchers", voucher), {RemainingUses: parseFloat(details.RemainingUses) - 1})
}

async function useVouchers(usedVouchers) {
  let promises = []
  for (let voucher of Object.keys(usedVouchers)) {
    promises.push(useVoucher(voucher))
  }
  await Promise.all(promises)
}

function getUser() {
  return auth.currentUser
}

async function login(email, pass) {
  try {
    let userCreds = await signInWithEmailAndPassword(auth, email, pass)
    let userDetails = await getDoc(doc(db, "users", email.toLowerCase()))
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

    await setDoc(doc(db, "users", email.toLowerCase()), {
      Admin: false
    })

    let userDetails = await getDoc(doc(db, "users", email.toLowerCase()))
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

async function checkOut(currentDishes, usedVouchers, deliveryFee) {
  await setDoc(doc(db, `users/${auth.currentUser.email}/history/${Date.now().toString()}`), {
    Dishes: currentDishes,
    UsedVouchers: usedVouchers,
    DeliveryFee: deliveryFee
  })
}

async function addPurchase(dishes) {
  let promises = []
  for (let dish of dishes) {
    promises.push((async () => {
      let details = (await getDoc(doc(db, "dishes", dish.DocID))).data()
      await updateDoc(doc(db, "dishes", dish.DocID), {
        Purchases: parseFloat(details.Purchases) + parseFloat(dish.Count)
      })
    })())
  }
  await Promise.all(promises)
}

async function getOrderHistory(email) {
  const historyColl = collection(db, `users/${email}/history`)
  const docsRef = await getDocs(historyColl)
  const history = docsRef.docs.map(d => { return {...d.data(), Date: d.id, Email: email} })

  let parsedHistory =  []
  for (let date of Object.keys(history)) {
    let historyEntry = history[date]
    let dishes = historyEntry.Dishes
    const prices = dishes.map(dish => parseFloat(dish.Price) * parseFloat(dish.Count))
    let subtotal = 0
    for (let price of prices) subtotal += price
    let totalDiscount = 0
    let vouchers = historyEntry.UsedVouchers
    for (let key of Object.keys(vouchers)) {
      let voucher = vouchers[key]
      if (voucher.DiscountType == "Amount") {
        totalDiscount += parseFloat(voucher.Discount)
      } else {
        totalDiscount += Math.min(subtotal * (parseFloat(voucher.Discount)/100), parseFloat(voucher.MaximumDiscount) || Number.MAX_SAFE_INTEGER)
      }
    }
    let total = subtotal + parseFloat(historyEntry.DeliveryFee) - totalDiscount

    parsedHistory.push({...historyEntry, Subtotal: subtotal, TotalDiscount: totalDiscount, Total: total, FormattedDate: getFormattedDate(parseInt(historyEntry.Date))})
  }
  return parsedHistory
}

async function getAllOrderHistory() {
  const usersColl = collection(db, "users")
  const docsRef = await getDocs(usersColl)
  const users = docsRef.docs.map(d => d.id)
  let promises = []
  for (let user of users) {
    promises.push(getOrderHistory(user))
  }
  let orderHistory = await Promise.all(promises)
  let combinedHistories = []
  for (let history of orderHistory) combinedHistories.push(...history)
  combinedHistories = combinedHistories.sort((a, b) => parseInt(a.Date) - parseInt(b.Date))
  return combinedHistories
}

function getFormattedDate(unix) {
  let date = new Date(unix)
  let year = date.getFullYear()
  let month = date.toLocaleString("default", {month: "long"})
  let day = date.getDate()
  let hours = date.getHours()
  let ampm = hours >= 12 ? "PM" : "AM"
  hours %= 12
  hours = hours || 12
  let minutes = (date.getMinutes().toString().length < 2 ? "0" : "") + date.getMinutes()
  
  return `${month} ${day}, ${year} - ${hours}:${minutes} ${ampm}`
}

async function isAdmin() {
  if (getUser() === null) return false
  let userDoc = await getDoc(doc(db, `users`, getUser().email))
  return userDoc.data().Admin
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
    logout,
    useVouchers,
    checkOut,
    addPurchase,
    getOrderHistory,
    getAllOrderHistory,
    isAdmin
}
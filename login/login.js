import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore"
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { showSplash } from "../loading/splash.js"; 

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDeRGnfXe_1TdsPfOnb164JKrrrNK4Z8Gc",
  authDomain: "lineless-37f9f.firebaseapp.com",
  projectId: "lineless-37f9f",
  storageBucket: "lineless-37f9f.firebasestorage.app",
  messagingSenderId: "331276738497",
  appId: "1:331276738497:web:a124daaacafcdade88d940",
  measurementId: "G-PCR6QBJZJJ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const  db = getFirestore(app);

async function redirectByRole(user) {
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists()) {
    console.warn("User document does not exist");
   return;
  }

  const userdata = userDoc.data();
  const role = userdata.role || "citizen";

  sessionStorage.setItem("userName", userdata.name || user.email);
  sessionStorage.setItem("isAdmin", role === "admin");

  if (role === "admin") {
    window.location.href = "../admin.html";
  } else {
    window.location.href = "../citizen.html";
  }
}
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const msg = document.getElementById("login-message");

  msg.textContent = "";
  
  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const user = userCred.user;

    // Show splash with welcome
    showSplash(`Welcome back, ${user.displayName || "User"}!`, () => {
      redirectByRole(user);
    });

  } catch (err) {
    msg.textContent = err.message;
    msg.style.color = "red";
  }
});
onAuthStateChanged(auth, (user) => {
  if (user) redirectByRole(user);
});
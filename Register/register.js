import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { showSplash } from "/loading/splash.js";

// Firebase
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
const db = getFirestore(app);

// Hash function making it hard to guess. Most important for security
async function hashID(id) {
  const data = new TextEncoder().encode(id);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const idCard = document.getElementById("idCard").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCred.user;

    await updateProfile(user, { displayName: name });
    const idHash = await hashID(idCard);

    await setDoc(doc(db, "users", user.uid), {
      name,
      email,
      idHash,
      createdAt: new Date(),
      role: "citizen"
    });

    showSplash(`Welcome ${name}!`, () => {
      window.location.href = "../login/login.html";
    });

  } catch (err) {
    alert("Error: " + err.message);
  }
});

document.getElementById("year").textContent = new Date().getFullYear();


// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

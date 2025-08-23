import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { showSplash } from "../loading/splash.js";

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

// Hash function
async function hashID(id) {
  const data = new TextEncoder().encode(id);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,"0")).join("");
}

// Form
document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const idCard = document.getElementById("idCard").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const msg = document.getElementById("register-message");

  if(password !== confirmPassword) {
    msg.textContent = "Passwords do not match.";
    msg.style.color = "red";
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
      idNumber: idHash, // safer to store hash instead of raw ID
      createdAt: serverTimestamp(),
      role: "citizen"
    });

    showSplash(`Welcome ${name}!`, () => {
      window.location.href = "../login.html";
    });

  } catch(err) {
    msg.textContent = err.message;
    msg.style.color = "red";
  }
});

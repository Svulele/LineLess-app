import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { showSplash } from "../loading/splash.js"; // Make sure this path is correct

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

// Form submit
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
      // Redirect after splash
      window.location.href = "../dashboard/dashboard.html"; // change to your dashboard/home page
    });

  } catch (err) {
    msg.textContent = err.message;
    msg.style.color = "red";
  }
});

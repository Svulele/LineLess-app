import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { showSplash } from "/loading/splash.js";

const firebaseConfig = {
  apiKey: "AIzaSyDeRGnfXe_1TdsPfOnb164JKrrrNK4Z8Gc",
  authDomain: "lineless-37f9f.firebaseapp.com",
  projectId: "lineless-37f9f",
  storageBucket: "lineless-37f9f.firebasestorage.app",
  messagingSenderId: "331276738497",
  appId: "1:331276738497:web:a124daaacafcdade88d940",
  measurementId: "G-PCR6QBJZJJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Login form
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const msg = document.getElementById("login-message");


  // Login user with email and password 
  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const user = userCred.user;

    showSplash(`Hello ${user.displayName || email.split("@")[0]}!`, () => {
      if (email.includes("admin")) {
        window.location.href = "../admin.html";
      } else {
        window.location.href = "../citizen.html";
      }
    });

  } catch (err) {
    msg.textContent = "Login failed: " + err.message;
    msg.style.color = "red";
  }
});

document.getElementById("year").textContent = new Date().getFullYear();



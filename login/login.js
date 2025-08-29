import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
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
const db = getFirestore(app);

// Smooth fade-in for page load
window.addEventListener("load", () => {
  document.body.classList.add("loaded");
});

// Redirect user based on role
async function redirectByRole(user) {
  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userdata = userDoc.exists() ? userDoc.data() : { name: user.email, role: "citizen" };
    const role = userdata.role || "citizen";

    sessionStorage.setItem("userName", userdata.name || user.email);
    sessionStorage.setItem("isAdmin", role === "admin");

    // Hide login form while splash shows
    const authContainer = document.querySelector(".auth-container");
    if (authContainer) {
      authContainer.style.transition = "opacity 0.3s ease";
      authContainer.style.opacity = 0;
    }

    // Show splash
    showSplash(`Welcome back, ${userdata.name || "User"}!`, {
      tagline: role === "admin" ? "Loading admin dashboard..." : "Loading citizen portal...",
      duration: 1000,
      onComplete: () => {
        if (role === "admin") window.location.href = "../admin.html";
        else window.location.href = "../citizen.html";
      }
    });

  } catch (err) {
    console.error("Error redirecting by role:", err);
    window.location.href = "../citizen.html";
  }
}

// Login form submission
const loginForm = document.getElementById("login-form");
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const msg = document.getElementById("login-message");
  msg.textContent = "";

  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const user = userCred.user;

   
    redirectByRole(user);
  } catch (err) {
    msg.textContent = err.message;
    msg.style.color = "red";
  }
});

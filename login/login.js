import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

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

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("login-message");

  try {
    await signInWithEmailAndPassword(auth, email, password);
    msg.textContent = ` Hello ${email.split("@")[0]}! Redirecting...`;
    msg.style.color = "green";

    setTimeout(() => {
      if (email.includes("admin")) {
        window.location.href = "../admin.html";
      } else {
        window.location.href = "../citizen.html";
      }
    }, 1200);

  } catch (err) {
    msg.textContent = "Login failed: " + err.message;
    msg.style.color = "red";
  }
});

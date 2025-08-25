import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { showSplash } from "/loading/splash.js";

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
const db = getFirestore(app);

document.getElementById("contact-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const name = document.getElementById("contact-name").value.trim();
  const email = document.getElementById("contact-email").value.trim();
  const message = document.getElementById("contact-message").value.trim();
  const feedback = document.getElementById("contact-feedback");

  try {
    await addDoc(collection(db, "contactMessages"), {
      name,
      email,
      message,
      createdAt: serverTimestamp()
    });

    showSplash("Message Sent!", () => {
      document.getElementById("contact-form").reset();
    });

  } catch (err) {
    feedback.textContent = "Failed to send message: " + err.message;
    feedback.style.color = "red";
  }
});

document.getElementById("year").textContent = new Date().getFullYear();

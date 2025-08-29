/*
 * LineLess – Your Queue Management App
 * Copyright (c) 2025 Sbulele Landa
 * Licensed under the MIT License
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAuth, updateProfile, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { showSplash } from "../loading/splash.js";

document.addEventListener("DOMContentLoaded", () => {

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

  async function hashID(id) {
    const data = new TextEncoder().encode(id);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  }

  const form = document.getElementById("register-form");
  if (!form) return console.error("Register form not found!");

  const card = document.querySelector(".register-container");

  
  const overlay = document.createElement("div");
  overlay.classList.add("fade-overlay");
  document.body.appendChild(overlay);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const idCard = document.getElementById("idCard").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const msg = document.getElementById("register-message");
    msg.textContent = "";

    if (password !== confirmPassword) {
      msg.textContent = "Passwords do not match.";
      msg.style.color = "red";
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      await updateProfile(user, { displayName: name });
      const idHash = await hashID(idCard);

      
      overlay.classList.add("active");
      if (card) {
        card.style.transition = "transform 0.4s ease, opacity 0.4s ease";
        card.style.opacity = "0.3";   
        card.style.transform = "scale(0.95)"; 
      }

    
        showSplash(`Hello, ${name}!`, {
          tagline: "Welcome to LineLess!",
          duration: 800,
          onComplete: async () => {
            try {
              
              await setDoc(doc(db, "users", user.uid), {
                name,
                email,
                idHash,
                createdAt: new Date(),
                role: "citizen"
              });
            } catch (err) {
              console.error("Error saving user:", err);
            } finally {
              
              overlay.classList.remove("active");
              const splash = document.getElementById("splash");
              if (splash) splash.classList.add("fade-out");
          
              setTimeout(() => {
                window.location.href = "../login/login.html";
              }, 200); ;
            }
          }
        });
     

    } catch (err) {
      
      msg.textContent = err.message;
      msg.style.color = "red";
      overlay.classList.remove("active");
      if (card) {
        card.style.opacity = "1";
        card.style.transform = "scale(1)";
      }
    }
  });
});

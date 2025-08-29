import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";
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
const db = getFirestore(app);

// EmailJS config
const emailjsServiceID = "service_8ssvwj8";
const emailjsTemplateID = "template_n43kc2l";

const form = document.getElementById("contact-form");
const feedback = document.getElementById("contact-feedback");

// Form submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("contact-name").value.trim();
  const email = document.getElementById("contact-email").value.trim();
  const message = document.getElementById("contact-message").value.trim();

  if (!name || !email || !message) {
    feedback.textContent = "Please fill in all fields.";
    feedback.style.color = "red";
    return;
  }

  try {
    //  Save to Firebase
    await addDoc(collection(db, "contactMessages"), {
      name,
      email,
      message,
      createdAt: serverTimestamp()
    });

    //  Send via EmailJS (using global object)
    await emailjs.send(emailjsServiceID, emailjsTemplateID, {
      from_name: name,
      from_email: email,
      message
    });

    document.body.classList.add("splash-active");
    const authContainer = document.querySelector(".auth-container");
    if (authContainer) authContainer.style.opacity = 0;

    showSplash("Message Sent!", {
      tagline: "We'll get back to you shortly.",
      duration: 2000,
      onComplete: () => {
        form.reset();
        feedback.textContent = "";
        if (authContainer) authContainer.style.opacity = 1;
        document.body.classList.remove("splash-active");
      }
    });

  } catch (err) {
    feedback.textContent = "Failed to send message: " + (err.text || err.message);
    feedback.style.color = "red";
    console.error(err);
  }
});

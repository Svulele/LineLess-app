import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, query, orderBy, onSnapshot, doc, deleteDoc,  serverTimestamp, getDoc, getDocs, setDoc, addDoc
} from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";

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
const auth = getAuth(app);

async function renderAdminQueue() {
  const queueRef = collection(db, "queue");
  const querySnapshot = await getDocs(queueRef);

  const queueArray = [];
  querySnapshot.forEach((docSnap) => {
    queueArray.push({ docId: docSnap.id, ...docSnap.data() });
  });

  queueArray.sort((a, b) => a.createdAt?.toMillis() - b.createdAt?.toMillis());

  const queueList = document.getElementById("admin-queue-list");
  if (!queueList) return;
  queueList.innerHTML = "";
  
  queueArray.forEach((ticket, idx) => {
    const li = document.createElement("li");
    li.classList.add("ticket-item");

    li.innerHTML = `
    <div class="ticket-card">
    <div class="ticket-header">
    <span class="ticket-name">${ticket.name}</span>
    <span class="ticket-position">Position: ${idx + 1} of ${queueArray.length}</span>
  </div>
  <div class="ticket-actions">
    <button class="serve-btn" data-id="${ticket.docId}">Serve</button>
    <button class="remove-btn" data-id="${ticket.docId}">Remove</button>
  </div>
 
  <div class="stepper">
    ${renderStepper(idx + 1, queueArray.length)}
  </div>
</div>
`;

li.querySelector(".serve-btn").addEventListener("click", async () => {
  const historyRef = collection(db, "history");
  await addDoc(historyRef, {
    ...ticket,
    servedAt: serverTimestamp() });
  await deleteDoc(doc(db, "queue", ticket.docId));
  renderAdminQueue();
  renderHistory();
});

async function toggleServiceOpen(serviceId, isOpen) {
  const serviceRef = doc(db, "services", serviceId);
  await setDoc(serviceRef, { open: isOpen }, { merge: true });
}

li.querySelector(".remove-btn").addEventListener("click", async () => {
  await deleteDoc(doc(db, "queue", ticket.docId));
  renderAdminQueue();
});

queueList.appendChild(li);
});
}


function renderStepper(current, total) {
let steps = "";
for (let i = 1; i <= total; i++) {
steps += `
  <span class="step ${i === current ? "active" : ""}">${i}</span>
`;
}
return `<div class="stepper-container">${steps}</div>`;
}


renderAdminQueue();


const serviceList = document.getElementById("admin-service-list");
const detailsContent = document.getElementById("admin-details-content");
const detailsTitle = document.getElementById("admin-details-title");
// Logout
document.getElementById("logout-btn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "./login/login.html";
});

let activeService = null;
let unsubQueue = null;


async function renderHistory() {
  const historyRef = collection(db, "history"); 
  const snapshot = await getDocs(historyRef);
  const list = document.getElementById("history-list"); 
  list.innerHTML = ""; 
  snapshot.forEach(docSnap => {
    const ticket = docSnap.data();
    const li = document.createElement("li");
    li.textContent = `${ticket.name || "Unnamed"} – ${ticket.ticketNumber || "N/A"} – Served At: ${ticket.servedAt?.toDate?.() || "N/A"}`;
    li.style.color = "green"; 
    list.appendChild(li);
  });
}

async function loadServices() {
  const snapshot = await getDocs(collection(db, "services"));
  serviceList.innerHTML = "";
  snapshot.forEach((docSnap) => {
    const serviceName = docSnap.id;
    const btn = document.createElement("button");
    btn.className = "item";
    btn.textContent = serviceName;
    btn.dataset.service = serviceName;
    serviceList.appendChild(btn);
  });
}
// Load queue for a service
function loadQueue(service) {
  activeService = service;
  const detailsTitle = document.getElementById("admin-details-title");
  const detailsContent = document.getElementById("admin-details-content");
  detailsTitle.textContent = `Manage Queue – ${service}`;
  detailsContent.innerHTML = '<p class="muted">Loading queue...</p>';

  if (unsubQueue) unsubQueue();

  const q = query(collection(db, `services/${service}/queue`), orderBy("createdAt"));
  
  unsubQueue = onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      detailsContent.innerHTML = '<p>No one in queue.</p>';
      return;
    }
    let html ='<ul class="queue-list">';
    
    const queueArray = [];
    snapshot.forEach((docSnap) => {
      const ticket = docSnap.data();
      const masked = ticket.idHash ? "****" + ticket.idHash.slice(-4) : "N/A";
      queueArray.push({ docId: docSnap.id, ...ticket, masked });
    });

      queueArray.forEach((ticket, idx) => {
      html += `
        <li>
         <strong>${ticket.name || "Unnamed"}</strong> – ${ticket.ticketNumber || "N/A"} - ID: ${ticket.idNumber || ticket.masked}
         <div style="margin-top:6px; display:flex; gap:8px;">
         ${idx === 0 ? `<button class="btn serve-btn" data-id="${ticket.docId}">Serve Next</button>` : ""}
         <button class="btn secondary remove-btn" data-id="${ticket.docId}">Remove</button>
         <span style="margin-left:8px;">Position: ${idx + 1} of ${queueArray.length}</span>
         </div>
        </li>
        `;
    });

    html += "</ul>";
    detailsContent.innerHTML = html;
  });
}

// Serve / Remove
detailsContent.addEventListener("click", async (e) => {
  if (e.target.classList.contains("serve-btn")) {
    const id = e.target.dataset.id;

    try {
      const ticketRef = doc(db, `services/${activeService}/queue`, id);
      const ticketSnap = await getDoc(ticketRef);
     
        // move to histroy 
        await setDoc(doc(db, `services/${activeService}/history`, id), {
          ...ticketSnap.data(),
        servedAt: serverTimestamp(),
        });

        await deleteDoc(ticketRef);
       } catch (err) {
        alert("Error serving: " + err.message);
      }
}

 if (e.target.classList.contains("remove-btn")) {
    const id = e.target.dataset.id;

    try {
      await deleteDoc(doc(db, `services/${activeService}/queue`, id));
    } catch (err) {
      alert("Error removing: " + err.message);
    }
  }
});

// Attach click
serviceList.addEventListener("click", (e) => {
  if (e.target.closest("button.item")) {
    const service = e.target.closest("button.item").dataset.service;
    loadQueue(service);
  }
});

loadServices();
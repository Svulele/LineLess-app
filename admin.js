import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, query, orderBy, onSnapshot, doc, deleteDoc,  serverTimestamp, getDoc, getDocs, setDoc, addDoc, updateDoc, where
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
function showAdminMessage(message, type = "error") {
  const msgBox = document.getElementById("admin-message");
  if (!msgBox) return;

  msgBox.textContent = message;
  msgBox.className = `admin-message ${type}`;
  msgBox.classList.remove("hidden");

  // Auto-hide after 4s
  setTimeout(() => {
    msgBox.classList.add("hidden");
  }, 4000);
}



async function renderAdminQueue() {
  const queueRef = collection(db, "queue");
  const querySnapshot = await getDocs(queueRef);

 tickets = [];
  querySnapshot.forEach((docSnap) => {
    tickets.push({ docId: docSnap.id, ...docSnap.data() });
  });

  tickets.sort((a, b) => a.createdAt?.toMillis() - b.createdAt?.toMillis());

  const queueList = document.getElementById("ticket-list");
  
  if (!queueList) return;
  queueList.innerHTML = "";
  
  tickets.forEach((ticket, idx) => {
    const li = document.createElement("li");
    li.classList.add("ticket-item");

    li.innerHTML = `
    <div class="ticket-card">
    <div class="ticket-header">
    <span class="ticket-name">${ticket.name}</span>
    <span class="ticket-position">Position: ${idx + 1} of ${tickets.length}</span>
  </div>
  <div class="ticket-actions">
    <button class="serve-btn" data-id="${ticket.docId}">Serve</button>
    <button class="remove-btn" data-id="${ticket.docId}">Remove</button>
  </div>
 
  <div class="stepper">
    ${renderStepper(idx + 1, tickets.length)}
  </div>
</div>
`;

li.querySelector(".serve-btn").addEventListener("click", async () => {
  const historyRef = collection(db, "history");
  await addDoc(historyRef, { ...ticket, servedAt: serverTimestamp() });
  await deleteDoc(doc(db, "queue", ticket.docId));
  renderAdminQueue();
  renderHistory();
});
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

const searchInput = document.getElementById("searchInput");
async function searchTickets(searchValue) {
  ticketList.innerHTML = "Searching...";

  try {
    const ticketsRef = collection(db, "tickets");
    // query by ticket ID (assuming you have a "ticketId" field in Firestore)
    const q = query(ticketsRef, where("ticketId", "==", searchValue));
    const querySnapshot = await getDocs(q);

    ticketList.innerHTML = ""; // clear results

    if (querySnapshot.empty) {
      ticketList.innerHTML = "No tickets found.";
    } else {
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const ticketDiv = document.createElement("div");
        ticketDiv.textContent = `Ticket ${data.ticketId} - ${data.service}`;
        ticketList.appendChild(ticketDiv);
      });
    }
  } catch (error) {
    console.error("Error searching tickets:", error);
    ticketList.innerHTML = "Error while searching.";
  }
}

// Listen to typing (Enter key)
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const value = searchInput.value.trim();
    if (value) {
      searchTickets(value);
    }
  }
});

const ticketList = document.getElementById("ticket-list");
onSnapshot(collection(db, "tickets"), (snapshot) => {
  ticketList.innerHTML = ""; // clear
  snapshot.forEach((doc) => {
    const ticket = doc.data();
    const div = document.createElement("div");
    div.textContent = `${ticket.code} - ${ticket.status}`;
    div.classList.add("ticket-item");
    ticketList.appendChild(div);
  });
});
const detailsContent = document.getElementById("admin-details-content");
const detailsTitle = document.getElementById("admin-details-title"); 
const serviceList = document.getElementById("admin-service-list");

// Logout
document.getElementById("logout-btn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "/login/login.html";
});

let tickets = [];
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

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("ticket-search");

  
  if(searchInput) {
    searchInput.addEventListener("input", e => renderTickets(e.target.value));
    searchInput.addEventListener("keydown", e => {
     
      if (e.key === "Enter") {
        e.preventDefault();
        renderTickets(searchInput.value);
      }
    });
  }
});
// Load queue for a service
function loadQueue(service) {
  activeService = service;
  detailsTitle.textContent = `Manage Queue – ${service}`;
  detailsContent.innerHTML = '<p class="muted">Loading queue...</p>';

  if (unsubQueue) unsubQueue();

  const q = query(collection(db, `services/${service}/queue`), orderBy("createdAt"));
  
  unsubQueue = onSnapshot(q, (snapshot) => {
    tickets = [];
    if (snapshot.empty) {
      detailsContent.innerHTML = '<p>No one in queue.</p>';
    } else {
      snapshot.forEach((docSnap) => {
        const ticket = docSnap.data();
        const masked = ticket.idNumber ? "****" + ticket.idNumber.slice(-4) : "N/A";
        tickets.push({ docId: docSnap.id, ...ticket, masked });
    });
  }
  renderQueueHTML();
  });
}
function renderTickets(filter = "") {
  const wrap = document.getElementById("ticket-list");
  if (!wrap) return;
  wrap.innerHTML = "";


  if (!tickets || tickets.length === 0) {
    wrap.innerHTML = '<p class="muted">No tickets found.</p>'; 
   return;
}

const search = filter.toLowerCase();
const filteredTickets = tickets.filter(t =>
  (t.idNumber || "").toLowerCase().includes(search) ||
  (t.ticketNumber || "").toLowerCase().includes(search) ||
  (t.name || "").toLowerCase().includes(search)
);

if (filteredTickets.length === 0) {
  wrap.innerHTML = "<li>No matches.</li>";
  return;
}

filteredTickets.forEach((t, idx) => {
  const div = document.createElement("div");
  div.className = "ticket-item";
  div.innerHTML = `
    <strong>Ticket:</strong> ${t.ticketNumber || "N/A"} <br>
    <strong>ID:</strong> ${t.idNumber || "N/A"} <br>
    <strong>Name:</strong> ${t.name || "Unnamed"} <br>
    <span>Position: ${idx + 1} of ${filteredTickets.length}</span>
  `;
  wrap.appendChild(div);
});
}

async function renderQueueHTML() {
  if (!activeService) return;

  const serviceRef = doc(db, "services", activeService);
  const svcSnap = await getDoc(serviceRef);
  const isOpen = svcSnap.exists() ? svcSnap.data().open !== false : true;

  let html = `
    <div class="queue-header">
      <strong>${activeService}</strong>
      <button class="btn small toggle-btn" data-service="${activeService}">
        ${isOpen ? "Close Service" : "Open Service"}
      </button>
    </div>
    <ul class="queue-list">
  `;

  if (tickets.length === 0) {
    html += `<li><em>No tickets in queue.</em></li>`;
  } else {
    tickets.forEach((ticket, idx) => {
      html += `
        <li>
          <strong>${ticket.name || "Unnamed"}</strong> – ${ticket.ticketNumber || "N/A"} - ID: ${ticket.masked}
          <div style="margin-top:6px; display:flex; gap:8px;">
            ${isOpen && idx === 0 ? `<button class="btn serve-btn" data-id="${ticket.docId}">Serve Next</button>` : ""}
            ${isOpen ? `<button class="btn secondary remove-btn" data-id="${ticket.docId}">Remove</button>` : ""}
            <span style="margin-left:8px;">Position: ${idx + 1} of ${tickets.length}</span>
          </div>
        </li>
      `;
    });
  }

  html += "</ul>";
  detailsContent.innerHTML = html;
}

// Serve / Remove / Toggle
detailsContent.addEventListener("click", async (e) => {
  if (e.target.classList.contains("serve-btn")) {
    const id = e.target.dataset.id;
    try {
      const ticketRef = doc(db, `services/${activeService}/queue`, id);
      const ticketSnap = await getDoc(ticketRef);
      await setDoc(doc(db, `services/${activeService}/history`, id), {
        ...ticketSnap.data(),
        servedAt: serverTimestamp(),
      });
      await deleteDoc(ticketRef);
    } catch (err) {
      showAdminMessage("Error serving: " + err.message, "error");
    }
  }

  if (e.target.classList.contains("remove-btn")) {
    const id = e.target.dataset.id;
    try {
      await deleteDoc(doc(db, `services/${activeService}/queue`, id));
    } catch (err) {
      showAdminMessage("Error removing: " + err.message, "error");
    }
  }

  // Toggle service open/closed
  if (e.target.classList.contains("toggle-btn")) {
    const service = e.target.dataset.service;
    const toggleBtn = e.target; // reference button
    try {
      toggleBtn.disabled = true; // prevent double click
      const svcRef = doc(db, "services", service);
      const svcSnap = await getDoc(svcRef);
      if (!svcSnap.exists()) {
        showAdminMessage("Service not found", "error");
        toggleBtn.disabled = false;
        return;
      }
      const isOpen = svcSnap.data().open !== false;
      await updateDoc(svcRef, { open: !isOpen });

      // Update button text immediately
      toggleBtn.textContent = !isOpen ? "Service Closed" : "Service Open";
    } catch (err) {
      showAdminMessage("Error toggling service: " + err.message, "error");
    } finally {
      toggleBtn.disabled = false;
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
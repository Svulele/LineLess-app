// citizen.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc 
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";





// --- Firebase config ---
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

// --- DOM references ---
const ticketNumberEl = document.getElementById("my-ticket-number");
const etaEl = document.getElementById("my-ticket-eta");
const inlineMsgEl = document.getElementById("inline-message");
const savedTicket = sessionStorage.getItem("myTicket");

// --- Variables ---
let services = [];
let selectedServiceId = null;
let myTicket = savedTicket ? JSON.parse(savedTicket) : null;
const AVG_SERVICE_TIME = 5;

// --- Helper functions ---
const $ = sel => document.querySelector(sel);

const serviceById = id => services.find(s => s.id === id);

function formatETA(minutes) {
  const now = new Date();
  now.setMinutes(now.getMinutes() + minutes);
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function animateNumber(element, start, end, duration = 500) {
  let startTime = null;
  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    element.textContent = Math.floor(start + (end - start) * progress);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function showInlineMessage(msg, type = "info") {
  inlineMsgEl.textContent = msg;
  inlineMsgEl.className = `message ${type}`;
  setTimeout(() => { inlineMsgEl.textContent = ""; }, 5000);
}

function showNextPopup() {
  const popup = document.createElement("div");
  popup.className = "next-popup";
  popup.textContent = "You're next!";
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 4000);
}
function hashID(id) {
  return sha256(id);
}

function etaBadge(queueLength, avgMins = 5) {
  const eta = queueLength * avgMins;
  if(eta < 15) return `<span class="badge green">ETA ~${eta}m</span>`;
  if(eta < 30) return `<span class="badge amber">ETA ~${eta}m</span>`;
  return `<span class="badge red">ETA ~${eta}m</span>`;
}

function debounce(fn, delay = 50) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

const debouncedRender = debounce(() => {
  renderServiceList();
  renderDetails();
  renderMyTicket();
});

// --- Firebase listeners ---
onAuthStateChanged(auth, user => {
  if (user) {
    renderMyTicket();
    listenToServices();
  } else {
    window.location.href = "/login/login.html";
  }
});

// --- Service listeners ---
function listenToServices() {
  const servicesRef = collection(db, "services");
  onSnapshot(servicesRef, snapshot => {
    services = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name || "Unnamed Service",
        open: data.open !== undefined ? data.open : true,
        avgMinsPerPerson: data.avgMinsPerPerson || AVG_SERVICE_TIME,
        queue: []
      };
    });
    debouncedRender();
  });
}

function listenToServiceQueue(serviceId) {
  const svc = serviceById(serviceId);
  if(!svc) return;
  const qRef = query(collection(db, "services", serviceId, "queue"), orderBy("createdAt"));
  onSnapshot(qRef, qSnap => {
    svc.queue = qSnap.docs.map((qd, index) => {
      const data = qd.data();
      return {
        ticketNumber: data.ticketNumber || `#${index+1}`,
        idNumber: data.idNumber || "Unknown",
        id: qd.id,
        createdAt: data.createdAt || null
      };
    }).sort((a,b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    debouncedRender();
  });
}

// --- Queue management ---
async function joinQueueFirestore(svc, hashedID, readableName) {
  try {
    const queueRef = collection(db, "services", svc.id, "queue");
    const docs = await getDocs(queueRef);
    const queueLen = docs.size;
    const newTicketNumber = `${svc.name.slice(0,2).toUpperCase()}${queueLen+1}`;
    const docRef = await addDoc(queueRef, { 
      ticketNumber: newTicketNumber,
      idNumber: readableName,
      hashedID,
      createdAt: serverTimestamp(), 
    });
    myTicket = { 
      serviceId: svc.id, 
      ticketId: docRef.id, 
      ticketNumber: newTicketNumber,
      idNumber: readableName
    };
    $("#queue-status").textContent = `You have joined the queue as ${newTicketNumber}!`;
    sessionStorage.setItem("myTicket", JSON.stringify(myTicket));
    renderMyTicket();
  } catch (err) {
    showInlineMessage(`Error joining queue: ${err.message}`, "error");
  }
}

async function leaveQueue() {
  if (!myTicket) return;
  try {
    const queueRef = collection(db, "services", myTicket.serviceId, "queue");
    await deleteDoc(doc(queueRef, myTicket.ticketId));
    myTicket = null;
    $("#queue-status").textContent = "You left the queue.";
    sessionStorage.removeItem("myTicket");
    renderMyTicket();
  } catch (err) {
    showInlineMessage(`Error leaving queue: ${err.message}`, "error");
  }
}

// --- Rendering ---
function renderServiceList() {
  const wrap = $("#service-list");
  wrap.innerHTML = "";
  services.forEach(s => {
    const qlen = s.queue.length;
    const avgMins = s.avgMinsPerPerson || AVG_SERVICE_TIME;
    const btn = document.createElement("button");
    btn.className = "item";
    btn.innerHTML = `
      <div class="row space">
        <div>${s.name}${etaBadge(qlen, avgMins)}</div>
      </div>
      <div class="meta">${s.open ? "Service Open" : "Service Closed"} • ${qlen} in queue</div>
    `;
    btn.onclick = () => { 
      selectedServiceId = s.id; 
      renderDetails(); 
      listenToServiceQueue(s.id);
    };
    wrap.appendChild(btn);
  });
}

function renderDetails() {
  const svc = selectedServiceId ? serviceById(selectedServiceId) : null;
  const title = $("#details-title");
  const form = $("#queue-form");

  if(svc) {
    title.innerHTML = `Queue details – ${svc.name} ${etaBadge(svc.queue.length, svc.avgMinsPerPerson)}`;
    form.style.display = "block";
  } else {
    title.textContent = "Queue details";
    form.style.display = "none";
  }

  form.onsubmit = async e => {
    e.preventDefault();
    const idNumber = $("#idCard").value.trim();
    if(idNumber && svc) {
      const hashedID = await hashID(idNumber);
      joinQueueFirestore(svc, hashedID, idNumber);
    }
    $("#idCard").value = "";
  };
}

function renderMyTicket() {
  const wrap = $("#my-ticket");
  if(!myTicket){ 
    wrap.textContent = "You haven’t joined a queue yet.";
    ticketNumberEl.textContent = "0";
    etaEl.textContent = "--:--"; 
    return; 
  }

  const svc = serviceById(myTicket.serviceId);
  if(!svc){ wrap.textContent = "Service not found."; return; }

  const queue = svc.queue.filter(t => t.id);
  const position = queue.findIndex(p => p.id === myTicket.ticketId) + 1;
  const total = queue.length;
  const etaMinutes = position * (svc.avgMinsPerPerson || AVG_SERVICE_TIME);

  ticketNumberEl.textContent = myTicket.ticketNumber;
  etaEl.textContent = formatETA(etaMinutes);

  wrap.innerHTML = `
    <div class="ticket">
      <strong>Your Ticket:</strong> ${myTicket.ticketNumber} <br>
      <strong>ID Number:</strong> ${myTicket.idNumber} <br>
      <strong>Service:</strong> ${svc.name} <br>
      <strong>Position:</strong> ${position > 0 ? position : "Waiting…"} of ${total} 
    </div>
    <div class="steps">
      ${queue.map((t,i) => {
        const cls = i+1 < position ? "done" : i+1 === position ? "active" : "";
        return `<div class="step ${cls}">
          <div class="dot"></div>
          <div class="label">#${t.ticketNumber}</div>
        </div>`;
      }).join("")}
    </div>
  `;

  const leaveBtn = document.createElement("button");
  leaveBtn.className = "btn secondary";
  leaveBtn.textContent = "Leave Queue";
  leaveBtn.addEventListener("click", leaveQueue);
  wrap.appendChild(leaveBtn);

  if(position === 1){
    wrap.classList.add("flash"); 
    setTimeout(() => wrap.classList.remove("flash"), 800);
  }
}

// --- Logout ---
$("#logout-btn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "/login/login.html";
});

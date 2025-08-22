import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, addDoc, getDocs, onSnapshot, query, orderBy, serverTimestamp
} from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";

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

let services = [];
let selectedServiceId = null;
let myTicket = null;

function $(sel){ return document.querySelector(sel); }
function serviceById(id){ return services.find(s => s.id === id); }

async function hashID(id) {
  //const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(id));
  //return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
  return id;
}

// --- ETA badge helper ---
function etaBadge(queueLength, avgMins = 5){
  const eta = queueLength * avgMins;
  let text = `ETA ~${eta}m`;
  if(eta < 15) return `<span class="badge green">${text}</span>`;
  if(eta < 30) return `<span class="badge amber">${text}</span>`;
  return `<span class="badge red">${text}</span>`;
}
function debounce(fn, delay = 50){
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

// --- Listen to all services ---
function listenToServices() {
  const servicesRef = collection(db, "services");

  onSnapshot(servicesRef, snapshot => {
   const  newServices = [];

    snapshot.forEach(docSnap => {
      const data = docSnap.data();


      // Fill defaults if missing
      const svcData = {
        id: docSnap.id,
        name: data.name || "Unnamed Service",
        open: data.open !== undefined ? data.open : true,
        avgMinsPerPerson: data.avgMinsPerPerson || 5,
        queue: []
      };
      // Listen to queue of each service
      const qRef = query(collection(db, "services", docSnap.id, "queue"), orderBy("createdAt"));
      onSnapshot(qRef, qSnap => {


        svcData.queue = [];
        qSnap.forEach(qd => {
          const qData = qd.data();

          // human readable ticket number
          const ticketNum = qData.ticketNumber || `#${qSnap.docs.indexOf(qd) + 1}`;
          const idNum     = qData.idNumber   || "Unknown";

          svcData.queue.push({
            ticketNumber: ticketNum,
            idNumber: idNum,
            id: qd.id,
            createdAt: qData.createdAt || null
          });
        });

        svcData.queue.sort((a, b) => {
          const aTime = a.createdAt ? a.createdAt.seconds : 0;
          const bTime = b.createdAt ? b.createdAt.seconds : 0;
          return aTime - bTime;
        });

        debouncedRender();
      });

      newServices.push(svcData);
    });
    services = newServices;
    debouncedRender();
  });
}

// --- Join queue ---
async function joinQueueFirestore(svc, idNumber){
  const queueRef = collection(db, "services", svc.id, "queue");

  // Count existing queue
  const docs = await getDocs(queueRef);
  const queueLen = docs.size;

  // Generate ticket ID to be readable
  const newTicketNumber = `${svc.name.slice(0,2).toUpperCase()}${queueLen+1}`;

  // Add to Firestore
  const docRef = await addDoc(queueRef, { 
    ticketNumber: newTicketNumber,
    idNumber: idNumber,
    createdAt: serverTimestamp(), 
  });

  myTicket = { 
    serviceId: svc.id, 
    ticketId: docRef.id, 
    ticketNumber: newTicketNumber,
    idNumber: idNumber 
  };
  $("#queue-status").textContent = `You have joined the queue as ${newTicketNumber}!`;
  renderMyTicket();
}

// --- Render service list ---
function renderServiceList(){
  const wrap = $("#service-list");
  wrap.innerHTML = "";

  services.forEach(s => {
    const qlen = (s.queue || []).length;
    const avgMins = s.avgMinsPerPerson || 5;
    
    const btn = document.createElement("button");
    btn.className = "item";
    btn.innerHTML = `
      <div class="row space">
        <div>${s.name}${etaBadge(qlen, avgMins)}</div>
      </div>
      <div class="meta">${s.open ? "Open" : "Closed"} • ${qlen} in queue</div>
    `;
    btn.onclick = () => { selectedServiceId = s.id; renderDetails(); };
    wrap.appendChild(btn);
  });
}

// --- Render queue details ---
function renderDetails(){
  const svc = selectedServiceId ? serviceById(selectedServiceId) : null;
  const title = $("#details-title");
  const form = $("#queue-form");

  if(svc) {
    title.innerHTML = `Queue details – ${svc.name} ${etaBadge((svc.queue||[]).length, svc.avgMinsPerPerson)}`;
    form.style.display = "block";
  } else {
    title.textContent = "Queue details";
    form.style.display = "none";
  }

  form.onsubmit = e => {
    e.preventDefault();
    const idNumber = $("#idCard").value.trim();
    if(idNumber && svc) joinQueueFirestore(svc, idNumber);
    $("#idCard").value = "";
  };
}

// --- Render my ticket ---
function renderMyTicket(){
  const wrap = $("#my-ticket");
  if(!myTicket){ 
    wrap.textContent = "You haven’t joined a queue yet."; 
    return; 
  }

  const svc = serviceById(myTicket.serviceId);
  if(!svc){ 
    wrap.textContent = "Service not found."; 
    return; 
  }

  const queue = (svc.queue || []).filter(t => t.id);
  const position = queue.findIndex(p => p.id === myTicket.ticketId) + 1;
  const total = queue.length;

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
highlightNextTicket();
}

function highlightNextTicket() {
  const wrap = $("#my-ticket");
  if(!myTicket) return;
  const svc = serviceById(myTicket.serviceId);
  const queue = (svc.queue || []);
  const position = queue.findIndex(t => t.id === myTicket.ticketId) + 1;
  if(position === 1) {
    wrap.classList.add("flash"); 
    setTimeout(() => wrap.classList.remove("flash"), 800);
  }
}

// --- Logout ---
$("#logout-btn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "/login/login.html";
});

// --- Init ---
listenToServices();

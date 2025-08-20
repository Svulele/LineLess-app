import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, onSnapshot, addDoc, getDocs 
} from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";

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

// ETA badge helper
function etaBadge(queueLength){
  let text = `ETA ~${queueLength*5}m`;
  if(queueLength < 3) return `<span class="badge green">${text}</span>`;
  if(queueLength < 7) return `<span class="badge amber">${text}</span>`;
  return `<span class="badge red">${text}</span>`;
}

// --- Listen to services in Firestore ---
function listenToServices(){
  const servicesRef = collection(db, "services");
  onSnapshot(servicesRef, async (snapshot) => {
    services = [];
    const promises = snapshot.docs.map(async (docSnap) => {
      const svcData = { id: docSnap.id, ...docSnap.data(), queue: [] };

      // fetch subcollection queue
      const qRef = collection(db, "services", docSnap.id, "queue");
      const qSnap = await getDocs(qRef);
      qSnap.forEach(qd => {
        svcData.queue.push(qd.data());
      });

      services.push(svcData);
    });

    await Promise.all(promises);
    renderServiceList();
    renderDetails();
    renderMyTicket();
  });
}


// --- Join queue & save to Firestore ---
async function joinQueueFirestore(svc, name){
  const queueRef = collection(db, "services", svc.id, "queue");

  // Count queue length from Firestore
  const docs = await getDocs(queueRef);
  const queueLen = docs.size;

  // Generate ticket
  const newTicketId = (svc.name.split(" ")[0][0] + String(queueLen+1).padStart(2,"0")).toUpperCase();

  // Save to DB
  await addDoc(queueRef, { id: newTicketId, name });

  // Save locally
  myTicket = { serviceId: svc.id, ticketId: newTicketId, name };
  renderMyTicket();
}

// --- Render service list (with ETA on right) ---
function renderServiceList(){
  const wrap = $("#service-list");
  wrap.innerHTML = "";
  services.forEach(s=>{
    const queueLen = Array.isArray(s.queue) ? s.queue.length : 0;
    const btn = document.createElement("button");
    btn.className = "item";
    btn.innerHTML = `
      <div class="row space">
        <div>
          <div>${s.name}</div>
          <div class="meta">${s.open ? "Open" : "Closed"} • ${queueLen} in queue</div>
        </div>
        <div>${etaBadge(queueLen)}</div>
      </div>
    `;
    btn.onclick = ()=>{ selectedServiceId = s.id; renderDetails(); };
    wrap.appendChild(btn);
  });
}

// --- Render queue details (join input) ---
function renderDetails(){
  const content = $("#details-content");
  const svc = selectedServiceId ? serviceById(selectedServiceId) : null;
  if(!svc){ content.textContent = "Select a service."; return; }

  content.innerHTML = `
    <h2>${svc.name} ${etaBadge((svc.queue||[]).length)}</h2>
    <input id="join-name" placeholder="Your name">
    <button id="join-btn" class="btn primary">Join Queue</button>
  `;
  $("#join-btn").onclick = ()=>{
    const name = $("#join-name").value.trim();
    if(name) joinQueueFirestore(svc, name);
  };
}

// --- Render ticket (position + ETA) ---
async function renderMyTicket(){
  const wrap = $("#my-ticket");
  if(!myTicket){ 
    wrap.textContent = "No ticket yet."; 
    return; 
  }
  const svc = serviceById(myTicket.serviceId);
  if(!svc){ 
    wrap.textContent = "Service not found."; 
    return; 
  }

  // Fetch fresh queue directly from Firestore
  const qRef = collection(db, "services", svc.id, "queue");
  const docs = await getDocs(qRef);
  const queue = [];
  docs.forEach(d => queue.push(d.data()));

  // Find my position (1-based)
  let position = queue.findIndex(p => p.id === myTicket.ticketId);
  position = (position !== -1) ? position + 1 : 0;

  const total = queue.length;

  // Ticket details
  wrap.innerHTML = `
    <div class="ticket">
      <strong>Your Ticket:</strong> ${myTicket.ticketId} <br>
      <strong>Name:</strong> ${myTicket.name} <br>
      <strong>Service:</strong> ${svc.name} <br>
      <strong>Position:</strong> ${position} of ${total}
    </div>

    <div class="steps">
      ${queue.map((q,i) => {
        const cls = (i+1 < position) ? "done" : (i+1 === position ? "active" : "");
        return `
          <div class="step ${cls}">
            <div class="dot"></div>
            <div class="label">#${i+1}</div>
          </div>`;
      }).join("")}
    </div>
  `;
}



// --- Logout ---
$("#logout-btn").addEventListener("click", async ()=>{
  await signOut(auth);
  window.location.href = "/login/login.html";
});

listenToServices();

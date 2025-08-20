import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, onSnapshot, deleteDoc, doc, getDocs 
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
let adminSelectedServiceId = null;
let nowServing = {}; // track current serving ticket

function $(sel){ return document.querySelector(sel); }
function serviceById(id){ return services.find(s => s.id === id); }

// ETA badge helper
function etaBadge(queueLength){
  let text = `ETA ~${queueLength*5}m`;
  if(queueLength < 3) return `<span class="badge green">${text}</span>`;
  if(queueLength < 7) return `<span class="badge amber">${text}</span>`;
  return `<span class="badge red">${text}</span>`;
}

function listenToServices(){
  const servicesRef = collection(db, "services");
  onSnapshot(servicesRef, async (snapshot) => {
    services = [];
    const promises = snapshot.docs.map(async (docSnap) => {
      const svcData = { id: docSnap.id, ...docSnap.data(), queue: [] };

      // get live queue for each service
      const qRef = collection(db, "services", docSnap.id, "queue");
      const qSnap = await getDocs(qRef);
      qSnap.forEach(qd => {
        svcData.queue.push(qd.data());
      });

      services.push(svcData);
    });

    await Promise.all(promises);
    renderAdminLists();
    renderAdminDetails();
  });
}


// --- Serve next person from queue ---
async function serveNextFirestore(svc){
  if(!svc.queue || svc.queue.length === 0) return;
  const first = svc.queue[0];
  const qRef = collection(db, "services", svc.id, "queue");
  const docs = await getDocs(qRef);
  let target = null;
  docs.forEach(d=>{
    if(d.data().id === first.id) target=d;
  });
  if(target){
    await deleteDoc(doc(db, "services", svc.id, "queue", target.id));
    nowServing[svc.id] = first; // update "Now Serving" banner
    renderAdminDetails();
  }
}

// --- Render services list (styled + ETA on right) ---
function renderAdminLists(){
  const wrap = $("#admin-service-list");
  wrap.innerHTML = "";
  services.forEach(s=>{
    const queueLen = Array.isArray(s.queue) ? s.queue.length : 0;
    const btn = document.createElement("button");
    btn.className = "item";
    btn.innerHTML = `
      <div class="row space">
        <div>${s.name}</div>
        <div class="meta">${queueLen} in queue</div>
        <div>${etaBadge(queueLen)}</div>
      </div>
    `;
    btn.onclick = ()=>{ adminSelectedServiceId = s.id; renderAdminDetails(); };
    wrap.appendChild(btn);
  });
}

// --- Render details of selected service ---
function renderAdminDetails(){
  const content = $("#admin-details-content");
  const svc = adminSelectedServiceId ? serviceById(adminSelectedServiceId) : null;
  if(!svc){ 
    content.textContent="Select a service."; 
    return; 
  }

  const queue = svc.queue || [];
  const serving = nowServing[svc.id];

  content.innerHTML = `
    <h2>${svc.name} ${etaBadge(queue.length)}</h2>

    <div class="ticket" style="margin-bottom:12px;">
      <strong>Now Serving:</strong><br>
      ${serving 
        ? `${serving.id} — ${serving.name || "Anonymous"}`
        : "No one being served yet."}
    </div>

    <ul class="queue-list">
      ${queue.length === 0 
        ? "<li>No one in queue.</li>"
        : queue.map((q,i)=>`
          <li>
            <strong>${q.id}</strong> — ${q.name || "Anonymous"} 
            <span class="meta">(Position: ${i+1})</span>
          </li>
        `).join("")}
    </ul>
    <button id="serve-next" class="btn primary" ${queue.length === 0 ? "disabled" : ""}>
      Serve Next
    </button>
  `;

  $("#serve-next")?.addEventListener("click", ()=> serveNextFirestore(svc));
}

$("#logout-btn").addEventListener("click", async ()=>{
  await signOut(auth);
  window.location.href = "/login/login.html";
});

listenToServices();

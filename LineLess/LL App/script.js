let services = [
    {
      id: "home-affairs-passport",
      name: "Home Affairs – Passport",
      avgMinsPerPerson: 6,
      open: true,
      queue: [
        { id: "A01", name: "Nomsa M." },
        { id: "A02", name: "Thando S." },
        { id: "A03", name: "Vuyo K." }
      ]
    },
    {
      id: "clinic-checkup",
      name: "Public Clinic – General Checkup",
      avgMinsPerPerson: 8,
      open: true,
      queue: [
        { id: "C01", name: "Naledi P." },
        { id: "C02", name: "Michael T." }
      ]
    },
    {
      id: "licensing-renewal",
      name: "Licensing – Driver’s Licence Renewal",
      avgMinsPerPerson: 5,
      open: true,
      queue: [{ id: "L01", name: "Sbu L." }]
    }
  ];
  
  let selectedServiceId = null;
  let myTicket = null;
  
  // ----- Helpers -----
  function $(sel){ return document.querySelector(sel); }
  function el(tag, attrs={}, children=[]) {
    const n = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v]) => {
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k,v);
    });
    children.forEach(c => n.appendChild(c));
    return n;
  }
  function serviceById(id){ return services.find(s => s.id === id); }
  function waitMins(svc){ return svc.queue.length * svc.avgMinsPerPerson; }
  function badgeClass(mins){ return mins < 10 ? "badge green" : mins < 25 ? "badge amber" : "badge red"; }
  
  // ----- Tab switching -----
  $("#tab-citizen").addEventListener("click", () => {
    $("#tab-citizen").classList.add("active");
    $("#tab-admin").classList.remove("active");
    $("#view-citizen").style.display = "";
    $("#view-admin").style.display = "none";
  });
  $("#tab-admin").addEventListener("click", () => {
    $("#tab-admin").classList.add("active");
    $("#tab-citizen").classList.remove("active");
    $("#view-admin").style.display = "";
    $("#view-citizen").style.display = "none";
    renderAdminLists();
  });
  
  // ----- Citizen View -----
  function renderServiceList(){
    const wrap = $("#service-list");
    wrap.innerHTML = "";
    services.forEach(s => {
      const mins = waitMins(s);
      const btn = el("button",{class:"item", onclick:()=>selectService(s.id)},[
        el("div",{class:"row space"},[
          el("div",{},[
            el("div",{text:s.name}),
            el("div",{class:"meta", text:`${s.open ? "Open" : "Closed"} • ${s.queue.length} in queue • ~${mins} min wait`})
          ]),
          el("span",{class:badgeClass(mins),text:`ETA ~${mins}m`})
        ])
      ]);
      if (selectedServiceId === s.id) btn.style.boxShadow = "0 0 0 3px rgba(37,99,235,.15)";
      wrap.appendChild(btn);
    });
  }
  
  function selectService(id){
    selectedServiceId = id;
    renderServiceList();
    renderDetails();
  }
  
  function renderTrackingLine(svc, myTicketId){
    // Create up to 6 visible steps to keep UI clean
    const visible = Math.min(6, svc.queue.length);
    const container = el("div",{class:"steps"});
    for(let i=0;i<visible;i++){
      const person = svc.queue[i];
      const step = el("div",{class:"step"});
      const isMine = myTicketId && person && person.id === myTicketId;
      const dot = el("div",{class:`dot ${i===0 ? 'done' : ''}`}); // first is being served
      const label = el("div",{class:"label",text: person ? person.name : ""});
      const dotWrap = el("div",{class: i===0 ? 'step done' : (isMine ? 'step active' : 'step')});
      const dotEl = el("div",{class:"dot"});
      dotWrap.appendChild(dotEl);
      if(isMine){
        const caret = el("div",{class:"caret"});
        dotWrap.appendChild(caret);
      }
      const stepOuter = el("div",{class: dotWrap.className});
      stepOuter.appendChild(el("div",{class:"dot"}));
      if(isMine){ stepOuter.appendChild(el("div",{class:"caret"})); }
      const finalStep = el("div",{class: stepOuter.className});
      finalStep.appendChild(el("div",{class:"dot"}));
      if(isMine){ finalStep.appendChild(el("div",{class:"caret"})); }
      const stepNode = el("div",{class: stepOuter.className});
      stepNode.appendChild(el("div",{class:"dot"}));
      if(isMine){ stepNode.appendChild(el("div",{class:"caret"})); }
      // Simpler: just one node
      const node = el("div",{class: isMine ? "step active" : (i===0?"step done":"step")},[
        el("div",{class:"dot"}),
        el("div",{class:"label",text: person ? person.name : ""})
      ]);
      container.appendChild(node);
    }
    return container;
  }
  
  function renderDetails(){
    const title = $("#details-title");
    const content = $("#details-content");
    const svc = selectedServiceId ? serviceById(selectedServiceId) : null;
  
    if (!svc){
      title.textContent = "Queue details";
      content.className = "muted";
      content.textContent = "Select a service to view details and join the queue.";
      return;
    }
  
    title.textContent = svc.name;
    content.innerHTML = "";
    const mins = waitMins(svc);
    const info = el("div",{class:"muted",text:`Avg. service time: ${svc.avgMinsPerPerson} min/person • ~${mins} min total wait`});
    const input = el("input",{type:"text",placeholder:"Your name",id:"join-name"});
    const joinBtn = el("button",{class:"btn primary",text:"Join Queue",onclick:()=>{
      const name = input.value.trim();
      if (!name) return;
      joinQueue(svc, name);
    }});
    const inputRow = el("div",{class:"row"},[input, joinBtn]);
  
    // Tracking line
    const trackingTitle = el("div",{class:"muted",text:"Live queue view"});
    const tracking = renderTrackingLine(svc, myTicket ? myTicket.ticketId : null);
  
    const list = el("ul",{class:"plain"});
    svc.queue.forEach((q, idx)=>{
      list.appendChild(el("li",{},[
        el("span",{text:`${idx+1}. ${q.name}` }),
        el("span",{class:"muted",text:`ETA ${idx * svc.avgMinsPerPerson}m`})
      ]));
    });
  
    content.appendChild(info);
    content.appendChild(el("div",{style:"height:10px"}));
    content.appendChild(trackingTitle);
    content.appendChild(tracking);
    content.appendChild(el("div",{style:"height:10px"}));
    content.appendChild(inputRow);
    content.appendChild(el("div",{style:"height:10px"}));
    content.appendChild(list);
  }
  
  function joinQueue(svc, name){
    const ticketId = (svc.name.split(" ")[0][0] + String(svc.queue.length+1).padStart(2,"0")).toUpperCase();
    svc.queue.push({ id: ticketId, name });
    myTicket = { serviceId: svc.id, ticketId, name };
    renderServiceList();
    renderDetails();
    renderMyTicket();
  }
  
  function renderMyTicket(){
    const wrap = $("#my-ticket");
    if (!myTicket){
      wrap.className = "muted";
      wrap.textContent = "You haven’t joined a queue yet.";
      return;
    }
    const svc = serviceById(myTicket.serviceId);
    const pos = svc.queue.findIndex(q=>q.id===myTicket.ticketId);
    const eta = Math.max(0,pos) * svc.avgMinsPerPerson;
    const barPct = Math.min(100, Math.max(0, ((svc.queue.length - pos - 1) / Math.max(1, svc.queue.length)) * 100));
  
    wrap.className = "";
    wrap.innerHTML = "";
    wrap.appendChild(el("div",{class:"ticket"},[
      el("div",{class:"row space"},[
        el("div",{},[ el("div",{class:"muted",text:"Ticket"}), el("div",{style:"font-weight:700;font-size:24px",text:myTicket.ticketId}) ]),
        el("div",{style:"text-align:right"},[ el("div",{class:"muted",text:"Service"}), el("div",{style:"font-weight:600",text:svc.name}) ])
      ]),
      el("div",{style:"height:10px"}),
      el("div",{class:"barwrap"},[ el("div",{class:"bar",style:`width:${barPct}%`}) ]),
      el("div",{class:"muted",style:"margin-top:8px",text:`Position: ${pos+1} / ${svc.queue.length} • ETA ~${eta} min`}),

      
      // mini tracking line showing only you + first person
      el("div",{style:"height:10px"}),
      (function(){
        const mini = el("div",{class:"steps"});
        const first = el("div",{class:"step done"},[el("div",{class:"dot"}),el("div",{class:"label",text:"Now serving"})]);
        const mine = el("div",{class:"step active"},[el("div",{class:"dot"}),el("div",{class:"label",text:"You"})]);
        mini.appendChild(first); mini.appendChild(mine);
        return mini;
      })()
    ]));
  }
  
  // ----- Admin View -----
  let adminSelectedServiceId = null;
  
  function renderAdminLists(){
    const wrap = $("#admin-service-list");
    wrap.innerHTML = "";
    services.forEach(s => {
      const btn = el("button",{class:"item", onclick:()=>selectAdminService(s.id)},[
        el("div",{class:"row space"},[
          el("div",{},[
            el("div",{text:s.name}),
            el("div",{class:"meta",text:`${s.open ? "Open" : "Closed"} • ${s.queue.length} in queue`})
          ]),
          el("span",{class:"badge",text:`~${s.avgMinsPerPerson}m / person`})
        ])
      ]);
      if (adminSelectedServiceId === s.id) btn.style.boxShadow = "0 0 0 3px rgba(16,185,129,.18)";
      wrap.appendChild(btn);
    });
    renderAdminDetails();
  }
  
  function selectAdminService(id){
    adminSelectedServiceId = id;
    renderAdminLists();
  }
  
  function renderAdminDetails(){
    const title = $("#admin-details-title");
    const content = $("#admin-details-content");
    const toggleBtn = $("#toggle-open");
    const svc = adminSelectedServiceId ? serviceById(adminSelectedServiceId) : null;
  
    if (!svc){
      title.textContent = "Manage queue";
      content.className = "muted";
      content.textContent = "Select a service to manage the queue.";
      toggleBtn.style.display = "none";
      return;
    }
  
    title.textContent = svc.name;
    toggleBtn.style.display = "";
    toggleBtn.textContent = svc.open ? "Close Queue" : "Open Queue";
    toggleBtn.onclick = ()=>{ svc.open = !svc.open; renderAdminLists(); renderServiceList(); };
  
    content.className = "";
    content.innerHTML = "";
    const serveNextBtn = el("button",{class:"btn secondary",text:"Serve Next",onclick:()=>{
      if (svc.queue.length>0){ svc.queue.shift(); }
      if (myTicket && myTicket.serviceId === svc.id && !svc.queue.some(q=>q.id===myTicket.ticketId)){ myTicket = null; }
      renderAdminLists(); renderDetails(); renderMyTicket();
    }});
  
    const list = el("ul",{class:"plain"});
    svc.queue.forEach((q, idx)=>{
      list.appendChild(el("li",{},[
        el("span",{text:`${idx+1}. ${q.name} — ${q.id}`}),
        el("button",{class:"btn",text:"Remove",onclick:()=>{
          svc.queue = svc.queue.filter(x=>x.id!==q.id);
          if (myTicket && myTicket.ticketId === q.id) myTicket = null;
          renderAdminLists(); renderDetails(); renderMyTicket();
        }})
      ]));
    });
  
    // tracking for admin (who is coming next 5)
    const tracking = renderTrackingLine(svc, myTicket ? myTicket.ticketId : null);
    const label = el("div",{class:"muted",text:"Queue preview (next up):"});
  
    content.appendChild(serveNextBtn);
    content.appendChild(el("div",{style:"height:8px"}));
    content.appendChild(label);
    content.appendChild(tracking);
    content.appendChild(el("div",{style:"height:8px"}));
    content.appendChild(list);
  }
  
  // ----- Init -----
  document.getElementById("year").textContent = new Date().getFullYear();
  renderServiceList();
  renderDetails();
  renderMyTicket();



  document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("darkModeToggle");
  
    toggle.addEventListener("click", () => {
      document.body.classList.toggle("dark");
  
      // Save preference to localStorage
      if (document.body.classList.contains("dark")) {
        localStorage.setItem("theme", "dark");
        toggle.textContent = "☀️ Light Mode";
      } else {
        localStorage.setItem("theme", "light");
        toggle.textContent = "🌙 Dark Mode";
      }
    });
  
    // Load preference on page load
    if (localStorage.getItem("theme") === "dark") {
      document.body.classList.add("dark");
      toggle.textContent = "☀️ Light Mode";
    }
  });
  
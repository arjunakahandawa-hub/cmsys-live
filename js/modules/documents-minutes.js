// ============================================================================
// CMSys Module: Documents, Naval Minute Sheets & Job Minutes Workflow
// File: js/modules/documents-minutes.js
// ============================================================================

// =============================================================================
// DOCUMENTS & MINUTE SHEET MANAGEMENT SYSTEM
// =============================================================================

// Sinhala Month Names
window.SINHALA_MONTHS = (typeof window.SINHALA_MONTHS !== "undefined") ? window.SINHALA_MONTHS : [
  "ජනවාරි", "පෙබරවාරි", "මාර්තු", "අප්‍රේල්", "මැයි", "ජූනි",
  "ජූලි", "අගෝස්තු", "සැප්තැම්බර්", "ඔක්තෝබර්", "නොවැම්බර්", "දෙසැම්බර්"
];

function getSinhalaDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = SINHALA_MONTHS[d.getMonth()];
  const day = String(d.getDate()).padStart(2, "0");
  return `${year} ${month} මස ${day}`;
}

function getEnglishNavalDateString(d = new Date()) {
  const day = String(d.getDate()).padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

// Standard Naval Appointments (Addressees)
window.STANDARD_NAVAL_ADDRESSEES_SI = (typeof window.STANDARD_NAVAL_ADDRESSEES_SI !== "undefined") ? window.STANDARD_NAVAL_ADDRESSEES_SI : [
  "විධායක නිලධාරි (තඨාකාංගනය)",
  "සහකාර විනයාරක්ෂකාධිපති (නැ)",
  "ප්‍රධාන ඉංජිනේරු",
  "නියෝජ්‍ය ප්‍රධාන ඉංජිනේරු",
  "අණදෙන නිලධාරි",
  "මූලස්ථාන සැපයුම් නිලධාරි",
  "කාර්ය භාර නිලධාරි (සිවිල් නඩත්තු)"
];

window.STANDARD_NAVAL_ADDRESSEES_EN = (typeof window.STANDARD_NAVAL_ADDRESSEES_EN !== "undefined") ? window.STANDARD_NAVAL_ADDRESSEES_EN : [
  "Executive Officer (Dockyard)",
  "Assistant Provost Marshal (E)",
  "Chief Engineer",
  "Deputy Chief Engineer",
  "Commanding Officer",
  "Base Supply Officer",
  "Officer in Charge - Civil Maintenance"
];

// Default Standard Naval Minute Templates (Sinhala & English)
window.DEFAULT_NAVAL_MINUTE_TEMPLATES = (typeof window.DEFAULT_NAVAL_MINUTE_TEMPLATES !== "undefined") ? window.DEFAULT_NAVAL_MINUTE_TEMPLATES : [
  // 1. Sinhala - Sailor Leave Extension (From User Pic 3 & 4)
  {
    id: "tpl_sailor_leave_si",
    lang: "si",
    title: "නාවිකයෙකුගේ නිවාඩු දීර්ඝ කිරීමේ මාණ්ඩලික සටහන්පත",
    category: "Sailors & Admin",
    ref_no: "MIN/2026/08/002",
    subject: "නිවාඩු දීර්ඝ කිරීම සදහා",
    addressees: "විධායක නිලධාරි (තඨාකාංගනය)\n\nසහකාර විනයාරක්ෂකාධිපති (නැ)",
    originator: "ජ්‍යෙෂ්ඨ සිවිල් ඉංජිනේරු නිලධාරි (නඩත්තු) මඟින්",
    paragraphs: [
      "කපිතාන් සිවිල් ඉංජිනේරු දෙපාර්තමේන්තුව (නැ) ට අනුයුක්තව රාජකාරි සිදු කරනු ලබන [නම / නිලය / නිල අංකය] දරණ කණිෂ්ඨ නාවිකයා 2026 අගෝස්තු මස 14 වන දින සිට දින 09 ක් නිවාඩු ගොස් 2026 අගෝස්තු මස 23 වන දින 2000 පැයට කඳවුරට රෙපෝර්තු කිරීමට තිබූ අතර, ඔහුගේ මව අසනීප වී ඇති බව දුරකථන ඇමතුමක් මඟින් දන්වා ඇත.",
      "කරුණු එසේ හෙයින් එම නාවිකයා හට දින 02 ක් නිවාඩු දීර්ඝ කර එනම් 2026 අගෝස්තු මස 25 වන දින 2000 පැයට කඳවුරට රෙපෝර්තු කිරීමට අවශ්‍ය නිසි කටයුතු සලසා දෙන මෙන් අයදේ."
    ],
    recommendation: "",
    sign_title: "ජ්‍යෙ.සි.ඉ.නි (නඩත්තු)",
    m02_enabled: false,
    m02_addressee: "සහකාර විනයාරක්ෂකාධිපති (නැ)",
    m02_originator: "විධායක නිලධාරි මඟින්",
    m02_text: "නිර්දේශ කර ඉදිරිපත් කරමි.",
    m02_sign_title: "විධායක නිලධාරි"
  },
  // 2. Sinhala - Civil Maintenance Approval
  {
    id: "tpl_civil_repair_si",
    lang: "si",
    title: "හදිසි සිවිල් නඩත්තු කටයුතු සඳහා අනුමැතිය ලබා ගැනීම",
    category: "Civil Works",
    ref_no: "MIN/2026/08/001",
    subject: "[ස්ථානයේ නම] හදිසි සිවිල් නඩත්තු කටයුතු සිදු කිරීම සඳහා අනුමැතිය ලබා ගැනීම",
    addressees: "ප්‍රධාන ඉංජිනේරු\n\nනියෝජ්‍ය ප්‍රධාන ඉංජිනේරු",
    originator: "කාර්ය භාර නිලධාරි - සිවිල් නඩත්තු මඟින්",
    paragraphs: [
      "නාවික තඨාකාංගන [ස්ථානය / ගොඩනැගිල්ල] හි වහල සහ වැහි පිහිලි අබලන් වීම හේතුවෙන් වැසි කාලයේදී දැඩි ජල කාන්දුවක් පවතින බව කාරුණිකව දන්වා සිටිමි.",
      "මේ සඳහා අවශ්‍ය මූලික තාක්ෂණික ඇස්තමේන්තුව අංක [ඇස්තමේන්තු අංකය] යටතේ සකස් කර ඇති අතර, වැඩපළ ශ්‍රමිකයන් යොදවා කඩිනමින් අලුත්වැඩියා කටයුතු සිදු කිරීමට සැලසුම් කර ඇත."
    ],
    recommendation: "කාර්ය පත්‍රිකාවක් (Job Card) නිකුත් කර කාර්යය ආරම්භ කිරීමට කාරුණික අනුමැතිය අයදිමි.",
    sign_title: "කාර්ය භාර නිලධාරි (සිවිල් නඩත්තු)",
    m02_enabled: true,
    m02_addressee: "නියෝජ්‍ය ප්‍රධාන ඉංජිනේරු",
    m02_originator: "කාර්ය භාර නිලධාරි මඟින්",
    m02_text: "නිර්දේශ කර ඉදිරිපත් කරමි.",
    m02_sign_title: "නියෝජ්‍ය ප්‍රධාන ඉංජිනේරු"
  },
  // 3. English - Civil Maintenance & Structural Repair
  {
    id: "tpl_civil_repair_en",
    lang: "en",
    title: "Civil Maintenance & Structural Repair Minute",
    category: "Civil Works",
    ref_no: "MIN/2026/08/001",
    subject: "APPROVAL FOR URGENT CIVIL REPAIR WORKS AT [LOCATION / FACILITY]",
    addressees: "Chief Engineer\n\nDeputy Chief Engineer",
    originator: "Senior Civil Engineering Officer (Maintenance)",
    paragraphs: [
      "It is brought to your kind notice that urgent civil maintenance and structural rehabilitation are required at [LOCATION / BUILDING NAME] due to wear, tear, and weather exposure.",
      "A joint technical inspection has been conducted by Civil Directorate personnel. Scope entails roof repairs, gutter renewal, and masonry restoration.",
      "The engineering estimate has been prepared under Reference [ESTIMATE_NO]. Required skilled manpower and initial materials are available."
    ],
    recommendation: "Forwarded for your kind approval and authorization to issue Job Card and commence work please.",
    sign_title: "Senior Civil Engineering Officer (Maintenance)",
    m02_enabled: true,
    m02_addressee: "Deputy Chief Engineer",
    m02_originator: "From: Officer in Charge - Civil Maintenance",
    m02_text: "Recommended and forwarded please.",
    m02_sign_title: "Deputy Chief Engineer"
  },
  // 4. English - Material Requisition & Stores Issuance
  {
    id: "tpl_stores_requisition_en",
    lang: "en",
    title: "Material Requisition & Stores Issuance Minute",
    category: "Material & Stores",
    ref_no: "MIN/2026/08/003",
    subject: "REQUISITION OF CIVIL ENGINEERING STORES FOR [PROJECT NAME]",
    addressees: "Commanding Officer\n\nBase Supply Officer",
    originator: "Officer in Charge - Civil Works",
    paragraphs: [
      "Reference is made to the scheduled civil maintenance task approved under Job Card [JOB_NUMBER].",
      "To ensure uninterrupted progress, the civil engineering materials specified below are urgently required from Central Stores:",
      "1. Ordinary Portland Cement - [QTY] Bags\n2. Tor Steel 12mm - [QTY] Nos\n3. Weather-shield Emulsion Paint - [QTY] Liters"
    ],
    recommendation: "Forwarded for your approval to issue the requested stores on priority please.",
    sign_title: "Officer in Charge - Civil Works",
    m02_enabled: false,
    m02_addressee: "Base Supply Officer",
    m02_originator: "Executive Officer",
    m02_text: "Approved as requested.",
    m02_sign_title: "Executive Officer"
  },
  // 5. English - Sailor Leave Extension (English Format)
  {
    id: "tpl_sailor_leave_en",
    lang: "en",
    title: "Sailor Leave Extension Minute",
    category: "Sailors & Admin",
    ref_no: "MIN/2026/08/002",
    subject: "EXTENSION OF LEAVE - [SAILOR_OFF_NO] [SAILOR_NAME]",
    addressees: "Executive Officer (Dockyard)\n\nAssistant Provost Marshal (E)",
    originator: "Senior Civil Engineering Officer (Maintenance)",
    paragraphs: [
      "Reference is made to [SAILOR_NAME] ([SAILOR_OFF_NO]) attached to Captain Civil Engineering Department (E), who proceeded on 09 days vacation leave from [START_DATE] and was due to report base on [REPORT_DATE] at 2000 hrs.",
      "The sailor has informed via telephonic message that his mother is hospitalized due to sudden illness.",
      "In view of the above circumstances, it is recommended that the sailor be granted an extension of 02 days leave to report camp on [NEW_REPORT_DATE] at 2000 hrs."
    ],
    recommendation: "Submitted for your kind approval please.",
    sign_title: "Senior Civil Engineering Officer (Maintenance)",
    m02_enabled: false,
    m02_addressee: "Assistant Provost Marshal (E)",
    m02_originator: "From: Executive Officer",
    m02_text: "Recommended and forwarded please.",
    m02_sign_title: "Executive Officer"
  }
];

// Initialize Documents State
function initDocumentsSystem() {
  if (!store.msLanguage) {
    store.msLanguage = "si"; // Default to Sinhala
  }

  if (!store.jobMinutes) {
    try {
      const saved = localStorage.getItem("ncw_job_minutes_v1");
      store.jobMinutes = saved ? JSON.parse(saved) : [];
    } catch (e) {
      store.jobMinutes = [];
    }
  }

  // Seed sample minutes if empty
  if (store.jobMinutes.length === 0) {
    store.jobMinutes = [
      {
        id: "min_001",
        ref_no: "MIN/2026/08/001",
        date_received: "2026-08-10",
        end_user: "Wardroom Mess",
        subject: "Urgent roof repair and stormwater drainage rehabilitation",
        description: "Severe rainwater leakage during monsoon at dining hall and officers lounge. Gutter replacement required.",
        priority: "High",
        directed_type: "Zone for Maintenance",
        directed_to: "A-Zone",
        position: "WIP",
        linked_estimate_id: "EST-2026-014",
        linked_job_number: "JC-2026-042",
        position_trail: [
          { date: "2026-08-10", officer: "Duty Officer - Wardroom", position: "RECEIVED", remarks: "Minute received and directed to A-Zone for Maintenance" },
          { date: "2026-08-11", officer: "Planning Draftsman", position: "ESTIMATION", remarks: "Site inspection completed, Estimate EST-2026-014 prepared" },
          { date: "2026-08-13", officer: "DCE / CE", position: "APPROVAL", remarks: "Estimate recommended & financial sanction granted" },
          { date: "2026-08-14", officer: "OIC Civil Works", position: "ASSIGNED", remarks: "Assigned to Aluminum & Masonry workshop. Job Card JC-2026-042 issued" },
          { date: "2026-08-16", officer: "Workshop Supervisor", position: "WIP", remarks: "Materials drawn and roofing sheets installation in progress" }
        ],
        created_at: new Date().toISOString()
      },
      {
        id: "min_002",
        ref_no: "MIN/2026/08/002",
        date_received: "2026-08-18",
        end_user: "Supply School",
        subject: "Civil Partitioning & Wiring for New Computer Laboratory",
        description: "Aluminum glass partitions and timber workstation installation for 25 computer stations.",
        priority: "Normal",
        directed_type: "Zone for Maintenance",
        directed_to: "BC-Zone",
        position: "APPROVAL",
        linked_estimate_id: "EST-2026-019",
        linked_job_number: "",
        position_trail: [
          { date: "2026-08-18", officer: "Training Officer - Supply School", position: "RECEIVED", remarks: "Official request received and directed to BC-Zone" },
          { date: "2026-08-20", officer: "QS / Civil Planning", position: "ESTIMATION", remarks: "Detailed BOQ prepared (LKR 340,000)" },
          { date: "2026-08-22", officer: "Civil Directorate", position: "APPROVAL", remarks: "Submitted to Area Commander for financial approval" }
        ],
        created_at: new Date().toISOString()
      },
      {
        id: "min_003",
        ref_no: "MIN/2026/08/003",
        date_received: "2026-08-21",
        end_user: "MT Pool / Transport Section",
        subject: "Heavy vehicle ramp concrete recasting and grease trap maintenance",
        description: "Ramp edge concrete collapsed under heavy vehicle load. Urgent repair needed.",
        priority: "Emergency",
        directed_type: "Workshop for Job",
        directed_to: "Welding-Shop",
        position: "ESTIMATION",
        linked_estimate_id: "",
        linked_job_number: "",
        position_trail: [
          { date: "2026-08-21", officer: "OIC MT Pool", position: "RECEIVED", remarks: "Emergency minute received and directed to Welding Shop for Job execution" },
          { date: "2026-08-22", officer: "Site Engineer", position: "ESTIMATION", remarks: "Soil compaction and concrete reinforcement assessment ongoing" }
        ],
        created_at: new Date().toISOString()
      }
    ];
    saveJobMinutesToStorage();
  }

  // Load Templates
  if (!store.minuteTemplates) {
    try {
      const savedTpl = localStorage.getItem("ncw_minute_templates_v1");
      store.minuteTemplates = savedTpl ? JSON.parse(savedTpl) : DEFAULT_NAVAL_MINUTE_TEMPLATES;
    } catch (e) {
      store.minuteTemplates = DEFAULT_NAVAL_MINUTE_TEMPLATES;
    }
  }
}

function saveJobMinutesToStorage() {
  try {
    localStorage.setItem("ncw_job_minutes_v1", JSON.stringify(store.jobMinutes || []));
  } catch (e) {
    console.warn("Error saving job minutes to localStorage", e);
  }
}

function saveMinuteTemplatesToStorage() {
  try {
    localStorage.setItem("ncw_minute_templates_v1", JSON.stringify(store.minuteTemplates || []));
  } catch (e) {
    console.warn("Error saving minute templates to localStorage", e);
  }
}

// Destination / Routing Options Generator
function onDirectedTypeChange() {
  const typeSelect = document.getElementById("njmDirectedType");
  const targetSelect = document.getElementById("njmDirectedTarget");
  const lblTarget = document.getElementById("lblNjmDirectedTarget");
  if (!typeSelect || !targetSelect) return;

  const type = typeSelect.value;
  targetSelect.innerHTML = "";

  if (type === "Zone for Maintenance") {
    if (lblTarget) lblTarget.textContent = "Target Zone (අදාළ කලාපය) *";
    const zones = store.zones || [{ id: "A-Zone", name: "A-Zone" }, { id: "BC-Zone", name: "BC-Zone" }];
    targetSelect.innerHTML = zones.map((z) => `<option value="${z.id}">${z.name || z.id}</option>`).join("");
  } else if (type === "Workshop for Job") {
    if (lblTarget) lblTarget.textContent = "Target Workshop (අදාළ වැඩපළ) *";
    const workshops = [
      { id: "Carpentry-Shop", name: "Carpentry Shop (වඩු වැඩපළ)" },
      { id: "Welding-Shop", name: "Welding Shop (පෑස්සුම් වැඩපළ)" },
      { id: "Masonry-Shop", name: "Masonry & Building (මේසන් වැඩපළ)" },
      { id: "Aluminum-Shop", name: "Aluminum & Fitting (ඇලුමිනියම් වැඩපළ)" },
      { id: "Plumbing-Shop", name: "Plumbing & Piping (නළ කාර්මික වැඩපළ)" },
      { id: "Painting-Shop", name: "Painting & Polishing (තීන්ත වැඩපළ)" }
    ];
    targetSelect.innerHTML = workshops.map((w) => `<option value="${w.id}">${w.name}</option>`).join("");
  } else if (type === "Admin Officer") {
    if (lblTarget) lblTarget.textContent = "Admin Officer (පරිපාලන නිලධාරි) *";
    const officers = [
      { id: "CE", name: "Chief Engineer (ප්‍රධාන ඉංජිනේරු)" },
      { id: "DCE", name: "Deputy Chief Engineer (නියෝජ්‍ය ප්‍රධාන ඉංජිනේරු)" },
      { id: "SO(C)", name: "Staff Officer Civil (මාණ්ඩලික නිලධාරි - සිවිල්)" },
      { id: "XO", name: "Executive Officer (විධායක නිලධාරි)" },
      { id: "APM", name: "Assistant Provost Marshal (සහකාර විනයාරක්ෂකාධිපති)" }
    ];
    targetSelect.innerHTML = officers.map((o) => `<option value="${o.id}">${o.name}</option>`).join("");
  } else {
    if (lblTarget) lblTarget.textContent = "Relevant Desk / Unit (අදාළ අංශය) *";
    const desks = [
      { id: "Civil Planning", name: "Civil Planning & Estimating Desk" },
      { id: "Stores & Logistics", name: "Stores & Logistics Section" },
      { id: "Quantity Surveyor", name: "QS & Measurement Desk" }
    ];
    targetSelect.innerHTML = desks.map((d) => `<option value="${d.id}">${d.name}</option>`).join("");
  }
}

// Render Main Documents View
function renderDocumentsView() {
  initDocumentsSystem();
  updateDocumentsMetricStats();

  const activeSubTab = store.currentDocSubTab || "jobminutes";
  switchDocumentsSubTab(activeSubTab);
}

// Sub-Tab Switcher
function switchDocumentsSubTab(subTab) {
  store.currentDocSubTab = subTab;

  const tabs = ["jobminutes", "minutesheet", "templates", "config"];
  tabs.forEach((t) => {
    const btn = document.getElementById(`docTabBtn-${t}`);
    const panel = document.getElementById(`docPanel-${t}`);
    if (btn) {
      if (t === subTab) {
        btn.className = "px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-600 text-white shadow-xs transition-all cursor-pointer flex items-center gap-2";
      } else {
        btn.className = "px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer flex items-center gap-2";
      }
    }
    if (panel) {
      if (t === subTab) {
        panel.classList.remove("hidden");
      } else {
        panel.classList.add("hidden");
      }
    }
  });

  if (subTab === "jobminutes") {
    renderJobMinutesTable();
  } else if (subTab === "minutesheet") {
    populateMinuteSheetDropdowns();
    if (!document.getElementById("msParagraphsContainer")?.children?.length) {
      initMinuteSheetBuilder();
    }
    updateMinuteSheetPreview();
  } else if (subTab === "templates") {
    renderMinuteTemplatesInventory();
  } else if (subTab === "config") {
    renderMinuteSheetSettings();
  }
}

// Update Top Metrics
function updateDocumentsMetricStats() {
  const minutes = store.jobMinutes || [];
  const total = minutes.length;
  const inProgress = minutes.filter((m) => m.position !== "COMPLETED" && m.position !== "ARCHIVED").length;
  const completed = minutes.filter((m) => m.position === "COMPLETED").length;
  const tplCount = (store.minuteTemplates || []).length;

  const totalEl = document.getElementById("docStatTotalMinutes");
  if (totalEl) totalEl.textContent = total;
  const actEl = document.getElementById("docStatActiveTracking");
  if (actEl) actEl.textContent = inProgress;
  const compEl = document.getElementById("docStatCompleted");
  if (compEl) compEl.textContent = completed;
  const tplEl = document.getElementById("docStatTemplates");
  if (tplEl) tplEl.textContent = tplCount;
}

// Position Badges & Labels
window.MINUTE_POSITION_CONFIG = (typeof window.MINUTE_POSITION_CONFIG !== "undefined") ? window.MINUTE_POSITION_CONFIG : {
  RECEIVED: { label: "📥 Received", bg: "bg-slate-100 text-slate-800 border-slate-300", step: 1 },
  ESTIMATION: { label: "📐 Under Estimation", bg: "bg-blue-100 text-blue-800 border-blue-300", step: 2 },
  APPROVAL: { label: "✍️ Pending Approval", bg: "bg-amber-100 text-amber-800 border-amber-300", step: 3 },
  ASSIGNED: { label: "🔨 JC Generated", bg: "bg-purple-100 text-purple-800 border-purple-300", step: 4 },
  WIP: { label: "⚙️ In Progress", bg: "bg-teal-100 text-teal-800 border-teal-300", step: 5 },
  COMPLETED: { label: "✅ Handed Over", bg: "bg-emerald-100 text-emerald-800 border-emerald-300", step: 6 },
  ARCHIVED: { label: "🗄️ Archived", bg: "bg-slate-100 text-slate-500 border-slate-200", step: 7 }
};

// Render Job Minutes Table
function renderJobMinutesTable() {
  const tbody = document.getElementById("jobMinutesTableBody");
  if (!tbody) return;

  const search = (document.getElementById("docMinuteSearchInput")?.value || "").toLowerCase().trim();
  const destFilter = document.getElementById("docMinuteDestinationFilter")?.value || "ALL";
  const posFilter = document.getElementById("docMinutePositionFilter")?.value || "ALL";

  // Populate Destination Filter options dynamically
  const destSelect = document.getElementById("docMinuteDestinationFilter");
  if (destSelect && destSelect.options.length <= 1) {
    const destinations = new Set();
    (store.jobMinutes || []).forEach((m) => {
      if (m.directed_to) destinations.add(m.directed_to);
    });
    destSelect.innerHTML = `<option value="ALL">All Destinations (සියලු කලාප/වැඩපළ)</option>` +
      Array.from(destinations).map((d) => `<option value="${d}">${d}</option>`).join("");
  }

  let list = (store.jobMinutes || []).slice();

  // Search Filter
  if (search) {
    list = list.filter((m) =>
      String(m.ref_no || "").toLowerCase().includes(search) ||
      String(m.end_user || "").toLowerCase().includes(search) ||
      String(m.subject || "").toLowerCase().includes(search) ||
      String(m.directed_to || "").toLowerCase().includes(search) ||
      String(m.linked_job_number || "").toLowerCase().includes(search) ||
      String(m.linked_estimate_id || "").toLowerCase().includes(search)
    );
  }

  // Destination Filter
  if (destFilter !== "ALL") {
    list = list.filter((m) => m.directed_to === destFilter);
  }

  // Position Filter
  if (posFilter !== "ALL") {
    list = list.filter((m) => m.position === posFilter);
  }

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center py-10 text-slate-400 italic">
          No Job Minutes found matching your criteria. Click <strong>+ New Registration</strong> to register an incoming Minute.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map((m) => {
    const posCfg = MINUTE_POSITION_CONFIG[m.position] || MINUTE_POSITION_CONFIG.RECEIVED;
    const estBadge = m.linked_estimate_id
      ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200" title="Linked Estimate">📐 ${m.linked_estimate_id}</span>`
      : `<span class="text-slate-400 italic text-[11px]">—</span>`;

    const jcBadge = m.linked_job_number
      ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200" title="Linked Job Card">📋 ${m.linked_job_number}</span>`
      : `<span class="text-slate-400 italic text-[11px]">—</span>`;

    const priorityColor = m.priority === "Emergency"
      ? "bg-rose-100 text-rose-800 border-rose-300"
      : m.priority === "High"
      ? "bg-amber-100 text-amber-800 border-amber-300"
      : "bg-slate-100 text-slate-600 border-slate-200";

    // Format Contacts & WhatsApp
    let contactsHtml = '<span class="text-slate-400 italic text-[11px]">—</span>';
    const c1 = m.contact_1 || m.contact_no || "";
    const c2 = m.contact_2 || "";
    const wa = m.whatsapp || "";

    if (c1 || c2 || wa) {
      const cleanWa = wa.replace(/[^0-9]/g, "");
      const waLink = cleanWa ? (cleanWa.startsWith("0") ? `94${cleanWa.slice(1)}` : cleanWa) : "";
      contactsHtml = `
        <div class="space-y-0.5 text-[11px]">
          ${c1 ? `<div class="font-mono text-slate-800 flex items-center gap-1"><span>📞</span> ${c1}</div>` : ""}
          ${c2 ? `<div class="font-mono text-slate-600 flex items-center gap-1"><span>📞</span> ${c2}</div>` : ""}
          ${wa ? `<a href="https://wa.me/${waLink}" target="_blank" class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-mono font-bold hover:bg-emerald-100 transition-colors" title="Chat on WhatsApp"><span>💬</span> ${wa}</a>` : ""}
        </div>
      `;
    }

    // Format Directed Location Badge
    let directedHtml = "";
    const isCentralOrNone = !m.directed_to || m.directed_to === "Civil Engineering Department" || m.directed_to === "Unassigned";
    if (isCentralOrNone) {
      directedHtml = `
        <button onclick="openDirectMinuteModal('${m.id}')" class="px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-all cursor-pointer flex items-center gap-1 shadow-2xs">
          <span>📍</span> Direct to Zone
        </button>
      `;
    } else {
      const isShop = (m.directed_type || "").includes("Workshop");
      directedHtml = `
        <div class="flex items-center gap-1">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] ${isShop ? 'bg-purple-50 text-purple-800 border border-purple-200' : 'bg-teal-50 text-teal-800 border border-teal-200'}" title="${m.directed_type || 'Directed'}">
            ${isShop ? '🔨' : '📍'} ${m.directed_to}
          </span>
          <button onclick="openDirectMinuteModal('${m.id}')" class="text-slate-400 hover:text-amber-700 p-0.5 rounded hover:bg-amber-50 text-[10px] cursor-pointer" title="Re-direct / Change Location">
            ✏️
          </button>
        </div>
      `;
    }

    return `
      <tr class="hover:bg-slate-50/80 transition-colors">
        <td class="py-3 px-4">
          <div class="flex items-center gap-1.5">
            <span class="font-mono font-black text-teal-900 text-xs tracking-tight">${m.ref_no}</span>
            <button onclick="navigator.clipboard.writeText('${m.ref_no}'); showToast('Register Ref No Copied!', 'success');" class="text-slate-400 hover:text-slate-700 text-[10px] p-1 rounded hover:bg-slate-200 cursor-pointer" title="Copy Reference Number">
              📋
            </button>
          </div>
          <span class="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold border ${priorityColor}">
            ${m.priority || "Normal"}
          </span>
        </td>
        <td class="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
          ${m.date_received || "—"}
        </td>
        <td class="py-3 px-4 font-bold text-slate-800">
          ${m.end_user}
        </td>
        <td class="py-3 px-3 whitespace-nowrap">
          ${contactsHtml}
        </td>
        <td class="py-3 px-4 max-w-xs">
          <p class="font-semibold text-slate-800 truncate" title="${m.subject}">${m.subject}</p>
          ${m.description ? `<p class="text-[11px] text-slate-500 line-clamp-1">${m.description}</p>` : ""}
        </td>
        <td class="py-3 px-3 whitespace-nowrap">
          ${directedHtml}
        </td>
        <td class="py-3 px-3 whitespace-nowrap">
          ${estBadge}
        </td>
        <td class="py-3 px-3 whitespace-nowrap">
          ${jcBadge}
        </td>
        <td class="py-3 px-4 whitespace-nowrap">
          <div class="flex flex-col gap-1">
            <span class="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-[10px] font-extrabold border shadow-2xs ${posCfg.bg}">
              ${posCfg.label}
            </span>
            <div class="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
              <div class="bg-teal-600 h-full rounded-full" style="width: ${(posCfg.step / 6) * 100}%"></div>
            </div>
          </div>
        </td>
        <td class="py-3 px-4 text-center whitespace-nowrap">
          <div class="flex items-center justify-center gap-1.5">
            <button onclick="openDirectMinuteModal('${m.id}')" class="px-2.5 py-1.5 rounded-lg text-[11px] font-black bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 transition-all cursor-pointer flex items-center gap-1 shadow-2xs" title="Direct Minute to Zone / Location">
              <span>📍</span> Direct
            </button>
            <button onclick="openUpdatePositionModal('${m.id}')" class="px-2 py-1.5 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all cursor-pointer flex items-center gap-1" title="Update Present Position & Movement Log">
              <span>🔄</span> Position
            </button>
            <button onclick="openMinuteSlipModal('${m.id}')" class="px-2 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-all cursor-pointer" title="Print End-User Slip">
              🧾 Slip
            </button>
            <button onclick="createMinuteSheetFromJobMinute('${m.id}')" class="px-2 py-1.5 rounded-lg text-[11px] font-bold bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-all cursor-pointer" title="Build Official Minute Sheet">
              ✍️ Minute
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function filterJobMinutesList() {
  renderJobMinutesTable();
}

// Calculate Next Sequential Minute Number (Format: CCED/A/MM/XXXX/YY)
function calculateNextMinuteSeqNo() {
  let maxSeq = 2214; // Default starting sequence as requested by user
  (store.jobMinutes || []).forEach((m) => {
    if (m.ref_no) {
      const match = m.ref_no.match(/CCED\/A\/\d{2}\/(\d+)\/\d{2}/i) || m.ref_no.match(/\/(\d{3,6})\//);
      if (match) {
        const n = parseInt(match[1], 10);
        if (!isNaN(n) && n > maxSeq) maxSeq = n;
      }
    }
  });
  return String(maxSeq + 1);
}

// Dynamically construct and update Minute Reference Display
function updateFullMinuteRefDisplay() {
  const dateVal = document.getElementById("njmDateReceived")?.value || getLocalDateString();
  const d = new Date(dateVal);
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const yr = String(d.getFullYear()).slice(-2);

  const seqInp = document.getElementById("njmSeqNumber");
  let seq = seqInp ? seqInp.value.trim() : "";
  if (!seq) seq = "2215";

  const prefix = `CCED/A/${mo}/`;
  const suffix = `/${yr}`;
  const fullRef = `${prefix}${seq}${suffix}`;

  const prefixEl = document.getElementById("njmRefPrefix");
  const suffixEl = document.getElementById("njmRefSuffix");
  const fullPreviewEl = document.getElementById("njmFullRefPreview");
  const hiddenDisp = document.getElementById("njmRefNumberDisplay");

  if (prefixEl) prefixEl.textContent = prefix;
  if (suffixEl) suffixEl.textContent = suffix;
  if (fullPreviewEl) fullPreviewEl.textContent = fullRef;
  if (hiddenDisp) hiddenDisp.value = fullRef;

  return fullRef;
}

function onMinuteDateChange(val) {
  updateFullMinuteRefDisplay();
}

// Generate Next Sequential Minute Ref No fallback
function generateNextMinuteRefNo() {
  const seq = calculateNextMinuteSeqNo();
  const now = new Date();
  const mo = String(now.getMonth() + 1).padStart(2, "0");
  const yr = String(now.getFullYear()).slice(-2);
  return `CCED/A/${mo}/${seq}/${yr}`;
}

// Open New Job Minute Registration Modal
function openNewJobMinuteModal() {
  initDocumentsSystem();

  const dateInput = document.getElementById("njmDateReceived");
  if (dateInput) dateInput.value = getLocalDateString();

  const seqInput = document.getElementById("njmSeqNumber");
  if (seqInput) seqInput.value = calculateNextMinuteSeqNo();

  updateFullMinuteRefDisplay();

  const endUserInput = document.getElementById("njmEndUser");
  if (endUserInput) endUserInput.value = "";
  const contact1Input = document.getElementById("njmContact1");
  if (contact1Input) contact1Input.value = "";
  const contact2Input = document.getElementById("njmContact2");
  if (contact2Input) contact2Input.value = "";
  const whatsappInput = document.getElementById("njmWhatsapp");
  if (whatsappInput) whatsappInput.value = "";
  const subInput = document.getElementById("njmSubject");
  if (subInput) subInput.value = "";
  const descInput = document.getElementById("njmDescription");
  if (descInput) descInput.value = "";

  const modal = document.getElementById("newJobMinuteModal");
  if (modal) modal.classList.remove("hidden");
}

// Save New Job Minute Record
function saveNewJobMinuteRecord() {
  const fullRef = updateFullMinuteRefDisplay();
  const dateReceived = document.getElementById("njmDateReceived")?.value || getLocalDateString();
  const endUser = document.getElementById("njmEndUser")?.value || "End User";
  const contact1 = document.getElementById("njmContact1")?.value || "";
  const contact2 = document.getElementById("njmContact2")?.value || "";
  const whatsapp = document.getElementById("njmWhatsapp")?.value || "";
  const subject = document.getElementById("njmSubject")?.value || "Civil Maintenance Request";
  const description = document.getElementById("njmDescription")?.value || "";

  const newId = `min_${Date.now()}`;
  const newRecord = {
    id: newId,
    ref_no: fullRef,
    date_received: dateReceived,
    end_user: endUser,
    contact_1: contact1,
    contact_2: contact2,
    whatsapp: whatsapp,
    subject: subject,
    description: description,
    directed_type: "Central Registry",
    directed_to: "Civil Engineering Department",
    priority: "Normal",
    position: "RECEIVED",
    linked_estimate_id: "",
    linked_job_number: "",
    position_trail: [
      {
        date: dateReceived,
        officer: `Registered by ${store.activeProfileName || "Planning Desk"}`,
        position: "RECEIVED",
        remarks: "Logged in Minute Sheet Register"
      }
    ],
    created_at: new Date().toISOString()
  };

  store.jobMinutes.unshift(newRecord);
  saveJobMinutesToStorage();
  closeModal("newJobMinuteModal");
  updateDocumentsMetricStats();
  renderJobMinutesTable();

  // If in estimates view, refresh incoming banner
  renderIncomingJobMinutesInEstimates();

  showToast(`Minute Sheet ${fullRef} registered successfully!`, "success");
  openMinuteSlipModal(newId);
}

// =============================================================================
// ESTIMATE SECTION INTEGRATION: INCOMING JOB MINUTES BANNER & AUTO-FILL
// =============================================================================

function isMinuteMatchingCurrentZone(m, currentZone) {
  if (!m) return false;
  if (store.activeProfileType === "OIC" || !currentZone || currentZone === "All" || currentZone === "All Zones") {
    return true;
  }

  const dirTo = (m.directed_to || "").toLowerCase().trim();
  if (!dirTo || dirTo === "unassigned" || dirTo === "civil engineering department") {
    return true; // Central minutes show everywhere
  }

  const cleanDir = dirTo.replace(/[^a-z0-9]/g, "");
  const cleanCurr = (currentZone || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  if (cleanDir.includes(cleanCurr) || cleanCurr.includes(cleanDir)) return true;

  const prefixes = ["azone", "bzone", "czone", "dzone", "ezone", "gzone", "fh", "mainstore", "carpentry", "welding", "electrical", "water", "mt", "masonry"];
  for (const p of prefixes) {
    if (cleanDir.includes(p) && cleanCurr.includes(p)) return true;
  }

  return false;
}

function renderIncomingJobMinutesInEstimates() {
  const banner = document.getElementById("incomingMinutesEstimateBanner");
  if (!banner) return;

  initDocumentsSystem();
  const currentZone = store.currentZone || "A-Zone";

  // Filter minutes directed to the current zone or for estimation
  const incoming = (store.jobMinutes || []).filter((m) => {
    const isPending = m.position !== "COMPLETED" && m.position !== "ARCHIVED";
    const matchesZone = isMinuteMatchingCurrentZone(m, currentZone);
    return isPending && matchesZone;
  });

  if (incoming.length === 0) {
    banner.innerHTML = "";
    banner.classList.add("hidden");
    return;
  }

  banner.classList.remove("hidden");
  banner.innerHTML = `
    <div class="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-4 text-white shadow-xl border border-teal-500/40 space-y-3">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-lg shadow-inner">
            📥
          </div>
          <div>
            <h4 class="font-black text-sm text-teal-100 flex items-center gap-2">
              Incoming Job Minutes for ${currentZone}
              <span class="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black tracking-wide animate-pulse">${incoming.length} Pending Estimation</span>
            </h4>
            <p class="text-[11px] text-teal-200/80">Directed from Document Management for Estimation & Scope Assessment</p>
          </div>
        </div>
        <button type="button" onclick="openNewEstimateModal()" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5">
          <span>+</span> Create Blank Estimate
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
        ${incoming.map((m) => {
          const isUnderEst = m.position === "ESTIMATION";
          const priorityBadge = m.priority === "Emergency"
            ? "bg-rose-500/30 text-rose-200 border-rose-400"
            : m.priority === "High"
            ? "bg-amber-500/30 text-amber-200 border-amber-400"
            : "bg-teal-500/20 text-teal-300 border-teal-500/40";

          return `
            <div class="bg-slate-950/60 backdrop-blur-md p-3.5 rounded-xl border border-teal-500/30 space-y-2.5 flex flex-col justify-between hover:border-teal-400/60 transition-all shadow-md">
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="font-mono font-black text-amber-300 text-xs">${m.ref_no}</span>
                  <span class="text-[9px] px-2 py-0.5 rounded-full font-bold border ${priorityBadge}">${m.priority || "Normal"}</span>
                </div>
                <p class="text-xs font-bold text-white truncate" title="${m.end_user}">👤 ${m.end_user}</p>
                <p class="text-[11px] text-slate-300 line-clamp-2" title="${m.subject}">📝 ${m.subject}</p>
                <div class="flex items-center gap-1 text-[10px] text-teal-300">
                  <span>📍 Directed:</span>
                  <span class="font-bold text-white bg-teal-900/60 px-1.5 py-0.5 rounded border border-teal-700/50">${m.directed_to || 'Central Desk'}</span>
                </div>
              </div>

              <div class="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                <span class="text-[10px] text-slate-400 font-mono">
                  ${m.date_received || ""}
                </span>
                <button type="button" onclick="createEstimateFromIncomingMinute('${m.id}')" class="px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 transition-all cursor-pointer flex items-center gap-1.5 shadow-md transform active:scale-95">
                  <span>📐</span> ${m.linked_estimate_id ? "View/Edit Estimate" : "Prepare Estimate"}
                </button>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

// Create Estimate directly from Incoming Job Minute
function createEstimateFromIncomingMinute(minuteId) {
  openNewEstimateModal();
  autoFillEstimateFromMinute(minuteId);
}

// Populate Incoming Minutes dropdown inside New Estimate Modal
function populateIncomingMinutesInEstimateModal() {
  const select = document.getElementById("estLinkJobMinuteSelect");
  if (!select) return;

  initDocumentsSystem();
  const currentZone = store.currentZone || "A-Zone";

  const minutes = (store.jobMinutes || []).filter((m) => isMinuteMatchingCurrentZone(m, currentZone));

  select.innerHTML = `<option value="">-- Choose Incoming Minute to Auto-fill (${currentZone}) --</option>` +
    minutes.map((m) => `<option value="${m.id}">${m.ref_no} • ${m.end_user} - ${m.subject}</option>`).join("");
}

// Auto-fill Estimate Modal Fields from selected Job Minute
function autoFillEstimateFromMinute(minuteId) {
  if (!minuteId) return;

  const minute = (store.jobMinutes || []).find((m) => m.id === minuteId);
  if (!minute) return;

  const descInput = document.getElementById("estDescription");
  if (descInput) descInput.value = `${minute.subject} (${minute.end_user})`;

  const refTypeSelect = document.getElementById("estRefType");
  if (refTypeSelect) refTypeSelect.value = "Minute Sheet";

  const refInput = document.getElementById("estReference");
  if (refInput) refInput.value = minute.ref_no;

  const endUserInput = document.getElementById("estEndUser");
  if (endUserInput) endUserInput.value = minute.end_user;

  const locInput = document.getElementById("estLocation");
  if (locInput) locInput.value = minute.end_user;

  const select = document.getElementById("estLinkJobMinuteSelect");
  if (select) select.value = minute.id;

  showToast(`Auto-filled from ${minute.ref_no}!`, "success");
}

// Link Estimate to Job Minute when Estimate is saved
function linkEstimateToJobMinute(estimateNumber, minuteRefNo) {
  if (!minuteRefNo) return;
  initDocumentsSystem();

  const minute = (store.jobMinutes || []).find((m) => m.ref_no === minuteRefNo || m.id === minuteRefNo);
  if (!minute) return;

  minute.linked_estimate_id = estimateNumber;
  if (minute.position === "RECEIVED") {
    minute.position = "ESTIMATION";
  }

  if (!minute.position_trail) minute.position_trail = [];
  minute.position_trail.push({
    date: getLocalDateString(),
    officer: `Estimated by ${store.activeProfileName || "Planning Desk"}`,
    position: minute.position,
    remarks: `Estimate ${estimateNumber} created in ${store.currentZone}`
  });

  saveJobMinutesToStorage();
}

// ── Render Incoming Job Minutes Banner in Job Cards View ──
function renderIncomingJobMinutesInJobCards() {
  // Job cards are created with Work Orders; no incoming minute banner needed in Job Cards view
  const banner = document.getElementById("incomingMinutesJobCardsBanner");
  if (banner) {
    banner.innerHTML = "";
    banner.classList.add("hidden");
  }
}

// Populate Incoming Minutes dropdown inside New Work Order / Job Card Modal
function populateIncomingMinutesInWorkOrderModal() {
  const select = document.getElementById("woIncomingMinuteSelect");
  if (!select) return;

  initDocumentsSystem();
  const currentZone = store.currentZone || "A-Zone";

  const minutes = (store.jobMinutes || []).filter((m) => {
    return m.directed_to === currentZone ||
           (m.directed_type === "Zone for Maintenance" && (!m.directed_to || m.directed_to === currentZone)) ||
           (m.directed_type === "Workshop for Job" && m.directed_to === currentZone);
  });

  select.innerHTML = `<option value="">-- Choose Incoming Minute Sheet (${currentZone}) --</option>` +
    minutes.map((m) => `<option value="${m.id}">${m.ref_no} • ${m.end_user} - ${m.subject}</option>`).join("");
}

// Auto-fill Work Order / Job Card Modal from Selected Minute
function autoFillWorkOrderFromMinute(minuteId) {
  if (!minuteId) return;

  const minute = (store.jobMinutes || []).find((m) => m.id === minuteId);
  if (!minute) return;

  _woLinkedJobMinuteId = minute.id;

  const refType = document.getElementById("woRefType");
  if (refType) refType.value = "Minute Sheet";

  const refInput = document.getElementById("woReference");
  if (refInput) refInput.value = minute.ref_no;

  const descInput = document.getElementById("woDescription");
  if (descInput) {
    descInput.value = `${minute.subject}\n\n${minute.description || ""}`.trim();
  }

  const authInput = document.getElementById("woAuthority");
  if (authInput && !authInput.value) {
    authInput.value = minute.end_user || "CE";
  }

  // If minute already has a linked estimate, select it
  if (minute.linked_estimate_id) {
    const estSelect = document.getElementById("woEstimateSelect");
    if (estSelect) {
      const match = Array.from(estSelect.options).find((o) => o.text.includes(minute.linked_estimate_id) || o.value.includes(minute.linked_estimate_id));
      if (match) {
        estSelect.value = match.value;
        if (typeof autofillFromEstimate === "function") {
          autofillFromEstimate(match.value);
        }
      }
    }
  }

  showToast(`Auto-filled Job Card from ${minute.ref_no}`, "success");
}

// 1-Click Launch Work Order / Job Card Modal from Incoming Minute
function createJobCardFromIncomingMinute(minuteId) {
  openNewWorkOrderModal();
  const select = document.getElementById("woIncomingMinuteSelect");
  if (select) select.value = minuteId;
  autoFillWorkOrderFromMinute(minuteId);
}

// Link Job Card to Job Minute when Job Card is created
function linkJobCardToJobMinute(minuteIdOrRef, jobNumber) {
  if (!minuteIdOrRef || !jobNumber) return;
  initDocumentsSystem();

  const minute = (store.jobMinutes || []).find((m) => m.id === minuteIdOrRef || m.ref_no === minuteIdOrRef);
  if (!minute) return;

  minute.linked_job_number = jobNumber;
  if (minute.position === "RECEIVED" || minute.position === "ESTIMATION" || minute.position === "APPROVAL") {
    minute.position = "ASSIGNED";
  }

  if (!minute.position_trail) minute.position_trail = [];
  minute.position_trail.push({
    date: getLocalDateString(),
    officer: `${store.activeProfileName || "In-Charge"} (${store.currentZone || "Zone"})`,
    position: "ASSIGNED",
    remarks: `Job Card ${jobNumber} created in ${store.currentZone || "Zone"}`
  });

  saveJobMinutesToStorage();
}

// ── Direct Minute Sheet to Zone / Workshop / Location Workflow ──
function onDirectTypeChange() {
  const typeSelect = document.getElementById("dirTargetType");
  const targetSelect = document.getElementById("dirTargetLocation");
  if (!typeSelect || !targetSelect) return;

  const type = typeSelect.value;
  const { defaultZones, defaultWorkshops } = getAllSystemZonesAndWorkshops();
  let options = "";

  if (type === "Maintenance Zone") {
    options = defaultZones.map((z) => `<option value="${z.id}">${z.name}</option>`).join("");
  } else if (type === "Workshop for Execution") {
    options = defaultWorkshops.map((w) => `<option value="${w.id}">${w.name}</option>`).join("");
  } else if (type === "Administrative / Planning Desk") {
    options = `
      <option value="Civil Planning Desk">Civil Planning Desk (සැලසුම් අංශය)</option>
      <option value="Deputy Chief Engineer (DCE)">Deputy Chief Engineer (DCE)</option>
      <option value="Chief Engineer (CE)">Chief Engineer (CE)</option>
      <option value="Admin & Establishment">Admin & Establishment</option>
    `;
  } else {
    options = `
      <option value="Executive Officer (Dockyard)">Executive Officer (Dockyard)</option>
      <option value="Base Supply Officer">Base Supply Officer</option>
      <option value="Commanding Officer">Commanding Officer</option>
      <option value="Other Relevant Desk">Other Relevant Desk</option>
    `;
  }

  targetSelect.innerHTML = options;
}

function openDirectMinuteModal(minuteId) {
  initDocumentsSystem();
  const minute = (store.jobMinutes || []).find((m) => m.id === minuteId);
  if (!minute) return;

  const idInput = document.getElementById("dirMinuteId");
  const refDisp = document.getElementById("dirMinuteRefDisp");
  const subDisp = document.getElementById("dirMinuteSubjectDisp");
  const euDisp = document.getElementById("dirMinuteEndUserDisp");
  const offInput = document.getElementById("dirOfficer");
  const remInput = document.getElementById("dirRemarks");
  const posSelect = document.getElementById("dirNewPosition");
  const typeSelect = document.getElementById("dirTargetType");

  if (idInput) idInput.value = minute.id;
  if (refDisp) refDisp.textContent = minute.ref_no;
  if (subDisp) subDisp.textContent = `Subject: ${minute.subject}`;
  if (euDisp) euDisp.textContent = `End User: ${minute.end_user}`;
  if (offInput) offInput.value = store.activeProfileName || "Planning Desk";
  if (remInput) remInput.value = "";
  if (posSelect) {
    posSelect.value = (minute.position === "RECEIVED" ? "ESTIMATION" : minute.position);
  }

  if (typeSelect) {
    if ((minute.directed_type || "").includes("Workshop")) {
      typeSelect.value = "Workshop for Execution";
    } else {
      typeSelect.value = "Maintenance Zone";
    }
  }

  onDirectTypeChange();

  const targetSelect = document.getElementById("dirTargetLocation");
  if (targetSelect && minute.directed_to && minute.directed_to !== "Civil Engineering Department") {
    targetSelect.value = minute.directed_to;
  }

  const modal = document.getElementById("directMinuteModal");
  if (modal) modal.classList.remove("hidden");
}

function saveDirectMinuteRecord() {
  const minuteId = document.getElementById("dirMinuteId")?.value;
  const minute = (store.jobMinutes || []).find((m) => m.id === minuteId);
  if (!minute) return;

  const targetType = document.getElementById("dirTargetType")?.value || "Maintenance Zone";
  const targetLocation = document.getElementById("dirTargetLocation")?.value || "A-Zone";
  const newPos = document.getElementById("dirNewPosition")?.value || "ESTIMATION";
  const officer = document.getElementById("dirOfficer")?.value || store.activeProfileName || "Planning Desk";
  const remarks = document.getElementById("dirRemarks")?.value || "";

  minute.directed_type = targetType;
  minute.directed_to = targetLocation;
  minute.position = newPos;

  if (!minute.position_trail) minute.position_trail = [];
  minute.position_trail.push({
    date: getLocalDateString(),
    officer: officer,
    position: newPos,
    remarks: `Directed to ${targetLocation} (${targetType})${remarks ? ': ' + remarks : ''}`
  });

  saveJobMinutesToStorage();
  closeModal("directMinuteModal");
  updateDocumentsMetricStats();
  renderJobMinutesTable();

  // If in estimates view, refresh incoming banner
  renderIncomingJobMinutesInEstimates();

  showToast(`Minute ${minute.ref_no} successfully directed to ${targetLocation}!`, "success");
}

// Open Update Present Position Modal
function openUpdatePositionModal(minuteId) {
  const minute = (store.jobMinutes || []).find((m) => m.id === minuteId);
  if (!minute) return;

  const idInput = document.getElementById("uppMinuteId");
  if (idInput) idInput.value = minute.id;

  const titleEl = document.getElementById("uppMinuteRefTitle");
  if (titleEl) titleEl.textContent = `${minute.ref_no} • ${minute.end_user}`;

  const posSelect = document.getElementById("uppNewPosition");
  if (posSelect) posSelect.value = minute.position || "RECEIVED";

  const dateInput = document.getElementById("uppDate");
  if (dateInput) dateInput.value = getLocalDateString();

  const officerInput = document.getElementById("uppOfficer");
  if (officerInput) officerInput.value = "";

  const remarksInput = document.getElementById("uppRemarks");
  if (remarksInput) remarksInput.value = "";

  // Render Trail
  const trailContainer = document.getElementById("uppTrailContainer");
  if (trailContainer) {
    const trail = minute.position_trail || [];
    if (trail.length === 0) {
      trailContainer.innerHTML = `<p class="text-slate-400 italic text-[11px]">No history trail logged yet.</p>`;
    } else {
      trailContainer.innerHTML = trail.map((t) => {
        const cfg = MINUTE_POSITION_CONFIG[t.position] || MINUTE_POSITION_CONFIG.RECEIVED;
        return `
          <div class="p-2 bg-slate-50 border border-slate-200 rounded-lg space-y-0.5">
            <div class="flex items-center justify-between">
              <span class="font-bold text-[10px] ${cfg.bg} px-1.5 py-0.5 rounded">${cfg.label}</span>
              <span class="text-[10px] text-slate-400 font-mono">${t.date}</span>
            </div>
            <p class="text-[11px] font-semibold text-slate-700">${t.officer || "Officer / Desk"}</p>
            ${t.remarks ? `<p class="text-[10px] text-slate-500 italic">${t.remarks}</p>` : ""}
          </div>
        `;
      }).join("");
    }
  }

  const modal = document.getElementById("updatePositionModal");
  if (modal) modal.classList.remove("hidden");
}

// Save Updated Present Position
function saveUpdatedPresentPosition() {
  const minuteId = document.getElementById("uppMinuteId")?.value;
  const minute = (store.jobMinutes || []).find((m) => m.id === minuteId);
  if (!minute) return;

  const newPos = document.getElementById("uppNewPosition")?.value || "RECEIVED";
  const date = document.getElementById("uppDate")?.value || getLocalDateString();
  const officer = document.getElementById("uppOfficer")?.value || "Planning Desk";
  const remarks = document.getElementById("uppRemarks")?.value || "Position updated";

  minute.position = newPos;
  if (!minute.position_trail) minute.position_trail = [];
  minute.position_trail.push({
    date: date,
    officer: officer,
    position: newPos,
    remarks: remarks
  });

  saveJobMinutesToStorage();
  closeModal("updatePositionModal");
  updateDocumentsMetricStats();
  renderJobMinutesTable();

  showToast(`Present position updated to ${MINUTE_POSITION_CONFIG[newPos]?.label || newPos}`, "success");
}

// Open Printable End-User Minute Tracking Slip Modal
function openMinuteSlipModal(minuteId) {
  const minute = (store.jobMinutes || []).find((m) => m.id === minuteId);
  if (!minute) return;

  const slipArea = document.getElementById("minuteSlipPrintArea");
  if (slipArea) {
    slipArea.innerHTML = `
      <div class="text-center border-b border-slate-300 pb-2 space-y-0.5">
        <p class="text-[10px] font-bold uppercase tracking-widest text-slate-500">Sri Lanka Navy • Civil Engineering Directorate</p>
        <h3 class="text-sm font-black text-slate-900 uppercase">JOB MINUTE ACKNOWLEDGEMENT & TRACKING SLIP</h3>
        <p class="text-[11px] font-mono font-bold text-teal-800">${minute.ref_no}</p>
      </div>

      <div class="divide-y divide-slate-200 text-xs py-1 space-y-1.5">
        <div class="flex justify-between pt-1">
          <span class="text-slate-500 font-medium">Date Received:</span>
          <span class="font-bold text-slate-800 font-mono">${minute.date_received}</span>
        </div>
        <div class="flex justify-between pt-1">
          <span class="text-slate-500 font-medium">End User / Department:</span>
          <span class="font-bold text-slate-800">${minute.end_user}</span>
        </div>
        ${(minute.contact_1 || minute.contact_2 || minute.whatsapp) ? `
        <div class="flex justify-between pt-1">
          <span class="text-slate-500 font-medium">Contact & WhatsApp:</span>
          <span class="font-mono text-slate-800 font-bold">
            ${[minute.contact_1, minute.contact_2].filter(Boolean).join(" / ") || "—"}
            ${minute.whatsapp ? ` • 💬 WA: ${minute.whatsapp}` : ""}
          </span>
        </div>` : ""}
        <div class="flex justify-between pt-1">
          <span class="text-slate-500 font-medium">Subject / Scope:</span>
          <span class="font-bold text-slate-800 text-right max-w-xs">${minute.subject}</span>
        </div>
        <div class="flex justify-between pt-1">
          <span class="text-slate-500 font-medium">Current Status:</span>
          <span class="font-bold text-teal-700">${MINUTE_POSITION_CONFIG[minute.position]?.label || minute.position}</span>
        </div>
        ${minute.linked_job_number ? `
        <div class="flex justify-between pt-1">
          <span class="text-slate-500 font-medium">Assigned Job Card:</span>
          <span class="font-bold text-purple-700 font-mono">${minute.linked_job_number}</span>
        </div>` : ""}
      </div>

      <div class="bg-teal-50 p-2.5 rounded-lg border border-teal-200 text-[10px] text-teal-900 space-y-1">
        <p class="font-bold">📌 Instructions for End User:</p>
        <p>Please quote tracking number <strong>${minute.ref_no}</strong> for all inquiries regarding the progress of this task.</p>
      </div>

      <div class="pt-6 grid grid-cols-2 text-center text-[10px] text-slate-500">
        <div>
          <div class="border-t border-slate-400 w-28 mx-auto pt-1 font-bold text-slate-700">Receiving Officer</div>
          <p>Civil Planning Section</p>
        </div>
        <div>
          <div class="border-t border-slate-400 w-28 mx-auto pt-1 font-bold text-slate-700">End User Handover</div>
          <p>${minute.end_user}</p>
        </div>
      </div>
    `;
  }

  const modal = document.getElementById("minuteSlipModal");
  if (modal) modal.classList.remove("hidden");
}

// Language Switcher for Minute Sheet Creator
function setMinuteSheetLanguage(lang = "si") {
  store.msLanguage = lang;

  const btnSi = document.getElementById("btnMsLangSinhala");
  const btnEn = document.getElementById("btnMsLangEnglish");

  if (lang === "si") {
    if (btnSi) btnSi.className = "px-3 py-1 rounded-lg font-bold bg-teal-600 text-white shadow-xs transition-all cursor-pointer";
    if (btnEn) btnEn.className = "px-3 py-1 rounded-lg font-medium text-slate-600 hover:text-slate-900 transition-all cursor-pointer";

    // Set Sinhala labels
    const lblRef = document.getElementById("lblMsRefNo");
    if (lblRef) lblRef.textContent = "File Ref (Optional Tracking)";
    const lblDate = document.getElementById("lblMsDate");
    if (lblDate) lblDate.textContent = "Date (දිනය)";
    const lblSub = document.getElementById("lblMsSubject");
    if (lblSub) lblSub.textContent = "Subject (විෂයය)";
    const lblAdd = document.getElementById("lblMsAddressees");
    if (lblAdd) lblAdd.textContent = "Addressee(s) (යොමුවන පාර්ශ්ව)";
    const lblOri = document.getElementById("lblMsOriginator");
    if (lblOri) lblOri.textContent = "Originating Officer / Appointment (Red Area)";
    const lblM01 = document.getElementById("lblMsM01Header");
    if (lblM01) lblM01.textContent = "M-01 (මා.ස 01) Details";
    const lblM02 = document.getElementById("lblMsM02Toggle");
    if (lblM02) lblM02.textContent = "Include Minute 02 (මා.ස 02 Endorsement)";

    // Update Date to Sinhala if default
    const dateInput = document.getElementById("msInputDate");
    if (dateInput && (!dateInput.value || dateInput.value.includes("2026") || dateInput.value.includes("Aug"))) {
      dateInput.value = getSinhalaDateString();
    }
  } else {
    if (btnEn) btnEn.className = "px-3 py-1 rounded-lg font-bold bg-teal-600 text-white shadow-xs transition-all cursor-pointer";
    if (btnSi) btnSi.className = "px-3 py-1 rounded-lg font-medium text-slate-600 hover:text-slate-900 transition-all cursor-pointer";

    // Set English labels
    const lblRef = document.getElementById("lblMsRefNo");
    if (lblRef) lblRef.textContent = "File Ref (Optional Tracking)";
    const lblDate = document.getElementById("lblMsDate");
    if (lblDate) lblDate.textContent = "Date";
    const lblSub = document.getElementById("lblMsSubject");
    if (lblSub) lblSub.textContent = "Subject";
    const lblAdd = document.getElementById("lblMsAddressees");
    if (lblAdd) lblAdd.textContent = "Addressee(s)";
    const lblOri = document.getElementById("lblMsOriginator");
    if (lblOri) lblOri.textContent = "Originating Officer / Appointment";
    const lblM01 = document.getElementById("lblMsM01Header");
    if (lblM01) lblM01.textContent = "M-01 Details";
    const lblM02 = document.getElementById("lblMsM02Toggle");
    if (lblM02) lblM02.textContent = "Include Minute 02 (M-02 Endorsement)";

    // Update Date to English if default
    const dateInput = document.getElementById("msInputDate");
    if (dateInput && (!dateInput.value || dateInput.value.includes("මස"))) {
      dateInput.value = getEnglishNavalDateString();
    }
  }

  populateMinuteSheetDropdowns();
  updateMinuteSheetPreview();
}

// Margin Width Slider & Presets (Adjust Yellow Highlight Line from Pic 1)
store.msMarginWidth = store.msMarginWidth || 28;
store.msRightMargin = store.msRightMargin || 14;
store.msPaperSize = store.msPaperSize || "a4";

function setMinuteMarginWidth(val) {
  const num = parseInt(val, 10) || 28;
  store.msMarginWidth = Math.max(15, Math.min(45, num));
  
  const slider = document.getElementById("msInputMarginWidth");
  if (slider) slider.value = store.msMarginWidth;

  const display = document.getElementById("msMarginWidthDisplay");
  if (display) display.textContent = `${store.msMarginWidth}%`;

  updateMinuteSheetPreview();
}

function setMinuteRightMargin(val) {
  const num = parseInt(val, 10) || 14;
  store.msRightMargin = Math.max(4, Math.min(50, num));
  
  const slider = document.getElementById("msInputRightMargin");
  if (slider) slider.value = store.msRightMargin;

  const display = document.getElementById("msRightMarginDisplay");
  if (display) display.textContent = `${store.msRightMargin}px`;

  updateMinuteSheetPreview();
}

store.msFontFamily = store.msFontFamily || "serif";
store.msFontSize = store.msFontSize || 12;

function setMinuteFontFamily(val) {
  store.msFontFamily = val || "serif";
  const select = document.getElementById("msInputFontFamily");
  if (select) select.value = store.msFontFamily;
  updateMinuteSheetPreview();
}

function setMinuteFontSize(val) {
  const num = parseInt(val, 10) || 12;
  store.msFontSize = Math.max(9, Math.min(18, num));
  const slider = document.getElementById("msInputFontSize");
  if (slider) slider.value = store.msFontSize;
  const display = document.getElementById("msFontSizeDisplay");
  if (display) display.textContent = `${store.msFontSize}px`;
  updateMinuteSheetPreview();
}

function setMinutePaperSize(size) {
  store.msPaperSize = size === "letter" ? "letter" : "a4";

  const btnA4 = document.getElementById("btnPaperA4");
  const btnLetter = document.getElementById("btnPaperLetter");
  const title = document.getElementById("msPreviewPaperTitle");

  if (store.msPaperSize === "letter") {
    if (btnLetter) {
      btnLetter.className = "px-2 py-0.5 rounded bg-teal-600 text-white shadow-2xs font-bold";
    }
    if (btnA4) {
      btnA4.className = "px-2 py-0.5 rounded text-slate-600 hover:text-slate-900 font-medium";
    }
    if (title) title.textContent = "Letter Size Minute Paper View";
  } else {
    if (btnA4) {
      btnA4.className = "px-2 py-0.5 rounded bg-teal-600 text-white shadow-2xs font-bold";
    }
    if (btnLetter) {
      btnLetter.className = "px-2 py-0.5 rounded text-slate-600 hover:text-slate-900 font-medium";
    }
    if (title) title.textContent = "A4 Naval Minute Paper View";
  }

  updateMinuteSheetPreview();
}

// ── Populate Minute Sheet Quick Select Dropdowns from Settings ──
function populateMinuteSheetDropdowns() {
  const lang = store.msLanguage || "si";
  const cfg = (store.settings && store.settings.minuteConfig) || defaultSettings.minuteConfig;

  // 1. Templates
  const tplSelect = document.getElementById("msSelectTemplate");
  if (tplSelect) {
    const templates = store.minuteTemplates || DEFAULT_NAVAL_MINUTE_TEMPLATES;
    tplSelect.innerHTML = `<option value="">-- Choose Template (${lang === "si" ? "සිංහල" : "English"}) --</option>` +
      templates.map((t) => {
        const flag = t.lang === "si" ? "🇱🇰 [සිංහල]" : "🇬🇧 [English]";
        return `<option value="${t.id}">${flag} ${t.title}</option>`;
      }).join("");
  }

  // 2. Sailors (for Leave Extension etc. - Search by Off No or Name)
  const sailorSelect = document.getElementById("msSelectSailor");
  const sailorDatalist = document.getElementById("msSailorsDatalist");
  const sailors = store.sailors || [];

  if (sailorDatalist) {
    sailorDatalist.innerHTML = sailors.map((s) => `
      <option value="${s.official_number} - ${s.rank || ''} ${s.name || ''}"></option>
      <option value="${s.name || ''} (${s.official_number})"></option>
    `).join("");
  }

  if (sailorSelect) {
    sailorSelect.innerHTML = `<option value="">-- Or select from list (${sailors.length} sailors) --</option>` +
      sailors.map((s) => `<option value="${s.id || s.official_number}">${s.official_number || ""} • ${s.rank || ""} ${s.name || s.initials || "Sailor"}</option>`).join("");
  }

  // 3. Addressees Dropdown
  const addSelect = document.getElementById("msAddresseeQuickSelect");
  if (addSelect) {
    const list = lang === "si" ? (cfg.addressees_si || []) : (cfg.addressees_en || []);
    addSelect.innerHTML = `<option value="">+ Choose Address from Settings</option>` +
      list.map((item) => `<option value="${item.replace(/"/g, '&quot;')}">${item}</option>`).join("");
  }

  // 4. M-01 Originator Dropdown
  const oriSelect = document.getElementById("msM01OriginatorSelect");
  if (oriSelect) {
    const list = lang === "si" ? (cfg.originators_si || []) : (cfg.originators_en || []);
    oriSelect.innerHTML = `<option value="">-- Choose Originator from Settings --</option>` +
      list.map((item) => `<option value="${item.replace(/"/g, '&quot;')}">${item}</option>`).join("");
  }

  // 5. M-01 Signatory Title Dropdown (Pic 3)
  const sigSelect = document.getElementById("msSignatorySelect");
  if (sigSelect) {
    const list = lang === "si" ? (cfg.signatoryTitles_si || []) : (cfg.signatoryTitles_en || []);
    sigSelect.innerHTML = `<option value="">-- Choose Title from Settings --</option>` +
      list.map((item) => `<option value="${item.replace(/"/g, '&quot;')}">${item}</option>`).join("");
  }

  // 6. M-02 Addressee Dropdown (Pic 2)
  const m02AddSelect = document.getElementById("msM02AddresseeSelect");
  if (m02AddSelect) {
    const list = lang === "si" ? (cfg.addressees_si || []) : (cfg.addressees_en || []);
    m02AddSelect.innerHTML = `<option value="">-- Choose from Settings --</option>` +
      list.map((item) => `<option value="${item.replace(/"/g, '&quot;')}">${item}</option>`).join("");
  }

  // 7. M-02 Originator Designation Dropdown (Pic 2)
  const m02OriSelect = document.getElementById("msM02OriginatorSelect");
  if (m02OriSelect) {
    const list = lang === "si" ? (cfg.originators_si || []) : (cfg.originators_en || []);
    m02OriSelect.innerHTML = `<option value="">-- Choose from Settings --</option>` +
      list.map((item) => `<option value="${item.replace(/"/g, '&quot;')}">${item}</option>`).join("");
  }

  // 8. M-02 Signatory Title Dropdown
  const m02SigSelect = document.getElementById("msM02SignatorySelect");
  if (m02SigSelect) {
    const list = lang === "si" ? (cfg.signatoryTitles_si || []) : (cfg.signatoryTitles_en || []);
    m02SigSelect.innerHTML = `<option value="">-- Choose from Settings --</option>` +
      list.map((item) => `<option value="${item.replace(/"/g, '&quot;')}">${item}</option>`).join("");
  }

  // 9. M-02 Quick Endorsement Text Dropdown
  const m02QuickSelect = document.getElementById("msM02QuickTextSelect");
  if (m02QuickSelect) {
    const list = lang === "si" ? (cfg.endorsements_si || []) : (cfg.endorsements_en || []);
    m02QuickSelect.innerHTML = `<option value="">-- Quick Endorsement Text --</option>` +
      list.map((item) => `<option value="${item.replace(/"/g, '&quot;')}">${item}</option>`).join("");
  }

  // Refresh M-01 Last paragraph template selector
  renumberMinuteParagraphs();
}

// ── Dropdown & Multi-Box Handlers in Builder Form ──
function addMinuteAddresseeInput(initialText = "") {
  const container = document.getElementById("msAddresseesContainer");
  if (!container) return;

  const lang = store.msLanguage || "si";
  const cfg = (store.settings && store.settings.minuteConfig) || defaultSettings.minuteConfig;
  const list = lang === "si" ? (cfg.addressees_si || []) : (cfg.addressees_en || []);

  const div = document.createElement("div");
  div.className = "flex items-center gap-2 group ms-addressee-row";

  let optionsHtml = `<option value="">-- Choose Addressee / Designation --</option>`;
  let isCustom = false;
  let isMatched = false;

  list.forEach((item) => {
    const selected = (item === initialText) ? "selected" : "";
    if (item === initialText) isMatched = true;
    optionsHtml += `<option value="${item.replace(/"/g, '&quot;')}" ${selected}>${item}</option>`;
  });

  if (initialText && !isMatched) {
    isCustom = true;
    optionsHtml += `<option value="__custom__" selected>✍️ Custom: ${initialText.replace(/"/g, '&quot;')}</option>`;
  } else {
    optionsHtml += `<option value="__custom__">✍️ + Type Custom Designation...</option>`;
  }

  div.innerHTML = `
    <span class="font-bold text-amber-800 text-xs w-4 text-center">📍</span>
    <div class="flex-1 flex items-center gap-1.5">
      <select onchange="onMinuteAddresseeSelectChange(this)" class="ms-addressee-select flex-1 px-3 py-2 border border-amber-300 rounded-xl text-xs bg-amber-50/50 font-bold text-slate-800 focus:bg-white outline-none">
        ${optionsHtml}
      </select>
      <input type="text" value="${(initialText || "").replace(/"/g, '&quot;')}" placeholder="Type custom address..." oninput="updateMinuteSheetPreview()" class="ms-addressee-custom-input ${isCustom ? '' : 'hidden'} flex-1 px-3 py-2 border border-amber-300 rounded-xl text-xs bg-white text-slate-800 font-bold outline-none">
    </div>
    <button type="button" onclick="removeMinuteAddresseeRow(this, event)" class="text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg p-1.5 text-sm font-bold cursor-pointer transition-all" title="Remove Addressee">✕</button>
  `;
  container.appendChild(div);
  updateMinuteSheetPreview();
}

function onMinuteAddresseeSelectChange(selectEl) {
  const row = selectEl.closest(".ms-addressee-row") || selectEl.parentElement.parentElement;
  if (!row) return;

  const customInput = row.querySelector(".ms-addressee-custom-input");
  if (selectEl.value === "__custom__") {
    if (customInput) {
      customInput.classList.remove("hidden");
      customInput.focus();
    }
  } else {
    if (customInput) {
      customInput.classList.add("hidden");
      customInput.value = selectEl.value;
    }
  }
  updateMinuteSheetPreview();
}

function removeMinuteAddresseeRow(btn, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const row = btn.closest(".ms-addressee-row") || btn.parentElement;
  if (row) {
    row.remove();
  }
  updateMinuteSheetPreview();
}

function addAddresseeFromDropdown(val) {
  if (!val) return;
  addMinuteAddresseeInput(val);
  const sel = document.getElementById("msAddresseeQuickSelect");
  if (sel) sel.value = "";
}

function applyM01OriginatorFromSelect(val) {
  if (!val) return;
  const input = document.getElementById("msInputOriginator");
  if (input) {
    input.value = val;
    updateMinuteSheetPreview();
  }
}

function applySignatoryTitleFromSelect(val) {
  if (!val) return;
  const input = document.getElementById("msInputSignatoryTitle");
  if (input) {
    input.value = val;
    updateMinuteSheetPreview();
  }
}

function applyM02AddresseeFromSelect(val) {
  if (!val) return;
  const input = document.getElementById("msM02Addressee");
  if (input) {
    input.value = val;
    updateMinuteSheetPreview();
  }
}

function applyM02OriginatorFromSelect(val) {
  if (!val) return;
  const input = document.getElementById("msM02Originator");
  if (input) {
    input.value = val;
    updateMinuteSheetPreview();
  }
}

function applyM02SignatoryFromSelect(val) {
  if (!val) return;
  const input = document.getElementById("msM02SignTitle");
  if (input) {
    input.value = val;
    updateMinuteSheetPreview();
  }
}

// Apply Template from Dropdown
function applyMinuteTemplateFromSelect() {
  const select = document.getElementById("msSelectTemplate");
  const tplId = select ? select.value : "";
  if (!tplId) return;

  loadMinuteTemplateIntoCreator(tplId);
}

// ── Search & Filter Sailor for Auto-Fill by Off No or Name ──
function onSailorSearchInput(query) {
  if (!query) {
    populateMinuteSheetDropdowns();
    return;
  }
  const q = query.trim().toLowerCase();
  const rawDigits = q.replace(/\D/g, "");

  const sailors = store.sailors || [];

  // Live filter the dropdown below as user types so they see live matches
  const select = document.getElementById("msSelectSailor");
  if (select) {
    const matches = sailors.filter((s) => {
      const off = String(s.official_number || "").toLowerCase();
      const offDigits = off.replace(/\D/g, "");
      const name = String(s.name || "").toLowerCase();
      const initials = String(s.initials || "").toLowerCase();
      const rank = String(s.rank || "").toLowerCase();

      return off.includes(q) ||
             (rawDigits && offDigits.includes(rawDigits)) ||
             name.includes(q) ||
             initials.includes(q) ||
             rank.includes(q);
    });

    if (matches.length > 0) {
      select.innerHTML = `<option value="">-- Matches Found (${matches.length} sailors) --</option>` +
        matches.map((s) => `<option value="${s.id || s.official_number}">${s.official_number || ""} • ${s.rank || ""} ${s.name || s.initials || "Sailor"}</option>`).join("");
    } else {
      select.innerHTML = `<option value="">-- No matching sailors for "${query}" --</option>`;
    }
  }

  // Only auto-fill silently if full exact match (without overwriting what user is actively typing)
  const exactMatch = sailors.find((s) => {
    const off = String(s.official_number || "").trim().toLowerCase();
    const offDigits = off.replace(/\D/g, "");
    const name = String(s.name || "").trim().toLowerCase();
    const fullOption1 = `${off} - ${s.rank || ''} ${name}`.toLowerCase();
    const fullOption2 = `${name} (${off})`.toLowerCase();

    return off === q ||
           (rawDigits.length >= 5 && offDigits === rawDigits) ||
           name === q ||
           fullOption1 === q ||
           fullOption2 === q;
  });

  if (exactMatch) {
    autoFillSailorIntoMinute(exactMatch.id || exactMatch.official_number, false);
  }
}

// Triggered when user selects a datalist item, presses Enter, or changes input
function onSailorSearchChange(query) {
  if (!query || !query.trim()) return;
  const q = query.trim().toLowerCase();
  const rawDigits = q.replace(/\D/g, "");

  const sailors = store.sailors || [];
  const match = sailors.find((s) => {
    const off = String(s.official_number || "").trim().toLowerCase();
    const offDigits = off.replace(/\D/g, "");
    const name = String(s.name || "").trim().toLowerCase();

    return off === q ||
           (rawDigits && offDigits === rawDigits) ||
           q.includes(off) ||
           name === q ||
           q.includes(name);
  });

  if (match) {
    autoFillSailorIntoMinute(match.id || match.official_number, true);
  }
}

// ── Sinhala Formal Naval Sailor Converter & Paragraph Inserter ──
function convertRankToSinhala(rank) {
  if (!rank) return "කණිෂ්ඨ නාවිකයා";
  const r = rank.toUpperCase().trim();
  if (r.includes("L/SMN") || r.includes("LEADING SEAMAN") || r === "LS") return "නායක නැවියා";
  if (r.includes("AB") || r.includes("ABLE SEAMAN")) return "නැවියා";
  if (r.includes("OD") || r.includes("ORDINARY SEAMAN")) return "සාමාන්‍ය නැවියා";
  if (r.includes("CPO") || r.includes("CHIEF PETTY")) return "ප්‍රධාන සුළු නිලධාරි";
  if (r.includes("MCPO") || r.includes("MASTER CHIEF")) return "විශේෂ ප්‍රධාන සුළු නිලධාරි";
  if (r.includes("PO") || r.includes("PETTY OFFICER")) return "සුළු නිලධාරි";
  if (r.includes("WO") || r.includes("WARRANT OFFICER")) return "අධිකාරී නොලත් නිලධාරි";
  if (r.includes("LCDR") || r.includes("LIEUTENANT COMMANDER")) return "ලුතිනන් කොමාන්ඩර්";
  if (r.includes("CDR") || r.includes("COMMANDER")) return "කොමාන්ඩර්";
  if (r.includes("A/SLT") || r.includes("ACTING SUB LIEUTENANT")) return "වැඩබලන උප ලුතිනන්";
  if (r.includes("SLT") || r.includes("S/LT") || r.includes("SUB LIEUTENANT")) return "උප ලුතිනන්";
  if (r.includes("LT") || r.includes("LIEUTENANT")) return "ලුතිනන්";
  if (r.includes("CAPT") || r.includes("CAPTAIN")) return "කපිතාන්";
  if (r.includes("CDRE") || r.includes("COMMODORE")) return "කොමදෝරු";
  if (r.includes("RADM") || r.includes("REAR ADMIRAL")) return "රියර් අද්මිරාල්";
  if (r.includes("OIC")) return "කාර්ය භාර නිලධාරි";
  return rank;
}

function convertEnglishLettersToSinhalaInitials(str) {
  if (!str) return "";
  const map = {
    'A': 'ඒ', 'B': 'බී', 'C': 'සී', 'D': 'ඩී', 'E': 'ඊ', 'F': 'එෆ්', 'G': 'ජී',
    'H': 'එච්', 'I': 'අයි', 'J': 'ජේ', 'K': 'කේ', 'L': 'එල්', 'M': 'එම්', 'N': 'එන්',
    'O': 'ඕ', 'P': 'පී', 'Q': 'කිව්', 'R': 'ආර්', 'S': 'එස්', 'T': 'ටී', 'U': 'යූ',
    'V': 'වී', 'W': 'ඩබ්ලිව්', 'X': 'එක්ස්', 'Y': 'වයි', 'Z': 'ඉසෙඩ්'
  };
  return str.toUpperCase().split("").map(ch => map[ch] || ch).join(" ");
}

function convertNameToSinhalaPhonetic(name) {
  if (!name) return "";
  const nameTrim = name.trim();
  
  const dict = {
    "gnanathilaka": "ඥානතිලක",
    "bandara": "බණ්ඩාර",
    "perera": "පෙරේරා",
    "silva": "සිල්වා",
    "fernando": "ප්‍රනාන්දු",
    "kumara": "කුමාර",
    "dissanayake": "දිසානායක",
    "jayasinghe": "ජයසිංහ",
    "gunaratne": "ගුණරත්න",
    "karunaratne": "කරුණාරත්න",
    "wickramasinghe": "වික්‍රමසිංහ",
    "ranasinghe": "රණසිංහ",
    "senanayake": "සේනානායක",
    "amarasinghe": "අමරසිංහ",
    "gamage": "ගමගේ",
    "wijesinghe": "විජේසිංහ",
    "rathnayake": "රත්නායක",
    "ratnayake": "රත්නායක",
    "herath": "හේරත්",
    "ekanayake": "ඒකනායක",
    "liyanage": "ලියනගේ",
    "abeykoon": "අබේකෝන්",
    "weerasinghe": "වීරසිංහ",
    "priyantha": "ප්‍රියන්ත",
    "sanjeewa": "සංජීව",
    "pradeep": "ප්‍රදීප්",
    "sampath": "සම්පත්",
    "niroshan": "නිරෝෂන්",
    "chathuranga": "චතුරංග",
    "kasun": "කසුන්",
    "nuwan": "නුවන්",
    "saman": "සමන්",
    "ruwan": "රුවන්",
    "chandana": "චන්දන",
    "thushara": "තුෂාර",
    "prasanna": "ප්‍රසන්න",
    "jayawardena": "ජයවර්ධන",
    "tennakoon": "තෙන්නකෝන්",
    "rajapaksha": "රාජපක්ෂ",
    "premadasa": "ප්‍රේමදාස",
    "gunawardena": "ගුණවර්ධන",
    "munasinghe": "මුනසිංහ",
    "abeywardena": "අබේවර්ධන",
    "ariyaratne": "ආරියරත්න",
    "somaratne": "සෝමරත්න",
    "dayaratne": "දයාරත්න",
    "tilakaratne": "තිලකරත්න",
    "suriyarachchi": "සූරියආරච්චි",
    "jayakody": "ජයකොඩි",
    "ranatunga": "රණතුංග",
    "pathirana": "පතිරණ",
    "wickramaratne": "වික්‍රමරත්න",
    "kaluarachchi": "කළුආරච්චි",
    "alwis": "අල්විස්",
    "fonseka": "ෆොන්සේකා",
    "rodrigo": "රොද්‍රිගු",
    "mendis": "මෙන්ඩිස්",
    "cooray": "කුරේ",
    "peiris": "පීරිස්",
    "de silva": "ද සිල්වා",
    "de mel": "ද මෙල්"
  };

  const lower = nameTrim.toLowerCase();
  if (dict[lower]) return dict[lower];
  if (/[\u0D80-\u0DFF]/.test(nameTrim)) return nameTrim;

  const parts = nameTrim.split(/\s+/);
  if (parts.length > 1) {
    return parts.map(p => convertNameToSinhalaPhonetic(p)).join(" ");
  }

  return nameTrim;
}

function convertSailorToFormalSinhala(sailor) {
  if (!sailor) return "";
  const offNo = sailor.official_number || "";
  const rankSin = convertRankToSinhala(sailor.rank);
  
  let initialsSin = "";
  if (sailor.initials) {
    const rawInit = sailor.initials.replace(/[^a-zA-Z]/g, "");
    initialsSin = convertEnglishLettersToSinhalaInitials(rawInit);
  }
  
  let nameSin = convertNameToSinhalaPhonetic(sailor.name || "");
  
  let branchSin = "";
  if (sailor.branch) {
    const b = sailor.branch.toUpperCase().trim();
    if (b.includes("VAS") || b.includes("V")) branchSin = "වීඒඑස්";
    else if (b.includes("NAS") || b.includes("NR")) branchSin = "එන්ඒඑස්";
    else if (b.includes("CE")) branchSin = "(සිවිල්)";
  }

  return `${initialsSin ? initialsSin + ' ' : ''}${nameSin}${branchSin ? ' ' + branchSin : ''} ${offNo} දරණ ${rankSin}`.trim().replace(/\s+/g, ' ');
}

function insertSailorIntoActiveParagraph() {
  const searchInp = document.getElementById("msInsertSailorSearch");
  const query = (searchInp ? searchInp.value : "").trim().toLowerCase();
  if (!query) {
    showToast("Please search or type Sailor Official Number / Name!", "warning");
    if (searchInp) searchInp.focus();
    return;
  }

  const rawDigits = query.replace(/\D/g, "");
  const sailor = (store.sailors || []).find((s) => {
    const off = String(s.official_number || "").trim().toLowerCase();
    const offDigits = off.replace(/\D/g, "");
    const name = String(s.name || "").trim().toLowerCase();
    return off === query || (rawDigits && offDigits === rawDigits) || name.includes(query) || query.includes(name);
  });

  let insertText = "";
  if (sailor) {
    insertText = convertSailorToFormalSinhala(sailor);
  } else {
    insertText = convertNameToSinhalaPhonetic(query);
  }

  const paraInputs = document.querySelectorAll(".ms-para-input");
  if (paraInputs.length === 0) {
    addMinuteParagraphInput(insertText);
  } else {
    const targetInput = paraInputs[0];
    const start = targetInput.selectionStart || 0;
    const end = targetInput.selectionEnd || 0;
    const currentVal = targetInput.value;
    
    if (start !== end || start > 0) {
      targetInput.value = currentVal.substring(0, start) + insertText + currentVal.substring(end);
    } else {
      targetInput.value = currentVal ? `${currentVal} ${insertText}` : insertText;
    }
  }

  if (searchInp) searchInp.value = "";
  updateMinuteSheetPreview();
  showToast(`Inserted: ${insertText}`, "success");
}

function insertObjectIntoActiveParagraph(clauseText) {
  if (!clauseText) return;
  
  const paraInputs = document.querySelectorAll(".ms-para-input");
  if (paraInputs.length === 0) {
    addMinuteParagraphInput(clauseText);
  } else {
    const targetInput = paraInputs[0];
    const currentVal = targetInput.value;
    targetInput.value = currentVal ? `${currentVal} ${clauseText}` : clauseText;
  }

  const select = document.getElementById("msQuickObjectSelect");
  if (select) select.value = "";
  updateMinuteSheetPreview();
  showToast(`Clause added to paragraph!`, "success");
}

// Auto-fill Sailor Data into Minute Sheet (Leave Extension - User Pic 3/4)
function autoFillSailorIntoMinute(passedSailorId, updateSearchInput = true) {
  let sailorId = passedSailorId;
  if (!sailorId) {
    const select = document.getElementById("msSelectSailor");
    sailorId = select ? select.value : "";
  }
  if (!sailorId) {
    const searchInp = document.getElementById("msSailorSearchInput");
    sailorId = searchInp ? searchInp.value : "";
  }
  if (!sailorId) return;

  const q = String(sailorId).trim().toLowerCase();
  const rawDigits = q.replace(/\D/g, "");

  const sailor = (store.sailors || []).find((s) => {
    const off = String(s.official_number || "").trim().toLowerCase();
    const offDigits = off.replace(/\D/g, "");
    const idStr = String(s.id || "").trim().toLowerCase();
    const nameStr = String(s.name || "").trim().toLowerCase();

    return idStr === q ||
           off === q ||
           (rawDigits && offDigits === rawDigits) ||
           q.includes(off) ||
           nameStr === q ||
           q.includes(nameStr);
  });

  if (!sailor) return;

  if (updateSearchInput) {
    const searchInp = document.getElementById("msSailorSearchInput");
    if (searchInp) {
      searchInp.value = `${sailor.official_number || ""} - ${sailor.rank || ""} ${sailor.name || ""}`.trim();
    }
  }
  const select = document.getElementById("msSelectSailor");
  if (select) {
    select.value = sailor.id || sailor.official_number;
  }

  setMinuteSheetLanguage("si");

  const rankNameOff = convertSailorToFormalSinhala(sailor);

  const refInput = document.getElementById("msInputRefNo");
  if (refInput) refInput.value = `CE/LEAVE/${sailor.official_number || "74738"}/${new Date().getFullYear()}`;

  const dateInput = document.getElementById("msInputDate");
  if (dateInput) dateInput.value = getSinhalaDateString();

  const subInput = document.getElementById("msInputSubject");
  if (subInput) subInput.value = "නිවාඩු දීර්ඝ කිරීම සදහා";

  const addContainer = document.getElementById("msAddresseesContainer");
  if (addContainer) {
    addContainer.innerHTML = "";
    addMinuteAddresseeInput("විධායක නිලධාරි (තඨාකාංගනය)");
    addMinuteAddresseeInput("සහකාර විනයාරක්ෂකාධිපති (නැ)");
  }

  const oriInput = document.getElementById("msInputOriginator");
  if (oriInput) oriInput.value = "ජ්‍යෙෂ්ඨ සිවිල් ඉංජිනේරු නිලධාරි (නඩත්තු) මඟින්";

  // Build Paragraphs from Sailor Data
  const container = document.getElementById("msParagraphsContainer");
  if (container) {
    container.innerHTML = "";
    addMinuteParagraphInput(`කපිතාන් සිවිල් ඉංජිනේරු දෙපාර්තමේන්තුව (නැ) ට අනුයුක්තව රාජකාරි සිදු කරනු ලබන ${rankNameOff} 2026 අගෝස්තු මස 14 වන දින සිට දින 09 ක් නිවාඩු ගොස් 2026 අගෝස්තු මස 23 වන දින 2000 පැයට කඳවුරට රෙපෝර්තු කිරීමට තිබූ අතර, ඔහුගේ මව අසනීප වී ඇති බව දුරකථන ඇමතුමක් මඟින් දන්වා ඇත.`);
    addMinuteParagraphInput(`කරුණු එසේ හෙයින් එම නාවිකයා හට දින 02 ක් නිවාඩු දීර්ඝ කර එනම් 2026 අගෝස්තු මස 25 වන දින 2000 පැයට කඳවුරට රෙපෝර්තු කිරීමට අවශ්‍ය නිසි කටයුතු සලසා දෙන මෙන් අයදේ.`);
  }

  const recInput = document.getElementById("msInputRecommendation");
  if (recInput) recInput.value = "";

  const sigInput = document.getElementById("msInputSignatoryTitle");
  if (sigInput) sigInput.value = "ජ්‍යෙ.සි.ඉ.නි (නඩත්තු)";

  // Disable M02 by default
  const m02Check = document.getElementById("msEnableM02");
  if (m02Check) {
    m02Check.checked = false;
    toggleMinute02Section();
  }

  updateMinuteSheetPreview();
  showToast(`Auto-filled Leave Extension for ${sailor.official_number || ""} ${sailor.name || ""}`, "success");
}

// Quick Add Addressee Modal / List
function quickAddAddressee() {
  const lang = store.msLanguage || "si";
  const cfg = (store.settings && store.settings.minuteConfig) || defaultSettings.minuteConfig;
  const list = lang === "si" ? (cfg.addressees_si || []) : (cfg.addressees_en || []);
  const choice = prompt(`Select Addressee to add:\n\n${list.map((item, i) => `${i + 1}. ${item}`).join("\n")}\n\nEnter number (1-${list.length}) or type custom:`);

  if (!choice) return;
  const idx = parseInt(choice, 10);
  const selectedText = (!isNaN(idx) && idx >= 1 && idx <= list.length) ? list[idx - 1] : choice.trim();

  addMinuteAddresseeInput(selectedText);
}

// Toggle Minute 02 Section
function toggleMinute02Section() {
  const check = document.getElementById("msEnableM02");
  const wrapper = document.getElementById("msM02ControlsWrapper");
  if (wrapper) {
    if (check && check.checked) {
      wrapper.classList.remove("hidden");
      // Set defaults if empty
      const dInput = document.getElementById("msM02Date");
      if (dInput && !dInput.value) {
        dInput.value = store.msLanguage === "si" ? getSinhalaDateString() : getEnglishNavalDateString();
      }
    } else {
      wrapper.classList.add("hidden");
    }
  }
  updateMinuteSheetPreview();
}

function applyM02QuickText() {
  const select = document.getElementById("msM02QuickTextSelect");
  const val = select ? select.value : "";
  if (!val) return;
  const txt = document.getElementById("msM02Text");
  if (txt) {
    txt.value = val;
    updateMinuteSheetPreview();
  }
}

// Minute Sheet Builder Methods
function initMinuteSheetBuilder() {
  const container = document.getElementById("msParagraphsContainer");
  if (container) container.innerHTML = "";

  const addContainer = document.getElementById("msAddresseesContainer");
  if (addContainer) addContainer.innerHTML = "";

  const lang = store.msLanguage || "si";
  if (lang === "si") {
    addMinuteParagraphInput("කපිතාන් සිවිල් ඉංජිනේරු දෙපාර්තමේන්තුව (නැ) ට අනුයුක්තව රාජකාරි සිදු කරනු ලබන ඩබ්ලිව් ඥානතිලක වීඒඑස් 74738 දරණ කණිෂ්ඨ නාවිකයා 2026 අගෝස්තු මස 14 වන දින සිට දින 09 ක් නිවාඩු ගොස් 2026 අගෝස්තු මස 23 වන දින 2000 පැයට කඳවුරට රෙපෝර්තු කිරීමට තිබූ අතර, ඔහුගේ මව අසනීප වී ඇති බව දුරකථන ඇමතුමක් මඟින් දන්වා ඇත.");
    addMinuteParagraphInput("කරුණු එසේ හෙයින් එම නාවිකයා හට දින 02 ක් නිවාඩු දීර්ඝ කර එනම් 2026 අගෝස්තු මස 25 වන දින 2000 පැයට කඳවුරට රෙපෝර්තු කිරීමට අවශ්‍ය නිසි කටයුතු සලසා දෙන මෙන් අයදේ.");

    addMinuteAddresseeInput("විධායක නිලධාරි (තඨාකාංගනය)");
    addMinuteAddresseeInput("සහකාර විනයාරක්ෂකාධිපති (නැ)");

    const oriInput = document.getElementById("msInputOriginator");
    if (oriInput) oriInput.value = "ජ්‍යෙෂ්ඨ සිවිල් ඉංජිනේරු නිලධාරි (නඩත්තු) මඟින්";

    const subInput = document.getElementById("msInputSubject");
    if (subInput) subInput.value = "නිවාඩු දීර්ඝ කිරීම සදහා";

    const refInput = document.getElementById("msInputRefNo");
    if (refInput) refInput.value = "MIN/2026/08/002";

    const dateInput = document.getElementById("msInputDate");
    if (dateInput) dateInput.value = getSinhalaDateString();

    const sigInput = document.getElementById("msInputSignatoryTitle");
    if (sigInput) sigInput.value = "ජ්‍යෙ.සි.ඉ.නි (නඩත්තු)";
  } else {
    addMinuteParagraphInput("It is brought to your kind notice that urgent civil maintenance and structural rehabilitation are required at the requested facility.");
    addMinuteParagraphInput("A detailed technical assessment has been conducted and necessary scope of work and Bill of Quantities (BOQ) have been formulated.");

    addMinuteAddresseeInput("Executive Officer (Dockyard)");
    addMinuteAddresseeInput("Assistant Provost Marshal (E)");
  }
}

// ── Minute Sheet Rich Text Formatting Engine (Bold, Underline, Bullet Points, Sub-clauses) ──
function formatMinuteRichText(text) {
  if (!text) return "";
  let s = String(text);

  // 1. Bold: **text** or <b>text</b> or <strong>text</strong>
  s = s.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: bold; color: inherit;">$1</strong>');
  s = s.replace(/<b>(.*?)<\/b>/gi, '<strong style="font-weight: bold; color: inherit;">$1</strong>');
  s = s.replace(/<strong>(.*?)<\/strong>/gi, '<strong style="font-weight: bold; color: inherit;">$1</strong>');

  // 2. Underline: __text__ or <u>text</u>
  s = s.replace(/__(.*?)__/g, '<u style="text-decoration: underline; text-underline-offset: 2px;">$1</u>');
  s = s.replace(/<u>(.*?)<\/u>/gi, '<u style="text-decoration: underline; text-underline-offset: 2px;">$1</u>');

  // 3. Line-by-line processing for Bullet Points and Sub-clauses
  const lines = s.split(/\r?\n/);
  const formattedLines = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      formattedLines.push('<span style="display:block; height: 6px;"></span>');
      continue;
    }

    // Bullet Points: • or * or -
    if (/^[•\*\-]\s+/.test(trimmed)) {
      const bulletContent = trimmed.replace(/^[•\*\-]\s+/, "");
      formattedLines.push(
        `<span style="display: flex; align-items: flex-start; gap: 6px; margin-left: 1.8em; margin-top: 2px; margin-bottom: 2px; text-align: left;">
          <span style="font-weight: bold; line-height: 1.4;">•</span>
          <span style="flex: 1;">${bulletContent}</span>
        </span>`
      );
    }
    // Sub-clauses: (a), (b), (c), (i), (ii), (1), (2), (ක), (ඛ), (ග)
    else if (/^\([a-zA-Z0-9ivxක-ෆ]+\)\s+/.test(trimmed)) {
      const match = trimmed.match(/^(\([a-zA-Z0-9ivxක-ෆ]+\))\s+(.*)$/);
      if (match) {
        formattedLines.push(
          `<span style="display: flex; align-items: flex-start; gap: 6px; margin-left: 1.8em; margin-top: 2px; margin-bottom: 2px; text-align: left;">
            <span style="font-weight: bold; min-width: 22px; line-height: 1.4;">${match[1]}</span>
            <span style="flex: 1;">${match[2]}</span>
          </span>`
        );
      } else {
        formattedLines.push(rawLine);
      }
    }
    else {
      if (idx === 0) {
        formattedLines.push(rawLine);
      } else {
        formattedLines.push(`&emsp;&emsp;${rawLine}`);
      }
    }
  }

  return formattedLines.join("<br>");
}

// Format selected text in a paragraph textarea
function formatParaSelection(btn, formatType) {
  const row = btn.closest(".ms-para-row");
  if (!row) return;
  const textarea = row.querySelector(".ms-para-input");
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const val = textarea.value;
  const selected = val.substring(start, end);

  let replacement = "";
  let newStart = start;
  let newEnd = end;

  if (formatType === "bold") {
    if (selected) {
      if (selected.startsWith("**") && selected.endsWith("**") && selected.length >= 4) {
        replacement = selected.slice(2, -2);
        newEnd = start + replacement.length;
      } else {
        replacement = `**${selected}**`;
        newEnd = start + replacement.length;
      }
    } else {
      replacement = "**Bold Text**";
      newStart = start + 2;
      newEnd = start + 11;
    }
  } else if (formatType === "underline") {
    if (selected) {
      if (selected.startsWith("__") && selected.endsWith("__") && selected.length >= 4) {
        replacement = selected.slice(2, -2);
        newEnd = start + replacement.length;
      } else {
        replacement = `__${selected}__`;
        newEnd = start + replacement.length;
      }
    } else {
      replacement = "__Underlined Text__";
      newStart = start + 2;
      newEnd = start + 17;
    }
  } else if (formatType === "bullet") {
    if (selected) {
      const lines = selected.split("\n");
      replacement = lines.map((l) => l.trim().startsWith("• ") ? l.replace(/^•\s*/, "") : `• ${l}`).join("\n");
      newEnd = start + replacement.length;
    } else {
      const before = val.substring(0, start);
      const prefix = (before.length === 0 || before.endsWith("\n")) ? "• " : "\n• ";
      replacement = `${prefix}Bullet point item`;
      newStart = start + prefix.length;
      newEnd = start + replacement.length;
    }
  } else if (formatType === "subitem") {
    if (selected) {
      const lines = selected.split("\n");
      const subLabels = ["(a)", "(b)", "(c)", "(d)", "(e)", "(f)"];
      replacement = lines.map((l, i) => {
        const lbl = subLabels[i] || `(${i + 1})`;
        return `${lbl} ${l.replace(/^\([a-zA-Z0-9]+\)\s*/, "")}`;
      }).join("\n");
      newEnd = start + replacement.length;
    } else {
      const before = val.substring(0, start);
      const prefix = (before.length === 0 || before.endsWith("\n")) ? "(a) " : "\n(a) ";
      replacement = `${prefix}Sub-clause item`;
      newStart = start + prefix.length;
      newEnd = start + replacement.length;
    }
  }

  textarea.value = val.substring(0, start) + replacement + val.substring(end);
  textarea.focus();
  textarea.setSelectionRange(newStart, newEnd);
  updateMinuteSheetPreview();
}

// Format selected text by element ID (e.g. msInputRecommendation)
function formatInputSelectionById(inputId, formatType) {
  const textarea = document.getElementById(inputId);
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const val = textarea.value;
  const selected = val.substring(start, end);

  let replacement = "";
  let newStart = start;
  let newEnd = end;

  if (formatType === "bold") {
    if (selected) {
      if (selected.startsWith("**") && selected.endsWith("**") && selected.length >= 4) {
        replacement = selected.slice(2, -2);
        newEnd = start + replacement.length;
      } else {
        replacement = `**${selected}**`;
        newEnd = start + replacement.length;
      }
    } else {
      replacement = "**Bold Text**";
      newStart = start + 2;
      newEnd = start + 11;
    }
  } else if (formatType === "underline") {
    if (selected) {
      if (selected.startsWith("__") && selected.endsWith("__") && selected.length >= 4) {
        replacement = selected.slice(2, -2);
        newEnd = start + replacement.length;
      } else {
        replacement = `__${selected}__`;
        newEnd = start + replacement.length;
      }
    } else {
      replacement = "__Underlined Text__";
      newStart = start + 2;
      newEnd = start + 17;
    }
  }

  textarea.value = val.substring(0, start) + replacement + val.substring(end);
  textarea.focus();
  textarea.setSelectionRange(newStart, newEnd);
  updateMinuteSheetPreview();
}

function addMinuteParagraphInput(initialText = "") {
  const container = document.getElementById("msParagraphsContainer");
  if (!container) return;

  const count = container.children.length + 1;
  const div = document.createElement("div");
  div.className = "flex flex-col gap-1.5 ms-para-row group bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-200 transition-all";
  div.innerHTML = `
    <!-- Top Formatting & Action Ribbon -->
    <div class="flex items-center justify-between gap-2 pb-1 border-b border-slate-100">
      <div class="flex items-center gap-1.5">
        <span class="ms-para-num font-bold text-indigo-800 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md text-[11px]">${count}.</span>
        <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Paragraph Content</span>
      </div>
      <div class="flex items-center gap-1">
        <!-- Formatting Toolbar Pills -->
        <button type="button" onclick="formatParaSelection(this, 'bold')" class="px-2 py-0.5 rounded bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-800 text-[11px] font-black border border-slate-200 cursor-pointer shadow-2xs transition-all" title="Bold Selected Text (**text**)">
          <b>B</b>
        </button>
        <button type="button" onclick="formatParaSelection(this, 'underline')" class="px-2 py-0.5 rounded bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-800 text-[11px] font-bold underline border border-slate-200 cursor-pointer shadow-2xs transition-all" title="Underline Selected Text (__text__)">
          <u>U</u>
        </button>
        <button type="button" onclick="formatParaSelection(this, 'bullet')" class="px-2 py-0.5 rounded bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-800 text-[11px] font-bold border border-slate-200 cursor-pointer shadow-2xs transition-all" title="Add Bullet Point (• Item)">
          • List
        </button>
        <button type="button" onclick="formatParaSelection(this, 'subitem')" class="px-2 py-0.5 rounded bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-800 text-[11px] font-bold border border-slate-200 cursor-pointer shadow-2xs transition-all" title="Add Sub-item ((a) Item)">
          (a) Sub
        </button>
        <div class="w-px h-3.5 bg-slate-200 mx-0.5"></div>
        <button type="button" onclick="this.closest('.ms-para-row').remove(); renumberMinuteParagraphs(); updateMinuteSheetPreview();" class="text-rose-400 hover:text-rose-700 hover:bg-rose-50 px-1.5 py-0.5 rounded text-xs cursor-pointer transition-all font-bold" title="Delete Paragraph">✕</button>
      </div>
    </div>

    <!-- Textarea -->
    <textarea rows="3" oninput="updateMinuteSheetPreview()" class="ms-para-input w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none leading-relaxed transition-all" placeholder="Enter paragraph ${count} content... (Use **bold**, __underline__, • bullet points)">${initialText}</textarea>
  `;

  // Enable Tab key support inside textarea
  const textarea = div.querySelector("textarea");
  if (textarea) {
    textarea.addEventListener("keydown", function(e) {
      if (e.key === "Tab") {
        e.preventDefault();
        const start = this.selectionStart;
        const end = this.selectionEnd;
        this.value = this.value.substring(0, start) + "    " + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 4;
        updateMinuteSheetPreview();
      }
    });
  }

  container.appendChild(div);
  renumberMinuteParagraphs();
  updateMinuteSheetPreview();
}

function renumberMinuteParagraphs() {
  const container = document.getElementById("msParagraphsContainer");
  if (!container) return;

  const children = Array.from(container.children);
  const total = children.length;
  const lang = store.msLanguage || "si";
  const cfg = (store.settings && store.settings.minuteConfig) || defaultSettings.minuteConfig;
  const endList = lang === "si" ? (cfg.endorsements_si || []) : (cfg.endorsements_en || []);

  children.forEach((child, idx) => {
    child.className = "flex flex-col gap-1 ms-para-row group";
    const isLast = (idx === total - 1) && (total >= 1);

    // Update Numbering
    const numSpan = child.querySelector(".ms-para-num");
    if (numSpan) numSpan.textContent = `${idx + 1}.`;

    // Last paragraph template bar
    let templateBar = child.querySelector(".ms-last-para-bar");
    if (isLast) {
      if (!templateBar) {
        templateBar = document.createElement("div");
        templateBar.className = "ms-last-para-bar mt-1 flex items-center justify-between gap-2 flex-wrap bg-blue-50/90 p-2 rounded-xl border border-blue-200 text-xs";
        child.appendChild(templateBar);
      }

      let optionsHtml = `<option value="">⚡ Last Para Template (අවසාන ඡේද පාඨය තෝරන්න)...</option>`;
      endList.forEach((item) => {
        optionsHtml += `<option value="${item.replace(/"/g, '&quot;')}">${item}</option>`;
      });

      templateBar.innerHTML = `
        <div class="flex items-center gap-1.5 text-[11px] font-bold text-blue-900">
          <span>📜</span> <span>Last Paragraph Template:</span>
        </div>
        <div class="flex items-center gap-1.5 flex-1 max-w-sm">
          <select onchange="applyLastParagraphTemplate(this.value, this)" class="ms-last-para-select flex-1 px-2.5 py-1 text-xs font-semibold text-blue-950 bg-white border border-blue-300 rounded-lg outline-none cursor-pointer focus:ring-1 focus:ring-blue-500 shadow-2xs">
            ${optionsHtml}
          </select>
          <button type="button" onclick="switchDocumentsSubTab('config')" class="text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-white px-1.5 py-1 rounded border border-blue-300 cursor-pointer shrink-0" title="Manage Templates & Phrases in Settings">⚙️</button>
        </div>
      `;
    } else {
      if (templateBar) {
        templateBar.remove();
      }
    }
  });
}

function applyLastParagraphTemplate(val, selectEl) {
  if (!val) return;
  const row = selectEl.closest(".ms-para-row") || selectEl.parentElement.parentElement.parentElement;
  if (!row) return;
  const textarea = row.querySelector(".ms-para-input");
  if (textarea) {
    textarea.value = val;
    updateMinuteSheetPreview();
    showToast("Applied template to last paragraph!", "success");
  }
}

function autoFillMinuteFromJobMinute() {
  const select = document.getElementById("msInputSourceJobMinute");
  const minuteId = select ? select.value : "";
  if (!minuteId) return;

  const minute = (store.jobMinutes || []).find((m) => m.id === minuteId);
  if (!minute) return;

  const refInput = document.getElementById("msInputRefNo");
  if (refInput) refInput.value = minute.ref_no;

  const dateInput = document.getElementById("msInputDate");
  if (dateInput) dateInput.value = store.msLanguage === "si" ? getSinhalaDateString() : (minute.date_received || getLocalDateString());

  const subInput = document.getElementById("msInputSubject");
  if (subInput) subInput.value = minute.subject.toUpperCase();

  const container = document.getElementById("msParagraphsContainer");
  if (container) {
    container.innerHTML = "";
    addMinuteParagraphInput(`Reference is made to the civil works request received from ${minute.end_user} on ${minute.date_received}.`);
    if (minute.description) {
      addMinuteParagraphInput(minute.description);
    }
    if (minute.linked_estimate_id) {
      addMinuteParagraphInput(`An engineering estimate has been prepared under Reference ${minute.linked_estimate_id}. Required skilled personnel are assigned.`);
    }
  }

  updateMinuteSheetPreview();
  showToast(`Auto-filled from ${minute.ref_no}`, "success");
}

function createMinuteSheetFromJobMinute(minuteId) {
  switchDocumentsSubTab("minutesheet");
  const minute = (store.jobMinutes || []).find((m) => m.id === minuteId);
  if (!minute) return;

  const refInput = document.getElementById("msInputRefNo");
  if (refInput) refInput.value = minute.ref_no;

  const subInput = document.getElementById("msInputSubject");
  if (subInput) subInput.value = minute.subject.toUpperCase();

  const addContainer = document.getElementById("msAddresseesContainer");
  if (addContainer) {
    addContainer.innerHTML = "";
    if (store.msLanguage === "si") {
      addMinuteAddresseeInput("ප්‍රධාන ඉංජිනේරු");
      addMinuteAddresseeInput("නියෝජ්‍ය ප්‍රධාන ඉංජිනේරු");
    } else {
      addMinuteAddresseeInput("Chief Engineer");
      addMinuteAddresseeInput("Deputy Chief Engineer");
    }
  }

  const oriInput = document.getElementById("msInputOriginator");
  if (oriInput) oriInput.value = store.msLanguage === "si" ? "කාර්ය භාර නිලධාරි (සිවිල් නඩත්තු) මඟින්" : "Officer in Charge - Civil Maintenance";

  const container = document.getElementById("msParagraphsContainer");
  if (container) {
    container.innerHTML = "";
    if (store.msLanguage === "si") {
      addMinuteParagraphInput(`${minute.end_user} වෙතින් ${minute.date_received} දින ලැබුණු ලිඛිත ඉල්ලීම පරිදි මෙම සිවිල් නඩත්තු කාර්යය සඳහා අවශ්‍ය ක්‍රියාමාර්ග ගෙන ඇත.`);
      if (minute.description) addMinuteParagraphInput(minute.description);
    } else {
      addMinuteParagraphInput(`Reference is made to the civil works request received from ${minute.end_user} on ${minute.date_received}.`);
      if (minute.description) addMinuteParagraphInput(minute.description);
    }
  }

  updateMinuteSheetPreview();
}

// ── Settings Management for Minute Sheet Config ──
store.settingsMsLang = store.settingsMsLang || "si";

function switchSettingsMinuteLang(lang) {
  store.settingsMsLang = lang === "en" ? "en" : "si";

  const btnSi = document.getElementById("btnSettingsMsLangSi");
  const btnEn = document.getElementById("btnSettingsMsLangEn");
  const docBtnSi = document.getElementById("btnDocMsLangSi");
  const docBtnEn = document.getElementById("btnDocMsLangEn");

  [btnSi, docBtnSi].forEach((btn) => {
    if (btn) btn.className = store.settingsMsLang === "si" ? "px-3 py-1 rounded-lg font-bold bg-teal-600 text-white shadow-xs transition-all cursor-pointer" : "px-3 py-1 rounded-lg font-medium text-slate-600 transition-all cursor-pointer";
  });
  [btnEn, docBtnEn].forEach((btn) => {
    if (btn) btn.className = store.settingsMsLang === "en" ? "px-3 py-1 rounded-lg font-bold bg-teal-600 text-white shadow-xs transition-all cursor-pointer" : "px-3 py-1 rounded-lg font-medium text-slate-600 transition-all cursor-pointer";
  });

  renderMinuteSheetSettings();
}

function renderMinuteSheetSettings() {
  const lang = store.settingsMsLang || "si";
  if (!store.settings.minuteConfig) {
    store.settings.minuteConfig = { ...defaultSettings.minuteConfig };
  }
  const cfg = store.settings.minuteConfig;

  // 1. Addressees
  const addListEls = [document.getElementById("cfgMinuteAddresseesList"), document.getElementById("docMinuteAddresseesList")].filter(Boolean);
  if (addListEls.length) {
    const key = `addressees_${lang}`;
    const items = cfg[key] || [];
    const html = items.length === 0
      ? `<p class="text-xs italic text-slate-400 p-2">No standard addressees configured.</p>`
      : items.map((item, idx) => `
        <div class="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs hover:border-amber-300 transition-all">
          <span class="font-medium text-slate-800">${item}</span>
          <button type="button" onclick="deleteMinuteConfigItem('addressees', ${idx}, event)" class="text-rose-500 hover:text-rose-700 font-bold px-1.5 py-0.5 rounded hover:bg-rose-50 cursor-pointer" title="Delete">✕</button>
        </div>
      `).join("");
    addListEls.forEach((el) => el.innerHTML = html);
  }

  // 2. Originators
  const oriListEls = [document.getElementById("cfgMinuteOriginatorsList"), document.getElementById("docMinuteOriginatorsList")].filter(Boolean);
  if (oriListEls.length) {
    const key = `originators_${lang}`;
    const items = cfg[key] || [];
    const html = items.length === 0
      ? `<p class="text-xs italic text-slate-400 p-2">No originators configured.</p>`
      : items.map((item, idx) => `
        <div class="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs hover:border-rose-300 transition-all">
          <span class="font-medium text-slate-800">${item}</span>
          <button type="button" onclick="deleteMinuteConfigItem('originators', ${idx}, event)" class="text-rose-500 hover:text-rose-700 font-bold px-1.5 py-0.5 rounded hover:bg-rose-50 cursor-pointer" title="Delete">✕</button>
        </div>
      `).join("");
    oriListEls.forEach((el) => el.innerHTML = html);
  }

  // 3. Signatory Titles
  const sigListEls = [document.getElementById("cfgMinuteSignatoryTitlesList"), document.getElementById("docMinuteSignatoryTitlesList")].filter(Boolean);
  if (sigListEls.length) {
    const key = `signatoryTitles_${lang}`;
    const items = cfg[key] || [];
    const html = items.length === 0
      ? `<p class="text-xs italic text-slate-400 p-2">No signatory titles configured.</p>`
      : items.map((item, idx) => `
        <div class="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs hover:border-teal-300 transition-all">
          <span class="font-medium text-slate-800">${item}</span>
          <button type="button" onclick="deleteMinuteConfigItem('signatoryTitles', ${idx}, event)" class="text-rose-500 hover:text-rose-700 font-bold px-1.5 py-0.5 rounded hover:bg-rose-50 cursor-pointer" title="Delete">✕</button>
        </div>
      `).join("");
    sigListEls.forEach((el) => el.innerHTML = html);
  }

  // 4. Endorsements
  const endListEls = [document.getElementById("cfgMinuteEndorsementsList"), document.getElementById("docMinuteEndorsementsList")].filter(Boolean);
  if (endListEls.length) {
    const key = `endorsements_${lang}`;
    const items = cfg[key] || [];
    const html = items.length === 0
      ? `<p class="text-xs italic text-slate-400 p-2">No endorsement phrases configured.</p>`
      : items.map((item, idx) => `
        <div class="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs hover:border-blue-300 transition-all">
          <span class="font-medium text-slate-800">${item}</span>
          <button type="button" onclick="deleteMinuteConfigItem('endorsements', ${idx}, event)" class="text-rose-500 hover:text-rose-700 font-bold px-1.5 py-0.5 rounded hover:bg-rose-50 cursor-pointer" title="Delete">✕</button>
        </div>
      `).join("");
    endListEls.forEach((el) => el.innerHTML = html);
  }
}

function openAddMinuteConfigItemModal(type, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const lang = store.settingsMsLang || "si";
  const typeLabels = {
    addressees: lang === "si" ? "යොමුවන පාර්ශ්වය (Addressee)" : "Addressee Appointment",
    originators: lang === "si" ? "මඟින් යොමු කරන නිලධාරියා (Originator Designation)" : "Originating Appointment",
    signatoryTitles: lang === "si" ? "අත්සන් තබන නිල තනතුර (Signatory Title)" : "Signatory Block Title",
    endorsements: lang === "si" ? "M-02 නිර්දේශ පාඨය (Endorsement Phrase)" : "M-02 Endorsement Phrase"
  };

  const val = prompt(`Enter new ${typeLabels[type] || type} (${lang === "si" ? "සිංහල" : "English"}):`);
  if (!val || !val.trim()) return;

  const key = `${type}_${lang}`;
  if (!store.settings.minuteConfig) store.settings.minuteConfig = { ...defaultSettings.minuteConfig };
  if (!store.settings.minuteConfig[key]) store.settings.minuteConfig[key] = [];

  store.settings.minuteConfig[key].push(val.trim());

  localStorage.setItem("ncw_settings_v1", JSON.stringify(store.settings));

  if (typeof opsDB !== "undefined") {
    opsDB.ref(`settings/minuteConfig/${key}`).set(store.settings.minuteConfig[key]);
  }

  renderMinuteSheetSettings();
  populateMinuteSheetDropdowns();
  showToast(`Added successfully to Settings`, "success");
}

function deleteMinuteConfigItem(type, index, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const lang = store.settingsMsLang || "si";
  const key = `${type}_${lang}`;
  if (!store.settings.minuteConfig || !store.settings.minuteConfig[key]) return;

  if (!confirm(`Are you sure you want to remove this item?`)) return;

  store.settings.minuteConfig[key].splice(index, 1);

  localStorage.setItem("ncw_settings_v1", JSON.stringify(store.settings));

  if (typeof opsDB !== "undefined") {
    opsDB.ref(`settings/minuteConfig/${key}`).set(store.settings.minuteConfig[key]);
  }

  renderMinuteSheetSettings();
  populateMinuteSheetDropdowns();
  showToast(`Item removed from Settings`, "info");
}

function setMinutePaperSize(size) {
  store.msPaperSize = size === "letter" ? "letter" : "a4";

  const btnA4 = document.getElementById("btnMsPaperA4");
  const btnLetter = document.getElementById("btnMsPaperLetter");
  const btnSetupA4 = document.getElementById("btnPrintSetupA4");
  const btnSetupLetter = document.getElementById("btnPrintSetupLetter");
  const titleEl = document.getElementById("msPreviewPaperTitle");

  if (store.msPaperSize === "a4") {
    [btnA4, btnSetupA4].forEach((b) => {
      if (b) b.className = "px-3 py-2 rounded-lg text-xs font-bold bg-teal-600 text-white border border-teal-600 shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer";
    });
    [btnLetter, btnSetupLetter].forEach((b) => {
      if (b) b.className = "px-3 py-2 rounded-lg text-xs font-bold text-slate-600 bg-slate-50 border border-slate-300 hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer";
    });
    if (titleEl) titleEl.textContent = "A4 Naval Minute Paper View (210 × 297 mm)";
  } else {
    [btnLetter, btnSetupLetter].forEach((b) => {
      if (b) b.className = "px-3 py-2 rounded-lg text-xs font-bold bg-teal-600 text-white border border-teal-600 shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer";
    });
    [btnA4, btnSetupA4].forEach((b) => {
      if (b) b.className = "px-3 py-2 rounded-lg text-xs font-bold text-slate-600 bg-slate-50 border border-slate-300 hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer";
    });
    if (titleEl) titleEl.textContent = "Letter Naval Minute Paper View (8.5 × 11 in)";
  }

  updateMinuteSheetPreview();
}

store.msColorMode = store.msColorMode || "bw";

function setPrintColorMode(mode) {
  store.msColorMode = mode === "color" ? "color" : "bw";

  const btnBw = document.getElementById("btnPrintColorModeBW");
  const btnColor = document.getElementById("btnPrintColorModeColor");

  if (store.msColorMode === "bw") {
    if (btnBw) btnBw.className = "px-3 py-2 rounded-lg text-xs font-bold bg-slate-900 text-white border border-slate-900 shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer";
    if (btnColor) btnColor.className = "px-3 py-2 rounded-lg text-xs font-bold text-slate-600 bg-slate-50 border border-slate-300 hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer";
  } else {
    if (btnColor) btnColor.className = "px-3 py-2 rounded-lg text-xs font-bold bg-teal-600 text-white border border-teal-600 shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer";
    if (btnBw) btnBw.className = "px-3 py-2 rounded-lg text-xs font-bold text-slate-600 bg-slate-50 border border-slate-300 hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer";
  }

  updateMinuteSheetPreview();
}

function openMinutePrintSetupModal() {
  updateMinuteSheetPreview();
  setMinutePaperSize(store.msPaperSize || "a4");
  setPrintColorMode(store.msColorMode || "bw");

  const slider = document.getElementById("printMarginSlider");
  const display = document.getElementById("printMarginDisplay");
  if (slider) slider.value = store.msMarginWidth || 28;
  if (display) display.textContent = `${store.msMarginWidth || 28}%`;

  const modal = document.getElementById("printMinuteSheetModal");
  if (modal) modal.classList.remove("hidden");
}

function executeMinutePrint() {
  updateMinuteSheetPreview();
  const refNo = document.getElementById("msInputRefNo")?.value || "Minute Sheet";
  printElement("minuteSheetPrintArea", `Minute Sheet - ${refNo}`);
}

function publishMinuteToPdf() {
  updateMinuteSheetPreview();
  const refNo = document.getElementById("msInputRefNo")?.value || "Minute_Sheet";
  printElement("minuteSheetPrintArea", `Minute_Sheet_${refNo.replace(/[^a-zA-Z0-9_-]/g, "_")}`);
}

// ── Update Live Formatted Naval Minute Sheet Preview (Pic 1, 2, 3 Authentic Layout) ──
function updateMinuteSheetPreview() {
  const previewArea = document.getElementById("minuteSheetPrintArea");
  if (!previewArea) return;

  const lang = store.msLanguage || "si";
  const langTitle = lang === "si" ? "මාණ්ඩලික සටහන්පත" : "MINUTESHEET";
  const langM01 = lang === "si" ? "මා.ස 01" : "M-01";
  const langM02 = lang === "si" ? "මා.ස 02" : "M-02";

  const marginWidth = store.msMarginWidth || 28;
  const rightMargin = store.msRightMargin || 14;
  const fontFamily = store.msFontFamily || "serif";
  const fontSize = store.msFontSize || 12;
  const contentWidth = 100 - marginWidth;

  // Sync margin and font displays
  const marginDisplay1 = document.getElementById("msMarginWidthDisplay");
  const marginDisplay2 = document.getElementById("printMarginDisplay");
  const rightMarginDisplay = document.getElementById("msRightMarginDisplay");
  const fontSelect = document.getElementById("msInputFontFamily");
  const fontSizeSlider = document.getElementById("msInputFontSize");
  const fontSizeDisplay = document.getElementById("msFontSizeDisplay");

  if (marginDisplay1) marginDisplay1.textContent = `${marginWidth}%`;
  if (marginDisplay2) marginDisplay2.textContent = `${marginWidth}%`;
  if (rightMarginDisplay) rightMarginDisplay.textContent = `${rightMargin}px`;
  if (fontSelect && fontSelect.value !== fontFamily) fontSelect.value = fontFamily;
  if (fontSizeSlider && fontSizeSlider.value != fontSize) fontSizeSlider.value = fontSize;
  if (fontSizeDisplay) fontSizeDisplay.textContent = `${fontSize}px`;

  // Ensure Sinhala date if Sinhala mode
  let dateVal = document.getElementById("msInputDate")?.value || "";
  if (!dateVal || (lang === "si" && !dateVal.includes("මස") && (dateVal.includes("Aug") || dateVal.includes("-")))) {
    dateVal = getSinhalaDateString();
    const dInp = document.getElementById("msInputDate");
    if (dInp) dInp.value = dateVal;
  } else if (!dateVal) {
    dateVal = lang === "si" ? getSinhalaDateString() : getEnglishNavalDateString();
  }

  const subjectVal = document.getElementById("msInputSubject")?.value || (lang === "si" ? "නිවාඩු දීර්ඝ කිරීම සදහා" : "SUBJECT OF MINUTE");
  const originatorVal = document.getElementById("msInputOriginator")?.value || "";
  const recVal = document.getElementById("msInputRecommendation")?.value || "";
  const signTitleVal = document.getElementById("msInputSignatoryTitle")?.value || "";

  // Paragraphs (Pic 1 Layout: Wrapped lines align flush left with paragraph number 1.)
  const paraInputs = document.querySelectorAll(".ms-para-input");
  const paragraphs = [];
  paraInputs.forEach((inp) => {
    if (inp.value.trim()) paragraphs.push(inp.value.trim());
  });

  const parasHtml = paragraphs.map((p, i) => {
    const formattedBody = formatMinuteRichText(p);
    return `
      <div class="text-justify text-xs leading-relaxed text-black font-serif mb-2.5" style="font-size: ${fontSize}px !important; line-height: 1.6;">
        <span class="font-bold font-sans">${i + 1}.</span>&emsp;&emsp;${formattedBody}
      </div>
    `;
  }).join("");

  // All Addressee lines from multiple dropdown/custom boxes shown one after another
  const addRows = document.querySelectorAll(".ms-addressee-row");
  const addresseesList = [];
  if (addRows.length > 0) {
    addRows.forEach((row) => {
      const select = row.querySelector(".ms-addressee-select");
      const customInp = row.querySelector(".ms-addressee-custom-input");
      if (select && select.value === "__custom__" && customInp && customInp.value.trim()) {
        addresseesList.push(customInp.value.trim());
      } else if (select && select.value && select.value !== "__custom__") {
        addresseesList.push(select.value.trim());
      } else if (customInp && customInp.value.trim()) {
        addresseesList.push(customInp.value.trim());
      }
    });
  } else {
    const addInputs = document.querySelectorAll(".ms-addressee-input");
    addInputs.forEach((inp) => {
      if (inp.value.trim()) addresseesList.push(inp.value.trim());
    });
  }
  if (addresseesList.length === 0) {
    const legacy = document.getElementById("msInputAddressees")?.value;
    if (legacy && legacy.trim()) {
      addresseesList.push(...legacy.split("\n\n").map((a) => a.trim()).filter(Boolean));
    }
  }

  // Flatten and parse all addressees (splitting by multiple newlines if entered in a single block)
  const parsedAddressees = [];
  addresseesList.forEach((item) => {
    if (!item) return;
    const parts = item.split(/\n\s*\n+/).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      parsedAddressees.push(...parts);
    } else if (item.trim()) {
      parsedAddressees.push(item.trim());
    }
  });

  // Process Addressees List (Center Aligned with 3-Enter generous spacing between each officer)
  let firstAddresseeHtml = `<div class="font-bold italic text-slate-400 text-center">යොමුව (Addressee)</div>`;
  let subsequentAddresseesHtml = "";

  if (parsedAddressees.length > 0) {
    firstAddresseeHtml = `<div class="font-bold leading-snug text-black break-words text-center" style="overflow-wrap: anywhere; word-break: break-word; font-size: ${fontSize}px !important; line-height: 1.35;">${parsedAddressees[0].replace(/\n/g, "<br>")}</div>`;
    if (parsedAddressees.length > 1) {
      subsequentAddresseesHtml = parsedAddressees.slice(1).map((a) => `
        <div class="font-bold leading-snug text-black break-words text-center" style="overflow-wrap: anywhere; word-break: break-word; font-size: ${fontSize}px !important; line-height: 1.35; margin-top: 3.8em !important; padding-top: 0.6em;">
          ${a.replace(/\n/g, "<br>")}
        </div>
      `).join("");
    }
  }

  // M-02 (Subsequent Endorsement) - Placed below M-01 with NO horizontal divider border
  const isM02Enabled = document.getElementById("msEnableM02")?.checked;
  let m02Html = "";
  if (isM02Enabled) {
    const m02Originator = document.getElementById("msM02Originator")?.value || (lang === "si" ? "විධායක නිලධාරි මඟින්" : "Executive Officer");
    const m02Text = document.getElementById("msM02Text")?.value || (lang === "si" ? "නිර්දේශ කර ඉදිරිපත් කරමි." : "Recommended and forwarded please.");
    let m02Date = document.getElementById("msM02Date")?.value || dateVal;
    if (lang === "si" && !m02Date.includes("මස") && (m02Date.includes("Aug") || m02Date.includes("-"))) {
      m02Date = getSinhalaDateString();
    }
    const m02SignTitle = document.getElementById("msM02SignTitle")?.value || (lang === "si" ? "නියෝජ්‍ය ප්‍රධාන ඉංජිනේරු" : "Deputy Chief Engineer");

    m02Html = `
      <!-- Minute 02 Block -->
      <div class="pt-8 space-y-3">
        <!-- M-02 Header -->
        <div class="text-center font-bold text-xs pb-1 text-black">
          <u>${langM02}</u>
        </div>

        <!-- M-02 Originator Designation (Pic 2) -->
        ${m02Originator ? `
        <div class="font-bold text-xs text-black leading-snug inline-block">
          <u>${m02Originator}</u>
        </div>` : ""}

        <!-- M-02 Action / Endorsement Text -->
        <div class="text-xs leading-relaxed text-black font-serif text-justify">
          <p>&emsp;&emsp;${m02Text}</p>
        </div>

        <!-- M-02 Date & Signatory Block -->
        <div class="pt-6 flex items-end justify-between">
          <div class="font-bold text-xs text-black">
            ${m02Date}
          </div>
          <div class="text-center min-w-[160px] space-y-0.5">
            <div class="h-10"></div> <!-- Signature blank space -->
            ${m02SignTitle ? `<p class="font-bold text-[11px] text-slate-900">${m02SignTitle}</p>` : ""}
          </div>
        </div>
      </div>
    `;
  }

  // Final HTML rendered on Paper Surface with Exact Alignment (Pic 1 Authentic Naval Format)
  const renderedContent = `
    <div class="w-full bg-white text-black naval-minute-paper flex flex-col" style="font-family: ${fontFamily} !important; font-size: ${fontSize}px !important; min-height: 940px;">
      <!-- Title Header (Centered & Underlined) -->
      <div class="text-center pb-2 flex-shrink-0">
        <h2 class="inline-block font-bold uppercase underline tracking-wider text-black" style="font-size: ${fontSize + 2}px !important;">
          ${langTitle}
        </h2>
      </div>

      <!-- Table without outer borders - Top black horizontal line intersects with vertical divider line (Pic 1) -->
      <table class="w-full border-collapse leading-relaxed flex-1" style="border:none !important; border-top: 1.5px solid #000 !important; width:100%; min-height: 860px; font-family: ${fontFamily} !important; font-size: ${fontSize}px !important;">
        <!-- Top Subject Row (With Top-Left Reference: "යොමුව" / "Ref") -->
        <tr style="border:none !important; height: auto;">
          <td style="width: ${marginWidth}%; border-right: 1.5px solid #000 !important; border-bottom: 1.5px solid #000 !important; border-top:none !important; border-left:none !important; padding: 6px 10px; font-size: ${fontSize}px !important;" class="text-center font-bold text-black align-middle">
            ${lang === "si" ? "යොමුව" : "Ref"}
          </td>
          <td style="width: ${contentWidth}%; border-bottom: 1.5px solid #000 !important; border-top:none !important; border-right:none !important; padding: 6px ${rightMargin}px 6px 12px; font-size: ${fontSize}px !important;" class="text-center font-bold align-middle tracking-wide text-black uppercase">
            <u>${subjectVal}</u>
          </td>
        </tr>

        <!-- M-01 Header Level Row -->
        <tr style="border:none !important; height: auto;">
          <td style="width: ${marginWidth}%; border-right: 1.5px solid #000 !important; border-bottom:none !important; border-top:none !important; padding: 6px 10px 0 10px;" class="align-top">
            <!-- Space matching M-01 header -->
            <div class="invisible select-none font-bold pb-1" aria-hidden="true" style="font-size: ${fontSize}px !important;"><u>${langM01}</u></div>
          </td>
          <td style="width: ${contentWidth}%; border:none !important; padding: 6px ${rightMargin}px 0 14px;" class="text-center align-top">
            <div class="font-bold pb-1 inline-block text-black" style="font-size: ${fontSize}px !important;">
              <u>${langM01}</u>
            </div>
          </td>
        </tr>

        <!-- Originator & 1st Addressee Row (Guaranteed Exact Same Baseline Alignment - Pic 1) -->
        <tr style="border:none !important; height: auto;">
          <!-- Left: 1st Addressee -->
          <td style="width: ${marginWidth}%; border-right: 1.5px solid #000 !important; border-bottom:none !important; border-top:none !important; padding: 4px 10px 0 10px; font-size: ${fontSize}px !important;" class="align-top font-bold leading-snug text-black">
            ${firstAddresseeHtml}
          </td>
          <!-- Right: Originator -->
          <td style="width: ${contentWidth}%; border:none !important; padding: 4px ${rightMargin}px 0 14px;" class="align-top">
            ${originatorVal ? `<div class="font-bold text-black leading-snug inline-block" style="font-size: ${fontSize}px !important;"><u>${originatorVal}</u></div>` : ""}
          </td>
        </tr>

        <!-- Main Body Row: Paragraphs & Subsequent Addressees (Vertical divider line continues down to bottom of page) -->
        <tr style="border:none !important; height: 100%;">
          <!-- Left: Subsequent Addressees (Vertical line continues all the way down) -->
          <td style="width: ${marginWidth}%; border-right: 1.5px solid #000 !important; border-bottom:none !important; border-top:none !important; padding: 0 10px 14px 10px; height: 100%;" class="align-top">
            ${subsequentAddresseesHtml}
          </td>

          <!-- Right Column: Paragraphs, Recommendation, Date/Signatory, M-02 -->
          <td style="width: ${contentWidth}%; border:none !important; padding: 6px ${rightMargin}px 14px 14px; height: 100%;" class="align-top space-y-3">
            <!-- Paragraphs (Pic 1 Style) -->
            <div class="space-y-2 text-justify leading-relaxed text-black" style="font-size: ${fontSize}px !important;">
              ${parasHtml || `<p class="italic text-slate-400">No paragraph content entered yet.</p>`}
            </div>

            <!-- Recommendation / Final Clause -->
            ${recVal ? `
            <div class="pt-1 font-semibold text-black leading-relaxed" style="font-size: ${fontSize}px !important;">
              <p>${formatMinuteRichText(recVal)}</p>
            </div>` : ""}

            <!-- Date (Left) & Signature Block (Right) -->
            <div class="pt-6 flex items-end justify-between">
              <!-- Date -->
              <div class="font-bold text-black" style="font-size: ${fontSize}px !important;">
                ${dateVal}
              </div>

              <!-- Signature Space & Appointment -->
              <div class="text-center min-w-[160px] space-y-0.5">
                <div class="h-10"></div> <!-- Signature space -->
                ${signTitleVal ? `<p class="font-bold text-slate-900" style="font-size: ${Math.max(10, fontSize - 1)}px !important;">${signTitleVal}</p>` : ""}
              </div>
            </div>

            <!-- M-02 Block -->
            ${m02Html}
          </td>
        </tr>
      </table>
    </div>
  `;

  previewArea.innerHTML = renderedContent;

  // Mirror to Modal Preview if open
  const modalPreviewArea = document.getElementById("minuteSheetModalPrintArea");
  if (modalPreviewArea) {
    modalPreviewArea.innerHTML = renderedContent;
  }
}

// Universal Clean Printing Helper for Documents & Slips
function printElement(elementId, docTitle = "Sri Lanka Navy - Document Print") {
  const el = typeof elementId === "string" ? document.getElementById(elementId) : elementId;
  if (!el) {
    window.print();
    return;
  }

  const printWindow = window.open("", "_blank", "width=900,height=750");
  if (!printWindow) {
    window.print();
    return;
  }

  const isBw = store.msColorMode === "bw";
  const paperSize = store.msPaperSize === "letter" ? "letter" : "A4";

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${docTitle}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page {
            size: ${paperSize} portrait;
            margin: 15mm 15mm 15mm 15mm;
          }
          body {
            font-family: "Times New Roman", Times, Georgia, "Iskoola Pota", "Noto Sans Sinhala", serif, Arial, sans-serif;
            background: #ffffff;
            color: #000000;
            margin: 0;
            padding: 0;
            ${isBw ? "filter: grayscale(100%);" : ""}
          }
          table {
            border-collapse: collapse !important;
            border: none !important;
          }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; margin: 0; }
          }
        </style>
      </head>
      <body class="p-6">
        <div class="max-w-4xl mx-auto">
          ${el.innerHTML}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// Print Minute Sheet Shortcut
function printMinuteSheetDocument() {
  openMinutePrintSetupModal();
}

// Save Minute Record
function saveMinuteSheetRecord() {
  const refNo = document.getElementById("msInputRefNo")?.value || "MIN/2026/08/XXX";
  showToast(`Minute Sheet ${refNo} saved to records!`, "success");
}

// Save Current Minute Builder as a New Template
function saveMinuteAsNewTemplate() {
  const title = prompt("Enter a title for this new Minute Template (නව ආකෘතියේ නම ඇතුළත් කරන්න):");
  if (!title) return;

  const lang = store.msLanguage || "si";
  const refNo = document.getElementById("msInputRefNo")?.value || "MIN/2026/08/XXX";
  const subjectVal = document.getElementById("msInputSubject")?.value || "SUBJECT";
  
  const addRows = document.querySelectorAll(".ms-addressee-row");
  const addresseesList = [];
  if (addRows.length > 0) {
    addRows.forEach((row) => {
      const select = row.querySelector(".ms-addressee-select");
      const customInp = row.querySelector(".ms-addressee-custom-input");
      if (select && select.value === "__custom__" && customInp && customInp.value.trim()) {
        addresseesList.push(customInp.value.trim());
      } else if (select && select.value && select.value !== "__custom__") {
        addresseesList.push(select.value.trim());
      } else if (customInp && customInp.value.trim()) {
        addresseesList.push(customInp.value.trim());
      }
    });
  } else {
    const addInputs = document.querySelectorAll(".ms-addressee-input");
    addInputs.forEach((inp) => {
      if (inp.value.trim()) addresseesList.push(inp.value.trim());
    });
  }
  const addresseesVal = addresseesList.join("\n\n");

  const originatorVal = document.getElementById("msInputOriginator")?.value || "";
  const recVal = document.getElementById("msInputRecommendation")?.value || "";
  const signTitleVal = document.getElementById("msInputSignatoryTitle")?.value || "";

  const paraInputs = document.querySelectorAll(".ms-para-input");
  const paragraphs = [];
  paraInputs.forEach((inp) => {
    if (inp.value.trim()) paragraphs.push(inp.value.trim());
  });

  const isM02Enabled = document.getElementById("msEnableM02")?.checked || false;
  const m02Addressee = document.getElementById("msM02Addressee")?.value || "";
  const m02Originator = document.getElementById("msM02Originator")?.value || "";
  const m02Text = document.getElementById("msM02Text")?.value || "";
  const m02SignTitle = document.getElementById("msM02SignTitle")?.value || "";

  const newTpl = {
    id: `tpl_${Date.now()}`,
    lang: lang,
    title: title,
    category: "Custom Templates",
    ref_no: refNo,
    subject: subjectVal,
    addressees: addresseesVal,
    originator: originatorVal,
    paragraphs: paragraphs,
    recommendation: recVal,
    sign_title: signTitleVal,
    m02_enabled: isM02Enabled,
    m02_addressee: m02Addressee,
    m02_originator: m02Originator,
    m02_text: m02Text,
    m02_sign_title: m02SignTitle
  };

  store.minuteTemplates.push(newTpl);
  saveMinuteTemplatesToStorage();
  updateDocumentsMetricStats();
  populateMinuteSheetDropdowns();
  showToast(`Template "${title}" saved to Inventory!`, "success");
}

// Render Templates Inventory Grid
function renderMinuteTemplatesInventory() {
  const grid = document.getElementById("minuteTemplatesGrid");
  if (!grid) return;

  const templates = store.minuteTemplates || [];
  if (templates.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full p-8 border border-dashed border-slate-300 rounded-2xl text-center text-slate-400">
        No templates found. Click <strong>+ Add New Template</strong> to create one.
      </div>
    `;
    return;
  }

  grid.innerHTML = templates.map((t) => `
    <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md transition-all">
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${t.lang === "si" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-purple-50 text-purple-700 border border-purple-200"}">
            ${t.lang === "si" ? "🇱🇰 සිංහල" : "🇬🇧 English"} • ${t.category || "Civil Works"}
          </span>
          <span class="text-[10px] text-slate-400 font-mono">${(t.paragraphs || []).length} Paragraphs</span>
        </div>
        <h4 class="text-sm font-black text-slate-800">${t.title}</h4>
        <p class="text-xs text-slate-600 font-medium line-clamp-2">
          <strong>Subject:</strong> ${t.subject || "—"}
        </p>
        <p class="text-[11px] text-slate-500 line-clamp-2 italic">
          "${(t.paragraphs && t.paragraphs[0]) ? t.paragraphs[0] : t.recommendation || ""}"
        </p>
      </div>

      <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <button onclick="loadMinuteTemplateIntoCreator('${t.id}')" class="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5">
          <span>✍️</span> Use Template
        </button>
        <button onclick="openNewMinuteTemplateModal('${t.id}')" class="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer" title="Edit Template">
          ✏️
        </button>
        <button type="button" onclick="deleteMinuteTemplate('${t.id}', event)" class="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer" title="Delete Template">
          🗑️
        </button>
      </div>
    </div>
  `).join("");
}

// Load Selected Template Into Builder
function loadMinuteTemplateIntoCreator(templateId) {
  const tpl = (store.minuteTemplates || []).find((t) => t.id === templateId) ||
              DEFAULT_NAVAL_MINUTE_TEMPLATES.find((t) => t.id === templateId);
  if (!tpl) return;

  switchDocumentsSubTab("minutesheet");

  // Set Language
  if (tpl.lang) {
    setMinuteSheetLanguage(tpl.lang);
  }

  const refInput = document.getElementById("msInputRefNo");
  if (refInput && tpl.ref_no) refInput.value = tpl.ref_no;

  const dateInput = document.getElementById("msInputDate");
  if (dateInput) {
    dateInput.value = tpl.lang === "si" ? getSinhalaDateString() : getEnglishNavalDateString();
  }

  const subInput = document.getElementById("msInputSubject");
  if (subInput) subInput.value = tpl.subject || "";

  const addContainer = document.getElementById("msAddresseesContainer");
  if (addContainer) {
    addContainer.innerHTML = "";
    const rawAdd = tpl.addressees || (tpl.to ? `${tpl.to}\n\n${tpl.through || ""}`.trim() : "");
    if (rawAdd) {
      rawAdd.split("\n\n").join("\n").split("\n").map((a) => a.trim()).filter(Boolean).forEach((a) => {
        addMinuteAddresseeInput(a);
      });
    }
  }

  const oriInput = document.getElementById("msInputOriginator");
  if (oriInput) oriInput.value = tpl.originator || tpl.from || "";

  const recInput = document.getElementById("msInputRecommendation");
  if (recInput) recInput.value = tpl.recommendation || "";

  const sigInput = document.getElementById("msInputSignatoryTitle");
  if (sigInput) sigInput.value = tpl.sign_title || tpl.from || "";

  // Paragraphs
  const container = document.getElementById("msParagraphsContainer");
  if (container) {
    container.innerHTML = "";
    (tpl.paragraphs || []).forEach((p) => {
      addMinuteParagraphInput(p);
    });
  }

  // Minute 02
  const m02Check = document.getElementById("msEnableM02");
if (m02Check) {
    m02Check.checked = !!tpl.m02_enabled;
    toggleMinute02Section();
    if (tpl.m02_enabled) {
      const aInput = document.getElementById("msM02Addressee");
      if (aInput) aInput.value = tpl.m02_addressee || "";
      const oInput = document.getElementById("msM02Originator");
      if (oInput) oInput.value = tpl.m02_originator || "";
      const tInput = document.getElementById("msM02Text");
      if (tInput) tInput.value = tpl.m02_text || "";
      const sInput = document.getElementById("msM02SignTitle");
      if (sInput) sInput.value = tpl.m02_sign_title || "";
    }
  }

  updateMinuteSheetPreview();
  showToast(`Loaded "${tpl.title}" template into Builder!`, "success");
}

// Open Template Editor Modal
function openNewMinuteTemplateModal(templateId = null) {
  const idInput = document.getElementById("emtTemplateId");
  const titleInput = document.getElementById("emtTitle");
  const catInput = document.getElementById("emtCategory");
  const toInput = document.getElementById("emtTo");
  const subInput = document.getElementById("emtSubject");
  const bodyInput = document.getElementById("emtBody");
  const recInput = document.getElementById("emtRecommendation");
  const modalTitle = document.getElementById("emtModalTitle");

  if (templateId) {
    const tpl = (store.minuteTemplates || []).find((t) => t.id === templateId);
    if (tpl) {
      if (idInput) idInput.value = tpl.id;
      if (titleInput) titleInput.value = tpl.title;
      if (catInput) catInput.value = tpl.category || "Civil Works";
      if (toInput) toInput.value = tpl.addressees || tpl.to || "";
      if (subInput) subInput.value = tpl.subject || "";
      if (bodyInput) bodyInput.value = (tpl.paragraphs || []).join("\n\n");
      if (recInput) recInput.value = tpl.recommendation || "";
      if (modalTitle) modalTitle.textContent = "Edit Minute Template";
    }
  } else {
    if (idInput) idInput.value = "";
    if (titleInput) titleInput.value = "";
    if (catInput) catInput.value = "Civil Works";
    if (toInput) toInput.value = "විධායක නිලධාරි (තඨාකාංගනය)";
    if (subInput) subInput.value = "";
    if (bodyInput) bodyInput.value = "";
    if (recInput) recInput.value = "කරුණු එසේ හෙයින් කාරුණික අනුමැතිය අයදිමි.";
    if (modalTitle) modalTitle.textContent = "Add New Template to Inventory";
  }

  const modal = document.getElementById("editMinuteTemplateModal");
  if (modal) modal.classList.remove("hidden");
}

// Save Custom Template
function saveCustomMinuteTemplate() {
  const id = document.getElementById("emtTemplateId")?.value;
  const title = document.getElementById("emtTitle")?.value;
  const category = document.getElementById("emtCategory")?.value || "Civil Works";
  const to = document.getElementById("emtTo")?.value || "Chief Engineer";
  const subject = document.getElementById("emtSubject")?.value || "";
  const body = document.getElementById("emtBody")?.value || "";
  const rec = document.getElementById("emtRecommendation")?.value || "";

  const paragraphs = body.split("\n\n").map((p) => p.trim()).filter(Boolean);

  if (id) {
    const tpl = (store.minuteTemplates || []).find((t) => t.id === id);
    if (tpl) {
      tpl.title = title;
      tpl.category = category;
      tpl.addressees = to;
      tpl.subject = subject;
      tpl.paragraphs = paragraphs;
      tpl.recommendation = rec;
    }
  } else {
    const newTpl = {
      id: `tpl_${Date.now()}`,
      lang: store.msLanguage || "si",
      title: title,
      category: category,
      ref_no: "MIN/2026/08/XXX",
      addressees: to,
      originator: "කාර්ය භාර නිලධාරි මඟින්",
      subject: subject,
      paragraphs: paragraphs,
      recommendation: rec,
      sign_title: "කාර්ය භාර නිලධාරි"
    };
    store.minuteTemplates.push(newTpl);
  }

  saveMinuteTemplatesToStorage();
  closeModal("editMinuteTemplateModal");
  updateDocumentsMetricStats();
  renderMinuteTemplatesInventory();
  showToast(`Template "${title}" saved to Inventory!`, "success");
}

// Delete Template
function deleteMinuteTemplate(templateId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  if (!confirm("Are you sure you want to delete this template from the Inventory?")) return;
  store.minuteTemplates = (store.minuteTemplates || []).filter((t) => t.id !== templateId);
  saveMinuteTemplatesToStorage();
  updateDocumentsMetricStats();
  renderMinuteTemplatesInventory();
  showToast("Template removed from Inventory", "info");
}

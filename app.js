var _document$getElementB3, _document$getElementB4; // =============================================
// GLOBAL ERROR HANDLER (DEBUG)
// =============================================
window.onerror = function (msg, url, line, col, error) {
  console.error("🚨 JS ERROR:", msg, "at", url, "line:", line);
  const errDiv = document.createElement("div");
  errDiv.style.cssText =
    "position:fixed;top:0;left:0;right:0;z-index:99999;background:red;color:white;padding:8px 12px;font-size:12px;font-family:monospace;cursor:pointer;";
  errDiv.textContent = "🚨 JS Error: " + msg + " (line " + line + ")";
  errDiv.onclick = function () {
    this.remove();
  };
  document.body.appendChild(errDiv);
  return false;
}; // =============================================
// PWA SERVICE WORKER REGISTRATION
// =============================================
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => {
        reg.update();
        console.log("⚓ PWA Service Worker active with scope:", reg.scope);
      })
      .catch((err) => {
        console.warn("⚓ Service Worker registration failed:", err);
      });
  });
}

// Custom PWA Installer trigger variables and listeners
let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log("⚓ PWA Installable prompt intercepted!");
  // Show our custom header install button
  const installBtn = document.getElementById("installAppBtn");
  if (installBtn) {
    installBtn.classList.remove("hidden");
  }
  // Refresh the profile dropdown to show the install button if open
  renderProfileDropdown();
});

window.addEventListener("appinstalled", (evt) => {
  console.log("⚓ CE Management System PWA was installed successfully!");
  deferredPrompt = null;
  const installBtn = document.getElementById("installAppBtn");
  if (installBtn) {
    installBtn.classList.add("hidden");
  }
  renderProfileDropdown();
});

function triggerPwaInstall() {
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone;
  if (isStandalone) {
    if (typeof showToast === "function") {
      showToast("CMSys is already installed & running in App Mode! 🚀", "info");
    } else {
      alert("CMSys is already installed and running in App Mode!");
    }
    return;
  }

  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("⚓ User accepted PWA installation");
      } else {
        console.log("⚓ User dismissed PWA installation");
      }
      deferredPrompt = null;
      const installBtn = document.getElementById("installAppBtn");
      if (installBtn) {
        installBtn.classList.add("hidden");
      }
      renderProfileDropdown();
    });
  } else {
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      if (typeof showToast === "function") {
        showToast(
          "📱 Install on iOS: Tap Share (⎋) button and select 'Add to Home Screen'",
          "info",
          6000
        );
      } else {
        alert(
          "To install on iOS:\nTap the Safari Share button (⎋) and select 'Add to Home Screen'."
        );
      }
    } else {
      if (typeof showToast === "function") {
        showToast(
          "📱 Install App: Tap browser menu (⋮) and select 'Install app' or 'Add to Home screen'",
          "info",
          6000
        );
      } else {
        alert(
          "To install on Mobile / PC:\nTap browser menu (⋮) and select 'Install app' or 'Add to Home screen'."
        );
      }
    }
  }
} // Global Runtime Error Alert for Remote Debugging
window.addEventListener("error", function (e) {
  const errDiv = document.createElement("div");
  errDiv.style.position = "fixed";
  errDiv.style.top = "0";
  errDiv.style.left = "0";
  errDiv.style.right = "0";
  errDiv.style.background = "#ef4444";
  errDiv.style.color = "#ffffff";
  errDiv.style.padding = "8px";
  errDiv.style.fontSize = "12px";
  errDiv.style.zIndex = "9999";
  errDiv.style.textAlign = "center";
  errDiv.textContent =
    "System Error: " + e.message + " at " + e.filename + ":" + e.lineno;
  document.body.appendChild(errDiv);
}); // =============================================
// CMSys v2.6 - CE Management System
// Main Application JavaScript
// =============================================
// =============================================
// ADMIN & STAFF DUTIES ZONE HELPER
// The zone ID may be stored as 'Admin-&-Staff-Duties', 'Admin & Staff Duties',
// 'Admin-Staff-Duties' etc. This helper normalizes the check.
// =============================================
function isAdminStaffDuties(zoneIdOrName) {
  if (!zoneIdOrName) return false;
  const normalized = zoneIdOrName.toLowerCase().replace(/[-&\s]+/g, "");
  return normalized === "adminstaffduties";
}

function isZoneMatch(z1, z2) {
  if (!z1 && !z2) return true;
  if (!z1 || !z2) return false;
  if (z1 === z2) return true;
  if (isAdminStaffDuties(z1) && isAdminStaffDuties(z2)) return true;
  if (typeof isSbsZone === "function" && isSbsZone(z1) && isSbsZone(z2)) return true;

  const s1 = String(z1).trim().toLowerCase().replace(/[-_\s&]+/g, "");
  const s2 = String(z2).trim().toLowerCase().replace(/[-_\s&]+/g, "");
  if (s1 === s2) return true;

  const isCarpentryOrPaint = (s) =>
    s.includes("carpenter") ||
    s.includes("carpentry") ||
    s.includes("carpentary") ||
    s.includes("paintworkshop") ||
    s.includes("paintershop") ||
    s.includes("paintshop") ||
    s.includes("paint") ||
    s.includes("carpenterpaint") ||
    s.includes("carpentarypaint") ||
    s.includes("carpentrypaint");
  if (isCarpentryOrPaint(s1) && isCarpentryOrPaint(s2)) return true;

  const letterMap = {
    a: "azone",
    b: "bzone",
    c: "czone",
    d: "dzone",
    e: "ezone",
    g: "gzone",
    zonea: "azone",
    zoneb: "bzone",
    zonec: "czone",
    zoned: "dzone",
    zonee: "ezone",
    zoneg: "gzone",
    fh: "fhzone",
    zonefh: "fhzone",
    fhad: "fhzone",
    fhadzone: "fhzone",
  };
  const norm1 = letterMap[s1] || s1;
  const norm2 = letterMap[s2] || s2;
  return norm1 === norm2;
}

function formatZoneDisplayName(zoneId) {
  if (!zoneId) return "";
  if (isAdminStaffDuties(zoneId)) return "Admin & Staff Duties";
  const zObj = (store.zones || []).find(
    (z) => z.id === zoneId || z.name === zoneId || isZoneMatch(z.id, zoneId) || isZoneMatch(z.name, zoneId),
  );
  if (zObj && zObj.name) return zObj.name;
  return String(zoneId).replace(/[-_]+/g, " ").trim();
}

function getDailyDetailsReportTitle(zoneId, targetDate) {
  const selectedZone = zoneId || store.currentZone || "A-Zone";
  const dateVal = targetDate || store.dashboardDate || getLocalDateString();
  const isAll = String(selectedZone).toUpperCase() === "ALL";
  const zoneDisplayName = isAll ? "ALL ZONES" : (formatZoneDisplayName(selectedZone) || selectedZone);
  const safeZone = String(zoneDisplayName).replace(/[/\\:*?"<>|]/g, "").trim();
  const safeDate = String(dateVal).replace(/[/\\:*?"<>|]/g, "-").trim();
  return `${safeZone} - Daily Details - ${safeDate}`;
}

function updateDocumentTitleDesktop(zoneId, targetDate) {
  const title = getDailyDetailsReportTitle(zoneId, targetDate);
  document.title = title;
  const titleEl = document.querySelector("title");
  if (titleEl) {
    titleEl.textContent = title;
  }
}
function parseOfficialNumber(offNo) {
  if (!offNo) return { type: "•", num: "-" };
  const clean = offNo.trim().replace(/^[^a-zA-Z0-9]+/, '');
  const match = clean.match(/^([A-Za-z\/&]+)[\s\.\-]*(\d+[A-Za-z]*)$/);
  if (match) {
    return { type: match[1], num: match[2] };
  }
  const parts = clean.split(/[\s]+/);
  if (parts.length > 1) {
    return { type: parts[0], num: parts.slice(1).join(" ") };
  }
  if (/^\d+$/.test(clean)) {
    return { type: "•", num: clean };
  }
  return { type: "•", num: clean };
}

// Universal extractor for sailor identifiers (IDs, Firebase keys, official numbers, service numbers)
function extractSailorKeys(val) {
  const keys = [];
  if (!val) return keys;
  if (Array.isArray(val)) {
    val.forEach((item) => {
      if (!item) return;
      if (typeof item === "object") {
        if (item.id !== undefined && item.id !== null) keys.push(String(item.id).trim());
        if (item._fbKey) keys.push(String(item._fbKey).trim());
        if (item.sailor_id) keys.push(String(item.sailor_id).trim());
        if (item.official_number) keys.push(String(item.official_number).trim());
        if (item.service_no) keys.push(String(item.service_no).trim());
        if (item.offNo) keys.push(String(item.offNo).trim());
      } else {
        keys.push(String(item).trim());
      }
    });
  } else if (typeof val === "object") {
    Object.keys(val).forEach((k) => keys.push(String(k).trim()));
    Object.values(val).forEach((v) => {
      if (!v) return;
      if (typeof v === "object") {
        if (v.id !== undefined && v.id !== null) keys.push(String(v.id).trim());
        if (v._fbKey) keys.push(String(v._fbKey).trim());
        if (v.sailor_id) keys.push(String(v.sailor_id).trim());
        if (v.official_number) keys.push(String(v.official_number).trim());
        if (v.service_no) keys.push(String(v.service_no).trim());
        if (v.offNo) keys.push(String(v.offNo).trim());
      } else if (typeof v === "string" || typeof v === "number") {
        keys.push(String(v).trim());
      }
    });
  } else if (typeof val === "string" || typeof val === "number") {
    keys.push(String(val).trim());
  }
  return keys;
}

// Universal matcher for a sailor object against an ID / key / official number (supports numeric digits like 60242 matching VAS 60242)
function isSailorMatchingKeys(s, keysSetOrArray) {
  if (!s || !keysSetOrArray) return false;
  const sid = (s.id !== undefined && s.id !== null) ? String(s.id).trim() : null;
  const sfb = s._fbKey ? String(s._fbKey).trim() : null;
  const soff = (s.official_number || s.service_no || s.off_no) ? String(s.official_number || s.service_no || s.off_no).trim() : null;
  const sDigits = soff ? soff.replace(/\D/g, "") : null;

  if (keysSetOrArray instanceof Set) {
    if (sid && keysSetOrArray.has(sid)) return true;
    if (sfb && keysSetOrArray.has(sfb)) return true;
    if (soff) {
      if (keysSetOrArray.has(soff) || keysSetOrArray.has(soff.toLowerCase()) || keysSetOrArray.has(soff.toUpperCase())) return true;
    }
    if (sDigits && sDigits.length >= 3 && keysSetOrArray.has(sDigits)) return true;
    return false;
  }

  for (const k of keysSetOrArray) {
    if (!k) continue;
    const kStr = String(k).trim();
    if (!kStr) continue;
    if (sid && sid === kStr) return true;
    if (sfb && sfb === kStr) return true;
    if (soff && soff.toLowerCase() === kStr.toLowerCase()) return true;
    // ONLY compare digits for official numbers, NEVER for Firebase push keys (which start with '-' and can cause hash collisions with official numbers)
    if (!kStr.startsWith('-') && kStr.length < 16) {
      const kDigits = kStr.replace(/\D/g, "");
      if (kDigits.length >= 3 && sDigits && sDigits.length >= 3 && kDigits === sDigits) return true;
    }
  }
  return false;
} // =============================================
// DATA STORE
// NOTE: Arrays start empty — Firebase listeners populate them
// Hardcoded fallback data retained as safety defaults
// =============================================
// Helper for UTC safe timezone processing (Sri Lanka local date)
function getLocalDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to get day of week (0=Sun, 1=Mon, ..., 5=Fri, 6=Sat) for any YYYY-MM-DD string
function getDayOfWeekFromDate(dateVal) {
  const target = dateVal || (typeof store !== "undefined" && store && store.dashboardDate) || getLocalDateString();
  if (typeof target === "string" && target.includes("-")) {
    const parts = target.split("-").map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2]).getDay();
    }
  }
  return new Date().getDay();
}

// Unified, date-aware checker for sailor leave / sick / absence.
// Naval & Sri Lanka Navy Business Rule:
// 1. "WE" (Weekend): Absence ONLY on Saturday (6) and Sunday (0).
//    On Friday (5) and Monday-Thursday, personnel are ON DUTY during working hours!
//    Therefore, on Friday, "WE" / "Weekend" returns FALSE (not absent, never removed from duties).
// 2. Naval Leave Routine: "T/D L ... L R/D"
//    - T/D (Travelling Date): Departure day - NOT available for duties.
//    - L (Leave / Days Leave): Leave days - NOT available for duties.
//    - R/D (Reporting Date): Reporting back to base - NOT available for duties on that day!
// 3. Genuine leave/absence (L, DL, Sick, SIQ, ADM, AWOL, etc.) returns TRUE.
function isSailorOnLeaveOnDate(statusVal, dateVal) {
  if (!statusVal) return false;
  const s = typeof statusVal === "string" ? statusVal.trim() : String(statusVal).trim();
  if (!s) return false;

  const dayOfWeek = getDayOfWeekFromDate(dateVal);

  // Weekend (WE / Weekend): ONLY absent on Saturday (6) and Sunday (0)
  if (/^(WE|Weekend|WEEKEND)$/i.test(s)) {
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  // T/D, L, R/D, sick, and absences are all off-duty / not available for work
  return /^(Leave|Days Leave|Half Day|Sick|Sick Report|Sick Leave|SIQ|Medical|MED|M\/C|MC|NGH|Admit|ADM|Run|AWOL|NA|N\/A|L|DL|HD|T\/D|TD|T\s*\/\s*D|Traveling Date|Travel Date|Travel Day|Temporary Duty|R\/D|RD|R\s*\/\s*D|Reporting Date|Report Date|Reporting Day|Report Day|M\/D|MD|S\/R|SR|S\s*\/\s*R|S\/L|SL|S\s*\/\s*L|R|Off|Holiday|Absent|නිවාඩු|ගිලන්)$/i.test(s);
}

// Global helper: Identify whether a status code represents a sick/medical condition
function isSailorSickOnDate(statusVal) {
  if (!statusVal) return false;
  const s = typeof statusVal === "string" ? statusVal.trim() : String(statusVal).trim();
  if (!s) return false;
  return /^(Sick|SICK|SIQ|S\/R|SR|S\s*\/\s*R|S\/L|SL|S\s*\/\s*L|Sick Leave|Sick Report|Hospital|ADM|Admit|MED|Medical|M\/C|MC|NGH|M\/D|MD|ගිලන්)$/i.test(s);
}

// Global helper: Lookup sailor's daily attendance from store.availability
function getSailorDailyAttendanceStatus(sailor, dateVal) {
  if (!sailor || typeof store === "undefined" || !store || !store.availability) return null;
  const dateStr = dateVal || store.dashboardDate || getLocalDateString();
  if (!dateStr || typeof dateStr !== "string") return null;
  const parts = dateStr.split("-");
  if (parts.length < 3) return null;
  const [yyyy, mm, dd] = parts;
  const monthKey = `${yyyy}-${mm}`;
  const monthData = store.availability[monthKey];
  if (!monthData || typeof monthData !== "object") return null;

  const dayInt = parseInt(dd, 10).toString();
  const dayPadded = String(dd).padStart(2, "0");
  const dayData = monthData[dayInt] || monthData[dayPadded] || monthData[dd];
  if (!dayData || typeof dayData !== "object") return null;

  const sFb = sailor._fbKey ? String(sailor._fbKey).trim() : "";
  const sId = sailor.id !== undefined && sailor.id !== null ? String(sailor.id).trim() : "";
  const sOff = String(sailor.official_number || sailor.off_no || sailor.official_no || sailor.service_no || "").trim();
  const sDigits = sOff.replace(/\D/g, "");

  if (sFb && dayData[sFb] !== undefined && dayData[sFb] !== null) return String(dayData[sFb]).trim();
  if (sId && dayData[sId] !== undefined && dayData[sId] !== null) return String(dayData[sId]).trim();
  if (sOff && dayData[sOff] !== undefined && dayData[sOff] !== null) return String(dayData[sOff]).trim();
  if (sDigits && dayData[sDigits] !== undefined && dayData[sDigits] !== null) return String(dayData[sDigits]).trim();

  // Fast O(1) indexed lookup cache
  if (!dayData._normalizedMap) {
    const map = new Map();
    const dayKeys = Object.keys(dayData);
    for (let i = 0; i < dayKeys.length; i++) {
      const k = dayKeys[i];
      if (k.startsWith('_')) continue;
      const val = dayData[k];
      if (val === undefined || val === null) continue;
      const vStr = String(val).trim();
      const kTrim = k.trim();
      map.set(kTrim, vStr);
      map.set(kTrim.toLowerCase(), vStr);
      const digits = kTrim.replace(/\D/g, "");
      if (digits.length >= 4) map.set(digits, vStr);
    }
    Object.defineProperty(dayData, '_normalizedMap', { value: map, writable: true, enumerable: false, configurable: true });
  }

  const normMap = dayData._normalizedMap;
  if (sFb && normMap.has(sFb)) return normMap.get(sFb);
  if (sId && normMap.has(sId)) return normMap.get(sId);
  if (sOff && normMap.has(sOff.toLowerCase())) return normMap.get(sOff.toLowerCase());
  if (sDigits && sDigits.length >= 4 && normMap.has(sDigits)) return normMap.get(sDigits);

  return null;
}


function getInitialAppZone() {
  try {
    const params = new URLSearchParams(window.location.search);
    const qZone = params.get("zone");
    if (qZone && qZone.trim()) {
      const trimmed = qZone.trim();
      localStorage.setItem("ncw_saved_zone", trimmed);
      return trimmed;
    }
  } catch (e) {}
  const savedType = localStorage.getItem("ncw_ps_active_profile_type") || sessionStorage.getItem("ncw_ps_active_profile_type");
  const savedProfileZone = localStorage.getItem("ncw_ps_active_profile_zone") || sessionStorage.getItem("ncw_ps_active_profile_zone");
  if ((savedType === "ZoneInCharge" || savedType === "ZoneSubInCharge") && savedProfileZone) {
    localStorage.setItem("ncw_saved_zone", savedProfileZone);
    return savedProfileZone;
  }
  return localStorage.getItem("ncw_saved_zone") || "A-Zone";
}

function getInitialAppView() {
  try {
    const hash = window.location.hash ? window.location.hash.replace(/^#/, "").trim().toLowerCase() : "";
    const saved = localStorage.getItem("ncw_saved_view");
    const validViews = [
      "dashboard", "projects", "jobcards", "inventory", "estimates",
      "maintenance", "reports", "settings", "dailydetails", "summary",
      "sailors", "sailordashboard", "documents", "nastatus"
    ];
    if (hash && validViews.includes(hash)) return hash;
    if (saved && validViews.includes(saved)) return saved;
  } catch (e) {}
  return "dashboard";
}

const store = {
  currentZone: getInitialAppZone(),
  currentView: getInitialAppView(),
  activeProfileType: null,
  activeProfileZone: null,
  currentFilter: "all",
  currentTrade: "ALL",
  selectedJobCard: null,
  selectedEstimate: null,
  selectedLocation: null,
  selectedWorkOrder: null,
  isEveningMode: false,
  currentJobCardsTab: "active",
  currentInventoryCategory: "all",
  selectedEstimatesForPrint: [], // Logged-in user (defaults the "Created By" signature block on estimates)
  currentUser: {
    name: "Sanjeewa Bandara",
    rank: "PO1 (CE)",
    serviceNo: "NRX 12345",
  }, // ── Loaded from Firebase DB #1 (ce-admin-panel2025) ──
  sailors: [],
  availability: {},
  outProjects: {},
  housingProjects: {},
  otherBases: {},
  tempDrafts: {}, // ── Loaded from Firebase DB #2 (operations database) ──
  workOrders: [],
  jobCards: [],
  jobCardMaterials: [],
  jobCardLabor: [],
  inventory: [],
  locations: [],
  maintenanceRecords: [],
  estimates: [],
  approvedPendingJobs: [],
  approvedProjects: [],
  precastBatches: [],
  nav254Vouchers: [],
  tempIssues: [],
  selectedJobCardsForMerge: new Set(),
  isJobCardMergeMode: false,
  dailyAllocations: [],
  availableSailorsLimit: 40,
  dailyAllocationsMap: {}, // Static config (not stored in Firebase)
  approvalAuthorities: ["CCED(E)", "CENA", "DAC(E)", "DGCE", "CCEO(E)"],
  zones: [
    { id: "A-Zone", name: "A-Zone", status: "Active", active: true },
    { id: "B-Zone", name: "B-Zone", status: "Active", active: true },
    { id: "BC-Zone", name: "BC-Zone", status: "Active", active: true },
    { id: "C-Zone", name: "C-Zone", status: "Active", active: true },
    { id: "D-Zone", name: "D-Zone", status: "Active", active: true },
    { id: "E-Zone", name: "E-Zone", status: "Active", active: true },
    { id: "G-Zone", name: "G-Zone", status: "Active", active: true },
    { id: "FH-Zone", name: "FH-Zone", status: "Active", active: true },
    { id: "OTW", name: "OTW", status: "Active", active: true },
    { id: "Supply-School", name: "Supply School", status: "Active", active: true },
    { id: "Pump-House", name: "Pump House", status: "Active", active: true },
    { id: "Main-Store", name: "Main Store", status: "Active", active: true },
    { id: "Carpentry-Shop", name: "Carpentary & Paint", status: "Active", active: true },
    { id: "Welding-Shop", name: "Welding Shop", status: "Active", active: true },
    { id: "Aluminium-Workshop", name: "Aluminium Workshop", status: "Active", active: true }
  ],
  offChargeDestinations: [
    "SLNS Tissa",
    "SLNS Vijaya",
    "SLNS Gemunu",
    "SLNS Rangalla",
    "BC-Zone",
    "A-Zone",
    "Carpentry-Shop",
    "Welding-Shop",
    "Public Supply (Town)",
  ],
  tradeStats: {
    MA: { strength: 8, present: 7, leave: 1, sick: 0 },
    CA: { strength: 6, present: 5, leave: 0, sick: 1 },
    PA: { strength: 5, present: 4, leave: 1, sick: 0 },
    PL: { strength: 4, present: 4, leave: 0, sick: 0 },
    WE: { strength: 3, present: 3, leave: 0, sick: 0 },
    RW: { strength: 2, present: 2, leave: 0, sick: 0 },
  },
}; // =============================================
// FIREBASE INTEGRATION LAYER
// DB#1 = sailorsDB  (ce-admin-panel2025)   → READ ONLY
// DB#2 = opsDB      (operations database)    → READ + WRITE
// =============================================
// Helper to safely parse cost, handling commas and string prefixes like "Rs."
function safeParseCost(val) {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === "number") return val;
  let str = String(val).toLowerCase(); // Remove rs, rs., commas, and spaces
  str = str.replace(/rs\.?/g, "").replace(/,/g, "").replace(/\s/g, ""); // Strip any remaining characters that are not digits or decimal point
  str = str.replace(/[^0-9.]/g, "");
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
} // ── Helper: convert Firebase snapshot object → array with _fbKey ──
function snapshotToArray(snapshot) {
  if (!snapshot.exists()) return [];
  const val = snapshot.val();
  if (Array.isArray(val)) {
    return val
      .map((item, idx) => {
        if (!item) return null;
        return { ...item, _fbKey: String(idx) };
      })
      .filter(Boolean);
  }
  return Object.entries(val).map(([key, item]) => ({ ...item, _fbKey: key }));
} // ── Helper: generate CMSys numeric id from Firebase key ──
let _idCounter = Date.now();
function nextId() {
  return ++_idCounter;
} // ─────────────────────────────────────────────
// DB #1 LISTENERS — Sailors (READ ONLY)
// Reads from the "sailors" node in ce-admin-panel2025
// Maps Firebase fields → CMSys store.sailors format
// ─────────────────────────────────────────────
function initSailorsListener() {
  sailorsDB.ref("sailors").on(
    "value",
    (snapshot) => {
      var _store$sailors$;
      const raw = snapshotToArray(snapshot);
      if (raw.length === 0) {
        console.warn(
          "⚠️ DB#1: sailors node empty or not found — check Firebase structure",
        );
        return;
      } // ── Debug: log first sailor's raw keys so we know exact field names ──
      if (raw[0]) {
        console.log("🔍 DB#1 Sailor raw fields:", Object.keys(raw[0]));
        console.log("🔍 DB#1 First sailor sample:", raw[0]);
      }
      store._seenSailorIds = new Set();
      store.sailors = raw.map((s, idx) => {
        var _ref,
          _ref2,
          _ref3,
          _ref4,
          _ref5,
          _ref6,
          _ref7,
          _ref8,
          _ref9,
          _ref0,
          _ref1,
          _ref10,
          _ref11,
          _ref12,
          _s$official_number,
          _ref13,
          _ref14,
          _s$name,
          _ref15,
          _s$firstName,
          _ref16,
          _s$lastName,
          _ref17,
          _ref18,
          _s$rank,
          _s$id,
          _s$status,
          _ref22,
          _s$attendance,
          _ref23,
          _ref24,
          _s$zone_assigned,
          _ref25,
          _ref26,
          _s$avgScore,
          _ref27,
          _s$yesterdayScore,
          _ref28,
          _s$isZoneTeam,
          _s$yesterdayJob,
          _s$evaluated; // ── Resolve Official / Off Number — try every known field name variant ──
        const offNo =
          (_ref =
            (_ref2 =
              (_ref3 =
                (_ref4 =
                  (_ref5 =
                    (_ref6 =
                      (_ref7 =
                        (_ref8 =
                          (_ref9 =
                            (_ref0 =
                              (_ref1 =
                                (_ref10 =
                                  (_ref11 =
                                    (_ref12 =
                                      (_s$official_number =
                                        s.official_number) !== null &&
                                      _s$official_number !== void 0
                                        ? _s$official_number // official_number
                                        : s.officialNumber) !== null &&
                                    _ref12 !== void 0
                                      ? _ref12 // officialNumber
                                      : s.off_no) !== null && _ref11 !== void 0
                                    ? _ref11 // off_no
                                    : s.offNo) !== null && _ref10 !== void 0
                                  ? _ref10 // offNo
                                  : s.service_no) !== null && _ref1 !== void 0
                                ? _ref1 // service_no
                                : s.serviceNo) !== null && _ref0 !== void 0
                              ? _ref0 // serviceNo
                              : s.reg_no) !== null && _ref9 !== void 0
                            ? _ref9 // reg_no
                            : s.regNo) !== null && _ref8 !== void 0
                          ? _ref8 // regNo
                          : s.personal_no) !== null && _ref7 !== void 0
                        ? _ref7 // personal_no
                        : s.personalNo) !== null && _ref6 !== void 0
                      ? _ref6 // personalNo
                      : s.army_no) !== null && _ref5 !== void 0
                    ? _ref5 // army_no
                    : s.navy_no) !== null && _ref4 !== void 0
                  ? _ref4 // navy_no
                  : s.registration_no) !== null && _ref3 !== void 0
                ? _ref3 // registration_no
                : s.sno) !== null && _ref2 !== void 0
              ? _ref2 // sno
              : s.id_no) !== null && _ref !== void 0
            ? _ref // id_no
            : null; // ── Resolve Name — try variants ──
        const fullName =
          ((_ref13 =
            (_ref14 =
              (_s$name = s.name) !== null && _s$name !== void 0
                ? _s$name
                : s.fullName) !== null && _ref14 !== void 0
              ? _ref14
              : s.full_name) !== null && _ref13 !== void 0
            ? _ref13
            : (
                ((_ref15 =
                  (_s$firstName = s.firstName) !== null &&
                  _s$firstName !== void 0
                    ? _s$firstName
                    : s.first_name) !== null && _ref15 !== void 0
                  ? _ref15
                  : "") +
                " " +
                ((_ref16 =
                  (_s$lastName = s.lastName) !== null && _s$lastName !== void 0
                    ? _s$lastName
                    : s.last_name) !== null && _ref16 !== void 0
                  ? _ref16
                  : "")
              ).trim()) || "Unknown"; // ── Resolve Rank ──
        const rank =
          (_ref17 =
            (_ref18 =
              (_s$rank = s.rank) !== null && _s$rank !== void 0
                ? _s$rank
                : s.rankName) !== null && _ref18 !== void 0
              ? _ref18
              : s.rank_name) !== null && _ref17 !== void 0
            ? _ref17
            : "AB"; // ── Build search index — concatenate ALL string values from raw object ──
        // This means search works regardless of field name in Firebase
        const _searchIndex = Object.values(s)
          .filter((v) => typeof v === "string" || typeof v === "number")
          .map((v) => String(v).toLowerCase())
          .join(" ");
        // Ensure strictly unique ID to prevent mass-assignment bugs if DB has duplicated IDs
        let rawId = s.id !== null && s.id !== void 0 ? String(s.id).trim() : "";
        if (!rawId || rawId === "undefined" || rawId === "null" || rawId === "[object Object]") {
          rawId = String(s._fbKey || idx + 1);
        }
        // Fallback to fbKey/idx if id is duplicated across multiple sailors
        let finalId = rawId;
        if (store._seenSailorIds && store._seenSailorIds.has(finalId)) {
          finalId = String(s._fbKey || idx + 1);
          if (store._seenSailorIds.has(finalId)) finalId = `ID_${idx}_${Date.now()}`;
        }
        if (!store._seenSailorIds) store._seenSailorIds = new Set();
        store._seenSailorIds.add(finalId);

        return {
          ...s,
          _rawIndex: idx,
          _fbKey: s._fbKey || "",
          id: finalId,
          official_number:
            offNo !== null && offNo !== void 0 ? offNo : `ID/${idx}`,
          name: fullName,
          rank: rank,
          city: s.city || "",
          police_station: s.police_station || "",
          district: s.district || "",
          address: s.address || "",
          special_skill: s.special_skill || s.skills || "",
          contact_no: s.contact_no || "",
          blood_group: s.blood_group || "",
          nok_name: s.nok_name || "",
          join_date: s.join_date || "",
          id_expiry: s.id_expiry || "",
          roll: s.roll || "",
          trade: ((_ref19, _ref20, _s$trade) => {
            const t = (
              (_ref19 =
                (_ref20 =
                  (_s$trade = s.trade) !== null && _s$trade !== void 0
                    ? _s$trade
                    : s.tradeName) !== null && _ref20 !== void 0
                  ? _ref20
                  : s.trade_name) !== null && _ref19 !== void 0
                ? _ref19
                : "MA"
            )
              .trim()
              .toUpperCase();
            return t === "WEL" ? "WE" : t;
          })(),
          category: ((_ref21, _s$category) => {
            const o = (offNo !== null && offNo !== void 0 ? offNo : "")
              .trim()
              .toUpperCase();
            if (o.startsWith("EC")) return "Regular";
            if (o.startsWith("AC")) return "Artificer";
            if (o.startsWith("VAS")) return "VAS";
            return (_ref21 =
              (_s$category = s.category) !== null && _s$category !== void 0
                ? _s$category
                : s.cat) !== null && _ref21 !== void 0
              ? _ref21
              : "Regular";
          })(),
          status:
            (_s$status = s.status) !== null && _s$status !== void 0
              ? _s$status
              : "Available",
          attendance:
            (_ref22 =
              (_s$attendance = s.attendance) !== null &&
              _s$attendance !== void 0
                ? _s$attendance
                : s.att) !== null && _ref22 !== void 0
              ? _ref22
              : "Present",
          zone_assigned:
            (_ref23 =
              (_ref24 =
                (_s$zone_assigned = s.zone_assigned) !== null &&
                _s$zone_assigned !== void 0
                  ? _s$zone_assigned
                  : s.zone) !== null && _ref24 !== void 0
                ? _ref24
                : s.zoneId) !== null && _ref23 !== void 0
              ? _ref23
              : "A-Zone",
          avgScore: parseFloat(
            (_ref25 =
              (_ref26 =
                (_s$avgScore = s.avgScore) !== null && _s$avgScore !== void 0
                  ? _s$avgScore
                  : s.performance_score) !== null && _ref26 !== void 0
                ? _ref26
                : s.avg_score) !== null && _ref25 !== void 0
              ? _ref25
              : 7.0,
          ),
          yesterdayScore: parseFloat(
            (_ref27 =
              (_s$yesterdayScore = s.yesterdayScore) !== null &&
              _s$yesterdayScore !== void 0
                ? _s$yesterdayScore
                : s.avgScore) !== null && _ref27 !== void 0
              ? _ref27
              : 7.0,
          ),
          isZoneTeam:
            (_ref28 =
              (_s$isZoneTeam = s.isZoneTeam) !== null &&
              _s$isZoneTeam !== void 0
                ? _s$isZoneTeam
                : s.is_zone_team) !== null && _ref28 !== void 0
              ? _ref28
              : false,
          yesterdayJob:
            (_s$yesterdayJob = s.yesterdayJob) !== null &&
            _s$yesterdayJob !== void 0
              ? _s$yesterdayJob
              : null,
          evaluated:
            (_s$evaluated = s.evaluated) !== null && _s$evaluated !== void 0
              ? _s$evaluated
              : false,
          na_duration: s.na_duration || s.leave_pattern || s.duration_str || "",
          _fbKey: s._fbKey,
          _searchIndex, // ← used for search — covers ALL Firebase fields
        };
      });
      if (typeof invalidateSailorLookupCache === "function") invalidateSailorLookupCache();
      console.log(`✅ DB#1: Loaded ${store.sailors.length} sailors`);
      console.log(
        `   Sample Off No: "${(_store$sailors$ = store.sailors[0]) === null || _store$sailors$ === void 0 ? void 0 : _store$sailors$.official_number}"`,
      ); // Re-render dashboard or summary if visible
      if (
        !document.getElementById("view-dashboard").classList.contains("hidden")
      ) {
        renderDashboard();
      }
      if (
        typeof renderSummaryView === "function" &&
        !document.getElementById("view-summary").classList.contains("hidden")
      ) {
        renderSummaryView();
      }
      if (
        typeof renderSailorsView === "function" &&
        !document.getElementById("view-sailors").classList.contains("hidden")
      ) {
        renderSailorsView();
      }
      if (
        typeof renderProjectsList === "function" &&
        document.getElementById("view-projects") &&
        !document.getElementById("view-projects").classList.contains("hidden")
      ) {
        renderProjectsList();
      } // Re-render personal sailor dashboard if active profile is Sailor
      if (store.activeProfileType === "Sailor") {
        renderSailorDashboardView();
      } // Re-render user settings profile if settings page is open
      if (
        !document
          .getElementById("view-settings")
          .classList.contains("hidden") &&
        _currentSettingsTab === "user"
      ) {
        switchSettingsTab("user");
      }
      if (typeof populateSignatoryDropdowns === "function")
        populateSignatoryDropdowns();
    },
    (error) => {
      console.error("❌ DB#1 Sailors listener error:", error);
    },
  );
}
function initAvailabilityListener() {
  sailorsDB.ref("availability").on(
    "value",
    (snapshot) => {
      if (snapshot.exists()) {
        store.availability = snapshot.val();
      } else {
        store.availability = {};
      }

      // Always update global counters so dashboard cards immediately reflect leave/sick changes
      if (typeof updateCounters === "function") {
        updateCounters();
      }

      // Re-render dashboard if visible
      if (
        typeof renderDashboard === "function" &&
        document.getElementById("view-dashboard") &&
        !document.getElementById("view-dashboard").classList.contains("hidden")
      ) {
        renderDashboard();
      }

      // Re-render summary view if visible
      if (
        typeof renderSummaryView === "function" &&
        document.getElementById("view-summary") &&
        !document.getElementById("view-summary").classList.contains("hidden")
      ) {
        renderSummaryView();
      }

      // Re-render Sailors Directory (Nominal Roll) if visible
      if (
        typeof renderSailorsView === "function" &&
        document.getElementById("view-sailors") &&
        !document.getElementById("view-sailors").classList.contains("hidden")
      ) {
        renderSailorsView();
      }

      // Re-render Sailor Leave section if currently open
      if (
        typeof store !== "undefined" && store.sailorSection === "leave" &&
        document.getElementById("sailorsSectionLeave") &&
        !document.getElementById("sailorsSectionLeave").classList.contains("hidden")
      ) {
        if (store.selectedLeaveSailorId && typeof selectSailorForLeave === "function") {
          selectSailorForLeave(store.selectedLeaveSailorId);
        }
      }

      // Re-render N/A Status view if visible
      if (
        typeof renderNastatusView === "function" &&
        document.getElementById("view-nastatus") &&
        !document.getElementById("view-nastatus").classList.contains("hidden")
      ) {
        renderNastatusView();
      }

      // Re-render Daily Details view if visible
      const _renderDd = typeof renderDailyDetailsSpecialView === "function" ? renderDailyDetailsSpecialView : (typeof renderDailyDetails === "function" ? renderDailyDetails : null);
      if (
        _renderDd &&
        document.getElementById("view-dailydetails") &&
        !document.getElementById("view-dailydetails").classList.contains("hidden")
      ) {
        _renderDd();
      }

      // Re-render Available Sailors sidebar / panel
      if (typeof renderAvailableSailors === "function") {
        renderAvailableSailors();
      }

      // Refresh Sailor Profile Modal if currently open
      const profModal = document.getElementById("sailorProfileModal");
      if (profModal && !profModal.classList.contains("hidden") && typeof currentSailorProfileId !== "undefined" && currentSailorProfileId) {
        if (typeof openSailorProfile === "function") {
          openSailorProfile(currentSailorProfileId);
        }
      }
    },
    (error) => {
      console.error("Availability read error:", error);
      showToast("Error reading Leave data: " + error.message, "error");
    },
  );
}
function initLongTermDeploymentsListeners() {
  opsDB.ref("out_projects").on("value", (snapshot) => {
    store.outProjects = snapshot.val() || {};
    if (typeof invalidateLongTermAllocationsCache === "function") invalidateLongTermAllocationsCache();
    updateCounters();
    renderDashboard();
    renderProjectsList();
    if (typeof renderSummaryView === "function") {
      renderSummaryView();
    }
    if (typeof renderDailyDetailsSpecialView === "function" && document.getElementById("view-dailydetails") && !document.getElementById("view-dailydetails").classList.contains("hidden")) {
      renderDailyDetailsSpecialView();
    }
  });
  opsDB.ref("housing_projects").on("value", (snapshot) => {
    store.housingProjects = snapshot.val() || {};
    if (typeof invalidateLongTermAllocationsCache === "function") invalidateLongTermAllocationsCache();
    updateCounters();
    renderDashboard();
    renderProjectsList();
    if (typeof renderSummaryView === "function") {
      renderSummaryView();
    }
    if (typeof renderDailyDetailsSpecialView === "function" && document.getElementById("view-dailydetails") && !document.getElementById("view-dailydetails").classList.contains("hidden")) {
      renderDailyDetailsSpecialView();
    }
  });
  opsDB.ref("other_bases").on("value", (snapshot) => {
    store.otherBases = snapshot.val() || {};
    if (typeof invalidateLongTermAllocationsCache === "function") invalidateLongTermAllocationsCache();
    updateCounters();
    renderDashboard();
    renderProjectsList();
    if (typeof renderSummaryView === "function") {
      renderSummaryView();
    }
    if (typeof renderDailyDetailsSpecialView === "function" && document.getElementById("view-dailydetails") && !document.getElementById("view-dailydetails").classList.contains("hidden")) {
      renderDailyDetailsSpecialView();
    }
  });
  sailorsDB.ref("temp_drafts").on("value", (snapshot) => {
    store.tempDrafts = snapshot.val() || {};
    updateCounters();
    renderDashboard();
    if (typeof renderSummaryView === "function") {
      renderSummaryView();
    }
  });
} // ─────────────────────────────────────────────
// DB #2 LISTENERS — CE Management System Operations (READ + WRITE)
// ─────────────────────────────────────────────
function standardizeInventoryDescription(desc) {
  if (!desc) return "";
  let clean = desc.trim(); // Remove wrapping quotes if present
  if (clean.startsWith('"') && clean.endsWith('"')) {
    clean = clean.substring(1, clean.length - 1).trim();
  } // Replace double double-quotes "" with a single double-quote "
  clean = clean.replace(/""/g, '"'); // Also remove leading/trailing quotes that might have been left over if they were unbalanced
  if (clean.startsWith('"')) clean = clean.substring(1).trim();
  if (clean.endsWith('"')) clean = clean.substring(0, clean.length - 1).trim(); // Replace multiple spaces with a single space
  clean = clean.replace(/\s+/g, " "); // Perform case-insensitive spelling auto-corrections
  clean = clean.replace(/\bball\s+cocks?\b/gi, "Ballcock Valve");
  clean = clean.replace(/\bceiling\s+paints?\s+whites?\b/gi, "Ceiling White");
  clean = clean.replace(/\bmac\s+foils?\b/gi, "Mackfoil");
  clean = clean.replace(/\bbriliyant\s+whites?\b/gi, "Briliant White");
  clean = clean.replace(/\broopings?\b/gi, "Roofing");
  clean = clean.replace(/\blbows?\b/gi, "Elbow");
  clean = clean.replace(/\bl\/\s*bows?\b/gi, "Elbow");
  clean = clean.replace(/\bfexibal\b/gi, "Flexible");
  clean = clean.replace(/\bpenal\s+pins?\b/gi, "Panel Pin");
  clean = clean.replace(/\bgrinder\s+dise\b/gi, "Grinder Disc");
  clean = clean.replace(/\brollel\s+brash\b/gi, "Roler Brush");
  clean = clean.replace(/\bms\s+plte\b/gi, "MS Plate");
  clean = clean.replace(/\bms\s+plete\b/gi, "MS Plate");
  clean = clean.replace(/\bgipso\s+board\b/gi, "Gypson Board");
  clean = clean.replace(/\balaminium\s+sealer\b/gi, "Aluminium Sealer");
  clean = clean.replace(/\banticoresive\b/gi, "Anticorrosive");
  return toTitleCase(clean);
}
function toTitleCase(str) {
  if (!str) return "";
  const acronyms = ["PVC", "BMS", "GI", "MS", "SLN", "UOM", "VAT", "ALU"];
  return str
    .split(" ")
    .map((word) => {
      if (!word) return "";
      const upper = word.toUpperCase();
      const cleanWord = upper.replace(/[^A-Z0-9]/g, "");
      if (acronyms.includes(cleanWord)) {
        return upper; // Keep acronyms fully capitalized
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}
function standardizeInventoryCategory(cat) {
  if (!cat) return "General";
  const cleaned = cat.trim().toUpperCase();
  const mapping = {
    METAL: "Metal",
    YAKADA: "Metal",
    YAD: "Metal",
    STANSILE: "Stencil",
    STENCIL: "Stencil",
    PAINT: "Paint",
    PAI: "Paint",
    GENERAL: "General",
    BMS: "BMS",
    TIMBER: "BMS",
    PLUMBING: "Plumbing",
    PVC: "Plumbing",
    ALUMINIUM: "Aluminium",
    ALUMINUM: "Aluminium",
    ALU: "Aluminium",
    ELECTRICAL: "Electrical",
    TOOLS: "Tools",
    TOOL: "Tools",
    "LUBRICANT OIL": "Lubricant Oil",
    LUBRICANT: "Lubricant Oil",
    OIL: "Lubricant Oil",
    ENG: "Eng",
  };
  if (mapping[cleaned]) return mapping[cleaned];
  const standardCats = [
    "BMS",
    "Plumbing",
    "Metal",
    "Stencil",
    "General",
    "Aluminium",
    "Paint",
    "Electrical",
    "Tools",
    "Lubricant Oil",
    "Eng",
  ];
  const matched = standardCats.find((sc) => sc.toUpperCase() === cleaned);
  if (matched) return matched;
  return cat.trim().charAt(0).toUpperCase() + cat.trim().slice(1).toLowerCase();
}

function standardizeInventoryDeno(deno) {
  if (!deno) return "Nos";
  const d = String(deno).trim();
  if (d.toLowerCase() === "lft") return "lft";
  if (d.toLowerCase() === "cube" || d.toLowerCase() === "cubes") return "Cube";
  if (d.toLowerCase() === "nos" || d.toLowerCase() === "no" || d.toLowerCase() === "no.") return "Nos";
  if (d.toLowerCase() === "kg" || d.toLowerCase() === "kgs") return "Kg";
  if (d.toLowerCase() === "ltr" || d.toLowerCase() === "ltrs" || d.toLowerCase() === "liters" || d.toLowerCase() === "litres") return "Ltr";
  if (d.toLowerCase() === "bag" || d.toLowerCase() === "bags") return "Bags";
  if (d.toLowerCase() === "sheet" || d.toLowerCase() === "sheets") return "Sheets";
  if (d.toLowerCase() === "roll" || d.toLowerCase() === "rolls") return "Rolls";
  if (d.toLowerCase() === "set" || d.toLowerCase() === "sets") return "Sets";
  if (d.toLowerCase() === "pkt" || d.toLowerCase() === "pkts" || d.toLowerCase() === "packet" || d.toLowerCase() === "packets") return "Pkts";
  if (d.toLowerCase() === "pair" || d.toLowerCase() === "pairs") return "Pairs";
  if (d.toLowerCase() === "bundle" || d.toLowerCase() === "bundles") return "Bundles";
  if (d.toLowerCase() === "box" || d.toLowerCase() === "boxes") return "Boxes";
  if (d.toLowerCase() === "bottle" || d.toLowerCase() === "bottles") return "Bottles";
  if (d.toLowerCase() === "tin" || d.toLowerCase() === "tins") return "Tins";
  if (d.toLowerCase() === "ton" || d.toLowerCase() === "tons") return "Tons";
  if (d.toLowerCase() === "yd" || d.toLowerCase() === "yds" || d.toLowerCase() === "yard" || d.toLowerCase() === "yards") return "Yds";
  if (d.toLowerCase() === "sq.ft" || d.toLowerCase() === "sqft") return "Sq.ft";
  if (d.toLowerCase() === "sq.m" || d.toLowerCase() === "sqm") return "Sq.m";
  return d;
}

function initOpsListeners() {
  // ── Work Orders ──
  opsDB.ref("work_orders").on("value", (snapshot) => {
    const raw = snapshotToArray(snapshot);
    const today = getLocalDateString();
    if (typeof invalidateSailorLastAssignmentCache === "function") invalidateSailorLastAssignmentCache();
    if (typeof invalidateDailyCommitmentCache === "function") invalidateDailyCommitmentCache();
    store.workOrders = raw.map((wo) => {
      var _wo$id, _wo$assigned, _wo$last_assigned;
      const mappedWo = {
        ...wo,
        id: (_wo$id = wo.id) !== null && _wo$id !== void 0 ? _wo$id : wo._fbKey,
        assigned: Array.isArray(wo.assigned)
          ? wo.assigned
          : Object.values(
              (_wo$assigned = wo.assigned) !== null && _wo$assigned !== void 0
                ? _wo$assigned
                : {},
            ),
        last_assigned: Array.isArray(wo.last_assigned)
          ? wo.last_assigned
          : Object.values(
              (_wo$last_assigned = wo.last_assigned) !== null &&
                _wo$last_assigned !== void 0
                ? _wo$last_assigned
                : {},
            ),
      };
      // Auto-carryover last_assigned crew to assigned for continuing Active/Pending work orders if assigned is empty and NOT cleared today
      if (
        (mappedWo.status === "Active" || mappedWo.status === "Pending") &&
        (!mappedWo.assigned || mappedWo.assigned.length === 0) &&
        !mappedWo.user_cleared_crew &&
        mappedWo.last_assigned_date !== today &&
        mappedWo.last_assigned &&
        mappedWo.last_assigned.length > 0
      ) {
        mappedWo.assigned = [...mappedWo.last_assigned];
      }
      return mappedWo;
    });
    refreshCurrentView();
    if (typeof updateGlobalOfficerHubBadge === "function") updateGlobalOfficerHubBadge();
    console.log(`📋 DB#2: ${store.workOrders.length} work orders loaded`);
  }); // ── Job Cards ──
  opsDB.ref("job_cards").on("value", (snapshot) => {
    const today = getLocalDateString();
    if (typeof invalidateSailorLastAssignmentCache === "function") invalidateSailorLastAssignmentCache();
    if (typeof invalidateDailyCommitmentCache === "function") invalidateDailyCommitmentCache();
    store.jobCards = snapshotToArray(snapshot).map((jc) => {
      var _jc$id, _jc$assigned, _jc$last_assigned;
      const mappedJc = {
        ...jc,
        id: (_jc$id = jc.id) !== null && _jc$id !== void 0 ? _jc$id : jc._fbKey,
        assigned: Array.isArray(jc.assigned)
          ? jc.assigned
          : Object.values(
              (_jc$assigned = jc.assigned) !== null && _jc$assigned !== void 0
                ? _jc$assigned
                : {},
            ),
        last_assigned: Array.isArray(jc.last_assigned)
          ? jc.last_assigned
          : Object.values(
              (_jc$last_assigned = jc.last_assigned) !== null &&
                _jc$last_assigned !== void 0
                ? _jc$last_assigned
                : {},
            ),
      };
      if (
        (mappedJc.status === "Active" || mappedJc.status === "Pending") &&
        (!mappedJc.assigned || mappedJc.assigned.length === 0) &&
        !mappedJc.user_cleared_crew &&
        mappedJc.last_assigned_date !== today &&
        mappedJc.last_assigned &&
        mappedJc.last_assigned.length > 0
      ) {
        mappedJc.assigned = [...mappedJc.last_assigned];
      }
      return mappedJc;
    });
    refreshCurrentView();
    if (typeof updateGlobalOfficerHubBadge === "function") updateGlobalOfficerHubBadge();
  }); // ── Job Card Materials ──
  opsDB.ref("job_card_materials").on("value", (snapshot) => {
    store.jobCardMaterials = snapshotToArray(snapshot).map((m) => {
      var _m$id;
      return {
        ...m,
        id: (_m$id = m.id) !== null && _m$id !== void 0 ? _m$id : m._fbKey,
      };
    });
    refreshCurrentView();
  }); // ── Job Card Labor ──
  opsDB.ref("job_card_labor").on("value", (snapshot) => {
    store.jobCardLabor = snapshotToArray(snapshot).map((l) => {
      var _l$id;
      return {
        ...l,
        id: (_l$id = l.id) !== null && _l$id !== void 0 ? _l$id : l._fbKey,
      };
    });
    refreshCurrentView();
  }); // Helper to safely parse cost, handling commas and string prefixes like "Rs."
  const safeParseCost = (val) => {
    if (val === undefined || val === null || val === "") return 0;
    if (typeof val === "number") return val;
    let str = String(val).toLowerCase(); // Remove rs, rs., commas, and spaces
    str = str.replace(/rs\.?/g, "").replace(/,/g, "").replace(/\\s/g, ""); // Strip any remaining characters that are not digits or decimal point
    str = str.replace(/[^0-9.]/g, "");
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  };
  const extractCost = (item) => {
    var _ref29, _ref30, _ref31, _ref32, _item$cost_per_unit; // Known keys
    const knownCost =
      (_ref29 =
        (_ref30 =
          (_ref31 =
            (_ref32 =
              (_item$cost_per_unit = item.cost_per_unit) !== null &&
              _item$cost_per_unit !== void 0
                ? _item$cost_per_unit
                : item.unit_cost) !== null && _ref32 !== void 0
              ? _ref32
              : item.cost) !== null && _ref31 !== void 0
            ? _ref31
            : item.price) !== null && _ref30 !== void 0
          ? _ref30
          : item.Cost) !== null && _ref29 !== void 0
        ? _ref29
        : item.Price;
    if (knownCost !== undefined && knownCost !== null && knownCost !== "") {
      return safeParseCost(knownCost);
    } // Dynamic search for any key containing 'cost' or 'price'
    for (let k of Object.keys(item)) {
      let lk = k.toLowerCase();
      if (
        lk.includes("cost") ||
        lk.includes("price") ||
        lk.includes("rate") ||
        lk.includes("amount")
      ) {
        const parsed = safeParseCost(item[k]);
        if (parsed > 0) return parsed;
      }
    }
    return 0;
  }; // ── Inventory ──
  const validUnits = new Set([
    "nos", "no", "kg", "kgs", "g", "gram", "grams", "l", "ltr", "liters", "litre", "litres",
    "m", "mtr", "meters", "ft", "feet", "lft", "length feet", "sqft", "sqm", "pcs", "pkt", "pkts",
    "roll", "rolls", "box", "boxes", "bags", "bag", "bundle", "set", "sets",
    "pair", "pairs", "cubes", "cube", "yards", "yds", "tin", "tins",
    "bottle", "bottles", "drum", "drums", "can", "cans", "length", "lengths"
  ]);

  opsDB.ref("inventory").on("value", (snapshot) => {
    store.inventory = snapshotToArray(snapshot).map((item) => {
      var _item$id;
      let rawCost = extractCost(item);
      let deno = String(item.deno || "").trim();

      // If cost is 0 or missing, but deno contains a numeric unit cost (due to shifted columns in past uploads)
      if (rawCost === 0 && /^\d+(\.\d+)?$/.test(deno) && !validUnits.has(deno.toLowerCase())) {
        rawCost = parseFloat(deno) || 0;
        const descLower = (item.description || "").toLowerCase();
        if (descLower.includes("pkt") || descLower.includes("packet")) deno = "Pkt";
        else if (descLower.includes("roll")) deno = "Roll";
        else if (descLower.includes("bag")) deno = "Bag";
        else if (descLower.includes("tin") || descLower.includes("can")) deno = "Tin";
        else if (descLower.includes("bottle")) deno = "Bottle";
        else if (descLower.includes("kg") || descLower.includes("kilogram")) deno = "Kg";
        else if (descLower.includes("drum")) deno = "Drum";
        else if (descLower.includes("sqft") || descLower.includes("sq.ft")) deno = "Sqft";
        else if (descLower.includes("mtr") || descLower.includes("meter")) deno = "Mtr";
        else if (descLower.includes("feet") || descLower.includes("foot") || descLower.includes("ft")) deno = "Feet";
        else deno = "Nos";
      } else if (/^\d+$/.test(deno) && parseFloat(deno) === 0) {
        deno = "Nos";
      }

      let bookNo = (item.book_no || item.bookNo || item.book || item.book_number || item.ledger_no || item.stock_book || item.folio || item.page_no || "").trim();
      let loc = (item.location || "").trim();

      // Only wipe book_no if it is exactly the zone ID / Zone Name without any book numbers
      const isPureZoneName = (val) => {
        if (!val) return false;
        const v = val.toLowerCase().trim();
        return (item.zone_id && v === item.zone_id.toLowerCase().trim()) || /^[a-z]\s*zone$/i.test(v) || v === "zone";
      };

      if (bookNo && isPureZoneName(bookNo)) {
        bookNo = "";
      }

      // If book_no is empty, check if location was storing the Book No (e.g. "01", "02", "BK-1", "Book 1", "Folio 5")
      const standardStoreNames = ["zone store", "ready use store", "balance store", "workshop", "main store", "transit store", "central store"];
      const isLocAStoreName = standardStoreNames.includes(loc.toLowerCase()) || isPureZoneName(loc);

      if (!bookNo && loc && !isLocAStoreName) {
        bookNo = loc;
        loc = "Zone Store";
      }

      // If location is empty or is pure zone name, set standard store name
      if (!loc || isPureZoneName(loc)) {
        loc = "Zone Store";
      }

      return {
        ...item,
        id:
          (_item$id = item.id) !== null && _item$id !== void 0
            ? _item$id
            : item._fbKey,
        category: standardizeInventoryCategory(item.category),
        description: standardizeInventoryDescription(item.description),
        deno: deno || "Nos",
        cost_per_unit: rawCost,
        book_no: bookNo,
        location: loc || "Zone Store",
        on_charge_records: item.on_charge_records
          ? Object.values(item.on_charge_records)
          : [],
        off_charge_records: item.off_charge_records
          ? Object.values(item.off_charge_records)
          : [],
      };
    });
    refreshCurrentView();
    console.log(`📦 DB#2: ${store.inventory.length} inventory items loaded`);
  }); // ── Locations ──
  opsDB.ref("locations").on("value", (snapshot) => {
    store.locations = snapshotToArray(snapshot).map((l) => {
      var _l$id2;
      return {
        ...l,
        id: (_l$id2 = l.id) !== null && _l$id2 !== void 0 ? _l$id2 : l._fbKey,
      };
    });
    if (typeof renderSettingsLocationsTable === "function") {
      renderSettingsLocationsTable();
    }
    if (typeof populateEstLocationsDatalist === "function") {
      populateEstLocationsDatalist();
    }
    if (typeof renderLocationsList === "function") {
      renderLocationsList();
    }
  }); // ── Maintenance Records ──
  opsDB.ref("maintenance_records").on("value", (snapshot) => {
    store.maintenanceRecords = snapshotToArray(snapshot).map((r) => {
      var _r$id;
      return {
        ...r,
        id: (_r$id = r.id) !== null && _r$id !== void 0 ? _r$id : r._fbKey,
      };
    });
    refreshCurrentView();
  }); // ── Estimates ──
  opsDB.ref("estimates").on("value", (snapshot) => {
    store.estimates = snapshotToArray(snapshot).map((e) => {
      var _e$id;
      return {
        ...e,
        id: (_e$id = e.id) !== null && _e$id !== void 0 ? _e$id : e._fbKey,
        materials: e.materials ? Object.values(e.materials) : [],
        labor: e.labor ? Object.values(e.labor) : [],
      };
    });
    refreshCurrentView();
    console.log(`📐 DB#2: ${store.estimates.length} estimates loaded`);
  }); // ── Approved Projects ──
  opsDB.ref("approved_projects").on("value", (snapshot) => {
    store.approvedProjects = snapshotToArray(snapshot).map((p) => {
      var _p$id;
      return {
        ...p,
        id: (_p$id = p.id) !== null && _p$id !== void 0 ? _p$id : p._fbKey,
      };
    });
    console.log(`🏗️ DB#2: ${store.approvedProjects.length} approved projects loaded`);
    if (_currentSettingsTab === "projects" && typeof renderApprovedProjectsSettings === "function") {
      renderApprovedProjectsSettings();
    }
    if (typeof populateApprovedProjectsDropdown === "function") {
      populateApprovedProjectsDropdown();
    }
  });

  // ── Pre-Cast Batches ──
  opsDB.ref("precast_batches").on("value", (snapshot) => {
    store.precastBatches = snapshotToArray(snapshot);
    console.log(`🧱 DB#2: ${store.precastBatches.length} precast batches loaded`);
  });

  // ── NAV 254 Issue Vouchers ──
  opsDB.ref("nav254_vouchers").on("value", (snapshot) => {
    store.nav254Vouchers = snapshotToArray(snapshot);
    console.log(`📜 DB#2: ${store.nav254Vouchers.length} NAV 254 vouchers loaded`);
    if (typeof renderNav254HistoryTable === "function") {
      renderNav254HistoryTable();
    }
  });

  // ── Temporary Issue Book (TIB) ──
  opsDB.ref("temp_issues").on("value", (snapshot) => {
    const arr = snapshotToArray(snapshot);
    if (arr && arr.length > 0) {
      const seen = new Set();
      const uniqueArr = [];
      arr.forEach((item) => {
        const key = String(item._fbKey || item.id || "");
        if (key && !seen.has(key)) {
          seen.add(key);
          uniqueArr.push(item);
        } else if (!key) {
          uniqueArr.push(item);
        }
      });
      store.tempIssues = uniqueArr;
    } else {
      const local = localStorage.getItem("ncw_temp_issues_v1");
      store.tempIssues = local ? JSON.parse(local) : (typeof DEFAULT_TEMP_ISSUES_DATA !== "undefined" ? [...DEFAULT_TEMP_ISSUES_DATA] : []);
    }
    saveTempIssuesToStorage();
    console.log(`📑 DB#2: ${store.tempIssues.length} temporary issues loaded`);
    if (store.currentView === "tempissues" || (typeof isInvTIBActive === "function" && isInvTIBActive())) {
      renderTempIssuesDashboard();
      renderTempIssuesTable();
    }
  });

  // ── Daily Allocations ──
  opsDB.ref("daily_allocations").on("value", (snapshot) => {
    const arr = snapshotToArray(snapshot);
    store.dailyAllocations = arr;
    const map = {};
    arr.forEach((a) => {
      map[`${a.date}_${sanitizeFbKey(a.sailor_id)}`] = a;
    });
    store.dailyAllocationsMap = map;
    if (typeof invalidateSailorLastAssignmentCache === "function") invalidateSailorLastAssignmentCache();
    if (typeof invalidateDailyCommitmentCache === "function") invalidateDailyCommitmentCache();
    refreshCurrentView();
  });
  console.log("🔥 DB#2: All ops listeners attached");
} // ─────────────────────────────────────────────
// DB #2 SAVE HELPERS — Write to Firebase DB #2
// ─────────────────────────────────────────────
// Save / update a work order (returns Promise)
function fbSaveWorkOrder(data) {
  const { _fbKey, ...clean } = data;
  if (clean.assigned && clean.assigned.length === 0) {
    clean.assigned = null;
  }
  if (_fbKey) {
    return opsDB.ref(`work_orders/${_fbKey}`).update(clean);
  }
  return opsDB.ref("work_orders").push({ ...clean, created_at: Date.now() });
}

// Safe concurrent helpers for assigned array to prevent race conditions
function safeFbAssignSailor(woKey, sailorId, dateStr) {
  if (!woKey || !sailorId) return;
  const targetWo = (store.workOrders || []).find(w => String(w.id) === String(woKey) || String(w._fbKey) === String(woKey));
  const targetJc = (store.jobCards || []).find(j => String(j.id) === String(woKey) || String(j._fbKey) === String(woKey));
  const updates = { user_cleared_crew: false, _userClearedCrew: false };
  if (dateStr) updates.last_assigned_date = dateStr;

  if (targetWo) {
    const key = targetWo._fbKey || woKey;
    const woRef = opsDB.ref('work_orders/' + key);
    woRef.child('assigned').transaction((curr) => {
      let arr = Array.isArray(curr) ? curr : (curr ? Object.values(curr) : []);
      if (!arr.includes(sailorId)) arr.push(sailorId);
      return arr;
    });
    woRef.update(updates);

    const linkedJc = typeof getJobCardForWorkOrder === "function" ? getJobCardForWorkOrder(key) : null;
    if (linkedJc && linkedJc._fbKey) {
      const jcRef = opsDB.ref('job_cards/' + linkedJc._fbKey);
      jcRef.child('assigned').transaction((curr) => {
        let arr = Array.isArray(curr) ? curr : (curr ? Object.values(curr) : []);
        if (!arr.includes(sailorId)) arr.push(sailorId);
        return arr;
      });
      jcRef.update(updates);
    }
  } else if (targetJc) {
    const key = targetJc._fbKey || woKey;
    const jcRef = opsDB.ref('job_cards/' + key);
    jcRef.child('assigned').transaction((curr) => {
      let arr = Array.isArray(curr) ? curr : (curr ? Object.values(curr) : []);
      if (!arr.includes(sailorId)) arr.push(sailorId);
      return arr;
    });
    jcRef.update(updates);
  } else {
    const woRef = opsDB.ref('work_orders/' + woKey);
    woRef.child('assigned').transaction((curr) => {
      let arr = Array.isArray(curr) ? curr : (curr ? Object.values(curr) : []);
      if (!arr.includes(sailorId)) arr.push(sailorId);
      return arr;
    });
    woRef.update(updates);
  }
  if (typeof invalidateSailorLastAssignmentCache === "function") invalidateSailorLastAssignmentCache();
  if (typeof invalidateDailyCommitmentCache === "function") invalidateDailyCommitmentCache();
  if (typeof refreshDailyCommitmentCache === "function") refreshDailyCommitmentCache(dateStr || store.dashboardDate || getLocalDateString());
}

function safeFbRemoveSailor(woKey, sailorId, dateStr) {
  if (!woKey || !sailorId) return;

  const sailor = typeof findSailorById === "function" ? findSailorById(sailorId) : (store.sailors || []).find(
    (s) => isSailorMatchingKeys(s, [sailorId])
  );

  const idsToRemove = new Set([String(sailorId).trim()]);
  const sDigits = String(sailorId).replace(/\D/g, "");
  if (sDigits.length >= 3) idsToRemove.add(sDigits);

  if (sailor) {
    if (sailor.id !== undefined && sailor.id !== null) idsToRemove.add(String(sailor.id).trim());
    if (sailor._fbKey) idsToRemove.add(String(sailor._fbKey).trim());
    if (sailor.official_number) {
      const offStr = String(sailor.official_number).trim();
      idsToRemove.add(offStr);
      const d = offStr.replace(/\D/g, "");
      if (d.length >= 3) idsToRemove.add(d);
    }
    if (sailor.service_no) {
      const srvStr = String(sailor.service_no).trim();
      idsToRemove.add(srvStr);
      const d = srvStr.replace(/\D/g, "");
      if (d.length >= 3) idsToRemove.add(d);
    }
    if (sailor.off_no) {
      const offStr = String(sailor.off_no).trim();
      idsToRemove.add(offStr);
      const d = offStr.replace(/\D/g, "");
      if (d.length >= 3) idsToRemove.add(d);
    }
  }

  const isMatch = (item) => {
    if (!item) return false;
    if (typeof item === "object") {
      return isSailorMatchingKeys(item, idsToRemove) ||
        (item.id && idsToRemove.has(String(item.id).trim())) ||
        (item._fbKey && idsToRemove.has(String(item._fbKey).trim())) ||
        (item.sailor_id && idsToRemove.has(String(item.sailor_id).trim())) ||
        (item.official_number && idsToRemove.has(String(item.official_number).trim()));
    }
    const str = String(item).trim();
    if (idsToRemove.has(str)) return true;
    const digits = str.replace(/\D/g, "");
    if (digits.length >= 3 && idsToRemove.has(digits)) return true;
    if (sailor && isSailorMatchingKeys(sailor, [str])) return true;
    const foundS = typeof findSailorById === "function" ? findSailorById(str) : null;
    if (foundS && isSailorMatchingKeys(foundS, idsToRemove)) return true;
    return false;
  };

  // Find target work order and any linked job card
  let targetWo = (store.workOrders || []).find(w => String(w.id) === String(woKey) || String(w._fbKey) === String(woKey));
  let linkedJc = null;
  if (targetWo) {
    linkedJc = typeof getJobCardForWorkOrder === "function" ? getJobCardForWorkOrder(targetWo._fbKey || targetWo.id) : null;
  } else {
    let targetJc = (store.jobCards || []).find(j => String(j.id) === String(woKey) || String(j._fbKey) === String(woKey));
    if (targetJc) {
      targetWo = (store.workOrders || []).find(w => String(w.id) === String(targetJc.work_order_id) || String(w._fbKey) === String(targetJc.work_order_id));
      linkedJc = targetJc;
    }
  }

  // 1. Transaction for work_orders
  const woKeyToUse = (targetWo && targetWo._fbKey) ? targetWo._fbKey : woKey;
  const woRef = opsDB.ref('work_orders/' + woKeyToUse);
  woRef.child('assigned').transaction((curr) => {
    if (!curr) return null;
    let arr = Array.isArray(curr) ? curr : Object.values(curr);
    const filtered = arr.filter(id => !isMatch(id));
    return filtered.length > 0 ? filtered : null;
  });
  woRef.child('last_assigned').transaction((curr) => {
    if (!curr) return null;
    let arr = Array.isArray(curr) ? curr : Object.values(curr);
    const filtered = arr.filter(id => !isMatch(id));
    return filtered.length > 0 ? filtered : null;
  });

  // 2. Transaction for job_cards (use linked JC key if resolved)
  const jcKeyToUse = (linkedJc && linkedJc._fbKey) ? linkedJc._fbKey : null;
  if (jcKeyToUse) {
    const jcRef = opsDB.ref('job_cards/' + jcKeyToUse);
    jcRef.child('assigned').transaction((curr) => {
      if (!curr) return null;
      let arr = Array.isArray(curr) ? curr : Object.values(curr);
      const filtered = arr.filter(id => !isMatch(id));
      return filtered.length > 0 ? filtered : null;
    });
    jcRef.child('last_assigned').transaction((curr) => {
      if (!curr) return null;
      let arr = Array.isArray(curr) ? curr : Object.values(curr);
      const filtered = arr.filter(id => !isMatch(id));
      return filtered.length > 0 ? filtered : null;
    });
  }

  const today = typeof getLocalDateString === "function" ? getLocalDateString() : new Date().toISOString().split("T")[0];
  const targetDate = dateStr || today;

  if (targetDate) {
    woRef.update({ last_assigned_date: targetDate });
    if (jcKeyToUse) {
      opsDB.ref('job_cards/' + jcKeyToUse).update({ last_assigned_date: targetDate });
    }

    // Clean daily_allocations in Firebase for all ID variations
    idsToRemove.forEach((id) => {
      opsDB.ref(`daily_allocations/${targetDate}_${sanitizeFbKey(id)}`).remove();
    });

    (store.dailyAllocations || []).forEach((a) => {
      if (a.date === targetDate && isMatch(a)) {
        if (a._fbKey) opsDB.ref(`daily_allocations/${a._fbKey}`).remove();
        if (a.sailor_id) opsDB.ref(`daily_allocations/${a.date}_${sanitizeFbKey(a.sailor_id)}`).remove();
        if (a.official_number) opsDB.ref(`daily_allocations/${a.date}_${sanitizeFbKey(a.official_number)}`).remove();
      }
    });

    // Clean in-memory store.dailyAllocations
    if (store.dailyAllocations && Array.isArray(store.dailyAllocations)) {
      store.dailyAllocations = store.dailyAllocations.filter(
        (a) => a.date !== targetDate || !isMatch(a)
      );
    }
    if (store.dailyAllocationsMap) {
      idsToRemove.forEach((id) => {
        delete store.dailyAllocationsMap[`${targetDate}_${sanitizeFbKey(id)}`];
      });
    }
  }

  if (targetWo) {
    targetWo.assigned = (targetWo.assigned || []).filter(id => !isMatch(id));
    if (targetWo.last_assigned) targetWo.last_assigned = (targetWo.last_assigned || []).filter(id => !isMatch(id));
    targetWo._removedSailorIds = targetWo._removedSailorIds || new Set();
    idsToRemove.forEach(id => targetWo._removedSailorIds.add(id));
    if (targetWo.assigned.length === 0) targetWo._userClearedCrew = true;
  }
  if (linkedJc) {
    linkedJc.assigned = (linkedJc.assigned || []).filter(id => !isMatch(id));
    if (linkedJc.last_assigned) linkedJc.last_assigned = (linkedJc.last_assigned || []).filter(id => !isMatch(id));
    linkedJc._removedSailorIds = linkedJc._removedSailorIds || new Set();
    idsToRemove.forEach(id => linkedJc._removedSailorIds.add(id));
    if (linkedJc.assigned.length === 0) linkedJc._userClearedCrew = true;
  }

  if (sailor) {
    sailor.status = "Available";
  }

  if (typeof invalidateSailorLastAssignmentCache === "function") invalidateSailorLastAssignmentCache();
  if (typeof invalidateDailyCommitmentCache === "function") invalidateDailyCommitmentCache();
  if (typeof refreshDailyCommitmentCache === "function") refreshDailyCommitmentCache(targetDate);
}

// Check if the current logged-in officer is the main administrator (LCDR KMAU KAHANDAWA - NRC 3576)
function isMainAdminLoggedIn() {
  if (store.activeProfileType === "OIC" && store.activeOicProfileId) {
    const profile = (typeof getOicProfiles === "function" ? getOicProfiles() : []).find(
      (p) => p.id === store.activeOicProfileId
    );
    if (profile) {
      return (profile.serviceNo || "").includes("3576");
    }
  }
  const savedServiceNo = localStorage.getItem("ncw_logged_officer_no") || "";
  if (savedServiceNo) {
    return savedServiceNo.includes("3576");
  }
  if (store.currentOfficerProfile && store.currentOfficerProfile.serviceNo) {
    return String(store.currentOfficerProfile.serviceNo).includes("3576");
  }
  return false;
}

// Helper to force clean all stuck/orphaned Firebase assignments for a sailor by any ID variation
window.forceCleanSailorAssignments = function(officialNoOrId) {
  if (!officialNoOrId) return;

  const sailor = typeof findSailorById === "function" ? findSailorById(officialNoOrId) : null;
  const ids = new Set([String(officialNoOrId).trim()]);
  if (!String(officialNoOrId).startsWith('-') && String(officialNoOrId).length < 16) {
    const rawDigits = String(officialNoOrId).replace(/\D/g, "");
    if (rawDigits.length >= 3) ids.add(rawDigits);
  }

  if (sailor) {
    if (sailor.id !== undefined && sailor.id !== null) ids.add(String(sailor.id).trim());
    if (sailor._fbKey) ids.add(String(sailor._fbKey).trim());
    if (sailor.official_number) {
      const offStr = String(sailor.official_number).trim();
      ids.add(offStr);
      const d = offStr.replace(/\D/g, "");
      if (d.length >= 3) ids.add(d);
    }
    if (sailor.service_no) {
      const srvStr = String(sailor.service_no).trim();
      ids.add(srvStr);
      const d = srvStr.replace(/\D/g, "");
      if (d.length >= 3) ids.add(d);
    }
    if (sailor.off_no) {
      const offStr = String(sailor.off_no).trim();
      ids.add(offStr);
      const d = offStr.replace(/\D/g, "");
      if (d.length >= 3) ids.add(d);
    }
  }

  const isMatch = (item) => {
    if (!item) return false;
    if (typeof item === "object") {
      return isSailorMatchingKeys(item, ids) || (item.id && ids.has(String(item.id))) || (item._fbKey && ids.has(String(item._fbKey))) || (item.sailor_id && ids.has(String(item.sailor_id))) || (item.official_number && ids.has(String(item.official_number)));
    }
    const str = String(item).trim();
    if (ids.has(str)) return true;
    if (!str.startsWith('-') && str.length < 16) {
      const digits = str.replace(/\D/g, "");
      if (digits.length >= 3 && ids.has(digits)) return true;
    }
    if (sailor && isSailorMatchingKeys(sailor, [str])) return true;
    const foundS = typeof findSailorById === "function" ? findSailorById(str) : null;
    if (foundS && isSailorMatchingKeys(foundS, ids)) return true;
    return false;
  };

  const today = typeof getLocalDateString === "function" ? getLocalDateString() : new Date().toISOString().split("T")[0];
  const activeDate = (typeof store !== "undefined" && store && store.dashboardDate) || today;

  // 1. Remove from all work_orders (assigned, last_assigned, supervisor, incharge, artificer) in Firebase & Memory
  (store.workOrders || []).forEach((wo) => {
    let changed = false;
    if (wo.assigned && Array.isArray(wo.assigned)) {
      const prevLen = wo.assigned.length;
      wo.assigned = wo.assigned.filter((id) => !isMatch(id));
      if (wo.assigned.length !== prevLen) changed = true;
    }
    if (wo.last_assigned && Array.isArray(wo.last_assigned)) {
      const prevLen = wo.last_assigned.length;
      wo.last_assigned = wo.last_assigned.filter((id) => !isMatch(id));
      if (wo.last_assigned.length !== prevLen) changed = true;
    }
    if (wo.supervisor && isMatch(wo.supervisor)) {
      wo.supervisor = null;
      changed = true;
    }
    if (wo.incharge && isMatch(wo.incharge)) {
      wo.incharge = null;
      changed = true;
    }
    if (wo.project_artificer && isMatch(wo.project_artificer)) {
      wo.project_artificer = null;
      changed = true;
    }
    if (changed) {
      const key = wo._fbKey || wo.id;
      opsDB.ref(`work_orders/${key}`).update({
        assigned: wo.assigned && wo.assigned.length > 0 ? wo.assigned : null,
        last_assigned: wo.last_assigned && wo.last_assigned.length > 0 ? wo.last_assigned : null,
        supervisor: wo.supervisor || null,
        incharge: wo.incharge || null,
        project_artificer: wo.project_artificer || null,
      });
    }
  });

  // 2. Remove from all job_cards (assigned, last_assigned, supervisor, incharge, artificer) in Firebase & Memory
  (store.jobCards || []).forEach((jc) => {
    let changed = false;
    if (jc.assigned && Array.isArray(jc.assigned)) {
      const prevLen = jc.assigned.length;
      jc.assigned = jc.assigned.filter((id) => !isMatch(id));
      if (jc.assigned.length !== prevLen) changed = true;
    }
    if (jc.last_assigned && Array.isArray(jc.last_assigned)) {
      const prevLen = jc.last_assigned.length;
      jc.last_assigned = jc.last_assigned.filter((id) => !isMatch(id));
      if (jc.last_assigned.length !== prevLen) changed = true;
    }
    if (jc.supervisor && isMatch(jc.supervisor)) {
      jc.supervisor = null;
      changed = true;
    }
    if (jc.incharge && isMatch(jc.incharge)) {
      jc.incharge = null;
      changed = true;
    }
    if (jc.project_artificer && isMatch(jc.project_artificer)) {
      jc.project_artificer = null;
      changed = true;
    }
    if (changed) {
      const key = jc._fbKey || jc.id;
      opsDB.ref(`job_cards/${key}`).update({
        assigned: jc.assigned && jc.assigned.length > 0 ? jc.assigned : null,
        last_assigned: jc.last_assigned && jc.last_assigned.length > 0 ? jc.last_assigned : null,
        supervisor: jc.supervisor || null,
        incharge: jc.incharge || null,
        project_artificer: jc.project_artificer || null,
      });
    }
  });

  // 3. Remove all daily_allocations in Firebase for all ID variants (today & activeDate)
  ids.forEach((id) => {
    const sId = sanitizeFbKey(id);
    opsDB.ref(`daily_allocations/${today}_${sId}`).remove();
    if (activeDate && activeDate !== today) {
      opsDB.ref(`daily_allocations/${activeDate}_${sId}`).remove();
    }
  });
  (store.dailyAllocations || []).forEach((a) => {
    if (isMatch(a.sailor_id) || isMatch(a.official_number) || isMatch(a.sailorId) || isMatch(a.offNo)) {
      if (a._fbKey) opsDB.ref(`daily_allocations/${a._fbKey}`).remove();
      if (a.date && a.sailor_id) opsDB.ref(`daily_allocations/${a.date}_${sanitizeFbKey(a.sailor_id)}`).remove();
      if (a.date && a.official_number) opsDB.ref(`daily_allocations/${a.date}_${sanitizeFbKey(a.official_number)}`).remove();
    }
  });

  // 4. Update in-memory store for daily allocations
  if (store.dailyAllocations) {
    store.dailyAllocations = store.dailyAllocations.filter(
      (a) => !isMatch(a.sailor_id) && !isMatch(a.official_number) && !isMatch(a.sailorId) && !isMatch(a.offNo)
    );
  }

  // 5. Remove from Long-Term Projects (Housing Projects, Out Projects, Other Bases)
  ["out_projects", "housing_projects", "other_bases"].forEach((node) => {
    const storeNode = node === "out_projects" ? store.outProjects : node === "housing_projects" ? store.housingProjects : store.otherBases;
    if (storeNode) {
      Object.entries(storeNode).forEach(([pKey, pVal]) => {
        if (pVal && pVal.assigned_sailors) {
          Object.keys(pVal.assigned_sailors).forEach((sKey) => {
            if (ids.has(String(sKey)) || isMatch(sKey)) {
              delete pVal.assigned_sailors[sKey];
              opsDB.ref(`${node}/${pKey}/assigned_sailors/${sKey}`).remove();
            }
          });
        }
      });
    }
  });

  if (sailor) {
    sailor.status = "Available";
    sailor.evaluated = false;
  }

  if (typeof invalidateSailorLastAssignmentCache === "function") invalidateSailorLastAssignmentCache();
  if (typeof invalidateDailyCommitmentCache === "function") invalidateDailyCommitmentCache();
  if (typeof refreshDailyCommitmentCache === "function") {
    refreshDailyCommitmentCache(today);
    if (activeDate && activeDate !== today) {
      refreshDailyCommitmentCache(activeDate);
    }
  }
  if (typeof updateCounters === "function") updateCounters();
  if (typeof renderDashboard === "function") renderDashboard();
  if (typeof renderZoneSelectors === "function") renderZoneSelectors();
  if (typeof renderAvailableSailors === "function") renderAvailableSailors();

  const sailorName = sailor ? `${sailor.rank || ''} ${sailor.name}`.trim() : officialNoOrId;
  if (typeof showToast === "function") showToast(`✅ Released ${sailorName} from all assignments`, "success");
};

window.confirmReleaseSailor = function(sailorKey, officialNo) {
  const sailor = typeof findSailorById === "function" ? (findSailorById(sailorKey) || findSailorById(officialNo)) : null;
  const name = sailor ? `${sailor.rank || ''} ${sailor.name}`.trim() : (officialNo || sailorKey);
  const displayId = (sailor && (sailor.official_number || sailor.service_no)) ? (sailor.official_number || sailor.service_no) : (officialNo || sailorKey);
  if (confirm(`Are you sure you want to release ${name} (${displayId}) from all current assignments?`)) {
    forceCleanSailorAssignments(sailorKey || officialNo);
  }
};

// Save / update a job card
function fbSaveJobCard(data) {
  const { _fbKey, ...clean } = data;
  if (clean.assigned && clean.assigned.length === 0) {
    clean.assigned = null;
  }
  if (_fbKey) {
    return opsDB.ref(`job_cards/${_fbKey}`).update(clean);
  }
  return opsDB.ref("job_cards").push({ ...clean, created_at: Date.now() });
} // Log a material to a job card
function fbSaveJobCardMaterial(data) {
  return opsDB
    .ref("job_card_materials")
    .push({ ...data, logged_at: Date.now() });
} // Log labor to a job card
function fbSaveJobCardLabor(data) {
  return opsDB.ref("job_card_labor").push({ ...data, logged_at: Date.now() });
} // Save / update inventory item
function fbSaveInventoryItem(data) {
  const { _fbKey, id, ...rawClean } = data;
  const clean = {};
  for (let [k, v] of Object.entries(rawClean)) {
    if (v !== undefined && v !== null) {
      clean[k] = v;
    }
  }
  if (clean.category) {
    clean.category = standardizeInventoryCategory(clean.category);
  }
  if (clean.description) {
    clean.description = standardizeInventoryDescription(clean.description);
  }
  if (clean.deno) {
    clean.deno = standardizeInventoryDeno(clean.deno);
  }

  const targetKey =
    _fbKey ||
    (id && store.inventory
      ? store.inventory.find(
          (i) => String(i.id) === String(id) || String(i._fbKey) === String(id),
        )?._fbKey
      : null) ||
    id;

  if (targetKey) {
    return opsDB.ref(`inventory/${targetKey}`).update(clean);
  }
  return opsDB
    .ref("inventory")
    .push({ ...clean, date_added: clean.date_added || getLocalDateString() });
} // Save / update estimate
function fbSaveEstimate(data) {
  const { _fbKey, ...clean } = data;
  if (_fbKey) {
    return opsDB.ref(`estimates/${_fbKey}`).update(clean);
  }
  return opsDB.ref("estimates").push({ ...clean, created_at: Date.now() });
} // Save maintenance record
function fbSaveMaintenanceRecord(data) {
  return opsDB
    .ref("maintenance_records")
    .push({ ...data, created_at: Date.now() });
} // Save location
function fbSaveLocation(data) {
  const { _fbKey, ...clean } = data;
  if (clean.id === undefined || clean.id === null || Number.isNaN(clean.id)) {
    const validIds = (store.locations || [])
      .map((l) => parseInt(l.id, 10))
      .filter((n) => !Number.isNaN(n) && Number.isFinite(n));
    clean.id = validIds.length > 0 ? Math.max(...validIds) + 1 : Date.now();
  }
  if (_fbKey) {
    return opsDB.ref(`locations/${_fbKey}`).update(clean);
  }
  return opsDB.ref("locations").push({ ...clean });
} // Save daily allocation
// Sanitize keys for Firebase paths (replaces /, ., #, $, [, ] with -)
function sanitizeFbKey(id) {
  return String(id).replace(/[\/.#$\[\]]/g, "-");
}
function fbSaveDailyAllocation(data) {
  const key = `${data.date}_${sanitizeFbKey(data.sailor_id)}`;
  return opsDB
    .ref(`daily_allocations/${key}`)
    .set({ ...data, assigned_at: Date.now() });
} // Save approved pending job
function fbSaveApprovedPendingJob(data) {
  const { _fbKey, ...clean } = data;
  if (_fbKey) {
    return opsDB.ref(`approved_pending_jobs/${_fbKey}`).update(clean);
  }
  return opsDB.ref("approved_pending_jobs").push({ ...clean });
} // Update sailor zone-team status back to DB #1 (if permitted by Firebase rules)
// NOTE: This writes to ce-admin-panel2025 — ensure rules allow it
function fbUpdateSailorZoneTeam(fbKey, isZoneTeam) {
  if (!fbKey) return Promise.resolve();
  return sailorsDB.ref(`sailors/${fbKey}/isZoneTeam`).set(isZoneTeam);
} // ─────────────────────────────────────────────
// Refresh whichever view tab is currently visible
// ─────────────────────────────────────────────
function computeYesterdayJobs() {
  if (!store.dailyAllocations || !store.sailors) return;
  const today = getLocalDateString();
  const dateVal = store.dashboardDate || today; 
  
  // Find the most recent date with daily allocations before dateVal
  const pastDates = [...new Set((store.dailyAllocations || []).map((a) => a.date))]
    .filter((d) => d < dateVal)
    .sort((a, b) => b.localeCompare(a));
  const lastActiveDate = pastDates[0];

  store.sailors.forEach((s) => {
    s.yesterdayJob = null;
    if (lastActiveDate && store.dailyAllocationsMap) {
      const sId = s.id ? sanitizeFbKey(s.id) : "";
      const sFb = s._fbKey ? sanitizeFbKey(s._fbKey) : "";
      const alloc =
        (sId && store.dailyAllocationsMap[`${lastActiveDate}_${sId}`]) ||
        (sFb && store.dailyAllocationsMap[`${lastActiveDate}_${sFb}`]) ||
        (s.id && store.dailyAllocationsMap[`${lastActiveDate}_${s.id}`]) ||
        (s._fbKey && store.dailyAllocationsMap[`${lastActiveDate}_${s._fbKey}`]);
      if (alloc && alloc.work_order_id) {
        s.yesterdayJob = alloc.work_order_id;
      }
    }
  });
}
let _refreshViewTimeout = null;
function refreshCurrentView() {
  if (_refreshViewTimeout) {
    clearTimeout(_refreshViewTimeout);
  }
  _refreshViewTimeout = setTimeout(() => {
    refreshCurrentViewImmediately();
  }, 100);
}
let _isRefreshingCurrentView = false;
function refreshCurrentViewImmediately() {
  if (_isRefreshingCurrentView) return;
  _isRefreshingCurrentView = true;
  try {
    computeYesterdayJobs();
    updateCounters();
    renderZoneSelectors();
    
    const view = store.currentView || "dashboard";
    switch (view) {
      case "nastatus":
        if (typeof renderNastatusView === "function") renderNastatusView();
        break;
      case "dashboard":
        renderDashboard();
        break;
      case "projects":
        renderProjectsList();
        break;
      case "jobcards":
        renderJobCardsView();
        break;
      case "inventory":
        renderInventory();
        switchInventorySubTab(store.inventorySubTab || "stock");
        break;
      case "estimates":
        renderEstimates();
        break;
      case "maintenance":
        renderMaintenance();
        break;
      case "reports":
        renderReports();
        break;
      case "dailydetails":
        renderDailyDetailsSpecialView();
        break;
      case "summary":
        renderSummaryView();
        break;
      case "sailors":
        renderSailorsView();
        break;
      case "sailordashboard":
        renderSailorDashboardView();
        break;
      case "documents":
        renderDocumentsView();
        break;
      case "tempissues":
        switchView("inventory");
        switchInventorySubTab("tempissues");
        break;
    }
  } finally {
    _isRefreshingCurrentView = false;
  }
} // =============================================
// UTILITY FUNCTIONS
// =============================================
function updateDateTime() {
  const now = new Date();
  document.getElementById("currentDate").textContent = now.toLocaleDateString(
    "en-GB",
    { weekday: "short", year: "numeric", month: "short", day: "numeric" },
  );
  document.getElementById("currentTime").textContent = now.toLocaleTimeString(
    "en-GB",
    { hour: "2-digit", minute: "2-digit", second: "2-digit" },
  );
  
  // Update Rooting Banner
  const rootingBadge = document.getElementById("currentRootingBadge");
  const rootingText = document.getElementById("currentRootingText");
  const rootingDot = document.getElementById("currentRootingDot");
  if (rootingBadge && rootingText && rootingDot && typeof getCurrentRootingType === 'function') {
      const activeDateStr = store.dashboardDate || getLocalDateString();
      const activeDateObj = new Date(activeDateStr + "T12:00:00");
      const rootingStr = getCurrentRootingType(activeDateObj);
      rootingText.textContent = rootingStr;
      rootingBadge.classList.remove("hidden");
      
      // Styling based on normal vs holiday
      if (rootingStr.includes("Sunday Rooting")) {
          rootingBadge.className = "flex items-center gap-1 font-bold text-[9px] uppercase tracking-wider rounded-full px-2 py-0.5 border transition-all duration-300 border-rose-500/30 bg-rose-500/10 text-rose-400";
          rootingDot.className = "w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse";
      } else {
          rootingBadge.className = "flex items-center gap-1 font-bold text-[9px] uppercase tracking-wider rounded-full px-2 py-0.5 border transition-all duration-300 border-blue-500/30 bg-blue-500/10 text-blue-400";
          rootingDot.className = "w-1.5 h-1.5 rounded-full bg-blue-500";
      }
  }

  if (document.getElementById("reportDate")) {
    document.getElementById("reportDate").textContent =
      now.toLocaleDateString("en-GB");
  } // Check time for evening mode (18:00 - 20:00)
  const hour = now.getHours();
  const evalBtn = document.getElementById("evalModeBtn");
  if (hour >= 18 && hour < 20) {
    if (evalBtn) evalBtn.classList.remove("hidden");
    store.isEveningMode = true;
  } else {
    if (evalBtn) evalBtn.classList.add("hidden");
    store.isEveningMode = false;
  }
}
let _toastTimeout = null;
function showToast(message, type = "success", duration = 4000) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.className = `fixed bottom-4 right-4 ${type === "success" ? "bg-slate-900 border border-slate-700" : type === "error" ? "bg-red-700" : "bg-blue-700"} text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 transform transition-all z-[9999]`;
  const msgEl = document.getElementById("toastMessage");
  if (msgEl) msgEl.innerHTML = message;
  toast.classList.remove("hidden");
  if (_toastTimeout) clearTimeout(_toastTimeout);
  _toastTimeout = setTimeout(() => toast.classList.add("hidden"), duration);
}
let _justClosedModal = false;
function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (!m) return;
  m.classList.add("hidden");
  m.style.removeProperty("display");
  m.style.removeProperty("opacity");
  m.style.removeProperty("visibility");
  m.style.removeProperty("z-index");
  _justClosedModal = true;
  
  // Prevent ghost clicks hitting underlying elements (like the Settings tab) immediately after closing
  document.body.style.pointerEvents = "none";
  setTimeout(() => {
    document.body.style.pointerEvents = "";
  }, 500);

  setTimeout(() => {
    _justClosedModal = false;
  }, 1000);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatCurrency(amount) {
  return (
    "Rs. " +
    parseFloat(amount || 0).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}
function getPerformanceColor(score) {
  if (score >= 8) return "bg-green-500 text-white";
  if (score >= 6) return "bg-amber-500 text-white";
  if (score >= 4) return "bg-orange-500 text-white";
  return "bg-red-500 text-white";
}
function getPerformanceTextColor(score) {
  if (score >= 8) return "text-green-600";
  if (score >= 6) return "text-amber-600";
  if (score >= 4) return "text-orange-600";
  return "text-red-600";
}

let _sailorLookupCache = null;

function invalidateSailorLookupCache() {
  _sailorLookupCache = null;
}

function getSailorLookupCache() {
  if (_sailorLookupCache) return _sailorLookupCache;
  const map = new Map();
  const sailors = store.sailors || [];
  for (let i = 0; i < sailors.length; i++) {
    const s = sailors[i];
    if (!s) continue;
    if (s.id !== undefined && s.id !== null) {
      map.set(String(s.id).trim(), s);
    }
    if (s._fbKey) {
      map.set(String(s._fbKey).trim(), s);
    }
    if (s._rawIndex !== undefined) {
      map.set(String(s._rawIndex).trim(), s);
    }
    if (s.official_number) {
      const off = String(s.official_number).trim();
      map.set(off, s);
      map.set(off.toUpperCase(), s);
      const digits = off.replace(/\D/g, "");
      if (digits.length >= 3 && !map.has(digits)) map.set(digits, s);
    }
    if (s.off_no) {
      const off = String(s.off_no).trim();
      map.set(off, s);
      map.set(off.toUpperCase(), s);
      const digits = off.replace(/\D/g, "");
      if (digits.length >= 3 && !map.has(digits)) map.set(digits, s);
    }
    if (s.service_no) {
      const srv = String(s.service_no).trim();
      map.set(srv, s);
      map.set(srv.toUpperCase(), s);
      const digits = srv.replace(/\D/g, "");
      if (digits.length >= 3 && !map.has(digits)) map.set(digits, s);
    }
    if (s.sno) {
      map.set(String(s.sno).trim(), s);
    }
  }
  _sailorLookupCache = map;
  return map;
}

function findSailorById(sailorId) {
  if (sailorId === undefined || sailorId === null || sailorId === "") return null;
  const sid = String(sailorId).trim();
  if (!sid || sid === "undefined" || sid === "null") return null;

  const cache = getSailorLookupCache();
  const direct = cache.get(sid) || cache.get(sid.toUpperCase());
  if (direct) return direct;

  const sidDigits = sid.replace(/\D/g, "");
  if (sidDigits && sidDigits.length >= 3) {
    const byDigits = cache.get(sidDigits);
    if (byDigits) return byDigits;
  }

  // 3. Numeric index fallback (only within valid array bounds)
  if (/^\d+$/.test(sid)) {
    const numIdx = parseInt(sid, 10);
    // 0-based array index
    if (numIdx >= 0 && numIdx < (store.sailors || []).length && store.sailors[numIdx]) {
      return store.sailors[numIdx];
    }
    // 1-based array index
    if (numIdx > 0 && numIdx <= (store.sailors || []).length && store.sailors[numIdx - 1]) {
      return store.sailors[numIdx - 1];
    }
  }

  return null;
} // =============================================
// VIEW MANAGEMENT
// =============================================
function switchView(view, preventPushState = false) {
  if (view === "tempissues") {
    switchView("inventory", preventPushState);
    if (typeof switchInventorySubTab === "function") {
      switchInventorySubTab("tempissues");
    }
    const tabTemp = document.getElementById("tab-tempissues");
    if (tabTemp) tabTemp.classList.add("tab-active");
    const mobileTabTemp = document.getElementById("mobile-tab-tempissues");
    if (mobileTabTemp) {
      mobileTabTemp.classList.remove("text-slate-400");
      mobileTabTemp.classList.add("text-teal-400");
    }
    return;
  }

  store.currentView = view;
  if (view && view !== "tempissues") {
    try {
      localStorage.setItem("ncw_saved_view", view);
    } catch (e) {}
  }
  if (!preventPushState) {
    window.history.pushState({ view: view }, "", `#${view}`);
  }
  if (typeof toggleLeftSidebar === "function") {
    toggleLeftSidebar(false);
  }
  document
    .querySelectorAll(".view-content")
    .forEach((v) => v.classList.add("hidden"));

  const targetView = document.getElementById(`view-${view}`);
  if (targetView) {
    targetView.classList.remove("hidden");
  }

  document.querySelectorAll('[id^="tab-"]').forEach((t) => {
    t.classList.remove("tab-active");
  });
  const activeTab = document.getElementById(`tab-${view}`);
  if (activeTab) {
    activeTab.classList.add("tab-active");
    if (typeof activeTab.scrollIntoView === "function") {
      activeTab.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
    }
  }
  // Update bottom nav tabs active styles
  document.querySelectorAll('[id^="mobile-tab-"]').forEach((btn) => {
    btn.classList.remove("text-teal-400");
    btn.classList.add("text-slate-400");
  });
  const activeMobileTab = document.getElementById(`mobile-tab-${view}`);
  if (activeMobileTab) {
    activeMobileTab.classList.remove("text-slate-400");
    activeMobileTab.classList.add("text-teal-400");
  } else {
    const moreViews = ["dailydetails", "summary", "estimates", "documents", "maintenance", "reports", "projects", "nastatus", "settings"];
    if (moreViews.includes(view)) {
      const moreBtn = document.getElementById("mobile-tab-more");
      if (moreBtn) {
        moreBtn.classList.remove("text-slate-400");
        moreBtn.classList.add("text-teal-400");
      }
    }
  }

  // Update mobile top nav ribbon tabs active styles
  document.querySelectorAll('[id^="mobile-top-"]').forEach((btn) => {
    btn.classList.remove("bg-teal-800/80", "text-teal-200", "font-bold", "border", "border-teal-500/40");
    btn.classList.add("text-slate-300", "font-medium");
  });
  const activeMobileTopTab = document.getElementById(`mobile-top-${view}`);
  if (activeMobileTopTab) {
    activeMobileTopTab.classList.remove("text-slate-300", "font-medium");
    activeMobileTopTab.classList.add("bg-teal-800/80", "text-teal-200", "font-bold", "border", "border-teal-500/40");
    if (typeof activeMobileTopTab.scrollIntoView === "function") {
      activeMobileTopTab.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }
  switch (view) {
    case "nastatus":
      if (typeof renderNastatusView === "function") renderNastatusView();
      break;
    case "dashboard":
      renderDashboard();
      break;
    case "projects":
      renderProjectsList();
      break;
    case "jobcards":
      renderJobCardsView();
      break;
    case "inventory":
      renderInventory();
      if (typeof switchInventorySubTab === "function") {
        switchInventorySubTab(store.inventorySubTab || "stock");
      }
      break;
    case "estimates":
      renderEstimates();
      break;
    case "maintenance":
      renderMaintenance();
      break;
    case "reports":
      renderReports();
      break;
    case "settings":
      renderSettings();
      break;
    case "dailydetails":
      renderDailyDetailsSpecialView();
      break;
    case "summary":
      renderSummaryView();
      break;
    case "sailors":
      renderSailorsView();
      break;
    case "sailordashboard":
      renderSailorDashboardView();
      break;
    case "documents":
      renderDocumentsView();
      break;
  }
}

function toggleMobileMoreMenuSheet(show) {
  const sheet = document.getElementById("mobileMoreMenuSheet");
  if (!sheet) return;
  if (typeof show === "boolean") {
    sheet.classList.toggle("hidden", !show);
  } else {
    sheet.classList.toggle("hidden");
  }
}

function renderTempIssuesView() {
  switchView("inventory");
  if (typeof switchInventorySubTab === "function") {
    switchInventorySubTab("tempissues");
  }
}
function changeZone() {
  store.currentZone = document.getElementById("zoneSelector").value;
  localStorage.setItem("ncw_saved_zone", store.currentZone);
  store.selectedEstimate = null;
  store.selectedEstimatesForPrint = [];
  applySettings();
  toggleViewsBasedOnZone();
  refreshCurrentView();
  updateDocumentTitleDesktop(store.currentZone, store.dashboardDate);
  showToast(`Switched to ${store.currentZone}`);
} // Helper to calculate automated N/A duration using exact sailors_details.php grouping algorithm
function calculateSailorNADuration(sailor) {
  const sailorId = String(sailor.id || sailor._fbKey || "");
  const sailorFbKey = String(sailor._fbKey || sailor.id || "");
  const initStatus = String(sailor.status || sailor.attendance || "").trim();

  // 💡 S/R (Sick Report) and DL (Days Leave) are single-day events (morning report / 1-day leave)
  if (/^(S\/R|Sick Report|DL|Days Leave)$/i.test(initStatus)) {
    return "1 Day";
  }

  const isLeaveCode = (val) => {
    if (!val) return false;
    const str = typeof val === "string" ? val.trim() : String(val).trim();
    return /^(Leave|Days Leave|Half Day|Sick|Sick Report|Sick Leave|SIQ|Medical|MED|M\/C|MC|NGH|Admit|ADM|Run|AWOL|NA|N\/A|L|DL|HD|WE|T\/D|TD|M\/D|MD|S\/R|SR|S\/L|SL|R|Off|Hospital|නිවාඩු|ගිලන්)$/i.test(str);
  };

  const sailorOffNo = String(sailor.official_number || sailor.off_no || sailor.offNo || "").trim();

  // 1. Collect all availability records for this sailor from store.availability (same as sailors_details.php)
  const records = [];
  if (store.availability && typeof store.availability === "object") {
    Object.keys(store.availability).forEach((monthKey) => {
      const monthObj = store.availability[monthKey];
      if (monthObj && typeof monthObj === "object") {
        Object.keys(monthObj).forEach((dayKey) => {
          const dayObj = monthObj[dayKey];
          if (dayObj && typeof dayObj === "object") {
            const st = dayObj[sailorFbKey] || dayObj[sailorId] || (sailorOffNo && dayObj[sailorOffNo]);
            if (st) {
              const dd = String(dayKey).padStart(2, "0");
              const fullDate = `${monthKey}-${dd}`;
              records.push({ date: fullDate, status: String(st).trim() });
            }
          }
        });
      }
    });
  }

  // 2. Sort by date ascending (same as usort in sailors_details.php)
  records.sort((a, b) => a.date.localeCompare(b.date));

  if (records.length === 0) {
    if (sailor.sick_days) return sailor.sick_days + " Days";
    if (sailor.run_days) return sailor.run_days + " Days";
    return "1 Day";
  }

  // 3. Group consecutive dates with matching/leave status (exact sailors_details.php logic)
  const grouped = [];
  let currentStart = records[0].date;
  let currentEnd = records[0].date;
  let currentStatus = records[0].status;

  for (let i = 1; i < records.length; i++) {
    const rec = records[i];
    const prevDateObj = new Date(currentEnd + "T12:00:00");
    const currDateObj = new Date(rec.date + "T12:00:00");
    
    const diffTime = currDateObj - prevDateObj;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    // Consecutive day check and status match (matching T/D, L, R/D, ADM, S/R, etc.)
    const isConsecutiveGroup = (diffDays === 1) && (
      rec.status === currentStatus ||
      (isLeaveCode(rec.status) && isLeaveCode(currentStatus))
    );

    if (isConsecutiveGroup) {
      currentEnd = rec.date;
    } else {
      const startDate = new Date(currentStart + "T12:00:00");
      const endDate = new Date(currentEnd + "T12:00:00");
      const daysCount = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      grouped.push({ start: currentStart, end: currentEnd, status: currentStatus, days: daysCount });

      currentStart = rec.date;
      currentEnd = rec.date;
      currentStatus = rec.status;
    }
  }

  const startDate = new Date(currentStart + "T12:00:00");
  const endDate = new Date(currentEnd + "T12:00:00");
  const daysCount = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  grouped.push({ start: currentStart, end: currentEnd, status: currentStatus, days: daysCount });

  // 4. Return days from the latest active leave group
  const latestGroup = grouped[grouped.length - 1];
  return (latestGroup && latestGroup.days) ? `${latestGroup.days} Days` : "1 Day";
}

// Helper to resolve Yesterday's Job title or description from Database
function getSailorYesterdayJobText(sailor) {
  let jobKey = sailor.yesterdayJob || sailor.yesterday_job;
  
  if (!jobKey && store.dailyAllocations) {
    const today = new Date((typeof getLocalDateString === "function" ? getLocalDateString() : new Date().toISOString().split("T")[0]) + "T12:00:00");
    today.setDate(today.getDate() - 1);
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const yestStr = `${yyyy}-${mm}-${dd}`;

    const sailorId = String(sailor.id || sailor._fbKey || "");
    const sailorFbKey = String(sailor._fbKey || sailor.id || "");

    const alloc = store.dailyAllocations.find(a => 
      a.date === yestStr && (String(a.sailor_id) === sailorId || String(a.sailor_id) === sailorFbKey)
    );

    if (alloc) {
      jobKey = alloc.work_order_id;
    }
  }

  if (!jobKey) return "-";

  const keyStr = String(jobKey);
  const wo = (store.workOrders || []).find(w => String(w.id || w._fbKey) === keyStr);
  if (wo) return wo.description || wo.title || wo.location_name || wo.work_order_no || keyStr;

  const jc = (store.jobCards || []).find(j => String(j.id || j._fbKey) === keyStr);
  if (jc) return jc.description || jc.title || jc.location_name || jc.job_card_no || keyStr;

  return keyStr;
}

// N/A Status View moved to js/modules/summary-view.js
// =============================================
// DASHBOARD & DAILY LABOR ALLOCATIONS (Moved to js/modules/dashboard.js)
// =============================================
// =============================================
// WORK ORDERS ENGINE, APPROVALS HUB & EVALUATIONS (Moved to js/modules/work-orders.js)
// =============================================

// ============================================================================
// SUNDAY WEEKLY EVALUATION MODULE (Moved to js/modules/sunday-evaluation.js)
// ============================================================================

// =============================================
// JOB CARDS ENGINE (Moved to js/modules/job-cards.js)
// =============================================

// =============================================
// CORE INVENTORY & MATERIAL MANAGEMENT (Moved to js/modules/inventory.js)
// =============================================
// =============================================
// ESTIMATES & BOQ ENGINE (Moved to js/modules/estimates.js)
// =============================================

// =============================================
// LOCATIONS & MAINTENANCE (LMD) (Moved to js/modules/locations-maintenance.js)
// =============================================
// REPORTS & BULK UPLOAD (Moved to js/modules/reports-upload.js)
// =============================================
// =============================================
// SETTINGS, ZONES, IN-CHARGES & APPROVED PROJECTS (Moved to js/modules/settings.js)
// =============================================

// Job Cards Multi-Merge Workflow moved to js/modules/job-cards.js

// =============================================
// CEMENT PRE-CAST WORKSHOP & NAV 254 SYSTEM (Moved to js/modules/precast-workshop.js)
// =============================================
// =============================================
// INITIALIZATION
// =============================================
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initPwaHistoryManagement();
  if (deferredPrompt) {
    const installBtn = document.getElementById("installAppBtn");
    if (installBtn) installBtn.classList.remove("hidden");
  }
  updateOnlineStatus();
  updateDateTime();
  setInterval(updateDateTime, 1000);
  applyActiveProfile();
  renderZoneSelectors(); // Initialize dashboardDate to today
  const today = getLocalDateString();
  store.dashboardDate = today;
  updateDocumentTitleDesktop(store.currentZone, today);
  const datePicker = document.getElementById("dashboardDatePicker");
  if (datePicker) {
    datePicker.value = today;
  } // ── Initial render (with empty store — Firebase will populate) ──
  const initialView = store.currentView || getInitialAppView();
  if (initialView && initialView !== "dashboard") {
    switchView(initialView, true);
  } else {
    renderDashboard();
  } // Set today's date for inventory
  if (document.getElementById("invDate")) {
    document.getElementById("invDate").value = today;
  } // ── Start Firebase listeners ──
  // DB#1: Load sailors from ce-admin-panel2025 (realtime, read-only)
  initSailorsListener();
  initAvailabilityListener();
  initLongTermDeploymentsListeners(); // DB#2: Load & sync all CE Management System operational data from ncw-ps-operations (realtime, read-write)
  initOpsListeners(); // DB#3: Load Settings from Firebase DB2
  initSettingsListener();
  console.log("🚀 CMSys v2.6 initialized with dual Firebase");
}); // Global event listeners
document.addEventListener("dragleave", (e) => {
  if (e.target.classList) {
    e.target.classList.remove("drag-over");
  }
});
document.addEventListener("click", (e) => {
  const searchInput = document.getElementById("cfg-userName");
  const resultsDiv = document.getElementById("cfg-sailorSearchResults");
  if (searchInput && resultsDiv) {
    if (!searchInput.contains(e.target) && !resultsDiv.contains(e.target)) {
      resultsDiv.classList.add("hidden");
    }
  }
  const searchSubInput = document.getElementById("cfg-userSubName");
  const resultsSubDiv = document.getElementById("cfg-subSailorSearchResults");
  if (searchSubInput && resultsSubDiv) {
    if (
      !searchSubInput.contains(e.target) &&
      !resultsSubDiv.contains(e.target)
    ) {
      resultsSubDiv.classList.add("hidden");
    }
  }
  const woIncInput = document.getElementById("cfg-woInchargeName");
  const woIncDiv = document.getElementById("cfg-woInchargeSearchResults");
  if (woIncInput && woIncDiv) {
    if (!woIncInput.contains(e.target) && !woIncDiv.contains(e.target)) {
      woIncDiv.classList.add("hidden");
    }
  }
  const woSupInput = document.getElementById("cfg-woSupervisorName");
  const woSupDiv = document.getElementById("cfg-woSupervisorSearchResults");
  if (woSupInput && woSupDiv) {
    if (!woSupInput.contains(e.target) && !woSupDiv.contains(e.target)) {
      woSupDiv.classList.add("hidden");
    }
  }
  const woArtInput = document.getElementById("cfg-woArtificerName");
  const woArtDiv = document.getElementById("cfg-woArtificerSearchResults");
  if (woArtInput && woArtDiv) {
    if (!woArtInput.contains(e.target) && !woArtDiv.contains(e.target)) {
      woArtDiv.classList.add("hidden");
    }
  }
}); // Profile Pic Load Failure Fallback Handler
function handleProfilePicError(img, cleanNo) {
  if (!img) return;
  const currentSrc = (img.getAttribute("src") || img.src || "").split("?")[0];
  if (cleanNo) {
    if (currentSrc.endsWith(".JPG") || currentSrc.endsWith(".jpeg")) {
      img.src = `images/${cleanNo}.jpg`;
      return;
    } else if (currentSrc.endsWith(".jpg")) {
      img.src = `images/${cleanNo}.png`;
      return;
    } else if (currentSrc.endsWith(".png")) {
      img.src = `images/${cleanNo}.PNG`;
      return;
    }
  }
  const fallback = img.getAttribute("data-fallback") || "OIC";
  const parent = img.parentElement;
  if (parent && parent.id === "profileMenuBtn") {
    parent.innerHTML = fallback;
  } else {
    img.outerHTML = fallback;
  }
} // ── Profile Dropdown and Switching ──
function toggleProfileDropdown() {
  const dropdown = document.getElementById("profileDropdown");
  if (dropdown) {
    dropdown.classList.toggle("hidden");
    if (!dropdown.classList.contains("hidden")) {
      renderProfileDropdown();
    }
  }
}
function renderProfileDropdown() {
  const list = document.getElementById("profileOptionsList");
  if (!list) return;
  const s = store.settings || {};
  let html = "";

  // User Profile & Security Quick Action
  html += `
    <div onclick="toggleProfileDropdown(); openUserProfileModal();" class="profile-hub-card px-4 py-2.5 cursor-pointer border-b transition-colors flex items-center justify-between hover:bg-teal-950/20">
      <div class="flex items-center gap-2">
        <span class="text-base">👤</span>
        <div class="text-left">
          <p class="profile-hub-title text-xs font-extrabold flex items-center gap-1.5 text-teal-300">
            User Profile & Security
            <span class="text-[9px] px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">EDIT</span>
          </p>
          <p class="profile-hub-sub text-[10px] font-medium text-slate-400">Edit Details, Password & PIN</p>
        </div>
      </div>
      <span class="text-xs text-teal-400 font-bold hover:scale-110 transition-transform">⚙️</span>
    </div>
  `;

  // 0. Quick Shortcut: Officer Approvals Hub
  const pendingWos = (store.workOrders || []).filter(w => w.officer_review_status === "Pending Review").length;
  const pendingJcs = (store.jobCards || []).filter(j => j.officer_clearance_status === "Pending Clearance").length;
  const pendingEsts = (store.estimates || []).filter(e => e.approval_status === "Pending Approval" || e.status === "Pending").length;
  const totalPending = pendingWos + pendingJcs + pendingEsts;

  html += `
    <div onclick="toggleProfileDropdown(); openOfficerApprovalsHubModal();" class="profile-hub-card px-4 py-2.5 cursor-pointer border-b transition-colors flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-base">🎖️</span>
        <div class="text-left">
          <p class="profile-hub-title text-xs font-extrabold">Officer Approvals Hub</p>
          <p class="profile-hub-sub text-[10px] font-medium">Review pending clearances</p>
        </div>
      </div>
      <span class="profile-hub-badge text-xs font-black px-2 py-0.5 rounded-full ${totalPending > 0 ? 'bg-amber-400 text-slate-950 font-bold animate-pulse' : 'bg-slate-700 text-slate-200'}">${totalPending}</span>
    </div>
  `;

  // 1. Command / OIC Profiles List
  const oicProfs = getOicProfiles();
  oicProfs.forEach((p) => {
    const isThisOicActive =
      store.activeProfileType === "OIC" && store.activeOicProfileId === p.id;
    const cleanNo = p.serviceNo ? p.serviceNo.replace(/[^a-zA-Z0-9]/g, "") : "";
    const shortRank = p.rank
      ? p.rank.replace(/[a-z\s()]/gi, "").substring(0, 3)
      : "OIC";
    const fallbackText = `<div class="w-8 h-8 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs flex-shrink-0">${shortRank}</div>`;
    const avatarHtml = cleanNo
      ? `<img src="images/${cleanNo}.JPG" data-fallback="${fallbackText.replace(/"/g, "&quot;")}" class="w-8 h-8 rounded-full object-cover flex-shrink-0" onerror="handleProfilePicError(this, '${cleanNo}')">`
      : fallbackText;
    const authBadge = getAuthorityBadge(p.authority, p.serviceNo);
    html += `
            <div onclick="switchActiveProfile('OIC', '', '${p.id}')" class="profile-officer-row px-4 py-2.5 cursor-pointer transition-colors flex items-center gap-3 ${isThisOicActive ? "profile-officer-active" : ""}">
                ${avatarHtml}
                <div class="text-left flex-1 min-w-0">
                    <p class="profile-officer-name text-xs font-bold truncate">${p.rank} ${p.name}</p>
                    <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        ${authBadge}
                        <span class="profile-officer-sno text-[10px] font-mono">${p.serviceNo}</span>
                    </div>
                </div>
                ${isThisOicActive ? '<span class="profile-officer-check font-bold">✓</span>' : ""}
            </div>
        `;
  });
  if (oicProfs.length === 0) {
    const isOicActive =
      !store.activeProfileType || store.activeProfileType === "OIC";
    html += `
            <div onclick="switchActiveProfile('OIC')" class="px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-center gap-3 ${isOicActive ? "bg-teal-50/50" : ""}">
                <div class="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">OIC</div>
                <div class="text-left flex-1 min-w-0">
                    <p class="text-xs font-bold text-slate-800">Command / OIC</p>
                    <p class="text-[10px] text-slate-400">System Admin • View All Zones</p>
                </div>
                ${isOicActive ? '<span class="text-teal-600 font-bold">✓</span>' : ""}
            </div>
        `;
  } // 2. Zone In-Charge & Sub In-Charge Options
  if (store.settings && store.settings.zoneInCharges) {
    Object.entries(store.settings.zoneInCharges).forEach(([zoneId, inc]) => {
      if (!inc) return; // Main In-Charge
      if (inc.name) {
        const isActive =
          store.activeProfileType === "ZoneInCharge" &&
          store.activeProfileZone === zoneId;
        const incCleanNo = inc.serviceNo
          ? inc.serviceNo.replace(/[^a-zA-Z0-9]/g, "")
          : "";
        const incShortRank = inc.rank
          ? inc.rank.replace(/[a-z\s()]/gi, "").substring(0, 3)
          : "OIC";
        const incFallbackText = `<div class="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">${incShortRank}</div>`;
        const incAvatarHtml = incCleanNo
          ? `<img src="images/${incCleanNo}.JPG" data-fallback="${incFallbackText.replace(/"/g, "&quot;")}" class="w-8 h-8 rounded-full object-cover flex-shrink-0" onerror="handleProfilePicError(this, '${incCleanNo}')">`
          : incFallbackText;
        html += `
                    <div onclick="switchActiveProfile('ZoneInCharge', '${zoneId}')" class="px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-center gap-3 ${isActive ? "bg-teal-50/50" : ""}">
                        ${incAvatarHtml}
                        <div class="min-w-0 flex-1 text-left">
                            <p class="text-xs font-bold text-slate-800 truncate">${zoneId} In-Charge</p>
                            <p class="text-[10px] text-slate-505 truncate">${inc.rank} ${inc.name}</p>
                            <p class="text-[9px] text-slate-400 font-mono">${inc.serviceNo}</p>
                        </div>
                        ${isActive ? '<span class="text-teal-600 font-bold">✓</span>' : ""}
                    </div>
                `;
      } // Sub In-Charge
      if (inc.subName) {
        const isSubActive =
          store.activeProfileType === "ZoneSubInCharge" &&
          store.activeProfileZone === zoneId;
        const subCleanNo = inc.subServiceNo
          ? inc.subServiceNo.replace(/[^a-zA-Z0-9]/g, "")
          : "";
        const subShortRank = inc.subRank
          ? inc.subRank.replace(/[a-z\s()]/gi, "").substring(0, 3)
          : "OIC";
        const subFallbackText = `<div class="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">${subShortRank}</div>`;
        const subAvatarHtml = subCleanNo
          ? `<img src="images/${subCleanNo}.JPG" data-fallback="${subFallbackText.replace(/"/g, "&quot;")}" class="w-8 h-8 rounded-full object-cover flex-shrink-0" onerror="handleProfilePicError(this, '${subCleanNo}')">`
          : subFallbackText;
        html += `
                    <div onclick="switchActiveProfile('ZoneSubInCharge', '${zoneId}')" class="px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-center gap-3 ${isSubActive ? "bg-teal-50/50" : ""}">
                        ${subAvatarHtml}
                        <div class="min-w-0 flex-1 text-left">
                            <p class="text-xs font-bold text-slate-800 truncate">${zoneId} Sub In-Charge</p>
                            <p class="text-[10px] text-slate-505 truncate">${inc.subRank} ${inc.subName}</p>
                            <p class="text-[9px] text-slate-400 font-mono">${inc.subServiceNo}</p>
                        </div>
                        ${isSubActive ? '<span class="text-teal-600 font-bold">✓</span>' : ""}
                    </div>
                `;
      }
    });
  }
  // Add logout button
  html += `
        <div class="border-t border-slate-100 mt-1">
            <div onclick="logoutProfile()" class="px-4 py-2.5 hover:bg-red-50 text-red-600 font-semibold cursor-pointer transition-colors text-xs flex items-center gap-3">
                <span class="text-sm">↩️</span>
                <span>Logout / Switch Profile</span>
            </div>
        </div>
    `;
  list.innerHTML = html;
}
function editPassword(type, zoneId = "") {
  const s = store.settings || {};
  let currentPwd = "";
  if (type === "OIC") {
    currentPwd = s.oicPassword || "";
  } else if (zoneId && s.zoneInCharges && s.zoneInCharges[zoneId]) {
    currentPwd = s.zoneInCharges[zoneId].password || "";
  }
  const newPwd = prompt(
    `Enter new password for ${type === "OIC" ? "Command / OIC" : zoneId + " In-Charge"}:`,
    currentPwd,
  );
  if (newPwd === null) return;
  if (type === "OIC") {
    saveSettingField("oicPassword", newPwd);
    showToast("Password for Command / OIC updated");
    return;
  }
  if (!s.zoneInCharges) s.zoneInCharges = {};
  if (!s.zoneInCharges[zoneId]) s.zoneInCharges[zoneId] = {};
  s.zoneInCharges[zoneId].password = newPwd;
  opsDB
    .ref(`settings/zoneInCharges/${zoneId}/password`)
    .set(newPwd)
    .then(() => {
      showToast(`Password for ${zoneId} In-Charge updated`);
    });
}
function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === "password") {
    input.type = "text";
    if (btn) btn.textContent = "🙈";
  } else {
    input.type = "password";
    if (btn) btn.textContent = "👁️";
  }
}

function saveSettingsUserPassword(password) {
  const zoneId = document.getElementById("cfg-userZone") ? document.getElementById("cfg-userZone").value : "";
  if (!zoneId) {
    showToast("Please select a Zone first", "error");
    return;
  }
  if (!store.settings.zoneInCharges) store.settings.zoneInCharges = {};
  if (!store.settings.zoneInCharges[zoneId]) {
    store.settings.zoneInCharges[zoneId] = {};
  }
  
  // If unchanged, return
  if (store.settings.zoneInCharges[zoneId].password === password) return;
  
  store.settings.zoneInCharges[zoneId].password = password;
  try {
    localStorage.setItem("ncw_settings_v1", JSON.stringify(store.settings));
  } catch (e) {}

  if (typeof opsDB !== "undefined") {
    opsDB
      .ref(`settings/zoneInCharges/${zoneId}/password`)
      .set(password)
      .then(() => {
        showToast(`Password for ${zoneId} In-Charge saved`, "success");
      })
      .catch((err) => {
        console.warn("Error saving password:", err);
      });
  }
}
function switchActiveProfile(type, zoneId = "", oicProfileId = "") {
  const s = store.settings || {};
  let targetPassword = "";
  let targetName = "";
  if (type === "OIC") {
    if (oicProfileId) {
      const profile = getOicProfiles().find((p) => p.id === oicProfileId);
      if (profile) {
        targetPassword = profile.password || "";
        targetName = `${profile.rank} ${profile.name}`;
      }
    } else {
      targetPassword = s.oicPassword || "";
      targetName = s.oicName ? `${s.oicRank} ${s.oicName}` : "Command / OIC";
    }
  } else if (
    (type === "ZoneInCharge" || type === "ZoneSubInCharge") &&
    zoneId
  ) {
    const inc = s.zoneInCharges && s.zoneInCharges[zoneId];
    if (inc) {
      targetPassword = inc.password || "";
      targetName =
        type === "ZoneSubInCharge"
          ? `${inc.subRank} ${inc.subName} (Sub In-Charge - ${zoneId})`
          : `${inc.rank} ${inc.name} (${zoneId})`;
    }
  } // If a password is set, show prompt modal instead of switching immediately
  if (targetPassword) {
    document.getElementById("pwdModalTargetType").value = type;
    document.getElementById("pwdModalTargetZone").value = zoneId;
    document.getElementById("pwdModalTargetOicProfileId").value = oicProfileId;
    document.getElementById("pwdModalProfileName").textContent = targetName;
    document.getElementById("profilePasswordInput").value = ""; // Open modal
    document.getElementById("profilePasswordModal").classList.remove("hidden");
    document.getElementById("profilePasswordInput").focus(); // Close dropdown
    const dropdown = document.getElementById("profileDropdown");
    if (dropdown) dropdown.classList.add("hidden");
    return;
  } // No password, switch immediately
  performProfileSwitch(type, zoneId, oicProfileId);
}
function submitProfilePassword(e) {
  e.preventDefault();
  const type = document.getElementById("pwdModalTargetType").value;
  const zoneId = document.getElementById("pwdModalTargetZone").value;
  const oicProfileId = document.getElementById(
    "pwdModalTargetOicProfileId",
  ).value;
  const inputPwd = document.getElementById("profilePasswordInput").value;
  const s = store.settings || {};
  let correctPassword = "";
  if (type === "OIC") {
    if (oicProfileId) {
      const profile = getOicProfiles().find((p) => p.id === oicProfileId);
      correctPassword = profile ? profile.password || "" : "";
    } else {
      correctPassword = s.oicPassword || "";
    }
  } else if (
    (type === "ZoneInCharge" || type === "ZoneSubInCharge") &&
    zoneId
  ) {
    const inc = s.zoneInCharges && s.zoneInCharges[zoneId];
    correctPassword = inc ? inc.password || "" : "";
  }
  if (inputPwd === correctPassword) {
    closeModal("profilePasswordModal");
    performProfileSwitch(type, zoneId, oicProfileId);
  } else {
    showToast("Incorrect Password! Authentication failed.", "error");
    document.getElementById("profilePasswordInput").value = "";
    document.getElementById("profilePasswordInput").focus();
  }
}
function performProfileSwitch(type, zoneId = "", oicProfileId = "", rememberMe = true) {
  store.activeProfileType = type;
  store.activeProfileZone = zoneId;

  const storage = rememberMe ? localStorage : sessionStorage;
  const altStorage = rememberMe ? sessionStorage : localStorage;

  // Clear alternate storage
  altStorage.removeItem("ncw_ps_active_profile_type");
  altStorage.removeItem("ncw_ps_active_profile_zone");
  altStorage.removeItem("ncw_ps_active_oic_profile_id");
  altStorage.removeItem("ncw_ps_active_sailor_id");

  // Save to target storage
  storage.setItem("ncw_ps_active_profile_type", type);
  storage.setItem("ncw_ps_active_profile_zone", zoneId);
  if (zoneId) {
    storage.setItem("ncw_saved_zone", zoneId);
    store.currentZone = zoneId;
  }

  if (type === "Sailor") {
    storage.setItem("ncw_ps_active_sailor_id", oicProfileId); // third param is sailorId
    switchView("sailordashboard");
  } else {
    storage.setItem("ncw_ps_active_oic_profile_id", oicProfileId);
    switchView("dashboard");
  }

  // Apply active profile rules
  applyActiveProfile();
  if (typeof updateGlobalOfficerHubBadge === "function") updateGlobalOfficerHubBadge();
  // Refresh view
  refreshCurrentView();

  if (type === "Sailor") {
    showToast("Logged in as Sailor", "success");
  } else if (type === "OIC") {
    showToast("Logged in to Command / OIC Profile", "success");
  } else if (type === "ZoneSubInCharge") {
    showToast(`Logged in as Sub In-Charge for ${zoneId}`, "success");
  } else {
    showToast(`Logged in as In-Charge for ${zoneId}`, "success");
  }
}

function applyActiveProfile() {
  // Read profile from localStorage or sessionStorage
  const savedType = localStorage.getItem("ncw_ps_active_profile_type") || sessionStorage.getItem("ncw_ps_active_profile_type");
  const savedZone = localStorage.getItem("ncw_ps_active_profile_zone") || sessionStorage.getItem("ncw_ps_active_profile_zone");
  const loginScreen = document.getElementById("loginScreen");

  if (!savedType) {
    // Show login screen if not authenticated
    if (loginScreen) {
      loginScreen.classList.remove("hidden");
      populateLoginProfiles();
    }
    return;
  } else {
    // Hide login screen if authenticated
    if (loginScreen) loginScreen.classList.add("hidden");
    store.activeProfileType = savedType;
    store.activeProfileZone = savedZone || "";
    store.activeOicProfileId =
      localStorage.getItem("ncw_ps_active_oic_profile_id") ||
      sessionStorage.getItem("ncw_ps_active_oic_profile_id") || "";
  }

  // Initialize currentView on load if not set
  if (!store.currentView) {
    store.currentView =
      store.activeProfileType === "Sailor" ? "sailordashboard" : getInitialAppView();
  }
  const type = store.activeProfileType;
  const zoneId = store.activeProfileZone;
  const s = store.settings || {};
  const zoneSelector = document.getElementById("zoneSelector"); // Toggle administrative components for Sailor Login
  const navHeader = document.getElementById("navalHeader");
  const mobileNav = document.getElementById("mobileTabBar");
  const statusB = document.getElementById("tacticalStatusBar");
  const sidebar = document.getElementById("leftSidebarContainer");
  const sidebarToggle = document.getElementById("sidebarToggleBtn");
  if (type === "Sailor") {
    if (navHeader) navHeader.classList.add("hidden");
    if (mobileNav) mobileNav.classList.add("hidden");
    if (statusB) statusB.classList.add("hidden");
    if (sidebar) sidebar.classList.add("hidden");
    if (sidebarToggle) sidebarToggle.classList.add("hidden");
    switchView("sailordashboard");
    renderSailorDashboardView();
    return;
  } else {
    if (navHeader) navHeader.classList.remove("hidden");
    if (mobileNav) mobileNav.classList.remove("hidden");
    if (statusB) statusB.classList.remove("hidden");
    if (sidebar) sidebar.classList.remove("hidden");
    if (sidebarToggle) sidebarToggle.classList.remove("hidden");
  }
  if ((type === "ZoneInCharge" || type === "ZoneSubInCharge") && zoneId) {
    store.currentZone = zoneId;
    if (zoneSelector) {
      zoneSelector.value = zoneId;
      zoneSelector.disabled = true;
      zoneSelector.title = "Zone locked to your assigned zone";
      zoneSelector.classList.add("opacity-75", "cursor-not-allowed");
    } // Set active user info from settings
    const inc = s.zoneInCharges && s.zoneInCharges[zoneId];
    if (inc) {
      if (type === "ZoneSubInCharge") {
        store.currentUser = {
          name: inc.subName,
          rank: inc.subRank,
          serviceNo: inc.subServiceNo,
          permSettings: false,
          permAllZones: false,
          allowedZones: [zoneId],
          permAllInvZones: false,
          allowedInvZones: [zoneId],
        };
      } else {
        store.currentUser = {
          name: inc.name,
          rank: inc.rank,
          serviceNo: inc.serviceNo,
          permSettings: false,
          permAllZones: false,
          allowedZones: [zoneId],
          permAllInvZones: false,
          allowedInvZones: [zoneId],
        };
      }
    } else {
      // Fallback if settings are deleted
      store.currentUser = {
        name: s.userName,
        rank: s.userRank,
        serviceNo: s.userServiceNo,
        permSettings: false,
        permAllZones: false,
        allowedZones: [zoneId],
      };
    } // Hide settings tab / button for Zone In-Charges
    const btnAdminSettings = document.getElementById("btn-admin-settings");
    if (btnAdminSettings) {
      btnAdminSettings.classList.add("hidden");
    }
    const mobileSettingsTabBtn = document.getElementById("mobile-tab-settings");
    if (mobileSettingsTabBtn) {
      mobileSettingsTabBtn.classList.add("hidden");
    } // If they are on settings view, redirect them to dashboard
    if (store.currentView === "settings") {
      switchView("dashboard");
    } // Update profile menu button text or picture to rank + zone
    const profileBtn = document.getElementById("profileMenuBtn");
    if (profileBtn) {
      const shortRank = store.currentUser.rank
        ? store.currentUser.rank.replace(/[a-z\s()]/gi, "").substring(0, 3)
        : "OIC";
      const shortZone = zoneId.split("-")[0];
      const fallbackText = `<span class="block">${shortRank}</span><span class="block text-[8px] text-teal-300 font-medium">${shortZone}</span>`;
      const cleanNo = store.currentUser.serviceNo
        ? store.currentUser.serviceNo.replace(/[^a-zA-Z0-9]/g, "")
        : "";
      if (cleanNo) {
        profileBtn.innerHTML = `<img src="images/${cleanNo}.JPG" data-fallback="${fallbackText.replace(/"/g, "&quot;")}" class="w-full h-full object-cover rounded-full" onerror="handleProfilePicError(this, '${cleanNo}')">`;
      } else {
        profileBtn.innerHTML = fallbackText;
      }
      profileBtn.style.fontSize = "9px";
      profileBtn.style.lineHeight = "1.1";
      profileBtn.style.whiteSpace = "pre-line";
    } // Update active profile texts in dropdown
    const activeNameEl = document.getElementById("profileActiveName");
    const activeRoleEl = document.getElementById("profileActiveRole");
    if (activeNameEl)
      activeNameEl.textContent = `${store.currentUser.rank} ${store.currentUser.name}`;
    if (activeRoleEl) activeRoleEl.textContent = `${zoneId} In-Charge`;
  } else {
    // Command / OIC Profile
    if (zoneSelector) {
      zoneSelector.disabled = false;
      zoneSelector.title = "Select Zone";
      zoneSelector.classList.remove("opacity-75", "cursor-not-allowed");
    } // Set active user info to overall OIC
    let oicName = s.oicName || s.userName;
    let oicRank = s.oicRank || s.userRank;
    let oicServiceNo = s.oicServiceNo || s.userServiceNo;
    let oicAuthority = "oic_1";
    let permSettings = true;
    let permDashboard = true;
    let permJobCards = true;
    let permInventory = true;
    let permEstimates = true;
    let permLMD = true;
    let permSailors = true;
    let permReports = true;
    let permAllZones = true;
    let permAllInvZones = true;
    let allowedZones = store.zones ? store.zones.map((z) => z.id) : [];
    let allowedInvZones = store.zones ? store.zones.map((z) => z.id) : [];
    const oicProfileId = store.activeOicProfileId;
    if (oicProfileId) {
      const profile = getOicProfiles().find((p) => p.id === oicProfileId);
      if (profile) {
        oicName = profile.name;
        oicRank = profile.rank;
        oicServiceNo = profile.serviceNo;
        oicAuthority = profile.authority || "oic_1";
        const isMaster = (profile.serviceNo || "").includes("3576") || profile.authority === "master_admin";
        const isExec = oicAuthority === "cced_e" || oicAuthority === "cceo_e";
        if (!isMaster) {
          permSettings = false; // strictly Master Admin only
          permDashboard = profile.permDashboard !== false;
          permJobCards = profile.permJobCards !== false;
          permInventory = profile.permInventory !== false;
          permEstimates = profile.permEstimates !== false;
          permLMD = profile.permLMD !== false;
          permSailors = profile.permSailors !== false;
          permReports = profile.permReports !== false;
          permAllZones = isExec || profile.permAllZones === true;
          allowedZones = permAllZones && store.zones ? store.zones.map((z) => z.id) : (profile.allowedZones || []);
          permAllInvZones = isExec || profile.permAllInvZones !== false;
          allowedInvZones = permAllInvZones && store.zones ? store.zones.map((z) => z.id) : (profile.allowedInvZones || []);
        }
      }
    }
    store.currentUser = {
      name: oicName,
      rank: oicRank,
      serviceNo: oicServiceNo,
      authority: oicAuthority,
      permSettings: permSettings,
      permDashboard: permDashboard,
      permJobCards: permJobCards,
      permInventory: permInventory,
      permEstimates: permEstimates,
      permLMD: permLMD,
      permSailors: permSailors,
      permReports: permReports,
      permAllZones: permAllZones,
      allowedZones: allowedZones,
      permAllInvZones: permAllInvZones,
      allowedInvZones: allowedInvZones,
    };

    // Toggle isolated settings button visibility
    const btnAdminSettings = document.getElementById("btn-admin-settings");
    if (btnAdminSettings) {
      if (permSettings) btnAdminSettings.classList.remove("hidden");
      else btnAdminSettings.classList.add("hidden");
    }

    // Show/hide main navigation tabs based on user permissions
    const tabPermissions = {
      dashboard: permDashboard,
      dailydetails: permDashboard,
      summary: permDashboard,
      jobcards: permJobCards,
      inventory: permInventory,
      estimates: permEstimates,
      maintenance: permLMD,
      sailors: permSailors,
      reports: permReports,
      projects: true,
      documents: true,
      settings: permSettings,
    }; // Loop over each tab and toggle visibility
    for (const [viewName, hasAccess] of Object.entries(tabPermissions)) {
      const btn = document.getElementById(`tab-${viewName}`);
      const mBtn = document.getElementById(`mobile-tab-${viewName}`);
      if (btn) {
        if (hasAccess) btn.classList.remove("hidden");
        else btn.classList.add("hidden");
      }
      if (mBtn) {
        if (hasAccess) mBtn.classList.remove("hidden");
        else mBtn.classList.add("hidden");
      }
    } // If current view is explicitly forbidden, redirect to the first allowed view
    if (store.currentView && tabPermissions[store.currentView] === false) {
      const firstAllowed = Object.keys(tabPermissions).find(
        (k) => tabPermissions[k],
      );
      if (firstAllowed) {
        switchView(firstAllowed);
      }
    } // Update profile menu button text or picture to "OIC" or rank
    const profileBtn = document.getElementById("profileMenuBtn");
    if (profileBtn) {
      const shortRank = store.currentUser.rank
        ? store.currentUser.rank.replace(/[a-z\s()]/gi, "").substring(0, 3)
        : "OIC";
      const fallbackText = shortRank;
      const cleanNo = store.currentUser.serviceNo
        ? store.currentUser.serviceNo.replace(/[^a-zA-Z0-9]/g, "")
        : "";
      if (cleanNo) {
        profileBtn.innerHTML = `<img src="images/${cleanNo}.JPG" data-fallback="${fallbackText.replace(/"/g, "&quot;")}" class="w-full h-full object-cover rounded-full" onerror="handleProfilePicError(this, '${cleanNo}')">`;
      } else {
        profileBtn.innerHTML = fallbackText;
      }
      profileBtn.style.fontSize = "10px";
      profileBtn.style.lineHeight = "normal";
      profileBtn.style.whiteSpace = "normal";
    } // Update active profile texts in dropdown
    const activeNameEl = document.getElementById("profileActiveName");
    const activeRoleEl = document.getElementById("profileActiveRole");
    if (activeNameEl)
      activeNameEl.textContent = store.currentUser.name
        ? `${store.currentUser.rank} ${store.currentUser.name}`
        : "Command / OIC";
    if (activeRoleEl) activeRoleEl.textContent = `System Administrator`;
  } // Update OIC badge/profile button title
  const profileBtn = document.getElementById("profileMenuBtn");
  if (profileBtn) {
    profileBtn.title = `Profile: ${store.currentUser.rank} ${store.currentUser.name} (${store.currentUser.serviceNo})`;
  } // Update zone dropdown selectors based on active profile permissions
  renderZoneSelectors(); // Refresh profile dropdown list to update checkmarks
  renderProfileDropdown();
} // Window click listener to close profile dropdown
window.addEventListener("click", function (e) {
  const dropdown = document.getElementById("profileDropdown");
  const btn = document.getElementById("profileMenuBtn");
  if (
    dropdown &&
    btn &&
    !dropdown.contains(e.target) &&
    !btn.contains(e.target)
  ) {
    dropdown.classList.add("hidden");
  }
});

// =============================================
// LOGIN PORTAL WORKFLOW (Moved to js/modules/auth-profile.js)
// =============================================
function toggleLeftSidebar(open) {
  const sidebar = document.getElementById("leftSidebarContainer");
  const backdrop = document.getElementById("sidebarBackdrop");
  const arrow = document.getElementById("sidebarToggleArrow");
  if (!sidebar) return;
  const isOpen =
    open !== undefined ? open : sidebar.classList.contains("-translate-x-full");
  if (isOpen) {
    sidebar.classList.remove("-translate-x-full");
    sidebar.classList.add("translate-x-0");
    if (backdrop) backdrop.classList.remove("hidden");
    if (arrow) {
      arrow.textContent = "◀";
    }
  } else {
    sidebar.classList.remove("translate-x-0");
    sidebar.classList.add("-translate-x-full");
    if (backdrop) backdrop.classList.add("hidden");
    if (arrow) {
      arrow.textContent = "➔";
    }
  }
} // =============================================
// =============================================
// SUMMARY VIEW, SPECIAL ZONE HELPERS & THEME (Moved to js/modules/summary-view.js)
// =============================================
// =============================================
// SAILORS DIRECTORY, PERFORMANCE & LEAVE CONTROLLER (Moved to js/modules/sailor-muster.js)
// =============================================

// =============================================
// SAILOR LOGIN & AUTHENTICATION (Moved to js/modules/auth-profile.js)
// =============================================
// EXTERNAL PROJECTS MANAGEMENT & CLOUD BACKUPS (Moved to js/modules/external-projects.js)
// =============================================
// =============================================
// DATE SCHEDULE CALENDAR (Moved to js/modules/calendar.js)
// =============================================

// =============================================
// DOCUMENTS & MINUTE SHEET MANAGEMENT SYSTEM (Moved to js/modules/documents-minutes.js)
// =============================================

// ============================================================================
// ==================== TEMPORARY ISSUE BOOK (TIB) MODULE =====================
// ============================================================================

// switchInventorySubTab moved to js/modules/inventory.js

// Precast Inventory and NAV 254 Register tables moved to js/modules/precast-workshop.js

// =============================================
// TEMPORARY ISSUES / TIB REGISTER (Moved to js/modules/temp-issues.js)
// =============================================
// USER PROFILE & SECURITY MANAGEMENT moved to js/modules/auth-profile.js

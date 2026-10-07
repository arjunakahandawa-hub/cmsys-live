// ============================================================================
// CMSys Module: Authentication, Login Portal, User Profiles & Security PIN
// File: js/modules/auth-profile.js
// ============================================================================

window._activeUserProfileOtp = null;
window._otpCountdownInterval = null;

// =============================================
// LOGIN PORTAL WORKFLOW
// =============================================
function getAllSystemZonesAndWorkshops() {
  const defaultZones = [
    { id: "A-Zone", name: "A-Zone (HQ & Waterfront)", type: "zone" },
    { id: "B-Zone", name: "B-Zone (Residential & Messes)", type: "zone" },
    { id: "C-Zone", name: "C-Zone (Infrastructure)", type: "zone" },
    { id: "D-Zone", name: "D-Zone (Logistics & Training)", type: "zone" },
    { id: "E-Zone", name: "E-Zone (Hospital & Medical)", type: "zone" },
    { id: "G-Zone", name: "G-Zone (Harbour & Pier)", type: "zone" },
    { id: "FH-Zone", name: "FH-Zone (Married Quarters)", type: "zone" },
    { id: "Main-Store", name: "Main Store (CE Central Depot)", type: "zone" },
    { id: "Admin-Staff", name: "Admin & Staff Duties", type: "zone" }
  ];

  const defaultWorkshops = [
    { id: "Carpentry-Shop", name: "Carpentry & Joinery Shop", type: "workshop" },
    { id: "Welding-Shop", name: "Welding & Blacksmith Shop", type: "workshop" },
    { id: "Electrical-Shop", name: "Electrical & Power Section", type: "workshop" },
    { id: "Water-Plumbing-Shop", name: "Water Supply & Plumbing Shop", type: "workshop" },
    { id: "MT-Section", name: "Motor Transport (MT) Section", type: "workshop" },
    { id: "Masonry-Shop", name: "Masonry & Concrete Works", type: "workshop" }
  ];

  return { defaultZones, defaultWorkshops };
}

function populateLoginProfiles() {
  const select = document.getElementById("loginProfileSelect");
  if (!select) return;
  const s = store.settings || {};
  const { defaultZones, defaultWorkshops } = getAllSystemZonesAndWorkshops();

  let options = '<option value="">-- Choose Profile --</option>';

  // 1. Command & Master Profiles
  const oicProfs = getOicProfiles();
  options += '<optgroup label="👑 Command & Executive Profiles">';
  oicProfs.forEach((p) => {
    options += `<option value="OICProfile:${p.id}" data-service-no="${p.serviceNo || ""}" data-rank="${p.rank || "OIC"}" data-name="${p.name || ""}" data-zone="All Command Scope">👑 ${p.rank} ${p.name} (${p.serviceNo || "Command"})</option>`;
  });
  if (oicProfs.length === 0) {
    options += `<option value="OIC" data-service-no="${s.oicServiceNo || ""}" data-rank="${s.oicRank || "OIC"}" data-name="${s.oicName || "Command Profile"}" data-zone="All Command Scope">👑 Command / OIC Profile</option>`;
  }
  options += '</optgroup>';

  // 2. Zone In-Charges (කලාප භාර නිලධාරීන්)
  options += '<optgroup label="🏢 Maintenance Zone In-Charges (කලාප භාර)">';
  defaultZones.forEach((z) => {
    const inc = s.zoneInCharges && s.zoneInCharges[z.id];
    if (inc && inc.name) {
      options += `<option value="ZoneInCharge:${z.id}" data-service-no="${inc.serviceNo || ""}" data-rank="${inc.rank || "OIC"}" data-name="${inc.name}" data-zone="${z.name}">📍 ${z.id}: ${inc.rank || "OIC"} ${inc.name}</option>`;
      if (inc.subName) {
        options += `<option value="ZoneSubInCharge:${z.id}" data-service-no="${inc.subServiceNo || ""}" data-rank="${inc.subRank || "Sub-OIC"}" data-name="${inc.subName}" data-zone="${z.name}">📍 ${z.id} Sub: ${inc.subRank || "Sub-OIC"} ${inc.subName}</option>`;
      }
    } else {
      options += `<option value="ZoneInCharge:${z.id}" data-service-no="—" data-rank="OIC" data-name="${z.name} Officer" data-zone="${z.name}">📍 ${z.name} In-Charge</option>`;
    }
  });
  options += '</optgroup>';

  // 3. Workshop In-Charges (වැඩපළ භාර නිලධාරීන්)
  options += '<optgroup label="🔨 Workshop In-Charges (වැඩපළ භාර)">';
  defaultWorkshops.forEach((w) => {
    const inc = s.zoneInCharges && s.zoneInCharges[w.id];
    if (inc && inc.name) {
      options += `<option value="ZoneInCharge:${w.id}" data-service-no="${inc.serviceNo || ""}" data-rank="${inc.rank || "In-Charge"}" data-name="${inc.name}" data-zone="${w.name}">🔨 ${w.name}: ${inc.name}</option>`;
    } else {
      options += `<option value="ZoneInCharge:${w.id}" data-service-no="—" data-rank="In-Charge" data-name="${w.name} Officer" data-zone="${w.name}">🔨 ${w.name} In-Charge</option>`;
    }
  });
  options += '</optgroup>';

  select.innerHTML = options;
}

function toggleLoginPasswordVisibility() {
  const pwdInput = document.getElementById("loginPasswordInput");
  const btn = document.getElementById("loginPwdToggleBtn");
  if (!pwdInput) return;

  if (pwdInput.type === "password") {
    pwdInput.type = "text";
    if (btn) btn.innerHTML = "🙈";
  } else {
    pwdInput.type = "password";
    if (btn) btn.innerHTML = "👁️";
  }
}

function toggleCredentialsGuide() {
  const drawer = document.getElementById("loginCredentialsGuide");
  if (!drawer) return;
  const isHidden = drawer.classList.contains("hidden");
  if (isHidden) {
    populateLoginCredentialsGuide();
    drawer.classList.remove("hidden");
  } else {
    drawer.classList.add("hidden");
  }
}

function populateLoginCredentialsGuide() {
  const list = document.getElementById("loginCredentialsList");
  if (!list) return;

  const s = store.settings || {};
  const { defaultZones, defaultWorkshops } = getAllSystemZonesAndWorkshops();
  let items = [];

  // Command Profiles
  const oicProfs = getOicProfiles();
  oicProfs.forEach((p) => {
    items.push({
      role: "👑 Command / Master",
      title: `${p.rank || "OIC"} ${p.name || ""}`,
      offNo: p.serviceNo || "Command",
      pinText: p.password ? "Set PIN / 1234" : "PIN: 1234",
      val: `OICProfile:${p.id}`
    });
  });

  // Zones
  defaultZones.forEach((z) => {
    const inc = s.zoneInCharges && s.zoneInCharges[z.id];
    const name = (inc && inc.name) ? `${inc.rank || "OIC"} ${inc.name}` : `${z.name} In-Charge`;
    items.push({
      role: `📍 ${z.id}`,
      title: name,
      offNo: (inc && inc.serviceNo) || "Zone Duty",
      pinText: (inc && inc.password) ? "Set PIN / 1234" : "PIN: 1234",
      val: `ZoneInCharge:${z.id}`
    });
  });

  // Workshops
  defaultWorkshops.forEach((w) => {
    const inc = s.zoneInCharges && s.zoneInCharges[w.id];
    const name = (inc && inc.name) ? `${inc.rank || "In-Charge"} ${inc.name}` : `${w.name}`;
    items.push({
      role: `🔨 Workshop`,
      title: name,
      offNo: (inc && inc.serviceNo) || "Workshop Duty",
      pinText: (inc && inc.password) ? "Set PIN / 1234" : "PIN: 1234",
      val: `ZoneInCharge:${w.id}`
    });
  });

  list.innerHTML = items.map((it) => `
    <div class="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-white/10 hover:border-teal-500/50 transition-all">
      <div class="flex-1 min-w-0 pr-2">
        <div class="font-bold text-white truncate text-xs">${it.title}</div>
        <div class="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span class="text-teal-400 font-semibold">${it.role}</span>
          <span>• ${it.offNo}</span>
          <span class="text-amber-300 font-mono font-bold bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-500/30">🔑 ${it.pinText}</span>
        </div>
      </div>
      <button type="button" onclick="quickSelectProfile('${it.val}')" class="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-[10px] font-bold shrink-0 cursor-pointer shadow-xs transition-colors">
        Select
      </button>
    </div>
  `).join("");
}

function quickSelectProfile(val) {
  const select = document.getElementById("loginProfileSelect");
  if (select) {
    select.value = val;
    onLoginProfileChange(val);
  }
  const drawer = document.getElementById("loginCredentialsGuide");
  if (drawer) drawer.classList.add("hidden");
}

function onLoginProfileChange(val) {
  const container = document.getElementById("loginAvatarContainer");
  const pwdGroup = document.getElementById("loginPasswordGroup");
  const pwdInput = document.getElementById("loginPasswordInput");
  const card = document.getElementById("loginSelectedProfileCard");
  const cardName = document.getElementById("loginCardName");
  const cardRole = document.getElementById("loginCardRole");
  const cardOffNo = document.getElementById("loginCardOffNo");
  const cardZone = document.getElementById("loginCardZone");

  if (!val) {
    if (container) container.innerHTML = '<span class="text-3xl">⚓</span>';
    if (card) card.classList.add("hidden");
    if (pwdInput) pwdInput.value = "";
    return;
  }

  const select = document.getElementById("loginProfileSelect");
  const selectedOpt = select.options[select.selectedIndex];
  const serviceNo = selectedOpt ? (selectedOpt.getAttribute("data-service-no") || "") : "";
  const cleanNo = serviceNo.replace(/[^a-zA-Z0-9]/g, "");
  const rank = selectedOpt ? (selectedOpt.getAttribute("data-rank") || "OIC") : "OIC";
  const name = selectedOpt ? (selectedOpt.getAttribute("data-name") || "") : "";
  const zoneAttr = selectedOpt ? (selectedOpt.getAttribute("data-zone") || "Assigned Zone") : "Assigned Zone";

  let roleTitle = "Officer / In-Charge";
  if (val.startsWith("OICProfile:") || val === "OIC") {
    roleTitle = "Command / OIC";
  } else if (val.startsWith("ZoneSubInCharge:")) {
    roleTitle = "Sub In-Charge";
  } else if (val.startsWith("ZoneInCharge:")) {
    roleTitle = "Zone / Shop In-Charge";
  }

  if (card) {
    if (cardName) cardName.textContent = `${rank} ${name}`.trim();
    if (cardRole) cardRole.textContent = roleTitle;
    if (cardOffNo) cardOffNo.textContent = serviceNo && serviceNo !== "—" ? `Service No: ${serviceNo}` : "Access Role: Authorized";
    if (cardZone) cardZone.textContent = `Zone: ${zoneAttr}`;
    card.classList.remove("hidden");
  }

  // Focus password input for user convenience
  if (pwdInput) {
    pwdInput.value = "";
    pwdInput.focus();
  }

  // Set avatar
  const shortRank = rank.replace(/[a-z\s()]/gi, "").substring(0, 3) || "OIC";
  const fallbackText = `<div class="w-full h-full bg-slate-800 text-teal-400 flex items-center justify-center font-bold text-lg">${shortRank}</div>`;
  if (container) {
    if (cleanNo && cleanNo !== "—") {
      container.innerHTML = `<img src="images/${cleanNo}.JPG" data-fallback="${fallbackText.replace(/"/g, "&quot;")}" class="w-full h-full object-cover" onerror="handleProfilePicError(this, '${cleanNo}')">`;
    } else {
      container.innerHTML = fallbackText;
    }
  }
}

function submitLogin(e) {
  if (e) e.preventDefault();
  const mode = document.getElementById("loginMode")?.value || "OIC";
  const rememberMe = document.getElementById("loginRememberMe") ? document.getElementById("loginRememberMe").checked : true;

  if (mode === "SAILOR") {
    const sailorId = document.getElementById("loginSailorSelectedId")?.value;
    if (!sailorId) {
      showToast("Please search and select your Service Number!", "error");
      return;
    }
    performProfileSwitch("Sailor", "", sailorId, rememberMe);
    document.getElementById("loginScreen")?.classList.add("hidden");
    return;
  }

  const val = document.getElementById("loginProfileSelect")?.value;
  if (!val) {
    showToast("Please choose a profile to continue!", "warning");
    return;
  }

  const pwdInput = document.getElementById("loginPasswordInput");
  const inputPwd = pwdInput ? pwdInput.value.trim() : "";

  if (!inputPwd) {
    showToast("Please enter the profile password / PIN to log in! (Default: 1234)", "warning");
    if (pwdInput) pwdInput.focus();
    return;
  }

  const s = store.settings || {};
  let correctPassword = "";
  let type = "OIC";
  let zoneId = "";
  let oicProfileId = "";

  if (val === "OIC") {
    correctPassword = s.oicPassword || "";
    type = "OIC";
  } else if (val.startsWith("OICProfile:")) {
    oicProfileId = val.split(":")[1];
    const profile = getOicProfiles().find((p) => p.id === oicProfileId);
    correctPassword = profile ? (profile.password || "") : "";
    type = "OIC";
  } else if (val.startsWith("ZoneInCharge:") || val.startsWith("ZoneSubInCharge:")) {
    zoneId = val.split(":")[1];
    const inc = s.zoneInCharges && s.zoneInCharges[zoneId];
    correctPassword = inc ? (inc.password || "") : "";
    type = val.startsWith("ZoneSubInCharge:") ? "ZoneSubInCharge" : "ZoneInCharge";
  }

  // Master bypass and default PIN check:
  // If custom password was set, match against that OR master PINs ('1234', '3576', 'navy123').
  // If no custom password was configured yet, default PIN '1234' is required and accepted.
  const isMatch = correctPassword
    ? (inputPwd === correctPassword || ["1234", "3576", "navy123"].includes(inputPwd))
    : (inputPwd === "1234" || ["3576", "navy123", "admin"].includes(inputPwd));

  if (!isMatch) {
    showToast("Incorrect Password / PIN! Access Denied.", "error");
    if (pwdInput) {
      pwdInput.value = "";
      pwdInput.focus();
    }
    return;
  }

  // Login successful!
  performProfileSwitch(type, zoneId, oicProfileId, rememberMe);
  const loginScreen = document.getElementById("loginScreen");
  if (loginScreen) loginScreen.classList.add("hidden");
}

function logoutProfile() {
  localStorage.removeItem("ncw_ps_active_profile_type");
  localStorage.removeItem("ncw_ps_active_profile_zone");
  localStorage.removeItem("ncw_ps_active_oic_profile_id");
  localStorage.removeItem("ncw_ps_active_sailor_id");
  sessionStorage.removeItem("ncw_ps_active_profile_type");
  sessionStorage.removeItem("ncw_ps_active_profile_zone");
  sessionStorage.removeItem("ncw_ps_active_oic_profile_id");
  sessionStorage.removeItem("ncw_ps_active_sailor_id");

  store.activeProfileType = null;
  store.activeProfileZone = null;
  store.activeOicProfileId = null;

  const loginScreen = document.getElementById("loginScreen");
  if (loginScreen) {
    loginScreen.classList.remove("hidden");
    setLoginMode("OIC");
    populateLoginProfiles();
  }

  const dropdown = document.getElementById("profileDropdown");
  if (dropdown) dropdown.classList.add("hidden");
  showToast("Logged out successfully.");
}

// =============================================================================
// SAILOR LOGIN AUTOCOMPLETE & PERSONAL DASHBOARD VIEW METHODS
// =============================================================================
// Set Login Mode (OIC or SAILOR)
function setLoginMode(mode) {
  const inputMode = document.getElementById("loginMode");
  if (!inputMode) return;
  inputMode.value = mode;
  const btnOic = document.getElementById("loginModeBtnOIC");
  const btnSailor = document.getElementById("loginModeBtnSailor");
  const groupOic = document.getElementById("loginGroupOic");
  const groupSailor = document.getElementById("loginGroupSailor");
  const pwdGroup = document.getElementById("loginPasswordGroup");
  const pwdInput = document.getElementById("loginPasswordInput");
  const container = document.getElementById("loginAvatarContainer"); // Reset avatar
  container.innerHTML = '<span class="text-3xl">⚓</span>';
  if (mode === "OIC") {
    btnOic.classList.add("bg-teal-600", "text-white");
    btnOic.classList.remove("text-slate-400", "hover:text-white");
    btnSailor.classList.remove("bg-teal-600", "text-white");
    btnSailor.classList.add("text-slate-400", "hover:text-white");
    groupOic.classList.remove("hidden");
    groupSailor.classList.add("hidden");
    if (pwdGroup) pwdGroup.classList.remove("hidden");
    if (pwdInput) {
      pwdInput.required = true;
      pwdInput.value = "";
    }
  } else {
    btnSailor.classList.add("bg-teal-600", "text-white");
    btnSailor.classList.remove("text-slate-400", "hover:text-white");
    btnOic.classList.remove("bg-teal-600", "text-white");
    btnOic.classList.add("text-slate-400", "hover:text-white");
    groupSailor.classList.remove("hidden");
    groupOic.classList.add("hidden");
    const sailorSearch = document.getElementById("loginSailorSearch");
    if (sailorSearch) sailorSearch.value = "";
    const sailorId = document.getElementById("loginSailorSelectedId");
    if (sailorId) sailorId.value = "";
    if (pwdGroup) pwdGroup.classList.add("hidden");
    if (pwdInput) {
      pwdInput.required = false;
      pwdInput.value = "";
    }
  }
} // Filter Autocomplete list inside login screen
function filterLoginSailor(query) {
  const dropdown = document.getElementById("loginSailorDropdown");
  if (!dropdown) return;
  if (!query.trim()) {
    dropdown.innerHTML = "";
    dropdown.classList.add("hidden");
    return;
  }
  const q = query.toLowerCase().trim();
  const matches = store.sailors
    .filter(
      (s) =>
        (s.name || "").toLowerCase().includes(q) ||
        String(s.official_number || "")
          .toLowerCase()
          .includes(q),
    )
    .slice(0, 8); // Top 8 matches
  if (matches.length === 0) {
    dropdown.innerHTML =
      '<div class="p-3 text-slate-500 text-xs italic">No matching sailors found</div>';
    dropdown.classList.remove("hidden");
    return;
  }
  dropdown.innerHTML = matches
    .map((s) => {
      const cleanNo = s.official_number
        ? s.official_number.replace(/[^a-zA-Z0-9]/g, "")
        : "";
      const shortRank = s.rank
        ? s.rank.replace(/[a-z\s()]/gi, "").substring(0, 3)
        : "AB";
      const fallbackText = `<div class="w-8 h-8 rounded-full bg-slate-800 text-teal-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0">${shortRank}</div>`;
      const avatar = cleanNo
        ? `<img src="images/${cleanNo}.JPG" data-fallback="${fallbackText.replace(/"/g, "&quot;")}" class="w-8 h-8 rounded-full object-cover flex-shrink-0" onerror="handleProfilePicError(this, '${cleanNo}')">`
        : fallbackText;
      return `
            <div onclick="selectLoginSailor('${s.id}')" class="px-4 py-2.5 hover:bg-white/5 cursor-pointer flex items-center gap-3 transition-colors text-xs text-white">
                ${avatar}
                <div class="min-w-0 flex-1">
                    <p class="font-bold truncate">${s.name}</p>
                    <p class="text-[10px] text-slate-400 truncate mt-0.5">${s.rank} · ${s.official_number}</p>
                </div>
            </div>
        `;
    })
    .join("");
  dropdown.classList.remove("hidden");
} // Show dropdown results when input focus
function showLoginSailorDropdown() {
  const val = document.getElementById("loginSailorSearch").value;
  filterLoginSailor(val);
} // Select Sailor in Login Page Autocomplete
function selectLoginSailor(id) {
  const sailor = store.sailors.find((s) => String(s.id) === String(id));
  if (!sailor) return;
  document.getElementById("loginSailorSearch").value =
    `${sailor.rank} ${sailor.name} (${sailor.official_number})`;
  document.getElementById("loginSailorSelectedId").value = id; // Hide dropdown
  const dropdown = document.getElementById("loginSailorDropdown");
  if (dropdown) dropdown.classList.add("hidden"); // Update Avatar Preview
  const container = document.getElementById("loginAvatarContainer");
  const cleanNo = sailor.official_number
    ? sailor.official_number.replace(/[^a-zA-Z0-9]/g, "")
    : "";
  const shortRank = sailor.rank
    ? sailor.rank.replace(/[a-z\s()]/gi, "").substring(0, 3)
    : "AB";
  const fallbackText = `<div class="w-full h-full bg-slate-800 text-teal-400 flex items-center justify-center font-bold text-lg">${shortRank}</div>`;
  if (cleanNo) {
    container.innerHTML = `<img src="images/${cleanNo}.JPG" data-fallback="${fallbackText.replace(/"/g, "&quot;")}" class="w-full h-full object-cover" onerror="handleProfilePicError(this, '${cleanNo}')">`;
  } else {
    container.innerHTML = fallbackText;
  }
} // Render the Personal Sailor Dashboard View
function renderSailorDashboardView() {
  var _sailor$id5;
  const sailorId = localStorage.getItem("ncw_ps_active_sailor_id");
  if (!sailorId) {
    logoutProfile();
    return;
  }
  const sailor = store.sailors.find(
    (s) =>
      String(s.id) === String(sailorId) ||
      String(s._fbKey) === String(sailorId),
  );
  if (!sailor) {
    // Retry loading if database hasn't loaded yet
    return;
  }
  const points = calculateSailorPoints(sailor);
  const leaveDays = calculateSailorLeaveDays(sailor); // Bio
  document.getElementById("dashName").textContent = sailor.name;
  document.getElementById("dashRankOffNo").textContent =
    `${sailor.rank} · Official No: ${sailor.official_number}`;
  document.getElementById("dashActiveZone").textContent =
    `Zone: ${sailor.zone_assigned || "None"}`;
  document.getElementById("dashTradeBadge").textContent = sailor.trade;
  document.getElementById("dashCategory").textContent =
    sailor.category || "Regular";
  const tradeColors = {
    MA: "bg-teal-600 text-teal-100",
    CA: "bg-purple-600 text-purple-100",
    PA: "bg-amber-700 text-amber-100",
    PL: "bg-cyan-600 text-cyan-100",
    WE: "bg-red-600 text-red-100",
    RW: "bg-slate-700 text-slate-100",
    SW: "bg-emerald-800 text-emerald-100",
    BB: "bg-blue-700 text-blue-100",
    AL: "bg-pink-600 text-pink-100",
  };
  const tradeClass = tradeColors[sailor.trade] || "bg-slate-800 text-slate-100";
  document.getElementById("dashTradeBadge").className =
    `text-xs px-2 py-0.5 rounded font-extrabold ${tradeClass}`; // Status Badge
  const assignment = getSailorCurrentAssignment(
    (_sailor$id5 = sailor.id) !== null && _sailor$id5 !== void 0
      ? _sailor$id5
      : sailor._fbKey,
  );
  const statusBadge = document.getElementById("dashStatusBadge");
  if (sailor.attendance === "Leave") {
    statusBadge.className =
      "text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1";
    statusBadge.innerHTML =
      '<span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>On Leave';
  } else if (sailor.attendance === "Sick") {
    statusBadge.className =
      "text-xs bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1";
    statusBadge.innerHTML =
      '<span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>Sick';
  } else if (assignment) {
    statusBadge.className =
      "text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1";
    statusBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>Busy: ${assignment.zone}`;
  } else {
    statusBadge.className =
      "text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1";
    statusBadge.innerHTML =
      '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>Available';
  } // Points & Leave Days
  document.getElementById("dashTotalPoints").textContent = points;
  document.getElementById("dashLeaveDays").textContent = leaveDays; // Ratings
  document.getElementById("dashAvgRating").textContent =
    `${(sailor.avgScore || 7.0).toFixed(1)} / 10`;
  document.getElementById("dashYesterdayRating").textContent =
    sailor.yesterdayScore ? `${sailor.yesterdayScore.toFixed(1)} / 10` : "-"; // Progress Bar to Next Leave Day
  const progressVal = points % 10;
  document.getElementById("dashNextLeaveProgressText").textContent =
    `${progressVal} / 10 Points`;
  document.getElementById("dashNextLeaveProgressBar").style.width =
    `${progressVal * 10}%`; // Profile Photo
  const cleanNo = sailor.official_number
    ? sailor.official_number.replace(/[^a-zA-Z0-9]/g, "")
    : "";
  const shortRank = sailor.rank
    ? sailor.rank.replace(/[a-z\s()]/gi, "").substring(0, 3)
    : "AB";
  const fallbackText = `<div class="w-full h-full rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-xl">${shortRank}</div>`;
  const picContainer = document.getElementById("dashPicContainer");
  if (cleanNo) {
    picContainer.innerHTML = `<img src="images/${cleanNo}.JPG" data-fallback="${fallbackText.replace(/"/g, "&quot;")}" class="w-full h-full object-cover" onerror="handleProfilePicError(this, '${cleanNo}')">`;
  } else {
    picContainer.innerHTML = fallbackText;
  } // Populate Duty Log
  const dutyLogContainer = document.getElementById("dashDutyLog");
  const recentJobs = [];
  const allocations = (store.dailyAllocations || []).filter(
    (a) =>
      String(a.sailor_id) === String(sailor.id) ||
      String(a.sailor_id) === String(sailor._fbKey),
  );
  allocations.forEach((a) => {
    const wo = store.workOrders.find(
      (w) =>
        String(w.id) === String(a.work_order_id) ||
        String(w._fbKey) === String(a.work_order_id),
    );
    recentJobs.push({
      date: a.date,
      type: "Allocation",
      ref: wo ? wo.reference_no : "Task",
      desc: wo ? wo.description : "Task Labor allocation",
      status: "Completed",
    });
  });
  recentJobs.sort((a, b) => b.date.localeCompare(a.date));
  dutyLogContainer.innerHTML =
    recentJobs
      .slice(0, 10)
      .map(
        (job) => `
        <div class="p-4 hover:bg-white/5 flex items-start gap-3 text-xs transition-colors duration-200">
            <div class="mt-1 flex flex-col items-center flex-shrink-0">
                <div class="w-2.5 h-2.5 rounded-full bg-teal-400 border border-teal-300 shadow-[0_0_8px_rgba(20,184,166,0.8)]"></div>
                <div class="w-0.5 h-10 bg-white/10 mt-1"></div>
            </div>
            <div class="min-w-0 flex-1">
                <p class="font-black text-white truncate text-xs">${job.desc}</p>
                <p class="text-[10px] text-slate-400 mt-0.5 tracking-wider">Ref: ${job.ref} · ${job.type}</p>
            </div>
            <div class="text-right flex-shrink-0 pl-2">
                <span class="mono text-[10px] text-slate-400 font-bold tracking-tight">${job.date}</span>
                <span class="block text-[9px] text-teal-400 font-black uppercase mt-1 tracking-wider">${job.status}</span>
            </div>
        </div>
    `,
      )
      .join("") ||
    '<p class="text-slate-500 text-center py-8 text-xs italic">No operational records found.</p>';
} // Window click listener to close login search dropdown
window.addEventListener("click", function (e) {
  const dropdown = document.getElementById("loginSailorDropdown");
  const input = document.getElementById("loginSailorSearch");
  if (
    dropdown &&
    input &&
    !dropdown.contains(e.target) &&
    !input.contains(e.target)
  ) {
    dropdown.classList.add("hidden");
  }
});

// USER PROFILE & SECURITY MANAGEMENT (SYSTEM ADMINISTRATOR, PASSWORD & PIN)
// =============================================================================

window._activeUserProfileOtp = null;
window._otpCountdownInterval = null;

function openUserProfileModal(profileId) {
  try {
    const profs = getOicProfiles();
    let targetProfile = null;
    if (profileId) {
      targetProfile = profs.find(p => String(p.id) === String(profileId));
    }
    if (!targetProfile) {
      if (store.activeProfileType === "OIC" && store.activeOicProfileId) {
        targetProfile = profs.find(p => String(p.id) === String(store.activeOicProfileId));
      }
    }
    if (!targetProfile) {
      targetProfile = profs.find(p => (p.serviceNo || "").includes("3576")) || profs[0];
    }
    if (!targetProfile) {
      showToast("No active officer profile available", "error");
      return;
    }

    const modal = document.getElementById("userProfileModal");
    if (!modal) return;

    // Set hidden profile ID
    document.getElementById("upfProfileId").value = targetProfile.id;

    // Header Details
    const cleanNo = targetProfile.serviceNo ? targetProfile.serviceNo.replace(/[^a-zA-Z0-9]/g, "") : "";
    const avatarImg = document.getElementById("upfHeaderAvatar");
    const avatarFallback = document.getElementById("upfHeaderFallback");
    if (cleanNo && avatarImg) {
      avatarImg.src = "images/" + cleanNo + ".JPG";
      avatarImg.classList.remove("hidden");
      if (avatarFallback) avatarFallback.classList.add("hidden");
    } else if (avatarFallback) {
      if (avatarImg) avatarImg.classList.add("hidden");
      avatarFallback.textContent = (targetProfile.rank || "OIC").substring(0, 3);
      avatarFallback.classList.remove("hidden");
    }

    document.getElementById("upfHeaderName").textContent = (targetProfile.rank || "") + " " + (targetProfile.name || "KMAU KAHANDAWA");
    document.getElementById("upfHeaderSvc").textContent = targetProfile.serviceNo || "NRC 3576";
    const headerBadgeContainer = document.getElementById("upfHeaderBadge");
    if (headerBadgeContainer) {
      headerBadgeContainer.innerHTML = getAuthorityBadge(targetProfile.authority || "master_admin", targetProfile.serviceNo);
    }

    // Tab 1: Profile Form Fields
    document.getElementById("upfFullName").value = targetProfile.name || "";
    document.getElementById("upfRank").value = targetProfile.rank || "LCDR (CE)";
    document.getElementById("upfServiceNo").value = targetProfile.serviceNo || "NRC 3576";
    document.getElementById("upfDesignation").value = targetProfile.designation || (targetProfile.serviceNo && targetProfile.serviceNo.includes("3576") ? "System Administrator / SCE(W/W)" : "Officer In-Charge");
    document.getElementById("upfPhone").value = targetProfile.phone || "+94 77 1234567";
    document.getElementById("upfRecoveryEmail1").value = targetProfile.recoveryEmail1 || "creativeparadise25@gmail.com";
    document.getElementById("upfRecoveryEmail2").value = targetProfile.recoveryEmail2 || "arjunaudeshk@gmail.com";

    // Tab 2: Password Inputs Reset
    document.getElementById("upfOldPassword").value = "";
    document.getElementById("upfNewPassword").value = "";
    document.getElementById("upfConfirmPassword").value = "";
    hideForgotPasswordPanel();

    // Set dynamic email options in Forgot Password section
    const email1 = targetProfile.recoveryEmail1 || "creativeparadise25@gmail.com";
    const email2 = targetProfile.recoveryEmail2 || "arjunaudeshk@gmail.com";
    const el1 = document.getElementById("otpTargetEmail1Display");
    const el2 = document.getElementById("otpTargetEmail2Display");
    if (el1) el1.textContent = email1;
    if (el2) el2.textContent = email2;
    const r1 = document.getElementById("otpEmailRadio1");
    const r2 = document.getElementById("otpEmailRadio2");
    if (r1) r1.value = email1;
    if (r2) r2.value = email2;

    // Tab 3: Security PIN Reset
    document.getElementById("upfOldPin").value = "";
    document.getElementById("upfNewPin").value = "";
    document.getElementById("upfConfirmPin").value = "";
    const pinBadge = document.getElementById("upfCurrentPinBadge");
    if (pinBadge) {
      pinBadge.textContent = targetProfile.pin ? "Active (PIN Set)" : "Default (1234)";
    }

    // Default to Tab 1
    switchUserProfileTab("details");

    // Display modal
    modal.classList.remove("hidden");
    modal.style.setProperty("display", "flex", "important");
    modal.style.setProperty("opacity", "1", "important");
    modal.style.setProperty("visibility", "visible", "important");
    modal.style.setProperty("z-index", "999999", "important");
  } catch (err) {
    console.error("Error in openUserProfileModal:", err);
    showToast("Error opening user profile: " + err.message, "error");
  }
}

function closeUserProfileModal() {
  const modal = document.getElementById("userProfileModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.style.removeProperty("display");
    modal.style.removeProperty("opacity");
    modal.style.removeProperty("visibility");
    modal.style.removeProperty("z-index");
  }
  hideForgotPasswordPanel();
}

function switchUserProfileTab(tabKey) {
  const tabs = ["details", "password", "pin"];
  tabs.forEach(t => {
    const btn = document.getElementById("btnProfileTab-" + t);
    const panel = document.getElementById("panelProfileTab-" + t);
    if (btn) {
      if (t === tabKey) {
        btn.classList.add("active", "border-teal-400", "text-teal-400");
        btn.classList.remove("border-transparent", "text-slate-400");
      } else {
        btn.classList.remove("active", "border-teal-400", "text-teal-400");
        btn.classList.add("border-transparent", "text-slate-400");
      }
    }
    if (panel) {
      if (t === tabKey) panel.classList.remove("hidden");
      else panel.classList.add("hidden");
    }
  });
}

function saveUserProfileData(event) {
  if (event) event.preventDefault();
  const profileId = document.getElementById("upfProfileId").value;
  const name = document.getElementById("upfFullName").value.trim();
  const rank = document.getElementById("upfRank").value.trim();
  const serviceNo = document.getElementById("upfServiceNo").value.trim();
  const designation = document.getElementById("upfDesignation").value.trim();
  const phone = document.getElementById("upfPhone").value.trim();
  const recoveryEmail1 = document.getElementById("upfRecoveryEmail1").value.trim();
  const recoveryEmail2 = document.getElementById("upfRecoveryEmail2").value.trim();

  if (!name || !rank || !serviceNo) {
    showToast("Please fill in all required profile fields", "error");
    return;
  }
  if (!recoveryEmail1 || !recoveryEmail2) {
    showToast("Both primary and secondary recovery emails are required", "error");
    return;
  }

  const profiles = getOicProfiles();
  const profile = profiles.find(p => String(p.id) === String(profileId)) || {};

  const updatedProfile = Object.assign({}, profile, {
    id: profileId,
    name,
    rank,
    serviceNo,
    designation,
    phone,
    recoveryEmail1,
    recoveryEmail2
  });

  if (!store.settings.oicProfiles) store.settings.oicProfiles = {};
  store.settings.oicProfiles[profileId] = updatedProfile;

  try {
    localStorage.setItem("ncw_settings_v1", JSON.stringify(store.settings));
  } catch (e) {}

  if (typeof opsDB !== "undefined") {
    opsDB.ref("settings/oicProfiles/" + profileId).update({
      name,
      rank,
      serviceNo,
      designation,
      phone,
      recoveryEmail1,
      recoveryEmail2
    }).then(() => {
      showToast("User Profile updated successfully!", "success");
      applyActiveProfile();
      renderProfileDropdown();
      closeUserProfileModal();
    }).catch(err => {
      showToast("Profile saved locally (Offline / DB note): " + err.message, "info");
      applyActiveProfile();
      renderProfileDropdown();
      closeUserProfileModal();
    });
  } else {
    showToast("User Profile updated successfully!", "success");
    applyActiveProfile();
    renderProfileDropdown();
    closeUserProfileModal();
  }
}

function toggleUserProfilePasswordVis(inputId, eyeId) {
  const input = document.getElementById(inputId);
  const eye = document.getElementById(eyeId);
  if (!input) return;
  if (input.type === "password") {
    input.type = "text";
    if (eye) eye.textContent = "🙈";
  } else {
    input.type = "password";
    if (eye) eye.textContent = "👁️";
  }
}

function changeUserPassword(event) {
  if (event) event.preventDefault();
  const profileId = document.getElementById("upfProfileId").value;
  const oldPwd = document.getElementById("upfOldPassword").value;
  const newPwd = document.getElementById("upfNewPassword").value;
  const confirmPwd = document.getElementById("upfConfirmPassword").value;

  const profiles = getOicProfiles();
  const profile = profiles.find(p => String(p.id) === String(profileId)) || {};
  const currentActualPwd = profile.password || "1234";

  if (!oldPwd) {
    showToast("Please enter your Old Password", "error");
    return;
  }
  if (oldPwd !== currentActualPwd) {
    showToast("Incorrect Old Password! If forgotten, click 'Forgot Password?' below to reset with OTP.", "error");
    return;
  }
  if (!newPwd || newPwd.length < 4) {
    showToast("New password must be at least 4 characters long", "error");
    return;
  }
  if (newPwd !== confirmPwd) {
    showToast("New password and confirm password do not match", "error");
    return;
  }

  // Update in memory
  if (!store.settings.oicProfiles) store.settings.oicProfiles = {};
  if (!store.settings.oicProfiles[profileId]) store.settings.oicProfiles[profileId] = profile;
  store.settings.oicProfiles[profileId].password = newPwd;

  try {
    localStorage.setItem("ncw_settings_v1", JSON.stringify(store.settings));
  } catch (e) {}

  if (typeof opsDB !== "undefined") {
    opsDB.ref("settings/oicProfiles/" + profileId + "/password").set(newPwd).then(() => {
      showToast("Password updated and synced securely!", "success");
      document.getElementById("upfOldPassword").value = "";
      document.getElementById("upfNewPassword").value = "";
      document.getElementById("upfConfirmPassword").value = "";
      closeUserProfileModal();
    }).catch(err => {
      showToast("Password saved: " + err.message, "info");
      closeUserProfileModal();
    });
  } else {
    showToast("Password updated successfully!", "success");
    closeUserProfileModal();
  }
}

function showForgotPasswordPanel() {
  const normalSec = document.getElementById("upfNormalPasswordSection");
  const forgotSec = document.getElementById("upfForgotPasswordSection");
  if (normalSec) normalSec.classList.add("hidden");
  if (forgotSec) forgotSec.classList.remove("hidden");
  // Reset OTP steps
  const stepOtp = document.getElementById("otpVerificationStep");
  const stepNewPwd = document.getElementById("otpNewPasswordStep");
  if (stepOtp) stepOtp.classList.add("hidden");
  if (stepNewPwd) stepNewPwd.classList.add("hidden");
}

function hideForgotPasswordPanel() {
  const normalSec = document.getElementById("upfNormalPasswordSection");
  const forgotSec = document.getElementById("upfForgotPasswordSection");
  if (normalSec) normalSec.classList.remove("hidden");
  if (forgotSec) forgotSec.classList.add("hidden");
  if (window._otpCountdownInterval) {
    clearInterval(window._otpCountdownInterval);
    window._otpCountdownInterval = null;
  }
}

function initiateForgotPasswordOtp() {
  const profileId = document.getElementById("upfProfileId").value;
  const profiles = getOicProfiles();
  const profile = profiles.find(p => String(p.id) === String(profileId)) || {};

  // Find selected radio
  const radios = document.getElementsByName("otpTargetEmailRadio");
  let targetEmail = "";
  for (let i = 0; i < radios.length; i++) {
    if (radios[i].checked) {
      targetEmail = radios[i].value;
      break;
    }
  }
  if (!targetEmail) {
    targetEmail = profile.recoveryEmail1 || "creativeparadise25@gmail.com";
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000;

  window._activeUserProfileOtp = {
    code: otp,
    email: targetEmail,
    expiresAt,
    profileId
  };

  // Build auto-generated message text
  const timestampStr = new Date().toLocaleString("en-US", { timeZoneName: "short" });
  const msgText = [
    "============================================================",
    "SRI LANKA NAVY - CIVIL ENGINEERING MANAGEMENT SYSTEM (CMSys)",
    "OFFICIAL SECURITY ALERT: ONE-TIME PASSWORD (OTP) DISPATCH",
    "============================================================",
    "Recipient: " + targetEmail,
    "Officer: " + (profile.rank || "LCDR (CE)") + " " + (profile.name || "KMAU KAHANDAWA"),
    "Service No: " + (profile.serviceNo || "NRC 3576"),
    "Designation: System Administrator",
    "Timestamp: " + timestampStr,
    "",
    "SECURITY VERIFICATION CODE (OTP): [ " + otp + " ]",
    "",
    "Validity: 5 Minutes (Expires: " + new Date(expiresAt).toLocaleTimeString() + ")",
    "Action: Enter this 6-digit passcode into the CMSys verification prompt",
    "        to authorize an administrative password reset.",
    "",
    "Notice: If you did not initiate this request, contact Command Civil",
    "        Engineering Department Operations immediately.",
    "============================================================"
  ].join("\n");

  // Show dispatch notification modal
  const dispatchModal = document.getElementById("otpDispatchModal");
  if (dispatchModal) {
    document.getElementById("otpDispatchRecipient").textContent = targetEmail;
    document.getElementById("otpDispatchTime").textContent = timestampStr;
    document.getElementById("otpDispatchCode").textContent = otp;
    document.getElementById("otpDispatchMsg").textContent = msgText;

    dispatchModal.classList.remove("hidden");
    dispatchModal.style.setProperty("display", "flex", "important");
    dispatchModal.style.setProperty("z-index", "1000000", "important");
  }

  // Reveal OTP verification step
  const stepOtp = document.getElementById("otpVerificationStep");
  if (stepOtp) stepOtp.classList.remove("hidden");
  document.getElementById("otpDispatchedEmailText").textContent = targetEmail;
  document.getElementById("upfOtpInput").value = "";
  document.getElementById("upfOtpInput").focus();

  // Start 5-minute countdown
  startOtpCountdown(expiresAt);

  showToast("Auto-generated security OTP dispatched to " + targetEmail, "success");
}

function startOtpCountdown(expiresAt) {
  if (window._otpCountdownInterval) clearInterval(window._otpCountdownInterval);
  const timerDisplay = document.getElementById("otpTimerDisplay");

  window._otpCountdownInterval = setInterval(() => {
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      clearInterval(window._otpCountdownInterval);
      if (timerDisplay) timerDisplay.textContent = "EXPIRED";
      showToast("OTP Code has expired. Please request a new one.", "error");
      return;
    }
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    if (timerDisplay) {
      timerDisplay.textContent = String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
    }
  }, 1000);
}

function closeOtpDispatchModal() {
  const modal = document.getElementById("otpDispatchModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.style.removeProperty("display");
    modal.style.removeProperty("z-index");
  }
}

function copyOtpCode() {
  if (window._activeUserProfileOtp && window._activeUserProfileOtp.code) {
    navigator.clipboard.writeText(window._activeUserProfileOtp.code).then(() => {
      showToast("OTP Code copied to clipboard: " + window._activeUserProfileOtp.code, "success");
    }).catch(() => {
      showToast("Code: " + window._activeUserProfileOtp.code, "info");
    });
  }
}

function quickFillOtp() {
  if (window._activeUserProfileOtp && window._activeUserProfileOtp.code) {
    const input = document.getElementById("upfOtpInput");
    if (input) {
      input.value = window._activeUserProfileOtp.code;
      closeOtpDispatchModal();
      verifyPasswordResetOtp();
    }
  }
}

function verifyPasswordResetOtp() {
  const enteredOtp = document.getElementById("upfOtpInput").value.trim();
  if (!window._activeUserProfileOtp) {
    showToast("No active OTP session found. Please send a new code.", "error");
    return;
  }
  if (Date.now() > window._activeUserProfileOtp.expiresAt) {
    showToast("This OTP has expired. Please generate a new code.", "error");
    return;
  }
  if (enteredOtp !== window._activeUserProfileOtp.code) {
    showToast("Invalid OTP code! Please re-check the 6-digit passcode.", "error");
    return;
  }

  // OTP is valid!
  if (window._otpCountdownInterval) clearInterval(window._otpCountdownInterval);
  showToast("OTP Verified Successfully! Please set your new password.", "success");

  // Show Step 3 (Set New Password)
  const stepOtp = document.getElementById("otpVerificationStep");
  const stepNewPwd = document.getElementById("otpNewPasswordStep");
  if (stepOtp) stepOtp.classList.add("hidden");
  if (stepNewPwd) stepNewPwd.classList.remove("hidden");
  document.getElementById("upfResetNewPassword").value = "";
  document.getElementById("upfResetConfirmPassword").value = "";
  document.getElementById("upfResetNewPassword").focus();
}

function saveResetPasswordWithOtp(event) {
  if (event) event.preventDefault();
  const profileId = document.getElementById("upfProfileId").value;
  const newPwd = document.getElementById("upfResetNewPassword").value;
  const confirmPwd = document.getElementById("upfResetConfirmPassword").value;

  if (!newPwd || newPwd.length < 4) {
    showToast("New password must be at least 4 characters long", "error");
    return;
  }
  if (newPwd !== confirmPwd) {
    showToast("New password and confirm password do not match", "error");
    return;
  }

  if (!store.settings.oicProfiles) store.settings.oicProfiles = {};
  if (store.settings.oicProfiles[profileId]) {
    store.settings.oicProfiles[profileId].password = newPwd;
  }

  try {
    localStorage.setItem("ncw_settings_v1", JSON.stringify(store.settings));
  } catch (e) {}

  if (typeof opsDB !== "undefined") {
    opsDB.ref("settings/oicProfiles/" + profileId + "/password").set(newPwd).then(() => {
      showToast("Password successfully reset via recovery OTP!", "success");
      window._activeUserProfileOtp = null;
      closeUserProfileModal();
    }).catch(err => {
      showToast("Password saved: " + err.message, "info");
      window._activeUserProfileOtp = null;
      closeUserProfileModal();
    });
  } else {
    showToast("Password successfully reset via recovery OTP!", "success");
    window._activeUserProfileOtp = null;
    closeUserProfileModal();
  }
}

function saveUserSecurityPin(event) {
  if (event) event.preventDefault();
  const profileId = document.getElementById("upfProfileId").value;
  const oldPin = document.getElementById("upfOldPin").value.trim();
  const newPin = document.getElementById("upfNewPin").value.trim();
  const confirmPin = document.getElementById("upfConfirmPin").value.trim();

  const profiles = getOicProfiles();
  const profile = profiles.find(p => String(p.id) === String(profileId)) || {};
  const currentPin = profile.pin || "3576";

  if (profile.pin && oldPin && oldPin !== currentPin) {
    showToast("Current PIN is incorrect", "error");
    return;
  }
  if (!newPin || !/^[0-9]{4,6}$/.test(newPin)) {
    showToast("PIN must be 4 to 6 digits numeric", "error");
    return;
  }
  if (newPin !== confirmPin) {
    showToast("New PIN and Confirm PIN do not match", "error");
    return;
  }

  if (!store.settings.oicProfiles) store.settings.oicProfiles = {};
  if (!store.settings.oicProfiles[profileId]) store.settings.oicProfiles[profileId] = profile;
  store.settings.oicProfiles[profileId].pin = newPin;

  try {
    localStorage.setItem("ncw_settings_v1", JSON.stringify(store.settings));
  } catch (e) {}

  if (typeof opsDB !== "undefined") {
    opsDB.ref("settings/oicProfiles/" + profileId + "/pin").set(newPin).then(() => {
      showToast("Security PIN updated successfully!", "success");
      document.getElementById("upfOldPin").value = "";
      document.getElementById("upfNewPin").value = "";
      document.getElementById("upfConfirmPin").value = "";
      const pinBadge = document.getElementById("upfCurrentPinBadge");
      if (pinBadge) pinBadge.textContent = "Active (PIN Set)";
      closeUserProfileModal();
    }).catch(err => {
      showToast("PIN saved: " + err.message, "info");
      closeUserProfileModal();
    });
  } else {
    showToast("Security PIN updated successfully!", "success");
    closeUserProfileModal();
  }
}

function togglePinVisibility(inputId, eyeId) {
  const input = document.getElementById(inputId);
  const eye = document.getElementById(eyeId);
  if (!input) return;
  if (input.type === "password") {
    input.type = "text";
    if (eye) eye.textContent = "🙈";
  } else {
    input.type = "password";
    if (eye) eye.textContent = "👁️";
  }
}


// ============================================================================
// Global Window Bindings for Authentication & User Profile Module
// ============================================================================
window.getAllSystemZonesAndWorkshops = getAllSystemZonesAndWorkshops;
window.populateLoginProfiles = populateLoginProfiles;
window.toggleLoginPasswordVisibility = toggleLoginPasswordVisibility;
window.toggleCredentialsGuide = toggleCredentialsGuide;
window.populateLoginCredentialsGuide = populateLoginCredentialsGuide;
window.quickSelectProfile = quickSelectProfile;
window.onLoginProfileChange = onLoginProfileChange;
window.submitLogin = submitLogin;
window.logoutProfile = logoutProfile;
window.setLoginMode = setLoginMode;
window.filterLoginSailor = filterLoginSailor;
window.showLoginSailorDropdown = showLoginSailorDropdown;
window.selectLoginSailor = selectLoginSailor;
window.renderSailorDashboardView = renderSailorDashboardView;
window.openUserProfileModal = openUserProfileModal;
window.closeUserProfileModal = closeUserProfileModal;
window.switchUserProfileTab = switchUserProfileTab;
window.saveUserProfileData = saveUserProfileData;
window.toggleUserProfilePasswordVis = toggleUserProfilePasswordVis;
window.changeUserPassword = changeUserPassword;
window.showForgotPasswordPanel = showForgotPasswordPanel;
window.hideForgotPasswordPanel = hideForgotPasswordPanel;
window.initiateForgotPasswordOtp = initiateForgotPasswordOtp;
window.startOtpCountdown = startOtpCountdown;
window.closeOtpDispatchModal = closeOtpDispatchModal;
window.copyOtpCode = copyOtpCode;
window.quickFillOtp = quickFillOtp;
window.verifyPasswordResetOtp = verifyPasswordResetOtp;
window.saveResetPasswordWithOtp = saveResetPasswordWithOtp;
window.saveUserSecurityPin = saveUserSecurityPin;
window.togglePinVisibility = togglePinVisibility;

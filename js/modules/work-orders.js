// ============================================================================
// CMSys Module: Work Orders Engine, Officer Approvals Hub & Daily Evaluations
// File: js/modules/work-orders.js
// ============================================================================
// WORK ORDER MANAGEMENT
// =============================================
// Tracks which sailor IDs are selected in the modal
var _woSelectedSailors = window._woSelectedSailors = (window._woSelectedSailors || new Set());
var _woCurrentTrade = window._woCurrentTrade = "ALL";
var _woLinkedJobMinuteId = window._woLinkedJobMinuteId = null;
function openNewWorkOrderModal() {
  // Reset sailor selection & minute link
  _woSelectedSailors = new Set();
  _woLinkedJobMinuteId = null;
  _woCurrentTrade = "ALL"; 
  populateIncomingMinutesInWorkOrderModal();
  // Populate Approved Ref dropdown
  document.getElementById("woApprovedRef").innerHTML =
    '<option value="">📋 Approved</option>' +
    store.approvedPendingJobs
      .map((j) => `<option value="${j.id}">${j.reference_no}</option>`)
      .join(""); // Populate Approved Estimates dropdown
  const approvedEstimates = store.estimates.filter(
    (e) =>
      e.status === "Approved" &&
      (!e.zone_id || e.zone_id === store.currentZone),
  );
  document.getElementById("woEstimateSelect").innerHTML =
    '<option value="">-- Select Approved Estimate (Optional) --</option>' +
    approvedEstimates
      .map(
        (e) =>
          `<option value="${e.id}">${e.estimate_number} - ${e.description} (${formatCurrency(e.total_cost)})</option>`,
      )
      .join("");
  document.getElementById("woEstimateSelect").value = ""; // Populate Location dropdown
  const uniqueBuildings = [
    ...new Set(
      store.locations
        .filter((l) => l.zone_id === store.currentZone)
        .map((l) => l.building_name),
    ),
  ];
  document.getElementById("woLocationSelect").innerHTML =
    '<option value="">Select Location...</option>' +
    uniqueBuildings
      .map((name) => `<option value="${name}">${name}</option>`)
      .join("");
  document.getElementById("woSubLocation").value = ""; // Populate In-Charge / Supervisor dropdowns (filtered to Settings assignments, with fallback to all EC sailors)
  const ecSailors = store.sailors.filter((s) => {
    const off = String(s.official_number || "")
      .trim()
      .toUpperCase();
    return off.startsWith("EC");
  });
  // ── Populate In-Charge dropdown ──
  const inc = (store.settings.zoneInCharges || {})[store.currentZone];
  let primaryInchargeId = "";
  let inchargeOptions = '<option value="">-- Select In-Charge --</option>';

  const assignedIncharge = inc?.woInchargeId || inc?.sailorId;
  const actingIncharge = inc?.subSailorId;

  // 1. Zone In-Charge & Acting Incharge first
  if (assignedIncharge) {
    const s = store.sailors.find(
      (x) =>
        String(x.id !== undefined && x.id !== null ? x.id : x._fbKey) ===
        String(assignedIncharge),
    );
    if (s) {
      inchargeOptions += `<option value="${s.id !== undefined && s.id !== null ? s.id : s._fbKey}" class="font-bold bg-blue-50 text-blue-900">⭐ ${s.rank} ${s.name} (Zone In-Charge)</option>`;
      primaryInchargeId = String(
        s.id !== undefined && s.id !== null ? s.id : s._fbKey,
      );
    }
  }
  if (actingIncharge && String(actingIncharge) !== String(assignedIncharge)) {
    const s = store.sailors.find(
      (x) =>
        String(x.id !== undefined && x.id !== null ? x.id : x._fbKey) ===
        String(actingIncharge),
    );
    if (s) {
      inchargeOptions += `<option value="${s.id !== undefined && s.id !== null ? s.id : s._fbKey}" class="bg-indigo-50 text-indigo-900">🎖️ ${s.rank} ${s.name} (Acting Incharge)</option>`;
      if (!primaryInchargeId)
        primaryInchargeId = String(
          s.id !== undefined && s.id !== null ? s.id : s._fbKey,
        );
    }
  }

  // 2. Other EC sailors
  inchargeOptions += '<optgroup label="Other Eligible EC Sailors">';
  ecSailors.forEach((s) => {
    const sid = String(s.id !== undefined && s.id !== null ? s.id : s._fbKey);
    if (sid !== String(assignedIncharge) && sid !== String(actingIncharge)) {
      inchargeOptions += `<option value="${s.id}">${s.rank} ${s.name} (${s.official_number || s.service_no || ""})</option>`;
    }
  });
  inchargeOptions += "</optgroup>";
  const inchargeEl = document.getElementById("woIncharge");
  inchargeEl.innerHTML = inchargeOptions;
  if (primaryInchargeId) inchargeEl.value = primaryInchargeId;

  // ── Populate Supervisor dropdown ──
  let primarySupervisorId = "";
  let supervisorOptions = '<option value="">-- Select Supervisor --</option>';
  const zoneSupervisors = Array.isArray(inc?.supervisors)
    ? inc.supervisors
    : inc?.woSupervisorId
      ? [{ id: inc.woSupervisorId }]
      : [];
  const zoneSupervisorIds = new Set(
    zoneSupervisors.map((sv) =>
      String(sv.id || sv._fbKey || sv.sailorId),
    ),
  );

  if (zoneSupervisors.length > 0) {
    supervisorOptions += '<optgroup label="⭐ Zone Assigned Supervisors">';
    zoneSupervisors.forEach((sv) => {
      const sid = String(sv.id || sv._fbKey || sv.sailorId);
      const s = store.sailors.find(
        (x) =>
          String(x.id !== undefined && x.id !== null ? x.id : x._fbKey) ===
          sid,
      );
      if (s) {
        supervisorOptions += `<option value="${s.id !== undefined && s.id !== null ? s.id : s._fbKey}" class="font-bold bg-amber-50 text-amber-900">👷 ${s.rank} ${s.name} (Supervisor)</option>`;
        if (!primarySupervisorId)
          primarySupervisorId = String(
            s.id !== undefined && s.id !== null ? s.id : s._fbKey,
          );
      }
    });
    supervisorOptions += "</optgroup>";
  }

  supervisorOptions += '<optgroup label="Other Eligible EC Sailors">';
  ecSailors.forEach((s) => {
    const sid = String(s.id !== undefined && s.id !== null ? s.id : s._fbKey);
    if (!zoneSupervisorIds.has(sid)) {
      supervisorOptions += `<option value="${s.id}">${s.rank} ${s.name} (${s.official_number || s.service_no || ""})</option>`;
    }
  });
  supervisorOptions += "</optgroup>";
  const supervisorEl = document.getElementById("woSupervisor");
  supervisorEl.innerHTML = supervisorOptions;
  if (primarySupervisorId) supervisorEl.value = primarySupervisorId;

  // ── Populate Project Artificer dropdown ──
  const acSailors = store.sailors.filter((s) => {
    const off = String(s.official_number || "")
      .trim()
      .toUpperCase();
    return off.startsWith("AC");
  });
  let primaryArtificerId = "";
  let artificerOptions = '<option value="">(None / Optional)</option>';
  if (inc && inc.woArtificerId) {
    const s = store.sailors.find(
      (x) =>
        String(x.id !== undefined && x.id !== null ? x.id : x._fbKey) ===
        String(inc.woArtificerId),
    );
    if (s) {
      artificerOptions += `<option value="${s.id !== undefined && s.id !== null ? s.id : s._fbKey}" class="font-bold bg-purple-50 text-purple-900">🔧 ${s.rank} ${s.name} (Assigned Artificer)</option>`;
      primaryArtificerId = String(
        s.id !== undefined && s.id !== null ? s.id : s._fbKey,
      );
    }
  }
  artificerOptions += '<optgroup label="Other AC Sailors">';
  acSailors.forEach((s) => {
    const sid = String(s.id !== undefined && s.id !== null ? s.id : s._fbKey);
    if (sid !== String(inc?.woArtificerId)) {
      artificerOptions += `<option value="${s.id}">${s.rank} ${s.name} (${s.official_number || s.service_no || ""})</option>`;
    }
  });
  artificerOptions += "</optgroup>";
  const artificerEl = document.getElementById("woArtificer");
  artificerEl.innerHTML = artificerOptions;
  if (primaryArtificerId) artificerEl.value = primaryArtificerId; // Render sailor chips
  renderWoSailorChips(); // Clear search
  document.getElementById("woSailorSearch").value = ""; // Reset trade filter UI
  document.querySelectorAll(".wo-trade-btn").forEach((b) => {
    b.className =
      "wo-trade-btn text-xs px-2.5 py-1 rounded-full font-semibold bg-slate-200 text-slate-600";
  });
  document.querySelector(".wo-trade-btn").className =
    "wo-trade-btn text-xs px-2.5 py-1 rounded-full font-semibold bg-slate-700 text-white";
  const isAdminStaff = isAdminStaffDuties(store.currentZone); // Elements to hide
  const typePriorityWrapper = document.getElementById("woTypePriorityWrapper");
  const referenceWrapper = document.getElementById("woReferenceWrapper");
  const estimateWrapper = document.getElementById("woEstimateWrapper");
  const projectWrapper = document.getElementById("woProjectWrapper");
  const costDurationWrapper = document.getElementById("woCostDurationWrapper");
  const supervisorWrapper = document.getElementById("woSupervisorWrapper");
  const artificerWrapper = document.getElementById("woArtificerWrapper");
  const staffWrapper = document.getElementById("woStaffWrapper");
  if (typePriorityWrapper)
    typePriorityWrapper.classList.toggle("hidden", isAdminStaff);
  if (referenceWrapper)
    referenceWrapper.classList.toggle("hidden", isAdminStaff);
  if (estimateWrapper) estimateWrapper.classList.toggle("hidden", isAdminStaff);
  if (projectWrapper) projectWrapper.classList.toggle("hidden", isAdminStaff);
  if (costDurationWrapper)
    costDurationWrapper.classList.toggle("hidden", isAdminStaff);
  if (supervisorWrapper)
    supervisorWrapper.classList.toggle("hidden", isAdminStaff);
  if (artificerWrapper)
    artificerWrapper.classList.toggle("hidden", isAdminStaff);
  if (staffWrapper) {
    if (isAdminStaff) {
      staffWrapper.classList.remove("grid-cols-3");
      staffWrapper.classList.add("grid-cols-1");
    } else {
      staffWrapper.classList.remove("grid-cols-1");
      staffWrapper.classList.add("grid-cols-3");
    }
  }

  // Workshop Job Card delegation setup
  const isWs = isWorkshopZone(store.currentZone);
  const targetJobCardWrapper = document.getElementById("woTargetJobCardWrapper");
  const targetJobCardSelect = document.getElementById("woTargetJobCardZone");
  if (targetJobCardWrapper && targetJobCardSelect) {
    targetJobCardWrapper.classList.toggle("hidden", !isWs || isAdminStaff);
    if (isWs) {
      targetJobCardSelect.innerHTML =
        '<option value="">-- Current Workshop (' + store.currentZone + ') --</option>' +
        (store.zones || [])
          .filter((z) => !isWorkshopZone(z.id) && z.id !== "Admin-&-Staff-Duties")
          .map((z) => `<option value="${z.id}">🎯 Target Zone: ${z.name}</option>`)
          .join("");
      targetJobCardSelect.value = "";
    }
  }

  // Task Job Card toggle reset
  const taskJobCardCb = document.getElementById("woTaskCreateJobCard");
  if (taskJobCardCb) taskJobCardCb.checked = false;

  const currentType = document.getElementById("woType").value || "PROJECT";
  handleWoTypeChange(currentType);

  document.getElementById("workOrderModal").classList.remove("hidden");
}

function isWorkshopZone(zoneId) {
  if (!zoneId) return false;
  const zid = zoneId.toLowerCase();
  return (
    zid.includes("shop") ||
    zid.includes("carpentry") ||
    zid.includes("aluminium") ||
    zid.includes("aluminum") ||
    zid.includes("cement") ||
    zid.includes("signwriter") ||
    zid.includes("welding") ||
    zid.includes("masonry") ||
    zid.includes("plumbing") ||
    zid.includes("pump-house")
  );
}

function handleWoTypeChange(type) {
  const isAdminStaff = isAdminStaffDuties(store.currentZone);
  const projectWrapper = document.getElementById("woProjectWrapper");
  const estimateWrapper = document.getElementById("woEstimateWrapper");
  const taskJobCardWrapper = document.getElementById("woTaskJobCardWrapper");

  if (isAdminStaff) {
    if (projectWrapper) projectWrapper.classList.add("hidden");
    if (estimateWrapper) estimateWrapper.classList.add("hidden");
    if (taskJobCardWrapper) taskJobCardWrapper.classList.add("hidden");
    return;
  }

  if (type === "PROJECT") {
    if (projectWrapper) projectWrapper.classList.remove("hidden");
    if (estimateWrapper) estimateWrapper.classList.add("hidden");
    if (taskJobCardWrapper) taskJobCardWrapper.classList.add("hidden");
    populateApprovedProjectsDropdown();
  } else if (type === "TASK") {
    if (projectWrapper) projectWrapper.classList.add("hidden");
    if (estimateWrapper) estimateWrapper.classList.remove("hidden");
    if (taskJobCardWrapper) taskJobCardWrapper.classList.remove("hidden");
  } else {
    // JOB
    if (projectWrapper) projectWrapper.classList.add("hidden");
    if (estimateWrapper) estimateWrapper.classList.remove("hidden");
    if (taskJobCardWrapper) taskJobCardWrapper.classList.add("hidden");
  }
}

function populateApprovedProjectsDropdown() {
  const select = document.getElementById("woProjectSelect");
  if (!select) return;
  const projects = store.approvedProjects || [];
  let html = '<option value="">-- Select Approved Project --</option>';
  projects.forEach((p) => {
    const costStr = p.approved_cost
      ? ` (Rs. ${Number(p.approved_cost).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })})`
      : "";
    const engStr = p.project_engineer ? ` • Eng: ${p.project_engineer}` : "";
    html += `<option value="${p.id || p._fbKey}">${p.project_name || p.name} [Ref: ${p.reference_no || "—"}]${costStr}${engStr}</option>`;
  });
  select.innerHTML = html;
}

function autofillFromApprovedProject(projId) {
  if (!projId) {
    document.getElementById("woProjectId").value = "";
    return;
  }
  const proj = (store.approvedProjects || []).find(
    (p) => String(p.id) === String(projId) || String(p._fbKey) === String(projId),
  );
  if (!proj) return;

  document.getElementById("woProjectId").value = proj.id || proj._fbKey;

  // 1. Reference Type
  if (proj.reference_type) {
    const refType = document.getElementById("woRefType");
    if (refType) refType.value = proj.reference_type;
  }

  // 2. Reference No
  if (proj.reference_no) {
    const refNo = document.getElementById("woReference");
    if (refNo) refNo.value = proj.reference_no;
  }

  // 3. Approved Cost / Budget
  if (proj.approved_cost) {
    const budget = document.getElementById("woBudget");
    if (budget) budget.value = proj.approved_cost;
  }

  // 4. Duration
  if (proj.duration) {
    const dur = document.getElementById("woDuration");
    const numDur = parseInt(proj.duration, 10);
    if (dur && !isNaN(numDur)) dur.value = numDur;
  }

  // 5. Workscope / Description
  if (proj.workscope) {
    const desc = document.getElementById("woDescription");
    if (desc && !desc.value.trim()) {
      desc.value = proj.workscope;
    }
  }

  // 6. Authority (default to CCED(E) or project engineer)
  const auth = document.getElementById("woAuthority");
  if (auth && !auth.value.trim()) {
    auth.value = "CCED(E)";
  }
}
function autofillFromEstimate(estimateId) {
  if (!estimateId) {
    document.getElementById("woBudget").value = "";
    return;
  }
  const est = store.estimates.find((e) => String(e.id) === String(estimateId));
  if (est) {
    // 1. Reference Type
    const refTypeInput = document.getElementById("woRefType");
    if (refTypeInput) {
      refTypeInput.value = est.ref_type || est.reference_type || "Minute Sheet";
    }

    // 2. Reference No
    const refNoInput = document.getElementById("woReference");
    if (refNoInput) {
      refNoInput.value =
        est.reference_doc ||
        est.reference_no ||
        est.reference ||
        est.estimate_number ||
        "";
    }

    // 3. Project Type
    const typeInput = document.getElementById("woType");
    if (typeInput) {
      typeInput.value = est.project_type || est.type || "PROJECT";
    }

    // 4. Description
    const descInput = document.getElementById("woDescription");
    if (descInput) {
      descInput.value = est.description || "";
    }

    // 5. Authority & Est Cost & Duration
    const authInput = document.getElementById("woAuthority");
    if (authInput) {
      authInput.value =
        est.approvedAuthority ||
        (est.approvedBy && est.approvedBy.name
          ? est.approvedBy.name
          : "CCED(E)");
    }
    const budgetInput = document.getElementById("woBudget");
    if (budgetInput) {
      budgetInput.value = est.total_cost || 0;
    }
    const durationInput = document.getElementById("woDuration");
    if (durationInput) {
      durationInput.value = est.totalManDays
        ? Math.max(1, Math.ceil(est.totalManDays / 4))
        : 1;
    }

    // 6. Location & Location 2 (not sub Location)
    const locSelect = document.getElementById("woLocationSelect");
    const loc2Input = document.getElementById("woSubLocation"); // Location 2

    if (locSelect) {
      let found = false;
      for (let i = 0; i < locSelect.options.length; i++) {
        if (locSelect.options[i].value === est.location) {
          locSelect.selectedIndex = i;
          found = true;
          break;
        }
      }
      if (!found && est.location) {
        const opt = document.createElement("option");
        opt.value = est.location;
        opt.textContent = est.location;
        locSelect.appendChild(opt);
        locSelect.value = est.location;
      }
    }

    if (loc2Input) {
      loc2Input.value = est.location2 || est.sub_location || "";
    }
  }
}
function renderWoSailorChips(filter = "") {
  const tradeBgMap = {
    MA: "#0d9488",
    CA: "#7c3aed",
    PA: "#b45309",
    PL: "#0891b2",
    WE: "#dc2626",
    RW: "#374151",
    SW: "#065f46",
    BB: "#1d4ed8",
    AL: "#ec4899",
  }; // Zone restriction helper — only allow sailors from current zone (or unassigned)
  const isFromAnotherZone = (s) => {
    if (!s.zone_assigned || s.zone_assigned === "") return false; // unassigned → accessible
    return s.zone_assigned !== store.currentZone;
  };
  let sailors;
  if (filter) {
    // When searching by name/number, show all sailors but mark other-zone ones as blocked
    const q = filter.toLowerCase().trim();
    sailors = store.sailors.filter(
      (s) =>
        (s._searchIndex || "").includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.official_number || "").toLowerCase().includes(q) ||
        (s.rank || "").toLowerCase().includes(q) ||
        (s.trade || "").toLowerCase().includes(q),
    );
    if (_woCurrentTrade !== "ALL") {
      sailors = sailors.filter((s) => s.trade === _woCurrentTrade);
    }
  } else {
    // Default (no search): only show sailors of current zone (or unassigned)
    sailors = store.sailors.filter(
      (s) =>
        isSailorAvailableForWork(s, getLocalDateString()) &&
        (_woCurrentTrade === "ALL" || s.trade === _woCurrentTrade) &&
        !isFromAnotherZone(s),
    );
  }
  const container = document.getElementById("woSailorChips");
  if (sailors.length === 0) {
    container.innerHTML = `
            <div class="w-full py-4 text-center">
                <div style="font-size:28px">🔍</div>
                <p class="text-slate-400 text-xs mt-1">No sailors found for <strong>${filter || _woCurrentTrade}</strong></p>
            </div>`;
    return;
  }
  container.innerHTML = sailors
    .map((s) => {
      var _s$id7, _s$id8, _s$id0;
      const isSelected = _woSelectedSailors.has(
        String(
          (_s$id7 = s.id) !== null && _s$id7 !== void 0 ? _s$id7 : s._fbKey,
        ),
      );
      const tradeBg = tradeBgMap[s.trade] || "#475569";
      const offNo =
        s.official_number || s.officialNumber || s.service_no || "—";
      const fullName = s.name || "Unknown";
      const rank = s.rank || "";
      // Block sailors from other zones — show as locked chip
      if (isFromAnotherZone(s)) {
        const lockedAssignment = getSailorDailyAssignment(s, getLocalDateString());
        const lockedZone = lockedAssignment?.zone || s.zone_assigned || "Unknown Zone";
        const lockedRef  = lockedAssignment?.ref   || "";
        const lockedTitle= lockedAssignment?.title
          ? lockedAssignment.title.substring(0, 38) + (lockedAssignment.title.length > 38 ? "…" : "")
          : "";
        const isLockedToday = !!lockedAssignment;
        const tooltipLocked = isLockedToday ? `🔒 ${rank} ${fullName} දැනට ${lockedZone} හි ${lockedRef} රාජකාරිය සඳහා Assign කරලා ඉන්නවා.` : `${rank} ${fullName} belongs to ${lockedZone}, but is free today. Click to borrow.`;
        
        if (isLockedToday) {
            return `
                <button type="button" disabled
                    title="${tooltipLocked}"
                style="
                    display:flex; align-items:center; gap:8px;
                    padding:7px 10px; border-radius:10px; cursor:not-allowed;
                    border:2px solid #e2e8f0;
                    background:#f8fafc;
                    min-width:140px; position:relative;
                    text-align:left; opacity:0.55;
                ">
                <span style="
                    width:32px; height:32px; border-radius:8px;
                    background:#94a3b8;
                    color:white; display:flex; align-items:center; justify-content:center;
                    font-size:9px; font-weight:800; flex-shrink:0;
                ">${s.trade}</span>
                <div style="min-width:0; flex:1">
                    <div style="font-size:11px; font-weight:700; line-height:1.2; color:#64748b;
                        white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:130px;"
                    >${rank} ${fullName}</div>
                    <div style="display:flex; align-items:center; gap:3px; margin-top:2px; flex-wrap:wrap;">
                        <span style="font-size:8px; background:#e2e8f0; color:#475569; border-radius:4px; padding:1px 5px; font-weight:700; white-space:nowrap;">🔒 ${lockedZone}</span>
                        ${lockedRef ? `<span style="font-size:8px; background:#e0f2fe; color:#0369a1; border-radius:4px; padding:1px 5px; font-weight:700; white-space:nowrap;">${lockedRef}</span>` : ""}
                    </div>
                    ${lockedTitle ? `<div style="font-size:8px; color:#94a3b8; margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:130px;">${lockedTitle}</div>` : ""}
                </div>
            </button>`;
        } else {
            // Not locked today, so allow borrowing
            return `
                <button type="button"
                    onclick="toggleWoSailor('${s.id ?? s._fbKey}')"
                    title="${tooltipLocked}"
                    class="sailor-chip-card hover:border-indigo-500 hover:shadow-md transition-all duration-200"
                    style="
                        display:flex; align-items:center; gap:8px;
                        padding:7px 10px; border-radius:10px; cursor:pointer;
                        border:2px dashed #818cf8;
                        background:#eef2ff;
                        min-width:140px; position:relative;
                        text-align:left;
                    ">
                    <span style="
                        width:32px; height:32px; border-radius:8px;
                        background:#6366f1;
                        color:white; display:flex; align-items:center; justify-content:center;
                        font-size:9px; font-weight:800; flex-shrink:0;
                    ">${s.trade}</span>
                    <div style="min-width:0; flex:1">
                        <div style="font-size:11px; font-weight:700; line-height:1.2; color:#4f46e5;
                            white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:130px;"
                        >${rank} ${fullName}</div>
                        <div style="font-size:8px; color:#6366f1; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">🏢 Borrow from ${lockedZone}</div>
                    </div>
                </button>`;
        }
      }
      const assignment = getSailorCurrentAssignment(
        (_s$id8 = s.id) !== null && _s$id8 !== void 0 ? _s$id8 : s._fbKey,
      );
      if (assignment) {
        var _s$id9;
        return `
            <button type="button"
                onclick="toggleWoSailor('${(_s$id9 = s.id) !== null && _s$id9 !== void 0 ? _s$id9 : s._fbKey}')"
                title="Currently assigned to ${assignment.ref} in ${assignment.zone}: ${assignment.title}. Click to automatically reassign here."
                class="sailor-chip-card hover:border-amber-500 hover:shadow-md transition-all duration-200"
                style="
                    display:flex; align-items:center; gap:8px;
                    padding:7px 10px; border-radius:10px; cursor:pointer;
                    border:2px dashed #f59e0b;
                    background:#fffbeb;
                    min-width:140px; position:relative;
                    text-align:left;
                ">
                <!-- Trade badge -->
                <span style="
                    width:32px; height:32px; border-radius:8px;
                    background:#d97706;
                    color:white; display:flex; align-items:center; justify-content:center;
                    font-size:9px; font-weight:800; flex-shrink:0;
                ">${s.trade}</span>

                <!-- Name + Off No + assignment info -->
                <div style="min-width:0; flex:1">
                    <div style="
                        font-size:11px; font-weight:700; line-height:1.2;
                        color:#b45309;
                        white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
                        max-width:130px;
                    ">${rank} ${fullName}</div>
                    <div style="font-size:8px; color:#d97706; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">🔁 Reassign from ${assignment.zone}</div>
                </div>
            </button>`;
      }
      return `
        <button type="button"
            onclick="toggleWoSailor('${(_s$id0 = s.id) !== null && _s$id0 !== void 0 ? _s$id0 : s._fbKey}')"
            title="${rank} ${fullName} | ${offNo}"
            class="sailor-chip-card ${isSelected ? "selected" : ""}"
            style="
                display:flex; align-items:center; gap:8px;
                padding:7px 10px; border-radius:10px; cursor:pointer;
                border:2px solid ${isSelected ? "rgba(13,148,136,0.6)" : "#e2e8f0"};
                background:${isSelected ? "linear-gradient(135deg,rgba(13,148,136,0.12),rgba(8,145,178,0.12))" : "#fff"};
                box-shadow: ${isSelected ? "0 0 0 2px rgba(13,148,136,0.25)" : "0 1px 3px rgba(0,0,0,0.06)"};
                transition:all 0.15s ease; min-width:140px; position:relative;
                text-align:left;
            ">

            <!-- Trade badge -->
            <span style="
                width:32px; height:32px; border-radius:8px;
                background:${isSelected ? "#0d9488" : tradeBg};
                color:white; display:flex; align-items:center; justify-content:center;
                font-size:9px; font-weight:800; flex-shrink:0;
                box-shadow:0 2px 4px ${tradeBg}66;
            ">${s.trade}</span>

            <!-- Name + Off No -->
            <div style="min-width:0; flex:1">
                <div style="
                    font-size:11px; font-weight:700; line-height:1.2;
                    color:${isSelected ? "#0d9488" : "#1e293b"};
                    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
                    max-width:130px;
                ">${rank} ${fullName}</div>
                <div style="font-size:9.5px; color:#94a3b8; font-weight:500; letter-spacing:0.3px">${offNo}</div>
            </div>

            <!-- Checkmark -->
            ${
              isSelected
                ? `
            <span style="
                width:18px; height:18px; border-radius:50%;
                background:#0d9488; color:white;
                display:flex; align-items:center; justify-content:center;
                font-size:11px; font-weight:900; flex-shrink:0;
            ">✓</span>`
                : ""
            }
        </button>`;
    })
    .join(""); // Update counter
  const count = _woSelectedSailors.size;
  document.getElementById("woAssignedCount").textContent = `${count} selected`; // Update summary strip — show rank + name + off no
  const summary = document.getElementById("woSelectedSummary");
  if (count > 0) {
    const details = [..._woSelectedSailors]
      .map((id) => {
        const s = store.sailors.find((s) => {
          var _s$id1;
          return (
            String(
              (_s$id1 = s.id) !== null && _s$id1 !== void 0 ? _s$id1 : s._fbKey,
            ) === String(id)
          );
        });
        if (!s) return id;
        const offNo = s.official_number || s.service_no || "?";
        return `${s.rank || ""} ${s.name} (${offNo})`;
      })
      .join(" • ");
    document.getElementById("woSelectedNames").textContent = details;
    summary.classList.remove("hidden");
  } else {
    summary.classList.add("hidden");
  }
}
function toggleWoSailor(sailorId, name) {
  const key = String(sailorId);
  if (_woSelectedSailors.has(key)) {
    _woSelectedSailors.delete(key);
  } else {
    const assignment = getSailorCurrentAssignment(sailorId);
    if (assignment) {
      var _store$sailors$find; // Automatically remove from previous assignment
      const prevWo = store.workOrders.find((w) => {
        if (w.status !== "Active" && w.status !== "Pending") return false;
        const assignedIds = (w.assigned || []).map(String);
        return assignedIds.includes(key);
      });
      if (prevWo) {
        prevWo.assigned = (prevWo.assigned || []).filter(
          (id) => String(id) !== key,
        );
        const today = getLocalDateString();
        if (window.safeFbRemoveSailor) {
          safeFbRemoveSailor(prevWo._fbKey || prevWo.id, key, today);
        }
        opsDB.ref(`daily_allocations/${today}_${sanitizeFbKey(key)}`).remove();
      }
      showToast(
        `Reassigned ${
          ((_store$sailors$find = store.sailors.find((s) => {
            var _s$id10;
            return (
              String(
                (_s$id10 = s.id) !== null && _s$id10 !== void 0
                  ? _s$id10
                  : s._fbKey,
              ) === key
            );
          })) === null || _store$sailors$find === void 0
            ? void 0
            : _store$sailors$find.name) || "Sailor"
        } from ${assignment.zone}!`,
      );
    }
    _woSelectedSailors.add(key);
  }
  renderWoSailorChips(document.getElementById("woSailorSearch").value);
}
function filterWoSailors() {
  renderWoSailorChips(document.getElementById("woSailorSearch").value);
}
function filterWoTrade(trade) {
  _woCurrentTrade = trade;
  document.querySelectorAll(".wo-trade-btn").forEach((b) => {
    b.className =
      "wo-trade-btn text-xs px-2.5 py-1 rounded-full font-semibold bg-slate-200 text-slate-600";
  });
  event.target.className =
    "wo-trade-btn text-xs px-2.5 py-1 rounded-full font-semibold bg-slate-700 text-white";
  renderWoSailorChips(document.getElementById("woSailorSearch").value);
}
function selectApprovedJob() {
  const selectedId = document.getElementById("woApprovedRef").value;
  if (selectedId) {
    const job = store.approvedPendingJobs.find((j) => j.id == selectedId);
    if (job) {
      document.getElementById("woReference").value = job.reference_no;
      document.getElementById("woDescription").value = job.description;
      document.getElementById("woAuthority").value = job.authority || "";
      document.getElementById("woBudget").value = job.estimated_cost || "";
    }
  }
}
function createWorkOrder(event, proceedImmediately = false) {
  if (event) event.preventDefault();
  
  const form = document.querySelector("#workOrderModal form") || (event && event.target && event.target.tagName === "FORM" ? event.target : null);
  const submitBtn = (event && event.submitter) || (form ? form.querySelector('button[type="submit"]') : null);
  if (submitBtn) {
    if (submitBtn.disabled) return;
    submitBtn.disabled = true;
    submitBtn.dataset.originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = "Processing...";
  }
  
  const estimateId = document.getElementById("woEstimateSelect").value || null;
  const woType = document.getElementById("woType").value;
  const approvedProjectId = document.getElementById("woProjectId") ? document.getElementById("woProjectId").value : null;
  const today = getLocalDateString();
  const shouldProceed = Boolean(proceedImmediately);

  const newOrder = {
    type: woType,
    reference_no: document.getElementById("woReference").value || null,
    description: document.getElementById("woDescription").value,
    status: shouldProceed ? "Active" : "Pending",
    priority: document.getElementById("woPriority").value,
    zone_id: store.currentZone,
    estimated_duration:
      parseInt(document.getElementById("woDuration").value) || 1,
    budget_allocation:
      parseFloat(document.getElementById("woBudget").value) || 0,
    progress: 0,
    assigned: [..._woSelectedSailors], // ← selected sailors from chip picker
    location: document.getElementById("woLocationSelect").value || "",
    sub_location: document.getElementById("woSubLocation").value || "",
    incharge: document.getElementById("woIncharge").value || null,
    supervisor: document.getElementById("woSupervisor").value || null,
    project_artificer: document.getElementById("woArtificer").value || null,
    estimate_id: estimateId,
    approved_project_id: approvedProjectId || null,
    last_commit_date: shouldProceed ? today : null,
    last_committed_date: shouldProceed ? today : null,
    last_assigned: _woSelectedSailors.size > 0 ? [..._woSelectedSailors] : null,
    last_assigned_date: _woSelectedSailors.size > 0 ? today : null,
  }; // Mark selected sailors as Assigned in store (optimistic update)
  _woSelectedSailors.forEach((id) => {
    const s = store.sailors.find((s) => {
      var _s$id11;
      return (
        String(
          (_s$id11 = s.id) !== null && _s$id11 !== void 0 ? _s$id11 : s._fbKey,
        ) === String(id)
      );
    });
    if (s) {
      s.status = "Assigned";
      s.evaluated = false;
    }
  });
  _woSelectedSailors = new Set(); // reset
  // Save Work Order to Firebase DB#2 (realtime listener updates store automatically)
  fbSaveWorkOrder(newOrder)
    .then((ref) => {
      const fbKey = ref ? ref.key : null;

      // If proceedImmediately was requested and sailors exist, commit daily allocations
      if (shouldProceed && newOrder.assigned && newOrder.assigned.length > 0) {
        newOrder.assigned.forEach((sid) => {
          const sailor = store.sailors.find(
            (s) => String(s.id) === String(sid) || String(s._fbKey) === String(sid),
          );
          store.dailyAllocations = (store.dailyAllocations || []).filter(
            (a) => !(a.date === today && a.sailor_id === sid),
          );
          const alloc = {
            id: (store.dailyAllocations || []).length + 1,
            date: today,
            sailor_id: sid,
            work_order_id: fbKey,
            role_today:
              sailor && sailor.id == newOrder.supervisor
                ? "Supervisor"
                : sailor && sailor.id == newOrder.incharge
                  ? "In-Charge"
                  : "Worker",
            assigned_by:
              store.currentUser && store.currentUser.name
                ? store.currentUser.name
                : "Officer",
            status: "Active",
          };
          store.dailyAllocations.push(alloc);
          opsDB.ref(`daily_allocations/${today}_${sanitizeFbKey(sid)}`).set(alloc);
        });
      }

      // Determine if Job Card should be created
      let shouldCreateJobCard = true;
      if (woType === "TASK") {
        const taskJobCardCb = document.getElementById("woTaskCreateJobCard");
        shouldCreateJobCard = taskJobCardCb ? taskJobCardCb.checked : false;
      }

      // Workshop Target Zone delegation
      const targetJobCardSelect = document.getElementById("woTargetJobCardZone");
      const targetJobCardZone = (targetJobCardSelect && targetJobCardSelect.value) ? targetJobCardSelect.value : store.currentZone;

      let jobNumber = null;
      if (shouldCreateJobCard) {
        jobNumber = `JC/${new Date().getFullYear()}/${String(Date.now()).slice(-4).padStart(4, "0")}`;
        const newJobCard = {
          job_number: jobNumber,
          work_order_id: fbKey, // link to the Firebase key
          description: newOrder.description,
          location: newOrder.location,
          zone_id: targetJobCardZone, // Saved under the target zone (or current zone)
          origin_workshop_zone: (targetJobCardZone !== store.currentZone) ? store.currentZone : null,
          status: "Active",
          start_date: getLocalDateString(),
          total_material_cost: 0,
          feedbackSent: false,
          feedbackReceived: false,
          estimate_id: estimateId,
          approved_project_id: approvedProjectId || null,
        };
        fbSaveJobCard(newJobCard).then((jcRef) => {
          const jcKey = jcRef ? jcRef.key : null;
          _lastCreatedWorkOrder = {
            fbKey: fbKey,
            jobCardFbKey: jcKey,
            assignedSailors: newOrder.assigned
          };

          // Link to Job Minute record if referenced
          if (_woLinkedJobMinuteId || (newOrder.reference_no && newOrder.type === "Minute Sheet")) {
            linkJobCardToJobMinute(_woLinkedJobMinuteId || newOrder.reference_no, jobNumber);
          }
        });
      } else {
        _lastCreatedWorkOrder = {
          fbKey: fbKey,
          jobCardFbKey: null,
          assignedSailors: newOrder.assigned
        };
      }

      if (estimateId) {
        const est = store.estimates.find(
          (e) => String(e.id) === String(estimateId),
        );
        if (est && est._fbKey) {
          opsDB
            .ref(`estimates/${est._fbKey}`)
            .update({ status: "Linked", work_order_id: fbKey });
        }
      }
      closeModal("workOrderModal");
      const proceedText = shouldProceed ? " & Proceeded to Active!" : " created!";
      const msg = shouldCreateJobCard
        ? `Work order & Job Card ${jobNumber}${proceedText} (Zone: ${targetJobCardZone})`
        : `Work order${proceedText} (No Job Card)`;
      showToast(
        `${msg} <button onclick="undoCreateWorkOrder()" class="ml-2 font-bold underline bg-amber-300 text-slate-900 px-2 py-0.5 rounded text-xs hover:bg-amber-400">↩️ Undo</button>`,
        "success",
        6000
      );
      if (form) form.reset();
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = submitBtn.dataset.originalText;
      }
    })
    .catch((err) => {
      console.error("❌ Work order save failed:", err);
      showToast("Save failed — check Firebase connection", "error");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = submitBtn.dataset.originalText;
      }
    });
} // =============================================
// NEW SIMPLIFIED ASSIGNMENT WORKFLOW
// =============================================
var _asSelectedSailors = window._asSelectedSailors = (window._asSelectedSailors || new Set());
var _asCurrentTrade = window._asCurrentTrade = "ALL";
function openNewAssignModal() {
  _asSelectedSailors = new Set();
  _asCurrentTrade = "ALL"; // Reset form elements

  const isAdminStaff = isAdminStaffDuties(store.currentZone);
  const typeGroup = document.getElementById("asTypeGroup");
  const inchargeGroup = document.getElementById("asInchargeGroup");
  const descEl = document.getElementById("asDescription");

  if (inchargeGroup) inchargeGroup.style.display = "none";

  if (isAdminStaff) {
    if (typeGroup) typeGroup.style.display = "block";
    document.getElementById("asType").value = "Admin Staff";
    descEl.value = "";
    descEl.placeholder = "Describe the work...";
  } else {
    if (typeGroup) typeGroup.style.display = "none";
    document.getElementById("asType").value = "In Charge";
    descEl.value = "In Charge";
    descEl.placeholder = "In Charge";
  }

  // Populate In-Charge dropdown (Off No starts with 'EC')
  const ecSailors = store.sailors.filter((s) => {
    const off = String(s.official_number || "")
      .trim()
      .toUpperCase();
    return off.startsWith("EC");
  });
  const supOptions =
    '<option value="">Select...</option>' +
    ecSailors
      .map((s) => `<option value="${s.id}">${s.rank} ${s.name}</option>`)
      .join("");
  document.getElementById("asIncharge").innerHTML = supOptions;
  document.getElementById("asIncharge").value = ""; // Render sailor chips
  renderAsSailorChips(); // Clear search
  document.getElementById("asSailorSearch").value = ""; // Reset trade filter UI
  document.querySelectorAll(".as-trade-btn").forEach((b) => {
    b.className =
      "as-trade-btn text-xs px-2.5 py-1 rounded-full font-semibold bg-slate-200 text-slate-600";
  });
  const firstTradeBtn = document.querySelector(".as-trade-btn");
  if (firstTradeBtn) {
    firstTradeBtn.className =
      "as-trade-btn text-xs px-2.5 py-1 rounded-full font-semibold bg-slate-700 text-white";
  }
  updateAsPreview();
  document.getElementById("assignModal").classList.remove("hidden");
}
function renderAsSailorChips(filter = "") {
  const tradeBgMap = {
    MA: "#0d9488",
    CA: "#7c3aed",
    PA: "#b45309",
    PL: "#0891b2",
    WE: "#dc2626",
    RW: "#374151",
    SW: "#065f46",
    BB: "#1d4ed8",
    AL: "#ec4899",
  };
  let sailors = store.sailors.filter(
    (s) =>
      (s.attendance === "Present" || !s.attendance) &&
      (_asCurrentTrade === "ALL" || s.trade === _asCurrentTrade),
  );
  if (filter) {
    const q = filter.toLowerCase().trim();
    sailors = sailors.filter(
      (s) =>
        (s._searchIndex || "").includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.official_number || "").toLowerCase().includes(q) ||
        (s.rank || "").toLowerCase().includes(q) ||
        (s.trade || "").toLowerCase().includes(q),
    );
  }
  const container = document.getElementById("asSailorChips");
  if (sailors.length === 0) {
    container.innerHTML = `
            <div class="w-full py-4 text-center">
                <div style="font-size:28px">🔍</div>
                <p class="text-slate-400 text-xs mt-1">No sailors found for <strong>${filter || _asCurrentTrade}</strong></p>
            </div>`;
    return;
  }
  container.innerHTML = sailors
    .map((s) => {
      var _s$id12, _s$id13, _s$id14;
      const isSelected = _asSelectedSailors.has(
        String(
          (_s$id12 = s.id) !== null && _s$id12 !== void 0 ? _s$id12 : s._fbKey,
        ),
      );
      const tradeBg = tradeBgMap[s.trade] || "#475569";
      const offNo =
        s.official_number || s.officialNumber || s.service_no || "—";
      const fullName = s.name || "Unknown";
      const rank = s.rank || "";
      const assignment = getSailorCurrentAssignment(
        (_s$id13 = s.id) !== null && _s$id13 !== void 0 ? _s$id13 : s._fbKey,
      );
      if (assignment) {
        return `
            <button type="button"
                disabled
                title="Already assigned to ${assignment.ref} in ${assignment.zone}: ${assignment.title}"
                class="sailor-chip-card opacity-50 cursor-not-allowed"
                style="
                    display:flex; align-items:center; gap:8px;
                    padding:7px 10px; border-radius:10px;
                    border:2px solid #e2e8f0;
                    background:#f1f5f9;
                    box-shadow: none;
                    transition:all 0.15s ease; min-width:140px; position:relative;
                    text-align:left;
                ">
                <!-- Trade badge -->
                <span style="
                    width:32px; height:32px; border-radius:8px;
                    background:#94a3b8;
                    color:white; display:flex; align-items:center; justify-content:center;
                    font-size:9px; font-weight:800; flex-shrink:0;
                ">${s.trade}</span>

                <!-- Name + Off No + assignment info -->
                <div style="min-width:0; flex:1">
                    <div style="
                        font-size:11px; font-weight:700; line-height:1.2;
                        color:#64748b;
                        white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
                        max-width:130px;
                    ">${rank} ${fullName}</div>
                    <div style="font-size:8px; color:#b45309; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">⚠️ Busy: ${assignment.zone}</div>
                </div>
            </button>`;
      }
      return `
        <button type="button"
            onclick="toggleAsSailor('${(_s$id14 = s.id) !== null && _s$id14 !== void 0 ? _s$id14 : s._fbKey}')"
            title="${rank} ${fullName} | ${offNo}"
            class="sailor-chip-card ${isSelected ? "selected" : ""}"
            style="
                display:flex; align-items:center; gap:8px;
                padding:7px 10px; border-radius:10px; cursor:pointer;
                border:2px solid ${isSelected ? "rgba(13,148,136,0.6)" : "#e2e8f0"};
                background:${isSelected ? "linear-gradient(135deg,rgba(13,148,136,0.12),rgba(8,145,178,0.12))" : "#fff"};
                box-shadow: ${isSelected ? "0 0 0 2px rgba(13,148,136,0.25)" : "0 1px 3px rgba(0,0,0,0.06)"};
                transition:all 0.15s ease; min-width:140px; position:relative;
                text-align:left;
            ">

            <!-- Trade badge -->
            <span style="
                width:32px; height:32px; border-radius:8px;
                background:${isSelected ? "#0d9488" : tradeBg};
                color:white; display:flex; align-items:center; justify-content:center;
                font-size:9px; font-weight:800; flex-shrink:0;
                box-shadow:0 2px 4px ${tradeBg}66;
            ">${s.trade}</span>

            <!-- Name + Off No -->
            <div style="min-width:0; flex:1">
                <div style="
                    font-size:11px; font-weight:700; line-height:1.2;
                    color:${isSelected ? "#0d9488" : "#1e293b"};
                    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
                    max-width:130px;
                ">${rank} ${fullName}</div>
                <div style="font-size:9.5px; color:#94a3b8; font-weight:500; letter-spacing:0.3px">${offNo}</div>
            </div>

            <!-- Checkmark -->
            ${
              isSelected
                ? `
            <span style="
                width:18px; height:18px; border-radius:50%;
                background:#0d9488; color:white;
                display:flex; align-items:center; justify-content:center;
                font-size:11px; font-weight:900; flex-shrink:0;
            ">✓</span>`
                : ""
            }
        </button>`;
    })
    .join(""); // Update counter
  const count = _asSelectedSailors.size;
  document.getElementById("asAssignedCount").textContent = `${count} selected`; // Update summary strip
  const summary = document.getElementById("asSelectedSummary");
  if (count > 0) {
    const details = [..._asSelectedSailors]
      .map((id) => {
        const s = store.sailors.find((s) => {
          var _s$id15;
          return (
            String(
              (_s$id15 = s.id) !== null && _s$id15 !== void 0
                ? _s$id15
                : s._fbKey,
            ) === String(id)
          );
        });
        if (!s) return id;
        const offNo = s.official_number || s.service_no || "?";
        return `${s.rank || ""} ${s.name} (${offNo})`;
      })
      .join(" • ");
    document.getElementById("asSelectedNames").textContent = details;
    summary.classList.remove("hidden");
  } else {
    summary.classList.add("hidden");
  }
  if (typeof updateAsPreview === "function") {
    updateAsPreview();
  }
}
function updateAsPreview() {
  var _inchargeSelect$optio;
  const type = document.getElementById("asType").value;
  const desc = document.getElementById("asDescription").value;
  const inchargeSelect = document.getElementById("asIncharge");
  const inchargeText =
    ((_inchargeSelect$optio =
      inchargeSelect.options[inchargeSelect.selectedIndex]) === null ||
    _inchargeSelect$optio === void 0
      ? void 0
      : _inchargeSelect$optio.text) || "None";
  const prevTypeElem = document.getElementById("asPrevType");
  if (prevTypeElem) prevTypeElem.textContent = type;
  const prevInchargeElem = document.getElementById("asPrevIncharge");
  if (prevInchargeElem) prevInchargeElem.textContent = inchargeText;
  const prevDescElem = document.getElementById("asPrevDesc");
  if (prevDescElem)
    prevDescElem.textContent = desc || "No description entered yet.";
  const prevSailorsContainer = document.getElementById("asPrevSailors");
  if (prevSailorsContainer) {
    if (_asSelectedSailors && _asSelectedSailors.size > 0) {
      const listHtml = [..._asSelectedSailors]
        .map((id) => {
          const s = store.sailors.find((s) => {
            var _s$id16;
            return (
              String(
                (_s$id16 = s.id) !== null && _s$id16 !== void 0
                  ? _s$id16
                  : s._fbKey,
              ) === String(id)
            );
          });
          if (!s) return "";
          const offNo =
            s.official_number || s.officialNumber || s.service_no || "—";
          return `<span class="inline-block bg-teal-100 text-teal-800 text-[10px] px-2 py-0.5 rounded font-medium">${s.rank || ""} ${s.name} (${offNo})</span>`;
        })
        .join("");
      prevSailorsContainer.innerHTML = listHtml;
    } else {
      prevSailorsContainer.innerHTML =
        '<span class="text-slate-400 text-[10px]">None selected</span>';
    }
  }
}
function toggleAsSailor(sailorId) {
  const key = String(sailorId);
  if (_asSelectedSailors.has(key)) {
    _asSelectedSailors.delete(key);
  } else {
    const assignment = getSailorCurrentAssignment(sailorId);
    if (assignment) {
      var _store$sailors$find2;
      showToast(
        `${
          ((_store$sailors$find2 = store.sailors.find((s) => {
            var _s$id17;
            return (
              String(
                (_s$id17 = s.id) !== null && _s$id17 !== void 0
                  ? _s$id17
                  : s._fbKey,
              ) === key
            );
          })) === null || _store$sailors$find2 === void 0
            ? void 0
            : _store$sailors$find2.name) || "Sailor"
        } is already busy in ${assignment.zone}!`,
        "error",
      );
      return;
    }
    _asSelectedSailors.add(key);
  }
  renderAsSailorChips(document.getElementById("asSailorSearch").value);
}
function filterAsSailors() {
  renderAsSailorChips(document.getElementById("asSailorSearch").value);
}
function filterAsTrade(trade) {
  _asCurrentTrade = trade;
  document.querySelectorAll(".as-trade-btn").forEach((b) => {
    b.className =
      "as-trade-btn text-xs px-2.5 py-1 rounded-full font-semibold bg-slate-200 text-slate-600";
  });
  event.target.className =
    "as-trade-btn text-xs px-2.5 py-1 rounded-full font-semibold bg-slate-700 text-white";
  renderAsSailorChips(document.getElementById("asSailorSearch").value);
}
function createAssignment(event) {
  event.preventDefault();
  const isAdminStaff = isAdminStaffDuties(store.currentZone);
  const assignType = isAdminStaff
    ? document.getElementById("asType").value
    : "In Charge";
  const desc =
    document.getElementById("asDescription").value.trim() || "In Charge";
  const newOrder = {
    type: "TASK", // Always save as TASK so it lists under Tasks board column
    assign_type: assignType, // Store specific assignment category
    reference_no: null,
    description: desc,
    status: "Pending",
    priority: "Medium",
    zone_id: store.currentZone,
    estimated_duration: 1,
    budget_allocation: 0,
    progress: 0,
    assigned: [..._asSelectedSailors],
    location: "",
    incharge: isAdminStaff
      ? document.getElementById("asIncharge").value || null
      : null,
    supervisor: null,
    estimate_id: null,
  }; // Mark selected sailors as Assigned in store (optimistic update)
  _asSelectedSailors.forEach((id) => {
    const s = store.sailors.find((s) => {
      var _s$id18;
      return (
        String(
          (_s$id18 = s.id) !== null && _s$id18 !== void 0 ? _s$id18 : s._fbKey,
        ) === String(id)
      );
    });
    if (s) {
      s.status = "Assigned";
      s.evaluated = false;
    }
  });
  _asSelectedSailors = new Set(); // reset
  // Save Work Order to Firebase DB#2 (No Job Card created for Assign)
  fbSaveWorkOrder(newOrder)
    .then((ref) => {
      closeModal("assignModal");
      showToast(`Assign created successfully! 🔥`);
      event.target.reset();
    })
    .catch((err) => {
      console.error("❌ Assignment save failed:", err);
      showToast("Save failed — check Firebase connection", "error");
    });
} // Nominal labour rate (Rs per man-hour) used for Job Card cost roll-up
var LABOR_RATE_PER_HOUR = window.LABOR_RATE_PER_HOUR = 150;
function getJobCardForWorkOrder(workOrderId) {
  return store.jobCards.find((jc) => jc.work_order_id === workOrderId) || null;
}
function computeJobCardCost(jobCard) {
  if (!jobCard) return { material: 0, labor: 0, total: 0 };
  const material =
    store.jobCardMaterials
      .filter((m) => m.job_card_id === jobCard.id)
      .reduce((s, m) => s + (m.total_cost || 0), 0) ||
    jobCard.total_material_cost ||
    0;
  const laborHours = store.jobCardLabor
    .filter((l) => l.job_card_id === jobCard.id)
    .reduce((s, l) => s + (l.hours || 0), 0);
  const labor = laborHours * LABOR_RATE_PER_HOUR;
  return { material, labor, total: material + labor };
}
function switchWoTab(tab) {
  document.querySelectorAll(".wo-tab-btn").forEach((b) => {
    b.classList.remove("border-blue-600", "text-blue-600");
    b.classList.add("border-transparent", "text-slate-500");
  });
  const btn = document.getElementById(`woTab-${tab}-btn`);
  btn.classList.add("border-blue-600", "text-blue-600");
  btn.classList.remove("border-transparent", "text-slate-500");
  document
    .getElementById("woTab-details")
    .classList.toggle("hidden", tab !== "details");
  document
    .getElementById("woTab-evaluation")
    .classList.toggle("hidden", tab !== "evaluation");
}
function openWorkOrderDetail(workOrderId) {
  var _document$getElementB2;
  if (_justClosedModal) return;
  store.selectedWorkOrder = workOrderId; // Find by _fbKey (string) OR numeric id
  const wo = store.workOrders.find(
    (w) =>
      String(w._fbKey) === String(workOrderId) ||
      String(w.id) === String(workOrderId),
  );
  if (!wo) {
    console.warn("Work order not found:", workOrderId);
    return;
  }
  const today = getLocalDateString();
  const dateVal = store.dashboardDate || today;
  const isToday = dateVal === today;

  // Save initial snapshot for Undo feature
  if (!_isRestoringUndo) {
    _lastEditedWorkOrderState = {
      woKey: wo._fbKey || wo.id,
      woSnapshot: JSON.parse(JSON.stringify(wo)),
      dailyAllocationsSnapshot: JSON.parse(
        JSON.stringify(
          (store.dailyAllocations || []).filter(
            (a) => a.date === today && String(a.work_order_id) === String(wo.id)
          )
        )
      )
    };
  }

  // Reset to details tab each open
  switchWoTab("details"); // Toggle Evaluation tab button
  const evalTabBtn = document.getElementById("woTab-evaluation-btn");
  if (evalTabBtn) {
    evalTabBtn.classList.toggle("hidden", !isToday);
  } // Toggle Assign New Labour block
  const assignLaborBlock =
    (_document$getElementB2 = document.getElementById("detailSailorChips")) ===
      null || _document$getElementB2 === void 0
      ? void 0
      : _document$getElementB2.parentElement;
  if (assignLaborBlock) {
    assignLaborBlock.classList.toggle("hidden", !isToday);
  } // Toggle sticky footer buttons
  // Authorized officers (Pic 2 roles + Master Admin) can edit work orders at any time
  const canEditWo = isToday || isOfficerAuthorizedToEditWorkOrdersAndEstimates();

  const btnSaveWoChanges = document.getElementById("btnSaveWoChanges");
  const btnProceedWo = document.getElementById("btnProceedWo");
  const btnForwardComplete = document.getElementById("btnForwardComplete");
  const btnDeleteWo = document.getElementById("btnDeleteWo");
  const btnUndoWoChanges = document.getElementById("btnUndoWoChanges");
  if (btnSaveWoChanges) {
    btnSaveWoChanges.classList.toggle("hidden", !canEditWo);
    btnSaveWoChanges.className = "flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer";
    btnSaveWoChanges.innerHTML = "<span>💾</span> Save Changes";
  }
  if (btnProceedWo) btnProceedWo.classList.toggle("hidden", !canEditWo);
  if (btnForwardComplete)
    btnForwardComplete.classList.toggle("hidden", !canEditWo);
  if (btnDeleteWo) btnDeleteWo.classList.toggle("hidden", !canEditWo);
  if (btnUndoWoChanges) btnUndoWoChanges.classList.toggle("hidden", !canEditWo); // Disable/enable fields
  const inputs = [
    "woDetailStatus",
    "woDetailPriority",
    "woDetailDescription",
    "woDetailAuthority",
    "woDetailBudget",
    "woDetailDuration",
    "woDetailIncharge",
    "woDetailSupervisor",
    "woDetailArtificer",
  ];
  inputs.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.disabled = !canEditWo;
      el.oninput = markWoChangesUnsaved;
      el.onchange = markWoChangesUnsaved;
    }
  });

  const progressSlider = document.getElementById("woDetailProgress");
  if (progressSlider) {
    progressSlider.disabled = !canEditWo;
    progressSlider.oninput = (e) => updateWoDetailProgress(e.target.value);
    progressSlider.onchange = (e) => updateWoDetailProgress(e.target.value);
  }

  const isAssignmentOrAdminStaff =
    Boolean(wo.assign_type) ||
    isAdminStaffDuties(wo.zone_id || store.currentZone);

  const statusGroup = document.getElementById("woDetailStatusGroup");
  const statusPriorityWrapper = document.getElementById("woDetailStatusPriorityWrapper");
  const metaWrapper = document.getElementById("woDetailMetaWrapper");
  const jcCostWrapper = document.getElementById("woDetailJobCardCostWrapper");
  const progressWrapper = document.getElementById("woDetailProgressWrapper");
  const staffWrapper = document.getElementById("woDetailStaffWrapper");

  if (statusPriorityWrapper) {
    statusPriorityWrapper.classList.toggle("hidden", isAssignmentOrAdminStaff);
  }
  if (metaWrapper) metaWrapper.classList.toggle("hidden", isAssignmentOrAdminStaff);
  if (jcCostWrapper) jcCostWrapper.classList.toggle("hidden", isAssignmentOrAdminStaff);
  if (progressWrapper) progressWrapper.classList.toggle("hidden", isAssignmentOrAdminStaff);
  if (staffWrapper) staffWrapper.classList.toggle("hidden", isAssignmentOrAdminStaff);

  document.getElementById("woDetailId").value = wo.id;
  document.getElementById("woDetailTitle").textContent = wo.description;
  document.getElementById("woDetailRef").textContent =
    (wo.assign_type || wo.type) + " • " + (wo.reference_no || "No reference");
  document.getElementById("woDetailStatus").value = wo.status;
  document.getElementById("woDetailPriority").value = wo.priority || "Medium";
  document.getElementById("woDetailDescription").value = wo.description || "";
  document.getElementById("woDetailAuthority").value =
    wo.authority_approval || wo.authority || "";
  document.getElementById("woDetailBudget").value = wo.budget_allocation || "";
  document.getElementById("woDetailDuration").value =
    wo.estimated_duration || "";
  updateWoDetailProgress(wo.progress || 0);
  const jc = getJobCardForWorkOrder(wo.id);
  const cost = computeJobCardCost(jc);
  const jcNoEl = document.getElementById("woJobCardNo");
  if (jc) {
    jcNoEl.innerHTML = `<span class="font-mono font-bold text-indigo-600">${jc.job_number}</span>`;
  } else {
    if (!isAssignmentOrAdminStaff) {
      jcNoEl.innerHTML = `<span class="text-slate-400 italic">No job card</span> <button type="button" onclick="openJobCardForTask('${wo._fbKey || wo.id}')" class="ml-2 bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded text-[11px] font-bold shadow-sm">➕ Create Job Card</button>`;
    } else {
      jcNoEl.textContent = "Not required";
    }
  }
  document.getElementById("woJobCardCost").textContent = formatCurrency(
    cost.total,
  );
  // Resolve assigned & carried-over labour early so all UI components have full crew data
  if (wo._removedSailorIds && wo.assigned && Array.isArray(wo.assigned)) {
    wo.assigned = wo.assigned.filter((aid) => {
      const str = String(aid).trim();
      if (wo._removedSailorIds.has(str)) return false;
      const digits = str.replace(/\D/g, "");
      if (digits.length >= 3 && Array.from(wo._removedSailorIds).some((rk) => String(rk).replace(/\D/g, "") === digits)) return false;
      return true;
    });
  }
  const { sailors: assignedSailors, source: historicalSource } = getWorkOrderAssignedSailors(wo, dateVal);
  if (isToday && (historicalSource === "daily_record" || historicalSource === "live") && assignedSailors.length > 0 && (!wo.assigned || wo.assigned.length === 0) && !wo._userClearedCrew) {
    const activeIds = assignedSailors.map((s) => String(s.id !== undefined && s.id !== null ? s.id : s._fbKey));
    wo.assigned = activeIds;
    if (!wo.last_assigned || wo.last_assigned.length === 0) {
      wo.last_assigned = [...wo.assigned];
    }
  }
  // Load assignable sailors (exclude already assigned)
  if (isToday && typeof renderDetailSailorChips === "function") {
    renderDetailSailorChips();
  } // Supervisor and Incharge dropdowns (filtered to Settings assignments, with fallback to all EC sailors)
  const ecSailors = store.sailors.filter((s) => {
    const off = String(s.official_number || "")
      .trim()
      .toUpperCase();
    return off.startsWith("EC");
  });
  const inc = (store.settings.zoneInCharges || {})[store.currentZone]; // Incharge dropdown
  let inchargeOptions = '<option value="">Select...</option>';
  const assignedInchargeId = wo.incharge;
  const eligibleInchargeIds = new Set();
  if (inc && inc.woInchargeId)
    eligibleInchargeIds.add(String(inc.woInchargeId));
  if (assignedInchargeId) eligibleInchargeIds.add(String(assignedInchargeId));
  if (eligibleInchargeIds.size > 0) {
    const selectedSailors = store.sailors.filter((s) => {
      var _s$id19;
      return eligibleInchargeIds.has(
        String(
          (_s$id19 = s.id) !== null && _s$id19 !== void 0 ? _s$id19 : s._fbKey,
        ),
      );
    });
    inchargeOptions += selectedSailors
      .map(
        (s) =>
          `<option value="${s.id}" ${wo.incharge == s.id ? "selected" : ""}>${s.rank} ${s.name}</option>`,
      )
      .join("");
  } else {
    inchargeOptions += ecSailors
      .map(
        (s) =>
          `<option value="${s.id}" ${wo.incharge == s.id ? "selected" : ""}>${s.rank} ${s.name}</option>`,
      )
      .join("");
  } // Supervisor dropdown
  let supervisorOptions = '<option value="">Select...</option>';
  const assignedSupervisorId = wo.supervisor;
  const eligibleSupervisorIds = new Set();
  if (inc && inc.woSupervisorId)
    eligibleSupervisorIds.add(String(inc.woSupervisorId));
  if (assignedSupervisorId)
    eligibleSupervisorIds.add(String(assignedSupervisorId));
  if (eligibleSupervisorIds.size > 0) {
    const selectedSailors = store.sailors.filter((s) => {
      var _s$id20;
      return eligibleSupervisorIds.has(
        String(
          (_s$id20 = s.id) !== null && _s$id20 !== void 0 ? _s$id20 : s._fbKey,
        ),
      );
    });
    supervisorOptions += selectedSailors
      .map(
        (s) =>
          `<option value="${s.id}" ${wo.supervisor == s.id ? "selected" : ""}>${s.rank} ${s.name}</option>`,
      )
      .join("");
  } else {
    supervisorOptions += ecSailors
      .map(
        (s) =>
          `<option value="${s.id}" ${wo.supervisor == s.id ? "selected" : ""}>${s.rank} ${s.name}</option>`,
      )
      .join("");
  }
  document.getElementById("woDetailIncharge").innerHTML = inchargeOptions;
  document.getElementById("woDetailSupervisor").innerHTML = supervisorOptions; // Artificer dropdown
  let artificerOptions = '<option value="">Select...</option>';
  const assignedArtificerId = wo.project_artificer;
  const eligibleArtificerIds = new Set();
  if (inc && inc.woArtificerId)
    eligibleArtificerIds.add(String(inc.woArtificerId));
  if (assignedArtificerId)
    eligibleArtificerIds.add(String(assignedArtificerId));
  const acSailors = store.sailors.filter((s) => {
    const off = String(s.official_number || "")
      .trim()
      .toUpperCase();
    return off.startsWith("AC");
  });
  if (eligibleArtificerIds.size > 0) {
    const selectedSailors = store.sailors.filter((s) => {
      var _s$id21;
      return eligibleArtificerIds.has(
        String(
          (_s$id21 = s.id) !== null && _s$id21 !== void 0 ? _s$id21 : s._fbKey,
        ),
      );
    });
    artificerOptions += selectedSailors
      .map(
        (s) =>
          `<option value="${s.id}" ${wo.project_artificer == s.id ? "selected" : ""}>${s.rank} ${s.name}</option>`,
      )
      .join("");
  } else {
    artificerOptions += acSailors
      .map(
        (s) =>
          `<option value="${s.id}" ${wo.project_artificer == s.id ? "selected" : ""}>${s.rank} ${s.name}</option>`,
      )
      .join("");
  }
  document.getElementById("woDetailArtificer").innerHTML = artificerOptions;
  if (btnProceedWo && isToday) {
    const totalAssignedCount = (wo.assigned && wo.assigned.length > 0) ? wo.assigned.length : assignedSailors.length;
    if (totalAssignedCount > 0) {
      btnProceedWo.innerHTML = `🚀 Proceed - Commit Daily Labour (${totalAssignedCount})`;
    } else {
      btnProceedWo.innerHTML = `🚀 Proceed - Mark Active`;
    }
    btnProceedWo.dataset.originalText = btnProceedWo.innerHTML;
  }
  const tradeCounts = {};
  assignedSailors.forEach((s) => {
    tradeCounts[s.trade] = (tradeCounts[s.trade] || 0) + 1;
  });
  const countStr = Object.entries(tradeCounts)
    .map(([trade, count]) => `${count} ${trade}`)
    .join(", ");
  document.getElementById("assignedLaborCount").textContent =
    countStr || "0 assigned";
  // Historical view info banner
  const histBannerHtml = (!isToday && assignedSailors.length > 0) ? `
    <div class="flex items-center gap-2 p-2 mb-2 rounded-lg text-xs font-medium" style="background:rgba(14,165,233,0.08);border:1px solid rgba(14,165,233,0.25);color:#0284c7">
        <span>📋</span>
        <span>${dateVal} දිනට ${historicalSource === "daily_record" ? "Daily Record වලින්" : historicalSource === "last_assigned" ? "Last Assigned Crew වලින්" : "Current Crew වලින්"} ලබාගත් විස්තර (Read-Only)</span>
    </div>` : "";
  document.getElementById("woDetailAssigned").innerHTML =
    histBannerHtml +
    (assignedSailors
      .map((s) => {
        var _s$id22;
        return `
        <div class="flex items-center justify-between p-2 bg-white rounded-lg border">
            <div class="flex items-center gap-3">
                <span class="w-8 h-8 bg-slate-600 text-white rounded-full flex items-center justify-center text-xs font-bold">${s.trade}</span>
                <div>
                    <p class="font-medium text-sm hover:underline cursor-pointer text-teal-600" onclick="openSailorProfile('${(_s$id22 = s.id) !== null && _s$id22 !== void 0 ? _s$id22 : s._fbKey}')">${s.rank || "AB"} ${s.name}</p>
                    <div class="flex gap-2 text-xs text-slate-500 mt-0.5">
                        <span>Official No: ${s.official_number || s.service_no || "-"}</span>
                        <span>•</span>
                        <span>Trade: ${s.trade}</span>
                        <span>•</span>
                        <span>Avg: <span class="${getPerformanceTextColor(s.avgScore)}">${s.avgScore.toFixed(1)}</span></span>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-2">
                ${s.evaluated ? '<span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">✓ Evaluated</span>' : '<span class="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">Pending</span>'}
                ${isToday ? `<button type="button" onclick="event.stopPropagation(); removeSailorFromOrder('${s.id || s._fbKey || s.official_number}', '${wo._fbKey || wo.id}');" class="text-red-500 hover:text-red-700 text-lg font-bold p-1 cursor-pointer transition-colors" title="Remove Sailor">×</button>` : ""}
            </div>
        </div>
    `;
      })
      .join("") ||
    (!isToday ? '<p class="text-slate-400 text-center py-4">📋 මෙම දිනට පවරා ඇති නාවිකයින්ගේ වාර්තා සොයාගත නොහැක</p>' : '<p class="text-slate-500 text-center py-4">No labour assigned</p>')); // Evaluation tab list (always available on today - req 1)
  const pendingEvals = assignedSailors.filter((s) => !s.evaluated).length;
  const evalBadge = document.getElementById("woEvalPendingBadge");
  if (isToday && pendingEvals > 0) {
    evalBadge.textContent = pendingEvals + " pending";
    evalBadge.classList.remove("hidden");
  } else {
    evalBadge.classList.add("hidden");
  }
  document.getElementById("laborEvalList").innerHTML = assignedSailors.length
    ? assignedSailors
        .map((s) => {
          var _s$id23, _s$yesterdayScore2, _s$id24, _wo$id2, _s$id25, _wo$id3;
          return `
        <div class="flex items-center justify-between p-3 bg-white rounded-lg border ${s.evaluated ? "border-green-300" : "border-amber-300"}">
            <div class="flex items-center gap-3">
                <span class="w-10 h-10 bg-slate-600 text-white rounded-full flex items-center justify-center font-bold">${s.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}</span>
                <div>
                    <p class="font-medium hover:underline cursor-pointer text-teal-600" onclick="openSailorProfile('${(_s$id23 = s.id) !== null && _s$id23 !== void 0 ? _s$id23 : s._fbKey}')">${s.name}</p>
                    <p class="text-xs text-slate-500">${s.trade} • ${s.rank} • Avg ${s.avgScore.toFixed(1)}</p>
                </div>
            </div>
            ${
              s.evaluated
                ? `<div class="flex items-center gap-2">
                    <span class="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm">✓ ${((_s$yesterdayScore2 = s.yesterdayScore) === null || _s$yesterdayScore2 === void 0 ? void 0 : _s$yesterdayScore2.toFixed(1)) || ""}</span>
                    <button onclick="openEvaluationModal('${(_s$id24 = s.id) !== null && _s$id24 !== void 0 ? _s$id24 : s._fbKey}', '${(_wo$id2 = wo.id) !== null && _wo$id2 !== void 0 ? _wo$id2 : wo._fbKey}')" class="text-xs text-blue-600 underline">Re-evaluate</button>
                </div>`
                : `<button onclick="openEvaluationModal('${(_s$id25 = s.id) !== null && _s$id25 !== void 0 ? _s$id25 : s._fbKey}', '${(_wo$id3 = wo.id) !== null && _wo$id3 !== void 0 ? _wo$id3 : wo._fbKey}')" class="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm">📝 Evaluate</button>`
            }
        </div>
    `;
        })
        .join("")
    : '<p class="text-slate-500 text-center py-6">No labour assigned to evaluate.</p>'; // Toggle Restore Last Crew button visibility
  const btnRestorePrevCrew = document.getElementById("btnRestorePrevCrew");
  if (btnRestorePrevCrew) {
    const hasLastCrew = wo.last_assigned && wo.last_assigned.length > 0;
    const currentCrewEmpty = !wo.assigned || wo.assigned.length === 0;
    btnRestorePrevCrew.classList.toggle(
      "hidden",
      !(hasLastCrew && currentCrewEmpty && isToday),
    );
  }

  // Update Type Migration Bar in Details Modal
  const typeBadgeEl = document.getElementById("woDetailCurrentTypeBadge");
  const quickConvertBtn = document.getElementById("btnQuickConvertToAssign");
  const targetTypeSelect = document.getElementById("woDetailTargetTypeSelect");
  const assignTypeSelect = document.getElementById("woDetailAssignTypeSelect");
  const migControls = document.getElementById("woDetailMigrationControls");
  const assignTypeCol = document.getElementById("woDetailAssignTypeCol");
  const jobCardOptRow = document.getElementById("woDetailJobCardOptionRow");

  if (migControls) migControls.classList.add("hidden");

  if (typeBadgeEl) {
    if (wo.assign_type) {
      typeBadgeEl.textContent = `💼 ASSIGN: ${wo.assign_type}`;
      typeBadgeEl.className = "text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200";
    } else if (wo.type === "PROJECT") {
      typeBadgeEl.textContent = "📋 PROJECT";
      typeBadgeEl.className = "text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200";
    } else if (wo.type === "JOB") {
      typeBadgeEl.textContent = "🔧 JOB";
      typeBadgeEl.className = "text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200";
    } else {
      typeBadgeEl.textContent = "⚡ TASK";
      typeBadgeEl.className = "text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200";
    }
  }

  if (quickConvertBtn) {
    if (wo.assign_type) {
      quickConvertBtn.innerHTML = "<span>⚡</span> Convert to Project";
      quickConvertBtn.onclick = () => quickMigrateCurrentWoToProject();
      quickConvertBtn.className = "text-xs font-bold px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 transition-all";
    } else {
      quickConvertBtn.innerHTML = "<span>⚡</span> Quick Migrate to Assign";
      quickConvertBtn.onclick = () => quickMigrateCurrentWoToAssign();
      quickConvertBtn.className = "text-xs font-bold px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 transition-all";
    }
  }

  if (targetTypeSelect) {
    targetTypeSelect.value = wo.assign_type ? "PROJECT" : "ASSIGNMENT";
  }
  if (assignTypeSelect) {
    assignTypeSelect.value = wo.assign_type || "In Charge";
  }
  if (assignTypeCol) {
    assignTypeCol.classList.toggle("hidden", targetTypeSelect && targetTypeSelect.value !== "ASSIGNMENT");
  }
  if (jobCardOptRow) {
    jobCardOptRow.classList.toggle("hidden", targetTypeSelect && targetTypeSelect.value !== "ASSIGNMENT");
  }

  // Update Officer Review & Forwarding Banner in Details Modal
  const isOfficer = isOfficerLoggedIn();
  const statusBadge = document.getElementById("woDetailOfficerStatusBadge");
  const forwardBtn = document.getElementById("btnWoForwardToOfficer");
  const approveBtn = document.getElementById("btnWoOfficerApproveDirect");
  const approveFooterBtn = document.getElementById("btnOfficerApproveWoFooter");
  const forwardPanel = document.getElementById("woDetailForwardPanel");
  const auditLog = document.getElementById("woDetailOfficerAuditLog");
  const auditText = document.getElementById("woDetailOfficerAuditText");
  const rejectBtn = document.getElementById("btnWoOfficerReject");

  if (forwardPanel) forwardPanel.classList.add("hidden");

  // Populate Forward Officer Dropdown
  const forwardOfficerSelect = document.getElementById("woDetailForwardOfficerSelect");
  if (forwardOfficerSelect) {
    const zid = wo.zone_id || store.currentZone;
    const inc = (store.settings?.zoneInCharges || {})[zid] || {};
    const zoneOfficers = Array.isArray(inc.officers) ? inc.officers : [];
    const allOic = getOicProfiles();

    let html = '<option value="">-- Choose Officer --</option>';
    if (zoneOfficers.length > 0) {
      html += '<optgroup label="Appointed Zone Officers">';
      zoneOfficers.forEach((zo) => {
        html += `<option value="${zo.id}">🎖️ ${zo.rank} ${zo.name} (${zo.role})</option>`;
      });
      html += '</optgroup>';
    }
    html += '<optgroup label="Command / All Officers">';
    allOic.forEach((p) => {
      html += `<option value="${p.id}">⭐ ${p.rank} ${p.name} (${p.serviceNo})</option>`;
    });
    html += '</optgroup>';
    forwardOfficerSelect.innerHTML = html;
  }

  const revStatus = wo.officer_review_status || "Draft";
  if (statusBadge) {
    if (revStatus === "Pending Review") {
      statusBadge.textContent = `⏳ Pending Officer Clearance (${wo.forwarded_to_officer_name || "Officer"})`;
      statusBadge.className =
        "text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 animate-pulse";
    } else if (revStatus === "Approved") {
      statusBadge.textContent = `✅ Officer Cleared (${wo.officer_approved_by || "Officer"})`;
      statusBadge.className =
        "text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300";
    } else if (revStatus === "Changes Requested") {
      statusBadge.textContent = `↩️ Revision Requested (${wo.officer_remarks || ""})`;
      statusBadge.className =
        "text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300";
    } else {
      statusBadge.textContent = "In-Charge Draft / Internal";
      statusBadge.className =
        "text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300";
    }
  }

  if (forwardBtn) {
    forwardBtn.classList.toggle("hidden", isOfficer && revStatus === "Approved");
  }
  if (approveBtn) {
    approveBtn.classList.toggle("hidden", !isOfficer);
  }
  if (approveFooterBtn) {
    approveFooterBtn.classList.toggle("hidden", !isOfficer);
  }

  if (auditLog && auditText) {
    if (wo.incharge_forward_remarks || wo.officer_remarks || wo.officer_approved_by) {
      auditLog.classList.remove("hidden");
      let msg = "";
      if (wo.officer_approved_by) {
        msg = `✓ Approved by ${wo.officer_approved_by}`;
      } else if (wo.incharge_forward_remarks) {
        msg = `Forward note: "${wo.incharge_forward_remarks}"`;
      } else if (wo.officer_remarks) {
        msg = `Officer remarks: "${wo.officer_remarks}"`;
      }
      auditText.textContent = msg;
    } else {
      auditLog.classList.add("hidden");
    }
  }
  if (rejectBtn) {
    rejectBtn.classList.toggle("hidden", !isOfficer || revStatus !== "Pending Review");
  }

  document.getElementById("workOrderDetailModal").classList.remove("hidden");
}

// ─────────────────────────────────────────────
// WORK ORDER TYPE MIGRATION METHODS
// ─────────────────────────────────────────────
function toggleWoTypeMigrationControls() {
  const controls = document.getElementById("woDetailMigrationControls");
  if (controls) controls.classList.toggle("hidden");
}

function handleWoDetailTargetTypeChange(val) {
  const assignCol = document.getElementById("woDetailAssignTypeCol");
  const jcRow = document.getElementById("woDetailJobCardOptionRow");
  if (assignCol) assignCol.classList.toggle("hidden", val !== "ASSIGNMENT");
  if (jcRow) jcRow.classList.toggle("hidden", val !== "ASSIGNMENT");
}

function quickMigrateCurrentWoToAssign() {
  const woKey = store.selectedWorkOrder;
  if (!woKey) return;
  migrateWorkOrderType(woKey, "ASSIGNMENT", "In Charge", true);
}

function quickMigrateCurrentWoToProject() {
  const woKey = store.selectedWorkOrder;
  if (!woKey) return;
  migrateWorkOrderType(woKey, "PROJECT", null, false);
}

function applyWorkOrderTypeMigration() {
  const woKey = store.selectedWorkOrder;
  if (!woKey) return;
  const targetType = document.getElementById("woDetailTargetTypeSelect").value;
  const assignType = document.getElementById("woDetailAssignTypeSelect").value;
  const unlinkJobCard = document.getElementById("woDetailUnlinkJobCardCb") ? document.getElementById("woDetailUnlinkJobCardCb").checked : true;
  migrateWorkOrderType(woKey, targetType, assignType, unlinkJobCard);
}

function migrateWorkOrderType(workOrderId, targetType, targetAssignType = "In Charge", removeEmptyJobCard = true) {
  const wo = store.workOrders.find(
    (w) => String(w._fbKey) === String(workOrderId) || String(w.id) === String(workOrderId)
  );
  if (!wo) {
    showToast("Work Order not found", "error");
    return;
  }

  const prevType = wo.assign_type ? `ASSIGNMENT (${wo.assign_type})` : wo.type;
  const targetFbKey = wo._fbKey || wo.id;

  let newType = "PROJECT";
  let newAssignType = null;

  if (targetType === "ASSIGNMENT") {
    newType = "TASK";
    newAssignType = targetAssignType || "In Charge";
  } else if (targetType === "JOB") {
    newType = "JOB";
    newAssignType = null;
  } else if (targetType === "TASK") {
    newType = "TASK";
    newAssignType = null;
  } else {
    newType = "PROJECT";
    newAssignType = null;
  }

  // Update in-memory object
  wo.type = newType;
  wo.assign_type = newAssignType;

  // Prepare Firebase DB#2 payload
  const updatePayload = {
    type: newType,
    assign_type: newAssignType,
    updated_at: Date.now()
  };

  // If converting to Assignment and removeEmptyJobCard is true
  if (targetType === "ASSIGNMENT" && removeEmptyJobCard) {
    const jc = getJobCardForWorkOrder(wo._fbKey || wo.id);
    if (jc) {
      const cost = computeJobCardCost(jc);
      if (cost.total === 0) {
        if (jc._fbKey) {
          opsDB.ref(`job_cards/${jc._fbKey}`).remove().catch(console.warn);
        }
        store.jobCards = store.jobCards.filter(
          (j) => String(j.id) !== String(jc.id) && String(j._fbKey) !== String(jc._fbKey)
        );
      }
    }
  }

  // Write to Firebase DB#2
  if (targetFbKey) {
    opsDB.ref(`work_orders/${targetFbKey}`).update(updatePayload)
      .then(() => {
        showToast(`✅ Successfully migrated from <b>${prevType}</b> to <b>${newAssignType ? 'ASSIGN (' + newAssignType + ')' : newType}</b>!`, "success", 5000);
      })
      .catch((err) => {
        console.error("Migration write error:", err);
        showToast("Error syncing migration to database", "error");
      });
  }

  // Re-render views immediately
  refreshCurrentViewImmediately();
  
  // Re-open/update current modal
  openWorkOrderDetail(targetFbKey);
}

// ─────────────────────────────────────────────
// BATCH TOTAL MIGRATION SUITE
// ─────────────────────────────────────────────
var _migSelectedWoKeys = window._migSelectedWoKeys = (window._migSelectedWoKeys || new Set());

function openWorkOrderMigrationModal() {
  // Populate Zone Selector
  const zoneSelect = document.getElementById("migFilterZone");
  if (zoneSelect) {
    let zonesHtml = '<option value="ALL">🌐 All Zones</option>';
    const allZones = ["A Zone", "B Zone", "C Zone", "D Zone", "Workshop", "Admin Staff"];
    allZones.forEach((z) => {
      zonesHtml += `<option value="${z}" ${store.currentZone === z ? "selected" : ""}>${z}</option>`;
    });
    zoneSelect.innerHTML = zonesHtml;
  }

  // Default filters: Filter to PROJECT by default for convenience
  const typeFilter = document.getElementById("migFilterType");
  if (typeFilter) typeFilter.value = "PROJECT";

  const searchInput = document.getElementById("migSearchInput");
  if (searchInput) searchInput.value = "";

  _migSelectedWoKeys = new Set();
  renderMigrationWorkOrdersList();

  const modal = document.getElementById("workOrderMigrationModal");
  if (modal) modal.classList.remove("hidden");
}

function renderMigrationWorkOrdersList() {
  const container = document.getElementById("migrationWorkOrdersContainer");
  if (!container) return;

  const zoneFilter = (document.getElementById("migFilterZone") || {}).value || "ALL";
  const typeFilter = (document.getElementById("migFilterType") || {}).value || "ALL";
  const statusFilter = (document.getElementById("migFilterStatus") || {}).value || "ALL";
  const query = ((document.getElementById("migSearchInput") || {}).value || "").trim().toLowerCase();

  const filtered = store.workOrders.filter((wo) => {
    // Zone filter
    if (zoneFilter !== "ALL" && wo.zone_id !== zoneFilter) return false;

    // Type filter
    if (typeFilter === "ASSIGN") {
      if (!wo.assign_type) return false;
    } else if (typeFilter !== "ALL") {
      if (wo.assign_type || wo.type !== typeFilter) return false;
    }

    // Status filter
    if (statusFilter !== "ALL" && wo.status !== statusFilter) return false;

    // Search query (English & Sinhala)
    if (query) {
      const desc = (wo.description || "").toLowerCase();
      const ref = (wo.reference_no || "").toLowerCase();
      const zone = (wo.zone_id || "").toLowerCase();
      if (!desc.includes(query) && !ref.includes(query) && !zone.includes(query)) return false;
    }

    return true;
  });

  const totalEl = document.getElementById("migTotalFoundCount");
  if (totalEl) totalEl.textContent = `${filtered.length} found`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <p class="text-slate-400 text-sm font-medium">No work orders matching filter criteria</p>
      </div>
    `;
    updateMigrationSelectedCount();
    return;
  }

  container.innerHTML = filtered.map((wo) => {
    const woKey = String(wo._fbKey || wo.id);
    const isChecked = _migSelectedWoKeys.has(woKey);
    const assignedCount = (wo.assigned || []).length;
    const jc = getJobCardForWorkOrder(wo._fbKey || wo.id);

    let typeBadge = "";
    if (wo.assign_type) {
      typeBadge = `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">💼 ${escapeHtml(wo.assign_type)}</span>`;
    } else if (wo.type === "PROJECT") {
      typeBadge = `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">📋 PROJECT</span>`;
    } else if (wo.type === "JOB") {
      typeBadge = `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">🔧 JOB</span>`;
    } else {
      typeBadge = `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">⚡ TASK</span>`;
    }

    return `
      <div class="p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${isChecked ? 'bg-indigo-50/60 border-indigo-300 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'}">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleMigrationWoSelection('${woKey}', this.checked)" class="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer flex-shrink-0">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-0.5">
              ${typeBadge}
              <span class="text-[11px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">${escapeHtml(wo.zone_id || store.currentZone)}</span>
              ${wo.reference_no ? `<span class="text-[11px] text-slate-600 font-mono">${escapeHtml(wo.reference_no)}</span>` : ''}
              ${jc ? `<span class="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">${escapeHtml(jc.job_number)}</span>` : ''}
              <span class="text-[10px] font-semibold text-slate-400">• ${assignedCount} assigned</span>
            </div>
            <p class="text-xs font-bold text-slate-800 truncate" title="${escapeHtml(wo.description)}">${escapeHtml(wo.description)}</p>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <span class="text-[11px] px-2 py-0.5 rounded-full font-medium ${wo.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}">${wo.status}</span>
        </div>
      </div>
    `;
  }).join("");

  updateMigrationSelectedCount();
}

function toggleMigrationWoSelection(woKey, isChecked) {
  if (isChecked) {
    _migSelectedWoKeys.add(String(woKey));
  } else {
    _migSelectedWoKeys.delete(String(woKey));
  }
  updateMigrationSelectedCount();
}

function toggleSelectAllMigrationWorkOrders(checked) {
  const container = document.getElementById("migrationWorkOrdersContainer");
  if (!container) return;
  const checkboxes = container.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((cb) => {
    cb.checked = checked;
    const match = cb.getAttribute("onchange");
    if (match) {
      const keyMatch = match.match(/'([^']+)'/);
      if (keyMatch && keyMatch[1]) {
        if (checked) _migSelectedWoKeys.add(keyMatch[1]);
        else _migSelectedWoKeys.delete(keyMatch[1]);
      }
    }
  });
  updateMigrationSelectedCount();
  renderMigrationWorkOrdersList();
}

function updateMigrationSelectedCount() {
  const el = document.getElementById("migSelectedCount");
  if (el) el.textContent = _migSelectedWoKeys.size;
  const selectAllCb = document.getElementById("migSelectAllCb");
  if (selectAllCb) {
    const container = document.getElementById("migrationWorkOrdersContainer");
    const count = container ? container.querySelectorAll('input[type="checkbox"]').length : 0;
    selectAllCb.checked = count > 0 && _migSelectedWoKeys.size >= count;
  }
}

function handleMigTargetTypeChange(val) {
  const wrapper = document.getElementById("migAssignTypeWrapper");
  const unlinkWrapper = document.getElementById("migUnlinkJobCardWrapper");
  if (wrapper) wrapper.classList.toggle("hidden", val !== "ASSIGNMENT");
  if (unlinkWrapper) unlinkWrapper.classList.toggle("hidden", val !== "ASSIGNMENT");
}

function executeBatchWorkOrderMigration() {
  if (_migSelectedWoKeys.size === 0) {
    showToast("⚠️ Please select at least one work order to migrate.", "warning");
    return;
  }

  const targetType = document.getElementById("migTargetType").value;
  const targetAssignType = (document.getElementById("migAssignTypeSelect") || {}).value || "In Charge";
  const unlinkJobCards = (document.getElementById("migUnlinkJobCardsCb") || {}).checked;

  const count = _migSelectedWoKeys.size;
  const targetLabel = targetType === "ASSIGNMENT" ? `Assignment (${targetAssignType})` : targetType;

  if (!confirm(`Are you sure you want to migrate ${count} selected work order(s) to ${targetLabel}?`)) {
    return;
  }

  const btn = document.getElementById("btnExecuteBatchMigration");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>⏳</span> Migrating ${count} Work Orders...`;
  }

  const selectedKeys = Array.from(_migSelectedWoKeys);
  let successCount = 0;

  selectedKeys.forEach((key) => {
    const wo = store.workOrders.find(
      (w) => String(w._fbKey) === String(key) || String(w.id) === String(key)
    );
    if (wo) {
      let newType = "PROJECT";
      let newAssignType = null;

      if (targetType === "ASSIGNMENT") {
        newType = "TASK";
        newAssignType = targetAssignType;
      } else if (targetType === "JOB") {
        newType = "JOB";
        newAssignType = null;
      } else if (targetType === "TASK") {
        newType = "TASK";
        newAssignType = null;
      } else {
        newType = "PROJECT";
        newAssignType = null;
      }

      wo.type = newType;
      wo.assign_type = newAssignType;

      const targetFbKey = wo._fbKey || wo.id;
      if (targetFbKey) {
        opsDB.ref(`work_orders/${targetFbKey}`).update({
          type: newType,
          assign_type: newAssignType,
          updated_at: Date.now()
        }).catch(console.warn);
      }

      // Handle job card removal if requested
      if (targetType === "ASSIGNMENT" && unlinkJobCards) {
        const jc = getJobCardForWorkOrder(wo._fbKey || wo.id);
        if (jc) {
          const cost = computeJobCardCost(jc);
          if (cost.total === 0) {
            if (jc._fbKey) {
              opsDB.ref(`job_cards/${jc._fbKey}`).remove().catch(console.warn);
            }
            store.jobCards = store.jobCards.filter(
              (j) => String(j.id) !== String(jc.id) && String(j._fbKey) !== String(jc._fbKey)
            );
          }
        }
      }

      successCount++;
    }
  });

  setTimeout(() => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>⚡</span> Execute Total Migration`;
    }
    _migSelectedWoKeys.clear();
    closeModal("workOrderMigrationModal");
    refreshCurrentViewImmediately();
    showToast(`🚀 Successfully migrated ${successCount} work order(s) to ${targetLabel}!`, "success", 6000);
  }, 600);
}

// ─────────────────────────────────────────────
// OFFICER REVIEW & FORWARDING WORKFLOWS
// ─────────────────────────────────────────────
function toggleWoOfficerForwardPanel() {
  const panel = document.getElementById("woDetailForwardPanel");
  if (panel) panel.classList.toggle("hidden");
}

function submitForwardWorkOrderToOfficer() {
  const woKey = store.selectedWorkOrder;
  if (!woKey) return;
  const wo = store.workOrders.find(
    (w) => String(w._fbKey) === String(woKey) || String(w.id) === String(woKey)
  );
  if (!wo) return;

  const selectEl = document.getElementById("woDetailForwardOfficerSelect");
  const officerId = selectEl ? selectEl.value : "";
  if (!officerId) {
    showToast("Please select an Officer to forward to", "warning");
    return;
  }
  const selectedOption = selectEl.options[selectEl.selectedIndex];
  const officerName = selectedOption ? selectedOption.textContent.replace(/^[^\s]+\s+/, "") : "Officer";
  const remarks = (document.getElementById("woDetailForwardRemarks")?.value || "").trim();

  wo.officer_review_status = "Pending Review";
  wo.forwarded_to_officer_id = officerId;
  wo.forwarded_to_officer_name = officerName;
  wo.forwarded_at = Date.now();
  wo.incharge_forward_remarks = remarks;

  const targetFbKey = wo._fbKey || wo.id;
  if (targetFbKey) {
    opsDB.ref(`work_orders/${targetFbKey}`).update({
      officer_review_status: "Pending Review",
      forwarded_to_officer_id: officerId,
      forwarded_to_officer_name: officerName,
      forwarded_at: Date.now(),
      incharge_forward_remarks: remarks,
      updated_at: Date.now()
    }).then(() => {
      showToast(`📤 Forwarded Work Order to ${officerName} for review!`, "success");
    }).catch(console.warn);
  }

  refreshCurrentViewImmediately();
  openWorkOrderDetail(targetFbKey);
  updateGlobalOfficerHubBadge();
}

function officerApproveCurrentWorkOrder() {
  const woKey = store.selectedWorkOrder;
  if (!woKey) return;
  const wo = store.workOrders.find(
    (w) => String(w._fbKey) === String(woKey) || String(w.id) === String(woKey)
  );
  if (!wo) return;

  const officer = getCurrentOfficer();
  const officerName = officer ? `${officer.rank || ''} ${officer.name || ''}`.trim() : (store.activeProfileName || "Command Officer");

  // Save current modal edits first
  saveWorkOrderChanges(false);

  wo.officer_review_status = "Approved";
  wo.officer_approved_by = officerName;
  wo.officer_approved_at = Date.now();
  wo.officer_remarks = "";

  const targetFbKey = wo._fbKey || wo.id;
  if (targetFbKey) {
    opsDB.ref(`work_orders/${targetFbKey}`).update({
      officer_review_status: "Approved",
      officer_approved_by: officerName,
      officer_approved_at: Date.now(),
      officer_remarks: "",
      updated_at: Date.now()
    }).then(() => {
      showToast(`🛡️ Work Order approved & cleared by ${officerName}!`, "success");
    }).catch(console.warn);
  }

  refreshCurrentViewImmediately();
  updateGlobalOfficerHubBadge();
  closeModal("workOrderDetailModal");
}

function officerRequestChangesForCurrentWorkOrder() {
  const woKey = store.selectedWorkOrder;
  if (!woKey) return;
  const wo = store.workOrders.find(
    (w) => String(w._fbKey) === String(woKey) || String(w.id) === String(woKey)
  );
  if (!wo) return;

  const remarks = prompt("Please enter revision instructions/remarks for In-Charge:", wo.officer_remarks || "");
  if (remarks === null) return;

  const officer = getCurrentOfficer();
  const officerName = officer ? `${officer.rank || ''} ${officer.name || ''}`.trim() : (store.activeProfileName || "Officer");

  wo.officer_review_status = "Changes Requested";
  wo.officer_remarks = remarks;
  wo.officer_reviewed_by = officerName;

  const targetFbKey = wo._fbKey || wo.id;
  if (targetFbKey) {
    opsDB.ref(`work_orders/${targetFbKey}`).update({
      officer_review_status: "Changes Requested",
      officer_remarks: remarks,
      officer_reviewed_by: officerName,
      updated_at: Date.now()
    }).then(() => {
      showToast(`↩️ Revision requested from In-Charge.`, "info");
    }).catch(console.warn);
  }

  refreshCurrentViewImmediately();
  openWorkOrderDetail(targetFbKey);
  updateGlobalOfficerHubBadge();
}

// ─────────────────────────────────────────────
// JOB CARD MATERIAL CLEARANCE & LMD WORKFLOWS
// ─────────────────────────────────────────────
function forwardCurrentJobCardToOfficer() {
  const jcId = document.getElementById("editJcId")?.value;
  if (!jcId) return;
  const jc = store.jobCards.find(
    (j) => String(j.id) === String(jcId) || String(j._fbKey) === String(jcId)
  );
  if (!jc) return;

  jc.officer_clearance_status = "Pending Clearance";
  jc.forwarded_at = Date.now();

  const jcKey = jc._fbKey || jc.id;
  if (jcKey) {
    opsDB.ref(`job_cards/${jcKey}`).update({
      officer_clearance_status: "Pending Clearance",
      forwarded_at: Date.now(),
      updated_at: Date.now()
    }).then(() => {
      showToast(`📤 Job Card ${jc.job_number} forwarded to Officer for Material Clearance & LMD!`, "success");
      const badge = document.getElementById("editJcOfficerStatusBadge");
      if (badge) {
        badge.textContent = "⏳ Pending Clearance";
        badge.className = "text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 animate-pulse";
      }
    }).catch(console.warn);
  }
  updateGlobalOfficerHubBadge();
}

function officerAuthorizeJobCardAndSendLmd() {
  const jcId = document.getElementById("editJcId")?.value;
  if (!jcId) return;
  const jc = store.jobCards.find(
    (j) => String(j.id) === String(jcId) || String(j._fbKey) === String(jcId)
  );
  if (!jc) return;

  const officer = getCurrentOfficer();
  const officerName = officer ? `${officer.rank || ''} ${officer.name || ''}`.trim() : (store.activeProfileName || "Officer");

  jc.officer_clearance_status = "Cleared";
  jc.officer_cleared_by = officerName;
  jc.officer_cleared_at = Date.now();
  jc.status = "Completed";

  const jcKey = jc._fbKey || jc.id;
  if (jcKey) {
    opsDB.ref(`job_cards/${jcKey}`).update({
      officer_clearance_status: "Cleared",
      officer_cleared_by: officerName,
      officer_cleared_at: Date.now(),
      status: "Completed",
      updated_at: Date.now()
    }).then(() => {
      showToast(`🚀 Job Card ${jc.job_number} authorized by ${officerName} & Dispatched to LMD!`, "success", 5000);
      closeModal("editJobCardModal");
      refreshCurrentViewImmediately();
    }).catch(console.warn);
  }
  updateGlobalOfficerHubBadge();
}

// ─────────────────────────────────────────────
// INVENTORY & ESTIMATES OFFICER ACTIONS
// ─────────────────────────────────────────────
function officerVerifyInventoryAdjustment(recordId) {
  const officer = getCurrentOfficer();
  const officerName = officer ? `${officer.rank || ''} ${officer.name || ''}`.trim() : (store.activeProfileName || "Officer");

  if (recordId) {
    opsDB.ref(`inventory_audit/${recordId}`).update({
      verified_by: officerName,
      verified_at: Date.now(),
      status: "Verified"
    }).then(() => {
      showToast(`✓ Inventory adjustment verified by ${officerName}!`, "success");
      renderOfficerHubContent();
    }).catch(console.warn);
  }
  updateGlobalOfficerHubBadge();
}

function officerApproveEstimate(estId) {
  const est = (store.estimates || []).find(e => String(e.id || e._fbKey) === String(estId));
  if (!est) return;

  const officer = getCurrentOfficer();
  const officerName = officer ? `${officer.rank || ''} ${officer.name || ''}`.trim() : (store.activeProfileName || "Officer");

  est.approval_status = "Approved";
  est.status = "Approved";
  est.approved_by_officer = officerName;
  est.approved_at = Date.now();

  const estKey = est._fbKey || est.id;
  if (estKey) {
    opsDB.ref(`estimates/${estKey}`).update({
      approval_status: "Approved",
      status: "Approved",
      approved_by_officer: officerName,
      approved_at: Date.now(),
      updated_at: Date.now()
    }).then(() => {
      showToast(`✅ Estimate ${est.project_name || est.reference_no || ''} approved by ${officerName}!`, "success");
      renderOfficerHubContent();
      if (typeof renderEstimates === "function") renderEstimates();
    }).catch(console.warn);
  }
  updateGlobalOfficerHubBadge();
}

function officerRejectEstimate(estId) {
  const remarks = prompt("Please enter revision instructions for this estimate:");
  if (remarks === null) return;

  const est = (store.estimates || []).find(e => String(e.id || e._fbKey) === String(estId));
  if (!est) return;

  const officer = getCurrentOfficer();
  const officerName = officer ? `${officer.rank || ''} ${officer.name || ''}`.trim() : (store.activeProfileName || "Officer");

  est.approval_status = "Revision Requested";
  est.officer_remarks = remarks;

  const estKey = est._fbKey || est.id;
  if (estKey) {
    opsDB.ref(`estimates/${estKey}`).update({
      approval_status: "Revision Requested",
      officer_remarks: remarks,
      reviewed_by: officerName,
      updated_at: Date.now()
    }).then(() => {
      showToast(`↩️ Revision requested for estimate.`, "info");
      renderOfficerHubContent();
      if (typeof renderEstimates === "function") renderEstimates();
    }).catch(console.warn);
  }
  updateGlobalOfficerHubBadge();
}

// ─────────────────────────────────────────────
// OFFICER ACTION & APPROVALS HUB MODAL
// ─────────────────────────────────────────────
var _activeOfficerHubTab = window._activeOfficerHubTab = "work_orders";

function openOfficerApprovalsHubModal() {
  const modal = document.getElementById("officerApprovalsHubModal");
  if (!modal) return;

  const officer = getCurrentOfficer();
  const officerTitle = officer ? `${officer.rank || ''} ${officer.name || ''}`.trim() : "Officer In-Charge";
  const subEl = document.getElementById("officerHubSubtitle");
  if (subEl) {
    subEl.textContent = `Logged in as ${officerTitle} • Action pending clearances across all 4 operational modules`;
  }

  updateGlobalOfficerHubBadge();
  switchOfficerHubTab(_activeOfficerHubTab);
  modal.classList.remove("hidden");
}

function switchOfficerHubTab(tabName) {
  _activeOfficerHubTab = tabName;
  document.querySelectorAll(".hub-tab-btn").forEach((b) => {
    b.className = "hub-tab-btn px-4 py-2.5 text-xs font-bold border-b-2 border-transparent text-slate-500 hover:text-slate-700 flex items-center gap-2";
  });
  const activeBtn = document.getElementById(`btnHubTab-${tabName}`);
  if (activeBtn) {
    activeBtn.className = "hub-tab-btn px-4 py-2.5 text-xs font-bold border-b-2 border-teal-600 text-teal-700 flex items-center gap-2";
  }
  renderOfficerHubContent();
}

function updateGlobalOfficerHubBadge() {
  const isTarget = isNotificationTargetOfficer();

  const pendingWos = (store.workOrders || []).filter(w => w.officer_review_status === "Pending Review");
  const duplicatedWos = getDuplicatedWorkOrders();
  const pendingJcs = (store.jobCards || []).filter(j => j.officer_clearance_status === "Pending Clearance");
  const pendingEsts = (store.estimates || []).filter(e => e.approval_status === "Pending Approval" || e.status === "Pending");
  const pendingEvals = getPendingDailyEvaluations();
  const pendingInv = 0;

  const totalWoCount = pendingWos.length + duplicatedWos.length;
  const totalNotifications = totalWoCount + pendingJcs.length + pendingEsts.length + pendingEvals.length + pendingInv;

  const bWo = document.getElementById("hubBadge-work_orders");
  if (bWo) bWo.textContent = String(totalWoCount);
  const bEval = document.getElementById("hubBadge-evaluations");
  if (bEval) bEval.textContent = String(pendingEvals.length);
  const bEst = document.getElementById("hubBadge-estimates");
  if (bEst) bEst.textContent = String(pendingEsts.length);
  const bJc = document.getElementById("hubBadge-job_cards");
  if (bJc) bJc.textContent = String(pendingJcs.length);
  const bInv = document.getElementById("hubBadge-inventory");
  if (bInv) bInv.textContent = String(pendingInv);

  const globalBadge = document.getElementById("officerHubGlobalBadge");
  if (globalBadge) {
    if (totalNotifications > 0 && isTarget) {
      globalBadge.textContent = String(totalNotifications);
      globalBadge.classList.remove("hidden");
    } else {
      globalBadge.classList.add("hidden");
    }
  }

  const headerBadge = document.getElementById("headerNotificationBadge");
  if (headerBadge) {
    if (totalNotifications > 0 && isTarget) {
      headerBadge.textContent = String(totalNotifications);
      headerBadge.classList.remove("hidden");
    } else {
      headerBadge.classList.add("hidden");
    }
  }
}

function renderOfficerHubContent() {
  const container = document.getElementById("officerHubContentArea");
  if (!container) return;

  if (_activeOfficerHubTab === "work_orders") {
    const pendingWos = (store.workOrders || []).filter(w => w.officer_review_status === "Pending Review");
    const duplicatedWos = getDuplicatedWorkOrders();

    let html = "";

    if (duplicatedWos.length > 0) {
      html += `
        <div class="p-3.5 mb-3 bg-amber-50 rounded-xl border-2 border-amber-300">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-base">📑</span>
            <span class="text-xs font-black text-amber-900 uppercase tracking-wide">Duplicated Work Orders Detected (${duplicatedWos.length})</span>
            <span class="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">Action Needed</span>
          </div>
          <p class="text-xs text-amber-800 mb-2.5">The following work orders share matching descriptions in their respective zones. Review and resolve:</p>
          <div class="space-y-2">
            ${duplicatedWos.map(wo => {
              const woKey = wo._fbKey || wo.id;
              return `
                <div class="p-2.5 bg-white rounded-lg border border-amber-200 flex items-center justify-between gap-2 shadow-2xs">
                  <div class="min-w-0 flex-1 text-left">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">📑 Duplicated</span>
                      <span class="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">${escapeHtml(wo.zone_id || store.currentZone)}</span>
                      <span class="text-xs font-bold text-slate-900 truncate">${escapeHtml(wo.description)}</span>
                    </div>
                  </div>
                  <button type="button" onclick="closeModal('officerApprovalsHubModal'); openWorkOrderDetail('${woKey}');" class="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1 flex-shrink-0">
                    <span>✏️</span> Review
                  </button>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      `;
    }

    if (pendingWos.length === 0 && duplicatedWos.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p class="text-slate-400 text-sm font-medium">✨ All work orders are clear. No pending clearances or duplicates.</p>
        </div>
      `;
      return;
    }

    if (pendingWos.length > 0) {
      html += pendingWos.map(wo => {
        const woKey = wo._fbKey || wo.id;
        const typeBadge = wo.assign_type
          ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">💼 ${escapeHtml(wo.assign_type)}</span>`
          : `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">📋 ${escapeHtml(wo.type)}</span>`;
        return `
          <div class="p-4 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap mb-1">
                ${typeBadge}
                <span class="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">${escapeHtml(wo.zone_id || store.currentZone)}</span>
                ${wo.reference_no ? `<span class="text-[11px] font-mono text-slate-700">${escapeHtml(wo.reference_no)}</span>` : ''}
                <span class="text-[11px] text-amber-800 font-semibold">• Forwarded by In-Charge</span>
              </div>
              <p class="text-sm font-bold text-slate-900">${escapeHtml(wo.description)}</p>
              ${wo.incharge_forward_remarks ? `<p class="text-xs text-amber-700 mt-1 italic">Note: "${escapeHtml(wo.incharge_forward_remarks)}"</p>` : ''}
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <button type="button" onclick="closeModal('officerApprovalsHubModal'); openWorkOrderDetail('${woKey}');" class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1">
                <span>✏️</span> Review & Edit
              </button>
              <button type="button" onclick="officerApproveWorkOrderById('${woKey}')" class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1">
                <span>✅</span> Approve
              </button>
            </div>
          </div>
        `;
      }).join("");
    }

    container.innerHTML = html;
  } else if (_activeOfficerHubTab === "evaluations") {
    const pendingEvals = getPendingDailyEvaluations();
    if (pendingEvals.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p class="text-slate-400 text-sm font-medium">✨ All sailor daily evaluations are completed for today.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="mb-3 flex items-center justify-between">
        <p class="text-xs font-bold text-slate-700">Pending Daily Evaluations (${pendingEvals.length} Sailors)</p>
        <span class="text-[11px] text-teal-700 font-medium">Evaluate sailor performance and daily attendance</span>
      </div>
      <div class="space-y-2">
        ${pendingEvals.map(item => {
          const s = item.sailor;
          const cleanNo = s.official_number ? String(s.official_number).replace(/[^a-zA-Z0-9]/g, "") : "";
          const shortRank = s.rate ? String(s.rate).substring(0, 3) : "SLN";
          const fallbackText = `<div class="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">${shortRank}</div>`;
          const avatarHtml = cleanNo
            ? `<img src="images/${cleanNo}.JPG" data-fallback="${fallbackText.replace(/"/g, "&quot;")}" class="w-8 h-8 rounded-full object-cover flex-shrink-0" onerror="handleProfilePicError(this, '${cleanNo}')">`
            : fallbackText;
          return `
            <div class="p-3 bg-slate-50 hover:bg-teal-50/40 rounded-xl border border-slate-200 hover:border-teal-300 transition-all flex items-center justify-between gap-3 shadow-2xs">
              <div class="flex items-center gap-3 min-w-0">
                ${avatarHtml}
                <div class="min-w-0 text-left">
                  <p class="text-xs font-bold text-slate-900 truncate">${escapeHtml(s.rate || '')} ${escapeHtml(s.name || '')}</p>
                  <div class="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span class="text-[10px] font-mono font-bold text-slate-600">${escapeHtml(s.official_number || '')}</span>
                    <span class="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">⏳ Not Evaluated</span>
                    <span class="text-[10px] text-slate-500 font-medium truncate">• ${escapeHtml(item.workOrderDesc)}</span>
                  </div>
                </div>
              </div>
              <button type="button" onclick="closeModal('officerApprovalsHubModal'); openEvaluationModal('${s.id || s._fbKey}', '${item.workOrderId}');" class="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1 flex-shrink-0">
                <span>⚡</span> Evaluate
              </button>
            </div>
          `;
        }).join("")}
      </div>
    `;
  } else if (_activeOfficerHubTab === "job_cards") {
    const pendingJcs = (store.jobCards || []).filter(j => j.officer_clearance_status === "Pending Clearance");
    if (pendingJcs.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p class="text-slate-400 text-sm font-medium">✨ All Job Cards are clear. No pending material or LMD clearances.</p>
        </div>
      `;
      return;
    }
    container.innerHTML = pendingJcs.map(jc => {
      const cost = computeJobCardCost(jc);
      return `
        <div class="p-4 rounded-xl border border-teal-200 bg-teal-50/40 hover:bg-teal-50/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <span class="text-xs font-mono font-bold text-teal-900 bg-white px-2 py-0.5 rounded border border-teal-200">${escapeHtml(jc.job_number)}</span>
              <span class="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">${escapeHtml(jc.zone_id || store.currentZone)}</span>
              <span class="text-xs font-bold text-emerald-700">${formatCurrency(cost.total)}</span>
            </div>
            <p class="text-sm font-bold text-slate-900">${escapeHtml(jc.description)}</p>
            <p class="text-xs text-slate-500 mt-1">Materials: ${formatCurrency(cost.material)} • Labour: ${formatCurrency(cost.labor)}</p>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <button type="button" onclick="closeModal('officerApprovalsHubModal'); openEditJobCardModal('${jc._fbKey || jc.id}');" class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1">
              <span>🔍</span> Inspect Materials
            </button>
            <button type="button" onclick="officerAuthorizeJobCardById('${jc._fbKey || jc.id}')" class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1">
              <span>🚀</span> Authorize LMD
            </button>
          </div>
        </div>
      `;
    }).join("");
  } else if (_activeOfficerHubTab === "estimates") {
    const pendingEsts = (store.estimates || []).filter(e => e.approval_status === "Pending Approval" || e.status === "Pending");
    if (pendingEsts.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p class="text-slate-400 text-sm font-medium">✨ All Project Estimates are reviewed and approved.</p>
        </div>
      `;
      return;
    }
    container.innerHTML = pendingEsts.map(est => {
      const itemsCount = (est.items || []).length;
      return `
        <div class="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <span class="text-xs font-bold text-indigo-900 bg-white px-2 py-0.5 rounded border border-indigo-200">${escapeHtml(est.project_name || est.title || 'Estimate')}</span>
              <span class="text-[11px] font-mono text-slate-600">${escapeHtml(est.estimate_no || est.reference_no || '')}</span>
              <span class="text-xs font-extrabold text-indigo-700">Rs. ${(est.total_cost || est.budget || 0).toLocaleString()}</span>
            </div>
            <p class="text-xs text-slate-600 mt-1">${itemsCount} Line Items listed • Prepared by Planning Desk</p>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <button type="button" onclick="closeModal('officerApprovalsHubModal'); selectEstimate('${est._fbKey || est.id}'); editEstimate();" class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1">
              <span>✏️</span> Review & Edit
            </button>
            <button type="button" onclick="officerApproveEstimate('${est._fbKey || est.id}')" class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1">
              <span>✅</span> Sanction
            </button>
          </div>
        </div>
      `;
    }).join("");
  } else {
    container.innerHTML = `
      <div class="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <p class="text-slate-400 text-sm font-medium">📦 All inventory stock movements are verified and in sync.</p>
      </div>
    `;
  }
}


function officerApproveWorkOrderById(woKey) {
  const wo = store.workOrders.find(
    (w) => String(w._fbKey) === String(woKey) || String(w.id) === String(woKey)
  );
  if (!wo) return;
  const officer = getCurrentOfficer();
  const officerName = officer ? `${officer.rank || ''} ${officer.name || ''}`.trim() : (store.activeProfileName || "Command Officer");

  wo.officer_review_status = "Approved";
  wo.officer_approved_by = officerName;
  wo.officer_approved_at = Date.now();

  const targetFbKey = wo._fbKey || wo.id;
  if (targetFbKey) {
    opsDB.ref(`work_orders/${targetFbKey}`).update({
      officer_review_status: "Approved",
      officer_approved_by: officerName,
      officer_approved_at: Date.now(),
      updated_at: Date.now()
    }).catch(console.warn);
  }
  showToast(`🛡️ Work Order approved by ${officerName}!`, "success");
  refreshCurrentViewImmediately();
  renderOfficerHubContent();
  updateGlobalOfficerHubBadge();
}

function officerAuthorizeJobCardById(jcKey) {
  const jc = store.jobCards.find(
    (j) => String(j._fbKey) === String(jcKey) || String(j.id) === String(jcKey)
  );
  if (!jc) return;
  const officer = getCurrentOfficer();
  const officerName = officer ? `${officer.rank || ''} ${officer.name || ''}`.trim() : (store.activeProfileName || "Officer");

  jc.officer_clearance_status = "Cleared";
  jc.officer_cleared_by = officerName;
  jc.officer_cleared_at = Date.now();
  jc.status = "Completed";

  const targetFbKey = jc._fbKey || jc.id;
  if (targetFbKey) {
    opsDB.ref(`job_cards/${targetFbKey}`).update({
      officer_clearance_status: "Cleared",
      officer_cleared_by: officerName,
      officer_cleared_at: Date.now(),
      status: "Completed",
      updated_at: Date.now()
    }).catch(console.warn);
  }
  showToast(`🚀 Job Card ${jc.job_number} authorized & Dispatched to LMD!`, "success");
  refreshCurrentViewImmediately();
  renderOfficerHubContent();
  updateGlobalOfficerHubBadge();
}

function openJobCardForTask(workOrderId) {
  const wo = store.workOrders.find(
    (w) => String(w.id) === String(workOrderId) || String(w._fbKey) === String(workOrderId)
  );
  if (!wo) return;

  const jobNumber = `JC/${new Date().getFullYear()}/${String(Date.now()).slice(-4).padStart(4, "0")}`;
  const newJobCard = {
    job_number: jobNumber,
    work_order_id: wo._fbKey || wo.id,
    description: wo.description,
    location: wo.location || "",
    zone_id: wo.zone_id || store.currentZone,
    status: "Active",
    start_date: getLocalDateString(),
    total_material_cost: 0,
    feedbackSent: false,
    feedbackReceived: false,
  };
  fbSaveJobCard(newJobCard).then(() => {
    showToast(`Job Card ${jobNumber} created for this Task! 🛠️`);
    openWorkOrderDetail(wo._fbKey || wo.id);
  });
}

var _detailCurrentTrade = window._detailCurrentTrade = "ALL";
function filterDetailTrade(trade) {
  _detailCurrentTrade = trade;
  document.querySelectorAll(".detail-trade-btn").forEach((b) => {
    if (b.textContent === trade) {
      b.classList.remove("bg-slate-200", "text-slate-600");
      b.classList.add("bg-slate-700", "text-white");
    } else {
      b.classList.add("bg-slate-200", "text-slate-600");
      b.classList.remove("bg-slate-700", "text-white");
    }
  });
  renderDetailSailorChips(document.getElementById("detailSailorSearch").value);
}
var _detailSearchTimeout = window._detailSearchTimeout = null;
function filterDetailSailors() {
  if (_detailSearchTimeout) clearTimeout(_detailSearchTimeout);
  _detailSearchTimeout = setTimeout(() => {
    const el = document.getElementById("detailSailorSearch");
    renderDetailSailorChips(el ? el.value : "");
  }, 180);
}
function renderDetailSailorChips(filter = "") {
  const tradeBgMap = {
    MA: "#0d9488",
    CA: "#7c3aed",
    PA: "#b45309",
    PL: "#0891b2",
    WE: "#dc2626",
    RW: "#374151",
    SW: "#065f46",
    BB: "#1d4ed8",
    AL: "#ec4899",
  };
  const wo = store.workOrders.find(
    (w) =>
      String(w.id) === String(store.selectedWorkOrder) ||
      String(w._fbKey) === String(store.selectedWorkOrder),
  );
  if (!wo) return;
  const today = getLocalDateString();
  const { sailors: assignedSailors } = getWorkOrderAssignedSailors(wo, today);
  const assignedIds = new Set();
  assignedSailors.forEach((s) => {
    if (s.id !== undefined && s.id !== null) assignedIds.add(String(s.id));
    if (s._fbKey) assignedIds.add(String(s._fbKey));
    if (s.official_number) assignedIds.add(String(s.official_number));
  });
  extractSailorKeys(wo.assigned).forEach((id) => assignedIds.add(String(id)));

  if (!filter && document.getElementById("detailSailorSearch")) {
    filter = document.getElementById("detailSailorSearch").value;
  }

  // When searching, show ALL sailors (651) so any sailor can be found and assigned across all trades
  let sailors;
  if (filter && filter.trim()) {
    const q = filter.toLowerCase().trim();
    const qDigits = q.replace(/\D/g, "");
    sailors = store.sailors.filter(
      (s) =>
        !isSailorMatchingKeys(s, assignedIds) &&
        ((s._searchIndex || "").toLowerCase().includes(q) ||
          (s.name || "").toLowerCase().includes(q) ||
          String(s.official_number || "").toLowerCase().includes(q) ||
          String(s.service_no || "").toLowerCase().includes(q) ||
          String(s.off_no || "").toLowerCase().includes(q) ||
          String(s.rank || "").toLowerCase().includes(q) ||
          String(s.trade || "").toLowerCase().includes(q) ||
          (qDigits && (s.official_number || s.service_no || "").replace(/\D/g, "").includes(qDigits))),
    );
  } else {
    sailors = store.sailors.filter(
      (s) =>
        !isSailorMatchingKeys(s, assignedIds) &&
        isSailorAvailableForWork(s, today) &&
        (_detailCurrentTrade === "ALL" || s.trade === _detailCurrentTrade),
    );
  }
  const container = document.getElementById("detailSailorChips");
  if (sailors.length === 0) {
    container.innerHTML = `<p class="text-slate-400 text-xs w-full text-center py-2">No available sailors found</p>`;
    return;
  }
  container.innerHTML = sailors
    .map((s) => {
      var _s$id26, _s$id28;
      const tradeBg = tradeBgMap[s.trade] || "#475569";
      const offNo =
        s.official_number || s.officialNumber || s.service_no || "-";
      const fullName = s.name || "Unknown";
      const rank = s.rank || "";
      const assignment = getSailorDailyAssignment(s, today);
      if (assignment) {
        // ── REASSIGNABLE / TRANSFER CHIP: Click to transfer to this task ──
        const zoneDisplay = assignment.zone || "Unknown Zone";
        const woRefDisplay = assignment.ref || "";
        const woTitleDisplay = assignment.title
          ? assignment.title.substring(0, 40) + (assignment.title.length > 40 ? "…" : "")
          : "";
        const taskDisplay = (woRefDisplay && woTitleDisplay && woRefDisplay !== woTitleDisplay)
          ? `${woRefDisplay} · ${woTitleDisplay}`
          : (woTitleDisplay || woRefDisplay || "රාජකාරිය");
        const tooltipText = `⚠️ මෙම නාවිකයා දැනටමත් ${zoneDisplay} හි ${taskDisplay} සඳහා Assign කරලා ඉන්නවා. මෙම කාර්යයට මාරු (Transfer) කිරීමට ක්ලික් කරන්න.`;
        return `
            <button type="button"
                onclick="assignSingleLabor('${(_s$id26 = s.id) !== null && _s$id26 !== void 0 ? _s$id26 : s._fbKey}')"
                title="${tooltipText}"
                class="sailor-chip-card group hover:border-amber-400"
                style="
                    display:flex; align-items:center; gap:8px;
                    padding:7px 10px; border-radius:10px;
                    cursor:pointer;
                    border:2px dashed #f59e0b;
                    background:#fffbeb;
                    min-width:140px; position:relative;
                    text-align:left;
                    transition:all 0.15s ease;
                ">
                <!-- Trade badge – amber outline -->
                <div style="background:${tradeBg}; width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:10.5px; font-weight:800; letter-spacing:0.5px; flex-shrink:0;">
                    ${s.trade}
                </div>
                <div style="flex:1; overflow:hidden;">
                    <div style="font-size:11px; font-weight:700; color:#92400e; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:145px;">
                        ${rank} ${fullName}
                    </div>
                    <!-- Zone + WO info badge -->
                    <div style="display:flex; align-items:center; gap:4px; margin-top:2px; flex-wrap:wrap;">
                        <span style="font-size:8px; background:#fef3c7; color:#b45309; border:1px solid #fde68a; border-radius:4px; padding:1px 5px; font-weight:700; white-space:nowrap;">🔄 ${zoneDisplay}</span>
                        ${woRefDisplay ? `<span style="font-size:8px; background:#e0f2fe; color:#0369a1; border-radius:4px; padding:1px 5px; font-weight:700; white-space:nowrap;">${woRefDisplay}</span>` : (woTitleDisplay ? `<span style="font-size:8px; background:#e0f2fe; color:#0369a1; border-radius:4px; padding:1px 5px; font-weight:700; max-width:90px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${woTitleDisplay}</span>` : "")}
                    </div>
                    <div style="font-size:8px; color:#d97706; font-weight:600; margin-top:2px;">Click to Transfer ⚡</div>
                </div>
            </button>
            `;
      }
      return `
        <button type="button"
            onclick="assignSingleLabor('${(_s$id28 = s.id) !== null && _s$id28 !== void 0 ? _s$id28 : s._fbKey}')"
            title="${rank} ${fullName} | ${offNo}"
            class="sailor-chip-card"
            style="
                display:flex; align-items:center; gap:8px;
                padding:7px 10px; border-radius:10px; cursor:pointer;
                border:2px solid #e2e8f0;
                background:#fff;
                box-shadow: 0 1px 3px rgba(0,0,0,0.06);
                transition:all 0.15s ease; min-width:140px; position:relative;
                text-align:left;
            ">
            <div style="background:${tradeBg}; width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:10.5px; font-weight:800; letter-spacing:0.5px; flex-shrink:0;">
                ${s.trade}
            </div>
            <div style="flex:1; overflow:hidden;">
                <div style="font-size:11px; font-weight:700; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:130px;">
                    ${rank} ${fullName}
                </div>
                <div style="font-size:9.5px; color:#94a3b8; font-weight:500; letter-spacing:0.3px">${offNo}</div>
            </div>
        </button>
        `;
    })
    .join("");
}
function assignSingleLabor(sailorId) {
  const today = getLocalDateString();
  const sailor = typeof findSailorById === "function" ? findSailorById(sailorId) : (store.sailors || []).find(
    (s) => isSailorMatchingKeys(s, [sailorId]),
  );
  const assignment = (sailor ? getSailorDailyAssignment(sailor, today) : null) || getSailorCurrentAssignment(sailorId);
  let wo = (store.workOrders || []).find(
    (w) =>
      String(w.id) === String(store.selectedWorkOrder) ||
      String(w._fbKey) === String(store.selectedWorkOrder),
  );
  if (!wo) {
    wo = (store.jobCards || []).find(
      (j) =>
        String(j.id) === String(store.selectedWorkOrder) ||
        String(j._fbKey) === String(store.selectedWorkOrder),
    );
  }
  if (!wo || !sailor) return;

  if (assignment) {
    let fromName = "";
    if (assignment.ref && assignment.title && assignment.ref !== assignment.title) {
      fromName = assignment.ref + " · " + assignment.title;
    } else {
      fromName = assignment.title || assignment.ref || "රාජකාරිය";
    }
    const fromZone = assignment.zone ? "[" + assignment.zone + "] " : "";
    const fromDesc = fromZone + fromName;

    let toName = "";
    const toRef = wo.reference_no || wo.job_card_no || "";
    const toTitle = wo.description || wo.title || "";
    if (toRef && toTitle && toRef !== toTitle) {
      toName = toRef + " · " + toTitle;
    } else {
      toName = toTitle || toRef || "මෙම නව කාර්යය";
    }
    const rawToZone = wo.zone_id || wo.zone || "";
    const toZone = rawToZone ? "[" + String(rawToZone).replace(/-/g, " ").trim() + "] " : "";
    const toDesc = toZone + toName;

    const confirmTransfer = confirm(
      `⚠️ නාවිකයා (${sailor.rank || ''} ${sailor.name} - ${sailor.official_number || ''}) දැනටමත්:\n${fromDesc}\nහි යොදවා ඇත.\n\nමෙම නව කාර්යයට (${toDesc}) මාරු (Transfer) කිරීමට අවශ්‍යද?`
    );
    if (!confirmTransfer) return;
  }

  const sidToStore = sailor.id || sailor._fbKey || sailorId;

  // Find any previous work orders holding this sailor (as worker, supervisor, incharge, artificer)
  const prevWorkOrders = (store.workOrders || []).filter((w) => {
    if (w.status !== "Active" && w.status !== "Pending") return false;
    const inAssigned = (w.assigned || []).some((id) => isSailorMatchingKeys(sailor, [id]));
    const inLeader = isSailorMatchingKeys(sailor, [w.supervisor, w.incharge, w.project_artificer]);
    return inAssigned || inLeader;
  });

  // Find any previous job cards holding this sailor (as worker, supervisor, incharge, artificer)
  const prevJobCards = (store.jobCards || []).filter((j) => {
    if (j.status !== "Active" && j.status !== "Pending") return false;
    const inAssigned = (j.assigned || []).some((id) => isSailorMatchingKeys(sailor, [id]));
    const inLeader = isSailorMatchingKeys(sailor, [j.supervisor, j.incharge, j.project_artificer]);
    return inAssigned || inLeader;
  });

  const allocSnapshot = (store.dailyAllocations || []).find(
    (a) => a.date === today && isSailorMatchingKeys(sailor, [a.sailor_id, a.official_number])
  );

  const primaryPrev = prevWorkOrders[0] || prevJobCards[0];
  _lastActionUndo = {
    type: "ASSIGN_SAILOR",
    sailorId: sailorId,
    targetWoId: wo.id || wo._fbKey,
    targetWoPrevAssigned: [...(wo.assigned || [])],
    prevWoId: primaryPrev ? (primaryPrev.id || primaryPrev._fbKey) : null,
    prevWoAssigned: primaryPrev ? [...(primaryPrev.assigned || [])] : null,
    sailorPrevStatus: sailor.status,
    sailorPrevZone: sailor.zone_id || store.currentZone,
    dailyAllocSnapshot: allocSnapshot ? JSON.parse(JSON.stringify(allocSnapshot)) : null
  };

  // Cleanly release from all previous work orders
  prevWorkOrders.forEach((pw) => {
    let changed = false;
    if (pw.assigned && Array.isArray(pw.assigned)) {
      const pLen = pw.assigned.length;
      pw.assigned = pw.assigned.filter((id) => !isSailorMatchingKeys(sailor, [id]));
      if (pw.assigned.length !== pLen) changed = true;
    }
    if (pw.supervisor && isSailorMatchingKeys(sailor, [pw.supervisor])) { pw.supervisor = null; changed = true; }
    if (pw.incharge && isSailorMatchingKeys(sailor, [pw.incharge])) { pw.incharge = null; changed = true; }
    if (pw.project_artificer && isSailorMatchingKeys(sailor, [pw.project_artificer])) { pw.project_artificer = null; changed = true; }
    if (changed) {
      const key = pw._fbKey || pw.id;
      opsDB.ref(`work_orders/${key}`).update({
        assigned: (pw.assigned && pw.assigned.length > 0) ? pw.assigned : null,
        supervisor: pw.supervisor || null,
        incharge: pw.incharge || null,
        project_artificer: pw.project_artificer || null,
      });
    }
    if (window.safeFbRemoveSailor) {
      safeFbRemoveSailor(pw._fbKey || pw.id, sidToStore, today);
    }
  });

  // Cleanly release from all previous job cards
  prevJobCards.forEach((pj) => {
    let changed = false;
    if (pj.assigned && Array.isArray(pj.assigned)) {
      const pLen = pj.assigned.length;
      pj.assigned = pj.assigned.filter((id) => !isSailorMatchingKeys(sailor, [id]));
      if (pj.assigned.length !== pLen) changed = true;
    }
    if (pj.supervisor && isSailorMatchingKeys(sailor, [pj.supervisor])) { pj.supervisor = null; changed = true; }
    if (pj.incharge && isSailorMatchingKeys(sailor, [pj.incharge])) { pj.incharge = null; changed = true; }
    if (pj.project_artificer && isSailorMatchingKeys(sailor, [pj.project_artificer])) { pj.project_artificer = null; changed = true; }
    if (changed) {
      const key = pj._fbKey || pj.id;
      opsDB.ref(`job_cards/${key}`).update({
        assigned: (pj.assigned && pj.assigned.length > 0) ? pj.assigned : null,
        supervisor: pj.supervisor || null,
        incharge: pj.incharge || null,
        project_artificer: pj.project_artificer || null,
      });
    }
    if (window.safeFbRemoveSailor) {
      safeFbRemoveSailor(pj._fbKey || pj.id, sidToStore, today);
    }
  });

  // Cleanly release from long-term projects (out_projects, housing_projects, other_bases)
  ["out_projects", "housing_projects", "other_bases"].forEach((node) => {
    const storeNode = node === "out_projects" ? store.outProjects : node === "housing_projects" ? store.housingProjects : store.otherBases;
    if (storeNode) {
      Object.entries(storeNode).forEach(([pKey, pVal]) => {
        if (pVal && pVal.assigned_sailors) {
          Object.keys(pVal.assigned_sailors).forEach((sKey) => {
            if (isSailorMatchingKeys(sailor, [sKey])) {
              delete pVal.assigned_sailors[sKey];
              opsDB.ref(`${node}/${pKey}/assigned_sailors/${sKey}`).remove();
            }
          });
        }
      });
    }
  });

  // Remove previous daily allocations for today
  opsDB.ref(`daily_allocations/${today}_${sanitizeFbKey(sidToStore)}`).remove();
  opsDB.ref(`daily_allocations/${today}_${sanitizeFbKey(sailorId)}`).remove();
  if (sailor.official_number) {
    opsDB.ref(`daily_allocations/${today}_${sanitizeFbKey(sailor.official_number)}`).remove();
  }

  if (!wo.assigned) wo.assigned = [];
  if (wo._removedSailorIds) {
    wo._removedSailorIds.delete(String(sidToStore).trim());
    if (sailor.id !== undefined && sailor.id !== null) wo._removedSailorIds.delete(String(sailor.id).trim());
    if (sailor._fbKey) wo._removedSailorIds.delete(String(sailor._fbKey).trim());
    if (sailor.official_number) {
      wo._removedSailorIds.delete(String(sailor.official_number).trim());
      const d = String(sailor.official_number).replace(/\D/g, "");
      if (d.length >= 3) wo._removedSailorIds.delete(d);
    }
  }
  wo._userClearedCrew = false;
  wo.user_cleared_crew = false;
  if (wo.status === "Hold" || wo.status === "Cancelled" || wo.status === "Completed") {
    wo.status = "Active";
    const statusSelect = document.getElementById("woDetailStatus");
    if (statusSelect) statusSelect.value = "Active";
  }
  const jc = typeof getJobCardForWorkOrder === "function" ? getJobCardForWorkOrder(wo._fbKey || wo.id) : null;
  if (jc) {
    if (jc.status === "Hold" || jc.status === "Cancelled" || jc.status === "Completed") {
      jc.status = "Active";
    }
    jc.user_cleared_crew = false;
    jc._userClearedCrew = false;
    const jcKey = jc._fbKey || jc.id;
    if (jcKey) {
      opsDB.ref(`job_cards/${jcKey}`).update({
        status: jc.status,
        user_cleared_crew: false,
        _userClearedCrew: false
      });
    }
  }

  const alreadyAssigned = wo.assigned.some(id => isSailorMatchingKeys(sailor, [id]));
  if (!alreadyAssigned) {
    wo.assigned.push(sidToStore);
    if (!wo.last_assigned) wo.last_assigned = [];
    if (!wo.last_assigned.includes(sidToStore)) wo.last_assigned.push(sidToStore);
    sailor.status = "Assigned";
    sailor.evaluated = false;
    wo.last_assigned_date = today;
    if (wo._fbKey) {
      const tableNode = (store.workOrders || []).some(w => w._fbKey === wo._fbKey) ? "work_orders" : "job_cards";
      opsDB.ref(`${tableNode}/${wo._fbKey}`).update({
        status: wo.status,
        user_cleared_crew: false,
        _userClearedCrew: false,
        assigned: wo.assigned.length > 0 ? wo.assigned : null,
        last_assigned: wo.last_assigned.length > 0 ? wo.last_assigned : null,
        last_assigned_date: today
      });
    }
    if (window.safeFbAssignSailor) {
      safeFbAssignSailor(wo._fbKey || wo.id, sidToStore, today);
    }
    const alloc = {
      sailor_id: sidToStore,
      official_number: sailor.official_number || sailor.service_no || "",
      work_order_id: wo._fbKey || wo.id,
      date: today,
      zone_id: wo.zone_id || store.currentZone,
      role_today: "Worker",
      assigned_by: store.currentUser && store.currentUser.name ? store.currentUser.name : "Officer",
      status: "Active"
    };
    if (!store.dailyAllocations) store.dailyAllocations = [];
    store.dailyAllocations = store.dailyAllocations.filter(
      (a) => !(a.date === today && isSailorMatchingKeys(sailor, [a.sailor_id, a.official_number]))
    );
    store.dailyAllocations.push(alloc);
    opsDB.ref(`daily_allocations/${today}_${sanitizeFbKey(sidToStore)}`).set(alloc);
    showToast(
      assignment
        ? `⚡ Reassigned ${sailor.name} from ${assignment.zone}! <button onclick="executeGlobalUndo()" class="ml-2 font-bold underline bg-amber-300 text-slate-900 px-2 py-0.5 rounded text-xs hover:bg-amber-400">↩️ Undo</button>`
        : `✅ ${sailor.name} assigned! <button onclick="executeGlobalUndo()" class="ml-2 font-bold underline bg-amber-300 text-slate-900 px-2 py-0.5 rounded text-xs hover:bg-amber-400">↩️ Undo</button>`,
      "success",
      6000
    );
    if (typeof refreshDailyCommitmentCache === "function") refreshDailyCommitmentCache(today);
    openWorkOrderDetail(wo._fbKey || wo.id);
  }
}
function updateWorkOrderStatus() {
  const woKey = store.selectedWorkOrder;
  const wo = store.workOrders.find(
    (w) => String(w._fbKey) === String(woKey) || String(w.id) === String(woKey),
  );
  if (wo) {
    const newStatus = document.getElementById("woDetailStatus").value;
    wo.status = newStatus; // Sync status to the linked Job Card
    const jc = getJobCardForWorkOrder(wo._fbKey || wo.id);
    if (jc) {
      jc.status = wo.status;
    } 
    
    // Clear today's daily allocations and free up sailors if putting on hold/completed/cancelled
    if (
      newStatus === "Hold" ||
      newStatus === "Completed" ||
      newStatus === "Cancelled"
    ) {
      const today = getLocalDateString();
      const woIdStr = String(wo.id);
      const woFbKeyStr = String(wo._fbKey || "");
      
      const assignedIds = (wo.assigned || []).map(String);
      (store.dailyAllocations || []).forEach((a) => {
        if (a.date === today && (String(a.work_order_id) === woIdStr || String(a.work_order_id) === woFbKeyStr)) {
          if (a.sailor_id) assignedIds.push(String(a.sailor_id));
        }
      });

      // Free sailors in memory
      if (store.sailors && assignedIds.length > 0) {
        store.sailors.forEach((s) => {
          if (assignedIds.includes(String(s.id)) || assignedIds.includes(String(s._fbKey))) {
            if (s.status === "Assigned") s.status = "Available";
          }
        });
      }

      // Remove from daily allocations memory and Firebase
      const allocationsToDelete = (store.dailyAllocations || []).filter(
        (a) => a.date === today && (String(a.work_order_id) === woIdStr || String(a.work_order_id) === woFbKeyStr),
      );
      store.dailyAllocations = (store.dailyAllocations || []).filter(
        (a) => !(a.date === today && (String(a.work_order_id) === woIdStr || String(a.work_order_id) === woFbKeyStr)),
      );

      allocationsToDelete.forEach((a) => {
        opsDB
          .ref(`daily_allocations/${today}_${sanitizeFbKey(a.sailor_id)}`)
          .remove()
          .catch((e) => console.warn(e));
      });

      // If Hold or Completed or Cancelled, clear assigned and last_assigned arrays and commit date
      if (newStatus === "Hold" || newStatus === "Completed" || newStatus === "Cancelled") {
        wo.assigned = [];
        wo.last_assigned = [];
        wo.last_committed_date = null;
        wo.user_cleared_crew = true;
        wo._userClearedCrew = true;
        if (wo._fbKey) {
          opsDB.ref(`work_orders/${wo._fbKey}`).update({
            status: newStatus,
            assigned: null,
            last_assigned: null,
            last_committed_date: null,
            user_cleared_crew: true,
            last_assigned_date: today
          });
        }
        if (jc) {
          jc.assigned = [];
          jc.last_assigned = [];
          jc.last_committed_date = null;
          jc.user_cleared_crew = true;
          jc._userClearedCrew = true;
          if (jc._fbKey) {
            opsDB.ref(`job_cards/${jc._fbKey}`).update({
              status: newStatus,
              assigned: null,
              last_assigned: null,
              last_committed_date: null,
              user_cleared_crew: true,
              last_assigned_date: today
            });
          }
        }
      }
    }

    if (jc && window.fbSaveJobCard) {
      fbSaveJobCard(jc);
    }

    if (wo._fbKey && newStatus !== "Hold" && newStatus !== "Completed" && newStatus !== "Cancelled") {
      opsDB.ref(`work_orders/${wo._fbKey}`).update({ status: newStatus });
    } else if (window.fbSaveWorkOrder) {
      fbSaveWorkOrder(wo);
    }
    refreshCurrentViewImmediately();
  }
}
var _lastActionUndo = window._lastActionUndo = null;
var _isRestoringUndo = window._isRestoringUndo = false;

function undoWorkOrderEdits() {
  executeGlobalUndo();
}

function undoCreateWorkOrder() {
  executeGlobalUndo();
}

function executeGlobalUndo() {
  if (!_lastActionUndo) {
    showToast("No recent action to undo.", "error");
    return;
  }

  const undo = _lastActionUndo;
  _lastActionUndo = null;
  const today = getLocalDateString();

  if (undo.type === "REMOVE_SAILOR") {
    const { sailorId, workOrderId, prevWoAssigned, sailorPrevStatus, dailyAllocSnapshot } = undo;
    const wo = store.workOrders.find((w) => String(w.id) === String(workOrderId) || String(w._fbKey) === String(workOrderId));
    const sailor = store.sailors.find((s) => String(s.id) === String(sailorId) || String(s._fbKey) === String(sailorId));

    if (wo && window.safeFbAssignSailor) {
      safeFbAssignSailor(wo._fbKey || wo.id, sailorId, today);
    }
    if (sailor && sailorPrevStatus) {
      sailor.status = sailorPrevStatus;
    }
    if (dailyAllocSnapshot) {
      opsDB.ref(`daily_allocations/${today}_${sanitizeFbKey(sailorId)}`).set(dailyAllocSnapshot);
      if (!store.dailyAllocations) store.dailyAllocations = [];
      store.dailyAllocations = store.dailyAllocations.filter(
        (a) => !(a.date === today && String(a.sailor_id) === String(sailorId))
      );
      store.dailyAllocations.push(dailyAllocSnapshot);
    }
    refreshCurrentViewImmediately();
    const modal = document.getElementById("workOrderDetailModal");
    if (modal && !modal.classList.contains("hidden") && store.selectedWorkOrder) {
      openWorkOrderDetail(store.selectedWorkOrder);
    }
    showToast("↩️ Sailor removal successfully undone!", "success");

  } else if (undo.type === "ASSIGN_SAILOR") {
    const { sailorId, targetWoId, targetWoPrevAssigned, prevWoId, prevWoAssigned, sailorPrevStatus, sailorPrevZone, dailyAllocSnapshot } = undo;
    const targetWo = store.workOrders.find((w) => String(w.id) === String(targetWoId) || String(w._fbKey) === String(targetWoId));
    const prevWo = prevWoId ? store.workOrders.find((w) => String(w.id) === String(prevWoId) || String(w._fbKey) === String(prevWoId)) : null;
    const sailor = store.sailors.find((s) => String(s.id) === String(sailorId) || String(s._fbKey) === String(sailorId));

    if (targetWo && window.safeFbRemoveSailor) {
      safeFbRemoveSailor(targetWo._fbKey || targetWo.id, sailorId, today);
    }
    if (prevWo && window.safeFbAssignSailor) {
      safeFbAssignSailor(prevWo._fbKey || prevWo.id, sailorId, today);
    }
    if (sailor) {
      if (sailorPrevStatus) sailor.status = sailorPrevStatus;
      if (sailorPrevZone) sailor.zone_id = sailorPrevZone;
    }

    opsDB.ref(`daily_allocations/${today}_${sanitizeFbKey(sailorId)}`).remove();
    if (!store.dailyAllocations) store.dailyAllocations = [];
    store.dailyAllocations = store.dailyAllocations.filter(
      (a) => !(a.date === today && String(a.sailor_id) === String(sailorId))
    );

    if (dailyAllocSnapshot) {
      opsDB.ref(`daily_allocations/${today}_${sanitizeFbKey(sailorId)}`).set(dailyAllocSnapshot);
      store.dailyAllocations.push(dailyAllocSnapshot);
    }

    refreshCurrentViewImmediately();
    const modal = document.getElementById("workOrderDetailModal");
    if (modal && !modal.classList.contains("hidden") && store.selectedWorkOrder) {
      openWorkOrderDetail(store.selectedWorkOrder);
    }
    showToast("↩️ Sailor assignment/reassignment successfully undone!", "success");

  } else if (undo.type === "EDIT_WORK_ORDER") {
    const { woKey, woSnapshot, dailyAllocationsSnapshot } = undo;
    const wo = store.workOrders.find(
      (w) => String(w._fbKey) === String(woKey) || String(w.id) === String(woKey),
    );
    if (wo && woSnapshot) {
      _isRestoringUndo = true;
      Object.assign(wo, JSON.parse(JSON.stringify(woSnapshot)));
      if (window.fbSaveWorkOrder) fbSaveWorkOrder(wo);

      if (dailyAllocationsSnapshot !== undefined) {
        const currentTodayAllocs = (store.dailyAllocations || []).filter(
          (a) => a.date === today && String(a.work_order_id) === String(wo.id),
        );
        currentTodayAllocs.forEach((a) => {
          opsDB
            .ref(`daily_allocations/${today}_${sanitizeFbKey(a.sailor_id)}`)
            .remove()
            .catch((e) => console.warn(e));
        });
        (dailyAllocationsSnapshot || []).forEach((a) => {
          opsDB
            .ref(`daily_allocations/${today}_${sanitizeFbKey(a.sailor_id)}`)
            .set(a)
            .catch((e) => console.warn(e));
        });
      }

      const modal = document.getElementById("workOrderDetailModal");
      if (modal && !modal.classList.contains("hidden")) {
        openWorkOrderDetail(woKey);
      }
      _isRestoringUndo = false;
      refreshCurrentViewImmediately();
      renderZoneSelectors();
      showToast("↩️ Work Order changes successfully undone!", "success");
    }
  } else if (undo.type === "CREATE_WORK_ORDER") {
    const { fbKey, jobCardFbKey, assignedSailors } = undo;
    if (fbKey) {
      opsDB.ref(`work_orders/${fbKey}`).remove();
    }
    if (jobCardFbKey) {
      opsDB.ref(`job_cards/${jobCardFbKey}`).remove();
    }
    if (assignedSailors && assignedSailors.length > 0 && store.sailors) {
      assignedSailors.forEach((sid) => {
        const s = store.sailors.find(
          (x) => String(x.id) === String(sid) || String(x._fbKey) === String(sid),
        );
        if (s && s.status === "Assigned") {
          s.status = "Available";
        }
      });
    }
    refreshCurrentViewImmediately();
    showToast("↩️ Work Order creation successfully undone!", "success");
  }
}

function markWoChangesUnsaved() {
  const btn = document.getElementById("btnSaveWoChanges");
  if (!btn) return;
  btn.className = "flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ring-2 ring-indigo-300 animate-pulse";
  btn.innerHTML = "<span>💾</span> Save Changes";
}

function markWoChangesSaved() {
  const btn = document.getElementById("btnSaveWoChanges");
  if (!btn) return;
  btn.className = "flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer";
  btn.innerHTML = "<span>✓</span> Saved";
}

function saveWorkOrderChanges(autoClose = true, syncWoToFirebase = true) {
  const shouldClose = typeof autoClose === "boolean" ? autoClose : true;
  const shouldSyncFb = typeof syncWoToFirebase === "boolean" ? syncWoToFirebase : true;
  const btn = document.getElementById("btnSaveWoChanges");
  if (btn) {
    if (btn.disabled) return;
    btn.disabled = true;
    btn.innerHTML = "Saving...";
  }

  const woKey = store.selectedWorkOrder;
  const wo = store.workOrders.find(
    (w) => String(w._fbKey) === String(woKey) || String(w.id) === String(woKey),
  );
  if (!wo) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = "<span>💾</span> Save Changes";
    }
    return;
  }
  if (wo) {
    const newStatus = document.getElementById("woDetailStatus").value;
    wo.status = newStatus;
    wo.priority = document.getElementById("woDetailPriority").value;
    wo.description =
      document.getElementById("woDetailDescription").value || wo.description;
    wo.authority_approval = document.getElementById("woDetailAuthority").value;
    const parsedBudget = parseFloat(document.getElementById("woDetailBudget").value);
    wo.budget_allocation = !isNaN(parsedBudget) ? parsedBudget : (wo.budget_allocation || null);
    
    const parsedDuration = parseInt(document.getElementById("woDetailDuration").value);
    wo.estimated_duration = !isNaN(parsedDuration) ? parsedDuration : (wo.estimated_duration || null);
    wo.progress = parseInt(document.getElementById("woDetailProgress").value);
    wo.incharge = document.getElementById("woDetailIncharge").value || null;
    wo.supervisor = document.getElementById("woDetailSupervisor").value || null;
    wo.project_artificer =
      document.getElementById("woDetailArtificer").value || null; // Sync status to the linked Job Card
    const jc = getJobCardForWorkOrder(wo._fbKey || wo.id);
    if (jc) {
      jc.status = wo.status;
    } 
    
    // Clear today's daily allocations and free up sailors if putting on hold/completed/cancelled
    if (
      newStatus === "Hold" ||
      newStatus === "Completed" ||
      newStatus === "Cancelled"
    ) {
      const today = getLocalDateString();
      const woIdStr = String(wo.id);
      const woFbKeyStr = String(wo._fbKey || "");
      
      const assignedIds = (wo.assigned || []).map(String);
      (store.dailyAllocations || []).forEach((a) => {
        if (a.date === today && (String(a.work_order_id) === woIdStr || String(a.work_order_id) === woFbKeyStr)) {
          if (a.sailor_id) assignedIds.push(String(a.sailor_id));
        }
      });

      // Free sailors in memory
      if (store.sailors && assignedIds.length > 0) {
        store.sailors.forEach((s) => {
          if (assignedIds.includes(String(s.id)) || assignedIds.includes(String(s._fbKey))) {
            if (s.status === "Assigned") s.status = "Available";
          }
        });
      }

      // Remove from daily allocations memory and Firebase
      const allocationsToDelete = (store.dailyAllocations || []).filter(
        (a) => a.date === today && (String(a.work_order_id) === woIdStr || String(a.work_order_id) === woFbKeyStr),
      );
      store.dailyAllocations = (store.dailyAllocations || []).filter(
        (a) => !(a.date === today && (String(a.work_order_id) === woIdStr || String(a.work_order_id) === woFbKeyStr)),
      );

      allocationsToDelete.forEach((a) => {
        opsDB
          .ref(`daily_allocations/${today}_${sanitizeFbKey(a.sailor_id)}`)
          .remove()
          .catch((e) => console.warn(e));
      });

      // If Hold or Completed or Cancelled, clear assigned, last_assigned, and commit date
      if (newStatus === "Hold" || newStatus === "Completed" || newStatus === "Cancelled") {
        wo.assigned = [];
        wo.last_assigned = [];
        wo.last_committed_date = null;
        wo.user_cleared_crew = true;
        wo._userClearedCrew = true;
        if (wo._fbKey) {
          opsDB.ref(`work_orders/${wo._fbKey}`).update({
            assigned: null,
            last_assigned: null,
            last_committed_date: null,
            user_cleared_crew: true,
            last_assigned_date: today
          });
        }
        if (jc) {
          jc.assigned = [];
          jc.last_assigned = [];
          jc.last_committed_date = null;
          jc.user_cleared_crew = true;
          jc._userClearedCrew = true;
          if (jc._fbKey) {
            opsDB.ref(`job_cards/${jc._fbKey}`).update({
              assigned: null,
              last_assigned: null,
              last_committed_date: null,
              user_cleared_crew: true,
              last_assigned_date: today
            });
          }
        }
      }
    }

    if (jc && window.fbSaveJobCard) {
      fbSaveJobCard(jc);
    }
    if (shouldSyncFb) {
      if (wo._fbKey) {
        const updatePayload = {
          status: wo.status,
          priority: wo.priority,
          description: wo.description,
          authority_approval: wo.authority_approval,
          budget_allocation: wo.budget_allocation,
          estimated_duration: wo.estimated_duration,
          progress: wo.progress,
          incharge: wo.incharge,
          supervisor: wo.supervisor,
          project_artificer: wo.project_artificer,
          assigned: wo.assigned && wo.assigned.length > 0 ? wo.assigned : null
        };
        if (newStatus === "Hold" || newStatus === "Completed" || newStatus === "Cancelled") {
          updatePayload.last_assigned = null;
          updatePayload.last_committed_date = null;
          updatePayload.user_cleared_crew = true;
        }
        opsDB.ref(`work_orders/${wo._fbKey}`).update(updatePayload);
      } else if (window.fbSaveWorkOrder) {
        fbSaveWorkOrder(wo);
      }
    }
    
    markWoChangesSaved();

    if (shouldSyncFb) {
      // Delay closing to prevent mobile double-tap ghost clicks on underlying UI
      setTimeout(() => {
        refreshCurrentViewImmediately();
        renderZoneSelectors(); // Update Zone dropdown percentages
        if (shouldClose) {
          showToast(
            `Work order updated successfully! <button onclick="executeGlobalUndo()" class="ml-2 font-bold underline bg-amber-300 text-slate-900 px-2 py-0.5 rounded text-xs hover:bg-amber-400">↩️ Undo</button>`,
            "success",
            6000
          );
          closeModal("workOrderDetailModal");
        }
      }, 350);
    }
  }
  if (btn) {
    setTimeout(() => {
      btn.disabled = false;
      if (!shouldClose) {
        markWoChangesSaved();
      }
    }, shouldSyncFb ? 400 : 50);
  }
}
function deleteWorkOrder() {
  const woKey = store.selectedWorkOrder;
  if (!woKey) return;
  const wo = store.workOrders.find(
    (w) => String(w._fbKey) === String(woKey) || String(w.id) === String(woKey),
  );
  if (!wo) return;
  if (
    confirm(
      `⚠️ Are you sure you want to delete the work order "${wo.description}"?\n\nThis will permanently remove the work order and its daily labor allocations.`,
    )
  ) {
    const targetFbKey = wo._fbKey;
    if (!targetFbKey) {
      showToast("Cannot delete: Firebase key not found.");
      return;
    } // 1. Remove the work order from Firebase
    opsDB
      .ref(`work_orders/${targetFbKey}`)
      .remove()
      .then(() => {
        // 2. Remove all daily allocations associated with this work order id / reference
        const woIdStr = String(wo.id);
        const allocsToDelete = (store.dailyAllocations || []).filter(
          (a) => String(a.work_order_id) === woIdStr,
        );
        const deletePromises = allocsToDelete.map((a) => {
          if (a._fbKey) {
            return opsDB.ref(`daily_allocations/${a._fbKey}`).remove();
          }
          return Promise.resolve();
        });
        return Promise.all(deletePromises);
      })
      .then(() => {
        closeModal("workOrderDetailModal");
        showToast(`Deleted work order successfully!`);
        refreshCurrentViewImmediately();
      })
      .catch((err) => {
        console.error("Error deleting work order:", err);
        showToast("Failed to delete work order.");
      });
  }
}

function updateWoDetailProgress(value) {
  const val = Math.min(100, Math.max(0, parseInt(value, 10) || 0));
  const progressText = document.getElementById("woDetailProgressText");
  const progressInput = document.getElementById("woDetailProgress");
  const progressBarFill = document.getElementById("woDetailProgressBarFill");
  
  if (progressText) {
    progressText.textContent = `${val}%`;
    if (val === 100) {
      progressText.className = "text-sm font-extrabold text-emerald-600 font-mono bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-lg shadow-2xs";
    } else if (val >= 75) {
      progressText.className = "text-sm font-bold text-teal-700 font-mono bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-lg shadow-2xs";
    } else if (val >= 50) {
      progressText.className = "text-sm font-bold text-blue-700 font-mono bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg shadow-2xs";
    } else {
      progressText.className = "text-sm font-bold text-slate-700 font-mono bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-lg shadow-2xs";
    }
  }
  
  if (progressBarFill) {
    progressBarFill.style.width = `${val}%`;
    if (val === 100) {
      progressBarFill.className = "h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-150 relative shadow-sm";
    } else if (val >= 50) {
      progressBarFill.className = "h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-150 relative shadow-sm";
    } else {
      progressBarFill.className = "h-full bg-gradient-to-r from-amber-500 to-teal-500 rounded-full transition-all duration-150 relative shadow-sm";
    }
  }

  if (progressInput) {
    if (String(progressInput.value) !== String(val)) {
      progressInput.value = val;
    }
    const isDark = Boolean(document.documentElement && document.documentElement.classList.contains("dark"));
    const emptyTrack = isDark ? "#334155" : "#e2e8f0";
    let startColor = "#0d9488";
    let endColor = "#10b981";
    if (val === 100) {
      startColor = "#059669";
      endColor = "#10b981";
    } else if (val <= 25) {
      startColor = "#f59e0b";
      endColor = "#0d9488";
    }
    progressInput.style.background = `linear-gradient(to right, ${startColor} 0%, ${endColor} ${val}%, ${emptyTrack} ${val}%, ${emptyTrack} 100%)`;
  }

  if (typeof toggleCompleteButton === "function") {
    toggleCompleteButton(val);
  }
  if (typeof markWoChangesUnsaved === "function") {
    markWoChangesUnsaved();
  }
}

function toggleCompleteButton(progress) {
  const btn = document.getElementById("btnForwardComplete");
  const btnProceed = document.getElementById("btnProceedWo");
  if (btn && btnProceed) {
    if (parseInt(progress) === 100) {
      btn.classList.remove("hidden");
      btnProceed.classList.add("hidden");
    } else {
      btn.classList.add("hidden");
      btnProceed.classList.remove("hidden");
    }
  }
}
function forwardToComplete() {
  const woKey = store.selectedWorkOrder;
  const wo = store.workOrders.find(
    (w) => String(w._fbKey) === String(woKey) || String(w.id) === String(woKey),
  );
  if (wo) {
    const today = getLocalDateString(); // Collect currently assigned sailors to free them up locally
    const assignedIds = (wo.assigned || []).map(String); // Auto-commit crew to daily allocations for today before clearing them
    if (assignedIds.length > 0) {
      assignedIds.forEach((sid) => {
        const sailor = store.sailors.find(
          (s) =>
            String(s.id) === String(sid) || String(s._fbKey) === String(sid),
        );
        const alreadyAllocated = (store.dailyAllocations || []).some(
          (a) =>
            a.date === today &&
            String(a.sailor_id) === String(sid) &&
            String(a.work_order_id) === String(wo.id),
        );
        if (!alreadyAllocated) {
          store.dailyAllocations = (store.dailyAllocations || []).filter(
            (a) => !(a.date === today && a.sailor_id === sid),
          );
          const alloc = {
            id: (store.dailyAllocations || []).length + 1,
            date: today,
            sailor_id: sid,
            work_order_id: wo.id,
            role_today:
              sailor && sailor.id == wo.supervisor
                ? "Supervisor"
                : sailor && sailor.id == wo.incharge
                  ? "In-Charge"
                  : "Worker",
            assigned_by:
              store.currentUser && store.currentUser.name
                ? store.currentUser.name
                : "Officer",
            status: "Active",
          };
          if (!store.dailyAllocations) store.dailyAllocations = [];
          store.dailyAllocations.push(alloc);
          opsDB
            .ref(`daily_allocations/${today}_${sanitizeFbKey(sid)}`)
            .set(alloc);
        }
      });
    }
    wo.completed_date = today;
    wo.status = "Completed";
    wo.progress = 100;
    wo.assigned = []; // Remove sailors from work order
    // Reset status for these sailors in the local store
    if (store.sailors) {
      store.sailors.forEach((s) => {
        if (
          assignedIds.includes(String(s.id)) ||
          assignedIds.includes(String(s._fbKey))
        ) {
          if (s.status === "Assigned") {
            s.status = "Available";
          }
        }
      });
    } // Sync to Job Card
    const jc = getJobCardForWorkOrder(wo._fbKey || wo.id);
    if (jc) {
      jc.status = "Completed";
      jc.assigned = []; // Remove sailors from job card
      if (window.fbSaveJobCard) fbSaveJobCard(jc);
    }
    if (wo._fbKey) {
      opsDB.ref(`work_orders/${wo._fbKey}`).update({
        status: "Completed",
        progress: 100,
        completed_date: today,
        assigned: null
      });
    } else if (window.fbSaveWorkOrder) {
      fbSaveWorkOrder(wo);
    }
    
    // Delay closing to prevent mobile double-tap ghost clicks on underlying UI
    setTimeout(() => {
      closeModal("workOrderDetailModal");
      showToast("Moved to Recently Completed!"); // Update dashboard UI to hide it
      renderDashboard(); // Switch to Job Cards view and Completed tab
      switchView("jobcards");
      switchJobCardsTab("completed");
    }, 300);
  }
} // Proceed button (req 2): commit daily labour allocation -> dashboard + DB
function proceedWorkOrder() {
  const btn = document.getElementById("btnProceedWo");
  if (btn) {
    if (btn.disabled) return;
    btn.disabled = true;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `<span class="inline-block animate-spin mr-1.5">⏳</span> Proceeding...`;
    btn.classList.add("opacity-75", "scale-[0.98]");
  }

  const woKey = store.selectedWorkOrder;
  const wo = store.workOrders.find(
    (w) => String(w._fbKey) === String(woKey) || String(w.id) === String(woKey),
  );
  if (!wo) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.originalText || "🚀 Proceed - Commit Daily Labour";
      btn.classList.remove("opacity-75", "scale-[0.98]");
    }
    return;
  }

  // Save pending edits in-memory/JC without duplicate Work Order network roundtrip
  saveWorkOrderChanges(false, false);

  const today = getLocalDateString();

  // ── GATHER & RESOLVE ALL ASSIGNED SAILORS (ALL SOURCES) ──
  let assignedSailorIds = [];

  // A) From wo.assigned (array or object)
  if (Array.isArray(wo.assigned)) {
    assignedSailorIds = wo.assigned.map(String).filter(Boolean);
  } else if (wo.assigned && typeof wo.assigned === "object") {
    assignedSailorIds = Object.values(wo.assigned).map(String).filter(Boolean);
  }

  // B) From getWorkOrderAssignedSailors (detects dailyAllocations, etc.)
  const { sailors: currentCrew } = getWorkOrderAssignedSailors(wo, today);
  if (currentCrew && currentCrew.length > 0) {
    currentCrew.forEach((s) => {
      const sid = String(s.id !== undefined && s.id !== null ? s.id : s._fbKey);
      if (sid && !assignedSailorIds.includes(sid)) {
        assignedSailorIds.push(sid);
      }
    });
  }

  // C) From store.dailyAllocations directly for today
  const woIdStr = String(wo.id || "");
  const woFbKeyStr = String(wo._fbKey || "");
  (store.dailyAllocations || []).forEach((a) => {
    if (a && a.date === today && a.status !== "Cancelled") {
      const aWoId = String(a.work_order_id || a.workOrderId || a.work_order || a.wo_id || "");
      if ((woIdStr && aWoId === woIdStr) || (woFbKeyStr && aWoId === woFbKeyStr)) {
        const sid = String(a.sailor_id || a.sailorId || "");
        if (sid && !assignedSailorIds.includes(sid)) {
          assignedSailorIds.push(sid);
        }
      }
    }
  });

  // D) From linked Job Card if present
  const jc = getJobCardForWorkOrder(wo._fbKey || wo.id);
  if (jc && jc.assigned) {
    const jcList = Array.isArray(jc.assigned) ? jc.assigned : Object.values(jc.assigned);
    jcList.forEach((sid) => {
      const sStr = String(sid);
      if (sStr && !assignedSailorIds.includes(sStr)) {
        assignedSailorIds.push(sStr);
      }
    });
  }

  // E) Auto-restore previous crew if still empty and last_assigned exists
  if (
    assignedSailorIds.length === 0 &&
    wo.last_assigned &&
    (Array.isArray(wo.last_assigned) ? wo.last_assigned.length > 0 : Object.keys(wo.last_assigned).length > 0)
  ) {
    const lastList = Array.isArray(wo.last_assigned) ? wo.last_assigned : Object.values(wo.last_assigned);
    assignedSailorIds = lastList.map(String).filter(Boolean);
    if (assignedSailorIds.length > 0) {
      showToast(`Auto-restored last active crew (${assignedSailorIds.length} sailors)`);
    }
  }

  // Put resolved sailors into wo.assigned
  wo.assigned = assignedSailorIds;

  // Mark all resolved sailors as Assigned in store memory
  if (store.sailors && wo.assigned.length > 0) {
    wo.assigned.forEach((sid) => {
      const s = typeof findSailorById === "function" ? findSailorById(sid) : store.sailors.find(
        (x) => String(x.id) === String(sid) || String(x._fbKey) === String(sid),
      );
      if (s) {
        s.status = "Assigned";
        s.evaluated = false;
      }
    });
  }

  const hasAssigned = wo.assigned.length > 0;

  // Update the work order state
  if (wo.status !== "Hold" && wo.status !== "Completed") {
    wo.status = "Active";
  }
  wo.last_commit_date = today;
  wo.last_committed_date = today;
  if (hasAssigned) {
    wo.last_assigned = [...wo.assigned];
    wo.last_assigned_date = today;
  }

  // Single consolidated Firebase write for Work Order
  if (wo._fbKey) {
    opsDB.ref(`work_orders/${wo._fbKey}`).update({
      status: wo.status,
      priority: wo.priority,
      description: wo.description,
      authority_approval: wo.authority_approval,
      budget_allocation: wo.budget_allocation,
      estimated_duration: wo.estimated_duration,
      progress: wo.progress,
      incharge: wo.incharge,
      supervisor: wo.supervisor,
      project_artificer: wo.project_artificer,
      last_commit_date: today,
      last_committed_date: today,
      last_assigned: hasAssigned ? [...wo.assigned] : (wo.last_assigned || null),
      last_assigned_date: hasAssigned ? today : (wo.last_assigned_date || null),
      assigned: hasAssigned ? wo.assigned : null,
    });
  } else if (window.fbSaveWorkOrder) {
    fbSaveWorkOrder(wo);
  }

  // Update daily allocations in memory and Firebase if sailors are assigned
  if (hasAssigned) {
    wo.assigned.forEach((sid) => {
      const sailor = typeof findSailorById === "function" ? findSailorById(sid) : store.sailors.find(
        (s) => String(s.id) === String(sid) || String(s._fbKey) === String(sid),
      );
      // remove existing same-day allocation for this sailor (one job per day)
      store.dailyAllocations = (store.dailyAllocations || []).filter(
        (a) => !(a.date === today && (sailor ? isSailorMatchingKeys(sailor, [a.sailor_id, a.official_number]) : String(a.sailor_id) === String(sid))),
      );
      const sidToStore = sailor ? (sailor.id || sailor._fbKey || sid) : sid;
      const alloc = {
        id: (store.dailyAllocations || []).length + 1,
        date: today,
        sailor_id: sidToStore,
        official_number: sailor ? (sailor.official_number || sailor.service_no || "") : "",
        work_order_id: wo.id || wo._fbKey,
        role_today:
          sailor && sailor.id == wo.supervisor
            ? "Supervisor"
            : sailor && sailor.id == wo.incharge
              ? "In-Charge"
              : "Worker",
        assigned_by:
          store.currentUser && store.currentUser.name
            ? store.currentUser.name
            : "Officer",
        status: "Active",
      };
      store.dailyAllocations.push(alloc);
      if (sailor) {
        sailor.status = "Assigned";
        sailor.evaluated = false;
      }
      opsDB
        .ref(`daily_allocations/${today}_${sanitizeFbKey(sidToStore)}`)
        .set(alloc);
    });
  }

  // Rapid modal closing (reduced to 50ms) for snappy response
  setTimeout(() => {
    closeModal("workOrderDetailModal");
    refreshCurrentViewImmediately();
    const successMsg = hasAssigned
      ? `✅ ${wo.assigned.length} sailor(s) committed to "${wo.description.substring(0, 24)}…"`
      : `✅ "${wo.description.substring(0, 24)}…" proceeded to Active! (No sailors assigned yet)`;
    showToast(
      `${successMsg} <button onclick="executeGlobalUndo()" class="ml-2 font-bold underline bg-amber-300 text-slate-900 px-2 py-0.5 rounded text-xs hover:bg-amber-400">↩️ Undo</button>`,
      "success",
      6000
    );
  }, 50);

  if (btn) {
    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.originalText || (hasAssigned ? "🚀 Proceed - Commit Daily Labour" : "🚀 Proceed - Mark Active");
      btn.classList.remove("opacity-75", "scale-[0.98]");
    }, 400);
  }
}
function restorePreviousCrew() {
  const woKey = store.selectedWorkOrder;
  const wo = store.workOrders.find(
    (w) => String(w._fbKey) === String(woKey) || String(w.id) === String(woKey),
  );
  if (wo && wo.last_assigned && wo.last_assigned.length > 0) {
    const today = getLocalDateString();
    wo.assigned = [...wo.last_assigned];
    wo.last_assigned_date = today; // Mark sailors as Assigned locally
    if (store.sailors) {
      wo.assigned.forEach((sid) => {
        const s = store.sailors.find(
          (x) =>
            String(x.id) === String(sid) || String(x._fbKey) === String(sid),
        );
        if (s) {
          s.status = "Assigned";
          s.evaluated = false;
        }
      });
    }
    if (window.fbSaveWorkOrder) {
      fbSaveWorkOrder(wo);
    }
    showToast(`Restored ${wo.assigned.length} sailor(s) from last crew`);
    openWorkOrderDetail(woKey);
  }
}
function toggleEvaluationMode() {
  showToast("Open any work order and use the Daily Evaluation tab", "info");
} // =============================================
// EVALUATION
// =============================================
function openEvaluationModal(sailorId, workOrderId) {
  var _sailor$yesterdayScor;
  const sailor = store.sailors.find(
    (s) =>
      String(s.id) === String(sailorId) ||
      String(s._fbKey) === String(sailorId),
  );
  const wo = store.workOrders.find(
    (w) =>
      String(w.id) === String(workOrderId) ||
      String(w._fbKey) === String(workOrderId),
  );
  if (!sailor || !wo) return;
  document.getElementById("evalSailorId").value = sailorId;
  document.getElementById("evalWorkOrderId").value = workOrderId;
  document.getElementById("evalSailorName").textContent = sailor.name;
  document.getElementById("evalSailorInitial").textContent = sailor.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
  document.getElementById("evalWorkOrder").textContent = wo.description;
  document.getElementById("evalAvgScore").textContent =
    sailor.avgScore.toFixed(1);
  document.getElementById("evalYestScore").textContent =
    ((_sailor$yesterdayScor = sailor.yesterdayScore) === null ||
    _sailor$yesterdayScor === void 0
      ? void 0
      : _sailor$yesterdayScor.toFixed(1)) || "-"; // Reset sliders
  // Reset 3 combined sliders
  [
    "qualitySkill",
    "attitudeDiscipline",
    "efficiencyMaterial",
  ].forEach((type) => {
    const elScore = document.getElementById(`${type}Score`);
    const elVal = document.getElementById(`${type}Value`);
    if (elScore) elScore.value = 5;
    if (elVal) elVal.textContent = 5;
  });
  document.getElementById("evaluationModal").classList.remove("hidden");
}
function updateSlider(type) {
  const value = document.getElementById(`${type}Score`).value;
  const display = document.getElementById(`${type}Value`);
  display.textContent = value;
  if (value <= 3) display.className = "text-lg font-bold text-red-600";
  else if (value <= 6) display.className = "text-lg font-bold text-amber-600";
  else display.className = "text-lg font-bold text-green-600"; // Check for special scores
  const allScores = [
    "qualitySkill",
    "attitudeDiscipline",
    "efficiencyMaterial",
  ].map((t) => {
    const el = document.getElementById(`${t}Score`);
    return el ? parseInt(el.value) || 5 : 5;
  });
  const has1 = allScores.includes(1);
  const has2 = allScores.includes(2);
  const has10 = allScores.includes(10);
  document
    .getElementById("specialScoreReasons")
    .classList.toggle("hidden", !has1 && !has2 && !has10);
  document.getElementById("score1Box").classList.toggle("hidden", !has1);
  document.getElementById("score2Box").classList.toggle("hidden", !has2);
  document.getElementById("score10Box").classList.toggle("hidden", !has10);
}
function submitEvaluation(event) {
  event.preventDefault();
  const scores = [
    "qualitySkill",
    "attitudeDiscipline",
    "efficiencyMaterial",
  ].map((t) => {
    const el = document.getElementById(`${t}Score`);
    return el ? parseInt(el.value) || 5 : 5;
  }); // Validate required reasons
  if (scores.includes(1) && !document.getElementById("score1Reason").value) {
    showToast("Reason required for score 1", "error");
    return;
  }
  if (scores.includes(2) && !document.getElementById("score2Reason").value) {
    showToast("Reason required for score 2", "error");
    return;
  }
  if (scores.includes(10) && !document.getElementById("score10Reason").value) {
    showToast("Reason required for score 10", "error");
    return;
  }
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const sailorId = document.getElementById("evalSailorId").value;
  const sailor = store.sailors.find(
    (s) =>
      String(s.id) === String(sailorId) ||
      String(s._fbKey) === String(sailorId),
  );
  if (sailor) {
    sailor.yesterdayScore = avgScore;
    sailor.avgScore = (sailor.avgScore * 10 + avgScore) / 11; // Rolling average
    sailor.evaluated = true; // Save evaluation to local daily_allocations in Operations DB (failsafe + support history dates)
    const today = getLocalDateString();
    const dateVal = store.dashboardDate || today;
    const allocKey = `${dateVal}_${sanitizeFbKey(sailor.id)}`;
    const allocKeyFb = `${dateVal}_${sanitizeFbKey(sailor._fbKey)}`;
    let actualKey = allocKey;
    if (store.dailyAllocationsMap) {
      if (store.dailyAllocationsMap[allocKeyFb]) {
        actualKey = allocKeyFb;
      }
    }
    opsDB
      .ref(`daily_allocations/${actualKey}`)
      .update({
        date: dateVal,
        sailor_id: sailor.id,
        work_order_id: store.selectedWorkOrder || "",
        evaluated: true,
        score: avgScore,
      })
      .catch((e) =>
        console.warn("Could not save evaluation to Operations DB:", e),
      ); // Persist to sailorsDB as secondary best-effort
    if (typeof sailorsDB !== "undefined") {
      sailorsDB
        .ref("sailors/" + (sailor._fbKey || sailor.id))
        .update({
          yesterdayScore: sailor.yesterdayScore,
          avgScore: sailor.avgScore,
          evaluated: sailor.evaluated,
        })
        .catch((e) =>
          console.warn("Could not save sailor evaluation to DB:", e),
        );
    }
  }
  closeModal("evaluationModal");
  if (store.selectedWorkOrder) {
    openWorkOrderDetail(store.selectedWorkOrder);
    switchWoTab("evaluation");
  }
  updatePendingEvals();
  if (typeof renderSundayEvaluationList === "function") renderSundayEvaluationList();
  if (typeof updateSundayEvaluationBadge === "function") updateSundayEvaluationBadge();
  showToast(`Evaluation submitted! Score: ${avgScore.toFixed(1)}/10`);
}
// =============================================
// WORK ORDERS MODULE WINDOW EXPORTS
// =============================================
if (typeof window !== "undefined") {
  window.openNewWorkOrderModal = openNewWorkOrderModal;
  window.isWorkshopZone = isWorkshopZone;
  window.handleWoTypeChange = handleWoTypeChange;
  window.populateApprovedProjectsDropdown = populateApprovedProjectsDropdown;
  window.autofillFromApprovedProject = autofillFromApprovedProject;
  window.autofillFromEstimate = autofillFromEstimate;
  window.renderWoSailorChips = renderWoSailorChips;
  window.toggleWoSailor = toggleWoSailor;
  window.filterWoSailors = filterWoSailors;
  window.filterWoTrade = filterWoTrade;
  window.selectApprovedJob = selectApprovedJob;
  window.createWorkOrder = createWorkOrder;
  window.openNewAssignModal = openNewAssignModal;
  window.renderAsSailorChips = renderAsSailorChips;
  window.updateAsPreview = updateAsPreview;
  window.toggleAsSailor = toggleAsSailor;
  window.filterAsSailors = filterAsSailors;
  window.filterAsTrade = filterAsTrade;
  window.createAssignment = createAssignment;
  window.getJobCardForWorkOrder = getJobCardForWorkOrder;
  window.computeJobCardCost = computeJobCardCost;
  window.switchWoTab = switchWoTab;
  window.openWorkOrderDetail = openWorkOrderDetail;
  window.toggleWoTypeMigrationControls = toggleWoTypeMigrationControls;
  window.handleWoDetailTargetTypeChange = handleWoDetailTargetTypeChange;
  window.quickMigrateCurrentWoToAssign = quickMigrateCurrentWoToAssign;
  window.quickMigrateCurrentWoToProject = quickMigrateCurrentWoToProject;
  window.applyWorkOrderTypeMigration = applyWorkOrderTypeMigration;
  window.migrateWorkOrderType = migrateWorkOrderType;
  window.openWorkOrderMigrationModal = openWorkOrderMigrationModal;
  window.renderMigrationWorkOrdersList = renderMigrationWorkOrdersList;
  window.toggleMigrationWoSelection = toggleMigrationWoSelection;
  window.toggleSelectAllMigrationWorkOrders = toggleSelectAllMigrationWorkOrders;
  window.updateMigrationSelectedCount = updateMigrationSelectedCount;
  window.handleMigTargetTypeChange = handleMigTargetTypeChange;
  window.executeBatchWorkOrderMigration = executeBatchWorkOrderMigration;
  window.toggleWoOfficerForwardPanel = toggleWoOfficerForwardPanel;
  window.submitForwardWorkOrderToOfficer = submitForwardWorkOrderToOfficer;
  window.officerApproveCurrentWorkOrder = officerApproveCurrentWorkOrder;
  window.officerRequestChangesForCurrentWorkOrder = officerRequestChangesForCurrentWorkOrder;
  window.forwardCurrentJobCardToOfficer = forwardCurrentJobCardToOfficer;
  window.officerAuthorizeJobCardAndSendLmd = officerAuthorizeJobCardAndSendLmd;
  window.officerVerifyInventoryAdjustment = officerVerifyInventoryAdjustment;
  window.officerApproveEstimate = officerApproveEstimate;
  window.officerRejectEstimate = officerRejectEstimate;
  window.openOfficerApprovalsHubModal = openOfficerApprovalsHubModal;
  window.switchOfficerHubTab = switchOfficerHubTab;
  window.updateGlobalOfficerHubBadge = updateGlobalOfficerHubBadge;
  window.renderOfficerHubContent = renderOfficerHubContent;
  window.officerApproveWorkOrderById = officerApproveWorkOrderById;
  window.officerAuthorizeJobCardById = officerAuthorizeJobCardById;
  window.openJobCardForTask = openJobCardForTask;
  window.filterDetailTrade = filterDetailTrade;
  window.filterDetailSailors = filterDetailSailors;
  window.renderDetailSailorChips = renderDetailSailorChips;
  window.assignSingleLabor = assignSingleLabor;
  window.updateWorkOrderStatus = updateWorkOrderStatus;
  window.undoWorkOrderEdits = undoWorkOrderEdits;
  window.undoCreateWorkOrder = undoCreateWorkOrder;
  window.executeGlobalUndo = executeGlobalUndo;
  window.markWoChangesUnsaved = markWoChangesUnsaved;
  window.markWoChangesSaved = markWoChangesSaved;
  window.saveWorkOrderChanges = saveWorkOrderChanges;
  window.deleteWorkOrder = deleteWorkOrder;
  window.updateWoDetailProgress = updateWoDetailProgress;
  window.toggleCompleteButton = toggleCompleteButton;
  window.forwardToComplete = forwardToComplete;
  window.proceedWorkOrder = proceedWorkOrder;
  window.restorePreviousCrew = restorePreviousCrew;
  window.toggleEvaluationMode = toggleEvaluationMode;
  window.openEvaluationModal = openEvaluationModal;
  window.updateSlider = updateSlider;
  window.submitEvaluation = submitEvaluation;
}

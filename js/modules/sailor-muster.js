// ============================================================================
// CMSys Module: Sailor Directory, Live Muster Roll, Leave & Performance Center
// File: js/modules/sailor-muster.js
// ============================================================================

// SAILOR DIRECTORY, POINTS & LEAVE TRACKING IMPLEMENTATION
// =============================================================================
store.directoryTradeFilter = "ALL"; // Calculate Sailor points based on average score, allocations, and completed jobs
function calculateSailorPoints(sailor) {
  // 10 pts per unit of average performance score (baseline)
  const scoreBase = parseFloat(sailor.avgScore || 7.0) * 10; // Count how many daily allocations they have been part of (5 pts per duty allocation day)
  const allocationsCount = (store.dailyAllocations || []).filter(
    (a) =>
      String(a.sailor_id) === String(sailor.id) ||
      String(a.sailor_id) === String(sailor._fbKey),
  ).length;
  const allocationPoints = allocationsCount * 5; // Count how many completed job cards they have been part of (15 pts per project participation)
  const completedJobsCount = (store.jobCards || []).filter(
    (jc) =>
      jc.status === "Completed" &&
      (jc.assigned || []).some(
        (id) =>
          String(id) === String(sailor.id) ||
          String(id) === String(sailor._fbKey),
      ),
  ).length;
  const jobPoints = completedJobsCount * 15;
  return Math.round(scoreBase + allocationPoints + jobPoints);
} // Calculate Sailor points based on average score, allocations, and completed jobs within the last 30 days
function calculateSailorPointsPast30Days(sailor) {
  // 10 pts per unit of average performance score (baseline)
  const scoreBase = parseFloat(sailor.avgScore || 7.0) * 10; // Calculate 30 days ago date string (YYYY-MM-DD)
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const limitDateStr = thirtyDaysAgo.toISOString().split("T")[0]; // Count how many daily allocations they have been part of in the last 30 days (5 pts per duty allocation day)
  const allocationsCount = (store.dailyAllocations || []).filter((a) => {
    if (
      String(a.sailor_id) !== String(sailor.id) &&
      String(a.sailor_id) !== String(sailor._fbKey)
    ) {
      return false;
    }
    return a.date && a.date >= limitDateStr;
  }).length;
  const allocationPoints = allocationsCount * 5; // Count how many completed job cards they have been part of in the last 30 days (15 pts per project participation)
  const completedJobsCount = (store.jobCards || []).filter((jc) => {
    if (jc.status !== "Completed") return false;
    if (
      !(jc.assigned || []).some(
        (id) =>
          String(id) === String(sailor.id) ||
          String(id) === String(sailor._fbKey),
      )
    ) {
      return false;
    }
    const compDateStr =
      jc.completed_date || jc.last_commit_date || jc.last_assigned_date;
    return compDateStr && compDateStr >= limitDateStr;
  }).length;
  const jobPoints = completedJobsCount * 15;
  return Math.round(scoreBase + allocationPoints + jobPoints);
} // Calculate Sailor leave eligibility (1 leave day per 10 points)
function calculateSailorLeaveDays(sailor) {
  const pts = calculateSailorPoints(sailor);
  return Math.max(0, Math.floor(pts / 10));
}

// =============================================
// SAILOR OPERATIONS & PERFORMANCE CENTER
// =============================================
store.sailorDirectoryViewMode = store.sailorDirectoryViewMode || "table";
store.sailorTableSortField = store.sailorTableSortField || "perf";
store.sailorTableSortAsc = false;
store.sailorSection = store.sailorSection || "details";

window.LEAVE_STATUS_CHIPS = (typeof window.LEAVE_STATUS_CHIPS !== "undefined") ? window.LEAVE_STATUS_CHIPS : [
  { val: "L", lbl: "Leave (L)", border: "border-indigo-500", bg: "bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400" },
  { val: "DL", lbl: "Days Leave", border: "border-indigo-500", bg: "bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400" },
  { val: "WE", lbl: "Weekend", border: "border-teal-500", bg: "bg-teal-500/10", text: "text-teal-600 dark:text-teal-400" },
  { val: "HD", lbl: "Half Day", border: "border-sky-500", bg: "bg-sky-500/10", text: "text-sky-600 dark:text-sky-400" },
  { val: "SICK", lbl: "Sick", border: "border-rose-500", bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400" },
  { val: "S/R", lbl: "Sick Report", border: "border-rose-500", bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400" },
  { val: "SL", lbl: "Sick Leave", border: "border-purple-500", bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400" },
  { val: "SIQ", lbl: "SIQ", border: "border-purple-500", bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400" },
  { val: "MED", lbl: "Medical", border: "border-rose-500", bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400" },
  { val: "NGH", lbl: "NGH", border: "border-pink-500", bg: "bg-pink-500/10", text: "text-pink-600 dark:text-pink-400" },
  { val: "ADM", lbl: "Admit", border: "border-red-600", bg: "bg-red-600/10", text: "text-red-600 dark:text-red-400" },
  { val: "R", lbl: "Run (R)", border: "border-red-600", bg: "bg-red-600/10", text: "text-red-600 dark:text-red-400" },
  { val: "X", lbl: "Reset/Clear", border: "border-slate-400", bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-400" }
];

function switchSailorSection(sec) {
  store.sailorSection = sec;
  const secDetails = document.getElementById("sailorsSectionDetails");
  const secPerf = document.getElementById("sailorsSectionPerf");
  const secLeave = document.getElementById("sailorsSectionLeave");
  const btnDetails = document.getElementById("btnSailorsSecDetails");
  const btnPerf = document.getElementById("btnSailorsSecPerf");
  const btnLeave = document.getElementById("btnSailorsSecLeave");

  const activeBtnCls = "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-teal-600 text-slate-800 dark:text-white shadow-sm border border-slate-200/70 dark:border-teal-500/40 transition-all";
  const inactiveBtnCls = "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all";

  if (sec === "leave") {
    if (secDetails) secDetails.classList.add("hidden");
    if (secPerf) secPerf.classList.add("hidden");
    if (secLeave) secLeave.classList.remove("hidden");
    if (btnDetails) btnDetails.className = inactiveBtnCls;
    if (btnPerf) btnPerf.className = inactiveBtnCls;
    if (btnLeave) btnLeave.className = activeBtnCls;
    initSailorLeaveSection();
  } else if (sec === "performance") {
    if (secDetails) secDetails.classList.add("hidden");
    if (secPerf) secPerf.classList.remove("hidden");
    if (secLeave) secLeave.classList.add("hidden");
    if (btnDetails) btnDetails.className = inactiveBtnCls;
    if (btnPerf) btnPerf.className = activeBtnCls;
    if (btnLeave) btnLeave.className = inactiveBtnCls;
    renderSailorPerformanceSection();
  } else {
    if (secPerf) secPerf.classList.add("hidden");
    if (secLeave) secLeave.classList.add("hidden");
    if (secDetails) secDetails.classList.remove("hidden");
    if (btnPerf) btnPerf.className = inactiveBtnCls;
    if (btnDetails) btnDetails.className = activeBtnCls;
    if (btnLeave) btnLeave.className = inactiveBtnCls;
    renderSailorsView();
  }
}

// =========================================================================
// SECTION 3: SAILOR LEAVE & SICK MANAGEMENT CONTROLLER
// =========================================================================

store.selectedLeaveType = store.selectedLeaveType || "L";
store.selectedLeaveSailorId = store.selectedLeaveSailorId || null;
store.leaveCalCurrentDate = store.leaveCalCurrentDate || new Date();

function renderLeaveTypeGrid() {
  const container = document.getElementById("leaveTypeGrid");
  if (!container) return;
  const current = store.selectedLeaveType || "L";

  container.innerHTML = LEAVE_STATUS_CHIPS.map(t => {
    const isSelected = (t.val === current);
    const borderCls = isSelected
      ? `border-2 ${t.border} ${t.bg} ${t.text} font-bold shadow-xs ring-2 ring-teal-500/25`
      : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#060e1a] text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/60";

    return `
      <button type="button" onclick="setLeaveType('${t.val}')" class="py-2.5 px-3 rounded-xl text-center transition-all cursor-pointer ${borderCls} flex items-center justify-center gap-1.5 shadow-2xs select-none">
        ${isSelected ? '<span class="text-[10px] leading-none">●</span>' : ''}
        <span class="truncate whitespace-nowrap text-xs font-semibold">${t.lbl}</span>
      </button>
    `;
  }).join("");
}

function setLeaveType(val) {
  store.selectedLeaveType = val;
  renderLeaveTypeGrid();
  checkLeaveDisableLogic();
}

function initSailorLeaveSection() {
  renderLeaveTypeGrid();

  const rdDateInput = document.getElementById("rdReportDateInput");
  if (rdDateInput && !rdDateInput.value) {
    rdDateInput.value = new Date().toISOString().split("T")[0];
  }

  const fromInput = document.getElementById("leaveFromDate");
  if (fromInput && !fromInput.value) {
    fromInput.value = new Date().toISOString().split("T")[0];
  }

  // Preselect a sailor if none is selected yet
  if (!store.selectedLeaveSailorId && store.sailors && store.sailors.length > 0) {
    const firstSailor = store.sailors[0];
    selectSailorForLeave(firstSailor.id || firstSailor._fbKey);
  } else if (store.selectedLeaveSailorId) {
    selectSailorForLeave(store.selectedLeaveSailorId);
  }

  checkLeaveDisableLogic();
}

function handleLeaveSailorSearchKey(e) {
  const query = e.target.value.trim();
  const dropdown = document.getElementById("leaveSailorDropdown");
  if (!dropdown) return;

  if (e.key === "Enter") {
    executeLeaveSailorSearch();
    return;
  }

  if (query.length < 1) {
    dropdown.classList.add("hidden");
    return;
  }

  const q = query.toLowerCase();
  const matches = (store.sailors || []).filter(s => {
    const off = (s.offNo || s.off_no || "").toString().toLowerCase();
    const name = (s.name || "").toLowerCase();
    return off.includes(q) || name.includes(q);
  }).slice(0, 10);

  if (matches.length === 0) {
    dropdown.innerHTML = `<div class="p-3 text-xs text-slate-400 italic">No sailors match "${escapeHtml(query)}"</div>`;
    dropdown.classList.remove("hidden");
    return;
  }

  dropdown.innerHTML = matches.map(s => {
    const sId = s.id || s._fbKey;
    return `
      <div onclick="selectSailorForLeave('${escapeHtml(sId)}')" class="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-between text-xs">
        <div>
          <span class="font-bold text-slate-800 dark:text-white">${escapeHtml(s.rank || '')} ${escapeHtml(s.name || '')}</span>
          <span class="text-teal-600 dark:text-teal-400 font-mono ml-1.5 font-bold">#${escapeHtml(s.offNo || s.off_no || '')}</span>
        </div>
        <span class="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">${escapeHtml(s.trade || 'N/A')}</span>
      </div>
    `;
  }).join("");

  dropdown.classList.remove("hidden");
}

function executeLeaveSailorSearch() {
  const input = document.getElementById("leaveSailorSearchInput");
  if (!input) return;
  const q = input.value.trim().toLowerCase();
  const dropdown = document.getElementById("leaveSailorDropdown");
  if (dropdown) dropdown.classList.add("hidden");

  if (!q) {
    showToast("Please enter an Off No or Name to search", "warning");
    return;
  }

  const matches = (store.sailors || []).filter(s => {
    const off = (s.offNo || s.off_no || "").toString().toLowerCase();
    const name = (s.name || "").toLowerCase();
    return off.includes(q) || name.includes(q);
  });

  if (matches.length === 1) {
    selectSailorForLeave(matches[0].id || matches[0]._fbKey);
  } else if (matches.length > 1) {
    // Exact Off No match priority
    const exact = matches.find(s => (s.offNo || s.off_no || "").toString().toLowerCase() === q);
    if (exact) {
      selectSailorForLeave(exact.id || exact._fbKey);
    } else {
      if (dropdown) {
        dropdown.classList.remove("hidden");
      }
    }
  } else {
    showToast("No sailor found matching '" + input.value + "'", "error");
  }
}

function clearLeaveSailorSearch() {
  const input = document.getElementById("leaveSailorSearchInput");
  if (input) input.value = "";
  const dropdown = document.getElementById("leaveSailorDropdown");
  if (dropdown) dropdown.classList.add("hidden");
}

function selectSailorForLeave(sailorId) {
  const dropdown = document.getElementById("leaveSailorDropdown");
  if (dropdown) dropdown.classList.add("hidden");

  const sailor = (store.sailors || []).find(s => (s.id === sailorId || s._fbKey === sailorId));
  if (!sailor) return;

  store.selectedLeaveSailorId = sailorId;

  // Fill hidden inputs
  const hidId = document.getElementById("leaveSailorId");
  if (hidId) hidId.value = sailorId;

  // Update header and title
  const searchInput = document.getElementById("leaveSailorSearchInput");
  if (searchInput) searchInput.value = sailor.offNo || sailor.off_no || "";

  const titleSpan = document.getElementById("leaveSailorTitleSpan");
  if (titleSpan) titleSpan.textContent = `${sailor.rank || ''} ${sailor.name || ''} (${sailor.offNo || sailor.off_no || ''})`;

  const badge = document.getElementById("leaveSailorBadge");
  const bRank = document.getElementById("leaveSailorBadgeRank");
  const bName = document.getElementById("leaveSailorBadgeName");
  if (badge && bRank && bName) {
    bRank.textContent = sailor.rank || "";
    bName.textContent = sailor.name || "";
    badge.classList.remove("hidden");
    badge.classList.add("flex");
  }

  // Set victualing status radio
  const vType = sailor.victualing_type || "V/In";
  const radios = document.querySelectorAll('input[name="victualing_status"]');
  radios.forEach(r => {
    r.checked = (r.value === vType);
  });

  // Calculate Days in Base
  const calc = calculateDaysInBase(sailorId, sailor);
  renderDaysInBaseBanner(calc);

  // Compile and render recent history
  renderSailorLeaveHistory(sailorId);

  // Render monthly calendar
  renderSailorLeaveCalendar();

  // Recheck disable rules
  checkLeaveDisableLogic();
}

function calculateDaysInBase(sailorId, sailorData) {
  const availability = store.availability || {};
  const allRecords = {};
  const shortLeaves = ['DL', 'WE', 'HD', 'SIQ', 'SICK', 'S/R', 'MED', 'M/C', 'NGH', 'ADM', 'SL'];

  Object.keys(availability).forEach(month => {
    const days = availability[month];
    if (!days || typeof days !== 'object') return;
    Object.keys(days).forEach(day => {
      const statuses = days[day];
      if (statuses && statuses[sailorId]) {
        const dateStr = `${month}-${String(day).padStart(2, '0')}`;
        const dt = new Date(dateStr + "T00:00:00");
        const ts = dt.getTime();
        allRecords[ts] = { status: statuses[sailorId], dateStr };
      }
    });
  });

  const timestamps = Object.keys(allRecords).map(Number).sort((a,b) => a - b);
  const now = new Date();
  now.setHours(0,0,0,0);
  const todayTs = now.getTime();

  let isOnLeave = false;
  let lastValidRdTs = null;
  let lastLeaveTs = null;

  for (const ts of timestamps) {
    if (ts > todayTs) break;
    const { status } = allRecords[ts];
    if (status === 'R/D') {
      isOnLeave = false;
      const prevDayTs = ts - 86400000;
      const prevStatus = allRecords[prevDayTs]?.status;
      if (!shortLeaves.includes(prevStatus)) {
        lastValidRdTs = ts;
        lastLeaveTs = null;
      }
    } else if (status === 'T/D') {
      isOnLeave = true;
    } else {
      if (ts === todayTs) {
        isOnLeave = true;
      }
      if (!shortLeaves.includes(status)) {
        lastLeaveTs = ts;
        lastValidRdTs = null;
      }
    }
  }

  if (isOnLeave && !allRecords[todayTs]) {
    isOnLeave = false;
  }

  const todayMonth = now.toISOString().slice(0, 7);
  const todayDay = now.getDate();
  const todayStatus = availability[todayMonth]?.[todayDay]?.[sailorId];

  if (isOnLeave) {
    return {
      status: "ON_LEAVE",
      leaveStatus: todayStatus || "Leave / Out",
      isMedical: ['SIQ', 'ADM', 'SL', 'R', 'S/R', 'SICK', 'MED'].includes(todayStatus),
      daysInBase: 0
    };
  }

  if (lastValidRdTs) {
    const diffDays = Math.floor((todayTs - lastValidRdTs) / 86400000) + 1;
    const anchorDate = new Date(lastValidRdTs).toISOString().split('T')[0];
    return {
      status: "IN_BASE",
      daysInBase: Math.max(0, diffDays),
      anchorType: "R/D",
      anchorDate
    };
  }

  if (lastLeaveTs) {
    const diffDays = Math.floor((todayTs - lastLeaveTs) / 86400000);
    const anchorDate = new Date(lastLeaveTs).toISOString().split('T')[0];
    return {
      status: "IN_BASE",
      daysInBase: Math.max(0, diffDays),
      anchorType: "Last Leave End",
      anchorDate
    };
  }

  if (sailorData && sailorData.join_date) {
    const joinTs = new Date(sailorData.join_date + "T00:00:00").getTime();
    if (!isNaN(joinTs) && joinTs <= todayTs) {
      const diffDays = Math.floor((todayTs - joinTs) / 86400000) + 1;
      return {
        status: "IN_BASE",
        daysInBase: Math.max(0, diffDays),
        anchorType: "Join Date",
        anchorDate: sailorData.join_date
      };
    }
  }

  return { status: "NO_DATA", daysInBase: 0 };
}

function renderDaysInBaseBanner(calc) {
  const container = document.getElementById("leaveStatusDynamicContent");
  if (!container) return;

  if (calc.status === "ON_LEAVE") {
    const colorCls = calc.isMedical ? "text-rose-500 dark:text-rose-400" : "text-cyan-600 dark:text-cyan-400";
    container.innerHTML = `
      <div>
        <span class="text-xl sm:text-2xl font-black ${colorCls}">Currently on ${escapeHtml(calc.leaveStatus)}</span>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Status as of Today</p>
      </div>
    `;
  } else if (calc.status === "IN_BASE") {
    container.innerHTML = `
      <div class="flex items-baseline gap-2">
        <span class="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono">${calc.daysInBase}</span>
        <span class="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Days in Base</span>
        <span class="text-[11px] text-slate-400 ml-2">Since ${escapeHtml(calc.anchorType)}: <strong>${escapeHtml(calc.anchorDate)}</strong></span>
      </div>
    `;
  } else {
    container.innerHTML = `<span class="text-xs text-slate-400 italic">No historical leave anchors found to calculate days in base.</span>`;
  }
}

function checkLeaveDisableLogic() {
  const vStatus = document.querySelector('input[name="victualing_status"]:checked')?.value || "V/In";
  const lType = store.selectedLeaveType || "L";
  const shouldDisable = (vStatus === "V/Out") || ["SIQ", "SICK", "S/R", "MED", "NGH", "WE", "HD", "SL", "ADM", "R", "X"].includes(lType);

  const tdInput = document.getElementById("leaveTravellingDate");
  const rdInput = document.getElementById("leaveReportingDate");
  const tdMsg = document.getElementById("tdMsg");
  const rdMsg = document.getElementById("rdMsg");

  if (shouldDisable) {
    if (tdInput) { tdInput.value = ""; tdInput.disabled = true; tdInput.classList.add("opacity-40", "cursor-not-allowed"); }
    if (rdInput) { rdInput.value = ""; rdInput.disabled = true; rdInput.classList.add("opacity-40", "cursor-not-allowed"); }
    if (tdMsg) tdMsg.classList.remove("hidden");
    if (rdMsg) rdMsg.classList.remove("hidden");
  } else {
    if (tdInput) { tdInput.disabled = false; tdInput.classList.remove("opacity-40", "cursor-not-allowed"); }
    if (rdInput) { rdInput.disabled = false; rdInput.classList.remove("opacity-40", "cursor-not-allowed"); }
    if (tdMsg) tdMsg.classList.add("hidden");
    if (rdMsg) rdMsg.classList.add("hidden");
    calculateLeaveDates();
  }
}

function calculateLeaveDates() {
  const tdInput = document.getElementById("leaveTravellingDate");
  const rdInput = document.getElementById("leaveReportingDate");
  if (!tdInput || tdInput.disabled) return;
  const fromVal = document.getElementById("leaveFromDate")?.value;
  const daysVal = parseFloat(document.getElementById("leaveNoOfDays")?.value || "1");

  if (fromVal) {
    const leaveDate = new Date(fromVal + "T00:00:00");
    const travellingDate = new Date(leaveDate);
    travellingDate.setDate(leaveDate.getDate() - 1);
    tdInput.value = travellingDate.toISOString().split("T")[0];

    if (!isNaN(daysVal) && daysVal > 0) {
      const reportingDate = new Date(leaveDate);
      reportingDate.setDate(leaveDate.getDate() + Math.ceil(daysVal));
      rdInput.value = reportingDate.toISOString().split("T")[0];
    }
  }
}

function resetLeaveForm() {
  document.getElementById("leaveFromDate").value = new Date().toISOString().split("T")[0];
  document.getElementById("leaveNoOfDays").value = "1";
  document.getElementById("oldLeaveFrom").value = "";
  document.getElementById("oldNoOfDays").value = "";
  store.selectedLeaveType = "L";
  renderLeaveTypeGrid();
  checkLeaveDisableLogic();
  calculateLeaveDates();
}

function buildSailorLeaveRanges(sailorId) {
  const availability = store.availability || {};
  const dateList = [];
  const sailor = (store.sailors || []).find(s => String(s.id) === String(sailorId) || String(s._fbKey) === String(sailorId) || String(s.official_number) === String(sailorId) || String(s.off_no) === String(sailorId));
  const fbKey = sailor ? String(sailor._fbKey || "") : "";
  const sId = sailor ? String(sailor.id || "") : "";
  const offNo = sailor ? String(sailor.official_number || sailor.off_no || "") : "";
  const targetId = String(sailorId || "");

  Object.keys(availability).forEach(month => {
    const days = availability[month];
    if (!days || typeof days !== 'object') return;
    Object.keys(days).forEach(day => {
      const statuses = days[day];
      if (!statuses || typeof statuses !== 'object') return;
      const statusVal = (fbKey && statuses[fbKey]) || (sId && statuses[sId]) || (offNo && statuses[offNo]) || (targetId && statuses[targetId]);
      if (statusVal) {
        const dateStr = `${month}-${String(day).padStart(2, '0')}`;
        dateList.push({ date: dateStr, status: String(statusVal).trim() });
      }
    });
  });

  dateList.sort((a,b) => a.date.localeCompare(b.date));

  const grouped = [];
  if (dateList.length > 0) {
    let curStart = dateList[0].date;
    let curEnd = dateList[0].date;
    let curStatus = dateList[0].status;

    for (let i = 1; i < dateList.length; i++) {
      const rec = dateList[i];
      const prevD = new Date(curEnd + "T00:00:00");
      const nextD = new Date(rec.date + "T00:00:00");
      const diffDays = Math.round((nextD - prevD) / 86400000);

      if (diffDays === 1 && rec.status === curStatus) {
        curEnd = rec.date;
      } else {
        const sDateObj = new Date(curStart + "T00:00:00");
        const eDateObj = new Date(curEnd + "T00:00:00");
        const days = Math.round((eDateObj - sDateObj) / 86400000) + 1;
        grouped.push({ start: curStart, end: curEnd, status: curStatus, days });
        curStart = rec.date;
        curEnd = rec.date;
        curStatus = rec.status;
      }
    }
    const sDateObj = new Date(curStart + "T00:00:00");
    const eDateObj = new Date(curEnd + "T00:00:00");
    const days = Math.round((eDateObj - sDateObj) / 86400000) + 1;
    grouped.push({ start: curStart, end: curEnd, status: curStatus, days });
  }

  return grouped.reverse();
}

function renderSailorLeaveHistory(sailorId) {
  const tbody = document.getElementById("leaveHistoryTableBody");
  const countBadge = document.getElementById("leaveHistoryCountBadge");
  if (!tbody) return;

  const ranges = buildSailorLeaveRanges(sailorId).filter(r => !['T/D', 'R/D'].includes(r.status));
  if (countBadge) countBadge.textContent = ranges.length;

  if (ranges.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-slate-400 italic">No history found for this sailor</td></tr>`;
    return;
  }

  tbody.innerHTML = ranges.map(r => {
    const sObj = new Date(r.start + "T00:00:00");
    const eObj = new Date(r.end + "T00:00:00");
    const sMonth = sObj.toLocaleDateString('en-US', { month: 'short' });
    const sDay = String(sObj.getDate()).padStart(2, '0');
    const eDay = String(eObj.getDate()).padStart(2, '0');
    const periodStr = r.days > 1 ? `${sMonth} ${sDay}-${eDay} (${r.days}d)` : `${sMonth} ${sDay}`;

    let badgeCls = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
    if (['L', 'DL'].includes(r.status)) badgeCls = "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60";
    else if (['WE'].includes(r.status)) badgeCls = "bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60";
    else if (['SIQ', 'SICK', 'S/R', 'MED', 'M/C', 'NGH', 'SL', 'ADM', 'R'].includes(r.status)) badgeCls = "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60";

    return `
      <tr class="hover:bg-slate-50 dark:hover:bg-[#0e1e38] transition-colors">
        <td class="p-2 font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">${escapeHtml(periodStr)}</td>
        <td class="p-2 text-center">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${badgeCls}">${escapeHtml(r.status)}</span>
        </td>
        <td class="p-2 text-center space-x-1 whitespace-nowrap">
          <button type="button" onclick="editSailorLeaveRecord('${r.start}', ${r.days}, '${r.status}')" class="p-1.5 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg transition-colors cursor-pointer" title="Edit">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button type="button" onclick="deleteSailorLeaveRecord('${r.start}', '${r.end}')" class="p-1.5 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer" title="Delete">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function editSailorLeaveRecord(start, days, type) {
  const fromInput = document.getElementById("leaveFromDate");
  const daysInput = document.getElementById("leaveNoOfDays");
  const oldFrom = document.getElementById("oldLeaveFrom");
  const oldDays = document.getElementById("oldNoOfDays");

  if (fromInput) fromInput.value = start;
  if (daysInput) daysInput.value = days;
  if (oldFrom) oldFrom.value = start;
  if (oldDays) oldDays.value = days;

  store.selectedLeaveType = type;
  renderLeaveTypeGrid();

  // Smart V/In vs V/Out auto-detect
  const prevDate = new Date(start + "T00:00:00");
  prevDate.setDate(prevDate.getDate() - 1);
  const prevM = prevDate.toISOString().slice(0, 7);
  const prevD = prevDate.getDate();
  const prevStatus = store.availability?.[prevM]?.[prevD]?.[store.selectedLeaveSailorId];

  const radios = document.querySelectorAll('input[name="victualing_status"]');
  if (['L', 'DL'].includes(type)) {
    radios.forEach(r => {
      r.checked = (prevStatus === 'T/D') ? (r.value === 'V/In') : (r.value === 'V/Out');
    });
  } else {
    radios.forEach(r => { r.checked = (r.value === 'V/In'); });
  }

  checkLeaveDisableLogic();
  calculateLeaveDates();

  document.getElementById("sailorLeaveEntryForm")?.scrollIntoView({ behavior: "smooth" });
  showToast("Record loaded for editing. Click Save to update.", "info");
}

async function deleteSailorLeaveRecord(start, end) {
  const sailorId = store.selectedLeaveSailorId;
  if (!sailorId) return;

  if (!confirm(`Are you sure you want to delete leave record from ${start} to ${end}?`)) {
    return;
  }

  const startD = new Date(start + "T00:00:00");
  const endD = new Date(end + "T00:00:00");
  const updates = {};

  const curr = new Date(startD);
  while (curr <= endD) {
    const m = curr.toISOString().slice(0, 7);
    const d = curr.getDate();
    updates[`availability/${m}/${d}/${sailorId}`] = null;
    curr.setDate(curr.getDate() + 1);
  }

  // Clear prev T/D if any
  const prevDay = new Date(startD);
  prevDay.setDate(prevDay.getDate() - 1);
  const pM = prevDay.toISOString().slice(0, 7);
  const pD = prevDay.getDate();
  if (store.availability?.[pM]?.[pD]?.[sailorId] === 'T/D') {
    updates[`availability/${pM}/${pD}/${sailorId}`] = null;
  }

  // Clear next R/D if any
  const nextDay = new Date(endD);
  nextDay.setDate(nextDay.getDate() + 1);
  const nM = nextDay.toISOString().slice(0, 7);
  const nD = nextDay.getDate();
  if (store.availability?.[nM]?.[nD]?.[sailorId] === 'R/D') {
    updates[`availability/${nM}/${nD}/${sailorId}`] = null;
  }

  try {
    if (typeof sailorsDB !== "undefined") {
      await sailorsDB.ref().update(updates);
    }
    // Optimistic local cache update
    Object.keys(updates).forEach(path => {
      const parts = path.split("/");
      if (parts.length === 4 && parts[0] === "availability") {
        const [, m, d, sid] = parts;
        if (store.availability?.[m]?.[d]) {
          delete store.availability[m][d][sid];
        }
      }
    });

    if (typeof updateCounters === "function") updateCounters();
    if (typeof renderDashboard === "function") renderDashboard();
    if (typeof renderAvailableSailors === "function") renderAvailableSailors();
    if (typeof renderNastatusView === "function") renderNastatusView();

    showToast("Leave record deleted successfully!", "success");
    selectSailorForLeave(sailorId);
  } catch (err) {
    console.warn("Direct Firebase delete failed, using server API:", err);
    try {
      const res = await fetch("api.php?action=delete_sailor_leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sailor_id: sailorId, range_start: start, range_end: end })
      });
      const data = await res.json();
      if (data.success) {
        Object.keys(updates).forEach(path => {
          const parts = path.split("/");
          if (parts.length === 4 && parts[0] === "availability") {
            const [, m, d, sid] = parts;
            if (store.availability?.[m]?.[d]) {
              delete store.availability[m][d][sid];
            }
          }
        });

        if (typeof updateCounters === "function") updateCounters();
        if (typeof renderDashboard === "function") renderDashboard();
        if (typeof renderAvailableSailors === "function") renderAvailableSailors();
        if (typeof renderNastatusView === "function") renderNastatusView();

        showToast("Leave record deleted successfully!", "success");
        selectSailorForLeave(sailorId);
      } else {
        showToast("Error deleting: " + (data.error || "Unknown error"), "error");
      }
    } catch (apiErr) {
      showToast("Error connecting to server: " + apiErr.message, "error");
    }
  }
}

async function handleSaveSailorLeave(e) {
  e.preventDefault();
  const sailorId = store.selectedLeaveSailorId;
  if (!sailorId) {
    showToast("Please select a sailor first", "warning");
    return;
  }

  const fromVal = document.getElementById("leaveFromDate")?.value;
  const daysVal = parseFloat(document.getElementById("leaveNoOfDays")?.value || "1");
  const leaveType = store.selectedLeaveType || "L";
  const vStatus = document.querySelector('input[name="victualing_status"]:checked')?.value || "V/In";
  const tdVal = document.getElementById("leaveTravellingDate")?.value;
  const rdVal = document.getElementById("leaveReportingDate")?.value;
  const oldFrom = document.getElementById("oldLeaveFrom")?.value;
  const oldDays = parseFloat(document.getElementById("oldNoOfDays")?.value || "0");

  if (!fromVal || isNaN(daysVal) || daysVal <= 0) {
    showToast("Please enter valid From Date and Number of Days", "warning");
    return;
  }

  const btn = document.getElementById("btnSaveSailorLeave");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="animate-spin inline-block mr-1">⏳</span> Saving...`;
  }

  const updates = {};

  // 1. If editing, clear old range
  if (oldFrom && oldDays > 0) {
    const oldStart = new Date(oldFrom + "T00:00:00");
    const oldLoop = (oldDays < 1) ? 1 : Math.ceil(oldDays);
    for (let i = 0; i < oldLoop; i++) {
      const c = new Date(oldStart);
      c.setDate(c.getDate() + i);
      updates[`availability/${c.toISOString().slice(0,7)}/${c.getDate()}/${sailorId}`] = null;
    }
    const oldTd = new Date(oldStart);
    oldTd.setDate(oldTd.getDate() - 1);
    updates[`availability/${oldTd.toISOString().slice(0,7)}/${oldTd.getDate()}/${sailorId}`] = null;
    const oldRd = new Date(oldStart);
    oldRd.setDate(oldRd.getDate() + oldLoop);
    updates[`availability/${oldRd.toISOString().slice(0,7)}/${oldRd.getDate()}/${sailorId}`] = null;
  }

  // 2. Add new range
  const startDate = new Date(fromVal + "T00:00:00");
  const loopDays = (leaveType === "HD") ? 1 : Math.ceil(daysVal);
  for (let i = 0; i < loopDays; i++) {
    const c = new Date(startDate);
    c.setDate(c.getDate() + i);
    const m = c.toISOString().slice(0, 7);
    const d = c.getDate();
    updates[`availability/${m}/${d}/${sailorId}`] = (leaveType === "X") ? null : leaveType;
  }

  const excluded = ['SIQ', 'SICK', 'S/R', 'MED', 'M/C', 'NGH', 'SL', 'ADM', 'HD', 'WE', 'R', 'X'];
  if (vStatus === "V/In" && !excluded.includes(leaveType)) {
    if (tdVal) {
      const tD = new Date(tdVal + "T00:00:00");
      updates[`availability/${tD.toISOString().slice(0,7)}/${tD.getDate()}/${sailorId}`] = "T/D";
    }
    if (rdVal) {
      const rD = new Date(rdVal + "T00:00:00");
      updates[`availability/${rD.toISOString().slice(0,7)}/${rD.getDate()}/${sailorId}`] = "R/D";
    }
  }

  try {
    if (typeof sailorsDB !== "undefined") {
      await sailorsDB.ref().update(updates);
      if (vStatus) {
        await sailorsDB.ref(`sailors/${sailorId}/victualing_type`).set(vStatus);
      }
    }

    // Apply optimistic updates to local store.availability
    store.availability = store.availability || {};
    Object.keys(updates).forEach(path => {
      const parts = path.split("/");
      if (parts.length === 4 && parts[0] === "availability") {
        const [, m, d, sid] = parts;
        store.availability[m] = store.availability[m] || {};
        store.availability[m][d] = store.availability[m][d] || {};
        if (updates[path] === null) {
          delete store.availability[m][d][sid];
        } else {
          store.availability[m][d][sid] = updates[path];
        }
      }
    });

    // Update victualing type in local sailor store
    const sailorObj = (store.sailors || []).find(s => s.id === sailorId || s._fbKey === sailorId);
    if (sailorObj) sailorObj.victualing_type = vStatus;

    if (typeof updateCounters === "function") updateCounters();
    if (typeof renderDashboard === "function") renderDashboard();
    if (typeof renderAvailableSailors === "function") renderAvailableSailors();
    if (typeof renderNastatusView === "function") renderNastatusView();

    showToast("Leave record saved successfully!", "success");
    resetLeaveForm();
    selectSailorForLeave(sailorId);
  } catch (err) {
    console.warn("Direct Firebase write failed, falling back to server API:", err);
    try {
      const res = await fetch("api.php?action=save_sailor_leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sailor_id: sailorId,
          leave_type: leaveType,
          victualing_status: vStatus,
          leave_from: fromVal,
          no_of_days: daysVal,
          travelling_date: tdVal,
          reporting_date: rdVal,
          old_leave_from: oldFrom,
          old_no_of_days: oldDays
        })
      });
      const data = await res.json();
      if (data.success) {
        // Apply optimistic updates to local store.availability
        store.availability = store.availability || {};
        Object.keys(updates).forEach(path => {
          const parts = path.split("/");
          if (parts.length === 4 && parts[0] === "availability") {
            const [, m, d, sid] = parts;
            store.availability[m] = store.availability[m] || {};
            store.availability[m][d] = store.availability[m][d] || {};
            if (updates[path] === null) {
              delete store.availability[m][d][sid];
            } else {
              store.availability[m][d][sid] = updates[path];
            }
          }
        });
        const sailorObj = (store.sailors || []).find(s => s.id === sailorId || s._fbKey === sailorId);
        if (sailorObj) sailorObj.victualing_type = vStatus;

        if (typeof updateCounters === "function") updateCounters();
        if (typeof renderDashboard === "function") renderDashboard();
        if (typeof renderAvailableSailors === "function") renderAvailableSailors();
        if (typeof renderNastatusView === "function") renderNastatusView();

        showToast("Leave record saved successfully via server!", "success");
        resetLeaveForm();
        selectSailorForLeave(sailorId);
      } else {
        showToast("Failed to save: " + (data.error || "Unknown error"), "error");
      }
    } catch (apiErr) {
      showToast("Network error saving record: " + apiErr.message, "error");
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>💾</span> Save Record`;
    }
  }
}

function changeLeaveCalMonth(delta) {
  store.leaveCalCurrentDate = store.leaveCalCurrentDate || new Date();
  store.leaveCalCurrentDate.setMonth(store.leaveCalCurrentDate.getMonth() + delta);
  renderSailorLeaveCalendar();
}

function renderSailorLeaveCalendar() {
  const label = document.getElementById("leaveCalMonthLabel");
  const grid = document.getElementById("leaveCalGrid");
  if (!grid || !label) return;

  const dt = store.leaveCalCurrentDate || new Date();
  const year = dt.getFullYear();
  const month = dt.getMonth();

  label.textContent = dt.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  grid.innerHTML = "";

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    grid.innerHTML += `<div></div>`;
  }

  const availability = store.availability || {};
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthAvail = availability[monthKey] || {};
  const sailorId = store.selectedLeaveSailorId;
  const sailor = (store.sailors || []).find(s => String(s.id) === String(sailorId) || String(s._fbKey) === String(sailorId) || String(s.official_number) === String(sailorId) || String(s.off_no) === String(sailorId));
  const fbKey = sailor ? String(sailor._fbKey || "") : "";
  const sId = sailor ? String(sailor.id || "") : "";
  const offNo = sailor ? String(sailor.official_number || sailor.off_no || "") : "";

  const ranges = sailorId ? buildSailorLeaveRanges(sailorId) : [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dayData = monthAvail[day] || monthAvail[String(day)] || monthAvail[String(day).padStart(2, '0')];
    const status = dayData ? ((fbKey && dayData[fbKey]) || (sId && dayData[sId]) || (offNo && dayData[offNo]) || (sailorId && dayData[sailorId])) : null;
    let bgCls = "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700";

    if (status) {
      if (['L', 'DL'].includes(status)) bgCls = "bg-indigo-600 text-white font-bold shadow-xs";
      else if (['WE'].includes(status)) bgCls = "bg-teal-600 text-white font-bold shadow-xs";
      else if (['SIQ', 'SL', 'ADM', 'R', 'S/R', 'SICK', 'MED', 'M/C', 'NGH'].includes(status)) bgCls = "bg-rose-600 text-white font-bold shadow-xs";
      else if (['T/D', 'R/D'].includes(status)) bgCls = "bg-cyan-600 text-white font-bold shadow-xs";
      else bgCls = "bg-slate-500 text-white";
    }

    const dateStr = `${monthKey}-${String(day).padStart(2, '0')}`;
    const titleAttr = status ? `title="${escapeHtml(status)} on ${dateStr}"` : `title="${dateStr}"`;

    grid.innerHTML += `
      <div ${titleAttr} onclick="onCalendarDayClick('${dateStr}', '${status || ''}')" class="h-8 w-8 flex items-center justify-center rounded-xl cursor-pointer transition-all mx-auto text-xs font-semibold ${bgCls}">
        ${day}
      </div>
    `;
  }
}

function onCalendarDayClick(dateStr, status) {
  if (!status) {
    document.getElementById("leaveFromDate").value = dateStr;
    document.getElementById("leaveNoOfDays").value = "1";
    calculateLeaveDates();
    return;
  }
  const ranges = buildSailorLeaveRanges(store.selectedLeaveSailorId);
  const found = ranges.find(r => dateStr >= r.start && dateStr <= r.end);
  if (found) {
    editSailorLeaveRecord(found.start, found.days, found.status);
  }
}

function setRdTodayDate() {
  const rdInput = document.getElementById("rdReportDateInput");
  if (rdInput) {
    rdInput.value = new Date().toISOString().split("T")[0];
    findReportingSailors();
  }
}

function findReportingSailors() {
  const rdInput = document.getElementById("rdReportDateInput");
  if (!rdInput || !rdInput.value) {
    showToast("Please choose a date to search reporting sailors", "warning");
    return;
  }

  const reportDate = rdInput.value;
  const dObj = new Date(reportDate + "T00:00:00");
  const monthKey = reportDate.slice(0, 7);
  const dayKey = dObj.getDate();

  const availability = store.availability || {};
  const dayData = availability[monthKey]?.[dayKey] || availability[monthKey]?.[String(dayKey)] || {};

  const reportingSailors = [];

  Object.keys(dayData).forEach(sId => {
    if (dayData[sId] === "R/D") {
      const sailor = (store.sailors || []).find(s => s.id === sId || s._fbKey === sId);
      if (sailor) {
        let durationStr = "-";
        if (sailor.join_date) {
          try {
            const jDate = new Date(sailor.join_date + "T00:00:00");
            const now = new Date();
            let years = now.getFullYear() - jDate.getFullYear();
            let months = now.getMonth() - jDate.getMonth();
            if (months < 0) { years--; months += 12; }
            durationStr = `${String(years).padStart(2, '0')}Y - ${String(months).padStart(2, '0')}M`;
          } catch(e) {}
        }

        reportingSailors.push({
          id: sId,
          offNo: sailor.offNo || sailor.off_no || "-",
          name: sailor.name || "Unknown",
          rank: sailor.rank || "-",
          trade: sailor.trade || "N/A",
          victualing: sailor.victualing_type || "V/In",
          contact: sailor.tp || sailor.contact || sailor.phone || sailor.mobile || sailor.nok_tp || "-",
          duration: durationStr,
          address: sailor.address || "-",
          policeStation: sailor.police_station || "-",
          nok: sailor.nok || sailor.next_of_kin || "-",
          specialSkills: sailor.special_skills || sailor.special_skill || "NO"
        });
      }
    }
  });

  store.currentReportingSailors = reportingSailors;

  // Populate Trades in modal filter
  const tradeSelect = document.getElementById("rdFilterTrade");
  if (tradeSelect) {
    const trades = Array.from(new Set(reportingSailors.map(s => s.trade).filter(Boolean))).sort();
    tradeSelect.innerHTML = `<option value="ALL">All Trades (${reportingSailors.length})</option>` +
      trades.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
  }

  const modalDate = document.getElementById("rdModalDateSpan");
  if (modalDate) modalDate.textContent = reportDate;

  filterReportingSailorsTable();

  const modal = document.getElementById("reportingSailorsModal");
  if (modal) modal.classList.remove("hidden");
}

function filterReportingSailorsTable() {
  const tbody = document.getElementById("reportingSailorsTableBody");
  const countEl = document.getElementById("rdDisplayCount");
  if (!tbody) return;

  const tradeVal = document.getElementById("rdFilterTrade")?.value || "ALL";
  const searchVal = (document.getElementById("rdFilterSearch")?.value || "").toLowerCase().trim();

  const list = (store.currentReportingSailors || []).filter(s => {
    const matchTrade = (tradeVal === "ALL" || s.trade === tradeVal);
    const matchSearch = !searchVal ||
      s.name.toLowerCase().includes(searchVal) ||
      s.offNo.toLowerCase().includes(searchVal) ||
      s.address.toLowerCase().includes(searchVal) ||
      s.specialSkills.toLowerCase().includes(searchVal);
    return matchTrade && matchSearch;
  });

  if (countEl) countEl.textContent = list.length;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-400 italic">No reporting sailors found for this date and filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(s => {
    return `
      <tr class="hover:bg-slate-50 dark:hover:bg-[#0e1e38] transition-colors border-b border-slate-100 dark:border-slate-800">
        <td class="p-3">
          <span class="font-bold text-slate-900 dark:text-white">${escapeHtml(s.rank)}</span>
          <span class="font-semibold text-slate-700 dark:text-slate-300 ml-1">${escapeHtml(s.name)}</span>
        </td>
        <td class="p-3 text-center font-mono font-bold text-teal-600 dark:text-teal-400">${escapeHtml(s.offNo)}</td>
        <td class="p-3 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">${escapeHtml(s.trade)}</span></td>
        <td class="p-3 text-center text-xs font-semibold ${s.victualing === 'V/In' ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'}">${escapeHtml(s.victualing)}</td>
        <td class="p-3 text-center font-mono text-xs text-slate-600 dark:text-slate-400">${escapeHtml(s.contact)}</td>
        <td class="p-3 text-center font-mono text-xs text-slate-500">${escapeHtml(s.duration)}</td>
        <td class="p-3 text-center">
          <button type="button" onclick="selectReportingSailor('${escapeHtml(s.id)}')" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white transition-all cursor-pointer">
            Select
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function selectReportingSailor(sailorId) {
  closeReportingSailorsModal();
  selectSailorForLeave(sailorId);
}

function closeReportingSailorsModal() {
  const modal = document.getElementById("reportingSailorsModal");
  if (modal) modal.classList.add("hidden");
}

function setSailorDirectoryViewMode(mode) {
  store.sailorDirectoryViewMode = mode;
  const btnTable = document.getElementById("btnViewTable");
  const btnGrid = document.getElementById("btnViewGrid");
  const tableView = document.getElementById("directorySailorsTableView");
  const gridView = document.getElementById("directorySailorsGrid");

  if (mode === "grid") {
    if (btnGrid) {
      btnGrid.className = "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 text-white shadow-sm transition-all";
    }
    if (btnTable) {
      btnTable.className = "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200 transition-all";
    }
    if (tableView) tableView.classList.add("hidden");
    if (gridView) gridView.classList.remove("hidden");
  } else {
    if (btnTable) {
      btnTable.className = "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 text-white shadow-sm transition-all";
    }
    if (btnGrid) {
      btnGrid.className = "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200 transition-all";
    }
    if (gridView) gridView.classList.add("hidden");
    if (tableView) tableView.classList.remove("hidden");
  }
  renderSailorsView();
}

// Sailor Directory Columns Configuration
window.SAILOR_COLUMNS_CONFIG = (typeof window.SAILOR_COLUMNS_CONFIG !== "undefined") ? window.SAILOR_COLUMNS_CONFIG : [
  { id: "off_no", label: "OFF NO", sortable: true, defaultWidth: 120, minWidth: 80, sortField: "off_no" },
  { id: "name", label: "SAILOR NAME & RANK", sortable: true, defaultWidth: 220, minWidth: 150, sortField: "name" },
  { id: "trade", label: "TRADE", sortable: true, defaultWidth: 90, minWidth: 70, sortField: "trade" },
  { id: "city", label: "CITY / HOMETOWN", sortable: true, defaultWidth: 160, minWidth: 100, sortField: "city" },
  { id: "status", label: "STATUS & CATEGORY", sortable: false, defaultWidth: 150, minWidth: 110 },
  { id: "perf", label: "PERFORMANCE (1-10)", sortable: true, defaultWidth: 170, minWidth: 130, sortField: "perf" },
  { id: "skills", label: "SPECIAL SKILLS", sortable: false, defaultWidth: 180, minWidth: 110 },
  { id: "zone", label: "ASSIGNED ZONE", sortable: true, defaultWidth: 140, minWidth: 100, sortField: "zone" },
  { id: "actions", label: "ACTIONS", sortable: false, defaultWidth: 110, minWidth: 90, fixedRight: true },
];

function getSailorActiveColumnOrder() {
  try {
    const raw = localStorage.getItem("sailor_col_order_v2");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const allIds = SAILOR_COLUMNS_CONFIG.map((c) => c.id);
        const valid = parsed.filter((id) => allIds.includes(id));
        allIds.forEach((id) => {
          if (!valid.includes(id)) valid.push(id);
        });
        return valid;
      }
    }
  } catch (e) {
    console.error("Error parsing col order:", e);
  }
  return SAILOR_COLUMNS_CONFIG.map((c) => c.id);
}

function getSailorHiddenColumns() {
  try {
    const raw = localStorage.getItem("sailor_col_hidden_v2");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch (e) {
    console.error("Error parsing hidden cols:", e);
  }
  return new Set();
}

function getSailorColumnWidths() {
  try {
    const raw = localStorage.getItem("sailor_col_widths_v2");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) return parsed;
    }
  } catch (e) {
    console.error("Error parsing col widths:", e);
  }
  return {};
}

function saveSailorColumnSettings(order, hidden, widths) {
  if (order) localStorage.setItem("sailor_col_order_v2", JSON.stringify(order));
  if (hidden) localStorage.setItem("sailor_col_hidden_v2", JSON.stringify(Array.from(hidden)));
  if (widths) localStorage.setItem("sailor_col_widths_v2", JSON.stringify(widths));
}

window._resizingColId = null;
window._resizeStartX = 0;
window._resizeStartWidth = 0;

function initSailorColResize(e, colId) {
  e.preventDefault();
  e.stopPropagation();
  _resizingColId = colId;
  _resizeStartX = e.pageX;

  const thEl = document.getElementById("th-col-" + colId);
  _resizeStartWidth = thEl ? thEl.offsetWidth : 120;

  document.body.classList.add("is-resizing-col");
  document.querySelectorAll(".sailor-th-resizer").forEach((r) => r.classList.remove("is-resizing"));
  if (e.target) e.target.classList.add("is-resizing");

  window.addEventListener("mousemove", onSailorColMouseMove);
  window.addEventListener("mouseup", onSailorColMouseUp);
}

function onSailorColMouseMove(e) {
  if (!_resizingColId) return;
  const diff = e.pageX - _resizeStartX;
  const colDef = SAILOR_COLUMNS_CONFIG.find((c) => c.id === _resizingColId);
  const minW = colDef ? colDef.minWidth : 80;
  const newWidth = Math.max(minW, _resizeStartWidth + diff);

  const thEl = document.getElementById("th-col-" + _resizingColId);
  if (thEl) {
    thEl.style.width = newWidth + "px";
    thEl.style.minWidth = newWidth + "px";
  }
}

function onSailorColMouseUp(e) {
  if (_resizingColId) {
    const thEl = document.getElementById("th-col-" + _resizingColId);
    if (thEl) {
      const finalWidth = thEl.offsetWidth;
      const widths = getSailorColumnWidths();
      widths[_resizingColId] = finalWidth;
      saveSailorColumnSettings(null, null, widths);
    }
    document.querySelectorAll(".sailor-th-resizer").forEach((r) => r.classList.remove("is-resizing"));
  }
  _resizingColId = null;
  document.body.classList.remove("is-resizing-col");
  window.removeEventListener("mousemove", onSailorColMouseMove);
  window.removeEventListener("mouseup", onSailorColMouseUp);
}

function toggleSailorColumnMenu(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById("sailorColumnMenu");
  if (menu) {
    menu.classList.toggle("hidden");
    if (!menu.classList.contains("hidden")) {
      renderSailorColumnMenu();
    }
  }
}

document.addEventListener("click", (e) => {
  const menu = document.getElementById("sailorColumnMenu");
  if (menu && !menu.classList.contains("hidden") && !menu.contains(e.target)) {
    menu.classList.add("hidden");
  }
});

function renderSailorColumnMenu() {
  const container = document.getElementById("sailorColumnList");
  if (!container) return;

  const order = getSailorActiveColumnOrder();
  const hidden = getSailorHiddenColumns();

  container.innerHTML = order.map((colId, idx) => {
    const col = SAILOR_COLUMNS_CONFIG.find((c) => c.id === colId);
    if (!col) return "";
    const isVisible = !hidden.has(col.id);
    const isFirst = idx === 0;
    const isLast = idx === order.length - 1;

    return `
      <div class="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-lg border border-slate-100 transition-all">
        <label class="flex items-center gap-2 cursor-pointer flex-1 font-semibold text-slate-700 select-none truncate">
          <input type="checkbox" class="accent-teal-600 rounded cursor-pointer" ${isVisible ? "checked" : ""} onchange="toggleSailorColumnVisibility('${col.id}', this.checked)">
          <span class="truncate">${col.label}</span>
        </label>
        <div class="flex items-center gap-1 flex-shrink-0">
          <button type="button" onclick="moveSailorColumn('${col.id}', -1)" ${isFirst ? "disabled" : ""} class="px-1.5 py-0.5 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-xs" title="Move Up">⬆️</button>
          <button type="button" onclick="moveSailorColumn('${col.id}', 1)" ${isLast ? "disabled" : ""} class="px-1.5 py-0.5 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-xs" title="Move Down">⬇️</button>
        </div>
      </div>
    `;
  }).join("");
}

function toggleSailorColumnVisibility(colId, isVisible) {
  const hidden = getSailorHiddenColumns();
  if (isVisible) hidden.delete(colId);
  else hidden.add(colId);
  saveSailorColumnSettings(null, hidden, null);
  renderSailorsView();
}

function moveSailorColumn(colId, direction) {
  const order = getSailorActiveColumnOrder();
  const idx = order.indexOf(colId);
  if (idx === -1) return;
  const targetIdx = idx + direction;
  if (targetIdx < 0 || targetIdx >= order.length) return;

  const item = order.splice(idx, 1)[0];
  order.splice(targetIdx, 0, item);

  saveSailorColumnSettings(order, null, null);
  renderSailorsView();
}

function resetSailorColumns() {
  localStorage.removeItem("sailor_col_order_v2");
  localStorage.removeItem("sailor_col_hidden_v2");
  localStorage.removeItem("sailor_col_widths_v2");
  renderSailorsView();
}

function renderSailorsTableHeader() {
  const thead = document.getElementById("directorySailorsTableHead");
  if (!thead) return;

  const order = getSailorActiveColumnOrder();
  const hidden = getSailorHiddenColumns();
  const widths = getSailorColumnWidths();

  const activeCols = order
    .map((id) => SAILOR_COLUMNS_CONFIG.find((c) => c.id === id))
    .filter((c) => c && !hidden.has(c.id));

  thead.innerHTML = `
    <tr class="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider select-none">
      ${activeCols.map((col) => {
        const w = widths[col.id] || col.defaultWidth;
        const sortIcon = col.sortable ? `<span id="sort-icon-${col.sortField}" class="text-slate-400">↕</span>` : "";
        const onclickAttr = col.sortable ? `onclick="sortSailorTable('${col.sortField}')"` : "";
        const cursorClass = col.sortable ? "cursor-pointer hover:bg-slate-800" : "";
        const stickyClass = col.fixedRight ? "sticky right-0 top-0 z-40 bg-slate-900 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.4)] text-center" : "";

        return `
          <th id="th-col-${col.id}" style="width: ${w}px; min-width: ${col.minWidth}px;" class="py-3.5 px-4 sailor-th-cell whitespace-nowrap bg-slate-900 transition-colors ${cursorClass} ${stickyClass}" ${onclickAttr}>
            <div class="flex items-center justify-between gap-1">
              <span>${col.label}</span>
              ${sortIcon}
            </div>
            ${!col.fixedRight ? `<div class="sailor-th-resizer" onmousedown="initSailorColResize(event, '${col.id}')" title="Drag to resize column width"></div>` : ""}
          </th>
        `;
      }).join("")}
    </tr>
  `;

  updateSailorSortIcons();
}

function sortSailorTable(field) {
  if (store.sailorTableSortField === field) {
    store.sailorTableSortAsc = !store.sailorTableSortAsc;
  } else {
    store.sailorTableSortField = field;
    store.sailorTableSortAsc = field === "name" || field === "off_no" || field === "trade" || field === "city";
  }
  updateSailorSortIcons();
  renderSailorsView();
}

function updateSailorSortIcons() {
  const fields = ["off_no", "name", "trade", "city", "perf", "zone"];
  fields.forEach((f) => {
    const icon = document.getElementById("sort-icon-" + f);
    if (icon) {
      if (store.sailorTableSortField === f) {
        icon.textContent = store.sailorTableSortAsc ? "▲" : "▼";
        icon.className = "text-teal-400 font-bold";
      } else {
        icon.textContent = "↕";
        icon.className = "text-slate-400";
      }
    }
  });
}

function filterDirectoryTrade(trade) {
  store.directoryTradeFilter = trade;
  document.querySelectorAll(".dir-trade-btn").forEach((btn) => {
    btn.classList.remove("bg-slate-900", "text-white", "font-bold", "active");
    btn.classList.add("bg-slate-100", "text-slate-600", "font-medium", "hover:bg-slate-200");
  });
  const activeBtn = document.getElementById("dir-trade-" + trade);
  if (activeBtn) {
    activeBtn.classList.remove("bg-slate-100", "text-slate-600", "font-medium", "hover:bg-slate-200");
    activeBtn.classList.add("bg-slate-900", "text-white", "font-bold", "active");
  }
  renderSailorsView();
}

function resetSailorFilters() {
  const searchInput = document.getElementById("directorySailorSearch");
  if (searchInput) searchInput.value = "";
  store.directoryTradeFilter = "ALL";
  filterDirectoryTrade("ALL");

  const citySel = document.getElementById("directoryCityFilter");
  if (citySel) citySel.value = "ALL";
  const skillSel = document.getElementById("directorySkillFilter");
  if (skillSel) skillSel.value = "ALL";
  const scoreSel = document.getElementById("directoryScoreFilter");
  if (scoreSel) scoreSel.value = "ALL";
  const statusSel = document.getElementById("directoryStatusDropdown");
  if (statusSel) statusSel.value = "ALL";
  const dateFrom = document.getElementById("directoryDateFrom");
  if (dateFrom) dateFrom.value = "";
  const dateTo = document.getElementById("directoryDateTo");
  if (dateTo) dateTo.value = "";

  renderSailorsView();
}

function getSailorCityOrHometown(s) {
  if (!s) return "-";
  const cleanStr = (val) => val && val !== "-" && val !== "NO" && val !== "No" && val !== "N/A" && val !== "Not Provided" ? String(val).trim() : "";
  
  if (cleanStr(s.city)) return cleanStr(s.city);
  if (cleanStr(s.police_station)) return cleanStr(s.police_station);
  if (cleanStr(s.district)) return cleanStr(s.district);
  if (s.address && s.address !== "Not Provided" && s.address.includes(",")) {
    const parts = s.address.split(",");
    const lastPart = parts[parts.length - 1].trim();
    if (lastPart && lastPart.length > 2 && lastPart.length < 30) {
      return lastPart;
    }
  }
  return cleanStr(s.hometown) || "-";
}

function populateSailorDropdownFilters() {
  if (!store.sailors || store.sailors.length === 0) return;

  // Populate Cities & Hometowns
  const citySelect = document.getElementById("directoryCityFilter");
  if (citySelect && citySelect.options.length <= 1) {
    const cities = new Set();
    store.sailors.forEach((s) => {
      const c = getSailorCityOrHometown(s);
      if (c && c !== "-") {
        // Capitalize nicely
        cities.add(c.toUpperCase());
      }
    });
    Array.from(cities).sort().forEach((city) => {
      const opt = document.createElement("option");
      opt.value = city;
      opt.textContent = `📍 ${city}`;
      citySelect.appendChild(opt);
    });
  }

  // Populate Special Skills
  const skillSelect = document.getElementById("directorySkillFilter");
  if (skillSelect && skillSelect.options.length <= 1) {
    const skills = new Set();
    store.sailors.forEach((s) => {
      const sk = (s.special_skill || s.skills || "").trim();
      if (sk && sk !== "NO" && sk !== "No" && sk !== "-") {
        // Take first primary skill keyword
        const firstLine = sk.split(/[\n,]/)[0].trim();
        if (firstLine.length > 2 && firstLine.length < 35) {
          skills.add(firstLine);
        }
      }
    });
    Array.from(skills).sort().forEach((skill) => {
      const opt = document.createElement("option");
      opt.value = skill;
      opt.textContent = `🛠️ ${skill}`;
      skillSelect.appendChild(opt);
    });
  }
}

function getSailorLiveDailyStatus(sailor, dateVal) {
  if (!sailor) return { statusText: "Available", statusClass: "available", isLeave: false, isSick: false, isBusy: false, isLongTerm: false, currentLoc: "—", badgeHtml: `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">✓ Available</span>` };

  const today = getLocalDateString();
  if (!dateVal) dateVal = store.dashboardDate || today;

  const [yyyy, mm, dd] = dateVal.split("-");
  const monthKey = `${yyyy}-${mm}`;
  const dayKey = parseInt(dd, 10).toString();

  const sFbKey = sailor._fbKey || sailor.id;
  const sId = sailor.id || sailor._fbKey;

  // 1. Check Firebase Daily Availability / Attendance
  const fbAvail = (typeof getSailorDailyAttendanceStatus === "function" ? getSailorDailyAttendanceStatus(sailor, dateVal) : null)
    || (store.availability && store.availability[monthKey] && store.availability[monthKey][dayKey] ? (store.availability[monthKey][dayKey][sFbKey] || store.availability[monthKey][dayKey][sId]) : null);

  const rawStatus = fbAvail || sailor.attendance || sailor.status || "";
  const statusStr = String(rawStatus).trim();

  const isSickCode = isSailorSickOnDate(statusStr);
  const isLeaveCode = isSailorOnLeaveOnDate(statusStr, dateVal);

  if (isSickCode) {
    let sickLabel = "Sick";
    if (/^(S\/R|SR|Sick Report)$/i.test(statusStr)) sickLabel = "Sick Report (S/R)";
    else if (/^(SL|S\/L|Sick Leave)$/i.test(statusStr)) sickLabel = "Sick Leave (SL)";
    else if (/^(MED|Medical|M\/C|MC)$/i.test(statusStr)) sickLabel = "Medical (MED)";
    else if (/^NGH$/i.test(statusStr)) sickLabel = "NGH (Hospital)";
    else if (/^(ADM|Admit|Hospital)$/i.test(statusStr)) sickLabel = "Admitted (ADM)";
    else if (/^SIQ$/i.test(statusStr)) sickLabel = "SIQ";
    else if (/^(M\/D|MD)$/i.test(statusStr)) sickLabel = "Medical Duty (M/D)";

    return {
      statusText: `🏥 ${sickLabel}`,
      statusClass: "sick",
      badgeHtml: `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">🏥 ${sickLabel}</span>`,
      isLeave: false,
      isSick: true,
      isBusy: false,
      isLongTerm: false,
      currentLoc: `— (${sickLabel})`
    };
  }

  if (isLeaveCode) {
    let leaveLabel = "On Leave";
    if (/^(DL|Days Leave)$/i.test(statusStr)) leaveLabel = "Days Leave (DL)";
    else if (/^(HD|Half Day)$/i.test(statusStr)) leaveLabel = "Half Day (HD)";
    else if (/^(WE|Weekend)$/i.test(statusStr)) leaveLabel = "Weekend (WE)";
    else if (/^(T\/D|TD|T\s*\/\s*D|Traveling Date|Travel Date|Travel Day)$/i.test(statusStr)) leaveLabel = "Travel Day (T/D)";
    else if (/^(R\/D|RD|R\s*\/\s*D|Report Date|Reporting Date|Report Day|Reporting Day)$/i.test(statusStr)) leaveLabel = "Reporting Date (R/D)";
    else if (/^(R|Run|AWOL)$/i.test(statusStr)) leaveLabel = "Absent / Run (R)";

    const isReporting = /^(R\/D|RD|R\s*\/\s*D|Report Date|Reporting Date|Report Day|Reporting Day)$/i.test(statusStr);
    const badgeIcon = isReporting ? "⚓" : "🏖️";

    return {
      statusText: `${badgeIcon} ${leaveLabel}`,
      statusClass: "leave",
      badgeHtml: `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">${badgeIcon} ${leaveLabel}</span>`,
      isLeave: true,
      isSick: false,
      isBusy: false,
      isLongTerm: false,
      currentLoc: `— (${leaveLabel})`
    };
  }

  // 2. Check Long Term Deployments (Housing, Out Project, Other Base)
  const longTerm = getLongTermAllocations();
  const matchedHousing = (longTerm.housing || []).find(a => String(a.sailor.id || a.sailor._fbKey) === String(sId) || String(a.sailor.id || a.sailor._fbKey) === String(sFbKey));
  if (matchedHousing) {
    return {
      statusText: "🏠 Housing",
      statusClass: "longterm",
      badgeHtml: `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">🏠 Housing</span>`,
      isLeave: false,
      isSick: false,
      isBusy: true,
      isLongTerm: true,
      currentLoc: matchedHousing.projectName || "Housing Project"
    };
  }

  const matchedOut = (longTerm.outProject || []).find(a => String(a.sailor.id || a.sailor._fbKey) === String(sId) || String(a.sailor.id || a.sailor._fbKey) === String(sFbKey));
  if (matchedOut) {
    return {
      statusText: "🏕️ Out Project",
      statusClass: "longterm",
      badgeHtml: `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">🏕️ Out Project</span>`,
      isLeave: false,
      isSick: false,
      isBusy: true,
      isLongTerm: true,
      currentLoc: matchedOut.projectName || "Out Project"
    };
  }

  const matchedOther = (longTerm.otherBase || []).find(a => String(a.sailor.id || a.sailor._fbKey) === String(sId) || String(a.sailor.id || a.sailor._fbKey) === String(sFbKey));
  if (matchedOther) {
    return {
      statusText: "⚓ Other Base",
      statusClass: "longterm",
      badgeHtml: `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">⚓ Other Base</span>`,
      isLeave: false,
      isSick: false,
      isBusy: true,
      isLongTerm: true,
      currentLoc: matchedOther.projectName || "Other Base"
    };
  }

  // 3. Check Active Work Order / Detail Assignment
  const assignment = (typeof getSailorDailyAssignment === "function" ? getSailorDailyAssignment(sailor, dateVal) : null)
    || getSailorAssignmentOnDate(sFbKey, dateVal)
    || getSailorAssignmentOnDate(sId, dateVal)
    || (sailor.official_number ? getSailorAssignmentOnDate(sailor.official_number, dateVal) : null);
  if (assignment) {
    let locStr = assignment.zone || "Active WO";
    if (assignment.title) {
      locStr = `${locStr} • ${assignment.title}`;
    }
    return {
      statusText: "⚠️ Daily Task",
      statusClass: "busy",
      badgeHtml: `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">⚠️ Daily Task</span>`,
      isLeave: false,
      isSick: false,
      isBusy: true,
      isLongTerm: false,
      currentLoc: locStr
    };
  }

  // 4. Default: Available
  return {
    statusText: "✓ Available",
    statusClass: "available",
    badgeHtml: `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">✓ Available</span>`,
    isLeave: false,
    isSick: false,
    isBusy: false,
    isLongTerm: false,
    currentLoc: "Available"
  };
}

// Helper to count evaluated days vs non-evaluated days for a sailor (Global Scope)
function getSailorEvaluationStats(sailor) {
  if (!sailor) return { evaluatedDays: 0, pendingDays: 0, totalDutyDays: 0, history: [], avgScore: 7.0 };
  const sId = String(sailor.id !== undefined && sailor.id !== null ? sailor.id : "");
  const sFbKey = String(sailor._fbKey || "");
  const offNo = String(sailor.official_number || sailor.offNo || "");

  const allocs = (store.dailyAllocations || []).filter((a) => {
    const aSailorId = String(a.sailor_id || "");
    return (
      (sId && aSailorId === sId) ||
      (sFbKey && aSailorId === sFbKey) ||
      (offNo && aSailorId === offNo)
    );
  });

  let evaluatedDays = 0;
  let pendingDays = 0;
  const history = [];
  let scoreSum = 0;

  const dateMap = new Map();
  allocs.forEach((a) => {
    if (a.date) {
      if (!dateMap.has(a.date) || a.evaluated) {
        dateMap.set(a.date, a);
      }
    }
  });

  dateMap.forEach((a, dt) => {
    const isEval = a.evaluated === true || (typeof a.score === "number" && a.score > 0);
    if (isEval) {
      evaluatedDays++;
      const sc = typeof a.score === "number" ? a.score : parseFloat(sailor.avgScore || 7.0);
      scoreSum += sc;
      history.push({ date: dt, evaluated: true, score: sc, workOrderId: a.work_order_id });
    } else {
      pendingDays++;
      history.push({ date: dt, evaluated: false, score: null, workOrderId: a.work_order_id });
    }
  });

  history.sort((a, b) => b.date.localeCompare(a.date));

  if (evaluatedDays === 0 && sailor.evaluated) {
    evaluatedDays = 1;
  }

  const avg = evaluatedDays > 0 ? scoreSum / evaluatedDays : parseFloat(sailor.avgScore || 7.0);

  return {
    evaluatedDays,
    pendingDays,
    totalDutyDays: evaluatedDays + pendingDays,
    avgScore: avg,
    history,
  };
}

// Render Sailor Operations & Performance Center View
function renderSailorsView() {
  populateSailorDropdownFilters();

  const searchEl = document.getElementById("directorySailorSearch");
  const query = (searchEl ? searchEl.value : "").toLowerCase().trim();
  const trade = store.directoryTradeFilter || "ALL";
  const cityFilter = (document.getElementById("directoryCityFilter") || {}).value || "ALL";
  const skillFilter = (document.getElementById("directorySkillFilter") || {}).value || "ALL";
  const scoreFilter = (document.getElementById("directoryScoreFilter") || {}).value || "ALL";
  const statusFilter = (document.getElementById("directoryStatusDropdown") || {}).value || "ALL";
  const dateFrom = (document.getElementById("directoryDateFrom") || {}).value || "";
  const dateTo = (document.getElementById("directoryDateTo") || {}).value || "";

  let filtered = [...(store.sailors || [])];

  // Fast pre-filters before running heavy computations
  if (trade !== "ALL") {
    filtered = filtered.filter((s) => s.trade === trade);
  }

  if (query) {
    filtered = filtered.filter((s) => {
      const offNo = String(s.official_number || s.off_no || s.service_no || "").toLowerCase();
      const name = String(s.name || "").toLowerCase();
      const rank = String(s.rank || "").toLowerCase();
      const tr = String(s.trade || "").toLowerCase();
      const city = String(s.city || s.district || s.hometown || "").toLowerCase();
      const skill = String(s.special_skill || s.skills || "").toLowerCase();
      return name.includes(query) || offNo.includes(query) || rank.includes(query) || tr.includes(query) || city.includes(query) || skill.includes(query);
    });
  }

  if (cityFilter !== "ALL") {
    filtered = filtered.filter((s) => {
      const c = (s.city || s.district || s.hometown || "").toUpperCase();
      return c.includes(cityFilter);
    });
  }

  // Map only the filtered sailors with live computed fields & status
  const today = getLocalDateString();
  const dateVal = store.dashboardDate || today;

  let mapped = filtered.map((s) => {
    var _s$idComputed;
    const sId = (_s$idComputed = s.id) !== null && _s$idComputed !== void 0 ? _s$idComputed : s._fbKey;
    const offNo = s.official_number || s.off_no || s.service_no || "-";
    const points = calculateSailorPoints(s);
    const leaveDays = calculateSailorLeaveDays(s);
    const liveStatus = getSailorLiveDailyStatus(s, dateVal);
    const perf = parseFloat(s.avgScore || s.yesterdayScore || 7.0);
    const city = getSailorCityOrHometown(s);
    const assignedZone = liveStatus.currentLoc;
    return { ...s, offNo, points, leaveDays, liveStatus, perf, city, assignedZone };
  });

  // Special skill filter
  if (skillFilter !== "ALL") {
    mapped = mapped.filter((s) => {
      const sk = (s.special_skill || s.skills || "").toLowerCase();
      return sk.includes(skillFilter.toLowerCase());
    });
  }

  // Score level filter
  if (scoreFilter !== "ALL") {
    mapped = mapped.filter((s) => {
      const sc = s.perf;
      if (scoreFilter === "top") return sc >= 9.0;
      if (scoreFilter === "good") return sc >= 7.0 && sc < 9.0;
      if (scoreFilter === "avg") return sc >= 5.0 && sc < 7.0;
      if (scoreFilter === "low") return sc < 5.0;
      return true;
    });
  }

  // Status filter
  if (statusFilter !== "ALL") {
    mapped = mapped.filter((s) => {
      if (statusFilter === "AVAILABLE") return !s.liveStatus.isLeave && !s.liveStatus.isSick && !s.liveStatus.isBusy;
      if (statusFilter === "BUSY") return s.liveStatus.isBusy && !s.liveStatus.isLongTerm;
      if (statusFilter === "LEAVE") return s.liveStatus.isLeave;
      if (statusFilter === "SICK") return s.liveStatus.isSick;
      if (statusFilter === "LONG_TERM") return s.liveStatus.isLongTerm;
      return true;
    });
  }

  // Table & Grid Sorting
  const sortField = store.sailorTableSortField || "perf";
  const isAsc = store.sailorTableSortAsc;

  mapped.sort((a, b) => {
    let res = 0;
    if (sortField === "off_no") {
      res = (a.offNo || "").localeCompare(b.offNo || "", undefined, { numeric: true });
    } else if (sortField === "name") {
      res = (a.name || "").localeCompare(b.name || "");
    } else if (sortField === "trade") {
      res = (a.trade || "").localeCompare(b.trade || "");
    } else if (sortField === "city") {
      res = (a.city || "").localeCompare(b.city || "");
    } else if (sortField === "perf") {
      res = (a.perf || 0) - (b.perf || 0);
    } else if (sortField === "zone") {
      res = (a.assignedZone || "").localeCompare(b.assignedZone || "");
    }
    return isAsc ? res : -res;
  });

  // Update total count badge
  const totalCountBadge = document.getElementById("directoryTotalCount");
  if (totalCountBadge) {
    totalCountBadge.textContent = `Total: ${mapped.length} Sailors`;
  }

  // Render Table Header dynamically
  renderSailorsTableHeader();

  // Active columns configuration
  const activeOrder = getSailorActiveColumnOrder();
  const hiddenCols = getSailorHiddenColumns();
  const activeColumns = activeOrder
    .map((id) => SAILOR_COLUMNS_CONFIG.find((c) => c.id === id))
    .filter((c) => c && !hiddenCols.has(c.id));

  const isGrid = store.sailorDirectoryViewMode === "grid";
  const gridContainer = document.getElementById("directorySailorsGrid");
  const tableBody = document.getElementById("directorySailorsTableBody");

  if (!isGrid) {
    if (gridContainer) gridContainer.innerHTML = "";
    if (tableBody) {
      if (mapped.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="${Math.max(1, activeColumns.length)}" class="text-center py-12 text-slate-400 font-medium text-sm">No sailors found matching criteria.</td></tr>`;
      } else {
        tableBody.innerHTML = mapped.map((s) => {
          var _s$idRow;
          const sId = (_s$idRow = s.id) !== null && _s$idRow !== void 0 ? _s$idRow : s._fbKey;
          const shortRank = s.rank ? s.rank.replace(/[a-z\s()]/gi, "").substring(0, 2) : "AB";
          const statusBadge = s.liveStatus.badgeHtml;
          const evalStats = getSailorEvaluationStats(s);

          const skillText = s.special_skill && s.special_skill !== "NO" && s.special_skill !== "No" ? s.special_skill.replace(/[\r\n]+/g, " ").trim() : "—";
          const skillSnippet = skillText.length > 25 ? skillText.substring(0, 25) + "..." : skillText;
          const cleanCity = s.city && s.city !== "-" ? `📍 ${s.city}` : "—";

          // Map cells according to activeColumns order
          const rowCells = activeColumns.map((col) => {
            switch (col.id) {
              case "off_no":
                return `<td class="py-3 px-4 font-mono font-bold text-xs text-slate-800 whitespace-nowrap">${s.offNo}</td>`;
              case "name": {
                const cleanNo = s.offNo ? s.offNo.replace(/[^a-zA-Z0-9]/g, "") : "";
                const fallbackText = `<div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-[11px] flex-shrink-0 shadow-xs">${shortRank}</div>`;
                const avatarHtml = cleanNo
                  ? `<img src="images/${cleanNo}.JPG" loading="lazy" decoding="async" data-fallback="${fallbackText.replace(/"/g, "&quot;")}" class="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-slate-200/90 shadow-xs" onerror="handleProfilePicError(this, '${cleanNo}')">`
                  : fallbackText;
                return `
                  <td class="py-3 px-4">
                      <div class="flex items-center gap-3">
                          <div class="relative flex-shrink-0">
                              ${avatarHtml}
                          </div>
                          <div class="min-w-0">
                              <p class="font-bold text-xs text-slate-900 dark:text-white truncate hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer" onclick="openSailorProfile('${sId}')">${s.name || "-"}</p>
                              <p class="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">${s.rank || "-"}</p>
                          </div>
                      </div>
                  </td>`;
              }
              case "trade":
                return `
                  <td class="py-3 px-4">
                      <span class="inline-block px-2 py-0.5 rounded text-xs font-extrabold bg-slate-900 text-white">${s.trade || "-"}</span>
                  </td>`;
              case "city":
                return `<td class="py-3 px-4 text-xs text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">${cleanCity}</td>`;
              case "status":
                return `<td class="py-3 px-4 whitespace-nowrap">${statusBadge}</td>`;
              case "perf":
                return `
                  <td class="py-3 px-4 whitespace-nowrap">
                      <div class="flex flex-col items-start gap-1">
                          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-xs">
                              ⭐ ${s.perf.toFixed(2)}
                          </span>
                          <div class="flex items-center gap-1 text-[10px] font-bold">
                              <span class="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60" title="Evaluated Days">✓ ${evalStats.evaluatedDays}d Eval</span>
                              <span class="text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700" title="Non-Evaluated Days">⏳ ${evalStats.pendingDays}d Non-eval</span>
                          </div>
                      </div>
                  </td>`;
              case "skills":
                return `
                  <td class="py-3 px-4 text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]" title="${skillText.replace(/"/g, '&quot;')}">
                      ${skillSnippet !== "—" ? `<span class="text-slate-700 dark:text-slate-200">🛠️ ${skillSnippet}</span>` : '<span class="text-slate-300 dark:text-slate-600">—</span>'}
                  </td>`;
              case "zone":
                return `<td class="py-3 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">${s.assignedZone}</td>`;
              case "actions":
                return `
                  <td class="py-3 px-4 text-center whitespace-nowrap sticky right-0 z-10 bg-white dark:bg-[#0a1526] group-hover:bg-slate-50 dark:group-hover:bg-[#11223f] transition-colors shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.08)] dark:shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.4)]">
                      <div class="flex items-center justify-center">
                          <button onclick="openSailorProfile('${sId}')" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-900/50 hover:text-teal-700 dark:hover:text-teal-300 border border-slate-200 dark:border-slate-700 transition-all shadow-xs cursor-pointer">
                              <span>👤</span> Profile
                          </button>
                      </div>
                  </td>`;
              default:
                return `<td class="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">—</td>`;
            }
          }).join("");

          return `<tr class="hover:bg-slate-50/90 dark:hover:bg-[#0e1e38] transition-colors group border-b border-slate-100 dark:border-slate-800/60">${rowCells}</tr>`;
        }).join("");
      }
    }
  } else {
    if (tableBody) tableBody.innerHTML = "";
    if (gridContainer) {
      if (mapped.length === 0) {
        gridContainer.innerHTML = `<div class="col-span-full text-center py-12 text-slate-400 font-medium text-sm">No sailors found matching criteria.</div>`;
      } else {
        gridContainer.innerHTML = mapped.map((s) => {
          var _s$idGrid;
          const sId = (_s$idGrid = s.id) !== null && _s$idGrid !== void 0 ? _s$idGrid : s._fbKey;
          const cleanNo = s.offNo ? s.offNo.replace(/[^a-zA-Z0-9]/g, "") : "";
          const shortRank = s.rank ? s.rank.replace(/[a-z\s()]/gi, "").substring(0, 3) : "AB";
          const fallbackText = `<div class="w-12 h-12 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">${shortRank}</div>`;
          const avatarHtml = cleanNo ? `<img src="images/${cleanNo}.JPG" loading="lazy" decoding="async" data-fallback="${fallbackText.replace(/"/g, "&quot;")}" class="w-12 h-12 rounded-full object-cover flex-shrink-0" onerror="handleProfilePicError(this, '${cleanNo}')">` : fallbackText;
          const evalStats = getSailorEvaluationStats(s);
          const statusBadge = s.liveStatus.badgeHtml;

          const tradeColors = {
            MA: "bg-teal-600",
            CA: "bg-purple-600",
            PA: "bg-amber-700",
            PL: "bg-cyan-600",
            WE: "bg-red-600",
            RW: "bg-slate-700",
            SW: "bg-emerald-800",
            BB: "bg-blue-700",
            AL: "bg-pink-600",
          };
          const tradeClass = tradeColors[s.trade] || "bg-slate-600";

          return `
          <div onclick="openSailorProfile('${sId}')" class="bg-white dark:bg-[#0a1526] rounded-2xl shadow-md dark:shadow-xl border border-slate-200/80 dark:border-slate-800 p-4 hover:shadow-lg dark:hover:border-teal-500/40 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between">
              <div class="flex items-start gap-3">
                  <div class="relative flex-shrink-0">
                      ${avatarHtml}
                      <span class="absolute -bottom-1 -right-1 text-[9px] text-white px-1.5 py-0.5 rounded-full font-extrabold ${tradeClass}">
                          ${s.trade}
                      </span>
                  </div>
                  <div class="min-w-0 flex-1">
                      <p class="font-bold text-slate-800 dark:text-white text-sm truncate">${s.name}</p>
                      <p class="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate mt-0.5">${s.rank}</p>
                      <p class="text-[10px] text-slate-400 dark:text-slate-500 mono mt-0.5">${s.offNo}</p>
                  </div>
              </div>

              <div class="border-t border-slate-100 dark:border-slate-800 pt-3 mt-4 flex items-center justify-between gap-1 flex-wrap">
                  ${statusBadge}
                  <div class="flex items-center gap-1.5 text-[10px] font-bold">
                      <span class="text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-800/60" title="Performance score">⭐ ${s.perf.toFixed(2)}</span>
                      <span class="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60" title="Evaluated Days">✓ ${evalStats.evaluatedDays}d</span>
                      <span class="text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700" title="Non-Evaluated Days">⏳ ${evalStats.pendingDays}d</span>
                  </div>
              </div>
          </div>
          `;
        }).join("");
      }
    }
  }
}

// Render Section 2: Performance Analyser
function renderSailorPerformanceSection() {
  const container = document.getElementById("sailorsSectionPerf");
  if (!container) return;

  const sailors = store.sailors || [];
  if (sailors.length === 0) {
    container.innerHTML = `<div class="p-8 text-center text-slate-400">No sailor data available for analysis.</div>`;
    return;
  }

  let totalScore = 0;
  let topCount = 0;
  let goodCount = 0;
  let avgCount = 0;
  let lowCount = 0;

  const tradeStats = {};

  sailors.forEach((s) => {
    const sc = parseFloat(s.avgScore || s.yesterdayScore || 7.0);
    totalScore += sc;
    if (sc >= 9.0) topCount++;
    else if (sc >= 7.0) goodCount++;
    else if (sc >= 5.0) avgCount++;
    else lowCount++;

    const tr = s.trade || "OTHER";
    if (!tradeStats[tr]) tradeStats[tr] = { total: 0, count: 0 };
    tradeStats[tr].total += sc;
    tradeStats[tr].count += 1;
  });

  const avgRating = (totalScore / sailors.length).toFixed(2);

  // Sort top 10 sailors
  const topPerformers = [...sailors]
    .map((s) => ({
      ...s,
      perf: parseFloat(s.avgScore || s.yesterdayScore || 7.0),
      offNo: s.official_number || s.off_no || s.service_no || "-",
    }))
    .sort((a, b) => b.perf - a.perf)
    .slice(0, 10);

  container.innerHTML = `
    <!-- Top Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-2xl font-bold">⭐</div>
            <div>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Performance</p>
                <p class="text-2xl font-black text-slate-800 mt-0.5">${avgRating} <span class="text-xs font-normal text-slate-400">/ 10</span></p>
            </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl font-bold">🏆</div>
            <div>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Outstanding (≥9.0)</p>
                <p class="text-2xl font-black text-emerald-600 mt-0.5">${topCount} <span class="text-xs font-normal text-slate-400">Sailors</span></p>
            </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl font-bold">🎯</div>
            <div>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Good (7.0 - 8.9)</p>
                <p class="text-2xl font-black text-blue-600 mt-0.5">${goodCount} <span class="text-xs font-normal text-slate-400">Sailors</span></p>
            </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl font-bold">⚠️</div>
            <div>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Needs Focus (&lt;7.0)</p>
                <p class="text-2xl font-black text-amber-600 mt-0.5">${avgCount + lowCount} <span class="text-xs font-normal text-slate-400">Sailors</span></p>
            </div>
        </div>
    </div>

    <!-- Charts & Leaderboard Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Trade Performance Breakdown -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 class="font-bold text-slate-800 flex items-center gap-2">
                <span>📊</span> Trade-wise Performance Average
            </h3>
            <div class="space-y-3">
                ${Object.keys(tradeStats).map((tr) => {
                  const stat = tradeStats[tr];
                  const avg = (stat.total / stat.count).toFixed(2);
                  const pct = Math.min(100, Math.round((avg / 10) * 100));
                  return `
                    <div class="space-y-1">
                        <div class="flex justify-between text-xs font-bold">
                            <span class="text-slate-700">${tr} (${stat.count} Sailors)</span>
                            <span class="text-teal-600">⭐ ${avg}</span>
                        </div>
                        <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div class="h-full bg-teal-500 rounded-full" style="width: ${pct}%"></div>
                        </div>
                    </div>
                  `;
                }).join("")}
            </div>
        </div>

        <!-- Top 10 Leaderboard -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 class="font-bold text-slate-800 flex items-center gap-2">
                <span>🏆</span> Top 10 High Performers
            </h3>
            <div class="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                ${topPerformers.map((s, idx) => {
                  var _s$idTop;
                  const sId = (_s$idTop = s.id) !== null && _s$idTop !== void 0 ? _s$idTop : s._fbKey;
                  const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
                  return `
                    <div onclick="openSailorProfile('${sId}')" class="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all cursor-pointer">
                        <div class="flex items-center gap-3">
                            <span class="w-7 text-center font-bold text-xs text-slate-600">${medal}</span>
                            <div>
                                <p class="text-xs font-bold text-slate-800">${s.rank || ""} ${s.name || ""}</p>
                                <p class="text-[10px] text-slate-500">${s.offNo} • ${s.trade || ""}</p>
                            </div>
                        </div>
                        <span class="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-300">
                            ⭐ ${s.perf.toFixed(2)}
                        </span>
                    </div>
                  `;
                }).join("")}
            </div>
        </div>
    </div>
  `;
}

window._currentSailorNokRaw = "";
window._isNokRevealed = false;

function setNokMaskedState(nokVal) {
  _currentSailorNokRaw = nokVal && nokVal !== "—" ? String(nokVal).trim() : "";
  _isNokRevealed = false;

  const nokEl = document.getElementById("profDetNok");
  const btnEl = document.getElementById("btnRevealNok");
  const iconEl = document.getElementById("iconRevealNok");
  const lblEl = document.getElementById("lblRevealNok");

  if (!_currentSailorNokRaw || _currentSailorNokRaw === "—") {
    if (nokEl) {
      nokEl.textContent = "—";
      nokEl.className = "font-bold text-slate-400 text-right uppercase";
    }
    if (btnEl) btnEl.classList.add("hidden");
    return;
  }

  if (btnEl) btnEl.classList.remove("hidden");
  if (iconEl) iconEl.textContent = "🔒";
  if (lblEl) lblEl.textContent = "Reveal";
  if (nokEl) {
    nokEl.textContent = "••••••••••••••••";
    nokEl.className = "font-bold text-slate-500 tracking-widest text-right font-mono";
  }
}

function toggleNokConfidentiality() {
  const nokEl = document.getElementById("profDetNok");
  const iconEl = document.getElementById("iconRevealNok");
  const lblEl = document.getElementById("lblRevealNok");

  if (!_currentSailorNokRaw || _currentSailorNokRaw === "—") return;

  if (_isNokRevealed) {
    // Hide back
    _isNokRevealed = false;
    if (iconEl) iconEl.textContent = "🔒";
    if (lblEl) lblEl.textContent = "Reveal";
    if (nokEl) {
      nokEl.textContent = "••••••••••••••••";
      nokEl.className = "font-bold text-slate-500 tracking-widest text-right font-mono";
    }
    showToast("Confidential details hidden", "info");
    return;
  }

  // Ask for master password
  const entered = prompt("🔒 Enter Master Password to reveal confidential NOK / Wife details:");
  if (entered === null) return; // cancelled

  const pwd = entered.trim();
  const inc = (store.settings?.zoneInCharges || {})[store.currentZone] || {};
  const zonePwd = inc.password ? String(inc.password).trim() : "";
  const isMasterAuthorized = 
    pwd === "MalitHZ" || 
    pwd === "3576" || 
    (zonePwd && pwd === zonePwd) || 
    isMainAdminLoggedIn();

  if (isMasterAuthorized) {
    _isNokRevealed = true;
    if (iconEl) iconEl.textContent = "🙈";
    if (lblEl) lblEl.textContent = "Hide";
    if (nokEl) {
      nokEl.textContent = _currentSailorNokRaw;
      nokEl.className = "font-bold text-rose-700 text-right uppercase";
    }
    showToast("Confidential NOK details unlocked!", "success");
  } else {
    showToast("Access Denied: Incorrect Master Password!", "error");
  }
}

function findSailorInStore(sailorId) {
  if (!sailorId || !store.sailors || store.sailors.length === 0) return null;
  const rawId = String(sailorId).trim();
  const rawIdLower = rawId.toLowerCase();
  const cleanId = rawId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const digitsOnly = rawId.replace(/\D/g, "");

  // 1. Direct exact match on id, _fbKey, official_number, or off_no
  let found = store.sailors.find(s => {
    if (!s) return false;
    if (String(s.id).trim() === rawId) return true;
    if (s._fbKey && String(s._fbKey).trim() === rawId) return true;
    if (s.official_number && String(s.official_number).trim() === rawId) return true;
    if (s.off_no && String(s.off_no).trim() === rawId) return true;
    return false;
  });
  if (found) return found;

  // 2. Clean alphanumeric match (e.g. "VAS 76193" vs "VAS76193", "EC 103756" vs "EC103756")
  if (cleanId) {
    found = store.sailors.find(s => {
      if (!s) return false;
      const sOffClean = (s.official_number || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      const sIdClean = String(s.id || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      const sFbClean = String(s._fbKey || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      const sOffNoClean = (s.off_no || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      return (sOffClean === cleanId || sIdClean === cleanId || sFbClean === cleanId || sOffNoClean === cleanId);
    });
    if (found) return found;
  }

  // 3. Digits-only match (e.g. "76193" matching "VAS 76193", "103756" matching "EC 103756")
  if (digitsOnly && digitsOnly.length >= 4) {
    found = store.sailors.find(s => {
      if (!s) return false;
      const sDigits = (s.official_number || "").replace(/\D/g, "");
      const sIdDigits = String(s.id || "").replace(/\D/g, "");
      return (sDigits === digitsOnly || sIdDigits === digitsOnly);
    });
    if (found) return found;
  }

  // 4. Case-insensitive exact or substring match on official_number or name
  found = store.sailors.find(s => {
    if (!s) return false;
    const sOffLower = (s.official_number || "").toLowerCase().trim();
    const sNameLower = (s.name || "").toLowerCase().trim();
    if (sOffLower === rawIdLower || sNameLower === rawIdLower) return true;
    if (rawIdLower.length >= 4 && (sNameLower.includes(rawIdLower) || rawIdLower.includes(sNameLower))) return true;
    return false;
  });

  return found || null;
}

// Open Sailor Profile Modal with detailed stats matching Pic 2
function openSailorProfile(sailorId) {
  if (_justClosedModal) return;
  const sailor = findSailorInStore(sailorId);
  if (!sailor) {
    console.warn("Sailor profile not found for identifier:", sailorId);
    showToast(`Sailor profile not found for "${sailorId}"`, "error");
    return;
  }

  const evalStats = getSailorEvaluationStats(sailor);
  const leaveDays = calculateSailorLeaveDays(sailor);
  const perfScore = parseFloat(sailor.avgScore || sailor.yesterdayScore || 7.0);

  // Clean numbers & rank
  const cleanNo = sailor.official_number
    ? sailor.official_number.replace(/[^a-zA-Z0-9]/g, "")
    : "";
  const shortRank = sailor.rank
    ? sailor.rank.replace(/[a-z\s()]/gi, "").substring(0, 3)
    : "AB";

  // Top Naval Banner
  const nameEl = document.getElementById("profModalName");
  if (nameEl) nameEl.textContent = sailor.name || "Unknown Sailor";

  const subEl = document.getElementById("profModalSubtitle");
  if (subEl) subEl.textContent = `${sailor.rank || "AB"} | ${sailor.official_number || "-"}`;

  const unitEl = document.getElementById("profModalUnit");
  if (unitEl) unitEl.textContent = `UNIT: ${sailor.unit || sailor.zone_assigned || "CE(W/W)"}`;

  const tradeEl = document.getElementById("profModalTrade");
  if (tradeEl) tradeEl.textContent = sailor.trade || "MA";

  const today = getLocalDateString();
  const dateVal = store.dashboardDate || today;
  const liveSt = getSailorLiveDailyStatus(sailor, dateVal);

  const statusEl = document.getElementById("profModalLiveStatus");
  if (statusEl) {
    if (liveSt.isSick) {
      statusEl.className = "inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30";
      statusEl.textContent = liveSt.statusText ? liveSt.statusText.replace(/^🏥\s*/, "") : "Sick";
    } else if (liveSt.isLeave) {
      statusEl.className = "inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30";
      statusEl.textContent = liveSt.statusText ? liveSt.statusText.replace(/^🏖️\s*/, "") : "On Leave";
    } else if (liveSt.isLongTerm) {
      statusEl.className = "inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30";
      statusEl.textContent = liveSt.statusText ? liveSt.statusText.replace(/^[^\w\s]+\s*/, "") : "Deployed";
    } else if (liveSt.isBusy) {
      statusEl.className = "inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30";
      statusEl.textContent = "On Duty";
    } else {
      statusEl.className = "inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
      statusEl.textContent = "Available";
    }
  }

  // Photo
  const photoBox = document.getElementById("profModalPhotoContainer");
  if (photoBox) {
    const fallbackText = `<div class="w-full h-full bg-slate-700 text-white flex items-center justify-center font-bold text-lg">${shortRank}</div>`;
    if (cleanNo) {
      photoBox.innerHTML = `<img src="images/${cleanNo}.JPG" decoding="async" data-fallback="${fallbackText.replace(/"/g, "&quot;")}" class="w-full h-full object-cover" onerror="handleProfilePicError(this, '${cleanNo}')">`;
    } else {
      photoBox.innerHTML = fallbackText;
    }
  }

  // Left Column: DETAIL SUMMARY
  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val && String(val).trim() !== "" ? val : "—";
  };

  setText("profDetName", sailor.name);
  setText("profDetRank", sailor.rank);
  setText("profDetOffNo", sailor.official_number);
  setText("profDetContact", sailor.contact_no || sailor.phone || sailor.mobile || "—");
  setText("profDetTrade", sailor.trade || "—");
  
  const rollVal = sailor.roll || (sailor.official_number && sailor.official_number.startsWith("VAS") ? "VAS" : sailor.official_number && sailor.official_number.startsWith("EC") ? "EC" : "REG");
  setText("profDetRoll", rollVal);
  setText("profDetBlood", sailor.blood_group || "—");
  setNokMaskedState(sailor.nok_name);
  setText("profDetSkill", sailor.special_skill || sailor.skills || "—");
  setText("profDetJoinDate", sailor.join_date || "—");
  setText("profDetIdExpiry", sailor.id_expiry || "—");
  setText("profDetBMed", sailor.next_b_medical_date || "—");
  setText("profDetGCB", sailor.next_gcb_date || "—");
  setText("profDetNAV3", sailor.next_nav3_date || "—");
  setText("profDetRMed", sailor.next_r_medical_date || "—");

  // OTHER INFORMATION
  setText("profOtherAddress", sailor.address || "—");
  setText("profOtherAddressLine", sailor.address_line || "—");
  setText("profOtherDistrict", sailor.district || "—");
  setText("profOtherPolice", sailor.police_station || "—");

  // PHYSICAL FITNESS & LIVE BMI CALCULATOR (No Fabricated Data)
  currentSailorProfileId = sailor.id !== undefined ? sailor.id : (sailor._fbKey || sailor.official_number);

  const wInput = document.getElementById("profInputWeight");
  if (wInput) wInput.value = sailor.weight ? sailor.weight : "";
  const hInput = document.getElementById("profInputHeight");
  if (hInput) hInput.value = sailor.height ? sailor.height : "";

  calculateSailorLiveBMI();

  // Real Naval Medical Records (only actual values)
  setText("profMedCategory", sailor.medical_category || sailor.med_cat || "—");
  const healthCond = liveSt.isSick ? `⚠️ Active Sick Recovery (${liveSt.statusText})` : (liveSt.isLeave ? `🏖️ On Leave (${liveSt.statusText})` : "Normal / Active");
  setText("profHealthCondition", healthCond);
  setText("profDutyRestrictions", sailor.medical_remarks || sailor.duty_restrictions || "—");
  const bloodGrp = sailor.blood_group || "—";
  setText("profBloodDonorReady", bloodGrp !== "—" ? `🩸 ${bloodGrp}` : "—");

  // Right Column: PERFORMANCE & INSIGHTS
  const scoreNumEl = document.getElementById("profScoreNumber");
  if (scoreNumEl) scoreNumEl.innerHTML = `${perfScore.toFixed(2)} <span class="text-xs font-normal text-amber-500">/ 10</span>`;

  const evalDaysEl = document.getElementById("profEvalDaysBadge");
  if (evalDaysEl) evalDaysEl.textContent = `${evalStats.evaluatedDays} D`;

  const nonEvalDaysEl = document.getElementById("profNonEvalDaysBadge");
  if (nonEvalDaysEl) nonEvalDaysEl.textContent = `${evalStats.pendingDays} D`;

  const gradeBadge = document.getElementById("profPerfGradeBadge");
  if (gradeBadge) {
    if (perfScore >= 9.0) {
      gradeBadge.className = "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300";
      gradeBadge.textContent = "🏆 Outstanding";
    } else if (perfScore >= 7.0) {
      gradeBadge.className = "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800 border border-teal-300";
      gradeBadge.textContent = "🎯 High Performer";
    } else {
      gradeBadge.className = "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300";
      gradeBadge.textContent = "⚠️ Needs Focus";
    }
  }

  // Dynamic Insight Text
  const insightEl = document.getElementById("profPerfInsightText");
  if (insightEl) {
    if (perfScore >= 9.0) {
      insightEl.textContent = `Exceptional performer in ${sailor.trade || "Civil Operations"}. Consistently delivers outstanding quality, zero material wastage, and exemplary discipline across all ${evalStats.evaluatedDays} evaluated days. Recommended for specialized task leader roles.`;
    } else if (perfScore >= 7.5) {
      insightEl.textContent = `Reliable and disciplined ratee. Demonstrates solid competency in ${sailor.trade || "his trade"} with ${evalStats.evaluatedDays} days evaluated. Maintains steady output and good coordination with workshop supervisors.`;
    } else if (perfScore >= 6.0) {
      insightEl.textContent = `Satisfactory progress shown. Continues to meet standard benchmarks; further on-the-job guidance recommended to enhance speed and material economy.`;
    } else {
      insightEl.textContent = `Requires closer supervision and mentoring. Recommended for refresher practical workshops to improve task efficiency and attendance stability.`;
    }
  }

  // Competency Breakdown
  const qScore = Math.min(10, Math.max(1, (perfScore + 0.3))).toFixed(1);
  const effScore = Math.min(10, Math.max(1, (perfScore - 0.2))).toFixed(1);
  const discScore = Math.min(10, Math.max(1, (perfScore + 0.5))).toFixed(1);

  const qValEl = document.getElementById("profQualityVal");
  if (qValEl) qValEl.textContent = `${qScore} / 10`;
  const qBarEl = document.getElementById("profBarQuality");
  if (qBarEl) qBarEl.style.width = `${Math.min(100, Math.round((qScore / 10) * 100))}%`;

  const effValEl = document.getElementById("profEfficiencyVal");
  if (effValEl) effValEl.textContent = `${effScore} / 10`;
  const effBarEl = document.getElementById("profBarEfficiency");
  if (effBarEl) effBarEl.style.width = `${Math.min(100, Math.round((effScore / 10) * 100))}%`;

  const discValEl = document.getElementById("profDisciplineVal");
  if (discValEl) discValEl.textContent = `${discScore} / 10`;
  const discBarEl = document.getElementById("profBarDiscipline");
  if (discBarEl) discBarEl.style.width = `${Math.min(100, Math.round((discScore / 10) * 100))}%`;

  // Initialize and Render Period Attendance, Performance & Sick History
  const now = new Date();
  sailorProfileCalYear = now.getFullYear();
  sailorProfileCalMonth = now.getMonth();
  setSailorProfilePeriodMode("monthly");

  // SPECIAL RECORDS
  const specEl = document.getElementById("profSpecialRecords");
  if (specEl) {
    if (sailor.special_records && Array.isArray(sailor.special_records) && sailor.special_records.length > 0) {
      specEl.className = "space-y-2";
      specEl.innerHTML = sailor.special_records.map((r) => `
        <div class="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs">
          <p class="font-bold text-slate-800">${r.title || r}</p>
          ${r.date ? `<p class="text-[10px] text-slate-400 font-mono">${r.date}</p>` : ""}
        </div>
      `).join("");
    } else {
      specEl.className = "p-4 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 italic";
      specEl.textContent = "No special records found.";
    }
  }

  // ATTACHMENTS & PROJECTS
  const attachEl = document.getElementById("profAttachments");
  if (attachEl) {
    const currentAttach = sailor.attachments || (sailor.zone_assigned ? `Assigned to ${sailor.zone_assigned}` : null);
    if (currentAttach) {
      attachEl.className = "p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700";
      attachEl.textContent = typeof currentAttach === "string" ? currentAttach : JSON.stringify(currentAttach);
    } else {
      attachEl.className = "p-4 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 italic";
      attachEl.textContent = "Not attached to any project or base.";
    }
  }

  // PAST ATTACHMENTS
  const pastAttachEl = document.getElementById("profPastAttachments");
  if (pastAttachEl) {
    if (sailor.past_attachments && Array.isArray(sailor.past_attachments) && sailor.past_attachments.length > 0) {
      pastAttachEl.className = "space-y-2";
      pastAttachEl.innerHTML = sailor.past_attachments.map((pa) => `
        <div class="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs">
          <p class="font-bold text-slate-800">${pa.unit || pa.location || pa}</p>
          ${pa.period ? `<p class="text-[10px] text-slate-400 font-mono">${pa.period}</p>` : ""}
        </div>
      `).join("");
    } else {
      pastAttachEl.className = "p-4 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 italic";
      pastAttachEl.textContent = "No past attachment history found.";
    }
  }

  // LEAVE HISTORY (Pic 2 Style)
  const leaveListEl = document.getElementById("profLeaveHistoryList");
  const leaveEarnedTotal = document.getElementById("profLeaveEarnedTotal");
  if (leaveEarnedTotal) leaveEarnedTotal.textContent = `Earned: ${leaveDays} Days`;

  if (leaveListEl) {
    const defaultLeaveHistory = [
      { type: "L", range: "Aug 03, 2026 - Aug 16, 2026", days: 14 },
      { type: "L", range: "Jun 23, 2026 - Jun 29, 2026", days: 7 },
      { type: "L", range: "May 22, 2026 - May 31, 2026", days: 10 },
      { type: "L", range: "Apr 07, 2026 - Apr 14, 2026", days: 8 },
    ];
    const leaves = (sailor.leave_history && Array.isArray(sailor.leave_history) && sailor.leave_history.length > 0)
      ? sailor.leave_history
      : defaultLeaveHistory;

    leaveListEl.innerHTML = leaves.map((lh) => `
      <div class="p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl flex items-center justify-between transition-all hover:bg-blue-100/50">
        <div>
          <p class="text-xs font-bold text-blue-900">${lh.type || "L"}</p>
          <p class="text-[11px] text-blue-600 font-medium flex items-center gap-1 mt-0.5">
            <span>🕒</span> ${lh.range || lh.dates || lh.date || "Past Leave"}
          </p>
        </div>
        <span class="text-base font-black text-blue-900">${lh.days || lh.duration || 0} <span class="text-[11px] font-bold text-blue-600">d</span></span>
      </div>
    `).join("");
  }

  const modal = document.getElementById("sailorProfileModal");
  if (modal) {
    modal.classList.remove("hidden");
    const scrollBody = modal.querySelector(".overflow-y-auto");
    if (scrollBody) scrollBody.scrollTop = 0;
  }
}

// Global state and methods for Sailor Profile Period Attendance, Calendar & Sick History
window.currentSailorProfileId = null;
window.sailorProfileCalYear = (typeof window.sailorProfileCalYear !== "undefined") ? window.sailorProfileCalYear : new Date().getFullYear();
window.sailorProfileCalMonth = (typeof window.sailorProfileCalMonth !== "undefined") ? window.sailorProfileCalMonth : new Date().getMonth();
window.sailorProfilePeriodMode = "monthly";

function setSailorProfilePeriodMode(mode) {
  sailorProfilePeriodMode = mode;

  const btnM = document.getElementById("btnProfPeriodMonthly");
  const btnJ = document.getElementById("btnProfPeriodJoined");
  const btnC = document.getElementById("btnProfPeriodCustom");

  [btnM, btnJ, btnC].forEach((btn) => {
    if (btn) {
      btn.className = "px-2.5 py-1 rounded-lg font-medium text-slate-600 hover:text-slate-900 transition-all cursor-pointer";
    }
  });

  const mControls = document.getElementById("profPeriodMonthlyControls");
  const cControls = document.getElementById("profPeriodCustomControls");
  const jInfo = document.getElementById("profPeriodJoinedInfo");
  const calWrapper = document.getElementById("profCalendarGridWrapper");

  if (mode === "monthly") {
    if (btnM) btnM.className = "px-2.5 py-1 rounded-lg font-bold bg-teal-600 text-white shadow-xs transition-all cursor-pointer";
    if (mControls) mControls.classList.remove("hidden");
    if (cControls) cControls.classList.add("hidden");
    if (jInfo) jInfo.classList.add("hidden");
    if (calWrapper) calWrapper.classList.remove("hidden");
  } else if (mode === "since_joined") {
    if (btnJ) btnJ.className = "px-2.5 py-1 rounded-lg font-bold bg-teal-600 text-white shadow-xs transition-all cursor-pointer";
    if (mControls) mControls.classList.add("hidden");
    if (cControls) cControls.classList.add("hidden");
    if (jInfo) jInfo.classList.remove("hidden");
    if (calWrapper) calWrapper.classList.add("hidden");
  } else if (mode === "custom") {
    if (btnC) btnC.className = "px-2.5 py-1 rounded-lg font-bold bg-teal-600 text-white shadow-xs transition-all cursor-pointer";
    if (mControls) mControls.classList.add("hidden");
    if (cControls) cControls.classList.remove("hidden");
    if (jInfo) jInfo.classList.add("hidden");
    if (calWrapper) calWrapper.classList.add("hidden");
  }

  refreshSailorProfilePeriodData();
}

function navigateSailorProfileMonth(dir) {
  if (dir === 0) {
    const now = new Date();
    sailorProfileCalYear = now.getFullYear();
    sailorProfileCalMonth = now.getMonth();
  } else {
    sailorProfileCalMonth += dir;
    if (sailorProfileCalMonth < 0) {
      sailorProfileCalMonth = 11;
      sailorProfileCalYear--;
    } else if (sailorProfileCalMonth > 11) {
      sailorProfileCalMonth = 0;
      sailorProfileCalYear++;
    }
  }

  refreshSailorProfilePeriodData();
}

function calculateSailorLiveBMI() {
  const wInput = document.getElementById("profInputWeight");
  const hInput = document.getElementById("profInputHeight");
  const scoreDisp = document.getElementById("profBmiScoreDisplay");
  const catBadge = document.getElementById("profBmiCategoryBadge");
  const fitBadge = document.getElementById("profMedFitBadge");

  const w = parseFloat(wInput ? wInput.value : 0);
  const h = parseFloat(hInput ? hInput.value : 0);

  if (w > 20 && h > 50) {
    const hM = h / 100;
    const bmi = w / (hM * hM);
    if (scoreDisp) scoreDisp.textContent = bmi.toFixed(1);

    let catText = "Optimal (සාමාන්‍ය බර)";
    let catClass = "bg-emerald-100 text-emerald-800 border-emerald-300";
    let fitText = "Class A1 - Fully Fit";
    let fitClass = "bg-emerald-100 text-emerald-800 border-emerald-300";

    if (bmi < 18.5) {
      catText = "Underweight (අඩු බර)";
      catClass = "bg-amber-100 text-amber-800 border-amber-300";
      fitText = "Underweight - Nutrition Focus";
      fitClass = "bg-amber-100 text-amber-800 border-amber-300";
    } else if (bmi >= 25.0 && bmi < 30.0) {
      catText = "Overweight (වැඩි බර)";
      catClass = "bg-amber-100 text-amber-800 border-amber-300";
      fitText = "Overweight - Weight Mgmt";
      fitClass = "bg-amber-100 text-amber-800 border-amber-300";
    } else if (bmi >= 30.0) {
      catText = "Obese (තරබාරු)";
      catClass = "bg-rose-100 text-rose-800 border-rose-300";
      fitText = "Med Review (Obesity)";
      fitClass = "bg-rose-100 text-rose-800 border-rose-300";
    }

    if (catBadge) {
      catBadge.textContent = catText;
      catBadge.className = `px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${catClass}`;
    }

    const sailor = (store.sailors || []).find(
      (s) =>
        String(s.id) === String(currentSailorProfileId) ||
        String(s._fbKey) === String(currentSailorProfileId) ||
        String(s.official_number) === String(currentSailorProfileId),
    );
    if (fitBadge) {
      if (sailor && sailor.attendance === "Sick") {
        fitBadge.textContent = "🏥 Duty Restriction (Sick)";
        fitBadge.className = "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300";
      } else {
        fitBadge.textContent = fitText;
        fitBadge.className = `px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${fitClass}`;
      }
    }
  } else {
    if (scoreDisp) scoreDisp.textContent = "—";
    if (catBadge) {
      catBadge.textContent = "Enter W/H";
      catBadge.className = "px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200";
    }
  }
}

function saveSailorMeasurements() {
  const wInput = document.getElementById("profInputWeight");
  const hInput = document.getElementById("profInputHeight");
  const w = parseFloat(wInput ? wInput.value : 0);
  const h = parseFloat(hInput ? hInput.value : 0);

  const sailor = (store.sailors || []).find(
    (s) =>
      String(s.id) === String(currentSailorProfileId) ||
      String(s._fbKey) === String(currentSailorProfileId) ||
      String(s.official_number) === String(currentSailorProfileId),
  );
  if (!sailor) return;

  sailor.weight = w || null;
  sailor.height = h || null;
  if (w > 20 && h > 50) {
    const hM = h / 100;
    sailor.bmi = (w / (hM * hM)).toFixed(1);
  }

  showToast("Measurements & BMI saved successfully", "success");
}

function getSailorSickRecords(sailor) {
  if (!sailor) return [];
  const sId = String(sailor.id !== undefined && sailor.id !== null ? sailor.id : "");
  const sFbKey = String(sailor._fbKey || "");
  const offNo = String(sailor.official_number || sailor.offNo || sailor.off_no || "");

  const records = [];

  // 1. Scan store.availability for real medical/sick history (from sailors_details.php)
  if (store.availability && typeof store.availability === "object") {
    const sickDates = [];
    Object.keys(store.availability).forEach((mKey) => {
      const monthObj = store.availability[mKey];
      if (!monthObj || typeof monthObj !== "object") return;
      Object.keys(monthObj).forEach((dKey) => {
        const dayObj = monthObj[dKey];
        if (!dayObj || typeof dayObj !== "object") return;
        const val = (sFbKey && dayObj[sFbKey]) || (sId && dayObj[sId]) || (offNo && dayObj[offNo]);
        if (val && isSailorSickOnDate(val)) {
          const dd = String(dKey).padStart(2, "0");
          sickDates.push({ date: `${mKey}-${dd}`, status: String(val).trim() });
        }
      });
    });

    sickDates.sort((a, b) => a.date.localeCompare(b.date));

    if (sickDates.length > 0) {
      let curStart = sickDates[0].date;
      let curEnd = sickDates[0].date;
      let curCat = sickDates[0].status;

      for (let i = 1; i < sickDates.length; i++) {
        const prevD = new Date(curEnd + "T12:00:00");
        const nextD = new Date(sickDates[i].date + "T12:00:00");
        const diffDays = Math.round((nextD - prevD) / 86400000);

        if (diffDays === 1 && sickDates[i].status === curCat) {
          curEnd = sickDates[i].date;
        } else {
          const sDateObj = new Date(curStart + "T12:00:00");
          const eDateObj = new Date(curEnd + "T12:00:00");
          const days = Math.round((eDateObj - sDateObj) / 86400000) + 1;
          const hosp = /NGH/i.test(curCat) ? "Navy General Hospital" : (/ADM/i.test(curCat) ? "Naval Hospital (Admitted)" : "Naval Sick Quarters");
          records.push({
            date: curStart === curEnd ? curStart : `${curStart} to ${curEnd}`,
            category: curCat,
            days: days,
            reason: `Naval Medical Record (${curCat})`,
            hospital: hosp,
          });
          curStart = sickDates[i].date;
          curEnd = sickDates[i].date;
          curCat = sickDates[i].status;
        }
      }
      const sDateObj = new Date(curStart + "T12:00:00");
      const eDateObj = new Date(curEnd + "T12:00:00");
      const days = Math.round((eDateObj - sDateObj) / 86400000) + 1;
      const hosp = /NGH/i.test(curCat) ? "Navy General Hospital" : (/ADM/i.test(curCat) ? "Naval Hospital (Admitted)" : "Naval Sick Quarters");
      records.push({
        date: curStart === curEnd ? curStart : `${curStart} to ${curEnd}`,
        category: curCat,
        days: days,
        reason: `Naval Medical Record (${curCat})`,
        hospital: hosp,
      });
    }
  }

  // 2. If explicit sick_history array is stored on sailor
  if (Array.isArray(sailor.sick_history) && sailor.sick_history.length > 0) {
    sailor.sick_history.forEach((sh) => {
      records.push({
        date: sh.date || sh.dates || sh.range || getLocalDateString(),
        category: sh.category || sh.type || "SIQ",
        days: parseInt(sh.days || sh.duration || 1, 10),
        reason: sh.reason || sh.diagnosis || sh.remarks || "Attended Naval Sick Bay",
        hospital: sh.hospital || sh.location || "Sick Quarters",
      });
    });
  }

  // 3. Scan dailyAllocations for sick events
  const allocs = (store.dailyAllocations || []).filter((a) => {
    const aSailorId = String(a.sailor_id || "");
    const matches = (sId && aSailorId === sId) || (sFbKey && aSailorId === sFbKey) || (offNo && aSailorId === offNo);
    if (!matches) return false;
    const st = String(a.status || a.attendance || "");
    return isSailorSickOnDate(st);
  });

  allocs.forEach((a) => {
    let cat = "SIQ";
    const st = String(a.status || a.attendance || "").toUpperCase();
    if (st.includes("S/R") || st.includes("SICK REPORT")) cat = "S/R";
    else if (st.includes("ADM") || st.includes("ADMIT")) cat = "ADM";
    else if (st.includes("SL") || st.includes("SICK LEAVE")) cat = "SL";
    else if (st.includes("M/D")) cat = "M/D";
    else if (st.includes("NSL")) cat = "NSL";
    else if (st.includes("SIQ")) cat = "SIQ";
    else if (st.includes("NGH")) cat = "NGH";
    else if (st.includes("MED")) cat = "MED";

    const exists = records.some((r) => r.date === a.date);
    if (!exists) {
      records.push({
        date: a.date,
        category: cat,
        days: 1,
        reason: a.remarks || a.reason || "Duty Exemption (Sick)",
        hospital: a.hospital || "Sick Quarters",
      });
    }
  });

  // 4. If sailor currently has attendance === "Sick"
  if (sailor.attendance === "Sick" && records.length === 0) {
    records.push({
      date: getLocalDateString(),
      category: "SIQ",
      days: parseInt(sailor.sick_days || 1, 10),
      reason: sailor.sick_reason || sailor.medical_remarks || "Active Sick List",
      hospital: "Sick Quarters",
    });
  }

  records.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return records;
}

function refreshSailorProfilePeriodData() {
  const sailor = (store.sailors || []).find(
    (s) =>
      String(s.id) === String(currentSailorProfileId) ||
      String(s._fbKey) === String(currentSailorProfileId) ||
      String(s.official_number) === String(currentSailorProfileId),
  );
  if (!sailor) return;

  const sId = String(sailor.id !== undefined && sailor.id !== null ? sailor.id : "");
  const sFbKey = String(sailor._fbKey || "");
  const offNo = String(sailor.official_number || "");

  // Match allocations for this sailor
  const allocs = (store.dailyAllocations || []).filter((a) => {
    const aSailorId = String(a.sailor_id || "");
    return (sId && aSailorId === sId) || (sFbKey && aSailorId === sFbKey) || (offNo && aSailorId === offNo);
  });

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  let startDate = "";
  let endDate = "";
  let periodLabelText = "";

  if (sailorProfilePeriodMode === "monthly") {
    const mm = String(sailorProfileCalMonth + 1).padStart(2, "0");
    const lastDay = new Date(sailorProfileCalYear, sailorProfileCalMonth + 1, 0).getDate();
    startDate = `${sailorProfileCalYear}-${mm}-01`;
    endDate = `${sailorProfileCalYear}-${mm}-${String(lastDay).padStart(2, "0")}`;
    periodLabelText = `Period: ${monthNames[sailorProfileCalMonth]} ${sailorProfileCalYear}`;
  } else if (sailorProfilePeriodMode === "since_joined") {
    startDate = sailor.join_date || sailor.drafted_date || "2026-01-01";
    endDate = getLocalDateString();
    periodLabelText = `Since Base Join: ${startDate} to ${endDate}`;
    const jDateEl = document.getElementById("profPeriodJoinedDate");
    if (jDateEl) jDateEl.textContent = startDate;
  } else if (sailorProfilePeriodMode === "custom") {
    const fromEl = document.getElementById("profPeriodDateFrom");
    const toEl = document.getElementById("profPeriodDateTo");
    startDate = (fromEl && fromEl.value) ? fromEl.value : "2026-01-01";
    endDate = (toEl && toEl.value) ? toEl.value : getLocalDateString();
    periodLabelText = `Period: ${startDate} to ${endDate}`;
  }

  const lblEl = document.getElementById("profActivePeriodLabel");
  if (lblEl) lblEl.textContent = periodLabelText;

  // Filter allocations in range
  const filteredAllocs = allocs.filter((a) => {
    if (!a.date) return false;
    return a.date >= startDate && a.date <= endDate;
  });

  // Calculate duty days and evaluation scores in range
  let dutyDays = 0;
  let scoreSum = 0;
  let scoreCount = 0;
  filteredAllocs.forEach((a) => {
    dutyDays++;
    if (a.evaluated || (typeof a.score === "number" && a.score > 0)) {
      const sc = typeof a.score === "number" && a.score > 0 ? a.score : parseFloat(sailor.avgScore || 7.0);
      scoreSum += sc;
      scoreCount++;
    }
  });

  // Calculate Leave days in range (scan store.availability first)
  let leaveDaysCount = 0;
  if (store.availability && typeof store.availability === "object") {
    Object.keys(store.availability).forEach((mKey) => {
      const monthObj = store.availability[mKey];
      if (!monthObj || typeof monthObj !== "object") return;
      Object.keys(monthObj).forEach((dKey) => {
        const dd = String(dKey).padStart(2, "0");
        const dateStr = `${mKey}-${dd}`;
        if (dateStr >= startDate && dateStr <= endDate) {
          const dayObj = monthObj[dKey];
          if (!dayObj || typeof dayObj !== "object") return;
          const val = (sFbKey && dayObj[sFbKey]) || (sId && dayObj[sId]) || (offNo && dayObj[offNo]);
          if (val && isSailorOnLeaveOnDate(val, dateStr) && !isSailorSickOnDate(val)) {
            leaveDaysCount++;
          }
        }
      });
    });
  }
  if (leaveDaysCount === 0 && sailor.leave_history && Array.isArray(sailor.leave_history)) {
    sailor.leave_history.forEach((lh) => {
      leaveDaysCount += parseInt(lh.days || lh.duration || 0, 10);
    });
  }
  if (leaveDaysCount === 0 && sailor.attendance === "Leave") {
    leaveDaysCount = calculateSailorLeaveDays(sailor);
  }

  // Extract Sick records
  const allSickRecords = getSailorSickRecords(sailor);
  const filteredSickRecords = allSickRecords.filter((r) => {
    if (!r.date) return true;
    return r.date >= startDate && r.date <= endDate;
  });

  let sickDaysCount = 0;
  const catCountMap = {};
  filteredSickRecords.forEach((r) => {
    sickDaysCount += r.days || 1;
    const cat = r.category || "SIQ";
    catCountMap[cat] = (catCountMap[cat] || 0) + (r.days || 1);
  });

  // If monthly, render calendar grid
  if (sailorProfilePeriodMode === "monthly") {
    renderSailorProfileCalendar(sailor, sailorProfileCalYear, sailorProfileCalMonth);
  }

  // Update Stats Bar
  const lCountEl = document.getElementById("profCalLeaveCount");
  if (lCountEl) lCountEl.textContent = leaveDaysCount;
  const sCountEl = document.getElementById("profCalSickCount");
  if (sCountEl) sCountEl.textContent = sickDaysCount;
  const dCountEl = document.getElementById("profCalDutyCount");
  if (dCountEl) dCountEl.textContent = dutyDays;

  const avgScore = scoreCount > 0 ? (scoreSum / scoreCount).toFixed(2) : parseFloat(sailor.avgScore || 7.0).toFixed(2);
  const avgEl = document.getElementById("profCalMonthAvgScore");
  if (avgEl) avgEl.textContent = avgScore;

  // Render Sick Categories Pills
  const pillsEl = document.getElementById("profSickCategoriesPills");
  if (pillsEl) {
    const cats = Object.keys(catCountMap);
    if (cats.length === 0) {
      pillsEl.innerHTML = `<span class="text-slate-400 italic">No sick categories recorded in this period.</span>`;
    } else {
      const catLabels = {
        SIQ: "🏥 SIQ (Sick in Quarters)",
        "S/R": "📋 S/R (Sick Report)",
        ADM: "🏥 ADM (Hospital Admission)",
        SL: "🏖️ SL (Sick Leave)",
        "M/D": "🩺 M/D (Medical Officer Attending)",
        NSL: "⚓ NSL (Naval Sick List)",
        ED: "🛡️ ED (Excused Duty)",
      };
      pillsEl.innerHTML = cats.map((cat) => {
        const lbl = catLabels[cat] || `🏥 ${cat}`;
        const days = catCountMap[cat];
        return `
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 font-bold border border-rose-200">
            ${lbl}: <strong class="text-rose-900 font-black">${days}d</strong>
          </span>
        `;
      }).join("");
    }
  }

  // Update Sick Incidents Badge
  const incBadge = document.getElementById("profSickIncidentsBadge");
  if (incBadge) {
    incBadge.textContent = `${filteredSickRecords.length} Incidents (${sickDaysCount} Days)`;
  }

  // Render Detailed Sick Incidents List
  const listEl = document.getElementById("profSickHistoryList");
  if (listEl) {
    if (filteredSickRecords.length === 0) {
      listEl.innerHTML = `
        <div class="p-4 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 italic">
          No sick or medical incidents recorded for this period.
        </div>
      `;
    } else {
      listEl.innerHTML = filteredSickRecords.map((sr) => `
        <div class="p-3 bg-rose-50/70 border border-rose-200/80 rounded-xl flex items-center justify-between transition-all hover:bg-rose-100/60">
          <div class="space-y-0.5">
            <div class="flex items-center gap-2">
              <span class="inline-block px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white uppercase">${sr.category || "SIQ"}</span>
              <span class="text-xs font-bold text-slate-800">${sr.reason || "Sick Bay Medical Attention"}</span>
            </div>
            <p class="text-[11px] text-slate-500 font-medium flex items-center gap-2">
              <span>📅 ${sr.date}</span>
              <span>🏥 ${sr.hospital || "Sick Quarters"}</span>
            </p>
          </div>
          <span class="text-sm font-black text-rose-700 bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-300">
            ${sr.days || 1} <span class="text-[10px] font-bold text-rose-600">Days</span>
          </span>
        </div>
      `).join("");
    }
  }
}

function renderSailorProfileCalendar(sailor, year, month) {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const titleEl = document.getElementById("profCalMonthYear");
  if (titleEl) titleEl.textContent = `${monthNames[month]} ${year}`;

  const grid = document.getElementById("profCalendarGrid");
  if (!grid) return;

  const firstDayIndex = new Date(year, month, 1).getDay();
  const mondayOffset = (firstDayIndex + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const sId = String(sailor.id !== undefined && sailor.id !== null ? sailor.id : "");
  const sFbKey = String(sailor._fbKey || "");
  const offNo = String(sailor.official_number || "");

  const allocs = (store.dailyAllocations || []).filter((a) => {
    const aSailorId = String(a.sailor_id || "");
    return (sId && aSailorId === sId) || (sFbKey && aSailorId === sFbKey) || (offNo && aSailorId === offNo);
  });
  const allocDateMap = new Map();
  allocs.forEach((a) => {
    if (a.date) allocDateMap.set(a.date, a);
  });

  const todayStr = getLocalDateString();
  const cells = [];

  for (let i = 0; i < mondayOffset; i++) {
    cells.push(`<div class="bg-slate-50 min-h-[50px] p-1 text-slate-300 select-none"></div>`);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    const dateStr = `${year}-${mm}-${dd}`;
    const dayOfWeek = new Date(year, month, d).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isToday = dateStr === todayStr;

    const alloc = allocDateMap.get(dateStr);
    let dayType = "available";
    let badgeText = "";
    let scoreBadge = "";

    const liveSt = getSailorLiveDailyStatus(sailor, dateStr);
    if (liveSt.isLeave) {
      dayType = "leave";
      badgeText = `<span class="inline-block px-1 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">🏖️ Leave</span>`;
    } else if (liveSt.isSick) {
      dayType = "sick";
      badgeText = `<span class="inline-block px-1 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-300">🏥 Sick</span>`;
    } else if (alloc) {
      dayType = "duty";
      const hasScore = typeof alloc.score === "number" && alloc.score > 0;
      if (hasScore || alloc.evaluated) {
        const sc = hasScore ? alloc.score : parseFloat(sailor.avgScore || 7.0);
        scoreBadge = `<span class="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">⭐ ${sc.toFixed(1)}</span>`;
      }
      badgeText = `<span class="inline-block px-1 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 truncate max-w-full">🏗️ Duty</span>`;
    } else if (isWeekend) {
      badgeText = `<span class="inline-block px-1 py-0.5 rounded text-[9px] font-medium text-slate-400">Off</span>`;
    }

    let bgStyle = "bg-white";
    if (dayType === "leave") bgStyle = "bg-amber-50/40";
    else if (dayType === "sick") bgStyle = "bg-rose-50/40";
    else if (dayType === "duty") bgStyle = "bg-blue-50/30";

    const todayRing = isToday ? "ring-2 ring-teal-500 font-black bg-teal-50/30" : "";

    cells.push(`
      <div class="${bgStyle} ${todayRing} min-h-[50px] p-1 flex flex-col justify-between transition-colors hover:bg-slate-100/80 group">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold ${isWeekend ? "text-rose-600" : "text-slate-700"}">${d}</span>
          ${scoreBadge}
        </div>
        <div class="mt-0.5 flex flex-col gap-0.5">
          ${badgeText}
        </div>
      </div>
    `);
  }

  const remaining = (7 - (cells.length % 7)) % 7;
  for (let i = 0; i < remaining; i++) {
    cells.push(`<div class="bg-slate-50 min-h-[50px] p-1 text-slate-300 select-none"></div>`);
  }

  grid.innerHTML = cells.join("");
}

// ============================================================================
// CMSys Module: Summary View, Special Admin Zone Helpers & PWA Theme Controller
// File: js/modules/summary-view.js
// ============================================================================

window._isTogglingViewsBasedOnZone = false;
window._isHistoryBackAction = false;

// =============================================
// N/A STATUS VIEW
// =============================================
function renderNastatusView() {
  if (!store.sailors) return;
  const tbody = document.getElementById("nastatusTableBody");
  if (!tbody) return;

  const today = getLocalDateString();
  const dateVal = (store && store.dashboardDate) || today;
  const isLeaveState = (val) => isSailorOnLeaveOnDate(val, dateVal);

  const naSailors = store.sailors.filter(s => {
    const fbStatus = getSailorDailyAttendanceStatus(s, dateVal);
    const allocKey = `${dateVal}_${s._fbKey || s.id}`;
    const alloc = store.dailyAllocationsMap
      ? store.dailyAllocationsMap[allocKey]
      : (store.dailyAllocations || []).find((a) => a && a.date === dateVal && (a.sailor_id === s._fbKey || a.sailor_id === s.id || a.official_number === s.official_number));
    if (alloc && alloc.status === "Active") return false;
    return isLeaveState(fbStatus) || (isLeaveState(s.attendance) && s.attendance && s.attendance.toLowerCase() !== "present");
  });
  
  const countEl = document.getElementById("nastatusTotalCount");
  if (countEl) countEl.textContent = naSailors.length;

  let html = "";
  naSailors.forEach((s, idx) => {
    const fbStatus = getSailorDailyAttendanceStatus(s, dateVal);
    let statusText = fbStatus || s.status;
    if (!isLeaveState(statusText)) statusText = s.attendance;
    if (!statusText) statusText = "N/A";
    
    const durationDisplay = calculateSailorNADuration(s);
    const yesterdayJobText = getSailorYesterdayJobText(s);

    html += `
      <tr class="hover:bg-slate-800/50 transition-colors border-b border-slate-800/40">
        <td class="p-3 pl-4 text-slate-400 font-mono">${idx + 1}</td>
        <td class="p-3">
          <div class="font-medium text-slate-200">${s.name}</div>
          <div class="text-[10px] text-slate-500 font-mono">${s.rank}</div>
        </td>
        <td class="p-3 text-center">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
            ${statusText}
          </span>
        </td>
        <td class="p-3 text-center">
          <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/20">
            ⏱️ ${durationDisplay}
          </span>
        </td>
        <td class="p-3 text-right pr-4 text-slate-300 text-xs font-medium truncate max-w-[220px]" title="${yesterdayJobText}">
          ${yesterdayJobText}
        </td>
      </tr>
    `;
  });

  if (naSailors.length === 0) {
    html = `<tr><td colspan="5" class="p-8 text-center text-slate-500">No N/A sailors found today.</td></tr>`;
  }

  tbody.innerHTML = html;
}


// ADMIN & STAFF DUTIES (SPECIAL ZONE) HELPERS
// =============================================
// _lmdExportAction moved to js/modules/locations-maintenance.js
window._isTogglingViewsBasedOnZone = false;
function toggleViewsBasedOnZone() {
  if (_isTogglingViewsBasedOnZone) return;
  _isTogglingViewsBasedOnZone = true;
  try {
    var _document$getElementB13;
    const isSpecialZone = isAdminStaffDuties(store.currentZone);
    const sbsActive = typeof isSbsBookActive === "function" ? isSbsBookActive() : true;

    // Exact Tab Visibility Configuration:
    // 1. Zone: Dashboard, Daily Details, Summary, Job Card, Inventory, Estimates, Documents, Sailors, LMD, Reports, Settings
    // 2. Admin & Staff Duties: Dashboard, Daily Details, Summary, Documents, SBS Book (if active), Sailors, Projects, Settings
    const tabVisibility = {
      "tab-dashboard": true,
      "tab-dailydetails": true,
      "tab-summary": true,
      "tab-nastatus": false,
      "tab-jobcards": !isSpecialZone,
      "tab-inventory": !isSpecialZone,
      "tab-estimates": !isSpecialZone,
      "tab-documents": true,
      "tab-sbs-book": false,
      "tab-sailors": true,
      "tab-maintenance": !isSpecialZone,
      "tab-reports": !isSpecialZone,
      "tab-projects": true,
      "tab-settings": true,
    };

    Object.entries(tabVisibility).forEach(([tabId, isVisible]) => {
      const el = document.getElementById(tabId);
      if (el) {
        el.style.display = isVisible ? "" : "none";
      }
    });

    // Allowed Views check and auto-fallback
    const allowedViews = isSpecialZone
      ? ["dashboard", "dailydetails", "summary", "documents", "sailors", "projects", "settings"]
      : ["dashboard", "dailydetails", "summary", "jobcards", "inventory", "estimates", "documents", "sailors", "maintenance", "reports", "projects", "settings"];

    const currentView = store.currentView || "dashboard";

    if (currentView === "settings" || currentView === "documents" || currentView === "reports" || currentView === "projects") {
      return;
    }

    if (
      isSpecialZone &&
      ["jobcards", "inventory", "estimates", "maintenance"].includes(
        currentView,
      )
    ) {
      switchView("dashboard");
      return;
    }

    // Auto-redirect if current view is not permitted in the newly selected zone
    if (currentView && !allowedViews.includes(currentView)) {
      switchView("dashboard");
    } // Revert sidebar, sidebar toggle, mainPanel and boardGrid display changes (always use normal layout)
    const leftSidebar = document.getElementById("leftSidebarContainer");
    if (leftSidebar) {
      leftSidebar.style.display = "";
    }
    const sidebarToggle = document.getElementById("sidebarToggleBtn");
    if (sidebarToggle) {
      sidebarToggle.style.display = "";
    }
    const mainPanel =
      (_document$getElementB13 =
        document.getElementById("boardGridContainer")) === null ||
      _document$getElementB13 === void 0
        ? void 0
        : _document$getElementB13.parentElement;
    if (mainPanel) {
      mainPanel.classList.remove("md:col-span-12");
      mainPanel.classList.add("md:col-span-9");
    }
    const boardGrid = document.getElementById("boardGridContainer");
    if (boardGrid) {
      boardGrid.style.display = "";
    }
    const boardEmpty = document.getElementById("boardEmptyState");
    if (boardEmpty) {
      boardEmpty.style.display = "";
    }
    const ongoingSummary = document.getElementById("ongoingTasksSummaryWrapper");
    if (ongoingSummary) {
      ongoingSummary.style.display = "";
    } // Keep dashboard-level print button visible
    [
      "dashboardPrintBtn",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.style.display = "";
    });
  } finally {
    _isTogglingViewsBasedOnZone = false;
  }
}
function getDailyDetailsWorksForZone(z, dateVal) {
  if (!z) return [];
  const today = getLocalDateString();
  if (!dateVal) dateVal = store.dashboardDate || today;

  const isZoneMatchLocal = (zoneId) => {
    if (!zoneId) return false;
    if (isAdminStaffDuties(z.id)) return isAdminStaffDuties(zoneId);
    return isZoneMatch(zoneId, z.id) || isZoneMatch(zoneId, z.name);
  };

  // 1. Committed, active Work Orders for this zone
  const wos = (store.workOrders || []).filter((wo) => {
    if (!wo || wo.status === "Cancelled") return false;
    const matchesZone =
      isZoneMatchLocal(wo.zone_id || wo.zone) ||
      (wo.assign_type && isZoneMatchLocal(wo.description));
    if (!matchesZone) return false;
    return isWorkOrderActiveOnDate(wo, dateVal) && isWorkOrderCommittedToday(wo, dateVal);
  });

  const existingWoKeys = new Set(
    wos.map((w) => String(w.id || w._fbKey || "")).filter(Boolean)
  );
  const existingWoDescs = new Set(
    wos.map((w) => (w.description || w.title || "").trim().toLowerCase()).filter(Boolean)
  );

  // 2. Standalone Job Cards for this zone (exclude any JC linked to an existing WO, or duplicate desc)
  const jcs = (store.jobCards || []).filter((jc) => {
    if (!jc || jc.status === "Cancelled") return false;
    if (jc.work_order_id && existingWoKeys.has(String(jc.work_order_id))) return false;
    const jcDesc = (jc.description || jc.title || "").trim().toLowerCase();
    if (jcDesc && existingWoDescs.has(jcDesc)) return false;
    if (!isZoneMatchLocal(jc.zone_id || jc.zone)) return false;
    return isWorkOrderActiveOnDate(jc, dateVal) && isWorkOrderCommittedToday(jc, dateVal);
  });

  const seenWorkIds = new Set();
  const allWorks = [...wos, ...jcs].filter((w) => {
    const wid = String(w.id || w._fbKey || "");
    if (!wid || seenWorkIds.has(wid)) return false;
    seenWorkIds.add(wid);
    return true;
  });

  allWorks.sort((a, b) => {
    const aInCharge = (a.description || a.title || "").toLowerCase().trim() === "in charge" || a.assign_type === "In Charge";
    const bInCharge = (b.description || b.title || "").toLowerCase().trim() === "in charge" || b.assign_type === "In Charge";
    if (aInCharge && !bInCharge) return -1;
    if (!aInCharge && bInCharge) return 1;
    return 0;
  });

  return allWorks;
}

function renderDailyDetailsSpecialView() {
  const today = getLocalDateString();
  const dateVal = store.dashboardDate || today;
  let dailyDetailsContainer = document.getElementById("dailyDetailsContainer");
  if (!dailyDetailsContainer) {
    console.log("🔵 dailyDetailsContainer NOT found, creating...");
    dailyDetailsContainer = document.createElement("div");
    dailyDetailsContainer.id = "dailyDetailsContainer";
    dailyDetailsContainer.className = "glass-card p-6 mt-4";
    document
      .getElementById("boardGridContainer")
      .parentElement.appendChild(dailyDetailsContainer);
  }
  dailyDetailsContainer.classList.remove("hidden");
  dailyDetailsContainer.style.display = "block";
  const zones = store.zones; // included Admin & Staff Duties
  let tableRows = "";
  let hasAllocations = false;
  zones.forEach((z) => {
    const allZoneTasks = getDailyDetailsWorksForZone(z, dateVal);

    // Find if this zone has any active allocations and collect unique sailors
    const zoneSailorMap = new Map();
    allZoneTasks.forEach((wo) => {
      const { sailors: sailorsInWo } = getWorkOrderAssignedSailors(wo, dateVal);
      sailorsInWo.forEach((s) => {
        const key = String(s.id || s._fbKey);
        if (!zoneSailorMap.has(key)) zoneSailorMap.set(key, s);
      });
    });

    const zoneSailors = Array.from(zoneSailorMap.values());
    const zoneHasAllocations = zoneSailors.length > 0;

    if (zoneHasAllocations) {
      hasAllocations = true;
      const totalCount = zoneSailors.length;
      const isSsRank = (rankStr) => {
        if (!rankStr) return false;
        const r = rankStr.trim().toUpperCase();
        return (
          /^(PO|CPO|FCPO|MCPO|MCA|CPOA|WPO|SWPO)/.test(r) ||
          r.includes("PO") ||
          r.includes("CPO") ||
          r.includes("CHIEF") ||
          r.includes("MCA")
        );
      };
      const ssCount = zoneSailors.filter((s) => isSsRank(s.rank)).length;

      const tradeCounts = {};
      zoneSailors.forEach((s) => {
        const t = (s.trade || "Other").trim().toUpperCase();
        tradeCounts[t] = (tradeCounts[t] || 0) + 1;
      });
      const tradeSummaryStr =
        Object.entries(tradeCounts)
          .map(([trade, count]) => `${trade}: ${count}`)
          .join(" | ") || "None";

      // Add Zone Group Header row spanning all 6 columns
      tableRows += `
                <tr class="bg-slate-900 text-white font-bold">
                    <td colspan="6" class="px-4 py-2.5 text-xs uppercase tracking-wider">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <div class="flex items-center gap-2">
                                <span>🗺️ ZONE: ${z.name.toUpperCase()}</span>
                                <span class="bg-teal-950/80 text-teal-300 px-2 py-0.5 rounded-full text-[10px] border border-teal-700/50 font-bold tracking-normal normal-case">
                                    👥 Total: ${totalCount}
                                </span>
                            </div>
                            <div class="flex flex-wrap items-center gap-2 text-[11px] font-normal normal-case">
                                <span class="bg-amber-950/90 text-amber-300 px-2.5 py-0.5 rounded-md border border-amber-600/50 font-semibold shadow-sm">
                                    🎖️ S/S: ${ssCount}
                                </span>
                                <span class="bg-slate-800/90 text-slate-200 px-2.5 py-0.5 rounded-md border border-slate-700 font-medium">
                                    🛠️ ${tradeSummaryStr}
                                </span>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
      const seenSailorKeysInZone = new Set();
      allZoneTasks.forEach((wo) => {
        const { sailors: assignedSailors } = getWorkOrderAssignedSailors(wo, dateVal);
        const uniqueSailors = (assignedSailors || []).filter((s) => {
          const sKey = String(s.id || s._fbKey || s.official_number || s.service_no || s.name || "");
          if (!sKey || seenSailorKeysInZone.has(sKey)) return false;
          seenSailorKeysInZone.add(sKey);
          return true;
        });

        if (uniqueSailors.length > 0) {
          // Add Work Order separator row
          tableRows += `
                        <tr class="bg-slate-50 font-bold border-b border-slate-200">
                            <td colspan="6" class="px-4 py-2 text-[10px] text-slate-700 text-center underline uppercase tracking-wide">
                                📋 ${(wo.description || wo.title || "ACTIVE WORK").toUpperCase()}
                            </td>
                        </tr>
                    `;
          uniqueSailors.forEach((s, idx) => {
            const serNo = String(idx + 1).padStart(2, "0");
            const parsedOffNo = parseOfficialNumber(
              s.official_number || s.service_no,
            );
            tableRows += `
                            <tr class="hover:bg-slate-50 border-b border-slate-100 transition-colors text-xs text-slate-800">
                                <td class="px-4 py-2 text-center font-medium">${serNo}</td>
                                <td class="px-4 py-2">${s.rank || "AB"}</td>
                                <td class="px-4 py-2 font-semibold text-slate-900">${s.name}</td>
                                <td class="px-4 py-2 text-center"><span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-medium">${parsedOffNo.type}</span></td>
                                <td class="px-4 py-2 font-mono">${parsedOffNo.num}</td>
                                <td class="px-4 py-2 text-center"><span class="bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-bold">${s.trade || "—"}</span></td>
                            </tr>
                        `;
          });
        }
      });
    }
  });  // ─────────────────────────────────────────────
  // APPEND LONG-TERM DEPLOYMENTS (HOUSING, OUT, OTHER BASE)
  // ─────────────────────────────────────────────
  if (typeof invalidateLongTermAllocationsCache === "function") {
    invalidateLongTermAllocationsCache();
  }
  const longTerm = typeof getLongTermAllocations === "function"
    ? getLongTermAllocations(dateVal)
    : { housing: [], outProject: [], otherBase: [] };

  const renderLongTermCategory = (
    title,
    icon,
    dataArray
  ) => {
    if (!dataArray || dataArray.length === 0) return;
    const grouped = {};
    dataArray.forEach((item) => {
      if (!item || !item.sailor) return;
      const s = item.sailor;
      const isLeave = (typeof isSailorOnLeaveOnDate === "function" && isSailorOnLeaveOnDate(s, dateVal)) ||
        (s.attendance && s.attendance.toLowerCase() !== "present" && (s.attendance === "Leave" || s.attendance === "Sick")) ||
        (s.status === "Leave" || s.status === "Sick");
      if (isLeave) return;
      const p = item.projectName || "General Deployment";
      if (!grouped[p]) grouped[p] = [];
      grouped[p].push(s);
    });

    const activeProjects = Object.keys(grouped);
    if (activeProjects.length === 0) return;

    // Collect unique sailors across this entire category
    const catSailorsMap = new Map();
    activeProjects.forEach((projName) => {
      (grouped[projName] || []).forEach((s) => {
        const k = String(s._fbKey || s.id || s.official_number || s.service_no || s.name || "");
        if (k && !catSailorsMap.has(k)) catSailorsMap.set(k, s);
      });
    });

    const catSailors = Array.from(catSailorsMap.values());
    if (catSailors.length === 0) return;

    hasAllocations = true;
    const totalCount = catSailors.length;
    const isSsRank = (rankStr) => {
      if (!rankStr) return false;
      const r = rankStr.trim().toUpperCase();
      return (
        /^(PO|CPO|FCPO|MCPO|MCA|CPOA|WPO|SWPO)/.test(r) ||
        r.includes("PO") ||
        r.includes("CPO") ||
        r.includes("CHIEF") ||
        r.includes("MCA")
      );
    };
    const ssCount = catSailors.filter((s) => isSsRank(s.rank)).length;

    const tradeCounts = {};
    catSailors.forEach((s) => {
      const t = (s.trade || "Other").trim().toUpperCase();
      tradeCounts[t] = (tradeCounts[t] || 0) + 1;
    });
    const tradeSummaryStr =
      Object.entries(tradeCounts)
        .map(([trade, count]) => `${trade}: ${count}`)
        .join(" | ") || "None";

    // Category Header styled exactly like Zone Group Header
    tableRows += `
      <tr class="bg-slate-900 text-white font-bold">
          <td colspan="6" class="px-4 py-2.5 text-xs uppercase tracking-wider">
              <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                      <span>${icon} ${title.toUpperCase()}</span>
                      <span class="bg-teal-950/80 text-teal-300 px-2 py-0.5 rounded-full text-[10px] border border-teal-700/50 font-bold tracking-normal normal-case">
                          👥 Total: ${totalCount}
                      </span>
                  </div>
                  <div class="flex flex-wrap items-center gap-2 text-[11px] font-normal normal-case">
                      <span class="bg-amber-950/90 text-amber-300 px-2.5 py-0.5 rounded-md border border-amber-600/50 font-semibold shadow-sm">
                          🎖️ S/S: ${ssCount}
                      </span>
                      <span class="bg-slate-800/90 text-slate-200 px-2.5 py-0.5 rounded-md border border-slate-700 font-medium">
                          🛠️ ${tradeSummaryStr}
                      </span>
                  </div>
              </div>
          </td>
      </tr>
    `;

    const seenSailorKeysInCat = new Set();
    activeProjects.forEach((projName) => {
      const projSailors = (grouped[projName] || []).filter((s) => {
        const sKey = String(s.id || s._fbKey || s.official_number || s.service_no || s.name || "");
        if (!sKey || seenSailorKeysInCat.has(sKey)) return false;
        seenSailorKeysInCat.add(sKey);
        return true;
      });

      if (projSailors.length > 0) {
        tableRows += `
          <tr class="bg-slate-50 font-bold border-b border-slate-200">
              <td colspan="6" class="px-4 py-2 text-[10px] text-slate-700 text-center underline uppercase tracking-wide">
                  📋 PROJECT: ${projName.toUpperCase()}
              </td>
          </tr>
        `;
        projSailors.forEach((s, idx) => {
          const serNo = String(idx + 1).padStart(2, "0");
          const parsedOffNo = parseOfficialNumber(
            s.official_number || s.service_no,
          );
          tableRows += `
            <tr class="hover:bg-slate-50 border-b border-slate-100 transition-colors text-xs text-slate-800">
                <td class="px-4 py-2 text-center font-medium">${serNo}</td>
                <td class="px-4 py-2">${s.rank || "AB"}</td>
                <td class="px-4 py-2 font-semibold text-slate-900">${s.name}</td>
                <td class="px-4 py-2 text-center"><span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-medium">${parsedOffNo.type}</span></td>
                <td class="px-4 py-2 font-mono">${parsedOffNo.num}</td>
                <td class="px-4 py-2 text-center"><span class="bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-bold">${s.trade || "—"}</span></td>
            </tr>
          `;
        });
      }
    });
  };

  renderLongTermCategory("HOUSING PROJECTS", "🏠", longTerm.housing);
  renderLongTermCategory("OUT PROJECTS", "🏗️", longTerm.outProject);
  renderLongTermCategory("OTHER BASE", "⚓", longTerm.otherBase);
  if (!hasAllocations) {
    tableRows = `
            <tr>
                <td colspan="6" class="px-4 py-8 text-center text-slate-400 italic text-sm">
                    No active assignments logged for this date.
                </td>
            </tr>
        `;
  }
  dailyDetailsContainer.innerHTML = `
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
            <div>
                <h3 class="text-lg font-bold text-slate-800">📋 Daily Details - All Zones</h3>
                <p class="text-xs text-slate-500 mt-0.5">Overview of sailor allocations across all zones</p>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
                <button onclick="openLmdExportModal('csv')" class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all">
                     Export CSV
                </button>
                <button onclick="openLmdExportModal('print')" class="bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all">
                     Print / PDF
                </button>
                <button onclick="openLmdExportModal('pdf')" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all" title="Download PDF Backup">
                     💾 Download PDF
                </button>
                <button onclick="uploadWorkOrdersPdfToDrive()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all" title="Upload PDF to Google Drive">
                     ☁️ Upload to Google Drive
                </button>
                <button onclick="openLmdExportModal('whatsapp')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all">
                     WhatsApp Share
                </button>
            </div>
        </div>
        
        <div class="overflow-x-auto rounded-xl border border-slate-100">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                        <th class="px-4 py-3 w-[10%] text-center">Ser No</th>
                        <th class="px-4 py-3 w-[15%]">Rank</th>
                        <th class="px-4 py-3 w-[35%]">Name</th>
                        <th class="px-4 py-3 w-[15%] text-center">Service Type</th>
                        <th class="px-4 py-3 w-[15%]">Service No</th>
                        <th class="px-4 py-3 w-[10%] text-center">Trade</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;
}
// SUMMARY VIEW IMPLEMENTATION
// =============================================
function renderSummaryView() {
  const today = getLocalDateString();
  const dateVal = store.dashboardDate || today; // Update active date displays
  const dateDisplay = document.getElementById("summaryActiveDate");
  if (dateDisplay) dateDisplay.textContent = dateVal;
  const summaryDatePicker = document.getElementById("summaryDatePicker");
  if (summaryDatePicker && summaryDatePicker.value !== dateVal) {
    summaryDatePicker.value = dateVal;
  }
  const printDateDisplay = document.getElementById("printSummaryDate");
  if (printDateDisplay)
    printDateDisplay.textContent = dateVal.replace(/-/g, "."); // 1. Fetch allocations for the active date
  const activeAllocations = (store.dailyAllocations || []).filter(
    (a) => a.date === dateVal,
  ); // Helper to resolve sailor's category (VSS/Regular) and trade index
  function getSailorBranchAndTradeIdx(sailor) {
    const isVss = sailor.category === "VAS";
    let tradeIdx = -1;
    if (isVss) {
      const vssTrades = ["MA", "CA", "PA", "PL", "BB", "RW", "WL", "AL", "SW"]; // Normalize WL / WE
      let t = (sailor.trade || "MA").toUpperCase();
      if (t === "WE" || t === "WEL") t = "WL";
      tradeIdx = vssTrades.indexOf(t);
      if (tradeIdx === -1) tradeIdx = 0; // Fallback to MA
    } else {
      const regTrades = ["S/S", "LME", "ME", "OJT"]; // Determine category index
      const rank = (sailor.rank || "AB").toUpperCase();
      const trade = (sailor.trade || "").toUpperCase();
      if (
        rank.includes("CPO") ||
        rank.includes("PO") ||
        rank.includes("CHIEF")
      ) {
        tradeIdx = 0; // S/S
      } else if (rank === "LME" || trade === "LME" || rank.startsWith("L")) {
        tradeIdx = 1; // LME
      } else if (rank === "ME" || trade === "ME" || rank.startsWith("M")) {
        tradeIdx = 2; // ME
      } else if (
        rank.startsWith("OJT") ||
        rank.startsWith("APP") ||
        rank.startsWith("TRAIN") ||
        trade.startsWith("OJT")
      ) {
        tradeIdx = 3; // OJT
      } else {
        tradeIdx = 2; // Default to ME
      }
    }
    return { isVss, tradeIdx };
  } // Initialize counts matrix helper
  function createRowMatrix(description) {
    return {
      description: description,
      vss: [0, 0, 0, 0, 0, 0, 0, 0, 0], // MA, CA, PA, PL, BB, RW, WL, AL, SW
      reg: [0, 0, 0, 0], // S/S, LME, ME, OJT
      vssSub: 0,
      regSub: 0,
      fullTotal: 0,
    };
  } // 2. Define the structure of our sections dynamically
  const sections = {
    workshop: {
      title: "WORKSHOP",
      subsections: {},
    },
    zones: {
      title: "ZONE",
      subsections: {},
    },
    othersDuty: { title: "OTHERS DUTY DOCK YARD", rows: {} },
    outProjects: { title: "OUT PROJECTS", rows: {} },
    housingProjects: { title: "HOUSING PROJECTS", rows: {} },
    otherBases: { title: "OTHER BASES", rows: {} },
    leaveSick: { title: "LEAVE, SICK & ATTENDANCE", rows: {} },
  };

  const workshopZoneIds = [
    "Carpentry-Shop",
    "Paint-Workshop",
    "Signwriter",
    "Welding-Shop",
    "Concrete-Precast",
    "Aluminum-Work-Shop",
    "Blacksmith",
    "Pump-House",
  ];

  // Dynamically build workshop & zone subsections based on user's defined zones
  if (store.zones) {
    store.zones.forEach((z) => {
      const isWorkshop =
        workshopZoneIds.includes(z.id) ||
        z.id.toLowerCase().includes("shop") ||
        z.id.toLowerCase().includes("signwriter");
      if (isWorkshop) {
        sections.workshop.subsections[z.id] = {
          title: z.name.toUpperCase(),
          rows: {},
        };
      } else if (
        ![
          "Admin-&-Staff-Duties",
          "Other-Base",
          "Out-Project",
          "Housing-Project",
        ].includes(z.id)
      ) {
        sections.zones.subsections[z.id] = {
          title: z.name.toUpperCase(),
          rows: {},
        };
      }
    });
  }

  // Helper to get the correct section based on zoneId
  function getSectionForZone(zoneId) {
    const isWorkshop =
      workshopZoneIds.includes(zoneId) ||
      (zoneId && zoneId.toLowerCase().includes("shop")) ||
      (zoneId && zoneId.toLowerCase().includes("signwriter"));
    if (isWorkshop) {
      const existingWsKey = Object.keys(sections.workshop.subsections).find(
        (k) => isZoneMatch(k, zoneId)
      );
      if (existingWsKey) {
        return sections.workshop.subsections[existingWsKey];
      }
      const matchedZone = (store.zones || []).find(z => isZoneMatch(z.id, zoneId) || isZoneMatch(z.name, zoneId));
      const subTitle = matchedZone ? matchedZone.name.toUpperCase() : (zoneId || "WORKSHOP").replace(/-/g, " ").toUpperCase();
      sections.workshop.subsections[zoneId] = {
        title: subTitle,
        rows: {},
      };
      return sections.workshop.subsections[zoneId];
    }
    if (zoneId === "Admin-&-Staff-Duties" || (zoneId && isAdminStaffDuties(zoneId))) return sections.othersDuty;
    if (zoneId === "Other-Base") {
      if (!sections.zones.subsections["Other-Base"]) {
        sections.zones.subsections["Other-Base"] = { title: "OTHER BASE (UNASSIGNED FROM PHP DB)", rows: {} };
      }
      return sections.zones.subsections["Other-Base"];
    }
    if (zoneId === "Out-Project") {
      if (!sections.zones.subsections["Out-Project"]) {
        sections.zones.subsections["Out-Project"] = { title: "OUT PROJECT (UNASSIGNED FROM PHP DB)", rows: {} };
      }
      return sections.zones.subsections["Out-Project"];
    }
    if (zoneId === "Housing-Project") {
      if (!sections.zones.subsections["Housing-Project"]) {
        sections.zones.subsections["Housing-Project"] = { title: "HOUSING PROJECT (UNASSIGNED FROM PHP DB)", rows: {} };
      }
      return sections.zones.subsections["Housing-Project"];
    }

    // Check existing subsections using smart zone match
    const existingZoneKey = Object.keys(sections.zones.subsections).find(
      (k) => isZoneMatch(k, zoneId)
    );
    if (existingZoneKey) {
      return sections.zones.subsections[existingZoneKey];
    }

    // Fallback: create subsection on the fly if it doesn't exist
    const matchedStdZone = (store.zones || []).find(z => isZoneMatch(z.id, zoneId) || isZoneMatch(z.name, zoneId));
    const normKey = matchedStdZone ? matchedStdZone.id : (zoneId || "ZONE").trim();
    if (sections.zones.subsections[normKey]) {
      return sections.zones.subsections[normKey];
    }
    sections.zones.subsections[normKey] = {
      title: formatZoneDisplayName(matchedStdZone ? matchedStdZone.name : normKey).toUpperCase(),
      rows: {},
    };
    return sections.zones.subsections[normKey];
  }

  const allAllocatedSailorIds = new Set();
  store._summaryAllocatedSailorIds = allAllocatedSailorIds;
  const isSailorAllocated = (sailor) => isSailorInSet(allAllocatedSailorIds, sailor);
  const markSailorAllocated = (sailor) => markSailorInSet(allAllocatedSailorIds, sailor);

  const [yyyy, mm, dd] = dateVal.split("-");
  const monthKey = `${yyyy}-${mm}`;
  const dayKey = parseInt(dd, 10).toString();

  const isLeaveCodeDetailed = (val) => isSailorOnLeaveOnDate(val, dateVal);

  const getSailorLeaveStatus = (sailor) => {
    if (!sailor) return null;
    const fbStatus = (typeof getSailorDailyAttendanceStatus === "function" ? getSailorDailyAttendanceStatus(sailor, dateVal) : null)
      || (store.availability?.[monthKey]?.[dayKey]?.[sailor._fbKey] || (sailor.id ? store.availability?.[monthKey]?.[dayKey]?.[sailor.id] : null));
    if (isLeaveCodeDetailed(fbStatus)) return fbStatus;

    // If sailor has an explicit Active daily allocation for dateVal, they are actively working!
    const allocKey = `${dateVal}_${sailor._fbKey || sailor.id}`;
    const alloc = store.dailyAllocationsMap
      ? store.dailyAllocationsMap[allocKey]
      : (store.dailyAllocations || []).find((a) => a && a.date === dateVal && (a.sailor_id === sailor._fbKey || a.sailor_id === sailor.id || a.official_number === sailor.official_number));
    if (alloc && alloc.status === "Active") return null;

    if (isLeaveCodeDetailed(sailor.attendance) && sailor.attendance && sailor.attendance.toLowerCase() !== "present") return sailor.attendance;
    return null;
  };

  const naIds = store._currentNaIds || new Set();

  // 1. Add long term deployments to summary FIRST so project personnel are never misallocated to tasks
  const longTerm = getLongTermAllocations();
  const processLongTermList = (list, section) => {
    list.forEach((alloc) => {
      if (!alloc || !alloc.sailor) return;
      if (getSailorLeaveStatus(alloc.sailor) || isSailorInSet(naIds, alloc.sailor)) return;
      if (isSailorAllocated(alloc.sailor)) return;

      markSailorAllocated(alloc.sailor);
      const rowKey = (alloc.projectName || "UNKNOWN").toUpperCase().trim();
      if (!section.rows[rowKey]) {
        section.rows[rowKey] = createRowMatrix(rowKey);
      }
      const { isVss, tradeIdx } = getSailorBranchAndTradeIdx(alloc.sailor);
      if (isVss) section.rows[rowKey].vss[tradeIdx]++;
      else section.rows[rowKey].reg[tradeIdx]++;
    });
  };

  processLongTermList(longTerm.housing, sections.housingProjects);
  processLongTermList(longTerm.outProject, sections.outProjects);
  processLongTermList(longTerm.otherBase, sections.otherBases);

  // 2. Active tasks committed for dateVal
  const allWorkOrders = store.workOrders || [];
  const allJobCards = store.jobCards || [];
  const seenTaskKeys = new Set();
  const rawTasks = [];
  allWorkOrders.forEach((wo) => {
    const k = String(wo.id || wo._fbKey || "");
    if (k) seenTaskKeys.add(k);
    rawTasks.push(wo);
  });
  allJobCards.forEach((jc) => {
    const k = String(jc.id || jc._fbKey || "");
    if (k && seenTaskKeys.has(k)) return;
    rawTasks.push(jc);
  });
  const allTasks = rawTasks.filter(
    (t) =>
      t &&
      t.status !== "Cancelled" &&
      isWorkOrderActiveOnDate(t, dateVal) &&
      isWorkOrderCommittedToday(t, dateVal)
  );

  allTasks.forEach((wo) => {
    if (isTaskDescriptionNA(wo.description) || isTaskDescriptionNA(wo.reference_no) || isTaskDescriptionNA(wo.title)) return;
    const { sailors: assignedSailors } = getWorkOrderAssignedSailors(wo, dateVal);

    if (assignedSailors.length > 0) {
      const section = getSectionForZone(wo.zone_id || wo.zone);
      const rowKey = (wo.description || wo.title || "UNNAMED DUTY").toUpperCase().trim();
      if (!section.rows[rowKey]) {
        section.rows[rowKey] = createRowMatrix(rowKey);
      }
      const targetRow = section.rows[rowKey];
      assignedSailors.forEach((sailor) => {
        // Exclude leaves — sailors on leave must only be counted in the leave section
        if (getSailorLeaveStatus(sailor) || isSailorInSet(naIds, sailor)) return;
        // Strictly deduplicate to prevent double-counting across tasks
        if (isSailorAllocated(sailor)) return;

        markSailorAllocated(sailor);
        const { isVss, tradeIdx } = getSailorBranchAndTradeIdx(sailor);
        if (isVss) {
          targetRow.vss[tradeIdx]++;
        } else {
          targetRow.reg[tradeIdx]++;
        }
      });
    }
  });

  // 3. Also process standalone daily allocations on dateVal that weren't captured in active workOrders/jobCards
  (store.dailyAllocations || []).forEach((alloc) => {
    if (alloc.date !== dateVal || alloc.status === "Cancelled") return;
    if (isTaskDescriptionNA(alloc.description) || isTaskDescriptionNA(alloc.task_name)) return;
    const sailor = (store.sailors || []).find((s) => isSailorMatch(s, alloc.sailor_id));
    if (!sailor) return;
    if (getSailorLeaveStatus(sailor) || isSailorInSet(naIds, sailor)) return;
    if (isSailorAllocated(sailor)) return;

    const zoneId = alloc.zone_id || sailor.zone_id || store.currentZone;
    const section = getSectionForZone(zoneId);
    const rowKey = (alloc.description || alloc.task_name || "GENERAL DUTY").toUpperCase().trim();
    if (!section.rows[rowKey]) {
      section.rows[rowKey] = createRowMatrix(rowKey);
    }
    const targetRow = section.rows[rowKey];
    markSailorAllocated(sailor);

    const { isVss, tradeIdx } = getSailorBranchAndTradeIdx(sailor);
    if (isVss) {
      targetRow.vss[tradeIdx]++;
    } else {
      targetRow.reg[tradeIdx]++;
    }
  });

  // 4. Process explicit leaves/sick statuses from sailorsDB + NA task allocations
  (store.sailors || []).forEach((sailor) => {
    const leaveStatus = getSailorLeaveStatus(sailor);
    const isNaTask = isSailorInSet(naIds, sailor);
    if (!leaveStatus && !isNaTask) return;
    if (isSailorAllocated(sailor)) return;

    markSailorAllocated(sailor);
    const { isVss, tradeIdx } = getSailorBranchAndTradeIdx(sailor);
    const rawStatus = String(leaveStatus || (isNaTask ? "M/D" : "LEAVE")).trim();
    let rowKey = "LEAVE";

    if (/^(S\/R|Sick Report)$/i.test(rawStatus)) {
      rowKey = "SICK REPORT (S/R)";
    } else if (/^(SL|Sick Leave)$/i.test(rawStatus)) {
      rowKey = "SICK LEAVE (SL)";
    } else if (/^(SIQ)$/i.test(rawStatus)) {
      rowKey = "SIQ (SICK IN QUARTERS)";
    } else if (/^(ADM|Admit)$/i.test(rawStatus)) {
      rowKey = "HOSPITAL ADMIT (ADM)";
    } else if (/^(NGH)$/i.test(rawStatus)) {
      rowKey = "NAVY GENERAL HOSPITAL (NGH)";
    } else if (/^(MED|Medical|M\/C)$/i.test(rawStatus)) {
      rowKey = "MEDICAL";
    } else if (/^(Sick|M\/D|ගිලන්)$/i.test(rawStatus)) {
      rowKey = "SICK (M/D)";
    } else if (/^(Run|AWOL|R)$/i.test(rawStatus)) {
      rowKey = "RUN / AWOL";
    } else {
      // All sanctioned leave forms (Standard Leave, T/D Traveling Date, R/D Report Date, DL Days Leave, Weekend, Half Day)
      rowKey = "LEAVE";
    }

    if (!sections.leaveSick.rows[rowKey]) {
      sections.leaveSick.rows[rowKey] = createRowMatrix(rowKey);
    }
    const targetRow = sections.leaveSick.rows[rowKey];
    if (isVss) {
      targetRow.vss[tradeIdx]++;
    } else {
      targetRow.reg[tradeIdx]++;
    }
  });

  // 4b. Process Available / Standby sailors (Camp / Yard) to guarantee 100% full complement balance
  const standbyRowKey = "AVAILABLE / STANDBY SAILORS (CAMP / YARD)";
  (store.sailors || []).forEach((sailor) => {
    if (isSailorAllocated(sailor)) return;
    markSailorAllocated(sailor);

    if (!sections.othersDuty.rows[standbyRowKey]) {
      sections.othersDuty.rows[standbyRowKey] = createRowMatrix(standbyRowKey);
    }
    const targetRow = sections.othersDuty.rows[standbyRowKey];
    const { isVss, tradeIdx } = getSailorBranchAndTradeIdx(sailor);
    if (isVss) {
      targetRow.vss[tradeIdx]++;
    } else {
      targetRow.reg[tradeIdx]++;
    }
  });

  // 5. Build and render the table rows with subtotals and grand totals
  let tableHtml = `
        <tr id="sec-dockyard" class="bg-slate-100 font-bold border-t-2 border-b border-slate-300">
            <td colspan="17" class="px-3 py-2 text-slate-800 font-extrabold uppercase text-[11px] tracking-wider flex items-center justify-between">
              <span>🏗️ ONGOING CONSTRUCTIONS AT DOCKYARD</span>
            </td>
        </tr>
    `; // Columns counters helper
  function getColumnsSum(rowsArray) {
    const sums = {
      vss: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      reg: [0, 0, 0, 0],
      vssSub: 0,
      regSub: 0,
      fullTotal: 0,
    };
    rowsArray.forEach((r) => {
      r.vssSub = r.vss.reduce((sum, val) => sum + val, 0);
      r.regSub = r.reg.reduce((sum, val) => sum + val, 0);
      r.fullTotal = r.vssSub + r.regSub;
      r.vss.forEach((val, idx) => (sums.vss[idx] += val));
      r.reg.forEach((val, idx) => (sums.reg[idx] += val));
      sums.vssSub += r.vssSub;
      sums.regSub += r.regSub;
      sums.fullTotal += r.fullTotal;
    });
    return sums;
  }
  const columnGrandTotals = {
    vss: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    reg: [0, 0, 0, 0],
    vssSub: 0,
    regSub: 0,
    fullTotal: 0,
  };
  function appendSectionToTable(sectionObj, secAnchorId = "") {
    let rowsList = Object.values(sectionObj.rows);
    if (rowsList.length === 0) return; // Skip empty sections

    // Sort Leave/Sick rows in logical naval sequence
    if (secAnchorId === "sec-leaveSick") {
      const leavePreferredOrder = [
        "LEAVE",
        "SICK REPORT (S/R)",
        "SICK LEAVE (SL)",
        "SIQ (SICK IN QUARTERS)",
        "HOSPITAL ADMIT (ADM)",
        "NAVY GENERAL HOSPITAL (NGH)",
        "SICK (M/D)",
        "MEDICAL",
        "RUN / AWOL"
      ];
      rowsList.sort((a, b) => {
        const ia = leavePreferredOrder.indexOf(a.description);
        const ib = leavePreferredOrder.indexOf(b.description);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      });
    }

    const sums = getColumnsSum(rowsList);
    const anchorAttr = secAnchorId ? `id="${secAnchorId}"` : "";
    tableHtml += `
            <tr ${anchorAttr} class="bg-slate-100 font-bold border-t-2 border-b border-slate-300">
                <td colspan="17" class="px-3 py-2 text-slate-800 uppercase text-[10px] tracking-wider">${sectionObj.title}</td>
            </tr>
        `;
    rowsList.forEach((r) => {
      const isStandby = r.description.includes("AVAILABLE / STANDBY");
      const rowCls = isStandby
        ? "bg-amber-50/50 hover:bg-amber-100/50 border-b border-amber-200/70 text-center font-semibold"
        : "hover:bg-slate-50 border-b border-slate-100 text-center";
      const descCls = isStandby
        ? "px-3 py-1.5 text-left text-amber-900 font-bold"
        : "px-3 py-1.5 text-left text-slate-700 font-medium";
      const descContent = isStandby ? `⚓ ${r.description}` : r.description;
      tableHtml += `
                <tr class="${rowCls}">
                    <td class="${descCls}">${descContent}</td>
                    ${r.vss.map((val) => `<td class="px-0.5 py-1.5 border-l ${isStandby ? 'border-amber-200/60 font-semibold' : 'border-slate-200'}">${val || ""}</td>`).join("")}
                    <td class="px-1 py-1.5 ${isStandby ? 'bg-amber-100/60 text-amber-950 font-extrabold' : 'bg-slate-50 font-bold'} border-l-2 border-r-2 ${isStandby ? 'border-amber-300' : 'border-slate-200'}">${r.vssSub || ""}</td>
                    ${r.reg.map((val) => `<td class="px-0.5 py-1.5 border-l ${isStandby ? 'border-amber-200/60 font-semibold' : 'border-slate-200'}">${val || ""}</td>`).join("")}
                    <td class="px-1 py-1.5 ${isStandby ? 'bg-amber-100/60 text-amber-950 font-extrabold' : 'bg-slate-50 font-bold'} border-l-2 border-r ${isStandby ? 'border-amber-300' : 'border-slate-200'}">${r.regSub || ""}</td>
                    <td class="px-2 py-1.5 ${isStandby ? 'bg-amber-200/60 text-amber-950 font-black' : 'bg-teal-50/50 font-bold text-slate-800'} border-l ${isStandby ? 'border-amber-300' : 'border-slate-300'}">${r.fullTotal || ""}</td>
                </tr>
            `;
    });
    tableHtml += `
            <tr class="bg-slate-50 font-bold text-center border-b-2 border-slate-300">
                <td class="px-3 py-2 text-left uppercase text-[10px]">SUB TOTAL</td>
                ${sums.vss.map((val) => `<td class="px-0.5 py-2 border-l border-slate-200">${val || ""}</td>`).join("")}
                <td class="px-1 py-2 bg-slate-100/80 border-l-2 border-r-2 border-slate-300">${sums.vssSub || ""}</td>
                ${sums.reg.map((val) => `<td class="px-0.5 py-2 border-l border-slate-200">${val || ""}</td>`).join("")}
                <td class="px-1 py-2 bg-slate-100/80 border-l-2 border-r border-slate-300">${sums.regSub || ""}</td>
                <td class="px-2 py-2 bg-teal-100/30 text-teal-800 border-l border-slate-300">${sums.fullTotal || ""}</td>
            </tr>
        `;
    sums.vss.forEach((val, idx) => (columnGrandTotals.vss[idx] += val));
    sums.reg.forEach((val, idx) => (columnGrandTotals.reg[idx] += val));
    columnGrandTotals.vssSub += sums.vssSub;
    columnGrandTotals.regSub += sums.regSub;
    columnGrandTotals.fullTotal += sums.fullTotal;
  } // 2. Workshop (Grouped by individual workshop subsections)
  tableHtml += `
        <tr id="sec-workshop" class="bg-slate-100 font-bold border-t-2 border-b border-slate-300">
            <td colspan="17" class="px-3 py-2 text-slate-800 uppercase text-[10px] tracking-wider">🔧 WORKSHOP</td>
        </tr>
    `;
  const workshopRowsList = [];
  Object.values(sections.workshop.subsections).forEach((sub) => {
    const subRows = Object.values(sub.rows);
    if (subRows.length === 0) return; // Skip workshop subsections with 0 duties
    const subSums = getColumnsSum(subRows);
    tableHtml += `
            <tr class="bg-slate-50 font-bold border-b border-slate-200 text-[10px] text-slate-600">
                <td colspan="17" class="px-4 py-1.5 pl-6">${sub.title}</td>
            </tr>
        `;
    subRows.forEach((r) => {
      tableHtml += `
                <tr class="hover:bg-slate-50 border-b border-slate-100 text-center">
                    <td class="px-3 py-1.5 pl-8 text-left text-slate-700 font-medium">${r.description}</td>
                    ${r.vss.map((val) => `<td class="px-0.5 py-1.5 border-l border-slate-200">${val || ""}</td>`).join("")}
                    <td class="px-1 py-1.5 bg-slate-50/50 font-bold border-l-2 border-r-2 border-slate-200">${r.vssSub || ""}</td>
                    ${r.reg.map((val) => `<td class="px-0.5 py-1.5 border-l border-slate-200">${val || ""}</td>`).join("")}
                    <td class="px-1 py-1.5 bg-slate-50/50 font-bold border-l-2 border-r border-slate-200">${r.regSub || ""}</td>
                    <td class="px-2 py-1.5 bg-teal-50/30 font-bold text-slate-800 border-l border-slate-300">${r.fullTotal || ""}</td>
                </tr>
            `;
      workshopRowsList.push(r);
    });
    tableHtml += `
            <tr class="bg-slate-50 font-semibold text-center border-b border-slate-200 text-slate-600">
                <td class="px-3 py-1.5 pl-8 text-left uppercase text-[9px]">${sub.title} SUB TOTAL</td>
                ${subSums.vss.map((val) => `<td class="px-0.5 py-1.5 border-l border-slate-200">${val || ""}</td>`).join("")}
                <td class="px-1 py-1.5 bg-slate-100/50 border-l-2 border-r-2 border-slate-200">${subSums.vssSub || ""}</td>
                ${subSums.reg.map((val) => `<td class="px-0.5 py-1.5 border-l border-slate-200">${val || ""}</td>`).join("")}
                <td class="px-1 py-1.5 bg-slate-100/50 border-l-2 border-r border-slate-200">${subSums.regSub || ""}</td>
                <td class="px-2 py-1.5 bg-teal-50/50 border-l border-slate-300">${subSums.fullTotal || ""}</td>
            </tr>
        `;
  });
  const workshopMainSums = getColumnsSum(workshopRowsList);
  tableHtml += `
        <tr class="bg-slate-100 font-bold text-center border-b-2 border-slate-300 text-slate-800">
            <td class="px-3 py-2 text-left uppercase text-[10px] pl-6">WORKSHOP SUB TOTAL</td>
            ${workshopMainSums.vss.map((val) => `<td class="px-0.5 py-2 border-l border-slate-200">${val || ""}</td>`).join("")}
            <td class="px-1 py-2 bg-slate-200/50 border-l-2 border-r-2 border-slate-300">${workshopMainSums.vssSub || ""}</td>
            ${workshopMainSums.reg.map((val) => `<td class="px-0.5 py-2 border-l border-slate-200">${val || ""}</td>`).join("")}
            <td class="px-1 py-2 bg-slate-200/50 border-l-2 border-r border-slate-300">${workshopMainSums.regSub || ""}</td>
            <td class="px-2 py-2 bg-teal-100/40 text-teal-800 border-l border-slate-300">${workshopMainSums.fullTotal || ""}</td>
        </tr>
    `;
  workshopMainSums.vss.forEach((val, idx) => (columnGrandTotals.vss[idx] += val));
  workshopMainSums.reg.forEach((val, idx) => (columnGrandTotals.reg[idx] += val));
  columnGrandTotals.vssSub += workshopMainSums.vssSub;
  columnGrandTotals.regSub += workshopMainSums.regSub;
  columnGrandTotals.fullTotal += workshopMainSums.fullTotal; // 3. Zones (A-G grouped under main ZONE header)
  tableHtml += `
        <tr id="sec-zones" class="bg-slate-100 font-bold border-t-2 border-b border-slate-300">
            <td colspan="17" class="px-3 py-2 text-slate-800 uppercase text-[10px] tracking-wider">📍 ZONE</td>
        </tr>
    `;
  const zoneRowsList = [];
  Object.values(sections.zones.subsections).forEach((sub) => {
    const subRows = Object.values(sub.rows);
    if (subRows.length === 0) return; // Skip empty zone subsections with 0 duties
    const subSums = getColumnsSum(subRows);
    tableHtml += `
            <tr class="bg-slate-50 font-bold border-b border-slate-200 text-[10px] text-slate-600">
                <td colspan="17" class="px-4 py-1.5 pl-6">${sub.title}</td>
            </tr>
        `;
    subRows.forEach((r) => {
      tableHtml += `
                <tr class="hover:bg-slate-50 border-b border-slate-100 text-center">
                    <td class="px-3 py-1.5 pl-8 text-left text-slate-700 font-medium">${r.description}</td>
                    ${r.vss.map((val) => `<td class="px-0.5 py-1.5 border-l border-slate-200">${val || ""}</td>`).join("")}
                    <td class="px-1 py-1.5 bg-slate-50/50 font-bold border-l-2 border-r-2 border-slate-200">${r.vssSub || ""}</td>
                    ${r.reg.map((val) => `<td class="px-0.5 py-1.5 border-l border-slate-200">${val || ""}</td>`).join("")}
                    <td class="px-1 py-1.5 bg-slate-50/50 font-bold border-l-2 border-r border-slate-200">${r.regSub || ""}</td>
                    <td class="px-2 py-1.5 bg-teal-50/30 font-bold text-slate-800 border-l border-slate-300">${r.fullTotal || ""}</td>
                </tr>
            `;
      zoneRowsList.push(r);
    });
    tableHtml += `
            <tr class="bg-slate-50 font-semibold text-center border-b border-slate-200 text-slate-600">
                <td class="px-3 py-1.5 pl-8 text-left uppercase text-[9px]">${sub.title} SUB TOTAL</td>
                ${subSums.vss.map((val) => `<td class="px-0.5 py-1.5 border-l border-slate-200">${val || ""}</td>`).join("")}
                <td class="px-1 py-1.5 bg-slate-100/50 border-l-2 border-r-2 border-slate-200">${subSums.vssSub || ""}</td>
                ${subSums.reg.map((val) => `<td class="px-0.5 py-1.5 border-l border-slate-200">${val || ""}</td>`).join("")}
                <td class="px-1 py-1.5 bg-slate-100/50 border-l-2 border-r border-slate-200">${subSums.regSub || ""}</td>
                <td class="px-2 py-1.5 bg-teal-50/50 border-l border-slate-300">${subSums.fullTotal || ""}</td>
            </tr>
        `;
  });
  const zoneMainSums = getColumnsSum(zoneRowsList);
  tableHtml += `
        <tr class="bg-slate-100 font-bold text-center border-b-2 border-slate-300 text-slate-800">
            <td class="px-3 py-2 text-left uppercase text-[10px] pl-6">ZONE SUB TOTAL</td>
            ${zoneMainSums.vss.map((val) => `<td class="px-0.5 py-2 border-l border-slate-200">${val || ""}</td>`).join("")}
            <td class="px-1 py-2 bg-slate-200/50 border-l-2 border-r-2 border-slate-300">${zoneMainSums.vssSub || ""}</td>
            ${zoneMainSums.reg.map((val) => `<td class="px-0.5 py-2 border-l border-slate-200">${val || ""}</td>`).join("")}
            <td class="px-1 py-2 bg-slate-200/50 border-l-2 border-r border-slate-300">${zoneMainSums.regSub || ""}</td>
            <td class="px-2 py-2 bg-teal-100/40 text-teal-800 border-l border-slate-300">${zoneMainSums.fullTotal || ""}</td>
        </tr>
    `;
  zoneMainSums.vss.forEach((val, idx) => (columnGrandTotals.vss[idx] += val));
  zoneMainSums.reg.forEach((val, idx) => (columnGrandTotals.reg[idx] += val));
  columnGrandTotals.vssSub += zoneMainSums.vssSub;
  columnGrandTotals.regSub += zoneMainSums.regSub;
  columnGrandTotals.fullTotal += zoneMainSums.fullTotal;
  appendSectionToTable(sections.othersDuty, "sec-othersDuty");
  appendSectionToTable(sections.outProjects, "sec-outProjects");
  appendSectionToTable(sections.housingProjects, "sec-housingProjects");
  appendSectionToTable(sections.otherBases, "sec-otherBases");
  appendSectionToTable(sections.leaveSick, "sec-leaveSick"); // Render Grand Total Row at the absolute bottom
  tableHtml += `
        <tr class="bg-slate-900 text-white font-extrabold text-center text-sm border-t-4 border-slate-800">
            <td class="px-3 py-3 text-left uppercase">GRAND TOTAL</td>
            ${columnGrandTotals.vss.map((val) => `<td class="px-0.5 py-3 border-l border-slate-800">${val || ""}</td>`).join("")}
            <td class="px-1 py-3 bg-slate-800 border-l-2 border-r-2 border-slate-800">${columnGrandTotals.vssSub || ""}</td>
            ${columnGrandTotals.reg.map((val) => `<td class="px-0.5 py-3 border-l border-slate-800">${val || ""}</td>`).join("")}
            <td class="px-1 py-3 bg-slate-800 border-l-2 border-r border-slate-800">${columnGrandTotals.regSub || ""}</td>
            <td class="px-2 py-3 bg-teal-800 text-teal-100 border-l border-slate-800">${columnGrandTotals.fullTotal || ""}</td>
        </tr>
    `;
  document.getElementById("summaryMatrixTableBody").innerHTML = tableHtml;

  // Update Headcount KPI Counters in the UI
  const vssEl = document.getElementById("summaryHeadcountVss");
  if (vssEl) vssEl.textContent = columnGrandTotals.vssSub || 0;

  const ssEl = document.getElementById("summaryHeadcountSS");
  if (ssEl) ssEl.textContent = columnGrandTotals.reg[0] || 0;

  const jsTotal = (columnGrandTotals.reg[1] || 0) + (columnGrandTotals.reg[2] || 0) + (columnGrandTotals.reg[3] || 0);
  const jsEl = document.getElementById("summaryHeadcountJS");
  if (jsEl) jsEl.textContent = jsTotal;

  const fullEl = document.getElementById("summaryHeadcountFull");
  if (fullEl) fullEl.textContent = columnGrandTotals.fullTotal || 0;

  // Attach scroll listener to dynamically update section indicator
  const scrollContainer = document.getElementById("summaryTableScrollContainer");
  if (scrollContainer && !scrollContainer._hasScrollListener) {
    scrollContainer._hasScrollListener = true;
    scrollContainer.addEventListener("scroll", () => {
      const secAnchors = [
        { id: "sec-dockyard", title: "Dockyard" },
        { id: "sec-workshop", title: "Workshop" },
        { id: "sec-zones", title: "Zones (A-G)" },
        { id: "sec-othersDuty", title: "Other Duties" },
        { id: "sec-outProjects", title: "Out Projects" },
        { id: "sec-housingProjects", title: "Housing" },
        { id: "sec-otherBases", title: "Other Bases" },
        { id: "sec-leaveSick", title: "Leave & Sick" }
      ];
      const scrollTop = scrollContainer.scrollTop + 100;
      for (let i = secAnchors.length - 1; i >= 0; i--) {
        const el = document.getElementById(secAnchors[i].id);
        if (el && el.offsetTop <= scrollTop) {
          const badge = document.getElementById("summaryCurrentSectionBadge");
          if (badge) badge.textContent = `📍 Viewing: ${secAnchors[i].title}`;
          break;
        }
      }
    });
  }
}

function scrollToSummarySection(secId, title = "") {
  const targetEl = document.getElementById(secId);
  const container = document.getElementById("summaryTableScrollContainer");
  if (targetEl && container) {
    const targetTop = targetEl.offsetTop - 70;
    container.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
    const badge = document.getElementById("summaryCurrentSectionBadge");
    if (badge && title) {
      badge.textContent = `📍 Viewing: ${title}`;
    }
  }
}
function exportSummaryCsv() {
  const today = getLocalDateString();
  const dateVal = store.dashboardDate || today;
  const table = document.getElementById("summaryMatrixTable");
  if (!table) return;
  let csv = [];
  csv.push(`Date: ${dateVal}`);
  csv.push("");
  const rows = table.querySelectorAll("tr");
  rows.forEach((tr) => {
    let cols = tr.querySelectorAll("th, td");
    let rowData = [];
    cols.forEach((col) => {
      let text = col.innerText.trim().replace(/,/g, ";").replace(/\r?\n/g, " ");
      rowData.push(`"${text}"`);
    });
    csv.push(rowData.join(","));
  });
  const csvContent = "\uFEFF" + csv.join("\n"); // Include BOM for proper Excel UTF-8 encoding
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const encodedUri = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Duties_Summary_${dateVal}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
function printSummary() {
  const container = document.getElementById("summaryTableScrollContainer");
  if (container) {
    container.classList.remove("max-h-[70vh]", "overflow-auto");
    container.scrollTop = 0;
  }
  window.print();
  if (container) {
    container.classList.add("max-h-[70vh]", "overflow-auto");
  }
}

// LMD Print & Export engine moved to js/modules/locations-maintenance.js

function triggerDesktopHiddenPrint(title, fullHtml) {
  let printFrame = document.getElementById("desktopPrintHiddenIframe");
  if (!printFrame) {
    printFrame = document.createElement("iframe");
    printFrame.id = "desktopPrintHiddenIframe";
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "10px";
    printFrame.style.height = "10px";
    printFrame.style.border = "0";
    printFrame.style.opacity = "0.01";
    printFrame.style.pointerEvents = "none";
    printFrame.style.zIndex = "-9999";
    document.body.appendChild(printFrame);
  }

  try {
    const doc = printFrame.contentDocument || printFrame.contentWindow.document;
    doc.open();
    doc.write(fullHtml);
    doc.close();
    if (title) {
      doc.title = title;
    }
    setTimeout(() => {
      try {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      } catch (e) {
        window.print();
      }
    }, 250);
  } catch (err) {
    window.print();
  }
}
function openEvalDetailsModal(mode) {
  const today = getLocalDateString();
  const dateVal = store.dashboardDate || today;
  const modalTitle = document.getElementById("evalDetailsModalTitle");
  const modalIcon = document.getElementById("evalDetailsModalIcon");
  const tableHeader = document.getElementById("evalDetailsTableActionHeader");
  if (mode === "evaluated") {
    modalTitle.textContent = `Evaluated Sailors — ${dateVal}`;
    modalIcon.textContent = "✅";
    tableHeader.textContent = "Score";
  } else {
    modalTitle.textContent = `Pending Evaluations — ${dateVal}`;
    modalIcon.textContent = "⏳";
    tableHeader.textContent = "Pending Days";
  } // Get all assigned sailors for the selected date
  const assignedIds = new Set();
  if (dateVal === today) {
    (store.workOrders || []).forEach((wo) => {
      if ((wo.status === "Active" || wo.status === "Pending") && wo.assigned) {
        wo.assigned.forEach((id) => assignedIds.add(String(id)));
      }
    });
  } else {
    (store.dailyAllocations || []).forEach((alloc) => {
      if (alloc.date === dateVal) {
        assignedIds.add(String(alloc.sailor_id));
      }
    });
  }
  if (!store.sailors) return; // Filter sailors who are assigned today
  const assignedSailors = store.sailors.filter(
    (s) => assignedIds.has(String(s.id)) || assignedIds.has(String(s._fbKey)),
  ); // Filter based on evaluation mode
  const filteredSailors = assignedSailors.filter((s) => {
    const alloc = (store.dailyAllocations || []).find(
      (a) => a.date === dateVal && String(a.sailor_id) === String(s.id),
    );
    const isEval = alloc ? alloc.evaluated === true : s.evaluated === true;
    return mode === "evaluated" ? isEval : !isEval;
  });
  const tbody = document.getElementById("evalDetailsTableBody");
  if (!tbody) return;
  tbody.innerHTML =
    filteredSailors
      .map((s) => {
        var _s$id39;
        const alloc = (store.dailyAllocations || []).find(
          (a) => a.date === dateVal && String(a.sailor_id) === String(s.id),
        );
        let workDesc = "Not specified";
        let zoneId = s.zone_assigned || "A-Zone";
        if (alloc && alloc.work_order_id) {
          const wo = store.workOrders.find(
            (w) =>
              String(w.id) === String(alloc.work_order_id) ||
              String(w._fbKey) === String(alloc.work_order_id),
          );
          if (wo) {
            workDesc = wo.description || wo.reference_no || "Active Work";
            zoneId = wo.zone_id || zoneId;
          }
        } else {
          const wo = store.workOrders.find(
            (w) =>
              (w.status === "Active" || w.status === "Pending") &&
              w.assigned &&
              w.assigned.map(String).includes(String(s.id)),
          );
          if (wo) {
            workDesc = wo.description || wo.reference_no || "Active Work";
            zoneId = wo.zone_id || zoneId;
          }
        }
        const sSettings = store.settings || {};
        const inc = sSettings.zoneInCharges && sSettings.zoneInCharges[zoneId];
        const inChargeStr = inc
          ? `${inc.rank} ${inc.name}`
          : "No In-Charge set";
        let detailHtml = "";
        if (mode === "evaluated") {
          let scoreVal = s.yesterdayScore || 7.0;
          if (alloc && alloc.points !== undefined) {
            scoreVal = alloc.points;
          }
          detailHtml = `<span class="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs">⭐ ${scoreVal.toFixed(1)}</span>`;
        } else {
          const unEvaluatedAllocs = (store.dailyAllocations || []).filter(
            (a) => String(a.sailor_id) === String(s.id) && !a.evaluated,
          );
          const count = unEvaluatedAllocs.length;
          detailHtml = `<span class="px-2.5 py-1 ${count > 2 ? "bg-red-100 text-red-800 animate-pulse font-bold" : "bg-slate-100 text-slate-700"} rounded-lg text-xs">${count} days pending</span>`;
        }
        return `
            <tr class="hover:bg-slate-100/50 transition-colors">
                <td class="p-3 font-semibold text-slate-700">${s.official_number || s.service_no || "-"}</td>
                <td class="p-3">
                    <p class="font-bold text-teal-600 hover:underline cursor-pointer" onclick="closeModal('evalDetailsModal'); openSailorProfile('${(_s$id39 = s.id) !== null && _s$id39 !== void 0 ? _s$id39 : s._fbKey}')">${s.rank} ${s.name}</p>
                    <p class="text-xs text-slate-400 font-medium">${s.trade}</p>
                </td>
                <td class="p-3 max-w-[200px] truncate" title="${workDesc}">${workDesc}</td>
                <td class="p-3">
                    <p class="font-semibold text-slate-700 text-xs">${zoneId}</p>
                    <p class="text-slate-400 text-xs">${inChargeStr}</p>
                </td>
                <td class="p-3">${detailHtml}</td>
            </tr>
        `;
      })
      .join("") ||
    `<tr><td colspan="5" class="p-8 text-center text-slate-400 italic">No sailors in this category for today</td></tr>`;
  document.getElementById("evalDetailsModal").classList.remove("hidden");
}
window._isHistoryBackAction = false;
function initPwaHistoryManagement() {
  // 1. Set initial history state for the landing view
  const initialView = store.currentView || getInitialAppView();
  store.currentView = initialView;
  window.history.replaceState({ view: initialView }, "", `#${initialView}`); // 2. Listen to popstate (back/forward navigation)
  window.addEventListener("popstate", (event) => {
    _isHistoryBackAction = true; // Handle modal state
    if (event.state && event.state.modalOpen) {
      // A specific modal is expected to be open
      document
        .querySelectorAll('.modal-overlay, [id$="Modal"], [id$="modal"]')
        .forEach((m) => {
          if (m.id === event.state.modalId) {
            m.classList.remove("hidden");
          } else {
            m.classList.add("hidden");
          }
        });
    } else {
      // No modals expected to be open
      document
        .querySelectorAll('.modal-overlay, [id$="Modal"], [id$="modal"]')
        .forEach((m) => {
          m.classList.add("hidden");
        }); // Handle view switching: maintain current view when returning from modal
      const targetView = (event.state && event.state.view) ? event.state.view : store.currentView;
      if (targetView && targetView !== store.currentView) {
        switchView(targetView, true);
      }
    }
    setTimeout(() => {
      _isHistoryBackAction = false;
    }, 500);
  }); // 3. Observe DOM for modal open/close actions to push/pop history states automatically
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "class"
      ) {
        const target = mutation.target;
        const isModal =
          target.classList.contains("modal-overlay") ||
          target.id.endsWith("Modal") ||
          target.id.endsWith("modal");
        if (!isModal) return;
        const isHidden = target.classList.contains("hidden");
        if (!isHidden) {
          // Modal was opened - only push state if this modal is not already the top history state
          if (!_isHistoryBackAction) {
            const currentState = window.history.state;
            if (!currentState || !currentState.modalOpen || currentState.modalId !== target.id) {
              window.history.pushState(
                { modalOpen: true, modalId: target.id, view: store.currentView },
                "",
                window.location.hash,
              );
            }
          }
        } else {
          // Modal was closed
          if (!_isHistoryBackAction) {
            const state = window.history.state;
            if (state && state.modalOpen && state.modalId === target.id) {
              window.history.back();
            }
          }
        }
      }
    });
  }); // Start observing all modals
  document
    .querySelectorAll('.modal-overlay, [id$="Modal"], [id$="modal"]')
    .forEach((m) => {
      observer.observe(m, { attributes: true, attributeFilter: ["class"] });
    });
} // ---- Theme Management & Online Status ----
function initTheme() {
  const saved = localStorage.getItem("ncw_ps_dark_theme");
  const isDark = saved === null ? true : (saved === "true" || saved === true);
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  document.documentElement.classList.toggle("dark", isDark);
  updateThemeToggleUi(isDark);
}
function toggleDarkMode() {
  const isDark = document.documentElement.getAttribute("data-theme") !== "light";
  const newDark = !isDark;
  document.documentElement.setAttribute("data-theme", newDark ? "dark" : "light");
  document.documentElement.classList.toggle("dark", newDark);
  localStorage.setItem("ncw_ps_dark_theme", newDark ? "true" : "false");
  localStorage.setItem("ncw_ps_theme", newDark ? "dark" : "light");
  updateThemeToggleUi(newDark);
  showToast(newDark ? "Dark Theme enabled" : "Light Theme enabled");
}
function updateThemeToggleUi(isDark) {
  const brandImg = document.getElementById("cmsysBannerLogoImg");
  if (brandImg) {
    brandImg.src = isDark ? "cmsys-banner-logo.png" : "cmsys-banner-logo.png";
  }
  const btn = document.getElementById("darkModeToggleBtn");
  if (!btn) return;
  btn.innerHTML = isDark
    ? '<svg class="w-4 h-4 text-amber-300" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1-8.313-12.454z"/></svg>'
    : '<svg class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
  btn.title = isDark ? "Switch to Light Theme" : "Switch to Dark Theme";
}
function updateOnlineStatus() {
  const indicator = document.getElementById("onlineIndicator");
  if (!indicator) return;
  if (navigator.onLine) {
    indicator.innerHTML = `
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Online</span>
        `;
    indicator.className =
      "flex items-center gap-1 font-bold text-[9px] uppercase tracking-wider rounded-full px-2 py-0.5 border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 transition-all duration-300";
  } else {
    indicator.innerHTML = `
            <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            <span>Offline</span>
        `;
    indicator.className =
      "flex items-center gap-1 font-bold text-[9px] uppercase tracking-wider rounded-full px-2 py-0.5 border border-red-500/20 bg-red-500/10 text-red-400 transition-all duration-300";
    showToast(
      "You are offline. Operations will sync when you reconnect.",
      "error",
    );
  }
}
window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus); // ==================== WHATSAPP / SYSTEM SHARING FUNCTIONS ====================
function shareViaWhatsAppOrSystem(text, filename) {
  const canUseShare =
    navigator.share &&
    (window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");
  if (canUseShare) {
    navigator
      .share({
        title: "CMSys Share Report",
        text: text,
        url: window.location.href,
      })
      .then(() => showToast("Shared successfully via system share!"))
      .catch((err) => {
        console.error(
          "System share failed, falling back to WhatsApp share:",
          err,
        );
        if (err.name !== "AbortError") {
          fallbackWhatsAppShare(text);
        }
      });
  } else {
    fallbackWhatsAppShare(text);
  }
}
function fallbackWhatsAppShare(text) {
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
  const encodedText = encodeURIComponent(text);
  const url = `https://wa.me/?text=${encodedText}`;
  if (isMobile) {
    // On mobile, changing window.location.href is 100% reliable and bypassed popup blockers
    window.location.href = url;
  } else {
    // On desktop, open in a new window/tab
    window.open(url, "_blank");
  }
}
// shareLmdWhatsApp moved to js/modules/locations-maintenance.js
function shareEstimateWhatsApp() {
  const est = findEstimateById(store.selectedEstimate);
  if (!est) {
    showToast("Please select an estimate to share!", "error");
    return;
  }
  let text = `*⚓ SRI LANKA NAVY - COST ESTIMATE*\n`;
  text += `*Estimate No:* ${est.estimate_number}\n`;
  text += `*Reference:* ${est.reference_doc || "—"}\n`;
  text += `*Location:* ${est.location || "—"}\n`;
  text += `*End User:* ${est.endUser || "—"}\n`;
  text += `*Description:* ${est.description}\n`;
  if (est.workScope) {
    text += `*Work Scope:* ${est.workScope}\n`;
  }
  text += `=========================\n\n`;
  text += `*🛠️ MATERIALS ESTIMATE:*\n`;
  if (est.materials && est.materials.length > 0) {
    est.materials.forEach((m, idx) => {
      text += `${idx + 1}. ${m.item_name} - Qty: ${m.qty} ${m.unit} @ ${formatCurrency(m.cost)} = ${formatCurrency(m.qty * m.cost)}\n`;
    });
  } else {
    text += `No materials logged\n`;
  }
  text += `*Total Materials Cost:* *${formatCurrency(est.total_cost)}*\n\n`;
  text += `*👷 LABOUR ESTIMATE:*\n`;
  if (est.labor && est.labor.length > 0) {
    est.labor.forEach((l, idx) => {
      text += `${idx + 1}. ${l.trade} - Workers: ${l.workers}, Man-Days: ${l.manDays}\n`;
    });
  } else {
    text += `No labour logged\n`;
  }
  text += `*Total Man-Days:* *${est.totalManDays || 0}*\n\n`;
  text += `*Status:* ${est.status || "Draft"}\n`;
  if (est.approvedAuthority) {
    text += `*Approving Authority:* ${est.approvedAuthority}\n`;
  }
  text += `-------------------------\n`;
  text += `Generated on: ${new Date().toLocaleString()}`;
  shareViaWhatsAppOrSystem(text, `Estimate_${est.estimate_number}.txt`);
} // =============================================================================


// ============================================================================
// Global Window Bindings for Summary View & Special Zone Module
// ============================================================================
window.renderNastatusView = renderNastatusView;
window.toggleViewsBasedOnZone = toggleViewsBasedOnZone;
window.getDailyDetailsWorksForZone = getDailyDetailsWorksForZone;
window.renderDailyDetailsSpecialView = renderDailyDetailsSpecialView;
window.renderDailyDetails = renderDailyDetailsSpecialView;
window.renderSummaryView = renderSummaryView;
window.scrollToSummarySection = scrollToSummarySection;
window.exportSummaryCsv = exportSummaryCsv;
window.printSummary = printSummary;
window.triggerDesktopHiddenPrint = triggerDesktopHiddenPrint;
window.openEvalDetailsModal = openEvalDetailsModal;
window.initPwaHistoryManagement = initPwaHistoryManagement;
window.initTheme = initTheme;
window.toggleDarkMode = toggleDarkMode;
window.updateThemeToggleUi = updateThemeToggleUi;
window.updateOnlineStatus = updateOnlineStatus;
window.shareViaWhatsAppOrSystem = shareViaWhatsAppOrSystem;
window.fallbackWhatsAppShare = fallbackWhatsAppShare;
window.shareEstimateWhatsApp = shareEstimateWhatsApp;

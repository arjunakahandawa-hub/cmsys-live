// ============================================================================
// CMSys Module: Main Landing Dashboard & Live Daily Labor Allocations Hub
// File: js/modules/dashboard.js
// ============================================================================

window._isRenderingDashboard = false;
window._dailyCommitmentCache = window._dailyCommitmentCache || { date: null, committedMap: {} };
window._dailyAllocationsByDateCache = null;
window._sailorLastAssignmentIndexCache = null;
window._longTermAllocationsCache = window._longTermAllocationsCache || { date: null, data: null };
window.draggedSailorId = null;
window._lastContinuedUndoData = null;

// =============================================
// DASHBOARD
// =============================================
window._isRenderingDashboard = false;
function renderDashboard() {
  if (_isRenderingDashboard) return;
  _isRenderingDashboard = true;
  try {
    const today = getLocalDateString();
    const dateVal = store.dashboardDate || today;
    const isToday = dateVal === today;
    updateDocumentTitleDesktop(store.currentZone, dateVal);
    refreshDailyCommitmentCache(dateVal);
    toggleViewsBasedOnZone();
    const summaryTitle = document.getElementById("summaryTitle");
    if (summaryTitle) {
      if (isToday) {
        summaryTitle.textContent = "Today's Operational Summary";
      } else {
        const formatted = new Date(dateVal).toLocaleDateString("en-GB", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        summaryTitle.textContent = `${formatted}'s Operational Summary`;
      }
    }
    renderAvailableSailors();
    renderWorkOrders();
    renderQuickAssignments();
    renderZoneTeam();
    updateCounters();
    updatePendingEvals();
    renderZoneSelectors();
    updateBoardEmptyState();
    updateDashboardButtons();
    updateHistoricalModeBanner();
    updateSbsBookModeBanner();
  } finally {
    _isRenderingDashboard = false;
  }
}

function updateSbsBookModeBanner() {
  const sbsBanner = document.getElementById("sbsBookModeBanner");
  const isSbs = isSbsZone(store.currentZone);
  if (sbsBanner) {
    sbsBanner.classList.toggle("hidden", !isSbs);
  }
}

function openSbsBookView() {
  store.currentZone = "SBS";
  switchView("dashboard");
  refreshCurrentViewImmediately();
  showToast("📖 Opened SBS Works & Maintenance Record Book", "info");
}

function closeSbsBookMode() {
  const validZones = (store.zones || []).filter((z) => !isSbsZone(z.id) && !isSbsZone(z.name));
  store.currentZone = validZones[0]?.id || "A Zone";
  localStorage.setItem("ncw_saved_zone", store.currentZone);
  renderZoneSelectors();
  refreshCurrentViewImmediately();
  showToast("↩️ Returned to Operational Zones", "info");
}

function updateHistoricalModeBanner() {
  const today = getLocalDateString();
  const dateVal = store.dashboardDate || today;
  const isToday = dateVal === today;
  const banner = document.getElementById("historicalModeBanner");
  const dateText = document.getElementById("historicalBannerDateText");
  const quickTodayBtn = document.getElementById("quickTodayBtn");

  if (banner) {
    banner.classList.toggle("hidden", isToday);
  }
  if (dateText && !isToday) {
    try {
      const parts = dateVal.split("-");
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const formatted = d.toLocaleDateString("en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      dateText.textContent = `Showing records for ${formatted} • සියලුම දත්ත Read-Only ආකාරයෙන් පවතී`;
    } catch(e) {
      dateText.textContent = `Showing records for ${dateVal} • Read-Only Mode`;
    }
  }
  if (quickTodayBtn) {
    if (isToday) {
      quickTodayBtn.className = "px-2.5 py-1 rounded-lg text-[11px] font-bold bg-teal-600 text-white hover:bg-teal-700 transition-all shadow-sm";
    } else {
      quickTodayBtn.className = "px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all shadow-sm animate-pulse";
    }
  }
}
function updateDashboardButtons() {
  const currentZoneObj = store.zones.find((z) => z.id === store.currentZone);
  const zoneName = currentZoneObj ? currentZoneObj.name : "";
  const zoneId = store.currentZone;
  const isAdminStaff =
    isAdminStaffDuties(zoneId) || isAdminStaffDuties(zoneName);
  const newAssignBtn = document.getElementById("newAssignBtn");
  const newWorkOrderBtn = document.getElementById("newWorkOrderBtn");
  const btnContinueYesterday = document.getElementById("btnContinueYesterday");
  const today = getLocalDateString();
  const isToday = !store.dashboardDate || store.dashboardDate === today;
  if (newAssignBtn) {
    newAssignBtn.classList.toggle("hidden", !isToday);
  }
  if (newWorkOrderBtn) {
    newWorkOrderBtn.classList.toggle("hidden", !isToday);
  }
  if (btnContinueYesterday) {
    btnContinueYesterday.classList.add("hidden");
    btnContinueYesterday.style.display = "none";
  }
}
function navigateSummaryDate(offsetDays) {
  const currentDateStr = store.dashboardDate || getLocalDateString();
  const parts = currentDateStr.split("-");
  if (parts.length !== 3) return;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const newDateStr = `${year}-${month}-${day}`;
  changeDashboardDate(newDateStr);
}

function changeDashboardDate(val) {
  if (!val) return;
  store.dashboardDate = val;
  ["dashboardDatePicker", "summaryDatePicker"].forEach((id) => {
    const el = document.getElementById(id);
    if (el && el.value !== val) el.value = val;
  });
  updateDocumentTitleDesktop(store.currentZone, store.dashboardDate);
  renderDashboard();
  renderZoneSelectors(); // Re-render dropdown to update zone progress percentages
  if (typeof renderSummaryView === "function") {
    renderSummaryView();
  }
  const today = getLocalDateString();
  if (val !== today) {
    showToast(`Viewing historical data for ${val} (Read Only)`, "info");
  }
}
function isWorkOrderActiveOnDate(wo, dateStr) {
  if (!wo) return false;
  const today = getLocalDateString();
  if (!dateStr) dateStr = today;

  const woIdStr = String(wo.id || "");
  const woFbKeyStr = String(wo._fbKey || "");
  const woRefStr = String(wo.reference_no || "");
  const woJobNoStr = String(wo.job_no || "");
  const woDescStr = String(wo.description || "").trim().toLowerCase();

  const hasAllocations = (store.dailyAllocations || []).some((a) => {
    if (!a || a.date !== dateStr || a.status === "Cancelled") return false;
    const aWoId = String(a.work_order_id || a.workOrderId || a.work_order || a.wo_id || "");
    const aDesc = String(a.description || a.task_name || a.work_order_name || "").trim().toLowerCase();
    return (
      (woIdStr && aWoId === woIdStr) ||
      (woFbKeyStr && aWoId === woFbKeyStr) ||
      (woRefStr && aWoId === woRefStr) ||
      (woJobNoStr && aWoId === woJobNoStr) ||
      (!aWoId && woDescStr && aDesc && aDesc === woDescStr)
    );
  });
  if (hasAllocations) return true;

  // Tasks that are Completed, Hold, or Cancelled without active allocations do not persist to subsequent dates
  if (wo.type === "TASK" && !wo.assign_type) {
    if (wo.status === "Completed" || wo.status === "Hold" || wo.status === "Cancelled") {
      if (wo.created_at) {
        try {
          const cd = new Date(wo.created_at);
          if (!isNaN(cd.getTime())) {
            const createdDate = cd.toISOString().split("T")[0];
            if (createdDate < dateStr && !hasAllocations) {
              return false;
            }
          }
        } catch (e) {}
      }
    }
  }

  if (wo.created_at) {
    try {
      const d = new Date(wo.created_at);
      if (!isNaN(d.getTime())) {
        const createdDate = d.toISOString().split("T")[0];
        if (createdDate <= dateStr) {
          if (dateStr === today) {
            if (wo.status === "Completed") {
                return false;
            }
            return true;
          } else {
            if (wo.status === "Completed" || wo.status === "Hold") {
              const compDate =
                wo.completed_date ||
                wo.last_commit_date ||
                wo.last_assigned_date ||
                today;
              if (compDate < dateStr) {
                return false;
              }
            }
            return true;
          }
        }
      }
    } catch (e) {}
  }
  
  if (dateStr === today) {
    if (wo.status !== "Completed") return true;
  }

  return false;
}
// Pre-computed lookup cache for dateVal to guarantee sub-millisecond dashboard renders
window._dailyCommitmentCache = {
  date: null,
  committedWoSet: new Set(),
  sailorAssignmentMap: new Map()
};

window._dailyAllocationsByDateCache = null;

function getDailyAllocationsForDate(dateStr) {
  if (!_dailyAllocationsByDateCache) {
    const map = new Map();
    (store.dailyAllocations || []).forEach((a) => {
      if (!a || !a.date || a.status === "Cancelled") return;
      let list = map.get(a.date);
      if (!list) {
        list = [];
        map.set(a.date, list);
      }
      list.push(a);
    });
    _dailyAllocationsByDateCache = map;
  }
  return _dailyAllocationsByDateCache.get(dateStr) || [];
}

function invalidateDailyCommitmentCache() {
  _dailyAllocationsByDateCache = null;
  if (typeof invalidateLongTermAllocationsCache === "function") invalidateLongTermAllocationsCache();
  _dailyCommitmentCache = {
    date: null,
    committedWoSet: new Set(),
    sailorAssignmentMap: new Map()
  };
}

function refreshDailyCommitmentCache(dateVal) {
  const today = getLocalDateString();
  if (!dateVal) dateVal = store.dashboardDate || today;
  const isToday = dateVal === today;

  const committedWoSet = new Set();
  const sailorAssignmentMap = new Map();

  const addToMap = (sailorRef, info) => {
    if (!sailorRef || !info) return;
    const refStr = String(sailorRef).trim();
    if (!refStr) return;
    sailorAssignmentMap.set(refStr, info);
    const refDigits = refStr.replace(/\D/g, "");
    if (refDigits.length >= 3) sailorAssignmentMap.set(refDigits, info);

    const s = typeof findSailorById === "function" ? findSailorById(sailorRef) : (store.sailors || []).find(x => isSailorMatchingKeys(x, [sailorRef]));
    if (s) {
      if (s.id !== undefined && s.id !== null) sailorAssignmentMap.set(String(s.id).trim(), info);
      if (s._fbKey) sailorAssignmentMap.set(String(s._fbKey).trim(), info);
      if (s.official_number) {
        const offStr = String(s.official_number).trim();
        sailorAssignmentMap.set(offStr, info);
        const digits = offStr.replace(/\D/g, "");
        if (digits.length >= 3) sailorAssignmentMap.set(digits, info);
      }
      if (s.service_no) {
        const srvStr = String(s.service_no).trim();
        sailorAssignmentMap.set(srvStr, info);
        const digits = srvStr.replace(/\D/g, "");
        if (digits.length >= 3) sailorAssignmentMap.set(digits, info);
      }
      if (s.off_no) {
        const off2 = String(s.off_no).trim();
        sailorAssignmentMap.set(off2, info);
        const digits2 = off2.replace(/\D/g, "");
        if (digits2.length >= 3) sailorAssignmentMap.set(digits2, info);
      }
    }
  };

  // Pre-index work orders and job cards for O(1) resolution
  const woByIdOrKey = new Map();
  (store.workOrders || []).forEach((w) => {
    if (w.id !== undefined && w.id !== null) woByIdOrKey.set(String(w.id), w);
    if (w._fbKey) woByIdOrKey.set(String(w._fbKey), w);
    if (w.reference_no) woByIdOrKey.set(String(w.reference_no), w);
    if (w.job_card_no) woByIdOrKey.set(String(w.job_card_no), w);
  });
  const jcByIdOrKey = new Map();
  (store.jobCards || []).forEach((j) => {
    if (j.id !== undefined && j.id !== null) jcByIdOrKey.set(String(j.id), j);
    if (j._fbKey) jcByIdOrKey.set(String(j._fbKey), j);
    if (j.job_card_no) jcByIdOrKey.set(String(j.job_card_no), j);
  });

  // 1. Index daily allocations for dateVal
  const dateAllocs = getDailyAllocationsForDate(dateVal);
  dateAllocs.forEach((a) => {
    if (a.work_order_id) committedWoSet.add(String(a.work_order_id));
    if (a.job_card_no) committedWoSet.add(String(a.job_card_no));
    if (a.wo_reference) committedWoSet.add(String(a.wo_reference));

    // Direct assignment info from daily allocation
    const woOrJc = woByIdOrKey.get(String(a.work_order_id)) || jcByIdOrKey.get(String(a.work_order_id));

    const cleanZone = woOrJc
      ? String(woOrJc.zone_id || woOrJc.zone || "").replace(/-/g, " ").trim()
      : String(a.zone_id || a.zone || "").replace(/-/g, " ").trim();
    const info = {
      ref: woOrJc ? (woOrJc.reference_no || woOrJc.job_card_no || "") : (a.work_order_id || ""),
      title: woOrJc ? (woOrJc.description || woOrJc.title || "") : (a.task_description || a.role_today || a.task_name || ""),
      zone: cleanZone,
      type: woOrJc ? (woOrJc.type || "WO") : "Allocation",
    };

    if (a.sailor_id) addToMap(a.sailor_id, info);
    if (a.official_number) addToMap(a.official_number, info);
    if (a.sailorId) addToMap(a.sailorId, info);
    if (a.offNo) addToMap(a.offNo, info);
    if (a.service_no) addToMap(a.service_no, info);
    if (a.off_no) addToMap(a.off_no, info);
  });

  // 2. Index work orders marked as committed for dateVal
  (store.workOrders || []).forEach((wo) => {
    if (wo.last_committed_date === dateVal) {
      if (wo.id) committedWoSet.add(String(wo.id));
      if (wo._fbKey) committedWoSet.add(String(wo._fbKey));
    }
  });

  // 3. Index active Work Orders & sync directly with canonical getWorkOrderAssignedSailors
  (store.workOrders || []).forEach((wo) => {
    if (!wo || wo.status === "Cancelled" || wo.status === "Completed") return;
    if (wo.zone_id === "Out-Project" || wo.zone === "Out-Project") return;

    const isCommitted =
      committedWoSet.has(String(wo.id)) ||
      committedWoSet.has(String(wo._fbKey)) ||
      (wo.reference_no && committedWoSet.has(String(wo.reference_no))) ||
      (typeof isWorkOrderCommittedToday === "function" && isWorkOrderCommittedToday(wo, dateVal));
    const isAssignedToday = isToday && wo.last_assigned_date === dateVal;

    if (isCommitted || isAssignedToday) {
      const cleanZone = String(wo.zone_id || wo.zone || "").replace(/-/g, " ").trim();
      const info = {
        ref: wo.reference_no || wo.job_card_no || "",
        title: wo.description || wo.title || "",
        zone: cleanZone,
        type: wo.type || "WO",
        isPlanned: isToday && !isCommitted && !isAssignedToday,
      };

      // Pull assigned sailors matching Daily Details view
      if (typeof getWorkOrderAssignedSailors === "function") {
        const { sailors } = getWorkOrderAssignedSailors(wo, dateVal);
        (sailors || []).forEach((s) => {
          if (s) {
            if (s.id !== undefined && s.id !== null) addToMap(s.id, info);
            if (s._fbKey) addToMap(s._fbKey, info);
            if (s.official_number) addToMap(s.official_number, info);
            if (s.service_no) addToMap(s.service_no, info);
            if (s.off_no) addToMap(s.off_no, info);
          }
        });
      }

      const crewKeys = (wo.assigned && wo.assigned.length > 0)
        ? extractSailorKeys(wo.assigned)
        : extractSailorKeys(wo.last_assigned);
      crewKeys.forEach((id) => addToMap(id, info));
      if (wo.incharge) addToMap(wo.incharge, info);
      if (wo.supervisor) addToMap(wo.supervisor, info);
      if (wo.project_artificer) addToMap(wo.project_artificer, info);
    }
  });

  // 4. Index active Standalone Job Cards & sync directly with canonical getWorkOrderAssignedSailors
  (store.jobCards || []).forEach((jc) => {
    if (!jc || jc.status === "Cancelled" || jc.status === "Completed") return;
    if (jc.zone_id === "Out-Project" || jc.zone === "Out-Project") return;

    // Skip empty / shadow job card entries that have no identifiable title or reference
    if (!jc.job_number && !jc.job_card_no && !jc.description && !jc.title) return;
    // If this job card mirrors an existing Work Order, skip it so the canonical Work Order takes precedence
    if (woByIdOrKey.has(String(jc.id)) || (jc._fbKey && woByIdOrKey.has(String(jc._fbKey)))) return;

    const isCommitted =
      committedWoSet.has(String(jc.id)) ||
      committedWoSet.has(String(jc._fbKey)) ||
      (jc.job_card_no && committedWoSet.has(String(jc.job_card_no))) ||
      (typeof isWorkOrderCommittedToday === "function" && isWorkOrderCommittedToday(jc, dateVal));
    const isAssignedToday = isToday && jc.last_assigned_date === dateVal;

    if (isCommitted || isAssignedToday) {
      const cleanZone = String(jc.zone_id || jc.zone || "").replace(/-/g, " ").trim();
      const info = {
        ref: jc.job_card_no || "",
        title: jc.description || jc.title || "",
        zone: cleanZone,
        type: "JC",
        isPlanned: isToday && !isCommitted && !isAssignedToday,
      };

      if (typeof getWorkOrderAssignedSailors === "function") {
        const { sailors } = getWorkOrderAssignedSailors(jc, dateVal);
        (sailors || []).forEach((s) => {
          if (s) {
            if (s.id !== undefined && s.id !== null) addToMap(s.id, info);
            if (s._fbKey) addToMap(s._fbKey, info);
            if (s.official_number) addToMap(s.official_number, info);
            if (s.service_no) addToMap(s.service_no, info);
            if (s.off_no) addToMap(s.off_no, info);
          }
        });
      }

      const crewKeys = (jc.assigned && jc.assigned.length > 0)
        ? extractSailorKeys(jc.assigned)
        : extractSailorKeys(jc.last_assigned);
      crewKeys.forEach((id) => addToMap(id, info));
      if (jc.incharge) addToMap(jc.incharge, info);
      if (jc.supervisor) addToMap(jc.supervisor, info);
      if (jc.project_artificer) addToMap(jc.project_artificer, info);
    }
  });

  // 5. Index Long-Term Project Deployments (Housing Projects, Out Projects, Other Bases)
  const longTerm = typeof getLongTermAllocations === "function" ? getLongTermAllocations(dateVal) : null;
  if (longTerm) {
    const addLongTermToMap = (list, typeLabel) => {
      (list || []).forEach((item) => {
        if (!item || !item.sailor) return;
        const info = {
          ref: item.projectName || typeLabel,
          title: item.projectName || "",
          zone: typeLabel,
          type: "LongTerm",
        };
        const s = item.sailor;
        if (s.id !== undefined && s.id !== null) addToMap(s.id, info);
        if (s._fbKey) addToMap(s._fbKey, info);
        if (s.official_number) addToMap(s.official_number, info);
        if (s.service_no) addToMap(s.service_no, info);
      });
    };
    addLongTermToMap(longTerm.housing, "Housing Project");
    addLongTermToMap(longTerm.outProject, "Out Project");
    addLongTermToMap(longTerm.otherBase, "Other Base");
  }

  _dailyCommitmentCache = {
    date: dateVal,
    committedWoSet,
    sailorAssignmentMap
  };
}

function getSailorAssignmentOnDate(sailorId, dateVal) {
  const today = getLocalDateString();
  if (!dateVal) dateVal = today;
  if (_dailyCommitmentCache.date !== dateVal) {
    refreshDailyCommitmentCache(dateVal);
  }
  const map = _dailyCommitmentCache.sailorAssignmentMap;
  if (!map) return null;
  const sidStr = String(sailorId).trim();
  const direct = map.get(sidStr);
  if (direct) return direct;

  const sidDigits = sidStr.replace(/\D/g, "");
  if (sidDigits.length >= 3 && map.has(sidDigits)) {
    return map.get(sidDigits);
  }

  const s = typeof findSailorById === "function" ? findSailorById(sailorId) : null;
  if (s) {
    if (s.id !== undefined && s.id !== null && map.has(String(s.id).trim())) return map.get(String(s.id).trim());
    if (s._fbKey && map.has(String(s._fbKey).trim())) return map.get(String(s._fbKey).trim());
    if (s.official_number) {
      const offStr = String(s.official_number).trim();
      if (map.has(offStr)) return map.get(offStr);
      const offDigits = offStr.replace(/\D/g, "");
      if (offDigits.length >= 3 && map.has(offDigits)) return map.get(offDigits);
    }
  }
  return null;
}

function getSailorCurrentAssignment(sailorId) {
  const today = getLocalDateString();
  return getSailorAssignmentOnDate(sailorId, today);
}

// Universal live assignment detector for a sailor across all IDs and official number variations
function getSailorDailyAssignment(sailor, dateVal) {
  if (!sailor) return null;
  const targetDate = dateVal || store.dashboardDate || getLocalDateString();
  if (_dailyCommitmentCache.date !== targetDate) {
    refreshDailyCommitmentCache(targetDate);
  }
  const map = _dailyCommitmentCache.sailorAssignmentMap;
  if (!map) return null;

  if (sailor._fbKey && map.has(String(sailor._fbKey).trim())) return map.get(String(sailor._fbKey).trim());
  if (sailor.id !== undefined && sailor.id !== null && map.has(String(sailor.id).trim())) return map.get(String(sailor.id).trim());
  if (sailor.official_number) {
    const offStr = String(sailor.official_number).trim();
    if (map.has(offStr)) return map.get(offStr);
    const digits = offStr.replace(/\D/g, "");
    if (digits.length >= 3 && map.has(digits)) return map.get(digits);
  }
  if (sailor.service_no) {
    const srvStr = String(sailor.service_no).trim();
    if (map.has(srvStr)) return map.get(srvStr);
    const digits = srvStr.replace(/\D/g, "");
    if (digits.length >= 3 && map.has(digits)) return map.get(digits);
  }
  if (sailor.off_no) {
    const offStr = String(sailor.off_no).trim();
    if (map.has(offStr)) return map.get(offStr);
    const digits = offStr.replace(/\D/g, "");
    if (digits.length >= 3 && map.has(digits)) return map.get(digits);
  }
  return null;
}

window._sailorLastAssignmentIndexCache = null;

function invalidateSailorLastAssignmentCache() {
  _sailorLastAssignmentIndexCache = null;
}

function getSailorLastAssignmentIndex() {
  if (_sailorLastAssignmentIndexCache && _sailorLastAssignmentIndexCache.size > 0) {
    return _sailorLastAssignmentIndexCache;
  }

  const index = new Map();

  const record = (keys, candidate) => {
    if (!keys) return;
    if (!Array.isArray(keys)) keys = [keys];
    keys.forEach((k) => {
      if (!k) return;
      const kStr = String(k).trim();
      if (!kStr) return;

      const existing = index.get(kStr);
      if (existing) {
        const eDate = existing.date || "";
        const cDate = candidate.date || "";
        if (eDate && !cDate) return;
        if (eDate && cDate && cDate < eDate) return;
      }
      index.set(kStr, candidate);

      const digits = kStr.replace(/\D/g, "");
      if (digits.length >= 4) {
        const exD = index.get(digits);
        if (exD) {
          const eDate = exD.date || "";
          const cDate = candidate.date || "";
          if (eDate && !cDate) return;
          if (eDate && cDate && cDate < eDate) return;
        }
        index.set(digits, candidate);
      }
    });
  };

  // 1. Index Work Orders (both current assigned and previous last_assigned)
  (store.workOrders || []).forEach((wo) => {
    if (!wo) return;
    const date = wo.last_assigned_date || wo.last_commit_date || wo.last_committed_date || wo.date || (wo.created_at ? new Date(wo.created_at).toISOString().split("T")[0] : "");
    const cand = {
      title: wo.description || wo.title || wo.work_order_no || "Civil Project",
      zone: wo.zone_id || wo.zone || "",
      date: date,
      ref: wo.work_order_no || wo.reference_no || "",
      type: "WO"
    };
    const keys = [...extractSailorKeys(wo.assigned), ...extractSailorKeys(wo.last_assigned)];
    if (wo.incharge) keys.push(String(wo.incharge).trim());
    if (wo.supervisor) keys.push(String(wo.supervisor).trim());
    if (wo.project_artificer) keys.push(String(wo.project_artificer).trim());
    record(keys, cand);
  });

  // 2. Index Job Cards (both current assigned and previous last_assigned)
  (store.jobCards || []).forEach((jc) => {
    if (!jc) return;
    if (!jc.job_number && !jc.job_card_no && !jc.description && !jc.title) return;
    const date = jc.last_assigned_date || jc.last_commit_date || jc.date || (jc.created_at ? new Date(jc.created_at).toISOString().split("T")[0] : "");
    const cand = {
      title: jc.description || jc.title || jc.job_card_no || "Job Card",
      zone: jc.zone_id || jc.zone || "",
      date: date,
      ref: jc.job_card_no || "",
      type: "JC"
    };
    const keys = [...extractSailorKeys(jc.assigned), ...extractSailorKeys(jc.last_assigned)];
    if (jc.incharge) keys.push(String(jc.incharge).trim());
    record(keys, cand);
  });

  // 3. Index Daily Allocations
  const woMap = new Map();
  (store.workOrders || []).forEach((w) => {
    if (w.id !== undefined && w.id !== null) woMap.set(String(w.id), w);
    if (w._fbKey) woMap.set(String(w._fbKey), w);
  });
  const jcMap = new Map();
  (store.jobCards || []).forEach((j) => {
    if (j.id !== undefined && j.id !== null) jcMap.set(String(j.id), j);
    if (j._fbKey) jcMap.set(String(j._fbKey), j);
  });

  (store.dailyAllocations || []).forEach((alloc) => {
    if (!alloc || alloc.status === "Cancelled") return;
    let taskName = alloc.work_order_title || alloc.title || alloc.location || "";
    let allocZone = alloc.zone || alloc.zone_id || "";
    if (alloc.work_order_id) {
      const woKey = String(alloc.work_order_id);
      const wo = woMap.get(woKey);
      if (wo) {
        if (!taskName) taskName = wo.description || wo.title || wo.work_order_no;
        if (!allocZone) allocZone = wo.zone_id || wo.zone || "";
      } else {
        const jc = jcMap.get(woKey);
        if (jc) {
          if (!taskName) taskName = jc.description || jc.title || jc.job_card_no;
          if (!allocZone) allocZone = jc.zone_id || jc.zone || "";
        }
      }
    }
    const cand = {
      title: taskName || alloc.work_order_no || "Daily Allocation",
      zone: allocZone,
      date: alloc.date || "",
      ref: alloc.work_order_no || "",
      type: "Alloc"
    };
    const keys = [alloc.sailor_id, alloc.official_number, alloc.sailorId, alloc.offNo, alloc.service_no, alloc.official_no];
    record(keys, cand);
  });

  // 4. Index Long-Term Deployments (Housing, Out-Project, Other Base)
  if (typeof getLongTermAllocations === "function") {
    const longTerm = getLongTermAllocations();
    if (longTerm) {
      const allDeploys = [...(longTerm.housing || []), ...(longTerm.outProject || []), ...(longTerm.otherBase || [])];
      allDeploys.forEach((item) => {
        if (!item || !item.sailor) return;
        const cand = {
          title: item.projectName || "Project Deployment",
          zone: item.projectType || item.typeLabel || item.zone || "External Project",
          date: item.date ? (typeof item.date === "number" ? new Date(item.date).toISOString().split("T")[0] : String(item.date)) : "",
          ref: item.projectName || "",
          type: "LongTerm"
        };
        const s = item.sailor;
        const keys = [s._fbKey, s.id, s.official_number, s.off_no, s.service_no];
        record(keys, cand);
      });
    }
  }

  _sailorLastAssignmentIndexCache = index;
  return index;
}

// Helper to get a Sailor's Last Assigned Task/Job for display on card
function getSailorLastAssignedTask(sailor) {
  if (!sailor) return null;
  const index = getSailorLastAssignmentIndex();

  const sFb = sailor._fbKey ? String(sailor._fbKey).trim() : "";
  const sId = sailor.id !== undefined && sailor.id !== null ? String(sailor.id).trim() : "";
  const sOff = String(sailor.official_number || sailor.off_no || sailor.service_no || "").trim();
  const digits = sOff.replace(/\D/g, "");

  let res = null;
  if (sFb && index.has(sFb)) res = index.get(sFb);
  else if (sId && index.has(sId)) res = index.get(sId);
  else if (sOff && index.has(sOff)) res = index.get(sOff);
  else if (digits.length >= 4 && index.has(digits)) res = index.get(digits);

  // Fallback: Check yesterdayJob if index didn't find anything
  if (!res && sailor.yesterdayJob) {
    const text = getSailorYesterdayJobText(sailor);
    let yZone = sailor.yesterdayZone || sailor.last_zone || sailor.zone_assigned || "";
    if (!yZone && store.workOrders) {
      const wo = store.workOrders.find((w) => String(w.id || w._fbKey) === String(sailor.yesterdayJob) || w.description === text || w.title === text);
      if (wo) yZone = wo.zone_id || wo.zone || "";
    }
    if (text && text !== "-") {
      res = { title: text, zone: yZone, date: "" };
    }
  }

  // Fallback: Check direct sailor fields
  if (!res && (sailor.last_task || sailor.last_job || sailor.last_work_order)) {
    const t = sailor.last_task || sailor.last_job || sailor.last_work_order;
    const z = sailor.last_zone || sailor.yesterdayZone || sailor.zone_assigned || "";
    res = { title: t, zone: z, date: sailor.last_date || "" };
  }

  const fallbackZone = sailor.zone_assigned || sailor.location || sailor.unit || (sailor.isZoneTeam ? store.currentZone : "") || "Civil Dept";

  if (res && res.title) {
    return {
      title: res.title,
      zone: res.zone || fallbackZone,
      date: res.date || "",
      ref: res.ref || "",
      isStandby: false
    };
  }

  return {
    title: "Ready for assignment",
    zone: fallbackZone,
    date: "",
    ref: "",
    isStandby: true
  };
}

function isSailorAvailableForWork(sailor, dateVal) {
  if (!sailor) return false;
  const today = getLocalDateString();
  if (!dateVal) dateVal = (typeof store !== "undefined" && store && store.dashboardDate) || today;
  const sStatus = String(sailor.status || "").trim();
  const sAtt = String(sailor.attendance || "").trim();

  // LongTermDeployed / Off-Charge non-leave deployments
  if (/^(LongTermDeployed|Off-Charge)$/i.test(sStatus) || /^(LongTermDeployed|Off-Charge)$/i.test(sAtt)) {
    return false;
  }

  if (sAtt && sAtt.toLowerCase() !== "present" && isSailorOnLeaveOnDate(sAtt, dateVal)) {
    return false;
  }

  if (typeof getSailorDailyAttendanceStatus === "function") {
    const fbStatus = getSailorDailyAttendanceStatus(sailor, dateVal);
    if (fbStatus && isSailorOnLeaveOnDate(fbStatus, dateVal)) {
      return false;
    }
  }

  return true;
}

function renderAvailableSailors() {
  const container = document.getElementById("availableSailors");
  if (!container) return;
  const today = getLocalDateString();
  const dateVal = store.dashboardDate || today;
  const isToday = dateVal === today;

  if (_dailyCommitmentCache.date !== dateVal) {
    refreshDailyCommitmentCache(dateVal);
  }

  const assignedKeys = new Set();
  const addKeyToAssigned = (k) => {
    if (!k) return;
    const kStr = String(k).trim();
    if (!kStr) return;
    assignedKeys.add(kStr);
    const digits = kStr.replace(/\D/g, "");
    if (digits.length >= 3) assignedKeys.add(digits);
  };

  const targetAllocs = getDailyAllocationsForDate(dateVal);
  targetAllocs.forEach((alloc) => {
    if (alloc.sailor_id) addKeyToAssigned(alloc.sailor_id);
    if (alloc.sailorId) addKeyToAssigned(alloc.sailorId);
    if (alloc.official_number) addKeyToAssigned(alloc.official_number);
    if (alloc.offNo) addKeyToAssigned(alloc.offNo);
  });

  if (isToday) {
    (store.workOrders || []).forEach((wo) => {
      if (wo && (wo.status === "Active" || wo.status === "Pending")) {
        const isCommitted = typeof isWorkOrderCommittedToday === "function" && isWorkOrderCommittedToday(wo, dateVal);
        const isAssignedToday = wo.last_assigned_date === dateVal;
        if (isCommitted || isAssignedToday) {
          let rawKeys;
          if (wo.assigned && wo.assigned.length > 0) {
            rawKeys = extractSailorKeys(wo.assigned);
          } else if (!wo._userClearedCrew && wo.last_assigned && wo.last_assigned.length > 0) {
            rawKeys = extractSailorKeys(wo.last_assigned);
          } else {
            rawKeys = [];
          }
          // Filter out any tombstoned (explicitly removed) sailors
          if (wo._removedSailorIds && wo._removedSailorIds.size > 0) {
            rawKeys = rawKeys.filter((k) => {
              const kStr = String(k).trim();
              if (wo._removedSailorIds.has(kStr)) return false;
              const digits = kStr.replace(/\D/g, "");
              if (digits.length >= 3 && Array.from(wo._removedSailorIds).some((rk) => String(rk).replace(/\D/g, "") === digits)) return false;
              return true;
            });
          }
          rawKeys.forEach((id) => addKeyToAssigned(id));
          if (wo.incharge && !(wo._removedSailorIds && wo._removedSailorIds.has(String(wo.incharge).trim()))) addKeyToAssigned(wo.incharge);
          if (wo.supervisor && !(wo._removedSailorIds && wo._removedSailorIds.has(String(wo.supervisor).trim()))) addKeyToAssigned(wo.supervisor);
          if (wo.project_artificer && !(wo._removedSailorIds && wo._removedSailorIds.has(String(wo.project_artificer).trim()))) addKeyToAssigned(wo.project_artificer);
        }
      }
    });
    (store.jobCards || []).forEach((jc) => {
      if (jc && (jc.status === "Active" || jc.status === "Pending")) {
        const isCommitted = typeof isWorkOrderCommittedToday === "function" && isWorkOrderCommittedToday(jc, dateVal);
        const isAssignedToday = jc.last_assigned_date === dateVal;
        if (isCommitted || isAssignedToday) {
          let rawJcKeys;
          if (jc.assigned && jc.assigned.length > 0) {
            rawJcKeys = extractSailorKeys(jc.assigned);
          } else if (!jc._userClearedCrew && jc.last_assigned && jc.last_assigned.length > 0) {
            rawJcKeys = extractSailorKeys(jc.last_assigned);
          } else {
            rawJcKeys = [];
          }
          // Filter out any tombstoned (explicitly removed) sailors
          if (jc._removedSailorIds && jc._removedSailorIds.size > 0) {
            rawJcKeys = rawJcKeys.filter((k) => {
              const kStr = String(k).trim();
              if (jc._removedSailorIds.has(kStr)) return false;
              const digits = kStr.replace(/\D/g, "");
              if (digits.length >= 3 && Array.from(jc._removedSailorIds).some((rk) => String(rk).replace(/\D/g, "") === digits)) return false;
              return true;
            });
          }
          rawJcKeys.forEach((id) => addKeyToAssigned(id));
          if (jc.incharge && !(jc._removedSailorIds && jc._removedSailorIds.has(String(jc.incharge).trim()))) addKeyToAssigned(jc.incharge);
          if (jc.supervisor && !(jc._removedSailorIds && jc._removedSailorIds.has(String(jc.supervisor).trim()))) addKeyToAssigned(jc.supervisor);
          if (jc.project_artificer && !(jc._removedSailorIds && jc._removedSailorIds.has(String(jc.project_artificer).trim()))) addKeyToAssigned(jc.project_artificer);
        }
      }
    });
  }
  
  // Add long term project assignments so they are marked as assigned (only if actively approved on dateVal)
  const longTerm = typeof getLongTermAllocations === "function" ? getLongTermAllocations(dateVal) : { housing: [], outProject: [], otherBase: [] };
  [...longTerm.housing, ...longTerm.outProject, ...longTerm.otherBase].forEach(a => {
    if (a && a.sailor) {
      if (a.sailor.id !== undefined && a.sailor.id !== null) addKeyToAssigned(a.sailor.id);
      if (a.sailor._fbKey) addKeyToAssigned(a.sailor._fbKey);
      if (a.sailor.official_number) addKeyToAssigned(a.sailor.official_number);
      if (a.sailor.official_no) addKeyToAssigned(a.sailor.official_no);
    }
  });

  // Also guarantee any raw IDs/keys under long term projects are in assignedKeys ONLY if actively approved on dateVal
  [store.outProjects, store.housingProjects, store.otherBases].forEach((projObj) => {
    if (projObj) {
      Object.values(projObj).forEach((p) => {
        if (p && p.assigned_sailors && (typeof isProjectActiveOnDate === "function" ? isProjectActiveOnDate(p, dateVal) : false)) {
          Object.keys(p.assigned_sailors).forEach((k) => addKeyToAssigned(k));
        }
      });
    }
  });
  // Also populate assignedKeys with every key mapped in daily commitment cache
  if (_dailyCommitmentCache && _dailyCommitmentCache.sailorAssignmentMap) {
    for (const k of _dailyCommitmentCache.sailorAssignmentMap.keys()) {
      if (k) addKeyToAssigned(k);
    }
  }

  // Default filter to "available" if not set
  if (!store.currentFilter) store.currentFilter = "available";

  const allSailors = store.sailors || [];

  const isSailorAssigned = (s) => isSailorMatchingKeys(s, assignedKeys) || !!getSailorDailyAssignment(s, dateVal);

  // Filter out Not Available / Leave / Sick sailors completely from available counts and available tabs
  const availablePool = allSailors.filter(s => {
    const isAvail = isSailorAvailableForWork(s, dateVal);
    const isAssigned = isSailorAssigned(s);
    return isAvail && !isAssigned;
  });

  const allActivePool = allSailors.filter(s => isSailorAvailableForWork(s, dateVal));
  const zoneTeamPool = allSailors.filter(s => s.isZoneTeam && isZoneMatch(s.zone_assigned, store.currentZone) && isSailorAvailableForWork(s, dateVal));
  const currentZoneWoSet = new Set(
    (store.workOrders || [])
      .filter((w) => isZoneMatch(w.zone_id, store.currentZone) || (w.assign_type && isZoneMatch(w.description, store.currentZone)))
      .map((w) => String(w.id || w._fbKey))
      .concat(
        (store.jobCards || [])
          .filter((j) => isZoneMatch(j.zone_id, store.currentZone))
          .map((j) => String(j.id || j._fbKey))
      )
  );
  const continuePool = allSailors.filter(
    (s) =>
      s.yesterdayJob !== null &&
      currentZoneWoSet.has(String(s.yesterdayJob)) &&
      isSailorAvailableForWork(s, dateVal)
  );

  // Update Status Pill Badges
  const countAvailEl = document.getElementById("countFilterAvailable");
  if (countAvailEl) countAvailEl.textContent = `(${availablePool.length})`;

  const countAllEl = document.getElementById("countFilterAll");
  if (countAllEl) countAllEl.textContent = `(${allActivePool.length})`;

  const countZoneEl = document.getElementById("countFilterZoneTeam");
  if (countZoneEl) countZoneEl.textContent = `(${zoneTeamPool.length})`;

  const countContEl = document.getElementById("countFilterContinue");
  if (countContEl) countContEl.textContent = `(${continuePool.length})`;

  const badgeEl = document.getElementById("availableBadge");
  if (badgeEl) badgeEl.textContent = availablePool.length;

  // Determine active base pool
  let basePool;
  if (store.currentFilter === "all") {
    basePool = allActivePool;
  } else if (store.currentFilter === "zone-team") {
    basePool = zoneTeamPool;
  } else if (store.currentFilter === "continuation") {
    basePool = continuePool;
  } else {
    // "available" (Default)
    basePool = availablePool;
  }

  // Update Trade Filter Pills with Dynamic Counts based on the current active base pool
  const tradeContainer = document.getElementById("sidebarTradePillsContainer");
  const standardTrades = ["ALL", "MA", "CA", "PA", "PL", "WE", "RW", "AL", "SW", "BB"];
  const currentTrade = store.currentTrade || "ALL";

  if (tradeContainer) {
    tradeContainer.innerHTML = standardTrades.map((t) => {
      const cnt = t === "ALL" ? basePool.length : basePool.filter((s) => s.trade === t).length;
      const isActive = currentTrade === t;
      const cls = isActive
        ? "trade-filter active font-bold px-2 py-1 text-[11px] rounded bg-slate-800 text-teal-300 shadow-xs cursor-pointer transition-all"
        : "trade-filter px-2 py-1 text-[11px] rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium cursor-pointer transition-all";
      return `<button type="button" onclick="filterTrade('${t}')" class="${cls}">
        <span>${t}</span> <span class="text-[10px] opacity-80 font-mono">(${cnt})</span>
      </button>`;
    }).join("");
  }

  // Support search query
  const searchInput = document.getElementById("sailorSearch");
  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const lastQuery = container.getAttribute("data-last-query") || "";
  if (query !== lastQuery) {
    store.availableSailorsLimit = 40;
    container.setAttribute("data-last-query", query);
  }

  let sailors = [...basePool];

  if (store.currentTrade && store.currentTrade !== "ALL") {
    sailors = sailors.filter((s) => s.trade === store.currentTrade);
  }

  if (query) {
    sailors = sailors.filter(
      (s) =>
        (s._searchIndex || "").includes(query) ||
        s.name.toLowerCase().includes(query) ||
        (s.official_number || "").toLowerCase().includes(query) ||
        (s.rank || "").toLowerCase().includes(query) ||
        (s.trade || "").toLowerCase().includes(query) ||
        ((s.zone_assigned || s.location || s.zone || "").toLowerCase().includes(query))
    );
  }

  // Sort unassigned first, then by score
  sailors.sort((a, b) => {
    const aAssigned = isSailorAssigned(a);
    const bAssigned = isSailorAssigned(b);
    if (aAssigned !== bAssigned) {
      return aAssigned ? 1 : -1;
    }
    return (typeof b.avgScore === "number" ? b.avgScore : 7.0) - (typeof a.avgScore === "number" ? a.avgScore : 7.0);
  });

  const visibleSailors = sailors.slice(0, store.availableSailorsLimit);
  let html = visibleSailors
    .map((sailor) => {
      var _sailor$id, _sailor$id2;
      const scoreVal = typeof sailor.avgScore === "number" && !isNaN(sailor.avgScore) ? sailor.avgScore : 7.0;
      const scoreColor =
        scoreVal >= 8
          ? "#059669"
          : scoreVal >= 6
            ? "#d97706"
            : "#dc2626";
      const tradeBg =
        {
          MA: "#0d9488",
          CA: "#7c3aed",
          PA: "#b45309",
          PL: "#0891b2",
          WE: "#dc2626",
          RW: "#374151",
          SW: "#065f46",
          BB: "#1d4ed8",
          AL: "#ec4899",
        }[sailor.trade] || "#475569";
      const assignment = typeof getSailorDailyAssignment === "function" ? getSailorDailyAssignment(sailor, dateVal) : null;

      const lastTask = getSailorLastAssignedTask(sailor);
      const sailorLoc = sailor.zone_assigned || sailor.location || sailor.zone || (sailor.isZoneTeam ? store.currentZone : "") || "Civil Dept";
      const cleanNo = (sailor.official_number || "").replace(/[^a-zA-Z0-9]/g, "");

      const displayZone = lastTask && lastTask.zone ? (formatZoneDisplayName(lastTask.zone) || lastTask.zone) : (formatZoneDisplayName(sailorLoc) || sailorLoc || "Civil Dept");
      const displayTitle = lastTask && lastTask.title ? lastTask.title : "Ready for assignment";
      const isStandby = !lastTask || lastTask.isStandby;
      const dateText = lastTask && lastTask.date ? lastTask.date : (isStandby ? "Standby" : "Recorded");

      if (assignment) {
        const curZone = formatZoneDisplayName(assignment.zone) || assignment.zone || "Civil Dept";
        const curTitle = (assignment.ref ? assignment.ref + " · " : "") + (assignment.title || "Assigned Task");

        return `
            <div class="sailor-card rounded-xl p-3 border bg-slate-100/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-75 cursor-not-allowed select-none relative group flex flex-col gap-2"
                title="Already assigned to ${assignment.ref} in ${assignment.zone}: ${assignment.title}">
                <!-- Top Identity Row -->
                <div class="flex items-center gap-3">
                    <div class="relative flex-shrink-0 w-11 h-11 rounded-xl overflow-hidden shadow-xs border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                        ${cleanNo ? `
                        <img src="images/${cleanNo}.JPG" 
                             loading="lazy" decoding="async"
                             data-fallback="<div class='w-full h-full flex items-center justify-center text-xs font-bold text-white bg-slate-400'>${sailor.trade}</div>" 
                             class="w-full h-full object-cover" 
                             onerror="handleProfilePicError(this, '${cleanNo}')">
                        ` : `
                        <div class="w-full h-full flex items-center justify-center text-sm font-bold text-white bg-slate-400">${sailor.trade}</div>
                        `}
                        <span class="absolute bottom-0 right-0 px-1 py-0.2 rounded-tl text-[8px] font-black text-white bg-slate-900/80 backdrop-blur-xs leading-none">
                            ${sailor.trade}
                        </span>
                        ${sailor.isZoneTeam ? '<span class="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 rounded-full flex items-center justify-center text-white text-[9px] shadow">★</span>' : ""}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="font-semibold text-slate-700 dark:text-slate-200 text-sm truncate leading-tight">${sailor.name}</p>
                        <div class="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span class="text-[11px] bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">⚠️ Busy: ${curZone}</span>
                            <button onclick="event.stopPropagation(); confirmReleaseSailor('${sailor._fbKey || sailor.id}', '${cleanNo || sailor.official_number || ''}')" 
                                    class="text-[10px] bg-rose-600 hover:bg-rose-700 text-white font-bold px-2 py-0.5 rounded shadow transition-all cursor-pointer"
                                    title="Release sailor from current assignment">
                                🔓 Release
                            </button>
                        </div>
                    </div>
                    <div class="text-right flex-shrink-0">
                        <div class="text-base font-extrabold text-slate-400">${scoreVal.toFixed(1)}</div>
                        <div class="text-[10px] text-slate-400 mt-0.5">${sailor.category}</div>
                    </div>
                </div>

                <!-- Two-Line Work Order & Zone Details -->
                <div class="sailor-assignment-box rounded-lg p-2 transition-all w-full flex flex-col gap-1 border text-left shadow-2xs">
                    <div class="flex items-center justify-between gap-1.5 min-w-0 text-[11px] leading-tight">
                        <div class="flex items-center gap-1.5 min-w-0 truncate">
                            <span class="inline-flex items-center gap-1 font-bold text-teal-700 dark:text-teal-400 flex-shrink-0 text-[10px]">
                                <span class="text-xs">📍</span> Current Zone:
                            </span>
                            <span class="font-extrabold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 text-[9.5px] uppercase tracking-wide truncate max-w-[130px]" title="${curZone}">
                                ${curZone}
                            </span>
                        </div>
                        <span class="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[9px] ml-auto flex-shrink-0">
                            TODAY
                        </span>
                    </div>
                    <div class="flex items-center gap-1.5 min-w-0 text-[11px] leading-tight pt-1 border-t border-slate-200/60 dark:border-slate-700/50">
                        <span class="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400 flex-shrink-0 text-[10px]">
                            <span class="text-xs">📋</span> WO:
                        </span>
                        <span class="truncate font-medium text-slate-700 dark:text-slate-200 text-[11px]" title="${curTitle}">
                            ${curTitle}
                        </span>
                    </div>
                </div>
            </div>
            `;
      }

      return `
        <div class="sailor-card rounded-xl p-3 hover:shadow-md transition-all border flex flex-col gap-2"
            draggable="${isToday ? "true" : "false"}"
            ondragstart="handleDragStart(event, '${sailor.id || sailor._fbKey}')"
            ondragend="handleDragEnd(event)">
            <!-- Top Identity Row -->
            <div class="flex items-center gap-3">
                <div class="relative flex-shrink-0 w-11 h-11 rounded-xl overflow-hidden shadow-xs border border-slate-200/90 flex items-center justify-center" style="background:${tradeBg}">
                    ${cleanNo ? `
                    <img src="images/${cleanNo}.JPG" 
                         loading="lazy" decoding="async"
                         data-fallback="<div class='w-full h-full flex items-center justify-center text-xs font-bold text-white' style='background:${tradeBg}'>${sailor.trade}</div>" 
                         class="w-full h-full object-cover" 
                         onerror="handleProfilePicError(this, '${cleanNo}')">
                    ` : `
                    <div class="w-full h-full flex items-center justify-center text-xs font-bold text-white' style='background:${tradeBg}'>
                        ${sailor.trade}
                    </div>
                    `}
                    <span class="absolute bottom-0 right-0 px-1 py-0.2 rounded-tl text-[8px] font-black text-white bg-slate-950/80 backdrop-blur-xs leading-none">
                        ${sailor.trade}
                    </span>
                    ${sailor.isZoneTeam ? '<span class="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 rounded-full flex items-center justify-center text-white text-[9px] shadow">★</span>' : ""}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-bold text-slate-800 dark:text-slate-100 text-sm truncate leading-tight flex items-center justify-between gap-1">
                        <span class="hover:text-teal-600 hover:underline cursor-pointer" onclick="event.stopPropagation(); openSailorProfile('${sailor.id || sailor._fbKey || sailor.official_number}')">${sailor.name}</span>
                        <button type="button" onclick="event.stopPropagation(); openSailorProfile('${sailor.id || sailor._fbKey || sailor.official_number}')" class="text-teal-600 hover:text-teal-400 text-xs p-0.5 cursor-pointer font-bold transition-transform hover:scale-115" title="View Profile">
                            👤
                        </button>
                    </p>
                    <div class="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span class="text-[11px] text-slate-700 dark:text-slate-300 mono font-bold hover:text-teal-600 cursor-pointer" onclick="event.stopPropagation(); openSailorProfile('${sailor.id || sailor._fbKey || sailor.official_number}')">${sailor.official_number}</span>
                        <span class="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">${sailor.rank}</span>
                        ${sailor.isZoneTeam ? `
                        <span class="text-[10px] bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 px-1.5 py-0.5 rounded font-semibold border border-teal-200/80 dark:border-teal-800/60 flex items-center gap-0.5" title="Zone Team">
                            <span>★</span> Zone Team
                        </span>
                        ` : `
                        <span class="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold border border-emerald-200/80 dark:border-emerald-800/60 flex items-center gap-0.5" title="Available for Assignment">
                            🟢 Available
                        </span>
                        `}
                        ${sailor.yesterdayJob ? '<span class="text-[10px] bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded font-bold border border-purple-200 dark:border-purple-800/60">↻ Cont</span>' : ""}
                    </div>
                </div>
                <div class="text-right flex-shrink-0">
                    <div class="text-base font-extrabold" style="color:${scoreColor}">${scoreVal.toFixed(1)}</div>
                    <div class="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">${sailor.category}</div>
                </div>
            </div>

            <!-- Two-Line Work Order & Zone Details -->
            <div class="sailor-assignment-box rounded-lg p-2 transition-all w-full flex flex-col gap-1 border text-left shadow-2xs">
                <!-- Line 1: Last Attached Zone & Date / Status -->
                <div class="flex items-center justify-between gap-1.5 min-w-0 text-[11px] leading-tight">
                    <div class="flex items-center gap-1.5 min-w-0 truncate">
                        <span class="inline-flex items-center gap-1 font-bold text-teal-700 dark:text-teal-400 flex-shrink-0 text-[10px]">
                            <span class="text-xs">📍</span> Last Zone:
                        </span>
                        <span class="font-extrabold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 text-[9.5px] uppercase tracking-wide truncate max-w-[130px]" title="${displayZone}">
                            ${displayZone}
                        </span>
                    </div>
                    <span class="text-[9.5px] text-slate-400 dark:text-slate-400 font-mono ml-auto flex-shrink-0">
                        ${dateText}
                    </span>
                </div>
                <!-- Line 2: Last Attached Work Order / Task -->
                <div class="flex items-center gap-1.5 min-w-0 text-[11px] leading-tight pt-1 border-t border-slate-200/60 dark:border-slate-700/50">
                    <span class="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400 flex-shrink-0 text-[10px]">
                        <span class="text-xs">📋</span> WO:
                    </span>
                    <span class="truncate font-medium text-slate-700 dark:text-slate-200 text-[11px] ${isStandby ? 'italic text-slate-400 dark:text-slate-400' : ''}" title="${displayTitle}">
                        ${displayTitle}
                    </span>
                </div>
            </div>
        </div>
        `;
    })
    .join("");
  if (sailors.length > store.availableSailorsLimit) {
    html += `
        <div class="flex justify-center py-2">
            <button onclick="loadMoreAvailableSailors()" class="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-sm transition-all duration-200 hover:scale-105 active:scale-95">
                Load More Sailors (+40)
            </button>
        </div>
        `;
  }
  container.innerHTML =
    html ||
    '<div class="text-center py-6"><p class="text-slate-400 text-sm font-medium">No sailors available in this category</p></div>';
}
function loadMoreAvailableSailors() {
  store.availableSailorsLimit += 40;
  renderAvailableSailors();
}
function renderWorkOrders() {
  const columns = {
    PROJECT: document.getElementById("projectsColumn"),
    JOB: document.getElementById("jobsColumn"),
    TASK: document.getElementById("tasksColumn"),
  };
  let projectCount = 0,
    jobCount = 0,
    taskCount = 0;
  const today = getLocalDateString();
  const dateVal = store.dashboardDate || today;
  let projectTradesStr = "",
    jobTradesStr = "",
    taskTradesStr = "";
  Object.keys(columns).forEach((type) => {
    const orders = store.workOrders.filter(
      (wo) =>
        wo.type === type &&
        !wo.assign_type &&
        isZoneMatch(wo.zone_id, store.currentZone) &&
        isWorkOrderActiveOnDate(wo, dateVal),
    );
    columns[type].innerHTML = orders
      .map((wo) => renderWorkOrderCard(wo))
      .join("");
    const wrapperId =
      type === "PROJECT"
        ? "projectColumnWrapper"
        : type === "JOB"
          ? "jobColumnWrapper"
          : "taskColumnWrapper";
    const wrapper = document.getElementById(wrapperId);
    if (wrapper) {
      wrapper.classList.toggle("hidden", orders.length === 0);
    } // Count active ones on this date
    const activeOrders = orders.filter((o) => {
      if (dateVal === today) return o.status === "Active";
      return true; // We assume shown historical work orders are active or had allocations
    });
    if (type === "PROJECT") projectCount = activeOrders.length;
    if (type === "JOB") jobCount = activeOrders.length;
    if (type === "TASK") taskCount = activeOrders.length; // Calculate trade breakdown of assigned sailors
    const typeSailors = [];
    orders.forEach((wo) => {
      const assignedIds = (wo.assigned || []).map(String);
      const sailors = store.sailors.filter(
        (s) =>
          assignedIds.includes(String(s.id)) ||
          assignedIds.includes(String(s._fbKey)),
      );
      typeSailors.push(...sailors);
    });
    const tradeCounts = {};
    typeSailors.forEach((s) => {
      const t = s.trade || "MA";
      tradeCounts[t] = (tradeCounts[t] || 0) + 1;
    });
    const tradeStr = Object.entries(tradeCounts)
      .map(([trade, count]) => `${count} ${trade}`)
      .join(", ");
    if (type === "PROJECT") projectTradesStr = tradeStr;
    if (type === "JOB") jobTradesStr = tradeStr;
    if (type === "TASK") taskTradesStr = tradeStr;
  });
  document.getElementById("ongoingProjects").textContent = projectCount;
  document.getElementById("ongoingJobs").textContent = jobCount;
  document.getElementById("ongoingTasks").textContent = taskCount;
  const projTradesEl = document.getElementById("ongoingProjectsTrades");
  if (projTradesEl)
    projTradesEl.textContent = projectTradesStr ? `(${projectTradesStr})` : "";
  const jobTradesEl = document.getElementById("ongoingJobsTrades");
  if (jobTradesEl)
    jobTradesEl.textContent = jobTradesStr ? `(${jobTradesStr})` : "";
  const taskTradesEl = document.getElementById("ongoingTasksTrades");
  if (taskTradesEl)
    taskTradesEl.textContent = taskTradesStr ? `(${taskTradesStr})` : "";
}
function renderQuickAssignments() {
  const container = document.getElementById("quickAssignmentsList");
  if (!container) return;
  const today = getLocalDateString();
  const dateVal = store.dashboardDate || today; // Filter work orders that have an assign_type and belong to active zone
  const quickOrders = store.workOrders.filter(
    (wo) =>
      wo.assign_type &&
      isZoneMatch(wo.zone_id, store.currentZone) &&
      isWorkOrderActiveOnDate(wo, dateVal),
  );
  const badge = document.getElementById("quickAssignCountBadge");
  if (badge) badge.textContent = `${quickOrders.length} Active`;
  const wrapper = document.getElementById("assignmentColumnWrapper");
  if (wrapper) {
    wrapper.classList.toggle("hidden", quickOrders.length === 0);
  }
  container.innerHTML = quickOrders
    .map((wo) => renderWorkOrderCard(wo))
    .join("");
}
function updateBoardEmptyState() {
  const today = getLocalDateString();
  const dateVal = store.dashboardDate || today;
  const projects = store.workOrders.filter(
    (wo) =>
      wo.type === "PROJECT" &&
      !wo.assign_type &&
      isZoneMatch(wo.zone_id, store.currentZone) &&
      isWorkOrderActiveOnDate(wo, dateVal),
  ).length;
  const jobs = store.workOrders.filter(
    (wo) =>
      wo.type === "JOB" &&
      !wo.assign_type &&
      isZoneMatch(wo.zone_id, store.currentZone) &&
      isWorkOrderActiveOnDate(wo, dateVal),
  ).length;
  const tasks = store.workOrders.filter(
    (wo) =>
      wo.type === "TASK" &&
      !wo.assign_type &&
      isZoneMatch(wo.zone_id, store.currentZone) &&
      isWorkOrderActiveOnDate(wo, dateVal),
  ).length;
  const assigns = store.workOrders.filter(
    (wo) =>
      wo.assign_type &&
      isZoneMatch(wo.zone_id, store.currentZone) &&
      isWorkOrderActiveOnDate(wo, dateVal),
  ).length; // Explicitly toggle hidden class on wrappers to ensure they are hidden on mobile
  const projWrapper = document.getElementById("projectColumnWrapper");
  if (projWrapper) projWrapper.classList.toggle("hidden", projects === 0);
  const jobWrapper = document.getElementById("jobColumnWrapper");
  if (jobWrapper) jobWrapper.classList.toggle("hidden", jobs === 0);
  const taskWrapper = document.getElementById("taskColumnWrapper");
  if (taskWrapper) taskWrapper.classList.toggle("hidden", tasks === 0);
  const assignWrapper = document.getElementById("assignmentColumnWrapper");
  if (assignWrapper) assignWrapper.classList.toggle("hidden", assigns === 0);
  const visibleColumns = [];
  if (projects > 0) visibleColumns.push("project");
  if (jobs > 0) visibleColumns.push("job");
  if (tasks > 0) visibleColumns.push("task");
  if (assigns > 0) visibleColumns.push("assignment");
  const visibleCount = visibleColumns.length;
  const emptyState = document.getElementById("boardEmptyState");
  const boardGrid = document.getElementById("boardGridContainer");
  if (emptyState && boardGrid) {
    if (visibleCount === 0) {
      emptyState.classList.remove("hidden");
      boardGrid.classList.add("hidden");
    } else {
      emptyState.classList.add("hidden");
      boardGrid.classList.remove("hidden"); // Reset classes first
      boardGrid.className = "grid gap-4"; // Set grid columns dynamically based on number of active columns
      if (visibleCount === 1) {
        boardGrid.classList.add("grid-cols-1", "max-w-xl", "mx-auto");
      } else if (visibleCount === 2) {
        boardGrid.classList.add(
          "grid-cols-1",
          "md:grid-cols-2",
          "max-w-5xl",
          "mx-auto",
        );
      } else if (visibleCount === 3) {
        boardGrid.classList.add(
          "grid-cols-1",
          "md:grid-cols-2",
          "lg:grid-cols-3",
          "max-w-7xl",
          "mx-auto",
        );
      } else {
        boardGrid.classList.add(
          "grid-cols-1",
          "md:grid-cols-2",
          "xl:grid-cols-4",
        );
      }
    }
  }
}
function handleCardClick(event, workOrderId) {
  if (event.type === "touchend") {
    event.preventDefault();
  }
  openWorkOrderDetail(workOrderId);
}
function isWorkOrderCommittedToday(wo, dateVal) {
  if (!wo) return false;
  if (wo.status === "Hold" || wo.status === "Completed" || wo.status === "Cancelled") return false;
  const today = getLocalDateString();
  if (!dateVal) dateVal = store.dashboardDate || today;
  if (wo.last_committed_date === dateVal) return true;
  const woIdStr = String(wo.id || "");
  const woFbKeyStr = String(wo._fbKey || "");
  const woRefStr = String(wo.reference_no || "");
  const woJobNoStr = String(wo.job_no || "");
  const woJcNum = String(wo.job_card_no || wo.job_number || wo.jc_number || "");
  const woDescStr = String(wo.description || "").trim().toLowerCase();

  const allocs = getDailyAllocationsForDate(dateVal);
  return allocs.some((a) => {
    const aWoId = String(a.work_order_id || a.workOrderId || a.work_order || a.wo_id || "");
    const aDesc = String(a.description || a.task_name || a.work_order_name || "").trim().toLowerCase();
    return (
      (woIdStr && aWoId === woIdStr) ||
      (woFbKeyStr && aWoId === woFbKeyStr) ||
      (woRefStr && aWoId === woRefStr) ||
      (woJobNoStr && aWoId === woJobNoStr) ||
      (woJcNum && aWoId === woJcNum) ||
      (!aWoId && woDescStr && aDesc && aDesc === woDescStr)
    );
  });
}

function getWorkOrderAssignedSailors(wo, dateVal) {
  if (!wo) return { sailors: [], source: "", isCommitted: false };
  const today = getLocalDateString();
  if (!dateVal) dateVal = store.dashboardDate || today;
  const isToday = dateVal === today;
  const isCommitted = isWorkOrderCommittedToday(wo, dateVal);

  // Find daily allocations for the target date
  const dailyRecordKeys = new Set();
  const targetDate = dateVal || today;
  const woIdStr = String(wo.id || "");
  const woFbKeyStr = String(wo._fbKey || "");
  const woRefStr = String(wo.reference_no || "");
  const woJobNoStr = String(wo.job_no || "");
  const woJcNum = String(wo.job_card_no || wo.job_number || wo.jc_number || "");
  const woDescStr = String(wo.description || "").trim().toLowerCase();

  let hasDailyRecordForDate = false;
  const targetAllocs = getDailyAllocationsForDate(targetDate);
  targetAllocs.forEach((a) => {
    const aWoId = String(a.work_order_id || a.workOrderId || a.work_order || a.wo_id || "");
    const aDesc = String(a.description || a.task_name || a.work_order_name || "").trim().toLowerCase();

    const isWoMatch =
      (woIdStr && aWoId === woIdStr) ||
      (woFbKeyStr && aWoId === woFbKeyStr) ||
      (woRefStr && aWoId === woRefStr) ||
      (woJobNoStr && aWoId === woJobNoStr) ||
      (woJcNum && aWoId === woJcNum) ||
      (!aWoId && woDescStr && aDesc && aDesc === woDescStr);

    if (isWoMatch) {
      const aKeys = [a.sailor_id, a.sailorId, a.official_number, a.offNo].filter(Boolean).map(String);
      const isRemoved = wo._removedSailorIds && aKeys.some((k) => {
        const kStr = String(k).trim();
        if (wo._removedSailorIds.has(kStr)) return true;
        const digits = kStr.replace(/\D/g, "");
        return digits.length >= 3 && Array.from(wo._removedSailorIds).some((rk) => String(rk).replace(/\D/g, "") === digits);
      });
      if (!isRemoved) {
        hasDailyRecordForDate = true;
        if (a.sailor_id) dailyRecordKeys.add(String(a.sailor_id).trim());
        if (a.sailorId) dailyRecordKeys.add(String(a.sailorId).trim());
        if (a.official_number) dailyRecordKeys.add(String(a.official_number).trim());
        if (a.offNo) dailyRecordKeys.add(String(a.offNo).trim());
      }
    }
  });

  const assignedKeys = new Set();
  let resolvedSource = "";

  if (hasDailyRecordForDate) {
    if (isToday && (wo.status === "Hold" || wo.status === "Completed" || wo.status === "Cancelled")) {
      const explicitCrew = extractSailorKeys(wo.assigned);
      if (explicitCrew.length === 0 && dailyRecordKeys.size === 0) {
        return { sailors: [], source: "", isCommitted: false };
      }
    }
    dailyRecordKeys.forEach((k) => assignedKeys.add(k));
    resolvedSource = "daily_record";
    // On today, ALWAYS include planned wo.assigned crew as well so newly assigned or pending sailors are not hidden
    if (isToday) {
      extractSailorKeys(wo.assigned).forEach((k) => assignedKeys.add(k));
      if (wo.status !== "Hold" && wo.status !== "Completed" && wo.status !== "Cancelled") {
        if (assignedKeys.size === 0 && !wo._userClearedCrew && !wo.user_cleared_crew && wo.last_assigned_date !== targetDate) {
          extractSailorKeys(wo.last_assigned).forEach((k) => assignedKeys.add(k));
        }
      }
    }
  } else if (isToday || wo.status === "Active" || wo.status === "Pending") {
    if (wo.status === "Hold" || wo.status === "Completed" || wo.status === "Cancelled") {
      let crewKeys = extractSailorKeys(wo.assigned);
      if (crewKeys.length > 0) {
        crewKeys.forEach((k) => assignedKeys.add(k));
        resolvedSource = isToday ? "live" : "work_order_crew";
      }
    } else {
    // If the user intentionally cleared crew, do NOT resurrect yesterday's crew!
    const isCrewCleared = wo._userClearedCrew || wo.user_cleared_crew || (wo.last_assigned_date === targetDate && (!wo.assigned || wo.assigned.length === 0));
    if (!isCrewCleared) {
      // ── FALLBACK CASCADE FOR CONTINUING / UNCOMMITTED WORK ORDERS ──
      // 1. Current planned wo.assigned
      let crewKeys = extractSailorKeys(wo.assigned);
      if (crewKeys.length > 0) {
        resolvedSource = isToday ? "live" : "work_order_crew";
      }

      // 2. Previous day's last_assigned (only if not touched today)
      if (crewKeys.length === 0 && wo.last_assigned_date !== targetDate) {
        crewKeys = extractSailorKeys(wo.last_assigned);
        if (crewKeys.length > 0) {
          resolvedSource = "last_assigned";
        }
      }

      // 3. Linked Job Card crew (only if not touched today)
      if (crewKeys.length === 0 && wo.last_assigned_date !== targetDate) {
        const jc = typeof getJobCardForWorkOrder === "function" ? getJobCardForWorkOrder(wo._fbKey || wo.id) : null;
        if (jc && !jc._userClearedCrew && !jc.user_cleared_crew) {
          crewKeys = extractSailorKeys(jc.assigned);
          if (crewKeys.length === 0 && jc.last_assigned_date !== targetDate) crewKeys = extractSailorKeys(jc.last_assigned);
          if (crewKeys.length > 0) {
            resolvedSource = "job_card_crew";
          }
        }
      }

      // 4. Most recent historical daily_allocations for this work order before targetDate (only if not touched today)
      if (crewKeys.length === 0 && wo.last_assigned_date !== targetDate && store.dailyAllocations && store.dailyAllocations.length > 0) {
        const prevAllocs = (store.dailyAllocations || []).filter((a) => {
          if (!a || a.date >= targetDate || a.status === "Cancelled") return false;
          const aWoId = String(a.work_order_id || a.workOrderId || a.work_order || a.wo_id || "");
          const aDesc = String(a.description || a.task_name || a.work_order_name || "").trim().toLowerCase();
          return (
            (woIdStr && aWoId === woIdStr) ||
            (woFbKeyStr && aWoId === woFbKeyStr) ||
            (woRefStr && aWoId === woRefStr) ||
            (woJobNoStr && aWoId === woJobNoStr) ||
            (woJcNum && aWoId === woJcNum) ||
            (!aWoId && woDescStr && aDesc && aDesc === woDescStr)
          );
        });
        if (prevAllocs.length > 0) {
          prevAllocs.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
          const latestPrevDate = prevAllocs[0].date;
          prevAllocs.filter((a) => a.date === latestPrevDate).forEach((a) => {
            if (a.sailor_id) crewKeys.push(String(a.sailor_id).trim());
            else if (a.sailorId) crewKeys.push(String(a.sailorId).trim());
            else if (a.official_number) crewKeys.push(String(a.official_number).trim());
          });
          if (crewKeys.length > 0) {
            resolvedSource = "historical_record";
          }
        }
      }

      // Filter out any removed sailors from crewKeys
      if (wo._removedSailorIds && wo._removedSailorIds.size > 0) {
        crewKeys = crewKeys.filter((k) => {
          const kStr = String(k).trim();
          if (wo._removedSailorIds.has(kStr)) return false;
          const digits = kStr.replace(/\D/g, "");
          if (digits.length >= 3 && Array.from(wo._removedSailorIds).some((rk) => String(rk).replace(/\D/g, "") === digits)) return false;
          return true;
        });
      }

      crewKeys.forEach((k) => assignedKeys.add(k));
    } else {
      // wo._userClearedCrew / user_cleared_crew is true: only respect explicit wo.assigned
      let crewKeys = extractSailorKeys(wo.assigned);
      if (wo._removedSailorIds && wo._removedSailorIds.size > 0) {
        crewKeys = crewKeys.filter((k) => {
          const kStr = String(k).trim();
          if (wo._removedSailorIds.has(kStr)) return false;
          const digits = kStr.replace(/\D/g, "");
          if (digits.length >= 3 && Array.from(wo._removedSailorIds).some((rk) => String(rk).replace(/\D/g, "") === digits)) return false;
          return true;
        });
      }
      crewKeys.forEach((k) => assignedKeys.add(k));
      if (crewKeys.length > 0) resolvedSource = isToday ? "live" : "work_order_crew";
    }
    }
  }

  // Remove any removed sailor keys from assignedKeys
  if (wo._removedSailorIds && wo._removedSailorIds.size > 0) {
    for (const k of assignedKeys) {
      const kStr = String(k).trim();
      const kDigits = kStr.replace(/\D/g, "");
      if (wo._removedSailorIds.has(kStr) || (kDigits.length >= 3 && Array.from(wo._removedSailorIds).some((rk) => String(rk).replace(/\D/g, "") === kDigits))) {
        assignedKeys.delete(k);
      }
    }
  }

  const sailors = (store.sailors || []).filter((s) => {
    if (wo._removedSailorIds && isSailorMatchingKeys(s, wo._removedSailorIds)) return false;
    return isSailorMatchingKeys(s, assignedKeys);
  });

  // Map evaluated status for targetDate
  sailors.forEach((s) => {
    const alloc = targetAllocs.find(
      (a) => a && isSailorMatchingKeys(s, [a.sailor_id, a.official_number, a.sailorId, a.offNo])
    );
    if (alloc) {
      s.evaluated = alloc.evaluated === true;
    }
  });

  return {
    sailors,
    source: resolvedSource || (hasDailyRecordForDate ? "daily_record" : isToday ? "live" : "work_order_crew"),
    isCommitted: hasDailyRecordForDate || isCommitted,
  };
}

function commitDailyLabourForWorkOrder(event, woKey) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  let wo = (store.workOrders || []).find(
    (w) => String(w.id) === String(woKey) || String(w._fbKey) === String(woKey)
  );
  if (!wo) {
    wo = (store.jobCards || []).find(
      (j) => String(j.id) === String(woKey) || String(j._fbKey) === String(woKey)
    );
  }
  if (!wo) return;
  const today = getLocalDateString();
  const dateVal = store.dashboardDate || today;
  const { sailors: assignedSailors } = getWorkOrderAssignedSailors(wo, dateVal);
  if (assignedSailors.length === 0) {
    showToast("No planned sailors found to commit!", "warning");
    return;
  }

  const [yyyy, mm, dd] = dateVal.split("-");
  const monthKey = `${yyyy}-${mm}`;
  const dayKey = parseInt(dd, 10).toString();
  const isLeaveCode = (val) => isSailorOnLeaveOnDate(val, dateVal);

  const activeSailorsToCommit = assignedSailors.filter((s) => {
    const fbStatus = typeof getSailorDailyAttendanceStatus === "function"
      ? getSailorDailyAttendanceStatus(s, dateVal)
      : (store.availability && store.availability[monthKey] && store.availability[monthKey][dayKey] ? store.availability[monthKey][dayKey][s._fbKey] : null);
    return !isLeaveCode(fbStatus) && (!isLeaveCode(s.attendance) || (s.attendance && s.attendance.toLowerCase() === "present"));
  });

  if (activeSailorsToCommit.length === 0) {
    showToast("All assigned sailors are on leave/sick today!", "error");
    return;
  }

  // Create daily allocations
  if (!store.dailyAllocations) store.dailyAllocations = [];
  const committedIds = activeSailorsToCommit.map((s) => String(s.id !== undefined && s.id !== null ? s.id : s._fbKey));
  wo.assigned = committedIds;
  wo.last_assigned = [...committedIds];
  wo.last_committed_date = dateVal;
  wo.last_assigned_date = dateVal;

  activeSailorsToCommit.forEach((s) => {
    const sid = s.id || s._fbKey;
    const alloc = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      date: dateVal,
      sailor_id: sid,
      official_number: s.official_number || s.service_no || "",
      work_order_id: wo.id || wo._fbKey,
      role_today: "Worker",
      assigned_by: store.currentUser && store.currentUser.name ? store.currentUser.name : "Officer",
      status: "Active"
    };
    store.dailyAllocations = store.dailyAllocations.filter(
      (a) => !(a.date === dateVal && isSailorMatchingKeys(s, [a.sailor_id, a.official_number]))
    );
    store.dailyAllocations.push(alloc);
    opsDB.ref(`daily_allocations/${dateVal}_${sanitizeFbKey(sid)}`).set(alloc);
  });

  if (window.safeFbAssignSailor && committedIds.length > 0) {
    committedIds.forEach((sid) => safeFbAssignSailor(wo._fbKey || wo.id, sid, dateVal));
  }

  if (wo._fbKey) {
    const tableNode = (store.workOrders || []).some(w => w._fbKey === wo._fbKey) ? "work_orders" : "job_cards";
    opsDB.ref(`${tableNode}/${wo._fbKey}`).update({
      assigned: committedIds.length > 0 ? committedIds : null,
      last_assigned: committedIds.length > 0 ? committedIds : null,
      last_committed_date: dateVal,
      last_assigned_date: dateVal
    });
  }

  showToast(`⚡ Daily Labour committed for ${activeSailorsToCommit.length} sailor(s)!`, "success");
  refreshDailyCommitmentCache(dateVal);
  renderDashboard();
  renderZoneSelectors();
  if (typeof renderSummaryView === "function") {
    renderSummaryView();
  }
}

function commitAllZoneWorkOrders() {
  const today = getLocalDateString();
  const dateVal = store.dashboardDate || today;
  const isCurrentZoneMatch = (z) => z && (z === store.currentZone || isZoneMatch(z, store.currentZone));
  const uncommittedWos = (store.workOrders || []).filter(
    (wo) =>
      isCurrentZoneMatch(wo.zone_id || wo.zone) &&
      wo.status === "Active" &&
      isWorkOrderActiveOnDate(wo, dateVal) &&
      !isWorkOrderCommittedToday(wo, dateVal) &&
      getWorkOrderAssignedSailors(wo, dateVal).sailors.length > 0
  );

  if (uncommittedWos.length === 0) {
    showToast("All active work orders in this zone are already committed for today!", "info");
    return;
  }

  if (!confirm(`Are you sure you want to commit daily labour for all ${uncommittedWos.length} active work orders in ${store.currentZone}?`)) {
    return;
  }

  uncommittedWos.forEach((wo) => {
    commitDailyLabourForWorkOrder(null, wo._fbKey || wo.id);
  });

  renderZoneSelectors();
  showToast(`✓ Committed all ${uncommittedWos.length} work orders in ${store.currentZone}!`, "success");
}

function renderWorkOrderCard(wo) {
  const priorityMap = {
    High: { bar: "#dc2626", chip: "priority-high", icon: "🔴" },
    Medium: { bar: "#d97706", chip: "priority-medium", icon: "🟡" },
    Low: { bar: "#059669", chip: "priority-low", icon: "🟢" },
  };
  const statusMap = {
    Active: { stripe: "work-card-active", chip: "chip-active" },
    Pending: { stripe: "work-card-pending", chip: "chip-pending" },
    Hold: { stripe: "border-l-4 border-slate-400", chip: "chip-hold" },
    Completed: { stripe: "border-l-4 border-teal-500", chip: "chip-completed" },
  };
  const today = getLocalDateString();
  const dateVal = store.dashboardDate || today;
  const isToday = dateVal === today;
  const isCommitted = isWorkOrderCommittedToday(wo, dateVal);
  const { sailors: assignedSailors } = getWorkOrderAssignedSailors(wo, dateVal);
  const progress = wo.progress || 0;
  const pendingEvals = assignedSailors.filter((s) => !s.evaluated).length;
  const pm = priorityMap[wo.priority] || priorityMap["Medium"];
  const sm = statusMap[wo.status] || statusMap["Pending"];
  const progressColor =
    progress >= 75 ? "#059669" : progress >= 40 ? "#0d9488" : "#2563eb";
  const isAssignmentOrAdminStaff =
    Boolean(wo.assign_type) ||
    isAdminStaffDuties(wo.zone_id || store.currentZone);

  const assignTypeBadge = wo.assign_type
    ? `<span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">💼 ${wo.assign_type}</span>`
    : "";
  const woKey = wo._fbKey || wo.id;
  // Check if any planned sailor is on Leave/Sick today
  const [yyyy, mm, dd] = dateVal.split("-");
  const monthKey = `${yyyy}-${mm}`;
  const dayKey = parseInt(dd, 10).toString();
  const isLeaveCode = (val) => isSailorOnLeaveOnDate(val, dateVal);
  const getSailorLeave = (s) => {
    if (!s) return null;
    const fbStatus = typeof getSailorDailyAttendanceStatus === "function"
      ? getSailorDailyAttendanceStatus(s, dateVal)
      : (store.availability && store.availability[monthKey] && store.availability[monthKey][dayKey] ? store.availability[monthKey][dayKey][s._fbKey] : null);
    if (isLeaveCode(fbStatus)) return fbStatus;

    // If sailor has an explicit Active daily allocation for dateVal, they are actively working!
    const allocKey = `${dateVal}_${s._fbKey || s.id}`;
    const alloc = store.dailyAllocationsMap
      ? store.dailyAllocationsMap[allocKey]
      : (store.dailyAllocations || []).find((a) => a && a.date === dateVal && (a.sailor_id === s._fbKey || a.sailor_id === s.id || a.official_number === s.official_number));
    if (alloc && alloc.status === "Active") return null;

    if (isLeaveCode(s.attendance) && s.attendance && s.attendance.toLowerCase() !== "present") return s.attendance;
    return null;
  };

  let leaveAbsentCount = 0;
  const activeWorkingSailors = [];
  assignedSailors.forEach((s) => {
    const leave = getSailorLeave(s);
    if (leave) {
      leaveAbsentCount++;
    } else {
      activeWorkingSailors.push(s);
    }
  });

  const weAbsentCount = assignedSailors.filter((s) => {
    const l = getSailorLeave(s);
    return l && /^(WE|Weekend)$/i.test(String(l).trim());
  }).length;
  const leaveBadgeText = weAbsentCount === leaveAbsentCount 
    ? `(${leaveAbsentCount} on weekend)` 
    : (weAbsentCount > 0 ? `(${leaveAbsentCount} on leave/WE)` : `(${leaveAbsentCount} on leave)`);

  const tradeCounts = {};
  (isCommitted ? activeWorkingSailors : assignedSailors).forEach((s) => {
    const t = s.trade || "MA";
    tradeCounts[t] = (tradeCounts[t] || 0) + 1;
  });
  const tradeStr = Object.entries(tradeCounts)
    .map(([trade, count]) => `${count} ${trade}`)
    .join(", ");
  const tradeBadge = tradeStr
    ? `<span class="text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded ml-1 border border-slate-200">${tradeStr}</span>`
    : "";

  const priorityBadge = isAssignmentOrAdminStaff
    ? ""
    : `<span class="text-[11px] font-bold px-2 py-0.5 rounded-full ${pm.chip}">${pm.icon} ${wo.priority}</span>`;

  const statusBadge = isAssignmentOrAdminStaff
    ? ""
    : `<span class="text-[11px] font-medium px-2 py-0.5 rounded-full ${sm.chip}">${wo.status}</span>`;

  // Daily commitment badge
  const commitmentBadge = isToday && wo.status !== "Completed" && wo.status !== "Hold"
    ? isCommitted
      ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center gap-1">🟢 Active Today</span>`
      : `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-300 flex items-center gap-1">⏳ Standby (${assignedSailors.length} Planned)</span>`
    : "";

  const leaveAlertHtml = (isToday && !isCommitted && leaveAbsentCount > 0)
    ? `<div class="mt-2 px-2.5 py-1 bg-red-50 border border-red-200 rounded-lg text-[10px] text-red-700 font-semibold flex items-center gap-1.5 animate-pulse">
        <span>⚠️</span> <span>${leaveAbsentCount} planned sailor(s) on Leave/Sick today</span>
       </div>`
    : "";

  const commitActionBtn = (isToday && !isCommitted && wo.status !== "Completed" && wo.status !== "Hold" && assignedSailors.length > 0)
    ? `<div class="mt-2.5 pt-2 border-t border-slate-100">
        <button type="button" onclick="commitDailyLabourForWorkOrder(event, '${woKey}')" class="w-full py-1.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer">
          <span>⚡</span> Proceed - Commit Daily Labour (${assignedSailors.length - leaveAbsentCount})
        </button>
       </div>`
    : "";

  const progressSection = isAssignmentOrAdminStaff
    ? ""
    : `
            <!-- Progress -->
            <div class="px-3 pb-2">
                <div class="flex justify-between text-[11px] mb-1">
                    <span class="text-slate-400">Progress</span>
                    <span class="font-bold" style="color:${progressColor}">${progress}%</span>
                </div>
                <div class="w-full rounded-full h-1.5" style="background:rgba(15,32,64,0.1)">
                    <div class="h-1.5 rounded-full transition-all duration-500" style="width:${progress}%;background:${progressColor}"></div>
                </div>
            </div>`;

  const metaRow = isAssignmentOrAdminStaff
    ? ""
    : `
            <!-- Meta row -->
            <div class="px-3 pb-2 flex items-center justify-between text-[11px] text-slate-500">
                <span>⏱ ${wo.estimated_duration}d</span>
                ${wo.budget_allocation ? `<span class="font-medium text-slate-600">💰 ${formatCurrency(wo.budget_allocation)}</span>` : ""}
            </div>`;

  const officerBadge = wo.officer_review_status === "Pending Review"
    ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">⏳ Pending Officer</span>`
    : wo.officer_review_status === "Approved"
      ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">🛡️ Approved</span>`
      : "";

  return `
        <div class="work-order-card ${sm.stripe} rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group"
            
            onclick="handleCardClick(event, '${woKey}')"
            ondragover="handleDragOver(event)" ondrop="handleDropOnCard(event, '${woKey}')">

            <!-- Header row -->
            <div class="px-3 pt-3 pb-2 flex items-start justify-between">
                <div class="flex items-center gap-1.5 flex-wrap">
                    ${priorityBadge}
                    ${statusBadge}
                    ${commitmentBadge}
                    ${assignTypeBadge}
                    ${officerBadge}
                </div>
                <span class="text-[10px] text-slate-400 mono font-medium flex-shrink-0">${wo.reference_no || "—"}</span>
            </div>

            <div class="px-3 pb-2">
                <h4 class="font-semibold text-slate-800 text-sm leading-snug mb-0.5 group-hover:text-teal-700 transition-colors">${wo.description}</h4>
                <p class="text-[11px] text-slate-500">📍 ${wo.location || "Location not set"}${wo.sub_location ? " — " + wo.sub_location : ""}</p>
            </div>

            ${progressSection}

            ${metaRow}

            <!-- Assigned sailors -->
            <div class="px-3 pb-3 border-t border-slate-100 pt-2">
                <div class="flex items-center justify-between mb-1.5">
                    <span class="text-[11px] text-slate-500 flex items-center flex-wrap gap-1">👷 ${
                      isCommitted
                        ? (leaveAbsentCount > 0 
                            ? `<span class="font-bold text-slate-700">${activeWorkingSailors.length} active</span> <span class="text-amber-600 text-[10px] font-semibold">${leaveBadgeText}</span>` 
                            : `<span class="font-bold text-slate-700">${assignedSailors.length} active</span>`)
                        : (leaveAbsentCount > 0
                            ? `<span class="font-medium text-slate-600">${assignedSailors.length} planned</span> <span class="text-amber-600 text-[10px]">(${activeWorkingSailors.length} available)</span>`
                            : `<span class="font-medium text-slate-600">${assignedSailors.length} planned</span>`)
                    } ${tradeBadge}</span>
                    ${store.isEveningMode && pendingEvals > 0 ? `<span class="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold animate-pulse">📝 ${pendingEvals} eval due</span>` : ""}
                </div>
                <div class="flex flex-wrap gap-1" id="assigned-${wo.id}">
                    ${
                      assignedSailors.length > 0
                        ? assignedSailors
                            .slice(0, 4)
                            .map(
                              (s) => {
                                const leaveCode = getSailorLeave(s);
                                const isLeave = Boolean(leaveCode);
                                const colorClasses = isLeave 
                                  ? "bg-rose-100 text-rose-800 border border-rose-300 opacity-80" 
                                  : (isCommitted ? (s.evaluated ? "bg-teal-100 text-teal-700" : "bg-blue-100 text-blue-700") : "bg-slate-100 text-slate-700 border border-dashed border-slate-300");
                                const leaveIcon = isLeave ? "🛌 " : "";
                                const leaveTag = isLeave ? ` [${leaveCode}]` : "";
                                const shortName = s.name ? (s.name.split(" ").length > 1 ? s.name.split(" ").slice(-1)[0] : s.name) : (s.official_number || "Sailor");
                                const scoreNum = typeof s.avgScore === "number" ? s.avgScore : (typeof s.score === "number" ? s.score : 7.0);
                                return `
                            <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${colorClasses}" title="${isLeave ? `On Leave/Sick/Weekend: ${leaveCode}` : (isCommitted ? 'Active Today' : 'Planned / Standby')}">
                                ${leaveIcon}${shortName}${leaveTag}
                                <span class="${getPerformanceColor(scoreNum)} px-1 rounded-full text-[9px]">${scoreNum.toFixed(1)}</span>
                            </span>`;
                              }
                            )
                            .join("") +
                          (assignedSailors.length > 4
                            ? `<span class="text-[10px] text-slate-400 italic">+${assignedSailors.length - 4} more</span>`
                            : "")
                        : '<span class="text-slate-300 text-[11px] italic">Drop sailors here or assign in detail view</span>'
                    }
                </div>
                ${leaveAlertHtml}
                ${commitActionBtn}
            </div>
        </div>
    `;
}
function renderZoneTeam() {
  const zoneTeamMembers = store.sailors.filter(
    (s) => s.isZoneTeam && s.zone_assigned === store.currentZone,
  );
  const container = document.getElementById("zoneTeamList");
  const attendanceCfg = {
    Present: {
      dot: "bg-teal-500",
      text: "Available",
      textColor: "text-teal-700",
      bg: "rgba(13,148,136,0.07)",
      border: "rgba(13,148,136,0.2)",
    },
    Leave: {
      dot: "bg-amber-500",
      text: "On Leave",
      textColor: "text-amber-700",
      bg: "rgba(245,158,11,0.07)",
      border: "rgba(245,158,11,0.2)",
    },
    Sick: {
      dot: "bg-rose-500",
      text: "Sick",
      textColor: "text-rose-700",
      bg: "rgba(244,63,94,0.07)",
      border: "rgba(244,63,94,0.2)",
    },
    Duty: {
      dot: "bg-blue-500",
      text: "On Duty",
      textColor: "text-blue-700",
      bg: "rgba(59,130,246,0.07)",
      border: "rgba(59,130,246,0.2)",
    },
  };
  const tradeBg = {
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
  container.innerHTML =
    zoneTeamMembers
      .map((s) => {
        var _s$id4;
        const att = s.attendance || "Present";
        const cfg = attendanceCfg[att] || attendanceCfg["Present"];
        const tb = tradeBg[s.trade] || "#475569";
        return `
        <div class="flex items-center justify-between p-2 rounded-xl group transition-all hover:shadow-sm"
            style="background:${cfg.bg};border:1px solid ${cfg.border}">
            <div class="flex items-center gap-2 min-w-0">
                <div class="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 shadow-sm"
                    style="background:${tb}">${s.trade}</div>
                <div class="min-w-0">
                    <span class="block text-xs font-semibold text-slate-700 truncate hover:underline cursor-pointer text-teal-600" onclick="openSailorProfile('${(_s$id4 = s.id) !== null && _s$id4 !== void 0 ? _s$id4 : s._fbKey}')">${s.name.split(" ").slice(1, 3).join(" ")}</span>
                    <span class="text-[10px] ${cfg.textColor} flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full inline-block ${cfg.dot}"></span>${cfg.text}
                    </span>
                </div>
            </div>
            <div class="flex items-center gap-1.5">
                <span class="performance-badge ${getPerformanceColor(s.avgScore)} text-[10px]">${s.avgScore.toFixed(1)}</span>
                <button onclick="removeFromZoneTeam(${s.id})" title="Remove from Zone Team"
                    class="text-rose-400 hover:text-rose-600 text-base opacity-0 group-hover:opacity-100 transition-all">×</button>
            </div>
        </div>`;
      })
      .join("") ||
    '<p class="text-center text-xs text-slate-400 py-4">No team members in this zone</p>';
  document.getElementById("zoneTeamBadge").textContent =
    `${zoneTeamMembers.length}/15`;
  document.getElementById("zoneTeamCount").textContent = zoneTeamMembers.length;
} // ---- Zone Team add / remove (req 3) ----
function removeFromZoneTeam(sailorId) {
  const sailor = store.sailors.find((s) => String(s.id) === String(sailorId));
  if (sailor) {
    sailor.isZoneTeam = false;
    sailor.zone_assigned = "A-Zone";
    const fbKey = sailor._fbKey || sailor.id;
    if (fbKey) {
      sailorsDB
        .ref(`sailors/${fbKey}`)
        .update({ isZoneTeam: false, zone_assigned: "A-Zone" })
        .catch((err) => console.error("Error removing from zone team:", err));
    }
    renderZoneTeam();
    renderAvailableSailors();
    showToast(`${sailor.name} removed from Zone Team`, "info");
  }
}
function openZoneTeamManager() {
  const searchInput = document.getElementById("ztmSearch");
  if (searchInput) searchInput.value = "";
  renderZtmLists();
  document.getElementById("zoneTeamModal").classList.remove("hidden");
}
function filterZtmAvailableList() {
  renderZtmLists(document.getElementById("ztmSearch").value);
}
function renderZtmLists(filter = "") {
  const currentZoneObj = store.zones.find((z) => z.id === store.currentZone);
  document.getElementById("ztmZoneName").textContent = currentZoneObj
    ? currentZoneObj.name
    : store.currentZone;
  const current = store.sailors.filter(
    (s) => s.isZoneTeam && s.zone_assigned === store.currentZone,
  );
  let eligible = store.sailors.filter((s) => !s.isZoneTeam);
  if (filter) {
    const q = filter.toLowerCase().trim();
    eligible = eligible.filter(
      (s) =>
        (s._searchIndex || "").includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.official_number || "").toLowerCase().includes(q) ||
        (s.rank || "").toLowerCase().includes(q) ||
        (s.trade || "").toLowerCase().includes(q),
    );
  }
  const attLabel = {
    Present: "Available",
    Leave: "On Leave",
    Sick: "Sick",
    Duty: "Duty",
  };
  const attCls = {
    Present: "text-green-600",
    Leave: "text-amber-600",
    Sick: "text-red-600",
    Duty: "text-blue-600",
  };
  document.getElementById("ztmCurrentList").innerHTML =
    current
      .map((s) => {
        var _s$id5;
        return `
        <div class="flex items-center justify-between p-2 bg-green-50 rounded-lg">
            <div class="flex items-center gap-2">
                <span class="w-7 h-7 bg-green-600 text-white rounded-full text-xs flex items-center justify-center font-bold">${s.trade}</span>
                <div>
                    <p class="text-sm font-medium">${s.name}</p>
                    <p class="text-[11px] ${attCls[s.attendance || "Present"]}">${attLabel[s.attendance || "Present"]} • ${s.official_number}</p>
                </div>
            </div>
            <button onclick="toggleZoneTeam('${(_s$id5 = s.id) !== null && _s$id5 !== void 0 ? _s$id5 : s._fbKey}', false)" class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">Remove</button>
        </div>
    `;
      })
      .join("") ||
    '<p class="text-center text-xs text-slate-400 py-4">No team members yet</p>';
  document.getElementById("ztmAvailableList").innerHTML =
    eligible
      .map((s) => {
        var _s$id6;
        return `
        <div class="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
            <div class="flex items-center gap-2">
                <span class="w-7 h-7 bg-slate-500 text-white rounded-full text-xs flex items-center justify-center font-bold">${s.trade}</span>
                <div>
                    <p class="text-sm font-medium">${s.name}</p>
                    <p class="text-[11px] ${attCls[s.attendance || "Present"]}">${attLabel[s.attendance || "Present"]} • ${s.official_number}</p>
                </div>
            </div>
            <button onclick="toggleZoneTeam('${(_s$id6 = s.id) !== null && _s$id6 !== void 0 ? _s$id6 : s._fbKey}', true)" class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">+ Add</button>
        </div>
    `;
      })
      .join("") ||
    '<p class="text-center text-xs text-slate-400 py-4">No eligible sailors found</p>';
}
function toggleZoneTeam(sailorId, addToTeam) {
  var _document$getElementB;
  const sailor = store.sailors.find(
    (s) =>
      String(s.id) === String(sailorId) ||
      String(s._fbKey) === String(sailorId),
  );
  if (!sailor) return;
  if (addToTeam) {
    const teamSize = store.sailors.filter(
      (s) => s.isZoneTeam && s.zone_assigned === store.currentZone,
    ).length;
    if (teamSize >= 15) {
      showToast("Zone Team is full (15 max)", "error");
      return;
    }
    sailor.isZoneTeam = true;
    sailor.zone_assigned = store.currentZone;
  } else {
    sailor.isZoneTeam = false;
    sailor.zone_assigned = "A-Zone";
  }
  const fbKey = sailor._fbKey || sailor.id;
  if (fbKey) {
    sailorsDB
      .ref(`sailors/${fbKey}`)
      .update({
        isZoneTeam: sailor.isZoneTeam,
        zone_assigned: sailor.zone_assigned,
      })
      .then(() => {
        showToast(
          `${sailor.name} ${addToTeam ? "added to" : "removed from"} Zone Team`,
        );
      })
      .catch((err) => {
        console.error("Error updating sailor zone team status:", err);
        showToast("Saved locally (offline mode)", "info");
      });
  } // Refresh lists
  renderZtmLists(
    ((_document$getElementB = document.getElementById("ztmSearch")) === null ||
    _document$getElementB === void 0
      ? void 0
      : _document$getElementB.value) || "",
  );
  renderZoneTeam();
  renderAvailableSailors();
}
function isSailorMatch(s, key) {
  if (!s || !key) return false;
  const target = String(key).trim();
  const norm = target.replace(/[\s.-]/g, "").toUpperCase();
  if (String(s.id) === target || String(s._fbKey) === target) return true;
  const sOff = String(s.off_no || s.official_number || s.official_no || s.service_no || "").trim();
  if (sOff && sOff === target) return true;
  const normOff = sOff.replace(/[\s.-]/g, "").toUpperCase();
  return Boolean(normOff && normOff === norm);
}

function markSailorInSet(set, sailorOrKey) {
  if (!set || !sailorOrKey) return;
  if (typeof sailorOrKey === "object") {
    const s = sailorOrKey;
    if (s.id) set.add(String(s.id));
    if (s._fbKey) set.add(String(s._fbKey));
    const off = s.off_no || s.official_number || s.official_no || s.service_no;
    if (off) {
      const str = String(off).trim();
      set.add(str);
      const norm = str.replace(/[\s.-]/g, "").toUpperCase();
      if (norm) set.add(norm);
      const digits = str.replace(/\D/g, "");
      if (digits.length >= 3) set.add(digits);
    }
  } else {
    const k = String(sailorOrKey).trim();
    set.add(k);
    const norm = k.replace(/[\s.-]/g, "").toUpperCase();
    if (norm) set.add(norm);
    const digits = k.replace(/\D/g, "");
    if (digits.length >= 3) set.add(digits);
    const s = typeof findSailorById === "function" ? findSailorById(k) : (store.sailors || []).find((x) => isSailorMatch(x, k));
    if (s) {
      if (s.id) set.add(String(s.id));
      if (s._fbKey) set.add(String(s._fbKey));
      const off = s.off_no || s.official_number || s.official_no || s.service_no;
      if (off) {
        const str = String(off).trim();
        set.add(str);
        const n = str.replace(/[\s.-]/g, "").toUpperCase();
        if (n) set.add(n);
        const d = str.replace(/\D/g, "");
        if (d.length >= 3) set.add(d);
      }
    }
  }
}

function isSailorInSet(set, s) {
  if (!set || !s) return false;
  if (s.id && set.has(String(s.id))) return true;
  if (s._fbKey && set.has(String(s._fbKey))) return true;
  const off = s.off_no || s.official_number || s.official_no || s.service_no;
  if (off) {
    const str = String(off).trim();
    if (set.has(str)) return true;
    const norm = str.replace(/[\s.-]/g, "").toUpperCase();
    if (set.has(norm)) return true;
    const digits = str.replace(/\D/g, "");
    if (digits.length >= 3 && set.has(digits)) return true;
  }
  return false;
}

function isTaskDescriptionNA(text) {
  if (!text) return false;
  const s = typeof text === "string" ? text : String(text);
  return /(නිවාඩු|ගිලන්|\bsiq\b|\bngh\b|\badmit\b|\bleave\b|\bsick\b|\bweekend\b|\boff\b|\bholiday\b|\babsent\b|\bawol\b|\bDL\b|T\/D|M\/D|^\s*L\s*$|^\s*HD\s*$)/i.test(
    s,
  );
}

function isProjectActiveOnDate(proj, dateVal) {
  if (!proj) return false;
  const statusStr = String(proj.status || "").toLowerCase();
  if (statusStr === "completed" || statusStr === "inactive" || statusStr === "closed" || statusStr === "cancelled") {
    return false;
  }
  // If project has actively assigned sailors, keep it active on the ground unless explicitly completed/closed
  const hasAssigned = proj.assigned_sailors && Object.keys(proj.assigned_sailors).length > 0;
  if (hasAssigned) {
    return true;
  }
  const dates = typeof parseProjectApprovalDates === "function" ? parseProjectApprovalDates(proj) : null;
  if (dates && (dates.startDate || dates.endDate)) {
    const target = dateVal || (typeof store !== "undefined" && store.dashboardDate) || (typeof getLocalDateString === "function" ? getLocalDateString() : new Date().toISOString().split("T")[0]);
    if (dates.startDate && target < dates.startDate) return false;
    if (dates.endDate && target > dates.endDate) return false;
  }
  return true;
}

window._longTermAllocationsCache = { date: null, data: null };

function invalidateLongTermAllocationsCache() {
  _longTermAllocationsCache = { date: null, data: null };
}

function getLongTermAllocations(dateVal) {
  const targetDate = dateVal || (typeof store !== "undefined" && store.dashboardDate) || (typeof getLocalDateString === "function" ? getLocalDateString() : new Date().toISOString().split("T")[0]);
  if (_longTermAllocationsCache && _longTermAllocationsCache.date === targetDate && _longTermAllocationsCache.data) {
    return _longTermAllocationsCache.data;
  }
  let allocs = { housing: [], outProject: [], otherBase: [] };

  const seenAllocSailorKeys = new Set();

  const processProjects = (projectsObj, allocArray, defaultType) => {
    if (projectsObj) {
      Object.keys(projectsObj).forEach((pid) => {
        const proj = projectsObj[pid];
        if (!proj) return;
        if (!isProjectActiveOnDate(proj, targetDate)) return;

        const name = (proj.name || defaultType).trim();
        if (proj.assigned_sailors) {
          Object.keys(proj.assigned_sailors).forEach((sailorFbKey) => {
            const sailor = typeof findSailorById === "function" ? findSailorById(sailorFbKey) : (store.sailors || []).find((s) => isSailorMatch(s, sailorFbKey));
            if (sailor) {
              const sKey = String(sailor._fbKey || sailor.id || sailor.official_number || "");
              if (sKey) seenAllocSailorKeys.add(sKey);
              allocArray.push({
                sailor,
                projectName: name,
                projectType: defaultType,
                projectId: pid,
                date: (proj.assigned_sailors[sailorFbKey] && proj.assigned_sailors[sailorFbKey].assigned_date) || Date.now(),
              });
            }
          });
        }
      });
    }
  };

  processProjects(store.outProjects, allocs.outProject, "Out Project");
  processProjects(store.housingProjects, allocs.housing, "Housing Project");
  processProjects(store.otherBases, allocs.otherBase, "Other Base");

  // Also include sailors directly assigned to Out-Project, Other-Base, or Housing-Project in PHP DB
  (store.sailors || []).forEach((s) => {
    if (!s) return;
    const sKey = String(s._fbKey || s.id || s.official_number || "");
    if (!sKey || seenAllocSailorKeys.has(sKey)) return;
    const zNorm = String(s.zone_assigned || s.zone || s.zoneId || "").toLowerCase().replace(/[-_\s]+/g, "");
    if (zNorm === "outproject") {
      allocs.outProject.push({
        sailor: s,
        projectName: "Out Project (General Deployment)",
        projectType: "Out Project",
        projectId: "php_out_project",
        date: Date.now(),
      });
      seenAllocSailorKeys.add(sKey);
    } else if (zNorm === "otherbase") {
      allocs.otherBase.push({
        sailor: s,
        projectName: "Other Base (General Deployment)",
        projectType: "Other Base",
        projectId: "php_other_base",
        date: Date.now(),
      });
      seenAllocSailorKeys.add(sKey);
    } else if (zNorm === "housingproject") {
      allocs.housing.push({
        sailor: s,
        projectName: "Housing Project (General Deployment)",
        projectType: "Housing Project",
        projectId: "php_housing_project",
        date: Date.now(),
      });
      seenAllocSailorKeys.add(sKey);
    }
  });

  // Also check any active work orders or job cards explicitly tagged for these locations
  const checkWorkTasks = (tasks, defaultType, allocArray, projFallback) => {
    (tasks || []).forEach((t) => {
      if (!t || t.status === "Cancelled") return;
      const zNorm = String(t.zone_id || t.zone || t.assign_type || "").toLowerCase().replace(/[-_\s]+/g, "");
      const descNorm = String(t.description || t.title || "").toLowerCase().replace(/[-_\s]+/g, "");
      const targetNorm = defaultType.toLowerCase().replace(/[-_\s]+/g, "");
      const isMatch = zNorm === targetNorm || descNorm.startsWith(targetNorm);
      if (!isMatch) return;
      if (typeof isWorkOrderActiveOnDate === "function" && !isWorkOrderActiveOnDate(t, targetDate)) return;
      if (typeof isWorkOrderCommittedToday === "function" && !isWorkOrderCommittedToday(t, targetDate)) return;

      const { sailors } = typeof getWorkOrderAssignedSailors === "function" ? getWorkOrderAssignedSailors(t, targetDate) : { sailors: [] };
      const taskTitle = (t.description || t.title || projFallback).trim();
      (sailors || []).forEach((s) => {
        const sKey = String(s._fbKey || s.id || s.official_number || "");
        if (sKey && !seenAllocSailorKeys.has(sKey)) {
          allocArray.push({
            sailor: s,
            projectName: taskTitle,
            projectType: defaultType,
            projectId: String(t.id || t._fbKey || "task"),
            date: Date.now(),
          });
          seenAllocSailorKeys.add(sKey);
        }
      });
    });
  };

  const activeWos = store.workOrders || [];
  const activeJcs = store.jobCards || [];
  checkWorkTasks(activeWos, "Out Project", allocs.outProject, "Out Project Task");
  checkWorkTasks(activeJcs, "Out Project", allocs.outProject, "Out Project Task");
  checkWorkTasks(activeWos, "Other Base", allocs.otherBase, "Other Base Task");
  checkWorkTasks(activeJcs, "Other Base", allocs.otherBase, "Other Base Task");
  checkWorkTasks(activeWos, "Housing Project", allocs.housing, "Housing Project Task");
  checkWorkTasks(activeJcs, "Housing Project", allocs.housing, "Housing Project Task");

  _longTermAllocationsCache = { date: targetDate, data: allocs };
  return allocs;
}
function updateCounters() {
  const activeWo = store.workOrders || [];
  const activeJc = store.jobCards || [];
  const today = getLocalDateString();
  const dateVal = store.dashboardDate || today;
  const isToday = dateVal === today;
  const assignedIds = new Set();
  const naIds = new Set();
  const isLeaveState = (val) => isSailorOnLeaveOnDate(val, dateVal);
  const isNA = isTaskDescriptionNA;

  const woByIdOrKey = new Map();
  activeWo.forEach((w) => {
    if (w.id !== undefined && w.id !== null) woByIdOrKey.set(String(w.id), w);
    if (w._fbKey) woByIdOrKey.set(String(w._fbKey), w);
  });
  const jcByIdOrKey = new Map();
  activeJc.forEach((j) => {
    if (j.id !== undefined && j.id !== null) jcByIdOrKey.set(String(j.id), j);
    if (j._fbKey) jcByIdOrKey.set(String(j._fbKey), j);
  });

  const activeAllocs = getDailyAllocationsForDate(dateVal);
  activeAllocs.forEach((alloc) => {
    const wo = woByIdOrKey.get(String(alloc.work_order_id));
    const jc = jcByIdOrKey.get(String(alloc.work_order_id));
    if (wo || jc) {
          if (
            (wo && (isNA(wo.description) || isNA(wo.reference_no))) ||
            (jc && (isNA(jc.description) || isNA(jc.title)))
          ) {
            markSailorInSet(naIds, alloc.sailor_id);
          } else {
            if ((wo && isWorkOrderActiveOnDate(wo, dateVal)) || (jc && isWorkOrderActiveOnDate(jc, dateVal))) {
                markSailorInSet(assignedIds, alloc.sailor_id);
            }
          }
      } else {
        markSailorInSet(assignedIds, alloc.sailor_id);
      }
  });

  // Include all assignments from daily commitment cache
  if (_dailyCommitmentCache && _dailyCommitmentCache.sailorAssignmentMap) {
    for (const [k, assignObj] of _dailyCommitmentCache.sailorAssignmentMap.entries()) {
      if (k) {
        if (assignObj && (isNA(assignObj.title) || isNA(assignObj.ref))) {
          markSailorInSet(naIds, k);
        } else {
          markSailorInSet(assignedIds, k);
        }
      }
    }
  }

  // Include assignments from active work orders and job cards
  activeWo.forEach((wo) => {
    if (wo && (wo.status === "Active" || wo.status === "Pending")) {
      const isCommitted = typeof isWorkOrderCommittedToday === "function" && isWorkOrderCommittedToday(wo, dateVal);
      const isAssignedToday = wo.last_assigned_date === dateVal;
      if (isCommitted || isAssignedToday) {
        const { sailors } = getWorkOrderAssignedSailors(wo, dateVal);
        sailors.forEach((s) => {
          if (isNA(wo.description) || isNA(wo.reference_no)) {
            markSailorInSet(naIds, s);
          } else {
            markSailorInSet(assignedIds, s);
          }
        });
      }
    }
  });

  activeJc.forEach((jc) => {
    if (jc && (jc.status === "Active" || jc.status === "Pending")) {
      const isCommitted = typeof isWorkOrderCommittedToday === "function" && isWorkOrderCommittedToday(jc, dateVal);
      const isAssignedToday = jc.last_assigned_date === dateVal;
      if (isCommitted || isAssignedToday) {
        const { sailors } = getWorkOrderAssignedSailors(jc, dateVal);
        sailors.forEach((s) => {
          if (isNA(jc.description) || isNA(jc.title)) {
            markSailorInSet(naIds, s);
          } else {
            markSailorInSet(assignedIds, s);
          }
        });
      }
    }
  });
  const longTerm = typeof getLongTermAllocations === "function" ? getLongTermAllocations(dateVal) : { housing: [], outProject: [], otherBase: [] };
  const longTermIds = new Set();
  [...longTerm.housing, ...longTerm.outProject, ...longTerm.otherBase].forEach(
    (a) => {
      if (a && a.sailor) {
        markSailorInSet(longTermIds, a.sailor);
      }
    },
  );
  [store.outProjects, store.housingProjects, store.otherBases].forEach((projObj) => {
    if (projObj) {
      Object.values(projObj).forEach((p) => {
        if (p && p.assigned_sailors && (typeof isProjectActiveOnDate === "function" ? isProjectActiveOnDate(p, dateVal) : false)) {
          Object.keys(p.assigned_sailors).forEach((k) => markSailorInSet(longTermIds, k));
        }
      });
    }
  });
  const housingCount = document.getElementById("housingProjectCount");
  if (housingCount) housingCount.textContent = longTerm.housing.length;
  const outProjCount = document.getElementById("outProjectCount");
  if (outProjCount) outProjCount.textContent = longTerm.outProject.length;
  const otherBaseCount = document.getElementById("otherBaseCount");
  if (otherBaseCount) otherBaseCount.textContent = longTerm.otherBase.length;
  const [yyyy, mm, dd] = dateVal.split("-");
  const monthKey = `${yyyy}-${mm}`;
  const dayKey = parseInt(dd, 10).toString();

  store._currentNaIds = naIds;
  store._currentLongTermIds = longTermIds;
  store._currentAssignedIds = assignedIds;

  if (store.sailors) {
    store.sailors.forEach((s) => {
      // Check Firebase daily attendance first
      const fbStatus = getSailorDailyAttendanceStatus(s, dateVal);
      const isLeave = !isSailorAvailableForWork(s, dateVal) || (isLeaveState(s.attendance) && s.attendance && s.attendance.toLowerCase() !== "present") || isLeaveState(fbStatus);
      const assignment = typeof getSailorDailyAssignment === "function" ? getSailorDailyAssignment(s, dateVal) : null;
        
      if (!isLeave) {
        if (isSailorInSet(naIds, s)) {
          s.status = "NA";
        } else if (isSailorInSet(longTermIds, s)) {
          s.status = "LongTermDeployed";
        } else if (isSailorInSet(assignedIds, s) || assignment) {
          s.status = "Assigned";
        } else {
          s.status = "Available";
        }
      } else {
          // If they are on leave according to fbStatus, make sure s.status reflects it 
          // so that subsequent filters count them correctly as leave, not Available.
          s.status = fbStatus || s.attendance || "Leave";
      }
      
      // Resolve daily evaluation state from dailyAllocationsMap for active date
      const allocKey = `${dateVal}_${sanitizeFbKey(s.id)}`;
      const allocKeyFb = `${dateVal}_${sanitizeFbKey(s._fbKey)}`;
      const alloc = store.dailyAllocationsMap
        ? store.dailyAllocationsMap[allocKey] ||
          store.dailyAllocationsMap[allocKeyFb]
        : null;
      if (alloc) {
        s.evaluated = alloc.evaluated === true;
        if (alloc.score !== undefined) {
          s.yesterdayScore = parseFloat(alloc.score);
        }
      } else {
        s.evaluated = false;
      }
    });
  }
  const available = store.sailors
    ? store.sailors.filter((s) => s.status === "Available" && isSailorAvailableForWork(s, dateVal) && !isSailorInSet(assignedIds, s) && !(typeof getSailorDailyAssignment === "function" && getSailorDailyAssignment(s, dateVal))).length
    : 0;
  const assigned = store.sailors
    ? store.sailors.filter((s) => s.status === "Assigned").length
    : 0;
  const naCount = store.sailors
    ? store.sailors.filter((s) => {
        const fbStatus = getSailorDailyAttendanceStatus(s, dateVal);
        return isLeaveState(fbStatus) || (isLeaveState(s.attendance) && s.attendance && s.attendance.toLowerCase() !== "present") || s.status === "NA" || isSailorInSet(naIds, s);
      }).length
    : 0;
  const longTermCount = store.sailors
    ? store.sailors.filter((s) => s.status === "LongTermDeployed").length
    : 0;
  
  document.getElementById("netForce").textContent = store.sailors
    ? store.sailors.length
    : 0;
  document.getElementById("assignedCount").textContent = assigned;
  const deployedEl = document.getElementById("deployedCount");
  if (deployedEl) deployedEl.textContent = longTermCount;
  document.getElementById("availableCount").textContent = available;
  const todayNaEl = document.getElementById("todayNaCount");
  if (todayNaEl) todayNaEl.textContent = naCount;
}
function updatePendingEvals() {
  const evaluated = store.sailors ? store.sailors.filter((s) => {
    return (
      (s.status === "Assigned" || s.status === "NA" || s.status === "N/A") &&
      s.evaluated
    );
  }).length : 0;
  
  const pending = store.sailors ? store.sailors.filter((s) => {
    return (
      (s.status === "Assigned" || s.status === "NA" || s.status === "N/A") &&
      !s.evaluated
    );
  }).length : 0;
  const evalEl = document.getElementById("evaluatedToday");
  if (evalEl) evalEl.textContent = evaluated;
  const pendingEl = document.getElementById("pendingEvals");
  if (pendingEl) pendingEl.textContent = pending;
  if (typeof updateSundayEvaluationBadge === "function") updateSundayEvaluationBadge();
}
// DRAG AND DROP
// =============================================
window.draggedSailorId = null;
function handleDragStart(event, sailorId) {
  draggedSailorId = sailorId;
  event.target.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
}
function handleDragEnd(event) {
  event.target.classList.remove("dragging");
}
function handleDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add("drag-over");
}
function handleDrop(event, type) {
  event.preventDefault();
  event.currentTarget.classList.remove("drag-over");
}
function handleDropOnCard(event, workOrderId) {
  event.preventDefault();
  event.stopPropagation();
  document
    .querySelectorAll(".drag-over")
    .forEach((el) => el.classList.remove("drag-over"));
  if (!draggedSailorId) return;
  const assignment = getSailorCurrentAssignment(draggedSailorId);
  const sailor = typeof findSailorById === "function" ? findSailorById(draggedSailorId) : (store.sailors || []).find(
    (s) => isSailorMatchingKeys(s, [draggedSailorId]),
  );
  const workOrder = (store.workOrders || []).find(
    (wo) => String(wo.id) === String(workOrderId) || String(wo._fbKey) === String(workOrderId),
  ) || (store.jobCards || []).find(
    (jc) => String(jc.id) === String(workOrderId) || String(jc._fbKey) === String(workOrderId),
  );
  if (!sailor || !workOrder) {
    draggedSailorId = null;
    return;
  }

  const today = getLocalDateString();
  let isPrevJc = false;
  let prevWo = (store.workOrders || []).find((w) => {
    if (w.status !== "Active" && w.status !== "Pending") return false;
    const inAssigned = (w.assigned || []).some(id => isSailorMatchingKeys(sailor, [id]));
    const inLeader = isSailorMatchingKeys(sailor, [w.supervisor, w.incharge, w.project_artificer]);
    return inAssigned || inLeader;
  });
  if (!prevWo) {
    prevWo = (store.jobCards || []).find((j) => {
      if (j.status !== "Active" && j.status !== "Pending") return false;
      const inAssigned = (j.assigned || []).some(id => isSailorMatchingKeys(sailor, [id]));
      const inLeader = isSailorMatchingKeys(sailor, [j.supervisor, j.incharge, j.project_artificer]);
      return inAssigned || inLeader;
    });
    if (prevWo) isPrevJc = true;
  }

  const allocSnapshot = (store.dailyAllocations || []).find(
    (a) => a.date === today && isSailorMatchingKeys(sailor, [a.sailor_id, a.official_number])
  );

  _lastActionUndo = {
    type: "ASSIGN_SAILOR",
    sailorId: draggedSailorId,
    targetWoId: workOrder.id || workOrder._fbKey,
    targetWoPrevAssigned: [...(workOrder.assigned || [])],
    prevWoId: prevWo ? (prevWo.id || prevWo._fbKey) : null,
    prevWoAssigned: prevWo ? [...(prevWo.assigned || [])] : null,
    sailorPrevStatus: sailor.status,
    sailorPrevZone: sailor.zone_id || store.currentZone,
    dailyAllocSnapshot: allocSnapshot ? JSON.parse(JSON.stringify(allocSnapshot)) : null
  };

  const sidToStore = sailor.id || sailor._fbKey || draggedSailorId;

  if (prevWo) {
    let changed = false;
    if (prevWo.assigned && Array.isArray(prevWo.assigned)) {
      const pLen = prevWo.assigned.length;
      prevWo.assigned = prevWo.assigned.filter((id) => !isSailorMatchingKeys(sailor, [id]));
      if (prevWo.assigned.length !== pLen) changed = true;
    }
    if (prevWo.supervisor && isSailorMatchingKeys(sailor, [prevWo.supervisor])) { prevWo.supervisor = null; changed = true; }
    if (prevWo.incharge && isSailorMatchingKeys(sailor, [prevWo.incharge])) { prevWo.incharge = null; changed = true; }
    if (prevWo.project_artificer && isSailorMatchingKeys(sailor, [prevWo.project_artificer])) { prevWo.project_artificer = null; changed = true; }
    if (changed) {
      const table = isPrevJc ? "job_cards" : "work_orders";
      opsDB.ref(`${table}/${prevWo._fbKey || prevWo.id}`).update({
        assigned: (prevWo.assigned && prevWo.assigned.length > 0) ? prevWo.assigned : null,
        supervisor: prevWo.supervisor || null,
        incharge: prevWo.incharge || null,
        project_artificer: prevWo.project_artificer || null,
      });
    }
    if (window.safeFbRemoveSailor) {
      safeFbRemoveSailor(prevWo._fbKey || prevWo.id, sidToStore, today);
    }
    opsDB
      .ref(`daily_allocations/${today}_${sanitizeFbKey(sidToStore)}`)
      .remove();
    opsDB
      .ref(`daily_allocations/${today}_${sanitizeFbKey(draggedSailorId)}`)
      .remove();
  }
  if (!workOrder.assigned) workOrder.assigned = [];
  if (workOrder._removedSailorIds) {
    workOrder._removedSailorIds.delete(String(sidToStore).trim());
    if (sailor.id !== undefined && sailor.id !== null) workOrder._removedSailorIds.delete(String(sailor.id).trim());
    if (sailor._fbKey) workOrder._removedSailorIds.delete(String(sailor._fbKey).trim());
    if (sailor.official_number) {
      workOrder._removedSailorIds.delete(String(sailor.official_number).trim());
      const d = String(sailor.official_number).replace(/\D/g, "");
      if (d.length >= 3) workOrder._removedSailorIds.delete(d);
    }
  }
  workOrder._userClearedCrew = false;
  workOrder.user_cleared_crew = false;
  if (workOrder.status === "Hold" || workOrder.status === "Cancelled" || workOrder.status === "Completed") {
    workOrder.status = "Active";
  }
  const jc = typeof getJobCardForWorkOrder === "function" ? getJobCardForWorkOrder(workOrder._fbKey || workOrder.id) : null;
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

  const alreadyAssigned = workOrder.assigned.some(id => isSailorMatchingKeys(sailor, [id]));
  if (!alreadyAssigned) {
    workOrder.assigned.push(sidToStore);
    if (!workOrder.last_assigned) workOrder.last_assigned = [];
    if (!workOrder.last_assigned.includes(sidToStore)) workOrder.last_assigned.push(sidToStore);
    sailor.status = "Assigned";
    sailor.evaluated = false;
    workOrder.last_assigned_date = today;
    if (workOrder._fbKey) {
      const node = (store.workOrders || []).some((w) => w._fbKey === workOrder._fbKey) ? "work_orders" : "job_cards";
      opsDB.ref(`${node}/${workOrder._fbKey}`).update({
        status: workOrder.status,
        user_cleared_crew: false,
        _userClearedCrew: false,
        assigned: workOrder.assigned.length > 0 ? workOrder.assigned : null,
        last_assigned: workOrder.last_assigned.length > 0 ? workOrder.last_assigned : null,
        last_assigned_date: today
      });
    }
    
    // Create daily allocation for the newly assigned sailor
    const alloc = {
      id: Date.now(),
      date: today,
      sailor_id: sidToStore,
      official_number: sailor.official_number || sailor.service_no || "",
      work_order_id: workOrder.id || workOrder._fbKey,
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
    if (window.safeFbAssignSailor) {
      safeFbAssignSailor(workOrder._fbKey || workOrder.id, sidToStore, today);
    }
    renderDashboard();
    showToast(
      assignment
        ? `Reassigned ${sailor.name} from ${assignment.zone}! <button onclick="executeGlobalUndo()" class="ml-2 font-bold underline bg-amber-300 text-slate-900 px-2 py-0.5 rounded text-xs hover:bg-amber-400">↩️ Undo</button>`
        : `${sailor.name} assigned to ${workOrder.description.substring(0, 24)}... <button onclick="executeGlobalUndo()" class="ml-2 font-bold underline bg-amber-300 text-slate-900 px-2 py-0.5 rounded text-xs hover:bg-amber-400">↩️ Undo</button>`,
      "success",
      6000
    );
  }
  draggedSailorId = null;
}
function removeSailorFromOrder(sailorId, workOrderId) {
  const sailor = typeof findSailorById === "function" ? findSailorById(sailorId) : (store.sailors || []).find(
    (s) => isSailorMatchingKeys(s, [sailorId])
  );
  let workOrder = (store.workOrders || []).find(
    (wo) =>
      String(wo.id) === String(workOrderId) ||
      String(wo._fbKey) === String(workOrderId),
  );
  let isJc = false;
  if (!workOrder) {
    workOrder = (store.jobCards || []).find(
      (jc) =>
        String(jc.id) === String(workOrderId) ||
        String(jc._fbKey) === String(workOrderId),
    );
    if (workOrder) isJc = true;
  }
  const today = getLocalDateString();
  const activeDate = store.dashboardDate || today;
  const isToday = !store.dashboardDate || store.dashboardDate === today;
  if (!isToday) {
    showToast("Historical data is read-only!", "error");
    return;
  }
  if (workOrder) {
    const idsToRemove = new Set([String(sailorId).trim()]);
    if (!String(sailorId).startsWith('-') && String(sailorId).length < 16) {
      const sDigits = String(sailorId).replace(/\D/g, "");
      if (sDigits.length >= 3) idsToRemove.add(sDigits);
    }

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
      if (!str.startsWith('-') && str.length < 16) {
        const digits = str.replace(/\D/g, "");
        if (digits.length >= 3 && idsToRemove.has(digits)) return true;
      }
      if (sailor && isSailorMatchingKeys(sailor, [str])) return true;
      const foundS = typeof findSailorById === "function" ? findSailorById(str) : null;
      if (foundS && isSailorMatchingKeys(foundS, idsToRemove)) return true;
      return false;
    };

    // Find linked counterpart (Work Order <-> Job Card)
    let linked = null;
    if (!isJc) {
      linked = typeof getJobCardForWorkOrder === "function" ? getJobCardForWorkOrder(workOrder._fbKey || workOrder.id) : null;
    } else {
      linked = (store.workOrders || []).find(
        (w) => String(w.id) === String(workOrder.work_order_id) || String(w._fbKey) === String(workOrder.work_order_id)
      );
    }

    // 1. Initialize assigned from current active crew if it was empty, so removing one sailor preserves the rest
    if (!workOrder.assigned || workOrder.assigned.length === 0) {
      const { sailors: currentCrew } = getWorkOrderAssignedSailors(workOrder, today);
      if (currentCrew && currentCrew.length > 0) {
        workOrder.assigned = currentCrew.map(s => String(s.id !== undefined && s.id !== null ? s.id : s._fbKey));
      } else if (workOrder.last_assigned && workOrder.last_assigned.length > 0) {
        workOrder.assigned = [...workOrder.last_assigned];
      }
    }

    // Clean primary workOrder / jobCard
    workOrder.assigned = (workOrder.assigned || []).filter((id) => !isMatch(id));
    if (workOrder.last_assigned) {
      workOrder.last_assigned = (workOrder.last_assigned || []).filter((id) => !isMatch(id));
    }
    workOrder._removedSailorIds = workOrder._removedSailorIds || new Set();
    idsToRemove.forEach((id) => workOrder._removedSailorIds.add(id));
    if (workOrder.assigned.length === 0) {
      workOrder._userClearedCrew = true;
      workOrder.user_cleared_crew = true;
      workOrder.last_committed_date = null;
    } else {
      workOrder._userClearedCrew = false;
      workOrder.user_cleared_crew = false;
    }

    let leaderChanged = false;
    if (workOrder.supervisor && isMatch(workOrder.supervisor)) {
      workOrder.supervisor = null;
      leaderChanged = true;
    }
    if (workOrder.incharge && isMatch(workOrder.incharge)) {
      workOrder.incharge = null;
      leaderChanged = true;
    }
    if (workOrder.project_artificer && isMatch(workOrder.project_artificer)) {
      workOrder.project_artificer = null;
      leaderChanged = true;
    }
    workOrder.last_assigned_date = today;

    // 2. Clean linked counterpart if exists
    if (linked) {
      if (!linked.assigned || linked.assigned.length === 0) {
        const { sailors: linkedCrew } = getWorkOrderAssignedSailors(linked, today);
        if (linkedCrew && linkedCrew.length > 0) {
          linked.assigned = linkedCrew.map(s => String(s.id !== undefined && s.id !== null ? s.id : s._fbKey));
        } else if (linked.last_assigned && linked.last_assigned.length > 0) {
          linked.assigned = [...linked.last_assigned];
        }
      }
      linked.assigned = (linked.assigned || []).filter((id) => !isMatch(id));
      if (linked.last_assigned) {
        linked.last_assigned = (linked.last_assigned || []).filter((id) => !isMatch(id));
      }
      linked._removedSailorIds = linked._removedSailorIds || new Set();
      idsToRemove.forEach((id) => linked._removedSailorIds.add(id));
      if (linked.assigned.length === 0) {
        linked._userClearedCrew = true;
        linked.user_cleared_crew = true;
        linked.last_committed_date = null;
      } else {
        linked._userClearedCrew = false;
        linked.user_cleared_crew = false;
      }
      if (linked.supervisor && isMatch(linked.supervisor)) linked.supervisor = null;
      if (linked.incharge && isMatch(linked.incharge)) linked.incharge = null;
      if (linked.project_artificer && isMatch(linked.project_artificer)) linked.project_artificer = null;
      linked.last_assigned_date = today;
    }

    // 3. Resolve all Work Order / Job Card identifiers for allocation matching
    const woIdentifiers = new Set();
    if (workOrder.id) woIdentifiers.add(String(workOrder.id).trim());
    if (workOrder._fbKey) woIdentifiers.add(String(workOrder._fbKey).trim());
    if (workOrder.reference_no) woIdentifiers.add(String(workOrder.reference_no).trim().toLowerCase());
    if (workOrder.job_card_no) woIdentifiers.add(String(workOrder.job_card_no).trim().toLowerCase());
    if (workOrder.job_no) woIdentifiers.add(String(workOrder.job_no).trim().toLowerCase());
    if (workOrder.description) woIdentifiers.add(String(workOrder.description).trim().toLowerCase());

    if (linked) {
      if (linked.id) woIdentifiers.add(String(linked.id).trim());
      if (linked._fbKey) woIdentifiers.add(String(linked._fbKey).trim());
      if (linked.reference_no) woIdentifiers.add(String(linked.reference_no).trim().toLowerCase());
      if (linked.job_card_no) woIdentifiers.add(String(linked.job_card_no).trim().toLowerCase());
      if (linked.job_no) woIdentifiers.add(String(linked.job_no).trim().toLowerCase());
      if (linked.description) woIdentifiers.add(String(linked.description).trim().toLowerCase());
    }

    const isWoMatch = (a) => {
      if (!a) return false;
      const aWoId = String(a.work_order_id || a.workOrderId || a.work_order || a.wo_id || "").trim();
      if (aWoId && (woIdentifiers.has(aWoId) || woIdentifiers.has(aWoId.toLowerCase()))) return true;
      const aDesc = String(a.description || a.task_name || a.work_order_name || "").trim().toLowerCase();
      if (aDesc && woIdentifiers.has(aDesc)) return true;
      const aRef = String(a.reference_no || a.job_card_no || "").trim().toLowerCase();
      if (aRef && woIdentifiers.has(aRef)) return true;
      return false;
    };

    // 4. Remove daily allocations in memory & Firebase
    (store.dailyAllocations || []).forEach((a) => {
      if ((a.date === today || a.date === activeDate) && isMatch(a) && isWoMatch(a)) {
        if (a._fbKey) opsDB.ref(`daily_allocations/${a._fbKey}`).remove();
        if (a.date && a.sailor_id) opsDB.ref(`daily_allocations/${a.date}_${sanitizeFbKey(a.sailor_id)}`).remove();
        if (a.date && a.official_number) opsDB.ref(`daily_allocations/${a.date}_${sanitizeFbKey(a.official_number)}`).remove();
      }
    });

    idsToRemove.forEach((id) => {
      const sId = sanitizeFbKey(id);
      opsDB.ref(`daily_allocations/${today}_${sId}`).remove();
      if (activeDate !== today) {
        opsDB.ref(`daily_allocations/${activeDate}_${sId}`).remove();
      }
    });

    store.dailyAllocations = (store.dailyAllocations || []).filter(
      (a) => !((a.date === today || a.date === activeDate) && isMatch(a) && isWoMatch(a))
    );

    if (store.dailyAllocationsMap) {
      idsToRemove.forEach((id) => {
        const sId = sanitizeFbKey(id);
        delete store.dailyAllocationsMap[`${today}_${sId}`];
        delete store.dailyAllocationsMap[`${activeDate}_${sId}`];
      });
    }

    // 5. Update Firebase for workOrder and linked
    if (workOrder._fbKey) {
      const node = isJc ? "job_cards" : "work_orders";
      const updatePayload = {
        assigned: workOrder.assigned.length > 0 ? workOrder.assigned : null,
        last_assigned: workOrder.last_assigned && workOrder.last_assigned.length > 0 ? workOrder.last_assigned : null,
        last_assigned_date: today,
        last_committed_date: workOrder.assigned.length === 0 ? null : (workOrder.last_committed_date || null),
        user_cleared_crew: workOrder.assigned.length === 0 ? true : null,
      };
      if (leaderChanged) {
        updatePayload.supervisor = workOrder.supervisor || null;
        updatePayload.incharge = workOrder.incharge || null;
        updatePayload.project_artificer = workOrder.project_artificer || null;
      }
      opsDB.ref(`${node}/${workOrder._fbKey}`).update(updatePayload);
    }

    if (linked && linked._fbKey) {
      const linkedNode = isJc ? "work_orders" : "job_cards";
      opsDB.ref(`${linkedNode}/${linked._fbKey}`).update({
        assigned: linked.assigned.length > 0 ? linked.assigned : null,
        last_assigned: linked.last_assigned && linked.last_assigned.length > 0 ? linked.last_assigned : null,
        last_assigned_date: today,
        last_committed_date: linked.assigned.length === 0 ? null : (linked.last_committed_date || null),
        user_cleared_crew: linked.assigned.length === 0 ? true : null,
      });
    }

    if (window.safeFbRemoveSailor) {
      safeFbRemoveSailor(workOrder._fbKey || workOrder.id, sailorId, today);
    }

    // 6. Invalidate caches and refresh
    if (typeof invalidateSailorLastAssignmentCache === "function") {
      invalidateSailorLastAssignmentCache();
    }
    if (typeof refreshDailyCommitmentCache === "function") {
      refreshDailyCommitmentCache(today);
      if (activeDate !== today) refreshDailyCommitmentCache(activeDate);
    }

    // 7. Update sailor status
    if (sailor) {
      const currAssignment = typeof getSailorCurrentAssignment === "function" ? getSailorCurrentAssignment(sailor._fbKey || sailor.id) : null;
      if (!currAssignment || !currAssignment.ref) {
        sailor.status = "Available";
      }
    }

    // 8. Refresh views immediately
    if (typeof updateCounters === "function") updateCounters();
    if (typeof renderDashboard === "function") renderDashboard();
    if (typeof renderZoneSelectors === "function") renderZoneSelectors();
    if (typeof renderAvailableSailors === "function") renderAvailableSailors();

    const modalEl = document.getElementById("workOrderDetailModal");
    if (modalEl && !modalEl.classList.contains("hidden")) {
      openWorkOrderDetail(workOrder._fbKey || workOrder.id);
    }

    showToast(
      `${sailor ? sailor.name : "Sailor"} removed from assignment`,
      "info",
    );
  }
} // =============================================
// FILTERS
// =============================================
function filterSailors(filter) {
  store.currentFilter = filter || "available";
  store.availableSailorsLimit = 40;

  const btnAvail = document.getElementById("btnFilterAvailable");
  const btnAll = document.getElementById("btnFilterAll");
  const btnZone = document.getElementById("btnFilterZoneTeam");
  const btnCont = document.getElementById("btnFilterContinue");

  [btnAvail, btnAll, btnZone, btnCont].forEach((btn) => {
    if (btn) {
      btn.classList.remove("active", "font-bold", "bg-[#0a1628]", "text-[#5eead4]", "bg-slate-700", "text-white");
      btn.classList.add("bg-slate-200", "text-slate-600", "font-medium");
    }
  });

  const activeBtn = filter === "all" ? btnAll : filter === "zone-team" ? btnZone : filter === "continuation" ? btnCont : btnAvail;
  if (activeBtn) {
    activeBtn.classList.remove("bg-slate-200", "text-slate-600", "font-medium");
    activeBtn.classList.add("active", "font-bold", "bg-[#0a1628]", "text-[#5eead4]");
  }

  renderAvailableSailors();
}
function filterTrade(trade) {
  store.currentTrade = trade || "ALL";
  store.availableSailorsLimit = 40;
  renderAvailableSailors();
}
function searchSailors() {
  renderAvailableSailors();
}

window._lastContinuedUndoData = null;

function continueYesterdayJobs() {
  if (!store.dailyAllocations || store.dailyAllocations.length === 0) {
      alert("Please wait a few seconds for the previous data to load from the server, and try again.");
      return;
  }

  computeYesterdayJobs();

  const continuations = store.sailors.filter(
    (s) => s.yesterdayJob !== null && s.status === "Available"
  );
  
  if (continuations.length === 0) {
      alert(`No Available sailors found who worked in this zone's Work Orders on the previous matching day.\nIf you are sure they worked, they might be marked as 'Assigned', 'NA', or 'Leave' today.`);
      return;
  }

  const today = getLocalDateString();
  
  let undoData = {
      date: today,
      allocations: []
  };

  continuations.forEach((sailor) => {
    let wo = store.workOrders.find((w) => String(w.id) === String(sailor.yesterdayJob) || String(w._fbKey) === String(sailor.yesterdayJob));
    let jc = store.jobCards.find((j) => String(j.id) === String(sailor.yesterdayJob) || String(j._fbKey) === String(sailor.yesterdayJob));
    
    const targetObj = wo || jc;
    
    if (targetObj) {
      if (!targetObj.assigned) targetObj.assigned = [];
      const alreadyAssigned = targetObj.assigned.some(id => String(id) === String(sailor.id));
      if (!alreadyAssigned) {
        targetObj.assigned.push(sailor.id);
        sailor.status = "Assigned";
        sailor.evaluated = false;
        targetObj.last_assigned_date = today;
        
        // Create daily allocation
        const allocId = Date.now() + Math.random();
        const alloc = {
          id: allocId,
          date: today,
          sailor_id: sailor.id,
          work_order_id: targetObj.id || targetObj._fbKey,
          role_today: "Worker",
          assigned_by: store.currentUser && store.currentUser.name ? store.currentUser.name : "Officer",
          status: "Active"
        };
        if (!store.dailyAllocations) store.dailyAllocations = [];
        store.dailyAllocations.push(alloc);
        opsDB.ref(`daily_allocations/${today}_${sanitizeFbKey(sailor.id)}`).set(alloc);
        
        if (wo && window.safeFbAssignSailor) safeFbAssignSailor(wo._fbKey || wo.id, sailor.id, today);
        if (jc && window.fbSaveJobCard) fbSaveJobCard(jc);
        
        undoData.allocations.push({
          allocId: allocId,
          sailorId: sailor.id,
          workOrderId: targetObj.id || targetObj._fbKey,
          targetType: wo ? 'wo' : 'jc'
        });
      }
    }
  });
  
  if (undoData.allocations.length > 0) {
      _lastContinuedUndoData = undoData;
      const undoBtn = document.getElementById("btnUndoContinue");
      if (undoBtn) undoBtn.classList.remove("hidden");
  }

  renderDashboard();
  showToast(`${continuations.length} sailors continued from previous jobs`);
}

function undoContinueYesterdayJobs() {
  if (!_lastContinuedUndoData) return;
  
  const { date, allocations } = _lastContinuedUndoData;
  let count = 0;
  
  allocations.forEach(action => {
      // 1. Remove from daily_allocations in FB
      opsDB.ref(`daily_allocations/${date}_${sanitizeFbKey(action.sailorId)}`).remove();
      
      // 2. Remove from store.dailyAllocations
      if (store.dailyAllocations) {
        store.dailyAllocations = store.dailyAllocations.filter(a => a.id !== action.allocId);
      }
      
      // 3. Revert sailor status in memory
      const sailor = store.sailors.find(s => String(s.id) === String(action.sailorId));
      if (sailor) sailor.status = "Available";
      
      // 4. Remove from WO/JC assigned array and save
      let targetObj = action.targetType === 'wo' 
          ? store.workOrders.find(w => String(w.id) === String(action.workOrderId) || String(w._fbKey) === String(action.workOrderId))
          : store.jobCards.find(j => String(j.id) === String(action.workOrderId) || String(j._fbKey) === String(action.workOrderId));
          
      if (targetObj && targetObj.assigned) {
          if (action.targetType === 'wo' && window.safeFbRemoveSailor) {
              safeFbRemoveSailor(targetObj._fbKey || targetObj.id, action.sailorId, date);
          } else if (action.targetType === 'jc') {
              targetObj.assigned = targetObj.assigned.filter(id => String(id) !== String(action.sailorId));
              if (window.fbSaveJobCard) fbSaveJobCard(targetObj);
          }
      }
      count++;
  });
  
  _lastContinuedUndoData = null;
  const undoBtn = document.getElementById("btnUndoContinue");
  if (undoBtn) undoBtn.classList.add("hidden");
  
  renderDashboard();
  showToast(`Undo successful. Reversed ${count} assignments.`);
} // =============================================


// ============================================================================
// Global Window Bindings for Dashboard Module
// ============================================================================
window.renderDashboard = renderDashboard;
window.updateSbsBookModeBanner = updateSbsBookModeBanner;
window.openSbsBookView = openSbsBookView;
window.closeSbsBookMode = closeSbsBookMode;
window.updateHistoricalModeBanner = updateHistoricalModeBanner;
window.updateDashboardButtons = updateDashboardButtons;
window.navigateSummaryDate = navigateSummaryDate;
window.changeDashboardDate = changeDashboardDate;
window.isWorkOrderActiveOnDate = isWorkOrderActiveOnDate;
window.getDailyAllocationsForDate = getDailyAllocationsForDate;
window.invalidateDailyCommitmentCache = invalidateDailyCommitmentCache;
window.refreshDailyCommitmentCache = refreshDailyCommitmentCache;
window.getSailorAssignmentOnDate = getSailorAssignmentOnDate;
window.getSailorCurrentAssignment = getSailorCurrentAssignment;
window.getSailorDailyAssignment = getSailorDailyAssignment;
window.invalidateSailorLastAssignmentCache = invalidateSailorLastAssignmentCache;
window.getSailorLastAssignmentIndex = getSailorLastAssignmentIndex;
window.getSailorLastAssignedTask = getSailorLastAssignedTask;
window.isSailorAvailableForWork = isSailorAvailableForWork;
window.renderAvailableSailors = renderAvailableSailors;
window.loadMoreAvailableSailors = loadMoreAvailableSailors;
window.renderWorkOrders = renderWorkOrders;
window.renderQuickAssignments = renderQuickAssignments;
window.updateBoardEmptyState = updateBoardEmptyState;
window.handleCardClick = handleCardClick;
window.isWorkOrderCommittedToday = isWorkOrderCommittedToday;
window.getWorkOrderAssignedSailors = getWorkOrderAssignedSailors;
window.commitDailyLabourForWorkOrder = commitDailyLabourForWorkOrder;
window.commitAllZoneWorkOrders = commitAllZoneWorkOrders;
window.renderWorkOrderCard = renderWorkOrderCard;
window.renderZoneTeam = renderZoneTeam;
window.removeFromZoneTeam = removeFromZoneTeam;
window.openZoneTeamManager = openZoneTeamManager;
window.filterZtmAvailableList = filterZtmAvailableList;
window.renderZtmLists = renderZtmLists;
window.toggleZoneTeam = toggleZoneTeam;
window.isSailorMatch = isSailorMatch;
window.markSailorInSet = markSailorInSet;
window.isSailorInSet = isSailorInSet;
window.isTaskDescriptionNA = isTaskDescriptionNA;
window.isProjectActiveOnDate = isProjectActiveOnDate;
window.invalidateLongTermAllocationsCache = invalidateLongTermAllocationsCache;
window.getLongTermAllocations = getLongTermAllocations;
window.updateCounters = updateCounters;
window.updatePendingEvals = updatePendingEvals;
window.handleDragStart = handleDragStart;
window.handleDragEnd = handleDragEnd;
window.handleDragOver = handleDragOver;
window.handleDrop = handleDrop;
window.handleDropOnCard = handleDropOnCard;
window.removeSailorFromOrder = removeSailorFromOrder;
window.filterSailors = filterSailors;
window.filterTrade = filterTrade;
window.searchSailors = searchSailors;
window.continueYesterdayJobs = continueYesterdayJobs;
window.undoContinueYesterdayJobs = undoContinueYesterdayJobs;

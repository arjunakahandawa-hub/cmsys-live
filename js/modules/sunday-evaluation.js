// ============================================================================
// CMSys Module: Sunday Weekly Evaluation System
// File: js/modules/sunday-evaluation.js
// ============================================================================

window._currentSundaySummary = (typeof window._currentSundaySummary !== "undefined") ? window._currentSundaySummary : null;

function getWeeklySailorSupervisionSummary(referenceDateStr) {
  const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();
  const dayOfWeek = refDate.getDay(); // 0 is Sunday, 1 is Monday, ...
  
  // Calculate distance back to Monday of this week
  const distanceToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
  const monday = new Date(refDate);
  monday.setDate(refDate.getDate() + distanceToMonday);
  
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDates.push(d.toISOString().slice(0, 10));
  }
  const sunday = weekDates[6]; // Sunday date (YYYY-MM-DD)
  const weekRangeLabel = `${weekDates[0]} (Mon) – ${sunday} (Sun)`;

  // Priority ranking weights
  const priorityWeights = {
    "critical": 100,
    "emergency": 90,
    "urgent": 80,
    "high": 60,
    "project": 50,
    "medium": 40,
    "normal": 30,
    "routine": 20,
    "low": 10
  };

  // 1. Gather all allocations across this 7-day week
  const allAllocations = (typeof store !== "undefined" && store.dailyAllocations) ? store.dailyAllocations : [];
  const weekAllocations = allAllocations.filter(a => weekDates.includes(a.date));

  // 2. Map supervision for each sailor in the active force
  const sailorSupervisionMap = [];

  const targetSailors = ((typeof store !== "undefined" && store.sailors) ? store.sailors : []).filter(s => {
    if (store.currentZone && s.zone && s.zone !== store.currentZone && s.zone !== "ALL") {
      return false;
    }
    return true;
  });

  targetSailors.forEach(sailor => {
    const sId = String(sailor.id || sailor._fbKey);
    const sFb = String(sailor._fbKey || "");
    const sOff = String(sailor.official_number || "");

    // Find allocations for this sailor in this 7-day week
    const sailorWeekAllocs = weekAllocations.filter(a => {
      const aId = String(a.sailor_id || "");
      return aId === sId || (sFb && aId === sFb) || (sOff && aId === sOff);
    });

    // Count attendance and track work orders
    const woStats = {};
    sailorWeekAllocs.forEach(a => {
      const woId = a.work_order_id;
      if (!woId) return;
      if (!woStats[woId]) {
        const wo = (store.workOrders || []).find(w => String(w.id) === String(woId) || String(w._fbKey) === String(woId));
        const pStr = (wo?.priority || "medium").toLowerCase();
        const pWeight = priorityWeights[pStr] || 30;
        woStats[woId] = {
          work_order_id: woId,
          work_order: wo,
          days_attended: 0,
          priority_weight: pWeight,
          dates_attended: []
        };
      }
      woStats[woId].days_attended += 1;
      woStats[woId].dates_attended.push(a.date);
    });

    const woList = Object.values(woStats);
    let primaryWoStats = null;

    if (woList.length > 0) {
      // Sort by: (days_attended * 1000 + priority_weight) descending
      woList.sort((a, b) => {
        const scoreA = (a.days_attended * 1000) + a.priority_weight;
        const scoreB = (b.days_attended * 1000) + b.priority_weight;
        return scoreB - scoreA;
      });
      primaryWoStats = woList[0];
    } else {
      // Fallback: Currently assigned work order
      const currentWo = (store.workOrders || []).find(w => w.assigned && (w.assigned.includes(sId) || w.assigned.includes(sFb) || w.assigned.includes(sOff)));
      if (currentWo) {
        primaryWoStats = {
          work_order_id: currentWo.id || currentWo._fbKey,
          work_order: currentWo,
          days_attended: 1,
          priority_weight: priorityWeights[(currentWo.priority || "medium").toLowerCase()] || 30,
          dates_attended: [refDate.toISOString().slice(0, 10)]
        };
      }
    }

    if (primaryWoStats && primaryWoStats.work_order) {
      const wo = primaryWoStats.work_order;
      const supervisorName = wo.supervisor || wo.artificer || wo.in_charge || "Duty Supervisor";

      // Check if already evaluated for this Sunday
      const sanitizeFn = typeof sanitizeFbKey === "function" ? sanitizeFbKey : (k => String(k).replace(/[.#$[\]/]/g, "_"));
      const sundayAllocKey = `${sunday}_${sanitizeFn(sailor.id)}`;
      const sundayAllocKeyFb = `${sunday}_${sanitizeFn(sailor._fbKey)}`;
      const isEvaluated = Boolean(
        sailor.evaluated || 
        (store.dailyAllocationsMap && (store.dailyAllocationsMap[sundayAllocKey]?.evaluated || store.dailyAllocationsMap[sundayAllocKeyFb]?.evaluated))
      );

      sailorSupervisionMap.push({
        sailor: sailor,
        primary_work_order: wo,
        days_attended: primaryWoStats.days_attended,
        priority: wo.priority || "Normal",
        supervisor: supervisorName,
        week_dates: weekDates,
        sunday_date: sunday,
        is_evaluated: isEvaluated,
        latest_score: sailor.yesterdayScore || sailor.avgScore || 0,
        all_wo_stats: woList
      });
    }
  });

  return {
    week_dates: weekDates,
    sunday_date: sunday,
    week_range_label: weekRangeLabel,
    sailors: sailorSupervisionMap
  };
}

function openSundayEvaluationModal(referenceDateStr) {
  _currentSundaySummary = getWeeklySailorSupervisionSummary(referenceDateStr);
  
  const weekLabelEl = document.getElementById("sundayEvalWeekRangeText");
  if (weekLabelEl) {
    weekLabelEl.textContent = `📅 Active Week: ${_currentSundaySummary.week_range_label}`;
  }

  // Populate Supervisor Filter Dropdown
  const supFilter = document.getElementById("sundaySupervisorFilter");
  if (supFilter) {
    const distinctSupervisors = Array.from(new Set(_currentSundaySummary.sailors.map(s => s.supervisor))).filter(Boolean);
    let optionsHtml = `<option value="ALL">👥 All Supervisors (${distinctSupervisors.length})</option>`;
    if (typeof store !== "undefined" && store.currentUser?.name) {
      optionsHtml += `<option value="${store.currentUser.name}">⭐ My Assigned Sailors</option>`;
    }
    distinctSupervisors.forEach(sup => {
      optionsHtml += `<option value="${sup}">⚓ ${sup}</option>`;
    });
    supFilter.innerHTML = optionsHtml;
  }

  renderSundayEvaluationList();
  document.getElementById("sundayEvaluationModal")?.classList.remove("hidden");
}

function renderSundayEvaluationList() {
  if (!_currentSundaySummary) {
    _currentSundaySummary = getWeeklySailorSupervisionSummary();
  }

  const tbody = document.getElementById("sundayEvalTableBody");
  if (!tbody) return;

  const searchVal = (document.getElementById("sundayEvalSearch")?.value || "").toLowerCase().trim();
  const supervisorFilter = document.getElementById("sundaySupervisorFilter")?.value || "ALL";
  const statusFilter = document.getElementById("sundayStatusFilter")?.value || "ALL";

  let list = _currentSundaySummary.sailors || [];

  // Update KPI counters
  const totalCount = list.length;
  const doneCount = list.filter(s => s.is_evaluated).length;
  const pendingCount = totalCount - doneCount;

  if (document.getElementById("sundayEvalTotalCount")) document.getElementById("sundayEvalTotalCount").textContent = totalCount;
  if (document.getElementById("sundayEvalDoneCount")) document.getElementById("sundayEvalDoneCount").textContent = doneCount;
  if (document.getElementById("sundayEvalPendingCount")) document.getElementById("sundayEvalPendingCount").textContent = pendingCount;

  // Filter list
  list = list.filter(item => {
    if (supervisorFilter !== "ALL") {
      if (item.supervisor !== supervisorFilter && !item.supervisor.toLowerCase().includes(supervisorFilter.toLowerCase())) {
        return false;
      }
    }
    if (statusFilter === "PENDING" && item.is_evaluated) return false;
    if (statusFilter === "DONE" && !item.is_evaluated) return false;

    if (searchVal) {
      const s = item.sailor;
      const wo = item.primary_work_order;
      const sName = (s.name || "").toLowerCase();
      const sOff = (s.official_number || "").toLowerCase();
      const sTrade = (s.trade || "").toLowerCase();
      const woTitle = (wo.description || wo.title || "").toLowerCase();
      const sup = (item.supervisor || "").toLowerCase();
      if (!sName.includes(searchVal) && !sOff.includes(searchVal) && !sTrade.includes(searchVal) && !woTitle.includes(searchVal) && !sup.includes(searchVal)) {
        return false;
      }
    }
    return true;
  });

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-400 font-medium italic">No sailors match the selected supervisor or filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(item => {
    const s = item.sailor;
    const wo = item.primary_work_order;
    const sId = s.id || s._fbKey;
    const woId = wo.id || wo._fbKey;
    const cleanNo = (s.official_number || "").replace(/[^a-zA-Z0-9]/g, "");

    const priorityColors = {
      "Critical": "bg-red-100 text-red-800 border-red-300",
      "High": "bg-amber-100 text-amber-800 border-amber-300",
      "Project": "bg-indigo-100 text-indigo-800 border-indigo-300",
      "Medium": "bg-blue-100 text-blue-800 border-blue-300",
      "Routine": "bg-slate-100 text-slate-700 border-slate-300",
      "Low": "bg-slate-100 text-slate-700 border-slate-300"
    };
    const pBadgeClass = priorityColors[item.priority] || "bg-slate-100 text-slate-700 border-slate-300";

    const picErrorHandler = typeof handleProfilePicError === "function" ? `handleProfilePicError(this, '${s.name.replace(/'/g, "")}')` : "";

    return `
      <tr class="hover:bg-slate-50/80 transition-colors">
        <td class="px-3.5 py-3 align-middle">
          <div class="flex items-center gap-3">
            <img src="images/${cleanNo}.JPG" loading="lazy" decoding="async" onerror="${picErrorHandler}" 
                 class="w-9 h-9 rounded-full object-cover border border-slate-300 shadow-2xs">
            <div>
              <div class="font-bold text-slate-900 cursor-pointer hover:text-teal-600" onclick="openSailorProfile('${sId}')">
                ${s.name}
              </div>
              <div class="text-[10px] text-slate-500 font-mono">
                ${s.official_number || ""} • ${s.rank || ""} • <span class="font-bold text-indigo-700">${s.trade || ""}</span>
              </div>
            </div>
          </div>
        </td>
        <td class="px-3.5 py-3 align-middle">
          <div class="font-semibold text-slate-800 max-w-xs truncate" title="${wo.description || ""}">
            ${wo.description || wo.title || "Assigned Work Order"}
          </div>
          <div class="mt-1 flex items-center gap-1.5">
            <span class="px-2 py-0.5 rounded-full text-[9px] font-bold border ${pBadgeClass}">
              ⚡ Priority: ${item.priority}
            </span>
          </div>
        </td>
        <td class="px-3.5 py-3 align-middle text-center font-mono">
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-teal-50 text-teal-800 border border-teal-200">
            <span>📅</span> ${item.days_attended} / 7 Days
          </span>
        </td>
        <td class="px-3.5 py-3 align-middle">
          <div class="font-bold text-slate-800 text-xs flex items-center gap-1">
            <span>⚓</span> ${item.supervisor}
          </div>
          <div class="text-[10px] text-slate-400">Responsible Evaluator</div>
        </td>
        <td class="px-3.5 py-3 align-middle text-center whitespace-nowrap">
          ${item.is_evaluated ? `
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
              <span>⭐</span> ${item.latest_score ? item.latest_score.toFixed(1) : '7.5'}/10 (Done)
            </span>
          ` : `
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
              <span>⏳</span> Pending
            </span>
          `}
        </td>
        <td class="px-3.5 py-3 align-middle text-center whitespace-nowrap">
          <button onclick="openEvaluationModal('${sId}', '${woId}')" class="px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-2xs transition-all flex items-center gap-1 mx-auto cursor-pointer ${item.is_evaluated ? 'bg-slate-600 hover:bg-slate-700' : 'bg-emerald-600 hover:bg-emerald-700'}" title="Evaluate Sailor Performance">
            <span>📝</span> ${item.is_evaluated ? 'Re-evaluate' : 'Evaluate'}
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function updateSundayEvaluationBadge() {
  const summary = getWeeklySailorSupervisionSummary();
  const pendingCount = (summary.sailors || []).filter(s => !s.is_evaluated).length;
  
  const topBadge = document.getElementById("sundayEvalTopBadge");
  if (topBadge) {
    if (pendingCount > 0) {
      topBadge.textContent = pendingCount;
      topBadge.classList.remove("hidden");
    } else {
      topBadge.classList.add("hidden");
    }
  }
}

// ============================================================================
// CMSys Module: Temporary Issues (TIB) Register, Inward Confirmations & NAV 254 Slips
// File: js/modules/temp-issues.js
// ============================================================================

// Inward Pending Receipt Badge and Notification Alert updater
function updateTibPendingBadge() {
  const allIssues = store.tempIssues || [];
  const curZone = store.currentZone;
  
  // Pending receipt items for this zone or workshop or project
  const pendingForZone = allIssues.filter((i) => {
    const isPending = i.status === "pending_receipt" || (!i.received_date && !i.actual_return_date && i.status !== "returned" && i.status !== "active");
    if (!isPending) return false;
    if (!curZone) return true;
    return i.zone_id === curZone || i.target_destination === curZone;
  });

  const badgeEl = document.getElementById("tibPendingReceiptBadge");
  if (badgeEl) {
    if (pendingForZone.length > 0) {
      badgeEl.textContent = `${pendingForZone.length} Pending`;
      badgeEl.classList.remove("hidden");
    } else {
      badgeEl.classList.add("hidden");
    }
  }

  const alertBanner = document.getElementById("tibInwardAlertBanner");
  const alertCountEl = document.getElementById("tibInwardAlertCount");
  if (alertBanner && alertCountEl) {
    if (pendingForZone.length > 0) {
      alertCountEl.textContent = `${pendingForZone.length} Pending Receipt`;
      alertBanner.classList.remove("hidden");
    } else {
      alertBanner.classList.add("hidden");
    }
  }
}

function filterToPendingIssues() {
  const catFilter = document.getElementById("tibCategoryFilter");
  const statusFilter = document.getElementById("tibStatusFilter");
  const searchInput = document.getElementById("tibSearchInput");

  if (catFilter) catFilter.value = "all";
  if (statusFilter) statusFilter.value = "pending_receipt";
  if (searchInput) searchInput.value = "";

  setTempIssuePeriod("all");
  renderTempIssuesTable();

  const tbl = document.getElementById("tempIssuesTableBody");
  if (tbl) {
    tbl.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

window.DEFAULT_TEMP_ISSUES_DATA = (typeof window.DEFAULT_TEMP_ISSUES_DATA !== "undefined") ? window.DEFAULT_TEMP_ISSUES_DATA : [
  {
    id: "tib_001",
    ref_no: "TIB/2026/08/001",
    date: "2026-08-15",
    zone_id: "A-Zone",
    origin_zone: "Main Store",
    target_destination: "A-Zone",
    item_name: "Bosch Rotary Hammer Drill 800W",
    category: "Tools & Machinery",
    qty: 2,
    deno: "Nos",
    unit_cost: 38500,
    total_value: 77000,
    issued_to: "74738 W Gnanathilake VAS",
    trade: "Carpentry",
    purpose: "WO-2026-089 / Wardroom ceiling repair",
    issued_by: "Storekeeper (Civil)",
    expected_return_date: "2026-08-22",
    actual_return_date: "2026-08-22",
    qty_returned: 2,
    condition_on_return: "Good Condition",
    status: "returned",
    remarks: "Serial #DRL-9982 • Returned clean in case"
  },
  {
    id: "tib_002",
    ref_no: "TIB/2026/08/002",
    date: "2026-08-20",
    zone_id: "A-Zone",
    origin_zone: "Main Store",
    target_destination: "A-Zone",
    item_name: "Full Body Safety Harness & Lanyard Set",
    category: "Safety Gear",
    qty: 4,
    deno: "Sets",
    unit_cost: 14500,
    total_value: 58000,
    issued_to: "118453 Silva KHM (Masonry Team)",
    trade: "Masonry",
    purpose: "External plastering at SLNS Tissa HQ",
    issued_by: "Safety Supervisor",
    expected_return_date: "2026-08-28",
    received_date: "2026-08-20",
    received_by: "Silva KHM",
    receipt_condition: "Good Working Condition",
    status: "active",
    remarks: "High-altitude safety clearance granted"
  },
  {
    id: "tib_003",
    ref_no: "TIB/2026/08/003",
    date: "2026-08-23",
    zone_id: "Carpentry WS",
    origin_zone: "Main Store",
    target_destination: "Carpentry WS",
    item_name: "Makita Heavy Duty Circular Saw 185mm",
    category: "Tools & Machinery",
    qty: 1,
    deno: "Nos",
    unit_cost: 46000,
    total_value: 46000,
    issued_to: "98234 Perera TK (Carpentry Section)",
    trade: "Carpentry",
    purpose: "Timber frame fabrication for Officers Mess",
    issued_by: "Main Storekeeper",
    expected_return_date: "2026-08-30",
    status: "pending_receipt",
    remarks: "Dispatched to Carpentry WS • Pending recipient acknowledgment"
  },
  {
    id: "tib_004",
    ref_no: "TIB/2026/08/004",
    date: "2026-08-22",
    zone_id: "B-Zone",
    origin_zone: "Main Store",
    target_destination: "B-Zone",
    item_name: "Heavy Duty Scaffolding Pipe & Coupler Set (20ft)",
    category: "Scaffolding & Props",
    qty: 12,
    deno: "Sets",
    unit_cost: 8500,
    total_value: 102000,
    issued_to: "Civil Maintenance Team - B Zone",
    trade: "Building Maintenance",
    purpose: "Quarterdeck facade painting and gutter replacement",
    issued_by: "Storekeeper (Civil)",
    expected_return_date: "2026-08-29",
    received_date: "2026-08-22",
    received_by: "OIC (B-Zone)",
    receipt_condition: "Good Working Condition",
    status: "active",
    remarks: "Gate pass issued • Inspected on site"
  }
];

function initTempIssuesData() {
  const cached = localStorage.getItem("ncw_temp_issues_v1");
  if (cached) {
    try {
      store.tempIssues = JSON.parse(cached);
    } catch (e) {
      console.warn("Failed to parse cached temp issues:", e);
      store.tempIssues = [...DEFAULT_TEMP_ISSUES_DATA];
    }
  } else {
    store.tempIssues = [...DEFAULT_TEMP_ISSUES_DATA];
    saveTempIssuesToStorage();
  }
  updateTibPendingBadge();
}

function saveTempIssuesToStorage() {
  try {
    localStorage.setItem("ncw_temp_issues_v1", JSON.stringify(store.tempIssues || []));
  } catch (e) {
    console.warn("Failed to save temp issues to localStorage:", e);
  }
  updateTibPendingBadge();
}

// ── Period Switcher Logic ──
function setTempIssuePeriod(period) {
  store.tibPeriod = period;

  const buttons = document.querySelectorAll(".tib-period-btn");
  buttons.forEach((btn) => {
    btn.className = "tib-period-btn px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 transition-all cursor-pointer";
  });

  const activeBtn = document.getElementById(`tibBtnPeriod-${period}`);
  if (activeBtn) {
    activeBtn.className = "tib-period-btn px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-600 text-white shadow-xs transition-all cursor-pointer";
  }

  if (period !== "custom") {
    const fromInp = document.getElementById("tibFilterFromDate");
    const toInp = document.getElementById("tibFilterToDate");
    if (fromInp) fromInp.value = "";
    if (toInp) toInp.value = "";
  }

  renderTempIssuesDashboard();
  renderTempIssuesTable();
}

function applyCustomTempIssueDateRange() {
  const fromVal = document.getElementById("tibFilterFromDate")?.value;
  const toVal = document.getElementById("tibFilterToDate")?.value;

  if (fromVal || toVal) {
    store.tibPeriod = "custom";
    store.tibCustomFromDate = fromVal;
    store.tibCustomToDate = toVal;

    const buttons = document.querySelectorAll(".tib-period-btn");
    buttons.forEach((btn) => {
      btn.className = "tib-period-btn px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 transition-all cursor-pointer";
    });

    renderTempIssuesDashboard();
    renderTempIssuesTable();
  }
}

// Helper: Check if two zone strings match (case-insensitive, ignoring hyphens/spaces e.g. "G-Zone" === "G Zone")
function isSameZone(z1, z2) {
  if (!z1 || !z2) return false;
  const s1 = String(z1).toLowerCase().replace(/[^a-z0-9]/g, "");
  const s2 = String(z2).toLowerCase().replace(/[^a-z0-9]/g, "");
  if (s1 === s2) return true;
  return s1.replace(/zone|shop/g, "") === s2.replace(/zone|shop/g, "");
}

// Helper: Check if date falls in active period
function isDateInSelectedPeriod(dateStr, period) {
  if (!dateStr) return true;
  if (period === "all") return true;

  let itemDate = null;
  if (typeof dateStr === "string") {
    const clean = dateStr.trim();
    if (/^\d{4}-\d{1,2}-\d{1,2}/.test(clean)) {
      const parts = clean.split("-");
      itemDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(clean)) {
      const parts = clean.split("/");
      itemDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    } else {
      itemDate = new Date(clean);
    }
  } else if (dateStr instanceof Date) {
    itemDate = dateStr;
  }

  if (!itemDate || isNaN(itemDate.getTime())) return true;

  const now = new Date();
  const todayStr = getLocalDateString();

  if (period === "today") {
    return dateStr.startsWith(todayStr) || (itemDate.getFullYear() === now.getFullYear() && itemDate.getMonth() === now.getMonth() && itemDate.getDate() === now.getDate());
  }

  if (period === "week") {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);
    return itemDate >= oneWeekAgo && itemDate <= now;
  }

  if (period === "month") {
    return itemDate.getFullYear() === now.getFullYear() && itemDate.getMonth() === now.getMonth();
  }

  if (period === "last30") {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    return itemDate >= thirtyDaysAgo;
  }

  if (period === "year") {
    return itemDate.getFullYear() === now.getFullYear();
  }

  if (period === "custom") {
    const from = store.tibCustomFromDate ? new Date(store.tibCustomFromDate) : null;
    const to = store.tibCustomToDate ? new Date(store.tibCustomToDate + "T23:59:59") : null;
    if (from && itemDate < from) return false;
    if (to && itemDate > to) return false;
    return true;
  }

  return true;
}

// ── Render Period Analytics Dashboard ──
function renderTempIssuesDashboard() {
  const allIssues = store.tempIssues || [];
  const scopeFilter = document.getElementById("tibScopeZoneFilter")?.value || "CURRENT_ZONE";
  const period = store.tibPeriod || "month";
  const todayStr = getLocalDateString();

  // 1. Filter by Scope
  const scopedIssues = allIssues.filter((item) => {
    if (scopeFilter === "ALL_ZONES") return true;
    if (scopeFilter === "CURRENT_ZONE") {
      return !store.currentZone || isSameZone(item.zone_id, store.currentZone) || isSameZone(item.target_destination, store.currentZone) || isSameZone(item.origin_zone, store.currentZone);
    }
    return isSameZone(item.zone_id, scopeFilter) || isSameZone(item.target_destination, scopeFilter) || isSameZone(item.origin_zone, scopeFilter);
  });

  // 2. Filter by Period for metrics
  const periodIssues = scopedIssues.filter((item) => isDateInSelectedPeriod(item.date, period));

  // Compute Metrics
  let totalValueIssued = 0;
  let totalItemsQty = 0;
  let activeCount = 0;
  let activeValue = 0;
  let pendingCount = 0;
  let pendingValue = 0;
  let overdueCount = 0;
  let overdueValue = 0;
  let returnedCount = 0;
  let returnedValue = 0;

  const categoryValueMap = {};
  const recipientValueMap = {};

  periodIssues.forEach((item) => {
    const val = parseFloat(item.total_value) || (parseFloat(item.unit_cost) * parseFloat(item.qty)) || 0;
    const qty = parseFloat(item.qty) || 1;
    totalValueIssued += val;
    totalItemsQty += qty;

    const isReturned = item.status === "returned" || !!item.actual_return_date;
    const isPending = item.status === "pending_receipt";
    const isReturnable = item.is_returnable !== false;
    const isOverdue = isReturnable && !isReturned && item.expected_return_date && item.expected_return_date < todayStr;

    if (isReturned) {
      returnedCount++;
      returnedValue += val;
    } else if (isPending) {
      pendingCount++;
      pendingValue += val;
      activeCount++;
      activeValue += val;
    } else if (item.status !== "non_returnable") {
      activeCount++;
      activeValue += val;
      if (isOverdue) {
        overdueCount++;
        overdueValue += val;
      }
    }

    // Category breakdown
    const cat = item.category || "General Materials";
    categoryValueMap[cat] = (categoryValueMap[cat] || 0) + val;

    // Recipient / Trade breakdown
    const rec = item.trade || item.issued_to?.split(" ")[0] || "General";
    recipientValueMap[rec] = (recipientValueMap[rec] || 0) + val;
  });

  const totalIssuesCount = periodIssues.length;
  const returnRate = totalIssuesCount > 0 ? ((returnedCount / totalIssuesCount) * 100) : 0;

  // Period label string
  const periodLabels = {
    today: "Items issued today",
    week: "Items issued this week",
    month: "Items issued this month",
    last30: "Items issued in last 30 days",
    year: "Items issued this year",
    all: "All time total issued",
    custom: `From ${store.tibCustomFromDate || 'Start'} to ${store.tibCustomToDate || 'Today'}`
  };

  // Update UI Metric Cards
  const valEl = document.getElementById("tibStatTotalValue");
  if (valEl) valEl.textContent = `Rs. ${totalValueIssued.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const periodLabelEl = document.getElementById("tibStatPeriodLabel");
  if (periodLabelEl) periodLabelEl.textContent = periodLabels[period] || "Total value issued over period";

  const totalItemsEl = document.getElementById("tibStatTotalItems");
  if (totalItemsEl) totalItemsEl.textContent = `${totalItemsQty} ${totalItemsQty === 1 ? 'Item' : 'Items'}`;

  const issuesCountEl = document.getElementById("tibStatIssuesCount");
  if (issuesCountEl) issuesCountEl.textContent = `${totalIssuesCount} issue ${totalIssuesCount === 1 ? 'record' : 'records'}`;

  const activeCountEl = document.getElementById("tibStatActiveCount");
  if (activeCountEl) activeCountEl.textContent = `${activeCount} Out (${pendingCount} Pending)`;

  const activeValueEl = document.getElementById("tibStatActiveValue");
  if (activeValueEl) activeValueEl.textContent = `Rs. ${activeValue.toLocaleString("en-LK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} out on loan`;

  const overdueCountEl = document.getElementById("tibStatOverdueCount");
  if (overdueCountEl) overdueCountEl.textContent = `${overdueCount} Overdue`;

  const overdueValueEl = document.getElementById("tibStatOverdueValue");
  if (overdueValueEl) overdueValueEl.textContent = `Rs. ${overdueValue.toLocaleString("en-LK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} overdue`;

  const returnRateEl = document.getElementById("tibStatReturnRate");
  if (returnRateEl) returnRateEl.textContent = `${returnRate.toFixed(1)}%`;

  const returnedValEl = document.getElementById("tibStatReturnedValue");
  if (returnedValEl) returnedValEl.textContent = `Rs. ${returnedValue.toLocaleString("en-LK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} returned`;

  // Render Category Breakdown Bars
  const catContainer = document.getElementById("tibCategoryBreakdown");
  if (catContainer) {
    const catKeys = Object.keys(categoryValueMap).sort((a, b) => categoryValueMap[b] - categoryValueMap[a]);
    if (catKeys.length === 0) {
      catContainer.innerHTML = `<p class="text-xs text-slate-400 italic py-2">No issue records in this period.</p>`;
    } else {
      catContainer.innerHTML = catKeys.slice(0, 4).map((k) => {
        const catVal = categoryValueMap[k];
        const pct = totalValueIssued > 0 ? ((catVal / totalValueIssued) * 100).toFixed(0) : 0;
        return `
          <div class="space-y-1">
            <div class="flex justify-between font-medium text-slate-700">
              <span class="truncate max-w-[200px]">${k}</span>
              <span class="font-mono font-bold text-slate-900">Rs. ${catVal.toLocaleString("en-LK")} (${pct}%)</span>
            </div>
            <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div class="bg-indigo-600 h-1.5 rounded-full" style="width: ${pct}%"></div>
            </div>
          </div>
        `;
      }).join("");
    }
  }

  // Render Recipient Breakdown Bars
  const recContainer = document.getElementById("tibRecipientBreakdown");
  if (recContainer) {
    const recKeys = Object.keys(recipientValueMap).sort((a, b) => recipientValueMap[b] - recipientValueMap[a]);
    if (recKeys.length === 0) {
      recContainer.innerHTML = `<p class="text-xs text-slate-400 italic py-2">No recipient data in this period.</p>`;
    } else {
      recContainer.innerHTML = recKeys.slice(0, 4).map((k) => {
        const recVal = recipientValueMap[k];
        const pct = totalValueIssued > 0 ? ((recVal / totalValueIssued) * 100).toFixed(0) : 0;
        return `
          <div class="space-y-1">
            <div class="flex justify-between font-medium text-slate-700">
              <span class="truncate max-w-[200px]">${k}</span>
              <span class="font-mono font-bold text-slate-900">Rs. ${recVal.toLocaleString("en-LK")} (${pct}%)</span>
            </div>
            <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div class="bg-teal-600 h-1.5 rounded-full" style="width: ${pct}%"></div>
            </div>
          </div>
        `;
      }).join("");
    }
  }

  // 3. Inter-Zone Custody & Return Matrix
  const matrixContainer = document.getElementById("tibInterZoneMatrix");
  if (matrixContainer) {
    const zoneMap = {};
    scopedIssues.forEach((item) => {
      const recZone = item.target_destination || item.zone_id || "General";
      const origZone = item.origin_zone || "Main Store";
      const key = `${recZone}___${origZone}`;

      if (!zoneMap[key]) {
        zoneMap[key] = {
          recZone,
          origZone,
          totalQty: 0,
          totalVal: 0,
          pendingReturnQty: 0,
          pendingReturnVal: 0,
          returnedQty: 0,
          returnedVal: 0,
          activeCount: 0
        };
      }

      const val = parseFloat(item.total_value) || (parseFloat(item.unit_cost) * parseFloat(item.qty)) || 0;
      const qty = parseFloat(item.qty) || 1;
      const isRet = item.status === "returned" || !!item.actual_return_date;
      const isReturnable = item.is_returnable !== false;

      zoneMap[key].totalQty += qty;
      zoneMap[key].totalVal += val;

      if (isRet) {
        zoneMap[key].returnedQty += qty;
        zoneMap[key].returnedVal += val;
      } else if (isReturnable) {
        zoneMap[key].pendingReturnQty += qty;
        zoneMap[key].pendingReturnVal += val;
        zoneMap[key].activeCount++;
      }
    });

    const entries = Object.values(zoneMap);
    if (entries.length === 0) {
      matrixContainer.innerHTML = `<p class="text-xs text-slate-400 italic py-2 text-center">No inter-zone loan or issue records found.</p>`;
    } else {
      matrixContainer.innerHTML = `
        <table class="w-full text-xs text-left border-collapse bg-white rounded-xl overflow-hidden border border-slate-200">
          <thead class="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th class="px-3 py-2">Receiving Zone / Project</th>
              <th class="px-3 py-2">Taken From (Origin)</th>
              <th class="px-3 py-2 text-center">Total Taken (Qty)</th>
              <th class="px-3 py-2 text-right">Total Value</th>
              <th class="px-3 py-2 text-center">Pending Return (Qty)</th>
              <th class="px-3 py-2 text-right">Pending Return Value</th>
              <th class="px-3 py-2 text-center">Returned</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${entries.map((e) => `
              <tr class="hover:bg-slate-50">
                <td class="px-3 py-2 font-bold text-slate-900 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full ${e.pendingReturnQty > 0 ? 'bg-amber-500' : 'bg-emerald-500'}"></span>
                  ${e.recZone}
                </td>
                <td class="px-3 py-2 text-slate-700 font-medium">${e.origZone}</td>
                <td class="px-3 py-2 text-center font-mono font-bold text-slate-800">${e.totalQty}</td>
                <td class="px-3 py-2 text-right font-mono font-semibold text-slate-700">Rs. ${e.totalVal.toLocaleString("en-LK")}</td>
                <td class="px-3 py-2 text-center font-mono font-bold ${e.pendingReturnQty > 0 ? 'text-amber-800 bg-amber-50/50' : 'text-slate-400'}">
                  ${e.pendingReturnQty > 0 ? `⚠️ ${e.pendingReturnQty}` : '0 (Cleared)'}
                </td>
                <td class="px-3 py-2 text-right font-mono font-bold ${e.pendingReturnVal > 0 ? 'text-amber-900' : 'text-slate-400'}">
                  Rs. ${e.pendingReturnVal.toLocaleString("en-LK")}
                </td>
                <td class="px-3 py-2 text-center font-mono font-semibold text-emerald-700">${e.returnedQty}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
    }
  }

  updateTibPendingBadge();
}

function setTibTableTab(tab) {
  store.tibTableTab = tab || "all";

  const tabs = ["all", "issued", "received", "returns"];
  tabs.forEach((t) => {
    const btn = document.getElementById(`tibTab-${t}`);
    if (!btn) return;
    if (t === store.tibTableTab) {
      btn.className = "tib-tab-btn px-3 py-1.5 rounded-lg font-bold bg-white text-indigo-700 shadow-xs cursor-pointer";
    } else {
      btn.className = "tib-tab-btn px-3 py-1.5 rounded-lg font-semibold text-slate-600 hover:text-slate-900 cursor-pointer";
    }
  });

  renderTempIssuesTable();
}

// ── Render Temporary Issues Register Table ──
function renderTempIssuesTable() {
  const tbody = document.getElementById("tempIssuesTableBody");
  if (!tbody) return;

  const allIssues = store.tempIssues || [];
  const scopeFilter = document.getElementById("tibScopeZoneFilter")?.value || "CURRENT_ZONE";
  const catFilter = document.getElementById("tibCategoryFilter")?.value || "all";
  const statusFilter = document.getElementById("tibStatusFilter")?.value || "all";
  const searchQuery = (document.getElementById("tibSearchInput")?.value || "").toLowerCase().trim();
  const period = store.tibPeriod || "month";
  const todayStr = getLocalDateString();
  const tabMode = store.tibTableTab || "all";

  // Base Filter (Scope, Category, Status, Search Query, Custom Date)
  function matchesBaseFilters(item) {
    // Scope Filter
    if (scopeFilter !== "ALL_ZONES") {
      if (scopeFilter === "CURRENT_ZONE") {
        if (store.currentZone && !isSameZone(item.zone_id, store.currentZone) && !isSameZone(item.target_destination, store.currentZone) && !isSameZone(item.origin_zone, store.currentZone)) return false;
      } else if (!isSameZone(item.zone_id, scopeFilter) && !isSameZone(item.target_destination, scopeFilter) && !isSameZone(item.origin_zone, scopeFilter)) {
        return false;
      }
    }

    // Category Filter
    if (catFilter !== "all" && item.category !== catFilter) return false;

    // Status Filter
    const isReturned = item.status === "returned" || !!item.actual_return_date;
    const isPending = item.status === "pending_receipt";
    const isReturnable = item.is_returnable !== false;
    const isOverdue = isReturnable && !isReturned && item.expected_return_date && item.expected_return_date < todayStr;

    if (statusFilter === "pending_receipt" && !isPending) return false;
    if (statusFilter === "active" && (isReturned || isPending || !isReturnable)) return false;
    if (statusFilter === "returned" && !isReturned) return false;
    if (statusFilter === "overdue" && !isOverdue) return false;

    // Search Query
    if (searchQuery) {
      const matchStr = `${item.ref_no || ''} ${item.item_name || ''} ${item.issued_to || ''} ${item.trade || ''} ${item.purpose || ''} ${item.zone_id || ''} ${item.target_destination || ''} ${item.origin_zone || ''} ${item.issued_by || ''} ${item.remarks || ''}`.toLowerCase();
      if (!matchStr.includes(searchQuery)) return false;
    }

    // Custom Date Range Filter
    if (store.tibPeriod === "custom" && (store.tibCustomFromDate || store.tibCustomToDate)) {
      const from = store.tibCustomFromDate ? new Date(store.tibCustomFromDate) : null;
      const to = store.tibCustomToDate ? new Date(store.tibCustomToDate + "T23:59:59") : null;
      if (item.date) {
        const itemD = new Date(item.date);
        if (!isNaN(itemD.getTime())) {
          if (from && itemD < from) return false;
          if (to && itemD > to) return false;
        }
      }
    }

    return true;
  }

  // Update Tab Badges / Counts dynamically based on active filters
  let allCount = 0;
  let issuedCount = 0;
  let receivedCount = 0;
  let returnsCount = 0;

  allIssues.forEach((item) => {
    if (!matchesBaseFilters(item)) return;

    allCount++;

    const isRet = item.status === "returned" || !!item.actual_return_date;
    const isReturnable = item.is_returnable !== false;
    const curZ = store.currentZone;

    if (!curZ || isSameZone(item.origin_zone, curZ)) issuedCount++;
    if (!curZ || isSameZone(item.target_destination, curZ) || isSameZone(item.zone_id, curZ)) receivedCount++;
    if (isReturnable && !isRet && item.status !== "non_returnable" && (!curZ || isSameZone(item.target_destination, curZ) || isSameZone(item.zone_id, curZ) || scopeFilter === "ALL_ZONES")) {
      returnsCount++;
    }
  });

  const tabAllEl = document.getElementById("tibTabAllCount");
  if (tabAllEl) tabAllEl.textContent = allCount;
  const tabIssEl = document.getElementById("tibTabIssuedCount");
  if (tabIssEl) tabIssEl.textContent = issuedCount;
  const tabRecEl = document.getElementById("tibTabReceivedCount");
  if (tabRecEl) tabRecEl.textContent = receivedCount;
  const tabRetEl = document.getElementById("tibTabReturnsCount");
  if (tabRetEl) tabRetEl.textContent = returnsCount;

  const summaryEl = document.getElementById("tibTableSummaryText");
  if (summaryEl) {
    if (tabMode === "issued") summaryEl.textContent = `Showing ${issuedCount} item(s) issued OUT by ${store.currentZone || 'Current Zone'}`;
    else if (tabMode === "received") summaryEl.textContent = `Showing ${receivedCount} item(s) received IN by ${store.currentZone || 'Current Zone'}`;
    else if (tabMode === "returns") summaryEl.textContent = `Showing ${returnsCount} item(s) pending to be RETURNED`;
    else summaryEl.textContent = `Showing ${allCount} record(s)`;
  }

  // Filter pipeline for current tab
  const filtered = allIssues.filter((item) => {
    if (!matchesBaseFilters(item)) return false;

    // Tab Mode Filter
    if (tabMode === "issued") {
      if (store.currentZone && !isSameZone(item.origin_zone, store.currentZone)) return false;
    } else if (tabMode === "received") {
      if (store.currentZone && !isSameZone(item.target_destination, store.currentZone) && !isSameZone(item.zone_id, store.currentZone)) return false;
    } else if (tabMode === "returns") {
      if (item.is_returnable === false || item.status === "returned" || item.status === "non_returnable") return false;
      if (scopeFilter === "CURRENT_ZONE" && store.currentZone && !isSameZone(item.target_destination, store.currentZone) && !isSameZone(item.zone_id, store.currentZone)) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center py-10 text-slate-400 bg-slate-50/50">
          <div class="space-y-1.5">
            <span class="text-3xl">📭</span>
            <p class="font-medium text-xs">No temporary issues found matching the selected tab and filters.</p>
            <button onclick="openAddTempIssueModal()" class="text-xs font-bold text-teal-600 hover:text-teal-800 underline cursor-pointer">+ Log a New Temporary Issue</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  // Sort descending by date
  filtered.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  tbody.innerHTML = filtered.map((item) => {
    const isReturned = item.status === "returned" || !!item.actual_return_date;
    const isPending = item.status === "pending_receipt";
    const isReturnable = item.is_returnable !== false;
    const isOverdue = isReturnable && !isReturned && item.expected_return_date && item.expected_return_date < todayStr;
    const val = parseFloat(item.total_value) || ((parseFloat(item.unit_cost) || 0) * (parseFloat(item.qty) || 1));
    const unitCost = parseFloat(item.unit_cost) || 0;

    let statusBadge = "";
    if (isReturned) {
      statusBadge = `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1 whitespace-nowrap shadow-2xs">✅ Returned</span>`;
    } else if (isPending) {
      statusBadge = `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1 whitespace-nowrap shadow-2xs"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> ⏳ Pending Receipt</span>`;
    } else if (isOverdue) {
      statusBadge = `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1 whitespace-nowrap shadow-2xs animate-pulse">🚨 Overdue</span>`;
    } else if (!isReturnable) {
      statusBadge = `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 inline-flex items-center gap-1 whitespace-nowrap shadow-2xs">⚪ Non-Returnable</span>`;
    } else {
      statusBadge = `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200 inline-flex items-center gap-1 whitespace-nowrap shadow-2xs">🛠️ Active / In Use</span>`;
    }

    const originZoneStr = item.origin_zone || "Main Store";
    const targetZoneStr = item.target_destination || item.zone_id || store.currentZone || "Zone";

    return `
      <tr class="hover:bg-slate-50/80 transition-colors ${isPending ? 'bg-amber-50/20' : ''}">
        <td class="px-3.5 py-3 align-top font-mono">
          <span class="font-bold text-slate-900">${item.ref_no || 'TIB/—'}</span>
          <div class="text-[11px] text-slate-500 font-sans">${item.date || '—'}</div>
        </td>
        <td class="px-3.5 py-3 align-top">
          <div class="font-bold text-slate-900">${item.item_name || '—'}</div>
          ${item.remarks ? `<div class="text-[11px] text-slate-500 italic max-w-xs truncate" title="${item.remarks}">${item.remarks}</div>` : ''}
          ${item.issued_by ? `<div class="text-[10px] text-indigo-700 font-medium">👔 Issued by: ${item.issued_by}</div>` : ''}
          ${item.received_by ? `<div class="text-[10px] text-teal-700 font-medium">📥 Received by: ${item.received_by} (${item.received_date || ''})</div>` : ''}
        </td>
        <td class="px-3 py-3 text-center align-top whitespace-nowrap">
          <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">${item.category || 'General'}</span>
        </td>
        <td class="px-3 py-3 text-center align-top whitespace-nowrap">
          <div class="text-xs font-bold text-slate-800 flex items-center justify-center gap-1">
            <span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">${originZoneStr}</span>
            <span class="text-slate-400">→</span>
            <span class="px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 font-bold border border-teal-200/60">${targetZoneStr}</span>
          </div>
        </td>
        <td class="px-3 py-3 text-center align-top font-bold text-slate-800 font-mono whitespace-nowrap">
          ${item.qty || 1} <span class="text-[10px] font-normal text-slate-500 font-sans">${item.deno || 'Nos'}</span>
        </td>
        <td class="px-3.5 py-3 text-right align-top font-mono whitespace-nowrap">
          <div class="font-bold text-slate-900">Rs. ${val.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          ${unitCost > 0 ? `<div class="text-[10px] text-slate-400">@ Rs. ${unitCost.toLocaleString("en-LK")}</div>` : ''}
        </td>
        <td class="px-3.5 py-3 align-top">
          <div class="font-bold text-slate-800">${item.issued_to || '—'}</div>
          <div class="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
            <span class="text-teal-700 font-semibold">${targetZoneStr}</span>
            ${item.purpose ? `<span>• ${item.purpose}</span>` : ''}
          </div>
        </td>
        <td class="px-3 py-3 text-center align-top whitespace-nowrap">
          ${isReturnable ? `
            <div class="font-medium text-slate-700 ${isOverdue ? 'text-rose-700 font-bold' : ''}">${item.expected_return_date || '—'}</div>
            ${isReturned && item.actual_return_date ? `<div class="text-[10px] text-emerald-700 font-semibold">Ret: ${item.actual_return_date}</div>` : ''}
          ` : `<span class="text-[10px] text-slate-400 italic">Not Returnable</span>`}
        </td>
        <td class="px-3 py-3 text-center align-top whitespace-nowrap">
          ${statusBadge}
        </td>
        <td class="px-3.5 py-3 text-center align-top whitespace-nowrap">
          <div class="flex items-center justify-center gap-1.5 flex-nowrap">
            ${isPending ? `
              <button onclick="openConfirmReceiptModal('${item.id || item._fbKey}')" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1" title="Confirm Receipt in this Zone/Workshop">
                <span>📥</span> Confirm Received
              </button>
            ` : (isReturnable && !isReturned ? `
              <button onclick="openReturnTempIssueModal('${item.id || item._fbKey}')" class="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1" title="Record Item Return">
                <span>🔄</span> Return
              </button>
            ` : '')}
            <button onclick="printTempIssueSlip('${item.id || item._fbKey}')" class="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-all cursor-pointer" title="Print Gate Pass / Issue Slip">
              🖨️
            </button>
            <button onclick="openAddTempIssueModal('${item.id || item._fbKey}')" class="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-all cursor-pointer" title="Edit Issue">
              ✏️
            </button>
            <button onclick="deleteTempIssue('${item.id || item._fbKey}', event)" class="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs transition-all cursor-pointer" title="Delete Issue">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function filterTempIssues() {
  renderTempIssuesDashboard();
  renderTempIssuesTable();
}

function getAllAvailableZonesAndWorkshops() {
  let zones = [];
  if (store.zones && store.zones.length > 0) {
    zones = store.zones.map((z) => ({ id: z.id, name: z.name || z.id }));
  } else {
    zones = [
      { id: "A-Zone", name: "A Zone" },
      { id: "B-Zone", name: "B Zone" },
      { id: "C-Zone", name: "C Zone" },
      { id: "D-Zone", name: "D Zone" },
      { id: "E-Zone", name: "E Zone" },
      { id: "Admin-&-Staff-Duties", name: "Admin & Staff Duties" }
    ];
  }

  // Include SBS in Temporary Issues so tools/machinery/items can be issued to/from SBS
  if (!zones.some((z) => isSbsZone(z.id) || isSbsZone(z.name))) {
    zones.push({ id: "SBS", name: "SBS" });
  }

  return zones;
}

// ── Open Add / Edit Temporary Issue Modal ──
function openAddTempIssueModal(editId = null) {
  const modal = document.getElementById("addTempIssueModal");
  if (!modal) return;

  const idInp = document.getElementById("tibInputId");
  const refInp = document.getElementById("tibInputRefNo");
  const dateInp = document.getElementById("tibInputDate");
  const originSelect = document.getElementById("tibInputOriginZone");
  const targetSelect = document.getElementById("tibInputZoneId");
  const descInp = document.getElementById("tibInputDescription");
  const catSelect = document.getElementById("tibInputCategory");
  const qtyInp = document.getElementById("tibInputQty");
  const denoInp = document.getElementById("tibInputDeno");
  const unitCostInp = document.getElementById("tibInputUnitCost");
  const isReturnableChk = document.getElementById("tibInputIsReturnable");
  const issuedToInp = document.getElementById("tibInputIssuedTo");
  const tradeInp = document.getElementById("tibInputTrade");
  const purposeInp = document.getElementById("tibInputPurpose");
  const expDateInp = document.getElementById("tibInputExpectedReturnDate");
  const issuedByHiddenInp = document.getElementById("tibInputIssuedBy");
  const issuedBySearchInput = document.getElementById("tibIssuedBySearchInput");
  const remarksInp = document.getElementById("tibInputRemarks");
  const titleEl = document.getElementById("addTempIssueModalTitle");

  const allZones = getAllAvailableZonesAndWorkshops();
  const zoneOptionsHtml = allZones.map((z) => `<option value="${z.id || z.name}">${z.name || z.id}</option>`).join("");

  // Populate Origin (Issued From) & Target (Issued To)
  if (originSelect) {
    originSelect.innerHTML = `<option value="Main Store">🏢 Main Store</option>` + zoneOptionsHtml;
    originSelect.value = store.currentZone || "Main Store";
  }
  if (targetSelect) {
    targetSelect.innerHTML = zoneOptionsHtml;
    targetSelect.value = store.currentZone || "A-Zone";
  }

  // Populate Inventory Quick Pick Dropdown
  const invPick = document.getElementById("tibInventoryQuickPick");
  if (invPick) {
    const invItems = store.inventory || [];
    invPick.innerHTML = `<option value="">⚡ Pick from Zone Inventory</option>` +
      invItems.map((it) => `<option value="${it.id || it._fbKey}">${it.description} (Stock: ${it.quantity} ${it.deno || ''}) - Rs. ${parseFloat(it.cost || 0).toLocaleString()}</option>`).join("");
  }

  // Populate Sailor Quick Pick Dropdown
  const sailorPick = document.getElementById("tibSailorQuickPick");
  if (sailorPick) {
    const sailors = store.sailors || [];
    sailorPick.innerHTML = `<option value="">⚓ Select Sailor from Directory</option>` +
      sailors.map((s) => `<option value="${s.id || s.official_number}">${s.official_number || ""} • ${s.rank || ""} ${s.name || s.initials || "Sailor"} (${s.trade || "Trade"})</option>`).join("");
  }

  const todayStr = getLocalDateString();
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split("T")[0];

  // Reset Search Boxes
  clearTibInventorySearch();
  clearTibSailorSearch();
  clearTibIssuedBySearch();

  if (editId) {
    const issue = (store.tempIssues || []).find((i) => (i.id || i._fbKey) === editId);
    if (issue) {
      if (titleEl) titleEl.textContent = "Edit Temporary Issue Record";
      if (idInp) idInp.value = editId;
      if (refInp) refInp.value = issue.ref_no || "";
      if (dateInp) dateInp.value = issue.date || todayStr;
      if (originSelect) originSelect.value = issue.origin_zone || "Main Store";
      if (targetSelect) targetSelect.value = issue.target_destination || issue.zone_id || store.currentZone;
      if (descInp) descInp.value = issue.item_name || "";
      const invSearch = document.getElementById("tibInventorySearchInput");
      if (invSearch) invSearch.value = issue.item_name || "";
      if (catSelect) catSelect.value = issue.category || "Tools & Machinery";
      if (qtyInp) qtyInp.value = issue.qty || 1;
      if (denoInp) denoInp.value = issue.deno || "Nos";
      if (unitCostInp) unitCostInp.value = issue.unit_cost || 0;
      if (isReturnableChk) isReturnableChk.checked = issue.is_returnable !== false;
      if (issuedToInp) issuedToInp.value = issue.issued_to || "";
      const sailorSearch = document.getElementById("tibSailorSearchInput");
      if (sailorSearch) sailorSearch.value = issue.issued_to || "";
      if (tradeInp) tradeInp.value = issue.trade || "";
      if (purposeInp) purposeInp.value = issue.purpose || "";
      if (expDateInp) expDateInp.value = issue.expected_return_date || nextWeekStr;
      if (issuedByHiddenInp) issuedByHiddenInp.value = issue.issued_by || "";
      if (issuedBySearchInput) issuedBySearchInput.value = issue.issued_by || "";
      if (remarksInp) remarksInp.value = issue.remarks || "";
    }
  } else {
    if (titleEl) titleEl.textContent = "Log New Temporary Issue";
    if (idInp) idInp.value = "";
    const seq = String((store.tempIssues || []).length + 1).padStart(3, "0");
    const yr = new Date().getFullYear();
    const mo = String(new Date().getMonth() + 1).padStart(2, "0");
    if (refInp) refInp.value = `TIB/${yr}/${mo}/${seq}`;
    if (dateInp) dateInp.value = todayStr;
    if (descInp) descInp.value = "";
    if (catSelect) catSelect.value = "Tools & Machinery";
    if (qtyInp) qtyInp.value = "1";
    if (denoInp) denoInp.value = "Nos";
    if (unitCostInp) unitCostInp.value = "0";
    if (isReturnableChk) isReturnableChk.checked = true;
    if (issuedToInp) issuedToInp.value = "";
    if (tradeInp) tradeInp.value = "";
    if (purposeInp) purposeInp.value = "";
    if (expDateInp) expDateInp.value = nextWeekStr;
    const defaultIssuedBy = (store.currentUser && store.currentUser.name) ? `${store.currentUser.name} (${store.currentUser.rank || ''})` : "Storekeeper (Civil)";
    if (issuedByHiddenInp) issuedByHiddenInp.value = defaultIssuedBy;
    if (issuedBySearchInput) issuedBySearchInput.value = defaultIssuedBy;
    if (remarksInp) remarksInp.value = "";
  }

  toggleTibReturnableFields();
  calculateTibFormTotalValue();
  modal.classList.remove("hidden");
}

function toggleTibReturnableFields() {
  const isReturnable = document.getElementById("tibInputIsReturnable") ? document.getElementById("tibInputIsReturnable").checked : true;
  const expContainer = document.getElementById("tibExpReturnDateContainer");
  const expInp = document.getElementById("tibInputExpectedReturnDate");
  const badge = document.getElementById("tibReturnableBadge");

  if (isReturnable) {
    if (expContainer) expContainer.classList.remove("opacity-40", "pointer-events-none");
    if (expInp) {
      expInp.required = true;
      if (!expInp.value) {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        expInp.value = nextWeek.toISOString().split("T")[0];
      }
    }
    if (badge) {
      badge.textContent = "Return Required";
      badge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300";
    }
  } else {
    if (expContainer) expContainer.classList.add("opacity-40", "pointer-events-none");
    if (expInp) {
      expInp.required = false;
      expInp.value = "";
    }
    if (badge) {
      badge.textContent = "Non-Returnable (Consumed)";
      badge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300";
    }
  }
}

// ── Search & Find for Inventory Items in Temporary Issue Modal ──
function onTibZoneChange() {
  const searchInput = document.getElementById("tibInventorySearchInput");
  if (searchInput) {
    searchTibInventoryItems(searchInput.value);
  }
}

function isSameZone(z1, z2) {
  if (!z1 || !z2) return false;
  const clean1 = String(z1).toLowerCase().replace(/[^a-z0-9]/g, "");
  const clean2 = String(z2).toLowerCase().replace(/[^a-z0-9]/g, "");
  return clean1 === clean2;
}

// ── Search & Find for Inventory Items in Temporary Issue Modal ──
function searchTibInventoryItems(query) {
  const container = document.getElementById("tibInventorySearchResults");
  const clearBtn = document.getElementById("tibInvSearchClearBtn");
  if (!container) return;

  const lowerQuery = (query || "").toLowerCase().trim();
  if (clearBtn) {
    if (lowerQuery) clearBtn.classList.remove("hidden");
    else clearBtn.classList.add("hidden");
  }

  const selectedZone = document.getElementById("tibInputOriginZone")?.value || document.getElementById("tibInputZoneId")?.value || "";

  const items = store.inventory || [];
  const filtered = items.filter((it) => {
    if (selectedZone && selectedZone !== "all" && selectedZone !== "All Zones" && selectedZone !== "Main Store") {
      const itZone = it.zone_id || it.location || "";
      if (!isSameZone(selectedZone, itZone)) {
        return false;
      }
    }

    if (!lowerQuery) return true;
    const desc = (it.description || "").toLowerCase();
    const cat = (it.category || "").toLowerCase();
    const book = (it.book_no || "").toLowerCase();
    const loc = (it.location || "").toLowerCase();
    return desc.includes(lowerQuery) || cat.includes(lowerQuery) || book.includes(lowerQuery) || loc.includes(lowerQuery);
  }).slice(0, 40);

  if (filtered.length === 0) {
    const zoneMsg = selectedZone ? ` in ${escapeHtml(selectedZone)}` : "";
    container.innerHTML = `<div class="p-3 text-xs text-slate-500 italic text-center">No inventory items found matching "${escapeHtml(query)}"${zoneMsg}</div>`;
    container.classList.remove("hidden");
    return;
  }

  container.innerHTML = filtered.map((it) => {
    const cost = parseFloat(it.cost || it.cost_per_unit || 0);
    const zoneBadge = it.zone_id ? `<span class="px-1.5 py-0.5 rounded bg-amber-50 font-bold text-amber-800 border border-amber-200/70 text-[10px]">🏷️ ${it.zone_id}</span>` : '';
    return `
      <div onclick="selectTibInventoryItem('${it.id || it._fbKey}')" class="p-2.5 hover:bg-indigo-50/80 cursor-pointer transition-colors flex items-center justify-between gap-3 text-left">
        <div class="flex-1 min-w-0">
          <div class="text-xs font-bold text-slate-800 truncate">${it.description}</div>
          <div class="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
            ${zoneBadge}
            <span class="px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">${it.category || 'General'}</span>
            ${it.book_no ? `<span class="font-mono text-slate-400">#${it.book_no}</span>` : ''}
          </div>
        </div>
        <div class="text-right shrink-0">
          <div class="text-xs font-mono font-bold text-indigo-700">Stock: ${it.quantity} ${it.deno || 'Nos'}</div>
          <div class="text-[10px] text-emerald-700 font-semibold font-mono">Rs. ${cost.toLocaleString()}</div>
        </div>
      </div>
    `;
  }).join("");

  container.classList.remove("hidden");
}

function selectTibInventoryItem(itemId) {
  const item = (store.inventory || []).find((i) => (i.id || i._fbKey) === itemId);
  if (!item) return;

  const descInp = document.getElementById("tibInputDescription");
  const denoInp = document.getElementById("tibInputDeno");
  const unitCostInp = document.getElementById("tibInputUnitCost");
  const catSelect = document.getElementById("tibInputCategory");
  const searchInput = document.getElementById("tibInventorySearchInput");
  const container = document.getElementById("tibInventorySearchResults");
  const clearBtn = document.getElementById("tibInvSearchClearBtn");

  if (descInp) descInp.value = item.description || "";
  if (denoInp) denoInp.value = item.deno || "Nos";
  if (unitCostInp) unitCostInp.value = item.cost || item.cost_per_unit || 0;
  if (catSelect && item.category) {
    if (catSelect.querySelector(`option[value="${item.category}"]`)) {
      catSelect.value = item.category;
    }
  }

  if (searchInput) searchInput.value = item.description || "";
  if (clearBtn) clearBtn.classList.remove("hidden");
  if (container) container.classList.add("hidden");

  calculateTibFormTotalValue();
  showToast(`Selected "${item.description}"`, "success");
}

function clearTibInventorySearch() {
  const searchInput = document.getElementById("tibInventorySearchInput");
  const container = document.getElementById("tibInventorySearchResults");
  const clearBtn = document.getElementById("tibInvSearchClearBtn");
  if (searchInput) {
    searchInput.value = "";
  }
  if (clearBtn) clearBtn.classList.add("hidden");
  if (container) {
    container.classList.add("hidden");
    container.innerHTML = "";
  }
}

// ── Search & Find for Sailors in Temporary Issue Modal ──
function searchTibSailorItems(query) {
  const container = document.getElementById("tibSailorSearchResults");
  const clearBtn = document.getElementById("tibSailorSearchClearBtn");
  if (!container) return;

  const lowerQuery = (query || "").toLowerCase().trim();
  if (clearBtn) {
    if (lowerQuery) clearBtn.classList.remove("hidden");
    else clearBtn.classList.add("hidden");
  }

  const sailors = store.sailors || [];
  const filtered = sailors.filter((s) => {
    if (!lowerQuery) return true;
    const offNo = String(s.official_number || "").toLowerCase();
    const name = (s.name || s.initials || "").toLowerCase();
    const rank = (s.rank || "").toLowerCase();
    const trade = (s.trade || s.department || "").toLowerCase();
    return offNo.includes(lowerQuery) || name.includes(lowerQuery) || rank.includes(lowerQuery) || trade.includes(lowerQuery);
  }).slice(0, 40);

  if (filtered.length === 0) {
    container.innerHTML = `<div class="p-3 text-xs text-slate-500 italic text-center">No sailors found matching "${escapeHtml(query)}"</div>`;
    container.classList.remove("hidden");
    return;
  }

  container.innerHTML = filtered.map((s) => {
    return `
      <div onclick="selectTibSailorItem('${s.id || s.official_number}')" class="p-2.5 hover:bg-teal-50/80 cursor-pointer transition-colors flex items-center justify-between gap-3 text-left">
        <div class="flex-1 min-w-0">
          <div class="text-xs font-bold text-slate-900 truncate">
            <span class="font-mono text-teal-800">${s.official_number || '—'}</span> • ${s.rank || ''} ${s.name || s.initials || 'Sailor'}
          </div>
          <div class="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
            <span class="px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">${s.trade || 'General'}</span>
            ${s.division ? `<span class="text-slate-400">${s.division}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join("");

  container.classList.remove("hidden");
}

function selectTibSailorItem(sailorId) {
  const sailor = (store.sailors || []).find((s) => String(s.id) === String(sailorId) || String(s.official_number) === String(sailorId));
  if (!sailor) return;

  const issuedToInp = document.getElementById("tibInputIssuedTo");
  const tradeInp = document.getElementById("tibInputTrade");
  const searchInput = document.getElementById("tibSailorSearchInput");
  const container = document.getElementById("tibSailorSearchResults");
  const clearBtn = document.getElementById("tibSailorSearchClearBtn");

  const fullSailorStr = `${sailor.official_number || ''} ${sailor.rank || ''} ${sailor.name || sailor.initials || ''}`.trim();
  if (issuedToInp) issuedToInp.value = fullSailorStr;
  if (tradeInp) tradeInp.value = sailor.trade || sailor.department || "";

  if (searchInput) searchInput.value = fullSailorStr;
  if (clearBtn) clearBtn.classList.remove("hidden");
  if (container) container.classList.add("hidden");

  showToast(`Selected "${fullSailorStr}"`, "success");
}

function clearTibSailorSearch() {
  const searchInput = document.getElementById("tibSailorSearchInput");
  const container = document.getElementById("tibSailorSearchResults");
  const clearBtn = document.getElementById("tibSailorSearchClearBtn");
  if (searchInput) {
    searchInput.value = "";
  }
  if (clearBtn) clearBtn.classList.add("hidden");
  if (container) {
    container.classList.add("hidden");
    container.innerHTML = "";
  }
}

// ── Search & Find for Issued By / Storekeeper in Temporary Issue Modal ──
function searchTibIssuedByItems(query) {
  const container = document.getElementById("tibIssuedBySearchResults");
  const clearBtn = document.getElementById("tibIssuedBySearchClearBtn");
  if (!container) return;

  const lowerQuery = (query || "").toLowerCase().trim();
  if (clearBtn) {
    if (lowerQuery) clearBtn.classList.remove("hidden");
    else clearBtn.classList.add("hidden");
  }

  const sailors = store.sailors || [];
  const filtered = sailors.filter((s) => {
    if (!lowerQuery) return true;
    const offNo = String(s.official_number || "").toLowerCase();
    const name = (s.name || s.initials || "").toLowerCase();
    const rank = (s.rank || "").toLowerCase();
    const trade = (s.trade || s.department || "").toLowerCase();
    return offNo.includes(lowerQuery) || name.includes(lowerQuery) || rank.includes(lowerQuery) || trade.includes(lowerQuery);
  }).slice(0, 30);

  if (filtered.length === 0) {
    container.innerHTML = `<div class="p-3 text-xs text-slate-500 italic text-center">No matching personnel found for "${escapeHtml(query)}"</div>`;
    container.classList.remove("hidden");
    return;
  }

  container.innerHTML = filtered.map((s) => {
    return `
      <div onclick="selectTibIssuedByItem('${s.id || s.official_number}')" class="p-2.5 hover:bg-indigo-50/80 cursor-pointer transition-colors flex items-center justify-between gap-3 text-left">
        <div class="flex-1 min-w-0">
          <div class="text-xs font-bold text-slate-900 truncate">
            <span class="font-mono text-indigo-700 font-bold">${s.official_number || '—'}</span> • ${s.rank || ''} ${s.name || s.initials || 'Sailor'}
          </div>
          <div class="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
            <span class="px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">${s.trade || 'Staff'}</span>
            ${s.division ? `<span class="text-slate-400">${s.division}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join("");

  container.classList.remove("hidden");
}

function selectTibIssuedByItem(sailorId) {
  const sailor = (store.sailors || []).find((s) => String(s.id) === String(sailorId) || String(s.official_number) === String(sailorId));
  if (!sailor) return;

  const searchInput = document.getElementById("tibIssuedBySearchInput");
  const hiddenInp = document.getElementById("tibInputIssuedBy");
  const container = document.getElementById("tibIssuedBySearchResults");
  const clearBtn = document.getElementById("tibIssuedBySearchClearBtn");

  const fullStr = `${sailor.name || sailor.initials || ''} (${sailor.rank || ''} ${sailor.official_number || ''})`.trim();
  if (searchInput) searchInput.value = fullStr;
  if (hiddenInp) hiddenInp.value = fullStr;
  if (clearBtn) clearBtn.classList.remove("hidden");
  if (container) container.classList.add("hidden");

  showToast(`Selected "${fullStr}" as Issuing Officer`, "success");
}

function clearTibIssuedBySearch() {
  const searchInput = document.getElementById("tibIssuedBySearchInput");
  const hiddenInp = document.getElementById("tibInputIssuedBy");
  const container = document.getElementById("tibIssuedBySearchResults");
  const clearBtn = document.getElementById("tibIssuedBySearchClearBtn");

  if (searchInput) {
    searchInput.value = "";
  }
  if (hiddenInp) hiddenInp.value = "";
  if (clearBtn) clearBtn.classList.add("hidden");
  if (container) {
    container.classList.add("hidden");
    container.innerHTML = "";
  }
}

// Global click-outside listener for TIB search dropdowns
document.addEventListener("click", (e) => {
  const invCont = document.getElementById("tibInventorySearchResults");
  const invInput = document.getElementById("tibInventorySearchInput");
  if (invCont && !invCont.contains(e.target) && e.target !== invInput) {
    invCont.classList.add("hidden");
  }
  const slrCont = document.getElementById("tibSailorSearchResults");
  const slrInput = document.getElementById("tibSailorSearchInput");
  if (slrCont && !slrCont.contains(e.target) && e.target !== slrInput) {
    slrCont.classList.add("hidden");
  }
  const issCont = document.getElementById("tibIssuedBySearchResults");
  const issInput = document.getElementById("tibIssuedBySearchInput");
  if (issCont && !issCont.contains(e.target) && e.target !== issInput) {
    issCont.classList.add("hidden");
  }
});

// Backward-compatible fallback aliases
function handleTibInventoryQuickPick(itemId) {
  selectTibInventoryItem(itemId);
}

function handleTibSailorQuickPick(sailorId) {
  selectTibSailorItem(sailorId);
}

function calculateTibFormTotalValue() {
  const qty = parseFloat(document.getElementById("tibInputQty")?.value) || 0;
  const unitCost = parseFloat(document.getElementById("tibInputUnitCost")?.value) || 0;
  const total = qty * unitCost;

  const totalInp = document.getElementById("tibInputTotalValue");
  if (totalInp) {
    totalInp.value = `Rs. ${total.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

window._isSubmittingTempIssue = false;

// ── Submit Temporary Issue Form ──
function handleTempIssueFormSubmit(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  if (_isSubmittingTempIssue) return;
  _isSubmittingTempIssue = true;

  const submitBtn = e && e.target ? e.target.querySelector('button[type="submit"]') : null;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.dataset.origText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>⏳</span> Saving...';
  }

  const id = document.getElementById("tibInputId")?.value;
  const refNo = document.getElementById("tibInputRefNo")?.value || "TIB/—";
  const date = document.getElementById("tibInputDate")?.value || getLocalDateString();
  const originZone = document.getElementById("tibInputOriginZone")?.value || store.currentZone || "Main Store";
  const targetZone = document.getElementById("tibInputZoneId")?.value || store.currentZone;
  const desc = document.getElementById("tibInputDescription")?.value || "Tool / Material";
  const category = document.getElementById("tibInputCategory")?.value || "Tools & Machinery";
  const qty = parseFloat(document.getElementById("tibInputQty")?.value) || 1;
  const deno = document.getElementById("tibInputDeno")?.value || "Nos";
  const unitCost = parseFloat(document.getElementById("tibInputUnitCost")?.value) || 0;
  const totalVal = qty * unitCost;
  const isReturnable = document.getElementById("tibInputIsReturnable") ? document.getElementById("tibInputIsReturnable").checked : true;
  const issuedTo = document.getElementById("tibInputIssuedTo")?.value || "";
  const trade = document.getElementById("tibInputTrade")?.value || "";
  const purpose = document.getElementById("tibInputPurpose")?.value || "";
  const expDate = document.getElementById("tibInputExpectedReturnDate")?.value || "";
  const issuedBy = document.getElementById("tibIssuedBySearchInput")?.value || document.getElementById("tibInputIssuedBy")?.value || "";
  const remarks = document.getElementById("tibInputRemarks")?.value || "";

  const record = {
    ref_no: refNo,
    date: date,
    zone_id: targetZone,
    origin_zone: originZone,
    target_destination: targetZone,
    item_name: desc,
    category: category,
    qty: qty,
    deno: deno,
    unit_cost: unitCost,
    total_value: totalVal,
    issued_to: issuedTo,
    trade: trade,
    purpose: purpose,
    is_returnable: isReturnable,
    expected_return_date: isReturnable ? expDate : "",
    issued_by: issuedBy,
    remarks: remarks,
    status: isReturnable ? "pending_receipt" : "non_returnable",
    updated_at: Date.now()
  };

  if (id) {
    record.id = id;
    const existing = (store.tempIssues || []).find((i) => (i.id || i._fbKey) === id);
    if (existing && existing.status) record.status = existing.status;
    if (existing && existing.received_date) record.received_date = existing.received_date;
    if (existing && existing.received_by) record.received_by = existing.received_by;

    if (typeof opsDB !== "undefined") {
      opsDB.ref(`temp_issues/${id}`).update(record);
    }
    const idx = (store.tempIssues || []).findIndex((i) => (i.id || i._fbKey) === id);
    if (idx !== -1) store.tempIssues[idx] = { ...store.tempIssues[idx], ...record };
    showToast(`Temporary Issue ${refNo} updated!`, "success");
  } else {
    record.created_at = Date.now();
    let newKey = null;
    if (typeof opsDB !== "undefined") {
      const newRef = opsDB.ref("temp_issues").push(record);
      newKey = newRef.key;
      record.id = newKey;
      record._fbKey = newKey;
    } else {
      newKey = `tib_${Date.now()}`;
      record.id = newKey;
      record._fbKey = newKey;
    }
    if (!store.tempIssues) store.tempIssues = [];
    store.tempIssues = store.tempIssues.filter((i) => (i.id || i._fbKey) !== newKey);
    store.tempIssues.push(record);
    showToast(`Temporary Issue ${refNo} logged as ${isReturnable ? 'Pending Receipt' : 'Non-Returnable Issue'}!`, "success");
  }

  saveTempIssuesToStorage();
  closeModal("addTempIssueModal");
  renderTempIssuesDashboard();
  renderTempIssuesTable();

  setTimeout(() => {
    _isSubmittingTempIssue = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = submitBtn.dataset.origText || '<span>💾</span> Save Temporary Issue';
    }
  }, 600);
}

// ── Inward Receipt Confirmation Modal & Handler ──
function openConfirmReceiptModal(issueId) {
  const issue = (store.tempIssues || []).find((i) => (i.id || i._fbKey) === issueId);
  if (!issue) return;

  const modal = document.getElementById("confirmReceiptModal");
  if (!modal) return;

  const idInp = document.getElementById("receiptTibId");
  const refEl = document.getElementById("receiptTibRef");
  const valEl = document.getElementById("receiptTibValue");
  const itemEl = document.getElementById("receiptTibItem");
  const originEl = document.getElementById("receiptTibOrigin");
  const expReturnEl = document.getElementById("receiptTibExpReturn");
  const dateInp = document.getElementById("receiptTibDate");
  const qtyInp = document.getElementById("receiptTibQty");
  const condSelect = document.getElementById("receiptTibCondition");
  const recInp = document.getElementById("receiptTibReceivedBy");
  const notesInp = document.getElementById("receiptTibNotes");

  if (idInp) idInp.value = issueId;
  if (refEl) refEl.textContent = `Issue Ref: ${issue.ref_no || 'TIB/—'}`;
  const totalVal = parseFloat(issue.total_value) || ((parseFloat(issue.unit_cost) || 0) * (parseFloat(issue.qty) || 1));
  if (valEl) valEl.textContent = `Value: Rs. ${totalVal.toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;
  if (itemEl) itemEl.textContent = `📦 ${issue.item_name} (${issue.qty} ${issue.deno || 'Nos'})`;
  if (originEl) originEl.textContent = `From: ${issue.origin_zone || 'Main Store'} → To: ${issue.target_destination || issue.zone_id || store.currentZone}`;
  if (expReturnEl) expReturnEl.textContent = `Expected Return: ${issue.expected_return_date || '—'}`;

  if (dateInp) dateInp.value = getLocalDateString();
  if (qtyInp) qtyInp.value = issue.qty || 1;
  if (condSelect) condSelect.value = "Good Working Condition";
  // Auto-fill recipient name as per earlier provided details
  if (recInp) recInp.value = issue.issued_to || (store.currentUser && store.currentUser.name ? store.currentUser.name : "");
  if (notesInp) notesInp.value = "Inspected, tested and taken into custody.";

  modal.classList.remove("hidden");
}

function handleConfirmReceiptSubmit(e) {
  e.preventDefault();

  const id = document.getElementById("receiptTibId")?.value;
  if (!id) return;

  const receiptDate = document.getElementById("receiptTibDate")?.value || getLocalDateString();
  const qtyReceived = parseFloat(document.getElementById("receiptTibQty")?.value) || 1;
  const condition = document.getElementById("receiptTibCondition")?.value || "Good Working Condition";
  const receivedBy = document.getElementById("receiptTibReceivedBy")?.value || "In-Charge";
  const notes = document.getElementById("receiptTibNotes")?.value || "";

  const updates = {
    status: "active",
    received_date: receiptDate,
    received_qty: qtyReceived,
    receipt_condition: condition,
    received_by: receivedBy,
    receipt_notes: notes,
    receipt_confirmed_at: Date.now()
  };

  if (typeof opsDB !== "undefined") {
    opsDB.ref(`temp_issues/${id}`).update(updates);
  }

  const idx = (store.tempIssues || []).findIndex((i) => (i.id || i._fbKey) === id);
  if (idx !== -1) {
    store.tempIssues[idx] = { ...store.tempIssues[idx], ...updates };
  }

  saveTempIssuesToStorage();
  closeModal("confirmReceiptModal");
  renderTempIssuesDashboard();
  renderTempIssuesTable();
  showToast(`Custody confirmed! Item is now Active in this Zone/WS.`, "success");
}

// ── Open Return Item Modal ──
function openReturnTempIssueModal(issueId) {
  const issue = (store.tempIssues || []).find((i) => (i.id || i._fbKey) === issueId);
  if (!issue) return;

  const modal = document.getElementById("returnTempIssueModal");
  if (!modal) return;

  const idInp = document.getElementById("returnTibId");
  const refEl = document.getElementById("returnTibRef");
  const valEl = document.getElementById("returnTibValue");
  const itemEl = document.getElementById("returnTibItem");
  const issuedToEl = document.getElementById("returnTibIssuedTo");
  const dateInp = document.getElementById("returnTibDate");
  const qtyInp = document.getElementById("returnTibQty");
  const condSelect = document.getElementById("returnTibCondition");
  const recInp = document.getElementById("returnTibReceivedBy");
  const remarksInp = document.getElementById("returnTibRemarks");

  if (idInp) idInp.value = issueId;
  if (refEl) refEl.textContent = `Issue Ref: ${issue.ref_no || 'TIB/—'}`;
  const totalVal = parseFloat(issue.total_value) || ((parseFloat(issue.unit_cost) || 0) * (parseFloat(issue.qty) || 1));
  if (valEl) valEl.textContent = `Value: Rs. ${totalVal.toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;
  if (itemEl) itemEl.textContent = `📦 ${issue.item_name} (${issue.qty} ${issue.deno || 'Nos'})`;
  if (issuedToEl) issuedToEl.textContent = `Issued To: ${issue.issued_to || '—'} • Purpose: ${issue.purpose || 'General'}`;

  if (dateInp) dateInp.value = getLocalDateString();
  if (qtyInp) qtyInp.value = issue.qty || 1;
  if (condSelect) condSelect.value = "Good Condition";
  // Auto-fill receiver as per issuing officer / storekeeper
  if (recInp) recInp.value = issue.issued_by || (store.currentUser && store.currentUser.name ? store.currentUser.name : "Storekeeper");
  if (remarksInp) remarksInp.value = "Inspected and returned to store.";

  modal.classList.remove("hidden");
}

function handleTempIssueReturnSubmit(e) {
  e.preventDefault();

  const id = document.getElementById("returnTibId")?.value;
  if (!id) return;

  const returnDate = document.getElementById("returnTibDate")?.value || getLocalDateString();
  const returnQty = parseFloat(document.getElementById("returnTibQty")?.value) || 1;
  const condition = document.getElementById("returnTibCondition")?.value || "Good Condition";
  const receivedBy = document.getElementById("returnTibReceivedBy")?.value || "Storekeeper";
  const remarks = document.getElementById("returnTibRemarks")?.value || "";

  const updates = {
    actual_return_date: returnDate,
    qty_returned: returnQty,
    condition_on_return: condition,
    return_received_by: receivedBy,
    return_remarks: remarks,
    status: "returned",
    returned_at: Date.now()
  };

  if (typeof opsDB !== "undefined") {
    opsDB.ref(`temp_issues/${id}`).update(updates);
  }

  const idx = (store.tempIssues || []).findIndex((i) => (i.id || i._fbKey) === id);
  if (idx !== -1) {
    store.tempIssues[idx] = { ...store.tempIssues[idx], ...updates };
  }

  saveTempIssuesToStorage();
  closeModal("returnTempIssueModal");
  renderTempIssuesDashboard();
  renderTempIssuesTable();
  showToast(`Item marked as Returned successfully!`, "success");
}

// ── Delete Temporary Issue ──
function deleteTempIssue(id, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  if (!confirm("Are you sure you want to delete this Temporary Issue record?")) return;

  if (typeof opsDB !== "undefined") {
    opsDB.ref(`temp_issues/${id}`).remove();
  }

  store.tempIssues = (store.tempIssues || []).filter((i) => (i.id || i._fbKey) !== id);
  saveTempIssuesToStorage();
  renderTempIssuesDashboard();
  renderTempIssuesTable();
  showToast("Temporary issue record deleted", "info");
}

// ── Helper to resolve real Naval Rank (e.g. PO(CE)) instead of Trade (MA) ──
function resolveSailorRealRank(nameOrOffNo, fallbackTrade = "") {
  const str = String(nameOrOffNo || "").trim();

  // 1. Try to find matching sailor in store.sailors
  if (Array.isArray(store.sailors) && store.sailors.length > 0) {
    const found = store.sailors.find((s) => {
      const offNo = String(s.official_number || s.service_no || "").trim();
      const sName = String(s.name || "").toLowerCase().trim();
      const fullStr = str.toLowerCase();
      return (offNo && fullStr.includes(offNo)) || (sName && fullStr.includes(sName));
    });
    if (found && found.rank && found.rank.trim()) {
      return found.rank.trim();
    }
  }

  // 2. Extract rank pattern from the name string (e.g. "EC 50091 PO(CE) SBSS JAYAWARDANA" -> "PO(CE)")
  const rankMatch = str.match(/(?:CPO|PO|LS|AB|ORD|WO|MCPO|SCPO|CWO|LCDR|LT|SLT|MID|CDR|CAPT|CMDE|RADM)\s*(?:\([A-Za-z0-9/& -]+\))?|(?:Chief Petty Officer|Petty Officer|Leading Seaman|Able Seaman|Ordinary Seaman)/i);
  if (rankMatch) {
    return rankMatch[0].trim();
  }

  // 3. Check if fallbackTrade is already a rank
  const trades = ["ma", "mason", "carpenter", "plumber", "painter", "welder", "driver", "blacksmith", "electrician", "civil", "tools & machinery"];
  if (fallbackTrade && !trades.includes(String(fallbackTrade).toLowerCase().trim())) {
    return fallbackTrade.trim();
  }

  return "—";
}

// ── Authentic Official Sri Lanka Navy NAV 254 HTML Template (Pic 3 & Pic 4 Layout) ──
function generateOfficialNav254Html(data) {
  const refNo = data.ref_no || data.voucher_no || "CCCED/CE/FD/OUT/254/01/2026";
  const suppliedBy = data.supplied_by || `Civil Engineering Department (${data.origin_zone || store.currentZone || "CE Dept"})`;
  const receivedBy = data.received_by || data.target_destination || data.receiving_unit || data.zone_id || "FH Zone";
  const issueDate = data.date || getLocalDateString();
  const recipientName = data.issued_to || data.recipient_name || "EC 50091 PO(CE) SBSS JAYAWARDANA";
  const recipientRank = resolveSailorRealRank(recipientName, data.recipient_rank || data.trade || "");
  const issuedBy = data.issued_by || "Storekeeper (CE Dept)";
  const purpose = data.purpose || "Civil Engineering Works / Maintenance";
  const expectedReturn = data.expected_return_date || "—";
  const operator = store.activeProfileName || "Admin Desk";
  const printTimestamp = new Date().toLocaleString("en-GB");

  // Items handling - minimum 4 rows (Items Under 4 as shown in Pic 3)
  const items = (data.items && data.items.length > 0) ? data.items : [
    {
      description: data.item_name || data.description || "Material Issue",
      deno: data.deno || "Nos",
      qty_supplied: data.qty || data.quantity_issued || 1,
      qty_received: data.quantity_received || data.qty || data.quantity_issued || 1,
      total_value: parseFloat(data.total_value) || ((parseFloat(data.unit_cost) || 0) * (parseFloat(data.qty) || 1))
    }
  ];

  const totalRowCount = Math.max(4, items.length);
  let rowsHtml = "";

  for (let idx = 0; idx < totalRowCount; idx++) {
    const it = items[idx];
    if (it) {
      const val = parseFloat(it.total_value || 0);
      const valRs = val > 0 ? Math.floor(val).toLocaleString("en-LK") : "—";
      const valCents = val > 0 ? String(Math.round((val % 1) * 100)).padStart(2, "0") : "";

      rowsHtml += `
        <tr style="height: 32px;">
          <td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-size: 11px; font-weight: bold;">${idx + 1}</td>
          <td style="border: 1px solid #000; padding: 4px 8px; font-size: 11.5px; font-weight: 600; text-align: left;">${it.description}</td>
          <td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-size: 11px;">${it.deno || 'Nos'}</td>
          <td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-size: 11.5px; font-weight: bold;">${it.qty_supplied || it.qty || ''}</td>
          <td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-size: 11.5px; font-weight: bold;">${it.qty_received || it.qty || ''}</td>
          <td style="border: 1px solid #000; padding: 0; font-size: 11px;">
            <div style="display: flex; height: 100%; align-items: center;">
              <span style="flex: 1; text-align: right; padding-right: 4px; border-right: 1px solid #000; font-weight: bold;">${valRs}</span>
              <span style="width: 25px; text-align: center; font-size: 10px;">${valCents}</span>
            </div>
          </td>
        </tr>
      `;
    } else {
      // Empty standard blank row to maintain authentic official format (Pic 3)
      rowsHtml += `
        <tr style="height: 32px;">
          <td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-size: 11px;">&nbsp;</td>
          <td style="border: 1px solid #000; padding: 4px 8px; font-size: 11px;">&nbsp;</td>
          <td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-size: 11px;">&nbsp;</td>
          <td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-size: 11px;">&nbsp;</td>
          <td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-size: 11px;">&nbsp;</td>
          <td style="border: 1px solid #000; padding: 0; font-size: 11px;">
            <div style="display: flex; height: 100%;">
              <span style="flex: 1; border-right: 1px solid #000;">&nbsp;</span>
              <span style="width: 25px;">&nbsp;</span>
            </div>
          </td>
        </tr>
      `;
    }
  }

  return `
    <div style="font-family: 'Noto Sans Sinhala', 'Iskoola Pota', 'Abhaya Libre', 'Times New Roman', serif; color: #000; max-width: 820px; margin: 0 auto; background: #fff; padding: 18px 22px; border: 1.5px solid #000;">
      <!-- Top Form Number & Header Details (Pic 3) -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <!-- Left: NAV 254 Box -->
        <div style="border: 1.5px solid #000; padding: 4px 10px; font-size: 12px; font-weight: bold; display: inline-flex; align-items: center; gap: 8px;">
          <div style="line-height: 1.2; text-align: center;">නැවි<br>NAV</div>
          <div style="font-size: 26px; font-weight: 900; line-height: 1;">} 254</div>
        </div>

        <!-- Center-Right Form Info -->
        <div style="text-align: right; font-size: 10px; line-height: 1.35;">
          <div style="display: flex; align-items: flex-start; justify-content: flex-end; gap: 14px;">
            <div style="text-align: right;">
              <div style="font-weight: bold; font-family: monospace; font-size: 9.5px; color: #000;">H 029858 — 1500 (2007/12) P</div>
              <div>ශ්‍රී ලං. නා. හ. 64</div>
              <div>(Bond Quintuplicate 7 ½” x 10”)</div>
              <div>සිං/ඉං 5/67</div>
            </div>
            <!-- Fold triangle marker in top right corner -->
            <div style="width: 0; height: 0; border-top: 28px solid #475569; border-left: 28px solid transparent;"></div>
          </div>
        </div>
      </div>

      <!-- Center Document Title -->
      <div style="text-align: center; margin-top: 6px; margin-bottom: 6px;">
        <h2 style="font-size: 13.5px; font-weight: bold; margin: 0; letter-spacing: 0.5px;">ඇණවුම් සැපයුම් හෝ ලැබූ පත්‍රය</h2>
        <h3 style="font-size: 11.5px; font-weight: bold; margin: 0; text-transform: uppercase;">Demand Supply Or Receipt Note</h3>
      </div>

      <!-- Top Right Serial No (Green Area) -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 8px;">
        <div style="border: 1.5px solid #000; display: inline-flex; font-size: 11px;">
          <div style="padding: 4px 10px; border-right: 1.5px solid #000; font-weight: bold; line-height: 1.2; text-align: center;">
            අනුක්‍රමික අංකය<br>Serial No.
          </div>
          <div style="padding: 4px 14px; font-weight: 900; font-family: monospace; font-size: 12px; display: flex; align-items: center; color: #000;">
            ${refNo}
          </div>
        </div>
      </div>

      <!-- Supplied By (Red Area) & Received By (Orange Area) -->
      <div style="display: flex; justify-content: space-between; font-size: 11.5px; margin-top: 4px; padding-bottom: 6px;">
        <!-- Left: Supplied By (Red) -->
        <div style="width: 48%;">
          <div style="font-weight: bold;">සපයන ලද්දේ / SUPPLIED BY</div>
          <div style="font-weight: bold; font-size: 12px; padding: 2px 0; min-height: 22px; color: #000;">
            ${suppliedBy}
          </div>
          <div style="margin-top: 4px;">
            <strong>දිනය / Date:</strong> ${issueDate}
          </div>
        </div>

        <!-- Right: Received By (Orange) -->
        <div style="width: 48%;">
          <div style="font-weight: bold;">ලබා ගත්තේ / RECEIVED BY</div>
          <div style="font-weight: bold; font-size: 12px; padding: 2px 0; min-height: 22px; color: #000;">
            ${receivedBy}
          </div>
          <div style="margin-top: 4px;">
            <strong>දිනය / Date:</strong> ${issueDate}
          </div>
        </div>
      </div>

      <!-- Main Items Table (Yellow Area - 4 Items as in Pic 3) -->
      <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000; margin-top: 8px; margin-bottom: 12px;">
        <thead>
          <tr style="background: #f8fafc;">
            <th style="border: 1px solid #000; padding: 6px 4px; width: 5%; font-size: 11px;">#</th>
            <th style="border: 1px solid #000; padding: 6px 8px; width: 44%; font-size: 11px; text-align: center;">
              විස්තරය<br><span style="font-weight: normal; font-size: 10px;">description</span>
            </th>
            <th style="border: 1px solid #000; padding: 6px 6px; width: 12%; font-size: 11px; text-align: center;">
              වර්ගය<br><span style="font-weight: normal; font-size: 10px;">Denomination</span>
            </th>
            <th style="border: 1px solid #000; padding: 6px 6px; width: 13%; font-size: 11px; text-align: center;">
              සැපයූ ප්‍රමාණය<br><span style="font-weight: normal; font-size: 10px;">Quantity Supplied</span>
            </th>
            <th style="border: 1px solid #000; padding: 6px 6px; width: 13%; font-size: 11px; text-align: center;">
              ලැබූ ප්‍රමාණය<br><span style="font-weight: normal; font-size: 10px;">Quantity Received</span>
            </th>
            <th style="border: 1px solid #000; padding: 4px; width: 13%; font-size: 11px; text-align: center;">
              වටිනාකම<br><span style="font-weight: normal; font-size: 10px;">Value</span>
              <div style="display: flex; border-top: 1px solid #000; margin-top: 2px; padding-top: 2px;">
                <span style="flex: 1; text-align: center; border-right: 1px solid #000; font-size: 9.5px; font-weight: bold;">රු. Rs.</span>
                <span style="width: 25px; text-align: center; font-size: 9.5px; font-weight: bold;">ශ. c.</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <!-- Authorizing Officer Box (Pic 3) -->
      <div style="border: 1.5px solid #000; padding: 6px 12px; font-size: 11px; display: flex; align-items: center; justify-content: space-between;">
        <div style="font-weight: bold; width: 25%; line-height: 1.3;">
          බලය දෙන නිලධාරී<br><span style="font-size: 10px;">Officer Authorizing</span>
        </div>
        <div style="width: 72%;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span>ඇණවුම Demand } ____________________________</span>
            <span>නිලය Rank } ______________</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span>සැපයුම Supply } ____________________________</span>
            <span>නිලය Rank } ______________</span>
          </div>
        </div>
      </div>

      <!-- Received Stores & Rank Area (Purple Area) -->
      <div style="margin-top: 14px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px;">
        <div style="width: 58%;">
          <div style="font-weight: bold; line-height: 1.2;">
            ඉහත සඳහන් ගබඩා බඩු ලබා ගන්නා ලදී. }<br>
            <span style="font-size: 10px;">RECEIVED THE ABOVE STORES</span>
          </div>
          <div style="border-bottom: 1px solid #000; padding: 4px 0; font-weight: bold; font-size: 11.5px; min-height: 22px; margin-top: 4px;">
            ${recipientName}
          </div>
        </div>
        <div style="width: 38%;">
          <div style="font-weight: bold; line-height: 1.2;">
            නිලය/තරාතිරම }<br>
            <span style="font-size: 10px;">RANK / RATE</span>
          </div>
          <div style="border-bottom: 1px solid #000; padding: 4px 0; font-weight: bold; font-size: 11.5px; min-height: 22px; margin-top: 4px;">
            ${recipientRank}
          </div>
        </div>
      </div>

      <!-- Gray Area: Issued By / Purpose / Expected Return -->
      <div style="margin-top: 10px; font-size: 10px; color: #1e293b; display: flex; justify-content: space-between; border-top: 1px dashed #94a3b8; padding-top: 4px;">
        <div><strong>සැපයූ නාවිකයා / Issued By:</strong> ${issuedBy}</div>
        <div><strong>කාර්යය / Purpose:</strong> ${purpose}</div>
        <div><strong>නැවත භාරදිය යුතු දිනය:</strong> ${expectedReturn}</div>
      </div>

      <!-- Brown Area: System Reference & Tracking Details (Right/Bottom) -->
      <div style="margin-top: 4px; font-size: 8.5px; color: #78350f; display: flex; justify-content: space-between; font-family: monospace; border-top: 1px solid #fed7aa; padding-top: 2px;">
        <span>⚙️ SYSTEM TRACKING REF: ${refNo} · SRI LANKA NAVY CE DEPT</span>
        <span>GENERATED: ${printTimestamp} · OPERATOR: ${operator}</span>
      </div>
    </div>
  `;
}

// ── Print Official Gate Pass / Authentic NAV 254 Slip ──
function printTempIssueSlip(issueId) {
  const issue = (store.tempIssues || []).find((i) => (i.id || i._fbKey) === issueId);
  if (!issue) return;

  const nav254Content = generateOfficialNav254Html({
    ref_no: issue.ref_no,
    supplied_by: `Civil Engineering Department (${issue.origin_zone || store.currentZone || 'CE Dept'})`,
    received_by: issue.target_destination || issue.zone_id || store.currentZone,
    date: issue.date,
    item_name: issue.item_name,
    category: issue.category,
    qty: issue.qty,
    deno: issue.deno,
    unit_cost: issue.unit_cost,
    total_value: issue.total_value,
    issued_to: issue.issued_to,
    trade: issue.trade,
    issued_by: issue.issued_by,
    purpose: issue.purpose,
    expected_return_date: issue.expected_return_date,
    is_returnable: issue.is_returnable
  });

  const printDocContainer = document.getElementById("nav254PrintDocument");
  if (printDocContainer) {
    printDocContainer.innerHTML = nav254Content;
    document.getElementById("nav254PrintModal").classList.remove("hidden");
  }

  printNav254HtmlDirect(nav254Content);
}

// ── Print Tabular Temporary Issues Register ──
function printTempIssuesRegister() {
  const allIssues = store.tempIssues || [];
  const scopeFilter = document.getElementById("tibScopeZoneFilter")?.value || "CURRENT_ZONE";
  const period = store.tibPeriod || "month";
  const todayStr = getLocalDateString();

  const filtered = allIssues.filter((item) => {
    if (scopeFilter !== "ALL_ZONES") {
      if (scopeFilter === "CURRENT_ZONE") {
        if (item.zone_id && item.zone_id !== store.currentZone) return false;
      } else if (item.zone_id !== scopeFilter) {
        return false;
      }
    }
    return isDateInSelectedPeriod(item.date, period);
  });

  const printWindow = window.open("", "_blank", "width=1000,height=750");
  if (!printWindow) {
    window.print();
    return;
  }

  let totalVal = 0;
  const rowsHtml = filtered.map((i, idx) => {
    const val = parseFloat(i.total_value) || ((parseFloat(i.unit_cost) || 0) * (parseFloat(i.qty) || 1));
    totalVal += val;
    const isReturned = i.status === "returned" || !!i.actual_return_date;
    return `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td>${i.ref_no}</td>
        <td>${i.date}</td>
        <td class="font-bold">${i.item_name}</td>
        <td class="text-center">${i.qty} ${i.deno || ''}</td>
        <td class="text-right font-mono">Rs. ${val.toLocaleString("en-LK")}</td>
        <td>${i.issued_to} (${i.trade || ''})</td>
        <td>${i.expected_return_date || '—'}</td>
        <td class="text-center">${isReturned ? 'Returned' : 'Active / Out'}</td>
      </tr>
    `;
  }).join("");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Temporary Issue Register</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: "Times New Roman", Times, serif; color: #000; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #000; padding: 5px 8px; font-size: 11px; }
        </style>
      </head>
      <body class="p-6">
        <div class="text-center pb-4 border-b">
          <h1 class="font-black text-base uppercase">SRI LANKA NAVY · CIVIL ENGINEERING DEPARTMENT</h1>
          <h2 class="font-bold text-sm uppercase">TEMPORARY & RETURN-BASIS ISSUE REGISTER</h2>
          <p class="text-xs mt-1">Scope: <strong>${scopeFilter === 'ALL_ZONES' ? 'All Zones & Workshops' : store.currentZone}</strong> • Total Records: <strong>${filtered.length}</strong> • Total Value: <strong>Rs. ${totalVal.toLocaleString("en-LK", { minimumFractionDigits: 2 })}</strong></p>
        </div>
        <table class="mt-4">
          <thead class="bg-slate-100">
            <tr>
              <th>#</th>
              <th>Ref No</th>
              <th>Issue Date</th>
              <th>Item Description</th>
              <th>Qty</th>
              <th>Total Value</th>
              <th>Issued To & Trade</th>
              <th>Expected Return</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            <tr class="font-bold bg-slate-100">
              <td colspan="5" class="text-right">Total Value Issued Over Period:</td>
              <td class="text-right font-mono">Rs. ${totalVal.toLocaleString("en-LK", { minimumFractionDigits: 2 })}</td>
              <td colspan="3"></td>
            </tr>
          </tfoot>
        </table>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); window.close(); }, 300);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// ── Export CSV ──
function exportTempIssuesCsv() {
  const allIssues = store.tempIssues || [];
  if (allIssues.length === 0) {
    showToast("No temporary issue records to export", "warning");
    return;
  }

  const headers = ["Ref No", "Issue Date", "Zone", "Item Description", "Category", "Qty", "Deno", "Unit Cost", "Total Value", "Issued To", "Trade", "Purpose", "Expected Return Date", "Actual Return Date", "Status", "Remarks"];
  const rows = allIssues.map((i) => [
    `"${i.ref_no || ''}"`,
    `"${i.date || ''}"`,
    `"${i.zone_id || ''}"`,
    `"${(i.item_name || '').replace(/"/g, '""')}"`,
    `"${i.category || ''}"`,
    i.qty || 1,
    `"${i.deno || ''}"`,
    i.unit_cost || 0,
    i.total_value || 0,
    `"${(i.issued_to || '').replace(/"/g, '""')}"`,
    `"${i.trade || ''}"`,
    `"${(i.purpose || '').replace(/"/g, '""')}"`,
    `"${i.expected_return_date || ''}"`,
    `"${i.actual_return_date || ''}"`,
    `"${i.status || ''}"`,
    `"${(i.remarks || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Temporary_Issue_Book_${getLocalDateString()}.csv`);
  document.body.appendChild(link);
  link.click();
  showToast("Temporary Issue Book exported to CSV!", "success");
}

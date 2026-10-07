// ============================================================================
// CMSys Module: Locations & Maintenance Management (LMD)
// File: js/modules/locations-maintenance.js
// ============================================================================

window._currentLmdTab = window._currentLmdTab || "dashboard";
window._lmdExportAction = window._lmdExportAction || "csv";

// =============================================
// LOCATIONS & MAINTENANCE (LMD)
// =============================================

window._currentLmdTab = "dashboard";

function switchLmdTab(tab) {
  _currentLmdTab = tab;
  const dashTabBtn = document.getElementById("lmdTab-dashboard");
  const locsTabBtn = document.getElementById("lmdTab-locations");
  const dashContent = document.getElementById("lmdContent-dashboard");
  const locsContent = document.getElementById("lmdContent-locations");

  if (tab === "dashboard") {
    if (dashTabBtn) {
      dashTabBtn.className = "px-4 py-2 rounded-xl text-xs font-bold transition-all bg-teal-600 text-white shadow-sm flex items-center gap-1.5";
    }
    if (locsTabBtn) {
      locsTabBtn.className = "px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all flex items-center gap-1.5";
    }
    if (dashContent) dashContent.classList.remove("hidden");
    if (locsContent) locsContent.classList.add("hidden");
    renderLmdDashboard();
  } else {
    if (dashTabBtn) {
      dashTabBtn.className = "px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all flex items-center gap-1.5";
    }
    if (locsTabBtn) {
      locsTabBtn.className = "px-4 py-2 rounded-xl text-xs font-bold transition-all bg-teal-600 text-white shadow-sm flex items-center gap-1.5";
    }
    if (dashContent) dashContent.classList.add("hidden");
    if (locsContent) locsContent.classList.remove("hidden");
    renderLocationsList();
  }
}

function renderMaintenance() {
  const currentZone = store.currentZone;
  const zoneLocations = (store.locations || []).filter(
    (l) => l.zone_id === currentZone
  );
  const locIdsSet = new Set(zoneLocations.map((l) => String(l.id || l._fbKey)));
  const locNamesSet = new Set(
    zoneLocations.flatMap((l) => [
      (l.building_name || "").toLowerCase().trim(),
      (l.sub_location || "").toLowerCase().trim(),
      `${(l.building_name || "").toLowerCase().trim()} — ${(l.sub_location || "").toLowerCase().trim()}`,
      `${(l.building_name || "").toLowerCase().trim()} / ${(l.sub_location || "").toLowerCase().trim()}`
    ]).filter(Boolean)
  );

  // 1. Gather all maintenance records for this zone
  const zoneRecords = (store.maintenanceRecords || []).filter((r) =>
    locIdsSet.has(String(r.location_id))
  );

  // 2. Gather completed/attended jobs in this zone
  const completedJobCards = (store.jobCards || []).filter(
    (jc) =>
      jc.zone_id === currentZone &&
      (jc.status === "Completed" || jc.completed_date)
  );

  const recentAttendedCount =
    zoneRecords.length + completedJobCards.length;

  // 3. Gather pending / ongoing work orders & active job cards for this zone
  const pendingWos = (store.workOrders || []).filter(
    (w) =>
      (w.zone_id === currentZone || (w.location && locNamesSet.has(w.location.toLowerCase().trim()))) &&
      (w.status === "Ongoing" || w.status === "Pending" || w.status === "Hold")
  );
  const pendingJcs = (store.jobCards || []).filter(
    (j) =>
      j.zone_id === currentZone &&
      (j.status === "Active" || j.status === "Hold")
  );
  const totalPending = pendingWos.length + pendingJcs.length;

  // 4. Calculate locations needing attention (>90 days without maintenance record)
  const now = Date.now();
  let dueAttentionCount = 0;
  zoneLocations.forEach((loc) => {
    const locKey = String(loc.id || loc._fbKey);
    const recs = zoneRecords.filter((r) => String(r.location_id) === locKey);
    if (recs.length === 0) {
      dueAttentionCount++;
    } else {
      const latestDate = Math.max(...recs.map((r) => new Date(r.date || 0).getTime()));
      if (now - latestDate > 90 * 24 * 60 * 60 * 1000) {
        dueAttentionCount++;
      }
    }
  });

  // Update KPI counters
  const totalLocsEl = document.getElementById("lmdStatTotalLocs");
  if (totalLocsEl) totalLocsEl.textContent = zoneLocations.length;

  const recentAttEl = document.getElementById("lmdStatRecentAttended");
  if (recentAttEl) recentAttEl.textContent = recentAttendedCount;

  const pendingEl = document.getElementById("lmdStatPendingJobs");
  if (pendingEl) pendingEl.textContent = totalPending;

  const dueEl = document.getElementById("lmdStatDueAttention");
  if (dueEl) dueEl.textContent = dueAttentionCount;

  const locBadge = document.getElementById("lmdLocCountBadge");
  if (locBadge) locBadge.textContent = zoneLocations.length;

  // Render sub-views
  renderLmdDashboard();
  renderLocationsList();
}

function renderLmdDashboard() {
  const currentZone = store.currentZone;
  const zoneLocations = (store.locations || []).filter(
    (l) => l.zone_id === currentZone
  );
  const locMap = {};
  zoneLocations.forEach((l) => {
    locMap[String(l.id)] = `${l.building_name} — ${l.sub_location || "General"}`;
    locMap[String(l._fbKey)] = `${l.building_name} — ${l.sub_location || "General"}`;
  });

  const recentSearch = (document.getElementById("lmdRecentSearch")?.value || "").toLowerCase().trim();
  const pendingSearch = (document.getElementById("lmdPendingSearch")?.value || "").toLowerCase().trim();

  // --- RECENTLY ATTENDED JOBS ---
  const attendedContainer = document.getElementById("lmdRecentlyAttendedList");
  const attendedBadge = document.getElementById("lmdRecentAttendedBadge");

  let attendedItems = [];

  // A. From maintenance records
  (store.maintenanceRecords || []).forEach((r) => {
    const locName = locMap[String(r.location_id)];
    if (locName) {
      attendedItems.push({
        type: "record",
        maint_type: r.maintenance_type || "Routine",
        location: locName,
        date: r.date || "",
        description: r.description || "Maintenance service completed",
        job_number: r.job_number || null,
        cost: 0,
        timestamp: new Date(r.date || 0).getTime()
      });
    }
  });

  // B. From completed Job Cards in this zone
  (store.jobCards || []).forEach((jc) => {
    if (jc.zone_id === currentZone && (jc.status === "Completed" || jc.completed_date)) {
      attendedItems.push({
        type: "job_card",
        maint_type: "Job Card",
        location: jc.location || "Zone Facility",
        date: jc.completed_date || jc.start_date || "",
        description: jc.description || "Completed Job Card",
        job_number: jc.job_number || null,
        cost: jc.total_material_cost || 0,
        timestamp: new Date(jc.completed_date || jc.start_date || 0).getTime()
      });
    }
  });

  // Sort descending by date
  attendedItems.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  if (recentSearch) {
    attendedItems = attendedItems.filter(
      (item) =>
        item.location.toLowerCase().includes(recentSearch) ||
        item.description.toLowerCase().includes(recentSearch) ||
        (item.job_number && item.job_number.toLowerCase().includes(recentSearch)) ||
        item.maint_type.toLowerCase().includes(recentSearch)
    );
  }

  if (attendedBadge) attendedBadge.textContent = attendedItems.length;

  if (attendedContainer) {
    if (attendedItems.length === 0) {
      attendedContainer.innerHTML = `
        <div class="text-center py-10 text-slate-400">
          <span class="text-3xl block mb-2">📋</span>
          <p class="text-xs font-semibold text-slate-500">No recently attended jobs found in this zone.</p>
          <p class="text-[10px] text-slate-400 mt-0.5">Completed Job Cards & maintenance records will appear here.</p>
        </div>
      `;
    } else {
      const typeColors = {
        Repair: "bg-rose-100 text-rose-800 border-rose-200 font-bold",
        Preventive: "bg-blue-100 text-blue-800 border-blue-200",
        Emergency: "bg-red-200 text-red-900 border-red-300 font-bold",
        Routine: "bg-teal-100 text-teal-800 border-teal-200",
        Upgrade: "bg-purple-100 text-purple-800 border-purple-200",
        "Job Card": "bg-emerald-100 text-emerald-800 border-emerald-200 font-bold"
      };

      attendedContainer.innerHTML = attendedItems
        .map((item) => {
          const badgeCls = typeColors[item.maint_type] || "bg-slate-100 text-slate-700 border-slate-200";
          return `
            <div class="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/80 transition-all shadow-xs">
              <div class="flex items-start justify-between gap-2 mb-1.5">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-xs font-bold text-slate-800 flex items-center gap-1">
                    📍 ${item.location}
                  </span>
                  <span class="px-2 py-0.5 rounded text-[10px] border ${badgeCls}">${item.maint_type}</span>
                </div>
                <span class="font-mono text-[11px] font-semibold text-slate-500 whitespace-nowrap bg-slate-100 px-2 py-0.5 rounded">
                  🗓️ ${item.date || "—"}
                </span>
              </div>
              <p class="text-xs text-slate-600 leading-relaxed">${item.description}</p>
              <div class="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                ${item.job_number ? `<span class="font-mono font-bold text-indigo-600">🔗 ${item.job_number}</span>` : `<span class="text-slate-400">Regular Log</span>`}
                ${item.cost > 0 ? `<span class="font-mono font-bold text-emerald-700">Cost: ${formatCurrency(item.cost)}</span>` : ""}
              </div>
            </div>
          `;
        })
        .join("");
    }
  }

  // --- PENDING & DUE MAINTENANCE JOBS ---
  const pendingContainer = document.getElementById("lmdPendingJobsList");
  const pendingBadge = document.getElementById("lmdPendingJobsBadge");

  let pendingItems = [];

  // A. Work Orders in this zone (Ongoing/Pending)
  (store.workOrders || []).forEach((wo) => {
    if (wo.zone_id === currentZone && (wo.status === "Ongoing" || wo.status === "Pending" || wo.status === "Hold")) {
      pendingItems.push({
        id: wo.id || wo._fbKey,
        type: "work_order",
        title: wo.description || "Work Order",
        location: wo.location || "Zone Location",
        status: wo.status || "Pending",
        priority: wo.priority || "Medium",
        ref: wo.reference_no || wo.type || "WO",
        progress: wo.progress || 0,
        assigned_count: (wo.assigned || []).length,
        date: wo.date || ""
      });
    }
  });

  // B. Active Job Cards in this zone
  (store.jobCards || []).forEach((jc) => {
    if (jc.zone_id === currentZone && (jc.status === "Active" || jc.status === "Hold")) {
      pendingItems.push({
        id: jc.id || jc._fbKey,
        type: "job_card",
        title: jc.description || "Job Card",
        location: jc.location || "Zone Location",
        status: jc.status || "Active",
        priority: "High",
        ref: jc.job_number || "JC",
        progress: 50,
        assigned_count: 0,
        date: jc.start_date || ""
      });
    }
  });

  if (pendingSearch) {
    pendingItems = pendingItems.filter(
      (item) =>
        item.location.toLowerCase().includes(pendingSearch) ||
        item.title.toLowerCase().includes(pendingSearch) ||
        item.ref.toLowerCase().includes(pendingSearch)
    );
  }

  if (pendingBadge) pendingBadge.textContent = pendingItems.length;

  if (pendingContainer) {
    if (pendingItems.length === 0) {
      pendingContainer.innerHTML = `
        <div class="text-center py-10 text-slate-400">
          <span class="text-3xl block mb-2">✨</span>
          <p class="text-xs font-semibold text-slate-500">All maintenance tasks attended!</p>
          <p class="text-[10px] text-slate-400 mt-0.5">No pending or overdue work orders in this zone.</p>
        </div>
      `;
    } else {
      const priorityColors = {
        High: "bg-rose-100 text-rose-800 border-rose-200 font-bold",
        Medium: "bg-amber-100 text-amber-800 border-amber-200",
        Low: "bg-blue-100 text-blue-800 border-blue-200"
      };

      pendingContainer.innerHTML = pendingItems
        .map((item) => {
          const pCls = priorityColors[item.priority] || "bg-slate-100 text-slate-700 border-slate-200";
          return `
            <div class="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/30 hover:bg-amber-50/70 transition-all shadow-xs">
              <div class="flex items-start justify-between gap-2 mb-1.5">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-xs font-bold text-slate-800 flex items-center gap-1">
                    📍 ${item.location}
                  </span>
                  <span class="px-2 py-0.5 rounded text-[10px] border ${pCls}">${item.priority}</span>
                  <span class="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-semibold">${item.status}</span>
                </div>
                <span class="font-mono text-[11px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                  ${item.ref}
                </span>
              </div>
              <p class="text-xs text-slate-700 font-medium leading-relaxed">${item.title}</p>
              <div class="flex items-center justify-between mt-2 pt-2 border-t border-amber-200/50 text-[11px]">
                <span class="text-slate-500">
                  ${item.date ? `Started: ${item.date}` : ""} ${item.assigned_count > 0 ? `• 👨‍🔧 ${item.assigned_count} Sailors` : ""}
                </span>
                <button onclick="${item.type === 'work_order' ? `openWorkOrderDetail('${item.id}')` : `switchView('jobcards'); selectJobCard('${item.id}')`}" 
                  class="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-lg font-semibold text-[11px] shadow-xs transition-all">
                  View Job ➜
                </button>
              </div>
            </div>
          `;
        })
        .join("");
    }
  }
}

function renderLocationsList() {
  const container = document.getElementById("locationsList");
  if (!container) return;

  const groupedLocations = {};
  const zoneLocations = (store.locations || []).filter(
    (l) => l.zone_id === store.currentZone
  );

  zoneLocations.forEach((loc) => {
    if (!groupedLocations[loc.building_name]) {
      groupedLocations[loc.building_name] = [];
    }
    groupedLocations[loc.building_name].push(loc);
  });

  if (zoneLocations.length === 0) {
    container.innerHTML = '<p class="text-slate-400 text-center py-8 text-xs">No locations registered in this zone. Click "+ Add Location" above.</p>';
    return;
  }

  container.innerHTML = Object.entries(groupedLocations)
    .map(
      ([building, locs]) => `
      <div class="border-b border-slate-100">
          <div class="px-3.5 py-2.5 font-bold text-slate-700 text-xs flex items-center justify-between"
              style="background:rgba(15,32,64,0.03)">
              <div class="flex items-center gap-1.5 truncate">
                <span>🏢</span>
                <span class="truncate">${building}</span>
              </div>
              <span class="text-[10px] text-slate-400 font-semibold">${locs.length} sub-loc</span>
          </div>
          ${locs
            .map((loc) => {
              const locId = loc.id || loc._fbKey;
              const recs = (store.maintenanceRecords || []).filter(
                (r) => String(r.location_id) === String(locId)
              );
              const isSelected = String(store.selectedLocation) === String(locId);
              return `
              <div class="px-3.5 py-2 pl-7 hover:bg-teal-50 cursor-pointer text-xs flex items-center justify-between group transition-colors
                  ${isSelected ? "bg-teal-100/80 border-l-4 border-teal-600 font-bold text-teal-900" : "text-slate-600"}"
                  onclick="selectLocation('${locId}')">
                  <span class="truncate">📍 ${loc.sub_location || "General"}</span>
                  ${recs.length > 0 ? `<span class="text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full font-bold font-mono">${recs.length}</span>` : ""}
              </div>`;
            })
            .join("")}
      </div>
  `
    )
    .join("");
}

function selectLocation(id) {
  store.selectedLocation = id;
  const loc = (store.locations || []).find((l) => String(l.id) === String(id) || String(l._fbKey) === String(id));
  if (!loc) return;

  const locId = loc.id || loc._fbKey;
  const records = (store.maintenanceRecords || []).filter((r) => String(r.location_id) === String(locId));

  document.getElementById("selectedLocationName").textContent = `${loc.building_name} — ${loc.sub_location || "General"}`;
  document.getElementById("selectedLocationZone").textContent = `Zone: ${loc.zone_id}`;

  const lmdBadge = document.getElementById("selectedLocationLmdBadge");
  if (lmdBadge) {
    if (records.length > 0) {
      const sorted = [...records].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      lmdBadge.textContent = `LMD: ${sorted[0].date}`;
      lmdBadge.classList.remove("hidden");
    } else {
      lmdBadge.textContent = "No maintenance recorded";
      lmdBadge.classList.remove("hidden");
    }
  }

  const actionBtns = document.getElementById("locationActionButtons");
  if (actionBtns) actionBtns.style.display = "flex";
  const addMaintBtn = document.getElementById("addMaintenanceBtn");
  if (addMaintBtn) addMaintBtn.style.display = "block";

  const typeColors = {
    Repair: "bg-rose-100 text-rose-700 border-rose-300 font-bold",
    Preventive: "bg-blue-100 text-blue-700 border-blue-300",
    Emergency: "bg-red-200 text-red-800 border-red-400 font-bold",
    Routine: "bg-teal-100 text-teal-700 border-teal-300",
    Upgrade: "bg-purple-100 text-purple-700 border-purple-300",
  };

  document.getElementById("maintenanceHistory").innerHTML = records.length
    ? `
      <div class="space-y-3">
          ${records
            .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
            .map(
              (r) => `
              <div class="p-4 rounded-xl border border-slate-200 transition-all hover:shadow-sm bg-white"
                  style="border-left: 4px solid #0d9488;">
                  <div class="flex justify-between items-start mb-2">
                      <span class="text-xs font-semibold px-2 py-0.5 rounded-full border ${typeColors[r.maintenance_type] || "bg-slate-100 text-slate-600"}">${r.maintenance_type}</span>
                      <span class="text-xs font-mono font-bold text-slate-500">${r.date}</span>
                  </div>
                  <p class="text-xs text-slate-700 leading-relaxed">${r.description}</p>
                  ${r.job_number ? `<p class="text-[11px] text-teal-700 mt-2 font-bold font-mono">🔗 ${r.job_number}</p>` : ""}
              </div>
          `
            )
            .join("")}
      </div>
  `
    : `
      <div class="text-center py-12">
          <div class="text-4xl mb-3">📋</div>
          <p class="text-slate-500 font-bold text-sm">No maintenance records yet</p>
          <p class="text-slate-400 text-xs mt-1">Click "+ Add Record" above to log the first maintenance entry for this location.</p>
      </div>`;

  renderLocationsList();
}
function searchLocations() {
  const query = document.getElementById("locationSearch").value.toLowerCase();
  const container = document.getElementById("locationsList");
  const filteredLocations = store.locations.filter(
    (l) =>
      l.zone_id === store.currentZone &&
      (l.building_name.toLowerCase().includes(query) ||
        (l.sub_location && l.sub_location.toLowerCase().includes(query))),
  );
  const groupedLocations = {};
  filteredLocations.forEach((loc) => {
    if (!groupedLocations[loc.building_name])
      groupedLocations[loc.building_name] = [];
    groupedLocations[loc.building_name].push(loc);
  });
  container.innerHTML =
    Object.entries(groupedLocations)
      .map(
        ([building, locs]) => `
        <div class="border-b border-slate-100">
            <div class="px-3 py-2.5 font-semibold text-slate-700 text-xs flex items-center gap-2"
                style="background:rgba(15,32,64,0.04)">
                🏢 <span>${building}</span>
            </div>
            ${locs
              .map((loc) => {
                const recCount = store.maintenanceRecords.filter(
                  (r) => r.location_id === loc.id,
                ).length;
                return `
                <div class="px-3 py-2 pl-7 hover:bg-teal-50 cursor-pointer text-sm flex items-center justify-between transition-colors"
                    onclick="selectLocation('${loc.id}')">
                    <span class="text-slate-600">📍 ${loc.sub_location || "General"}</span>
                    ${recCount > 0 ? `<span class="text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full">${recCount}</span>` : ""}
                </div>`;
              })
              .join("")}
        </div>
    `,
      )
      .join("") ||
    '<p class="text-slate-400 text-center py-6 text-sm">No locations found</p>';
}
function openAddLocationModal() {
  const titleEl = document.getElementById("locationModalTitle");
  if (titleEl) titleEl.textContent = "Add Location";
  const idEl = document.getElementById("locId");
  if (idEl) idEl.value = "";
  const keyEl = document.getElementById("locFbKey");
  if (keyEl) keyEl.value = "";
  document.getElementById("locZone").value = store.currentZone;
  document.getElementById("locBuilding").value = "";
  document.getElementById("locSubLocation").value = "";
  document.getElementById("locDescription").value = "";
  document.getElementById("addLocationModal").classList.remove("hidden");
}
function editLocation() {
  if (!store.selectedLocation) return;
  const loc = store.locations.find((l) => l.id === store.selectedLocation);
  if (!loc) return;
  const titleEl = document.getElementById("locationModalTitle");
  if (titleEl) titleEl.textContent = "Edit Location";
  const idEl = document.getElementById("locId");
  if (idEl) idEl.value = loc.id;
  const keyEl = document.getElementById("locFbKey");
  if (keyEl) keyEl.value = loc._fbKey || "";
  document.getElementById("locZone").value = loc.zone_id || store.currentZone;
  document.getElementById("locBuilding").value = loc.building_name || "";
  document.getElementById("locSubLocation").value = loc.sub_location || "";
  document.getElementById("locDescription").value = loc.description || "";
  document.getElementById("addLocationModal").classList.remove("hidden");
}
function deleteLocation() {
  if (!store.selectedLocation) return;
  const loc = store.locations.find((l) => l.id === store.selectedLocation);
  if (!loc) return;
  if (
    !confirm(
      `Are you sure you want to delete the location "${loc.building_name} — ${loc.sub_location || "General"}"? This will also delete all its maintenance records.`,
    )
  ) {
    return;
  }
  opsDB
    .ref(`locations/${loc._fbKey}`)
    .remove()
    .then(() => {
      // Delete linked maintenance records
      const linkedRecords = store.maintenanceRecords.filter(
        (r) => r.location_id === loc.id,
      );
      linkedRecords.forEach((r) => {
        if (r._fbKey) {
          opsDB.ref(`maintenance_records/${r._fbKey}`).remove();
        }
      });
      showToast("Location and its records deleted successfully!");
      store.selectedLocation = null;
      document.getElementById("selectedLocationName").textContent =
        "Select a Location";
      document.getElementById("selectedLocationZone").textContent = "";
      const actionBtns = document.getElementById("locationActionButtons");
      if (actionBtns) actionBtns.style.display = "none";
      document.getElementById("maintenanceHistory").innerHTML =
        '<p class="text-slate-500 text-center py-8">Select a location to view maintenance history</p>';
      renderLocationsList();
    })
    .catch((err) => {
      console.error(err);
      showToast("Error deleting location", "error");
    });
}
function autofillLocationDetails(buildingName) {
  if (!buildingName) return;
  const loc = store.locations.find(
    (l) => l.zone_id === store.currentZone && l.building_name === buildingName,
  );
  if (loc) {
    document.getElementById("woSubLocation").value = loc.sub_location || "";
    const descInput = document.getElementById("woDescription");
    if (descInput && !descInput.value.trim()) {
      descInput.value = loc.description || "";
    }
  }
}
function saveLocation(event) {
  event.preventDefault();
  const idVal = document.getElementById("locId").value;
  const fbKeyVal = document.getElementById("locFbKey").value;
  const locData = {
    zone_id: document.getElementById("locZone").value,
    building_name: document.getElementById("locBuilding").value,
    sub_location: document.getElementById("locSubLocation").value,
    end_user: document.getElementById("locEndUser")?.value || "",
    description: document.getElementById("locDescription").value,
  };
  if (fbKeyVal) {
    locData._fbKey = fbKeyVal;
    locData.id = parseInt(idVal, 10) || Date.now();
  } else {
    const validIds = (store.locations || [])
      .map((l) => parseInt(l.id, 10))
      .filter((n) => !Number.isNaN(n) && Number.isFinite(n));
    const maxId = validIds.length > 0 ? Math.max(...validIds) : 0;
    locData.id = maxId + 1;
  }
  fbSaveLocation(locData)
    .then(() => {
      closeModal("addLocationModal");
      showToast(
        fbKeyVal
          ? "Location updated successfully!"
          : "Location added successfully!",
      );
      document.getElementById("locId").value = "";
      document.getElementById("locFbKey").value = "";
      document.getElementById("locBuilding").value = "";
      document.getElementById("locSubLocation").value = "";
      if (document.getElementById("locEndUser")) {
        document.getElementById("locEndUser").value = "";
      }
      document.getElementById("locDescription").value = "";
      if (typeof updateSelectedZoneLocationsView === "function") {
        updateSelectedZoneLocationsView();
      }
      if (typeof renderSettingsZoneSelectorList === "function") {
        renderSettingsZoneSelectorList();
      }
      if (typeof populateEstLocationsDatalist === "function") {
        populateEstLocationsDatalist();
      }
      if (fbKeyVal && store.selectedLocation === locData.id) {
        selectLocation(locData.id);
      } else {
        renderLocationsList();
      }
    })
    .catch((err) => {
      console.error(err);
      showToast("Error saving location!", "error");
    });
}
function addMaintenanceRecord() {
  if (!store.selectedLocation) {
    showToast("Select a location first", "info");
    return;
  }
  document.getElementById("mrType").value = "Repair";
  document.getElementById("mrDescription").value = "";
  document.getElementById("mrDate").value = new Date()
    .toISOString()
    .split("T")[0];
  document.getElementById("mrJobNumber").value = "";
  document.getElementById("maintenanceRecordModal").classList.remove("hidden");
}
function saveMaintenanceRecord(event) {
  event.preventDefault();
  if (!store.selectedLocation) {
    showToast("No location selected", "error");
    return;
  }
  const newRecord = {
    id: store.maintenanceRecords.length
      ? Math.max(...store.maintenanceRecords.map((r) => r.id)) + 1
      : 1,
    location_id: store.selectedLocation,
    job_card_id: null,
    maintenance_type: document.getElementById("mrType").value,
    description: document.getElementById("mrDescription").value,
    date: document.getElementById("mrDate").value,
    job_number: document.getElementById("mrJobNumber").value || null,
  };
  store.maintenanceRecords.push(newRecord);
  closeModal("maintenanceRecordModal");
  selectLocation(store.selectedLocation); // refresh history panel
  showToast("Maintenance record added!");
}

function normalizeLocationsCsvHeader(h) {
  const clean = h.trim().toLowerCase();
  if (clean.includes("zone") || clean === "zone_id") {
    return "zone";
  }
  if (
    clean.includes("building") ||
    clean.includes("location 1") ||
    clean === "location1" ||
    clean === "location" ||
    clean === "building_name" ||
    clean === "building name" ||
    clean === "facility"
  ) {
    return "building name";
  }
  if (
    clean.includes("location 2") ||
    clean.includes("location2") ||
    clean.includes("sub-location") ||
    clean.includes("sub_location") ||
    clean.includes("sublocation") ||
    clean.includes("branch") ||
    clean.includes("room")
  ) {
    return "sub-location";
  }
  if (
    clean.includes("end user") ||
    clean.includes("end_user") ||
    clean.includes("occupant") ||
    clean.includes("department") ||
    clean === "dept"
  ) {
    return "end user";
  }
  if (
    clean.includes("description") ||
    clean === "desc" ||
    clean.includes("note")
  ) {
    return "description";
  }
  return clean;
}

function downloadLocationsCsvTemplate() {
  const csvContent =
    "Zone,Location,Location 2,End User,Description\n" +
    "A-Zone,Wardroom Building,Ground Floor,Officers Wardroom / Mess Sec,Dining & Lounge\n" +
    "A-Zone,Wardroom Building,First Floor,Officers Living Quarters,12 Rooms\n" +
    "BC-Zone,Junior Rates Mess,Kitchen,Mess Committee,Dining Hall & Cooking Area\n" +
    "Carpentry-Shop,Main Workshop,Timber Store,Workshop Incharge,Wood Cutting & Storage\n";
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.setAttribute("hidden", "");
  a.setAttribute("href", url);
  a.setAttribute("download", "zone_locations_template.csv");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function exportLocationsCsv() {
  const zid = _cfgSelectedZone || "ALL";
  let locs = store.locations || [];
  if (zid !== "ALL") {
    locs = locs.filter((l) => l.zone_id === zid);
  }
  if (locs.length === 0) {
    showToast("No locations to export for this zone", "info");
    return;
  }
  let csvContent = "\uFEFFZone,Location,Location 2,End User,Description\n";
  locs.forEach((l) => {
    const zone = `"${(l.zone_id || "").replace(/"/g, '""')}"`;
    const loc1 = `"${(l.building_name || l.name || "").replace(/"/g, '""')}"`;
    const loc2 = `"${(l.sub_location || l.location2 || "").replace(/"/g, '""')}"`;
    const endUser = `"${(l.end_user || "").replace(/"/g, '""')}"`;
    const desc = `"${(l.description || "").replace(/"/g, '""')}"`;
    csvContent += `${zone},${loc1},${loc2},${endUser},${desc}\n`;
  });
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.setAttribute("hidden", "");
  a.setAttribute("href", url);
  a.setAttribute(
    "download",
    `Zone_Locations_${zid}_${new Date().toISOString().split("T")[0]}.csv`,
  );
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast("Locations exported to CSV successfully!");
}

// Global print listeners to guarantee summary container expands across all pages
window.addEventListener("beforeprint", () => {
  const container = document.getElementById("summaryTableScrollContainer");
  if (container) {
    container.dataset.originalMaxH = container.style.maxHeight;
    container.dataset.originalOverflow = container.style.overflow;
    container.style.maxHeight = "none";
    container.style.overflow = "visible";
    container.scrollTop = 0;
  }
});

window.addEventListener("afterprint", () => {
  const container = document.getElementById("summaryTableScrollContainer");
  if (container) {
    container.style.maxHeight = container.dataset.originalMaxH || "";
    container.style.overflow = container.dataset.originalOverflow || "";
  }
});
function openLmdExportModal(action) {
  _lmdExportAction = action;
  let title = "Print / PDF Options";
  if (action === "csv") title = "Export CSV Options";
  else if (action === "pdf") title = "Download PDF Options";
  else if (action === "whatsapp") title = "WhatsApp Share Options";
  document.getElementById("lmdExportModalTitle").textContent = title;
  const zones = [...(store.zones || [])];
  if (!zones.some((z) => isAdminStaffDuties(z.id || z.name))) {
    zones.push({ id: "Admin-&-Staff-Duties", name: "Admin & Staff Duties" });
  }
  document.getElementById("exportZoneSelect").innerHTML = zones
    .map((z) => `<option value="${z.id}">${z.name}</option>`)
    .join("");
  document.querySelector('input[name="exportScope"][value="all"]').checked =
    true;
  toggleExportZoneSelect();
  const scaleWrapper = document.getElementById("exportScaleWrapper");
  if (scaleWrapper) {
    scaleWrapper.classList.toggle("hidden", action !== "print" && action !== "pdf");
  }
  document.getElementById("lmdExportModal").classList.remove("hidden");
}
function toggleExportZoneSelect() {
  const scope = document.querySelector(
    'input[name="exportScope"]:checked',
  ).value;
  document
    .getElementById("exportZoneSelectWrapper")
    .classList.toggle("hidden", scope !== "selected");
}
function executeLmdExport() {
  const scope = document.querySelector(
    'input[name="exportScope"]:checked',
  ).value;
  const selectedZone = document.getElementById("exportZoneSelect").value;
  const scaleSelect = document.getElementById("exportScaleSelect");
  const selectedScale = scaleSelect ? scaleSelect.value : "auto";

  if (_lmdExportAction === "csv") {
    exportLmdCSV(scope, selectedZone);
    closeModal("lmdExportModal");
  } else if (_lmdExportAction === "whatsapp") {
    // Share first to keep user gesture activation, then close modal
    shareLmdWhatsApp(scope, selectedZone);
    closeModal("lmdExportModal");
  } else if (_lmdExportAction === "pdf") {
    downloadWorkOrdersPdfBackup(scope === "all" ? "all" : selectedZone, selectedScale);
    closeModal("lmdExportModal");
  } else {
    printLmdDetails(scope, selectedZone, selectedScale);
    closeModal("lmdExportModal");
  }
}
function exportLmdCSV(scope, selectedZone) {
  const today = getLocalDateString();
  const dateVal = store.dashboardDate || today;
  let zones = [];
  if (scope === "all") {
    zones = [...(store.zones || [])];
    if (!zones.some((z) => isAdminStaffDuties(z.id || z.name))) {
      zones.push({ id: "Admin-&-Staff-Duties", name: "Admin & Staff Duties" });
    }
  } else {
    const targetZone = selectedZone || store.currentZone;
    const z = (store.zones || []).find((x) => isZoneMatch(x.id, targetZone) || isZoneMatch(x.name, targetZone));
    if (z) {
      zones.push(z);
    } else if (targetZone) {
      zones.push({ id: targetZone, name: formatZoneDisplayName(targetZone) || targetZone });
    }
  }

  const isAll = scope === "all";
  const targetZone = selectedZone || store.currentZone;
  const displayZoneName = isAll ? "ALL ZONES" : (formatZoneDisplayName(targetZone) || targetZone || "Zone");
  const safeZone = String(displayZoneName).replace(/[/\\:*?"<>|]/g, "").trim();
  const safeDate = String(dateVal).replace(/[/\\:*?"<>|]/g, "-").trim();
  const csvFileName = `${safeZone} - Daily Details - ${safeDate}.csv`;

  let csvContent = "Ser No,Rank,Name,Service Type,Service No,Trade\n";
  zones.forEach((z) => {
    const wos = getDailyDetailsWorksForZone(z, dateVal);
    const seenSailorKeysInZone = new Set();
    let zoneHasAllocations = false;
    let zoneRows = "";

    wos.forEach((wo) => {
      const { sailors } = getWorkOrderAssignedSailors(wo, dateVal);
      const uniqueSailors = (sailors || []).filter((s) => {
        const sKey = String(s.id || s._fbKey || s.official_number || s.service_no || s.name || "");
        if (!sKey || seenSailorKeysInZone.has(sKey)) return false;
        seenSailorKeysInZone.add(sKey);
        return true;
      });

      if (uniqueSailors.length > 0) {
        zoneHasAllocations = true;
        const workTitle = (wo.description || wo.title || wo.reference_no || wo.job_no || "Active Work").trim();
        zoneRows += `,,● ${workTitle.toUpperCase()},,,\n`;
        uniqueSailors.forEach((s, idx) => {
          const serNo = String(idx + 1).padStart(2, "0");
          const parsedOffNo = parseOfficialNumber(
            s.official_number || s.service_no || s.offNo || ""
          );
          const row = [
            serNo,
            s.rank || "AB",
            s.name || "",
            parsedOffNo.type,
            parsedOffNo.num,
            s.trade || "—",
          ]
            .map((val) => `"${String(val).replace(/"/g, '""')}"`)
            .join(",");
          zoneRows += row + "\n";
        });
      }
    });

    if (zoneHasAllocations) {
      const zoneDisplayName = formatZoneDisplayName(z.name || z.id) || (z.name || z.id);
      csvContent += `,,=== ZONE: ${zoneDisplayName.toUpperCase()} ===,,,\n`;
      csvContent += zoneRows;
    }
  });

  if (scope === "all") {
    const longTerm = typeof getLongTermAllocations === "function" ? getLongTermAllocations(dateVal) : { housing: [], outProject: [], otherBase: [] };
    const appendLongTermToCsv = (catTitle, list) => {
      if (!list || list.length === 0) return;
      const grouped = {};
      list.forEach((item) => {
        if (!item || !item.sailor) return;
        const s = item.sailor;
        if (typeof isSailorOnLeaveOnDate === "function" && isSailorOnLeaveOnDate(s, dateVal)) return;
        const p = item.projectName || "General Deployment";
        if (!grouped[p]) grouped[p] = [];
        grouped[p].push(s);
      });
      const projs = Object.keys(grouped);
      if (projs.length === 0) return;
      csvContent += `,,=== ${catTitle.toUpperCase()} ===,,,\n`;
      projs.forEach((pName) => {
        csvContent += `,,● PROJECT: ${pName.toUpperCase()},,,\n`;
        grouped[pName].forEach((s, idx) => {
          const serNo = String(idx + 1).padStart(2, "0");
          const parsedOffNo = parseOfficialNumber(s.official_number || s.service_no || s.offNo || "");
          const row = [
            serNo,
            s.rank || "AB",
            s.name || "",
            parsedOffNo.type,
            parsedOffNo.num,
            s.trade || "—",
          ]
            .map((val) => `"${String(val).replace(/"/g, '""')}"`)
            .join(",");
          csvContent += row + "\n";
        });
      });
    };
    appendLongTermToCsv("HOUSING PROJECTS", longTerm.housing);
    appendLongTermToCsv("OUT PROJECTS", longTerm.outProject);
    appendLongTermToCsv("OTHER BASE", longTerm.otherBase);
  }

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", csvFileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  try {
    URL.revokeObjectURL(url);
  } catch (e) {}
  showToast(`CSV downloaded: ${csvFileName}`);
}
// ── SAILOR CLASSIFICATION FOR ZONE DAILY DETAILS SUMMARY TABLE ──
function classifySailorForSummary(s, isInCharge) {
  if (!s) return "MA";

  const rawOffNo = String(s.official_number || s.service_no || s.offNo || "").trim();
  const parsedOffNo = typeof parseOfficialNumber === "function" ? parseOfficialNumber(rawOffNo) : { type: "", num: "" };
  const offType = (parsedOffNo.type || "").toUpperCase().trim();
  const rawUpper = rawOffNo.toUpperCase().trim();
  const catUpper = String(s.category || "").toUpperCase().trim();

  const r = (s.rank || "").toUpperCase().trim();
  const t = (s.trade || "").toUpperCase().trim();

  // Helper to extract standard civil trade code (CA, MA, PA, AL, SW, PL, WE, BB, WR)
  const extractTradeCode = (str) => {
    if (!str) return "";
    const clean = str.toUpperCase().trim();
    if (clean === "CA" || clean.includes("CARP") || /\bCA\b|\/CA\b|\(CA\)|POCA/.test(clean)) return "CA";
    if (clean === "PA" || clean.includes("PAINT") || /\bPA\b|\/PA\b|\(PA\)|POPA/.test(clean)) return "PA";
    if (clean === "MA" || clean.includes("MASON") || /\bMA\b|\/MA\b|\(MA\)|POMA/.test(clean)) return "MA";
    if (clean === "AL" || clean.includes("ALUM") || /\bAL\b|\/AL\b|\(AL\)|POAL/.test(clean)) return "AL";
    if (clean === "SW" || clean.includes("SIGN") || /\bSW\b|\/SW\b|\(SW\)|POSW/.test(clean)) return "SW";
    if (clean === "PL" || clean.includes("PLUMB") || /\bPL\b|\/PL\b|\(PL\)|POPL/.test(clean)) return "PL";
    if (clean === "WE" || clean === "WEL" || clean === "WL" || clean.includes("WELD") || /\bWE\b|\/WE\b|\(WE\)|POWE/.test(clean)) return "WE";
    if (clean === "BB" || clean.includes("BEND") || /\bBB\b|\/BB\b|\(BB\)|POBB/.test(clean)) return "BB";
    if (clean === "WR" || clean === "RW" || clean.includes("WIRE") || clean.includes("ELECT") || /\bWR\b|\/WR\b|\(WR\)|POWR|\bRW\b/.test(clean)) return "WR";
    return "";
  };

  // 1. Volunteer Naval Force (VAS / VSS): Strictly categorized by TRADE only! Never PO / LME.
  const isVas =
    offType === "VAS" ||
    offType === "VSS" ||
    offType === "VNF" ||
    catUpper === "VAS" ||
    catUpper === "VSS" ||
    rawUpper.startsWith("VAS") ||
    rawUpper.startsWith("VSS");

  if (isVas) {
    let tradeCode = extractTradeCode(t);
    if (tradeCode) return tradeCode;

    tradeCode = extractTradeCode(r);
    if (tradeCode) return tradeCode;

    if (t && !["—", "-", "N/A", "NONE", "CE", "LME"].includes(t)) {
      return t;
    }
    return "MA";
  }

  // 2. Regular Force (EC / ME / OD / REC): Categorized by naval rate/rank
  // Check if Official Number explicitly starts with ME, OD, or REC
  if (offType === "ME" || rawUpper.startsWith("ME")) {
    return "ME";
  }
  if (offType === "OD" || offType === "REC" || rawUpper.startsWith("OD") || rawUpper.startsWith("REC")) {
    return "OD/REC";
  }

  // (a) Senior Sailor rates: PO, CPO, FCPO, MCPO, MCA
  if (
    r.includes("PO") ||
    r.includes("CHIEF") ||
    r.includes("MCA") ||
    r.includes("S/S") ||
    (r.includes("CA") && (r.includes("CE") || r.includes("CHIEF")))
  ) {
    return "PO";
  }

  // (b) Leading rate: LME
  if (r.includes("LME") || t === "LME") {
    return "LME";
  }

  // (c) Mechanic rate: ME / SME
  if (r === "ME" || r === "SME" || (r.includes("ME") && !r.includes("LME")) || t === "ME" || t === "SME") {
    return "ME";
  }

  // (d) Ordinary / Recruit / Junior rate: OD / REC / OJT / AB
  if (
    r.includes("OD") ||
    r.includes("REC") ||
    r.includes("OJT") ||
    r.includes("AB") ||
    r.includes("SMN") ||
    r.includes("SEAMAN") ||
    t.includes("OD") ||
    t.includes("REC")
  ) {
    return "OD/REC";
  }

  // (e) In-charge fallback for Regular Force
  if (isInCharge) {
    return "PO";
  }

  // (f) Non-VAS artisan with explicit trade
  const nonVasTrade = extractTradeCode(t) || extractTradeCode(r);
  if (nonVasTrade) {
    return nonVasTrade;
  }

  // Default for Regular / EC
  return "LME";
}

function buildDailyDetailsReportData(scope, selectedZone) {
  const today = getLocalDateString();
  const dateVal = store.dashboardDate || today;
  let zones = [];
  if (scope === "all") {
    zones = [...(store.zones || [])];
    if (!zones.some((z) => isAdminStaffDuties(z.id || z.name))) {
      zones.push({ id: "Admin-&-Staff-Duties", name: "Admin & Staff Duties" });
    }
  } else {
    const targetZone = selectedZone || store.currentZone;
    const z = (store.zones || []).find((x) => isZoneMatch(x.id, targetZone) || isZoneMatch(x.name, targetZone));
    if (z) {
      zones.push(z);
    } else if (targetZone) {
      zones.push({ id: targetZone, name: formatZoneDisplayName(targetZone) || targetZone });
    }
  }

  // Summary counts for all unique sailors in the report
  const seenReportSailorKeys = new Set();
  const reportSailorCounts = {
    PO: 0, LME: 0, ME: 0, "OD/REC": 0, MA: 0, PA: 0, CA: 0, AL: 0, SW: 0, PL: 0, WE: 0, BB: 0, WR: 0
  };
  let totalReportStrength = 0;

  let rowsHtml = "";
  zones.forEach((z) => {
    const wos = getDailyDetailsWorksForZone(z, dateVal);
    const seenSailorKeysInZone = new Set();
    let zoneRowsHtml = "";

    wos.forEach((wo) => {
      const { sailors } = getWorkOrderAssignedSailors(wo, dateVal);
      const uniqueSailors = (sailors || []).filter((s) => {
        const sKey = String(s.id || s._fbKey || s.official_number || s.service_no || s.name || "");
        if (!sKey || seenSailorKeysInZone.has(sKey)) return false;
        seenSailorKeysInZone.add(sKey);
        return true;
      });

      if (uniqueSailors.length > 0) {
        const isActualInCharge = (wo.description || "").toLowerCase().trim() === "in charge" || (wo.title || "").toLowerCase().trim() === "in charge";
        const rawWorkTitle = (wo.description || wo.title || wo.reference_no || wo.job_no || "Active Work").trim();
        const displayWorkTitle = /^[\x00-\x7F]+$/.test(rawWorkTitle) ? rawWorkTitle.toUpperCase() : rawWorkTitle;
        zoneRowsHtml += `
          <tr style="background-color: #f1f5f9; font-weight: bold; page-break-inside: avoid; break-inside: avoid;">
            <td colspan="6" style="text-align: center; text-decoration: underline; font-size: 10.5px; padding: 4px 6px; letter-spacing: normal; color: #334155;">
              📋 ${escapeHtml(displayWorkTitle)}
            </td>
          </tr>
        `;
        uniqueSailors.forEach((s, idx) => {
          const serNo = String(idx + 1).padStart(2, "0");
          const parsedOffNo = parseOfficialNumber(
            s.official_number || s.service_no || s.offNo || ""
          );
          zoneRowsHtml += `
            <tr style="page-break-inside: avoid; break-inside: avoid;">
              <td style="text-align:center;">${serNo}</td>
              <td>${escapeHtml(s.rank || "AB")}</td>
              <td>${escapeHtml(s.name || "")}</td>
              <td style="text-align:center;">${escapeHtml(parsedOffNo.type)}</td>
              <td>${escapeHtml(parsedOffNo.num)}</td>
              <td style="text-align:center;">${escapeHtml(s.trade || "—")}</td>
            </tr>
          `;

          // Tally unique sailors for the strength summary table
          const sKey = String(s.id || s._fbKey || s.official_number || s.service_no || s.name || "");
          if (sKey && !seenReportSailorKeys.has(sKey)) {
            seenReportSailorKeys.add(sKey);
            const col = classifySailorForSummary(s, isActualInCharge);
            if (reportSailorCounts[col] !== undefined) {
              reportSailorCounts[col]++;
            } else {
              reportSailorCounts[col] = 1;
            }
            totalReportStrength++;
          }
        });
      }
    });

    if (zoneRowsHtml) {
      const rawZoneDisplayName = formatZoneDisplayName(z.name || z.id) || (z.name || z.id);
      const displayZone = /^[\x00-\x7F]+$/.test(rawZoneDisplayName) ? rawZoneDisplayName.toUpperCase() : rawZoneDisplayName;
      rowsHtml += `
        <tr style="background-color: #0f172a; color: white; font-weight: bold; page-break-inside: avoid; break-inside: avoid;">
          <td colspan="6" style="padding: 6px 10px; font-size: 12px; letter-spacing: normal;">
            🗺️ ZONE: ${escapeHtml(displayZone)}
          </td>
        </tr>
        ${zoneRowsHtml}
      `;
    }
  });

  if (scope === "all") {
    const longTerm = typeof getLongTermAllocations === "function" ? getLongTermAllocations(dateVal) : { housing: [], outProject: [], otherBase: [] };
    const appendLongTermPrint = (catTitle, icon, list) => {
      if (!list || list.length === 0) return;
      const grouped = {};
      list.forEach((item) => {
        if (!item || !item.sailor) return;
        const s = item.sailor;
        if (typeof isSailorOnLeaveOnDate === "function" && isSailorOnLeaveOnDate(s, dateVal)) return;
        const p = item.projectName || "General Deployment";
        if (!grouped[p]) grouped[p] = [];
        grouped[p].push(s);
      });
      const projs = Object.keys(grouped);
      if (projs.length === 0) return;

      let catRowsHtml = "";
      projs.forEach((pName) => {
        const rawPName = (pName || "").trim();
        const displayPName = /^[\x00-\x7F]+$/.test(rawPName) ? rawPName.toUpperCase() : rawPName;
        catRowsHtml += `
          <tr style="background-color: #f1f5f9; font-weight: bold; page-break-inside: avoid; break-inside: avoid;">
            <td colspan="6" style="text-align: center; text-decoration: underline; font-size: 10.5px; padding: 4px 6px; letter-spacing: normal; color: #334155;">
              📋 PROJECT: ${escapeHtml(displayPName)}
            </td>
          </tr>
        `;
        grouped[pName].forEach((s, idx) => {
          const serNo = String(idx + 1).padStart(2, "0");
          const parsedOffNo = parseOfficialNumber(s.official_number || s.service_no || s.offNo || "");
          catRowsHtml += `
            <tr style="page-break-inside: avoid; break-inside: avoid;">
              <td style="text-align:center;">${serNo}</td>
              <td>${escapeHtml(s.rank || "AB")}</td>
              <td>${escapeHtml(s.name || "")}</td>
              <td style="text-align:center;">${escapeHtml(parsedOffNo.type)}</td>
              <td>${escapeHtml(parsedOffNo.num)}</td>
              <td style="text-align:center;">${escapeHtml(s.trade || "—")}</td>
            </tr>
          `;
          const sKey = String(s.id || s._fbKey || s.official_number || s.service_no || s.name || "");
          if (sKey && !seenReportSailorKeys.has(sKey)) {
            seenReportSailorKeys.add(sKey);
            const col = classifySailorForSummary(s, false);
            if (reportSailorCounts[col] !== undefined) {
              reportSailorCounts[col]++;
            } else {
              reportSailorCounts[col] = 1;
            }
            totalReportStrength++;
          }
        });
      });

      if (catRowsHtml) {
        const displayCatTitle = /^[\x00-\x7F]+$/.test(catTitle) ? catTitle.toUpperCase() : catTitle;
        rowsHtml += `
          <tr style="background-color: #0f172a; color: white; font-weight: bold; page-break-inside: avoid; break-inside: avoid;">
            <td colspan="6" style="padding: 6px 10px; font-size: 12px; letter-spacing: normal;">
              ${icon} ${escapeHtml(displayCatTitle)}
            </td>
          </tr>
          ${catRowsHtml}
        `;
      }
    };
    appendLongTermPrint("HOUSING PROJECTS", "🏠", longTerm.housing);
    appendLongTermPrint("OUT PROJECTS", "🏗️", longTerm.outProject);
    appendLongTermPrint("OTHER BASE", "⚓", longTerm.otherBase);
  }
  if (!rowsHtml) {
    rowsHtml = `<tr><td colspan="6" style="text-align:center; padding: 20px; color: #64748b;">No allocations found for this selection on this date.</td></tr>`;
  }

  // Build dynamic summary table showing ONLY relevant categories for this zone/date
  let summaryHtml = "";
  const STANDARD_SUMMARY_COLS = ["PO", "LME", "ME", "OD/REC", "MA", "PA", "CA", "AL", "SW", "PL", "WE", "BB", "WR"];
  const activeCols = STANDARD_SUMMARY_COLS.filter(col => (reportSailorCounts[col] || 0) > 0);
  Object.keys(reportSailorCounts).forEach(k => {
    if (reportSailorCounts[k] > 0 && !activeCols.includes(k)) {
      activeCols.push(k);
    }
  });

  if (activeCols.length > 0) {
    const colWidth = (100 / (activeCols.length + 1)).toFixed(2);
    const ths = activeCols.map(col => `<th style="width: ${colWidth}%;">${escapeHtml(col)}</th>`).join("") + `<th style="width: ${colWidth}%;" class="summary-total">TOTAL</th>`;
    const tds = activeCols.map(col => `<td>${String(reportSailorCounts[col] || 0).padStart(2, "0")}</td>`).join("") + `<td class="summary-total">${String(totalReportStrength || 0).padStart(2, "0")}</td>`;

    summaryHtml = `
      <!-- ZONE STRENGTH SUMMARY TABLE (DYNAMIC ACTIVE CATEGORIES ONLY) -->
      <div class="daily-details-summary">
        <table>
          <thead>
            <tr>${ths}</tr>
          </thead>
          <tbody>
            <tr>${tds}</tr>
          </tbody>
        </table>
      </div>
    `;
  }

  const isAll = scope === "all";
  const targetZone = selectedZone || store.currentZone;
  const displayZoneName = isAll ? "ALL ZONES" : (formatZoneDisplayName(targetZone) || targetZone || "");
  const safeZone = String(displayZoneName).replace(/[/\\:*?"<>|]/g, "").trim();
  const safeDate = String(dateVal).replace(/[/\\:*?"<>|]/g, "-").trim();
  const printDocTitle = `${safeZone} - Daily Details - ${safeDate}`;
  const pdfFileName = `${safeZone} - Daily Details - ${safeDate}.pdf`;

  const logoUrl = `${window.location.href.split("?")[0].split("#")[0].replace("index.html", "")}logo-crest.png`;

  const bodyContentHtml = `
    <div class="header-container">
        <img class="logo-img" src="${logoUrl}" alt="SLN Crest" onerror="this.src='logo-optimized.png'">
        <div class="header-text">
            <h1>Sri Lanka Navy</h1>
            <h2>Captain Civil Engineering Department (E)</h2>
        </div>
    </div>
    
    <div class="meta-section">
        <div class="meta-left">
            <div>REPORT: DAILY DETAILS REPORT</div>
            <div>SCOPE: ${isAll ? "ALL ZONES" : "ZONE: " + escapeHtml(/^[\x00-\x7F]+$/.test(displayZoneName) ? displayZoneName.toUpperCase() : displayZoneName)}</div>
        </div>
        <div class="meta-right">
            <div>DATE: ${escapeHtml(dateVal)}</div>
            <div>GENERATED BY: NCW OPERATION SYSTEM</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 10%; text-align:center;">Ser No</th>
                <th style="width: 15%;">Rank</th>
                <th style="width: 35%;">Name</th>
                <th style="width: 15%; text-align:center;">Service Type</th>
                <th style="width: 15%;">Service No</th>
                <th style="width: 10%; text-align:center;">Trade</th>
            </tr>
        </thead>
        <tbody>
            ${rowsHtml}
        </tbody>
    </table>
    
    <div class="report-bottom-block" style="page-break-inside: avoid; break-inside: avoid; margin-top: 10px;">
        ${summaryHtml}

        <div class="signature-section">
            <div class="sig-block">
                <p>..................................................</p>
                <p style="font-weight: bold;">PREPARED BY - LME</p>
            </div>
            <div class="sig-block">
                <p>..................................................</p>
                <p style="font-weight: bold;">CHECKED BY (S/S INCHARGE)</p>
            </div>
            <div class="sig-block">
                <p>..................................................</p>
                <p style="font-weight: bold;">CHECKED BY</p>
            </div>
        </div>

        <div class="footer">Generated by NCW Operation System on ${new Date().toLocaleString()}</div>
    </div>
  `;

  return {
    isAll,
    targetZone,
    displayZoneName,
    dateVal,
    printDocTitle,
    pdfFileName,
    totalReportStrength,
    bodyContentHtml
  };
}

function printLmdDetails(scope, selectedZone, initialScale = "auto") {
  const reportData = buildDailyDetailsReportData(scope, selectedZone);
  const { isAll, targetZone, dateVal, printDocTitle, bodyContentHtml } = reportData;

  // Keep parent window document.title synchronized for browser print/PDF export
  updateDocumentTitleDesktop(isAll ? "ALL" : targetZone, dateVal);

  const fullPrintHtml = `<!DOCTYPE html>
        <html><head><meta charset="UTF-8"><title>${escapeHtml(printDocTitle)}</title>
        <style>
            body, table, th, td, div, p, span { font-family: 'Iskoola Pota', 'Nirmala UI', 'Noto Sans Sinhala', 'Segoe UI', Arial, sans-serif; }
            body { color:#000; margin:0; padding:12px; }
            .header-container { display: flex; align-items: center; justify-content: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 10px; }
            .logo-img { height: 50px; margin-right: 14px; }
            .header-text { text-align: left; }
            .header-text h1 { font-size: 17px; font-weight: 800; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
            .header-text h2 { font-size: 10.5px; font-weight: 700; color: #475569; margin: 2px 0 0 0; text-transform: uppercase; letter-spacing: 0.5px; }
            
            .meta-section { display: flex; justify-content: space-between; font-size: 9.5px; color: #334155; margin-bottom: 10px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 10px; border-radius: 5px; }
            .meta-left { font-weight: bold; line-height: 1.4; }
            .meta-right { text-align: right; line-height: 1.4; }
            
            table { width:100%; border-collapse:collapse; font-size:10px; margin-top: 6px; }
            th, td { border:1px solid #94a3b8; padding:4.5px 7px; text-align: left; vertical-align: middle; letter-spacing: normal; line-height: 1.3; }
            th { background:#f1f5f9; color: #1e293b; font-weight: bold; text-transform: uppercase; font-size: 9.5px; }
            
            .daily-details-summary { margin-top: 10px; margin-bottom: 12px; page-break-inside: avoid; break-inside: avoid; }
            .daily-details-summary table { width: 100%; border-collapse: collapse; font-size: 10px; text-align: center; border: 1.5px solid #0f172a; table-layout: fixed; }
            .daily-details-summary th, .daily-details-summary td { border: 1px solid #0f172a; padding: 5px 3px; text-align: center; vertical-align: middle; }
            .daily-details-summary th { background-color: #f8fafc; color: #0f172a; font-weight: 700; font-size: 9.5px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .daily-details-summary td { font-weight: 700; font-size: 10px; color: #0f172a; }
            .daily-details-summary .summary-total { background-color: #f1f5f9; font-weight: 800; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

            .report-bottom-block { page-break-inside: avoid; break-inside: avoid; }
            .signature-section { margin-top: 18px; display: flex; justify-content: space-between; font-size: 10.5px; page-break-inside: avoid; break-inside: avoid; }
            .sig-block { text-align: center; width: 200px; }
            .sig-block p { margin: 2px 0; }
            
            .footer { margin-top: 14px; font-size: 8.5px; color: #64748b; text-align: right; border-top: 1px solid #e2e8f0; padding-top: 6px; }
            @media print { 
                @page { size:A4; margin:8mm 8mm; } 
                body { padding:0; }
                .no-print { display: none !important; }
                .meta-section { background: none; border-color: #94a3b8; }
                .daily-details-summary th, .daily-details-summary td, .daily-details-summary .summary-total { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                tr, .report-bottom-block, .signature-section { page-break-inside: avoid !important; break-inside: avoid !important; }
            }
        </style></head>
        <body>
            <div class="no-print" style="background: #0f172a; color: #fff; padding: 8px 16px; margin: -12px -12px 14px -12px; display: flex; align-items: center; justify-content: space-between; font-family: 'Segoe UI', Arial, sans-serif; border-bottom: 2px solid #38bdf8; position: sticky; top: 0; z-index: 9999;">
                <div style="font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                    <span>📄 ${escapeHtml(printDocTitle)}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: #cbd5e1;">
                        <span>🔍 Scale (පරිමාණය):</span>
                        <select id="printScaleSelector" onchange="window.changeReportScale(this.value)" style="background: #1e293b; color: #fff; border: 1px solid #475569; padding: 4px 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">
                            <option value="auto">✨ Auto 1-Page (ස්වයංක්‍රීය)</option>
                            <option value="1.0" selected>100% (සාමාන්‍ය)</option>
                            <option value="0.95">95% (Slightly Compact)</option>
                            <option value="0.90">90% (Compact)</option>
                            <option value="0.85">85% (Extra Compact)</option>
                            <option value="0.80">80%</option>
                        </select>
                    </div>
                    <span style="font-size: 11px; color: #94a3b8;">💡 Firefox Print Destination: <b>Save to PDF</b></span>
                    <button onclick="window.print()" style="background: #2563eb; color: #fff; border: none; padding: 5px 14px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer;">
                        🖨️ Print
                    </button>
                </div>
            </div>
            <div id="printableReportArea" style="width: 100%; max-width: 800px; margin: 0 auto; box-sizing: border-box;">
                ${bodyContentHtml}
            </div>
            <script>
            window.changeReportScale = function(val) {
                const area = document.getElementById('printableReportArea');
                if (!area) return;
                if (val === 'auto') {
                    const fullHeight = area.scrollHeight;
                    if (fullHeight > 1020) {
                        const fitScale = Math.max(0.70, Math.min(1.0, 980 / fullHeight));
                        area.style.transform = 'scale(' + fitScale.toFixed(2) + ')';
                        area.style.transformOrigin = 'top center';
                    } else {
                        area.style.transform = 'none';
                    }
                } else {
                    const s = parseFloat(val) || 1.0;
                    if (s === 1.0) {
                        area.style.transform = 'none';
                    } else {
                        area.style.transform = 'scale(' + s + ')';
                        area.style.transformOrigin = 'top center';
                    }
                }
            };
            if ('${initialScale}' !== '1.0') {
                const sel = document.getElementById('printScaleSelector');
                if (sel) {
                    sel.value = '${initialScale}';
                    window.changeReportScale('${initialScale}');
                }
            }
            <\/script>
        </body></html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(fullPrintHtml);
    win.document.close();
    win.document.title = printDocTitle;
    win.focus();
    setTimeout(() => {
      try {
        win.document.title = printDocTitle;
        win.print();
      } catch (e) {
        console.warn("Popup print failed, fallback to direct print:", e);
        triggerDesktopHiddenPrint(printDocTitle, fullPrintHtml);
      }
    }, 350);
  } else {
    triggerDesktopHiddenPrint(printDocTitle, fullPrintHtml);
  }
}

function shareLmdWhatsApp(scope, selectedZone) {
  const today = getLocalDateString();
  const dateVal = store.dashboardDate || today;
  let zones = [];
  if (scope === "all") {
    zones = store.zones;
  } else {
    const z = store.zones.find((x) => x.id === selectedZone);
    if (z) zones.push(z);
  }
  let text = `*⚓ CMSys DAILY ALLOCATION REPORT*\n`;
  text += `*📅 Date:* ${dateVal}\n`;
  if (scope === "selected" && zones.length > 0) {
    text += `*🗺️ Zone:* ${zones[0].name.toUpperCase()}\n`;
  }
  text += `=========================\n\n`;
  let totalAssigned = 0;
  zones.forEach((z) => {
    const wos = store.workOrders.filter(
      (wo) => wo.zone_id === z.id && isWorkOrderActiveOnDate(wo, dateVal),
    );
    let zoneText = "";
    let zoneHasAllocations = false;
    wos.forEach((wo) => {
      let assignedSailors = [];
      if (dateVal === today) {
        const assignedIds = (wo.assigned || []).map(String);
        assignedSailors = store.sailors.filter(
          (s) =>
            assignedIds.includes(String(s.id)) ||
            assignedIds.includes(String(s._fbKey)),
        );
      } else {
        const assignedIds = (store.dailyAllocations || [])
          .filter(
            (a) =>
              a.date === dateVal && String(a.work_order_id) === String(wo.id),
          )
          .map((a) => String(a.sailor_id));
        assignedSailors = store.sailors.filter(
          (s) =>
            assignedIds.includes(String(s.id)) ||
            assignedIds.includes(String(s._fbKey)),
        );
      }
      if (assignedSailors.length > 0) {
        zoneHasAllocations = true;
        zoneText += `*📋 ${wo.description.toUpperCase()}*\n`;
        assignedSailors.forEach((s, idx) => {
          totalAssigned++;
          const parsedOffNo = parseOfficialNumber(
            s.official_number || s.service_no,
          );
          const offNoStr = parsedOffNo.type
            ? `${parsedOffNo.type} ${parsedOffNo.num}`
            : parsedOffNo.num;
          zoneText += `  ${idx + 1}. ${s.rank || "AB"} ${s.name} (${offNoStr}) - ${s.trade || "—"}\n`;
        });
        zoneText += `\n`;
      }
    });
    if (zoneHasAllocations) {
      text += `*🗺️ ZONE: ${z.name.toUpperCase()}*\n`;
      text += `-------------------------\n`;
      text += zoneText;
      text += `\n`;
    }
  });
  text += `*📊 Summary:* Total Sailors Assigned: ${totalAssigned}\n`;
  text += `Generated on: ${new Date().toLocaleString()}`;
  shareViaWhatsAppOrSystem(text, `LMD_Report_${dateVal}.txt`);
}

// ============================================================================
// Global Window Bindings for LMD Module
// ============================================================================
window.switchLmdTab = switchLmdTab;
window.renderMaintenance = renderMaintenance;
window.renderLmdDashboard = renderLmdDashboard;
window.renderLocationsList = renderLocationsList;
window.selectLocation = selectLocation;
window.searchLocations = searchLocations;
window.openAddLocationModal = openAddLocationModal;
window.editLocation = editLocation;
window.deleteLocation = deleteLocation;
window.autofillLocationDetails = autofillLocationDetails;
window.saveLocation = saveLocation;
window.addMaintenanceRecord = addMaintenanceRecord;
window.saveMaintenanceRecord = saveMaintenanceRecord;
window.normalizeLocationsCsvHeader = normalizeLocationsCsvHeader;
window.downloadLocationsCsvTemplate = downloadLocationsCsvTemplate;
window.exportLocationsCsv = exportLocationsCsv;
window.openLmdExportModal = openLmdExportModal;
window.toggleExportZoneSelect = toggleExportZoneSelect;
window.executeLmdExport = executeLmdExport;
window.exportLmdCSV = exportLmdCSV;
window.printLmdDetails = printLmdDetails;
window.buildDailyDetailsReportData = buildDailyDetailsReportData;
window.shareLmdWhatsApp = shareLmdWhatsApp;
window.classifySailorForSummary = classifySailorForSummary;

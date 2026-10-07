// ============================================================================
// CMSys Module: System Settings, Zones, In-Charges & Approved Projects
// File: js/modules/settings.js
// ============================================================================

// =============================================
// ZONE MANAGEMENT (req 10 - add / remove zones)
// =============================================
function isSbsZone(zoneIdOrName) {
  if (!zoneIdOrName) return false;
  const str = String(zoneIdOrName).trim().toUpperCase();
  return str === "SBS" || str === "SBS-ZONE" || str === "SBS ZONE" || str === "SPECIAL BOAT SQUADRON";
}

function openZoneManager() {
  document.getElementById("newZoneName").value = "";
  renderZoneManagerList();
  document.getElementById("zoneManagerModal").classList.remove("hidden");
}
function renderZoneManagerList() {
  const container = document.getElementById("zoneManagerList");
  const validZones = store.zones.filter((z) => !isSbsZone(z.id) && !isSbsZone(z.name));
  container.innerHTML =
    validZones
      .map((z) => {
        const locCount = store.locations.filter(
          (l) => l.zone_id === z.id,
        ).length;
        return `
        <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div>
                <p class="font-medium text-slate-700">${z.name}</p>
                <p class="text-xs text-slate-400">${locCount} location${locCount === 1 ? "" : "s"}</p>
            </div>
            <button onclick="removeZone('${z.id}')" class="text-rose-600 hover:bg-rose-50 px-3 py-1 rounded-lg text-sm font-medium">Remove</button>
        </div>`;
      })
      .join("") ||
    '<p class="text-slate-500 text-center py-6">No zones defined</p>';
}
function addZone() {
  const name = document.getElementById("newZoneName").value.trim();
  if (!name) {
    showToast("Enter a zone name", "info");
    return;
  }
  if (isSbsZone(name)) {
    showToast("SBS is reserved as a Book / Register and cannot be added as an operational zone", "warning");
    return;
  }
  const id = name.replace(/\s+/g, "-");
  if (
    store.zones.some(
      (z) => z.id === id || z.name.toLowerCase() === name.toLowerCase(),
    )
  ) {
    showToast("Zone already exists", "error");
    return;
  }
  store.zones.push({ id, name });
  document.getElementById("newZoneName").value = "";
  renderZoneManagerList();
  renderZoneSelectors();
  showToast(`Zone "${name}" added`);
}
function removeZone(zoneId) {
  const locCount = store.locations.filter((l) => l.zone_id === zoneId).length;
  if (locCount > 0) {
    showToast(
      `Cannot remove: ${locCount} location(s) still assigned to this zone`,
      "error",
    );
    return;
  }
  if (store.zones.length <= 1) {
    showToast("At least one zone must remain", "error");
    return;
  }
  store.zones = store.zones.filter((z) => z.id !== zoneId);
  if (store.currentZone === zoneId) {
    store.currentZone = store.zones[0].id;
  }
  renderZoneManagerList();
  renderZoneSelectors();
  renderMaintenance();
  showToast("Zone removed");
} // Rebuild every zone-bound <select> from store.zones, preserving valid selections
function renderZoneSelectors() {
  store.zones = ensureAllStandardZones(store.zones || []);

  // Cleanse SBS if it exists in store.zones
  if (Array.isArray(store.zones) && store.zones.some((z) => isSbsZone(z.id) || isSbsZone(z.name))) {
    store.zones = store.zones.filter((z) => !isSbsZone(z.id) && !isSbsZone(z.name));
  }

  // Determine if the current officer has access to "All Zone" (Admin-&-Staff-Duties)
  let hasAllZoneAccess = true;
  let allowedZones = store.zones.map((z) => z.id); // default all
  if (store.activeProfileType === "OIC") {
    if (store.activeOicProfileId) {
      const profile = getOicProfiles().find(
        (p) => p.id === store.activeOicProfileId,
      );
      if (profile) {
        // If it is NOT the main admin (3576), check their permission
        const isMain = (profile.serviceNo || "").includes("3576");
        if (!isMain) {
          hasAllZoneAccess = profile.permAllZones === true;
          allowedZones = profile.allowedZones || [];
        }
      }
    }
  } else if (
    store.activeProfileType === "ZoneInCharge" ||
    store.activeProfileType === "ZoneSubInCharge"
  ) {
    allowedZones = [store.activeProfileZone];
    hasAllZoneAccess = false;
  }
  const visibleZones = store.zones.filter(
    (z) =>
      allowedZones.includes(z.id) &&
      z.status !== "Inactive" &&
      z.active !== false &&
      !isSbsZone(z.id) &&
      !isSbsZone(z.name),
  );
  const today = getLocalDateString();
  const dateVal = store.dashboardDate || today;
  const [yyyy, mm, dd] = dateVal.split("-");
  const monthKey = `${yyyy}-${mm}`;
  const dayKey = parseInt(dd, 10).toString();
  const isLeaveCode = (val) => isSailorOnLeaveOnDate(val, dateVal);
  let zonesToRender = [...visibleZones];
  if (hasAllZoneAccess) {
    const hasAdminZone = visibleZones.some((z) => isAdminStaffDuties(z.id));
    if (!hasAdminZone) {
      zonesToRender.push({
        id: "Admin-&-Staff-Duties",
        name: "Admin & Staff Duties"
      });
    }
  }

  let optionsHtml = zonesToRender
    .map((z) => {
      let pendingEvalCount = 0;
      let activeCount = 0;
      
      const isZoneMatchLocal = (zoneId) => {
        if (!zoneId) return false;
        if (isAdminStaffDuties(z.id)) return isAdminStaffDuties(zoneId);
        return isZoneMatch(zoneId, z.id) || isZoneMatch(zoneId, z.name);
      };

      const zoneSailorMap = new Map();

      const addSailor = (s) => {
        if (!s) return;
        const fbStatus = typeof getSailorDailyAttendanceStatus === "function"
          ? getSailorDailyAttendanceStatus(s, dateVal)
          : (store.availability && store.availability[monthKey] && store.availability[monthKey][dayKey] ? store.availability[monthKey][dayKey][s._fbKey] : null);
        const allocKey = `${dateVal}_${s._fbKey || s.id}`;
        const alloc = store.dailyAllocationsMap
          ? store.dailyAllocationsMap[allocKey]
          : (store.dailyAllocations || []).find((a) => a && a.date === dateVal && (a.sailor_id === s._fbKey || a.sailor_id === s.id || a.official_number === s.official_number));
        if (alloc && alloc.status === "Active") {
          // Actively allocated today
        } else if (
          isLeaveCode(fbStatus) ||
          (!fbStatus && isLeaveCode(s.attendance) && s.attendance && s.attendance.toLowerCase() !== "present")
        ) {
          return;
        }
        const key = String(s.id || s._fbKey || s.official_number || s.service_no || s.name || "");
        if (key && !zoneSailorMap.has(key)) {
          zoneSailorMap.set(key, s);
        }
      };

      const addSailorById = (id) => {
        if (!id) return;
        if (typeof id === "object") {
          addSailor(id);
          return;
        }
        const idStr = String(id).trim();
        if (!idStr) return;
        const idLower = idStr.toLowerCase();
        const s = (store.sailors || []).find(
          (sailor) =>
            sailor &&
            (String(sailor.id).trim().toLowerCase() === idLower ||
              (sailor._fbKey && String(sailor._fbKey).trim().toLowerCase() === idLower) ||
              (sailor.official_number && String(sailor.official_number).trim().toLowerCase() === idLower) ||
              (sailor.service_no && String(sailor.service_no).trim().toLowerCase() === idLower) ||
              (sailor.name && String(sailor.name).trim().toLowerCase() === idLower))
        );
        if (s) {
          addSailor(s);
        }
      };

      // 1. Work Orders (Projects, Jobs, Tasks, Quick Assignments)
      (store.workOrders || []).forEach((wo) => {
        if (!wo || wo.status === "Cancelled" || wo.status === "Completed") return;
        const zoneField = wo.zone_id || wo.zone || wo.zoneId || wo.zone_name || wo.location_zone || wo.location;
        if (isZoneMatchLocal(zoneField) || (wo.assign_type && isZoneMatchLocal(wo.description))) {
          const isActive = isWorkOrderActiveOnDate(wo, dateVal) && isWorkOrderCommittedToday(wo, dateVal);
          if (isActive) {
            const { sailors } = getWorkOrderAssignedSailors(wo, dateVal);
            sailors.forEach(addSailor);
          }
        }
      });

      // 2. Job Cards
      (store.jobCards || []).forEach((jc) => {
        if (!jc || jc.status === "Cancelled" || jc.status === "Completed") return;
        const zoneField = jc.zone_id || jc.zone || jc.zoneId || jc.zone_name || jc.location_zone || jc.location;
        if (isZoneMatchLocal(zoneField)) {
          if (isWorkOrderActiveOnDate(jc, dateVal) && isWorkOrderCommittedToday(jc, dateVal)) {
            const { sailors } = getWorkOrderAssignedSailors(jc, dateVal);
            sailors.forEach(addSailor);
          }
        }
      });

      // 3. Daily Allocations recorded for dateVal
      (store.dailyAllocations || []).forEach((alloc) => {
        if (!alloc || alloc.date !== dateVal || alloc.status === "Cancelled") return;
        const sid = alloc.sailor_id || alloc.sailorId || alloc.official_number || alloc.offNo || "";
        if (!sid) return;

        if (isZoneMatchLocal(alloc.zone_id || alloc.zone || alloc.zone_name || alloc.location)) {
          addSailorById(sid);
          return;
        }

        if (alloc.work_order_id) {
          const matchedWo = (store.workOrders || []).find(
            (w) =>
              String(w.id) === String(alloc.work_order_id) ||
              String(w._fbKey) === String(alloc.work_order_id) ||
              (w.description && alloc.description && w.description.trim().toLowerCase() === alloc.description.trim().toLowerCase())
          );
          if (matchedWo && isZoneMatchLocal(matchedWo.zone_id || matchedWo.zone || matchedWo.zoneId || matchedWo.zone_name)) {
            addSailorById(sid);
            return;
          }

          const matchedJc = (store.jobCards || []).find(
            (j) =>
              String(j.id) === String(alloc.work_order_id) ||
              String(j._fbKey) === String(alloc.work_order_id) ||
              (j.description && alloc.description && j.description.trim().toLowerCase() === alloc.description.trim().toLowerCase())
          );
          if (matchedJc && isZoneMatchLocal(matchedJc.zone_id || matchedJc.zone || matchedJc.zoneId || matchedJc.zone_name)) {
            addSailorById(sid);
            return;
          }
        }
      });

      activeCount = zoneSailorMap.size;
      let evalCount = 0;

      zoneSailorMap.forEach((s) => {
        const allocKey = `${dateVal}_${sanitizeFbKey(s.id)}`;
        const allocKeyFb = `${dateVal}_${sanitizeFbKey(s._fbKey)}`;
        const alloc = store.dailyAllocationsMap
          ? store.dailyAllocationsMap[allocKey] || store.dailyAllocationsMap[allocKeyFb]
          : null;
        if (s.evaluated === true || (alloc && alloc.evaluated === true)) {
          evalCount++;
        }
      });

      pendingEvalCount = Math.max(0, activeCount - evalCount);

      let zoneDisplayName = z.name || z.id;
      if (z.id === "Carpentry-Shop" || isZoneMatch(z.id, "Carpentry-Shop") || isZoneMatch(zoneDisplayName, "Carpentry Shop")) {
        zoneDisplayName = "Carpentary & Paint";
      }
      let displayStr = zoneDisplayName;
      if (activeCount > 0) {
        displayStr = `${zoneDisplayName} (🟢 ${activeCount} | 🔴 ${pendingEvalCount})`;
      } else {
        displayStr = `${zoneDisplayName} (🟢 0 | 🔴 0)`;
      }
      return `<option value="${z.id}">${displayStr}</option>`;
    })
    .join("");
  ["zoneSelector", "locZone"].forEach((selId) => {
    const sel = document.getElementById(selId);
    if (!sel) return;
    let prev = sel.value;
    if (selId === "zoneSelector") {
      if (store.currentZone) {
        prev = store.currentZone;
      } else if (localStorage.getItem("ncw_saved_zone")) {
        prev = localStorage.getItem("ncw_saved_zone");
      }
    }

    let finalOptionsHtml = optionsHtml;
    if (isSbsZone(prev)) {
      finalOptionsHtml = `<option value="SBS" selected>📖 SBS Record Book</option>` + optionsHtml;
    }
    
    sel.innerHTML = finalOptionsHtml;

    if (isSbsZone(prev)) {
      sel.value = "SBS";
      if (selId === "zoneSelector") {
        store.currentZone = "SBS";
        localStorage.setItem("ncw_saved_zone", "SBS");
      }
    } else {
      const matchedZone = zonesToRender.find(
        (z) =>
          z.id === prev ||
          z.name === prev ||
          isZoneMatch(z.id, prev) ||
          isZoneMatch(z.name, prev) ||
          (isAdminStaffDuties(z.id) && isAdminStaffDuties(prev))
      );

      if (matchedZone) {
        sel.value = matchedZone.id;
        if (selId === "zoneSelector") {
          store.currentZone = matchedZone.id;
          localStorage.setItem("ncw_saved_zone", matchedZone.id);
        }
      } else if (isAdminStaffDuties(prev) && hasAllZoneAccess) {
        sel.value = "Admin-&-Staff-Duties";
        if (selId === "zoneSelector") {
          store.currentZone = "Admin-&-Staff-Duties";
          localStorage.setItem("ncw_saved_zone", "Admin-&-Staff-Duties");
        }
      } else {
        // Select the first visible zone only if no matching zone exists and no saved zone exists
        const hasSavedZone = Boolean(localStorage.getItem("ncw_saved_zone") || store.currentZone);
        if (!hasSavedZone && visibleZones.length > 0) {
          sel.value = visibleZones[0].id;
          if (selId === "zoneSelector") {
            store.currentZone = visibleZones[0].id;
            localStorage.setItem("ncw_saved_zone", visibleZones[0].id);
          }
        } else if (hasSavedZone) {
          const savedZone = prev || store.currentZone || localStorage.getItem("ncw_saved_zone");
          if (savedZone) {
            sel.value = savedZone;
          }
        } else if (hasAllZoneAccess) {
          sel.value = "Admin-&-Staff-Duties";
          if (selId === "zoneSelector") {
            store.currentZone = "Admin-&-Staff-Duties";
            localStorage.setItem("ncw_saved_zone", "Admin-&-Staff-Duties");
          }
        }
      }
    }
  });
}

window._cfgSelectedZone = window._cfgSelectedZone || null;

function renderSettingsZoneSelectorList() {
  const container = document.getElementById("settingsZoneSelectorList");
  if (!container) return;
  const rawZones = ensureAllStandardZones(store.settings.zones || store.zones || []);
  store.settings.zones = rawZones;
  store.zones = rawZones;
  const zones = rawZones.filter((z) => !isSbsZone(z.id) && !isSbsZone(z.name));
  const badge = document.getElementById("cfgZonesCountBadge");
  if (badge) badge.textContent = `${zones.length} Zones`;

  if (!_cfgSelectedZone && zones.length > 0) {
    _cfgSelectedZone = store.currentZone || zones[0].id || zones[0].name;
  }

  container.innerHTML =
    zones
      .map((z, idx) => {
        const zid = z.id || z.name;
        const isSelected = _cfgSelectedZone === zid;
        const isActive = z.status !== "Inactive" && z.active !== false;
        const locCount = (store.locations || []).filter(
          (l) => l.zone_id === zid,
        ).length;
        return `
      <div onclick="selectSettingsZone('${zid}')" class="flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer transition-all border ${
        isSelected
          ? "bg-teal-600 text-white border-teal-700 shadow-md ring-2 ring-teal-300 font-bold"
          : isActive
            ? "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
            : "bg-slate-100 hover:bg-slate-200 text-slate-400 border-slate-200 opacity-75"
      }">
        <span class="text-xs ${!isActive ? "line-through text-slate-400" : ""}">🏢 ${z.name || z.id}</span>
        <span class="text-[11px] px-2 py-0.5 rounded-full font-bold ${
          isSelected
            ? "bg-teal-800 text-teal-100"
            : "bg-slate-100 text-slate-600"
        }">${locCount}</span>
        
        <!-- Active / Inactive Status Toggle Button -->
        <button type="button" onclick="event.stopPropagation(); toggleZoneStatusInSettings(${idx})" class="text-[10px] font-bold px-2 py-0.5 rounded-full transition-all cursor-pointer shadow-xs ${
          isActive
            ? isSelected
              ? "bg-emerald-400 text-slate-950 hover:bg-emerald-300"
              : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-300"
            : "bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-300"
        }" title="${isActive ? "Click to Deactivate zone (Hide from operational dropdown)" : "Click to Activate zone"}">
          ${isActive ? "🟢 Active" : "⚪ Inactive"}
        </button>

        <!-- Remove Zone Button -->
        <button type="button" onclick="event.stopPropagation(); removeZoneFromSettings(${idx})" class="p-1 rounded hover:bg-red-500/20 ${
          isSelected ? "text-red-200 hover:text-white" : "text-red-400 hover:text-red-600"
        } cursor-pointer text-xs" title="Remove Zone">
          ✕
        </button>
      </div>
    `;
      })
      .join("") ||
    '<p class="text-xs text-slate-400 italic">No zones configured yet.</p>';

  // Render SBS Book (Register) status toggle card in settings
  const isSbsOn = isSbsBookActive();
  const sbsPillHtml = `
    <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
      isSbsOn
        ? "bg-teal-50 border-teal-300 text-teal-900 shadow-xs"
        : "bg-slate-100 border-slate-200 text-slate-400 opacity-75"
    }">
      <span class="text-xs ${!isSbsOn ? "line-through text-slate-400" : "font-bold text-teal-900"}">📖 SBS Book (Register)</span>
      <button type="button" onclick="toggleSbsBookActiveStatus()" class="text-[10px] font-bold px-2 py-0.5 rounded-full transition-all cursor-pointer shadow-xs ${
        isSbsOn
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-300"
          : "bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-300"
      }" title="${isSbsOn ? "Click to Deactivate SBS Book" : "Click to Activate SBS Book"}">
        ${isSbsOn ? "🟢 Active" : "⚪ Inactive"}
      </button>
    </div>
  `;

  container.innerHTML += sbsPillHtml;

  updateSelectedZoneLocationsView();
}

function isSbsBookActive() {
  if (store.settings?.sbsBookActive === false || store.settings?.sbsActive === false) {
    return false;
  }
  return true;
}

function toggleSbsBookActiveStatus() {
  const current = isSbsBookActive();
  const newStatus = !current;
  if (!store.settings) store.settings = {};
  store.settings.sbsBookActive = newStatus;
  store.settings.sbsActive = newStatus;
  saveSettingField("sbsBookActive", newStatus);
  renderSettingsZoneSelectorList();
  toggleViewsBasedOnZone();
  showToast(`SBS Book is now ${newStatus ? "Active" : "Inactive"}`, "info");
}

function toggleZoneStatusInSettings(index) {
  const zones = [...(store.settings.zones || store.zones || [])];
  if (!zones[index]) return;
  const currentStatus = zones[index].status !== "Inactive" && zones[index].active !== false;
  const newActive = !currentStatus;
  zones[index] = {
    ...zones[index],
    active: newActive,
    status: newActive ? "Active" : "Inactive",
  };
  store.settings.zones = zones;
  store.zones = zones;
  saveSettingsArray("zones", zones);
  renderSettingsZoneSelectorList();
  renderZoneSelectors();
  toggleViewsBasedOnZone();
  showToast(`Zone "${zones[index].name}" is now ${newActive ? "Active" : "Inactive"}`);
}

function selectSettingsZone(zoneId) {
  _cfgSelectedZone = zoneId;
  renderSettingsZoneSelectorList();
}

function updateSelectedZoneLocationsView() {
  const titleEl = document.getElementById("cfgSelectedZoneTitle");
  if (titleEl) {
    const zObj = (store.zones || store.settings?.zones || []).find(
      (z) => (z.id || z.name) === _cfgSelectedZone,
    );
    titleEl.textContent = zObj
      ? zObj.name
      : _cfgSelectedZone || "Select Zone";
  }

  // Populate building datalist for quick add
  const datalist = document.getElementById("cfgBuildingDatalist");
  if (datalist && _cfgSelectedZone) {
    const locs = (store.locations || []).filter(
      (l) => l.zone_id === _cfgSelectedZone,
    );
    const uniqueBuildings = [
      ...new Set(
        locs
          .map((l) => (l.building_name || l.name || "").trim())
          .filter(Boolean),
      ),
    ];
    datalist.innerHTML = uniqueBuildings
      .map((b) => `<option value="${b}">`)
      .join("");
  }

  renderSettingsLocationsTable();
}

function quickSaveLocation(event) {
  event.preventDefault();
  const zid = _cfgSelectedZone || store.currentZone;
  if (!zid) {
    showToast("Please select a zone first", "error");
    return;
  }
  const buildingInput = document.getElementById("quickLocBuilding");
  const subLocInput = document.getElementById("quickLocSubLocation");
  const endUserInput = document.getElementById("quickLocEndUser");

  const building = buildingInput ? buildingInput.value.trim() : "";
  const subLocation = subLocInput ? subLocInput.value.trim() : "";
  const endUser = endUserInput ? endUserInput.value.trim() : "";

  if (!building) {
    showToast("Please enter a Location (Building Name)", "error");
    return;
  }

  const validIds = (store.locations || [])
    .map((l) => parseInt(l.id, 10))
    .filter((n) => !Number.isNaN(n) && Number.isFinite(n));
  const maxId = validIds.length > 0 ? Math.max(...validIds) : 0;

  const locData = {
    id: maxId + 1,
    zone_id: zid,
    building_name: building,
    sub_location: subLocation,
    end_user: endUser,
    description: "",
    created_at: Date.now(),
  };

  fbSaveLocation(locData)
    .then(() => {
      showToast(
        `Location "${building}${subLocation ? " - " + subLocation : ""}" added to ${zid}!`,
      );
      if (subLocInput) subLocInput.value = "";
      if (endUserInput) endUserInput.value = "";
      updateSelectedZoneLocationsView();
      populateEstLocationsDatalist();
      renderSettingsZoneSelectorList();
    })
    .catch((err) => {
      console.error(err);
      showToast("Error saving location", "error");
    });
}

function renderSettingsLocationsTable() {
  const tableBody = document.getElementById("cfgLocationsTableBody");
  if (!tableBody) return;
  const countBadge = document.getElementById("cfgLocationsCountBadge");

  const zid = _cfgSelectedZone || store.currentZone;
  const filtered = (store.locations || []).filter((l) => l.zone_id === zid);

  if (countBadge) {
    countBadge.textContent = `${filtered.length} Locations`;
  }

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="px-4 py-8 text-center text-slate-400 italic">
          No locations found for this zone. Use <b>"➕ Quick Add / Branch Location"</b> above or <b>"📥 Bulk Upload (CSV)"</b> to add locations.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered
    .map(
      (loc, idx) => `
      <tr class="hover:bg-slate-50/80 transition-colors">
        <td class="px-3 py-2 text-center text-slate-400 font-mono text-[11px]">${idx + 1}</td>
        <td class="px-3 py-2 font-semibold text-slate-800">🏢 ${loc.building_name || loc.name || "—"}</td>
        <td class="px-3 py-2 text-teal-700 font-medium">📍 ${loc.sub_location || loc.location2 || '<span class="text-slate-400 italic font-normal">Main / General</span>'}</td>
        <td class="px-3 py-2 text-slate-700 font-medium">${loc.end_user ? `<span class="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-semibold">👤 ${loc.end_user}</span>` : '<span class="text-slate-400 italic text-[11px]">Not assigned</span>'}</td>
        <td class="px-3 py-2 text-slate-500 text-[11px]">${loc.description || "—"}</td>
        <td class="px-3 py-2 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button onclick="editLocationFromSettings('${loc.id || loc._fbKey}')" class="text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-indigo-50" title="Edit">
              ✏️
            </button>
            <button onclick="deleteLocationFromSettings('${loc.id || ""}', '${loc._fbKey || ""}')" class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50" title="Delete">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `,
    )
    .join("");
}

function openAddLocationModal() {
  document.getElementById("locationModalTitle").textContent = "Add Location";
  document.getElementById("locId").value = "";
  document.getElementById("locFbKey").value = "";
  const zoneEl = document.getElementById("locZone");
  if (zoneEl) {
    const zones = store.zones || store.settings?.zones || [];
    zoneEl.innerHTML = zones.map(z => `<option value="${z.id || z.name}">${z.name || z.id}</option>`).join("");
    zoneEl.value = _cfgSelectedZone || store.currentZone;
  }
  document.getElementById("locBuilding").value = "";
  document.getElementById("locSubLocation").value = "";
  if (document.getElementById("locEndUser")) document.getElementById("locEndUser").value = "";
  document.getElementById("locDescription").value = "";
  document.getElementById("addLocationModal").classList.remove("hidden");
}

function editLocationFromSettings(idOrKey) {
  const loc = (store.locations || []).find(
    (l) => String(l.id) === String(idOrKey) || l._fbKey === idOrKey,
  );
  if (!loc) return;
  const titleEl = document.getElementById("locationModalTitle");
  if (titleEl) titleEl.textContent = "Edit Location";
  const idEl = document.getElementById("locId");
  if (idEl) idEl.value = loc.id || "";
  const keyEl = document.getElementById("locFbKey");
  if (keyEl) keyEl.value = loc._fbKey || "";
  const zoneEl = document.getElementById("locZone");
  if (zoneEl) {
    const zones = store.zones || store.settings?.zones || [];
    zoneEl.innerHTML = zones.map(z => `<option value="${z.id || z.name}">${z.name || z.id}</option>`).join("");
    zoneEl.value = loc.zone_id || store.currentZone;
  }
  document.getElementById("locBuilding").value =
    loc.building_name || loc.name || "";
  document.getElementById("locSubLocation").value =
    loc.sub_location || loc.location2 || "";
  if (document.getElementById("locEndUser")) {
    document.getElementById("locEndUser").value = loc.end_user || "";
  }
  document.getElementById("locDescription").value = loc.description || "";
  document.getElementById("addLocationModal").classList.remove("hidden");
}

function deleteLocationFromSettings(id, fbKey) {
  const loc = (store.locations || []).find(
    (l) => (id && String(l.id) === String(id)) || (fbKey && l._fbKey === fbKey),
  );
  const locName = loc
    ? `${loc.building_name} (${loc.sub_location || "General"})`
    : "this location";
  if (
    !confirm(
      `⚠️ Are you sure you want to delete ${locName}?\n\nThis will remove the location record from Firebase.`,
    )
  ) {
    return;
  }
  const key = fbKey || (loc ? loc._fbKey : null);
  if (key) {
    opsDB
      .ref(`locations/${key}`)
      .remove()
      .then(() => {
        showToast("Location deleted successfully!");
        updateSelectedZoneLocationsView();
        renderSettingsZoneSelectorList();
        renderLocationsList();
      })
      .catch((err) => {
        console.error(err);
        showToast("Failed to delete location", "error");
      });
  } else {
    showToast("Cannot find location record key", "error");
  }
}
// Inventory Stock Book Migration & Quick-Edit Utilities moved to js/modules/inventory.js
// Bulk Upload processing moved to js/modules/reports-upload.js
// SETTINGS
// =============================================
function ensureAllStandardZones(existingZones = []) {
  const standardList = [
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
  ];

  if (!existingZones || !Array.isArray(existingZones) || existingZones.length === 0) {
    return standardList;
  }

  const result = existingZones
    .filter((z) => z && (z.id || z.name) && !isSbsZone(z.id || z.name))
    .map((z) => {
      const zid = z.id || z.name;
      let zname = z.name || z.id;
      if (isZoneMatch(zid, "Carpentry-Shop") || isZoneMatch(zname, "Carpentry Shop") || isZoneMatch(zname, "Carpentary & Paint") || isZoneMatch(zname, "Carpentry Shop & Painter Shop")) {
        zname = "Carpentary & Paint";
      }
      const isInactive = z.status === "Inactive" || z.active === false;
      return {
        ...z,
        id: zid,
        name: zname,
        status: isInactive ? "Inactive" : "Active",
        active: !isInactive,
      };
    });

  if (!result.some((z) => isZoneMatch(z.id, "Pump-House") || isZoneMatch(z.name, "Pump House"))) {
    result.push({ id: "Pump-House", name: "Pump House", status: "Active", active: true });
  }

  return result;
}

// Default settings (used if Firebase has nothing)
const defaultSettings = {
  systemTitle: "CMSys v2.6",
  stationName: "CE Management System · Trincomalee",
  oicName: "",
  oicRank: "",
  oicServiceNo: "",
  oicProfiles: {},
  userName: "Sanjeewa Bandara",
  userRank: "PO1 (CE)",
  userServiceNo: "NRX 12345",
  currency: "Rs.",
  dateFormat: "YYYY-MM-DD",
  lowStockLevel: 10,
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
  priorityLevels: ["Low", "Medium", "High", "Critical"],
  holidays: {},
  minuteConfig: {
    addressees_si: [
      "විධායක නිලධාරි (තඨාකාංගනය)",
      "සහකාර විනයාරක්ෂකාධිපති (නැ)",
      "ප්‍රධාන ඉංජිනේරු",
      "නියෝජ්‍ය ප්‍රධාන ඉංජිනේරු",
      "අණදෙන නිලධාරි",
      "මූලස්ථාන සැපයුම් නිලධාරි",
      "කාර්ය භාර නිලධාරි (සිවිල් නඩත්තු)"
    ],
    addressees_en: [
      "Executive Officer (Dockyard)",
      "Assistant Provost Marshal (E)",
      "Chief Engineer",
      "Deputy Chief Engineer",
      "Commanding Officer",
      "Base Supply Officer",
      "Officer in Charge - Civil Maintenance"
    ],
    originators_si: [
      "ජ්‍යෙෂ්ඨ සිවිල් ඉංජිනේරු නිලධාරි (නඩත්තු) මඟින්",
      "කාර්ය භාර නිලධාරි (සිවිල් නඩත්තු) මඟින්",
      "විධායක නිලධාරි මඟින්",
      "නියෝජ්‍ය ප්‍රධාන ඉංජිනේරු මඟින්",
      "ප්‍රධාන ඉංජිනේරු මඟින්"
    ],
    originators_en: [
      "Senior Civil Engineering Officer (Maintenance)",
      "Officer in Charge - Civil Maintenance",
      "From: Executive Officer",
      "From: Deputy Chief Engineer",
      "From: Chief Engineer"
    ],
    signatoryTitles_si: [
      "ජ්‍යෙ.සි.ඉ.නි (නඩත්තු)",
      "කාර්ය භාර නිලධාරි (සිවිල් නඩත්තු)",
      "නියෝජ්‍ය ප්‍රධාන ඉංජිනේරු",
      "ප්‍රධාන ඉංජිනේරු",
      "විධායක නිලධාරි"
    ],
    signatoryTitles_en: [
      "Senior Civil Engineering Officer (Maintenance)",
      "Officer in Charge - Civil Maintenance",
      "Deputy Chief Engineer",
      "Chief Engineer",
      "Executive Officer"
    ],
    endorsements_si: [
      "නිර්දේශ කර ඉදිරිපත් කරමි.",
      "කාරුණික අනුමැතිය සඳහා ඉදිරිපත් කරමි.",
      "අනුමත කරමි.",
      "අනුමැතිය සඳහා ඉදිරිපත් කරමි."
    ],
    endorsements_en: [
      "Recommended and forwarded please.",
      "Submitted for your kind approval please.",
      "Approved as requested.",
      "Forwarded for necessary action please."
    ]
  }
}; // Live settings object (merged from Firebase)
store.settings = { ...defaultSettings }; // ── Load settings from Firebase DB2 ──
function ensureArray(val) {
  if (!val) return [];
  if (Array.isArray(val))
    return val.filter((item) => item !== null && item !== undefined);
  if (typeof val === "object") {
    return Object.values(val).filter(
      (item) => item !== null && item !== undefined,
    );
  }
  return [];
}
function initSettingsListener() {
  opsDB.ref("settings").on("value", (snapshot) => {
    if (snapshot.exists()) {
      const saved = snapshot.val();
      store.settings = { ...defaultSettings, ...saved }; // Restore arrays and objects properly
      if (saved.zones) store.settings.zones = ensureArray(saved.zones);
      if (saved.offChargeDestinations)
        store.settings.offChargeDestinations = ensureArray(
          saved.offChargeDestinations,
        );
      if (saved.approvalAuthorities)
        store.settings.approvalAuthorities = ensureArray(
          saved.approvalAuthorities,
        );
      if (saved.workOrderTypes)
        store.settings.workOrderTypes = ensureArray(saved.workOrderTypes);
      if (saved.priorityLevels)
        store.settings.priorityLevels = ensureArray(saved.priorityLevels);
      store.settings.zoneInCharges = saved.zoneInCharges || {};
      store.settings.selectedSettingsZone = saved.selectedSettingsZone || "";
      store.settings.oicProfiles = saved.oicProfiles || {};
      store.settings.holidays = saved.holidays || {};
    }
    // If user is currently editing or staying in Settings OR Documents, do NOT reset active view or redirect
    if (store.currentView !== "settings" && store.currentView !== "documents") {
      applySettings();
      renderZoneSelectors();
    } else {
      const s = store.settings;
      store.zones = ensureAllStandardZones(s.zones || defaultSettings.zones);
      if (typeof _currentSettingsTab !== "undefined" && _currentSettingsTab === "identity") {
        renderSettingsOicProfilesList();
      }
      if (store.currentView === "documents") {
        renderMinuteSheetSettings();
        populateMinuteSheetDropdowns();
      }
    }
  });
} // ── Apply loaded settings to the live UI ──
function applySettings() {
  const s = store.settings; // Sync store arrays from settings
  store.zones = ensureAllStandardZones(s.zones || defaultSettings.zones);
  if (isSbsZone(store.currentZone)) {
    store.currentZone = store.zones[0]?.id || "A Zone";
    localStorage.setItem("ncw_saved_zone", store.currentZone);
  }
  store.offChargeDestinations =
    s.offChargeDestinations || defaultSettings.offChargeDestinations;
  store.approvalAuthorities =
    s.approvalAuthorities || defaultSettings.approvalAuthorities; // Apply the active profile rules
  applyActiveProfile(); // Apply header texts
  const titleEl = document.querySelector("h1");
  if (titleEl && s.systemTitle) {
    const vSpan = titleEl.querySelector("span");
    if (titleEl.childNodes && titleEl.childNodes.length > 0) {
      titleEl.childNodes[0].textContent =
        s.systemTitle.replace(/v\S+$/, "").trim() + " ";
    } else {
      titleEl.textContent = s.systemTitle + " ";
    }
    if (vSpan)
      vSpan.textContent = s.systemTitle.match(/v[\d.]+/)
        ? s.systemTitle.match(/v[\d.]+/)[0]
        : "v2.6";
  }
  const brandTag = document.querySelector(".brand-tag");
  if (s.stationName) {
    s.stationName = s.stationName.replace(/·?\s*Miss Garrison\s*·?/gi, "·").replace(/•?\s*Miss Garrison\s*•?/gi, "•").trim();
    s.stationName = s.stationName.replace(/^·\s*/, "").replace(/\s*·$/, "").trim();
  }
  if (brandTag && s.stationName) brandTag.textContent = s.stationName;
  toggleViewsBasedOnZone();
} // ── Save a single setting field to Firebase ──
window._settingsSaveTimer = null;
function saveSettingField(key, value) {
  store.settings[key] = value; // Debounce — save after 800ms of inactivity
  clearTimeout(_settingsSaveTimer);
  _settingsSaveTimer = setTimeout(() => {
    opsDB
      .ref("settings")
      .update({ [key]: value })
      .then(() => {
        const isSettingsOpen = store.currentView === "settings" || !document.getElementById("view-settings")?.classList.contains("hidden");
        const statusEl = document.getElementById("settingsSaveStatus");
        if (statusEl) {
          statusEl.classList.remove("hidden");
          setTimeout(() => statusEl.classList.add("hidden"), 2500);
        }
        if (!isSettingsOpen) {
          applySettings();
          renderZoneSelectors();
        }
      });
  }, 800);
} // ── Save full array to Firebase ──
function saveSettingsArray(key, arr) {
  store.settings[key] = arr;
  opsDB
    .ref(`settings/${key}`)
    .set(arr)
    .then(() => {
      const isSettingsOpen = store.currentView === "settings" || !document.getElementById("view-settings")?.classList.contains("hidden");
      if (!isSettingsOpen) {
        applySettings();
        renderZoneSelectors();
      }
      const statusEl = document.getElementById("settingsSaveStatus");
      if (statusEl) {
        statusEl.classList.remove("hidden");
        setTimeout(() => statusEl.classList.add("hidden"), 2000);
      }
    });
} // ── Render Settings Page ──
window._currentSettingsTab = window._currentSettingsTab || "identity";
function renderSettings() {
  const isMaster = isCurrentMasterAdmin();
  const stabIdentity = document.getElementById("stab-identity");
  if (stabIdentity) {
    if (isMaster) {
      stabIdentity.classList.remove("hidden");
    } else {
      stabIdentity.classList.add("hidden");
      if (_currentSettingsTab === "identity") {
        _currentSettingsTab = "projects";
      }
    }
  }
  switchSettingsTab(_currentSettingsTab);
}
function switchSettingsTab(tab) {
  const isMaster = isCurrentMasterAdmin();
  if (tab === "identity" && !isMaster) {
    tab = "projects";
  }
  _currentSettingsTab = tab;
  document
    .querySelectorAll(".settings-tab-content")
    .forEach((el) => el.classList.add("hidden"));
  document
    .querySelectorAll(".settings-tab-btn")
    .forEach((el) => el.classList.remove("active-stab"));
  const contentEl = document.getElementById(`stab-content-${tab}`);
  const btnEl = document.getElementById(`stab-${tab}`);
  if (contentEl) contentEl.classList.remove("hidden");
  if (btnEl) btnEl.classList.add("active-stab"); // Populate fields for this tab
  const s = store.settings;
  if (tab === "identity") {
    setValue("cfg-systemTitle", s.systemTitle);
    setValue("cfg-stationName", s.stationName);
    setValue("cfg-googleClientId", s.googleClientId);
    renderSettingsOicProfilesList();
  } else if (tab === "user") {
    // Populate Zone dropdown
    const zoneDropdown = document.getElementById("cfg-userZone");
    if (zoneDropdown) {
      const validZones = (store.zones || []).filter(z => !isSbsZone(z.id) && !isSbsZone(z.name));
      zoneDropdown.innerHTML =
        '<option value="">-- Select Zone --</option>' +
        validZones
          .map((z) => `<option value="${z.id}">${z.name}</option>`)
          .join("");
      zoneDropdown.value = s.selectedSettingsZone || (validZones[0] ? validZones[0].id : "");
    }
    changeSettingsUserZone(zoneDropdown ? zoneDropdown.value : s.selectedSettingsZone);
  } else if (tab === "zones") {
    renderSettingsZoneSelectorList();
    renderSettingsLocationsTable();
  } else if (tab === "inventory" || tab === "offcharge") {
    renderSettingsInventoryStoresList();
    renderSettingsOnOffChargeList();
  } else if (tab === "workorder") {
    renderSettingsAuthList();
    renderSettingsWoTypeList();
    renderSettingsPriorityList();
  } else if (tab === "display") {
    setValue("cfg-currency", s.currency);
    setValue("cfg-dateFormat", s.dateFormat);
    setValue("cfg-lowStockLevel", s.lowStockLevel || 10);
  } else if (tab === "dateschedule") {
    renderDateScheduleCalendar();
  } else if (tab === "projects") {
    renderApprovedProjectsSettings();
  } else if (tab === "minutesheet") {
    renderMinuteSheetSettings();
  }
}
function setValue(id, val) {
  const el = document.getElementById(id);
  if (el && val !== undefined && val !== null) el.value = val;
}
function changeSettingsUserZone(zoneId) {
  store.settings.selectedSettingsZone = zoneId;
  opsDB.ref("settings/selectedSettingsZone").set(zoneId); // Reload fields for the newly selected zone
  const inc = (store.settings.zoneInCharges || {})[zoneId];
  if (inc) {
    setValue("cfg-userSailorId", inc.sailorId || "");
    const displayName = inc.rank
      ? `${inc.rank} ${inc.name} (${inc.serviceNo})`
      : inc.name;
    setValue("cfg-userName", displayName || "");
    setValue("cfg-userRank", inc.rank || "");
    setValue("cfg-userServiceNo", inc.serviceNo || "");
    setValue("cfg-userSubSailorId", inc.subSailorId || "");
    const subDisplayName = inc.subRank
      ? `${inc.subRank} ${inc.subName} (${inc.subServiceNo})`
      : inc.subName || "";
    setValue("cfg-userSubName", subDisplayName || "");
    setValue("cfg-userSubRank", inc.subRank || "");
    setValue("cfg-userSubServiceNo", inc.subServiceNo || "");
    setValue("cfg-userPassword", inc.password || "");
    setValue("cfg-woInchargeId", inc.woInchargeId || "");
    setValue("cfg-woInchargeName", inc.woInchargeName || "");
    setValue("cfg-woSupervisorId", inc.woSupervisorId || "");
    setValue("cfg-woSupervisorName", inc.woSupervisorName || "");
    setValue("cfg-woArtificerId", inc.woArtificerId || "");
    setValue("cfg-woArtificerName", inc.woArtificerName || "");
  } else {
    setValue("cfg-userSailorId", "");
    setValue("cfg-userName", "");
    setValue("cfg-userRank", "");
    setValue("cfg-userServiceNo", "");
    setValue("cfg-userSubSailorId", "");
    setValue("cfg-userSubName", "");
    setValue("cfg-userSubRank", "");
    setValue("cfg-userSubServiceNo", "");
    setValue("cfg-userPassword", "");
    setValue("cfg-woInchargeId", "");
    setValue("cfg-woInchargeName", "");
    setValue("cfg-woSupervisorId", "");
    setValue("cfg-woSupervisorName", "");
    setValue("cfg-woArtificerId", "");
    setValue("cfg-woArtificerName", "");
  }
  renderSettingsSupervisorsList(zoneId);
  renderSettingsZoneTeamList(zoneId);
  renderSettingsZoneOfficersList(zoneId);
}

function renderSettingsSupervisorsList(zoneId) {
  const container = document.getElementById("cfgSupervisorsList");
  if (!container) return;
  const zid = zoneId || document.getElementById("cfg-userZone")?.value || store.settings.selectedSettingsZone;
  if (!zid) {
    container.innerHTML = '<span class="text-xs text-slate-400 italic">Select a Zone above to view supervisors</span>';
    const badge = document.getElementById("cfgSupervisorsCountBadge");
    if (badge) badge.textContent = "0";
    return;
  }
  const inc = (store.settings.zoneInCharges || {})[zid] || {};
  let supervisors = Array.isArray(inc.supervisors) ? inc.supervisors : (inc.woSupervisorId ? [{ id: inc.woSupervisorId, name: inc.woSupervisorName }] : []);

  const badge = document.getElementById("cfgSupervisorsCountBadge");
  if (badge) badge.textContent = String(supervisors.length);

  if (supervisors.length === 0) {
    container.innerHTML = '<span class="text-xs text-slate-400 italic">No supervisors added yet. Search above to add.</span>';
    return;
  }

  container.innerHTML = supervisors.map(sv => {
    const s = store.sailors.find(x => String(x.id ?? x._fbKey) === String(sv.id || sv.sailorId)) || sv;
    const displayName = s.rank ? `${s.rank} ${s.name} (${s.official_number || s.service_no || ''})` : (sv.name || sv.id);
    const sid = String(sv.id || sv.sailorId || sv._fbKey);
    return `
      <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-xs font-semibold shadow-2xs">
        <span>👷 ${displayName}</span>
        <button onclick="removeSupervisorFromZone('${sid}')" class="text-blue-400 hover:text-red-600 font-bold ml-1 p-0.5" title="Remove Supervisor">✕</button>
      </div>
    `;
  }).join("");
}

function showAddSupervisorResults() {
  const resultsDiv = document.getElementById("cfg-addSupervisorSearchResults");
  if (!resultsDiv) return;
  resultsDiv.classList.remove("hidden");
  filterAddSupervisorResults(document.getElementById("cfg-addSupervisorSearch")?.value || "");
}

function filterAddSupervisorResults(query) {
  const resultsDiv = document.getElementById("cfg-addSupervisorSearchResults");
  if (!resultsDiv) return;
  const zid = document.getElementById("cfg-userZone")?.value || store.settings.selectedSettingsZone;
  if (!zid) {
    resultsDiv.innerHTML = '<div class="p-3 text-xs text-red-500 italic">Please select a Zone first</div>';
    resultsDiv.classList.remove("hidden");
    return;
  }
  const inc = (store.settings.zoneInCharges || {})[zid] || {};
  const currentSupervisors = new Set((inc.supervisors || []).map(s => String(s.id || s.sailorId)));

  const ecSailors = getEcSailors();
  const q = (query || "").toLowerCase().trim();
  let filtered = ecSailors.filter(s => {
    const sid = String(s.id ?? s._fbKey);
    if (currentSupervisors.has(sid)) return false;
    if (!q) return true;
    const name = (s.name || "").toLowerCase();
    const offNo = (s.official_number || s.officialNumber || s.service_no || "").toLowerCase();
    const rank = (s.rank || "").toLowerCase();
    return name.includes(q) || offNo.includes(q) || rank.includes(q);
  });

  if (filtered.length === 0) {
    resultsDiv.innerHTML = '<div class="p-3 text-xs text-slate-400 italic">No available EC sailors found</div>';
  } else {
    resultsDiv.innerHTML = filtered.slice(0, 30).map(s => {
      const sid = String(s.id !== undefined && s.id !== null ? s.id : s._fbKey);
      const displayName = `${s.rank} ${s.name} (${s.official_number || s.service_no || ''})`;
      return `
        <div onclick="addSupervisorToZone('${sid}')" class="p-2.5 text-xs hover:bg-blue-50 cursor-pointer text-slate-700 transition-colors flex items-center justify-between">
          <span class="font-semibold text-slate-800">${s.rank} ${s.name}</span>
          <span class="text-[11px] text-slate-400 font-mono">${s.official_number || s.service_no || ''}</span>
        </div>
      `;
    }).join("");
  }
  resultsDiv.classList.remove("hidden");
}

function addSupervisorToZone(sailorId) {
  const zid = document.getElementById("cfg-userZone")?.value || store.settings.selectedSettingsZone;
  if (!zid) {
    showToast("Please select a Zone first", "error");
    return;
  }
  if (!store.settings.zoneInCharges) store.settings.zoneInCharges = {};
  if (!store.settings.zoneInCharges[zid]) store.settings.zoneInCharges[zid] = {};

  let supervisors = Array.isArray(store.settings.zoneInCharges[zid].supervisors)
    ? [...store.settings.zoneInCharges[zid].supervisors]
    : [];

  const s = store.sailors.find(x => String(x.id ?? x._fbKey) === String(sailorId));
  if (!s) return;

  if (supervisors.some(sv => String(sv.id || sv.sailorId) === String(sailorId))) {
    showToast("Supervisor already added", "info");
    return;
  }

  supervisors.push({
    id: sailorId,
    name: `${s.rank} ${s.name}`,
    rank: s.rank || "",
    serviceNo: s.official_number || s.service_no || "",
  });

  store.settings.zoneInCharges[zid].supervisors = supervisors;
  store.settings.zoneInCharges[zid].woSupervisorId = supervisors[0].id;
  store.settings.zoneInCharges[zid].woSupervisorName = supervisors[0].name;

  opsDB.ref(`settings/zoneInCharges/${zid}/supervisors`).set(supervisors);
  opsDB.ref(`settings/zoneInCharges/${zid}/woSupervisorId`).set(supervisors[0].id);
  opsDB.ref(`settings/zoneInCharges/${zid}/woSupervisorName`).set(supervisors[0].name);

  document.getElementById("cfg-addSupervisorSearch").value = "";
  document.getElementById("cfg-addSupervisorSearchResults").classList.add("hidden");
  renderSettingsSupervisorsList(zid);
  showToast(`Added ${s.rank} ${s.name} as supervisor for ${zid}`);
}

function removeSupervisorFromZone(sailorId) {
  const zid = document.getElementById("cfg-userZone")?.value || store.settings.selectedSettingsZone;
  if (!zid) return;
  if (!store.settings.zoneInCharges || !store.settings.zoneInCharges[zid]) return;

  let supervisors = (store.settings.zoneInCharges[zid].supervisors || []).filter(
    sv => String(sv.id || sv.sailorId) !== String(sailorId)
  );

  store.settings.zoneInCharges[zid].supervisors = supervisors;
  if (supervisors.length > 0) {
    store.settings.zoneInCharges[zid].woSupervisorId = supervisors[0].id;
    store.settings.zoneInCharges[zid].woSupervisorName = supervisors[0].name;
    opsDB.ref(`settings/zoneInCharges/${zid}/woSupervisorId`).set(supervisors[0].id);
    opsDB.ref(`settings/zoneInCharges/${zid}/woSupervisorName`).set(supervisors[0].name);
  } else {
    delete store.settings.zoneInCharges[zid].woSupervisorId;
    delete store.settings.zoneInCharges[zid].woSupervisorName;
    opsDB.ref(`settings/zoneInCharges/${zid}/woSupervisorId`).remove();
    opsDB.ref(`settings/zoneInCharges/${zid}/woSupervisorName`).remove();
  }

  opsDB.ref(`settings/zoneInCharges/${zid}/supervisors`).set(supervisors);
  renderSettingsSupervisorsList(zid);
  showToast("Supervisor removed");
}

function renderSettingsZoneTeamList(zoneId) {
  const container = document.getElementById("cfgZoneTeamList");
  if (!container) return;
  const zid = zoneId || document.getElementById("cfg-userZone")?.value || store.settings.selectedSettingsZone;
  if (!zid) {
    container.innerHTML = '<span class="text-xs text-slate-400 italic">Select a Zone above to view zone team</span>';
    const badge = document.getElementById("cfgZoneTeamCountBadge");
    if (badge) badge.textContent = "0";
    return;
  }
  const inc = (store.settings.zoneInCharges || {})[zid] || {};
  const team = Array.isArray(inc.zoneTeam) ? inc.zoneTeam : [];

  const badge = document.getElementById("cfgZoneTeamCountBadge");
  if (badge) badge.textContent = String(team.length);

  if (team.length === 0) {
    container.innerHTML = '<span class="text-xs text-slate-400 italic">No sailors assigned to this zone team yet. Search above to add.</span>';
    return;
  }

  container.innerHTML = team.map(tm => {
    const s = store.sailors.find(x => String(x.id ?? x._fbKey) === String(tm.id || tm.sailorId)) || tm;
    const sid = String(tm.id || tm.sailorId || tm._fbKey);
    const isReleased = !!tm.releasedForOtherZones;
    return `
      <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold shadow-2xs ${
        isReleased 
          ? "bg-amber-50 text-amber-900 border-amber-300 ring-1 ring-amber-200" 
          : "bg-teal-50 text-teal-900 border-teal-200"
      }">
        <span>⚓ ${s.rank || ''} ${s.name || tm.name} <span class="font-mono text-[10px] text-slate-500">(${s.official_number || s.service_no || tm.serviceNo || ''})</span></span>
        <button onclick="toggleSailorZoneRelease('${sid}')" class="text-[10px] px-1.5 py-0.5 rounded font-bold transition-all ${
          isReleased ? "bg-amber-200 text-amber-900 hover:bg-amber-300" : "bg-teal-200 text-teal-900 hover:bg-teal-300"
        }" title="${isReleased ? 'Click to reclaim in zone' : 'Click to release for other zones'}">
          ${isReleased ? '🔓 Released' : '🔒 In-Zone'}
        </button>
        <button onclick="removeSailorFromZoneTeam('${sid}')" class="text-slate-400 hover:text-red-600 font-bold ml-1 p-0.5" title="Remove from Team">✕</button>
      </div>
    `;
  }).join("");
}

function showAddZoneTeamResults() {
  const resultsDiv = document.getElementById("cfg-addZoneTeamSearchResults");
  if (!resultsDiv) return;
  resultsDiv.classList.remove("hidden");
  filterAddZoneTeamResults(document.getElementById("cfg-addZoneTeamSearch")?.value || "");
}

function filterAddZoneTeamResults(query) {
  const resultsDiv = document.getElementById("cfg-addZoneTeamSearchResults");
  if (!resultsDiv) return;
  const zid = document.getElementById("cfg-userZone")?.value || store.settings.selectedSettingsZone;
  if (!zid) {
    resultsDiv.innerHTML = '<div class="p-3 text-xs text-red-500 italic">Please select a Zone first</div>';
    resultsDiv.classList.remove("hidden");
    return;
  }
  const inc = (store.settings.zoneInCharges || {})[zid] || {};
  const currentTeam = new Set((inc.zoneTeam || []).map(s => String(s.id || s.sailorId)));

  const q = (query || "").toLowerCase().trim();
  let filtered = (store.sailors || []).filter(s => {
    const sid = String(s.id ?? s._fbKey);
    if (currentTeam.has(sid)) return false;
    if (!q) return true;
    const name = (s.name || "").toLowerCase();
    const offNo = (s.official_number || s.officialNumber || s.service_no || "").toLowerCase();
    const rank = (s.rank || "").toLowerCase();
    const trade = (s.trade || "").toLowerCase();
    return name.includes(q) || offNo.includes(q) || rank.includes(q) || trade.includes(q);
  });

  if (filtered.length === 0) {
    resultsDiv.innerHTML = '<div class="p-3 text-xs text-slate-400 italic">No matching sailors found</div>';
  } else {
    resultsDiv.innerHTML = filtered.slice(0, 30).map(s => {
      const sid = String(s.id !== undefined && s.id !== null ? s.id : s._fbKey);
      return `
        <div onclick="addSailorToZoneTeam('${sid}')" class="p-2.5 text-xs hover:bg-teal-50 cursor-pointer text-slate-700 transition-colors flex items-center justify-between">
          <span class="font-semibold text-slate-800">${s.rank || ''} ${s.name} <span class="text-teal-700 font-normal">(${s.trade || 'General'})</span></span>
          <span class="text-[11px] text-slate-400 font-mono">${s.official_number || s.service_no || ''}</span>
        </div>
      `;
    }).join("");
  }
  resultsDiv.classList.remove("hidden");
}

function addSailorToZoneTeam(sailorId) {
  const zid = document.getElementById("cfg-userZone")?.value || store.settings.selectedSettingsZone;
  if (!zid) {
    showToast("Please select a Zone first", "error");
    return;
  }
  if (!store.settings.zoneInCharges) store.settings.zoneInCharges = {};
  if (!store.settings.zoneInCharges[zid]) store.settings.zoneInCharges[zid] = {};

  let team = Array.isArray(store.settings.zoneInCharges[zid].zoneTeam)
    ? [...store.settings.zoneInCharges[zid].zoneTeam]
    : [];

  const s = store.sailors.find(x => String(x.id ?? x._fbKey) === String(sailorId));
  if (!s) return;

  if (team.some(tm => String(tm.id || tm.sailorId) === String(sailorId))) {
    showToast("Sailor already in Zone Team", "info");
    return;
  }

  team.push({
    id: sailorId,
    name: s.name,
    rank: s.rank || "",
    serviceNo: s.official_number || s.service_no || "",
    trade: s.trade || "",
    releasedForOtherZones: false,
  });

  store.settings.zoneInCharges[zid].zoneTeam = team;
  opsDB.ref(`settings/zoneInCharges/${zid}/zoneTeam`).set(team);

  document.getElementById("cfg-addZoneTeamSearch").value = "";
  document.getElementById("cfg-addZoneTeamSearchResults").classList.add("hidden");
  renderSettingsZoneTeamList(zid);
  showToast(`Added ${s.name} to ${zid} Zone Team`);
}

function removeSailorFromZoneTeam(sailorId) {
  const zid = document.getElementById("cfg-userZone")?.value || store.settings.selectedSettingsZone;
  if (!zid) return;
  if (!store.settings.zoneInCharges || !store.settings.zoneInCharges[zid]) return;

  let team = (store.settings.zoneInCharges[zid].zoneTeam || []).filter(
    tm => String(tm.id || tm.sailorId) !== String(sailorId)
  );

  store.settings.zoneInCharges[zid].zoneTeam = team;
  opsDB.ref(`settings/zoneInCharges/${zid}/zoneTeam`).set(team);
  renderSettingsZoneTeamList(zid);
  showToast("Sailor removed from Zone Team");
}

function toggleSailorZoneRelease(sailorId) {
  const zid = document.getElementById("cfg-userZone")?.value || store.settings.selectedSettingsZone;
  if (!zid) return;
  if (!store.settings.zoneInCharges || !store.settings.zoneInCharges[zid]) return;

  let team = [...(store.settings.zoneInCharges[zid].zoneTeam || [])];
  const item = team.find(tm => String(tm.id || tm.sailorId) === String(sailorId));
  if (!item) return;

  item.releasedForOtherZones = !item.releasedForOtherZones;
  store.settings.zoneInCharges[zid].zoneTeam = team;
  opsDB.ref(`settings/zoneInCharges/${zid}/zoneTeam`).set(team);
  renderSettingsZoneTeamList(zid);
  showToast(item.releasedForOtherZones ? `Sailor released for deployment to other zones` : `Sailor marked as In-Zone only`);
}

function populateSettingsZoneOfficersDropdowns(zoneId) {
  const profileSelect = document.getElementById("cfg-addZoneOfficerProfileSelect");
  const locSelect = document.getElementById("cfg-addZoneOfficerLocationSelect");
  
  if (profileSelect) {
    const profs = getOicProfiles();
    let html = '<option value="">-- Choose Officer --</option>';
    profs.forEach(p => {
      html += `<option value="${p.id}">${p.rank || ''} ${p.name} (${p.serviceNo || ''})</option>`;
    });
    profileSelect.innerHTML = html;
  }

  if (locSelect) {
    const zid = zoneId || document.getElementById("cfg-userZone")?.value || store.settings.selectedSettingsZone;
    const locs = (store.locations || []).filter(l => l.zone_id === zid);
    let html = `
      <optgroup label="Functional / Work Scope">
        <option value="All CE Works in AOR">🌐 All CE Works in AOR</option>
        <option value="Road Network">🛣️ Road Network</option>
        <option value="Marine Construction">⚓ Marine Construction</option>
        <option value="Water Distribution">💧 Water Distribution</option>
        <option value="Construction">🏗️ Construction</option>
        <option value="Renovation">🔨 Renovation</option>
      </optgroup>
    `;
    if (locs.length > 0) {
      html += '<optgroup label="Specific Buildings / Locations in Zone">';
      locs.forEach(l => {
        const locId = l.id || l._fbKey;
        html += `<option value="${locId}">🏢 ${l.building_name} (${l.sub_location || 'General'})</option>`;
      });
      html += '</optgroup>';
    }
    locSelect.innerHTML = html;
  }
}

function renderSettingsZoneOfficersList(zoneId) {
  const container = document.getElementById("cfgZoneOfficersList");
  if (!container) return;
  const zid = zoneId || document.getElementById("cfg-userZone")?.value || store.settings.selectedSettingsZone;
  if (!zid) {
    container.innerHTML = '<span class="text-xs text-slate-400 italic col-span-full">Select a Zone above to view appointed officers</span>';
    const badge = document.getElementById("cfgZoneOfficersCountBadge");
    if (badge) badge.textContent = "0 Officers";
    return;
  }
  const inc = (store.settings.zoneInCharges || {})[zid] || {};
  const officers = Array.isArray(inc.officers) ? inc.officers : [];

  const badge = document.getElementById("cfgZoneOfficersCountBadge");
  if (badge) badge.textContent = `${officers.length} Officer${officers.length === 1 ? '' : 's'}`;

  populateSettingsZoneOfficersDropdowns(zid);

  if (officers.length === 0) {
    container.innerHTML = '<span class="text-xs text-slate-400 italic col-span-full">No officers appointed to this zone yet. Choose an officer above to appoint.</span>';
    return;
  }

  container.innerHTML = officers.map(off => {
    const cleanNo = off.serviceNo ? off.serviceNo.replace(/[^a-zA-Z0-9]/g, "") : "";
    const shortRank = off.rank ? off.rank.replace(/[a-z\s()]/gi, "").substring(0, 3) : "OIC";
    const fallbackText = `<div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs flex-shrink-0">${shortRank}</div>`;
    const avatarHtml = cleanNo
      ? `<img src="images/${cleanNo}.JPG" data-fallback="${fallbackText.replace(/"/g, "&quot;")}" class="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-indigo-200" onerror="handleProfilePicError(this, '${cleanNo}')">`
      : fallbackText;

    const locText = off.locationName || off.locationId || "All CE Works in AOR";

    return `
      <div class="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200 flex items-center justify-between gap-2 shadow-2xs">
        <div class="flex items-center gap-2.5 min-w-0">
          ${avatarHtml}
          <div class="min-w-0 text-left">
            <p class="text-xs font-bold text-slate-900 truncate">${escapeHtml(off.rank)} ${escapeHtml(off.name)}</p>
            <div class="flex items-center gap-1.5 flex-wrap mt-0.5">
              <span class="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">${escapeHtml(off.role)}</span>
              <span class="text-[9px] text-slate-500 font-mono">${escapeHtml(off.serviceNo)}</span>
            </div>
            <p class="text-[10px] text-indigo-600 font-medium truncate mt-0.5">📍 ${escapeHtml(locText)}</p>
          </div>
        </div>
        <button type="button" onclick="removeOfficerFromCurrentZone('${off.id}')" class="text-indigo-400 hover:text-red-600 p-1 font-bold text-xs" title="Remove Officer Appointment">✕</button>
      </div>
    `;
  }).join("");
}

function addOfficerToCurrentZone() {
  const zid = document.getElementById("cfg-userZone")?.value || store.settings.selectedSettingsZone;
  if (!zid) {
    showToast("Please select a Zone first", "error");
    return;
  }
  const profId = document.getElementById("cfg-addZoneOfficerProfileSelect")?.value;
  if (!profId) {
    showToast("Please select an Officer Profile", "warning");
    return;
  }
  const role = document.getElementById("cfg-addZoneOfficerRoleSelect")?.value || "OIC";
  const locId = document.getElementById("cfg-addZoneOfficerLocationSelect")?.value || "All CE Works in AOR";

  const profs = getOicProfiles();
  const prof = profs.find(p => p.id === profId);
  if (!prof) return;

  if (!store.settings.zoneInCharges) store.settings.zoneInCharges = {};
  if (!store.settings.zoneInCharges[zid]) store.settings.zoneInCharges[zid] = {};

  let officers = Array.isArray(store.settings.zoneInCharges[zid].officers)
    ? [...store.settings.zoneInCharges[zid].officers]
    : [];

  let locName = locId;
  const locObj = (store.locations || []).find(l => String(l.id || l._fbKey) === String(locId));
  if (locObj) {
    locName = `${locObj.building_name} (${locObj.sub_location || 'General'})`;
  }

  const existingIdx = officers.findIndex(o => o.id === profId && o.locationId === locId);
  if (existingIdx >= 0) {
    officers[existingIdx].role = role;
    officers[existingIdx].locationId = locId;
    officers[existingIdx].locationName = locName;
  } else {
    officers.push({
      id: profId,
      name: prof.name,
      rank: prof.rank,
      serviceNo: prof.serviceNo,
      role: role,
      locationId: locId,
      locationName: locName,
      appointedAt: Date.now()
    });
  }

  store.settings.zoneInCharges[zid].officers = officers;
  opsDB.ref(`settings/zoneInCharges/${zid}/officers`).set(officers);
  renderSettingsZoneOfficersList(zid);
  showToast(`🎖️ Appointed ${prof.rank} ${prof.name} as ${role} for ${zid}!`, "success");
}

function removeOfficerFromCurrentZone(officerId) {
  const zid = document.getElementById("cfg-userZone")?.value || store.settings.selectedSettingsZone;
  if (!zid || !store.settings.zoneInCharges || !store.settings.zoneInCharges[zid]) return;

  let officers = (store.settings.zoneInCharges[zid].officers || []).filter(
    o => o.id !== officerId
  );
  store.settings.zoneInCharges[zid].officers = officers;
  opsDB.ref(`settings/zoneInCharges/${zid}/officers`).set(officers);
  renderSettingsZoneOfficersList(zid);
  showToast("Officer appointment removed", "info");
}
function getEcSailors() {
  return store.sailors.filter((sailor) => {
    const offNo = (
      sailor.official_number ||
      sailor.officialNumber ||
      sailor.service_no ||
      ""
    ).trim(); // Remove leading non-alphanumeric characters (like spaces, slashes, dashes)
    const cleanOffNo = offNo.replace(/^[^a-zA-Z0-9]+/, "");
    return cleanOffNo.toUpperCase().startsWith("EC");
  });
}

// Master Admin and Authority Helpers
function isMasterAdmin(userOrProfile) {
  if (!userOrProfile) {
    userOrProfile = store.currentUser;
  }
  if (!userOrProfile && store.activeProfileType === "OIC" && store.activeOicProfileId) {
    userOrProfile = (typeof getOicProfiles === "function" ? getOicProfiles() : []).find(
      (p) => p.id === store.activeOicProfileId
    );
  }
  if (!userOrProfile) {
    const savedServiceNo = localStorage.getItem("ncw_logged_officer_no") || "";
    return savedServiceNo.includes("3576");
  }
  const svc = String(userOrProfile.serviceNo || userOrProfile.service_no || userOrProfile.svc || "");
  const auth = String(userOrProfile.authority || userOrProfile.authorityRole || "");
  return svc.includes("3576") || auth === "master_admin";
}

function isCurrentMasterAdmin() {
  if (isMainAdminLoggedIn()) return true;
  if (store.currentUser && isMasterAdmin(store.currentUser)) return true;
  if (store.activeProfileType === "OIC" && store.activeOicProfileId) {
    const p = (typeof getOicProfiles === "function" ? getOicProfiles() : []).find(
      (prof) => prof.id === store.activeOicProfileId
    );
    if (p && isMasterAdmin(p)) return true;
  }
  return false;
}

function getCurrentOfficer() {
  if (store.activeProfileType === "OIC" && store.activeOicProfileId) {
    const profs = typeof getOicProfiles === "function" ? getOicProfiles() : [];
    return profs.find((p) => p.id === store.activeOicProfileId) || null;
  }
  if (store.currentUser && isMasterAdmin(store.currentUser)) {
    return store.currentUser;
  }
  return null;
}

function isOfficerLoggedIn() {
  return Boolean(getCurrentOfficer()) || isCurrentMasterAdmin() || store.activeProfileType === "OIC";
}


function isOfficerAuthorizedToEditWorkOrdersAndEstimates() {
  if (typeof isCurrentMasterAdmin === "function" && isCurrentMasterAdmin()) return true;

  const currOfficer = typeof getCurrentOfficer === "function" ? getCurrentOfficer() : null;
  if (currOfficer) {
    const auth = String(currOfficer.authority || "");
    const offNo = String(currOfficer.serviceNo || "");
    if (offNo.includes("3576") || auth === "master_admin") return true;
    if (["cced_e", "cceo_e", "oic_1", "oic_2", "oic_3", "proj_eng"].includes(auth)) return true;
  }

  if (store.activeProfileType === "OIC") return true;
  if (store.activeProfileType === "ZoneInCharge" || store.activeProfileType === "ZoneSubInCharge") {
    return true;
  }

  const activeProfId = store.activeOicProfileId;
  if (activeProfId && store.settings && store.settings.zoneInCharges) {
    for (const zid in store.settings.zoneInCharges) {
      const zData = store.settings.zoneInCharges[zid];
      if (zData && Array.isArray(zData.officers)) {
        const off = zData.officers.find((o) => String(o.id) === String(activeProfId));
        if (off) {
          const role = String(off.role || "").toUpperCase();
          if (
            role.includes("CCED") ||
            role.includes("CCEO") ||
            role.includes("OIC") ||
            role.includes("2IC") ||
            role.includes("3IC") ||
            role.includes("PROJECT") ||
            role.includes("ENGINEER")
          ) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

function isNotificationTargetOfficer() {
  if (typeof isCurrentMasterAdmin === "function" && isCurrentMasterAdmin()) return true;
  const currOfficer = typeof getCurrentOfficer === "function" ? getCurrentOfficer() : null;
  if (currOfficer) {
    const auth = String(currOfficer.authority || "");
    if (["oic_1", "oic_2", "oic_3", "proj_eng", "cced_e", "cceo_e", "master_admin"].includes(auth)) {
      return true;
    }
  }
  if (store.activeProfileType === "OIC") return true;
  if (store.activeProfileType === "ZoneInCharge" || store.activeProfileType === "ZoneSubInCharge") return true;

  const activeProfId = store.activeOicProfileId;
  if (activeProfId && store.settings && store.settings.zoneInCharges) {
    for (const zid in store.settings.zoneInCharges) {
      const zData = store.settings.zoneInCharges[zid];
      if (zData && Array.isArray(zData.officers)) {
        const off = zData.officers.find((o) => String(o.id) === String(activeProfId));
        if (off) return true;
      }
    }
  }
  return false;
}

function getDuplicatedWorkOrders() {
  const wos = store.workOrders || [];
  const descMap = new Map();
  const duplicates = [];

  wos.forEach((w) => {
    const desc = (w.description || "").trim().toLowerCase();
    if (!desc || desc.length < 3) return;
    const zid = w.zone_id || store.currentZone || "";
    const key = zid + ":::" + desc;
    if (!descMap.has(key)) {
      descMap.set(key, [w]);
    } else {
      descMap.get(key).push(w);
    }
  });

  descMap.forEach((group) => {
    if (group.length > 1) {
      duplicates.push(...group);
    }
  });

  const seen = new Set();
  return duplicates.filter((w) => {
    const k = String(w._fbKey || w.id);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function getPendingDailyEvaluations() {
  const today = getLocalDateString();
  const dateVal = store.dashboardDate || today;
  const list = [];
  if (!store.sailors) return list;

  const assignedMap = new Map();
  (store.workOrders || []).forEach((wo) => {
    if ((wo.status === "Active" || wo.status === "Pending") && Array.isArray(wo.assigned)) {
      wo.assigned.forEach((sid) => {
        assignedMap.set(String(sid), {
          workOrderId: wo._fbKey || wo.id,
          workOrderDesc: wo.description || "Work Order",
          zoneId: wo.zone_id || store.currentZone
        });
      });
    }
  });

  if (assignedMap.size === 0 && Array.isArray(store.dailyAllocations)) {
    store.dailyAllocations.forEach((alloc) => {
      if (alloc.date === dateVal && alloc.sailor_id) {
        assignedMap.set(String(alloc.sailor_id), {
          workOrderId: alloc.work_order_id || "",
          workOrderDesc: "Daily Allocation",
          zoneId: store.currentZone
        });
      }
    });
  }

  store.sailors.forEach((s) => {
    const sid = String(s.id || s._fbKey);
    if (assignedMap.has(sid)) {
      const alloc = (store.dailyAllocations || []).find(
        (a) => a.date === dateVal && String(a.sailor_id) === sid
      );
      const isEval = alloc ? alloc.evaluated === true : s.evaluated === true;
      if (!isEval) {
        const woInfo = assignedMap.get(sid);
        list.push({
          sailor: s,
          workOrderId: woInfo.workOrderId,
          workOrderDesc: woInfo.workOrderDesc,
          zoneId: woInfo.zoneId,
          date: dateVal
        });
      }
    }
  });

  return list;
}

function handleOicAuthorityChange(val) {
  const permSettingsCb = document.getElementById("oicPermSettings");
  if (permSettingsCb) {
    if (val === "master_admin") {
      permSettingsCb.checked = true;
      permSettingsCb.disabled = false;
    } else {
      permSettingsCb.checked = false;
      permSettingsCb.disabled = true;
    }
  }
  const allZonesCb = document.getElementById("oicPermAllZones");
  if (allZonesCb && (val === "cced_e" || val === "cceo_e" || val === "master_admin")) {
    allZonesCb.checked = true;
    toggleSelectAllZonesPerm(true);
  }
  const allInvZonesCb = document.getElementById("oicPermAllInvZones");
  if (allInvZonesCb && (val === "cced_e" || val === "cceo_e" || val === "master_admin")) {
    allInvZonesCb.checked = true;
    toggleSelectAllInvZonesPerm(true);
  }
}

function getAuthorityBadge(authKey, serviceNo = "") {
  if (authKey === "master_admin" || (serviceNo && serviceNo.includes("3576"))) {
    return `<span class="badge-authority badge-auth-master inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-xs">👑 SYSTEM ADMINISTRATOR</span>`;
  }
  if (authKey === "cced_e") {
    return `<span class="badge-authority badge-auth-cced inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-xs">🏛️ CCED(E)</span>`;
  }
  if (authKey === "cceo_e") {
    return `<span class="badge-authority badge-auth-cceo inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs">⚓ CCEO(E)</span>`;
  }
  if (authKey === "oic_1") {
    return `<span class="badge-authority badge-auth-oic1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs">⭐ 1st OIC (In-Charge)</span>`;
  }
  if (authKey === "oic_2") {
    return `<span class="badge-authority badge-auth-oic2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs">🎖️ 2nd OIC (2IC)</span>`;
  }
  if (authKey === "oic_3") {
    return `<span class="badge-authority badge-auth-oic3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs">🛡️ 3rd OIC (3IC)</span>`;
  }
  if (authKey === "proj_eng") {
    return `<span class="badge-authority badge-auth-projeng inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs">📋 Project Engineer</span>`;
  }
  return `<span class="badge-authority badge-auth-general inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium">👤 General Officer</span>`;
}

function openSettingsView() {
  const isMaster = isCurrentMasterAdmin();
  if (!isMaster) {
    showToast("Access Denied: Settings are restricted to Master Administrator (NRC 3576) only.", "error");
    return;
  }
  switchView("settings");
}

function toggleOicPasswordVisibility() {
  const pwdInput = document.getElementById("oicProfPassword");
  const eyeIcon = document.getElementById("oicPwdEyeIcon");
  if (!pwdInput) return;
  if (pwdInput.type === "password") {
    pwdInput.type = "text";
    if (eyeIcon) eyeIcon.textContent = "🙈";
  } else {
    pwdInput.type = "password";
    if (eyeIcon) eyeIcon.textContent = "👁️";
  }
}

// Helper to retrieve all OIC profiles
function getOicProfiles() {
  const s = store.settings || {};
  let profiles = [];
  if (s.oicProfiles) {
    profiles = Object.entries(s.oicProfiles).map(([k, v]) => Object.assign({id: k}, v)).filter(
      (p) => p !== null && p !== undefined,
    );
  }

  // Ensure Master Admin (LCDR KMAU Kahandawa - NRC 3576) is always present and marked as master_admin
  let masterProf = profiles.find((p) => (p.serviceNo || "").includes("3576"));
  if (masterProf) {
    masterProf.authority = "master_admin";
    masterProf.permSettings = true;
    masterProf.permAllZones = true;
    masterProf.permAllInvZones = true;
    if (!masterProf.recoveryEmail1) masterProf.recoveryEmail1 = "creativeparadise25@gmail.com";
    if (!masterProf.recoveryEmail2) masterProf.recoveryEmail2 = "arjunaudeshk@gmail.com";
    if (!masterProf.pin) masterProf.pin = "3576";
    if (!masterProf.designation) masterProf.designation = "System Administrator";
    if (!masterProf.phone) masterProf.phone = "+94 77 1234567";
  } else {
    // If not present in stored oicProfiles, create default master admin
    const defaultMaster = {
      id: "oic_master_3576",
      name: "KMAU KAHANDAWA",
      rank: "LCDR (CE)",
      serviceNo: "NRC 3576",
      authority: "master_admin",
      password: "",
      permSettings: true,
      permDashboard: true,
      permJobCards: true,
      permInventory: true,
      permEstimates: true,
      permLMD: true,
      permSailors: true,
      permReports: true,
      permAllZones: true,
      permAllInvZones: true,
      allowedZones: store.zones ? store.zones.map((z) => z.id) : [],
      allowedInvZones: store.zones ? store.zones.map((z) => z.id) : [],
    };
    profiles.unshift(defaultMaster);
  }

  return profiles;
}

// Render OIC Profiles Management List
function renderSettingsOicProfilesList() {
  const listEl = document.getElementById("cfg-oicProfilesList");
  if (!listEl) return;
  const profiles = getOicProfiles();
  const isMaster = isCurrentMasterAdmin();

  // Show/hide Add Officer button (Master Admin only)
  const addBtn = document.querySelector(
    'button[onclick="openOicProfileModal()"]',
  );
  if (addBtn) {
    addBtn.style.display = isMaster ? "" : "none";
  }

  if (profiles.length === 0) {
    listEl.innerHTML = `<div class="p-4 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 italic">No Officer-In-Charge profiles added yet.</div>`;
    return;
  }

  listEl.innerHTML = profiles
    .map((p) => {
      const cleanNo = p.serviceNo
        ? p.serviceNo.replace(/[^a-zA-Z0-9]/g, "")
        : "";
      const shortRank = p.rank
        ? p.rank.replace(/[a-z\s()]/gi, "").substring(0, 3)
        : "OIC";
      const fallbackText = `<div class="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">${shortRank}</div>`;
      const avatarHtml = cleanNo
        ? `<img src="images/${cleanNo}.JPG" data-fallback="${fallbackText.replace(/"/g, "&quot;")}" class="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-slate-200" onerror="handleProfilePicError(this, '${cleanNo}')">`
        : fallbackText;
      
      const isProfileMaster = (p.serviceNo || "").includes("3576") || p.authority === "master_admin";
      const authBadge = getAuthorityBadge(p.authority, p.serviceNo);
      
      // Perm summary
      const permList = [];
      if (p.permSettings || isProfileMaster) permList.push("Settings");
      if (p.permAllZones || isProfileMaster) permList.push("All Zones Control");
      else if (p.allowedZones && p.allowedZones.length > 0) permList.push(`${p.allowedZones.length} Zones Delegated`);
      
      if (p.permAllInvZones || isProfileMaster) permList.push("All Inventory");
      else if (p.allowedInvZones && p.allowedInvZones.length > 0) permList.push(`${p.allowedInvZones.length} Inv Stores`);

      const permText = permList.length > 0 ? `Access: ${permList.join(" • ")}` : "Access: None";
      
      const actionsHtml = isMaster
        ? `
            <div class="flex items-center gap-1">
                <button onclick="editOicProfile('${p.id}')" class="text-blue-500 hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-50 transition-all cursor-pointer" title="Edit Profile">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
                ${
                  !isProfileMaster
                    ? `<button onclick="deleteOicProfile('${p.id}')" class="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-all cursor-pointer" title="Delete Profile">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>`
                    : ""
                }
            </div>
        `
        : "";

      return `
            <div class="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 transition-all">
                <div class="flex items-center gap-3 min-w-0">
                    ${avatarHtml}
                    <div class="min-w-0 text-left">
                        <div class="flex items-center gap-2 flex-wrap">
                            <p class="text-sm font-bold text-slate-800 truncate">${p.rank} ${p.name}</p>
                            ${authBadge}
                        </div>
                        <p class="text-[11px] text-slate-500 font-semibold font-mono mt-0.5">${p.serviceNo} ${p.password ? `• 🔒 Password: <span class="font-mono text-slate-700">${p.password}</span>` : "• 🔓 No Password"}</p>
                        <p class="text-[10px] text-teal-700 font-semibold mt-0.5">${permText}</p>
                    </div>
                </div>
                ${actionsHtml}
            </div>
        `;
    })
    .join("");
}

function openOicProfileModal() {
  try {
    document.getElementById("oicProfileModalTitle").textContent = "Add Officer Profile";
    document.getElementById("oicProfId").value = "";
    document.getElementById("oicProfName").value = "";
    document.getElementById("oicProfRank").value = "";
    document.getElementById("oicProfServiceNo").value = "";
    document.getElementById("oicProfPassword").value = "";
    document.getElementById("oicProfPassword").type = "password";
    const eyeIcon = document.getElementById("oicPwdEyeIcon");
    if (eyeIcon) eyeIcon.textContent = "👁️";
    
    document.getElementById("oicProfAuthority").value = "oic_1";
    const permSettingsEl = document.getElementById("oicPermSettings");
    if (permSettingsEl) {
      permSettingsEl.checked = false;
      permSettingsEl.disabled = true;
    }
    document.getElementById("oicPermDashboard").checked = true;
    document.getElementById("oicPermJobCards").checked = true;
    document.getElementById("oicPermInventory").checked = true;
    document.getElementById("oicPermEstimates").checked = true;
    document.getElementById("oicPermLMD").checked = true;
    document.getElementById("oicPermSailors").checked = true;
    document.getElementById("oicPermReports").checked = true;
    
    document.getElementById("oicPermAllZones").checked = true;
    renderOicZonesPermissionCheckboxes(store.zones.map((z) => z.id));
    toggleSelectAllZonesPerm(true);

    document.getElementById("oicPermAllInvZones").checked = true;
    renderOicInvZonesPermissionCheckboxes(store.zones.map((z) => z.id));
    toggleSelectAllInvZonesPerm(true);

    const modal = document.getElementById("oicProfileModal");
    if (modal) {
      modal.classList.remove("hidden");
      modal.style.setProperty("display", "flex", "important");
      modal.style.setProperty("opacity", "1", "important");
      modal.style.setProperty("visibility", "visible", "important");
      modal.style.setProperty("z-index", "999999", "important");
    }
  } catch (err) {
    alert("Error in openOicProfileModal: " + err.message);
    console.error(err);
  }
}

function editOicProfile(id) {
  try {
    const profiles = getOicProfiles();
    const profile = profiles.find((p) => String(p.id) === String(id));
    if (!profile) {
      alert("Error: Profile not found in store! ID: " + id);
      return;
    }

    document.getElementById("oicProfileModalTitle").textContent = "Edit Officer Profile";
    document.getElementById("oicProfId").value = profile.id;
    document.getElementById("oicProfName").value = profile.name;
    document.getElementById("oicProfRank").value = profile.rank;
    document.getElementById("oicProfServiceNo").value = profile.serviceNo;
    document.getElementById("oicProfPassword").value = profile.password || "";
    document.getElementById("oicProfPassword").type = "password";
    const eyeIcon = document.getElementById("oicPwdEyeIcon");
    if (eyeIcon) eyeIcon.textContent = "👁️";

    // Authority
    const isMaster = (profile.serviceNo || "").includes("3576") || profile.authority === "master_admin";
    document.getElementById("oicProfAuthority").value = isMaster ? "master_admin" : (profile.authority || "oic_1");

    // Tab permissions
    const permSettingsEl = document.getElementById("oicPermSettings");
    if (permSettingsEl) {
      permSettingsEl.checked = isMaster;
      permSettingsEl.disabled = !isMaster;
    }
    document.getElementById("oicPermDashboard").checked = profile.permDashboard !== false;
    document.getElementById("oicPermJobCards").checked = profile.permJobCards !== false;
    document.getElementById("oicPermInventory").checked = profile.permInventory !== false;
    document.getElementById("oicPermEstimates").checked = profile.permEstimates !== false;
    document.getElementById("oicPermLMD").checked = profile.permLMD !== false;
    document.getElementById("oicPermSailors").checked = profile.permSailors !== false;
    document.getElementById("oicPermReports").checked = profile.permReports !== false;

    // Zone permissions (Delegated Control)
    const allZonesChecked = profile.permAllZones === true || isMaster;
    document.getElementById("oicPermAllZones").checked = allZonesChecked;
    const allowedZones = profile.allowedZones || [];
    renderOicZonesPermissionCheckboxes(allowedZones);
    if (allZonesChecked) {
      toggleSelectAllZonesPerm(true);
    }

    // Inventory Scope permissions
    const allInvZonesChecked = profile.permAllInvZones !== false || isMaster;
    document.getElementById("oicPermAllInvZones").checked = allInvZonesChecked;
    const allowedInvZones = profile.allowedInvZones || [];
    renderOicInvZonesPermissionCheckboxes(allowedInvZones);
    if (allInvZonesChecked) {
      toggleSelectAllInvZonesPerm(true);
    }

    const modal = document.getElementById("oicProfileModal");
    if (modal) {
      modal.classList.remove("hidden");
      modal.style.setProperty("display", "flex", "important");
      modal.style.setProperty("opacity", "1", "important");
      modal.style.setProperty("visibility", "visible", "important");
      modal.style.setProperty("z-index", "999999", "important");
    }
  } catch (err) {
    alert("Error opening edit modal: " + err.message);
    console.error(err);
  }
}

function saveOicProfile(event) {
  event.preventDefault();
  const id = document.getElementById("oicProfId").value;
  const name = document.getElementById("oicProfName").value.trim();
  const rank = document.getElementById("oicProfRank").value.trim();
  const serviceNo = document.getElementById("oicProfServiceNo").value.trim();
  const password = document.getElementById("oicProfPassword").value;
  const authority = document.getElementById("oicProfAuthority").value;

  const isMaster = serviceNo.includes("3576") || authority === "master_admin";

  const isExecutiveDept = (authority === "cced_e" || authority === "cceo_e");
  const permSettings = isMaster ? true : false;
  const permDashboard = document.getElementById("oicPermDashboard").checked;
  const permJobCards = document.getElementById("oicPermJobCards").checked;
  const permInventory = document.getElementById("oicPermInventory").checked;
  const permEstimates = document.getElementById("oicPermEstimates").checked;
  const permLMD = document.getElementById("oicPermLMD").checked;
  const permSailors = document.getElementById("oicPermSailors").checked;
  const permReports = document.getElementById("oicPermReports").checked;
  
  const permAllZones = isMaster || isExecutiveDept || document.getElementById("oicPermAllZones").checked;
  let allowedZones = [];
  if (permAllZones) {
    allowedZones = store.zones.map((z) => z.id);
  } else {
    document
      .querySelectorAll('input[name="oicZonePermCheckbox"]:checked')
      .forEach((cb) => {
        allowedZones.push(cb.value);
      });
  }

  const permAllInvZones = isMaster || isExecutiveDept || document.getElementById("oicPermAllInvZones").checked;
  let allowedInvZones = [];
  if (permAllInvZones) {
    allowedInvZones = store.zones.map((z) => z.id);
  } else {
    document
      .querySelectorAll('input[name="oicInvZonePermCheckbox"]:checked')
      .forEach((cb) => {
        allowedInvZones.push(cb.value);
      });
  }

  const profileId = id || (serviceNo.includes("3576") ? "oic_master_3576" : "oic_" + Date.now());
  const profileData = {
    id: profileId,
    name,
    rank,
    serviceNo,
    authority,
    password,
    permSettings,
    permDashboard,
    permJobCards,
    permInventory,
    permEstimates,
    permLMD,
    permSailors,
    permReports,
    permAllZones,
    allowedZones,
    permAllInvZones,
    allowedInvZones,
  };

  if (!store.settings.oicProfiles) store.settings.oicProfiles = {};
  store.settings.oicProfiles[profileId] = profileData;
  opsDB
    .ref(`settings/oicProfiles/${profileId}`)
    .set(profileData)
    .then(() => {
      closeModal("oicProfileModal");
      applySettings();
      renderSettingsOicProfilesList();
      showToast("Officer Profile saved successfully");
      if (store.activeOicProfileId === profileId) {
        applyActiveProfile();
      }
    });
}

function deleteOicProfile(id) {
  if (id === "oic_master_3576" || String(id).includes("3576")) {
    showToast("Master Admin profile cannot be deleted!", "error");
    return;
  }
  if (!confirm("Are you sure you want to delete this officer profile?")) return;
  if (store.settings.oicProfiles) {
    delete store.settings.oicProfiles[id];
  }
  opsDB
    .ref(`settings/oicProfiles/${id}`)
    .remove()
    .then(() => {
      applySettings();
      renderSettingsOicProfilesList();
      showToast("Officer Profile deleted");
    });
}

function renderOicZonesPermissionCheckboxes(selectedZones = []) {
  const listEl = document.getElementById("oicZonesPermissionList");
  if (!listEl) return;
  const sortedZones = [...store.zones].sort((a, b) =>
    (a.name || "").localeCompare(b.name || ""),
  );
  listEl.innerHTML =
    sortedZones
      .map((z) => {
        const checked = selectedZones.includes(z.id) ? "checked" : "";
        return `
            <label class="flex items-center gap-2 text-xs text-slate-600 cursor-pointer truncate" title="${z.name}">
                <input type="checkbox" name="oicZonePermCheckbox" value="${z.id}" ${checked} onchange="onOicZoneCheckboxChange()" class="rounded border-slate-300 text-teal-600 focus:ring-teal-500">
                <span class="truncate">${z.name}</span>
            </label>
        `;
      })
      .join("") ||
    '<div class="col-span-2 text-center text-xs text-slate-400 italic">No zones configured yet</div>';
}

function toggleSelectAllZonesPerm(checked) {
  document
    .querySelectorAll('input[name="oicZonePermCheckbox"]')
    .forEach((cb) => {
      cb.checked = checked;
      cb.disabled = checked;
    });
}

function onOicZoneCheckboxChange() {
  const allChecked = Array.from(
    document.querySelectorAll('input[name="oicZonePermCheckbox"]'),
  ).every((cb) => cb.checked);
  const allZonesCheckbox = document.getElementById("oicPermAllZones");
  if (allZonesCheckbox && !allChecked) {
    allZonesCheckbox.checked = false;
  }
}

function renderOicInvZonesPermissionCheckboxes(selectedZones = []) {
  const listEl = document.getElementById("oicInvZonesPermissionList");
  if (!listEl) return;
  const sortedZones = [...store.zones].sort((a, b) =>
    (a.name || "").localeCompare(b.name || ""),
  );
  listEl.innerHTML =
    sortedZones
      .map((z) => {
        const checked = selectedZones.includes(z.id) ? "checked" : "";
        return `
            <label class="flex items-center gap-2 text-xs text-slate-600 cursor-pointer truncate" title="${z.name}">
                <input type="checkbox" name="oicInvZonePermCheckbox" value="${z.id}" ${checked} onchange="onOicInvZoneCheckboxChange()" class="rounded border-slate-300 text-teal-600 focus:ring-teal-500">
                <span class="truncate">${z.name}</span>
            </label>
        `;
      })
      .join("") ||
    '<div class="col-span-2 text-center text-xs text-slate-400 italic">No zones configured yet</div>';
}

function toggleSelectAllInvZonesPerm(checked) {
  document
    .querySelectorAll('input[name="oicInvZonePermCheckbox"]')
    .forEach((cb) => {
      cb.checked = checked;
      cb.disabled = checked;
    });
}

function onOicInvZoneCheckboxChange() {
  const allChecked = Array.from(
    document.querySelectorAll('input[name="oicInvZonePermCheckbox"]'),
  ).every((cb) => cb.checked);
  const allInvCheckbox = document.getElementById("oicPermAllInvZones");
  if (allInvCheckbox && !allChecked) {
    allInvCheckbox.checked = false;
  }
}
function showSettingsSailorResults() {
  const resultsDiv = document.getElementById("cfg-sailorSearchResults");
  if (!resultsDiv) return;
  resultsDiv.classList.remove("hidden");
  const inputVal = document.getElementById("cfg-userName").value.trim(); // If the input already contains a formatted sailor name, show all when focused
  if (inputVal.includes("(")) {
    filterSettingsSailorResults("");
  } else {
    filterSettingsSailorResults(inputVal);
  }
}
function filterSettingsSailorResults(query) {
  const resultsDiv = document.getElementById("cfg-sailorSearchResults");
  if (!resultsDiv) return;
  const ecSailors = getEcSailors();
  const q = query.toLowerCase().trim();
  let filtered = ecSailors;
  if (q && !query.includes("(")) {
    filtered = ecSailors.filter((s) => {
      const name = (s.name || "").toLowerCase();
      const offNo = (
        s.official_number ||
        s.officialNumber ||
        s.service_no ||
        ""
      ).toLowerCase();
      const rank = (s.rank || "").toLowerCase();
      return name.includes(q) || offNo.includes(q) || rank.includes(q);
    });
  }
  let html = `<div onclick="selectSettingsSailor('', '')" class="p-2.5 text-xs hover:bg-red-50 cursor-pointer text-red-600 font-semibold border-b border-slate-100 transition-colors flex items-center gap-1">
        ✕ Clear / Remove In-Charge
    </div>`;
  if (filtered.length === 0) {
    html +=
      '<div class="p-3 text-sm text-slate-400 italic">No sailors found</div>';
  } else {
    html += filtered
      .map((s) => {
        var _s$id29;
        const displayName = `${s.rank} ${s.name} (${s.official_number || s.service_no})`;
        const escDisplayName = displayName
          .replace(/'/g, "\\'")
          .replace(/"/g, '\\"');
        return `<div onclick="selectSettingsSailor('${(_s$id29 = s.id) !== null && _s$id29 !== void 0 ? _s$id29 : s._fbKey}', '${escDisplayName}')" class="p-2.5 text-sm hover:bg-slate-50 cursor-pointer text-slate-700 transition-colors">
                <span class="font-semibold text-slate-800">${s.rank} ${s.name}</span>
                <span class="text-xs text-slate-400 font-mono ml-2">${s.official_number || s.service_no}</span>
            </div>`;
      })
      .join("");
  }
  resultsDiv.innerHTML = html;
}
function selectSettingsSailor(sailorId, displayName) {
  const zoneId = document.getElementById("cfg-userZone").value;
  if (!zoneId) {
    showToast("Please select a Zone first", "error");
    document.getElementById("cfg-userName").value = "";
    document.getElementById("cfg-sailorSearchResults").classList.add("hidden");
    return;
  }
  if (sailorId) {
    const sailor = store.sailors.find((s) => {
      var _s$id30;
      return (
        String(
          (_s$id30 = s.id) !== null && _s$id30 !== void 0 ? _s$id30 : s._fbKey,
        ) === String(sailorId)
      );
    });
    if (sailor) {
      setValue("cfg-userName", displayName);
      setValue("cfg-userSailorId", sailorId);
      setValue("cfg-userRank", sailor.rank || "");
      setValue(
        "cfg-userServiceNo",
        sailor.official_number || sailor.service_no || "",
      );
      if (!store.settings.zoneInCharges) store.settings.zoneInCharges = {};
      store.settings.zoneInCharges[zoneId] = {
        name: sailor.name,
        rank: sailor.rank || "",
        serviceNo: sailor.official_number || sailor.service_no || "",
        sailorId,
      };
      opsDB
        .ref(`settings/zoneInCharges/${zoneId}`)
        .set({
          name: sailor.name,
          rank: sailor.rank || "",
          serviceNo: sailor.official_number || sailor.service_no || "",
          sailorId,
        })
        .then(() => {
          applySettings();
          showToast(
            `In-Charge for ${zoneId} updated to ${sailor.rank} ${sailor.name}`,
          );
        });
    }
  } else {
    // Cleared selection
    setValue("cfg-userName", "");
    setValue("cfg-userSailorId", "");
    setValue("cfg-userRank", "");
    setValue("cfg-userServiceNo", "");
    if (store.settings.zoneInCharges) {
      delete store.settings.zoneInCharges[zoneId];
    }
    opsDB
      .ref(`settings/zoneInCharges/${zoneId}`)
      .remove()
      .then(() => {
        applySettings();
        showToast(`In-Charge for ${zoneId} removed`);
      });
  }
  document.getElementById("cfg-sailorSearchResults").classList.add("hidden");
} // Autocomplete for Settings Zone Sub In-Charge Profile
function showSettingsSubSailorResults() {
  const resultsDiv = document.getElementById("cfg-subSailorSearchResults");
  if (!resultsDiv) return;
  resultsDiv.classList.remove("hidden");
  const inputVal = document.getElementById("cfg-userSubName").value.trim();
  if (inputVal.includes("(")) {
    filterSettingsSubSailorResults("");
  } else {
    filterSettingsSubSailorResults(inputVal);
  }
}
function filterSettingsSubSailorResults(query) {
  const resultsDiv = document.getElementById("cfg-subSailorSearchResults");
  if (!resultsDiv) return;
  const ecSailors = getEcSailors();
  const q = query.toLowerCase().trim();
  let filtered = ecSailors;
  if (q && !query.includes("(")) {
    filtered = ecSailors.filter((s) => {
      const name = (s.name || "").toLowerCase();
      const offNo = (
        s.official_number ||
        s.officialNumber ||
        s.service_no ||
        ""
      ).toLowerCase();
      const rank = (s.rank || "").toLowerCase();
      return name.includes(q) || offNo.includes(q) || rank.includes(q);
    });
  }
  let html = `<div onclick="selectSettingsSubSailor('', '')" class="p-2.5 text-xs hover:bg-red-50 cursor-pointer text-red-600 font-semibold border-b border-slate-100 transition-colors flex items-center gap-1">
        ✕ Clear / Remove Sub In-Charge
    </div>`;
  if (filtered.length === 0) {
    html +=
      '<div class="p-3 text-sm text-slate-400 italic">No sailors found</div>';
  } else {
    html += filtered
      .map((s) => {
        var _s$id31;
        const displayName = `${s.rank} ${s.name} (${s.official_number || s.service_no})`;
        const escDisplayName = displayName
          .replace(/'/g, "\\'")
          .replace(/"/g, '\\"');
        return `<div onclick="selectSettingsSubSailor('${(_s$id31 = s.id) !== null && _s$id31 !== void 0 ? _s$id31 : s._fbKey}', '${escDisplayName}')" class="p-2.5 text-sm hover:bg-slate-50 cursor-pointer text-slate-700 transition-colors">
                <span class="font-semibold text-slate-800">${s.rank} ${s.name}</span>
                <span class="text-xs text-slate-400 font-mono ml-2">${s.official_number || s.service_no}</span>
            </div>`;
      })
      .join("");
  }
  resultsDiv.innerHTML = html;
}
function selectSettingsSubSailor(sailorId, displayName) {
  const zoneId = document.getElementById("cfg-userZone").value;
  if (!zoneId) {
    showToast("Please select a Zone first", "error");
    document.getElementById("cfg-userSubName").value = "";
    document
      .getElementById("cfg-subSailorSearchResults")
      .classList.add("hidden");
    return;
  }
  if (!store.settings.zoneInCharges) store.settings.zoneInCharges = {};
  if (!store.settings.zoneInCharges[zoneId]) {
    showToast("Please set the Profile In-Charge Sailor first", "error");
    document.getElementById("cfg-userSubName").value = "";
    document
      .getElementById("cfg-subSailorSearchResults")
      .classList.add("hidden");
    return;
  }
  if (sailorId) {
    const sailor = store.sailors.find((s) => {
      var _s$id32;
      return (
        String(
          (_s$id32 = s.id) !== null && _s$id32 !== void 0 ? _s$id32 : s._fbKey,
        ) === String(sailorId)
      );
    });
    if (sailor) {
      setValue("cfg-userSubName", displayName);
      setValue("cfg-userSubSailorId", sailorId);
      setValue("cfg-userSubRank", sailor.rank || "");
      setValue(
        "cfg-userSubServiceNo",
        sailor.official_number || sailor.service_no || "",
      );
      store.settings.zoneInCharges[zoneId].subName = sailor.name;
      store.settings.zoneInCharges[zoneId].subRank = sailor.rank || "";
      store.settings.zoneInCharges[zoneId].subServiceNo =
        sailor.official_number || sailor.service_no || "";
      store.settings.zoneInCharges[zoneId].subSailorId = sailorId;
      opsDB.ref(`settings/zoneInCharges/${zoneId}/subName`).set(sailor.name);
      opsDB
        .ref(`settings/zoneInCharges/${zoneId}/subRank`)
        .set(sailor.rank || "");
      opsDB
        .ref(`settings/zoneInCharges/${zoneId}/subServiceNo`)
        .set(sailor.official_number || sailor.service_no || "");
      opsDB
        .ref(`settings/zoneInCharges/${zoneId}/subSailorId`)
        .set(sailorId)
        .then(() => {
          applySettings();
          showToast(
            `Sub In-Charge for ${zoneId} updated to ${sailor.rank} ${sailor.name}`,
          );
        });
    }
  } else {
    setValue("cfg-userSubName", "");
    setValue("cfg-userSubSailorId", "");
    setValue("cfg-userSubRank", "");
    setValue("cfg-userSubServiceNo", "");
    delete store.settings.zoneInCharges[zoneId].subName;
    delete store.settings.zoneInCharges[zoneId].subRank;
    delete store.settings.zoneInCharges[zoneId].subServiceNo;
    delete store.settings.zoneInCharges[zoneId].subSailorId;
    opsDB.ref(`settings/zoneInCharges/${zoneId}/subName`).remove();
    opsDB.ref(`settings/zoneInCharges/${zoneId}/subRank`).remove();
    opsDB.ref(`settings/zoneInCharges/${zoneId}/subServiceNo`).remove();
    opsDB
      .ref(`settings/zoneInCharges/${zoneId}/subSailorId`)
      .remove()
      .then(() => {
        applySettings();
        showToast(`Sub In-Charge for ${zoneId} removed`);
      });
  }
  document.getElementById("cfg-subSailorSearchResults").classList.add("hidden");
}
function getAcSailors() {
  return store.sailors.filter((sailor) => {
    const offNo = (
      sailor.official_number ||
      sailor.officialNumber ||
      sailor.service_no ||
      ""
    ).trim();
    const cleanOffNo = offNo.replace(/^[^a-zA-Z0-9]+/, "");
    return cleanOffNo.toUpperCase().startsWith("AC");
  });
} // Autocomplete for Settings Work Order Artificer
function showWoArtificerResults() {
  const resultsDiv = document.getElementById("cfg-woArtificerSearchResults");
  if (!resultsDiv) return;
  resultsDiv.classList.remove("hidden");
  const inputVal = document.getElementById("cfg-woArtificerName").value.trim();
  if (inputVal.includes("(")) {
    filterWoArtificerResults("");
  } else {
    filterWoArtificerResults(inputVal);
  }
}
function filterWoArtificerResults(query) {
  const resultsDiv = document.getElementById("cfg-woArtificerSearchResults");
  if (!resultsDiv) return;
  const acSailors = getAcSailors();
  const q = query.toLowerCase().trim();
  let filtered = acSailors;
  if (q && !query.includes("(")) {
    filtered = acSailors.filter((s) => {
      const name = (s.name || "").toLowerCase();
      const offNo = (
        s.official_number ||
        s.officialNumber ||
        s.service_no ||
        ""
      ).toLowerCase();
      const rank = (s.rank || "").toLowerCase();
      return name.includes(q) || offNo.includes(q) || rank.includes(q);
    });
  }
  let html = `<div onclick="selectWoArtificer('', '')" class="p-2.5 text-xs hover:bg-red-50 cursor-pointer text-red-600 font-semibold border-b border-slate-100 transition-colors flex items-center gap-1">
        ✕ Clear / Remove Artificer
    </div>`;
  if (filtered.length === 0) {
    html +=
      '<div class="p-3 text-sm text-slate-400 italic">No sailors found</div>';
  } else {
    html += filtered
      .map((s) => {
        var _s$id33;
        const displayName = `${s.rank} ${s.name} (${s.official_number || s.service_no})`;
        const escDisplayName = displayName
          .replace(/'/g, "\\'")
          .replace(/"/g, '\\"');
        return `<div onclick="selectWoArtificer('${(_s$id33 = s.id) !== null && _s$id33 !== void 0 ? _s$id33 : s._fbKey}', '${escDisplayName}')" class="p-2.5 text-sm hover:bg-slate-50 cursor-pointer text-slate-700 transition-colors">
                <span class="font-semibold text-slate-800">${s.rank} ${s.name}</span>
                <span class="text-xs text-slate-400 font-mono ml-2">${s.official_number || s.service_no}</span>
            </div>`;
      })
      .join("");
  }
  resultsDiv.innerHTML = html;
}
function selectWoArtificer(sailorId, displayName) {
  const zoneId = document.getElementById("cfg-userZone").value;
  if (!zoneId) {
    showToast("Please select a Zone first", "error");
    document.getElementById("cfg-woArtificerName").value = "";
    document
      .getElementById("cfg-woArtificerSearchResults")
      .classList.add("hidden");
    return;
  }
  if (!store.settings.zoneInCharges) store.settings.zoneInCharges = {};
  if (!store.settings.zoneInCharges[zoneId]) {
    showToast("Please set the Profile Sailor first", "error");
    document.getElementById("cfg-woArtificerName").value = "";
    document
      .getElementById("cfg-woArtificerSearchResults")
      .classList.add("hidden");
    return;
  }
  if (sailorId) {
    const sailor = store.sailors.find((s) => {
      var _s$id34;
      return (
        String(
          (_s$id34 = s.id) !== null && _s$id34 !== void 0 ? _s$id34 : s._fbKey,
        ) === String(sailorId)
      );
    });
    if (sailor) {
      setValue("cfg-woArtificerName", displayName);
      setValue("cfg-woArtificerId", sailorId);
      store.settings.zoneInCharges[zoneId].woArtificerId = sailorId;
      store.settings.zoneInCharges[zoneId].woArtificerName = displayName;
      opsDB.ref(`settings/zoneInCharges/${zoneId}/woArtificerId`).set(sailorId);
      opsDB
        .ref(`settings/zoneInCharges/${zoneId}/woArtificerName`)
        .set(displayName)
        .then(() => {
          applySettings();
          showToast(`Work Order Artificer for ${zoneId} updated`);
        });
    }
  } else {
    setValue("cfg-woArtificerName", "");
    setValue("cfg-woArtificerId", "");
    delete store.settings.zoneInCharges[zoneId].woArtificerId;
    delete store.settings.zoneInCharges[zoneId].woArtificerName;
    opsDB.ref(`settings/zoneInCharges/${zoneId}/woArtificerId`).remove();
    opsDB
      .ref(`settings/zoneInCharges/${zoneId}/woArtificerName`)
      .remove()
      .then(() => {
        applySettings();
        showToast(`Work Order Artificer for ${zoneId} removed`);
      });
  }
  document
    .getElementById("cfg-woArtificerSearchResults")
    .classList.add("hidden");
} // Autocomplete for Settings Work Order Incharge
function showWoInchargeResults() {
  const resultsDiv = document.getElementById("cfg-woInchargeSearchResults");
  if (!resultsDiv) return;
  resultsDiv.classList.remove("hidden");
  const inputVal = document.getElementById("cfg-woInchargeName").value.trim();
  if (inputVal.includes("(")) {
    filterWoInchargeResults("");
  } else {
    filterWoInchargeResults(inputVal);
  }
}
function filterWoInchargeResults(query) {
  const resultsDiv = document.getElementById("cfg-woInchargeSearchResults");
  if (!resultsDiv) return;
  const ecSailors = getEcSailors();
  const q = query.toLowerCase().trim();
  let filtered = ecSailors;
  if (q && !query.includes("(")) {
    filtered = ecSailors.filter((s) => {
      const name = (s.name || "").toLowerCase();
      const offNo = (
        s.official_number ||
        s.officialNumber ||
        s.service_no ||
        ""
      ).toLowerCase();
      const rank = (s.rank || "").toLowerCase();
      return name.includes(q) || offNo.includes(q) || rank.includes(q);
    });
  }
  let html = `<div onclick="selectWoIncharge('', '')" class="p-2.5 text-xs hover:bg-red-50 cursor-pointer text-red-600 font-semibold border-b border-slate-100 transition-colors flex items-center gap-1">
        ✕ Clear / Remove In-Charge
    </div>`;
  if (filtered.length === 0) {
    html +=
      '<div class="p-3 text-sm text-slate-400 italic">No sailors found</div>';
  } else {
    html += filtered
      .map((s) => {
        var _s$id35;
        const displayName = `${s.rank} ${s.name} (${s.official_number || s.service_no})`;
        const escDisplayName = displayName
          .replace(/'/g, "\\'")
          .replace(/"/g, '\\"');
        return `<div onclick="selectWoIncharge('${(_s$id35 = s.id) !== null && _s$id35 !== void 0 ? _s$id35 : s._fbKey}', '${escDisplayName}')" class="p-2.5 text-sm hover:bg-slate-50 cursor-pointer text-slate-700 transition-colors">
                <span class="font-semibold text-slate-800">${s.rank} ${s.name}</span>
                <span class="text-xs text-slate-400 font-mono ml-2">${s.official_number || s.service_no}</span>
            </div>`;
      })
      .join("");
  }
  resultsDiv.innerHTML = html;
}
function selectWoIncharge(sailorId, displayName) {
  const zoneId = document.getElementById("cfg-userZone").value;
  if (!zoneId) {
    showToast("Please select a Zone first", "error");
    document.getElementById("cfg-woInchargeName").value = "";
    document
      .getElementById("cfg-woInchargeSearchResults")
      .classList.add("hidden");
    return;
  }
  if (!store.settings.zoneInCharges) store.settings.zoneInCharges = {};
  if (!store.settings.zoneInCharges[zoneId]) {
    showToast("Please set the Profile Sailor first", "error");
    document.getElementById("cfg-woInchargeName").value = "";
    document
      .getElementById("cfg-woInchargeSearchResults")
      .classList.add("hidden");
    return;
  }
  if (sailorId) {
    const sailor = store.sailors.find((s) => {
      var _s$id36;
      return (
        String(
          (_s$id36 = s.id) !== null && _s$id36 !== void 0 ? _s$id36 : s._fbKey,
        ) === String(sailorId)
      );
    });
    if (sailor) {
      setValue("cfg-woInchargeName", displayName);
      setValue("cfg-woInchargeId", sailorId);
      store.settings.zoneInCharges[zoneId].woInchargeId = sailorId;
      store.settings.zoneInCharges[zoneId].woInchargeName = displayName;
      opsDB.ref(`settings/zoneInCharges/${zoneId}/woInchargeId`).set(sailorId);
      opsDB
        .ref(`settings/zoneInCharges/${zoneId}/woInchargeName`)
        .set(displayName)
        .then(() => {
          applySettings();
          showToast(`Work Order In-Charge for ${zoneId} updated`);
        });
    }
  } else {
    setValue("cfg-woInchargeName", "");
    setValue("cfg-woInchargeId", "");
    delete store.settings.zoneInCharges[zoneId].woInchargeId;
    delete store.settings.zoneInCharges[zoneId].woInchargeName;
    opsDB.ref(`settings/zoneInCharges/${zoneId}/woInchargeId`).remove();
    opsDB
      .ref(`settings/zoneInCharges/${zoneId}/woInchargeName`)
      .remove()
      .then(() => {
        applySettings();
        showToast(`Work Order In-Charge for ${zoneId} removed`);
      });
  }
  document
    .getElementById("cfg-woInchargeSearchResults")
    .classList.add("hidden");
} // Autocomplete for Settings Work Order Supervisor
function showWoSupervisorResults() {
  const resultsDiv = document.getElementById("cfg-woSupervisorSearchResults");
  if (!resultsDiv) return;
  resultsDiv.classList.remove("hidden");
  const inputVal = document.getElementById("cfg-woSupervisorName").value.trim();
  if (inputVal.includes("(")) {
    filterWoSupervisorResults("");
  } else {
    filterWoSupervisorResults(inputVal);
  }
}
function filterWoSupervisorResults(query) {
  const resultsDiv = document.getElementById("cfg-woSupervisorSearchResults");
  if (!resultsDiv) return;
  const ecSailors = getEcSailors();
  const q = query.toLowerCase().trim();
  let filtered = ecSailors;
  if (q && !query.includes("(")) {
    filtered = ecSailors.filter((s) => {
      const name = (s.name || "").toLowerCase();
      const offNo = (
        s.official_number ||
        s.officialNumber ||
        s.service_no ||
        ""
      ).toLowerCase();
      const rank = (s.rank || "").toLowerCase();
      return name.includes(q) || offNo.includes(q) || rank.includes(q);
    });
  }
  let html = `<div onclick="selectWoSupervisor('', '')" class="p-2.5 text-xs hover:bg-red-50 cursor-pointer text-red-600 font-semibold border-b border-slate-100 transition-colors flex items-center gap-1">
        ✕ Clear / Remove Supervisor
    </div>`;
  if (filtered.length === 0) {
    html +=
      '<div class="p-3 text-sm text-slate-400 italic">No sailors found</div>';
  } else {
    html += filtered
      .map((s) => {
        var _s$id37;
        const displayName = `${s.rank} ${s.name} (${s.official_number || s.service_no})`;
        const escDisplayName = displayName
          .replace(/'/g, "\\'")
          .replace(/"/g, '\\"');
        return `<div onclick="selectWoSupervisor('${(_s$id37 = s.id) !== null && _s$id37 !== void 0 ? _s$id37 : s._fbKey}', '${escDisplayName}')" class="p-2.5 text-sm hover:bg-slate-50 cursor-pointer text-slate-700 transition-colors">
                <span class="font-semibold text-slate-800">${s.rank} ${s.name}</span>
                <span class="text-xs text-slate-400 font-mono ml-2">${s.official_number || s.service_no}</span>
            </div>`;
      })
      .join("");
  }
  resultsDiv.innerHTML = html;
}
function selectWoSupervisor(sailorId, displayName) {
  const zoneId = document.getElementById("cfg-userZone").value;
  if (!zoneId) {
    showToast("Please select a Zone first", "error");
    document.getElementById("cfg-woSupervisorName").value = "";
    document
      .getElementById("cfg-woSupervisorSearchResults")
      .classList.add("hidden");
    return;
  }
  if (!store.settings.zoneInCharges) store.settings.zoneInCharges = {};
  if (!store.settings.zoneInCharges[zoneId]) {
    showToast("Please set the Profile Sailor first", "error");
    document.getElementById("cfg-woSupervisorName").value = "";
    document
      .getElementById("cfg-woSupervisorSearchResults")
      .classList.add("hidden");
    return;
  }
  if (sailorId) {
    const sailor = store.sailors.find((s) => {
      var _s$id38;
      return (
        String(
          (_s$id38 = s.id) !== null && _s$id38 !== void 0 ? _s$id38 : s._fbKey,
        ) === String(sailorId)
      );
    });
    if (sailor) {
      setValue("cfg-woSupervisorName", displayName);
      setValue("cfg-woSupervisorId", sailorId);
      store.settings.zoneInCharges[zoneId].woSupervisorId = sailorId;
      store.settings.zoneInCharges[zoneId].woSupervisorName = displayName;
      opsDB
        .ref(`settings/zoneInCharges/${zoneId}/woSupervisorId`)
        .set(sailorId);
      opsDB
        .ref(`settings/zoneInCharges/${zoneId}/woSupervisorName`)
        .set(displayName)
        .then(() => {
          applySettings();
          showToast(`Work Order Supervisor for ${zoneId} updated`);
        });
    }
  } else {
    setValue("cfg-woSupervisorName", "");
    setValue("cfg-woSupervisorId", "");
    delete store.settings.zoneInCharges[zoneId].woSupervisorId;
    delete store.settings.zoneInCharges[zoneId].woSupervisorName;
    opsDB.ref(`settings/zoneInCharges/${zoneId}/woSupervisorId`).remove();
    opsDB
      .ref(`settings/zoneInCharges/${zoneId}/woSupervisorName`)
      .remove()
      .then(() => {
        applySettings();
        showToast(`Work Order Supervisor for ${zoneId} removed`);
      });
  }
  document
    .getElementById("cfg-woSupervisorSearchResults")
    .classList.add("hidden");
} // ── Zone Management ──
function renderSettingsZoneList() {
  const container = document.getElementById("settingsZoneList");
  if (!container) return;
  const rawZones = ensureAllStandardZones(store.settings.zones || store.zones || []);
  store.settings.zones = rawZones;
  store.zones = rawZones;
  const zones = rawZones.filter((z) => !isSbsZone(z.id) && !isSbsZone(z.name));
  container.innerHTML =
    zones
      .map(
        (z, i) => `
        <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span class="flex-1 font-medium text-slate-700 text-sm">${z.name}</span>
            <span class="text-xs text-slate-400 font-mono">${z.id}</span>
            <button onclick="removeZoneFromSettings(${i})" class="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50" title="Remove">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>
    `,
      )
      .join("") ||
    '<p class="text-sm text-slate-400 italic p-2">No zones defined</p>';
}
function addZoneFromSettings() {
  const input = document.getElementById("newZoneNameSettings");
  const name = input ? input.value.trim() : "";
  if (!name) return;
  if (isSbsZone(name)) {
    showToast("SBS is reserved as a Book / Register and cannot be added as an operational zone", "warning");
    return;
  }
  const zones = [...(store.settings.zones || store.zones || [])];
  const id = name.replace(/\s+/g, "-");
  if (zones.find((z) => (z.id || z.name).toLowerCase() === id.toLowerCase() || (z.name || z.id).toLowerCase() === name.toLowerCase())) {
    showToast("Zone already exists", "error");
    return;
  }
  zones.push({ id, name, status: "Active", active: true });
  store.settings.zones = zones;
  store.zones = zones;
  saveSettingsArray("zones", zones);
  if (input) input.value = "";
  _cfgSelectedZone = id;
  renderSettingsZoneList();
  renderSettingsZoneSelectorList();
  renderZoneSelectors();
  showToast(`Zone "${name}" added successfully!`);
}

function removeZoneFromSettings(index) {
  const zones = [...(store.settings.zones || store.zones || [])];
  if (!zones[index]) return;
  const removed = zones[index];
  const locCount = (store.locations || []).filter(
    (l) => l.zone_id === removed.id || l.zone_id === removed.name
  ).length;

  if (
    !confirm(
      `⚠️ Are you sure you want to remove the zone "${removed.name}"?` +
        (locCount > 0 ? `\n\nNote: It currently has ${locCount} assigned location(s).` : "")
    )
  ) {
    return;
  }

  zones.splice(index, 1);
  store.settings.zones = zones;
  store.zones = zones;
  if (store.currentZone === removed.id || store.currentZone === removed.name) {
    store.currentZone = zones[0]?.id || "A-Zone";
  }
  if (_cfgSelectedZone === removed.id || _cfgSelectedZone === removed.name) {
    _cfgSelectedZone = zones[0]?.id || null;
  }
  saveSettingsArray("zones", zones);
  renderSettingsZoneList();
  renderSettingsZoneSelectorList();
  renderZoneSelectors();
  showToast(`Zone "${removed.name}" removed successfully!`);
} // ── Inventory Stores & Stock Locations Management ──
function getInventoryStoresList() {
  if (Array.isArray(store.settings.inventoryStores) && store.settings.inventoryStores.length > 0) {
    return store.settings.inventoryStores;
  }
  // Initialize default inventory stores list
  const defaultStores = [
    { id: "store_zs", name: "Zone Store", abbr: "ZS", active: true, remarks: "Main Zone Store" },
    { id: "store_rus", name: "Ready Use Store", abbr: "RUS", active: true, remarks: "Immediate Issue Stock" },
    { id: "store_bs", name: "Balance Store", abbr: "BS", active: true, remarks: "Surplus / Balance Return Items" },
    { id: "store_ws", name: "Workshop Store", abbr: "WS", active: true, remarks: "General Workshop Materials" },
    { id: "store_ms", name: "Main Store", abbr: "MS", active: true, remarks: "Central Depot Store" },
    { id: "store_ty", name: "Timber Yard", abbr: "TY", active: true, remarks: "Wood, Boards & Plywood" },
    { id: "store_es", name: "Electrical Store", abbr: "ES", active: true, remarks: "Electrical & Fittings" },
    { id: "store_ps", name: "Paint Store", abbr: "PS", active: true, remarks: "Paints, Solvents & Brushes" },
    { id: "store_py", name: "Precast Yard", abbr: "PY", active: true, remarks: "Precast Concrete Blocks & Kerbs" },
    { id: "store_aw", name: "Aluminium Workshop", abbr: "AW", active: true, remarks: "Aluminium Profiles & Glazing" },
    { id: "store_cs", name: "Carpentry Shop", abbr: "CS", active: true, remarks: "Carpentry Tools & Hardware" },
    { id: "store_weld", name: "Welding Shop", abbr: "WS", active: true, remarks: "Steel & Welding Consumables" }
  ];
  return defaultStores;
}

function renderSettingsInventoryStoresList() {
  const container = document.getElementById("settingsInventoryStoresList");
  if (!container) return;
  const storesList = getInventoryStoresList();
  const countBadge = document.getElementById("cfgInventoryStoresCountBadge");
  if (countBadge) countBadge.textContent = `${storesList.length} Stores`;

  const inventoryItems = store.inventory || [];

  container.innerHTML = storesList.map((st, i) => {
    const sName = String(st.name || st || "").trim();
    const sAbbr = String(st.abbr || "").trim();
    const isActive = st.active !== false;

    // Count connecting inventory items in stock (matches by Location name, Abbreviation, or Zone ID)
    const connectedCount = inventoryItems.filter(item => {
      const itemLoc = String(item.location || item.store_location || item.store || "").toLowerCase().trim();
      const itemZone = String(item.zone_id || item.zone || "").trim();

      // 1. Direct Location match (e.g., Timber Yard, Ready Use Store, Workshop Store)
      if (itemLoc && (itemLoc === sName.toLowerCase() || (sAbbr && itemLoc === sAbbr.toLowerCase()))) {
        return true;
      }

      // 2. Zone match (e.g., A-Zone, B-Zone, BC-Zone, C-Zone, D-Zone)
      if (itemZone && (isZoneMatch(itemZone, sName) || (sAbbr && isZoneMatch(itemZone, sAbbr)))) {
        return true;
      }

      // 3. Exact or Normalized Name match
      if (sName.toLowerCase() === "zone store" && itemLoc === "zone store") {
        return true;
      }

      return false;
    }).length;

    const connectionBadge = connectedCount > 0
      ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
           <span>📦</span> <span>${connectedCount} Items Stocked</span>
         </span>`
      : `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] text-slate-400 bg-slate-100 font-medium">0 Items</span>`;

    const statusBadge = isActive
      ? `<button type="button" onclick="toggleInventoryStoreActive(${i})" class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 transition-all cursor-pointer">
           🟢 Active
         </button>`
      : `<button type="button" onclick="toggleInventoryStoreActive(${i})" class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-300 hover:bg-slate-200 transition-all cursor-pointer">
           ⚪ Inactive
         </button>`;

    return `
      <tr class="hover:bg-slate-50/80 transition-colors">
        <td class="px-3.5 py-3">
          <div class="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            <span>🏢</span>
            <span>${sName}</span>
          </div>
          ${st.remarks ? `<p class="text-[10px] text-slate-400 mt-0.5">${st.remarks}</p>` : ""}
        </td>
        <td class="px-3 py-3 text-center">
          <span class="font-mono text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">${sAbbr || "—"}</span>
        </td>
        <td class="px-3.5 py-3 text-center">
          ${connectionBadge}
        </td>
        <td class="px-3 py-3 text-center">
          ${statusBadge}
        </td>
        <td class="px-3.5 py-3 text-right">
          <div class="flex items-center justify-end gap-1.5">
            <button type="button" onclick="editInventoryStoreLocation(${i})" class="text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 text-xs font-semibold transition-all">
              ✏️ Edit
            </button>
            <button type="button" onclick="removeInventoryStoreLocation(${i})" class="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-all" title="Delete Store">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("") || '<tr><td colspan="5" class="text-center py-6 text-slate-400 italic">No inventory stores defined yet</td></tr>';
}

function addInventoryStoreLocation() {
  const nameInput = document.getElementById("newInvStoreName");
  const abbrInput = document.getElementById("newInvStoreAbbr");
  const activeInput = document.getElementById("newInvStoreActive");
  const name = (nameInput ? nameInput.value : "").trim();
  const abbr = (abbrInput ? abbrInput.value : "").trim().toUpperCase();
  const active = activeInput ? activeInput.value === "true" : true;

  if (!name) {
    showToast("Please enter a Store / Location name", "warning");
    return;
  }

  const list = [...getInventoryStoresList()];
  list.push({
    id: "store_" + Date.now(),
    name: name,
    abbr: abbr || name.substring(0, 3).toUpperCase(),
    active: active,
    remarks: ""
  });

  store.settings.inventoryStores = list;
  saveSettingsArray("inventoryStores", list);
  if (nameInput) nameInput.value = "";
  if (abbrInput) abbrInput.value = "";
  renderSettingsInventoryStoresList();
  showToast(`Store "${name}" added successfully!`, "success");
}

function editInventoryStoreLocation(index) {
  const list = [...getInventoryStoresList()];
  const item = list[index];
  if (!item) return;

  const currentName = typeof item === "string" ? item : (item.name || "");
  const currentAbbr = typeof item === "object" ? (item.abbr || "") : "";

  const newName = prompt("Edit Store / Location Name:", currentName);
  if (newName === null) return;
  const trimmedName = newName.trim();
  if (!trimmedName) {
    showToast("Store name cannot be empty", "error");
    return;
  }

  const newAbbr = prompt("Edit Store Abbreviation / Code:", currentAbbr);
  const trimmedAbbr = newAbbr !== null ? newAbbr.trim().toUpperCase() : currentAbbr;

  list[index] = {
    ...(typeof item === "object" ? item : {}),
    id: item.id || ("store_" + Date.now()),
    name: trimmedName,
    abbr: trimmedAbbr,
    active: item.active !== false
  };

  store.settings.inventoryStores = list;
  saveSettingsArray("inventoryStores", list);
  renderSettingsInventoryStoresList();
  showToast(`Store updated to "${trimmedName}"`, "success");
}

function toggleInventoryStoreActive(index) {
  const list = [...getInventoryStoresList()];
  const item = list[index];
  if (!item) return;
  const newActive = item.active === false ? true : false;
  list[index] = {
    ...(typeof item === "object" ? item : { name: item }),
    id: item.id || ("store_" + Date.now()),
    name: typeof item === "string" ? item : item.name,
    abbr: item.abbr || "",
    active: newActive
  };
  store.settings.inventoryStores = list;
  saveSettingsArray("inventoryStores", list);
  renderSettingsInventoryStoresList();
  showToast(`Store "${list[index].name}" marked ${newActive ? "Active" : "Inactive"}`);
}

function removeInventoryStoreLocation(index) {
  const list = [...getInventoryStoresList()];
  const item = list[index];
  if (!item) return;
  const name = typeof item === "string" ? item : (item.name || "");
  if (confirm(`Are you sure you want to delete store "${name}"?`)) {
    list.splice(index, 1);
    store.settings.inventoryStores = list;
    saveSettingsArray("inventoryStores", list);
    renderSettingsInventoryStoresList();
    showToast(`Store "${name}" removed`);
  }
}

// ── On-Charge & Off-Charge Destinations & Locations Management ──
function getOnOffChargeDestinationsList() {
  const rawList = store.settings.offChargeDestinations || [];
  if (rawList.length > 0) {
    return rawList.map((d, idx) => {
      if (typeof d === "string") {
        return {
          id: "dest_" + idx,
          name: d,
          abbr: d.substring(0, 3).toUpperCase(),
          type: "Both",
          active: true,
          remarks: ""
        };
      }
      return {
        id: d.id || ("dest_" + idx),
        name: d.name || d.location || d.destination || "Destination " + (idx + 1),
        abbr: d.abbr || (d.name ? d.name.substring(0, 3).toUpperCase() : ""),
        type: d.type || "Both",
        active: d.active !== false,
        remarks: d.remarks || ""
      };
    });
  }
  // Default on/off charge destinations
  return [
    { id: "dest_tis", name: "SLNS Tissa", abbr: "TIS", type: "Both", active: true },
    { id: "dest_vij", name: "SLNS Vijaya", abbr: "VIJ", type: "Both", active: true },
    { id: "dest_gem", name: "SLNS Gemunu", abbr: "GEM", type: "Both", active: true },
    { id: "dest_ran", name: "SLNS Rangalla", abbr: "RAN", type: "Both", active: true },
    { id: "dest_bcz", name: "BC-Zone", abbr: "BCZ", type: "Both", active: true },
    { id: "dest_az", name: "A-Zone", abbr: "AZ", type: "Both", active: true },
    { id: "dest_carp", name: "Carpentry-Shop", abbr: "CS", type: "Both", active: true },
    { id: "dest_weld", name: "Welding-Shop", abbr: "WS", type: "Both", active: true },
    { id: "dest_pub", name: "Public Supply (Town)", abbr: "PST", type: "Off-Charge", active: true }
  ];
}

function renderSettingsOnOffChargeList() {
  const container = document.getElementById("settingsOffChargeList");
  if (!container) return;
  const list = getOnOffChargeDestinationsList();
  const countBadge = document.getElementById("cfgOnOffChargeCountBadge");
  if (countBadge) countBadge.textContent = `${list.length} Locations`;

  container.innerHTML = list.map((d, i) => {
    const sName = d.name || "—";
    const sAbbr = d.abbr || "—";
    const sType = d.type || "Both";
    const isActive = d.active !== false;

    const typeBadge = sType === "Off-Charge"
      ? `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">🚢 Off-Charge Only</span>`
      : sType === "On-Charge"
      ? `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">📥 On-Charge Only</span>`
      : `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">🔄 Both (On/Off)</span>`;

    const statusBadge = isActive
      ? `<button type="button" onclick="toggleOnOffChargeActive(${i})" class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 transition-all cursor-pointer">
           🟢 Active
         </button>`
      : `<button type="button" onclick="toggleOnOffChargeActive(${i})" class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-300 hover:bg-slate-200 transition-all cursor-pointer">
           ⚪ Inactive
         </button>`;

    return `
      <tr class="hover:bg-slate-50/80 transition-colors">
        <td class="px-3.5 py-3">
          <div class="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            <span>⚓</span>
            <span>${sName}</span>
          </div>
          ${d.remarks ? `<p class="text-[10px] text-slate-400 mt-0.5">${d.remarks}</p>` : ""}
        </td>
        <td class="px-3 py-3 text-center">
          <span class="font-mono text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">${sAbbr}</span>
        </td>
        <td class="px-3.5 py-3 text-center">
          ${typeBadge}
        </td>
        <td class="px-3 py-3 text-center">
          ${statusBadge}
        </td>
        <td class="px-3.5 py-3 text-right">
          <div class="flex items-center justify-end gap-1.5">
            <button type="button" onclick="editOnOffChargeDestination(${i})" class="text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 text-xs font-semibold transition-all">
              ✏️ Edit
            </button>
            <button type="button" onclick="removeOnOffChargeDestination(${i})" class="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-all" title="Delete Location">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("") || '<tr><td colspan="5" class="text-center py-6 text-slate-400 italic">No On/Off charge destinations defined</td></tr>';
}

function addOnOffChargeDestination() {
  const nameInput = document.getElementById("newOnOffChargeName");
  const abbrInput = document.getElementById("newOnOffChargeAbbr");
  const typeSelect = document.getElementById("newOnOffChargeType");
  const name = (nameInput ? nameInput.value : "").trim();
  const abbr = (abbrInput ? abbrInput.value : "").trim().toUpperCase();
  const type = typeSelect ? typeSelect.value : "Both";

  if (!name) {
    showToast("Please enter a Destination / Base name", "warning");
    return;
  }

  const list = [...getOnOffChargeDestinationsList()];
  list.push({
    id: "dest_" + Date.now(),
    name: name,
    abbr: abbr || name.substring(0, 3).toUpperCase(),
    type: type,
    active: true,
    remarks: ""
  });

  store.settings.offChargeDestinations = list;
  saveSettingsArray("offChargeDestinations", list);
  if (nameInput) nameInput.value = "";
  if (abbrInput) abbrInput.value = "";
  renderSettingsOnOffChargeList();
  showToast(`Destination "${name}" added successfully!`, "success");
}

function editOnOffChargeDestination(index) {
  const list = [...getOnOffChargeDestinationsList()];
  const item = list[index];
  if (!item) return;

  const newName = prompt("Edit Destination / Base Name:", item.name || "");
  if (newName === null) return;
  const trimmedName = newName.trim();
  if (!trimmedName) {
    showToast("Destination name cannot be empty", "error");
    return;
  }

  const newAbbr = prompt("Edit Abbreviation / Code:", item.abbr || "");
  const trimmedAbbr = newAbbr !== null ? newAbbr.trim().toUpperCase() : (item.abbr || "");

  list[index] = {
    ...item,
    name: trimmedName,
    abbr: trimmedAbbr
  };

  store.settings.offChargeDestinations = list;
  saveSettingsArray("offChargeDestinations", list);
  renderSettingsOnOffChargeList();
  showToast(`Destination updated to "${trimmedName}"`, "success");
}

function toggleOnOffChargeActive(index) {
  const list = [...getOnOffChargeDestinationsList()];
  const item = list[index];
  if (!item) return;
  const newActive = item.active === false ? true : false;
  list[index] = {
    ...item,
    active: newActive
  };
  store.settings.offChargeDestinations = list;
  saveSettingsArray("offChargeDestinations", list);
  renderSettingsOnOffChargeList();
  showToast(`Destination "${list[index].name}" marked ${newActive ? "Active" : "Inactive"}`);
}

function removeOnOffChargeDestination(index) {
  const list = [...getOnOffChargeDestinationsList()];
  const item = list[index];
  if (!item) return;
  const name = item.name || "";
  if (confirm(`Are you sure you want to delete destination "${name}"?`)) {
    list.splice(index, 1);
    store.settings.offChargeDestinations = list;
    saveSettingsArray("offChargeDestinations", list);
    renderSettingsOnOffChargeList();
    showToast(`Destination "${name}" removed`);
  }
}

// Backward Compatibility Aliases
function renderSettingsOffChargeList() {
  renderSettingsOnOffChargeList();
}
function addOffChargeDestination() {
  addOnOffChargeDestination();
}
function editOffChargeDest(index) {
  editOnOffChargeDestination(index);
}
function removeOffChargeDest(index) {
  removeOnOffChargeDestination(index);
} // ── Approval Authorities ──
function renderSettingsAuthList() {
  const container = document.getElementById("settingsAuthList");
  if (!container) return;
  const auths = store.settings.approvalAuthorities || [];
  container.innerHTML = auths
    .map(
      (a, i) => `
        <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span class="flex-1 text-sm text-slate-700 font-medium">${a}</span>
            <button onclick="editApprovalAuth(${i})" class="text-blue-400 hover:text-blue-600 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50">Edit</button>
            <button onclick="removeApprovalAuth(${i})" class="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>
    `,
    )
    .join("");
}
function addApprovalAuthority() {
  const val = document.getElementById("newApprovalAuth").value.trim();
  if (!val) return;
  const arr = [...(store.settings.approvalAuthorities || [])];
  arr.push(val);
  saveSettingsArray("approvalAuthorities", arr);
  document.getElementById("newApprovalAuth").value = "";
  renderSettingsAuthList();
}
function editApprovalAuth(i) {
  const arr = [...(store.settings.approvalAuthorities || [])];
  const v = prompt("Edit authority:", arr[i]);
  if (v && v.trim()) {
    arr[i] = v.trim();
    saveSettingsArray("approvalAuthorities", arr);
    renderSettingsAuthList();
  }
}
function removeApprovalAuth(i) {
  const arr = [...(store.settings.approvalAuthorities || [])];
  arr.splice(i, 1);
  saveSettingsArray("approvalAuthorities", arr);
  renderSettingsAuthList();
} // ── Work Order Types ──
function renderSettingsWoTypeList() {
  const container = document.getElementById("settingsWoTypeList");
  if (!container) return;
  const types = store.settings.workOrderTypes || [];
  const colors = {
    PROJECT: "bg-blue-100 text-blue-700",
    ROUTINE: "bg-green-100 text-green-700",
    EMERGENCY: "bg-red-100 text-red-700",
    REPAIR: "bg-amber-100 text-amber-700",
  };
  container.innerHTML = types
    .map(
      (t, i) => `
        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${colors[t] || "bg-slate-100 text-slate-600"}">
            ${t}
            <button onclick="removeWoType(${i})" class="ml-0.5 opacity-60 hover:opacity-100">✕</button>
        </span>
    `,
    )
    .join("");
}
function addWorkOrderType() {
  const val = document.getElementById("newWoType").value.trim().toUpperCase();
  if (!val) return;
  const arr = [...(store.settings.workOrderTypes || [])];
  if (!arr.includes(val)) {
    arr.push(val);
    saveSettingsArray("workOrderTypes", arr);
  }
  document.getElementById("newWoType").value = "";
  renderSettingsWoTypeList();
}
function removeWoType(i) {
  const arr = [...(store.settings.workOrderTypes || [])];
  arr.splice(i, 1);
  saveSettingsArray("workOrderTypes", arr);
  renderSettingsWoTypeList();
} // ── Priority Levels ──
function renderSettingsPriorityList() {
  const container = document.getElementById("settingsPriorityList");
  if (!container) return;
  const levels = store.settings.priorityLevels || [];
  const colors = {
    Low: "bg-green-100 text-green-700",
    Medium: "bg-yellow-100 text-yellow-700",
    High: "bg-orange-100 text-orange-700",
    Critical: "bg-red-100 text-red-700",
  };
  container.innerHTML = levels
    .map(
      (l, i) => `
        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${colors[l] || "bg-slate-100 text-slate-600"}">
            ${l}
            <button onclick="removePriorityLevel(${i})" class="ml-0.5 opacity-60 hover:opacity-100">✕</button>
        </span>
    `,
    )
    .join("");
}
function addPriorityLevel() {
  const val = document.getElementById("newPriorityLevel").value.trim();
  if (!val) return;
  const arr = [...(store.settings.priorityLevels || [])];
  if (!arr.includes(val)) {
    arr.push(val);
    saveSettingsArray("priorityLevels", arr);
  }
  document.getElementById("newPriorityLevel").value = "";
  renderSettingsPriorityList();
}
function removePriorityLevel(i) {
  const arr = [...(store.settings.priorityLevels || [])];
  arr.splice(i, 1);
  saveSettingsArray("priorityLevels", arr);
}

// =============================================
// APPROVED PROJECTS MANAGEMENT (SETTINGS)
// =============================================

const CE_OFFICERS_PRESET = [
  { rank: "CAPTAIN (CE)", name: "BGL BALASURIYA", svc: "NRC 1843", desig: "CCED(E)" },
  { rank: "CDR (CE)", name: "TM VITHARANA", svc: "NRC 2541", desig: "CCEO(E)" },
  { rank: "LCDR (CE)", name: "JAJD SENARATHNA", svc: "NRC 3068", desig: "SCE(M)" },
  { rank: "LCDR (CE)", name: "JATK JAYAKODI", svc: "NRC 3542", desig: "SCE(P&P)" },
  { rank: "LCDR (CE)", name: "KMAU KAHANDAWA", svc: "NRC 3576", desig: "SCE(W/W)" },
  { rank: "LCDR (CE)", name: "HMMI JAYATHUNGA", svc: "NRC 3977", desig: "CE (W/W), CE (P&P)" },
  { rank: "LT (CE)", name: "WP DARSHANA", svc: "NRC 4126", desig: "QS (E)" },
  { rank: "LT (CE)", name: "JADU JAYASINGHE", svc: "NRC 4310", desig: "CE(M)I" },
  { rank: "LT (CE)", name: "DMRK DISSANAYAKE", svc: "NRC 4496", desig: "CE(W/W) II" },
  { rank: "LT (CE)", name: "WGPD WIJETHUNGA", svc: "NRC 4519", desig: "CE (M) II" },
  { rank: "SLT (CE)", name: "KCS KORALA", svc: "NRC 4652", desig: "CE (P&P) II" },
  { rank: "SLT (CE)", name: "SD RAJAPAKSHA", svc: "NRC 4843", desig: "CE (E)" }
];

function renderApprovedProjectsSettings() {
  const tbody = document.getElementById("approvedProjectsTableBody");
  if (!tbody) return;

  const searchInput = document.getElementById("approvedProjectsSearch");
  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const statusFilter = document.getElementById("approvedProjectsStatusFilter");
  const filterVal = statusFilter ? statusFilter.value : "all";

  let projects = store.approvedProjects || [];

  if (filterVal !== "all") {
    projects = projects.filter((p) => (p.status || "Approved") === filterVal);
  }

  if (query) {
    projects = projects.filter(
      (p) =>
        (p.project_name || p.name || "").toLowerCase().includes(query) ||
        (p.reference_no || "").toLowerCase().includes(query) ||
        (p.project_engineer || "").toLowerCase().includes(query) ||
        (p.workscope || "").toLowerCase().includes(query)
    );
  }

  if (projects.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="p-8 text-center text-slate-400">
          <span class="text-2xl block mb-1">🏗️</span>
          No approved projects found. Click "Add Approved Project" to register a new project.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = projects
    .map((p) => {
      const pid = p.id || p._fbKey;
      const statusColors = {
        Approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
        "In Progress": "bg-blue-100 text-blue-800 border-blue-200",
        Completed: "bg-teal-100 text-teal-800 border-teal-200",
        "On Hold": "bg-amber-100 text-amber-800 border-amber-200"
      };
      const badgeCls = statusColors[p.status] || "bg-slate-100 text-slate-700 border-slate-200";

      // Count linked work orders
      const linkedWos = (store.workOrders || []).filter(
        (w) => String(w.approved_project_id) === String(pid)
      ).length;

      return `
        <tr class="hover:bg-slate-50/80 transition-colors">
          <td class="p-3.5 font-semibold text-slate-800">
            <div class="flex items-center gap-2">
              <span class="text-indigo-600">🏛️</span>
              <div>
                <p class="font-bold text-xs">${p.project_name || p.name || "Untitled Project"}</p>
                <p class="text-[10px] text-slate-400">${p.approval_date ? "Approved: " + p.approval_date : ""} ${linkedWos > 0 ? `• <span class="text-indigo-600 font-bold">${linkedWos} Work Orders</span>` : ""}</p>
              </div>
            </div>
          </td>
          <td class="p-3.5 text-slate-600">
            <span class="text-[10px] font-semibold text-slate-500 block">${p.reference_type || "Ref"}</span>
            <span class="font-mono text-xs font-bold text-slate-700">${p.reference_no || "—"}</span>
          </td>
          <td class="p-3.5 text-right font-mono font-bold text-emerald-700">
            ${formatCurrency(p.approved_cost || 0)}
          </td>
          <td class="p-3.5 text-center text-slate-600 font-medium">
            ${p.duration || "—"}
          </td>
          <td class="p-3.5 text-slate-700">
            <span class="text-xs font-semibold block">${p.project_engineer || "—"}</span>
            <span class="text-[10px] text-slate-400">${p.zone_id || "All Zones"}</span>
          </td>
          <td class="p-3.5 text-slate-600 max-w-xs truncate" title="${(p.workscope || "").replace(/"/g, '&quot;')}">
            ${p.workscope || "—"}
          </td>
          <td class="p-3.5 text-center">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeCls}">${p.status || "Approved"}</span>
          </td>
          <td class="p-3.5 text-center whitespace-nowrap">
            <div class="flex items-center justify-center gap-1">
              <button onclick="openApprovedProjectModal('${pid}')" class="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-indigo-600 text-xs font-semibold" title="Edit Project">
                ✏️
              </button>
              <button onclick="openBulkUploadProjectEstimateModal('${pid}')" class="p-1.5 hover:bg-emerald-50 rounded text-emerald-600 text-xs font-semibold" title="Bulk Upload Estimate">
                📤
              </button>
              <button onclick="deleteApprovedProject('${pid}')" class="p-1.5 hover:bg-rose-50 rounded text-rose-500 hover:text-rose-700 text-xs font-semibold" title="Delete Project">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function openApprovedProjectModal(projId = null) {
  const modal = document.getElementById("approvedProjectModal");
  if (!modal) return;

  // Populate CE Officers dropdown
  const engSelect = document.getElementById("apEngineerSelect");
  if (engSelect) {
    let opts = '<option value="">-- Select CE Officer --</option>';
    CE_OFFICERS_PRESET.forEach((off) => {
      opts += `<option value="${off.rank} ${off.name} (${off.desig})">${off.rank} ${off.name} - ${off.desig}</option>`;
    });
    engSelect.innerHTML = opts;
  }

  // Populate Zone dropdown
  const zoneSelect = document.getElementById("apZone");
  if (zoneSelect) {
    let zopts = '<option value="All Zones">All Zones (Global)</option>';
    (store.zones || []).forEach((z) => {
      zopts += `<option value="${z.id}">${z.name}</option>`;
    });
    zoneSelect.innerHTML = zopts;
  }

  if (projId) {
    const p = (store.approvedProjects || []).find(
      (x) => String(x.id) === String(projId) || String(x._fbKey) === String(projId)
    );
    if (p) {
      document.getElementById("apModalTitle").textContent = "Edit Approved Project";
      document.getElementById("apId").value = p.id || p._fbKey;
      document.getElementById("apName").value = p.project_name || p.name || "";
      document.getElementById("apRefType").value = p.reference_type || "Minute Sheet";
      document.getElementById("apRefNo").value = p.reference_no || "";
      document.getElementById("apCost").value = p.approved_cost || "";
      document.getElementById("apDuration").value = p.duration || "";
      document.getElementById("apZone").value = p.zone_id || "All Zones";
      document.getElementById("apEngineerCustom").value = p.project_engineer || "";
      if (engSelect) engSelect.value = "";
      document.getElementById("apWorkscope").value = p.workscope || "";
      document.getElementById("apStatus").value = p.status || "Approved";
      document.getElementById("apDate").value = p.approval_date || getLocalDateString();
    }
  } else {
    document.getElementById("apModalTitle").textContent = "Add Approved Project";
    document.getElementById("apId").value = "";
    document.getElementById("apName").value = "";
    document.getElementById("apRefType").value = "Minute Sheet";
    document.getElementById("apRefNo").value = "";
    document.getElementById("apCost").value = "";
    document.getElementById("apDuration").value = "";
    document.getElementById("apZone").value = "All Zones";
    document.getElementById("apEngineerCustom").value = "";
    if (engSelect) engSelect.value = "";
    document.getElementById("apWorkscope").value = "";
    document.getElementById("apStatus").value = "Approved";
    document.getElementById("apDate").value = getLocalDateString();
  }

  modal.classList.remove("hidden");
}

function handleApEngineerSelect(val) {
  if (val) {
    document.getElementById("apEngineerCustom").value = val;
  }
}

function saveApprovedProject(event) {
  event.preventDefault();
  const id = document.getElementById("apId").value.trim();
  const name = document.getElementById("apName").value.trim();
  const refType = document.getElementById("apRefType").value;
  const refNo = document.getElementById("apRefNo").value.trim();
  const cost = parseFloat(document.getElementById("apCost").value) || 0;
  const duration = document.getElementById("apDuration").value.trim();
  const zone = document.getElementById("apZone").value;
  const engineer =
    document.getElementById("apEngineerCustom").value.trim() ||
    document.getElementById("apEngineerSelect").value.trim();
  const workscope = document.getElementById("apWorkscope").value.trim();
  const status = document.getElementById("apStatus").value;
  const date = document.getElementById("apDate").value || getLocalDateString();

  const projectData = {
    project_name: name,
    name: name,
    reference_type: refType,
    reference_no: refNo,
    approved_cost: cost,
    duration: duration,
    zone_id: zone,
    project_engineer: engineer,
    workscope: workscope,
    status: status,
    approval_date: date,
    updated_at: new Date().toISOString()
  };

  const projectKey = id || opsDB.ref("approved_projects").push().key;

  opsDB
    .ref(`approved_projects/${projectKey}`)
    .update(projectData)
    .then(() => {
      closeModal("approvedProjectModal");
      showToast(`Approved project "${name}" saved successfully! 🏗️`);
    })
    .catch((err) => {
      console.error("Error saving approved project:", err);
      showToast("Failed to save approved project", "error");
    });
}

function deleteApprovedProject(projId) {
  const p = (store.approvedProjects || []).find(
    (x) => String(x.id) === String(projId) || String(x._fbKey) === String(projId)
  );
  if (!p) return;

  if (
    confirm(
      `Are you sure you want to delete the approved project "${p.project_name || p.name}"?`
    )
  ) {
    const key = p._fbKey || p.id;
    opsDB
      .ref(`approved_projects/${key}`)
      .remove()
      .then(() => {
        showToast("Approved project deleted", "info");
      })
      .catch((err) => {
        console.error("Error deleting project:", err);
        showToast("Failed to delete project", "error");
      });
  }
}

function openBulkUploadProjectEstimateModal(projId) {
  const p = (store.approvedProjects || []).find(
    (x) => String(x.id) === String(projId) || String(x._fbKey) === String(projId)
  );
  if (!p) return;

  document.getElementById("buProjectId").value = p._fbKey || p.id;
  document.getElementById("buProjectName").textContent = `${p.project_name || p.name} (Ref: ${p.reference_no || "—"})`;
  document.getElementById("buProjectCsvData").value = "";
  const fileInput = document.getElementById("buProjectCsvFile");
  if (fileInput) fileInput.value = "";

  document.getElementById("bulkUploadProjectEstimateModal").classList.remove("hidden");
}

function handleProjectCsvFile(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById("buProjectCsvData").value = e.target.result;
    };
    reader.readAsText(input.files[0]);
  }
}

function submitBulkUploadProjectEstimate(event) {
  event.preventDefault();
  const projId = document.getElementById("buProjectId").value;
  const rawData = document.getElementById("buProjectCsvData").value.trim();
  if (!rawData) {
    showToast("Please provide CSV data or choose a file", "error");
    return;
  }

  const lines = rawData.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const items = [];
  lines.forEach((line, idx) => {
    // Skip header line if detected
    if (idx === 0 && (line.toLowerCase().includes("item") || line.toLowerCase().includes("description"))) {
      return;
    }
    const cols = line.split(/[,\t]/).map((c) => c.trim().replace(/^["']|["']$/g, ""));
    if (cols.length >= 2) {
      items.push({
        item_no: cols[0] || String(idx),
        description: cols[1] || "",
        unit: cols[2] || "Nos",
        quantity: parseFloat(cols[3]) || 1,
        unit_price: parseFloat(cols[4]) || 0,
        amount: parseFloat(cols[5]) || (parseFloat(cols[3]) || 1) * (parseFloat(cols[4]) || 0)
      });
    }
  });

  if (items.length === 0) {
    showToast("No valid items parsed from CSV", "error");
    return;
  }

  opsDB
    .ref(`approved_projects/${projId}/estimate_items`)
    .set(items)
    .then(() => {
      closeModal("bulkUploadProjectEstimateModal");
      showToast(`Successfully imported ${items.length} estimate items! 📊`);
    })
    .catch((err) => {
      console.error("Failed to import estimate items:", err);
      showToast("Error importing estimate items", "error");
    });
}

// ============================================================================
// Global Window Bindings for Settings Module
// ============================================================================
window.isSbsZone = isSbsZone;
window.openZoneManager = openZoneManager;
window.renderZoneManagerList = renderZoneManagerList;
window.addZone = addZone;
window.removeZone = removeZone;
window.renderZoneSelectors = renderZoneSelectors;
window.renderSettingsZoneSelectorList = renderSettingsZoneSelectorList;
window.isSbsBookActive = isSbsBookActive;
window.toggleSbsBookActiveStatus = toggleSbsBookActiveStatus;
window.toggleZoneStatusInSettings = toggleZoneStatusInSettings;
window.selectSettingsZone = selectSettingsZone;
window.updateSelectedZoneLocationsView = updateSelectedZoneLocationsView;
window.quickSaveLocation = quickSaveLocation;
window.renderSettingsLocationsTable = renderSettingsLocationsTable;
window.openAddLocationModal = openAddLocationModal;
window.editLocationFromSettings = editLocationFromSettings;
window.deleteLocationFromSettings = deleteLocationFromSettings;
window.ensureAllStandardZones = ensureAllStandardZones;
window.ensureArray = ensureArray;
window.initSettingsListener = initSettingsListener;
window.applySettings = applySettings;
window.saveSettingField = saveSettingField;
window.saveSettingsArray = saveSettingsArray;
window.renderSettings = renderSettings;
window.switchSettingsTab = switchSettingsTab;
window.setValue = setValue;
window.changeSettingsUserZone = changeSettingsUserZone;
window.renderSettingsSupervisorsList = renderSettingsSupervisorsList;
window.showAddSupervisorResults = showAddSupervisorResults;
window.filterAddSupervisorResults = filterAddSupervisorResults;
window.addSupervisorToZone = addSupervisorToZone;
window.removeSupervisorFromZone = removeSupervisorFromZone;
window.renderSettingsZoneTeamList = renderSettingsZoneTeamList;
window.showAddZoneTeamResults = showAddZoneTeamResults;
window.filterAddZoneTeamResults = filterAddZoneTeamResults;
window.addSailorToZoneTeam = addSailorToZoneTeam;
window.removeSailorFromZoneTeam = removeSailorFromZoneTeam;
window.toggleSailorZoneRelease = toggleSailorZoneRelease;
window.populateSettingsZoneOfficersDropdowns = populateSettingsZoneOfficersDropdowns;
window.renderSettingsZoneOfficersList = renderSettingsZoneOfficersList;
window.addOfficerToCurrentZone = addOfficerToCurrentZone;
window.removeOfficerFromCurrentZone = removeOfficerFromCurrentZone;
window.getEcSailors = getEcSailors;
window.isMasterAdmin = isMasterAdmin;
window.isCurrentMasterAdmin = isCurrentMasterAdmin;
window.getCurrentOfficer = getCurrentOfficer;
window.isOfficerLoggedIn = isOfficerLoggedIn;
window.isOfficerAuthorizedToEditWorkOrdersAndEstimates = isOfficerAuthorizedToEditWorkOrdersAndEstimates;
window.isNotificationTargetOfficer = isNotificationTargetOfficer;
window.getDuplicatedWorkOrders = getDuplicatedWorkOrders;
window.getPendingDailyEvaluations = getPendingDailyEvaluations;
window.handleOicAuthorityChange = handleOicAuthorityChange;
window.getAuthorityBadge = getAuthorityBadge;
window.openSettingsView = openSettingsView;
window.toggleOicPasswordVisibility = toggleOicPasswordVisibility;
window.getOicProfiles = getOicProfiles;
window.renderSettingsOicProfilesList = renderSettingsOicProfilesList;
window.openOicProfileModal = openOicProfileModal;
window.editOicProfile = editOicProfile;
window.saveOicProfile = saveOicProfile;
window.deleteOicProfile = deleteOicProfile;
window.renderOicZonesPermissionCheckboxes = renderOicZonesPermissionCheckboxes;
window.toggleSelectAllZonesPerm = toggleSelectAllZonesPerm;
window.onOicZoneCheckboxChange = onOicZoneCheckboxChange;
window.renderOicInvZonesPermissionCheckboxes = renderOicInvZonesPermissionCheckboxes;
window.toggleSelectAllInvZonesPerm = toggleSelectAllInvZonesPerm;
window.onOicInvZoneCheckboxChange = onOicInvZoneCheckboxChange;
window.showSettingsSailorResults = showSettingsSailorResults;
window.filterSettingsSailorResults = filterSettingsSailorResults;
window.selectSettingsSailor = selectSettingsSailor;
window.showSettingsSubSailorResults = showSettingsSubSailorResults;
window.filterSettingsSubSailorResults = filterSettingsSubSailorResults;
window.selectSettingsSubSailor = selectSettingsSubSailor;
window.getAcSailors = getAcSailors;
window.showWoArtificerResults = showWoArtificerResults;
window.filterWoArtificerResults = filterWoArtificerResults;
window.selectWoArtificer = selectWoArtificer;
window.showWoInchargeResults = showWoInchargeResults;
window.filterWoInchargeResults = filterWoInchargeResults;
window.selectWoIncharge = selectWoIncharge;
window.showWoSupervisorResults = showWoSupervisorResults;
window.filterWoSupervisorResults = filterWoSupervisorResults;
window.selectWoSupervisor = selectWoSupervisor;
window.renderSettingsZoneList = renderSettingsZoneList;
window.addZoneFromSettings = addZoneFromSettings;
window.removeZoneFromSettings = removeZoneFromSettings;
window.getInventoryStoresList = getInventoryStoresList;
window.renderSettingsInventoryStoresList = renderSettingsInventoryStoresList;
window.addInventoryStoreLocation = addInventoryStoreLocation;
window.editInventoryStoreLocation = editInventoryStoreLocation;
window.toggleInventoryStoreActive = toggleInventoryStoreActive;
window.removeInventoryStoreLocation = removeInventoryStoreLocation;
window.getOnOffChargeDestinationsList = getOnOffChargeDestinationsList;
window.renderSettingsOnOffChargeList = renderSettingsOnOffChargeList;
window.addOnOffChargeDestination = addOnOffChargeDestination;
window.editOnOffChargeDestination = editOnOffChargeDestination;
window.toggleOnOffChargeActive = toggleOnOffChargeActive;
window.removeOnOffChargeDestination = removeOnOffChargeDestination;
window.renderSettingsOffChargeList = renderSettingsOffChargeList;
window.addOffChargeDestination = addOffChargeDestination;
window.editOffChargeDest = editOffChargeDest;
window.removeOffChargeDest = removeOffChargeDest;
window.renderSettingsAuthList = renderSettingsAuthList;
window.addApprovalAuthority = addApprovalAuthority;
window.editApprovalAuth = editApprovalAuth;
window.removeApprovalAuth = removeApprovalAuth;
window.renderSettingsWoTypeList = renderSettingsWoTypeList;
window.addWorkOrderType = addWorkOrderType;
window.removeWoType = removeWoType;
window.renderSettingsPriorityList = renderSettingsPriorityList;
window.addPriorityLevel = addPriorityLevel;
window.removePriorityLevel = removePriorityLevel;
window.renderApprovedProjectsSettings = renderApprovedProjectsSettings;
window.openApprovedProjectModal = openApprovedProjectModal;
window.handleApEngineerSelect = handleApEngineerSelect;
window.saveApprovedProject = saveApprovedProject;
window.deleteApprovedProject = deleteApprovedProject;
window.openBulkUploadProjectEstimateModal = openBulkUploadProjectEstimateModal;
window.handleProjectCsvFile = handleProjectCsvFile;
window.submitBulkUploadProjectEstimate = submitBulkUploadProjectEstimate;

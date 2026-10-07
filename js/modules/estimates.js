// ============================================================================
// CMSys Module: Estimates, BoQ, Work Scope, Pricing & PDF Export Engine
// File: js/modules/estimates.js
// ============================================================================

// ESTIMATES
// =============================================
function renderEstimates() {
  renderIncomingJobMinutesInEstimates();
  const container = document.getElementById("estimatesList");
  if (!container) return;

  const currentZone = store.currentZone || "A-Zone";
  const cleanZoneStr = (str) => String(str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanCur = cleanZoneStr(currentZone);
  const isAdminZone = typeof isAdminStaffDuties === "function" && isAdminStaffDuties(currentZone);
  
  const isEstimateZoneMatch = (est) => {
    if (!est) return false;
    if (isAdminZone) return true; // Admin & Staff Duties sees all estimates
    const estZone = est.zone_id || est.zone || "";
    if (!estZone) return true; // Estimates without a strict zone are visible everywhere
    const cleanEst = cleanZoneStr(estZone);
    return cleanEst === cleanCur || cleanEst.includes(cleanCur) || cleanCur.includes(cleanEst);
  };

  const filteredEstimates = (store.estimates || []).filter(isEstimateZoneMatch);

  // If selected estimate is not in the filtered list, pick the first one
  if (filteredEstimates.length > 0) {
    const isCurrentSelectedValid = filteredEstimates.some(e => String(e.id) === String(store.selectedEstimate));
    if (!isCurrentSelectedValid) {
      selectEstimate(filteredEstimates[0].id);
    }
  } else {
    store.selectedEstimate = null;
    const estNumEl = document.getElementById("selectedEstimateNumber");
    if (estNumEl) estNumEl.textContent = "Select an Estimate";
    const contentEl = document.getElementById("estimateContent");
    if (contentEl) contentEl.innerHTML = '<p class="text-slate-400 text-center py-12">Select an estimate to view details</p>';
  }

  container.innerHTML =
    filteredEstimates
      .map((e) => {
        const isSelected = store.selectedEstimate === e.id;
        const isApproved = e.status === "Approved";
        const isLinked = e.status === "Linked";
        const statusBadge = isLinked
          ? `<span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">⛓️ Linked</span>`
          : `<span class="text-[11px] font-semibold px-2 py-0.5 rounded-full ${isApproved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}">
                ${isApproved ? "✓ Approved" : "⏳ Pending"}
            </span>`;
        const estKey = String(e.id || e._fbKey || e.estimate_number || "");
        const isChecked = (store.selectedEstimatesForPrint || []).some(x => String(x) === estKey);
        return `
        <div class="p-3.5 border-b border-slate-100 hover:bg-teal-50/40 cursor-pointer transition-all
            ${isSelected ? "bg-amber-50 border-l-4 border-amber-400 shadow-sm" : ""}"
            >
            <div class="flex items-start gap-3">
                <input type="checkbox" class="mt-1 w-4 h-4 accent-teal-600 cursor-pointer flex-shrink-0"
                    ${isChecked ? "checked" : ""}
                    onclick="event.stopPropagation(); toggleEstimatePrintSelection('${estKey}')" title="Select for bulk print">
                <div class="flex-1 min-w-0" onclick="selectEstimate('${estKey}')">
                    <div class="flex items-center justify-between mb-1">
                        <span class="mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">${e.estimate_number}</span>
                        ${statusBadge}
                    </div>
                    <p class="text-sm font-medium text-slate-700 truncate">${e.description}</p>
                    <p class="text-[11px] text-slate-400 mt-0.5 truncate">📍 ${e.location || "Location not set"}</p>
                    <div class="flex justify-between mt-2 items-center">
                        <span class="text-sm font-bold text-teal-700">${formatCurrency(e.total_cost)}</span>
                        <span class="text-[11px] text-slate-505 bg-slate-100 px-2 py-0.5 rounded-full">${e.totalManDays || 0} man-days</span>
                    </div>
                    ${
                      isApproved && e.approvedAuthority
                        ? `
                    <div class="mt-1.5">
                        <span class="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">🏛 ${e.approvedAuthority}</span>
                    </div>`
                        : ""
                    }
                    ${
                      isLinked
                        ? (() => {
                            const linkedJob = store.jobCards.find(
                              (jc) =>
                                String(jc.estimate_id) === String(e.id) ||
                                jc.work_order_id === e.work_order_id,
                            );
                            return linkedJob
                              ? `
                        <div class="mt-1.5">
                            <span class="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-semibold border border-indigo-100">⛓️ Job Card: ${linkedJob.job_number}</span>
                        </div>`
                              : "";
                          })()
                        : ""
                    }
                </div>
            </div>
        </div>`;
      })
      .join("") ||
    '<p class="text-slate-500 text-center py-8">No estimates</p>';
  const countEl = document.getElementById("bulkPrintCount");
  if (countEl) countEl.textContent = (store.selectedEstimatesForPrint || []).length;
}
function toggleEstimatePrintSelection(id) {
  if (!store.selectedEstimatesForPrint) store.selectedEstimatesForPrint = [];
  const sId = String(id);
  const idx = store.selectedEstimatesForPrint.findIndex(x => String(x) === sId);
  if (idx >= 0) {
    store.selectedEstimatesForPrint.splice(idx, 1);
  } else {
    store.selectedEstimatesForPrint.push(id);
  }
  const countEl = document.getElementById("bulkPrintCount");
  if (countEl) countEl.textContent = store.selectedEstimatesForPrint.length;
}
function findEstimateById(id) {
  if (!id && id !== 0) return null;
  return (store.estimates || []).find((e) => e && (
    String(e.id) === String(id) ||
    String(e._fbKey) === String(id) ||
    String(e.estimate_number) === String(id)
  )) || null;
}

function selectEstimate(id) {
  var _est$materials, _est$labor;
  store.selectedEstimate = id;
  const est = findEstimateById(id);
  if (!est) return;
  document.getElementById("selectedEstimateNumber").textContent =
    est.estimate_number;
  const editBtn = document.getElementById("editEstimateBtn");
  const canEditEst = isOfficerAuthorizedToEditWorkOrdersAndEstimates() || est.status === "Pending";
  if (editBtn) editBtn.style.display = canEditEst ? "inline-flex" : "none";
  const apvBtn = document.getElementById("approveEstimateBtn");
  if (apvBtn) apvBtn.style.display = est.status === "Pending" ? "inline-flex" : "none";
  const delBtn = document.getElementById("deleteEstimateBtn");
  if (delBtn) delBtn.style.display = est.status === "Pending" ? "inline-flex" : "none";

  // Smooth scroll to details on mobile screen when selected
  if (window.innerWidth < 768) {
    const detailsPanel = document.getElementById("estimateDetailsPanel");
    if (detailsPanel) {
      detailsPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }
  const sigBlock = (label, p) => `
        <div class="text-center">
            <div class="h-12 border-b border-slate-400 mb-1"></div>
            <p class="text-xs font-semibold text-slate-700">${label}</p>
            <p class="text-xs text-slate-600">${p && p.name ? p.name : "—"}</p>
            <p class="text-[11px] text-slate-500">${p && p.rank ? p.rank : ""}${p && p.serviceNo ? " • " + p.serviceNo : ""}</p>
        </div>`;
  document.getElementById("estimateContent").innerHTML = `
        <div class="space-y-6">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="text-sm text-slate-500">Reference</p>
                    <p class="font-medium">${est.reference_doc || "N/A"}</p>
                </div>
                <div>
                    <p class="text-sm text-slate-500">Status</p>
                    <span class="px-3 py-1 rounded ${est.status === "Approved" ? "bg-green-100 text-green-700" : est.status === "Linked" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}">${est.status}</span>
                    ${est.status === "Approved" && est.approvedAuthority ? `<span class="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Approved by ${est.approvedAuthority}</span>` : ""}
                    ${
                      est.status === "Linked"
                        ? (() => {
                            const linkedJob = store.jobCards.find(
                              (jc) =>
                                String(jc.estimate_id) === String(est.id) ||
                                jc.work_order_id === est.work_order_id,
                            );
                            return linkedJob
                              ? `<span class="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-semibold border border-indigo-200">⛓️ Converted to Job Card: ${linkedJob.job_number}</span>`
                              : "";
                          })()
                        : ""
                    }
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="text-sm text-slate-500">📍 Location</p>
                    <p class="font-medium">${est.location || "Not specified"}</p>
                </div>
                <div>
                    <p class="text-sm text-slate-500">👤 End User</p>
                    <p class="font-medium">${est.endUser || "Not specified"}</p>
                </div>
            </div>
            
            <div>
                <p class="text-sm text-slate-500">Work Scope</p>
                <p class="text-slate-700">${est.workScope || "Not specified"}</p>
            </div>
            
            <!-- Materials -->
            <div class="border border-slate-200 rounded-xl overflow-hidden">
                <div class="bg-slate-100 px-4 py-2 font-semibold">Materials</div>
                <table class="w-full text-sm">
                    <thead class="bg-slate-50">
                        <tr>
                            <th class="px-4 py-2 text-left">Description</th>
                            <th class="px-4 py-2 text-center">Qty</th>
                            <th class="px-4 py-2 text-center">Unit</th>
                            <th class="px-4 py-2 text-right">Cost</th>
                            <th class="px-4 py-2 text-right">Total</th>
                            <th class="px-4 py-2 text-center">Availability</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${
                          ((_est$materials = est.materials) === null ||
                          _est$materials === void 0
                            ? void 0
                            : _est$materials
                                .map(
                                  (m) => `
                            <tr class="border-t">
                                <td class="px-4 py-2">${m.description}</td>
                                <td class="px-4 py-2 text-center">${m.qty}</td>
                                <td class="px-4 py-2 text-center">${m.unit}</td>
                                <td class="px-4 py-2 text-right">${formatCurrency(m.cost)}</td>
                                <td class="px-4 py-2 text-right font-medium">${formatCurrency(m.qty * m.cost)}</td>
                                <td class="px-4 py-2 text-center"><span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">${m.availability}</span></td>
                            </tr>
                        `,
                                )
                                .join("")) ||
                          '<tr><td colspan="6" class="px-4 py-4 text-center text-slate-500">No materials</td></tr>'
                        }
                    </tbody>
                </table>
            </div>
            
            <!-- Labor -->
            <div class="border border-slate-200 rounded-xl overflow-hidden">
                <div class="bg-slate-100 px-4 py-2 font-semibold">Labor Requirement</div>
                <table class="w-full text-sm">
                    <thead class="bg-slate-50">
                        <tr>
                            <th class="px-4 py-2 text-left">Trade/Role</th>
                            <th class="px-4 py-2 text-center">Workers</th>
                            <th class="px-4 py-2 text-center">Man-Days</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${
                          ((_est$labor = est.labor) === null ||
                          _est$labor === void 0
                            ? void 0
                            : _est$labor
                                .map(
                                  (l) => `
                            <tr class="border-t">
                                <td class="px-4 py-2">${l.trade}</td>
                                <td class="px-4 py-2 text-center">${l.workers}</td>
                                <td class="px-4 py-2 text-center font-medium">${l.manDays}</td>
                            </tr>
                        `,
                                )
                                .join("")) ||
                          '<tr><td colspan="3" class="px-4 py-4 text-center text-slate-500">No labor specified</td></tr>'
                        }
                    </tbody>
                </table>
            </div>
            
            <!-- Summary -->
            <div class="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl">
                <div class="grid grid-cols-2 gap-4 text-center">
                    <div>
                        <p class="text-sm text-slate-500">Materials Cost</p>
                        <p class="text-xl font-bold text-green-600">${formatCurrency(est.total_cost)}</p>
                    </div>
                    <div>
                        <p class="text-sm text-slate-500">Total Man-Days</p>
                        <p class="text-xl font-bold text-blue-600">${est.totalManDays || 0}</p>
                    </div>
                </div>
            </div>

            <!-- Signatories (req 8) -->
            <div class="border-t border-slate-200 pt-6">
                <div class="grid grid-cols-3 gap-6">
                    ${sigBlock("Created By", est.createdBy)}
                    ${sigBlock("Checked By", est.checkedBy)}
                    ${sigBlock("Approved By", est.approvedBy)}
                </div>
            </div>
        </div>
    `;
  renderEstimates();
}
window.estWorkScopeCounter = 0;

function populateEstLocationsDatalist(selectedVal = "") {
  const locInput = document.getElementById("estLocation");
  const locDatalist = document.getElementById("estLocationDatalist");
  const currentZoneLocs = (store.locations || []).filter(
    (l) => !l.zone_id || l.zone_id === store.currentZone,
  );
  const locPool = currentZoneLocs.length > 0 ? currentZoneLocs : (store.locations || []);

  const uniqueBuildings = [
    ...new Set(
      locPool
        .map((l) => (l.building_name || l.name || "").trim())
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b));

  if (locDatalist) {
    locDatalist.innerHTML = uniqueBuildings.map((b) => `<option value="${b}">${b}</option>`).join("");
  }
  if (selectedVal && locInput) {
    locInput.value = selectedVal;
    onEstLocationChange(selectedVal);
  }
  setupEstLocationAutocompletes();
}

function setupEstLocationAutocompletes() {
  const locInput = document.getElementById("estLocation");
  const loc2Input = document.getElementById("estLocation2");
  const endUserEl = document.getElementById("estEndUser");

  // Smart floating autocomplete for Location 1 (Building)
  if (locInput && !locInput.hasAttribute("data-autocomplete-init")) {
    locInput.setAttribute("data-autocomplete-init", "true");
    let dropdown1 = document.createElement("div");
    dropdown1.className = "est-loc-autocomplete hidden fixed z-[99999999] bg-white border border-slate-300 rounded-xl shadow-2xl max-h-60 overflow-y-auto text-left pointer-events-auto";
    document.body.appendChild(dropdown1);

    const closeDropdown1 = () => dropdown1.classList.add("hidden");
    const updatePos1 = () => {
      if (dropdown1.classList.contains("hidden")) return;
      const rect = locInput.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) { closeDropdown1(); return; }
      dropdown1.style.position = "fixed";
      dropdown1.style.left = `${rect.left}px`;
      dropdown1.style.width = `${Math.max(280, rect.width)}px`;
      dropdown1.style.zIndex = "99999999";
      const h = 200;
      if (rect.bottom + h > window.innerHeight && rect.top > h) {
        dropdown1.style.top = `${rect.top - h - 4}px`;
      } else {
        dropdown1.style.top = `${rect.bottom + 4}px`;
      }
    };

    const renderResults1 = (query) => {
      const q = (query || "").toLowerCase().trim();
      const currentZoneLocs = (store.locations || []).filter(
        (l) => !l.zone_id || l.zone_id === store.currentZone,
      );
      const locPool = currentZoneLocs.length > 0 ? currentZoneLocs : (store.locations || []);
      const uniqueBuildings = [
        ...new Set(
          locPool
            .map((l) => (l.building_name || l.name || "").trim())
            .filter(Boolean),
        ),
      ].sort((a, b) => a.localeCompare(b));

      const matches = q
        ? uniqueBuildings.filter((b) => b.toLowerCase().includes(q))
        : uniqueBuildings;

      if (matches.length === 0) {
        dropdown1.innerHTML = `<div class="px-3 py-2 text-xs text-slate-500 italic">No existing building matches (type freely to add new)</div>`;
      } else {
        dropdown1.innerHTML = matches.slice(0, 30).map((b) => `
          <div class="px-3 py-2 hover:bg-teal-50 cursor-pointer border-b border-slate-100 last:border-0 loc-item transition-colors" data-val="${b.replace(/"/g, "&quot;")}">
            <div class="text-xs font-bold text-slate-800 flex items-center gap-1.5 pointer-events-none">
              <span>🏢</span> ${b}
            </div>
          </div>
        `).join("");
      }
      dropdown1.classList.remove("hidden");
      updatePos1();

      dropdown1.querySelectorAll(".loc-item").forEach((el) => {
        const handleSelect = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const val = el.getAttribute("data-val");
          locInput.value = val;
          closeDropdown1();
          onEstLocationChange(val);
        };
        el.addEventListener("mousedown", handleSelect);
        el.addEventListener("click", handleSelect);
      });
    };

    locInput.addEventListener("focus", () => renderResults1(locInput.value));
    locInput.addEventListener("input", () => renderResults1(locInput.value));
    locInput.addEventListener("blur", () => setTimeout(closeDropdown1, 250));
    document.addEventListener("scroll", updatePos1, true);
    window.addEventListener("resize", updatePos1);
  }

  // Smart floating autocomplete for Location 2 (Sub-location / Room)
  if (loc2Input && !loc2Input.hasAttribute("data-autocomplete-init")) {
    loc2Input.setAttribute("data-autocomplete-init", "true");
    let dropdown2 = document.createElement("div");
    dropdown2.className = "est-loc2-autocomplete hidden fixed z-[99999999] bg-white border border-slate-300 rounded-xl shadow-2xl max-h-60 overflow-y-auto text-left pointer-events-auto";
    document.body.appendChild(dropdown2);

    const closeDropdown2 = () => dropdown2.classList.add("hidden");
    const updatePos2 = () => {
      if (dropdown2.classList.contains("hidden")) return;
      const rect = loc2Input.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) { closeDropdown2(); return; }
      dropdown2.style.position = "fixed";
      dropdown2.style.left = `${rect.left}px`;
      dropdown2.style.width = `${Math.max(280, rect.width)}px`;
      dropdown2.style.zIndex = "99999999";
      const h = 200;
      if (rect.bottom + h > window.innerHeight && rect.top > h) {
        dropdown2.style.top = `${rect.top - h - 4}px`;
      } else {
        dropdown2.style.top = `${rect.bottom + 4}px`;
      }
    };

    const renderResults2 = (query) => {
      const q = (query || "").toLowerCase().trim();
      const selectedLoc1 = (locInput?.value || "").toLowerCase().trim();

      const currentZoneLocs = (store.locations || []).filter(
        (l) => !l.zone_id || l.zone_id === store.currentZone,
      );
      const locPool = currentZoneLocs.length > 0 ? currentZoneLocs : (store.locations || []);

      let filteredPool = selectedLoc1
        ? locPool.filter((l) => (l.building_name || l.name || "").toLowerCase().trim() === selectedLoc1)
        : locPool;

      if (filteredPool.length === 0) filteredPool = locPool;

      const subLocList = [];
      const seen = new Set();
      filteredPool.forEach((l) => {
        const sub = (l.sub_location || l.location2 || "").trim();
        if (sub && !seen.has(sub.toLowerCase())) {
          seen.add(sub.toLowerCase());
          subLocList.push({ sub, end_user: l.end_user || "", building: l.building_name || "" });
        }
      });

      const matches = q
        ? subLocList.filter((s) => s.sub.toLowerCase().includes(q) || (s.end_user && s.end_user.toLowerCase().includes(q)))
        : subLocList;

      if (matches.length === 0) {
        dropdown2.innerHTML = `<div class="px-3 py-2 text-xs text-slate-500 italic">No existing sub-location matches (type freely to add new)</div>`;
      } else {
        dropdown2.innerHTML = matches.slice(0, 30).map((s, idx) => `
          <div class="px-3 py-2 hover:bg-teal-50 cursor-pointer border-b border-slate-100 last:border-0 loc2-item transition-colors" data-idx="${idx}">
            <div class="text-xs font-bold text-slate-800 flex items-center justify-between pointer-events-none">
              <span>📍 ${s.sub}</span>
              ${s.building && !selectedLoc1 ? `<span class="text-[10px] text-slate-400 font-normal">(${s.building})</span>` : ""}
            </div>
            ${s.end_user ? `<div class="text-[11px] text-emerald-700 font-mono pointer-events-none">👤 End-User: ${s.end_user}</div>` : ""}
          </div>
        `).join("");
      }
      dropdown2.classList.remove("hidden");
      updatePos2();

      dropdown2.querySelectorAll(".loc2-item").forEach((el) => {
        const handleSelect = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const idx = parseInt(el.getAttribute("data-idx"), 10);
          const chosen = matches[idx];
          if (chosen) {
            loc2Input.value = chosen.sub;
            if (chosen.end_user && endUserEl && (!endUserEl.value || endUserEl.value.trim() === "")) {
              endUserEl.value = chosen.end_user;
            }
            closeDropdown2();
            onEstLocation2Change(chosen.sub);
          }
        };
        el.addEventListener("mousedown", handleSelect);
        el.addEventListener("click", handleSelect);
      });
    };

    loc2Input.addEventListener("focus", () => renderResults2(loc2Input.value));
    loc2Input.addEventListener("input", () => renderResults2(loc2Input.value));
    loc2Input.addEventListener("blur", () => setTimeout(closeDropdown2, 250));
    document.addEventListener("scroll", updatePos2, true);
    window.addEventListener("resize", updatePos2);
  }
}

function onEstLocationChange(selectedLoc) {
  const loc2Datalist = document.getElementById("estLocation2Datalist");
  const endUserEl = document.getElementById("estEndUser");

  const q = (selectedLoc || "").toLowerCase().trim();
  if (!q) {
    if (loc2Datalist) loc2Datalist.innerHTML = "";
    return;
  }

  const currentZoneLocs = (store.locations || []).filter(
    (l) => !l.zone_id || l.zone_id === store.currentZone,
  );
  const locPool = currentZoneLocs.length > 0 ? currentZoneLocs : (store.locations || []);

  const matchingLocs = locPool.filter(
    (l) =>
      (l.building_name || l.name || "").toLowerCase().trim() === q,
  );

  // Auto appear respective Location 2 details in dropdown
  const uniqueLoc2 = [
    ...new Set(
      matchingLocs
        .map((l) => (l.sub_location || l.location2 || "").trim())
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b));

  if (loc2Datalist) {
    loc2Datalist.innerHTML = uniqueLoc2
      .map((s) => `<option value="${s}">${s}</option>`)
      .join("");
  }

  // Auto appear respective End User from Location details
  const matchWithEndUser = matchingLocs.find((l) => l.end_user && l.end_user.trim()) || locPool.find((l) => (l.building_name || l.name || "").toLowerCase().trim() === q && l.end_user);
  if (matchWithEndUser && matchWithEndUser.end_user && endUserEl && (!endUserEl.value || endUserEl.value.trim() === "")) {
    endUserEl.value = matchWithEndUser.end_user;
  }
}

function onEstLocation2Change(selectedLoc2) {
  const loc1 = (document.getElementById("estLocation")?.value || "").toLowerCase().trim();
  const loc2 = (selectedLoc2 || "").toLowerCase().trim();
  if (!loc2) return;

  const currentZoneLocs = (store.locations || []).filter(
    (l) => !l.zone_id || l.zone_id === store.currentZone,
  );
  const locPool = currentZoneLocs.length > 0 ? currentZoneLocs : (store.locations || []);

  const exactMatch = locPool.find(
    (l) =>
      (l.building_name || l.name || "").toLowerCase().trim() === loc1 &&
      (l.sub_location || l.location2 || "").toLowerCase().trim() === loc2,
  );
  if (exactMatch && exactMatch.end_user) {
    const endUserEl = document.getElementById("estEndUser");
    if (endUserEl && (!endUserEl.value || endUserEl.value.trim() === "")) {
      endUserEl.value = exactMatch.end_user;
    }
  }
}

function openNewEstimateModal() {
  console.log("👉 [New Estimate Button] openNewEstimateModal triggered");
  const modal = document.getElementById("newEstimateModal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.style.setProperty("display", "flex", "important");
    modal.style.setProperty("visibility", "visible", "important");
    modal.style.setProperty("opacity", "1", "important");
    modal.style.setProperty("z-index", "99999", "important");
  } else {
    console.error("❌ newEstimateModal element not found in DOM!");
  }

  try {
    const setVal = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.value = v;
    };

    setVal("estId", "");
    setVal("estDescription", "");
    const refTypeSelect = document.getElementById("estRefType");
    if (refTypeSelect) refTypeSelect.value = "Minute Sheet";
    setVal("estReference", "");
    const projTypeSelect = document.getElementById("estProjectType");
    if (projTypeSelect) projTypeSelect.value = "PROJECT";
    setVal("estLocation", "");
    setVal("estLocation2", "");
    setVal("estEndUser", "");

    // Created By (Sailor) - default empty or current logged-in user
    setVal("estCreatedName", store.currentUser?.name || "");
    setVal("estCreatedRank", store.currentUser?.rank || "");
    setVal("estCreatedSvc", store.currentUser?.serviceNo || store.currentUser?.official_number || "");

    // Checked By (Zone In-Charge)
    const inc = (store.settings?.zoneInCharges || {})[store.currentZone];
    let incSailor = null;
    if (inc && inc.woInchargeId) {
      incSailor = (store.sailors || []).find(
        (s) =>
          String(s.id) === String(inc.woInchargeId) ||
          String(s._fbKey) === String(inc.woInchargeId),
      );
    }
    setVal("estCheckedName", incSailor ? incSailor.name : inc?.name || "");
    setVal("estCheckedRank", incSailor ? incSailor.rank || "" : inc?.rank || "");
    setVal("estCheckedSvc", incSailor ? incSailor.official_number || incSailor.service_no || "" : inc?.serviceNo || "");

    // Approved By (Optional CE Officer)
    setVal("estApprovedName", "");
    setVal("estApprovedRank", "");
    setVal("estApprovedSvc", "");

    // Clear dynamic scopes container and add one default section
    const scopesContainer = document.getElementById("estWorkScopesContainer");
    if (scopesContainer) {
      scopesContainer.innerHTML = "";
      estWorkScopeCounter = 0;
      addWorkScopeBlock();
    }
    if (typeof updateEstimateTotals === "function") updateEstimateTotals();
    if (typeof populateEstLocationsDatalist === "function") populateEstLocationsDatalist();
    if (typeof populateSignatoryDropdowns === "function") populateSignatoryDropdowns();
    if (typeof populateIncomingMinutesInEstimateModal === "function") populateIncomingMinutesInEstimateModal();
  } catch (err) {
    console.error("Error initializing new estimate modal:", err);
  }
}

function editEstimate() {
  const est = findEstimateById(store.selectedEstimate);
  if (!est) {
    showToast("Please select an estimate first", "error");
    return;
  }
  const canEditEst = isOfficerAuthorizedToEditWorkOrdersAndEstimates();
  if (est.status === "Linked" && !canEditEst) {
    showToast("This estimate is linked to a Job Card and cannot be edited", "warning");
    return;
  }

  const modal = document.getElementById("newEstimateModal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.style.setProperty("display", "flex", "important");
    modal.style.setProperty("visibility", "visible", "important");
    modal.style.setProperty("opacity", "1", "important");
    modal.style.setProperty("z-index", "99999", "important");
  }

  try {
    const setVal = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.value = v;
    };

    setVal("estId", est.id || est._fbKey || "");
    setVal("estDescription", est.description || "");
    const refTypeSelect = document.getElementById("estRefType");
    if (refTypeSelect)
      refTypeSelect.value = est.ref_type || est.reference_type || "Minute Sheet";
    setVal("estReference", est.reference_doc || est.reference_no || "");
    const projTypeSelect = document.getElementById("estProjectType");
    if (projTypeSelect)
      projTypeSelect.value = est.project_type || est.type || "PROJECT";
    
    if (typeof populateEstLocationsDatalist === "function") {
      populateEstLocationsDatalist(est.location || "");
    }
    setVal("estLocation", est.location || "");
    setVal("estLocation2", est.location2 || est.sub_location || "");
    setVal("estEndUser", est.endUser || "");

    // Created By
    const created = est.createdBy || {};
    setVal("estCreatedName", typeof created === "string" ? created : (created.name || ""));
    setVal("estCreatedRank", created.rank || "");
    setVal("estCreatedSvc", created.serviceNo || created.official_number || "");

    // Checked By
    const checked = est.checkedBy || {};
    setVal("estCheckedName", typeof checked === "string" ? checked : (checked.name || ""));
    setVal("estCheckedRank", checked.rank || "");
    setVal("estCheckedSvc", checked.serviceNo || checked.official_number || "");

    // Approved By
    const approved = est.approvedBy || {};
    setVal("estApprovedName", typeof approved === "string" ? approved : (approved.name || ""));
    setVal("estApprovedRank", approved.rank || "");
    setVal("estApprovedSvc", approved.serviceNo || approved.official_number || "");

    const scopesContainer = document.getElementById("estWorkScopesContainer");
    if (scopesContainer) {
      scopesContainer.innerHTML = "";
      estWorkScopeCounter = 0;
      if (est.workScopes && est.workScopes.length > 0) {
        est.workScopes.forEach((s) => {
          addWorkScopeBlock(s);
        });
      } else {
        // Backward compatibility: load flat lists as a single section
        addWorkScopeBlock({
          description: est.workScope || "Default Work Scope Section",
          materials: est.materials || [],
          labor: est.labor || [],
        });
      }
    }
    if (typeof updateEstimateTotals === "function") updateEstimateTotals();
    if (typeof onEstLocationChange === "function") onEstLocationChange(est.location || "");
    if (typeof populateSignatoryDropdowns === "function") populateSignatoryDropdowns();
  } catch (err) {
    console.error("Error populating estimate edit modal:", err);
  }
}
function addWorkScopeBlock(data = null) {
  estWorkScopeCounter++;
  const sId = estWorkScopeCounter;
  const container = document.getElementById("estWorkScopesContainer");
  const block = document.createElement("div");
  block.id = `estScopeBlock-${sId}`;
  block.className = `est-scope-block border border-slate-200 rounded-xl p-4 bg-white shadow-sm relative`;
  block.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <h5 class="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <span class="bg-indigo-100 text-indigo-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold est-scope-num">1</span>
                Scope Section Description *
            </h5>
            <button type="button" onclick="removeWorkScopeBlock(${sId})" class="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-0.5">
                ✕ Delete Section
            </button>
        </div>
        
        <div class="mb-4">
            <input type="text" class="est-scope-desc w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Describe the scope of work for this section... *" value="${((data === null || data === void 0 ? void 0 : data.description) || "").replace(/"/g, '&quot;')}" required>
        </div>
        
        <!-- Materials sub-section -->
        <div class="border border-slate-100 rounded-lg p-3 bg-slate-50/30 mb-4">
            <div class="flex items-center justify-between mb-2">
                <h6 class="font-semibold text-slate-700 text-xs flex items-center gap-1">🛠️ Materials <span class="est-scope-materials-total text-green-600 font-bold ml-2" id="estScopeMaterialsTotal-${sId}">Rs. 0.00</span></h6>
                <button type="button" onclick="addScopeMaterialRow(${sId})" class="bg-green-600 hover:bg-green-700 text-white px-2 py-0.5 rounded text-[10px] font-medium transition-all">+ Add Material</button>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-xs">
                    <thead class="bg-slate-100">
                        <tr>
                            <th class="px-2 py-1.5 text-left">Material</th>
                            <th class="px-2 py-1.5 text-center w-20">Avail</th>
                            <th class="px-2 py-1.5 text-center w-16">Qty</th>
                            <th class="px-2 py-1.5 text-center w-16">Unit</th>
                            <th class="px-2 py-1.5 text-right w-24">Unit Cost</th>
                            <th class="px-2 py-1.5 text-right w-24">Total</th>
                            <th class="w-8"></th>
                        </tr>
                    </thead>
                    <tbody id="estScopeMaterialsBody-${sId}"></tbody>
                </table>
            </div>
        </div>
        
        <!-- Labor sub-section -->
        <div class="border border-slate-100 rounded-lg p-3 bg-slate-50/30">
            <div class="flex items-center justify-between mb-2">
                <h6 class="font-semibold text-slate-700 text-xs flex items-center gap-1">👷 Labor Requirement <span class="est-scope-labor-total text-blue-600 font-bold ml-2" id="estScopeLaborTotal-${sId}">0 Man-Days</span></h6>
                <button type="button" onclick="addScopeLaborRow(${sId})" class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded text-[10px] font-medium transition-all">+ Add Trade</button>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-xs">
                    <thead class="bg-slate-100">
                        <tr>
                            <th class="px-2 py-1.5 text-left w-36">Trade</th>
                            <th class="px-2 py-1.5 text-center w-20">Workers</th>
                            <th class="px-2 py-1.5 text-center w-20">Man-Days</th>
                            <th class="px-2 py-1.5 text-left">Task Description</th>
                            <th class="w-8"></th>
                        </tr>
                    </thead>
                    <tbody id="estScopeLaborBody-${sId}"></tbody>
                </table>
            </div>
        </div>
    `;
  container.appendChild(block);
  renumberWorkScopes(); // Populate with existing data if editing
  if (data) {
    if (data.materials && data.materials.length > 0) {
      data.materials.forEach((m) => addScopeMaterialRow(sId, m));
    }
    if (data.labor && data.labor.length > 0) {
      data.labor.forEach((l) => addScopeLaborRow(sId, l));
    }
  } else {
    // Add one blank row to each sub-section for easy input
    addScopeMaterialRow(sId);
    addScopeLaborRow(sId);
  }
}
function removeWorkScopeBlock(sId) {
  const block = document.getElementById(`estScopeBlock-${sId}`);
  if (block) {
    block.remove();
    renumberWorkScopes();
    updateEstimateTotals();
  }
}
function renumberWorkScopes() {
  const blocks = document.querySelectorAll(".est-scope-block");
  blocks.forEach((b, idx) => {
    const numSpan = b.querySelector(".est-scope-num");
    if (numSpan) numSpan.textContent = idx + 1;
  });
}

// --- Custom Autocomplete for Materials ---
// --- Custom Autocomplete for Materials ---
function setupMaterialAutocomplete(inputElement, onSelectCallback) {
  if (!inputElement || inputElement.hasAttribute("data-autocomplete-init")) return;
  inputElement.setAttribute("data-autocomplete-init", "true");
  inputElement.setAttribute("autocomplete", "off");
  inputElement.removeAttribute("list");

  let dropdown = document.createElement("div");
  dropdown.className =
    "mat-autocomplete-dropdown hidden fixed z-[99999999] bg-white border border-slate-300 rounded-xl shadow-2xl max-h-60 overflow-y-auto text-left pointer-events-auto";
  document.body.appendChild(dropdown);

  let currentMatches = [];

  const closeDropdown = () => {
    dropdown.classList.add("hidden");
  };

  const updatePosition = () => {
    if (dropdown.classList.contains("hidden")) return;
    const rect = inputElement.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      closeDropdown();
      return;
    }
    dropdown.style.position = "fixed";
    dropdown.style.left = `${rect.left}px`;
    dropdown.style.width = `${Math.max(340, rect.width)}px`;
    dropdown.style.zIndex = "99999999";

    const dropdownHeight = 220;
    if (rect.bottom + dropdownHeight > window.innerHeight && rect.top > dropdownHeight) {
      dropdown.style.top = `${rect.top - dropdownHeight - 4}px`;
    } else {
      dropdown.style.top = `${rect.bottom + 4}px`;
    }
  };

  const renderResults = (query) => {
    const lowerQuery = (query || "").toLowerCase().trim();
    const curZone = store.currentEstimateZone || store.currentZone;
    
    // Filter inventory strictly by the currently logged-in / active zone
    const zoneInventory = (store.inventory || []).filter((i) => {
      if (i.category === "Tools") return false;
      if (!i.zone_id && !i.zone) return true; // General items
      return isZoneMatch(i.zone_id || i.zone, curZone);
    });

    const items = zoneInventory.length > 0 ? zoneInventory : (store.inventory || []).filter((i) => i.category !== "Tools");
    currentMatches = [];
    let html = "";
    const maxResults = 40;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (
        !lowerQuery ||
        (item.description || "").toLowerCase().includes(lowerQuery) ||
        (item.category || "").toLowerCase().includes(lowerQuery) ||
        (item.book_no || "").toLowerCase().includes(lowerQuery)
      ) {
        const matchIdx = currentMatches.length;
        currentMatches.push(item);
        const unitCostVal = parseFloat(item.cost_per_unit || item.cost || 0);
        html += `<div class="px-3 py-2 hover:bg-teal-50 cursor-pointer border-b border-slate-100 last:border-0 autocomplete-item transition-colors" data-match-idx="${matchIdx}">
            <div class="text-xs font-bold text-slate-800 leading-tight mb-0.5 pointer-events-none flex items-center justify-between">
              <span>${item.description}</span>
              ${item.location ? `<span class="text-[10px] text-slate-400 font-normal">📍 ${item.location}</span>` : ""}
            </div>
            <div class="text-[11px] text-slate-500 font-mono flex items-center justify-between pointer-events-none">
              <span>Avail: <strong class="text-slate-700">${item.quantity || 0} ${item.deno || ""}</strong></span>
              <span class="text-emerald-700 font-semibold">${formatCurrency(unitCostVal)}</span>
            </div>
        </div>`;
        if (currentMatches.length >= maxResults) break;
      }
    }

    if (currentMatches.length === 0) {
      html = `<div class="px-3 py-2 text-xs text-slate-500 italic">No matching inventory items in ${curZone || "this zone"} (type freely)</div>`;
    }

    dropdown.innerHTML = html;
    dropdown.classList.remove("hidden");
    updatePosition();

    dropdown.querySelectorAll(".autocomplete-item").forEach((el) => {
      const handleSelect = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const idx = parseInt(el.getAttribute("data-match-idx"), 10);
        const selectedItem = currentMatches[idx];
        if (selectedItem) {
          inputElement.value = selectedItem.description || "";
          closeDropdown();
          if (onSelectCallback) onSelectCallback(selectedItem);
        }
      };
      el.addEventListener("mousedown", handleSelect);
      el.addEventListener("click", handleSelect);
    });
  };

  inputElement.addEventListener("focus", () => {
    renderResults(inputElement.value);
  });

  inputElement.addEventListener("input", () => {
    renderResults(inputElement.value);
  });

  inputElement.addEventListener("blur", () => {
    setTimeout(closeDropdown, 250);
  });

  document.addEventListener("scroll", updatePosition, true);
  window.addEventListener("resize", updatePosition);
}

function addScopeMaterialRow(sId, data = null) {
  const tbody = document.getElementById(`estScopeMaterialsBody-${sId}`);
  if (!tbody) return;
  const descVal = ((data === null || data === void 0 ? void 0 : data.description) || "").replace(/"/g, '&quot;');
  const unitVal = ((data === null || data === void 0 ? void 0 : data.unit) || "").replace(/"/g, '&quot;');
  const availVal = ((data === null || data === void 0 ? void 0 : data.availability) || "-").replace(/"/g, '&quot;');
  const tr = document.createElement("tr");
  tr.className = "border-b border-slate-100";
  tr.innerHTML = `
        <td class="px-2 py-1.5 relative">
            <input type="text" class="est-mat-select w-full px-2 py-1 border border-slate-300 rounded text-xs" placeholder="Search inventory item..." autocomplete="off" value="${descVal}">
        </td>
        <td class="px-2 py-1.5 text-center est-mat-avail text-slate-500 font-mono">${availVal}</td>
        <td class="px-2 py-1.5">
            <input type="number" class="est-mat-qty w-full px-2 py-1 border border-slate-300 rounded text-xs text-center font-bold" min="0" step="any" value="${(data === null || data === void 0 ? void 0 : data.qty) !== undefined && (data === null || data === void 0 ? void 0 : data.qty) !== null ? data.qty : ""}" oninput="updateEstimateTotals()">
        </td>
        <td class="px-2 py-1.5">
            <input type="text" list="estUnitDatalist" class="est-mat-unit w-full px-2 py-1 border border-slate-300 rounded text-xs text-center bg-white font-medium focus:ring-1 focus:ring-amber-500 focus:border-amber-500" placeholder="Unit" value="${unitVal}">
        </td>
        <td class="px-2 py-1.5">
            <input type="number" class="est-mat-cost w-full px-2 py-1 border border-slate-300 rounded text-xs text-right" min="0" step="0.01" value="${(data === null || data === void 0 ? void 0 : data.cost) !== undefined && (data === null || data === void 0 ? void 0 : data.cost) !== null ? data.cost : ""}" oninput="updateEstimateTotals()">
        </td>
        <td class="px-2 py-1.5 text-right font-semibold est-mat-total text-green-700">Rs. 0.00</td>
        <td class="px-2 py-1.5 text-center">
            <button type="button" onclick="this.closest('tr').remove(); updateEstimateTotals();" class="text-red-400 hover:text-red-600 font-bold">&times;</button>
        </td>
    `;
  tbody.appendChild(tr);
  const inputEl = tr.querySelector(".est-mat-select");
  setupMaterialAutocomplete(inputEl, (selectedItem) => {
    if (selectedItem) {
      tr.querySelector(".est-mat-avail").textContent = `${selectedItem.quantity || 0} ${selectedItem.deno || ""}`;
      tr.querySelector(".est-mat-unit").value = selectedItem.deno || "";
      tr.querySelector(".est-mat-cost").value = selectedItem.cost_per_unit || selectedItem.cost || 0;
      const qtyInp = tr.querySelector(".est-mat-qty");
      if (qtyInp) {
        qtyInp.focus();
        qtyInp.select();
      }
      updateEstimateTotals();
    }
  });
  updateEstimateTotals();
}
function addScopeLaborRow(sId, data = null) {
  const tbody = document.getElementById(`estScopeLaborBody-${sId}`);
  if (!tbody) return;
  const taskDescVal = ((data === null || data === void 0 ? void 0 : data.taskDescription) || "").replace(/"/g, '&quot;');
  const trades = [
    "Mason",
    "Carpenter",
    "Painter",
    "Plumber",
    "Welder",
    "Electrician",
    "Aluminum Fabricator",
    "Steel Bender",
    "Sawyer",
    "Laborer",
    "Artificer",
    "RW",
    "SW",
    "BB",
    "AL",
    "Other",
  ];
  const tr = document.createElement("tr");
  tr.className = "border-b border-slate-100";
  tr.innerHTML = `
        <td class="px-2 py-1.5">
            <select class="est-lab-trade w-full px-2 py-1 border border-slate-300 rounded text-xs font-medium">
                ${trades.map((t) => `<option value="${t}" ${data && data.trade === t ? "selected" : ""}>${t}</option>`).join("")}
            </select>
        </td>
        <td class="px-2 py-1.5">
            <input type="number" class="est-lab-workers w-full px-2 py-1 border border-slate-300 rounded text-xs text-center" min="1" value="${(data === null || data === void 0 ? void 0 : data.workers) || 1}" oninput="updateEstimateTotals()">
        </td>
        <td class="px-2 py-1.5">
            <input type="number" class="est-lab-days w-full px-2 py-1 border border-slate-300 rounded text-xs text-center font-bold" min="0" step="any" value="${(data === null || data === void 0 ? void 0 : data.manDays) || ""}" oninput="updateEstimateTotals()">
        </td>
        <td class="px-2 py-1.5">
            <input type="text" class="est-lab-desc w-full px-2 py-1 border border-slate-300 rounded text-xs" placeholder="e.g. Concrete breaking, plastering" value="${taskDescVal}">
        </td>
        <td class="px-2 py-1.5 text-center">
            <button type="button" onclick="this.closest('tr').remove(); updateEstimateTotals();" class="text-red-400 hover:text-red-600 font-bold">&times;</button>
        </td>
    `;
  tbody.appendChild(tr);
  updateEstimateTotals();
}
function updateEstimateTotals() {
  let grandMaterialsTotal = 0;
  let grandLaborTotal = 0;
  const blocks = document.querySelectorAll(".est-scope-block");
  blocks.forEach((b) => {
    const sId = b.id.replace("estScopeBlock-", "");
    let scopeMatTotal = 0;
    let scopeLabTotal = 0;
    b.querySelectorAll(`#estScopeMaterialsBody-${sId} tr`).forEach((row) => {
      const qtyInput = row.querySelector(".est-mat-qty");
      const costInput = row.querySelector(".est-mat-cost");
      const qty = parseFloat(qtyInput ? qtyInput.value : 0) || 0;
      const cost = parseFloat(costInput ? costInput.value : 0) || 0;
      const lineTotal = qty * cost;
      scopeMatTotal += lineTotal;
      const totalCell = row.querySelector(".est-mat-total");
      if (totalCell) totalCell.textContent = formatCurrency(lineTotal);
    });
    b.querySelectorAll(`#estScopeLaborBody-${sId} tr`).forEach((row) => {
      const daysInput = row.querySelector(".est-lab-days");
      const days = parseFloat(daysInput ? daysInput.value : 0) || 0;
      scopeLabTotal += days;
    });
    const matTotalEl = document.getElementById(`estScopeMaterialsTotal-${sId}`);
    if (matTotalEl) matTotalEl.textContent = formatCurrency(scopeMatTotal);
    const labTotalEl = document.getElementById(`estScopeLaborTotal-${sId}`);
    if (labTotalEl) labTotalEl.textContent = `${scopeLabTotal} Man-Days`;
    grandMaterialsTotal += scopeMatTotal;
    grandLaborTotal += scopeLabTotal;
  });
  const smEl = document.getElementById("estSummaryMaterials");
  if (smEl) smEl.textContent = formatCurrency(grandMaterialsTotal);
  const slEl = document.getElementById("estSummaryLabor");
  if (slEl) slEl.textContent = grandLaborTotal;
  const stEl = document.getElementById("estSummaryTotal");
  if (stEl) stEl.textContent = formatCurrency(grandMaterialsTotal);
}

function saveEstimate(event) {
  event.preventDefault();
  const workScopes = [];
  let grandMaterialsTotal = 0;
  let grandLaborTotal = 0;
  const flatMaterials = [];
  const flatLabor = [];
  const scopeDescriptions = [];
  const blocks = document.querySelectorAll(".est-scope-block");
  blocks.forEach((b) => {
    const sId = b.id.replace("estScopeBlock-", "");
    const desc = b.querySelector(".est-scope-desc").value.trim();
    scopeDescriptions.push(desc);
    const materials = [];
    b.querySelectorAll(`#estScopeMaterialsBody-${sId} tr`).forEach((row) => {
      var _row$querySelector4,
        _row$querySelector5,
        _row$querySelector6,
        _row$querySelector7;
      const matInput = row.querySelector(".est-mat-select");
      const description =
        (matInput === null || matInput === void 0
          ? void 0
          : matInput.value.trim()) || "";
      if (!description || description === "Select...") return;
      const item = {
        description: description,
        qty:
          parseFloat(
            (_row$querySelector4 = row.querySelector(".est-mat-qty")) ===
              null || _row$querySelector4 === void 0
              ? void 0
              : _row$querySelector4.value,
          ) || 0,
        unit:
          ((_row$querySelector5 = row.querySelector(".est-mat-unit")) ===
            null || _row$querySelector5 === void 0
            ? void 0
            : _row$querySelector5.value) || "",
        cost:
          parseFloat(
            (_row$querySelector6 = row.querySelector(".est-mat-cost")) ===
              null || _row$querySelector6 === void 0
              ? void 0
              : _row$querySelector6.value,
          ) || 0,
        availability:
          ((_row$querySelector7 = row.querySelector(".est-mat-avail")) ===
            null || _row$querySelector7 === void 0
            ? void 0
            : _row$querySelector7.textContent) || "-",
      };
      materials.push(item);
      flatMaterials.push(item);
      grandMaterialsTotal += item.qty * item.cost;
    });
    const labor = [];
    b.querySelectorAll(`#estScopeLaborBody-${sId} tr`).forEach((row) => {
      var _row$querySelector8,
        _row$querySelector9,
        _row$querySelector0,
        _row$querySelector1;
      const trade =
        ((_row$querySelector8 = row.querySelector(".est-lab-trade")) === null ||
        _row$querySelector8 === void 0
          ? void 0
          : _row$querySelector8.value) || "";
      const workers =
        parseInt(
          (_row$querySelector9 = row.querySelector(".est-lab-workers")) ===
            null || _row$querySelector9 === void 0
            ? void 0
            : _row$querySelector9.value,
        ) || 1;
      const manDays =
        parseFloat(
          (_row$querySelector0 = row.querySelector(".est-lab-days")) === null ||
            _row$querySelector0 === void 0
            ? void 0
            : _row$querySelector0.value,
        ) || 0;
      const taskDescription =
        ((_row$querySelector1 = row.querySelector(".est-lab-desc")) === null ||
        _row$querySelector1 === void 0
          ? void 0
          : _row$querySelector1.value) || "";
      if (manDays <= 0) return;
      const item = {
        trade: trade,
        workers: workers,
        manDays: manDays,
        taskDescription: taskDescription,
      };
      labor.push(item);
      flatLabor.push(item);
      grandLaborTotal += manDays;
    });
    workScopes.push({ description: desc, materials: materials, labor: labor });
  });

  const id = document.getElementById("estId").value;
  const sig = (n, r, s) => ({
    name: document.getElementById(n).value.trim(),
    rank: document.getElementById(r).value.trim(),
    serviceNo: document.getElementById(s).value.trim(),
  });
  const createdBy = sig("estCreatedName", "estCreatedRank", "estCreatedSvc");
  const checkedBy = sig("estCheckedName", "estCheckedRank", "estCheckedSvc");
  const approvedBy = sig(
    "estApprovedName",
    "estApprovedRank",
    "estApprovedSvc",
  );

  const ref_type =
    (document.getElementById("estRefType") || {}).value || "Minute Sheet";
  const project_type =
    (document.getElementById("estProjectType") || {}).value || "PROJECT";
  const location = document.getElementById("estLocation").value.trim();
  const location2 = (
    document.getElementById("estLocation2") || {}
  ).value.trim();
  const endUser = document.getElementById("estEndUser").value.trim();
  const description = document.getElementById("estDescription").value.trim();
  const reference_doc = document.getElementById("estReference").value.trim();
  const compiledWorkScope = scopeDescriptions.join("; ");

  if (id) {
    const est = store.estimates.find((e) => e.id == id);
    if (est) {
      est.description = description;
      est.ref_type = ref_type;
      est.reference_type = ref_type;
      est.reference_doc = reference_doc;
      est.reference_no = reference_doc;
      est.project_type = project_type;
      est.type = project_type;
      est.location = location;
      est.location2 = location2;
      est.sub_location = location2;
      est.endUser = endUser;
      est.workScope = compiledWorkScope;
      est.workScopes = workScopes;
      est.materials = flatMaterials;
      est.labor = flatLabor;
      est.total_cost = grandMaterialsTotal;
      est.totalManDays = grandLaborTotal;
      est.createdBy = createdBy;
      est.checkedBy = checkedBy;
      est.approvedBy = approvedBy;
      fbSaveEstimate(est);
    }
    showToast("Estimate updated!");
  } else {
    const newEst = {
      id: store.estimates.length + 1,
      estimate_number: `EST/${new Date().getFullYear()}/${String(store.estimates.length + 1).padStart(4, "0")}`,
      description: description,
      ref_type: ref_type,
      reference_type: ref_type,
      reference_doc: reference_doc,
      reference_no: reference_doc,
      project_type: project_type,
      type: project_type,
      location: location,
      location2: location2,
      sub_location: location2,
      endUser: endUser,
      workScope: compiledWorkScope,
      workScopes: workScopes,
      materials: flatMaterials,
      labor: flatLabor,
      total_cost: grandMaterialsTotal,
      totalManDays: grandLaborTotal,
      status: "Pending",
      approvedAuthority: approvedBy.name || null,
      createdBy: createdBy,
      checkedBy: checkedBy,
      approvedBy: approvedBy,
      zone_id: store.currentZone,
    };
    fbSaveEstimate(newEst);
    if (reference_doc) {
      linkEstimateToJobMinute(newEst.estimate_number, reference_doc);
    }
    showToast("Estimate created!");
  }

  // Auto-save Location & Location 2 into Database so it is remembered and suggested for future estimates
  if (location) {
    const zid = store.currentZone || "A-Zone";
    const locPool = store.locations || [];
    const loc1Lower = location.toLowerCase().trim();
    const loc2Lower = (location2 || "").toLowerCase().trim();
    const exists = locPool.some((l) =>
      (l.building_name || l.name || "").toLowerCase().trim() === loc1Lower &&
      (l.sub_location || l.location2 || "").toLowerCase().trim() === loc2Lower
    );
    if (!exists) {
      const validIds = locPool
        .map((l) => parseInt(l.id, 10))
        .filter((n) => !Number.isNaN(n) && Number.isFinite(n));
      const maxId = validIds.length > 0 ? Math.max(...validIds) : 0;
      const newLoc = {
        id: maxId + 1,
        zone_id: zid,
        building_name: location,
        sub_location: location2 || "",
        end_user: endUser || "",
        description: "Auto-saved from Estimate",
        created_at: Date.now(),
      };
      fbSaveLocation(newLoc);
    }
  }

  closeModal("newEstimateModal");
  renderEstimates();
}

// Signatory Dropdown Helper
function setupSignatoryAutocomplete(prefix) {
  const inputElement = document.getElementById(`est${prefix}Name`);
  const rankEl = document.getElementById(`est${prefix}Rank`);
  const svcEl = document.getElementById(`est${prefix}Svc`);
  if (!inputElement || inputElement.hasAttribute("data-autocomplete-init")) return;
  inputElement.setAttribute("data-autocomplete-init", "true");

  let dropdown = document.createElement("div");
  dropdown.className = `sig-autocomplete-dropdown-${prefix} hidden fixed z-[99999999] bg-white border border-slate-300 rounded-xl shadow-2xl max-h-60 overflow-y-auto text-left pointer-events-auto`;
  document.body.appendChild(dropdown);

  const closeDropdown = () => {
    dropdown.classList.add("hidden");
  };

  const updatePosition = () => {
    if (dropdown.classList.contains("hidden")) return;
    const rect = inputElement.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      closeDropdown();
      return;
    }
    dropdown.style.position = "fixed";
    dropdown.style.left = `${rect.left}px`;
    dropdown.style.width = `${Math.max(320, rect.width)}px`;
    dropdown.style.zIndex = "99999999";

    const dropdownHeight = 220;
    if (rect.bottom + dropdownHeight > window.innerHeight && rect.top > dropdownHeight) {
      dropdown.style.top = `${rect.top - dropdownHeight - 4}px`;
    } else {
      dropdown.style.top = `${rect.bottom + 4}px`;
    }
  };

  const renderResults = (query) => {
    const lowerQuery = (query || "").toLowerCase().trim();
    let items = [];

    if (prefix === "Created") {
      // Created By -> All Sailors + Current User
      items = (store.sailors || []).map((s) => {
        const offNo = s.official_number || s.off_no || s.service_no || s.id || "";
        const rank = s.rank || s.trade || "Sailor";
        return {
          name: s.name,
          rank: rank,
          svc: offNo,
          label: s.name,
          sub: `${rank} • ${offNo} (${s.trade || "Sailor"})`,
          badge: s.trade || "Sailor",
          badgeColor: "bg-blue-100 text-blue-800",
        };
      });
    } else if (prefix === "Checked") {
      // Checked By -> Zone In-Charge, Supervisors, & All Sailors
      const incMap = store.settings?.zoneInCharges || {};
      Object.values(incMap).forEach((inc) => {
        if (inc && inc.name) {
          items.push({
            name: inc.name,
            rank: inc.rank || "In-Charge",
            svc: inc.serviceNo || inc.service_no || inc.official_number || "",
            label: inc.name,
            sub: `${inc.rank || "In-Charge"} • ${inc.serviceNo || ""} (Zone In-Charge)`,
            badge: "Zone In-Charge",
            badgeColor: "bg-amber-100 text-amber-800",
          });
        }
        if (Array.isArray(inc?.supervisors)) {
          inc.supervisors.forEach((sp) => {
            if (sp && sp.name) {
              items.push({
                name: sp.name,
                rank: sp.rank || "Supervisor",
                svc: sp.serviceNo || sp.service_no || "",
                label: sp.name,
                sub: `${sp.rank || "Supervisor"} • ${sp.serviceNo || ""}`,
                badge: "Supervisor",
                badgeColor: "bg-indigo-100 text-indigo-800",
              });
            }
          });
        }
      });

      // All Sailors
      (store.sailors || []).forEach((s) => {
        const offNo = s.official_number || s.off_no || s.service_no || s.id || "";
        items.push({
          name: s.name,
          rank: s.rank || s.trade || "Staff",
          svc: offNo,
          label: s.name,
          sub: `${s.rank || "Staff"} • ${offNo} (${s.trade || "Staff"})`,
          badge: s.trade || "Staff",
          badgeColor: "bg-slate-100 text-slate-700",
        });
      });
    } else if (prefix === "Approved") {
      // Approved By -> Specific CE Officers list + Option to leave blank
      items.push({
        name: "",
        rank: "",
        svc: "",
        label: "🚫 Clear / Leave Blank",
        sub: "No approval signature required (Keep blank)",
        badge: "Blank",
        badgeColor: "bg-slate-100 text-slate-500",
      });

      const ceOfficersList = [
        { rank: "CAPTAIN (CE)", name: "BGL BALASURIYA", svc: "NRC 1843", desig: "CCED(E)" },
        { rank: "CDR (CE)", name: "TM VITHARANA", svc: "NRC 2541", desig: "CCEO(E)" },
        { rank: "LCDR (CE)", name: "JAJD SENARATHNA", svc: "NRC 3068", desig: "SCE(M)" },
        { rank: "LCDR (CE)", name: "JATK JAYAKODI", svc: "NRC 3542", desig: "SCE(P&P)" },
        { rank: "LCDR (CE)", name: "KMAU KAHANDAWA", svc: "NRC 3576", desig: "SCE(W/W)" },
        { rank: "LCDR (CE)", name: "HMMI JAYATHUNGA", svc: "NRC 3977", desig: "CE (W/W), CE (P&P)" },
        { rank: "LT (CE)", name: "WP DARSHANA", svc: "NRC 4126", desig: "QS (E)" },
        { rank: "LT (CE)", name: "JADU JAYASINGHE", svc: "NRC 4310", desig: "CE(M) I" },
        { rank: "LT (CE)", name: "PHKR KUMARA", svc: "NRC 4570", desig: "CE(M) II" },
      ];

      ceOfficersList.forEach((off) => {
        items.push({
          name: off.name,
          rank: off.rank,
          svc: `${off.svc} - ${off.desig}`,
          label: `${off.rank} ${off.name}`,
          sub: `${off.svc} • ${off.desig}`,
          badge: off.desig,
          badgeColor: "bg-emerald-100 text-emerald-800",
        });
      });

      // Also add any other officers from users
      (store.users || []).forEach((u) => {
        if (u.role === "Admin" || u.role === "Officer" || (u.rank && u.rank.includes("LT"))) {
          items.push({
            name: u.name,
            rank: u.rank || "Officer",
            svc: u.serviceNo || u.official_number || "",
            label: `${u.rank || ""} ${u.name}`.trim(),
            sub: `${u.rank || "Officer"} • ${u.serviceNo || ""}`,
            badge: "Officer",
            badgeColor: "bg-teal-100 text-teal-800",
          });
        }
      });
    }

    if (lowerQuery) {
      items = items.filter((it) => {
        const text = `${it.name} ${it.rank} ${it.svc} ${it.sub}`.toLowerCase();
        return text.includes(lowerQuery);
      });
    }

    // Deduplicate by name + svc
    const seen = new Set();
    items = items.filter((it) => {
      const key = `${it.name}_${it.svc}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const visibleItems = items.slice(0, 30);
    if (visibleItems.length === 0) {
      dropdown.innerHTML = `<div class="px-3 py-2 text-xs text-slate-500 italic">No matching records (type freely)</div>`;
    } else {
      dropdown.innerHTML = visibleItems
        .map(
          (it, idx) => `
        <div class="px-3 py-2 hover:bg-teal-50 cursor-pointer border-b border-slate-100 last:border-0 autocomplete-item transition-colors" data-sig-idx="${idx}">
            <div class="flex items-center justify-between gap-1 pointer-events-none">
                <span class="text-xs font-bold text-slate-800">${it.label}</span>
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${it.badgeColor}">${it.badge}</span>
            </div>
            <div class="text-[11px] text-slate-500 font-mono pointer-events-none">${it.sub}</div>
        </div>
      `,
        )
        .join("");
    }

    dropdown.classList.remove("hidden");
    updatePosition();

    dropdown.querySelectorAll(".autocomplete-item").forEach((el) => {
      const handleSelect = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const idx = parseInt(el.getAttribute("data-sig-idx"), 10);
        const it = visibleItems[idx];
        if (it) {
          inputElement.value = it.name || "";
          if (rankEl) rankEl.value = it.rank || "";
          if (svcEl) svcEl.value = it.svc || "";
          closeDropdown();
        }
      };
      el.addEventListener("mousedown", handleSelect);
      el.addEventListener("click", handleSelect);
    });
  };

  inputElement.addEventListener("focus", () => {
    renderResults(inputElement.value);
  });

  inputElement.addEventListener("input", () => {
    renderResults(inputElement.value);
  });

  inputElement.addEventListener("blur", () => {
    setTimeout(closeDropdown, 200);
  });

  document.addEventListener("scroll", updatePosition, true);
  window.addEventListener("resize", updatePosition);
}

function populateSignatoryDropdowns() {
  setupSignatoryAutocomplete("Created");
  setupSignatoryAutocomplete("Checked");
  setupSignatoryAutocomplete("Approved");
} // ---- Approval (req 9) ----
function approveEstimate() {
  const est = findEstimateById(store.selectedEstimate);
  if (!est) {
    showToast("Select an estimate first", "error");
    return;
  }
  if (est.status === "Approved") {
    showToast("This estimate is already approved", "info");
    return;
  }
  const modal = document.getElementById("approvalModal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.style.setProperty("display", "flex", "important");
    modal.style.setProperty("visibility", "visible", "important");
    modal.style.setProperty("opacity", "1", "important");
    modal.style.setProperty("z-index", "99999", "important");
  }
  const apvNum = document.getElementById("apvEstNumber");
  if (apvNum) apvNum.textContent = est.estimate_number || "—";
  const apvAuth = document.getElementById("apvAuthority");
  if (apvAuth) apvAuth.value = "";
}
function submitApproval(event) {
  event.preventDefault();
  const est = findEstimateById(store.selectedEstimate);
  if (!est) return;
  const authority = document.getElementById("apvAuthority").value;
  est.status = "Approved";
  est.approvedAuthority = authority;
  if (window.fbSaveEstimate) fbSaveEstimate(est);
  closeModal("approvalModal");
  selectEstimate(est.id || est._fbKey);
  showToast(`Estimate ${est.estimate_number} approved by ${authority}`);
}
function deleteEstimate() {
  const estId = store.selectedEstimate;
  if (!estId) return;
  const est = findEstimateById(estId);
  if (!est) return;
  if (
    confirm(
      `⚠️ Are you sure you want to delete the estimate "${est.estimate_number}" (${est.description})?\n\nThis action cannot be undone.`,
    )
  ) {
    const targetFbKey = est._fbKey;
    if (!targetFbKey) {
      showToast("Cannot delete: Firebase key not found.");
      return;
    }
    opsDB
      .ref(`estimates/${targetFbKey}`)
      .remove()
      .then(() => {
        store.selectedEstimate = null; // Reset right panel content
        document.getElementById("selectedEstimateNumber").textContent =
          "Select an Estimate";
        document.getElementById("editEstimateBtn").style.display = "none";
        document.getElementById("approveEstimateBtn").style.display = "none";
        document.getElementById("deleteEstimateBtn").style.display = "none";
        document.getElementById("estimateContent").innerHTML =
          `<p class="text-slate-500 text-center py-8">Select an estimate to view details</p>`;
        showToast(`Deleted estimate successfully!`);
        renderEstimates();
      })
      .catch((err) => {
        console.error("Error deleting estimate:", err);
        showToast("Failed to delete estimate.");
      });
  }
} // ---- Compact printable layout (req 7) ----
// Status intentionally omitted from the printout (req 7)
function buildEstimatePrintHTML(est, isBulk = false) {
  var _store$zones$find2;
  const zoneObj = store.zones
    ? store.zones.find((z) => z.id === (est.zone_id || store.currentZone))
    : null;
  const zoneName =
    zoneObj && zoneObj.name ? zoneObj.name : (store.currentZone || "Civil Engineering Department");

  const sigBlock = (label, p) => `
        <div style="text-align:center;width:30%;">
            <div style="height:34px;border-bottom:1.5px solid #0f172a;margin-bottom:4px;"></div>
            <div style="font-size:11px;font-weight:800;text-transform:uppercase;color:#0f172a;">${label}</div>
            <div style="font-size:11px;font-weight:700;color:#1e293b;margin-top:1px;">${p && p.name ? p.name : "&nbsp;"}</div>
            <div style="font-size:10px;color:#475569;font-weight:600;">${p && p.rank ? p.rank : ""}${p && p.serviceNo ? " • " + p.serviceNo : ""}</div>
        </div>`;

  let sectionsHtml = "";
  if (est.workScopes && est.workScopes.length > 0) {
    est.workScopes.forEach((s, sIdx) => {
      const matRows = (s.materials || [])
        .map(
          (m, i) => `
            <tr>
                <td style="text-align:center;width:5%;font-weight:600;">${i + 1}</td>
                <td style="font-weight:600;color:#0f172a;">${m.description}</td>
                <td style="text-align:center;width:10%;font-weight:700;">${m.qty}</td>
                <td style="text-align:center;width:10%;">${m.unit || 'Nos'}</td>
                <td style="text-align:right;width:17%;font-family:monospace;font-weight:600;">${formatCurrency(m.cost)}</td>
                <td style="text-align:right;width:19%;font-family:monospace;font-weight:800;color:#0f172a;">${formatCurrency(m.qty * m.cost)}</td>
            </tr>`,
        )
        .join("");

      const labRows = (s.labor || [])
        .map(
          (l) => `
            <tr>
                <td style="font-weight:700;color:#0f172a;">${l.trade}</td>
                <td style="text-align:center;width:14%;font-weight:700;">${l.workers}</td>
                <td style="text-align:center;width:14%;font-weight:800;color:#2563eb;">${l.manDays}</td>
                <td style="color:#334155;">${l.taskDescription || "—"}</td>
            </tr>`,
        )
        .join("");

      const sectionTotalCost = (s.materials || []).reduce(
        (sum, m) => sum + m.qty * m.cost,
        0,
      );

      sectionsHtml += `
        <div style="margin-top: 8px; border: 1.2px solid #cbd5e1; border-radius: 6px; padding: 8px 10px; background-color: #fafbfc; page-break-inside: avoid;">
            <div style="font-size: 11.5px; font-weight: 800; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin-bottom: 6px; text-transform: uppercase; color: #0f172a; display: flex; justify-content: space-between; align-items: center;">
                <span>📌 Section ${sIdx + 1}: ${s.description}</span>
                <span style="color:#059669;font-family:monospace;font-size:12px;">Cost: ${formatCurrency(sectionTotalCost)}</span>
            </div>
            
            ${
              matRows
                ? `
            <table class="est-table" style="margin-bottom: 6px;">
                <thead>
                    <tr><th style="width:5%;text-align:center;">#</th><th>Material Description</th><th style="width:10%;text-align:center;">Qty</th><th style="width:10%;text-align:center;">Unit</th><th style="width:17%;text-align:right;">Unit Cost</th><th style="width:19%;text-align:right;">Total (LKR)</th></tr>
                </thead>
                <tbody>${matRows}</tbody>
            </table>
            `
                : ""
            }
            
            ${
              labRows
                ? `
            <table class="est-table">
                <thead><tr><th>Trade / Skill Required</th><th style="width:14%;text-align:center;">Workers</th><th style="width:14%;text-align:center;">Man-Days</th><th>Task Description</th></tr></thead>
                <tbody>${labRows}</tbody>
            </table>
            `
                : ""
            }
        </div>
      `;
    });
  } else {
    // Fallback for flat layout (old estimates)
    const matRows =
      (est.materials || [])
        .map(
          (m, i) => `
            <tr>
                <td style="text-align:center;width:5%;font-weight:600;">${i + 1}</td>
                <td style="font-weight:600;color:#0f172a;">${m.description}</td>
                <td style="text-align:center;width:10%;font-weight:700;">${m.qty}</td>
                <td style="text-align:center;width:10%;">${m.unit || 'Nos'}</td>
                <td style="text-align:right;width:17%;font-family:monospace;font-weight:600;">${formatCurrency(m.cost)}</td>
                <td style="text-align:right;width:19%;font-family:monospace;font-weight:800;color:#0f172a;">${formatCurrency(m.qty * m.cost)}</td>
            </tr>`,
        )
        .join("") ||
      '<tr><td colspan="6" style="text-align:center;font-style:italic;padding:8px;">No materials specified</td></tr>';

    const labRows =
      (est.labor || [])
        .map(
          (l) => `
            <tr>
                <td style="font-weight:700;color:#0f172a;">${l.trade}</td>
                <td style="text-align:center;width:15%;font-weight:700;">${l.workers}</td>
                <td style="text-align:center;width:15%;font-weight:800;color:#2563eb;">${l.manDays}</td>
                <td style="color:#334155;">${l.taskDescription || "—"}</td>
            </tr>`,
        )
        .join("") ||
      '<tr><td colspan="4" style="text-align:center;font-style:italic;padding:8px;">No labor specified</td></tr>';

    sectionsHtml = `
      <table class="est-table" style="margin-top:6px;">
          <thead>
              <tr>
                  <th style="width:5%;text-align:center;">#</th>
                  <th>Material Description</th>
                  <th style="width:10%;text-align:center;">Qty</th>
                  <th style="width:10%;text-align:center;">Unit</th>
                  <th style="width:17%;text-align:right;">Unit Cost</th>
                  <th style="width:19%;text-align:right;">Total (LKR)</th>
              </tr>
          </thead>
          <tbody>${matRows}</tbody>
      </table>

      <table class="est-table" style="margin-top:6px;">
          <thead><tr>
              <th>Trade / Skill Required</th>
              <th style="width:15%;text-align:center;">Workers</th>
              <th style="width:15%;text-align:center;">Man-Days</th>
              <th>Task Description</th>
          </tr></thead>
          <tbody>${labRows}</tbody>
      </table>
    `;
  }

  const hasSignatures = est.createdBy || est.checkedBy || est.approvedBy;
  const sigSection = hasSignatures
    ? `
        <div style="display:flex;justify-content:space-between;margin-top:16px;padding-top:8px;page-break-inside:avoid;">
            ${sigBlock("Created By", est.createdBy)}
            ${sigBlock("Checked By", est.checkedBy)}
            ${sigBlock("Approved By", est.approvedBy)}
        </div>
      `
    : "";

  const createdDate = est.created_at
    ? typeof est.created_at === "number"
      ? new Date(est.created_at).toISOString().split("T")[0]
      : est.created_at
    : "";

  return `
    <div class="est-sheet">
        <!-- Official Header with Crest and Captain Civil Engineering Department (E) -->
        <div style="width:100%;border-bottom:2px solid #0f172a;padding-bottom:8px;margin-bottom:8px;">
            <table style="width:100%;border:none;border-collapse:collapse;">
                <tr>
                    <td style="border:none;padding:0;width:50px;vertical-align:middle;">
                        <img src="${window.location.href.split("?")[0].split("#")[0].replace("index.html", "")}images/navy_crest_cropped.png" style="height:44px;width:auto;display:block;" alt="SLN Crest">
                    </td>
                    <td style="border:none;padding:0 0 0 12px;vertical-align:middle;">
                        <div style="font-size:15px;font-weight:900;letter-spacing:0.5px;color:#0f172a;line-height:1.2;">CAPTAIN CIVIL ENGINEERING DEPARTMENT (E)</div>
                        <div style="font-size:11.5px;font-weight:700;color:#334155;margin-top:2px;">${zoneName} — Cost Estimate & Bill of Quantities</div>
                    </td>
                    <td style="border:none;padding:0;text-align:right;vertical-align:middle;">
                        <div style="font-size:13.5px;font-weight:900;color:#b91c1c;font-family:monospace;letter-spacing:0.5px;">${est.estimate_number}</div>
                        ${createdDate ? `<div style="font-size:11px;color:#475569;font-weight:600;font-family:monospace;margin-top:2px;">Date: ${createdDate}</div>` : ""}
                    </td>
                </tr>
            </table>
        </div>

        <!-- Info Grid Table -->
        <table style="width:100%;font-size:11.5px;line-height:1.55;margin-bottom:6px;border:none;border-collapse:collapse;">
            <tr>
                <td style="border:none;padding:2.5px 0;width:34%;color:#1e293b;"><b>Ref Type:</b> ${est.ref_type || est.reference_type || "Minute Sheet"}</td>
                <td style="border:none;padding:2.5px 0;width:38%;color:#1e293b;"><b>Ref No:</b> ${est.reference_doc || est.reference_no || "—"}</td>
                <td style="border:none;padding:2.5px 0;width:28%;text-align:right;color:#1e293b;"><b>Job/Project Type:</b> ${est.project_type || est.type || "Project"}</td>
            </tr>
            <tr>
                <td style="border:none;padding:2.5px 0;color:#1e293b;"><b>Location:</b> ${est.location || "—"}</td>
                <td style="border:none;padding:2.5px 0;color:#1e293b;"><b>Specific Site / Location 2:</b> ${est.location2 || est.sub_location || "—"}</td>
                <td style="border:none;padding:2.5px 0;text-align:right;color:#1e293b;"><b>End User:</b> ${est.endUser || "—"}</td>
            </tr>
            <tr>
                <td colspan="3" style="border:none;padding:3.5px 0;color:#0f172a;font-size:12px;border-top:1px dashed #cbd5e1;margin-top:2px;"><b>Description:</b> ${est.description}${est.approvedAuthority ? ` &nbsp;|&nbsp; <b>Approval Authority:</b> ${est.approvedAuthority}` : ""}</td>
            </tr>
        </table>
        ${est.workScope && !est.workScopes ? `<p style="font-size:11.5px;margin:4px 0;color:#334155;"><b>Scope of Work:</b> ${est.workScope}</p>` : ""}

        <!-- Work Scopes / Sections -->
        ${sectionsHtml}
        
        <!-- Grand Summary Bar -->
        <div style="margin-top: 10px; border: 1.5px solid #0f172a; border-radius: 6px; padding: 8px 12px; background-color: #f8fafc; display: flex; justify-content: space-between; align-items: center; page-break-inside: avoid; font-size: 12px;">
            <span>Total Materials: <strong style="color: #059669; font-size: 13px; font-family: monospace;">${formatCurrency(est.total_cost)}</strong></span>
            <span>Total Labor: <strong style="color: #2563eb; font-size: 13px;">${est.totalManDays || 0} Man-Days</strong></span>
            <span>Grand Total Estimated Cost: <strong style="color: #b45309; font-size: 14px; font-weight: 900; font-family: monospace;">${formatCurrency(est.total_cost)}</strong></span>
        </div>

        ${sigSection}
    </div>`;
}

function printEstimatesByIds(ids, settings = null) {
  if (!ids || ids.length === 0) {
    showToast("No estimate selected to print", "error");
    return;
  }
  const idSet = new Set(ids.map((id) => String(id)));
  const ests = (store.estimates || []).filter((e) =>
    e && (idSet.has(String(e.id)) || idSet.has(String(e._fbKey)) || idSet.has(String(e.estimate_number)))
  );
  if (ests.length === 0) {
    showToast("Estimate details not found to print", "error");
    return;
  }
  let sheetsHtml = "";
  let customCSS = "";
  
  if (settings && settings.isTiled) {
    // Tiled mode (multiple on one page)
    customCSS = `
            @page { size: A4 portrait; margin: 6mm 8mm; }
            body { margin: 0; padding: 0; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .est-sheet { 
                width: 100%; 
                margin: 0 0 4mm 0; 
                padding: 8px 10px; 
                border: 1.2px solid #000; 
                border-radius: 4px; 
                background: #fff; 
                box-sizing: border-box; 
                page-break-inside: avoid !important; 
                break-inside: avoid !important; 
            }
            .est-table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
            .est-table th { border: 1px solid #64748b; padding: 3px 4px; background: #e2e8f0; text-align: left; font-size: 9.5px; font-weight: bold; }
            .est-table td { border: 1px solid #64748b; padding: 2.5px 4px; font-size: 9.5px; }
            .est-table tfoot td { background: #f8fafc; font-weight: bold; font-size: 9.5px; }
            .html-page-break { page-break-after: always; }
        `;
    sheetsHtml = ests
      .map((e, i) => {
        let html = buildEstimatePrintHTML(e, true);
        if ((i + 1) % 2 === 0 && i !== ests.length - 1) {
          html += '<div class="html-page-break"></div>';
        }
        return html;
      })
      .join("");
  } else {
    // Standard High-Quality Printable Document Mode
    sheetsHtml = ests.map((e) => buildEstimatePrintHTML(e, false)).join("");
    let pSize = "A4";
    let pOri = "portrait";
    if (settings) {
      pSize = settings.pageSize === "Custom" ? "A4" : settings.pageSize;
      pOri = settings.orientation;
    }
    customCSS = `
            @page { size: ${pSize} ${pOri}; margin: 8mm 10mm; }
            body { margin: 0; padding: 0; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .est-sheet { 
                width: 100%; 
                margin: 0 auto 8mm auto; 
                padding: 12px 14px; 
                border: 1.5px solid #0f172a; 
                border-radius: 6px; 
                background: #fff; 
                box-sizing: border-box; 
                page-break-inside: avoid !important; 
                break-inside: avoid !important; 
            }
            .est-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 4px; }
            .est-table th { border: 1px solid #94a3b8; padding: 5px 8px; background: #f1f5f9; text-align: left; font-size: 10.5px; font-weight: bold; color: #0f172a; }
            .est-table td { border: 1px solid #cbd5e1; padding: 5px 8px; font-size: 11px; color: #1e293b; }
            .est-table tfoot td { background: #f8fafc; font-weight: bold; font-size: 11px; border: 1px solid #94a3b8; }
            .html-page-break { page-break-after: always; }
        `;
  }

  const win = window.open("", "_blank");
  win.document.write(`<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NCW Estimate Print</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+Sinhala:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { 
      font-family: 'Inter', 'Noto Sans Sinhala', 'Segoe UI', Arial, sans-serif; 
      color: #0f172a; 
      background: #fff; 
      line-height: 1.35;
  }
  .est-sheet { 
      width: 100%; 
      margin: 0 auto 8mm auto; 
      padding: 12px 14px; 
      border: 1.5px solid #0f172a; 
      border-radius: 6px; 
      background: #fff; 
      box-sizing: border-box; 
      page-break-inside: avoid !important; 
      break-inside: avoid !important; 
  }
  .est-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 4px; }
  .est-table th { border: 1px solid #94a3b8; padding: 5px 8px; background: #f1f5f9; text-align: left; font-size: 10.5px; font-weight: bold; color: #0f172a; }
  .est-table td { border: 1px solid #cbd5e1; padding: 5px 8px; font-size: 11px; color: #1e293b; }
  .est-table tfoot td { background: #f8fafc; font-weight: bold; font-size: 11px; border: 1px solid #94a3b8; }
  @media print {
      ${customCSS}
  }
</style></head>
<body>${sheetsHtml}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 500);
}

function exportEstimatesToPDFByIds(ids) {
  if (!ids || ids.length === 0) {
    showToast("No estimate selected to export", "error");
    return;
  }
  const idSet = new Set(ids.map((id) => String(id)));
  const ests = (store.estimates || []).filter((e) =>
    e && (idSet.has(String(e.id)) || idSet.has(String(e._fbKey)) || idSet.has(String(e.estimate_number)))
  );
  if (ests.length === 0) {
    showToast("Estimate details not found to export", "error");
    return;
  }
  if (typeof html2pdf === "undefined") {
    showToast(
      "PDF library is loading, please try again in a few seconds.",
      "error",
    );
    return;
  }
  showToast("Generating PDF, please wait...", "info");
  const tempDiv = document.createElement("div");
  tempDiv.style.position = "absolute";
  tempDiv.style.top = "0";
  tempDiv.style.left = "0";
  tempDiv.style.zIndex = "99999";
  tempDiv.style.width = "794px";
  tempDiv.style.fontFamily = "'Inter', 'Noto Sans Sinhala', 'Segoe UI', Arial, sans-serif";
  tempDiv.style.color = "#0f172a";
  tempDiv.style.backgroundColor = "#fff";
  tempDiv.style.minHeight = "100vh";
  tempDiv.innerHTML = ests.map((e) => buildEstimatePrintHTML(e, false)).join("");
  const style = document.createElement("style");
  style.innerHTML = `
        .est-sheet { 
            width: 100%; 
            margin: 0 0 8mm 0; 
            padding: 12px 14px; 
            border: 1.5px solid #0f172a; 
            border-radius: 6px; 
            background: #fff; 
            box-sizing: border-box; 
            page-break-inside: avoid !important; 
            break-inside: avoid !important; 
        }
        .est-table { width: 100%; border-collapse: collapse; font-size: 11px; table-layout: auto; margin-top: 4px; }
        .est-table th { border: 1px solid #94a3b8; padding: 5px 8px; background: #f1f5f9; text-align: left; font-size: 10.5px; font-weight: bold; color: #0f172a; }
        .est-table td { border: 1px solid #cbd5e1; padding: 5px 8px; word-wrap: break-word; font-size: 11px; color: #1e293b; }
        .est-table tfoot td { background: #f8fafc; font-weight: bold; font-size: 11px; border: 1px solid #94a3b8; }
    `;
  tempDiv.appendChild(style);
  document.body.appendChild(tempDiv);
  window.scrollTo(0, 0);
  const filename =
    ests.length === 1
      ? `Estimate_${ests[0].estimate_number.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`
      : `Estimates_Bulk_Export.pdf`;
  const opt = {
    margin: [8, 10, 8, 10],
    filename: filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: 794,
      width: 794,
    },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };
  html2pdf()
    .set(opt)
    .from(tempDiv)
    .save()
    .then(() => {
      document.body.removeChild(tempDiv);
      showToast("PDF exported successfully", "success");
    })
    .catch((err) => {
      console.error("PDF Export Error:", err);
      if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
      showToast("PDF export failed, please try again", "error");
    });
}
function printEstimate() {
  if (!store.selectedEstimate) {
    showToast("Select an estimate first", "error");
    return;
  }
  printEstimatesByIds([store.selectedEstimate]);
}
function exportEstimatePDF() {
  if (!store.selectedEstimate) {
    showToast("Select an estimate first", "error");
    return;
  }
  exportEstimatesToPDFByIds([store.selectedEstimate]);
}
function openBulkPrintSettings() {
  if (!store.selectedEstimatesForPrint || store.selectedEstimatesForPrint.length === 0) {
    if (store.selectedEstimate) {
      store.selectedEstimatesForPrint = [store.selectedEstimate];
      const countEl = document.getElementById("bulkPrintCount");
      if (countEl) countEl.textContent = store.selectedEstimatesForPrint.length;
    } else {
      showToast("Please tick the estimates you want to print from the list checkboxes first", "info");
      return;
    }
  }
  const bpsPageSize = document.getElementById("bpsPageSize");
  if (bpsPageSize) bpsPageSize.value = "A4";
  const bpsOrientation = document.getElementById("bpsOrientation");
  if (bpsOrientation) bpsOrientation.value = "landscape";
  const bpsTiled = document.getElementById("bpsTiled");
  if (bpsTiled) bpsTiled.checked = false;
  const modal = document.getElementById("bulkPrintSettingsModal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.style.setProperty("display", "flex", "important");
    modal.style.setProperty("visibility", "visible", "important");
    modal.style.setProperty("opacity", "1", "important");
    modal.style.setProperty("z-index", "99999", "important");
  }
}
function toggleTiledPrintOption() {
  const orientation = document.getElementById("bpsOrientation")?.value || "landscape";
  const tiledContainer = document.getElementById("tiledOptionContainer");
  if (!tiledContainer) return;
  if (
    orientation === "landscape" &&
    store.selectedEstimatesForPrint &&
    store.selectedEstimatesForPrint.length >= 2
  ) {
    tiledContainer.classList.remove("hidden");
  } else {
    tiledContainer.classList.add("hidden");
    const bpsTiled = document.getElementById("bpsTiled");
    if (bpsTiled) bpsTiled.checked = false;
  }
}
function executeBulkPrint() {
  closeModal("bulkPrintSettingsModal");
  const pageSize = document.getElementById("bpsPageSize")?.value || "A4";
  const orientation = document.getElementById("bpsOrientation")?.value || "landscape";
  const isTiled = document.getElementById("bpsTiled")?.checked || false;
  printEstimatesByIds([...(store.selectedEstimatesForPrint || [])], {
    pageSize,
    orientation,
    isTiled,
  });
}
function bulkExportEstimatesPDF() {
  if (!store.selectedEstimatesForPrint || store.selectedEstimatesForPrint.length === 0) {
    if (store.selectedEstimate) {
      exportEstimatesToPDFByIds([store.selectedEstimate]);
      return;
    }
    showToast("Please tick the estimates you want to export from the list checkboxes first", "info");
    return;
  }
  exportEstimatesToPDFByIds([...(store.selectedEstimatesForPrint || [])]);
}

// Resilient Event Listener for New Estimate Buttons
function initEstimateButtonBindings() {
  const newEstBtn = document.getElementById("newEstimateBtn");
  if (newEstBtn) {
    newEstBtn.onclick = (e) => {
      e.preventDefault();
      openNewEstimateModal();
    };
  }
  const bulkPrintBtn = document.getElementById("bulkPrintBtn");
  if (bulkPrintBtn) {
    bulkPrintBtn.onclick = (e) => {
      e.preventDefault();
      openBulkPrintSettings();
    };
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initEstimateButtonBindings);
} else {
  initEstimateButtonBindings();
}

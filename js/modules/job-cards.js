// ============================================================================
// CMSys Module: Job Cards, Work Orders, Labor, Material Issuance & Merge Engine
// File: js/modules/job-cards.js
// ============================================================================

// =============================================
// JOB CARDS
// =============================================
function renderJobCardsView() {
  renderIncomingJobMinutesInJobCards();
  renderJobCardsList();
}
function switchJobCardsTab(tab) {
  store.currentJobCardsTab = tab;
  document.querySelectorAll(".jc-main-tab").forEach((t) => {
    t.classList.remove("border-green-600", "text-green-600", "bg-green-50", "border-b-2");
    t.classList.add("text-slate-500");
    if (t.getAttribute("onclick") && t.getAttribute("onclick").includes(tab)) {
      t.classList.remove("text-slate-500");
      t.classList.add("border-green-600", "text-green-600", "bg-green-50", "border-b-2");
    }
  });
  renderJobCardsList();
}
function renderJobCardsList() {
  const container = document.getElementById("jobCardsList");
  let jobCards = [];
  let title = "Active Job Cards";
  switch (store.currentJobCardsTab) {
    case "active":
      jobCards = store.jobCards.filter(
        (jc) =>
          (jc.status === "Active" || jc.status === "Hold") &&
          jc.zone_id === store.currentZone,
      );
      title = "Active & Held Job Cards";
      break;
    case "completed":
      jobCards = store.jobCards.filter(
        (jc) =>
          jc.status === "Completed" &&
          !jc.feedbackReceived &&
          jc.zone_id === store.currentZone,
      );
      title = "Recently Completed (Awaiting Feedback)";
      break;
    case "records":
      jobCards = store.jobCards.filter(
        (jc) =>
          jc.status === "Completed" &&
          jc.feedbackReceived &&
          jc.zone_id === store.currentZone,
      );
      title = "Completed Records (With Feedback)";
      break;
  }
  document.getElementById("jobCardsListTitle").textContent = title;
  container.innerHTML =
    jobCards
      .map((jc) => {
        var _jc$feedback;
        const jcKey = jc._fbKey || jc.id;
        const isChecked = store.selectedJobCardsForMerge.has(String(jcKey));
        const checkHtml = store.isJobCardMergeMode
          ? `<div class="mr-3 flex items-center" onclick="event.stopPropagation(); toggleSelectJobCardForMerge('${jcKey}')">
               <input type="checkbox" ${isChecked ? "checked" : ""} class="w-4 h-4 text-indigo-600 rounded cursor-pointer pointer-events-none">
             </div>`
          : "";
        const clickHandler = store.isJobCardMergeMode
          ? `toggleSelectJobCardForMerge('${jcKey}')`
          : `selectJobCard('${jcKey}')`;
        const selectedCls = store.isJobCardMergeMode
          ? isChecked ? "bg-indigo-50/80 border-l-4 border-indigo-600" : ""
          : String(store.selectedJobCard) === String(jc.id) ? "bg-blue-50 border-l-4 border-blue-500" : "";

        return `
        <div class="p-4 hover:bg-slate-50 cursor-pointer ${selectedCls} flex items-start"
            onclick="${clickHandler}">
            ${checkHtml}
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-1">
                  <span class="font-mono text-sm font-medium text-blue-600">${jc.job_number}</span>
                  <div class="flex items-center gap-1">
                    ${jc.origin_workshop_zone ? `<span class="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded font-semibold border border-teal-200" title="Created by Workshop">🔨 ${jc.origin_workshop_zone}</span>` : ""}
                    <span class="text-xs px-2 py-0.5 rounded ${jc.status === "Active" ? "bg-green-100 text-green-700" : jc.status === "Merged" ? "bg-purple-100 text-purple-700 font-bold" : "bg-slate-100 text-slate-600"}">${jc.status}</span>
                  </div>
              </div>
              <p class="text-sm text-slate-700 truncate">${jc.description}</p>
              ${jc.merged_into_job_number ? `<p class="text-[11px] text-purple-600 font-semibold">🔀 Merged into ${jc.merged_into_job_number}</p>` : ""}
              <div class="flex justify-between mt-2 text-xs text-slate-500">
                  <span>📍 ${jc.location}</span>
                  <span class="font-medium text-amber-600">${formatCurrency(jc.total_material_cost)}</span>
              </div>
            ${
              jc.estimate_id
                ? (() => {
                    const est = store.estimates.find(
                      (e) => String(e.id) === String(jc.estimate_id),
                    );
                    return est
                      ? `
                <div class="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span class="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 font-semibold">📄 Estimate: ${est.estimate_number}</span>
                    <span class="text-[10px] text-slate-500 font-semibold">Est: ${formatCurrency(est.total_cost)}</span>
                </div>`
                      : "";
                  })()
                : ""
            }
            ${
              jc.status === "Completed" && !jc.feedbackReceived
                ? `
                <div class="mt-2 pt-2 border-t border-slate-100">
                    <span class="text-xs ${jc.feedbackSent ? "text-amber-600" : "text-slate-400"}">
                        ${jc.feedbackSent ? "📤 Feedback link sent" : "📋 Feedback pending"}
                    </span>
                </div>
            `
                : ""
            }
            ${
              jc.feedbackReceived
                ? `
                <div class="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2">
                    <span class="text-xs text-green-600">✓ Feedback received</span>
                    <span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">${((_jc$feedback = jc.feedback) === null || _jc$feedback === void 0 || (_jc$feedback = _jc$feedback.overall) === null || _jc$feedback === void 0 ? void 0 : _jc$feedback.toFixed(1)) || "-"}/5</span>
                </div>
            `
                : ""
            }
            </div>
        </div>
    `;
      })
      .join("") ||
    '<p class="text-slate-500 text-center py-8">No job cards in this category</p>';
}
function selectJobCard(id) {
  store.selectedJobCard = id;
  const jc = store.jobCards.find(
    (j) => String(j.id) === String(id) || String(j._fbKey) === String(id),
  );
  if (!jc) return;
  document.getElementById("selectedJobNumber").textContent = jc.job_number;
  document.getElementById("selectedJobDesc").textContent = jc.description;
  const estContainer = document.getElementById("selectedJobEstimateContainer");
  const estNoEl = document.getElementById("selectedJobEstimateNo");
  if (estContainer && estNoEl) {
    if (jc.estimate_id) {
      const est = store.estimates.find(
        (e) => String(e.id) === String(jc.estimate_id),
      );
      if (est) {
        estNoEl.textContent = `${est.estimate_number} - ${est.description} (${formatCurrency(est.total_cost)})`;
        estContainer.classList.remove("hidden");
      } else {
        estContainer.classList.add("hidden");
      }
    } else {
      estContainer.classList.add("hidden");
    }
  } // Calculate total material cost
  const materials = store.jobCardMaterials.filter(
    (m) => String(m.job_card_id) === String(id),
  );
  const totalCost = materials.reduce((sum, m) => sum + (parseFloat(m.total_cost) || 0), 0);
  document.getElementById("totalMaterialCost").textContent =
    formatCurrency(totalCost); // Show/hide action buttons based on status
  document.getElementById("addMaterialBtn").style.display =
    jc.status === "Active" ? "block" : "none";
  document.getElementById("deleteJobCardBtn").style.display =
    jc.status === "Active" ? "block" : "none";
  const btnEdit = document.getElementById("btnEditJobCard");
  if (btnEdit) {
    btnEdit.style.display = "inline-flex";
  }
  const btnPrint = document.getElementById("btnPrintJobCard");
  if (btnPrint) {
    btnPrint.style.display = "inline-flex";
  }
  // Show feedback tab for completed jobs
  document.getElementById("feedbackTabBtn").style.display =
    jc.status === "Completed" ? "block" : "none";
  renderJobCardMaterials(id);
  renderJobCardLabor(id);
  renderJobCardSummary(id);
  renderJobCardFeedback(id);
  renderJobCardsList(); // Switch to materials tab
  switchJobCardTab("materials");
}

window._editJcLaborList = [];

function filterEditJcSailorSearch() {
  const query =
    (document.getElementById("editJcSailorSearch") || {}).value || "";
  renderEditJcAvailableSailors(query);
}

function renderEditJcAvailableSailors(filter = "") {
  const container = document.getElementById("editJcAvailableSailorsChips");
  if (!container) return;
  const q = filter.toLowerCase().trim();

  const jcId = document.getElementById("editJcId")?.value;
  const jc = (store.jobCards || []).find(
    (j) => String(j.id) === String(jcId) || String(j._fbKey) === String(jcId),
  );
  const wo = jc
    ? (store.workOrders || []).find(
        (w) =>
          String(w._fbKey) === String(jc.work_order_id) ||
          String(w.id) === String(jc.work_order_id),
      )
    : null;
  const woAssignedIds = new Set((wo?.assigned || []).map(String));

  const existingSailorIds = new Set(
    _editJcLaborList.map((l) => String(l.sailor_id)),
  );

  let list = (store.sailors || []).filter((s) => {
    const sid = String(s.id || s._fbKey);
    const off = String(s.official_number || "");
    if (existingSailorIds.has(sid) || (off && existingSailorIds.has(off)))
      return false;
    if (!q) return true;
    return (
      (s._searchIndex || "").includes(q) ||
      (s.name || "").toLowerCase().includes(q) ||
      (s.official_number || "").toLowerCase().includes(q) ||
      (s.rank || "").toLowerCase().includes(q) ||
      (s.trade || "").toLowerCase().includes(q)
    );
  });

  list.sort((a, b) => {
    const aInWo =
      woAssignedIds.has(String(a.id)) || woAssignedIds.has(String(a._fbKey));
    const bInWo =
      woAssignedIds.has(String(b.id)) || woAssignedIds.has(String(b._fbKey));
    if (aInWo !== bInWo) return aInWo ? -1 : 1;
    return (a.name || "").localeCompare(b.name || "");
  });

  const visible = list.slice(0, 25);
  if (visible.length === 0) {
    container.innerHTML = `<span class="text-xs text-slate-400 py-1 px-2">No matching sailors found</span>`;
    return;
  }

  container.innerHTML = visible
    .map((s) => {
      const off = s.official_number || s.officialNumber || "-";
      const sId = s.id || s._fbKey;
      const isWoCrew =
        woAssignedIds.has(String(s.id)) || woAssignedIds.has(String(s._fbKey));
      return `
      <button type="button" onclick="addSailorToEditJc('${sId}')" class="text-xs px-2 py-1 rounded-lg border ${isWoCrew ? "border-blue-400 bg-blue-50 hover:bg-blue-100 text-blue-800 font-medium" : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"} flex items-center gap-1 transition-all">
        <span class="font-bold text-[10px] px-1 py-0.2 bg-slate-200 text-slate-700 rounded">${s.trade || "MA"}</span>
        <span>${s.rank || ""} ${s.name} (${off})</span>
        <span class="text-emerald-600 font-bold">+</span>
      </button>
    `;
    })
    .join("");
}

function addSailorToEditJc(sailorId) {
  const s = (store.sailors || []).find(
    (x) =>
      String(x.id) === String(sailorId) || String(x._fbKey) === String(sailorId),
  );
  if (!s) return;
  const hours =
    parseFloat((document.getElementById("editJcSailorHours") || {}).value) || 8;
  const workDate =
    (document.getElementById("editJcStartDate") || {}).value ||
    (typeof getLocalDateString === "function"
      ? getLocalDateString()
      : new Date().toISOString().split("T")[0]);
  const jcId = document.getElementById("editJcId")?.value;

  _editJcLaborList.push({
    job_card_id: jcId,
    sailor_id: s.id || s._fbKey,
    sailor_name: `${s.rank || ""} ${s.name}`.trim(),
    trade: s.trade || "MA",
    work_date: workDate,
    hours: hours,
    role: "Worker",
    performance:
      typeof s.avgScore === "number"
        ? s.avgScore
        : typeof s.performance_score === "number"
          ? s.performance_score
          : 7.0,
    isNew: true,
  });

  renderEditJcCurrentSailors();
  renderEditJcAvailableSailors(
    (document.getElementById("editJcSailorSearch") || {}).value || "",
  );
}

function removeSailorFromEditJc(index) {
  const item = _editJcLaborList[index];
  if (item && item._fbKey) {
    if (!window._deletedJcLaborKeys) window._deletedJcLaborKeys = [];
    window._deletedJcLaborKeys.push(item._fbKey);
  }
  _editJcLaborList.splice(index, 1);
  renderEditJcCurrentSailors();
  renderEditJcAvailableSailors(
    (document.getElementById("editJcSailorSearch") || {}).value || "",
  );
}

function updateEditJcLaborField(index, field, value) {
  if (_editJcLaborList[index]) {
    _editJcLaborList[index][field] = value;
  }
}

function renderEditJcCurrentSailors() {
  const container = document.getElementById("editJcCurrentSailorsList");
  const countBadge = document.getElementById("editJcSailorCountBadge");
  if (countBadge) {
    countBadge.textContent = `(${_editJcLaborList.length} sailor${_editJcLaborList.length === 1 ? "" : "s"})`;
  }
  if (!container) return;

  if (_editJcLaborList.length === 0) {
    container.innerHTML = `<span class="text-xs text-slate-400 italic py-2 block text-center">No sailors assigned to this Job Card yet</span>`;
    return;
  }

  container.innerHTML = _editJcLaborList
    .map((l, idx) => {
      const sailor = (store.sailors || []).find(
        (s) =>
          String(s.id) === String(l.sailor_id) ||
          String(s._fbKey) === String(l.sailor_id) ||
          String(s.official_number) === String(l.sailor_id),
      );
      const off = sailor
        ? sailor.official_number || sailor.officialNumber || "-"
        : "-";
      const name = sailor
        ? `${sailor.rank || ""} ${sailor.name}`.trim()
        : l.sailor_name || "Unknown";
      const trade = sailor ? sailor.trade || "-" : l.trade || "-";

      return `
      <div class="flex items-center justify-between gap-2 py-1.5 px-2 bg-slate-50 rounded-lg border border-slate-200">
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <span class="font-bold text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">${trade}</span>
          <div class="truncate">
            <span class="font-semibold text-xs text-slate-800">${name}</span>
            <span class="text-[11px] text-slate-500 font-mono">(${off})</span>
          </div>
        </div>
        <div class="flex items-center gap-1.5">
          <input type="text" value="${l.role || "Worker"}" onchange="updateEditJcLaborField(${idx}, 'role', this.value)" placeholder="Role" class="w-20 text-xs px-2 py-1 border border-slate-300 rounded bg-white" title="Role / Duty">
          <div class="flex items-center gap-0.5">
            <input type="number" value="${l.hours || 8}" min="1" max="24" onchange="updateEditJcLaborField(${idx}, 'hours', parseFloat(this.value) || 8)" class="w-12 text-xs px-1.5 py-1 border border-slate-300 rounded bg-white text-center font-bold" title="Hours">
            <span class="text-xs text-slate-500">h</span>
          </div>
          <button type="button" onclick="removeSailorFromEditJc(${idx})" class="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors" title="Remove Sailor">🗑️</button>
        </div>
      </div>
    `;
    })
    .join("");
}

function openEditJobCardModal(id) {
  const targetId = id || store.selectedJobCard;
  if (!targetId) return;
  const jc = store.jobCards.find(
    (j) =>
      String(j.id) === String(targetId) ||
      String(j._fbKey) === String(targetId),
  );
  if (!jc) {
    showToast("Job Card not found", "error");
    return;
  }

  window._deletedJcLaborKeys = [];
  document.getElementById("editJcId").value = jc.id || jc._fbKey;
  document.getElementById("editJcNumber").value =
    jc.job_number || jc.job_card_no || "";
  document.getElementById("editJcStatus").value = jc.status || "Active";
  document.getElementById("editJcDescription").value =
    jc.description || jc.title || "";
  document.getElementById("editJcStartDate").value =
    jc.start_date || jc.commenced_date || "";
  document.getElementById("editJcEndDate").value =
    jc.end_date ||
    (jc.completed_at
      ? new Date(jc.completed_at).toISOString().split("T")[0]
      : "");
  document.getElementById("editJcApprovedBy").value =
    jc.approved_by || "CCED (E)";
  document.getElementById("editJcTakenBy").value = jc.taken_by || "";

  // Load existing labor for this JC
  const jcId = jc.id || jc._fbKey;
  const existingLabor = (store.jobCardLabor || []).filter(
    (l) =>
      String(l.job_card_id) === String(jcId) ||
      String(l.job_card_id) === String(jc.id) ||
      String(l.job_card_id) === String(jc._fbKey),
  );
  _editJcLaborList = JSON.parse(JSON.stringify(existingLabor));

  const includeSailorsCheckbox = document.getElementById("editJcIncludeSailors");
  if (includeSailorsCheckbox) {
    includeSailorsCheckbox.checked =
      jc.include_sailors === true ||
      jc.include_sailors === "true" ||
      (jc.include_sailors !== false && existingLabor.length > 0);
  }

  const searchInput = document.getElementById("editJcSailorSearch");
  if (searchInput) searchInput.value = "";
  const hoursInput = document.getElementById("editJcSailorHours");
  if (hoursInput) hoursInput.value = 8;

  renderEditJcCurrentSailors();
  renderEditJcAvailableSailors();

  // Officer Material Clearance & LMD logic
  const isOfficer = isOfficerLoggedIn();
  const clBadge = document.getElementById("editJcOfficerStatusBadge");
  const fwdBtn = document.getElementById("btnJcForwardToOfficer");
  const authBtn = document.getElementById("btnJcOfficerAuthorizeLmd");
  const auditText = document.getElementById("editJcOfficerAuditText");

  const clStatus = jc.officer_clearance_status || "Draft";
  if (clBadge) {
    if (clStatus === "Pending Clearance") {
      clBadge.textContent = "⏳ Pending Officer Clearance";
      clBadge.className =
        "text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 animate-pulse";
    } else if (clStatus === "Cleared") {
      clBadge.textContent = `✅ Cleared (${jc.officer_cleared_by || "Officer"})`;
      clBadge.className =
        "text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300";
    } else {
      clBadge.textContent = "In-Charge Draft / Pending Review";
      clBadge.className =
        "text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300";
    }
  }

  if (fwdBtn) fwdBtn.classList.toggle("hidden", isOfficer && clStatus === "Cleared");
  if (authBtn) authBtn.classList.toggle("hidden", !isOfficer);

  if (auditText) {
    if (jc.officer_cleared_by) {
      auditText.textContent = `Material clearance authorized by ${jc.officer_cleared_by} on ${new Date(
        jc.officer_cleared_at || Date.now(),
      ).toLocaleDateString()}`;
      auditText.classList.remove("hidden");
    } else {
      auditText.classList.add("hidden");
    }
  }

  document.getElementById("editJobCardModal").classList.remove("hidden");
}

function saveEditedJobCard(event) {
  event.preventDefault();
  const jcId = document.getElementById("editJcId").value;
  const jc = store.jobCards.find(
    (j) =>
      String(j.id) === String(jcId) ||
      String(j._fbKey) === String(jcId),
  );
  if (!jc) {
    showToast("Job Card not found", "error");
    return;
  }

  jc.job_number = document.getElementById("editJcNumber").value.trim();
  jc.job_card_no = jc.job_number;
  jc.status = document.getElementById("editJcStatus").value;
  jc.description = document.getElementById("editJcDescription").value.trim();
  jc.title = jc.description;
  jc.start_date = document.getElementById("editJcStartDate").value;
  jc.commenced_date = jc.start_date;
  jc.end_date = document.getElementById("editJcEndDate").value;
  if (jc.status === "Completed" && !jc.completed_at) {
    jc.completed_at = Date.now();
  }
  jc.approved_by = document.getElementById("editJcApprovedBy").value.trim();
  jc.taken_by = document.getElementById("editJcTakenBy").value.trim();
  jc.include_sailors = (document.getElementById("editJcIncludeSailors") || {}).checked;

  // Save Job Card
  fbSaveJobCard(jc);

  // Remove deleted labor keys from Firebase & local store
  if (window._deletedJcLaborKeys && window._deletedJcLaborKeys.length > 0) {
    window._deletedJcLaborKeys.forEach((k) => {
      opsDB.ref(`job_card_labor/${k}`).remove();
      store.jobCardLabor = (store.jobCardLabor || []).filter(
        (l) => String(l._fbKey) !== String(k),
      );
    });
    window._deletedJcLaborKeys = [];
  }

  // Save updated/new labor entries
  _editJcLaborList.forEach((l) => {
    if (l._fbKey) {
      // Update existing in Firebase & store
      const updatedFields = {
        role: l.role || "Worker",
        hours: l.hours || 8,
        work_date:
          l.work_date ||
          jc.start_date ||
          (typeof getLocalDateString === "function"
            ? getLocalDateString()
            : new Date().toISOString().split("T")[0]),
      };
      opsDB.ref(`job_card_labor/${l._fbKey}`).update(updatedFields);
      const storeItem = (store.jobCardLabor || []).find(
        (x) => String(x._fbKey) === String(l._fbKey),
      );
      if (storeItem) {
        Object.assign(storeItem, updatedFields);
      }
    } else {
      // Create new
      const entry = {
        job_card_id: jcId,
        sailor_id: l.sailor_id,
        sailor_name: l.sailor_name,
        work_date:
          l.work_date ||
          jc.start_date ||
          (typeof getLocalDateString === "function"
            ? getLocalDateString()
            : new Date().toISOString().split("T")[0]),
        hours: l.hours || 8,
        role: l.role || "Worker",
        performance: l.performance || 7.0,
        logged_by: store.currentUser?.name || "Officer",
      };
      if (!store.jobCardLabor) store.jobCardLabor = [];
      store.jobCardLabor.push(entry);
      fbSaveJobCardLabor(entry);
    }
  });

  closeModal("editJobCardModal");
  selectJobCard(jcId);
  renderJobCardLabor(jcId);
  renderJobCardsView();
  showToast("Job Card and Sailors details updated successfully!");
}

function deleteSingleJobCardLabor(laborId) {
  if (!laborId) return;
  if (!confirm("Are you sure you want to remove this sailor from this Job Card?")) return;
  const entry = (store.jobCardLabor || []).find(
    (l) => String(l.id) === String(laborId) || String(l._fbKey) === String(laborId)
  );
  const targetKey = entry && entry._fbKey ? entry._fbKey : laborId;
  opsDB
    .ref(`job_card_labor/${targetKey}`)
    .remove()
    .then(() => {
      store.jobCardLabor = (store.jobCardLabor || []).filter(
        (l) => String(l.id) !== String(laborId) && String(l._fbKey) !== String(laborId)
      );
      if (store.selectedJobCard) {
        renderJobCardLabor(store.selectedJobCard);
      }
      showToast("Sailor record removed.");
    })
    .catch((err) => {
      console.error("Error deleting labor log:", err);
      showToast("Failed to remove sailor record.");
    });
}

function returnJobCardMaterialToInventory(mat, jcNumber = "") {
  if (!mat) return null;
  const qtyToReturn = parseFloat(mat.quantity) || 0;
  if (qtyToReturn <= 0) return null;

  const matName = (mat.material_name || mat.description || "").trim();
  const stdName = typeof standardizeInventoryDescription === "function"
    ? standardizeInventoryDescription(matName)
    : matName;

  // 1. Try finding inventory item by direct ID
  let invItem = null;
  if (mat.inventory_id && store.inventory) {
    invItem = store.inventory.find(
      (i) =>
        String(i.id) === String(mat.inventory_id) ||
        String(i._fbKey) === String(mat.inventory_id),
    );
  }

  // 2. If not found by ID, match by standardized description
  if (!invItem && matName && store.inventory) {
    invItem = store.inventory.find(
      (i) => (i.description || "").trim().toLowerCase() === stdName.toLowerCase(),
    );
  }

  // 3. Fallback: match by raw description
  if (!invItem && matName && store.inventory) {
    invItem = store.inventory.find(
      (i) => (i.description || "").trim().toLowerCase() === matName.toLowerCase(),
    );
  }

  if (invItem) {
    const prevQty = parseFloat(invItem.quantity) || 0;
    const newQty = prevQty + qtyToReturn;
    invItem.quantity = Math.round(newQty * 1000) / 1000;

    const onChargeRecord = {
      date: getLocalDateString(),
      quantity: qtyToReturn,
      source: jcNumber
        ? `Returned from deleted Job Card ${jcNumber}`
        : "Returned from Job Card material deletion",
      return_date: getLocalDateString(),
      timestamp: Date.now(),
    };

    if (!invItem.on_charge_records) invItem.on_charge_records = [];
    if (Array.isArray(invItem.on_charge_records)) {
      invItem.on_charge_records.push(onChargeRecord);
    }

    fbSaveInventoryItem(invItem);
    console.log(
      `📦 Returned ${qtyToReturn} ${invItem.deno || "units"} of "${invItem.description}" back to inventory. New balance: ${invItem.quantity}`,
    );
    return {
      name: invItem.description,
      qty: qtyToReturn,
      unit: invItem.deno || mat.unit || "",
    };
  }

  return null;
}

function deleteJobCardMaterial(materialId) {
  if (!materialId) return;
  if (!confirm("Are you sure you want to remove this material entry?\n\nThe material quantity will be re-allocated back to the Inventory.")) return;
  const mat = store.jobCardMaterials.find(
    (m) =>
      String(m.id) === String(materialId) ||
      String(m._fbKey) === String(materialId),
  );
  const targetKey = mat && mat._fbKey ? mat._fbKey : materialId;

  // Re-allocate material back to inventory
  const ret = returnJobCardMaterialToInventory(mat);

  opsDB
    .ref(`job_card_materials/${targetKey}`)
    .remove()
    .then(() => {
      store.jobCardMaterials = store.jobCardMaterials.filter(
        (m) =>
          String(m.id) !== String(materialId) &&
          String(m._fbKey) !== String(materialId),
      );
      if (store.selectedJobCard) {
        selectJobCard(store.selectedJobCard);
      }
      const retMsg = ret
        ? ` (Returned ${ret.qty} ${ret.unit} of "${ret.name}" to Inventory)`
        : "";
      showToast(`Material entry removed${retMsg}.`);
    })
    .catch((err) => {
      console.error("Error deleting material:", err);
      showToast("Failed to remove material.");
    });
}

function deleteJobCard() {
  const jcId = store.selectedJobCard;
  if (!jcId) return;
  const jc = store.jobCards.find(
    (j) => String(j.id) === String(jcId) || String(j._fbKey) === String(jcId),
  );
  if (!jc) return;
  if (
    confirm(
      `⚠️ Are you sure you want to delete Job Card "${jc.job_number}" (${jc.description})?\n\nAny materials on-charge will be automatically re-allocated back to the Inventory. This action cannot be undone.`,
    )
  ) {
    const targetFbKey = jc._fbKey;
    if (!targetFbKey) {
      showToast("Cannot delete: Firebase key not found.");
      return;
    } // 1. Delete Job Card from Firebase
    opsDB
      .ref(`job_cards/${targetFbKey}`)
      .remove()
      .then(() => {
        // 2. Delete linked materials logs and return quantities to inventory
        const linkedMaterials = store.jobCardMaterials.filter(
          (m) =>
            String(m.job_card_id) === String(jcId) ||
            String(m.work_order_id) === String(jc.work_order_id) ||
            (jc.job_number && String(m.job_number) === String(jc.job_number)),
        );
        let returnedCount = 0;
        linkedMaterials.forEach((m) => {
          const ret = returnJobCardMaterialToInventory(m, jc.job_number);
          if (ret) returnedCount++;
          if (m._fbKey) {
            opsDB.ref(`job_card_materials/${m._fbKey}`).remove();
          }
        }); // 3. Delete linked labor logs
        const linkedLabor = store.jobCardLabor.filter(
          (l) =>
            String(l.job_card_id) === String(jcId) ||
            String(l.work_order_id) === String(jc.work_order_id),
        );
        linkedLabor.forEach((l) => {
          if (l._fbKey) {
            opsDB.ref(`job_card_labor/${l._fbKey}`).remove();
          }
        });
        store.selectedJobCard = null;
        renderJobCardsView();
        const retMsg = returnedCount > 0
          ? ` and ${returnedCount} material item(s) re-allocated to Inventory`
          : "";
        showToast(`Job Card "${jc.job_number}" deleted${retMsg}.`);
      })
      .catch((err) => {
        console.error("Error deleting Job Card:", err);
        showToast("Failed to delete Job Card.");
      });
  }
}
function renderJobCardMaterials(jobCardId) {
  const materials = store.jobCardMaterials.filter(
    (m) => String(m.job_card_id) === String(jobCardId),
  );
  const container = document.getElementById("jobCardMaterials");
  const total = materials.reduce(
    (sum, m) => sum + (parseFloat(m.total_cost) || 0),
    0,
  );
  container.innerHTML =
    materials
      .map((m) => {
        const dateStr =
          typeof m.logged_at === "number"
            ? new Date(m.logged_at).toISOString().split("T")[0]
            : m.work_date || m.logged_at || "-";
        const mId = m.id || m._fbKey;
        return `
        <tr>
            <td class="px-3 py-2 text-slate-600 font-mono text-xs">${dateStr}</td>
            <td class="px-3 py-2 font-mono text-xs font-semibold text-slate-700">${m.demand_no || m.demandNo || "-"}</td>
            <td class="px-3 py-2 font-medium text-slate-800">${m.material_name}</td>
            <td class="px-3 py-2 text-center text-xs text-slate-600">${m.unit}</td>
            <td class="px-3 py-2 text-center font-bold">${m.quantity}</td>
            <td class="px-3 py-2 text-center text-xs font-mono text-slate-500">${m.sig_ref || m.sig || "-"}</td>
            <td class="px-3 py-2 text-right text-xs">${formatCurrency(m.cost_per_unit)}</td>
            <td class="px-3 py-2 text-right font-semibold text-green-700">${formatCurrency(m.total_cost)}</td>
            <td class="px-2 py-2 text-center whitespace-nowrap">
              <button onclick="deleteJobCardMaterial('${mId}')" class="text-red-500 hover:text-red-700 text-xs px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors" title="Delete Material">🗑️</button>
            </td>
        </tr>`;
      })
      .join("") ||
    '<tr><td colspan="9" class="px-4 py-8 text-center text-slate-500">No materials logged</td></tr>';
  document.getElementById("materialsTotalFooter").textContent =
    formatCurrency(total);
}
// ── Retrieve All Labor Deployments for a specific Job Card ──
function getAllJobCardLaborRecords(jobCardId) {
  const targetId = String(jobCardId || store.selectedJobCard || "");
  if (!targetId) return [];

  const jc = (store.jobCards || []).find(
    (j) =>
      String(j.id) === targetId ||
      String(j._fbKey) === targetId ||
      (j.job_number && String(j.job_number) === targetId),
  );

  const jcKeys = new Set();
  if (jc) {
    if (jc.id) jcKeys.add(String(jc.id));
    if (jc._fbKey) jcKeys.add(String(jc._fbKey));
    if (jc.job_number) jcKeys.add(String(jc.job_number));
    if (jc.work_order_id) jcKeys.add(String(jc.work_order_id));
  } else {
    jcKeys.add(targetId);
  }

  const wo = jc
    ? (store.workOrders || []).find(
        (w) =>
          String(w._fbKey) === String(jc.work_order_id) ||
          String(w.id) === String(jc.work_order_id) ||
          (w.job_number &&
            jc.job_number &&
            String(w.job_number) === String(jc.job_number)) ||
          (w.description &&
            jc.description &&
            w.description.trim().toLowerCase() ===
              jc.description.trim().toLowerCase()),
      )
    : null;

  if (wo) {
    if (wo.id) jcKeys.add(String(wo.id));
    if (wo._fbKey) jcKeys.add(String(wo._fbKey));
    if (wo.job_number) jcKeys.add(String(wo.job_number));
  }

  const records = [];
  const seenKey = new Set();

  // Helper to enrich a record
  function addEntry(
    sailorId,
    workDate,
    hours,
    role,
    performance,
    source,
    rawId,
    remarks,
  ) {
    const sid = String(sailorId || "").trim();
    if (!sid || sid === "undefined" || sid === "null") return;

    const sailor = findSailorById(sid);

    const sName = sailor
      ? `${sailor.rank || ""} ${sailor.name || ""}`.trim()
      : "Unknown";
    const sTrade = sailor ? sailor.trade || "-" : "-";
    const sOffNo = sailor
      ? sailor.official_number ||
        sailor.officialNumber ||
        sailor.off_no ||
        sailor.service_no ||
        "-"
      : sid;

    const dateStr =
      workDate ||
      (jc
        ? jc.start_date || jc.created_at || getLocalDateString()
        : getLocalDateString());
    const cleanDate =
      typeof dateStr === "string" && dateStr.includes("T")
        ? dateStr.split("T")[0]
        : String(dateStr);

    const numHours = parseFloat(hours) || 8;
    const cleanRole = role || "Worker";

    const dedupKey = `${cleanDate}_${sOffNo || sid}_${cleanRole}`;
    if (seenKey.has(dedupKey)) return;
    seenKey.add(dedupKey);

    const perfVal =
      typeof performance === "number"
        ? performance
        : sailor && typeof sailor.avgScore === "number"
          ? sailor.avgScore
          : sailor && typeof sailor.performance_score === "number"
            ? sailor.performance_score
            : null;

    records.push({
      id: rawId || dedupKey,
      _fbKey: rawId,
      sailor_id: sid,
      sailor_name: sName,
      official_number: sOffNo,
      trade: sTrade,
      work_date: cleanDate,
      hours: numHours,
      role: cleanRole,
      performance: perfVal,
      source: source || "Logged",
      remarks: remarks || "",
      isDeletable: source === "Logged" && !!rawId,
    });
  }

  // 1. Check store.jobCardLabor
  (store.jobCardLabor || []).forEach((l) => {
    if (
      jcKeys.has(String(l.job_card_id)) ||
      (l.work_order_id && jcKeys.has(String(l.work_order_id)))
    ) {
      addEntry(
        l.sailor_id,
        l.work_date || l.date,
        l.hours,
        l.role,
        l.performance,
        "Logged",
        l.id || l._fbKey,
        l.remarks,
      );
    }
  });

  // 2. Check embedded jc.labor if any
  if (jc && Array.isArray(jc.labor)) {
    jc.labor.forEach((l) => {
      addEntry(
        l.sailor_id || l.id,
        l.work_date || l.date || jc.start_date,
        l.hours,
        l.role,
        l.performance,
        "Logged",
        l.id,
        l.remarks,
      );
    });
  }

  // 3. Check store.dailyAllocations across all dates
  (store.dailyAllocations || []).forEach((alloc) => {
    const allocWoId = String(alloc.work_order_id || alloc.job_card_id || "");
    if (allocWoId && jcKeys.has(allocWoId)) {
      addEntry(
        alloc.sailor_id,
        alloc.date || alloc.allocation_date,
        alloc.hours || 8,
        alloc.role || "Worker",
        alloc.eval_score || alloc.rating,
        "Daily Allocation",
        null,
        alloc.remarks,
      );
    }
  });

  // 4. Fallback to active assignments on WO / JC
  const assignedList =
    wo && wo.assigned && wo.assigned.length > 0
      ? wo.assigned
      : jc && jc.assigned && jc.assigned.length > 0
        ? jc.assigned
        : [];

  if (records.length === 0 && assignedList.length > 0) {
    assignedList.forEach((sid) => {
      addEntry(
        sid,
        jc?.start_date || wo?.date || getLocalDateString(),
        8,
        "Worker",
        null,
        "Assigned",
        null,
        "",
      );
    });
  }

  // Sort descending by date
  records.sort((a, b) => new Date(b.work_date || 0) - new Date(a.work_date || 0));
  return records;
}

function renderJobCardLabor(jobCardId) {
  const records = getAllJobCardLaborRecords(jobCardId);
  const container = document.getElementById("jobCardLabor");
  if (!container) return;

  const totalHours = records.reduce(
    (sum, r) => sum + (parseFloat(r.hours) || 0),
    0,
  );
  const uniqueSailors = new Set(records.map((r) => r.sailor_id)).size;

  const countBadge = document.getElementById("jcLaborCountBadge");
  if (countBadge) countBadge.textContent = `${records.length} Records`;

  const hoursEl = document.getElementById("jcLaborTotalHours");
  if (hoursEl) hoursEl.textContent = `${totalHours}h`;

  const workersEl = document.getElementById("jcLaborUniqueWorkers");
  if (workersEl) workersEl.textContent = `${uniqueSailors} Sailors involved`;

  if (records.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="8" class="px-4 py-8 text-center text-slate-400">
          <p class="font-medium text-sm">No labor records logged for this Job Card.</p>
          <p class="text-xs text-slate-400 mt-1">Click "➕ Log Labor" above to add sailor man-hours.</p>
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = records
    .map((l) => {
      const perfVal = l.performance;
      const perfBadge =
        typeof perfVal === "number" && !isNaN(perfVal)
          ? `<span class="performance-badge ${getPerformanceColor(perfVal)}">${perfVal.toFixed(1)}</span>`
          : `<span class="text-slate-400 text-xs">-</span>`;

      const sourceBadge =
        l.source === "Logged"
          ? `<span class="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">Manual Log</span>`
          : l.source === "Daily Allocation"
            ? `<span class="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Daily Board</span>`
            : `<span class="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full">Assigned</span>`;

      return `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="px-4 py-2.5 text-slate-700 font-mono text-xs">${l.work_date}</td>
        <td class="px-4 py-2.5 font-medium text-slate-800 text-xs">
          <div>${l.sailor_name}</div>
          <div class="text-[10px] text-slate-400 font-mono">${l.official_number}</div>
        </td>
        <td class="px-4 py-2.5 text-center"><span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-bold">${l.trade}</span></td>
        <td class="px-4 py-2.5 text-center text-xs text-slate-700">${l.role}</td>
        <td class="px-4 py-2.5 text-center font-bold text-blue-700 text-xs">${l.hours}h</td>
        <td class="px-4 py-2.5 text-center">${perfBadge}</td>
        <td class="px-4 py-2.5 text-left">${sourceBadge}</td>
        <td class="px-2 py-2.5 text-center whitespace-nowrap">
          ${
            l.isDeletable
              ? `<button onclick="deleteSingleJobCardLabor('${l._fbKey || l.id}')" class="text-red-500 hover:text-red-700 text-xs px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors" title="Delete Labor Record">🗑️</button>`
              : `<span class="text-slate-300 text-xs">—</span>`
          }
        </td>
      </tr>
    `;
    })
    .join("");
}

function openAddJobLaborModal(jcId) {
  const id = jcId || store.selectedJobCard;
  if (!id) {
    showToast("Please select a Job Card first", "error");
    return;
  }
  const jc = (store.jobCards || []).find(
    (j) => String(j.id) === String(id) || String(j._fbKey) === String(id),
  );
  if (!jc) return;

  document.getElementById("addLaborJcId").value = jc._fbKey || jc.id;
  document.getElementById("addLaborJobInfo").textContent = `${jc.job_number || id} — ${jc.description || ""}`;
  document.getElementById("addLaborDate").value = getLocalDateString();
  document.getElementById("addLaborHours").value = "8";
  document.getElementById("addLaborRole").value = "Worker";
  document.getElementById("addLaborSailorSearch").value = "";
  document.getElementById("addLaborSelectedSailorId").value = "";
  document.getElementById("addLaborSelectedBadge").classList.add("hidden");

  renderAddLaborSailorsList("");
  document.getElementById("addJobLaborModal").classList.remove("hidden");
}

function filterAddLaborSailorSearch(query) {
  renderAddLaborSailorsList(query);
}

function renderAddLaborSailorsList(query) {
  const container = document.getElementById("addLaborSailorsList");
  if (!container) return;

  const q = (query || "").toLowerCase().trim();
  const sailors = (store.sailors || []).filter((s) => {
    if (!q) return true;
    const name = (s.name || "").toLowerCase();
    const offNo = (
      s.official_number ||
      s.officialNumber ||
      s.service_no ||
      s.off_no ||
      ""
    ).toLowerCase();
    const rank = (s.rank || "").toLowerCase();
    const trade = (s.trade || "").toLowerCase();
    return (
      name.includes(q) ||
      offNo.includes(q) ||
      rank.includes(q) ||
      trade.includes(q)
    );
  });

  if (sailors.length === 0) {
    container.innerHTML =
      '<div class="p-3 text-xs text-slate-400 italic text-center">No sailors found</div>';
    return;
  }

  container.innerHTML = sailors
    .slice(0, 30)
    .map((s) => {
      const sid = String(s.id !== undefined && s.id !== null ? s.id : s._fbKey);
      const sName = `${s.rank || ""} ${s.name || ""}`.trim();
      const sOff = s.official_number || s.service_no || s.off_no || "";
      const sTrade = s.trade || "General";
      return `
      <div onclick="selectAddLaborSailor('${sid}', '${sName.replace(/'/g, "\\'")}', '${sOff}', '${sTrade}')" class="p-2.5 text-xs hover:bg-blue-50 cursor-pointer flex items-center justify-between transition-colors">
        <div>
          <span class="font-bold text-slate-800">${sName}</span>
          <span class="ml-1 text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded font-bold">${sTrade}</span>
        </div>
        <span class="font-mono text-slate-400 text-[11px]">${sOff}</span>
      </div>
    `;
    })
    .join("");
}

function selectAddLaborSailor(sid, name, offNo, trade) {
  document.getElementById("addLaborSelectedSailorId").value = sid;
  const badge = document.getElementById("addLaborSelectedBadge");
  if (badge) {
    badge.innerHTML = `<span>Selected Sailor: <strong>${name}</strong> (${offNo}) — ${trade}</span>`;
    badge.classList.remove("hidden");
  }
}

function submitAddJobLabor(event) {
  event.preventDefault();
  const jcId = document.getElementById("addLaborJcId").value;
  const sailorId = document.getElementById("addLaborSelectedSailorId").value;
  const date = document.getElementById("addLaborDate").value;
  const hours = parseFloat(document.getElementById("addLaborHours").value) || 8;
  const role = document.getElementById("addLaborRole").value;

  if (!sailorId) {
    showToast("Please select a sailor first", "error");
    return;
  }

  const s = (store.sailors || []).find(
    (x) => String(x.id) === String(sailorId) || String(x._fbKey) === String(sailorId),
  );
  const entry = {
    job_card_id: jcId,
    sailor_id: sailorId,
    sailor_name: s ? `${s.rank || ""} ${s.name || ""}`.trim() : "",
    official_number: s ? s.official_number || s.service_no || "" : "",
    trade: s ? s.trade || "" : "",
    work_date: date,
    hours: hours,
    role: role,
    created_at: Date.now(),
  };

  if (!store.jobCardLabor) store.jobCardLabor = [];
  store.jobCardLabor.push(entry);
  fbSaveJobCardLabor(entry)
    .then(() => {
      closeModal("addJobLaborModal");
      renderJobCardLabor(jcId);
      renderJobCardSummary(jcId);
      showToast("Labor record saved successfully!");
    })
    .catch((err) => {
      console.error(err);
      closeModal("addJobLaborModal");
      renderJobCardLabor(jcId);
      showToast("Labor record saved locally!");
    });
}

function exportSingleJobCardLabor(jobCardId) {
  const targetId = jobCardId || store.selectedJobCard;
  if (!targetId) {
    showToast("Please select a Job Card first", "error");
    return;
  }
  const jc = (store.jobCards || []).find(
    (j) => String(j.id) === String(targetId) || String(j._fbKey) === String(targetId),
  );
  const jcNo = jc ? jc.job_number : targetId;
  const records = getAllJobCardLaborRecords(targetId);

  if (records.length === 0) {
    showToast("No labor records to export for this Job Card", "info");
    return;
  }

  let csvContent = "\uFEFF"; // UTF-8 BOM
  csvContent +=
    "Job Card No,Date,Official Number,Sailor Name,Trade,Role,Hours,Performance Score,Source,Remarks\n";

  records.forEach((r) => {
    const row = [
      `"${jcNo}"`,
      `"${r.work_date}"`,
      `"${r.official_number}"`,
      `"${(r.sailor_name || "").replace(/"/g, '""')}"`,
      `"${r.trade}"`,
      `"${r.role}"`,
      r.hours,
      r.performance !== null ? r.performance : "",
      `"${r.source}"`,
      `"${(r.remarks || "").replace(/"/g, '""')}"`,
    ];
    csvContent += row.join(",") + "\n";
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `Labor_Log_${jcNo.replace(/[\/\\]/g, "_")}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(`Labor log exported for ${jcNo}`);
}

function renderJobCardSummary(jobCardId) {
  const jc = store.jobCards.find(
    (j) =>
      String(j.id) === String(jobCardId) ||
      String(j._fbKey) === String(jobCardId),
  );
  const materials = store.jobCardMaterials.filter(
    (m) => String(m.job_card_id) === String(jobCardId),
  );
  const labor = getAllJobCardLaborRecords(jobCardId);
  const totalMaterialCost = materials.reduce(
    (sum, m) => sum + (parseFloat(m.total_cost) || 0),
    0,
  );
  const totalHours = labor.reduce(
    (sum, l) => sum + (parseFloat(l.hours) || 0),
    0,
  );
  const uniqueWorkers = [...new Set(labor.map((l) => l.sailor_id))].length;
  document.getElementById("jobCardSummary").innerHTML = `
        <div class="bg-blue-50 p-4 rounded-xl">
            <p class="text-sm text-slate-500 mb-1">Job Number</p>
            <p class="text-xl font-bold text-blue-600">${jc ? jc.job_number : "—"}</p>
        </div>
        <div class="bg-green-50 p-4 rounded-xl">
            <p class="text-sm text-slate-500 mb-1">Total Material Cost</p>
            <p class="text-xl font-bold text-green-600">${formatCurrency(totalMaterialCost)}</p>
        </div>
        <div class="bg-amber-50 p-4 rounded-xl">
            <p class="text-sm text-slate-500 mb-1">Total Man-Hours</p>
            <p class="text-xl font-bold text-amber-600">${totalHours} hours</p>
        </div>
        <div class="bg-purple-50 p-4 rounded-xl">
            <p class="text-sm text-slate-500 mb-1">Workers Involved</p>
            <p class="text-xl font-bold text-purple-600">${uniqueWorkers} sailors</p>
        </div>
        <div class="col-span-2 bg-slate-50 p-4 rounded-xl">
            <p class="text-sm text-slate-500 mb-1">Status & Duration</p>
            <div class="flex items-center gap-4">
                <span class="px-3 py-1 rounded ${jc && jc.status === "Active" ? "bg-green-100 text-green-700" : "bg-slate-200"}">${jc ? jc.status : "—"}</span>
                <span class="text-slate-600">Started: ${jc ? jc.start_date || "—" : "—"}</span>
                ${jc && jc.end_date ? `<span class="text-slate-600">Ended: ${jc.end_date}</span>` : ""}
            </div>
        </div>
    `;
}
function renderJobCardFeedback(jobCardId) {
  const jc = store.jobCards.find((j) => j.id === jobCardId);
  if (jc.feedbackReceived && jc.feedback) {
    document.getElementById("feedbackSection").classList.add("hidden");
    document
      .getElementById("receivedFeedbackSection")
      .classList.remove("hidden");
    document.getElementById("receivedFeedbackSection").innerHTML = `
            <div class="bg-green-50 p-6 rounded-xl border border-green-200">
                <div class="flex items-center justify-between mb-4">
                    <h4 class="font-semibold text-green-800">✓ Feedback Received</h4>
                    <span class="text-2xl font-bold text-green-600">${jc.feedback.overall.toFixed(1)}/5</span>
                </div>
                <div class="grid grid-cols-5 gap-2 mb-4">
                    ${[
                      "Productivity",
                      "Workmanship",
                      "Communication",
                      "Professionalism",
                      "Satisfaction",
                    ]
                      .map((cat, i) => {
                        const scores = [
                          jc.feedback.productivity,
                          jc.feedback.workmanship,
                          jc.feedback.communication,
                          jc.feedback.professionalism,
                          jc.feedback.satisfaction,
                        ];
                        return `
                            <div class="text-center p-2 bg-white rounded-lg">
                                <p class="text-xs text-slate-500">${cat}</p>
                                <p class="font-bold text-lg">${scores[i]}</p>
                            </div>
                        `;
                      })
                      .join("")}
                </div>
                ${jc.feedback.comments ? `<p class="text-sm text-slate-600 italic">"${jc.feedback.comments}"</p>` : ""}
            </div>
        `;
  } else {
    document.getElementById("feedbackSection").classList.remove("hidden");
    document.getElementById("receivedFeedbackSection").classList.add("hidden");
    document.getElementById("feedbackLinkBox").classList.add("hidden");
    document.getElementById("genFeedbackBtn").style.display =
      jc.status === "Completed" ? "inline-block" : "none";
    document.getElementById("feedbackStatusText").textContent = jc.feedbackSent
      ? "Feedback link has been sent. Waiting for response..."
      : "Generate a feedback link to send to the end user";
  }
}
function switchJobCardTab(tab) {
  document.querySelectorAll(".jc-tab").forEach((t) => {
    t.classList.remove(
      "border-green-600",
      "text-green-600",
      "border-b-2",
      "font-semibold",
    );
  });
  document.querySelectorAll(".jc-tab-content").forEach((c) => {
    c.classList.add("hidden");
  });
  const activeBtn = document.querySelector(`[data-tab="${tab}"]`);
  if (activeBtn) {
    activeBtn.classList.add(
      "border-green-600",
      "text-green-600",
      "border-b-2",
      "font-semibold",
    );
  }
  const tabEl = document.getElementById(`jcTab-${tab}`);
  if (tabEl) tabEl.classList.remove("hidden");
}
window._matWoSailorEntries = [];

function toggleMatSailorsSection() {
  const checkbox = document.getElementById("matIncludeSailors");
  const section = document.getElementById("matSailorsSection");
  if (!checkbox || !section) return;
  section.classList.toggle("hidden", !checkbox.checked);
  if (checkbox.checked) {
    loadAndRenderMatWoSailors();
  }
}

function loadAndRenderMatWoSailors() {
  const jc = (store.jobCards || []).find(
    (j) =>
      String(j.id) === String(store.selectedJobCard) ||
      String(j._fbKey) === String(store.selectedJobCard),
  );
  const wo = jc
    ? (store.workOrders || []).find(
        (w) =>
          String(w._fbKey) === String(jc.work_order_id) ||
          String(w.id) === String(jc.work_order_id),
      )
    : null;

  const defaultHours =
    parseFloat((document.getElementById("matSailorHours") || {}).value) || 8;
  const woAssignedIds = (wo?.assigned || []).map(String);
  const woSailors = (store.sailors || []).filter((s) => {
    return (
      woAssignedIds.includes(String(s.id)) ||
      woAssignedIds.includes(String(s._fbKey)) ||
      (s.official_number && woAssignedIds.includes(String(s.official_number)))
    );
  });

  const countBadge = document.getElementById("matWoCrewCountBadge");
  if (countBadge) {
    countBadge.textContent =
      woSailors.length > 0 ? `${woSailors.length} assigned to Work Order` : "";
  }

  // Pre-populate entries with all Work Order sailors checked by default
  _matWoSailorEntries = woSailors.map((s) => ({
    sailor: s,
    sailor_id: s.id || s._fbKey,
    official_number: s.official_number || s.officialNumber || s.off_no || "-",
    name: `${s.rank || ""} ${s.name || ""}`.trim(),
    trade: s.trade || "MA",
    checked: true,
    hours: defaultHours,
    role: "Worker",
  }));

  renderMatWoSailors();
}

function renderMatWoSailors() {
  const container = document.getElementById("matWoSailorsList");
  if (!container) return;

  if (_matWoSailorEntries.length === 0) {
    container.innerHTML = `
      <div class="text-center py-3 text-xs text-slate-500 italic">
        ⚠️ No sailors are currently assigned to this Work Order.
      </div>
    `;
    return;
  }

  container.innerHTML = _matWoSailorEntries
    .map((item, idx) => {
      return `
      <div class="flex items-center justify-between gap-2 p-1.5 rounded-lg border ${item.checked ? "bg-amber-50/60 border-amber-200" : "bg-slate-50 border-slate-200 opacity-60"} transition-all">
        <label class="flex items-center gap-2 flex-1 min-w-0 cursor-pointer select-none">
          <input type="checkbox" ${item.checked ? "checked" : ""} onchange="toggleMatSailorEntry(${idx}, this.checked)" class="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400">
          <span class="font-bold text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">${item.trade}</span>
          <div class="truncate text-xs">
            <span class="font-semibold text-slate-800">${item.name}</span>
            <span class="text-[11px] text-slate-500 font-mono">(${item.official_number})</span>
          </div>
        </label>
        <div class="flex items-center gap-1.5">
          <input type="text" value="${item.role || "Worker"}" onchange="updateMatSailorField(${idx}, 'role', this.value)" placeholder="Role" class="w-20 text-xs px-1.5 py-0.5 border border-slate-300 rounded bg-white" title="Role / Duty">
          <div class="flex items-center gap-0.5">
            <input type="number" value="${item.hours || 8}" min="1" max="24" onchange="updateMatSailorField(${idx}, 'hours', parseFloat(this.value) || 8)" class="w-12 text-xs px-1 py-0.5 border border-slate-300 rounded bg-white text-center font-bold" title="Hours">
            <span class="text-[11px] text-slate-500">h</span>
          </div>
        </div>
      </div>
    `;
    })
    .join("");
}

function toggleMatSailorEntry(index, isChecked) {
  if (_matWoSailorEntries[index]) {
    _matWoSailorEntries[index].checked = isChecked;
    renderMatWoSailors();
  }
}

function updateMatSailorField(index, field, value) {
  if (_matWoSailorEntries[index]) {
    _matWoSailorEntries[index][field] = value;
  }
}

function updateAllMatSailorsHours(hoursVal) {
  const h = parseFloat(hoursVal) || 8;
  _matWoSailorEntries.forEach((item) => {
    item.hours = h;
  });
  renderMatWoSailors();
}

function openAddMaterialToJobModal() {
  if (!store.selectedJobCard) {
    showToast("Please select a job card first", "error");
    return;
  }
  document.getElementById("matJobCardId").value = store.selectedJobCard; // Reset form
  const jc = store.jobCards.find(
    (j) =>
      String(j.id) === String(store.selectedJobCard) ||
      String(j._fbKey) === String(store.selectedJobCard),
  );

  const matDateInput = document.getElementById("matDate");
  if (matDateInput)
    matDateInput.value =
      typeof getLocalDateString === "function"
        ? getLocalDateString()
        : new Date().toISOString().split("T")[0];
  const matDemandNoInput = document.getElementById("matDemandNo");
  if (matDemandNoInput) matDemandNoInput.value = "";
  const matCommencedInput = document.getElementById("matCommenced");
  if (matCommencedInput) {
    matCommencedInput.value =
      jc && (jc.start_date || jc.commenced_date)
        ? jc.start_date || jc.commenced_date
        : typeof getLocalDateString === "function"
          ? getLocalDateString()
          : new Date().toISOString().split("T")[0];
  }
  const matJobCardNoInput = document.getElementById("matJobCardNo");
  if (matJobCardNoInput) {
    matJobCardNoInput.value =
      jc && (jc.job_number || jc.job_card_no)
        ? jc.job_number || jc.job_card_no
        : "";
  }
  const matSigInput = document.getElementById("matSig");
  if (matSigInput) matSigInput.value = "";

  _matWoSailorEntries = [];
  const includeSailorsCheckbox = document.getElementById("matIncludeSailors");
  if (includeSailorsCheckbox) {
    includeSailorsCheckbox.checked = false;
  }
  const sailorsSection = document.getElementById("matSailorsSection");
  if (sailorsSection) {
    sailorsSection.classList.add("hidden");
  }
  const countBadge = document.getElementById("matWoCrewCountBadge");
  if (countBadge) {
    const wo = jc
      ? (store.workOrders || []).find(
          (w) =>
            String(w._fbKey) === String(jc.work_order_id) ||
            String(w.id) === String(jc.work_order_id),
        )
      : null;
    const woAssignedIds = (wo?.assigned || []).map(String);
    countBadge.textContent =
      woAssignedIds.length > 0 ? `${woAssignedIds.length} in Work Order` : "";
  }

  const matInput = document.getElementById("matFromInventory");
  matInput.value = "";
  document.getElementById("matName").value = "";
  document.getElementById("matQuantity").value = "";
  document.getElementById("matCost").value = "";
  document.getElementById("matTotalCost").textContent = "Rs. 0.00";
  setupMaterialAutocomplete(matInput, fillMaterialFromInventory);
  matInput.addEventListener("change", fillMaterialFromInventory);
  document.getElementById("addMaterialModal").classList.remove("hidden");
}
function setSelectValueCaseInsensitive(selectEl, targetValue) {
  if (!selectEl || !targetValue) return;
  const cleanTarget = String(targetValue).trim().toLowerCase();
  for (let i = 0; i < selectEl.options.length; i++) {
    const optVal = selectEl.options[i].value.trim().toLowerCase();
    const optText = selectEl.options[i].textContent.trim().toLowerCase();
    if (
      optVal === cleanTarget ||
      optText === cleanTarget ||
      (cleanTarget.startsWith("no") && optVal.startsWith("no")) ||
      (cleanTarget.startsWith("kg") && optVal.startsWith("kg")) ||
      (cleanTarget.startsWith("bag") && optVal.startsWith("bag")) ||
      (cleanTarget.startsWith("cub") && optVal.startsWith("cub")) ||
      (cleanTarget.startsWith("mtr") && optVal.startsWith("meter")) ||
      (cleanTarget.startsWith("met") && optVal.startsWith("meter")) ||
      (cleanTarget.startsWith("ltr") && optVal.startsWith("ltr")) ||
      (cleanTarget.startsWith("ft") && optVal.startsWith("ft")) ||
      (cleanTarget.startsWith("sheet") && optVal.startsWith("sheet"))
    ) {
      selectEl.selectedIndex = i;
      return;
    }
  }
  const newOpt = document.createElement("option");
  newOpt.value = targetValue;
  newOpt.textContent = targetValue;
  selectEl.appendChild(newOpt);
  selectEl.value = targetValue;
}

function fillMaterialFromInventory() {
  const inputVal = (document.getElementById("matFromInventory")?.value || "").trim().toLowerCase();
  if (!inputVal) return;
  const item =
    store.inventory.find(
      (i) => (i.description || "").trim().toLowerCase() === inputVal && i.category !== "Tools",
    ) ||
    store.inventory.find(
      (i) => (i.description || "").trim().toLowerCase().includes(inputVal) && i.category !== "Tools",
    );
  if (item) {
    document.getElementById("matName").value = item.description;
    setSelectValueCaseInsensitive(document.getElementById("matUnit"), item.deno);
    document.getElementById("matCost").value = item.cost_per_unit || "";
    calculateMaterialTotal();
  }
}
function calculateMaterialTotal() {
  const qty = parseFloat(document.getElementById("matQuantity").value) || 0;
  const cost = parseFloat(document.getElementById("matCost").value) || 0;
  document.getElementById("matTotalCost").textContent = formatCurrency(
    qty * cost,
  );
} // Add event listeners for material calculation
(_document$getElementB3 = document.getElementById("matQuantity")) === null ||
  _document$getElementB3 === void 0 ||
  _document$getElementB3.addEventListener("input", calculateMaterialTotal);
(_document$getElementB4 = document.getElementById("matCost")) === null ||
  _document$getElementB4 === void 0 ||
  _document$getElementB4.addEventListener("input", calculateMaterialTotal);
function addMaterialToJob(event) {
  event.preventDefault();
  const jobCardId = document.getElementById("matJobCardId").value;
  const qty = parseFloat(document.getElementById("matQuantity").value);
  const cost = parseFloat(document.getElementById("matCost").value) || 0;
  const demandNo = (document.getElementById("matDemandNo") || {}).value || "";
  const commenced = (document.getElementById("matCommenced") || {}).value || "";
  const customJobCardNo =
    (document.getElementById("matJobCardNo") || {}).value || "";
  const sigRef = (document.getElementById("matSig") || {}).value || "";
  const customDate =
    (document.getElementById("matDate") || {}).value ||
    (typeof getLocalDateString === "function"
      ? getLocalDateString()
      : new Date().toISOString().split("T")[0]);

  const invId = (document.getElementById("matFromInventory") || {}).value || null;

  const newMaterial = {
    job_card_id: jobCardId,
    material_name: document.getElementById("matName").value,
    quantity: qty,
    unit: document.getElementById("matUnit").value,
    cost_per_unit: cost,
    total_cost: qty * cost,
    demand_no: demandNo,
    commenced: commenced,
    job_card_no: customJobCardNo,
    sig_ref: sigRef,
    work_date: customDate,
    logged_at: customDate,
    inventory_id: invId || null,
  }; // Save to Firebase (Realtime Database listener will automatically update store.jobCardMaterials)

  // If Sailors Records included
  const includeSailors = (
    document.getElementById("matIncludeSailors") || {}
  ).checked;
  const selectedEntries = includeSailors
    ? _matWoSailorEntries.filter((e) => e.checked)
    : [];

  if (includeSailors && selectedEntries.length > 0) {
    selectedEntries.forEach((e) => {
      const s = e.sailor;
      const laborEntry = {
        job_card_id: jobCardId,
        sailor_id: e.sailor_id,
        sailor_name: e.name,
        trade: e.trade,
        work_date: customDate,
        hours: e.hours || 8,
        role: e.role || "Worker",
        performance:
          s && typeof s.avgScore === "number"
            ? s.avgScore
            : s && typeof s.performance_score === "number"
              ? s.performance_score
              : 7.0,
        logged_by: store.currentUser?.name || "Officer",
      };
      if (!store.jobCardLabor) store.jobCardLabor = [];
      store.jobCardLabor.push(laborEntry);
      fbSaveJobCardLabor(laborEntry);
    });
    newMaterial.sailors_logged = selectedEntries.length;
  }

  fbSaveJobCardMaterial(newMaterial); // Update job card total in Firebase
  const jc = store.jobCards.find(
    (j) =>
      String(j.id) === String(jobCardId) ||
      String(j._fbKey) === String(jobCardId),
  );
  if (jc) {
    jc.total_material_cost =
      (jc.total_material_cost || 0) + newMaterial.total_cost;
    if (commenced) {
      jc.start_date = commenced;
      jc.commenced_date = commenced;
    }
    if (customJobCardNo) {
      jc.job_number = customJobCardNo;
    }
    jc.include_sailors = includeSailors;
    fbSaveJobCard(jc);
  } // Deduct from inventory in Firebase if selected
  if (invId) {
    const inv = store.inventory.find(
      (i) =>
        String(i.id) === String(invId) || String(i._fbKey) === String(invId),
    );
    if (inv) {
      inv.quantity -= qty;
      fbSaveInventoryItem(inv);
    }
  }
  closeModal("addMaterialModal");
  selectJobCard(jobCardId);
  renderJobCardLabor(jobCardId);
  showToast("Material and details saved successfully!");
}



// =============================================
// OFFICIAL NAVY JOB CARD PRINT & PDF EXPORT
// =============================================
function buildOfficialJobCardPrintHTML(jc) {
  if (!jc) return "";
  const jcId = jc.id || jc._fbKey;
  const materials = (store.jobCardMaterials || []).filter(
    (m) => String(m.job_card_id) === String(jcId) || String(m.job_card_id) === String(jc.id) || String(m.job_card_id) === String(jc._fbKey)
  );
  const totalCost = materials.reduce((sum, m) => sum + (parseFloat(m.total_cost) || 0), 0);

  const latestMatWithCommenced = [...materials].reverse().find((m) => m.commenced);
  const startDate = (latestMatWithCommenced ? latestMatWithCommenced.commenced : "") || jc.start_date || jc.commenced_date || (jc.created_at ? new Date(jc.created_at).toISOString().split("T")[0] : "");
  const endDate = jc.end_date || (jc.completed_at ? new Date(jc.completed_at).toISOString().split("T")[0] : "");
  const projectTitle = jc.description || jc.title || "Civil Engineering Maintenance Job";
  const latestMatWithJobNo = [...materials].reverse().find((m) => m.job_card_no);
  const jobNo = (latestMatWithJobNo ? latestMatWithJobNo.job_card_no : "") || jc.job_number || "JC/" + (new Date().getFullYear()) + "/0000";

  // Build material rows
  let rowsHtml = "";
  materials.forEach((m) => {
    const dateStr =
      typeof m.logged_at === "number"
        ? new Date(m.logged_at).toISOString().split("T")[0]
        : (m.work_date || m.logged_at || startDate || "");
    const demandNo = m.demand_no || m.demandNo || "";
    const matName = m.material_name || "";
    const unit = m.unit || "";
    const qty = m.quantity !== undefined ? m.quantity : "";
    const sigRef = m.sig_ref || m.sig || "";
    const unitCost = m.cost_per_unit !== undefined ? parseFloat(m.cost_per_unit).toFixed(2) : "";
    const lineTotal = m.total_cost !== undefined ? parseFloat(m.total_cost).toFixed(2) : "";

    rowsHtml += `
      <tr style="height: 30px;">
        <td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-size: 11px; font-family: monospace;">${dateStr}</td>
        <td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-size: 11px; font-family: monospace; font-weight: bold;">${demandNo}</td>
        <td style="border: 1px solid #000; padding: 4px 8px; text-align: left; font-size: 11px; font-weight: 600;">${matName}</td>
        <td style="border: 1px solid #000; padding: 4px 4px; text-align: center; font-size: 11px;">${unit}</td>
        <td style="border: 1px solid #000; padding: 4px 4px; text-align: center; font-size: 11px; font-weight: bold;">${qty}</td>
        <td style="border: 1px solid #000; padding: 4px 4px; text-align: center; font-size: 11px; font-family: monospace;">${sigRef}</td>
        <td style="border: 1px solid #000; padding: 4px 6px; text-align: right; font-size: 11px; font-family: monospace;">${unitCost}</td>
        <td style="border: 1px solid #000; padding: 4px 6px; text-align: right; font-size: 11px; font-family: monospace; font-weight: bold;">${lineTotal}</td>
      </tr>
    `;
  });

  // Fill up blank rows up to 10 minimum rows to mimic the official Navy paper form
  const minRows = 10;
  const blankRowsNeeded = Math.max(0, minRows - materials.length);
  for (let i = 0; i < blankRowsNeeded; i++) {
    rowsHtml += `
      <tr style="height: 30px;">
        <td style="border: 1px solid #000; padding: 4px 6px;">&nbsp;</td>
        <td style="border: 1px solid #000; padding: 4px 6px;">&nbsp;</td>
        <td style="border: 1px solid #000; padding: 4px 8px;">&nbsp;</td>
        <td style="border: 1px solid #000; padding: 4px 4px;">&nbsp;</td>
        <td style="border: 1px solid #000; padding: 4px 4px;">&nbsp;</td>
        <td style="border: 1px solid #000; padding: 4px 4px;">&nbsp;</td>
        <td style="border: 1px solid #000; padding: 4px 6px;">&nbsp;</td>
        <td style="border: 1px solid #000; padding: 4px 6px;">&nbsp;</td>
      </tr>
    `;
  }

  // Build Labor / Sailors Records Table only if include_sailors is enabled and labor logs exist
  const laborLogs = getAllJobCardLaborRecords(jcId);

  const shouldShowSailors =
    (jc.include_sailors === true ||
      jc.include_sailors === "true" ||
      (jc.include_sailors !== false && laborLogs.length > 0)) &&
    laborLogs.length > 0;

  let laborSectionHtml = "";
  if (shouldShowSailors) {
    let laborRowsHtml = "";
    laborLogs.forEach((l, idx) => {
      const sailor = findSailorById(l.sailor_id);
      const offNo = sailor
        ? sailor.official_number ||
          sailor.officialNumber ||
          sailor.off_no ||
          sailor.service_no ||
          l.official_number ||
          "-"
        : l.official_number || "-";
      const name = sailor
        ? `${sailor.rank || ""} ${sailor.name || ""}`.trim()
        : l.sailor_name || "Unknown";
      const trade = sailor ? sailor.trade || "-" : (l.trade || "-");
      const role = l.role || "Worker";
      const hours = l.hours || l.hours_worked || 8;
      const workDate = l.work_date || startDate || "-";

      laborRowsHtml += `
        <tr style="height: 28px;">
          <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 10.5px;">${idx + 1}</td>
          <td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-size: 10.5px; font-family: monospace; font-weight: bold;">${offNo}</td>
          <td style="border: 1px solid #000; padding: 4px 8px; text-align: left; font-size: 10.5px; font-weight: 600;">${name}</td>
          <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 10.5px; font-weight: bold;">${trade}</td>
          <td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-size: 10.5px;">${role}</td>
          <td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-size: 10.5px; font-family: monospace;">${workDate} (${hours}h)</td>
        </tr>
      `;
    });

    laborSectionHtml = `
      <!-- Sailors / Labor Deployment Record Table -->
      <div style="margin-top: 14px; page-break-inside: avoid;">
        <div style="font-size: 11px; font-weight: 900; letter-spacing: 0.5px; border-bottom: 1.5px solid #000; padding-bottom: 3px; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
          <span>⚓ SAILORS DEPLOYMENT RECORD</span>
          <span style="font-size: 10px; font-weight: normal; font-style: italic;">(${laborLogs.length} Person(s) Logged)</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1.5px solid #000;">
          <thead>
            <tr style="background: #f8fafc;">
              <th style="border: 1px solid #000; padding: 5px 4px; text-align: center; width: 6%; font-weight: 800; font-size: 10px;">NO</th>
              <th style="border: 1px solid #000; padding: 5px 6px; text-align: center; width: 16%; font-weight: 800; font-size: 10px;">OFFICIAL NO</th>
              <th style="border: 1px solid #000; padding: 5px 8px; text-align: left; width: 36%; font-weight: 800; font-size: 10px;">RANK & NAME</th>
              <th style="border: 1px solid #000; padding: 5px 4px; text-align: center; width: 10%; font-weight: 800; font-size: 10px;">TRADE</th>
              <th style="border: 1px solid #000; padding: 5px 6px; text-align: center; width: 14%; font-weight: 800; font-size: 10px;">ROLE / DUTY</th>
              <th style="border: 1px solid #000; padding: 5px 6px; text-align: center; width: 18%; font-weight: 800; font-size: 10px;">WORK DATE / HOURS</th>
            </tr>
          </thead>
          <tbody>
            ${laborRowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  const formattedTotal = totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return `
    <div class="jobcard-sheet" style="font-family: Arial, Helvetica, sans-serif; color: #000; background: #fff; width: 100%; box-sizing: border-box; padding: 10px;">
      
      <!-- Top Header with Navy Crest (Centered) -->
      <div style="width: 100%; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; text-align: center;">
        <div style="display: inline-flex; align-items: center; justify-content: center; gap: 14px;">
          <img src="${window.location.href.split("?")[0].split("#")[0].replace("index.html", "")}images/navy_crest_cropped.png" style="height: 48px; width: auto; display: block; object-fit: contain;" alt="SLN Crest">
          <div style="text-align: left;">
            <div style="font-size: 18px; font-weight: 900; letter-spacing: 1.2px; color: #0f172a; line-height: 1.15;">JOB CARD</div>
            <div style="font-size: 11px; font-weight: 800; color: #1e293b; margin-top: 3px; letter-spacing: 0.4px;">CAPTAIN CIVIL ENGINEERING DEPARTMENT (E)</div>
          </div>
        </div>
      </div>

      <!-- Top Section Box -->
      <div style="border: 1.5px solid #000; padding: 10px 14px; margin-bottom: -1.5px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          
          <!-- Left Header Info -->
          <div style="width: 55%; font-size: 11px; line-height: 1.8;">
            <div style="display: flex; gap: 6px;">
              <span style="font-weight: 800; width: 140px;">COMMENCED:</span>
              <span style="border-bottom: 1px dotted #000; flex: 1; padding-bottom: 1px; font-family: monospace;">${startDate}</span>
            </div>
            <div style="display: flex; gap: 6px; margin-top: 3px;">
              <span style="font-weight: 800; width: 140px;">COMPLETED:</span>
              <span style="border-bottom: 1px dotted #000; flex: 1; padding-bottom: 1px; font-family: monospace;">${endDate}</span>
            </div>
            <div style="display: flex; gap: 6px; margin-top: 4px;">
              <span style="font-weight: 800; width: 140px;">NAME OF PROJECT:</span>
              <span style="font-weight: 700; flex: 1; text-decoration: underline;">${projectTitle}</span>
            </div>
          </div>

          <!-- Right Header Info -->
          <div style="width: 42%; font-size: 11px; line-height: 1.75; text-align: right;">
            <div><strong style="font-weight: 800;">JOB CARD NO:</strong> <span style="font-family: monospace; font-weight: 900; color: #b91c1c; font-size: 12px;">${jobNo}</span></div>
            <div><strong style="font-weight: 800;">DATE:</strong> <span style="font-family: monospace;">${startDate || (typeof getLocalDateString === "function" ? getLocalDateString() : "")}</span></div>
            <div><strong style="font-weight: 800;">APPROVED BY -</strong> CCED (E)</div>
            <div style="margin-top: 2px;"><strong style="font-weight: 800;">TAKEN BY:</strong> <span style="border-bottom: 1px dotted #000; display: inline-block; width: 130px;">&nbsp;</span></div>
          </div>

        </div>
      </div>

      <!-- Materials Table -->
      <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1.5px solid #000;">
        <thead>
          <tr style="background: #f8fafc;">
            <th style="border: 1px solid #000; padding: 6px 4px; text-align: center; width: 11%; font-weight: 800; font-size: 10px;">DATE</th>
            <th style="border: 1px solid #000; padding: 6px 4px; text-align: center; width: 14%; font-weight: 800; font-size: 10px;">DEMAND NO</th>
            <th style="border: 1px solid #000; padding: 6px 6px; text-align: center; width: 33%; font-weight: 800; font-size: 10px;">MATERIAL DESCRIPTION</th>
            <th style="border: 1px solid #000; padding: 6px 4px; text-align: center; width: 6%; font-weight: 800; font-size: 10px;">UNIT</th>
            <th style="border: 1px solid #000; padding: 6px 4px; text-align: center; width: 6%; font-weight: 800; font-size: 10px;">QTY</th>
            <th style="border: 1px solid #000; padding: 6px 4px; text-align: center; width: 6%; font-weight: 800; font-size: 10px;">SIG</th>
            <th style="border: 1px solid #000; padding: 6px 6px; text-align: right; width: 11%; font-weight: 800; font-size: 10px;">UNIT PRICE (RS)</th>
            <th style="border: 1px solid #000; padding: 6px 6px; text-align: right; width: 13%; font-weight: 800; font-size: 10px;">TOTAL (RS)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="7" style="border: 1px solid #000; padding: 8px 10px; text-align: right; font-weight: 900; font-size: 13px; letter-spacing: 0.5px;">TOTAL (RS)</td>
            <td style="border: 1px solid #000; padding: 8px 8px; text-align: right; font-weight: 900; font-size: 13px; font-family: monospace; border-bottom: 3px double #000;">
              ${formattedTotal}
            </td>
          </tr>
        </tfoot>
      </table>

      ${laborSectionHtml}

      <!-- Bottom Signatures -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 50px; padding: 0 40px; font-size: 11px;">
        <div style="text-align: center; width: 220px;">
          <div style="border-bottom: 1px dashed #000; margin-bottom: 8px; height: 35px;"></div>
          <strong style="font-weight: 800; font-size: 12px;">Checked by</strong>
        </div>
        <div style="text-align: center; width: 220px;">
          <div style="border-bottom: 1px dashed #000; margin-bottom: 8px; height: 35px;"></div>
          <strong style="font-weight: 800; font-size: 12px;">Certified by</strong>
        </div>
      </div>

    </div>
  `;
}

function printOfficialJobCard(jobCardId) {
  const targetId = jobCardId || store.selectedJobCard;
  if (!targetId) {
    showToast("Please select a Job Card to print", "error");
    return;
  }
  const jc = (store.jobCards || []).find(
    (j) => String(j.id) === String(targetId) || String(j._fbKey) === String(targetId)
  );
  if (!jc) {
    showToast("Job card record not found", "error");
    return;
  }

  const sheetHtml = buildOfficialJobCardPrintHTML(jc);

  const win = window.open("", "_blank");
  if (!win) {
    showToast("Popup blocked! Please allow popups for this site.", "error");
    return;
  }

  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Job Card - ${jc.job_number || 'Print'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; color: #000; background: #fff; padding: 15px; }
    @page { size: A4 portrait; margin: 12mm 15mm; }
    @media print {
      body { padding: 0; }
      .jobcard-sheet { padding: 0 !important; }
    }
  </style>
</head>
<body>
  ${sheetHtml}
</body>
</html>`);

  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 400);
}
function generateFeedbackLink() {
  const jc = store.jobCards.find((j) => j.id === store.selectedJobCard);
  if (!jc) return;
  const token = Math.random().toString(36).substring(2, 15);
  const link = `${window.location.origin}/feedback.html?job=${encodeURIComponent(jc.job_number)}&token=${token}`;
  document.getElementById("generatedFeedbackLink").value = link;
  document.getElementById("feedbackLinkBox").classList.remove("hidden");
  jc.feedbackSent = true;
  showToast("Feedback link generated!");
}
function copyFeedbackLink() {
  const link = document.getElementById("generatedFeedbackLink");
  link.select();
  document.execCommand("copy");
  showToast("Link copied to clipboard!");
}
function sendFeedbackWhatsApp() {
  const link = document.getElementById("generatedFeedbackLink").value;
  const jc = store.jobCards.find((j) => j.id === store.selectedJobCard);
  const message = `Please provide your feedback for Job ${jc === null || jc === void 0 ? void 0 : jc.job_number}: ${link}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
}
function exportJobCardReport() {
  const modal = document.getElementById("exportJobReportsModal");
  if (modal) {
    modal.classList.remove("hidden");
  } else {
    exportAllLaborLogsCsv();
  }
}

function exportAllLaborLogsCsv() {
  const currentZoneJobs = (store.jobCards || []).filter(
    (j) => !j.zone_id || j.zone_id === store.currentZone,
  );

  if (currentZoneJobs.length === 0) {
    showToast("No job cards found in this zone to export labor logs", "info");
    return;
  }

  let csvContent = "\uFEFF"; // UTF-8 BOM
  csvContent +=
    "Zone,Job Card No,Job Description,Date,Official Number,Sailor Name,Trade,Role,Hours,Performance Score,Source\n";

  let totalRows = 0;
  currentZoneJobs.forEach((jc) => {
    const records = getAllJobCardLaborRecords(jc.id || jc._fbKey);
    records.forEach((r) => {
      totalRows++;
      const row = [
        `"${jc.zone_id || store.currentZone}"`,
        `"${jc.job_number || jc.id}"`,
        `"${(jc.description || "").replace(/"/g, '""')}"`,
        `"${r.work_date}"`,
        `"${r.official_number}"`,
        `"${(r.sailor_name || "").replace(/"/g, '""')}"`,
        `"${r.trade}"`,
        `"${r.role}"`,
        r.hours,
        r.performance !== null && r.performance !== undefined
          ? r.performance
          : "",
        `"${r.source}"`,
      ];
      csvContent += row.join(",") + "\n";
    });
  });

  if (totalRows === 0) {
    showToast("No labor logs found for job cards in this zone", "info");
    return;
  }

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `All_Labor_Logs_${store.currentZone}_${getLocalDateString()}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  closeModal("exportJobReportsModal");
  showToast(`Exported ${totalRows} labor deployment records`);
}

function exportAllJobCardsSummaryCsv() {
  const jobs = (store.jobCards || []).filter(
    (j) => !j.zone_id || j.zone_id === store.currentZone,
  );

  if (jobs.length === 0) {
    showToast("No job cards found in this zone to export", "info");
    return;
  }

  let csvContent = "\uFEFF";
  csvContent +=
    "Job Card No,Zone,Description,Location,Status,Total Material Cost (Rs),Total Man-Hours,Workers Count,Start Date,End Date\n";

  jobs.forEach((jc) => {
    const materials = (store.jobCardMaterials || []).filter(
      (m) =>
        String(m.job_card_id) === String(jc.id) ||
        String(m.job_card_id) === String(jc._fbKey),
    );
    const matCost = materials.reduce(
      (sum, m) => sum + (parseFloat(m.total_cost) || 0),
      0,
    );
    const labor = getAllJobCardLaborRecords(jc.id || jc._fbKey);
    const manHours = labor.reduce(
      (sum, l) => sum + (parseFloat(l.hours) || 0),
      0,
    );
    const workerCount = new Set(labor.map((l) => l.sailor_id)).size;

    const row = [
      `"${jc.job_number || jc.id}"`,
      `"${jc.zone_id || store.currentZone}"`,
      `"${(jc.description || "").replace(/"/g, '""')}"`,
      `"${(jc.location || "").replace(/"/g, '""')}"`,
      `"${jc.status || "Active"}"`,
      matCost.toFixed(2),
      manHours,
      workerCount,
      `"${jc.start_date || ""}"`,
      `"${jc.end_date || ""}"`,
    ];
    csvContent += row.join(",") + "\n";
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `Job_Cards_Summary_${store.currentZone}_${getLocalDateString()}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  closeModal("exportJobReportsModal");
  showToast(`Exported ${jobs.length} job cards summary`);
}

function exportAllMaterialsUsageCsv() {
  const jobs = (store.jobCards || []).filter(
    (j) => !j.zone_id || j.zone_id === store.currentZone,
  );
  const jcMap = {};
  jobs.forEach((j) => {
    if (j.id) jcMap[String(j.id)] = j;
    if (j._fbKey) jcMap[String(j._fbKey)] = j;
  });

  const materials = (store.jobCardMaterials || []).filter(
    (m) => jcMap[String(m.job_card_id)],
  );

  if (materials.length === 0) {
    showToast("No materials usage records found in this zone", "info");
    return;
  }

  let csvContent = "\uFEFF";
  csvContent +=
    "Zone,Job Card No,Date,Demand No,Material Description,Unit,Quantity,Unit Price (Rs),Total Cost (Rs),SIG Ref\n";

  materials.forEach((m) => {
    const jc = jcMap[String(m.job_card_id)];
    const row = [
      `"${jc ? jc.zone_id || store.currentZone : store.currentZone}"`,
      `"${jc ? jc.job_number : m.job_card_id}"`,
      `"${m.date || ""}"`,
      `"${(m.demand_no || "").replace(/"/g, '""')}"`,
      `"${(m.material_name || m.description || "").replace(/"/g, '""')}"`,
      `"${m.unit || "Nos"}"`,
      m.quantity || 0,
      parseFloat(m.unit_cost || 0).toFixed(2),
      parseFloat(m.total_cost || 0).toFixed(2),
      `"${(m.sig_ref || "").replace(/"/g, '""')}"`,
    ];
    csvContent += row.join(",") + "\n";
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `Materials_Usage_${store.currentZone}_${getLocalDateString()}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  closeModal("exportJobReportsModal");
  showToast(`Exported ${materials.length} material usage records`);
}

// =============================================
// JOB CARDS MULTI-MERGE WORKFLOW
// =============================================

function toggleJobCardMergeMode() {
  store.isJobCardMergeMode = !store.isJobCardMergeMode;
  store.selectedJobCardsForMerge.clear();

  const btn = document.getElementById("btnToggleMergeJobCards");
  const textEl = document.getElementById("mergeBtnText");
  const proceedBtn = document.getElementById("btnProceedMergeModal");

  if (btn && textEl) {
    if (store.isJobCardMergeMode) {
      btn.className = "bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all";
      textEl.textContent = "Cancel Merge Mode";
      showToast("Merge Mode Active: Select 2 or more Job Cards with checkboxes to merge.", "info");
    } else {
      btn.className = "bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all";
      textEl.textContent = "Merge Job Cards";
    }
  }

  if (proceedBtn) proceedBtn.classList.add("hidden");
  renderJobCardsList();
}

function toggleSelectJobCardForMerge(jcId) {
  const idStr = String(jcId);
  if (store.selectedJobCardsForMerge.has(idStr)) {
    store.selectedJobCardsForMerge.delete(idStr);
  } else {
    store.selectedJobCardsForMerge.add(idStr);
  }

  const count = store.selectedJobCardsForMerge.size;
  const countEl = document.getElementById("mergeSelectedCount");
  const proceedBtn = document.getElementById("btnProceedMergeModal");

  if (countEl) countEl.textContent = count;
  if (proceedBtn) {
    proceedBtn.classList.toggle("hidden", count < 2);
  }

  renderJobCardsList();
}

function openMergeJobCardsModal() {
  if (store.selectedJobCardsForMerge.size < 2) {
    showToast("Please select at least 2 Job Cards to merge", "error");
    return;
  }

  const selectedCards = store.jobCards.filter((j) =>
    store.selectedJobCardsForMerge.has(String(j._fbKey || j.id))
  );

  if (selectedCards.length < 2) {
    showToast("Selected cards could not be loaded", "error");
    return;
  }

  const container = document.getElementById("mergeJobCardsRadioList");
  if (!container) return;

  // Calculate preview statistics
  let totalMaterials = 0;
  let totalLabor = 0;

  selectedCards.forEach((jc) => {
    const jcKey = jc._fbKey || jc.id;
    const mats = (store.jobCardMaterials || []).filter(
      (m) =>
        String(m.job_card_id) === String(jcKey) ||
        String(m.work_order_id) === String(jc.work_order_id) ||
        (jc.job_number && String(m.job_number) === String(jc.job_number))
    );
    totalMaterials += mats.length;

    const labors = (store.jobCardLabor || []).filter(
      (l) =>
        String(l.job_card_id) === String(jcKey) ||
        String(l.work_order_id) === String(jc.work_order_id)
    );
    totalLabor += labors.length;
  });

  document.getElementById("mergePreviewCardsCount").textContent = selectedCards.length;
  document.getElementById("mergePreviewMaterialsCount").textContent = `${totalMaterials} Items`;
  document.getElementById("mergePreviewLaborCount").textContent = `${totalLabor} Logs`;

  container.innerHTML = selectedCards
    .map((jc, idx) => {
      const jcKey = jc._fbKey || jc.id;
      const isFirst = idx === 0;
      return `
        <label class="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-indigo-50/50 cursor-pointer transition-all">
          <input type="radio" name="primaryMasterJobCard" value="${jcKey}" ${isFirst ? "checked" : ""} class="mt-1 text-indigo-600 focus:ring-indigo-500">
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold text-sm text-indigo-700">${jc.job_number}</span>
              <span class="text-xs px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-700">${jc.status}</span>
            </div>
            <p class="text-xs font-semibold text-slate-800 mt-0.5">${jc.description || "No description"}</p>
            <div class="flex items-center gap-4 text-[11px] text-slate-500 mt-1">
              <span>📍 ${jc.location || "No location"}</span>
              <span class="text-emerald-700 font-bold">Cost: ${formatCurrency(jc.total_material_cost || 0)}</span>
              <span>Zone: ${jc.zone_id || "—"}</span>
            </div>
          </div>
        </label>
      `;
    })
    .join("");

  document.getElementById("mergeJobCardsModal").classList.remove("hidden");
}

function submitExecuteJobCardMerge() {
  const radio = document.querySelector('input[name="primaryMasterJobCard"]:checked');
  if (!radio) {
    showToast("Please pick a Primary (Master) Job Card", "error");
    return;
  }

  const primaryJcKey = radio.value;
  const secondaryJcKeys = [...store.selectedJobCardsForMerge].filter(
    (id) => String(id) !== String(primaryJcKey)
  );

  if (secondaryJcKeys.length === 0) {
    showToast("No secondary job cards to merge", "error");
    return;
  }

  const primaryJc = store.jobCards.find(
    (j) => String(j._fbKey || j.id) === String(primaryJcKey)
  );
  if (!primaryJc) {
    showToast("Primary Job Card not found", "error");
    return;
  }

  executeJobCardMerge(primaryJc, secondaryJcKeys);
}

function executeJobCardMerge(primaryJc, secondaryJcKeys) {
  const primaryKey = primaryJc._fbKey || primaryJc.id;
  const primaryWoId = primaryJc.work_order_id;
  const primaryJobNum = primaryJc.job_number;

  let migratedMaterialsCount = 0;
  let migratedLaborCount = 0;
  let addedMaterialCost = 0;

  // 1. Migrate materials from secondary cards
  secondaryJcKeys.forEach((secKey) => {
    const secJc = store.jobCards.find(
      (j) => String(j._fbKey || j.id) === String(secKey)
    );
    if (!secJc) return;

    (store.jobCardMaterials || []).forEach((m) => {
      const belongs =
        String(m.job_card_id) === String(secKey) ||
        (secJc.work_order_id && String(m.work_order_id) === String(secJc.work_order_id)) ||
        (secJc.job_number && String(m.job_number) === String(secJc.job_number));

      if (belongs) {
        migratedMaterialsCount++;
        addedMaterialCost += (parseFloat(m.total_cost) || (parseFloat(m.quantity) * parseFloat(m.cost_per_unit)) || 0);
        if (m._fbKey) {
          opsDB.ref(`job_card_materials/${m._fbKey}`).update({
            job_card_id: primaryKey,
            work_order_id: primaryWoId,
            job_number: primaryJobNum,
            original_job_number: secJc.job_number || null,
            merged_at: new Date().toISOString()
          });
        }
      }
    });

    // 2. Migrate labor from secondary cards
    (store.jobCardLabor || []).forEach((l) => {
      const belongs =
        String(l.job_card_id) === String(secKey) ||
        (secJc.work_order_id && String(l.work_order_id) === String(secJc.work_order_id));

      if (belongs) {
        migratedLaborCount++;
        if (l._fbKey) {
          opsDB.ref(`job_card_labor/${l._fbKey}`).update({
            job_card_id: primaryKey,
            work_order_id: primaryWoId,
            job_number: primaryJobNum,
            original_job_number: secJc.job_number || null,
            merged_at: new Date().toISOString()
          });
        }
      }
    });

    // 3. Mark secondary Job Card as Merged in Firebase
    opsDB.ref(`job_cards/${secKey}`).update({
      status: "Merged",
      merged_into_job_number: primaryJobNum,
      merged_into_id: primaryKey,
      merged_at: new Date().toISOString(),
      notes: `Merged into ${primaryJobNum}`
    });
  });

  // 4. Update primary Job Card with updated totals
  const newTotalMatCost = (parseFloat(primaryJc.total_material_cost) || 0) + addedMaterialCost;
  opsDB.ref(`job_cards/${primaryKey}`).update({
    total_material_cost: newTotalMatCost,
    merged_sub_cards_count: (primaryJc.merged_sub_cards_count || 0) + secondaryJcKeys.length,
    last_updated: new Date().toISOString()
  });

  closeModal("mergeJobCardsModal");
  toggleJobCardMergeMode(); // Turn off merge mode
  showToast(
    `✅ Successfully merged ${secondaryJcKeys.length} Job Cards into ${primaryJobNum}! (${migratedMaterialsCount} materials, ${migratedLaborCount} labor logs migrated)`,
    "success",
    7000
  );
}

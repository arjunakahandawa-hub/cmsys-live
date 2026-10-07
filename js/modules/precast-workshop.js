// ============================================================================
// CMSys Module: Cement Pre-Cast Workshop & NAV 254 System (G Zone & Civil Works)
// File: js/modules/precast-workshop.js
// ============================================================================

function populatePrecastSupervisors() {
  const datalist = document.getElementById("pcSupervisorDatalist");
  if (!datalist) return;
  const regularSailors = (store.sailors || []).filter((s) => {
    const roll = s.roll || (s.official_number && s.official_number.startsWith("VAS") ? "VAS" : s.official_number && s.official_number.startsWith("EC") ? "EC" : "REG");
    return roll === "REG" || roll === "Regular" || !roll.startsWith("V");
  });
  const list = regularSailors.length > 0 ? regularSailors : store.sailors || [];
  datalist.innerHTML = list.map((s) => {
    const offNo = s.official_number || s.off_no || "";
    const rank = s.rank || "";
    const name = s.name || "";
    const trade = s.trade || "";
    return `<option value="${offNo} ${rank} ${name} (${trade})">${offNo} - ${name} [${trade}]</option>`;
  }).join("");
}

function getPrecastUnitPrice(term, fallback) {
  const item = (store.inventory || []).find((i) =>
    (i.description || "").toLowerCase().includes(term.toLowerCase()) &&
    i.category !== "Tools"
  );
  const val = item ? parseFloat(item.cost_per_unit || item.cost || 0) : 0;
  return val > 0 ? val : fallback;
}

function calculatePrecastBatchCost() {
  const prodQty = parseFloat(document.getElementById("pcQuantity")?.value) || 0;

  // Actual quantities entered by user
  const cementAct = parseFloat(document.getElementById("pcMatCement")?.value) || 0;
  const qdAct = parseFloat(document.getElementById("pcMatQuarryDust")?.value) || 0;
  const chipAct = parseFloat(document.getElementById("pcMatChipMetal")?.value) || 0;
  const m34Act = parseFloat(document.getElementById("pcMatMetal34")?.value) || 0;
  const torAct = parseFloat(document.getElementById("pcMatTorSteel")?.value) || 0;
  const admAct = parseFloat(document.getElementById("pcMatAdmixture")?.value) || 0;

  // Estimated quantities
  const cementEst = parseFloat(document.getElementById("pcEstCement")?.textContent) || 0;
  const qdEst = parseFloat(document.getElementById("pcEstQuarryDust")?.textContent) || 0;
  const chipEst = parseFloat(document.getElementById("pcEstChipMetal")?.textContent) || 0;
  const m34Est = parseFloat(document.getElementById("pcEstMetal34")?.textContent) || 0;
  const torEst = parseFloat(document.getElementById("pcEstTorSteel")?.textContent) || 0;
  const admEst = parseFloat(document.getElementById("pcEstAdmixture")?.textContent) || 0;

  // Unit costs of raw materials
  const cementPrice = getPrecastUnitPrice("Cement", 2100);
  const qdPrice = getPrecastUnitPrice("Quarry", 9500);
  const chipPrice = getPrecastUnitPrice("Chip", 14000);
  const m34Price = getPrecastUnitPrice("3/4", 16000);
  const torPrice = getPrecastUnitPrice("TOR", 290);
  const admPrice = getPrecastUnitPrice("Admixture", 450);

  // Helper to format differences & cost badges
  const renderDiff = (elId, costId, act, est, unitPrice, isInt = false) => {
    const el = document.getElementById(elId);
    const costEl = document.getElementById(costId);
    if (costEl) {
      costEl.textContent = formatCurrency(act * unitPrice);
    }
    if (!el) return;
    if (est <= 0 && act <= 0) {
      el.innerHTML = `<span class="text-slate-300 font-normal">—</span>`;
      return;
    }
    const diff = Math.round((act - est) * 100) / 100;
    const pct = est > 0 ? Math.round(((act - est) / est) * 100) : 0;
    if (Math.abs(diff) < 0.001) {
      el.innerHTML = `<span class="text-slate-400 font-normal">0.0 (0%)</span>`;
    } else if (diff > 0) {
      el.innerHTML = `<span class="text-amber-700 bg-amber-100 px-1 py-0.5 rounded font-bold">+${isInt ? diff.toFixed(1) : diff} (+${pct}%)</span>`;
    } else {
      el.innerHTML = `<span class="text-emerald-700 bg-emerald-100 px-1 py-0.5 rounded font-bold">${isInt ? diff.toFixed(1) : diff} (${pct}%)</span>`;
    }
  };

  renderDiff("pcDiffCement", "pcCostCement", cementAct, cementEst, cementPrice, true);
  renderDiff("pcDiffQuarryDust", "pcCostQuarryDust", qdAct, qdEst, qdPrice);
  renderDiff("pcDiffChipMetal", "pcCostChipMetal", chipAct, chipEst, chipPrice);
  renderDiff("pcDiffMetal34", "pcCostMetal34", m34Act, m34Est, m34Price);
  renderDiff("pcDiffTorSteel", "pcCostTorSteel", torAct, torEst, torPrice, true);
  renderDiff("pcDiffAdmixture", "pcCostAdmixture", admAct, admEst, admPrice, true);

  // Costs
  const estTotalCost =
    cementEst * cementPrice +
    qdEst * qdPrice +
    chipEst * chipPrice +
    m34Est * m34Price +
    torEst * torPrice +
    admEst * admPrice;

  const actualTotalCost =
    cementAct * cementPrice +
    qdAct * qdPrice +
    chipAct * chipPrice +
    m34Act * m34Price +
    torAct * torPrice +
    admAct * admPrice;

  // Actual Unit Cost based on ACTUAL materials consumed
  const actualUnitCost = prodQty > 0 ? actualTotalCost / prodQty : 0;

  const unitCostInput = document.getElementById("pcUnitCost");
  if (unitCostInput) {
    unitCostInput.value = actualUnitCost > 0 ? (Math.round(actualUnitCost * 100) / 100).toFixed(2) : "";
  }

  const totalCostSpan = document.getElementById("pcTotalBatchCost");
  if (totalCostSpan) {
    totalCostSpan.textContent = `Total: ${formatCurrency(actualTotalCost)}`;
  }

  const estTotalSpan = document.getElementById("pcEstTotalCost");
  if (estTotalSpan) {
    estTotalSpan.textContent = formatCurrency(estTotalCost);
  }

  const actTotalSpan = document.getElementById("pcActualTotalCost");
  if (actTotalSpan) {
    actTotalSpan.textContent = formatCurrency(actualTotalCost);
  }

  // Cost Variance Badge
  const varBadge = document.getElementById("pcCostVarianceBadge");
  if (varBadge) {
    if (estTotalCost > 0 && actualTotalCost > 0) {
      const diffCost = actualTotalCost - estTotalCost;
      const diffPct = Math.round((diffCost / estTotalCost) * 1000) / 10;
      if (Math.abs(diffCost) < 1) {
        varBadge.className = "px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300";
        varBadge.textContent = "Variance: Exact Mix (0.0%)";
      } else if (diffCost > 0) {
        varBadge.className = "px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300";
        varBadge.textContent = `Variance: +${formatCurrency(diffCost)} (+${diffPct}%)`;
      } else {
        varBadge.className = "px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300";
        varBadge.textContent = `Variance: ${formatCurrency(diffCost)} (${diffPct}%)`;
      }
    } else {
      varBadge.className = "px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300";
      varBadge.textContent = "Variance: 0.0%";
    }
  }
}

function calculateEstimatedFromRatios(forceActualSync = false) {
  const qty = parseFloat(document.getElementById("pcQuantity")?.value) || 0;

  const rCement = parseFloat(document.getElementById("pcRatioCement")?.value) || 0;
  const rQD = parseFloat(document.getElementById("pcRatioQuarryDust")?.value) || 0;
  const rChip = parseFloat(document.getElementById("pcRatioChipMetal")?.value) || 0;
  const rM34 = parseFloat(document.getElementById("pcRatioMetal34")?.value) || 0;
  const rTor = parseFloat(document.getElementById("pcRatioTorSteel")?.value) || 0;
  const rAdm = parseFloat(document.getElementById("pcRatioAdmixture")?.value) || 0;

  const estCement = Math.round(((qty / 100) * rCement) * 10) / 10;
  const estQD = Math.round(((qty / 100) * rQD) * 100) / 100;
  const estChip = Math.round(((qty / 100) * rChip) * 100) / 100;
  const estM34 = Math.round(((qty / 100) * rM34) * 100) / 100;
  const estTor = Math.round(((qty / 100) * rTor) * 10) / 10;
  const estAdm = Math.round(((qty / 100) * rAdm) * 10) / 10;

  if (document.getElementById("pcEstCement")) document.getElementById("pcEstCement").textContent = estCement.toFixed(1);
  if (document.getElementById("pcEstQuarryDust")) document.getElementById("pcEstQuarryDust").textContent = estQD.toFixed(2);
  if (document.getElementById("pcEstChipMetal")) document.getElementById("pcEstChipMetal").textContent = estChip.toFixed(2);
  if (document.getElementById("pcEstMetal34")) document.getElementById("pcEstMetal34").textContent = estM34.toFixed(2);
  if (document.getElementById("pcEstTorSteel")) document.getElementById("pcEstTorSteel").textContent = estTor.toFixed(1);
  if (document.getElementById("pcEstAdmixture")) document.getElementById("pcEstAdmixture").textContent = estAdm.toFixed(1);

  // Sync to actual inputs if forced or if actual is currently empty
  const syncActual = (actId, estVal) => {
    const actInput = document.getElementById(actId);
    if (actInput && (forceActualSync || !actInput.value || actInput.value === "0")) {
      actInput.value = estVal > 0 ? estVal : "";
    }
  };

  syncActual("pcMatCement", estCement);
  syncActual("pcMatQuarryDust", estQD);
  syncActual("pcMatChipMetal", estChip);
  syncActual("pcMatMetal34", estM34);
  syncActual("pcMatTorSteel", estTor);
  syncActual("pcMatAdmixture", estAdm);

  calculatePrecastBatchCost();
}

function copyEstimatedToActualRawMaterials() {
  document.getElementById("pcMatCement").value = document.getElementById("pcEstCement")?.textContent || "";
  document.getElementById("pcMatQuarryDust").value = document.getElementById("pcEstQuarryDust")?.textContent || "";
  document.getElementById("pcMatChipMetal").value = document.getElementById("pcEstChipMetal")?.textContent || "";
  document.getElementById("pcMatMetal34").value = document.getElementById("pcEstMetal34")?.textContent || "";
  document.getElementById("pcMatTorSteel").value = document.getElementById("pcEstTorSteel")?.textContent || "";
  document.getElementById("pcMatAdmixture").value = document.getElementById("pcEstAdmixture")?.textContent || "";
  calculatePrecastBatchCost();
  showToast("Copied estimated raw material quantities to Actual Used inputs", "info");
}

function openPrecastProductionModal() {
  const modal = document.getElementById("precastProductionModal");
  if (!modal) return;

  const today = getLocalDateString();
  const serialNo = `BATCH/${new Date().getFullYear()}/${String(Date.now()).slice(-4)}`;

  document.getElementById("pcBatchNo").value = serialNo;
  document.getElementById("pcDate").value = today;
  document.getElementById("pcShift").value = "Day Shift (0800 - 1630)";
  document.getElementById("pcProductSelect").value = "4 inch Cement Solid Block";
  document.getElementById("pcCustomProduct").classList.add("hidden");
  document.getElementById("pcCustomProduct").value = "";
  document.getElementById("pcQuantity").value = "";
  document.getElementById("pcUnit").value = "Nos";
  document.getElementById("pcUnitCost").value = "";
  document.getElementById("pcTotalBatchCost").textContent = "Total: Rs. 0.00";
  
  const zoneSelect = document.getElementById("pcZone");
  if (zoneSelect) zoneSelect.value = store.currentZone || "G-Zone";

  // Populate Regular Sailors Datalist for Supervisor
  populatePrecastSupervisors();

  const supervisorInput = document.getElementById("pcSupervisor");
  if (supervisorInput) {
    const regSailor = (store.sailors || []).find((s) => {
      const roll = s.roll || (s.official_number && s.official_number.startsWith("VAS") ? "VAS" : s.official_number && s.official_number.startsWith("EC") ? "EC" : "REG");
      return (roll === "REG" || roll === "Regular") && (s.official_number === store.currentUser?.official_number || s.name === store.currentUser?.name);
    });
    if (regSailor) {
      supervisorInput.value = `${regSailor.official_number || ""} ${regSailor.rank || ""} ${regSailor.name || ""} (${regSailor.trade || ""})`.trim();
    } else {
      supervisorInput.value = "";
    }
  }
  document.getElementById("pcRemarks").value = "";

  // Reset material fields
  document.getElementById("pcMatCement").value = "";
  document.getElementById("pcMatQuarryDust").value = "";
  document.getElementById("pcMatChipMetal").value = "";
  document.getElementById("pcMatMetal34").value = "";
  document.getElementById("pcMatTorSteel").value = "";
  document.getElementById("pcMatAdmixture").value = "";

  // Load and display current raw material balances
  updatePrecastStockBadges();

  // Initialize standard mix ratios
  autoCalculatePrecastRawMaterials(true);

  modal.classList.remove("hidden");
}

function updatePrecastStockBadges() {
  const findStock = (term) => {
    const item = (store.inventory || []).find((i) =>
      (i.description || "").toLowerCase().includes(term.toLowerCase())
    );
    return item ? `${item.quantity || 0} ${item.deno || ""}` : "0";
  };

  const cementEl = document.getElementById("pcStockCement");
  if (cementEl) cementEl.textContent = `Stock: ${findStock("Cement")}`;

  const qdEl = document.getElementById("pcStockQuarryDust");
  if (qdEl) qdEl.textContent = `Stock: ${findStock("Quarry") || findStock("Dust")}`;

  const chipEl = document.getElementById("pcStockChipMetal");
  if (chipEl) chipEl.textContent = `Stock: ${findStock("Chip") || findStock("1/4")}`;

  const m34El = document.getElementById("pcStockMetal34");
  if (m34El) m34El.textContent = `Stock: ${findStock("3/4") || findStock("Metal")}`;

  const torEl = document.getElementById("pcStockTorSteel");
  if (torEl) torEl.textContent = `Stock: ${findStock("TOR") || findStock("Steel") || findStock("Iron")}`;
}

function handlePrecastProductSelect(val) {
  const customEl = document.getElementById("pcCustomProduct");
  if (val === "CUSTOM") {
    customEl.classList.remove("hidden");
    customEl.required = true;
  } else {
    customEl.classList.add("hidden");
    customEl.required = false;
  }
  autoCalculatePrecastRawMaterials(true);
}

function autoCalculatePrecastRawMaterials(force = false) {
  const product = document.getElementById("pcProductSelect").value;
  const qty = parseFloat(document.getElementById("pcQuantity").value) || 0;

  // Recipe ratios per 100 units
  let rCement = 0, rQD = 0, rChip = 0, rM34 = 0, rTor = 0, rAdm = 0;

  if (product.includes("4 inch")) {
    rCement = 1.5;
    rQD = 0.12;
    rChip = 0.08;
  } else if (product.includes("6 inch")) {
    rCement = 2.2;
    rQD = 0.18;
    rChip = 0.12;
  } else if (product.includes("8 inch")) {
    rCement = 2.0;
    rQD = 0.20;
    rChip = 0.10;
  } else if (product.includes("Paving") || product.includes("Unipave") || product.includes("Zigzag")) {
    rCement = 1.8;
    rQD = 0.10;
    rChip = 0.12;
    rAdm = 0.5;
  } else if (product.includes("Curb Stone")) {
    rCement = 15.0; // 1.5 per 10
    rQD = 0.8;
    rM34 = 1.0;
  } else if (product.includes("Lintel")) {
    rCement = 15.0;
    rQD = 0.8;
    rM34 = 1.0;
    rTor = 160.0;
  } else if (product.includes("Fence Post")) {
    rCement = 12.0;
    rQD = 0.6;
    rM34 = 0.8;
    rTor = 120.0;
  } else if (product.includes("Cover Slab") || product.includes("Drain")) {
    rCement = 20.0;
    rQD = 1.0;
    rM34 = 1.2;
    rTor = 180.0;
  } else if (product.includes("Gabion")) {
    rCement = 18.0;
    rQD = 1.2;
    rChip = 1.4;
  }

  // Set ratios into editable ratio inputs
  document.getElementById("pcRatioCement").value = rCement || "";
  document.getElementById("pcRatioQuarryDust").value = rQD || "";
  document.getElementById("pcRatioChipMetal").value = rChip || "";
  document.getElementById("pcRatioMetal34").value = rM34 || "";
  document.getElementById("pcRatioTorSteel").value = rTor || "";
  document.getElementById("pcRatioAdmixture").value = rAdm || "";

  calculateEstimatedFromRatios(force);
}

function submitPrecastProduction(event) {
  event.preventDefault();

  const batchNo = document.getElementById("pcBatchNo").value.trim();
  const date = document.getElementById("pcDate").value;
  const shift = document.getElementById("pcShift").value;
  let product = document.getElementById("pcProductSelect").value;
  if (product === "CUSTOM") {
    product = document.getElementById("pcCustomProduct").value.trim();
  }
  const qty = parseFloat(document.getElementById("pcQuantity").value) || 0;
  const unit = document.getElementById("pcUnit").value.trim() || "Nos";
  const unitCost = parseFloat(document.getElementById("pcUnitCost").value) || 0;
  const zone = (document.getElementById("pcZone")?.value || store.currentZone || "G-Zone").trim();
  const supervisor = document.getElementById("pcSupervisor").value.trim();
  const remarks = document.getElementById("pcRemarks").value.trim();

  if (!product || qty <= 0) {
    showToast("Please enter a valid product and quantity", "error");
    return;
  }

  // Raw materials consumed
  const rawConsumed = {
    cement: parseFloat(document.getElementById("pcMatCement").value) || 0,
    quarry_dust: parseFloat(document.getElementById("pcMatQuarryDust").value) || 0,
    chip_metal: parseFloat(document.getElementById("pcMatChipMetal").value) || 0,
    metal_34: parseFloat(document.getElementById("pcMatMetal34").value) || 0,
    tor_steel: parseFloat(document.getElementById("pcMatTorSteel").value) || 0,
    admixture: parseFloat(document.getElementById("pcMatAdmixture").value) || 0
  };

  // 1. Deduct raw materials from inventory (zone stock)
  const deductHelper = (term, amount, unitName) => {
    if (amount <= 0) return;
    const inv = (store.inventory || []).find((i) =>
      (i.description || "").toLowerCase().includes(term.toLowerCase())
    );
    if (inv) {
      inv.quantity = Math.max(0, Math.round(((parseFloat(inv.quantity) || 0) - amount) * 100) / 100);
      if (!inv.off_charge_records) inv.off_charge_records = [];
      inv.off_charge_records.push({
        ref: `Batch: ${batchNo}`,
        qty: amount,
        date: date,
        dest: `Pre-Cast (${zone}): ${product} (${qty} ${unit})`,
        remarks: `Consumed for ${qty} ${unit} ${product} [Supervisor: ${supervisor}]`
      });
      fbSaveInventoryItem(inv);
    }
  };

  deductHelper("Cement", rawConsumed.cement, "Bags");
  deductHelper("Quarry", rawConsumed.quarry_dust, "Cubes");
  deductHelper("Chip", rawConsumed.chip_metal, "Cubes");
  deductHelper("3/4", rawConsumed.metal_34, "Cubes");
  deductHelper("TOR", rawConsumed.tor_steel, "kg");
  deductHelper("Admixture", rawConsumed.admixture, "L");

  // 2. On-charge finished precast product into zone inventory
  const prodDescLower = product.toLowerCase().trim();
  let finishedItem = (store.inventory || []).find((i) =>
    (i.description || "").toLowerCase().trim() === prodDescLower &&
    (isZoneMatch(i.zone_id || i.zone, zone) || (i.location || "").toLowerCase().includes(zone.toLowerCase()))
  );

  if (finishedItem) {
    const oldQty = parseFloat(finishedItem.quantity) || 0;
    const newQty = oldQty + qty;
    finishedItem.quantity = newQty;
    if (unitCost > 0) {
      finishedItem.cost_per_unit = unitCost;
    }
    if (!finishedItem.on_charge_records) finishedItem.on_charge_records = [];
    finishedItem.on_charge_records.push({
      date: date,
      quantity: qty,
      unit_cost: unitCost,
      zone: zone,
      supervisor: supervisor,
      source: `Pre-Cast Production Batch ${batchNo}`,
      timestamp: Date.now()
    });
    fbSaveInventoryItem(finishedItem);
  } else {
    const newItem = {
      description: product,
      category: "Pre-Cast Products",
      zone_id: zone,
      deno: unit,
      quantity: qty,
      cost_per_unit: unitCost,
      location: `${zone} - Pre-Cast Yard`,
      date_added: date,
      on_charge_ref: batchNo,
      on_charge_records: [
        {
          date: date,
          quantity: qty,
          unit_cost: unitCost,
          zone: zone,
          supervisor: supervisor,
          source: `Pre-Cast Production Batch ${batchNo}`,
          timestamp: Date.now()
        }
      ]
    };
    fbSaveInventoryItem(newItem);
  }

  // 3. Save Production Batch Log to Firebase
  const batchData = {
    batch_no: batchNo,
    date: date,
    shift: shift,
    product: product,
    quantity_produced: qty,
    unit: unit,
    unit_cost: unitCost,
    zone: zone,
    raw_materials: rawConsumed,
    supervisor: supervisor,
    remarks: remarks,
    created_at: Date.now()
  };

  opsDB.ref("precast_batches").push(batchData).then(() => {
    closeModal("precastProductionModal");
    renderInventoryTable();
    if (typeof renderPrecastInventoryTable === "function") renderPrecastInventoryTable();
    showToast(`✅ Production Batch "${batchNo}" recorded! (+${qty} ${unit} ${product} @ ${formatCurrency(unitCost)} in ${zone})`, "success", 6000);
  }).catch((err) => {
    console.error("Error saving precast batch:", err);
    showToast("Error saving production batch", "error");
  });
}

// ─────────────────────────────────────────────
// NAV 254 ISSUE VOUCHER ENGINE
// ─────────────────────────────────────────────

function openNav254Modal(targetZone = "", preselectedItemId = "") {
  const modal = document.getElementById("nav254IssueModal");
  if (!modal) return;

  const today = getLocalDateString();
  const serialNo = `NAV254/${new Date().getFullYear()}/G-${String(Date.now()).slice(-4)}`;

  document.getElementById("nav254Serial").value = serialNo;
  document.getElementById("nav254Date").value = today;
  document.getElementById("nav254IssuingUnit").value = "G Zone (Cement Pre-Cast WS)";
  document.getElementById("nav254ReceivingUnit").value = targetZone || "";
  document.getElementById("nav254CustomDest").classList.add("hidden");
  document.getElementById("nav254CustomDest").value = "";
  document.getElementById("nav254Authority").value = "";
  document.getElementById("nav254IssuedBy").value = store.currentUser?.name || "";
  document.getElementById("nav254ReceivedBy").value = "";

  // Populate CE Officers dropdown
  const authSelect = document.getElementById("nav254AuthOfficer");
  if (authSelect) {
    let opts = '<option value="">-- Select Authorizing CE Officer --</option>';
    CE_OFFICERS_PRESET.forEach((off) => {
      opts += `<option value="${off.rank} ${off.name} (${off.desig})">${off.rank} ${off.name} - ${off.desig}</option>`;
    });
    authSelect.innerHTML = opts;
  }

  // Clear and add first item row
  const tbody = document.getElementById("nav254ItemsTableBody");
  if (tbody) {
    tbody.innerHTML = "";
    addNav254ItemRow(preselectedItemId);
  }

  modal.classList.remove("hidden");
}

function handleNav254DestChange(val) {
  const customEl = document.getElementById("nav254CustomDest");
  if (val === "CUSTOM") {
    customEl.classList.remove("hidden");
    customEl.required = true;
  } else {
    customEl.classList.add("hidden");
    customEl.required = false;
  }
}

function addNav254ItemRow(preselectedItemId = "") {
  const tbody = document.getElementById("nav254ItemsTableBody");
  if (!tbody) return;

  const items = store.inventory || [];
  let itemOptions = '<option value="">-- Select Store / Pre-Cast Item --</option>';
  items.forEach((item) => {
    const iKey = item._fbKey || item.id;
    const isSelected = String(iKey) === String(preselectedItemId) ? "selected" : "";
    itemOptions += `<option value="${iKey}" data-deno="${item.deno || 'Nos'}" data-avail="${item.quantity || 0}" data-cost="${item.cost_per_unit || 0}" ${isSelected}>${item.description} (Stock: ${item.quantity || 0} ${item.deno || 'Nos'})</option>`;
  });

  const row = document.createElement("tr");
  row.className = "hover:bg-slate-50 nav254-item-row";
  row.innerHTML = `
    <td class="p-2">
      <select onchange="handleNav254ItemSelect(this)" required class="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 bg-white nav254-item-select">
        ${itemOptions}
      </select>
    </td>
    <td class="p-2 text-center">
      <input type="text" readonly class="w-full px-1.5 py-1.5 border border-slate-200 rounded-lg text-center bg-slate-100 font-semibold nav254-item-deno" value="Nos">
    </td>
    <td class="p-2 text-center">
      <input type="number" step="1" min="1" placeholder="0" class="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-center nav254-item-demanded">
    </td>
    <td class="p-2 text-center">
      <input type="number" step="0.01" min="0.01" required placeholder="Qty" class="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-center font-bold text-blue-700 nav254-item-issued">
    </td>
    <td class="p-2 text-center">
      <button type="button" onclick="removeNav254ItemRow(this)" class="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded" title="Remove Row">✕</button>
    </td>
  `;

  tbody.appendChild(row);

  if (preselectedItemId) {
    const sel = row.querySelector(".nav254-item-select");
    if (sel) handleNav254ItemSelect(sel);
  }
}

function removeNav254ItemRow(btn) {
  const row = btn.closest("tr");
  const tbody = document.getElementById("nav254ItemsTableBody");
  if (tbody && tbody.children.length > 1) {
    row.remove();
  } else {
    showToast("At least one item row is required", "error");
  }
}

function handleNav254ItemSelect(selectEl) {
  const opt = selectEl.options[selectEl.selectedIndex];
  const row = selectEl.closest("tr");
  if (!row) return;

  const deno = opt.getAttribute("data-deno") || "Nos";
  const avail = parseFloat(opt.getAttribute("data-avail")) || 0;

  const denoInput = row.querySelector(".nav254-item-deno");
  const issuedInput = row.querySelector(".nav254-item-issued");

  if (denoInput) denoInput.value = deno;
  if (issuedInput) {
    issuedInput.max = avail;
    issuedInput.placeholder = `Max ${avail}`;
  }
}

window._currentNav254Voucher = (typeof window._currentNav254Voucher !== "undefined") ? window._currentNav254Voucher : null;

function submitNav254Voucher(event) {
  event.preventDefault();

  const serialNo = document.getElementById("nav254Serial").value.trim();
  const date = document.getElementById("nav254Date").value;
  const issuingUnit = document.getElementById("nav254IssuingUnit").value.trim();
  let receivingUnit = document.getElementById("nav254ReceivingUnit").value;
  if (receivingUnit === "CUSTOM") {
    receivingUnit = document.getElementById("nav254CustomDest").value.trim();
  }
  const authority = document.getElementById("nav254Authority").value.trim();
  const authOfficer = document.getElementById("nav254AuthOfficer").value.trim();
  const issuedBy = document.getElementById("nav254IssuedBy").value.trim();
  const receivedBy = document.getElementById("nav254ReceivedBy").value.trim();

  const rows = document.querySelectorAll(".nav254-item-row");
  const items = [];

  for (let row of rows) {
    const sel = row.querySelector(".nav254-item-select");
    const itemKey = sel ? sel.value : "";
    const demanded = parseFloat(row.querySelector(".nav254-item-demanded")?.value) || 0;
    const issued = parseFloat(row.querySelector(".nav254-item-issued")?.value) || 0;
    const deno = row.querySelector(".nav254-item-deno")?.value || "Nos";

    if (!itemKey || issued <= 0) {
      showToast("Please select valid items and enter issued quantities", "error");
      return;
    }

    const invItem = (store.inventory || []).find(
      (i) => String(i._fbKey) === String(itemKey) || String(i.id) === String(itemKey)
    );

    if (invItem && issued > (parseFloat(invItem.quantity) || 0)) {
      showToast(`Cannot issue ${issued} ${deno} of "${invItem.description}" (Stock available: ${invItem.quantity})`, "error");
      return;
    }

    items.push({
      inventory_id: itemKey,
      description: invItem ? invItem.description : "Material Item",
      deno: deno,
      quantity_demanded: demanded || issued,
      quantity_issued: issued,
      unit_cost: invItem ? (invItem.cost_per_unit || 0) : 0,
      total_value: (invItem ? (invItem.cost_per_unit || 0) : 0) * issued
    });
  }

  if (items.length === 0) {
    showToast("No items added to voucher", "error");
    return;
  }

  // 1. Off-charge each issued item from inventory
  items.forEach((it) => {
    const invItem = (store.inventory || []).find(
      (i) => String(i._fbKey) === String(it.inventory_id) || String(i.id) === String(it.inventory_id)
    );
    if (invItem) {
      invItem.quantity = Math.max(0, Math.round(((parseFloat(invItem.quantity) || 0) - it.quantity_issued) * 100) / 100);
      if (!invItem.off_charge_records) invItem.off_charge_records = [];
      invItem.off_charge_records.push({
        ref: serialNo,
        qty: it.quantity_issued,
        date: date,
        dest: receivingUnit,
        remarks: `Issued via NAV 254 (${authority})`
      });
      invItem.off_charge_ref = serialNo;
      fbSaveInventoryItem(invItem);
    }
  });

  // 2. Save NAV 254 Voucher record to Firebase
  const voucherData = {
    voucher_no: serialNo,
    date: date,
    issuing_unit: issuingUnit,
    receiving_unit: receivingUnit,
    authority: authority,
    authorized_by: authOfficer,
    issued_by: issuedBy,
    received_by: receivedBy,
    items: items,
    created_at: Date.now()
  };

  const voucherKey = opsDB.ref("nav254_vouchers").push().key;

  opsDB.ref(`nav254_vouchers/${voucherKey}`).set(voucherData).then(() => {
    closeModal("nav254IssueModal");
    renderInventoryTable();
    showToast(`📜 NAV 254 Voucher "${serialNo}" generated successfully!`, "success");
    
    // Open printable NAV 254 view
    voucherData.id = voucherKey;
    _currentNav254Voucher = voucherData;
    renderNav254PrintDocument(voucherData);
    document.getElementById("nav254PrintModal").classList.remove("hidden");
  }).catch((err) => {
    console.error("Error saving NAV 254 voucher:", err);
    showToast("Error saving NAV 254 voucher", "error");
  });
}

function openNav254HistoryModal() {
  renderNav254HistoryTable();
  document.getElementById("nav254HistoryModal").classList.remove("hidden");
}

function renderNav254HistoryTable() {
  const tbody = document.getElementById("nav254HistoryTableBody");
  if (!tbody) return;

  const search = (document.getElementById("nav254HistorySearch")?.value || "").toLowerCase().trim();
  let vouchers = store.nav254Vouchers || [];

  if (search) {
    vouchers = vouchers.filter(
      (v) =>
        (v.voucher_no || "").toLowerCase().includes(search) ||
        (v.receiving_unit || "").toLowerCase().includes(search) ||
        (v.authority || "").toLowerCase().includes(search) ||
        (v.items || []).some((it) => (it.description || "").toLowerCase().includes(search))
    );
  }

  if (vouchers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="p-8 text-center text-slate-400">
          <span class="text-2xl block mb-1">📜</span>
          No NAV 254 vouchers found. Click "New NAV 254" to issue materials to other zones.
        </td>
      </tr>
    `;
    return;
  }

  // Sort descending by date
  vouchers.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  tbody.innerHTML = vouchers
    .map((v) => {
      const vKey = v._fbKey || v.id;
      const itemsSummary = (v.items || [])
        .map((it) => `<span class="inline-block bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-semibold text-slate-700 mr-1 mb-1">${it.quantity_issued} ${it.deno} ${it.description}</span>`)
        .join("");

      return `
        <tr class="hover:bg-slate-50 transition-colors">
          <td class="p-3 font-mono font-bold text-blue-700">${v.voucher_no}</td>
          <td class="p-3 text-center text-slate-600 font-medium">${v.date}</td>
          <td class="p-3 font-semibold text-slate-800">
            <span class="text-xs">🏢 ${v.receiving_unit}</span>
          </td>
          <td class="p-3 max-w-xs">
            ${itemsSummary}
          </td>
          <td class="p-3 text-slate-600 font-medium">${v.authority || "—"}</td>
          <td class="p-3 text-center whitespace-nowrap">
            <button onclick="printNav254Voucher('${vKey}')" class="p-1.5 hover:bg-blue-50 text-blue-600 rounded font-semibold text-xs mr-1" title="Print NAV 254">
              🖨️ Print
            </button>
            <button onclick="deleteNav254Voucher('${vKey}')" class="p-1.5 hover:bg-rose-50 text-rose-500 rounded font-semibold text-xs" title="Delete Voucher">
              🗑️
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

function printNav254Voucher(voucherId) {
  const v = (store.nav254Vouchers || []).find(
    (x) => String(x.id) === String(voucherId) || String(x._fbKey) === String(voucherId)
  );
  if (!v) {
    showToast("Voucher not found", "error");
    return;
  }
  _currentNav254Voucher = v;
  renderNav254PrintDocument(v);
  document.getElementById("nav254PrintModal").classList.remove("hidden");
}

function renderNav254PrintDocument(v) {
  const container = document.getElementById("nav254PrintDocument");
  if (!container || !v) return;

  const nav254Html = generateOfficialNav254Html({
    ref_no: v.voucher_no || v.ref_no,
    supplied_by: v.issuing_unit || `Civil Engineering Department (${store.currentZone})`,
    received_by: v.receiving_unit || v.target_destination || "Respective Unit",
    date: v.date,
    items: (v.items || []).map(i => ({
      description: i.description,
      deno: i.deno,
      qty_supplied: i.quantity_issued || i.qty,
      qty_received: i.quantity_demanded || i.quantity_issued || i.qty,
      total_value: i.total_value || ((parseFloat(i.unit_cost) || 0) * (parseFloat(i.quantity_issued) || 1))
    })),
    issued_to: v.received_by || v.consignee,
    trade: v.trade || "",
    issued_by: v.issued_by || "Store In-Charge",
    purpose: v.authority || "Official Naval Requirement",
    expected_return_date: v.expected_return_date || "—"
  });

  container.innerHTML = nav254Html;
}

function printCurrentNav254() {
  const content = document.getElementById("nav254PrintDocument");
  if (!content) return;
  printNav254HtmlDirect(content.innerHTML);
}

function deleteNav254Voucher(voucherId) {
  const v = (store.nav254Vouchers || []).find(
    (x) => String(x.id) === String(voucherId) || String(x._fbKey) === String(voucherId)
  );
  if (!v) return;

  if (confirm(`Are you sure you want to delete / void NAV 254 Voucher "${v.voucher_no}"?`)) {
    const vKey = v._fbKey || v.id;
    opsDB.ref(`nav254_vouchers/${vKey}`).remove().then(() => {
      showToast("NAV 254 Voucher deleted", "info");
      renderNav254HistoryTable();
    }).catch((err) => {
      console.error("Error deleting NAV 254:", err);
      showToast("Failed to delete voucher", "error");
    });
  }
}

// =============================================
// PRECAST INVENTORY & NAV 254 REGISTERS
// =============================================

function updateNav254RegisterBadge() {
  const countBadge = document.getElementById("nav254CountBadge");
  if (!countBadge) return;
  const count = (store.nav254Vouchers || []).length;
  countBadge.textContent = count;
}

function renderNav254RegisterTable() {
  const tbody = document.getElementById("nav254RegisterTableBody");
  if (!tbody) return;

  const searchVal = (document.getElementById("nav254RegisterSearch")?.value || "").toLowerCase().trim();
  const zoneFilter = document.getElementById("nav254ZoneFilter")?.value || "ALL";
  const sourceFilter = document.getElementById("nav254SourceFilter")?.value || "ALL";

  // 1. Gather all NAV 254 vouchers from store.nav254Vouchers
  let allRecords = [...(store.nav254Vouchers || [])];

  // 2. Also incorporate any legacy off-charge records in store.inventory if not already in nav254Vouchers
  (store.inventory || []).forEach((inv) => {
    if (inv.off_charge_records && Array.isArray(inv.off_charge_records)) {
      inv.off_charge_records.forEach((rec, idx) => {
        const refNo = rec.ref || `OFF-${inv.id || inv._fbKey}-${idx}`;
        const alreadyExists = allRecords.some((v) => (v.voucher_no === refNo || v.ref_no === refNo));
        if (!alreadyExists) {
          const unitPrice = parseFloat(inv.cost_per_unit || inv.cost || 0);
          allRecords.push({
            id: `synth_${inv.id || inv._fbKey}_${idx}`,
            voucher_no: refNo,
            ref_no: refNo,
            date: rec.date || getLocalDateString(),
            issuing_unit: `${inv.zone_id || store.currentZone || "Main Store"} Store`,
            receiving_unit: rec.dest || "Project / Base",
            authority: rec.ref || "Official Off-Charge",
            issued_by: "Store Keeper",
            received_by: rec.dest || "Receiver",
            items: [
              {
                inventory_id: inv._fbKey || inv.id,
                description: inv.description,
                deno: inv.deno || "Nos",
                quantity_demanded: rec.qty || 1,
                quantity_issued: rec.qty || 1,
                unit_cost: unitPrice,
                total_value: unitPrice * (rec.qty || 1)
              }
            ],
            remarks: rec.remarks || "",
            source: "Store Off-Charge",
            created_at: rec.timestamp || Date.now()
          });
        }
      });
    }
  });

  // Calculate Metrics before filtering
  let totalVouchers = allRecords.length;
  let totalItemsCount = 0;
  let totalValuation = 0;

  allRecords.forEach((v) => {
    (v.items || []).forEach((it) => {
      const q = parseFloat(it.quantity_issued || it.quantity || it.qty || 0);
      const val = parseFloat(it.total_value) || (q * (parseFloat(it.unit_cost) || 0));
      totalItemsCount += q;
      totalValuation += val;
    });
  });

  const kpiVouchers = document.getElementById("reg254TotalVouchers");
  if (kpiVouchers) kpiVouchers.textContent = `${totalVouchers} Vouchers`;

  const kpiItems = document.getElementById("reg254TotalItems");
  if (kpiItems) kpiItems.textContent = `${totalItemsCount.toLocaleString()} Units`;

  const kpiValue = document.getElementById("reg254TotalValue");
  if (kpiValue) kpiValue.textContent = formatCurrency(totalValuation);

  updateNav254RegisterBadge();

  // Filter Records
  let filtered = allRecords.filter((v) => {
    // Zone filter
    if (zoneFilter !== "ALL") {
      const matchIssuing = isZoneMatch(v.issuing_unit, zoneFilter) || (v.issuing_unit || "").toLowerCase().includes(zoneFilter.toLowerCase());
      const matchReceiving = isZoneMatch(v.receiving_unit, zoneFilter) || (v.receiving_unit || "").toLowerCase().includes(zoneFilter.toLowerCase());
      if (!matchIssuing && !matchReceiving) return false;
    }

    // Source filter
    if (sourceFilter !== "ALL") {
      const src = v.source || (v.voucher_no && v.voucher_no.startsWith("NAV") ? "NAV 254 Voucher" : "Store Off-Charge");
      if (sourceFilter === "NAV 254 Voucher" && !src.includes("NAV")) return false;
      if (sourceFilter === "Store Off-Charge" && !src.includes("Off-Charge")) return false;
      if (sourceFilter === "TIB Issue" && !src.includes("TIB")) return false;
    }

    // Search filter
    if (searchVal) {
      const vNo = (v.voucher_no || v.ref_no || "").toLowerCase();
      const iss = (v.issuing_unit || "").toLowerCase();
      const rec = (v.receiving_unit || "").toLowerCase();
      const auth = (v.authority || "").toLowerCase();
      const by = (v.issued_by || "").toLowerCase();
      const rBy = (v.received_by || "").toLowerCase();
      const itemsMatch = (v.items || []).some((it) => (it.description || "").toLowerCase().includes(searchVal));
      if (!vNo.includes(searchVal) && !iss.includes(searchVal) && !rec.includes(searchVal) && !auth.includes(searchVal) && !by.includes(searchVal) && !rBy.includes(searchVal) && !itemsMatch) {
        return false;
      }
    }
    return true;
  });

  // Sort descending by date / created_at
  filtered.sort((a, b) => {
    const tA = a.created_at || (a.date ? new Date(a.date).getTime() : 0);
    const tB = b.created_at || (b.date ? new Date(b.date).getTime() : 0);
    return tB - tA;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-slate-400 font-medium italic">No NAV 254 or Off-Charge vouchers match the search criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((v) => {
    const vId = v.id || v._fbKey || v.voucher_no || "";
    const itemsList = v.items || [];
    const totalVal = itemsList.reduce((sum, it) => sum + (parseFloat(it.total_value) || ((parseFloat(it.quantity_issued || it.qty || 0)) * (parseFloat(it.unit_cost) || 0))), 0);
    const itemsSummaryHtml = itemsList.map((it) => `
      <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-medium border border-slate-200 mr-1 mb-1">
        <span>📦</span>
        <strong class="font-bold">${it.description}</strong>
        <span class="text-indigo-700 font-mono font-bold">(${it.quantity_issued || it.qty || 0} ${it.deno || "Nos"})</span>
      </div>
    `).join("");

    const srcBadge = v.source === "Store Off-Charge"
      ? `<span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">Store Off-Charge</span>`
      : `<span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">NAV 254 Official</span>`;

    return `
      <tr class="hover:bg-amber-50/30 transition-colors">
        <td class="px-3.5 py-3 align-top whitespace-nowrap">
          <div class="font-mono font-black text-xs text-amber-950">${v.voucher_no || v.ref_no || "NAV254"}</div>
          <div class="text-[10px] text-slate-400 font-mono mt-0.5">📅 ${v.date || "—"}</div>
          <div class="mt-1">${srcBadge}</div>
        </td>
        <td class="px-3.5 py-3 align-top">
          <div class="font-bold text-xs text-slate-800 flex items-center gap-1">
            <span>🏬</span> ${v.issuing_unit || "Main Store"}
          </div>
          <div class="text-[10px] text-slate-500 font-mono mt-0.5">Auth: ${v.authority || "Official"}</div>
        </td>
        <td class="px-3.5 py-3 align-top">
          <div class="font-bold text-xs text-indigo-900 flex items-center gap-1">
            <span>📍</span> ${v.receiving_unit || "—"}
          </div>
          ${v.received_by ? `<div class="text-[10px] text-slate-500 mt-0.5">Recv: ${v.received_by}</div>` : ""}
        </td>
        <td class="px-3.5 py-3 align-top max-w-xs">
          <div class="flex flex-wrap">${itemsSummaryHtml || '<span class="text-slate-400 italic">No item records</span>'}</div>
        </td>
        <td class="px-3.5 py-3 align-top text-right font-mono font-black text-emerald-700 whitespace-nowrap">
          ${formatCurrency(totalVal)}
        </td>
        <td class="px-3.5 py-3 align-top">
          <div class="font-semibold text-xs text-slate-800">${v.issued_by || "Store In-Charge"}</div>
          ${v.authorized_by ? `<div class="text-[10px] text-slate-500 mt-0.5">Approved: ${v.authorized_by}</div>` : ""}
        </td>
        <td class="px-3.5 py-3 align-top text-center whitespace-nowrap">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
            <span>☁️</span> Recorded
          </span>
        </td>
        <td class="px-3.5 py-3 align-top text-center whitespace-nowrap">
          <div class="flex items-center justify-center gap-1">
            <button onclick="viewOrPrintNav254FromRegister('${vId}')" class="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-all flex items-center gap-1 cursor-pointer" title="View / Print Official NAV 254 Slip">
              <span>🖨️</span> Print Slip
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function viewOrPrintNav254FromRegister(vId) {
  let v = (store.nav254Vouchers || []).find((x) => String(x.id) === String(vId) || String(x._fbKey) === String(vId) || String(x.voucher_no) === String(vId));
  
  if (!v) {
    // Try finding in inventory off-charge records
    (store.inventory || []).forEach((inv) => {
      (inv.off_charge_records || []).forEach((rec, idx) => {
        const refNo = rec.ref || `OFF-${inv.id || inv._fbKey}-${idx}`;
        if (refNo === vId || `synth_${inv.id || inv._fbKey}_${idx}` === vId) {
          const unitPrice = parseFloat(inv.cost_per_unit || inv.cost || 0);
          v = {
            voucher_no: refNo,
            ref_no: refNo,
            date: rec.date || getLocalDateString(),
            issuing_unit: `${inv.zone_id || store.currentZone || "Main Store"} Store`,
            receiving_unit: rec.dest || "Project / Base",
            authority: rec.ref || "Official Off-Charge",
            issued_by: "Store Keeper",
            received_by: rec.dest || "Receiver",
            items: [
              {
                description: inv.description,
                deno: inv.deno || "Nos",
                quantity_demanded: rec.qty || 1,
                quantity_issued: rec.qty || 1,
                unit_cost: unitPrice,
                total_value: unitPrice * (rec.qty || 1)
              }
            ],
            remarks: rec.remarks || ""
          };
        }
      });
    });
  }

  if (v) {
    _currentNav254Voucher = v;
    renderNav254PrintDocument(v);
    document.getElementById("nav254PrintModal")?.classList.remove("hidden");
  } else {
    showToast("Voucher details not found", "error");
  }
}

function renderPrecastInventoryTable() {
  const tbody = document.getElementById("precastInventoryTableBody");
  if (!tbody) return;

  const searchVal = (document.getElementById("precastInventorySearch")?.value || "").toLowerCase().trim();

  // Find all items related to precast
  const isPrecastProduct = (item) => {
    if (!item) return false;
    const desc = (item.description || "").toLowerCase();
    const cat = (item.category || "").toLowerCase();
    const loc = (item.location || "").toLowerCase();
    if (cat.includes("pre-cast") || cat.includes("precast")) return true;
    if (loc.includes("pre-cast") || loc.includes("precast") || loc.includes("g zone") || loc.includes("g-zone")) return true;
    return /cement block|paving|lintel|fence post|curb stone|drain cover|solid block|kerb|concrete ring|unipave|zigzag/i.test(desc);
  };

  const rawInv = store.inventory || [];
  let precastItems = rawInv.filter(isPrecastProduct);

  // If no items in database yet, provide standard default precast catalogue
  if (precastItems.length === 0) {
    const defaults = [
      { description: "4 inch Cement Solid Block", category: "Pre-Cast Products", deno: "Nos", quantity: 0, cost_per_unit: 85, zone_id: "G-Zone", location: "G Zone - Pre-Cast Yard" },
      { description: "6 inch Cement Solid Block", category: "Pre-Cast Products", deno: "Nos", quantity: 0, cost_per_unit: 120, zone_id: "G-Zone", location: "G Zone - Pre-Cast Yard" },
      { description: "8 inch Cement Solid Block", category: "Pre-Cast Products", deno: "Nos", quantity: 0, cost_per_unit: 160, zone_id: "G-Zone", location: "G Zone - Pre-Cast Yard" },
      { description: "Paving Blocks (Unipave / Rectangular)", category: "Pre-Cast Products", deno: "Nos", quantity: 0, cost_per_unit: 65, zone_id: "G-Zone", location: "G Zone - Pre-Cast Yard" },
      { description: "Pre-Cast Concrete Lintel (4' x 9\")", category: "Pre-Cast Products", deno: "Nos", quantity: 0, cost_per_unit: 850, zone_id: "G-Zone", location: "G Zone - Pre-Cast Yard" },
      { description: "Pre-Cast Concrete Fence Post (6' R/C)", category: "Pre-Cast Products", deno: "Nos", quantity: 0, cost_per_unit: 950, zone_id: "G-Zone", location: "G Zone - Pre-Cast Yard" },
      { description: "Pre-Cast Concrete Curb Stone", category: "Pre-Cast Products", deno: "Nos", quantity: 0, cost_per_unit: 620, zone_id: "G-Zone", location: "G Zone - Pre-Cast Yard" },
      { description: "Pre-Cast Drain Cover Slab (2' x 1.5')", category: "Pre-Cast Products", deno: "Nos", quantity: 0, cost_per_unit: 780, zone_id: "G-Zone", location: "G Zone - Pre-Cast Yard" }
    ];
    precastItems = defaults;
  }

  // Calculate KPIs
  let totalStock = 0;
  let productsWithStock = 0;
  precastItems.forEach((i) => {
    const q = parseFloat(i.quantity) || 0;
    totalStock += q;
    if (q > 0) productsWithStock++;
  });

  const cementItem = rawInv.find((i) => (i.description || "").toLowerCase().includes("cement") && !(i.description || "").toLowerCase().includes("block"));
  const cementBags = cementItem ? (cementItem.quantity || 0) : 0;
  const navDispatchedCount = (store.nav254Vouchers || []).length;

  const kpiTotalStock = document.getElementById("pcKpiTotalStock");
  if (kpiTotalStock) kpiTotalStock.textContent = `${totalStock.toLocaleString()} Nos`;

  const kpiProdCount = document.getElementById("pcKpiProductsCount");
  if (kpiProdCount) kpiProdCount.textContent = `${precastItems.length} Records (${productsWithStock} Active)`;

  const kpiNavDisp = document.getElementById("pcKpiNavDispatched");
  if (kpiNavDisp) kpiNavDisp.textContent = `${navDispatchedCount} Vouchers`;

  const kpiRawCement = document.getElementById("pcKpiRawCement");
  if (kpiRawCement) kpiRawCement.textContent = `${cementBags} Bags`;

  // Search Filter
  if (searchVal) {
    precastItems = precastItems.filter((i) =>
      (i.description || "").toLowerCase().includes(searchVal) ||
      (i.location || "").toLowerCase().includes(searchVal) ||
      (i.zone_id || "").toLowerCase().includes(searchVal) ||
      (i.category || "").toLowerCase().includes(searchVal)
    );
  }

  if (precastItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-slate-400 font-medium italic">No precast items match your search.</td></tr>`;
    return;
  }

  // Group items merged according to Item Description
  const groupedMap = new Map();
  precastItems.forEach((item) => {
    const key = (item.description || "").trim().toLowerCase();
    if (!groupedMap.has(key)) {
      groupedMap.set(key, {
        description: item.description,
        category: item.category || "Pre-Cast Products",
        deno: item.deno || "Nos",
        entries: [],
      });
    }
    groupedMap.get(key).entries.push(item);
  });

  let rowsHtml = "";

  groupedMap.forEach((group) => {
    const totalGroupQty = group.entries.reduce((sum, e) => sum + (parseFloat(e.quantity) || 0), 0);
    const totalGroupVal = group.entries.reduce((sum, e) => sum + ((parseFloat(e.quantity) || 0) * (parseFloat(e.cost_per_unit || e.cost || 0))), 0);
    const avgUnitCost = totalGroupQty > 0 ? (totalGroupVal / totalGroupQty) : (parseFloat(group.entries[0]?.cost_per_unit || group.entries[0]?.cost || 0));

    const totalStockColor = totalGroupQty > 50 ? "bg-emerald-100 text-emerald-800 border-emerald-300" : (totalGroupQty > 0 ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-rose-100 text-rose-800 border-rose-300");

    const hasMultipleZones = group.entries.length > 1;

    // Main Merged Row for Item Description
    rowsHtml += `
      <tr class="bg-slate-50/90 font-semibold border-t-2 border-slate-200">
        <td class="px-3.5 py-3">
          <div class="font-extrabold text-slate-900 flex items-center gap-2 text-xs">
            <span class="text-base">🧱</span>
            <span>${group.description}</span>
            ${hasMultipleZones ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">${group.entries.length} Zones</span>` : ''}
          </div>
          <div class="text-[10px] text-slate-400 font-mono mt-0.5">Total across all workshops: <strong class="text-slate-700">${totalGroupQty.toLocaleString()} ${group.deno}</strong></div>
        </td>
        <td class="px-3.5 py-3 text-center">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            ${group.category}
          </span>
        </td>
        <td class="px-3.5 py-3 text-center text-xs text-slate-600 font-bold">
          ${hasMultipleZones ? `<span>🌐 Combined Stock</span>` : `📍 ${group.entries[0]?.zone_id || group.entries[0]?.location || "G-Zone"}`}
        </td>
        <td class="px-3.5 py-3 text-center">
          <span class="px-2.5 py-1 rounded-lg text-xs font-mono font-black border ${totalStockColor}">
            ${totalGroupQty.toLocaleString()} ${group.deno}
          </span>
        </td>
        <td class="px-3.5 py-3 text-right font-bold text-slate-800 text-xs">
          ${formatCurrency(avgUnitCost)}
        </td>
        <td class="px-3.5 py-3 text-right font-black text-emerald-800 text-xs">
          ${formatCurrency(totalGroupVal)}
        </td>
        <td class="px-3.5 py-3 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button onclick="openPrecastProductionModal(); document.getElementById('pcProductSelect').value='${group.description.replace(/'/g, "\\'")}'; autoCalculatePrecastRawMaterials();" class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-xs cursor-pointer flex items-center gap-1" title="Log new production batch">
              <span>➕ Batch</span>
            </button>
            <button onclick="openNav254Modal();" class="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] shadow-xs cursor-pointer flex items-center gap-1" title="Issue via NAV 254 Voucher">
              <span>📜 Issue</span>
            </button>
          </div>
        </td>
      </tr>
    `;

    // If multiple zone entries (or even single detailed entry), render clean breakdown rows
    group.entries.forEach((entry) => {
      const eQty = parseFloat(entry.quantity) || 0;
      const eUnitCost = parseFloat(entry.cost_per_unit || entry.cost || 0);
      const eTotalVal = eQty * eUnitCost;
      const eItemId = entry.id || entry._fbKey || "";
      const zoneName = entry.zone_id || (entry.location && entry.location.split("-")[0].trim()) || "G-Zone";

      const zonePillColors = {
        "G-Zone": "bg-amber-100 text-amber-900 border-amber-300",
        "A-Zone": "bg-blue-100 text-blue-900 border-blue-300",
        "B-Zone": "bg-emerald-100 text-emerald-900 border-emerald-300",
        "C-Zone": "bg-purple-100 text-purple-900 border-purple-300",
        "D-Zone": "bg-teal-100 text-teal-900 border-teal-300",
        "E-Zone": "bg-rose-100 text-rose-900 border-rose-300",
        "FH-Zone": "bg-cyan-100 text-cyan-900 border-cyan-300"
      };
      const zonePillClass = zonePillColors[zoneName] || "bg-slate-100 text-slate-800 border-slate-300";

      rowsHtml += `
        <tr class="hover:bg-teal-50/40 transition-colors border-b border-slate-100 bg-white text-xs">
          <td class="px-3.5 py-2.5 pl-8 text-slate-700">
            <div class="flex items-center gap-2">
              <span class="text-slate-400">↳</span>
              <span class="font-medium">${entry.location || `${zoneName} Pre-Cast Store`}</span>
              <span class="text-[10px] text-slate-400 font-mono">(${entry.on_charge_ref || "Stock"})</span>
            </div>
          </td>
          <td class="px-3.5 py-2.5 text-center text-slate-400 text-[11px]">—</td>
          <td class="px-3.5 py-2.5 text-center">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black border ${zonePillClass}">
              📍 ${zoneName}
            </span>
          </td>
          <td class="px-3.5 py-2.5 text-center font-mono font-bold ${eQty > 0 ? 'text-slate-800' : 'text-slate-400'}">
            ${eQty.toLocaleString()} ${group.deno}
          </td>
          <td class="px-3.5 py-2.5 text-right font-mono">
            ${eItemId ? `
            <button onclick="quickEditUnitCost('${eItemId}', event)" class="font-semibold text-slate-700 hover:text-emerald-700 hover:underline cursor-pointer" title="Click to edit unit price for this zone">
              ${formatCurrency(eUnitCost)} ✏️
            </button>
            ` : `
            <span class="font-semibold text-slate-700">${formatCurrency(eUnitCost)}</span>
            `}
          </td>
          <td class="px-3.5 py-2.5 text-right font-mono font-semibold text-emerald-700">
            ${formatCurrency(eTotalVal)}
          </td>
          <td class="px-3.5 py-2.5 text-center">
            ${eItemId ? `
            <button onclick="openInventoryCard('${eItemId}')" class="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-[10px] font-bold cursor-pointer transition-all" title="View Zone Stock Card">
              📋 Card
            </button>
            ` : ''}
          </td>
        </tr>
      `;
    });
  });

  tbody.innerHTML = rowsHtml;
}

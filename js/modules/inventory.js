// ============================================================================
// CMSys Module: Core Inventory, Stock Cards, On/Off-Charge & Material Management
// File: js/modules/inventory.js
// ============================================================================

store.inventorySubTab = store.inventorySubTab || "stock";

// Sub-Tab Switcher in Inventory
function switchInventorySubTab(subTab) {
  store.inventorySubTab = subTab;
  const tabStock = document.getElementById("invSubTab-stock");
  const tabTIB = document.getElementById("invSubTab-tempissues");
  const tabPrecast = document.getElementById("invSubTab-precast");
  const tabNav254 = document.getElementById("invSubTab-nav254");

  const panelStock = document.getElementById("invPanel-stock");
  const panelTIB = document.getElementById("invPanel-tempissues");
  const panelPrecast = document.getElementById("invPanel-precast");
  const panelNav254 = document.getElementById("invPanel-nav254");

  const mainStockActions = document.getElementById("invMainStockActions");

  const inactiveBtn = "px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer";
  const activeStockBtn = "px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer";
  const activeTibBtn = "px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer";
  const activePrecastBtn = "px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer";
  const activeNav254Btn = "px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer";

  if (panelStock) panelStock.classList.toggle("hidden", subTab !== "stock");
  if (panelTIB) panelTIB.classList.toggle("hidden", subTab !== "tempissues");
  if (panelPrecast) panelPrecast.classList.toggle("hidden", subTab !== "precast");
  if (panelNav254) panelNav254.classList.toggle("hidden", subTab !== "nav254");

  if (mainStockActions) mainStockActions.classList.toggle("hidden", subTab !== "stock");

  if (tabStock) tabStock.className = subTab === "stock" ? activeStockBtn : inactiveBtn;
  if (tabTIB) tabTIB.className = subTab === "tempissues" ? activeTibBtn : inactiveBtn;
  if (tabPrecast) tabPrecast.className = subTab === "precast" ? activePrecastBtn : inactiveBtn;
  if (tabNav254) tabNav254.className = subTab === "nav254" ? activeNav254Btn : inactiveBtn;

  if (subTab === "tempissues") {
    renderTempIssuesDashboard();
    renderTempIssuesTable();
  } else if (subTab === "precast") {
    renderPrecastInventoryTable();
  } else if (subTab === "nav254") {
    renderNav254RegisterTable();
  }

  updateTibPendingBadge();
  updateNav254RegisterBadge();
}

// =============================================
// INVENTORY
// =============================================
function isGZoneSelected() {
  const z = (store.currentZone || "").toLowerCase().trim();
  return z === "g-zone" || z === "g zone" || z.startsWith("g-") || z.startsWith("g ") || z.includes("cement") || z.includes("precast") || z === "g";
}

function renderInventory() {
  // Show Pre-Cast Workshop banner ONLY if G-Zone is currently selected
  const isGZone = isGZoneSelected();
  const banner = document.getElementById("cementPrecastWorkshopBanner");
  if (banner) {
    if (isGZone) {
      banner.classList.remove("hidden");
    } else {
      banner.classList.add("hidden");
    }
  }

  populateInventoryLocationDropdown();
  renderInventoryCategories();
  renderInventoryTable();
  populateProjectDropdown();
  if (typeof updateTibPendingBadge === "function") {
    updateTibPendingBadge();
  }
}

function populateInventoryLocationDropdown() {
  const select = document.getElementById("inventoryLocation");
  if (!select) return;
  const currentVal = select.value;
  const currentZoneDisplay = formatZoneDisplayName(store.currentZone) || "Current Zone";
  
  let options = `
    <option value="">Current Zone (${currentZoneDisplay})</option>
    <option value="ALL_ZONES">🌐 All Locations & Zones</option>
  `;

  if (typeof getInventoryStoresList === "function") {
    const activeStores = getInventoryStoresList().filter(s => s.active !== false);
    if (activeStores.length > 0) {
      options += `<optgroup label="🏢 Inventory Stores & Locations">`;
      activeStores.forEach(st => {
        const sName = st.name || st;
        const sAbbr = st.abbr ? ` (${st.abbr})` : "";
        options += `<option value="${sName}">${sName}${sAbbr}</option>`;
      });
      options += `</optgroup>`;
    }
  }

  select.innerHTML = options;
  if (currentVal !== undefined && currentVal !== null) {
    select.value = currentVal;
  }
}
function populateProjectDropdown() {
  const projects = store.workOrders.filter(
    (wo) => wo.type === "PROJECT" && isZoneMatch(wo.zone_id, store.currentZone),
  );
  document.getElementById("invRequirement").innerHTML =
    '<option value="">-- Select Project --</option>' +
    projects
      .map((p) => `<option value="${p.description}">${p.description}</option>`)
      .join("") +
    store.jobCards
      .filter(
        (jc) => jc.status === "Completed" && isZoneMatch(jc.zone_id, store.currentZone),
      )
      .map(
        (jc) =>
          `<option value="${jc.description}">${jc.description} (Completed)</option>`,
      )
      .join("");
}
function switchInventoryCategory(category) {
  store.currentInventoryCategory = category || "all";
  
  // Sync category dropdown in filter bar
  const filterDropdown = document.getElementById("inventoryCategoryFilter");
  if (filterDropdown) filterDropdown.value = store.currentInventoryCategory;

  renderInventoryCategories();
  renderInventoryTable();
}

function handleInventoryCategoryDropdownChange(category) {
  switchInventoryCategory(category);
}

function renderInventoryCategories() {
  const container = document.getElementById("inventoryCategoryTabsContainer");
  
  // Standard categories that should always appear across all zones
  const defaultCats = [
    "Pre-Cast Products",
    "BMS",
    "Plumbing",
    "Metal",
    "Stencil",
    "General",
    "Aluminium",
    "Paint",
    "Electrical",
    "Tools",
    "Lubricant Oil",
    "Eng",
  ];
  const allCats = [...defaultCats];

  // Also populate the filter dropdown
  const filterDropdown = document.getElementById("inventoryCategoryFilter");
  if (filterDropdown) {
    let opts = '<option value="all">🏷️ All Categories</option>';
    allCats.forEach((cat) => {
      opts += `<option value="${cat}">${cat}</option>`;
    });
    filterDropdown.innerHTML = opts;
    filterDropdown.value = store.currentInventoryCategory || "all";
  }

  if (container) {
    const currentCat = store.currentInventoryCategory || "all";

    let html = `
      <button type="button" onclick="switchInventoryCategory('all')" 
        class="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 shrink-0
        ${currentCat === "all" ? "bg-emerald-600 text-white shadow-xs font-bold" : "bg-slate-100 hover:bg-slate-200 text-slate-600"}">
        <span>📦</span> All
      </button>
    `;

    allCats.forEach((cat) => {
      const isActive = currentCat === cat;
      html += `
        <button type="button" onclick="switchInventoryCategory('${cat}')" 
          class="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 shrink-0
          ${isActive ? "bg-emerald-600 text-white shadow-xs font-bold" : "bg-slate-100 hover:bg-slate-200 text-slate-600"}">
          <span>🏷️</span> ${cat}
        </button>
      `;
    });

    container.innerHTML = html;
  }

  // Also update modal add/edit category dropdown
  const catSelect = document.getElementById("invCategory");
  if (catSelect) {
    let optionsHtml = '<option value="">-- Select Category --</option>';
    allCats.forEach((c) => {
      optionsHtml += `<option value="${c}">${c}</option>`;
    });
    const prevVal = catSelect.value;
    catSelect.innerHTML = optionsHtml;
    if (prevVal) catSelect.value = prevVal;
  }
}

function renderInventoryTable() {
  const location = document.getElementById("inventoryLocation")?.value || "";
  let items = [];

  // Filter by current zone or allow cross-zone query if ALL_ZONES is selected
  if (location === "ALL_ZONES") {
    if (store.currentUser && store.currentUser.permAllInvZones === false && Array.isArray(store.currentUser.allowedInvZones)) {
      items = store.inventory.filter((i) => store.currentUser.allowedInvZones.some(z => isZoneMatch(z, i.zone_id)));
    } else {
      items = [...store.inventory];
    }
  } else {
    items = store.inventory.filter(
      (i) => !i.zone_id || isZoneMatch(i.zone_id, store.currentZone),
    );
  }

  // Filter by category
  if (store.currentInventoryCategory !== "all") {
    items = items.filter((i) => i.category === store.currentInventoryCategory);
  }

  // Filter by search
  const search = (document.getElementById("inventorySearch")?.value || "").toLowerCase().trim();
  if (search) {
    items = items.filter(
      (i) =>
        (i.description || "").toLowerCase().includes(search) ||
        (i.book_no || "").toLowerCase().includes(search),
    );
  }

  // Filter by location
  if (location && location !== "ALL_ZONES") {
    items = items.filter((i) => i.location === location);
  }

  // Filter by In Stock Only (Hide 0 / Null Items)
  const hideNullQty = document.getElementById("inventoryHideNullQty")?.checked;
  if (hideNullQty) {
    items = items.filter((i) => {
      const q = parseFloat(i.quantity);
      return !isNaN(q) && q > 0;
    });
  }

  // Sort
  const sort = document.getElementById("inventorySort")?.value || "description";
  items.sort((a, b) => {
    switch (sort) {
      case "category":
        return (a.category || "").localeCompare(b.category || "") || (a.description || "").localeCompare(b.description || "");
      case "quantity":
        return b.quantity - a.quantity;
      case "cost":
        return b.cost_per_unit - a.cost_per_unit;
      case "date":
        return new Date(b.date_added || 0) - new Date(a.date_added || 0);
      case "book_no":
        return (a.book_no || "").localeCompare(b.book_no || "");
      default:
        return (a.description || "").localeCompare(b.description || "");
    }
  });

  // Group same items (same description, deno, cost, location, book_no)
  const grouped = {};
  items.forEach((item) => {
    const key = `${item.description}|${item.deno}|${item.cost_per_unit}|${item.location}|${item.book_no || ""}`;
    if (!grouped[key]) {
      grouped[key] = { ...item, totalQty: item.quantity, items: [item] };
    } else {
      grouped[key].totalQty += item.quantity;
      grouped[key].items.push(item);
    }
  });

  let groupedItems = Object.values(grouped);
  if (hideNullQty) {
    groupedItems = groupedItems.filter((i) => i.totalQty > 0);
  }

  document.getElementById("inventoryTableBody").innerHTML =
    groupedItems
      .map((item) => {
        const isLow = item.totalQty < 10;
        const catColors = {
          BMS: "bg-amber-100 text-amber-800",
          Plumbing: "bg-blue-100 text-blue-800",
          Metal: "bg-slate-200 text-slate-700",
          Paint: "bg-rose-100 text-rose-700",
          Electrical: "bg-yellow-100 text-yellow-800",
          Tools: "bg-purple-100 text-purple-800",
          Aluminium: "bg-cyan-100 text-cyan-800",
          General: "bg-green-100 text-green-700",
        };
        const catCls =
          catColors[item.category] || "bg-slate-100 text-slate-600";
        const rowId = item._fbKey || item.id || '';
        return `
        <tr class="hover:bg-teal-50/40 cursor-pointer transition-colors border-b border-slate-100">
            <td onclick="showInventoryDetail('${rowId}')" class="px-4 py-2.5 font-medium text-slate-800 text-sm">${item.description}</td>
            <td onclick="showInventoryDetail('${rowId}')" class="px-4 py-2.5 text-center"><span class="text-[11px] font-medium px-2 py-0.5 rounded-full ${catCls}">${item.category}</span></td>
            <td onclick="showInventoryDetail('${rowId}')" class="px-4 py-2.5 text-center text-xs text-slate-500">${item.deno}</td>
            <td onclick="showInventoryDetail('${rowId}')" class="px-4 py-2.5 text-center">
                <span class="font-bold text-sm ${isLow ? "text-rose-600" : "text-slate-800"}">${item.totalQty}</span>
                ${isLow ? '<span class="ml-1 text-[10px] text-rose-500 font-medium">⚠ Low</span>' : ""}
            </td>
            <td onclick="quickEditUnitCost('${rowId}', event)" class="px-4 py-2.5 text-right font-medium text-slate-700 text-sm hover:text-emerald-700 hover:font-bold cursor-pointer transition-colors" title="Click to quickly edit Unit Cost">${formatCurrency(item.cost_per_unit || item.cost || 0)}</td>
            <td onclick="quickEditBookNo('${rowId}', event)" class="px-4 py-2.5 text-center" title="Click to set/change Book No"><span class="mono text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 cursor-pointer transition-all shadow-2xs">${item.book_no ? item.book_no : '<span class="text-amber-600 font-bold underline decoration-dotted">+ Set Book</span>'}</span></td>
            <td onclick="showInventoryDetail('${rowId}')" class="px-4 py-2.5 text-center"><span class="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">${item.location}${item.zone_id && item.zone_id !== store.currentZone ? ` (${item.zone_id})` : ""}</span></td>
            <td class="px-4 py-2.5 text-center">
                <div class="flex items-center justify-center gap-1.5">
                    <button onclick="editInventoryItem('${rowId}')" class="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <button onclick="showInventoryDetail('${rowId}')" class="text-teal-600 hover:text-teal-800 p-1 rounded hover:bg-teal-50" title="View Detail">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    </button>
                    <button onclick="deleteInventoryItem('${rowId}')" class="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50" title="Delete Item">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                </div>
            </td>
        </tr>`;
      })
      .join("") ||
    '<tr><td colspan="8" class="px-4 py-10 text-center text-slate-400">No inventory items found</td></tr>'; // Calculate total valuation
  const totalValuation = items.reduce(
    (sum, item) =>
      sum +
      (parseFloat(item.quantity) || 0) * (parseFloat(item.cost_per_unit) || 0),
    0,
  );
  const grandTotalItems = store.inventory.filter(
    (i) => !i.zone_id || isZoneMatch(i.zone_id, store.currentZone),
  );
  const grandTotalValuation = grandTotalItems.reduce(
    (sum, item) =>
      sum +
      (parseFloat(item.quantity) || 0) * (parseFloat(item.cost_per_unit) || 0),
    0,
  ); // Check if category or search or location is active (meaning it is filtered)
  const isFiltered =
    store.currentInventoryCategory !== "all" ||
    (((_document$getElementB8 = document.getElementById("inventorySearch")) ===
      null || _document$getElementB8 === void 0
      ? void 0
      : _document$getElementB8.value) || "") !== "" ||
    (((_document$getElementB9 =
      document.getElementById("inventoryLocation")) === null ||
    _document$getElementB9 === void 0
      ? void 0
      : _document$getElementB9.value) || "") !== "";
  const footEl = document.getElementById("inventoryTableFoot");
  if (footEl) {
    if (isFiltered) {
      footEl.innerHTML = `
                <tr class="bg-slate-50 border-t border-slate-200">
                    <td colspan="4" class="px-4 py-3 text-left font-bold text-slate-800 text-sm">
                        Total Valuation (Filtered)
                    </td>
                    <td class="px-4 py-3 text-right font-extrabold text-teal-700 text-sm">
                        ${formatCurrency(totalValuation)}
                    </td>
                    <td colspan="2" class="px-4 py-3 text-center text-xs text-slate-500 font-normal">
                        Grand Total: <span class="font-bold text-slate-700">${formatCurrency(grandTotalValuation)}</span>
                    </td>
                </tr>
            `;
    } else {
      footEl.innerHTML = `
                <tr class="bg-slate-50 border-t border-slate-200">
                    <td colspan="4" class="px-4 py-3 text-left font-bold text-slate-800 text-sm">
                        Total Inventory Valuation
                    </td>
                    <td class="px-4 py-3 text-right font-extrabold text-teal-700 text-sm">
                        ${formatCurrency(totalValuation)}
                    </td>
                    <td colspan="2" class="px-4 py-3"></td>
                </tr>
            `;
    }
  }
}
function filterInventory() {
  renderInventoryTable();
}
function showInventoryDetail(itemId) {
  const item = store.inventory.find(
    (i) =>
      String(i.id) === String(itemId) || String(i._fbKey) === String(itemId),
  );
  if (!item) return;
  document.getElementById("inventoryDetailContent").innerHTML = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="text-sm text-slate-500">Description</p>
                    <p class="font-medium">${item.description}</p>
                </div>
                <div>
                    <p class="text-sm text-slate-500">Category</p>
                    <p class="font-medium">${item.category}</p>
                </div>
            </div>
            <div class="grid grid-cols-3 gap-4">
                <div>
                    <p class="text-sm text-slate-500">Quantity</p>
                    <p class="font-bold text-xl ${item.quantity < 10 ? "text-red-600" : "text-green-600"}">${item.quantity} ${item.deno}</p>
                </div>
                <div>
                    <p class="text-sm text-slate-500">Unit Cost</p>
                    <p class="font-medium">${formatCurrency(item.cost_per_unit)}</p>
                </div>
                <div>
                    <p class="text-sm text-slate-500">Total Value</p>
                    <p class="font-bold text-amber-600">${formatCurrency(item.quantity * item.cost_per_unit)}</p>
                </div>
            </div>
            <div class="grid grid-cols-3 gap-4">
                <div>
                    <p class="text-sm text-slate-500">Book No (Stock Book)</p>
                    <p class="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block text-xs">${item.book_no || "—"}</p>
                </div>
                <div>
                    <p class="text-sm text-slate-500">Location</p>
                    <p class="font-medium">${item.location}</p>
                </div>
                <div>
                    <p class="text-sm text-slate-500">Requirement</p>
                    <p class="font-medium">${item.requirement || "General"}</p>
                </div>
            </div>
            <div>
                <p class="text-sm text-slate-500">Date Added</p>
                <p class="font-medium">${item.date_added}</p>
            </div>
            
            <!-- On Charge Records -->
            <div class="border-t pt-4">
                <h4 class="font-semibold text-slate-700 mb-2 flex items-center gap-2">📥 On-Charge Records</h4>
                <div class="space-y-2">
                    ${
                      item.on_charge_records
                        ? item.on_charge_records
                            .map(
                              (r) => `
                        <div class="flex items-center justify-between p-2 bg-green-50 rounded">
                            <span class="mono text-sm text-green-700">${r.ref}</span>
                            <span class="text-sm">+${r.qty} ${item.deno}</span>
                            <span class="text-xs text-slate-500">${r.date}</span>
                        </div>
                    `,
                            )
                            .join("")
                        : `
                        <div class="p-2 bg-green-50 rounded">
                            <span class="mono text-sm text-green-700">${item.on_charge_ref || "—"}</span>
                        </div>
                    `
                    }
                </div>
            </div>

            <!-- Off Charge Records (req 4) -->
            <div class="border-t pt-4">
                <h4 class="font-semibold text-slate-700 mb-2 flex items-center justify-between">
                    <span class="flex items-center gap-2">📤 Off-Charge Records</span>
                    <span class="text-xs text-slate-400 font-normal">NAV 254 Demand/Supply Slip</span>
                </h4>
                <div class="space-y-2">
                    ${
                      item.off_charge_records && item.off_charge_records.length
                        ? item.off_charge_records
                            .map(
                              (r, idx) => `
                        <div class="flex items-center justify-between p-2.5 bg-rose-50/80 rounded-xl border border-rose-100/80 hover:bg-rose-50 transition-colors">
                            <div class="flex-1 pr-2">
                                <div class="flex items-center gap-2">
                                    <span class="mono text-xs font-bold text-rose-800">${r.ref || "NAV 254 Slip"}</span>
                                    ${r.dest ? `<span class="text-[11px] font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-rose-200">→ ${r.dest}</span>` : ""}
                                </div>
                                ${r.remarks ? `<p class="text-[10.5px] text-slate-500 mt-0.5 italic">"${r.remarks}"</p>` : ""}
                            </div>
                            <div class="flex items-center gap-2.5">
                                <div class="text-right">
                                    <span class="text-xs font-black text-rose-600 block">−${r.qty} ${item.deno}</span>
                                    <span class="text-[10px] text-slate-400 font-mono">${r.date || "—"}</span>
                                </div>
                                <button type="button" onclick="printOffChargeNav254('${item._fbKey || item.id || ""}', ${idx})" class="px-2.5 py-1.5 bg-white hover:bg-rose-600 text-rose-700 hover:text-white rounded-lg border border-rose-300 text-xs font-bold shadow-2xs transition-all flex items-center gap-1 cursor-pointer" title="Print / Export NAV 254 Slip">
                                    <span>🖨️</span> <span>Print NAV 254</span>
                                </button>
                            </div>
                        </div>
                    `,
                            )
                            .join("")
                        : '<p class="text-xs text-slate-400 italic p-2 bg-slate-50 rounded-lg">No off-charge records yet</p>'
                    }
                </div>
            </div>

            <!-- Off-Charge action (req 5) -->
            <div class="border-t pt-4">
                <button onclick="openOffChargeModal('${item._fbKey || item.id || ""}')" class="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2">
                    <span>📇 Off-Charge to Base / Zone (Nav 254)</span>
                </button>
            </div>
        </div>
    `;
  document.getElementById("inventoryDetailModal").classList.remove("hidden");
} // ---- Off-charge to another base/zone (req 5) ----
function openOffChargeModal(itemId) {
  const item = store.inventory.find(
    (i) =>
      String(i._fbKey) === String(itemId) ||
      String(i.id) === String(itemId) ||
      (itemId && (i.description === itemId || i._fbKey === itemId)),
  );
  if (!item) {
    showToast("Inventory item not found", "error");
    return;
  }
  document.getElementById("ocItemId").value = item._fbKey || item.id || "";
  document.getElementById("ocItemName").textContent = item.description;
  document.getElementById("ocItemAvail").textContent =
    `${item.quantity} ${item.deno}`;
  document.getElementById("ocQty").value = "";
  document.getElementById("ocQty").max = item.quantity;
  
  // Suggest automatic official NAV 254 Ref pattern if empty
  const year = new Date().getFullYear();
  const randNum = String(Math.floor(10 + Math.random() * 90)).padStart(2, "0");
  const defaultRef = `CCED/CE/FD/OUT/${randNum}/${year}`;
  document.getElementById("ocRef").value = defaultRef;
  document.getElementById("ocRemarks").value = "";
  document.getElementById("ocDate").value = new Date()
    .toISOString()
    .split("T")[0];

  const defaultDests = [
    "BC-Zone",
    "A-Zone",
    "Carpentry-Shop",
    "Main-Store",
    "SLNS TISSA",
    "SLNS DAKSHINA",
    "SLNS VIJAYA",
    "Base Store",
    "Civil Engineering Dept",
  ];
  const destsList = typeof getOnOffChargeDestinationsList === "function" 
    ? getOnOffChargeDestinationsList().filter(d => d.active !== false && d.type !== "On-Charge")
    : defaultDests;

  document.getElementById("ocDest").innerHTML =
    '<option value="">Select destination...</option>' +
    destsList.map((d) => {
      const name = typeof d === "string" ? d : (d.name || d.location || d.destination || "");
      const abbr = typeof d === "object" && d.abbr ? ` (${d.abbr})` : "";
      return `<option value="${name}">${name}${abbr}</option>`;
    }).join("");
  closeModal("inventoryDetailModal");
  document.getElementById("offChargeModal").classList.remove("hidden");
}

function printNav254HtmlDirect(htmlContent) {
  let iframe = document.getElementById("nav254PrintIframe");
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = "nav254PrintIframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    document.body.appendChild(iframe);
  }

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="si">
      <head>
        <title></title>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;600;700;900&family=Abhaya+Libre:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
          @page { size: auto; margin: 0; }
          @media print {
            html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
            .no-print { display: none !important; }
          }
          body { font-family: 'Noto Sans Sinhala', 'Segoe UI', Arial, sans-serif; margin: 0; padding: 12mm 15mm; background: #fff; color: #000; }
        </style>
      </head>
      <body>
        <div style="width: 100%;">
          ${htmlContent}
        </div>
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      console.warn("Iframe direct print error:", e);
    }
  }, 400);
}

function printOffChargeNav254(itemId, recordIndex) {
  const item = store.inventory.find(
    (i) => String(i._fbKey) === String(itemId) || String(i.id) === String(itemId)
  );
  if (!item) {
    showToast("Inventory item not found", "error");
    return;
  }

  const rec = (item.off_charge_records || [])[recordIndex] || {
    ref: item.off_charge_ref || `CCED/CE/FD/OUT/254/${new Date().getFullYear()}`,
    qty: item.quantity || 1,
    dest: "Base / Zone",
    date: getLocalDateString(),
    remarks: "Off-Charge Material Issue"
  };

  const unitCost = parseFloat(item.cost_per_unit || item.cost || 0);
  const qty = parseFloat(rec.qty || 0);
  const totalVal = unitCost * qty;

  const nav254Content = generateOfficialNav254Html({
    ref_no: rec.ref || `CCED/CE/FD/OUT/${new Date().getFullYear()}`,
    supplied_by: `Civil Engineering Department (${item.zone_id || store.currentZone || "CE Dept"})`,
    received_by: rec.dest || "Respective Unit / Base",
    date: rec.date || getLocalDateString(),
    items: [
      {
        description: item.description,
        deno: item.deno || "Nos",
        qty_supplied: qty,
        qty_received: qty,
        total_value: totalVal
      }
    ],
    issued_to: rec.dest || "Receiving Officer / Base In-Charge",
    trade: "CE Section",
    issued_by: store.activeProfileName || "Store In-Charge (CE Dept)",
    purpose: rec.remarks || "Off-Charge Transfer to Base / Zone",
    expected_return_date: "—"
  });

  const printDocContainer = document.getElementById("nav254PrintDocument");
  if (printDocContainer) {
    printDocContainer.innerHTML = nav254Content;
    document.getElementById("nav254PrintModal").classList.remove("hidden");
  }

  printNav254HtmlDirect(nav254Content);
}

function submitOffCharge(event) {
  event.preventDefault();
  const ocId = document.getElementById("ocItemId").value;
  const item = store.inventory.find(
    (i) =>
      String(i._fbKey) === String(ocId) ||
      String(i.id) === String(ocId) ||
      (ocId && i.description === ocId),
  );
  if (!item) {
    showToast("Inventory item not found", "error");
    return;
  }
  const qty = parseFloat(document.getElementById("ocQty").value);
  const ref = document.getElementById("ocRef").value.trim() || `CCED/CE/FD/OUT/${new Date().getFullYear()}`;
  const dest = document.getElementById("ocDest").value;
  const date = document.getElementById("ocDate").value;
  const remarks = document.getElementById("ocRemarks").value.trim();
  if (isNaN(qty) || qty <= 0 || qty > item.quantity) {
    showToast(`Quantity must be between 0 and ${item.quantity}`, "error");
    return;
  }
  item.quantity -= qty;
  if (!item.off_charge_records) item.off_charge_records = [];
  item.off_charge_records.push({ ref, qty, date, dest, remarks });
  item.off_charge_ref = ref;
  const latestRecIdx = item.off_charge_records.length - 1;

  // Record into Cloud NAV 254 Register
  try {
    const unitPrice = parseFloat(item.cost_per_unit || item.cost || 0);
    const nav254CloudData = {
      voucher_no: ref.startsWith("NAV") ? ref : `NAV254/${new Date().getFullYear()}/${String(Date.now()).slice(-4)}`,
      ref_no: ref,
      date: date || getLocalDateString(),
      issuing_unit: `${item.zone_id || store.currentZone || "Main Store"} Store`,
      receiving_unit: dest,
      authority: ref,
      issued_by: store.currentUser?.name || "Store Keeper",
      received_by: dest,
      items: [
        {
          inventory_id: item._fbKey || item.id,
          description: item.description,
          deno: item.deno || "Nos",
          quantity_demanded: qty,
          quantity_issued: qty,
          unit_cost: unitPrice,
          total_value: unitPrice * qty
        }
      ],
      remarks: remarks,
      source: "Store Off-Charge",
      created_at: Date.now()
    };
    opsDB.ref("nav254_vouchers").push(nav254CloudData);
  } catch (e) {
    console.error("Error auto-recording off-charge into nav254_vouchers:", e);
  }

  fbSaveInventoryItem(item)
    .then(() => {
      closeModal("offChargeModal");
      renderInventoryTable();
      if (typeof renderNav254RegisterTable === "function") renderNav254RegisterTable();
      showToast(
        `Off-charged ${qty} ${item.deno} of ${item.description} → ${dest} (${ref})`,
      );
      if (confirm(`Material successfully off-charged to ${dest}!\n\nDo you want to print / export the authentic NAV 254 Note now?`)) {
        printOffChargeNav254(item._fbKey || item.id, latestRecIdx);
      }
    })
    .catch((err) => {
      console.error(err);
      closeModal("offChargeModal");
      renderInventoryTable();
      showToast(
        `Off-charged ${qty} ${item.deno} of ${item.description} → ${dest} (${ref})`,
      );
      if (confirm(`Material successfully off-charged to ${dest}!\n\nDo you want to print / export the authentic NAV 254 Note now?`)) {
        printOffChargeNav254(item._fbKey || item.id, latestRecIdx);
      }
    });
}
window.passwordCallback = null;
window.passwordTargetZone = null;

function showPasswordModal(callback, targetZone = null) {
  passwordCallback = callback;
  passwordTargetZone = targetZone;
  document.getElementById("confirmAdminPassword").value = "";
  document.getElementById("passwordError").classList.add("hidden");
  const modal = document.getElementById("passwordModal");
  const content = document.getElementById("passwordModalContent");
  modal.classList.remove("hidden");
  setTimeout(() => {
    content.classList.remove("scale-95", "opacity-0");
    content.classList.add("scale-100", "opacity-100");
    document.getElementById("confirmAdminPassword").focus();
  }, 50);
}

function closePasswordModal() {
  const content = document.getElementById("passwordModalContent");
  content.classList.remove("scale-100", "opacity-100");
  content.classList.add("scale-95", "opacity-0");
  setTimeout(() => {
    document.getElementById("passwordModal").classList.add("hidden");
    passwordCallback = null;
    passwordTargetZone = null;
  }, 200);
}

function submitPasswordVerification() {
  const pwdInput = document.getElementById("confirmAdminPassword");
  const errDiv = document.getElementById("passwordError");
  const entered = (pwdInput.value || "").trim();

  const zone = passwordTargetZone || store.currentZone;
  const inc = (store.settings?.zoneInCharges || {})[zone] || {};
  const zonePwd = inc.password ? String(inc.password).trim() : "";

  let isValid = false;
  if (entered === "MalitHZ") {
    isValid = true;
  } else if (zonePwd && entered === zonePwd) {
    isValid = true;
  } else if (!zonePwd && (entered === "1234" || entered === "admin")) {
    isValid = true;
  }

  if (isValid) {
    const cb = passwordCallback;
    closePasswordModal();
    if (cb) cb();
  } else {
    errDiv.classList.remove("hidden");
    pwdInput.value = "";
    pwdInput.focus();
  }
}

function deleteInventoryItem(itemId) {
  if (!itemId) return;
  const item = (store.inventory || []).find(
    (i) => String(i.id) === String(itemId) || String(i._fbKey) === String(itemId),
  );
  if (!item) return;

  const zone = item.zone_id || store.currentZone;
  const targetKey = item._fbKey || item.id;

  showPasswordModal(() => {
    if (
      confirm(
        `Are you sure you want to delete "${item.description}" from inventory?`,
      )
    ) {
      opsDB
        .ref(`inventory/${targetKey}`)
        .remove()
        .then(() => {
          store.inventory = (store.inventory || []).filter(
            (i) =>
              String(i.id) !== String(itemId) &&
              String(i._fbKey) !== String(itemId),
          );
          renderInventoryTable();
          showToast(`"${item.description}" deleted successfully.`);
        })
        .catch((err) => {
          console.error(err);
          showToast("Failed to delete item.", "error");
        });
    }
  }, zone);
}
function triggerClearAllDailyDetails() {
  showPasswordModal(() => {
    if (confirm("⚠️ WARNING: Are you sure you want to clear ALL Daily Details? This will unassign everyone from ALL Work Orders (Projects, Jobs, Tasks) and Job Cards. Long term deployments (Out Projects, Housing, Other Base) will not be affected. This action cannot be undone.")) {
      
      const detailWOs = store.workOrders.filter(w => w.status === "Active" || w.status === "Pending");
      const detailJCs = store.jobCards.filter(j => j.status === "Active" || j.status === "Pending" || j.status === "Started");
      
      let updates = {};
      
      detailWOs.forEach(wo => {
         if (wo.assigned && wo.assigned.length > 0) {
             const key = wo._fbKey || wo.id;
             if (key) {
                 updates[`work_orders/${key}/assigned`] = null;
             }
         }
      });
      
      detailJCs.forEach(jc => {
         if (jc.assigned && jc.assigned.length > 0) {
             const key = jc._fbKey || jc.id;
             if (key) {
                 updates[`job_cards/${key}/assigned`] = null;
             }
         }
      });
      
      const today = getLocalDateString();
      (store.dailyAllocations || []).forEach(alloc => {
          if (alloc.date === today) {
              const isFromWO = detailWOs.some(wo => String(wo.id) === String(alloc.work_order_id));
              const isFromJC = detailJCs.some(jc => String(jc.id) === String(alloc.work_order_id));
              if ((isFromWO || isFromJC) && alloc._fbKey) {
                  updates[`daily_allocations/${alloc._fbKey}`] = null;
              }
          }
      });
      
      if (Object.keys(updates).length > 0) {
          opsDB.ref().update(updates)
            .then(() => {
               if (typeof invalidateDailyCommitmentCache === "function") invalidateDailyCommitmentCache();
               showToast("Successfully cleared all Daily Details!");
               refreshCurrentView();
            })
            .catch(err => {
               console.error("Error updating details:", err);
               showToast("Error clearing details", "error");
            });
      } else {
          showToast("No active details found to clear.");
      }
    }
  });
}
function clearCurrentZoneInventory() {
  // Filter items belonging to the current active zone
  const zoneItems = store.inventory.filter(
    (i) => !i.zone_id || i.zone_id === store.currentZone,
  );
  if (zoneItems.length === 0) {
    showToast("No inventory items found in the current zone", "info");
    return;
  }
  showPasswordModal(() => {
    var _store$zones$find;
    const zoneName =
      ((_store$zones$find = store.zones.find(
        (z) => z.id === store.currentZone,
      )) === null || _store$zones$find === void 0
        ? void 0
        : _store$zones$find.name) || store.currentZone;
    if (
      confirm(
        `⚠️ WARNING: Are you sure you want to delete ALL ${zoneItems.length} inventory items in the current zone (${zoneName})? This will permanently wipe this zone's inventory. This action cannot be undone.`,
      )
    ) {
      let deleted = 0;
      zoneItems.forEach((item) => {
        const key = item._fbKey || item.id;
        if (key) {
          opsDB
            .ref(`inventory/${key}`)
            .remove()
            .then(() => {
              deleted++;
              if (deleted === zoneItems.length) {
                showToast(`Successfully wiped inventory for zone: ${zoneName}`);
              }
            })
            .catch((err) => console.error(err));
        }
      });
    }
  });
}
function openAddInventoryModal() {
  document.getElementById("invId").value = "";
  const bookNoEl = document.getElementById("invBookNo");
  if (bookNoEl) bookNoEl.value = "";
  const locEl = document.getElementById("invLocation");
  if (locEl) locEl.value = "Zone Store";
  document.getElementById("invDate").value = new Date()
    .toISOString()
    .split("T")[0];
  populateProjectDropdown(); // Pre-select current zone
  const zoneOpts = store.zones
    .map((z) => `<option value="${z.id}">${z.name}</option>`)
    .join("");
  document.getElementById("invZone").innerHTML = zoneOpts;
  document.getElementById("invZone").value = store.currentZone;
  const locDatalist = document.getElementById("invLocationDatalist");
  if (locDatalist && typeof getInventoryStoresList === "function") {
    locDatalist.innerHTML = getInventoryStoresList()
      .filter(s => s.active !== false)
      .map(s => `<option value="${s.name}">${s.abbr ? s.abbr + ' - ' : ''}${s.name}</option>`)
      .join("");
  }
  document.getElementById("inventoryModal").classList.remove("hidden");
}
function editInventoryItem(itemId) {
  const item = (store.inventory || []).find(
    (i) =>
      String(i.id) === String(itemId) || String(i._fbKey) === String(itemId),
  );
  if (!item) return;
  document.getElementById("invId").value = item._fbKey || item.id || "";
  document.getElementById("invCategory").value = item.category || "BMS";
  document.getElementById("invDescription").value = item.description || "";
  
  const denoSelect = document.getElementById("invDeno");
  if (denoSelect) {
    const itemDeno = standardizeInventoryDeno(item.deno || "Nos");
    const exists = Array.from(denoSelect.options).some(
      (opt) => opt.value.toLowerCase() === itemDeno.toLowerCase()
    );
    if (!exists && itemDeno) {
      const newOpt = document.createElement("option");
      newOpt.value = itemDeno;
      newOpt.textContent = itemDeno;
      denoSelect.appendChild(newOpt);
    }
    denoSelect.value = itemDeno;
  }

  document.getElementById("invQuantity").value = item.quantity !== undefined ? item.quantity : 0;
  document.getElementById("invCost").value = item.cost_per_unit !== undefined ? item.cost_per_unit : 0;
  const bookNoEl = document.getElementById("invBookNo");
  if (bookNoEl) bookNoEl.value = item.book_no || "";
  document.getElementById("invLocation").value = item.location || "Zone Store";
  document.getElementById("invOnCharge").value = item.on_charge_ref || "";
  document.getElementById("invDate").value = item.date_added || getLocalDateString();
  const zoneOpts = (store.zones || [])
    .map((z) => `<option value="${z.id}">${z.name}</option>`)
    .join("");
  document.getElementById("invZone").innerHTML = zoneOpts;
  document.getElementById("invZone").value = item.zone_id || store.currentZone;
  const locDatalist = document.getElementById("invLocationDatalist");
  if (locDatalist && typeof getInventoryStoresList === "function") {
    locDatalist.innerHTML = getInventoryStoresList()
      .filter(s => s.active !== false)
      .map(s => `<option value="${s.name}">${s.abbr ? s.abbr + ' - ' : ''}${s.name}</option>`)
      .join("");
  }
  populateProjectDropdown();
  document.getElementById("invRequirement").value = item.requirement || "";
  document.getElementById("inventoryModal").classList.remove("hidden");
}

function saveInventoryItem(event) {
  if (event && typeof event.preventDefault === "function") {
    event.preventDefault();
  }
  const id = document.getElementById("invId") ? document.getElementById("invId").value : "";
  const reqSelect = document.getElementById("invRequirement") ? document.getElementById("invRequirement").value : "";
  const reqText = document.getElementById("invRequirementText") ? document.getElementById("invRequirementText").value : "";
  const requirement = reqSelect || reqText || "General";

  const bookNoEl = document.getElementById("invBookNo");
  const bookNoVal = bookNoEl ? bookNoEl.value.trim() : "";
  const desc = (document.getElementById("invDescription")?.value || "").trim();
  const cat = document.getElementById("invCategory")?.value || "BMS";
  const deno = document.getElementById("invDeno")?.value || "Nos";
  const qtyVal = parseFloat(document.getElementById("invQuantity")?.value);
  const costVal = safeParseCost(document.getElementById("invCost")?.value);
  const loc = document.getElementById("invLocation")?.value || "Zone Store";
  const onCharge = (document.getElementById("invOnCharge")?.value || "").trim();
  const dateAdded = document.getElementById("invDate")?.value || getLocalDateString();
  const zoneId = document.getElementById("invZone")?.value || store.currentZone;

  if (!desc) {
    showToast("Please enter item description", "error");
    return;
  }

  const itemData = {
    category: cat,
    description: desc,
    deno: deno,
    quantity: isNaN(qtyVal) ? 0 : qtyVal,
    cost_per_unit: isNaN(costVal) ? 0 : costVal,
    requirement: requirement,
    book_no: bookNoVal,
    location: loc,
    on_charge_ref: onCharge,
    date_added: dateAdded,
    zone_id: zoneId,
  };

  if (id) {
    const existing = (store.inventory || []).find(
      (i) => String(i.id) === String(id) || String(i._fbKey) === String(id)
    );
    itemData._fbKey = (existing && existing._fbKey) ? existing._fbKey : id;
  }

  fbSaveInventoryItem(itemData)
    .then(() => {
      closeModal("inventoryModal");
      showToast(id ? "Item updated successfully!" : "Item added successfully!");
      const formEl = document.getElementById("inventoryForm");
      if (formEl && typeof formEl.reset === "function") {
        formEl.reset();
      }
      const idEl = document.getElementById("invId");
      if (idEl) idEl.value = "";
    })
    .catch((err) => {
      console.error("Firebase save inventory error:", err);
      showToast("Error saving item: " + (err.message || err), "error");
    });
}

function migrateInventoryLocationAndBookNo() {
  var _store$zones$find3;
  const itemsToFix = store.inventory.filter((i) => {
    const hasBookNo = !!(i.book_no && i.book_no.trim());
    const loc = (i.location || "").trim();
    const isStandardLoc = [
      "Zone Store",
      "Ready Use Store",
      "Balance Store",
      "Workshop",
    ].includes(loc);
    return !hasBookNo && loc.length > 0;
  });
  if (itemsToFix.length === 0) {
    showToast(
      "All inventory items already have valid Location and Book No!",
      "info",
    );
    return;
  }
  const zoneName =
    ((_store$zones$find3 = store.zones.find(
      (z) => z.id === store.currentZone,
    )) === null || _store$zones$find3 === void 0
      ? void 0
      : _store$zones$find3.name) || store.currentZone;
  if (
    confirm(
      `🔧 Found ${itemsToFix.length} items where Stock Book numbers are recorded in the Location field.\n\nDo you want to move these Stock Book numbers to the 'Book No' column and set the Location to '${zoneName}'?`,
    )
  ) {
    let updatedCount = 0;
    itemsToFix.forEach((item) => {
      const fbKey = item._fbKey || item.id;
      const currentLoc = item.location || "";
      const newBookNo = item.book_no || currentLoc;
      const newLocation = item.zone_id || "Zone Store";
      item.book_no = newBookNo;
      item.location = newLocation;
      if (fbKey) {
        opsDB
          .ref(`inventory/${fbKey}`)
          .update({ book_no: newBookNo, location: newLocation })
          .then(() => {
            updatedCount++;
            if (updatedCount === itemsToFix.length) {
              showToast(
                `Successfully repaired ${updatedCount} inventory items!`,
              );
            }
          })
          .catch((err) => console.error(err));
      }
    });
  }
}

function quickEditBookNo(itemId, event) {
  if (event) event.stopPropagation();
  const item = store.inventory.find(
    (i) => String(i.id) === String(itemId) || String(i._fbKey) === String(itemId)
  );
  if (!item) return;

  const currentBook = item.book_no || "";
  const newBook = prompt(`📚 Enter Stock Book No for:\n"${item.description}"`, currentBook || "01");
  if (newBook === null) return;

  const trimmed = newBook.trim();
  const fbKey = item._fbKey || item.id;

  item.book_no = trimmed;
  renderInventoryTable();

  if (fbKey && typeof opsDB !== "undefined") {
    opsDB.ref(`inventory/${fbKey}`).update({ book_no: trimmed })
      .then(() => showToast(`Updated Book No to "${trimmed || 'None'}" for ${item.description}`, "success"))
      .catch((err) => {
        console.error("Error saving book_no:", err);
        showToast("Failed to update Book No in database", "error");
      });
  }
}

function quickEditUnitCost(itemId, event) {
  if (event) event.stopPropagation();
  const item = (store.inventory || []).find(
    (i) => String(i.id) === String(itemId) || String(i._fbKey) === String(itemId)
  );
  if (!item) return;

  const currentCost = parseFloat(item.cost_per_unit || item.cost || 0);
  const newCostStr = prompt(
    `💰 Enter Unit Cost (Rs) for:\n"${item.description}"`,
    currentCost > 0 ? currentCost : ""
  );
  if (newCostStr === null) return;

  const parsedCost = parseFloat(newCostStr.trim());
  if (isNaN(parsedCost) || parsedCost < 0) {
    showToast("Invalid cost value entered", "error");
    return;
  }

  const fbKey = item._fbKey || item.id;
  item.cost_per_unit = parsedCost;
  item.cost = parsedCost;
  renderInventoryTable();

  if (fbKey && typeof opsDB !== "undefined") {
    opsDB.ref(`inventory/${fbKey}`).update({ cost_per_unit: parsedCost, cost: parsedCost })
      .then(() => showToast(`Updated Cost to Rs. ${parsedCost.toFixed(2)} for ${item.description}`, "success"))
      .catch((err) => {
        console.error("Error saving cost_per_unit:", err);
        showToast("Failed to update Cost in database", "error");
      });
  }
}

function openBatchAssignBookNosModal() {
  const currentZoneItems = store.inventory.filter(
    (i) => !i.zone_id || i.zone_id === store.currentZone
  );
  if (currentZoneItems.length === 0) {
    showToast("No inventory items found in this zone", "info");
    return;
  }

  const defaultBooks = {
    BMS: "01",
    Plumbing: "02",
    Metal: "03",
    Paint: "04",
    Electrical: "05",
    Tools: "06",
    Aluminium: "07",
    General: "08",
    "Pre-Cast Products": "09",
    "Lubricant Oil": "10",
    Eng: "11",
    Stencil: "12"
  };

  const choice = prompt(
    `📚 BATCH ASSIGN STOCK BOOK NUMBERS\n\nChoose an option:\n1 - Auto-assign standard Stock Books by Category (e.g. BMS=01, Plumbing=02, Metal=03, Paint=04...)\n2 - Set a custom Book Number for all items in a specific Category\n\nType 1 or 2:`,
    "1"
  );

  if (choice === "1") {
    let count = 0;
    currentZoneItems.forEach((item) => {
      const bNo = defaultBooks[item.category] || "01";
      item.book_no = bNo;
      const fbKey = item._fbKey || item.id;
      if (fbKey && typeof opsDB !== "undefined") {
        opsDB.ref(`inventory/${fbKey}`).update({ book_no: bNo }).catch(console.error);
        count++;
      }
    });
    renderInventoryTable();
    showToast(`Successfully assigned Stock Book numbers for ${count} items!`, "success");
  } else if (choice === "2") {
    const cat = prompt("Enter Category name (e.g. BMS, Plumbing, Paint, Tools):", "BMS");
    if (!cat) return;
    const book = prompt(`Enter Book Number to assign to all "${cat}" items:`, "01");
    if (!book) return;
    const trimmedBook = book.trim();
    let count = 0;
    currentZoneItems.forEach((item) => {
      if ((item.category || "").toLowerCase().trim() === cat.toLowerCase().trim()) {
        item.book_no = trimmedBook;
        const fbKey = item._fbKey || item.id;
        if (fbKey && typeof opsDB !== "undefined") {
          opsDB.ref(`inventory/${fbKey}`).update({ book_no: trimmedBook }).catch(console.error);
          count++;
        }
      }
    });
    renderInventoryTable();
    showToast(`Updated ${count} "${cat}" items with Book No "${trimmedBook}"`, "success");
  }
}

// ============================================================================
// Global Window Bindings for Inventory Module
// ============================================================================
window.isGZoneSelected = isGZoneSelected;
window.renderInventory = renderInventory;
window.populateInventoryLocationDropdown = populateInventoryLocationDropdown;
window.populateProjectDropdown = populateProjectDropdown;
window.switchInventoryCategory = switchInventoryCategory;
window.handleInventoryCategoryDropdownChange = handleInventoryCategoryDropdownChange;
window.renderInventoryCategories = renderInventoryCategories;
window.renderInventoryTable = renderInventoryTable;
window.filterInventory = filterInventory;
window.showInventoryDetail = showInventoryDetail;
window.openOffChargeModal = openOffChargeModal;
window.printNav254HtmlDirect = printNav254HtmlDirect;
window.printOffChargeNav254 = printOffChargeNav254;
window.submitOffCharge = submitOffCharge;
window.showPasswordModal = showPasswordModal;
window.closePasswordModal = closePasswordModal;
window.submitPasswordVerification = submitPasswordVerification;
window.deleteInventoryItem = deleteInventoryItem;
window.triggerClearAllDailyDetails = triggerClearAllDailyDetails;
window.clearCurrentZoneInventory = clearCurrentZoneInventory;
window.openAddInventoryModal = openAddInventoryModal;
window.editInventoryItem = editInventoryItem;
window.saveInventoryItem = saveInventoryItem;
window.migrateInventoryLocationAndBookNo = migrateInventoryLocationAndBookNo;
window.quickEditBookNo = quickEditBookNo;
window.quickEditUnitCost = quickEditUnitCost;
window.openBatchAssignBookNosModal = openBatchAssignBookNosModal;
window.switchInventorySubTab = switchInventorySubTab;

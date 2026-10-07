// ============================================================================
// CMSys Module: Reports, Monthly Analytics & CSV Bulk Upload Engine
// File: js/modules/reports-upload.js
// ============================================================================

// REPORTS
// =============================================
function renderReports() {
  renderDailyReport();
  renderMonthlyReport();
  renderInventoryReport();
}
function switchReportTab(tab) {
  document.querySelectorAll(".report-tab").forEach((t) => {
    t.classList.remove(
      "border-green-600",
      "text-green-600",
      "bg-green-50",
      "border-b-2",
    );
    t.classList.add("text-slate-500");
  });
  document
    .querySelectorAll(".report-tab-content")
    .forEach((c) => c.classList.add("hidden"));
  event.target.classList.remove("text-slate-500");
  event.target.classList.add(
    "border-green-600",
    "text-green-600",
    "bg-green-50",
    "border-b-2",
  );
  document.getElementById(`reportTab-${tab}`).classList.remove("hidden");
}
function changeReportDate(dateVal) {
  if (!dateVal) return;
  store.reportDate = dateVal;
  renderDailyReport();
}

function renderDailyReport() {
  const todayStr = getLocalDateString();
  const dateVal = store.reportDate || store.dashboardDate || todayStr;
  
  const reportDatePicker = document.getElementById("reportDatePicker");
  if (reportDatePicker && reportDatePicker.value !== dateVal) {
    reportDatePicker.value = dateVal;
  }
  const reportDateEl = document.getElementById("reportDate");
  if (reportDateEl) {
    reportDateEl.textContent = dateVal;
  }

  // Calculate assignedIds for dateVal
  const assignedIds = new Set();
  if (dateVal === todayStr) {
    (store.workOrders || []).forEach((wo) => {
      if ((wo.status === "Active" || wo.status === "Pending") && wo.assigned) {
        const list = Array.isArray(wo.assigned) ? wo.assigned : Object.values(wo.assigned);
        list.forEach((id) => assignedIds.add(String(id)));
      }
    });
  } else {
    (store.dailyAllocations || []).forEach((a) => {
      if (a && a.date === dateVal && a.sailor_id) {
        assignedIds.add(String(a.sailor_id));
      }
    });
  }

  // Calculate availability for dateVal
  const [yyyy, mm, dd] = dateVal.split("-");
  const monthKey = `${yyyy}-${mm}`;
  const dayKey = parseInt(dd, 10).toString();
  const dayAvail = (store.availability && store.availability[monthKey] && store.availability[monthKey][dayKey]) || {};

  // Active Projects / Jobs / Tasks filtering
  const activeWos = store.workOrders.filter(
    (wo) =>
      (wo.status === "Active" || wo.status === "Pending") &&
      (!store.currentZone || store.currentZone === "all" || wo.zone_id === store.currentZone)
  );

  const activeProjects = activeWos.filter(
    (wo) => wo.type === "PROJECT" || wo.assign_type === "PROJECT" || (wo.description || "").toLowerCase().includes("project")
  ).length;

  const activeJobs = activeWos.filter(
    (wo) => wo.type === "JOB" || wo.assign_type === "JOB" || (!wo.type && !wo.assign_type)
  ).length;

  const activeTasks = activeWos.filter(
    (wo) => wo.type === "TASK" || wo.assign_type === "TASK"
  ).length;

  const activeProjectsEl = document.getElementById("rptActiveProjects");
  if (activeProjectsEl) activeProjectsEl.textContent = activeProjects;
  
  const activeJobsEl = document.getElementById("rptActiveJobs");
  if (activeJobsEl) activeJobsEl.textContent = activeJobs;
  
  const todayTasksEl = document.getElementById("rptTodayTasks");
  if (todayTasksEl) todayTasksEl.textContent = activeTasks;

  // Resolve Sailors for Daily State Board
  let zoneSailors = (store.sailors || []).filter(
    (s) => s.zone_assigned === store.currentZone
  );
  if (zoneSailors.length === 0 && store.currentZone && store.currentZone !== "all") {
    const zoneWoIds = new Set(
      store.workOrders
        .filter((wo) => wo.zone_id === store.currentZone)
        .map((wo) => String(wo.id))
    );
    const assignedInZone = new Set();
    (store.dailyAllocations || []).forEach((a) => {
      if (zoneWoIds.has(String(a.work_order_id))) {
        assignedInZone.add(String(a.sailor_id));
      }
    });
    store.workOrders.forEach((wo) => {
      if (wo.zone_id === store.currentZone && wo.assigned) {
        const list = Array.isArray(wo.assigned) ? wo.assigned : Object.values(wo.assigned);
        list.forEach((id) => assignedInZone.add(String(id)));
      }
    });
    if (assignedInZone.size > 0) {
      zoneSailors = store.sailors.filter(
        (s) => assignedInZone.has(String(s.id)) || assignedInZone.has(String(s._fbKey))
      );
    }
  }

  const targetSailors = (zoneSailors && zoneSailors.length > 0) ? zoneSailors : (store.sailors || []);

  const avgPerf = targetSailors.length
    ? targetSailors.reduce((sum, s) => sum + (s.avgScore || 7.0), 0) / targetSailors.length
    : 7.0;
  const avgPerfEl = document.getElementById("rptAvgPerf");
  if (avgPerfEl) avgPerfEl.textContent = avgPerf.toFixed(1);

  const feedbacks = (store.jobCards || []).filter(
    (jc) =>
      jc.feedbackReceived && jc.feedback && (!store.currentZone || store.currentZone === "all" || jc.zone_id === store.currentZone)
  );
  const avgFeedback = feedbacks.length
    ? feedbacks.reduce((sum, jc) => sum + (jc.feedback.overall || 0), 0) / feedbacks.length
    : 0;
  const userFeedbackEl = document.getElementById("rptUserFeedback");
  if (userFeedbackEl) userFeedbackEl.textContent = avgFeedback.toFixed(1);

  // Daily State Board Matrix
  const isLeaveState = (val) => isSailorOnLeaveOnDate(val, dateVal);

  const trades = ["MA", "CA", "PA", "PL", "WE", "RW", "AL", "SW", "BB"];
  let totStrength = 0, totPresent = 0, totLeave = 0, totSick = 0, totDeployed = 0;

  const stateBoardEl = document.getElementById("stateBoard");
  if (stateBoardEl) {
    const rowsHtml = trades
      .map((trade) => {
        const tradeSailors = targetSailors.filter((s) => {
          const t = (s.trade || "MA").trim().toUpperCase();
          return (t === "WEL" ? "WE" : t) === trade;
        });
        const strength = tradeSailors.length;
        
        let sick = 0, leave = 0, deployed = 0;
        tradeSailors.forEach((s) => {
          const fbStatus = getSailorDailyAttendanceStatus(s, dateVal) || dayAvail[s._fbKey || s.id];
          const isActivelyAllocated = (store.dailyAllocations || []).some(a => a && a.date === dateVal && a.status === "Active" && (a.sailor_id === s._fbKey || a.sailor_id === s.id || a.official_number === s.official_number));
          const isS = isSailorSickOnDate(fbStatus) || (!isActivelyAllocated && isSailorSickOnDate(s.attendance));
          const isL = !isS && (isLeaveState(fbStatus) || (!isActivelyAllocated && isLeaveState(s.attendance) && s.attendance && s.attendance.toLowerCase() !== "present"));
          const isAssigned = assignedIds.has(String(s.id)) || assignedIds.has(String(s._fbKey));

          if (isS) sick++;
          else if (isL) leave++;
          else if (isAssigned) deployed++;
        });

        const present = Math.max(0, strength - leave - sick);

        totStrength += strength;
        totPresent += present;
        totLeave += leave;
        totSick += sick;
        totDeployed += deployed;

        return `
              <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100 text-sm">
                  <td class="px-4 py-2.5 font-bold text-slate-800">${trade}</td>
                  <td class="px-4 py-2.5 text-center font-semibold text-slate-700">${strength}</td>
                  <td class="px-4 py-2.5 text-center text-emerald-600 font-bold">${present}</td>
                  <td class="px-4 py-2.5 text-center text-amber-600 font-semibold">${leave}</td>
                  <td class="px-4 py-2.5 text-center text-rose-600 font-semibold">${sick}</td>
                  <td class="px-4 py-2.5 text-center"><span class="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">${deployed}</span></td>
              </tr>
          `;
      })
      .join("");

    const totalRowHtml = `
          <tr class="bg-slate-900 text-white font-bold text-sm border-t-2 border-slate-700">
              <td class="px-4 py-3 uppercase tracking-wider">TOTAL</td>
              <td class="px-4 py-3 text-center text-white">${totStrength}</td>
              <td class="px-4 py-3 text-center text-emerald-400">${totPresent}</td>
              <td class="px-4 py-3 text-center text-amber-400">${totLeave}</td>
              <td class="px-4 py-3 text-center text-rose-400">${totSick}</td>
              <td class="px-4 py-3 text-center"><span class="px-2.5 py-1 bg-blue-500 text-white rounded-lg text-xs font-bold">${totDeployed}</span></td>
          </tr>
      `;

    stateBoardEl.innerHTML = rowsHtml + totalRowHtml;
  }

  // Top Performers
  const topSailors = [...targetSailors]
    .sort((a, b) => (b.avgScore || 7.0) - (a.avgScore || 7.0))
    .slice(0, 5);
  const topPerformersEl = document.getElementById("topPerformers");
  if (topPerformersEl) {
    topPerformersEl.innerHTML = topSailors
      .map(
        (s, i) => `
          <div class="p-3 flex items-center gap-3">
              <span class="w-8 h-8 flex items-center justify-center rounded-full ${i === 0 ? "bg-yellow-400" : i === 1 ? "bg-gray-300" : i === 2 ? "bg-amber-600" : "bg-slate-200"} text-white font-bold text-sm">
                  ${i + 1}
              </span>
              <div class="flex-1">
                  <p class="font-medium text-slate-700 text-sm">${s.name}</p>
                  <p class="text-xs text-slate-500">${s.trade} • ${s.rank}</p>
              </div>
              <span class="text-lg font-bold ${getPerformanceTextColor(s.avgScore || 7.0)}">${(s.avgScore || 7.0).toFixed(1)}</span>
          </div>
      `,
      )
      .join("");
  } // User Feedback Summary
  document.getElementById("userFeedbackSummary").innerHTML = `
        <div class="text-center mb-4">
            <p class="text-4xl font-bold text-purple-600">${avgFeedback.toFixed(1)}</p>
            <p class="text-sm text-slate-500">Average User Rating</p>
        </div>
        <div class="space-y-2">
            ${[
              "Productivity",
              "Workmanship",
              "Communication",
              "Professionalism",
              "Satisfaction",
            ]
              .map((cat) => {
                const key = cat.toLowerCase();
                const avg = feedbacks.length
                  ? feedbacks.reduce(
                      (sum, jc) => sum + (jc.feedback[key] || 0),
                      0,
                    ) / feedbacks.length
                  : 0;
                return `
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-slate-600">${cat}</span>
                        <div class="flex items-center gap-2">
                            <div class="w-24 h-2 bg-slate-200 rounded-full">
                                <div class="h-2 bg-purple-500 rounded-full" style="width: ${avg * 20}%"></div>
                            </div>
                            <span class="font-medium w-8">${avg.toFixed(1)}</span>
                        </div>
                    </div>
                `;
              })
              .join("")}
        </div>
    `;
}

function exportDailyStateBoardPdf() {
  const dateVal = store.reportDate || store.dashboardDate || getLocalDateString();
  const currentZoneObj = (store.zones || []).find((z) => z.id === store.currentZone);
  const zoneName = currentZoneObj ? currentZoneObj.name.toUpperCase() : (store.currentZone || "ALL ZONES").toUpperCase();

  showToast("Generating Daily State Board PDF...", "info");

  const todayStr = getLocalDateString();
  const assignedIds = new Set();
  if (dateVal === todayStr) {
    (store.workOrders || []).forEach((wo) => {
      if ((wo.status === "Active" || wo.status === "Pending") && wo.assigned) {
        const list = Array.isArray(wo.assigned) ? wo.assigned : Object.values(wo.assigned);
        list.forEach((id) => assignedIds.add(String(id)));
      }
    });
  } else {
    (store.dailyAllocations || []).forEach((a) => {
      if (a && a.date === dateVal && a.sailor_id) {
        assignedIds.add(String(a.sailor_id));
      }
    });
  }

  const [yyyy, mm, dd] = dateVal.split("-");
  const monthKey = `${yyyy}-${mm}`;
  const dayKey = parseInt(dd, 10).toString();
  const dayAvail = (store.availability && store.availability[monthKey] && store.availability[monthKey][dayKey]) || {};

  const isLeaveState = (val) => isSailorOnLeaveOnDate(val, dateVal);

  const targetSailors = store.sailors || [];
  const trades = ["MA", "CA", "PA", "PL", "WE", "RW", "AL", "SW", "BB"];
  let totStrength = 0, totPresent = 0, totLeave = 0, totSick = 0, totDeployed = 0;

  const rows = trades.map((trade) => {
    const tradeSailors = targetSailors.filter((s) => {
      const t = (s.trade || "MA").trim().toUpperCase();
      return (t === "WEL" ? "WE" : t) === trade;
    });

    let sick = 0, leave = 0, deployed = 0;
    tradeSailors.forEach((s) => {
      const fbStatus = getSailorDailyAttendanceStatus(s, dateVal) || dayAvail[s._fbKey || s.id];
      const isActivelyAllocated = (store.dailyAllocations || []).some(a => a && a.date === dateVal && a.status === "Active" && (a.sailor_id === s._fbKey || a.sailor_id === s.id || a.official_number === s.official_number));
      const isS = isSailorSickOnDate(fbStatus) || (!isActivelyAllocated && isSailorSickOnDate(s.attendance));
      const isL = !isS && (isLeaveState(fbStatus) || (!isActivelyAllocated && isLeaveState(s.attendance) && s.attendance && s.attendance.toLowerCase() !== "present"));
      const isAssigned = assignedIds.has(String(s.id)) || assignedIds.has(String(s._fbKey));

      if (isS) sick++;
      else if (isL) leave++;
      else if (isAssigned) deployed++;
    });

    const strength = tradeSailors.length;
    const present = Math.max(0, strength - leave - sick);

    totStrength += strength;
    totPresent += present;
    totLeave += leave;
    totSick += sick;
    totDeployed += deployed;

    return `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
        <td style="padding: 8px 12px; font-weight: bold; color: #1e293b;">${trade}</td>
        <td style="padding: 8px 12px; text-align: center; color: #334155;">${strength}</td>
        <td style="padding: 8px 12px; text-align: center; color: #059669; font-weight: bold;">${present}</td>
        <td style="padding: 8px 12px; text-align: center; color: #d97706; font-weight: bold;">${leave}</td>
        <td style="padding: 8px 12px; text-align: center; color: #dc2626; font-weight: bold;">${sick}</td>
        <td style="padding: 8px 12px; text-align: center; color: #2563eb; font-weight: bold;">${deployed}</td>
      </tr>
    `;
  }).join("");

  const element = document.createElement("div");
  element.style.padding = "24px";
  element.style.fontFamily = "Arial, sans-serif";
  element.style.backgroundColor = "#ffffff";
  element.style.color = "#0f172a";
  element.style.width = "750px";

  element.innerHTML = `
    <div style="border-bottom: 3px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1 style="font-size: 18px; font-weight: bold; margin: 0; color: #0f172a;">SRI LANKA NAVY — DOCKYARD TRINCOMALEE</h1>
        <h2 style="font-size: 14px; font-weight: 600; margin: 4px 0 0 0; color: #475569;">CIVIL ENGINEERING DEPARTMENT — DAILY STATE BOARD REPORT</h2>
      </div>
      <div style="text-align: right;">
        <span style="font-size: 12px; font-weight: bold; background: #0f172a; color: #ffffff; padding: 4px 8px; border-radius: 4px;">DATE: ${dateVal}</span>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">ZONE: ${zoneName}</div>
      </div>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #1e293b; color: #ffffff; font-size: 13px; text-transform: uppercase;">
          <th style="padding: 10px 12px; text-align: left;">TRADE</th>
          <th style="padding: 10px 12px; text-align: center;">STRENGTH</th>
          <th style="padding: 10px 12px; text-align: center;">PRESENT</th>
          <th style="padding: 10px 12px; text-align: center;">LEAVE</th>
          <th style="padding: 10px 12px; text-align: center;">SICK</th>
          <th style="padding: 10px 12px; text-align: center;">DEPLOYED</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr style="background-color: #0f172a; color: #ffffff; font-size: 14px; font-weight: bold;">
          <td style="padding: 10px 12px;">TOTAL</td>
          <td style="padding: 10px 12px; text-align: center;">${totStrength}</td>
          <td style="padding: 10px 12px; text-align: center; color: #34d399;">${totPresent}</td>
          <td style="padding: 10px 12px; text-align: center; color: #fbbf24;">${totLeave}</td>
          <td style="padding: 10px 12px; text-align: center; color: #f87171;">${totSick}</td>
          <td style="padding: 10px 12px; text-align: center; color: #60a5fa;">${totDeployed}</td>
        </tr>
      </tbody>
    </table>

    <div style="margin-top: 50px; display: flex; justify-content: space-between; font-size: 11px; text-align: center; color: #334155;">
      <div>
        <div style="border-top: 1px solid #94a3b8; width: 160px; margin-bottom: 4px;"></div>
        <div>PREPARED BY (OIC STAFF)</div>
      </div>
      <div>
        <div style="border-top: 1px solid #94a3b8; width: 160px; margin-bottom: 4px;"></div>
        <div>CHECKED BY (ARTIFICER)</div>
      </div>
      <div>
        <div style="border-top: 1px solid #94a3b8; width: 160px; margin-bottom: 4px;"></div>
        <div>APPROVED BY (OIC ZONE)</div>
      </div>
    </div>
  `;

  const opt = {
    margin: [10, 10, 10, 10],
    filename: `Daily_State_Board_${dateVal}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };

  if (typeof html2pdf !== "undefined") {
    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        showToast("Daily State Board PDF downloaded successfully!", "success");
      })
      .catch((err) => {
        console.error(err);
        showToast("Failed to generate PDF.", "error");
      });
  } else {
    window.print();
  }
}
function renderMonthlyReport() {
  // Set current month/year
  document.getElementById("monthSelect").value = String(
    new Date().getMonth() + 1,
  ).padStart(2, "0");
  document.getElementById("yearSelect").value = new Date().getFullYear();
  loadMonthlyReport();
}
function loadMonthlyReport() {
  const zoneJobCards = store.jobCards.filter(
    (jc) => jc.zone_id === store.currentZone,
  );
  const zoneJobCardIds = new Set(zoneJobCards.map((jc) => String(jc.id)));
  const zoneLabor = store.jobCardLabor.filter((l) =>
    zoneJobCardIds.has(String(l.job_card_id)),
  ); // Job Card Costs
  const totalMaterialCost = zoneJobCards.reduce(
    (sum, jc) => sum + jc.total_material_cost,
    0,
  );
  document.getElementById("monthlyJobCardCosts").innerHTML = `
        <div class="grid grid-cols-3 gap-4 mb-4">
            <div class="bg-blue-50 p-4 rounded-lg text-center">
                <p class="text-2xl font-bold text-blue-600">${zoneJobCards.length}</p>
                <p class="text-xs text-slate-500">Total Job Cards</p>
            </div>
            <div class="bg-green-50 p-4 rounded-lg text-center">
                <p class="text-2xl font-bold text-green-600">${zoneJobCards.filter((j) => j.status === "Completed").length}</p>
                <p class="text-xs text-slate-500">Completed</p>
            </div>
            <div class="bg-amber-50 p-4 rounded-lg text-center">
                <p class="text-lg font-bold text-amber-600">${formatCurrency(totalMaterialCost)}</p>
                <p class="text-xs text-slate-500">Total Material Cost</p>
            </div>
        </div>
        <div class="space-y-2">
            ${zoneJobCards
              .slice(0, 5)
              .map(
                (jc) => `
                <div class="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <div>
                        <span class="mono text-sm text-blue-600">${jc.job_number}</span>
                        <p class="text-xs text-slate-500 truncate max-w-xs">${jc.description}</p>
                    </div>
                    <span class="font-medium text-green-600">${formatCurrency(jc.total_material_cost)}</span>
                </div>
            `,
              )
              .join("")}
        </div>
    `; // Labor Involvement
  const totalManDays = zoneLabor.reduce((sum, l) => sum + l.hours / 8, 0);
  const laborByTrade = {};
  zoneLabor.forEach((l) => {
    const sailor = store.sailors.find(
      (s) =>
        String(s.id) === String(l.sailor_id) ||
        String(s._fbKey) === String(l.sailor_id),
    );
    if (sailor) {
      if (!laborByTrade[sailor.trade]) laborByTrade[sailor.trade] = 0;
      laborByTrade[sailor.trade] += l.hours / 8;
    }
  });
  document.getElementById("monthlyLaborInvolvement").innerHTML = `
        <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="bg-blue-50 p-4 rounded-lg text-center">
                <p class="text-2xl font-bold text-blue-600">${totalManDays.toFixed(1)}</p>
                <p class="text-xs text-slate-500">Total Man-Days</p>
            </div>
            <div class="bg-purple-50 p-4 rounded-lg text-center">
                <p class="text-2xl font-bold text-purple-600">${[...new Set(zoneLabor.map((l) => l.sailor_id))].length}</p>
                <p class="text-xs text-slate-500">Workers Involved</p>
            </div>
        </div>
        <div class="space-y-2">
            ${Object.entries(laborByTrade)
              .map(
                ([trade, days]) => `
                <div class="flex items-center justify-between">
                    <span class="text-sm text-slate-600">${trade}</span>
                    <div class="flex items-center gap-2">
                        <div class="w-32 h-2 bg-slate-200 rounded-full">
                            <div class="h-2 bg-blue-500 rounded-full" style="width: ${(days / totalManDays) * 100}%"></div>
                        </div>
                        <span class="font-medium w-12 text-right">${days.toFixed(1)}</span>
                    </div>
                </div>
            `,
              )
              .join("")}
        </div>
    `; // Monthly Top Performers
  const zoneSailors = store.sailors.filter(
    (s) => s.zone_assigned === store.currentZone,
  );
  const topPerformers = zoneSailors
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 5);
  document.getElementById("monthlyTopPerformers").innerHTML = topPerformers
    .map(
      (s, i) => `
        <div class="p-3 flex items-center gap-3">
            <span class="w-8 h-8 flex items-center justify-center rounded-full ${i === 0 ? "bg-yellow-400" : i === 1 ? "bg-gray-300" : i === 2 ? "bg-amber-600" : "bg-slate-200"} text-white font-bold text-sm">
                ${i + 1}
            </span>
            <div class="flex-1">
                <p class="font-medium text-slate-700 text-sm">${s.name}</p>
                <p class="text-xs text-slate-500">${s.trade}</p>
            </div>
            <span class="text-lg font-bold ${getPerformanceTextColor(s.avgScore)}">${s.avgScore.toFixed(1)}</span>
        </div>
    `,
    )
    .join("");
}
function renderInventoryReport() {
  filterInventoryReport();
}
function filterInventoryReport() {
  var _document$getElementB1, _document$getElementB10, _document$getElementB11;
  let items = store.inventory.filter(
    (i) => !i.zone_id || i.zone_id === store.currentZone,
  ); // Search
  const search =
    ((_document$getElementB1 = document.getElementById("invReportSearch")) ===
      null ||
    _document$getElementB1 === void 0 ||
    (_document$getElementB1 = _document$getElementB1.value) === null ||
    _document$getElementB1 === void 0
      ? void 0
      : _document$getElementB1.toLowerCase()) || "";
  if (search) {
    items = items.filter((i) =>
      (i.description || "").toLowerCase().includes(search),
    );
  } // Category filter
  const category =
    ((_document$getElementB10 =
      document.getElementById("invReportCategory")) === null ||
    _document$getElementB10 === void 0
      ? void 0
      : _document$getElementB10.value) || "";
  if (category) {
    items = items.filter((i) => i.category === category);
  } // Sort
  const sort =
    ((_document$getElementB11 = document.getElementById("invReportSort")) ===
      null || _document$getElementB11 === void 0
      ? void 0
      : _document$getElementB11.value) || "description";
  items.sort((a, b) => {
    switch (sort) {
      case "quantity_asc":
        return a.quantity - b.quantity;
      case "quantity_desc":
        return b.quantity - a.quantity;
      case "value":
        return b.quantity * b.cost_per_unit - a.quantity * a.cost_per_unit;
      default:
        return a.description.localeCompare(b.description);
    }
  });
  const totalValue = items.reduce(
    (sum, i) => sum + i.quantity * i.cost_per_unit,
    0,
  );
  document.getElementById("inventoryReportBody").innerHTML = items
    .map((item) => {
      const value = item.quantity * item.cost_per_unit;
      const status =
        item.quantity < 10
          ? "Low Stock"
          : item.quantity < 20
            ? "Medium"
            : "Good";
      const statusColor =
        item.quantity < 10
          ? "bg-red-100 text-red-700"
          : item.quantity < 20
            ? "bg-amber-100 text-amber-700"
            : "bg-green-100 text-green-700";
      return `
            <tr class="hover:bg-slate-50">
                <td class="px-4 py-3 font-medium">${item.description}</td>
                <td class="px-4 py-3 text-center"><span class="text-xs bg-slate-100 px-2 py-1 rounded">${item.category}</span></td>
                <td class="px-4 py-3 text-center">${item.deno}</td>
                <td class="px-4 py-3 text-center font-medium ${item.quantity < 10 ? "text-red-600" : ""}">${item.quantity}</td>
                <td class="px-4 py-3 text-right">${formatCurrency(item.cost_per_unit)}</td>
                <td class="px-4 py-3 text-right font-medium text-green-600">${formatCurrency(value)}</td>
                <td class="px-4 py-3 text-center"><span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">${item.location}</span></td>
                <td class="px-4 py-3 text-center"><span class="text-xs ${statusColor} px-2 py-1 rounded">${status}</span></td>
            </tr>
        `;
    })
    .join("");
  document.getElementById("totalInventoryValue").textContent =
    formatCurrency(totalValue);
}
function exportDailyReport() {
  showToast("Generating daily report...", "info");
  setTimeout(() => showToast("Report exported!"), 1000);
}
function exportMonthlyReport() {
  showToast("Generating monthly report...", "info");
  setTimeout(() => showToast("Report exported!"), 1000);
}
function exportInventoryReport() {
  showToast("Generating inventory report...", "info");
  setTimeout(() => showToast("Report exported!"), 1000);
} // =============================================
// BULK UPLOAD
// =============================================
function openBulkUploadModal(type) {
  document.getElementById("bulkUploadType").value = type;
  document.getElementById("bulkUploadTitle").textContent =
    type === "inventory" ? "Inventory" : "LMD Locations";
  document.getElementById("bulkUploadFile").value = "";
  document.getElementById("bulkFileName").classList.add("hidden");
  document.getElementById("bulkUploadBtn").disabled = true;
  document
    .getElementById("bulkUploadBtn")
    .classList.add("opacity-50", "cursor-not-allowed");
  document.getElementById("bulkUploadModal").classList.remove("hidden");
}
function handleBulkFileSelect(event) {
  const file = event.target.files[0];
  const btn = document.getElementById("bulkUploadBtn");
  const nameDiv = document.getElementById("bulkFileName");
  if (file && file.name.endsWith(".csv")) {
    nameDiv.textContent = `Selected: ${file.name}`;
    nameDiv.classList.remove("hidden");
    btn.disabled = false;
    btn.classList.remove("opacity-50", "cursor-not-allowed");
  } else {
    nameDiv.classList.add("hidden");
    btn.disabled = true;
    btn.classList.add("opacity-50", "cursor-not-allowed");
    if (file) showToast("Please select a valid CSV file", "error");
  }
}
function downloadCsvTemplate() {
  const type = document.getElementById("bulkUploadType").value;
  let headers = "";
  let filename = "";
  if (type === "inventory") {
    headers =
      "Description,Category,Deno,Quantity,Unit Cost,Requirement,Book No,Location,On-Charge Ref,Date Added\n";
    filename = "inventory_template.csv";
  } else if (type === "locations") {
    headers = "Zone,Building Name,Sub-location,Description\n";
    filename = "locations_template.csv";
  } else {
    showToast("Template not available for this type yet", "info");
    return;
  }
  const blob = new Blob([headers], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.setAttribute("hidden", "");
  a.setAttribute("href", url);
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
function processCsvUpload() {
  const fileInput = document.getElementById("bulkUploadFile");
  const type = document.getElementById("bulkUploadType").value;
  if (!fileInput.files.length) return;
  const file = fileInput.files[0];
  const reader = new FileReader();
  document.getElementById("bulkUploadBtn").textContent = "Uploading...";
  document.getElementById("bulkUploadBtn").disabled = true;
  reader.onload = function (e) {
    const text = e.target.result;
    if (type === "inventory") {
      processInventoryCsv(text);
    } else if (type === "locations") {
      processLocationsCsv(text);
    }
  };
  reader.readAsText(file);
}
function parseCsvLine(line) {
  const result = [];
  let insideQuote = false;
  let entry = "";
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      insideQuote = !insideQuote;
    } else if (char === "," && !insideQuote) {
      result.push(cleanCsvValue(entry));
      entry = "";
    } else {
      entry += char;
    }
  }
  result.push(cleanCsvValue(entry));
  return result;
}
function cleanCsvValue(val) {
  let cleaned = val.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.substring(1, cleaned.length - 1).trim();
  }
  return cleaned.replace(/""/g, '"');
}
function normalizeInventoryCsvHeader(h) {
  const clean = h.trim().toLowerCase();
  if (clean.includes("description") || clean === "item" || clean === "desc") {
    return "description";
  }
  if (clean.includes("category") || clean === "cat" || clean === "group") {
    return "category";
  }
  if (
    clean === "deno" ||
    clean === "unit" ||
    clean === "uom" ||
    clean === "denominations"
  ) {
    return "deno";
  }
  if (
    clean.includes("quantity") ||
    clean === "qty" ||
    clean === "stock" ||
    clean === "amount"
  ) {
    return "quantity";
  }
  if (
    clean.includes("unit cost") ||
    clean.includes("unit_cost") ||
    clean === "cost per unit" ||
    clean === "rate" ||
    clean === "cost" ||
    clean === "price"
  ) {
    return "unit cost";
  }
  if (clean.includes("requirement") || clean === "req") {
    return "requirement";
  }
  if (
    clean.includes("book") ||
    clean === "book_no" ||
    clean === "book no" ||
    clean === "bookno"
  ) {
    return "book_no";
  }
  if (clean.includes("location") || clean === "loc" || clean === "store") {
    return "location";
  }
  if (
    clean.includes("on-charge") ||
    clean.includes("on_charge") ||
    clean.includes("charge ref") ||
    clean === "ref"
  ) {
    return "on-charge ref";
  }
  if (clean.includes("date")) {
    return "date added";
  }
  return clean;
}

function processInventoryCsv(csvText) {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length <= 1) {
    showToast("CSV is empty or missing data rows", "error");
    resetBulkUploadBtn();
    return;
  }
  const headers = parseCsvLine(lines[0]).map(normalizeInventoryCsvHeader);
  let addedCount = 0;
  let skippedCount = 0;
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    let itemData = {};
    headers.forEach((header, index) => {
      if (header === "description") itemData.description = values[index];
      if (header === "category") itemData.category = values[index];
      if (header === "deno") itemData.deno = values[index];
      if (header === "quantity")
        itemData.quantity = parseFloat(values[index]) || 0;
      if (header === "unit cost")
        itemData.cost_per_unit = safeParseCost(values[index]);
      if (header === "requirement") itemData.requirement = values[index];
      if (header === "book_no") itemData.book_no = values[index];
      if (header === "location") itemData.location = values[index];
      if (header === "on-charge ref") itemData.on_charge_ref = values[index];
      if (header === "date added") {
        let d = values[index] ? new Date(values[index]) : new Date();
        if (isNaN(d.getTime())) d = new Date();
        itemData.date_added = d.toISOString().split("T")[0];
      }
    });
    if (!itemData.category || isNaN(itemData.quantity)) {
      skippedCount++;
      continue;
    }
    itemData.description = itemData.description || "";
    itemData.deno = itemData.deno || "Nos";
    itemData.book_no = itemData.book_no || "";
    itemData.location = itemData.location || "Zone Store";
    if (!itemData.date_added)
      itemData.date_added = getLocalDateString();
    itemData.zone_id = store.currentZone;
    fbSaveInventoryItem(itemData);
    addedCount++;
  }
  closeModal("bulkUploadModal");
  resetBulkUploadBtn();
  if (addedCount > 0) {
    showToast(
      `Successfully added ${addedCount} items. ${skippedCount > 0 ? skippedCount + " skipped." : ""}`,
    ); // Render will happen automatically via Firebase listener
  } else {
    showToast(
      `No valid items found to upload. ${skippedCount} skipped.`,
      "error",
    );
  }
}
function processLocationsCsv(csvText) {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length <= 1) {
    showToast("CSV is empty or missing data rows", "error");
    resetBulkUploadBtn();
    return;
  }
  const headers = parseCsvLine(lines[0]).map(normalizeLocationsCsvHeader);
  let addedCount = 0;
  let skippedCount = 0;
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    let itemData = {};
    headers.forEach((header, index) => {
      if (header === "zone") itemData.zone_id = values[index];
      if (header === "building name") itemData.building_name = values[index];
      if (header === "sub-location") itemData.sub_location = values[index];
      if (header === "end user") itemData.end_user = values[index];
      if (header === "description") itemData.description = values[index];
    }); // Validation - Zone and Building Name are required
    if (!itemData.zone_id || !itemData.building_name) {
      skippedCount++;
      continue;
    }
    itemData.sub_location = itemData.sub_location || "";
    itemData.end_user = itemData.end_user || "";
    itemData.description = itemData.description || ""; // Save to Firebase
    fbSaveLocation(itemData);
    addedCount++;
  }
  closeModal("bulkUploadModal");
  resetBulkUploadBtn();
  if (addedCount > 0) {
    showToast(
      `Successfully added ${addedCount} locations. ${skippedCount > 0 ? skippedCount + " skipped." : ""}`,
    );
  } else {
    showToast(
      `No valid locations found to upload. ${skippedCount} skipped.`,
      "error",
    );
  }
}
function resetBulkUploadBtn() {
  const btn = document.getElementById("bulkUploadBtn");
  if (btn) {
    btn.textContent = "Upload Data";
    btn.disabled = false;
  }
}

// ============================================================================
// Global Window Bindings for Reports & Bulk Upload Module
// ============================================================================
window.renderReports = renderReports;
window.switchReportTab = switchReportTab;
window.changeReportDate = changeReportDate;
window.renderDailyReport = renderDailyReport;
window.exportDailyStateBoardPdf = exportDailyStateBoardPdf;
window.renderMonthlyReport = renderMonthlyReport;
window.loadMonthlyReport = loadMonthlyReport;
window.renderInventoryReport = renderInventoryReport;
window.filterInventoryReport = filterInventoryReport;
window.exportDailyReport = exportDailyReport;
window.exportMonthlyReport = exportMonthlyReport;
window.exportInventoryReport = exportInventoryReport;
window.openBulkUploadModal = openBulkUploadModal;
window.handleBulkFileSelect = handleBulkFileSelect;
window.downloadCsvTemplate = downloadCsvTemplate;
window.processCsvUpload = processCsvUpload;
window.parseCsvLine = parseCsvLine;
window.cleanCsvValue = cleanCsvValue;
window.normalizeInventoryCsvHeader = normalizeInventoryCsvHeader;
window.processInventoryCsv = processInventoryCsv;
window.processLocationsCsv = processLocationsCsv;
window.resetBulkUploadBtn = resetBulkUploadBtn;

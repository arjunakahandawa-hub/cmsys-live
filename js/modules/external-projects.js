// ============================================================================
// CMSys Module: External Projects Management (PTM) & Cloud / Drive Backups
// File: js/modules/external-projects.js
// ============================================================================

window.currentPtmType = null;
window.currentPtmProjectId = null;

// =============================================
// PDF BACKUP & GOOGLE DRIVE BACKUP SYSTEM
// =============================================
function generateWorkOrdersPdfBlob(dateVal, targetZoneId, requestedScale = "auto") {
  const isAll = !targetZoneId || String(targetZoneId).toLowerCase() === "all";
  const reportData = typeof buildDailyDetailsReportData === "function"
    ? buildDailyDetailsReportData(isAll ? "all" : "selected", targetZoneId)
    : null;

  const element = document.createElement("div");
  element.style.padding = "0px";
  element.style.margin = "0px";
  element.style.background = "#ffffff";
  element.style.fontFamily = "'Iskoola Pota', 'Nirmala UI', 'Noto Sans Sinhala', 'Segoe UI', Arial, sans-serif";
  element.style.color = "#000";
  element.style.boxSizing = "border-box";

  // Calculate intelligent scale
  let scaleFactor = 1.0;
  if (typeof requestedScale === "number" && requestedScale > 0) {
    scaleFactor = requestedScale;
  } else if (typeof requestedScale === "string" && requestedScale !== "auto" && !isNaN(parseFloat(requestedScale))) {
    scaleFactor = parseFloat(requestedScale);
  } else {
    // Auto-fit 1-page logic for single zone reports
    const sailorCount = reportData ? (reportData.totalReportStrength || 0) : 0;
    if (!isAll) {
      if (sailorCount > 24 && sailorCount <= 32) {
        scaleFactor = 0.94;
      } else if (sailorCount > 32 && sailorCount <= 40) {
        scaleFactor = 0.86;
      } else if (sailorCount > 40) {
        scaleFactor = 0.82;
      }
    }
  }

  if (scaleFactor !== 1.0) {
    element.style.transform = `scale(${scaleFactor})`;
    element.style.transformOrigin = "top left";
    element.style.width = `${(100 / scaleFactor).toFixed(2)}%`;
  } else {
    element.style.width = "100%";
  }

  if (reportData && reportData.bodyContentHtml) {
    element.innerHTML = `
      <style>
        body, table, th, td, div, p, span { font-family: 'Iskoola Pota', 'Nirmala UI', 'Noto Sans Sinhala', 'Segoe UI', Arial, sans-serif; }
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
        .daily-details-summary th { background-color: #f8fafc; color: #0f172a; font-weight: 700; font-size: 9.5px; }
        .daily-details-summary td { font-weight: 700; font-size: 10px; color: #0f172a; }
        .daily-details-summary .summary-total { background-color: #f1f5f9; font-weight: 800; }

        .report-bottom-block { page-break-inside: avoid; break-inside: avoid; }
        .signature-section { margin-top: 18px; display: flex; justify-content: space-between; font-size: 10.5px; page-break-inside: avoid; break-inside: avoid; }
        .sig-block { text-align: center; width: 200px; }
        .sig-block p { margin: 2px 0; }
        
        .footer { margin-top: 14px; font-size: 8.5px; color: #64748b; text-align: right; border-top: 1px solid #e2e8f0; padding-top: 6px; }
        .no-print { display: none !important; }
        tr, .report-bottom-block, .signature-section { page-break-inside: avoid !important; break-inside: avoid !important; }
      </style>
      ${reportData.bodyContentHtml}
    `;
  }
  return element;
}
function downloadWorkOrdersPdfBackup(targetZoneId, requestedScale = "auto") {
  showToast("Preparing PDF backup...", "info");
  const today = getLocalDateString();
  const dateVal = store.dashboardDate || today;
  const zoneScope = targetZoneId || store.currentZone || "all";
  const isAll = String(zoneScope).toLowerCase() === "all";
  const displayZoneName = isAll ? "ALL ZONES" : (formatZoneDisplayName(zoneScope) || zoneScope);
  const safeZone = String(displayZoneName).replace(/[/\\:*?"<>|]/g, "").trim();
  const safeDate = String(dateVal).replace(/[/\\:*?"<>|]/g, "-").trim();
  const pdfFileName = `${safeZone} - Daily Details - ${safeDate}.pdf`;

  const element = generateWorkOrdersPdfBlob(dateVal, zoneScope, requestedScale);
  const opt = {
    margin: [6, 6, 6, 6],
    filename: pdfFileName,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };
  html2pdf()
    .set(opt)
    .from(element)
    .save()
    .then(() => {
      showToast(`PDF downloaded: ${pdfFileName}`);
    })
    .catch((err) => {
      console.error(err);
      showToast("Failed to download PDF backup.", "error");
    });
}
function uploadWorkOrdersPdfToDrive() {
  const clientId = (store.settings || {}).googleClientId || "";
  if (!clientId) {
    openGoogleConfigModal();
    return;
  }
  showToast("Connecting to Google Drive...", "info");
  const client = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: "https://www.googleapis.com/auth/drive.file",
    callback: (response) => {
      if (response.error) {
        showToast(`Google Authentication failed: ${response.error}`, "error");
        return;
      }
      if (response.access_token) {
        performGoogleDriveUpload(response.access_token);
      }
    },
  });
  client.requestAccessToken();
}
function performGoogleDriveUpload(accessToken) {
  showToast("Generating PDF & Uploading...", "info");
  const today = getLocalDateString();
  const dateVal = store.dashboardDate || today;
  const zoneScope = store.currentZone || "all";
  const isAll = String(zoneScope).toLowerCase() === "all";
  const displayZoneName = isAll ? "ALL ZONES" : (formatZoneDisplayName(zoneScope) || zoneScope);
  const safeZone = String(displayZoneName).replace(/[/\\:*?"<>|]/g, "").trim();
  const safeDate = String(dateVal).replace(/[/\\:*?"<>|]/g, "-").trim();
  const pdfFileName = `${safeZone} - Daily Details - ${safeDate}.pdf`;

  const element = generateWorkOrdersPdfBlob(dateVal, zoneScope);
  const opt = {
    margin: 10,
    filename: pdfFileName,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };
  html2pdf()
    .set(opt)
    .from(element)
    .output("blob")
    .then((pdfBlob) => {
      const metadata = {
        name: pdfFileName,
        mimeType: "application/pdf",
      };
      const form = new FormData();
      form.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" }),
      );
      form.append("file", pdfBlob);
      fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: form,
        },
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.id) {
            showToast("✅ Upload to Google Drive successful!");
          } else {
            var _data$error;
            showToast(
              "❌ Google Drive upload failed: " +
                (((_data$error = data.error) === null || _data$error === void 0
                  ? void 0
                  : _data$error.message) || "Unknown error"),
              "error",
            );
          }
        })
        .catch((err) => {
          console.error(err);
          showToast("Failed to upload file to Google Drive.", "error");
        });
    });
}
function openGoogleConfigModal() {
  const s = store.settings || {};
  document.getElementById("cfg-googleClientIdModal").value =
    s.googleClientId || "";
  document.getElementById("googleConfigModal").classList.remove("hidden");
}
function saveGoogleConfigFromModal() {
  const val = document.getElementById("cfg-googleClientIdModal").value.trim();
  if (!val) {
    showToast("Please enter a valid Client ID", "error");
    return;
  }
  saveSettingField("googleClientId", val);
  closeModal("googleConfigModal");
  showToast("Google Client ID saved. Retrying upload...");
  setTimeout(() => {
    uploadWorkOrdersPdfToDrive();
  }, 1000);
}

// AVAIL Copy Function
document.addEventListener('DOMContentLoaded', () => {
  // Handle mobile preview mode from URL query (?mobile=true)
  if (window.location.search.includes("mobile=true") || window.location.hash.includes("mobile")) {
    document.documentElement.classList.add("mobile-preview-mode");
    const mobileBar = document.getElementById("mobileTabBar");
    if (mobileBar) {
      mobileBar.classList.remove("md:hidden");
      mobileBar.style.display = "flex";
    }
    document.body.style.paddingBottom = "68px";
  }

  const availSpan = document.getElementById('availableCount');
  if (availSpan && availSpan.parentElement) {
    availSpan.parentElement.style.cursor = 'pointer';
    availSpan.parentElement.title = 'Click to copy Available Sailors list';
    availSpan.parentElement.addEventListener('click', () => {
      if (!store.sailors) return;
      const availableSailors = store.sailors.filter(s => s.status === 'Available');
      if (availableSailors.length === 0) {
        if (typeof showToast === 'function') showToast('No available sailors to copy!', 'error');
        return;
      }
      let textToCopy = 'AVAILABLE SAILORS (' + availableSailors.length + ')\n';
      textToCopy += '--------------------------------------------------\n';
      textToCopy += 'RANK\tNAME\tOFF NO\tTRADE\n';
      textToCopy += '--------------------------------------------------\n';
      availableSailors.forEach(s => {
        const offNoStr = s.official_number || s.service_no || '-';
        textToCopy += `${s.rank || '-'} \t${s.name || '-'} \t${offNoStr} \t${s.trade || '-'}\n`;
      });
      navigator.clipboard.writeText(textToCopy).then(() => {
        if (typeof showToast === 'function') showToast(`Successfully copied ${availableSailors.length} Available Sailors to clipboard!`);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
        if (typeof showToast === 'function') showToast('Failed to copy text. Check console for details.', 'error');
      });
    });
  }
});

// ==========================================
// EXTERNAL PROJECTS MANAGEMENT (Ops DB)
// ==========================================

window.currentPtmType = null;
window.currentPtmProjectId = null;

function normalizeProjectDateStr(d) {
    if (!d) return null;
    const s = String(d).trim().replace(/[./]/g, "-");
    const parts = s.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
    }
    return s;
}

function parseProjectApprovalDates(proj) {
    if (!proj) return { startDate: null, endDate: null, isParsedFromName: false };

    // 1. Explicit properties on proj object
    const explicitStart = proj.start_date || proj.startDate || null;
    const explicitEnd = proj.end_date || proj.endDate || null;
    if (explicitStart || explicitEnd) {
        return {
            startDate: explicitStart ? normalizeProjectDateStr(explicitStart) : null,
            endDate: explicitEnd ? normalizeProjectDateStr(explicitEnd) : null,
            isParsedFromName: false
        };
    }

    // 2. Parse from project name (e.g. 2026.09.09 - 2026.09.26 or 2026-09-14 / 2026-10-01)
    const name = String(proj.name || "");
    const rangeRegex = /(\d{4})[./-](\d{1,2})[./-](\d{1,2})\s*(?:[-/]|to|\s)\s*(\d{4})[./-](\d{1,2})[./-](\d{1,2})/i;
    const match = name.match(rangeRegex);
    if (match) {
        const sY = match[1], sM = match[2].padStart(2, "0"), sD = match[3].padStart(2, "0");
        const eY = match[4], eM = match[5].padStart(2, "0"), eD = match[6].padStart(2, "0");
        return {
            startDate: `${sY}-${sM}-${sD}`,
            endDate: `${eY}-${eM}-${eD}`,
            isParsedFromName: true
        };
    }

    // Pattern for single end/deadline date
    const singleDateRegex = /(?:up to|until|end|till|approval:?)\s*(\d{4})[./-](\d{1,2})[./-](\d{1,2})/i;
    const singleMatch = name.match(singleDateRegex);
    if (singleMatch) {
        const eY = singleMatch[1], eM = singleMatch[2].padStart(2, "0"), eD = singleMatch[3].padStart(2, "0");
        return {
            startDate: null,
            endDate: `${eY}-${eM}-${eD}`,
            isParsedFromName: true
        };
    }

    return { startDate: null, endDate: null, isParsedFromName: false };
}

function getProjectApprovalStatus(startDate, endDate) {
    if (!endDate) {
        return {
            status: "no_dates",
            label: "Dates not specified",
            daysRemaining: null,
            isWarning: false,
            isExpired: false,
            isEndingSoon: false,
            badgeClass: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700",
            icon: "📅"
        };
    }

    const todayStr = (typeof getLocalDateString === "function") 
        ? getLocalDateString() 
        : (() => {
            const now = new Date();
            return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        })();

    const tDate = new Date(todayStr + "T00:00:00");
    const eDate = new Date(endDate + "T00:00:00");
    const diffDays = Math.round((eDate - tDate) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        const daysAgo = Math.abs(diffDays);
        return {
            status: "expired",
            label: `Approval Expired (${daysAgo}d ago)`,
            daysRemaining: diffDays,
            isWarning: true,
            isExpired: true,
            isEndingSoon: false,
            badgeClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold",
            icon: "🔴"
        };
    } else if (diffDays === 0) {
        return {
            status: "ends_today",
            label: "Approval Ends Today!",
            daysRemaining: 0,
            isWarning: true,
            isExpired: false,
            isEndingSoon: true,
            badgeClass: "bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/40 font-extrabold animate-pulse",
            icon: "🚨"
        };
    } else if (diffDays <= 5) {
        return {
            status: "ending_soon",
            label: `Ending Soon (${diffDays}d left)`,
            daysRemaining: diffDays,
            isWarning: true,
            isExpired: false,
            isEndingSoon: true,
            badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold",
            icon: "⚠️"
        };
    } else {
        return {
            status: "active",
            label: `Approved (${diffDays}d left)`,
            daysRemaining: diffDays,
            isWarning: false,
            isExpired: false,
            isEndingSoon: false,
            badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-medium",
            icon: "🟢"
        };
    }
}

function isSeniorSailorRank(rankStr) {
    if (!rankStr) return false;
    const r = rankStr.trim().toUpperCase();
    return (
        /^(PO|CPO|FCPO|MCPO|MCA|CPOA|WPO|SWPO)/.test(r) ||
        r.includes("PO") ||
        r.includes("CPO") ||
        r.includes("CHIEF") ||
        r.includes("MCA")
    );
}

function isVolunteerSailor(s) {
    if (!s) return false;
    const off = String(s.official_number || s.off_no || s.service_no || "").trim().toUpperCase();
    const cat = String(s.category || "").trim().toUpperCase();
    return off.startsWith("VAS") || cat === "VAS" || cat === "VSS";
}

function getProjectSailorComplement(proj) {
    if (!proj || !proj.assigned_sailors) {
        return {
            totalCount: 0,
            ssCount: 0,
            regCount: 0,
            vssCount: 0,
            vssTrades: {},
            vssSummaryStr: ""
        };
    }

    const assignedIds = Object.keys(proj.assigned_sailors);
    if (assignedIds.length === 0) {
        return {
            totalCount: 0,
            ssCount: 0,
            regCount: 0,
            vssCount: 0,
            vssTrades: {},
            vssSummaryStr: ""
        };
    }

    const assignedSailors = [];
    const seenKeys = new Set();
    const allSailors = Array.isArray(store.sailors) ? store.sailors : [];

    assignedIds.forEach(id => {
        const idStr = String(id).trim();
        const idDigits = idStr.replace(/\D/g, "");
        const matched = allSailors.find(s => {
            const sid = String(s._fbKey || s.id || "").trim();
            if (sid === idStr) return true;
            const soff = String(s.official_number || s.official_no || s.service_no || "").trim();
            if (soff.toLowerCase() === idStr.toLowerCase()) return true;
            const sDigits = soff.replace(/\D/g, "");
            return idDigits.length >= 3 && sDigits.length >= 3 && idDigits === sDigits;
        });

        if (matched) {
            const key = String(matched._fbKey || matched.id);
            if (!seenKeys.has(key)) {
                seenKeys.add(key);
                assignedSailors.push(matched);
            }
        } else {
            if (!seenKeys.has(idStr)) {
                seenKeys.add(idStr);
                assignedSailors.push({ id: idStr, rank: "", trade: "", category: "Regular" });
            }
        }
    });

    let ssCount = 0;
    let regCount = 0;
    let vssCount = 0;
    const vssTrades = {};

    assignedSailors.forEach(s => {
        if (isSeniorSailorRank(s.rank)) {
            ssCount++;
        } else if (isVolunteerSailor(s)) {
            vssCount++;
            let t = (s.trade || "MA").trim().toUpperCase();
            if (t === "WE" || t === "WEL") t = "WL";
            vssTrades[t] = (vssTrades[t] || 0) + 1;
        } else {
            regCount++;
        }
    });

    const sortedTrades = Object.entries(vssTrades).sort((a, b) => b[1] - a[1]);
    const tradeParts = sortedTrades.map(([t, cnt]) => `${cnt} ${t}`);
    const vssSummaryStr = tradeParts.join(", ");

    return {
        totalCount: assignedIds.length,
        ssCount,
        regCount,
        vssCount,
        vssTrades,
        vssSummaryStr
    };
}

function renderProjectsList() {
    const renderCards = (projectsObj, containerId, type) => {
        const container = document.getElementById(containerId);
        if(!container) return;
        container.innerHTML = "";
        const projects = Object.entries(projectsObj || {});

        // 1. Calculate Section-level telemetry
        const totalProjects = projects.length;
        let totalAllocated = 0;
        let totalSS = 0;
        let totalReg = 0;
        let totalVSS = 0;
        const vssTradeTotals = {};
        let warningCount = 0;

        projects.forEach(([id, proj]) => {
            const comp = getProjectSailorComplement(proj);
            totalAllocated += comp.totalCount;
            totalSS += comp.ssCount;
            totalReg += comp.regCount;
            totalVSS += comp.vssCount;
            Object.entries(comp.vssTrades).forEach(([tr, cnt]) => {
                vssTradeTotals[tr] = (vssTradeTotals[tr] || 0) + cnt;
            });

            const dates = parseProjectApprovalDates(proj);
            const status = getProjectApprovalStatus(dates.startDate, dates.endDate);
            if (status.isWarning) {
                warningCount++;
            }
        });

        // 2. Render or Update Section Summary Telemetry Strip
        let summaryEl = document.getElementById(`${containerId}_summary`);
        if (!summaryEl) {
            summaryEl = document.createElement("div");
            summaryEl.id = `${containerId}_summary`;
            container.parentNode.insertBefore(summaryEl, container);
        }

        const vssSortedTrades = Object.entries(vssTradeTotals).sort((a, b) => b[1] - a[1]);
        const vssTradeParts = vssSortedTrades.map(([t, cnt]) => `${cnt} ${t}`);
        const vssTradeSummary = vssTradeParts.slice(0, 4).join(", ") + (vssTradeParts.length > 4 ? "..." : "");
        const vssTradeBadgeText = vssTradeSummary ? `<span class="text-[10px] text-amber-300 font-normal">(${vssTradeSummary})</span>` : "";
        const vssTradeTitle = vssTradeParts.join(", ") || "No VSS allocated";

        let warningBadgeHtml = "";
        if (warningCount > 0) {
            warningBadgeHtml = `
                <span class="px-2.5 py-1 bg-rose-500/25 text-rose-200 border border-rose-500/50 rounded-lg text-xs font-black flex items-center gap-1 animate-pulse">
                    ⚠️ ${warningCount} Approval Alert${warningCount > 1 ? "s" : ""}
                </span>
            `;
        } else if (totalProjects > 0) {
            warningBadgeHtml = `
                <span class="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium flex items-center gap-1">
                    ✓ All Approvals Active
                </span>
            `;
        }

        summaryEl.innerHTML = `
            <div class="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white p-3.5 sm:p-4 rounded-xl shadow-xs border border-slate-700/60 mb-4">
                <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div class="flex flex-wrap items-center gap-2.5">
                        <div class="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-700/70">
                            <span class="text-[11px] text-slate-400 uppercase font-bold tracking-wider">📂 Projects:</span>
                            <span class="text-sm font-black text-teal-300">${totalProjects}</span>
                        </div>
                        <div class="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-700/70">
                            <span class="text-[11px] text-slate-400 uppercase font-bold tracking-wider">👥 Total Allocated:</span>
                            <span class="text-sm font-black text-blue-300">${totalAllocated} <span class="text-xs font-semibold text-slate-300">Sailors</span></span>
                        </div>
                    </div>

                    <div class="flex flex-wrap items-center gap-2">
                        <span class="px-2.5 py-1 bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 rounded-lg text-xs font-bold flex items-center gap-1" title="Senior Sailors (PO, CPO, FCPO, MCPO, MCA)">
                            🎖️ S/S: <strong class="text-white font-black">${totalSS}</strong>
                        </span>
                        <span class="px-2.5 py-1 bg-sky-500/20 text-sky-200 border border-sky-500/40 rounded-lg text-xs font-bold flex items-center gap-1" title="Regular Sailors">
                            ⚓ Reg: <strong class="text-white font-black">${totalReg}</strong>
                        </span>
                        <span class="px-2.5 py-1 bg-amber-500/20 text-amber-200 border border-amber-500/40 rounded-lg text-xs font-bold flex items-center gap-1 cursor-help" title="${vssTradeTitle}">
                            🛠️ VSS: <strong class="text-white font-black">${totalVSS}</strong> ${vssTradeBadgeText}
                        </span>
                        ${warningBadgeHtml}
                    </div>
                </div>
            </div>
        `;

        // 3. Render Cards
        if(projects.length === 0) {
            container.innerHTML = `<div class="col-span-full py-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 border-dashed">No active ${type}s</div>`;
            return;
        }

        projects.forEach(([id, proj]) => {
            const comp = getProjectSailorComplement(proj);
            const dates = parseProjectApprovalDates(proj);
            const status = getProjectApprovalStatus(dates.startDate, dates.endDate);

            // Warning styling for card container
            let borderHighlight = "border-slate-200 dark:border-slate-700/80 hover:border-teal-400";
            if (status.isExpired) {
                borderHighlight = "border-rose-300 dark:border-rose-700/80 bg-rose-50/20 dark:bg-rose-950/10 ring-1 ring-rose-200 dark:ring-rose-900/40 hover:border-rose-400";
            } else if (status.isEndingSoon) {
                borderHighlight = "border-amber-300 dark:border-amber-700/80 bg-amber-50/20 dark:bg-amber-950/10 ring-1 ring-amber-200 dark:ring-amber-900/40 hover:border-amber-400";
            }

            const card = document.createElement("div");
            card.className = `bg-white dark:bg-slate-800/90 rounded-xl border ${borderHighlight} p-4 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between`;
            card.onclick = () => openProjectManagerModal(type, id, proj.name);

            // Date string representation
            let dateRangeStr = "";
            if (dates.startDate && dates.endDate) {
                dateRangeStr = `<span class="font-semibold text-slate-700 dark:text-slate-200">${dates.startDate}</span> <span class="text-slate-400">➔</span> <span class="font-semibold text-slate-700 dark:text-slate-200">${dates.endDate}</span>`;
            } else if (dates.endDate) {
                dateRangeStr = `<span class="text-slate-400">Until:</span> <span class="font-semibold text-slate-700 dark:text-slate-200">${dates.endDate}</span>`;
            } else if (dates.startDate) {
                dateRangeStr = `<span class="text-slate-400">From:</span> <span class="font-semibold text-slate-700 dark:text-slate-200">${dates.startDate}</span>`;
            } else {
                dateRangeStr = `<span class="italic text-slate-400">Dates not specified</span>`;
            }

            // Complement detail row
            let complementHtml = "";
            if (comp.totalCount > 0) {
                const vssBadgeStr = comp.vssSummaryStr ? ` (${comp.vssSummaryStr})` : "";
                complementHtml = `
                    <div class="flex flex-wrap items-center gap-1.5 text-[11px] mt-2">
                        <span class="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-bold px-1.5 py-0.5 rounded">
                            🎖️ ${comp.ssCount} S/S
                        </span>
                        <span class="bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 font-bold px-1.5 py-0.5 rounded">
                            ⚓ ${comp.regCount} Reg
                        </span>
                        <span class="bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-bold px-1.5 py-0.5 rounded" title="${comp.vssSummaryStr || 'None'}">
                            🛠️ ${comp.vssCount} VSS<span class="font-normal text-[10px] ml-0.5">${vssBadgeStr}</span>
                        </span>
                    </div>
                `;
            } else {
                complementHtml = `
                    <div class="text-[11px] text-slate-400 italic mt-2">
                        No sailors allocated
                    </div>
                `;
            }

            const safeName = (proj.name || "").replace(/'/g, "\\'");

            card.innerHTML = `
                <div>
                    <div class="flex justify-between items-start gap-2 mb-2">
                        <h4 class="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug line-clamp-2" title="${proj.name}">${proj.name}</h4>
                        <div class="flex items-center gap-1 flex-shrink-0">
                            <button onclick="event.stopPropagation(); openProjectManagerModal('${type}', '${id}', '${safeName}')" class="text-blue-500 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md p-1 transition-colors" title="Edit Approval Dates & Team">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </button>
                            <button onclick="deleteProject(event, '${type}', '${id}')" class="text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md p-1 transition-colors" title="Delete Project">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Approval Dates & Warning Badge -->
                    <div class="space-y-1.5 py-1.5 border-t border-b border-slate-100 dark:border-slate-700/60 my-2">
                        <div class="flex items-center justify-between text-xs gap-2">
                            <span class="text-slate-500 dark:text-slate-400 font-medium text-[11px] flex items-center gap-1">
                                📅 Approval:
                            </span>
                            <span class="text-[11px]">
                                ${dateRangeStr}
                            </span>
                        </div>
                        <div class="flex items-center justify-end">
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${status.badgeClass}">
                                <span>${status.icon}</span>
                                <span>${status.label}</span>
                            </span>
                        </div>
                    </div>

                    <!-- Sailor Complement Breakdown -->
                    <div>
                        <div class="flex items-center justify-between text-xs">
                            <span class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Allocated Crew:</span>
                            <span class="bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200 text-[11px] font-black px-2 py-0.5 rounded-full">${comp.totalCount} Sailors</span>
                        </div>
                        ${complementHtml}
                    </div>
                </div>

                <div class="flex justify-between items-center mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                    <span class="text-[10px] text-slate-400 font-medium">Click to manage crew</span>
                    <div class="text-xs text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider flex items-center gap-0.5 hover:translate-x-0.5 transition-transform">
                        Manage Team ➔
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    };

    renderCards(store.outProjects, "outProjectsList", "Out Project");
    renderCards(store.housingProjects, "housingProjectsList", "Housing Project");
    renderCards(store.otherBases, "otherBasesList", "Other Base");
}

function createNewProject(type) {
    document.getElementById("createProjectTitle").textContent = `New ${type}`;
    document.getElementById("newProjectName").value = "";
    if (document.getElementById("newProjectStartDate")) document.getElementById("newProjectStartDate").value = "";
    if (document.getElementById("newProjectEndDate")) document.getElementById("newProjectEndDate").value = "";
    document.getElementById("newProjectType").value = type;
    document.getElementById("createProjectModal").classList.remove("hidden");
}

function submitNewProject() {
    const name = document.getElementById("newProjectName").value.trim();
    const type = document.getElementById("newProjectType").value;
    const startDate = document.getElementById("newProjectStartDate") ? document.getElementById("newProjectStartDate").value : "";
    const endDate = document.getElementById("newProjectEndDate") ? document.getElementById("newProjectEndDate").value : "";

    if(!name) {
        if(typeof showToast === 'function') showToast("Project name is required", "error");
        return;
    }

    if (startDate && endDate && startDate > endDate) {
        if(typeof showToast === 'function') showToast("Start Date cannot be after End Date!", "error");
        return;
    }

    let node = "";
    if(type === "Out Project") node = "out_projects";
    else if(type === "Housing Project") node = "housing_projects";
    else if(type === "Other Base") node = "other_bases";
    
    if(node) {
        const payload = {
            name: name,
            created_at: Date.now()
        };
        if (startDate) payload.start_date = startDate;
        if (endDate) payload.end_date = endDate;

        opsDB.ref(node).push(payload).then(() => {
            if(typeof showToast === 'function') showToast(`${type} created successfully`);
            closeModal("createProjectModal");
            document.getElementById("newProjectName").value = "";
            if (document.getElementById("newProjectStartDate")) document.getElementById("newProjectStartDate").value = "";
            if (document.getElementById("newProjectEndDate")) document.getElementById("newProjectEndDate").value = "";
        }).catch(err => {
            if(typeof showToast === 'function') showToast("Error creating project", "error");
            console.error(err);
        });
    }
}

window.deleteProject = function(event, type, id) {
    event.stopPropagation();
    if(!confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) {
        return;
    }
    
    let node = "";
    let storeKey = "";
    if(type === "Out Project") { node = "out_projects"; storeKey = "outProjects"; }
    else if(type === "Housing Project") { node = "housing_projects"; storeKey = "housingProjects"; }
    else if(type === "Other Base") { node = "other_bases"; storeKey = "otherBases"; }
    
    if (storeKey && store[storeKey] && store[storeKey][id]) {
        delete store[storeKey][id];
        updateCounters();
        if (typeof renderSummaryView === "function") renderSummaryView();
    }
    
    if(node) {
        opsDB.ref(`${node}/${id}`).remove().then(() => {
            if(typeof showToast === 'function') showToast(`${type} deleted successfully`);
            updateCounters();
            if (typeof renderSummaryView === "function") renderSummaryView();
        }).catch(err => {
            if(typeof showToast === 'function') showToast("Error deleting project", "error");
            console.error(err);
        });
    }
}

function updatePtmApprovalBadge() {
    const badgeEl = document.getElementById("ptmApprovalStatusBadge");
    if (!badgeEl) return;
    const startVal = document.getElementById("ptmStartDate") ? document.getElementById("ptmStartDate").value : "";
    const endVal = document.getElementById("ptmEndDate") ? document.getElementById("ptmEndDate").value : "";

    const status = getProjectApprovalStatus(startVal, endVal);
    badgeEl.innerHTML = `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${status.badgeClass}">
            <span>${status.icon}</span>
            <span>${status.label}</span>
        </span>
    `;
}

function saveProjectDates() {
    if (!currentPtmType || !currentPtmProjectId) return;
    const startDate = document.getElementById("ptmStartDate") ? document.getElementById("ptmStartDate").value : "";
    const endDate = document.getElementById("ptmEndDate") ? document.getElementById("ptmEndDate").value : "";

    if (startDate && endDate && startDate > endDate) {
        if (typeof showToast === "function") showToast("Start Date cannot be after End Date!", "error");
        return;
    }

    let node = "";
    let storeKey = "";
    if (currentPtmType === "Out Project") { node = "out_projects"; storeKey = "outProjects"; }
    else if (currentPtmType === "Housing Project") { node = "housing_projects"; storeKey = "housingProjects"; }
    else if (currentPtmType === "Other Base") { node = "other_bases"; storeKey = "otherBases"; }

    // Update local store immediately
    if (storeKey && store[storeKey] && store[storeKey][currentPtmProjectId]) {
        store[storeKey][currentPtmProjectId].start_date = startDate || null;
        store[storeKey][currentPtmProjectId].end_date = endDate || null;
    }

    // Persist to Firebase
    if (node) {
        opsDB.ref(`${node}/${currentPtmProjectId}`).update({
            start_date: startDate || null,
            end_date: endDate || null
        }).then(() => {
            if (typeof showToast === "function") showToast("Project approval dates saved successfully!");
            updatePtmApprovalBadge();
            renderProjectsList();
        }).catch(err => {
            console.error("Error saving dates:", err);
            if (typeof showToast === "function") showToast("Failed to save project dates", "error");
        });
    }
}

function openProjectManagerModal(type, id, name) {
    currentPtmType = type;
    currentPtmProjectId = id;
    
    document.getElementById("ptmTitle").textContent = `Manage ${type} Team`;
    document.getElementById("ptmProjectName").textContent = name;
    document.getElementById("ptmSearch").value = "";
    
    // Resolve project data for dates
    let projectsObj = {};
    if (type === "Out Project") projectsObj = store.outProjects;
    else if (type === "Housing Project") projectsObj = store.housingProjects;
    else if (type === "Other Base") projectsObj = store.otherBases;
    const proj = (projectsObj && projectsObj[id]) ? projectsObj[id] : { name: name };

    const dates = parseProjectApprovalDates(proj);
    const startInput = document.getElementById("ptmStartDate");
    const endInput = document.getElementById("ptmEndDate");
    if (startInput) {
        startInput.value = dates.startDate || "";
        startInput.onchange = updatePtmApprovalBadge;
        startInput.oninput = updatePtmApprovalBadge;
    }
    if (endInput) {
        endInput.value = dates.endDate || "";
        endInput.onchange = updatePtmApprovalBadge;
        endInput.oninput = updatePtmApprovalBadge;
    }
    updatePtmApprovalBadge();

    renderPtmLists();
    document.getElementById("projectTeamModal").classList.remove("hidden");
}

window.saveProjectDates = saveProjectDates;
window.updatePtmApprovalBadge = updatePtmApprovalBadge;
window.createNewProject = createNewProject;
window.submitNewProject = submitNewProject;
window.openProjectManagerModal = openProjectManagerModal;

function filterPtmAvailableList() {
    renderPtmLists(document.getElementById("ptmSearch").value);
}

function renderPtmLists(filter = "") {
    if(!currentPtmType || !currentPtmProjectId) return;
    
    let projectsObj = {};
    if(currentPtmType === "Out Project") projectsObj = store.outProjects;
    else if(currentPtmType === "Housing Project") projectsObj = store.housingProjects;
    else if(currentPtmType === "Other Base") projectsObj = store.otherBases;
    
    const proj = projectsObj[currentPtmProjectId];
    const assignedIds = proj && proj.assigned_sailors ? Object.keys(proj.assigned_sailors) : [];
    
    const currentTeam = store.sailors.filter(s => assignedIds.includes(String(s._fbKey || s.id)));
    
    let eligible = store.sailors.filter(s => !assignedIds.includes(String(s._fbKey || s.id)));
    
    if (filter) {
        const q = filter.toLowerCase().trim();
        eligible = eligible.filter(
            (s) => {
                const offNoStr = String(s.official_number || s.official_no || "");
                return (s.name && s.name.toLowerCase().includes(q)) ||
                       (offNoStr.toLowerCase().includes(q)) ||
                       (s.rank && s.rank.toLowerCase().includes(q));
            }
        );
    }
    
    const currContainer = document.getElementById("ptmCurrentList");
    const availContainer = document.getElementById("ptmAvailableList");
    currContainer.innerHTML = "";
    availContainer.innerHTML = "";
    
    if (currentTeam.length === 0) {
        currContainer.innerHTML = `<div class="text-xs text-slate-400 italic p-2 bg-slate-50 rounded-lg text-center">No one assigned yet.</div>`;
    } else {
        currentTeam.forEach(s => {
            const div = document.createElement("div");
            div.className = "flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-200 mb-1";
            const offNo = s.official_number || s.official_no || s.service_no || "-";
            div.innerHTML = `
                <div>
                    <p class="text-xs font-bold text-slate-800">${s.rank || ""} ${s.name || ""}</p>
                    <p class="text-[10px] text-slate-500 font-medium">${offNo} • ${s.trade || ""}</p>
                </div>
                <button onclick="removePtmSailor('${s._fbKey || s.id}')" class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">Remove</button>
            `;
            currContainer.appendChild(div);
        });
    }
    
    eligible.forEach(s => {
        const div = document.createElement("div");
        div.className = "flex justify-between items-center p-2 border-b border-slate-100 last:border-0 hover:bg-slate-50 rounded-lg";
        const offNo = s.official_number || s.official_no || s.service_no || "-";
        div.innerHTML = `
            <div>
                <p class="text-xs font-bold text-slate-800">${s.rank || ""} ${s.name || ""}</p>
                <p class="text-[10px] text-slate-500 font-medium">${offNo} • ${s.trade || ""}</p>
            </div>
            <button onclick="addPtmSailor('${s._fbKey || s.id}')" class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">+ Add</button>
        `;
        availContainer.appendChild(div);
    });
}

function addPtmSailor(sailorId) {
    if(!currentPtmType || !currentPtmProjectId) return;
    let node = "";
    let storeKey = "";
    if(currentPtmType === "Out Project") { node = "out_projects"; storeKey = "outProjects"; }
    else if(currentPtmType === "Housing Project") { node = "housing_projects"; storeKey = "housingProjects"; }
    else if(currentPtmType === "Other Base") { node = "other_bases"; storeKey = "otherBases"; }
    
    if (storeKey && store[storeKey] && store[storeKey][currentPtmProjectId]) {
        if (!store[storeKey][currentPtmProjectId].assigned_sailors) {
            store[storeKey][currentPtmProjectId].assigned_sailors = {};
        }
        store[storeKey][currentPtmProjectId].assigned_sailors[sailorId] = { assigned_date: Date.now() };
        renderPtmLists(document.getElementById("ptmSearch") ? document.getElementById("ptmSearch").value : "");
        updateCounters();
        if (typeof renderSummaryView === "function") renderSummaryView();
    }
    
    opsDB.ref(`${node}/${currentPtmProjectId}/assigned_sailors/${sailorId}`).set(true)
        .then(() => {
            renderPtmLists(document.getElementById("ptmSearch") ? document.getElementById("ptmSearch").value : "");
            updateCounters();
            if (typeof renderSummaryView === "function") renderSummaryView();
        })
        .catch(err => console.error(err));
}

function removePtmSailor(sailorId) {
    if(!currentPtmType || !currentPtmProjectId) return;
    let node = "";
    let storeKey = "";
    if(currentPtmType === "Out Project") { node = "out_projects"; storeKey = "outProjects"; }
    else if(currentPtmType === "Housing Project") { node = "housing_projects"; storeKey = "housingProjects"; }
    else if(currentPtmType === "Other Base") { node = "other_bases"; storeKey = "otherBases"; }
    
    if (storeKey && store[storeKey] && store[storeKey][currentPtmProjectId] && store[storeKey][currentPtmProjectId].assigned_sailors) {
        delete store[storeKey][currentPtmProjectId].assigned_sailors[sailorId];
        renderPtmLists(document.getElementById("ptmSearch") ? document.getElementById("ptmSearch").value : "");
        updateCounters();
        if (typeof renderSummaryView === "function") renderSummaryView();
    }
    
    opsDB.ref(`${node}/${currentPtmProjectId}/assigned_sailors/${sailorId}`).remove()
        .then(() => {
            renderPtmLists(document.getElementById("ptmSearch") ? document.getElementById("ptmSearch").value : "");
            updateCounters();
            if (typeof renderSummaryView === "function") renderSummaryView();
        })
        .catch(err => console.error(err));
}



// ============================================================================
// Global Window Bindings for External Projects & Backup Module
// ============================================================================
window.generateWorkOrdersPdfBlob = generateWorkOrdersPdfBlob;
window.downloadWorkOrdersPdfBackup = downloadWorkOrdersPdfBackup;
window.uploadWorkOrdersPdfToDrive = uploadWorkOrdersPdfToDrive;
window.performGoogleDriveUpload = performGoogleDriveUpload;
window.openGoogleConfigModal = openGoogleConfigModal;
window.saveGoogleConfigFromModal = saveGoogleConfigFromModal;
window.normalizeProjectDateStr = normalizeProjectDateStr;
window.parseProjectApprovalDates = parseProjectApprovalDates;
window.getProjectApprovalStatus = getProjectApprovalStatus;
window.isSeniorSailorRank = isSeniorSailorRank;
window.isVolunteerSailor = isVolunteerSailor;
window.getProjectSailorComplement = getProjectSailorComplement;
window.renderProjectsList = renderProjectsList;
window.createNewProject = createNewProject;
window.submitNewProject = submitNewProject;
window.updatePtmApprovalBadge = updatePtmApprovalBadge;
window.saveProjectDates = saveProjectDates;
window.openProjectManagerModal = openProjectManagerModal;
window.filterPtmAvailableList = filterPtmAvailableList;
window.renderPtmLists = renderPtmLists;
window.addPtmSailor = addPtmSailor;
window.removePtmSailor = removePtmSailor;

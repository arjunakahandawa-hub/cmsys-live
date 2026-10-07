// =============================================================================
// CMSys Module: Date Schedule Calendar & Rooting Management
// File: js/modules/calendar.js
// =============================================================================

window.currentCalendarDate = (typeof window.currentCalendarDate !== "undefined") ? window.currentCalendarDate : new Date();

function renderDateScheduleCalendar() {
    const s = (typeof store !== "undefined" && store.settings) ? store.settings : {};
    if (!s.holidays) s.holidays = {};

    const monthYearEl = document.getElementById("calendarMonthYear");
    const gridEl = document.getElementById("calendarGrid");
    if (!monthYearEl || !gridEl) return;

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    monthYearEl.textContent = `${monthNames[month]} ${year}`;

    // Clear grid
    gridEl.innerHTML = "";

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "p-2 bg-slate-50/50 rounded-lg";
        gridEl.appendChild(emptyCell);
    }

    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dateObj = new Date(year, month, i);
        const dayOfWeek = dateObj.getDay();

        // Default: Sunday is Holiday, others Normal
        const isSunday = (dayOfWeek === 0);
        // Is marked explicitly?
        const explicitMark = s.holidays[dateStr]; 
        
        let isHoliday = false;
        if (explicitMark === true) isHoliday = true; // explicitly marked as holiday (Poya/Public)
        else if (explicitMark === false) isHoliday = false; // explicitly marked as normal (e.g. working Sunday)
        else isHoliday = isSunday; // default behavior

        const cell = document.createElement("div");
        cell.className = `p-2 min-h-[60px] flex flex-col justify-between rounded-lg cursor-pointer border hover:shadow-sm transition-all`;
        
        if (isHoliday) {
            cell.classList.add("bg-rose-50", "border-rose-200", "hover:border-rose-400");
        } else {
            cell.classList.add("bg-white", "border-slate-200", "hover:border-blue-400");
        }

        cell.innerHTML = `
            <div class="text-right font-bold ${isHoliday ? 'text-rose-700' : 'text-slate-700'}">${i}</div>
            <div class="text-[10px] uppercase font-bold text-center mt-1 ${isHoliday ? 'text-rose-500' : 'text-slate-400'}">
                ${isHoliday ? 'Sunday Rooting' : 'Normal'}
            </div>
        `;

        cell.onclick = () => toggleHoliday(dateStr, isHoliday, isSunday);

        gridEl.appendChild(cell);
    }
}

function changeCalendarMonth(offset) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + offset);
    renderDateScheduleCalendar();
}

function toggleHoliday(dateStr, currentlyHoliday, isSunday) {
    const s = (typeof store !== "undefined" && store.settings) ? store.settings : {};
    if (!s.holidays) s.holidays = {};

    // Toggle logic:
    // If it's a Sunday (default holiday) -> toggle to normal -> explicitMark = false
    // If it's a Sunday explicitly normal -> toggle to holiday -> explicitMark = true or remove explicitMark
    // If it's a weekday (default normal) -> toggle to holiday -> explicitMark = true
    // If it's a weekday explicitly holiday -> toggle to normal -> explicitMark = false or remove explicitMark

    if (currentlyHoliday) {
        // Toggle to normal
        if (isSunday) {
            s.holidays[dateStr] = false; 
        } else {
            delete s.holidays[dateStr]; // Revert to default normal
        }
    } else {
        // Toggle to holiday
        if (!isSunday) {
            s.holidays[dateStr] = true;
        } else {
            delete s.holidays[dateStr]; // Revert to default holiday
        }
    }

    // Save to Firebase immediately
    if (typeof saveSettingField === "function") {
        saveSettingField("holidays", s.holidays);
    }
    renderDateScheduleCalendar();
}

// Function to get current rooting type to display in banner
function getCurrentRootingType(dateObj = new Date()) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayOfWeek = dateObj.getDay();
    const isSunday = (dayOfWeek === 0);

    const s = (typeof store !== "undefined" && store.settings) ? store.settings : null;
    if (s && s.holidays) {
        const explicitMark = s.holidays[dateStr];
        if (explicitMark === true) return "Sunday Rooting (Holiday / Poya)";
        if (explicitMark === false) return "Normal Rooting";
    }
    
    return isSunday ? "Sunday Rooting" : "Normal Rooting";
}

function isCurrentDayHoliday(dateObj = new Date()) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayOfWeek = dateObj.getDay();
    const isSunday = (dayOfWeek === 0);

    const s = (typeof store !== "undefined" && store.settings) ? store.settings : null;
    if (s && s.holidays) {
        const explicitMark = s.holidays[dateStr];
        if (explicitMark === true) return true;
        if (explicitMark === false) return false;
    }
    return isSunday;
}

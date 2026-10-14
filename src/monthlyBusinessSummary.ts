import { supabase } from "./lib/supabase";
import { roundTo2 } from "./lib/calculations";

let started = false;
let refreshTimer: number | undefined;
let monthlyRows: Array<[string, { trips: number; revenue: number; profit: number }]> = [];
let currentMonthKey = "";
let currentMonthLabel = "";
let reportExpanded = false;
let reportRendering = false;
let monthlyTripsData: Array<any> = [];
let monthlyMaintenanceData: Array<any> = [];
let monthlyVehiclesData: Array<any> = [];

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value || 0);

const monthKey = (value: string | null | undefined) => {
  if (!value) return "";
  const match = String(value).match(/^(\d{4})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}`;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? ""
    : `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
};

const monthLabel = (key: string) => {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const findKpiCard = (label: string) => {
  const labelEl = Array.from(document.querySelectorAll<HTMLElement>("div")).find(
    (el) => el.textContent?.trim() === label
  );
  return labelEl?.parentElement;
};

const updateCard = (label: string, value: string, subtitle: string) => {
  const card = findKpiCard(label);
  if (!card) return;
  const valueEl = card.children[1] as HTMLElement | undefined;
  const subtitleEl = card.children[2] as HTMLElement | undefined;
  if (valueEl) valueEl.textContent = value;
  if (subtitleEl) subtitleEl.textContent = subtitle;
};

function renderMonthlyReport() {
  if (reportRendering) return;
  reportRendering = true;

  try {
    const fleetLabel = Array.from(document.querySelectorAll<HTMLElement>("div")).find(
      (el) => el.textContent?.trim() === "Fleet Vehicles"
    );
    const kpiGrid = fleetLabel?.parentElement?.parentElement;
    if (!kpiGrid) return;

    let report = document.getElementById("monthly-business-report");
    if (!report) {
      report = document.createElement("section");
      report.id = "monthly-business-report";
      kpiGrid.insertAdjacentElement("afterend", report);
    }

    // Use the same fixed outer-card and single internal scrolling-list structure as
    // HomePage's All Completed Trips section.
    report.className = "lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs h-[620px] flex flex-col overflow-hidden";

    // This report is rebuilt every 10 seconds. Preserve the one list's scroll offset
    // before replacing its HTML, then restore it so the list does not jump to the top.
    const previousScrollTop = report.querySelector<HTMLElement>('[data-monthly-scroll="list"]')?.scrollTop ?? 0;

    const visibleRows = reportExpanded ? monthlyRows : monthlyRows.slice(0, 1);
    const monthCards = visibleRows
      .map(([key, row]) => `
        <button type="button" data-month-key="${key}" class="w-full text-left p-4 rounded-xl border border-slate-200/90 ${key === currentMonthKey ? "bg-blue-50/50" : "bg-slate-50/40"} hover:bg-white hover:shadow-xs transition cursor-pointer" title="View vehicle-wise performance">
          <div class="flex items-center justify-between gap-3 mb-3">
            <span class="font-mono text-sm font-bold text-slate-900">${monthLabel(key)}</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="rounded-lg bg-white/80 border border-slate-200/70 p-3">
              <div class="text-xs text-slate-500">Trips</div>
              <div class="text-sm font-bold text-slate-800 font-mono mt-1">${row.trips}</div>
            </div>
            <div class="rounded-lg bg-white/80 border border-slate-200/70 p-3">
              <div class="text-xs text-slate-500">Revenue</div>
              <div class="text-sm font-bold text-slate-800 font-mono mt-1">${money(row.revenue)}</div>
            </div>
            <div class="rounded-lg bg-emerald-50/80 border border-emerald-100 p-3">
              <div class="text-xs text-emerald-700">Net Profit</div>
              <div class="text-sm font-bold text-emerald-700 font-mono mt-1">${money(row.profit)}</div>
            </div>
          </div>
        </button>
      `)
      .join("");

    const showViewAll = monthlyRows.length > 0;
    const viewAllLabel = reportExpanded
      ? "Show Current (1)"
      : `View All (${monthlyRows.length} Months)`;

    const reportHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Monthly Business Report</span>
            <span class="text-xs font-normal text-slate-500">(${visibleRows.length} of ${monthlyRows.length})</span>
          </h2>
          <p class="text-xs text-slate-500 mt-1">Current month: ${currentMonthLabel}</p>
        </div>
        ${showViewAll ? `<button id="monthly-business-report-toggle" type="button" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 transition shadow-xs"><span>${viewAllLabel}</span><span class="text-[14px] transition-transform ${reportExpanded ? "rotate-90" : ""}">›</span></button>` : ""}
      </div>

      <div data-monthly-scroll="list" class="flex-1 min-h-0 overflow-y-auto overscroll-y-contain pr-1 space-y-3" style="flex: 1 1 0%; min-height: 0; overflow-y: auto; overscroll-behavior-y: contain; WebkitOverflowScrolling: touch; touchAction: pan-y;">
        ${monthCards || '<div class="py-8 text-center text-slate-500">No monthly business data yet.</div>'}
      </div>
    `;

    // Avoid replacing the scrolling DOM every 10 seconds when the report data has
    // not changed. Replacing innerHTML interrupts wheel/touch momentum scrolling.
    if (report.innerHTML !== reportHTML) {
      report.innerHTML = reportHTML;
      const scrollContainer = report.querySelector<HTMLElement>('[data-monthly-scroll="list"]');
      if (scrollContainer) scrollContainer.scrollTop = previousScrollTop;
    }

    // Click handling is delegated to document so the controls continue to work
    // even though this report is re-rendered from innerHTML during data refreshes.
    // The button styling/behavior intentionally matches Home -> Recent Completed Trips.

  } finally {
    reportRendering = false;
  }
}

function handleMonthlyBusinessReportClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  if (!target) return;

  const toggle = target.closest<HTMLElement>("#monthly-business-report-toggle");
  if (toggle) {
    event.preventDefault();
    event.stopPropagation();
    reportExpanded = !reportExpanded;
    renderMonthlyReport();
    void refreshMonthlyBusinessSummary();
    return;
  }

  const monthRow = target.closest<HTMLElement>("[data-month-key]");
  if (monthRow) {
    event.preventDefault();
    event.stopPropagation();
    const key = monthRow.dataset.monthKey;
    if (key) showVehicleMonthlyPerformance(key);
  }
}

function showVehicleMonthlyPerformance(key: string) {
  const monthTrips = monthlyTripsData.filter((trip) => monthKey(trip.trip_date) === key);
  const monthMaintenance = monthlyMaintenanceData.filter((record) => monthKey(record.maintenance_date) === key);
  const vehicleNumberMap = new Map(
    monthlyVehiclesData.map((vehicle) => [String(vehicle.id), String(vehicle.vehicle_number || vehicle.id)])
  );
  const vehicles = new Map<string, { vehicleNumber: string; trips: number; freightFare: number; profit: number; totalKms: number }>();

  for (const trip of monthTrips) {
    const vehicleId = String(trip.vehicle_id || "unknown");
    const vehicleNumber = vehicleNumberMap.get(vehicleId) || String(trip.vehicle_number || vehicleId);
    const row = vehicles.get(vehicleId) || { vehicleNumber, trips: 0, freightFare: 0, profit: 0, totalKms: 0 };
    row.trips += 1;
    row.freightFare = roundTo2(row.freightFare + (Number(trip.trip_fare) || 0));
    row.totalKms = roundTo2(row.totalKms + (Number(trip.trip_running_kms) || 0));
    // Overall Profit = trip net profit + this month's loading/unloading halting charges.
    row.profit = roundTo2(row.profit + (Number(trip.net_profit) || 0));
    row.profit = roundTo2(row.profit + (Number(trip.loading_halting_fare) || 0));
    row.profit = roundTo2(row.profit + (Number(trip.unloading_halting_fare) || 0));
    vehicles.set(vehicleId, row);
  }

  for (const record of monthMaintenance) {
    const row = vehicles.get(String(record.vehicle_id || "unknown"));
    if (row) row.profit -= Number(record.amount) || 0;
  }

  // Keep the fleet's requested order in both desktop table and mobile cards.
  const vehicleOrder = ["1056", "1499", "4061", "1359", "4710"];
  const vehicleRank = (vehicleNumber: string) => {
    const normalized = vehicleNumber.replace(/\\s+/g, "").toUpperCase();
    const rank = vehicleOrder.findIndex((number) => normalized.endsWith(number));
    return rank === -1 ? vehicleOrder.length : rank;
  };
  const rows = Array.from(vehicles.values()).sort((a, b) => {
    const rankDifference = vehicleRank(a.vehicleNumber) - vehicleRank(b.vehicleNumber);
    return rankDifference || a.vehicleNumber.localeCompare(b.vehicleNumber);
  });
  const totalFare = rows.reduce((sum, row) => sum + row.freightFare, 0);
  const totalProfit = rows.reduce((sum, row) => sum + row.profit, 0);
  const totalKms = rows.reduce((sum, row) => sum + row.totalKms, 0);

  let modal = document.getElementById("monthly-business-vehicle-performance-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "monthly-business-vehicle-performance-modal";
    document.body.appendChild(modal);
  }

  const tableRows = rows.length
    ? rows.map((row) => `
        <tr class="border-b border-slate-100">
          <td class="px-4 sm:px-6 py-4 font-bold text-slate-800 font-mono">${row.vehicleNumber}</td>
          <td class="px-4 sm:px-6 py-4 text-right font-bold text-slate-700 font-mono">${row.trips}</td>
          <td class="px-4 sm:px-6 py-4 text-right font-bold text-blue-700 font-mono">${money(row.freightFare)}</td>
          <td class="px-4 sm:px-6 py-4 text-right font-bold text-slate-700 font-mono">${roundTo2(row.totalKms)} km</td>
          <td class="px-4 sm:px-6 py-4 text-right font-bold text-emerald-700 font-mono">${money(row.profit)}</td>
        </tr>
      `).join("")
    : '<tr><td colspan="5" class="px-6 py-10 text-center text-slate-500">No vehicle trip data for this month.</td></tr>';

  modal.innerHTML = `
    <div class="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6" data-monthly-modal-backdrop>
      <div class="mx-auto my-2 sm:my-4 w-full max-w-5xl h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)] max-h-[900px] flex flex-col overflow-hidden bg-white rounded-2xl shadow-2xl border border-slate-200">
        <div class="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 class="text-lg sm:text-xl font-black text-slate-900">Vehicle-wise Monthly Performance</h2>
            <p class="text-sm text-slate-500 mt-1">${monthLabel(key)}</p>
          </div>
          <button type="button" data-monthly-modal-close class="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition" aria-label="Close">
            <span class="text-2xl leading-none">&times;</span>
          </button>
        </div>
        <div class="flex-1 min-h-0 overflow-y-auto">
          <div class="hidden sm:block overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-100 sticky top-0">
                <tr>
                  <th class="text-left px-4 sm:px-6 py-3 text-xs uppercase tracking-wide text-slate-500 font-bold">Vehicle Numbers</th>
                  <th class="text-right px-4 sm:px-6 py-3 text-xs uppercase tracking-wide text-slate-500 font-bold">Total Trips</th>
                  <th class="text-right px-4 sm:px-6 py-3 text-xs uppercase tracking-wide text-slate-500 font-bold">Total Freight Fare</th>
                  <th class="text-right px-4 sm:px-6 py-3 text-xs uppercase tracking-wide text-slate-500 font-bold">Total KMs</th>
                  <th class="text-right px-4 sm:px-6 py-3 text-xs uppercase tracking-wide text-slate-500 font-bold">Overall Profit</th>
                </tr>
              </thead>
              <tbody>${tableRows}</tbody>
              <tfoot class="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td class="px-4 sm:px-6 py-4 font-black text-slate-900">Overall Total</td>
                  <td class="px-4 sm:px-6 py-4 text-right font-black text-slate-700 font-mono">${rows.reduce((sum, row) => sum + row.trips, 0)}</td>
                  <td class="px-4 sm:px-6 py-4 text-right font-black text-blue-700 font-mono">${money(totalFare)}</td>
                  <td class="px-4 sm:px-6 py-4 text-right font-black text-slate-700 font-mono">${roundTo2(totalKms)} km</td>
                  <td class="px-4 sm:px-6 py-4 text-right font-black text-emerald-700 font-mono">${money(totalProfit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div class="sm:hidden p-4 space-y-3">
            ${rows.length ? rows.map((row) => `
              <div class="rounded-xl border border-slate-200 p-4 bg-white">
                <div class="font-bold text-slate-900 font-mono">${row.vehicleNumber}</div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  <div class="rounded-lg bg-slate-50 p-3"><div class="text-[10px] uppercase tracking-wide text-slate-600">Total Trips</div><div class="font-bold text-slate-700 font-mono mt-1">${row.trips}</div></div><div class="rounded-lg bg-blue-50 p-3"><div class="text-[10px] uppercase tracking-wide text-blue-700">Total Freight Fare</div><div class="font-bold text-blue-700 font-mono mt-1">${money(row.freightFare)}</div></div><div class="rounded-lg bg-slate-50 p-3"><div class="text-[10px] uppercase tracking-wide text-slate-600">Total KMs</div><div class="font-bold text-slate-700 font-mono mt-1">${roundTo2(row.totalKms)} km</div></div>
                  <div class="rounded-lg bg-emerald-50 p-3"><div class="text-[10px] uppercase tracking-wide text-emerald-700">Overall Profit</div><div class="font-bold text-emerald-700 font-mono mt-1">${money(row.profit)}</div></div>
                </div>
              </div>
            `).join("") : '<div class="py-10 text-center text-slate-500">No vehicle trip data for this month.</div>'}
            ${rows.length ? `<div class="rounded-xl border border-slate-200 bg-slate-50 p-4"><div class="font-black text-slate-900">Overall Total</div><div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3"><div><div class="text-[10px] uppercase text-slate-500">Total Trips</div><div class="font-black text-slate-700 font-mono">${rows.reduce((sum, row) => sum + row.trips, 0)}</div></div><div><div class="text-[10px] uppercase text-slate-500">Freight Fare</div><div class="font-black text-blue-700 font-mono">${money(totalFare)}</div></div><div><div class="text-[10px] uppercase text-slate-500">Total KMs</div><div class="font-black text-slate-700 font-mono">${roundTo2(totalKms)} km</div></div><div><div class="text-[10px] uppercase text-slate-500">Overall Profit</div><div class="font-black text-emerald-700 font-mono">${money(totalProfit)}</div></div></div></div>` : ""}
          </div>
        </div>
        <div class="flex justify-end px-5 sm:px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button type="button" data-monthly-modal-close class="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition">Close</button>
        </div>
      </div>
    </div>
  `;

  const close = () => { modal?.remove(); };
  modal.querySelectorAll<HTMLElement>("[data-monthly-modal-close]").forEach((button) => button.addEventListener("click", close));
  modal.querySelector<HTMLElement>("[data-monthly-modal-backdrop]")?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) close();
  });
}

async function refreshMonthlyBusinessSummary() {
  if (!supabase) return;

  const [{ data: trips, error: tripsError }, { data: maintenance, error: maintenanceError }, { data: vehicles, error: vehiclesError }] = await Promise.all([
    supabase
      .from("trips")
      .select("trip_date, trip_fare, trip_running_kms, net_profit, loading_halting_fare, unloading_halting_fare, vehicle_id"),
    supabase.from("maintenance").select("maintenance_date, amount, vehicle_id"),
    supabase.from("vehicles").select("id, vehicle_number"),
  ]);

  if (tripsError || maintenanceError || vehiclesError) {
    console.error("Monthly Business Report data load failed", {
      tripsError,
      maintenanceError,
      vehiclesError,
    });
    return;
  }

  monthlyTripsData = trips || [];
  monthlyMaintenanceData = maintenance || [];
  monthlyVehiclesData = vehicles || [];

  const now = new Date();
  currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  currentMonthLabel = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const monthly = new Map<string, { trips: number; revenue: number; profit: number }>();

  for (const trip of trips || []) {
    const key = monthKey(trip.trip_date);
    if (!key) continue;
    const row = monthly.get(key) || { trips: 0, revenue: 0, profit: 0 };
    row.trips += 1;
    row.revenue = roundTo2(row.revenue + (Number(trip.trip_fare) || 0));
    row.profit = roundTo2(row.profit + (Number(trip.net_profit) || 0));
    row.profit = roundTo2(row.profit + (Number(trip.loading_halting_fare) || 0));
    row.profit = roundTo2(row.profit + (Number(trip.unloading_halting_fare) || 0));
    monthly.set(key, row);
  }

  for (const record of maintenance || []) {
    const key = monthKey(record.maintenance_date);
    if (!key) continue;
    const row = monthly.get(key) || { trips: 0, revenue: 0, profit: 0 };
    row.profit -= Number(record.amount) || 0;
    monthly.set(key, row);
  }

  monthlyRows = Array.from(monthly.entries()).sort(([a], [b]) => b.localeCompare(a));

  renderMonthlyReport();
}

export function startMonthlyBusinessSummary() {
  if (started) return;
  started = true;

  const run = () => {
    void refreshMonthlyBusinessSummary();
  };

  document.addEventListener("click", handleMonthlyBusinessReportClick);


  const observer = new MutationObserver(() => {
    if (document.getElementById("home-action-add-trip-btn")) run();
  });
  observer.observe(document.getElementById("root") || document.body, { childList: true, subtree: true });

  run();
  refreshTimer = window.setInterval(run, 10000);
}

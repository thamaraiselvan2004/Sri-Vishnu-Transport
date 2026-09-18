import { supabase } from "./lib/supabase";

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
    maximumFractionDigits: 0,
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
      report.className = "mb-10 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden";
      kpiGrid.insertAdjacentElement("afterend", report);
    }

    if (monthlyRows.length <= 1) reportExpanded = false;

    const visibleRows = reportExpanded ? monthlyRows : monthlyRows.slice(0, 1);

    const mobileRows = visibleRows
      .map(([key, row]) => `
        <button type="button" data-month-key="${key}" class="w-full text-left p-4 rounded-xl border ${key === currentMonthKey ? "border-blue-300 bg-blue-50/50" : "border-slate-200 bg-white"} hover:border-blue-400 hover:shadow-sm transition cursor-pointer" title="Click to view vehicle-wise performance">
          <div class="flex items-center justify-between gap-2 mb-3">
            <div class="font-bold text-slate-900">${monthLabel(key)}</div>
            ${key === currentMonthKey ? '<span class="shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-blue-100 text-blue-700">Current</span>' : ""}
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-lg bg-slate-50 p-3">
              <div class="text-[11px] text-slate-500 uppercase tracking-wide">Total Trips</div>
              <div class="text-lg font-bold text-slate-800 mt-1">${row.trips}</div>
            </div>
            <div class="rounded-lg bg-slate-50 p-3">
              <div class="text-[11px] text-slate-500 uppercase tracking-wide">Revenue</div>
              <div class="text-base font-bold text-blue-700 font-mono mt-1 break-words">${money(row.revenue)}</div>
            </div>
            <div class="col-span-2 rounded-lg bg-emerald-50 p-3 border border-emerald-100">
              <div class="text-[11px] text-emerald-700 uppercase tracking-wide">Net Profit</div>
              <div class="text-xl font-black text-emerald-700 font-mono mt-1 break-words">${money(row.profit)}</div>
            </div>
          </div>
        </button>
      `)
      .join("");

    const desktopRows = visibleRows
      .map(([key, row]) => `
        <tr data-month-key="${key}" class="${key === currentMonthKey ? "bg-blue-50/50" : "bg-white"} hover:bg-blue-50/60 transition cursor-pointer" title="Click to view vehicle-wise performance">
          <td class="px-4 sm:px-6 py-4 font-bold text-slate-800">
            <div class="flex items-center gap-2 flex-wrap">
              <span>${monthLabel(key)}</span>
              ${key === currentMonthKey ? '<span class="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Current</span>' : ""}
            </div>
          </td>
          <td class="px-4 sm:px-6 py-4 text-right font-semibold text-slate-700">${row.trips}</td>
          <td class="px-4 sm:px-6 py-4 text-right font-semibold text-blue-700 font-mono">${money(row.revenue)}</td>
          <td class="px-4 sm:px-6 py-4 text-right font-bold text-emerald-700 font-mono">${money(row.profit)}</td>
        </tr>
      `)
      .join("");

    const emptyMessage = '<div class="px-4 py-8 text-center text-slate-500">No monthly business data yet.</div>';
    const showViewAll = monthlyRows.length > 1;
    const viewAllLabel = reportExpanded ? "View Less" : "View All";

    report.innerHTML = `
      <div class="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/70">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Monthly Business Report</h2>
            <p class="text-xs text-slate-500 mt-1">Monthly totals are calculated from the existing trip and maintenance records.</p>
          </div>
          <div class="flex items-center justify-between sm:justify-end gap-2">
            <div class="w-fit text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">Current: ${currentMonthLabel}</div>
            ${showViewAll ? `<button id="monthly-business-report-toggle" type="button" class="shrink-0 text-xs sm:text-sm font-bold text-blue-700 hover:text-blue-800 bg-white border border-blue-200 hover:border-blue-300 rounded-lg px-3 py-1.5 transition-colors touch-manipulation">${viewAllLabel}</button>` : ""}
          </div>
        </div>
      </div>

      <div class="p-4 sm:hidden space-y-3">
        ${mobileRows || emptyMessage}
      </div>

      <div class="hidden sm:block overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-100/80 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th class="text-left px-4 sm:px-6 py-3 font-bold">Month</th>
              <th class="text-right px-4 sm:px-6 py-3 font-bold">Total Trips</th>
              <th class="text-right px-4 sm:px-6 py-3 font-bold">Total Revenue</th>
              <th class="text-right px-4 sm:px-6 py-3 font-bold">Net Profit</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${desktopRows || '<tr><td colSpan="4" class="px-6 py-8 text-center text-slate-500">No monthly business data yet.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    report.querySelectorAll<HTMLElement>("[data-month-key]").forEach((el) => {
      el.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const key = el.dataset.monthKey;
        if (key) showVehicleMonthlyPerformance(key);
      });
    });

    const toggleButton = document.getElementById("monthly-business-report-toggle");
    toggleButton?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      reportExpanded = !reportExpanded;
      renderMonthlyReport();
      // Refresh data in the background; never block the button response on Supabase.
      void refreshMonthlyBusinessSummary();
    });
  } finally {
    reportRendering = false;
  }
}

function showVehicleMonthlyPerformance(key: string) {
  const monthTrips = monthlyTripsData.filter((trip) => monthKey(trip.trip_date) === key);
  const monthMaintenance = monthlyMaintenanceData.filter((record) => monthKey(record.maintenance_date) === key);
  const vehicleNumberMap = new Map(
    monthlyVehiclesData.map((vehicle) => [String(vehicle.id), String(vehicle.vehicle_number || vehicle.id)])
  );
  const vehicles = new Map<string, { vehicleNumber: string; freightFare: number; profit: number }>();

  for (const trip of monthTrips) {
    const vehicleId = String(trip.vehicle_id || "unknown");
    const vehicleNumber = vehicleNumberMap.get(vehicleId) || String(trip.vehicle_number || vehicleId);
    const row = vehicles.get(vehicleId) || { vehicleNumber, freightFare: 0, profit: 0 };
    row.freightFare += Number(trip.trip_fare) || 0;
    // Overall Profit = trip net profit + this month's loading/unloading halting charges.
    row.profit += Number(trip.net_profit) || 0;
    row.profit += Number(trip.loading_halting_fare) || 0;
    row.profit += Number(trip.unloading_halting_fare) || 0;
    vehicles.set(vehicleId, row);
  }

  for (const record of monthMaintenance) {
    const row = vehicles.get(String(record.vehicle_id || "unknown"));
    if (row) row.profit -= Number(record.amount) || 0;
  }

  const rows = Array.from(vehicles.values()).sort((a, b) => a.vehicleNumber.localeCompare(b.vehicleNumber));
  const totalFare = rows.reduce((sum, row) => sum + row.freightFare, 0);
  const totalProfit = rows.reduce((sum, row) => sum + row.profit, 0);

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
          <td class="px-4 sm:px-6 py-4 text-right font-bold text-blue-700 font-mono">${money(row.freightFare)}</td>
          <td class="px-4 sm:px-6 py-4 text-right font-bold text-emerald-700 font-mono">${money(row.profit)}</td>
        </tr>
      `).join("")
    : '<tr><td colspan="3" class="px-6 py-10 text-center text-slate-500">No vehicle trip data for this month.</td></tr>';

  modal.innerHTML = `
    <div class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" data-monthly-modal-backdrop>
      <div class="w-full max-w-4xl max-h-[85vh] overflow-hidden bg-white rounded-2xl shadow-2xl border border-slate-200">
        <div class="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 class="text-lg sm:text-xl font-black text-slate-900">Vehicle-wise Monthly Performance</h2>
            <p class="text-sm text-slate-500 mt-1">${monthLabel(key)}</p>
          </div>
          <button type="button" data-monthly-modal-close class="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition" aria-label="Close">
            <span class="text-2xl leading-none">&times;</span>
          </button>
        </div>
        <div class="overflow-y-auto max-h-[65vh]">
          <div class="hidden sm:block overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-100 sticky top-0">
                <tr>
                  <th class="text-left px-4 sm:px-6 py-3 text-xs uppercase tracking-wide text-slate-500 font-bold">Vehicle Numbers</th>
                  <th class="text-right px-4 sm:px-6 py-3 text-xs uppercase tracking-wide text-slate-500 font-bold">Total Freight Fare</th>
                  <th class="text-right px-4 sm:px-6 py-3 text-xs uppercase tracking-wide text-slate-500 font-bold">Overall Profit</th>
                </tr>
              </thead>
              <tbody>${tableRows}</tbody>
              <tfoot class="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td class="px-4 sm:px-6 py-4 font-black text-slate-900">Overall Total</td>
                  <td class="px-4 sm:px-6 py-4 text-right font-black text-blue-700 font-mono">${money(totalFare)}</td>
                  <td class="px-4 sm:px-6 py-4 text-right font-black text-emerald-700 font-mono">${money(totalProfit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div class="sm:hidden p-4 space-y-3">
            ${rows.length ? rows.map((row) => `
              <div class="rounded-xl border border-slate-200 p-4 bg-white">
                <div class="font-bold text-slate-900 font-mono">${row.vehicleNumber}</div>
                <div class="grid grid-cols-2 gap-3 mt-3">
                  <div class="rounded-lg bg-blue-50 p-3"><div class="text-[10px] uppercase tracking-wide text-blue-700">Total Freight Fare</div><div class="font-bold text-blue-700 font-mono mt-1">${money(row.freightFare)}</div></div>
                  <div class="rounded-lg bg-emerald-50 p-3"><div class="text-[10px] uppercase tracking-wide text-emerald-700">Overall Profit</div><div class="font-bold text-emerald-700 font-mono mt-1">${money(row.profit)}</div></div>
                </div>
              </div>
            `).join("") : '<div class="py-10 text-center text-slate-500">No vehicle trip data for this month.</div>'}
            ${rows.length ? `<div class="rounded-xl border border-slate-200 bg-slate-50 p-4"><div class="font-black text-slate-900">Overall Total</div><div class="grid grid-cols-2 gap-3 mt-3"><div><div class="text-[10px] uppercase text-slate-500">Freight Fare</div><div class="font-black text-blue-700 font-mono">${money(totalFare)}</div></div><div><div class="text-[10px] uppercase text-slate-500">Overall Profit</div><div class="font-black text-emerald-700 font-mono">${money(totalProfit)}</div></div></div></div>` : ""}
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
      .select("trip_date, trip_fare, net_profit, vehicle_id"),
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
    row.revenue += Number(trip.trip_fare) || 0;
    row.profit += Number(trip.net_profit) || 0;
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

  const observer = new MutationObserver(() => {
    if (document.getElementById("home-action-add-trip-btn")) run();
  });
  observer.observe(document.getElementById("root") || document.body, { childList: true, subtree: true });

  run();
  refreshTimer = window.setInterval(run, 10000);
}

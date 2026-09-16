import { supabase } from "./lib/supabase";

let started = false;
let refreshTimer: number | undefined;
let monthlyRows: Array<[string, { trips: number; revenue: number; profit: number }]> = [];
let currentMonthKey = "";
let currentMonthLabel = "";
let reportExpanded = false;
let reportRendering = false;

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
        <div class="p-4 rounded-xl border ${key === currentMonthKey ? "border-blue-300 bg-blue-50/50" : "border-slate-200 bg-white"}">
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
        </div>
      `)
      .join("");

    const desktopRows = visibleRows
      .map(([key, row]) => `
        <tr class="${key === currentMonthKey ? "bg-blue-50/50" : "bg-white"}">
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

async function refreshMonthlyBusinessSummary() {
  if (!supabase) return;

  const [{ data: trips }, { data: maintenance }] = await Promise.all([
    supabase
      .from("trips")
      .select("trip_date, trip_fare, net_profit, loading_halting_fare, unloading_halting_fare"),
    supabase.from("maintenance").select("maintenance_date, amount"),
  ]);

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
    row.profit += Number(trip.loading_halting_fare) || 0;
    row.profit += Number(trip.unloading_halting_fare) || 0;
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

  const current = monthly.get(currentMonthKey) || { trips: 0, revenue: 0, profit: 0 };
  updateCard("Total Trips", String(current.trips), currentMonthLabel);
  updateCard("Total Revenue", money(current.revenue), currentMonthLabel);
  updateCard("Net Business Profit", money(current.profit), `After all trip & service costs • ${currentMonthLabel}`);

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

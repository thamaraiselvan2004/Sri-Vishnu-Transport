import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { IndianRupee, Gauge, Fuel, Clock } from "lucide-react";
import { MaintenanceRecord, Trip, Vehicle } from "../types";
import { calculateVehicleStats, formatINR } from "../lib/calculations";
import { HaltingDetailsModal } from "./HaltingDetailsModal";

interface MonthlyVehiclePerformanceSnapshotProps {
  vehicle: Vehicle;
  trips: Trip[];
  maintenance: MaintenanceRecord[];
}

const getMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const MetricCard: React.FC<{
  field: string;
  label: string;
  value: React.ReactNode;
  hint: string;
  onClick: () => void;
  icon?: React.ReactNode;
  valueClass?: string;
  borderClass?: string;
}> = ({ label, value, hint, onClick, icon, valueClass = "text-slate-900", borderClass = "border border-slate-200" }) => (
  <button type="button" onClick={onClick} className={`w-full text-left bg-white p-5 rounded-2xl ${borderClass} shadow-xs hover:shadow-sm transition hover:border-blue-300 cursor-pointer`} aria-label={`View ${label} details`}>
    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">{icon}{label}</div>
    <div className={`text-2xl sm:text-3xl font-black font-mono mt-1 ${valueClass}`}>{value}</div>
    <div className="text-xs text-slate-500 mt-1">{hint}</div>
  </button>
);

export const MonthlyVehiclePerformanceSnapshot: React.FC<MonthlyVehiclePerformanceSnapshotProps> = ({
  vehicle,
  trips,
  maintenance,
}) => {
  const [currentMonthKey, setCurrentMonthKey] = useState(() => getMonthKey(new Date()));
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [selectedDetailField, setSelectedDetailField] = useState<string | null>(null);

  useEffect(() => {
    const checkMonth = () => {
      const nextMonthKey = getMonthKey(new Date());
      setCurrentMonthKey((current) => (current === nextMonthKey ? current : nextMonthKey));
    };

    checkMonth();
    const timer = window.setInterval(checkMonth, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    const mount = () => {
      if (cancelled) return;

      const headings = Array.from(document.querySelectorAll("h2"));
      const heading = headings.find((node) => node.textContent?.trim() === "Vehicle Performance Snapshot");
      const snapshotSection = heading?.closest<HTMLElement>(".space-y-3");
      if (!snapshotSection?.parentElement) {
        window.setTimeout(mount, 100);
        return;
      }

      const host = snapshotSection.parentElement;
      const placeholder = document.createElement("div");
      placeholder.id = "monthly-vehicle-performance-snapshot";
      host.insertBefore(placeholder, snapshotSection);

      const haltingSection = snapshotSection.nextElementSibling as HTMLElement | null;
      const previousSnapshotDisplay = snapshotSection.style.display;
      const previousHaltingDisplay = haltingSection?.style.display ?? "";
      snapshotSection.style.display = "none";
      if (haltingSection) haltingSection.style.display = "none";

      if (!cancelled) {
        setPortalTarget(placeholder);
      }

      cleanup = () => {
        setPortalTarget(null);
        if (placeholder.parentElement) placeholder.parentElement.removeChild(placeholder);
        snapshotSection.style.display = previousSnapshotDisplay;
        if (haltingSection) haltingSection.style.display = previousHaltingDisplay;
      };
    };

    mount();
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [vehicle.id]);

  const monthStats = useMemo(() => {
    const monthTrips = trips.filter((trip) => trip.vehicle_id === vehicle.id && trip.trip_date?.slice(0, 7) === currentMonthKey);
    const monthMaintenance = maintenance.filter(
      (record) => record.vehicle_id === vehicle.id && record.maintenance_date?.slice(0, 7) === currentMonthKey
    );

    const stats = calculateVehicleStats(
      vehicle.id,
      vehicle.vehicle_number,
      monthTrips,
      monthMaintenance
    );

    const totalHaltingDays = monthTrips.reduce((total, trip) => {
      const separate = trip.loading_halting_days !== undefined || trip.unloading_halting_days !== undefined;
      return total + (separate
        ? (Number(trip.loading_halting_days) || 0) + (Number(trip.unloading_halting_days) || 0)
        : (Number(trip.halting_days) || 0));
    }, 0);

    const totalHaltingCharges = monthTrips.reduce((total, trip) => {
      const separate = trip.loading_halting_fare !== undefined || trip.unloading_halting_fare !== undefined;
      return total + (separate
        ? (Number(trip.loading_halting_fare) || 0) + (Number(trip.unloading_halting_fare) || 0)
        : (Number(trip.halting_fare) || 0));
    }, 0);

    // Total received balance for this vehicle in the current snapshot month only.
    const receivedBalanceTrips = monthTrips
      .filter((trip) => (Number(trip.balance_amount) || 0) > 0)
      .sort((a, b) => String(b.trip_date || "").localeCompare(String(a.trip_date || "")));
    const totalReceivedBalance = receivedBalanceTrips.reduce(
      (total, trip) => total + (Number(trip.balance_amount) || 0),
      0
    );

    return {
      stats,
      monthTrips,
      totalHaltingDays,
      totalHaltingCharges,
      totalReceivedBalance,
      receivedBalanceTrips,
      overallProfit: stats.finalVehicleProfit + totalHaltingCharges,
    };
  }, [vehicle.id, vehicle.vehicle_number, trips, maintenance, currentMonthKey]);

  if (!portalTarget) return null;

  const { stats, monthTrips, totalHaltingDays, totalHaltingCharges, totalReceivedBalance, receivedBalanceTrips, overallProfit } = monthStats;

  return createPortal(
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Vehicle Performance Snapshot
        </h2>
        <span className="text-[11px] font-semibold text-blue-600">
          {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })} • {vehicle.vehicle_number}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard field="trips" label="No.of.Trips" value={stats.totalTrips} hint="Click to view this month's trip details" onClick={() => setSelectedDetailField("trips")} />
        <MetricCard field="freightFare" label="Total Freight Fare" value={formatINR(stats.totalTripRevenue)} valueClass="text-blue-700" hint="Click to view this month's trip-wise freight fare" onClick={() => setSelectedDetailField("freightFare")} />
        <MetricCard field="expenses" label="Total Expenses" value={formatINR(stats.totalAllExpenses)} valueClass="text-red-600" hint="Click to view this month's trip-wise expense details" onClick={() => setSelectedDetailField("expenses")} />
        <MetricCard field="finalNetProfit" label="Final Net Profit" value={formatINR(stats.finalVehicleProfit)} valueClass="text-emerald-700" borderClass="border-2 border-emerald-500/80 bg-emerald-50/20" hint={`Margin: ${stats.profitMargin}% • Click for trip-wise profit details`} onClick={() => setSelectedDetailField("finalNetProfit")} />
        <MetricCard field="distance" label="Distance" icon={<Gauge className="w-3.5 h-3.5 text-blue-600" />} value={`${stats.overallTripRunningKms} KM`} hint="Click to view this month's trip-wise distance" onClick={() => setSelectedDetailField("distance")} />
        <MetricCard field="toll" label="Total Toll Charges" icon={<IndianRupee className="w-3.5 h-3.5 text-indigo-600" />} value={formatINR(stats.overallTollExpense)} valueClass="text-indigo-700" hint="Click to view this month's trip-wise toll charges" onClick={() => setSelectedDetailField("toll")} />
        <MetricCard field="diesel" label="Overall Total Diesel" icon={<Fuel className="w-3.5 h-3.5 text-orange-600" />} value={`${stats.overallDieselLitres} Litres`} valueClass="text-orange-700" hint={`Total fuel cost: ${formatINR(stats.overallDieselExpense)} • Click for trip-wise fuel details`} onClick={() => setSelectedDetailField("diesel")} />
        <MetricCard field="mileage" label="Average Mileage" value={`${stats.overallMileage} km/L`} valueClass="text-amber-700" hint="Click to view this month's trip-wise mileage" onClick={() => setSelectedDetailField("mileage")} />

        <button type="button" onClick={() => setSelectedDetailField("receivedBalance")} className="w-full text-left bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition hover:border-emerald-300 cursor-pointer" aria-label={`View received balance details for vehicle ${vehicle.vehicle_number}`}>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5 text-emerald-600" />Total Received Balance</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 mt-1">{formatINR(totalReceivedBalance)}</div>
          <div className="text-xs text-slate-500 mt-1">Click to view this month's trip-wise received amounts</div>
        </button>

        <MetricCard field="maintenance" label="Service Maintenance" value={formatINR(stats.overallMaintenanceAmount)} valueClass="text-amber-600" hint={`${stats.maintenanceRecordCount} service records this month • Click for details`} onClick={() => setSelectedDetailField("maintenance")} />

        <button type="button" onClick={() => setSelectedDetailField("haltingDays")} className="w-full text-left bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition hover:border-violet-300 cursor-pointer" aria-label={`View halting details for vehicle ${vehicle.vehicle_number}`}>
          <div className="flex items-center justify-between text-slate-500"><span className="text-xs font-bold uppercase tracking-wide flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-violet-600" />Total Halting Days</span></div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-violet-700 mt-1">{totalHaltingDays} Days</div>
          <div className="text-xs text-slate-500 mt-1">Click to view loading + unloading halting details</div>
        </button>

        <MetricCard field="haltingCharges" label="Total Halting Charges" icon={<IndianRupee className="w-3.5 h-3.5 text-rose-600" />} value={formatINR(totalHaltingCharges)} valueClass="text-rose-700" hint="Click to view this month's trip-wise halting charges" onClick={() => setSelectedDetailField("haltingCharges")} />
        <MetricCard field="overallProfit" label="Overall Profit" value={formatINR(overallProfit)} valueClass={overallProfit >= 0 ? "text-violet-700" : "text-red-700"} borderClass="border-2 border-violet-500/80 bg-violet-50/20" hint="Final Net Profit + Total Halting Charges • Click for trip-wise details" onClick={() => setSelectedDetailField("overallProfit")} />
      </div>

            <HaltingDetailsModal
        isOpen={selectedDetailField === "haltingDays"}
        onClose={() => setSelectedDetailField(null)}
        driverName={`Vehicle ${vehicle.vehicle_number}`}
        trips={monthTrips}
      />

      {selectedDetailField === "receivedBalance" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setSelectedDetailField(null)}>
          <div className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="received-balance-details-title">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 id="received-balance-details-title" className="text-lg font-black text-slate-900">Received Balance Details</h3>
                <p className="text-xs font-semibold text-slate-500 mt-1">Vehicle {vehicle.vehicle_number} • {receivedBalanceTrips.length} trip{receivedBalanceTrips.length === 1 ? "" : "s"}</p>
              </div>
              <button type="button" onClick={() => setSelectedDetailField(null)} className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="Close received balance details">✕</button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto p-5">
              {receivedBalanceTrips.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No received balance amount has been recorded for this vehicle in this month.</div>
              ) : (
                <div className="space-y-3">
                  {receivedBalanceTrips.map((trip, index) => (
                    <div key={trip.id ?? `received-balance-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Trip {receivedBalanceTrips.length - index}</div>
                          <div className="text-sm font-bold text-slate-900 mt-1">Date: {trip.trip_date ? new Date(`${trip.trip_date}T00:00:00`).toLocaleDateString("en-IN") : "Date not available"}</div>
                          <div className="text-xs text-slate-500 mt-1">{trip.from_city || "—"} → {trip.to_city || "—"}</div>
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="text-xs font-bold uppercase tracking-wide text-emerald-700">Received Amount</div>
                          <div className="text-xl font-black font-mono text-emerald-700 mt-1">{formatINR(Number(trip.balance_amount) || 0)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-4">
              <span className="text-sm font-bold text-slate-700">Total Received Balance</span>
              <span className="text-lg font-black font-mono text-emerald-700">{formatINR(totalReceivedBalance)}</span>
            </div>
          </div>
        </div>
      )}

{selectedDetailField && selectedDetailField !== "receivedBalance" && selectedDetailField !== "haltingDays" && (() => {
        const detailTitleMap: Record<string, string> = {
          trips: "No.of.Trips",
          freightFare: "Total Freight Fare",
          expenses: "Total Expenses",
          finalNetProfit: "Final Net Profit",
          distance: "Distance",
          toll: "Total Toll Charges",
          diesel: "Overall Total Diesel",
          mileage: "Average Mileage",
          receivedBalance: "Total Received Balance",
          maintenance: "Service Maintenance",
          haltingDays: "Total Halting Days",
          haltingCharges: "Total Halting Charges",
          overallProfit: "Overall Profit",
        };
        const title = detailTitleMap[selectedDetailField] || "Trip Details";
        const sortedTrips = [...monthTrips].sort((a, b) => String(a.trip_date || "").localeCompare(String(b.trip_date || "")));
        const tripRows = sortedTrips.map((trip, index) => {
          const haltingDays = (Number(trip.loading_halting_days) || 0) + (Number(trip.unloading_halting_days) || 0) ||
            (Number(trip.halting_days) || 0);
          const haltingCharges = (Number(trip.loading_halting_fare) || 0) + (Number(trip.unloading_halting_fare) || 0) ||
            (Number(trip.halting_fare) || 0);
          const value =
            selectedDetailField === "trips" ? "Trip completed" :
            selectedDetailField === "freightFare" ? formatINR(Number(trip.trip_fare) || 0) :
            selectedDetailField === "expenses" ? formatINR(
              (Number(trip.broker_fare) || 0) + (Number(trip.driver_beta) || 0) +
              (Number(trip.loading_expense) || 0) + (Number(trip.unloading_expense) || 0) +
              (Number(trip.toll_charges) || 0) + (Number(trip.diesel_expense) || 0) +
              (Number(trip.other_expenses) || 0)
            ) :
            selectedDetailField === "finalNetProfit" ? formatINR(Number(trip.net_profit) || 0) :
            selectedDetailField === "distance" ? `${Number(trip.trip_running_kms) || 0} KM` :
            selectedDetailField === "toll" ? formatINR(Number(trip.toll_charges) || 0) :
            selectedDetailField === "diesel" ? `${Number(trip.diesel_litres) || 0} L • ${formatINR(Number(trip.diesel_expense) || 0)}` :
            selectedDetailField === "mileage" ? `${Number(trip.mileage) || 0} km/L` :
            selectedDetailField === "receivedBalance" ? formatINR(Number(trip.balance_amount) || 0) :
            selectedDetailField === "haltingDays" ? `${haltingDays} Days` :
            selectedDetailField === "haltingCharges" ? formatINR(haltingCharges) :
            selectedDetailField === "overallProfit" ? formatINR((Number(trip.net_profit) || 0) + haltingCharges) :
            "";
          return { trip, index, value, haltingDays, haltingCharges };
        });
        const maintenanceRows = monthStats.stats.maintenanceRecordCount
          ? maintenance.filter((record) => record.vehicle_id === vehicle.id && record.maintenance_date?.slice(0, 7) === currentMonthKey)
          : [];
        const tripTotal =
          selectedDetailField === "trips" ? monthTrips.length :
          selectedDetailField === "freightFare" ? monthTrips.reduce((s, t) => s + (Number(t.trip_fare) || 0), 0) :
          selectedDetailField === "expenses" ? monthTrips.reduce((s, t) => s +
            (Number(t.broker_fare) || 0) + (Number(t.driver_beta) || 0) + (Number(t.loading_expense) || 0) +
            (Number(t.unloading_expense) || 0) + (Number(t.toll_charges) || 0) + (Number(t.diesel_expense) || 0) +
            (Number(t.other_expenses) || 0), 0) :
          selectedDetailField === "finalNetProfit" ? monthTrips.reduce((s, t) => s + (Number(t.net_profit) || 0), 0) :
          selectedDetailField === "distance" ? monthTrips.reduce((s, t) => s + (Number(t.trip_running_kms) || 0), 0) :
          selectedDetailField === "toll" ? monthTrips.reduce((s, t) => s + (Number(t.toll_charges) || 0), 0) :
          selectedDetailField === "diesel" ? monthTrips.reduce((s, t) => s + (Number(t.diesel_litres) || 0), 0) :
          selectedDetailField === "mileage" ? (stats.overallMileage) :
          selectedDetailField === "receivedBalance" ? totalReceivedBalance :
          selectedDetailField === "haltingDays" ? totalHaltingDays :
          selectedDetailField === "haltingCharges" ? totalHaltingCharges :
          selectedDetailField === "overallProfit" ? overallProfit :
          0;
        return (
          <div className="fixed inset-0 z-[110] overflow-y-auto bg-slate-900/50 p-4" onClick={() => setSelectedDetailField(null)}>
            <div className="mx-auto my-4 w-full max-w-4xl max-h-[calc(100vh-2rem)] overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="vehicle-snapshot-detail-title">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h3 id="vehicle-snapshot-detail-title" className="text-lg font-black text-slate-900">{title}</h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Vehicle {vehicle.vehicle_number} • {new Date(`${currentMonthKey}-01T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
                </div>
                <button type="button" onClick={() => setSelectedDetailField(null)} className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="Close details">✕</button>
              </div>

              <div className="max-h-[65vh] overflow-y-auto p-5">
                {selectedDetailField === "maintenance" ? (
                  maintenanceRows.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No service maintenance records for this vehicle in this month.</div>
                  ) : (
                    <div className="space-y-3">
                      {maintenanceRows.map((record) => (
                        <div key={record.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{record.service_type || "Service"}</div>
                              <div className="text-sm font-bold text-slate-900 mt-1">{record.maintenance_date ? new Date(`${record.maintenance_date}T00:00:00`).toLocaleDateString("en-IN") : "Date not available"}</div>
                              {record.description && <div className="text-xs text-slate-500 mt-1">{record.description}</div>}
                            </div>
                            <div className="text-xl font-black font-mono text-amber-600">{formatINR(Number(record.amount) || 0)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  tripRows.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No trip records for this vehicle in this month.</div>
                  ) : (
                    <div className="space-y-3">
                      {tripRows.map(({ trip, index, value, haltingDays, haltingCharges }) => (
                        <div key={trip.id ?? `trip-detail-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Trip {index + 1}</div>
                              <div className="text-sm font-bold text-slate-900 mt-1">{trip.trip_date ? new Date(`${trip.trip_date}T00:00:00`).toLocaleDateString("en-IN") : "Date not available"}</div>
                              <div className="text-xs text-slate-500 mt-1">{trip.from_city || "—"} → {trip.to_city || "—"}</div>
                            </div>
                            <div className="text-left lg:text-right">
                              <div className="text-xs font-bold uppercase tracking-wide text-blue-700">{title}</div>
                              <div className="text-xl font-black font-mono text-slate-900 mt-1">{value}</div>
                              {selectedDetailField === "diesel" && <div className="text-xs text-slate-500 mt-1">Fuel cost: {formatINR(Number(trip.diesel_expense) || 0)} • {Number(trip.diesel_litres) || 0} litres</div>}
                              {selectedDetailField === "haltingCharges" && <div className="text-xs text-slate-500 mt-1">Loading: {formatINR(Number(trip.loading_halting_fare) || 0)} • Unloading: {formatINR(Number(trip.unloading_halting_fare) || 0)}</div>}
                              {selectedDetailField === "expenses" && <div className="text-xs text-slate-500 mt-1">Trip operating expenses only</div>}
                              {selectedDetailField === "overallProfit" && <div className="text-xs text-slate-500 mt-1">Net profit + halting charges</div>}
                              {selectedDetailField === "haltingDays" && <div className="text-xs text-slate-500 mt-1">Loading + unloading halting</div>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-4">
                <span className="text-sm font-bold text-slate-700">{title} Total</span>
                <span className="text-lg font-black font-mono text-blue-700">
                  {selectedDetailField === "diesel" ? `${tripTotal} Litres` :
                   selectedDetailField === "distance" ? `${tripTotal} KM` :
                   selectedDetailField === "mileage" ? `${tripTotal} km/L` :
                   selectedDetailField === "trips" ? `${tripTotal} Trips` :
                   formatINR(Number(tripTotal) || 0)}
                </span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>,
    portalTarget
  );
};

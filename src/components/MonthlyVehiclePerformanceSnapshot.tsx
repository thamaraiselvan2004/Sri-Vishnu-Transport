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

export const MonthlyVehiclePerformanceSnapshot: React.FC<MonthlyVehiclePerformanceSnapshotProps> = ({
  vehicle,
  trips,
  maintenance,
}) => {
  const [currentMonthKey, setCurrentMonthKey] = useState(() => getMonthKey(new Date()));
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [showHaltingDetails, setShowHaltingDetails] = useState(false);

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

    // Total received balance for this vehicle across all recorded trips.
    const totalReceivedBalance = trips
      .filter((trip) => trip.vehicle_id === vehicle.id)
      .reduce((total, trip) => total + (Number(trip.balance_amount) || 0), 0);

    return {
      stats,
      monthTrips,
      totalHaltingDays,
      totalHaltingCharges,
      totalReceivedBalance,
      overallProfit: stats.finalVehicleProfit + totalHaltingCharges,
    };
  }, [vehicle.id, vehicle.vehicle_number, trips, maintenance, currentMonthKey]);

  if (!portalTarget) return null;

  const { stats, monthTrips, totalHaltingDays, totalHaltingCharges, totalReceivedBalance, overallProfit } = monthStats;

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
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">No.of.Trips</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{stats.totalTrips}</div>
          <div className="text-xs text-slate-500 mt-1">Current month completed runs</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Freight Fare</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-blue-700 mt-1">{formatINR(stats.totalTripRevenue)}</div>
          <div className="text-xs text-slate-500 mt-1">Current month gross freight fare</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Expenses</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-red-600 mt-1">{formatINR(stats.totalAllExpenses)}</div>
          <div className="text-xs text-slate-500 mt-1">Current month trip costs + service</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-emerald-500/80 shadow-xs bg-emerald-50/20">
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Final Net Profit</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 mt-1">{formatINR(stats.finalVehicleProfit)}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">Margin: {stats.profitMargin}%</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5 text-blue-600" />
            <span>Distance</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 mt-1">{stats.overallTripRunningKms} KM</div>
          <div className="text-xs text-slate-500 mt-1">Current month total running distance</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
            <IndianRupee className="w-3.5 h-3.5 text-indigo-600" />
            <span>Total Toll Charges</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-indigo-700 mt-1">{formatINR(stats.overallTollExpense)}</div>
          <div className="text-xs text-slate-500 mt-1">Highway &amp; FASTag tolls this month</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
            <Fuel className="w-3.5 h-3.5 text-orange-600" />
            <span>Overall Total Diesel</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-orange-700 mt-1">{stats.overallDieselLitres} Litres</div>
          <div className="text-xs text-slate-500 mt-1 font-mono">Total fuel cost: {formatINR(stats.overallDieselExpense)}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Average Mileage</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-700 mt-1">{stats.overallMileage} km/L</div>
          <div className="text-xs text-slate-500 mt-1">Running KMs / Diesel Litres this month</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
            Total Received Balance
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 mt-1">{formatINR(totalReceivedBalance)}</div>
          <div className="text-xs text-slate-500 mt-1">All balance amounts received for this vehicle</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Service Maintenance</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-600 mt-1">{formatINR(stats.overallMaintenanceAmount)}</div>
          <div className="text-xs text-slate-500 mt-1">{stats.maintenanceRecordCount} service records this month</div>
        </div>

        <button
          type="button"
          onClick={() => setShowHaltingDetails(true)}
          className="w-full text-left bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition hover:border-violet-300 cursor-pointer"
          aria-label={`View halting details for vehicle ${vehicle.vehicle_number}`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wide flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-violet-600" />
              Total Halting Days
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-violet-700 mt-1">{totalHaltingDays} Days</div>
          <div className="text-xs text-slate-500 mt-1">Click to view loading + unloading halting details</div>
        </button>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
            <IndianRupee className="w-3.5 h-3.5 text-rose-600" />
            Total Halting Charges
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-rose-700 mt-1">{formatINR(totalHaltingCharges)}</div>
          <div className="text-xs text-slate-500 mt-1">Loading + Unloading halting this month</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-violet-500/80 bg-violet-50/20">
          <div className="text-xs font-bold text-violet-800 uppercase tracking-wide">Overall Profit</div>
          <div className={`text-2xl sm:text-3xl font-black font-mono mt-1 ${overallProfit >= 0 ? "text-violet-700" : "text-red-700"}`}>{formatINR(overallProfit)}</div>
          <div className="text-xs text-violet-700 font-semibold mt-1">Final Net Profit + Total Halting Charges</div>
        </div>
      </div>

      <HaltingDetailsModal
        isOpen={showHaltingDetails}
        onClose={() => setShowHaltingDetails(false)}
        driverName={`Vehicle ${vehicle.vehicle_number}`}
        trips={monthTrips}
      />
    </div>,
    portalTarget
  );
};

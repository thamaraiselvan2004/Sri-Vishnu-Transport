import React, { useMemo, useState } from "react";
import { IndianRupee, Wallet } from "lucide-react";
import { Trip, Vehicle } from "../types";
import { formatINR } from "../lib/calculations";

interface VehicleReceivedBalanceProps {
  vehicle: Vehicle;
  trips: Trip[];
}

export const VehicleReceivedBalance: React.FC<VehicleReceivedBalanceProps> = ({ vehicle, trips }) => {
  const [showAll, setShowAll] = useState(false);

  const receivedBalanceTrips = useMemo(
    () =>
      trips
        .filter(
          (trip) =>
            trip.vehicle_id === vehicle.id &&
            (Number(trip.balance_amount) || 0) > 0
        )
        .sort((a, b) =>
          String(b.trip_date || "").localeCompare(String(a.trip_date || ""))
        ),
    [trips, vehicle.id]
  );

  const totalReceivedBalance = useMemo(
    () =>
      receivedBalanceTrips.reduce(
        (sum, trip) => sum + (Number(trip.balance_amount) || 0),
        0
      ),
    [receivedBalanceTrips]
  );

  const visibleTrips = showAll
    ? receivedBalanceTrips
    : receivedBalanceTrips.slice(0, 3);

  const getHaltingDays = (trip: Trip) => {
    const hasSeparateHalting =
      trip.loading_halting_days !== undefined ||
      trip.unloading_halting_days !== undefined;

    return hasSeparateHalting
      ? (Number(trip.loading_halting_days) || 0) +
          (Number(trip.unloading_halting_days) || 0)
      : Number(trip.halting_days) || 0;
  };

  const formatDate = (value?: string) =>
    value
      ? new Date(`${value}T00:00:00`).toLocaleDateString("en-IN")
      : "—";

  return (
    <section
      id="vehicle-received-balance-all-time"
      className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div className="p-5 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-emerald-50 via-white to-blue-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              <Wallet className="w-4 h-4" />
              <span>Received Balance — All Time</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {vehicle.vehicle_number} — Received Balance
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              All trips with a balance amount greater than zero, across every month.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700">
              <IndianRupee className="w-3.5 h-3.5" />
              {formatINR(totalReceivedBalance)}
            </span>
            {receivedBalanceTrips.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAll((current) => !current)}
                className="shrink-0 px-3 py-2 rounded-xl border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 text-xs sm:text-sm font-bold transition-colors"
              >
                {showAll ? "Show Recent (3)" : `View All (${receivedBalanceTrips.length})`}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {receivedBalanceTrips.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl">
            No received balance records found for this vehicle.
          </div>
        ) : (
          <div className="space-y-3">
            {visibleTrips.map((trip, index) => (
              <div
                key={trip.id ?? `received-balance-${index}`}
                className="border border-slate-200 rounded-xl p-4 bg-slate-50/60"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <div className="text-[11px] text-slate-500">Transporter Name</div>
                    <div className="font-bold text-slate-800 mt-1">{trip.transporter_name || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Trip Date</div>
                    <div className="font-bold text-slate-800 mt-1">{formatDate(trip.trip_date)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">From → To</div>
                    <div className="font-bold text-slate-800 mt-1">{trip.from_city || "—"} → {trip.to_city || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Advance Received</div>
                    <div className="font-bold font-mono text-blue-700 mt-1">
                      {formatINR(Number(trip.advance_received) || 0)}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Date: {formatDate(trip.advance_received_date)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Balance Amount</div>
                    <div className="font-bold font-mono text-emerald-700 mt-1">
                      {formatINR(Number(trip.balance_amount) || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Halting Days</div>
                    <div className="font-bold text-amber-700 mt-1">
                      {getHaltingDays(trip)} {getHaltingDays(trip) === 1 ? "Day" : "Days"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

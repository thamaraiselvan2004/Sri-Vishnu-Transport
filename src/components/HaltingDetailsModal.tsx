import React from "react";
import { X, Clock, Truck } from "lucide-react";
import { Trip } from "../types";
import { formatINR, formatIndianDate } from "../lib/calculations";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  driverName: string;
  trips: Trip[];
}

export const HaltingDetailsModal: React.FC<Props> = ({ isOpen, onClose, driverName, trips }) => {
  if (!isOpen) return null;
  const haltingTrips = trips.filter((t) => {
    const split = (Number(t.loading_halting_days) || 0) + (Number(t.unloading_halting_days) || 0);
    return split > 0 || (Number(t.halting_days) || 0) > 0;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" onMouseDown={onClose}>
      <div className="w-full max-w-5xl max-h-[85vh] overflow-hidden rounded-3xl bg-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between bg-slate-900 px-6 py-5 text-white">
          <div>
            <div className="flex items-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-wider"><Clock className="w-4 h-4" /> Halting Details</div>
            <h2 className="text-lg font-bold mt-1">{driverName}</h2>
            <p className="text-xs text-slate-400">Trips where loading or unloading halting was recorded</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-800" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          {haltingTrips.length === 0 ? (
            <div className="py-12 text-center text-slate-500">No halting recorded for the selected period.</div>
          ) : (
            <div className="space-y-3">
              {haltingTrips.map((trip) => {
                const loadingDays = Number(trip.loading_halting_days) || 0;
                const unloadingDays = Number(trip.unloading_halting_days) || 0;
                const loadingFare = Number(trip.loading_halting_fare) || loadingDays * (Number(trip.loading_halting_charge_per_day) || 0);
                const unloadingFare = Number(trip.unloading_halting_fare) || unloadingDays * (Number(trip.unloading_halting_charge_per_day) || 0);
                const legacyDays = loadingDays + unloadingDays === 0 ? Number(trip.halting_days) || 0 : 0;
                const totalDays = loadingDays + unloadingDays + legacyDays;
                const totalFare = loadingFare + unloadingFare + (legacyDays > 0 ? Number(trip.halting_fare) || 0 : 0);
                return (
                  <div key={trip.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-1 rounded-lg bg-blue-100 text-blue-800">{trip.vehicle_number || "Vehicle"}</span>
                          <span className="text-sm font-bold text-slate-900">{formatIndianDate(trip.trip_date)}</span>
                          <span className="text-xs text-slate-500">{trip.from_city} → {trip.to_city}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1 text-xs text-slate-500"><Truck className="w-3.5 h-3.5" /> {trip.transporter_name}</div>
                      </div>
                      <div className="rounded-xl bg-purple-100 px-3 py-2 text-right">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-purple-700">Total Halting</div>
                        <div className="font-mono font-black text-purple-950">{totalDays} days · {formatINR(totalFare)}</div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="rounded-xl bg-white border border-purple-200 p-3"><div className="font-bold text-purple-900">Loading Halting</div><div className="mt-1 text-slate-600">{loadingDays} days · {formatINR(loadingFare)}</div></div>
                      <div className="rounded-xl bg-white border border-indigo-200 p-3"><div className="font-bold text-indigo-900">Unloading Halting</div><div className="mt-1 text-slate-600">{unloadingDays} days · {formatINR(unloadingFare)}</div></div>
                      {legacyDays > 0 && <div className="rounded-xl bg-white border border-slate-200 p-3"><div className="font-bold text-slate-700">Existing Halting</div><div className="mt-1 text-slate-600">{legacyDays} days · {formatINR(trip.halting_fare || 0)}</div></div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
